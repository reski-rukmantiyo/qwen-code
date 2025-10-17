/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { viewCommand } from './viewCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';

describe('viewCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
  });

  it('should have the correct name and description', () => {
    expect(viewCommand.name).toBe('view');
    expect(viewCommand.description).toBe('Display an interactive dashboard of specs and changes');
    expect(viewCommand.kind).toBe('built-in');
  });

  it('should add dashboard item to UI when executed', async () => {
    // Act: Run the command's action
    const result = await viewCommand.action!(mockContext, '');

    // Assert: Check that addItem was called with the correct dashboard item
    expect(mockContext.ui.addItem).toHaveBeenCalledWith(
      {
        type: 'openspec_dashboard',
      },
      expect.any(Number) // timestamp
    );

    // Assert: Check that the function returns undefined (void)
    expect(result).toBeUndefined();
  });

  it('should ignore any arguments passed to the command', async () => {
    // Act: Run the command's action with arguments
    const result = await viewCommand.action!(mockContext, '--fullscreen --refresh');

    // Assert: Check that addItem was called with the correct dashboard item
    expect(mockContext.ui.addItem).toHaveBeenCalledWith(
      {
        type: 'openspec_dashboard',
      },
      expect.any(Number) // timestamp
    );

    // Assert: Check that the function returns undefined (void)
    expect(result).toBeUndefined();
  });
});