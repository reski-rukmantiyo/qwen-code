/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { updateCommand } from './updateCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

describe('updateCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
  });

  it('should have the correct name and description', () => {
    expect(updateCommand.name).toBe('update');
    expect(updateCommand.description).toBe('Refresh agent instructions and regenerate AI guidance');
    expect(updateCommand.kind).toBe('built-in');
  });

  it('should return info message with update instructions', async () => {
    // Act: Run the command's action
    const result = await updateCommand.action!(mockContext, '');

    // Assert: Check for the correct info message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('🔄 Updating agent instructions and AI guidance...'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('This command would normally:');
    expect(content).toContain('Refresh any subagents configured to use OpenSpec specifications');
    expect(content).toContain('Regenerate AI guidance files based on current specifications');
    expect(content).toContain('Update agent instructions with the latest changes');
    expect(content).toContain('Make updated guidance immediately available to AI models');
    expect(content).toContain('Note: This is a placeholder implementation. Full functionality will be implemented in a future release.');
  });

  it('should ignore any arguments passed to the command', async () => {
    // Act: Run the command's action with arguments
    const result = await updateCommand.action!(mockContext, '--force --verbose');

    // Assert: Check for the correct info message (same as without arguments)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('🔄 Updating agent instructions and AI guidance...'),
    });
  });
});