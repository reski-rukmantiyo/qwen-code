/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { processProposalDescription } from './proposalCommand.js';
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

describe('processProposalDescription - Bug Fix for Duplicate Messages and Content Not Changing', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-proposal-bugfix-test-'));
    openspecDir = path.join(tempDir, 'openspec');
    
    // Mock process.cwd() to return our temp directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
    
    // Mock UI addItem to track messages
    mockContext.ui.addItem = vi.fn();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  it('should generate content for all three files and show only one message', async () => {
    // Arrange: Mock file system operations
    const changeDir = path.join(openspecDir, 'changes', 'test-change');
    const proposalFile = path.join(changeDir, 'proposal.md');
    const tasksFile = path.join(changeDir, 'tasks.md');
    const designFile = path.join(changeDir, 'design.md');
    
    // Mock existsSync to return appropriate values
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      if (p === changeDir) return true;    // Change directory exists
      // After writing, files should exist
      if (p === proposalFile) return true;
      if (p === tasksFile) return true;
      if (p === designFile) return true;
      return false;  // Initially files don't exist
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
    
    // Track UI messages
    const uiMessages: any[] = [];
    mockContext.ui.addItem = vi.fn((item: any) => {
      uiMessages.push(item);
      return Date.now(); // Return a timestamp
    });
    
    // Act: Process the description
    const result = await processProposalDescription(
      mockContext,
      'test-change',
      'Add user authentication feature',
      fileStatus,
      false
    );
    
    // Assert: Check that only one progress message is shown
    expect(uiMessages.length).toBe(1);
    expect(uiMessages[0].text).toBe('Generating content for "test-change"... Please wait.');
    
    // Assert: Check that the result is correct
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect((result as any).content).toContain('✅ Processed change proposal for "test-change"');
    expect((result as any).content).toContain('proposal.md: ✅ created');
    expect((result as any).content).toContain('tasks.md: ✅ created');
    expect((result as any).content).toContain('design.md: ✅ created');
  });
  
  it('should ensure content is actually written to files', async () => {
    // Arrange: Mock file system operations
    const changeDir = path.join(openspecDir, 'changes', 'create-web-server');
    const proposalFile = path.join(changeDir, 'proposal.md');
    const tasksFile = path.join(changeDir, 'tasks.md');
    const designFile = path.join(changeDir, 'design.md');
    
    // Track written content
    const writtenContent: Record<string, string> = {};
    
    // Mock existsSync to return appropriate values
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      if (p === changeDir) return true;    // Change directory exists
      // After writing, files should exist
      if (p === proposalFile) return true;
      if (p === tasksFile) return true;
      if (p === designFile) return true;
      return false;  // Initially files don't exist
    });
    
    // Mock writeFileSync to capture written content
    vi.mocked(fs.writeFileSync).mockImplementation((p: any, content: any) => {
      writtenContent[p] = content;
      return undefined;
    });
    
    // Mock file status
    const fileStatus = {
      'proposal': { exists: true, content: '# Old Proposal\n\nOld content' },
      'tasks': { exists: true, content: '# Old Tasks\n\nOld tasks content' },
      'design': { exists: true, content: '# Old Design\n\nOld design content' },
    };
    
    // Act: Process the description
    const result = await processProposalDescription(
      mockContext,
      'create-web-server',
      'Create a web server',
      fileStatus,
      true
    );
    
    // Assert: Check that new content was written to all files
    expect(writtenContent[proposalFile]).toContain('# Create a web server');
    expect(writtenContent[proposalFile]).toContain('## Overview');
    expect(writtenContent[proposalFile]).toContain('## Motivation');
    expect(writtenContent[tasksFile]).toContain('# Implementation Tasks');
    expect(writtenContent[tasksFile]).toContain('- [ ]');
    expect(writtenContent[designFile]).toContain('# Technical Design for Create a web server');
    expect(writtenContent[designFile]).toContain('## Approach');
    expect(writtenContent[designFile]).toContain('## Architecture');
    
    // Assert: Check that the result indicates success
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect((result as any).content).toContain('✅ Processed change proposal for "create-web-server"');
    expect((result as any).content).toContain('proposal.md: ✅ created');
    expect((result as any).content).toContain('tasks.md: ✅ created');
    expect((result as any).content).toContain('design.md: ✅ created');
  });
});