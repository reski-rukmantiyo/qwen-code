/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { specCommand } from './specCommand.js';

describe('specCommand', () => {
  it('should have the correct name and description', () => {
    expect(specCommand.name).toBe('spec');
    expect(specCommand.description).toBe('Manage OpenSpec specification files');
    expect(specCommand.kind).toBe('built-in');
  });
});