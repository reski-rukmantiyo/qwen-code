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

describe('submitCommand - Question Format Tests', () => {
  let mockContext: any;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-submit-format-test-'));
    
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

  // Test various question formats
  it.each([
    ['What is the purpose of the QA handler?', 'What is the purpose of the QA handler?'],
    ['How does file search work in this project?', 'How does file search work in this project?'],
    ['Can you explain the submit command flow?', 'Can you explain the submit command flow?'],
    ['Why is the question feature deprecated?', 'Why is the question feature deprecated?'],
    ['How do I use OpenSpec with Qwen Code?', 'How do I use OpenSpec with Qwen Code?'],
  ])('should handle question format: %s', async (question, expected) => {
    // Arrange
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
    
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('proposal.md')) return '# Test Proposal';
        if (filePath.endsWith('design.md')) return '# Test Design';
      }
      return '';
    });
    
    // Mock the processQuestion function
    const mockProcessQuestion = vi.fn().mockResolvedValue({
      type: 'message',
      messageType: 'info',
      content: `Answer to: ${expected}`,
    });
    
    // Mock dynamic import of qaHandler
    vi.doMock('./qaHandler.js', () => ({
      processQuestion: mockProcessQuestion,
    }));
    
    // Reload the module to pick up the mock
    const { submitCommand } = await import('./submitCommand.js');
    
    // Act
    const result = await submitCommand.action!(mockContext, `submit-question question ${question}`);
    
    // Assert
    expect(mockProcessQuestion).toHaveBeenCalledWith(mockContext, expected);
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: `Answer to: ${expected}`,
    });
  });

  // Test edge cases
  it('should handle question with special characters', async () => {
    // Arrange
    const questionWithSpecialChars = 'How does the @decorator work in TypeScript files?';
    
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
    
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('proposal.md')) return '# Test Proposal';
        if (filePath.endsWith('design.md')) return '# Test Design';
      }
      return '';
    });
    
    // Mock the processQuestion function
    const mockProcessQuestion = vi.fn().mockResolvedValue({
      type: 'message',
      messageType: 'info',
      content: 'Answer with special characters handled correctly.',
    });
    
    // Mock dynamic import of qaHandler
    vi.doMock('./qaHandler.js', () => ({
      processQuestion: mockProcessQuestion,
    }));
    
    // Reload the module to pick up the mock
    const { submitCommand } = await import('./submitCommand.js');
    
    // Act
    const result = await submitCommand.action!(mockContext, `submit-question question ${questionWithSpecialChars}`);
    
    // Assert
    expect(mockProcessQuestion).toHaveBeenCalledWith(mockContext, questionWithSpecialChars);
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'Answer with special characters handled correctly.',
    });
  });

  it('should handle question with numbers and code references', async () => {
    // Arrange
    const questionWithNumbers = 'What is the significance of error code 404 in the HTTP service?';
    
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
    
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('proposal.md')) return '# Test Proposal';
        if (filePath.endsWith('design.md')) return '# Test Design';
      }
      return '';
    });
    
    // Mock the processQuestion function
    const mockProcessQuestion = vi.fn().mockResolvedValue({
      type: 'message',
      messageType: 'info',
      content: 'Answer with numbers and code references handled correctly.',
    });
    
    // Mock dynamic import of qaHandler
    vi.doMock('./qaHandler.js', () => ({
      processQuestion: mockProcessQuestion,
    }));
    
    // Reload the module to pick up the mock
    const { submitCommand } = await import('./submitCommand.js');
    
    // Act
    const result = await submitCommand.action!(mockContext, `submit-question question ${questionWithNumbers}`);
    
    // Assert
    expect(mockProcessQuestion).toHaveBeenCalledWith(mockContext, questionWithNumbers);
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'Answer with numbers and code references handled correctly.',
    });
  });

  it('should handle long question with multiple sentences', async () => {
    // Arrange
    const longQuestion = 'I have a complex question about how the file search mechanism works in this project. ' +
      'Specifically, I want to understand how it filters out binary files and what algorithms are used ' +
      'to determine relevance of files based on keywords. Can you explain this in detail?';
    
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
    
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('proposal.md')) return '# Test Proposal';
        if (filePath.endsWith('design.md')) return '# Test Design';
      }
      return '';
    });
    
    // Mock the processQuestion function
    const mockProcessQuestion = vi.fn().mockResolvedValue({
      type: 'message',
      messageType: 'info',
      content: 'Detailed answer to the long question.',
    });
    
    // Mock dynamic import of qaHandler
    vi.doMock('./qaHandler.js', () => ({
      processQuestion: mockProcessQuestion,
    }));
    
    // Reload the module to pick up the mock
    const { submitCommand } = await import('./submitCommand.js');
    
    // Act
    const result = await submitCommand.action!(mockContext, `submit-question question ${longQuestion}`);
    
    // Assert
    expect(mockProcessQuestion).toHaveBeenCalledWith(mockContext, longQuestion);
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'Detailed answer to the long question.',
    });
  });

  it('should handle question with quotes and punctuation', async () => {
    // Arrange
    const questionWithQuotes = 'What does the "processQuestion" function do, and how is it different from "processSubmission"?';
    
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
    
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string') {
        if (filePath.endsWith('proposal.md')) return '# Test Proposal';
        if (filePath.endsWith('design.md')) return '# Test Design';
      }
      return '';
    });
    
    // Mock the processQuestion function
    const mockProcessQuestion = vi.fn().mockResolvedValue({
      type: 'message',
      messageType: 'info',
      content: 'Answer to question with quotes and punctuation.',
    });
    
    // Mock dynamic import of qaHandler
    vi.doMock('./qaHandler.js', () => ({
      processQuestion: mockProcessQuestion,
    }));
    
    // Reload the module to pick up the mock
    const { submitCommand } = await import('./submitCommand.js');
    
    // Act
    const result = await submitCommand.action!(mockContext, `submit-question question ${questionWithQuotes}`);
    
    // Assert
    expect(mockProcessQuestion).toHaveBeenCalledWith(mockContext, questionWithQuotes);
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'Answer to question with quotes and punctuation.',
    });
  });

  it('should reject deprecated direct question syntax', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('openspec')) {
        return true;
      }
      return false;
    });
    
    // Act
    const result = await submitCommand.action!(mockContext, '"question: how does this work?"');
    
    // Assert
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'The question feature has been deprecated. Please use other tools for asking questions about the codebase.',
    });
  });
});