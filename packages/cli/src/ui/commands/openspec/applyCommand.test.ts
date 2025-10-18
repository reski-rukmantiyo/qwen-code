/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyCommand } from './applyCommand.js';
import type { CommandContext, MessageActionReturn, SubmitPromptActionReturn } from '../types.js';
import * as fs from 'node:fs';

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

// Mock the OpenSpec file utilities
vi.mock('../../../services/OpenSpecFileUtils.js', () => ({
  readFileEfficiently: vi.fn(),
  getFileStats: vi.fn(),
}));

describe('applyCommand', () => {
  const mockContext: CommandContext = {
    services: {
      config: null,
      settings: {} as any,
      git: undefined,
      logger: {} as any,
    },
    ui: {
      addItem: vi.fn(),
      clear: vi.fn(),
      setDebugMessage: vi.fn(),
      pendingItem: null,
      setPendingItem: vi.fn(),
      loadHistory: vi.fn(),
      toggleCorgiMode: vi.fn(),
      toggleVimEnabled: vi.fn(),
      setGeminiMdFileCount: vi.fn(),
      reloadCommands: vi.fn(),
    },
    session: {
      stats: {} as any,
      sessionShellAllowlist: new Set(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct name and description', () => {
    expect(applyCommand.name).toBe('apply');
    expect(applyCommand.description).toBe('Apply a change by submitting tasks to AI for implementation');
    expect(applyCommand.kind).toBe('built-in');
  });

  it('should return error when no change name is provided', async () => {
    const result = await applyCommand.action!(mockContext, '') as MessageActionReturn;

    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a change name. Usage: /openspec apply <change-name>',
    });
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act
    const result = await applyCommand.action!(mockContext, 'test-change') as MessageActionReturn;

    // Assert
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Change "test-change" not found. Run /openspec list to see available changes.',
    });
  });

  it('should return error when tasks.md file does not exist', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (typeof path === 'string' && path.includes('test-change')) {
        if (path.endsWith('changes/test-change')) {
          return true;
        }
        if (path.endsWith('tasks.md')) {
          return false;
        }
      }
      return false;
    });

    // Act
    const result = await applyCommand.action!(mockContext, 'test-change') as MessageActionReturn;

    // Assert
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'No tasks.md file found for change "test-change". Please create tasks before applying.',
    });
  });

  it('should return error when tasks.md file is empty', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (typeof path === 'string' && path.includes('test-change')) {
        if (path.endsWith('changes/test-change')) {
          return true;
        }
        if (path.endsWith('tasks.md')) {
          return true;
        }
      }
      return false;
    });
    
    const { readFileEfficiently } = await import('../../../services/OpenSpecFileUtils.js');
    vi.mocked(readFileEfficiently).mockResolvedValue('');

    // Act
    const result = await applyCommand.action!(mockContext, 'test-change') as MessageActionReturn;

    // Assert
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Tasks file for change "test-change" is empty. Please add tasks before applying.',
    });
  });

  it('should submit prompt with tasks content when change and tasks exist', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (typeof path === 'string' && path.includes('test-change')) {
        if (path.endsWith('changes/test-change')) {
          return true;
        }
        if (path.endsWith('tasks.md')) {
          return true;
        }
      }
      return false;
    });
    
    const { readFileEfficiently } = await import('../../../services/OpenSpecFileUtils.js');
    vi.mocked(readFileEfficiently).mockResolvedValue('- [ ] Task 1\n- [ ] Task 2');

    // Act
    const result = await applyCommand.action!(mockContext, 'test-change') as SubmitPromptActionReturn;

    // Assert
    expect(result.type).toBe('submit_prompt');
    expect(result.content).toContain('# Applying OpenSpec Change: test-change');
    expect(result.content).toContain('- [ ] Task 1\n- [ ] Task 2');
    expect(result.content).toContain('Please implement the following tasks as specified in the OpenSpec change proposal');
  });

  it('should provide auto-completion for change names', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'change-1' },
      { isDirectory: () => true, name: 'change-2' },
      { isDirectory: () => false, name: 'file.txt' },
    ] as any);

    // Act
    const completions = await applyCommand.completion!(mockContext, 'ch');

    // Assert
    expect(completions).toEqual(['change-1', 'change-2']);
  });

  it('should handle errors during apply process', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error('Test error');
    });

    // Act
    const result = await applyCommand.action!(mockContext, 'test-change') as MessageActionReturn;

    // Assert
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('error');
    expect(result.content).toContain('Failed to apply change "test-change": Test error');
  });
});