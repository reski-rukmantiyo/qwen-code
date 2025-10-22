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

describe('submitCommand', () => {
  let mockContext: any;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-submit-test-'));
    
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
    expect(submitCommand.name).toBe('submit');
    expect(submitCommand.description).toBe('Submit a new change proposal with activity type and description');
    expect(submitCommand.kind).toBe('built-in');
  });

  it('should return error when OpenSpec is not initialized', async () => {
    // Arrange: Simulate that OpenSpec directory does not exist
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    // Act: Run the command's action
    const result = await submitCommand.action!(mockContext, '');
    
    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
    });
  });

  it('should list changes when no arguments provided and changes exist', async () => {
    // Arrange: Simulate that OpenSpec directory exists with changes
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('openspec')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('changes')) {
        return true;
      }
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'feature-auth' },
      { isDirectory: () => true, name: 'api-improvements' },
      { isDirectory: () => true, name: 'archive' }, // This should be excluded
    ] as any);
    
    // Act: Run the command's action with no arguments
    const result = await submitCommand.action!(mockContext, '');
    
    // Assert: Check that we get a dialog with the list of changes
    expect(result).toEqual({
      type: 'dialog',
      dialog: 'openspec_proposal_dir_selection',
      data: {
        directories: ['feature-auth', 'api-improvements']
      }
    });
  });

  it('should return error when change does not exist', async () => {
    // Arrange: Simulate that OpenSpec directory exists but the specific change does not
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('openspec')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('changes')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('feature-auth')) {
        return false;
      }
      return false;
    });
    
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'api-improvements' },
    ] as any);
    
    // Act: Run the command's action with a non-existent change
    const result = await submitCommand.action!(mockContext, 'feature-auth');
    
    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Change "feature-auth" does not exist'),
    });
  });

  it('should ask for activity when change name provided but no activity', async () => {
    // Arrange: Simulate that OpenSpec directory and change exist
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('openspec')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('changes')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('feature-auth')) {
        return true;
      }
      return false;
    });
    
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
    
    // Act: Run the command's action with only change name
    const result = await submitCommand.action!(mockContext, 'feature-auth');
    
    // Assert: Check that we get a dialog for activity selection
    expect(result).toEqual({
      type: 'dialog',
      dialog: 'openspec_proposal_description_input',
      data: {
        changeName: 'feature-auth'
      }
    });
  });

  it('should return error for invalid activity', async () => {
    // Arrange: Simulate that OpenSpec directory and change exist
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('openspec')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('changes')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('feature-auth')) {
        return true;
      }
      return false;
    });
    
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
    
    // Act: Run the command's action with invalid activity
    const result = await submitCommand.action!(mockContext, 'feature-auth invalid-activity');
    
    // Assert: Check for the correct error message
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Activity must be either "bugs" or "features"',
    });
  });

  it('should ask for description when change name and activity provided but no description', async () => {
    // Arrange: Simulate that OpenSpec directory and change exist
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('openspec')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('changes')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('feature-auth')) {
        return true;
      }
      return false;
    });
    
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
    
    // Act: Run the command's action with change name and activity but no description
    const result = await submitCommand.action!(mockContext, 'feature-auth bugs');
    
    // Assert: Check that we get a dialog for description input
    expect(result).toEqual({
      type: 'dialog',
      dialog: 'openspec_proposal_description_input',
      data: {
        changeName: 'feature-auth',
        activity: 'bugs'
      }
    });
  });

  it('should return error when missing required files', async () => {
    // Arrange: Simulate that OpenSpec directory and change exist but missing files
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('openspec')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('changes')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('feature-auth')) {
        return true;
      }
      if (typeof path === 'string' && path.endsWith('proposal.md')) {
        return false; // Missing proposal.md
      }
      if (typeof path === 'string' && path.endsWith('design.md')) {
        return false; // Missing design.md
      }
      return false;
    });
    
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
    
    // Act: Run the command's action with all arguments
    const result = await submitCommand.action!(mockContext, 'feature-auth bugs Fix login issue');
    
    // Assert: Check for the correct error message about missing files
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: expect.stringContaining('Missing required files'),
    });
  });
});