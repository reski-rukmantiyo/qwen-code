/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-20
 */

import { describe, it, expect } from 'vitest';
import { DeltaOperationsParser } from './OpenSpecDeltaOperationsParser.js';

describe('OpenSpecDeltaOperationsParser', () => {
  it('should validate correct delta format', () => {
    const content = `## ADDED Requirements
    
Content here`;

    const result = DeltaOperationsParser.validateDeltaFormat(content);
    
    expect(result.isValid).toBe(true);
  });
});