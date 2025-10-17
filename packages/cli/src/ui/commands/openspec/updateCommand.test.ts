/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { updateCommand } from './updateCommand.js';

describe('updateCommand', () => {
  it('should have the correct name and description', () => {
    expect(updateCommand.name).toBe('update');
    expect(updateCommand.description).toBe('Refresh agent instructions and regenerate AI guidance');
    expect(updateCommand.kind).toBe('built-in');
  });
});