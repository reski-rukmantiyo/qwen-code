/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MockedFunction } from 'vitest';
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

// Mock console.log to prevent output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});

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
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      // For the main openspec directory, return false to trigger initialization
      const openspecDir = path.join(tempDir, 'openspec');
      if (p === openspecDir) return false;
      // For all other paths, return false by default (they don't exist yet)
      return false;
    });

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
    // Note: Order of file writes may vary, so we check that both files were written
    const writeCalls = (fs.writeFileSync as MockedFunction<typeof fs.writeFileSync>).mock.calls;
    const specFileWritten = writeCalls.some(call => 
      call[0].endsWith('sample-spec.md') && 
      typeof call[1] === 'string' && 
      call[1].includes('Describe the purpose and scope of this specification')
    );
    expect(specFileWritten).toBe(true);
    
    // Assert: Check that AGENTS.md files were created
    const rootAgentsWritten = writeCalls.some(call => 
      call[0].endsWith('AGENTS.md') && 
      typeof call[1] === 'string' && 
      call[1].includes('OpenSpec Instructions')
    );
    expect(rootAgentsWritten).toBe(true);
    
    const openSpecAgentsWritten = writeCalls.some(call => 
      call[0].includes(path.join('openspec', 'AGENTS.md')) &&
      typeof call[1] === 'string' && 
      call[1].includes('OpenSpec Instructions for AI Assistants')
    );
    expect(openSpecAgentsWritten).toBe(true);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ OpenSpec successfully initialized!'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('openspec/');
    expect(content).toContain('AGENTS.md');
    expect(content).toContain('specs/');
    expect(content).toContain('changes/');
    expect(content).toContain('archive/');
    expect(content).toContain('Next steps:');
  });

  it('should return info message when OpenSpec is already initialized', async () => {
    // Arrange: Mock process.version to return a compatible version
    vi.spyOn(process, 'version', 'get').mockReturnValue('v20.19.0');
    
    // Simulate that OpenSpec directory and all required subdirectories and files exist
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    const projectMd = path.join(openspecDir, 'project.md');
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === openspecDir) return true;
      if (p === specsDir) return true;
      if (p === changesDir) return true;
      if (p === archiveDir) return true;
      if (p === projectMd) return true;
      return false;
    });

    // Also simulate that there are sample files to indicate proper initialization
    vi.spyOn(fs, 'readdirSync').mockImplementation((p: any) => {
      if (p === specsDir) return ['sample-spec.md'];
      if (p === changesDir) return ['sample-change'];
      return [];
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

  it('should initialize OpenSpec with generated specification when description is provided', async () => {
    // Arrange: Mock process.version to return a compatible version
    vi.spyOn(process, 'version', 'get').mockReturnValue('v20.19.0');
    
    // Simulate that OpenSpec directory does not exist
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      // For the main openspec directory, return false to trigger initialization
      const openspecDir = path.join(tempDir, 'openspec');
      if (p === openspecDir) return false;
      // For all other paths, return false by default (they don't exist yet)
      return false;
    });

    // Act: Run the command's action with a description
    const description = 'create webserver based on golang where this website connect to postgre';
    const result = await initCommand.action!(mockContext, `"${description}"`);

    // Assert: Check that directories were created
    const openspecDir = path.join(tempDir, 'openspec');
    const specsDir = path.join(openspecDir, 'specs');
    const changesDir = path.join(openspecDir, 'changes');
    const archiveDir = path.join(openspecDir, 'archive');
    
    // Check that all directories were created (order may vary)
    const mkdirCalls = (fs.mkdirSync as MockedFunction<typeof fs.mkdirSync>).mock.calls;
    const calledPaths = mkdirCalls.map(call => call[0]);
    expect(calledPaths).toContain(openspecDir);
    expect(calledPaths).toContain(specsDir);
    expect(calledPaths).toContain(changesDir);
    expect(calledPaths).toContain(archiveDir);

    // Assert: Check that sample files were created
    const writeFileSyncCalls = (fs.writeFileSync as MockedFunction<typeof fs.writeFileSync>).mock.calls;
    const specFileWritten = writeFileSyncCalls.some(call => 
      (call[0] as string).endsWith('.md') && 
      typeof call[1] === 'string'
    );
    expect(specFileWritten).toBe(true);
    
    // Assert: Check that AGENTS.md files were created
    const agentsFileWritten = writeFileSyncCalls.some(call => 
      (call[0] as string).endsWith('AGENTS.md') && 
      typeof call[1] === 'string' && 
      (call[1] as string).includes('OpenSpec Instructions')
    );
    expect(agentsFileWritten).toBe(true);

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ OpenSpec successfully initialized!'),
    });
  });
});