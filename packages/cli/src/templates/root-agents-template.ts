/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Template for the root-level AGENTS.md stub that redirects AI assistants
 * to the main OpenSpec instructions.
 */
export const ROOT_AGENTS_MD_TEMPLATE = `# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open \`@/openspec/AGENTS.md\` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use \`@/openspec/AGENTS.md\` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.
`;