/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { proposalCommand, processProposalDescription } from './proposalCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const readFileSync = vi.fn();
  const readdirSync = vi.fn();
  return {
    ...actual,
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    readdirSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      mkdirSync,
      writeFileSync,
      readFileSync,
      readdirSync,
    },
  } as unknown as typeof import('node:fs');
});

// Mock crypto for consistent hashing in tests
vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return {
    ...actual,
    createHash: vi.fn().mockImplementation((algorithm) => {
      return {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('mock-hash-value'),
      };
    }),
  };
});

describe('proposalCommand', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-proposal-test-'));
    openspecDir = path.join(tempDir, 'openspec');
    
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
    expect(proposalCommand.name).toBe('proposal');
    expect(proposalCommand.description).toBe('Interactively create and manage OpenSpec change proposals');
    expect(proposalCommand.kind).toBe('built-in');
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    // Act: Run the command's action
    const result = await proposalCommand.action!(mockContext, '');
    
    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
    });
  });

  it('should return info when no change directories exist', async () => {
    // Arrange: Simulate that OpenSpec directory exists but no changes
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    
    // Act: Run the command's action
    const result = await proposalCommand.action!(mockContext, '');
    
    // Assert: Check for the correct info message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'No change directories found. Create a change first with /openspec change <change-name>',
    });
  });

  it('should return dialog for directory selection when no args provided', async () => {
    // Arrange: Simulate that OpenSpec directory exists with changes
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'test-change', isDirectory: () => true },
      { name: 'another-change', isDirectory: () => true },
      { name: 'archive', isDirectory: () => true },
    ] as any);
    
    // Act: Run the command's action without arguments
    const result = await proposalCommand.action!(mockContext, '');
    
    // Assert: Check for the correct dialog result
    expect(result).toEqual({
      type: 'dialog',
      dialog: 'openspec_proposal_dir_selection',
      data: {
        directories: ['test-change', 'another-change'],
      },
    });
  });

  it('should return error for non-existent directory', async () => {
    // Arrange: Simulate that OpenSpec directory exists with changes
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'test-change', isDirectory: () => true },
    ] as any);
    
    // Act: Run the command's action with non-existent directory
    const result = await proposalCommand.action!(mockContext, 'non-existent');
    
    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Change directory "non-existent" not found. Available directories: test-change',
    });
  });
});

describe('processProposalDescription', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-proposal-process-test-'));
    openspecDir = path.join(tempDir, 'openspec');
    
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

  it('should process description and generate content for new files', async () => {
    // Arrange: Mock file system operations
    const changeDir = path.join(openspecDir, 'changes', 'test-change');
    const proposalFile = path.join(changeDir, 'proposal.md');
    const tasksFile = path.join(changeDir, 'tasks.md');
    const designFile = path.join(changeDir, 'design.md');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      if (p === changeDir) return true;    // Change directory exists
      if (p === proposalFile) return true; // After writing, files exist
      if (p === tasksFile) return true;
      if (p === designFile) return true;
      return false;  // Files don't exist yet initially
    });
    
    // Mock writeFileSync to simulate successful file creation
    vi.mocked(fs.writeFileSync).mockImplementation((p: any, content: any) => {
      // In a real scenario, this would write the file
      // For testing, we just need to ensure it doesn't throw
      return undefined;
    });
    
    // Mock file status
    const fileStatus = {
      'proposal': { exists: false, content: null },
      'tasks': { exists: false, content: null },
      'design': { exists: false, content: null },
    };
    
    // Act: Process the description
    const result = await processProposalDescription(
      mockContext,
      'test-change',
      'Add user authentication feature',
      fileStatus,
      false
    );
    
    // Assert: Check that the result is correct
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect((result as any).content).toContain('✅ Processed change proposal for "test-change"');
  });


});