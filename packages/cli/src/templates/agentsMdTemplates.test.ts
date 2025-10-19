/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ROOT_AGENTS_MD_TEMPLATE } from './root-agents-template.js';
import { OPENSPEC_AGENTS_MD_TEMPLATE } from './openspec-agents-template.js';

describe('agentsMdTemplates', () => {
  describe('ROOT_AGENTS_MD_TEMPLATE', () => {
    it('should contain the redirect instructions for AI assistants', () => {
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('# OpenSpec Instructions');
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('Always open `@/openspec/AGENTS.md` when the request:');
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('- Mentions planning or proposals');
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('- Introduces new capabilities');
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('- Sounds ambiguous and you need the authoritative spec before coding');
    });

    it('should contain the managed block markers', () => {
      // This is a key requirement for the update mechanism
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('Keep this managed block so \'openspec update\' can refresh the instructions.');
    });

    it('should have proper structure with clear instructions', () => {
      // Verify the template has the expected sections
      expect(ROOT_AGENTS_MD_TEMPLATE).toMatch(/^# OpenSpec Instructions/);
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('Use `@/openspec/AGENTS.md` to learn:');
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('- How to create and apply change proposals');
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('- Spec format and conventions');
      expect(ROOT_AGENTS_MD_TEMPLATE).toContain('- Project structure and guidelines');
    });
  });

  describe('OPENSPEC_AGENTS_MD_TEMPLATE', () => {
    it('should contain comprehensive instructions for AI assistants working with OpenSpec', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('# OpenSpec Instructions for AI Assistants');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('OpenSpec is a specification-driven development tool');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('ensures alignment between humans and AI on detailed specifications');
    });

    it('should contain the three-stage workflow', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('## Three-Stage Workflow');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('1. **Creating Changes**: Propose modifications through structured change folders');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('2. **Implementing Changes**: Apply changes with AI assistance guided by specifications');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('3. **Archiving Changes**: Move completed changes to historical storage');
    });

    it('should contain CLI commands reference', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('## CLI Commands Reference');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec init`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec list`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec show <change-name>`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec change <change-name>`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec spec <action> <spec-path>`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec validate <change-name>`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec archive <change-name>`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec update`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec view`');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('`/openspec apply <change-name>`');
    });

    it('should contain directory structure information', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('## Directory Structure');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('```');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('openspec/');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('├── project.md');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('├── specs/');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('├── changes/');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('└── archive/');
    });

    it('should contain spec file format rules', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('## Spec File Format Rules');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### Specification Structure');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### Requirement Language');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### Scenario Format');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### Delta Operations');
    });

    it('should contain best practices', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('## Best Practices');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### For Specification Writing');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### For Change Management');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### For AI Implementation');
    });

    it('should contain troubleshooting guides', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('## Troubleshooting Guides');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### Common Issues');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('### Error Recovery');
    });

    it('should contain integration with Qwen Code', () => {
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('## Integration with Qwen Code');
      expect(OPENSPEC_AGENTS_MD_TEMPLATE).toContain('OpenSpec integrates deeply with Qwen Code\'s AI workflow:');
    });
  });
});