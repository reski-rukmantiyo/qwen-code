/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateCommand } from './updateCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

// Mock the OpenSpec services
vi.mock('../../../services/OpenSpecMemoryIntegration.js', () => {
  return {
    OpenSpecMemoryIntegration: vi.fn().mockImplementation(() => {
      return {
        generateOpenSpecMemory: vi.fn().mockResolvedValue('# OpenSpec Context\n\nTest content')
      };
    })
  };
});

vi.mock('../../../services/OpenSpecCacheService.js', () => {
  return {
    OpenSpecCacheService: vi.fn().mockImplementation(() => {
      return {
        getFileContent: vi.fn().mockImplementation((path) => `Content of ${path}`)
      };
    })
  };
});

describe('updateCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
    
    // Mock the subagent manager
    if (mockContext.services.config) {
      (mockContext.services.config as any).getSubagentManager = vi.fn().mockReturnValue({
        listSubagents: vi.fn().mockResolvedValue([])
      });
    }
    
    // Mock the UI methods
    mockContext.ui.setPendingItem = vi.fn();
  });

  it('should have the correct name and description', () => {
    expect(updateCommand.name).toBe('update');
    expect(updateCommand.description).toBe('Refresh agent instructions and regenerate AI guidance');
    expect(updateCommand.kind).toBe('built-in');
  });

  it('should return success message when update completes', async () => {
    // Act: Run the command's action
    const result = await updateCommand.action!(mockContext, '');

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('Refreshed any subagents configured to use OpenSpec specifications');
    expect(content).toContain('Regenerated AI guidance files based on current specifications');
    expect(content).toContain('Updated agent instructions with the latest changes');
    expect(content).toContain('Made updated guidance immediately available to AI models');
  });

  it('should ignore any arguments passed to the command', async () => {
    // Act: Run the command's action with arguments
    const result = await updateCommand.action!(mockContext, '--force --verbose');

    // Assert: Check for the correct success message (same as without arguments)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
  });
  
  it('should handle errors gracefully', async () => {
    // Mock an error in subagent manager
    if (mockContext.services.config) {
      (mockContext.services.config as any).getSubagentManager = vi.fn().mockReturnValue({
        listSubagents: vi.fn().mockRejectedValue(new Error('Test error'))
      });
    }

    // Act: Run the command's action
    const result = await updateCommand.action!(mockContext, '');

    // Assert: Check that we still get a success message (errors are handled internally)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
  });
});