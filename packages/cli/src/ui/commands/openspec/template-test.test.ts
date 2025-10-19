/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ROOT_AGENTS_MD_TEMPLATE, OPENSPEC_AGENTS_MD_TEMPLATE } from '../../../templates/agentsMdTemplates.js';

describe('Template Values Test', () => {
  it('should have different template values', () => {
    console.log('ROOT_AGENTS_MD_TEMPLATE:', ROOT_AGENTS_MD_TEMPLATE.substring(0, 50));
    console.log('OPENSPEC_AGENTS_MD_TEMPLATE:', OPENSPEC_AGENTS_MD_TEMPLATE.substring(0, 50));
    
    expect(ROOT_AGENTS_MD_TEMPLATE).not.toBe(OPENSPEC_AGENTS_MD_TEMPLATE);
    expect(ROOT_AGENTS_MD_TEMPLATE).toContain('OpenSpec Instructions');
    expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('OpenSpec Instructions for AI Assistants');
  });
});