/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { bfsFileSearch } from './bfsFileSearch.js';
import {
  GEMINI_CONFIG_DIR,
  getAllGeminiMdFilenames,
} from '../tools/memoryTool.js';
import type { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { processImports } from './memoryImportProcessor.js';
import type { FileFilteringOptions } from '../config/config.js';
import { DEFAULT_MEMORY_FILE_FILTERING_OPTIONS } from '../config/config.js';

// Simple console logger, similar to the one previously in CLI's config.ts
// TODO: Integrate with a more robust server-side logger if available/appropriate.
const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (...args: any[]) =>
    console.debug('[DEBUG] [MemoryDiscovery]', ...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (...args: any[]) => console.warn('[WARN] [MemoryDiscovery]', ...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) =>
    console.error('[ERROR] [MemoryDiscovery]', ...args),
};

interface GeminiFileContent {
  filePath: string;
  content: string | null;
}

async function findProjectRoot(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  while (true) {
    const gitPath = path.join(currentDir, '.git');
    try {
      const stats = await fs.lstat(gitPath);
      if (stats.isDirectory()) {
        return currentDir;
      }
    } catch (error: unknown) {
      // Don't log ENOENT errors as they're expected when .git doesn't exist
      // Also don't log errors in test environments, which often have mocked fs
      const isENOENT =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'ENOENT';

      // Only log unexpected errors in non-test environments
      // process.env['NODE_ENV'] === 'test' or VITEST are common test indicators
      const isTestEnv =
        process.env['NODE_ENV'] === 'test' || process.env['VITEST'];

      if (!isENOENT && !isTestEnv) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const fsError = error as { code: string; message: string };
          logger.warn(
            `Error checking for .git directory at ${gitPath}: ${fsError.message}`,
          );
        } else {
          logger.warn(
            `Non-standard error checking for .git directory at ${gitPath}: ${String(error)}`,
          );
        }
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

async function getGeminiMdFilePathsInternal(
  currentWorkingDirectory: string,
  includeDirectoriesToReadGemini: readonly string[],
  userHomePath: string,
  debugMode: boolean,
  fileService: FileDiscoveryService,
  extensionContextFilePaths: string[] = [],
  fileFilteringOptions: FileFilteringOptions,
  maxDirs: number,
): Promise<string[]> {
  const dirs = new Set<string>([
    ...includeDirectoriesToReadGemini,
    currentWorkingDirectory,
  ]);

  // Process directories in parallel with concurrency limit to prevent EMFILE errors
  const CONCURRENT_LIMIT = 10;
  const dirsArray = Array.from(dirs);
  const pathsArrays: string[][] = [];

  for (let i = 0; i < dirsArray.length; i += CONCURRENT_LIMIT) {
    const batch = dirsArray.slice(i, i + CONCURRENT_LIMIT);
    const batchPromises = batch.map((dir) =>
      getGeminiMdFilePathsInternalForEachDir(
        dir,
        userHomePath,
        debugMode,
        fileService,
        extensionContextFilePaths,
        fileFilteringOptions,
        maxDirs,
      ),
    );

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        pathsArrays.push(result.value);
      } else {
        const error = result.reason;
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error discovering files in directory: ${message}`);
        // Continue processing other directories
      }
    }
  }

  const paths = pathsArrays.flat();
  return Array.from(new Set<string>(paths));
}

async function getGeminiMdFilePathsInternalForEachDir(
  dir: string,
  userHomePath: string,
  debugMode: boolean,
  fileService: FileDiscoveryService,
  extensionContextFilePaths: string[] = [],
  fileFilteringOptions: FileFilteringOptions,
  maxDirs: number,
): Promise<string[]> {
  const allPaths = new Set<string>();
  const geminiMdFilenames = getAllGeminiMdFilenames();

  for (const geminiMdFilename of geminiMdFilenames) {
    const resolvedHome = path.resolve(userHomePath);
    const globalMemoryPath = path.join(
      resolvedHome,
      GEMINI_CONFIG_DIR,
      geminiMdFilename,
    );

    // This part that finds the global file always runs.
    try {
      await fs.access(globalMemoryPath, fsSync.constants.R_OK);
      allPaths.add(globalMemoryPath);
      if (debugMode)
        logger.debug(
          `Found readable global ${geminiMdFilename}: ${globalMemoryPath}`,
        );
    } catch {
      // It's okay if it's not found.
    }

    // Handle the case where we're in the home directory (dir is empty string or home path)
    const resolvedDir = dir ? path.resolve(dir) : resolvedHome;
    const isHomeDirectory = resolvedDir === resolvedHome;

    if (isHomeDirectory) {
      // For home directory, only check for QWEN.md directly in the home directory
      const homeContextPath = path.join(resolvedHome, geminiMdFilename);
      try {
        await fs.access(homeContextPath, fsSync.constants.R_OK);
        if (homeContextPath !== globalMemoryPath) {
          allPaths.add(homeContextPath);
          if (debugMode)
            logger.debug(
              `Found readable home ${geminiMdFilename}: ${homeContextPath}`,
            );
        }
      } catch {
        // Not found, which is okay
      }
    } else if (dir) {
      // FIX: Only perform the workspace search (upward and downward scans)
      // if a valid currentWorkingDirectory is provided and it's not the home directory.
      const resolvedCwd = path.resolve(dir);
      if (debugMode)
        logger.debug(
          `Searching for ${geminiMdFilename} starting from CWD: ${resolvedCwd}`,
        );

      const projectRoot = await findProjectRoot(resolvedCwd);
      if (debugMode)
        logger.debug(`Determined project root: ${projectRoot ?? 'None'}`);

      const upwardPaths: string[] = [];
      let currentDir = resolvedCwd;
      const ultimateStopDir = projectRoot
        ? path.dirname(projectRoot)
        : path.dirname(resolvedHome);

      while (currentDir && currentDir !== path.dirname(currentDir)) {
        if (currentDir === path.join(resolvedHome, GEMINI_CONFIG_DIR)) {
          break;
        }

        const potentialPath = path.join(currentDir, geminiMdFilename);
        try {
          await fs.access(potentialPath, fsSync.constants.R_OK);
          if (potentialPath !== globalMemoryPath) {
            upwardPaths.unshift(potentialPath);
          }
        } catch {
          // Not found, continue.
        }

        if (currentDir === ultimateStopDir) {
          break;
        }

        currentDir = path.dirname(currentDir);
      }
      upwardPaths.forEach((p) => allPaths.add(p));

      const mergedOptions = {
        ...DEFAULT_MEMORY_FILE_FILTERING_OPTIONS,
        ...fileFilteringOptions,
      };

      const downwardPaths = await bfsFileSearch(resolvedCwd, {
        fileName: geminiMdFilename,
        maxDirs,
        debug: debugMode,
        fileService,
        fileFilteringOptions: mergedOptions,
      });
      downwardPaths.sort();
      for (const dPath of downwardPaths) {
        allPaths.add(dPath);
      }
    }
  }

  // Add extension context file paths.
  for (const extensionPath of extensionContextFilePaths) {
    allPaths.add(extensionPath);
  }

  const finalPaths = Array.from(allPaths);

  if (debugMode)
    logger.debug(
      `Final ordered ${getAllGeminiMdFilenames()} paths to read: ${JSON.stringify(
        finalPaths,
      )}`,
    );
  return finalPaths;
}

async function readGeminiMdFiles(
  filePaths: string[],
  debugMode: boolean,
  importFormat: 'flat' | 'tree' = 'tree',
): Promise<GeminiFileContent[]> {
  // Process files in parallel with concurrency limit to prevent EMFILE errors
  const CONCURRENT_LIMIT = 20; // Higher limit for file reads as they're typically faster
  const results: GeminiFileContent[] = [];

  for (let i = 0; i < filePaths.length; i += CONCURRENT_LIMIT) {
    const batch = filePaths.slice(i, i + CONCURRENT_LIMIT);
    const batchPromises = batch.map(
      async (filePath): Promise<GeminiFileContent> => {
        try {
          const content = await fs.readFile(filePath, 'utf-8');

          // Process imports in the content
          const processedResult = await processImports(
            content,
            path.dirname(filePath),
            debugMode,
            undefined,
            undefined,
            importFormat,
          );
          if (debugMode)
            logger.debug(
              `Successfully read and processed imports: ${filePath} (Length: ${processedResult.content.length})`,
            );

          return { filePath, content: processedResult.content };
        } catch (error: unknown) {
          const isTestEnv =
            process.env['NODE_ENV'] === 'test' || process.env['VITEST'];
          if (!isTestEnv) {
            const message =
              error instanceof Error ? error.message : String(error);
            logger.warn(
              `Warning: Could not read ${getAllGeminiMdFilenames()} file at ${filePath}. Error: ${message}`,
            );
          }
          if (debugMode) logger.debug(`Failed to read: ${filePath}`);
          return { filePath, content: null }; // Still include it with null content
        }
      },
    );

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // This case shouldn't happen since we catch all errors above,
        // but handle it for completeness
        const error = result.reason;
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Unexpected error processing file: ${message}`);
      }
    }
  }

  return results;
}

/**
 * Finds all markdown files in a directory recursively
 */
async function findAllMarkdownFiles(
  directory: string,
  maxDirs: number = 100,
  debugMode: boolean = false,
): Promise<string[]> {
  const foundFiles: string[] = [];
  const queue: string[] = [directory];
  const visited = new Set<string>();
  let scannedDirCount = 0;
  let queueHead = 0;

  while (queueHead < queue.length && scannedDirCount < maxDirs) {
    const currentDir = queue[queueHead];
    queueHead++;
    
    if (visited.has(currentDir)) {
      continue;
    }
    visited.add(currentDir);
    scannedDirCount++;

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common directories that we don't want to traverse
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            queue.push(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          foundFiles.push(fullPath);
        }
      }
    } catch (error) {
      if (debugMode) {
        logger.warn(`Could not read directory: ${currentDir}`, error);
      }
    }
  }
  
  return foundFiles;
}

/**
 * Discovers OpenSpec files and reads their content
 */
async function discoverAndReadOpenSpecFiles(
  currentWorkingDirectory: string,
  debugMode: boolean,
): Promise<GeminiFileContent[]> {
  const openspecDir = path.join(currentWorkingDirectory, 'openspec');
  
  // Check if OpenSpec is initialized
  if (!fsSync.existsSync(openspecDir)) {
    if (debugMode) {
      logger.debug(`OpenSpec directory not found at: ${openspecDir}`);
    }
    return [];
  }
  
  // Check if required directories exist
  const specsDir = path.join(openspecDir, 'specs');
  const changesDir = path.join(openspecDir, 'changes');
  
  if (!fsSync.existsSync(specsDir) || !fsSync.existsSync(changesDir)) {
    if (debugMode) {
      logger.debug(`OpenSpec required directories not found. Specs dir: ${fsSync.existsSync(specsDir)}, Changes dir: ${fsSync.existsSync(changesDir)}`);
    }
    return [];
  }
  
  if (debugMode) {
    logger.debug(`Found OpenSpec directories. Specs: ${specsDir}, Changes: ${changesDir}`);
  }
  
  const openSpecFiles: string[] = [];
  
  try {
    // Add specification files
    if (fsSync.existsSync(specsDir)) {
      const specFiles = await findAllMarkdownFiles(specsDir, 100, debugMode);
      openSpecFiles.push(...specFiles);
      if (debugMode) {
        logger.debug(`Found ${specFiles.length} spec files in ${specsDir}`);
      }
    }
    
    // Add change proposal files
    if (fsSync.existsSync(changesDir)) {
      const changeDirs = fsSync.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(changesDir, dirent.name));
        
      if (debugMode) {
        logger.debug(`Found ${changeDirs.length} change directories`);
      }
        
      for (const changeDir of changeDirs) {
        const proposalFile = path.join(changeDir, 'proposal.md');
        const tasksFile = path.join(changeDir, 'tasks.md');
        const designFile = path.join(changeDir, 'design.md');
        
        if (fsSync.existsSync(proposalFile)) {
          openSpecFiles.push(proposalFile);
          if (debugMode) {
            logger.debug(`Found proposal file: ${proposalFile}`);
          }
        }
        if (fsSync.existsSync(tasksFile)) {
          openSpecFiles.push(tasksFile);
          if (debugMode) {
            logger.debug(`Found tasks file: ${tasksFile}`);
          }
        }
        if (fsSync.existsSync(designFile)) {
          openSpecFiles.push(designFile);
          if (debugMode) {
            logger.debug(`Found design file: ${designFile}`);
          }
        }
        
        // Add spec delta files
        const changeSpecsDir = path.join(changeDir, 'specs');
        if (fsSync.existsSync(changeSpecsDir)) {
          const specDeltaFiles = await findAllMarkdownFiles(changeSpecsDir, 50, debugMode);
          openSpecFiles.push(...specDeltaFiles);
          if (debugMode) {
            logger.debug(`Found ${specDeltaFiles.length} spec delta files in ${changeSpecsDir}`);
          }
        }
      }
    }
    
    if (debugMode) {
      logger.debug(`Total OpenSpec files found: ${openSpecFiles.length}`);
    }
    
    // Read all OpenSpec files
    const results: GeminiFileContent[] = [];
    for (const filePath of openSpecFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        results.push({ filePath, content });
        if (debugMode) {
          logger.debug(`Successfully read OpenSpec file: ${filePath}`);
        }
      } catch (error) {
        if (debugMode) {
          logger.warn(`Failed to read OpenSpec file: ${filePath}`, error);
        }
      }
    }
    
    if (debugMode) {
      logger.debug(`Successfully read ${results.length} OpenSpec files`);
    }
    
    return results;
  } catch (error) {
    if (debugMode) {
      logger.warn('Error discovering OpenSpec files:', error);
    }
    return [];
  }
}

function concatenateInstructions(
  instructionContents: GeminiFileContent[],
  // CWD is needed to resolve relative paths for display markers
  currentWorkingDirectoryForDisplay: string,
): string {
  return instructionContents
    .filter((item) => typeof item.content === 'string')
    .map((item) => {
      const trimmedContent = (item.content as string).trim();
      if (trimmedContent.length === 0) {
        return null;
      }
      const displayPath = path.isAbsolute(item.filePath)
        ? path.relative(currentWorkingDirectoryForDisplay, item.filePath)
        : item.filePath;
      return `--- Context from: ${displayPath} ---\n${trimmedContent}\n--- End of Context from: ${displayPath} ---`;
    })
    .filter((block): block is string => block !== null)
    .join('\n\n');
}

/**
 * Loads hierarchical QWEN.md files and concatenates their content.
 * This function is intended for use by the server.
 */
export async function loadServerHierarchicalMemory(
  currentWorkingDirectory: string,
  includeDirectoriesToReadGemini: readonly string[],
  debugMode: boolean,
  fileService: FileDiscoveryService,
  extensionContextFilePaths: string[] = [],
  importFormat: 'flat' | 'tree' = 'tree',
  fileFilteringOptions?: FileFilteringOptions,
  maxDirs: number = 200,
): Promise<{ memoryContent: string; fileCount: number }> {
  if (debugMode)
    logger.debug(
      `Loading server hierarchical memory for CWD: ${currentWorkingDirectory} (importFormat: ${importFormat})`,
    );

  // For the server, homedir() refers to the server process's home.
  // This is consistent with how MemoryTool already finds the global path.
  const userHomePath = homedir();
  const filePaths = await getGeminiMdFilePathsInternal(
    currentWorkingDirectory,
    includeDirectoriesToReadGemini,
    userHomePath,
    debugMode,
    fileService,
    extensionContextFilePaths,
    fileFilteringOptions || DEFAULT_MEMORY_FILE_FILTERING_OPTIONS,
    maxDirs,
  );
  if (filePaths.length === 0) {
    if (debugMode) logger.debug('No QWEN.md files found in hierarchy.');
  }
  const contentsWithPaths = await readGeminiMdFiles(
    filePaths,
    debugMode,
    importFormat,
  );
  
  // Discover and read OpenSpec files
  const openSpecContents = await discoverAndReadOpenSpecFiles(
    currentWorkingDirectory,
    debugMode,
  );
  
  // Combine all content
  const allContents = [...contentsWithPaths, ...openSpecContents];
  
  // Pass CWD for relative path display in concatenated content
  const combinedInstructions = concatenateInstructions(
    allContents,
    currentWorkingDirectory,
  );
  if (debugMode)
    logger.debug(
      `Combined instructions length: ${combinedInstructions.length}`,
    );
  if (debugMode && combinedInstructions.length > 0)
    logger.debug(
      `Combined instructions (snippet): ${combinedInstructions.substring(0, 500)}...`,
    );
  return {
    memoryContent: combinedInstructions,
    fileCount: contentsWithPaths.length + openSpecContents.length,
  };
}
