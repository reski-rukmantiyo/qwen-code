/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { viewCommand } from './viewCommand.js';

describe('viewCommand', () => {
  it('should have the correct name and description', () => {
    expect(viewCommand.name).toBe('view');
    expect(viewCommand.description).toBe('Display an interactive dashboard of specs and changes');
    expect(viewCommand.kind).toBe('built-in');
  });
});