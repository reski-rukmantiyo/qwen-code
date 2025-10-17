/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { archiveCommand } from './archiveCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const renameSync = vi.fn();
  const readdirSync = vi.fn();
  return {
    ...actual,
    existsSync,
    mkdirSync,
    renameSync,
    readdirSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      mkdirSync,
      renameSync,
      readdirSync,
    },
  } as unknown as typeof import('node:fs');
});

describe('archiveCommand', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;
  let changesDir: string;
  let archiveDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-archive-test-'));
    openspecDir = path.join(tempDir, 'openspec');
    changesDir = path.join(openspecDir, 'changes');
    archiveDir = path.join(openspecDir, 'archive');
    
    // Mock process.cwd() to return our temp directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  it('should have the correct name and description', () => {
    expect(archiveCommand.name).toBe('archive');
    expect(archiveCommand.description).toBe('Move completed changes to archive');
    expect(archiveCommand.kind).toBe('built-in');
  });

  it('should return error when no change name is provided', async () => {
    // Act: Run the command's action without arguments
    const result = await archiveCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a change name. Usage: /openspec archive <change-name> [--yes|-y]',
    });
  });

  it('should return error when change does not exist', async () => {
    // Arrange: Simulate that the change directory does not exist
    const changeName = 'non-existent-change';
    const changeDir = path.join(changesDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return false;
      return false;
    });

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: `Change "${changeName}" not found. Run /openspec list to see available changes.`,
    });
  });

  it('should return error when change is already archived', async () => {
    // Arrange: Simulate that the change is already archived
    const changeName = 'already-archived';
    const changeDir = path.join(changesDir, changeName);
    const archivedChangeDir = path.join(archiveDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return false;          // Not in changes
      if (p === archivedChangeDir) return true;   // But already in archive
      return false;
    });

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: `Change "${changeName}" not found. Run /openspec list to see available changes.`,
    });
  });

  it('should archive change successfully', async () => {
    // Arrange: Simulate that the change exists and is not archived
    const changeName = 'completed-feature';
    const changeDir = path.join(changesDir, changeName);
    const archivedChangeDir = path.join(archiveDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, changeName);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived successfully.`,
    });
  });

  it('should create archive directory if it does not exist', async () => {
    // Arrange: Simulate that the change exists and archive directory does not
    const changeName = 'new-feature';
    const changeDir = path.join(changesDir, changeName);
    const archivedChangeDir = path.join(archiveDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return false;         // Archive directory doesn't exist
      return false;
    });

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, changeName);

    // Assert: Check that archive directory was created
    expect(fs.mkdirSync).toHaveBeenCalledWith(archiveDir, { recursive: true });

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived successfully.`,
    });
  });

  it('should handle --yes flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'confirmed-feature';
    const changeDir = path.join(changesDir, changeName);
    const archivedChangeDir = path.join(archiveDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Act: Run the command's action with --yes flag
    const result = await archiveCommand.action!(mockContext, `${changeName} --yes`);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived successfully.`,
    });
  });

  it('should handle -y flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'short-flag-feature';
    const changeDir = path.join(changesDir, changeName);
    const archivedChangeDir = path.join(archiveDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Act: Run the command's action with -y flag
    const result = await archiveCommand.action!(mockContext, `${changeName} -y`);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived successfully.`,
    });
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Simulate that renaming throws an error
    const changeName = 'error-feature';
    const changeDir = path.join(changesDir, changeName);
    const archivedChangeDir = path.join(archiveDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });
    
    vi.mocked(fs.renameSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining(`Failed to archive change "${changeName}": Permission denied`),
    });
  });

  it('should provide completion suggestions for changes', async () => {
    // Arrange: Set up directory structure for completion
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
      if (p === changesDir) {
        return [
          { isDirectory: () => true, name: 'auth-feature' },
          { isDirectory: () => true, name: 'api-improvements' },
          { isDirectory: () => true, name: 'bug-fixes' },
        ] as any;
      }
      return [];
    });

    // Act: Run the completion function
    const suggestions = await archiveCommand.completion!(mockContext, 'auth');

    // Assert: Check for the correct suggestions
    expect(suggestions).toEqual(['auth-feature']);
  });

  it('should provide completion suggestions for flags', async () => {
    // Act: Run the completion function with dash prefix
    const suggestions = await archiveCommand.completion!(mockContext, '--');

    // Assert: Check for the correct suggestions
    expect(suggestions).toEqual(['--yes', '-y']);
  });

  it('should handle completion errors gracefully', async () => {
    // Arrange: Simulate that reading changes directory throws an error
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the completion function
    const suggestions = await archiveCommand.completion!(mockContext, 'test');

    // Assert: Check that no suggestions are returned
    expect(suggestions).toEqual([]);
  });
});