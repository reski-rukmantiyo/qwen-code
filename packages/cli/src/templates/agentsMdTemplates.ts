/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Templates for AGENTS.md files used in OpenSpec initialization and updates.
 * 
 * This module exports two templates:
 * 1. ROOT_AGENTS_MD_TEMPLATE - A minimal stub that redirects AI assistants to the main OpenSpec instructions
 * 2. OPENSPEC_AGENTS_MD_TEMPLATE - Comprehensive instructions for AI assistants working with OpenSpec
 * 3. Tool-specific templates for different AI tools that can integrate with OpenSpec
 */

// Export the root-level AGENTS.md stub template
export { ROOT_AGENTS_MD_TEMPLATE } from './root-agents-template.js';

// Export the OpenSpec instructions AGENTS.md template
export { OPENSPEC_AGENTS_MD_TEMPLATE } from './openspec-agents-template.js';

// Export tool-specific AGENTS.md templates
export {
  QWEN_CODE_AGENTS_TEMPLATE,
  CLAUDE_AGENTS_TEMPLATE,
  CHATGPT_AGENTS_TEMPLATE,
  GITHUB_COPILOT_AGENTS_TEMPLATE
} from './tool-specific-agents-templates.js';