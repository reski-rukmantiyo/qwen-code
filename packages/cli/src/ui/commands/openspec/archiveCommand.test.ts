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
      content: 'Please specify a change name. Usage: /openspec archive <change-name> [--yes|-y] [--skip-specs] [--no-validate] [--validate]',
    });
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange: Simulate that the changes directory does not exist
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return false;
      return false;
    });

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, 'some-change');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: "No OpenSpec changes directory found. Run 'openspec init' first.",
    });
  });

  it('should return error when change does not exist', async () => {
    // Arrange: Simulate that the changes directory exists but the change directory does not
    const changeName = 'non-existent-change';
    const changeDir = path.join(changesDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;
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
    // Arrange: Simulate that the changes directory exists and the change is already archived
    const changeName = 'already-archived';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;          // Still in changes (but will be checked for archive)
      if (p === archivedChangeDir) return true;   // Already in archive
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    const _getArchiveDateSpy = vi.spyOn(await import('./archiveCommand.js'), 'getArchiveDate').mockReturnValue('2025-10-20');
    void _getArchiveDateSpy; // Explicitly ignore the spy to avoid TS6133 error

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: `Archive '2025-10-20-already-archived' already exists.`,
    });
  });

  it('should archive change successfully', async () => {
    // Arrange: Simulate that the change exists and is not archived
    const changeName = 'completed-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    vi.mock('./archiveCommand.js', async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getArchiveDate: vi.fn().mockReturnValue('2025-10-20')
      };
    });

    // Act: Run the command's action
    const result = await archiveCommand.action!(mockContext, changeName);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived as "2025-10-20-${changeName}".`,
    });
  });

  it('should create archive directory if it does not exist', async () => {
    // Arrange: Simulate that the change exists and archive directory does not
    const changeName = 'new-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return false;         // Archive directory doesn't exist
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    const _getArchiveDateSpy = vi.spyOn(await import('./archiveCommand.js'), 'getArchiveDate').mockReturnValue('2025-10-20');
    void _getArchiveDateSpy; // Explicitly ignore the spy to avoid TS6133 error

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
      content: `✅ Change "${changeName}" has been archived as "2025-10-20-${changeName}".`,
    });
  });

  it('should handle --yes flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'confirmed-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    const _getArchiveDateSpy = vi.spyOn(await import('./archiveCommand.js'), 'getArchiveDate').mockReturnValue('2025-10-20');
    void _getArchiveDateSpy; // Explicitly ignore the spy to avoid TS6133 error

    // Act: Run the command's action with --yes flag
    const result = await archiveCommand.action!(mockContext, `${changeName} --yes`);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived as "2025-10-20-${changeName}".`,
    });
  });

  it('should handle -y flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'short-flag-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    vi.mock('./archiveCommand.js', async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getArchiveDate: vi.fn().mockReturnValue('2025-10-20')
      };
    });

    // Act: Run the command's action with -y flag
    const result = await archiveCommand.action!(mockContext, `${changeName} -y`);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived as "2025-10-20-${changeName}".`,
    });
  });

  it('should handle --skip-specs flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'skip-specs-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    vi.mock('./archiveCommand.js', async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getArchiveDate: vi.fn().mockReturnValue('2025-10-20')
      };
    });

    // Act: Run the command's action with --skip-specs flag
    const result = await archiveCommand.action!(mockContext, `${changeName} --skip-specs`);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived as "2025-10-20-${changeName}".`,
    });
  });

  it('should handle --no-validate flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'no-validate-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    const _getArchiveDateSpy = vi.spyOn(await import('./archiveCommand.js'), 'getArchiveDate').mockReturnValue('2025-10-20');
    void _getArchiveDateSpy; // Explicitly ignore the spy to avoid TS6133 error

    // Act: Run the command's action with --no-validate flag
    const result = await archiveCommand.action!(mockContext, `${changeName} --no-validate`);

    // Assert: Check that it returns a confirmation dialog
    expect(result && 'type' in result && result.type).toBe('confirm_action');
    expect(result && 'prompt' in result && result.prompt).toEqual(expect.stringContaining('WARNING: Skipping validation may archive invalid specs. Continue?'));
  });

  it('should handle --no-validate flag with --yes flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'no-validate-with-yes-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    vi.mock('./archiveCommand.js', async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getArchiveDate: vi.fn().mockReturnValue('2025-10-20')
      };
    });

    // Act: Run the command's action with --no-validate and --yes flags
    const result = await archiveCommand.action!(mockContext, `${changeName} --no-validate --yes`);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived as "2025-10-20-${changeName}".`,
    });
  });

  it('should handle --validate flag correctly', async () => {
    // Arrange: Simulate that the change exists
    const changeName = 'validate-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });

    // Mock getArchiveDate to return a fixed date for testing
    vi.mock('./archiveCommand.js', async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getArchiveDate: vi.fn().mockReturnValue('2025-10-20')
      };
    });

    // Act: Run the command's action with --validate flag
    const result = await archiveCommand.action!(mockContext, `${changeName} --validate`);

    // Assert: Check that the rename operation was called
    expect(fs.renameSync).toHaveBeenCalledWith(changeDir, archivedChangeDir);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `✅ Change "${changeName}" has been archived as "2025-10-20-${changeName}".`,
    });
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Simulate that the changes directory exists and renaming throws an error
    const changeName = 'error-feature';
    const changeDir = path.join(changesDir, changeName);
    const archiveName = `2025-10-20-${changeName}`; // Using a fixed date for testing
    const archivedChangeDir = path.join(archiveDir, archiveName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;          // Changes directory exists
      if (p === changeDir) return true;           // Exists in changes
      if (p === archivedChangeDir) return false;  // Not in archive
      if (p === archiveDir) return true;          // Archive directory exists
      return false;
    });
    
    vi.mocked(fs.renameSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Mock getArchiveDate to return a fixed date for testing
    vi.mock('./archiveCommand.js', async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getArchiveDate: vi.fn().mockReturnValue('2025-10-20')
      };
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
    expect(suggestions).toEqual(['--yes', '-y', '--skip-specs', '--no-validate', '--validate']);
  });

  it('should handle completion errors gracefully', async () => {
    // Arrange: Simulate that reading changes directory throws an error
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) {
        throw new Error('Permission denied');
      }
      return false;
    });

    // Act: Run the completion function
    const suggestions = await archiveCommand.completion!(mockContext, 'test');

    // Assert: Check that no suggestions are returned
    expect(suggestions).toEqual([]);
  });
});