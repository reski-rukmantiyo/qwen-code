/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { submitCommand } from './submitCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const readFileSync = vi.fn();
  const readdirSync = vi.fn();
  const statSync = vi.fn();
  return {
    ...actual,
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    readdirSync,
    statSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      mkdirSync,
      writeFileSync,
      readFileSync,
      readdirSync,
      statSync,
    },
  } as unknown as typeof import('node:fs');
});

describe('submitCommand - Integration Tests for Question Activity', () => {
  let mockContext: any;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-submit-integration-test-'));
    
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

  it('should handle end-to-end question submission flow correctly', async () => {
    // Arrange: Set up OpenSpec directory structure
    // Mock file system operations
    vi.mocked(fs.existsSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('openspec')) return true;
        if (filePath.endsWith('changes')) return true;
        if (filePath.endsWith('submit-question')) return true;
        if (filePath.endsWith('proposal.md')) return true;
        if (filePath.endsWith('design.md')) return true;
      }
      return false;
    });
    
    vi.mocked(fs.statSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('submit-question')) {
        return { isDirectory: () => true } as fs.Stats;
      }
      return { isDirectory: () => false } as fs.Stats;
    });
    
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'submit-question' },
    ] as any);
    
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('proposal.md')) return '# Test Proposal';
        if (filePath.endsWith('design.md')) return '# Test Design';
      }
      return '';
    });
    
    // Mock the processQuestion function to simulate QA handler
    const mockProcessQuestion = vi.fn().mockResolvedValue({
      type: 'message',
      messageType: 'info',
      content: 'This is a test answer to the question.',
    });
    
    // Mock dynamic import of qaHandler
    vi.doMock('./qaHandler.js', () => ({
      processQuestion: mockProcessQuestion,
    }));
    
    // Reload the module to pick up the mock
    const { submitCommand } = await import('./submitCommand.js');
    
    // Act: Run the complete question submission flow
    const result = await submitCommand.action!(mockContext, 'submit-question question How does the QA handler work?');
    
    // Assert: Verify the end-to-end flow
    expect(mockProcessQuestion).toHaveBeenCalledWith(mockContext, 'How does the QA handler work?');
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'This is a test answer to the question.',
    });
  });

  it('should produce only informational responses without file modifications', async () => {
    // Arrange: Set up OpenSpec directory structure
    // Mock file system operations
    
    vi.mocked(fs.statSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('submit-question')) {
        return { isDirectory: () => true } as fs.Stats;
      }
      return { isDirectory: () => false } as fs.Stats;
    });
    
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('proposal.md')) return '# Test Proposal';
        if (filePath.endsWith('design.md')) return '# Test Design';
      }
      return '';
    });
    
    // Mock the processQuestion function to ensure no file modifications
    const mockProcessQuestion = vi.fn().mockImplementation(async (context, question) => {
      // Verify no file write operations were called
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      
      return {
        type: 'message',
        messageType: 'info',
        content: `Answer to: ${question}`,
      };
    });
    
    // Mock dynamic import of qaHandler
    vi.doMock('./qaHandler.js', () => ({
      processQuestion: mockProcessQuestion,
    }));
    
    // Reload the module to pick up the mock
    const { submitCommand } = await import('./submitCommand.js');
    
    // Act: Run the question submission
    const result = await submitCommand.action!(mockContext, 'submit-question question Test question for verification');
    
    // Assert: Verify no file modifications occurred
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(mockProcessQuestion).toHaveBeenCalledWith(mockContext, 'Test question for verification');
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'Answer to: Test question for verification',
    });
  });

  it('should handle question activity through interactive dialog flow', async () => {
    // Arrange: Set up OpenSpec directory structure
    vi.mocked(fs.existsSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('openspec')) return true;
        if (filePath.endsWith('changes')) return true;
        if (filePath.endsWith('submit-question')) return true;
      }
      return false;
    });
    
    vi.mocked(fs.statSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('submit-question')) {
        return { isDirectory: () => true } as fs.Stats;
      }
      return { isDirectory: () => false } as fs.Stats;
    });
    
    // Act: Run the command to trigger interactive flow (no description provided)
    const result = await submitCommand.action!(mockContext, 'submit-question question');
    
    // Assert: Verify we get the description input dialog
    expect(result).toEqual({
      type: 'dialog',
      dialog: 'openspec_submit_description_input',
      data: {
        changeName: 'submit-question',
        activity: 'question'
      }
    });
  });
});