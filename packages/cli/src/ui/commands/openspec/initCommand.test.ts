/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { initCommand } from './initCommand.js';

describe('initCommand', () => {
  it('should have the correct name and description', () => {
    expect(initCommand.name).toBe('init');
    expect(initCommand.description).toBe('Initialize OpenSpec in your project');
    expect(initCommand.kind).toBe('built-in');
  });
});