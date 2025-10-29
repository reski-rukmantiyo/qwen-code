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

describe('submitCommand - End-to-End Tests', () => {
  let mockContext: any;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-submit-e2e-test-'));
    
    // Create mock context
    mockContext = createMockCommandContext();
    
    // Set up default mock implementations
    vi.mocked(fs.existsSync).mockImplementation(() => false);
    vi.mocked(fs.statSync).mockImplementation(() => ({ isDirectory: () => false } as any));
    vi.mocked(fs.readdirSync).mockImplementation(() => []);
  });

  afterEach(() => {
    // Clean up the temporary directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Question Mode End-to-End Workflow', () => {
    it('should reject question-mode request with deprecation message', async () => {
      // Mock file system for OpenSpec directory
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('openspec')) {
          return true;
        }
        return false;
      });
      
      // Act: Run the command with question-mode syntax
      const result = await submitCommand.action!(mockContext, '"question: how does the file search work?"');
      
      // Assert: Check that we get an error message about deprecation
      expect(result).toEqual({
        type: 'message',
        messageType: 'error',
        content: 'The question feature has been deprecated. Please use other tools for asking questions about the codebase.',
      });
    });

    it('should handle complex question-mode request with deprecation message', async () => {
      // Mock file system for OpenSpec directory
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('openspec')) {
          return true;
        }
        return false;
      });
      
      // Act: Run the command with a more complex question
      const result = await submitCommand.action!(mockContext, '"question: How does the submit command work with change proposals and what are the different activity types supported?"');
      
      // Assert: Check that we get an error message about deprecation
      expect(result).toEqual({
        type: 'message',
        messageType: 'error',
        content: 'The question feature has been deprecated. Please use other tools for asking questions about the codebase.',
      });
    });

    it('should handle any question-mode request with deprecation message', async () => {
      // Mock file system for OpenSpec directory
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('openspec')) {
          return true;
        }
        return false;
      });
      
      // Act: Run the command with a question
      const result = await submitCommand.action!(mockContext, '"question: what is the meaning of life?"');
      
      // Assert: Check that we get an error message about deprecation
      expect(result).toEqual({
        type: 'message',
        messageType: 'error',
        content: 'The question feature has been deprecated. Please use other tools for asking questions about the codebase.',
      });
    });
  });
});