/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple test to verify that the templates can be imported
import { ROOT_AGENTS_MD_TEMPLATE, OPENSPEC_AGENTS_MD_TEMPLATE } from './agentsMdTemplates.js';

console.log('ROOT_AGENTS_MD_TEMPLATE length:', ROOT_AGENTS_MD_TEMPLATE.length);
console.log('OPENSPEC_AGENTS_MD_TEMPLATE length:', OPENSPEC_AGENTS_MD_TEMPLATE.length);

// Verify that the root template contains the expected content
if (ROOT_AGENTS_MD_TEMPLATE.includes('@/openspec/AGENTS.md')) {
  console.log('✓ Root template contains redirect to OpenSpec instructions');
} else {
  console.log('✗ Root template missing redirect to OpenSpec instructions');
}

// Verify that the OpenSpec template contains key sections
if (OPENSPEC_AGENTS_MD_TEMPLATE.includes('Three-Stage Workflow') && 
    OPENSPEC_AGENTS_MD_TEMPLATE.includes('CLI Commands Reference') &&
    OPENSPEC_AGENTS_MD_TEMPLATE.includes('Directory Structure')) {
  console.log('✓ OpenSpec template contains required sections');
} else {
  console.log('✗ OpenSpec template missing required sections');
}