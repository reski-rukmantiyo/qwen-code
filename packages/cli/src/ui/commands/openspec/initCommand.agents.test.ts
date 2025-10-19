/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { initCommand } from './initCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';
import { ROOT_AGENTS_MD_TEMPLATE, OPENSPEC_AGENTS_MD_TEMPLATE } from '../../../templates/agentsMdTemplates.js';

// Debug logging for template values
console.log('ROOT_AGENTS_MD_TEMPLATE starts with:', ROOT_AGENTS_MD_TEMPLATE.substring(0, 50));
console.log('OPENSPEC_AGENTS_MD_TEMPLATE starts with:', OPENSPEC_AGENTS_MD_TEMPLATE.substring(0, 50));

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  return {
    ...actual as any,
    existsSync,
    mkdirSync,
    writeFileSync,
    default: {
      ...(actual as any),
      existsSync,
      mkdirSync,
      writeFileSync,
    },
  };
});

// Mock the useOpenSpecWatcher hook
vi.mock('../../hooks/useOpenSpecWatcher.js', () => ({
  getOpenSpecCacheService: vi.fn().mockReturnValue({
    clearCache: vi.fn(),
  }),
}));

describe('initCommand - AGENTS.md functionality', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let createdDirs: Set<string>;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-init-test-'));
    
    // Mock process.cwd() to return our temp directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
    
    // Mock process.version to return a compatible version by default
    vi.spyOn(process, 'version', 'get').mockReturnValue('v20.19.0');
    
    // Initialize the createdDirs set for tracking directory creation
    createdDirs = new Set<string>();
    
    // Reset fs mocks
    vi.mocked(fs.mkdirSync).mockImplementation((p) => {
      createdDirs.add(p as string);
      return undefined;
    });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  it('should create root AGENTS.md with correct template content', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist but parent directories do
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      // For the openspec directory and its subdirectories, return true if they've been created
      if (p === openspecDir || p === specsDir || p === changesDir || p === archiveDir) {
        return createdDirs.has(p as string);
      }
      // Return true for parent directories (including our temp dir)
      return true;
    });

    // Act: Run the command's action
    if (initCommand.action) {
      await initCommand.action(mockContext, '');
    }

    // Assert: Check that root AGENTS.md was created with correct content
    const rootAgentsPath = path.join(tempDir, 'AGENTS.md');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      rootAgentsPath,
      ROOT_AGENTS_MD_TEMPLATE
    );
  });

  it('should create openspec/AGENTS.md with correct template content', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist but parent directories do
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      // For the openspec directory and its subdirectories, return true if they've been created
      if (p === openspecDir || p === specsDir || p === changesDir || p === archiveDir) {
        return createdDirs.has(p as string);
      }
      // Return true for parent directories (including our temp dir)
      return true;
    });
    
    // Mock mkdirSync to ensure it works
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);

    // Act: Run the command's action
    if (initCommand.action) {
      await initCommand.action(mockContext, '');
    }

    // Assert: Check that openspec/AGENTS.md was created with correct content
    const openSpecAgentsPath = path.join(openspecDir, 'AGENTS.md');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      openSpecAgentsPath,
      OPENSPEC_AGENTS_MD_TEMPLATE
    );
  });

  it('should create both AGENTS.md files with correct paths', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist but parent directories do
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      // For the openspec directory and its subdirectories, return true if they've been created
      if (p === openspecDir || p === specsDir || p === changesDir || p === archiveDir) {
        return createdDirs.has(p as string);
      }
      // Return true for parent directories (including our temp dir)
      return true;
    });
    
    // Mock mkdirSync to ensure it works
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);

    // Act: Run the command's action
    if (initCommand.action) {
      await initCommand.action(mockContext, '');
    }

    // Assert: Check that both AGENTS.md files were created
    const rootAgentsPath = path.join(tempDir, 'AGENTS.md');
    const openSpecAgentsPath = path.join(tempDir, 'openspec', 'AGENTS.md');
    
    const writeFileSyncCalls = vi.mocked(fs.writeFileSync).mock.calls;
    const writtenPaths = writeFileSyncCalls.map(call => call[0]);
    
    expect(writtenPaths).toContain(rootAgentsPath);
    expect(writtenPaths).toContain(openSpecAgentsPath);
  });

  it('should handle write errors gracefully', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist but parent directories do
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      // For the openspec directory and its subdirectories, return true if they've been created
      if (p === openspecDir || p === specsDir || p === changesDir || p === archiveDir) {
        return createdDirs.has(p as string);
      }
      // Return true for parent directories (including our temp dir)
      return true;
    });
    
    // Mock writeFileSync to throw an error
    vi.mocked(fs.writeFileSync).mockImplementation(() => {
      throw new Error('Disk error');
    });

    // Act: Run the command's action
    let result;
    if (initCommand.action) {
      result = await initCommand.action(mockContext, '');
    }

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Failed to create AGENTS.md files: Disk error'),
    });
  });

  it('should create AGENTS.md files even when description is provided', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist but parent directories do
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      // For the openspec directory and its subdirectories, return true if they've been created
      if (p === openspecDir || p === specsDir || p === changesDir || p === archiveDir) {
        return createdDirs.has(p as string);
      }
      // Return true for parent directories (including our temp dir)
      return true;
    });
    
    // Mock mkdirSync to ensure it works
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);

    // Act: Run the command's action with a description
    const description = 'Create a web server API';
    if (initCommand.action) {
      await initCommand.action(mockContext, `"${description}"`);
    }

    // Assert: Check that both AGENTS.md files were still created
    const rootAgentsPath = path.join(tempDir, 'AGENTS.md');
    const openSpecAgentsPath = path.join(tempDir, 'openspec', 'AGENTS.md');
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      rootAgentsPath,
      ROOT_AGENTS_MD_TEMPLATE
    );
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      openSpecAgentsPath,
      OPENSPEC_AGENTS_MD_TEMPLATE
    );
  });
});