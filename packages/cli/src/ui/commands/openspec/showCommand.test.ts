/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { showCommand } from './showCommand.js';
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

// Mock the OpenSpecFileUtils module
vi.mock('../../../services/OpenSpecFileUtils.js', () => ({
  readFileEfficiently: vi.fn().mockImplementation(async (filePath: string) => {
    if (filePath.includes('proposal.md')) return '# Test Proposal\n\nThis is a test proposal.';
    if (filePath.includes('tasks.md')) return '# Test Tasks\n\n- [ ] Task 1\n- [ ] Task 2';
    if (filePath.includes('design.md')) return '# Test Design\n\nTechnical design details.';
    return '# Test Content\n\nGeneric file content.';
  }),
  getFileStats: vi.fn().mockReturnValue({ sizeFormatted: '1KB' }),
}));

describe('showCommand', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;
  let changesDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-show-test-'));
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
    expect(showCommand.name).toBe('show');
    expect(showCommand.description).toBe('Show details of a specific change');
    expect(showCommand.kind).toBe('built-in');
  });

  it('should return error when no change name is provided', async () => {
    // Act: Run the command's action without arguments
    const result = await showCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a change name. Usage: /openspec show <change-name>',
    });
  });

  it('should return error when change does not exist', async () => {
    // Arrange: Simulate that the change directory does not exist
    const changeName = 'non-existent-change';
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act: Run the command's action
    const result = await showCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: `Change "${changeName}" not found. Run /openspec list to see available changes.`,
    });
  });

  it('should show change details when change exists', async () => {
    // Arrange: Simulate that the change directory exists
    const changeName = 'test-change';
    const changeDir = path.join(changesDir, changeName);
    const proposalPath = path.join(changeDir, 'proposal.md');
    const tasksPath = path.join(changeDir, 'tasks.md');
    const designPath = path.join(changeDir, 'design.md');
    const specsDir = path.join(changeDir, 'specs');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return true;
      if (p === proposalPath) return true;
      if (p === tasksPath) return true;
      if (p === designPath) return true;
      if (p === specsDir) return true;
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
      if (p === specsDir) {
        return [
          { isFile: () => true, name: 'api-changes.md' },
          { isFile: () => true, name: 'db-schema.md' },
        ] as any;
      }
      return [];
    });

    // Act: Run the command's action
    const result = await showCommand.action!(mockContext, changeName);

    // Assert: Check for the correct output
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`# Change: ${changeName}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('## Proposal (1KB)');
    expect(content).toContain('## Tasks (1KB)');
    expect(content).toContain('## Design (1KB)');
    expect(content).toContain('## Specification Deltas');
    expect(content).toContain('- api-changes.md (1KB)');
    expect(content).toContain('- db-schema.md (1KB)');
  });

  it('should handle missing files gracefully', async () => {
    // Arrange: Simulate that the change directory exists but some files are missing
    const changeName = 'partial-change';
    const changeDir = path.join(changesDir, changeName);
    const proposalPath = path.join(changeDir, 'proposal.md');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === changeDir) return true;
      if (p === proposalPath) return false; // Missing proposal file
      return false;
    });

    // Act: Run the command's action
    const result = await showCommand.action!(mockContext, changeName);

    // Assert: Check for the correct output with missing file message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`# Change: ${changeName}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('## Proposal');
    expect(content).toContain('No proposal.md file found.');
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Simulate that checking for change directory throws an error
    const changeName = 'error-change';
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action
    const result = await showCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining(`Failed to show change "${changeName}": Permission denied`),
    });
  });

  it('should provide completion suggestions', async () => {
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
    const suggestions = await showCommand.completion!(mockContext, 'auth');

    // Assert: Check for the correct suggestions
    expect(suggestions).toEqual(['auth-feature']);
  });

  it('should handle completion errors gracefully', async () => {
    // Arrange: Simulate that reading changes directory throws an error
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the completion function
    const suggestions = await showCommand.completion!(mockContext, 'test');

    // Assert: Check that no suggestions are returned
    expect(suggestions).toEqual([]);
  });
});