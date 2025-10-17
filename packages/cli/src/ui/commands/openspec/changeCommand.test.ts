/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { changeCommand } from './changeCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  return {
    ...actual,
    existsSync,
    mkdirSync,
    writeFileSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      mkdirSync,
      writeFileSync,
    },
  } as unknown as typeof import('node:fs');
});

describe('changeCommand', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;
  let changesDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-change-test-'));
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
    expect(changeCommand.name).toBe('change');
    expect(changeCommand.description).toBe('Create or modify change proposals');
    expect(changeCommand.kind).toBe('built-in');
  });

  it('should return error when no change name is provided', async () => {
    // Act: Run the command's action without arguments
    const result = await changeCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a change name. Usage: /openspec change <change-name>',
    });
  });

  it('should return error for invalid change name', async () => {
    // Act: Run the command's action with invalid name
    const result = await changeCommand.action!(mockContext, 'invalid name with spaces');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Change name can only contain letters, numbers, hyphens, and underscores.',
    });
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist
    const changeName = 'new-feature';
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act: Run the command's action
    const result = await changeCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
    });
  });

  it('should create new change proposal when it does not exist', async () => {
    // Arrange: Simulate that OpenSpec is initialized but change does not exist
    const changeName = 'new-feature';
    const changeDir = path.join(changesDir, changeName);
    const proposalPath = path.join(changeDir, 'proposal.md');
    const tasksPath = path.join(changeDir, 'tasks.md');
    const designPath = path.join(changeDir, 'design.md');
    const specsDir = path.join(changeDir, 'specs');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      if (p === changeDir) return false;   // Change does not exist yet
      return false;
    });

    // Act: Run the command's action
    const result = await changeCommand.action!(mockContext, changeName);

    // Assert: Check that directories and files were created
    expect(fs.mkdirSync).toHaveBeenCalledWith(changeDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(specsDir, { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      proposalPath,
      expect.stringContaining(`# ${changeName}`)
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      tasksPath,
      expect.stringContaining('# Implementation Tasks')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      designPath,
      expect.stringContaining(`# Technical Design for ${changeName}`)
    );

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`✅ Created new change proposal: ${changeName}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('proposal.md - Describe what and why you\'re changing');
    expect(content).toContain('tasks.md - List implementation tasks for AI assistants');
    expect(content).toContain('design.md - Document technical design decisions');
    expect(content).toContain(`Use /openspec show ${changeName} to view your change`);
  });

  it('should handle existing change proposal gracefully', async () => {
    // Arrange: Simulate that OpenSpec is initialized and change already exists
    const changeName = 'existing-feature';
    const changeDir = path.join(changesDir, changeName);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      if (p === changeDir) return true;    // Change already exists
      return false;
    });

    // Act: Run the command's action
    const result = await changeCommand.action!(mockContext, changeName);

    // Assert: Check for the correct info message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`Change proposal "${changeName}" already exists.`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('proposal.md - Describe what and why you\'re changing');
    expect(content).toContain('tasks.md - List implementation tasks for AI assistants');
    expect(content).toContain('design.md - Document technical design decisions');
    expect(content).toContain(`Use /openspec show ${changeName} to view your change`);
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Simulate that creating directories throws an error
    const changeName = 'error-feature';
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;  // OpenSpec is initialized
      if (p === path.join(changesDir, changeName)) return false;  // Change does not exist
      return false;
    });
    
    vi.mocked(fs.mkdirSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action
    const result = await changeCommand.action!(mockContext, changeName);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining(`Failed to create/change proposal "${changeName}": Permission denied`),
    });
  });
});