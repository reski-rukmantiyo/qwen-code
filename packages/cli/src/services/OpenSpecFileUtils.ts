/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { getOpenSpecCacheService } from '../ui/hooks/useOpenSpecWatcher.js';

/**
 * Configuration for file handling
 */
interface FileHandlingConfig {
  maxSizeMB: number;
  maxLines: number;
  chunkSizeKB: number;
}

const DEFAULT_CONFIG: FileHandlingConfig = {
  maxSizeMB: 10,
  maxLines: 1000,
  chunkSizeKB: 64
};

/**
 * Reads a file efficiently, with special handling for large files
 */
export async function readFileEfficiently(filePath: string, config: Partial<FileHandlingConfig> = {}): Promise<string> {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // Check file size first
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > effectiveConfig.maxSizeMB) {
      // For large files, we'll read only a portion
      return readLargeFilePreview(filePath, effectiveConfig);
    }
    
    // For regular files, use cache if available
    const cacheService = getOpenSpecCacheService();
    if (cacheService) {
      return cacheService.getFileContent(filePath);
    }
    
    // Fallback to direct read
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Reads a preview of a large file (first and last parts)
 */
async function readLargeFilePreview(filePath: string, config: FileHandlingConfig): Promise<string> {
  const maxBytes = config.maxSizeMB * 1024 * 1024;
  const chunkSize = Math.min(config.chunkSizeKB * 1024, maxBytes / 2);
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let content = '';
    let lineCount = 0;
    
    rl.on('line', (line) => {
      lineCount++;
      if (lineCount <= config.maxLines) {
        content += line + '\n';
        // Stop if we've reached our size limit
        if (content.length > chunkSize) {
          rl.close();
          fileStream.destroy();
        }
      } else {
        rl.close();
        fileStream.destroy();
      }
    });
    
    rl.on('close', () => {
      if (lineCount > config.maxLines) {
        content += `\n... (file truncated, showing first ${config.maxLines} lines of ${lineCount} total lines)\n`;
        content += `... (file size: ${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB)\n`;
      }
      resolve(content);
    });
    
    rl.on('error', (error) => {
      reject(new Error(`Failed to read large file ${filePath}: ${error.message}`));
    });
    
    fileStream.on('error', (error) => {
      reject(new Error(`Failed to open file ${filePath}: ${error.message}`));
    });
  });
}

/**
 * Reads a file in chunks for processing large files
 */
export async function* readFileChunks(filePath: string, chunkSizeKB: number = 64): AsyncGenerator<string, void, unknown> {
  const chunkSize = chunkSizeKB * 1024;
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let buffer = '';
  
  for await (const line of rl) {
    buffer += line + '\n';
    if (buffer.length >= chunkSize) {
      yield buffer;
      buffer = '';
    }
  }
  
  if (buffer) {
    yield buffer;
  }
}

/**
 * Efficiently searches for a pattern in a large file
 */
export async function searchInFile(filePath: string, pattern: RegExp, maxMatches: number = 10): Promise<Array<{line: number, content: string}>> {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const matches: Array<{line: number, content: string}> = [];
  let lineNumber = 0;
  
  for await (const line of rl) {
    lineNumber++;
    if (pattern.test(line)) {
      matches.push({ line: lineNumber, content: line.trim() });
      if (matches.length >= maxMatches) {
        break;
      }
    }
  }
  
  return matches;
}

/**
 * Gets file statistics efficiently
 */
export function getFileStats(filePath: string): { 
  size: number; 
  sizeFormatted: string; 
  created: Date; 
  modified: Date;
  isLarge: boolean;
  lineCount?: number;
} {
  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);
  
  return {
    size: stats.size,
    sizeFormatted: sizeMB > 1 ? `${sizeMB.toFixed(2)} MB` : `${(stats.size / 1024).toFixed(2)} KB`,
    created: stats.birthtime,
    modified: stats.mtime,
    isLarge: sizeMB > DEFAULT_CONFIG.maxSizeMB
  };
}