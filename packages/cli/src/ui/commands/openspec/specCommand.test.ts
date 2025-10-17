/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { specCommand } from './specCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const readFileSync = vi.fn();
  return {
    ...actual,
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      mkdirSync,
      writeFileSync,
      readFileSync,
    },
  } as unknown as typeof import('node:fs');
});

// Mock the OpenSpecFileUtils module
vi.mock('../../../services/OpenSpecFileUtils.js', () => ({
  readFileEfficiently: vi.fn().mockImplementation(async () => {
    return '# Test Specification\n\nThis is a test specification.';
  }),
  getFileStats: vi.fn().mockReturnValue({ 
    sizeFormatted: '1KB',
    modified: new Date('2025-01-01T12:00:00Z')
  }),
}));

describe('specCommand', () => {
  let mockContext: CommandContext;
  let tempDir: string;
  let openspecDir: string;
  let specsDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-spec-test-'));
    openspecDir = path.join(tempDir, 'openspec');
    specsDir = path.join(openspecDir, 'specs');
    
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
    expect(specCommand.name).toBe('spec');
    expect(specCommand.description).toBe('Manage OpenSpec specification files');
    expect(specCommand.kind).toBe('built-in');
  });

  it('should return usage information when no arguments are provided', async () => {
    // Act: Run the command's action without arguments
    const result = await specCommand.action!(mockContext, '');

    // Assert: Check for the correct usage message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Usage: /openspec spec <action> [options]'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('Actions:');
    expect(content).toContain('create <spec-path>');
    expect(content).toContain('edit <spec-path>');
    expect(content).toContain('delete <spec-path>');
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange: Simulate that specs directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act: Run the command's action
    const result = await specCommand.action!(mockContext, 'create test-spec');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
    });
  });

  it('should return error for unknown action', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Act: Run the command's action with unknown action
    const result = await specCommand.action!(mockContext, 'unknown-action test-spec');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Unknown action: unknown-action'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('Supported actions: create, edit, delete');
  });

  it('should create new specification successfully', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    const specPath = 'auth/user-authentication';
    const fullPath = path.join(specsDir, `${specPath}.md`);
    const dirName = path.dirname(fullPath);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === specsDir) return true;   // OpenSpec initialized
      if (p === fullPath) return false;  // Spec doesn't exist yet
      return false;
    });

    // Act: Run the command's action to create spec
    const result = await specCommand.action!(mockContext, `create ${specPath}`);

    // Assert: Check that directory and file were created
    expect(fs.mkdirSync).toHaveBeenCalledWith(dirName, { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      fullPath,
      expect.stringContaining(`# ${path.basename(specPath)}`)
    );

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`✅ Created new specification: ${specPath}`),
    });
    
    const content = (result as any).content;
    expect(content).toContain(`File created at: ${fullPath}`);
  });

  it('should return error when creating spec that already exists', async () => {
    // Arrange: Simulate that OpenSpec is initialized and spec already exists
    const specPath = 'existing-spec';
    const fullPath = path.join(specsDir, `${specPath}.md`);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === specsDir) return true;  // OpenSpec initialized
      if (p === fullPath) return true;  // Spec already exists
      return false;
    });

    // Act: Run the command's action to create spec
    const result = await specCommand.action!(mockContext, `create ${specPath}`);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: `Specification "${specPath}" already exists.`,
    });
  });

  it('should return error for invalid spec path when creating', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Act: Run the command's action with invalid spec path
    const result = await specCommand.action!(mockContext, 'create invalid path with spaces');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Spec path can only contain letters, numbers, hyphens, underscores, and forward slashes.',
    });
  });

  it('should return error when no spec path provided for create action', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Act: Run the command's action without spec path
    const result = await specCommand.action!(mockContext, 'create');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a spec path. Usage: /openspec spec create <spec-path>',
    });
  });

  it('should edit existing specification successfully', async () => {
    // Arrange: Simulate that OpenSpec is initialized and spec exists
    const specPath = 'api/rest-endpoints';
    const fullPath = path.join(specsDir, `${specPath}.md`);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === specsDir) return true;  // OpenSpec initialized
      if (p === fullPath) return true;  // Spec exists
      return false;
    });

    // Act: Run the command's action to edit spec
    const result = await specCommand.action!(mockContext, `edit ${specPath}`);

    // Assert: Check for the correct output
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`Specification "${specPath}" (1KB)`),
    });
    
    const content = (result as any).content;
    expect(content).toContain('Last modified: 1/1/2025');
    expect(content).toContain('# Test Specification');
    expect(content).toContain('This is a test specification.');
  });

  it('should return error when editing spec that does not exist', async () => {
    // Arrange: Simulate that OpenSpec is initialized but spec doesn't exist
    const specPath = 'non-existent-spec';
    const fullPath = path.join(specsDir, `${specPath}.md`);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === specsDir) return true;  // OpenSpec initialized
      if (p === fullPath) return false; // Spec doesn't exist
      return false;
    });

    // Act: Run the command's action to edit spec
    const result = await specCommand.action!(mockContext, `edit ${specPath}`);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: `Specification "${specPath}" not found.`,
    });
  });

  it('should return error when no spec path provided for edit action', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Act: Run the command's action without spec path
    const result = await specCommand.action!(mockContext, 'edit');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a spec path. Usage: /openspec spec edit <spec-path>',
    });
  });

  it('should handle edit specification errors gracefully', async () => {
    // Arrange: Simulate that OpenSpec is initialized and spec exists
    const specPath = 'error-spec';
    const fullPath = path.join(specsDir, `${specPath}.md`);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === specsDir) return true;  // OpenSpec initialized
      if (p === fullPath) return true;  // Spec exists
      return false;
    });
    
    // Mock the readFileEfficiently function to throw an error
    const { readFileEfficiently } = await import('../../../services/OpenSpecFileUtils.js');
    vi.mocked(readFileEfficiently).mockImplementation(async () => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action to edit spec
    const result = await specCommand.action!(mockContext, `edit ${specPath}`);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining(`Failed to read specification "${specPath}": Permission denied`),
    });
  });

  it('should handle delete action by providing instructions', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    const specPath = 'deprecated-spec';
    const fullPath = path.join(specsDir, `${specPath}.md`);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === specsDir) return true;  // OpenSpec initialized
      return false;
    });

    // Act: Run the command's action to delete spec
    const result = await specCommand.action!(mockContext, `delete ${specPath}`);

    // Assert: Check for the correct info message with instructions
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining(`To delete specification "${specPath}":`),
    });
    
    const content = (result as any).content;
    expect(content).toContain(`Manually delete the following file:`);
    expect(content).toContain(fullPath);
  });

  it('should return error when no spec path provided for delete action', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Act: Run the command's action without spec path
    const result = await specCommand.action!(mockContext, 'delete');

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Please specify a spec path. Usage: /openspec spec delete <spec-path>',
    });
  });

  it('should handle file system errors during creation gracefully', async () => {
    // Arrange: Simulate that OpenSpec is initialized
    const specPath = 'error-spec';
    const fullPath = path.join(specsDir, `${specPath}.md`);
    
    vi.mocked(fs.existsSync).mockImplementation((p: any) => {
      if (p === specsDir) return true;   // OpenSpec initialized
      if (p === fullPath) return false;  // Spec doesn't exist yet
      return false;
    });
    
    vi.mocked(fs.mkdirSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Act: Run the command's action to create spec
    const result = await specCommand.action!(mockContext, `create ${specPath}`);

    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining(`Failed to create specification "${specPath}": Permission denied`),
    });
  });
});