/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { openspecCommand } from './openspecCommand.js';

describe('openspecCommand', () => {
  it('should have the correct name and description', () => {
    expect(openspecCommand.name).toBe('openspec');
    expect(openspecCommand.description).toBe('Manage OpenSpec specifications and changes');
    expect(openspecCommand.kind).toBe('built-in');
  });

  it('should show help when no arguments are provided', async () => {
    const context: any = {
      services: {},
      ui: {},
      session: {},
    };
    
    const result = await openspecCommand.action!(context, '');
    
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('OpenSpec - Specification-driven development tool'),
    });
  });

  it('should recognize commands with arguments', async () => {
    const context: any = {
      services: {},
      ui: {},
      session: {},
    };
    
    const result = await openspecCommand.action!(context, 'init');
    
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('OpenSpec command recognized. Args: init'),
    });
  });
});