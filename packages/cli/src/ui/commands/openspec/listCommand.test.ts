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
import { type CommandContext } from '../types.js';

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
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;
  let changesDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-list-test-'));
    openspecDir = path.join(tempDir, 'openspec');
    changesDir = path.join(openspecDir, 'changes');
    
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
    // Arrange: Simulate that OpenSpec directory does not exist
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

  it('should return info message when no changes are found', async () => {
    // Arrange: Simulate that OpenSpec directory exists but changes dir is empty
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;
      return false;
    });
    vi.mocked(fs.readdirSync).mockReturnValue([]);

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check for the correct info message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'No active changes found.',
    });
  });

  it('should list active changes when they exist', async () => {
    // Arrange: Simulate that OpenSpec directory exists with changes
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changesDir) return true;
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
      if (p === changesDir) {
        return [
          { isDirectory: () => true, name: 'feature-a' },
          { isDirectory: () => true, name: 'feature-b' },
          { isDirectory: () => true, name: 'bug-fix' },
        ] as any;
      }
      return [];
    });

    // Act: Run the command's action
    const result = await listCommand.action!(mockContext, '');

    // Assert: Check for the correct list output
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('Active changes (3):'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('1. bug-fix');
    expect(content).toContain('2. feature-a');
    expect(content).toContain('3. feature-b');
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Simulate that checking for changes directory throws an error
    vi.mocked(fs.existsSync).mockImplementation(() => {
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