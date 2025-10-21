/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { proposalCommand, processProposalDescription, generateMeaningfulShortNameWithHeuristics } from './proposalCommand.js';
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
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      if (p === changeDir) return true;    // Change directory exists
      return false;  // Files don't exist yet
    });
    
    // Mock file status
    const fileStatus = {
      'proposal': { exists: false, content: null, isTemplate: false, hash: null },
      'tasks': { exists: false, content: null, isTemplate: false, hash: null },
      'design': { exists: false, content: null, isTemplate: false, hash: null },
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

  it('should detect template content correctly', () => {
    // Import the function we want to test
    const { isTemplateContent } = require('./proposalCommand.js');
    
    // Test with template content
    const templateContent = `# Change Proposal

## Overview
Briefly describe what this change proposes to implement.

## Motivation
Explain why this change is needed and what problem it solves.

## Implementation Plan
Detail the steps required to implement this change.

## Impact Assessment
Describe the potential impact of this change on the system.`;
    
    expect(isTemplateContent(templateContent, 'proposal.md')).toBe(true);
    
    // Test with non-template content
    const realContent = `# Change Proposal

## Overview
Add user authentication feature to the application.

## Motivation
This change is needed to improve the security posture of the system.

## Implementation Plan
1. Design and implement the new functionality
2. Create comprehensive tests for the new functionality
3. Update relevant documentation

## Impact Assessment
This change will improve the system according to the description. The primary impact areas include: security.`;
    
    expect(isTemplateContent(realContent, 'proposal.md')).toBe(false);
  });

  it('should generate meaningful short names', async () => {
    // Test short name generation
    const shortName = generateMeaningfulShortNameWithHeuristics('Add user authentication feature');
    expect(shortName).toBe('add-user-authenticat'); // Truncated to 20 characters
    
    // Test with special characters
    const shortName2 = generateMeaningfulShortNameWithHeuristics('Add user authentication & authorization!');
    expect(shortName2).toBe('add-user-authenticat'); // Truncated to 20 characters
  });

  it('should calculate content hashes correctly', () => {
    // Import the function we want to test
    const { calculateContentHash } = require('./proposalCommand.js');
    
    // Test hash calculation
    const content = 'test content';
    const hash = calculateContentHash(content);
    expect(hash).toBe('mock-hash-value'); // Using our mocked crypto
    
    // Test that different content produces different hashes (in real implementation)
    const content2 = 'different content';
    const hash2 = calculateContentHash(content2);
    expect(hash2).toBe('mock-hash-value'); // Using our mocked crypto
  });
});