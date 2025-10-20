/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { listCommand } from './listCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const readdirSync = vi.fn();
  return {
    ...actual,
    existsSync,
    readdirSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      readdirSync,
    },
  } as unknown as typeof import('node:fs');
});

describe('listCommand', () => {
  let mockContext: any;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-list-test-'));
    
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
    expect(listCommand.name).toBe('list');
    expect(listCommand.description).toBe('List active changes');
    expect(listCommand.kind).toBe('built-in');
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange: Simulate that the changes directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
    });
  });

  it('should list changes excluding archive directory', async () => {
    // Arrange: Simulate that the changes directory exists with some changes including an archive directory
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'feature-auth' },
      { isDirectory: () => true, name: 'api-improvements' },
      { isDirectory: () => true, name: 'archive' }, // This should be excluded
      { isDirectory: () => true, name: 'bug-fixes' },
      { isDirectory: () => true, name: 'Archive' }, // This should also be excluded (case insensitive)
    ] as any);

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check that archive directories are excluded from the list
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('Active changes (3):'),
    });
    
    // Check that the archive directories are not in the content
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.not.stringContaining('archive'),
    });
    
    // Check that the other changes are listed
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('feature-auth'),
    });
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('api-improvements'),
    });
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('bug-fixes'),
    });
  });

  it('should handle case insensitive archive directory names', async () => {
    // Arrange: Simulate that the changes directory exists with various case archive directories
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'feature-auth' },
      { isDirectory: () => true, name: 'ARCHIVE' }, // Uppercase archive
      { isDirectory: () => true, name: 'Archive' }, // Title case archive
      { isDirectory: () => true, name: 'bug-fixes' },
      { isDirectory: () => true, name: 'archived-changes' }, // Should not be excluded
    ] as any);

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check that archive directories are excluded but archived-changes is not
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('Active changes (3):'),
    });
    
    // Check that the archive directories are not in the content
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.not.stringContaining('ARCHIVE'),
    });
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.not.stringContaining('Archive'),
    });
    
    // Check that archived-changes is still included
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('archived-changes'),
    });
  });

  it('should not exclude nested directories named archive', async () => {
    // Arrange: Simulate that the changes directory exists with nested archive directories
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'feature-auth' },
      { isDirectory: () => true, name: 'nested-change' },
      { isDirectory: () => true, name: 'bug-fixes' },
    ] as any);

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check that all directories are listed (none should be excluded)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('Active changes (3):'),
    });
    
    // Check that all changes are listed
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('feature-auth'),
    });
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('nested-change'),
    });
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('bug-fixes'),
    });
  });

  it('should handle edge cases with special characters', async () => {
    // Arrange: Simulate that the changes directory exists with special character names
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'feature-auth' },
      { isDirectory: () => true, name: 'archivé' }, // Special character, should not be excluded
      { isDirectory: () => true, name: 'archivë' }, // Different special character, should not be excluded
      { isDirectory: () => true, name: 'archive' }, // Regular archive, should be excluded
      { isDirectory: () => true, name: 'bug-fixes' },
    ] as any);

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check that only exact 'archive' match is excluded
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('Active changes (4):'),
    });
    
    // Check that regular archive is excluded
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.not.stringContaining('archive'),
    });
    
    // Check that special character names are still included
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('archivé'),
    });
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('archivë'),
    });
    
    // Check that other changes are still included
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('feature-auth'),
    });
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('bug-fixes'),
    });
  });

  it('should handle empty changes directory', async () => {
    // Arrange: Simulate that the changes directory exists but is empty
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([]);

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check for the correct message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'No active changes found.',
    });
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Simulate that reading the changes directory throws an error
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Failed to list changes: Permission denied'),
    });
  });
});