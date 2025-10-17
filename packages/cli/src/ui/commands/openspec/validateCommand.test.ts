/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { validateCommand } from './validateCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const readdirSync = vi.fn();
  return {
    ...actual,
    existsSync,
    readFileSync,
    readdirSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      readFileSync,
      readdirSync,
    },
  } as unknown as typeof import('node:fs');
});

describe('validateCommand', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;
  let changesDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-validate-test-'));
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
    expect(validateCommand.name).toBe('validate');
    expect(validateCommand.description).toBe('Validate specification formatting');
    expect(validateCommand.kind).toBe('built-in');
  });

  it('should return error when no change name or --all flag is provided', async () => {
    // Act: Run the command's action without arguments
    const result = await validateCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a change name or use --all flag. Usage: /openspec validate <change-name> or /openspec validate --all',
    });
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act: Run the command's action
    const result = await validateCommand.action!(mockContext, 'test-change');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
    });
  });

  it('should return error when validating all changes but changes directory not found', async () => {
    // Arrange: Simulate that OpenSpec directory exists but changes directory does not
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === changesDir) return false;
      return false;
    });

    // Act: Run the command's action with --all flag
    const result = await validateCommand.action!(mockContext, '--all');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Changes directory not found.',
    });
  });

  it('should show message when validating all changes but no changes found', async () => {
    // Arrange: Simulate that OpenSpec and changes directory exist but no changes
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === changesDir) return true;
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockReturnValue([]);

    // Act: Run the command's action with --all flag
    const result = await validateCommand.action!(mockContext, '--all');

    // Assert: Check for the correct info message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('# Validating all changes'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('No changes found to validate.');
  });

  it('should validate specific change that does not exist', async () => {
    // Arrange: Simulate that OpenSpec directory exists but change does not
    const changeName = 'non-existent-change';
    const changeDir = path.join(changesDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === changeDir) return false;
      return false;
    });

    // Act: Run the command's action
    const result = await validateCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining(`# Validating change: ${changeName}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain(`❌ Error: Change "${changeName}" not found.`);
  });

  it('should validate specific change with missing required files', async () => {
    // Arrange: Simulate that OpenSpec and change directory exist but missing files
    const changeName = 'incomplete-change';
    const changeDir = path.join(changesDir, changeName);
    const proposalPath = path.join(changeDir, 'proposal.md');
    const tasksPath = path.join(changeDir, 'tasks.md');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === changeDir) return true;
      if (p === proposalPath) return false;  // Missing proposal
      if (p === tasksPath) return false;     // Missing tasks
      return false;
    });

    // Act: Run the command's action
    const result = await validateCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining(`# Validating change: ${changeName}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('❌ Error: Required file "proposal.md" not found.');
    expect(content).toContain('❌ Error: Required file "tasks.md" not found.');
  });

  it('should validate specific change with empty files', async () => {
    // Arrange: Simulate that OpenSpec and change directory exist with empty files
    const changeName = 'empty-change';
    const changeDir = path.join(changesDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === changeDir) return true;
      return true;  // All files exist
    });
    
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      if (typeof p === 'string' && p.includes('proposal.md')) return '   \n  ';  // Empty with whitespace
      if (typeof p === 'string' && p.includes('tasks.md')) return '';           // Completely empty
      return '';
    });

    // Act: Run the command's action
    const result = await validateCommand.action!(mockContext, changeName);

    // Assert: Check for warning messages
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',  // Warnings don't make it an error
      content: expect.stringContaining(`# Validating change: ${changeName}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('⚠️ Warning: File "proposal.md" is empty.');
    expect(content).toContain('⚠️ Warning: File "tasks.md" is empty.');
  });

  it('should validate specific change successfully', async () => {
    // Arrange: Simulate that OpenSpec and change directory exist with valid files
    const changeName = 'valid-change';
    const changeDir = path.join(changesDir, changeName);
    const proposalPath = path.join(changeDir, 'proposal.md');
    const tasksPath = path.join(changeDir, 'tasks.md');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === changeDir) return true;
      if (p === proposalPath) return true;
      if (p === tasksPath) return true;
      return false;
    });
    
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      if (typeof p === 'string' && p.includes('proposal.md')) return '# Valid Proposal\n\nContent here.';
      if (typeof p === 'string' && p.includes('tasks.md')) return '# Tasks\n\n- [ ] Task 1';
      return '';
    });

    // Act: Run the command's action
    const result = await validateCommand.action!(mockContext, changeName);

    // Assert: Check for success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`# Validating change: ${changeName}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('✅ No issues found.');
  });

  it('should validate all changes successfully', async () => {
    // Arrange: Simulate that OpenSpec and changes directory exist with multiple changes
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === changesDir) return true;
      return true;  // All directories exist
    });
    
    vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
      if (p === changesDir) {
        return [
          { isDirectory: () => true, name: 'change-1' },
          { isDirectory: () => true, name: 'change-2' },
        ] as any;
      }
      return [];
    });
    
    // Mock the internal validation function by mocking fs operations for each change
    vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
      if (typeof p === 'string' && p.includes('proposal.md')) return '# Valid Proposal\n\nContent.';
      if (typeof p === 'string' && p.includes('tasks.md')) return '# Tasks\n\n- [ ] Task';
      return '';
    });

    // Act: Run the command's action with --all flag
    const result = await validateCommand.action!(mockContext, '--all');

    // Assert: Check for the correct output
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('# Validating all changes'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('## change-1');
    expect(content).toContain('## change-2');
    expect(content).toContain('✅ No issues found.');
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Simulate that checking for OpenSpec directory throws an error
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action
    const result = await validateCommand.action!(mockContext, 'test-change');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Failed to validate: Permission denied'),
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
    const suggestions = await validateCommand.completion!(mockContext, 'auth');

    // Assert: Check for the correct suggestions
    expect(suggestions).toEqual(['auth-feature']);
  });

  it('should provide completion suggestion for --all flag', async () => {
    // Act: Run the completion function with dash prefix
    const suggestions = await validateCommand.completion!(mockContext, '--');

    // Assert: Check for the correct suggestions
    expect(suggestions).toEqual(['--all']);
  });

  it('should handle completion errors gracefully', async () => {
    // Arrange: Simulate that reading changes directory throws an error
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the completion function
    const suggestions = await validateCommand.completion!(mockContext, 'test');

    // Assert: Check that no suggestions are returned
    expect(suggestions).toEqual([]);
  });
});