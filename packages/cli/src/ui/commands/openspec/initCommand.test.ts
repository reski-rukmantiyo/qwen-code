/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { initCommand } from './initCommand.js';
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

// Mock the useOpenSpecWatcher hook
vi.mock('../../hooks/useOpenSpecWatcher.js', () => ({
  getOpenSpecCacheService: vi.fn().mockReturnValue({
    clearCache: vi.fn(),
  }),
}));

describe('initCommand', () => {
  let mockContext: CommandContext;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-init-test-'));
    
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
    expect(initCommand.name).toBe('init');
    expect(initCommand.description).toBe('Initialize OpenSpec in your project');
    expect(initCommand.kind).toBe('built-in');
  });

  it('should return error when Node.js version is incompatible', async () => {
    // Arrange: Mock process.version to return an old version
    vi.spyOn(process, 'version', 'get').mockReturnValue('v18.17.0');

    // Act: Run the command's action
    const result = await initCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('OpenSpec requires Node.js >= 20.19.0. Current version: v18.17.0'),
    });
  });

  it('should initialize OpenSpec successfully when not already initialized', async () => {
    // Arrange: Mock process.version to return a compatible version
    vi.spyOn(process, 'version', 'get').mockReturnValue('v20.19.0');
    
    // Simulate that OpenSpec directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act: Run the command's action
    const result = await initCommand.action!(mockContext, '');

    // Assert: Check that directories were created
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    expect(fs.mkdirSync).toHaveBeenCalledWith(openspecDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(specsDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(changesDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(archiveDir, { recursive: true });

    // Assert: Check that sample files were created
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(specsDir, 'sample-spec.md'),
      expect.stringContaining('# Sample Specification')
    );
    
    const sampleChangeDir = path.join(changesDir, 'sample-change');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(sampleChangeDir, 'proposal.md'),
      expect.stringContaining('# Sample Change Proposal')
    );
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(sampleChangeDir, 'tasks.md'),
      expect.stringContaining('# Implementation Tasks')
    );
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(sampleChangeDir, 'design.md'),
      expect.stringContaining('# Technical Design')
    );
    
    const changeSpecsDir = path.join(sampleChangeDir, 'specs');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(changeSpecsDir, 'sample-spec.md'),
      expect.stringContaining('# Sample Change Specification')
    );

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ OpenSpec successfully initialized!'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('openspec/');
    expect(content).toContain('specs/');
    expect(content).toContain('changes/');
    expect(content).toContain('archive/');
    expect(content).toContain('Next steps:');
  });

  it('should return info message when OpenSpec is already initialized', async () => {
    // Arrange: Mock process.version to return a compatible version
    vi.spyOn(process, 'version', 'get').mockReturnValue('v20.19.0');
    
    // Simulate that OpenSpec directory and all required subdirectories exist
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === specsDir) return true;
      if (p === changesDir) return true;
      if (p === archiveDir) return true;
      return false;
    });

    // Act: Run the command's action
    const result = await initCommand.action!(mockContext, '');

    // Assert: Check for the correct info message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: '✅ OpenSpec is already initialized in this project.',
    });
  });

  it('should return error when openspec directory exists but has wrong structure', async () => {
    // Arrange: Mock process.version to return a compatible version
    vi.spyOn(process, 'version', 'get').mockReturnValue('v20.19.0');
    
    // Simulate that OpenSpec directory exists but not all required subdirectories exist
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === specsDir) return true;
      if (p === changesDir) return false;  // Missing changes directory
      if (p === archiveDir) return true;
      return false;
    });

    // Act: Run the command's action
    const result = await initCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: '❌ An "openspec" directory already exists but does not have the expected structure. Please remove it or initialize in a different directory.',
    });
  });

  it('should handle file system errors gracefully', async () => {
    // Arrange: Mock process.version to return a compatible version
    vi.spyOn(process, 'version', 'get').mockReturnValue('v20.19.0');
    
    // Simulate that OpenSpec directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    // Mock mkdirSync to throw an error
    vi.mocked(fs.mkdirSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action
    const result = await initCommand.action!(mockContext, '');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Failed to initialize OpenSpec: Permission denied'),
    });
  });
});