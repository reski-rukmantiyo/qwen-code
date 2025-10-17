/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

export const initCommand: SlashCommand = {
  name: 'init',
  description: 'Initialize OpenSpec in your project',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, _args: string) => {
    try {
      const projectRoot = process.cwd();
      
      // Check Node.js version compatibility
      const nodeVersion = process.version;
      const versionMatch = nodeVersion.match(/^v(\d+)\.(\d+)\.(\d+)/);
      
      if (versionMatch) {
        const major = parseInt(versionMatch[1], 10);
        const minor = parseInt(versionMatch[2], 10);
        
        // Require Node.js >= 20.19.0
        if (major < 20 || (major === 20 && minor < 19)) {
          return {
            type: 'message',
            messageType: 'error',
            content: `OpenSpec requires Node.js >= 20.19.0. Current version: ${nodeVersion}`,
          };
        }
      }
      
      // Create OpenSpec directory structure
      const openspecDir = path.join(projectRoot, 'openspec');
      const specsDir = path.join(openspecDir, 'specs');
      const changesDir = path.join(openspecDir, 'changes');
      const archiveDir = path.join(openspecDir, 'archive');
      
      // Check if OpenSpec is already initialized
      if (fs.existsSync(openspecDir)) {
        // Check if it's already an OpenSpec directory
        const requiredDirs = [specsDir, changesDir, archiveDir];
        const allExist = requiredDirs.every(dir => fs.existsSync(dir));
        
        if (allExist) {
          return {
            type: 'message',
            messageType: 'info',
            content: '✅ OpenSpec is already initialized in this project.',
          };
        } else {
          return {
            type: 'message',
            messageType: 'error',
            content: '❌ An "openspec" directory already exists but does not have the expected structure. Please remove it or initialize in a different directory.',
          };
        }
      }
      
      // Create directory structure
      fs.mkdirSync(openspecDir, { recursive: true });
      fs.mkdirSync(specsDir, { recursive: true });
      fs.mkdirSync(changesDir, { recursive: true });
      fs.mkdirSync(archiveDir, { recursive: true });
      
      // Create a sample spec file
      const sampleSpecContent = `# Sample Specification

This is a sample specification file. Replace this with your actual specifications.

## Overview
Describe the purpose and scope of this specification.

## Requirements
List the functional and non-functional requirements.

## Implementation Details
Provide implementation guidelines and constraints.

## Testing
Outline testing approaches and acceptance criteria.
`;
      
      const sampleSpecPath = path.join(specsDir, 'sample-spec.md');
      fs.writeFileSync(sampleSpecPath, sampleSpecContent);
      
      // Create a sample change proposal
      const sampleChangeDir = path.join(changesDir, 'sample-change');
      fs.mkdirSync(sampleChangeDir, { recursive: true });
      
      const sampleProposalContent = `# Sample Change Proposal

## Overview
This is a sample change proposal to demonstrate the structure.

## Motivation
Explain why this change is needed.

## Implementation Plan
Detail the steps required to implement this change.

## Impact Assessment
Describe the potential impact of this change.
`;
      
      const sampleTasksContent = `# Implementation Tasks

- [ ] Task 1: Describe the first implementation task
- [ ] Task 2: Describe the second implementation task
- [ ] Task 3: Describe the third implementation task
`;
      
      const sampleDesignContent = `# Technical Design

## Approach
Describe the technical approach for implementing this change.

## Architecture
Outline any architectural considerations.

## Dependencies
List any dependencies or prerequisites.
`;
      
      fs.writeFileSync(path.join(sampleChangeDir, 'proposal.md'), sampleProposalContent);
      fs.writeFileSync(path.join(sampleChangeDir, 'tasks.md'), sampleTasksContent);
      fs.writeFileSync(path.join(sampleChangeDir, 'design.md'), sampleDesignContent);
      
      // Create specs directory for the change
      const changeSpecsDir = path.join(sampleChangeDir, 'specs');
      fs.mkdirSync(changeSpecsDir, { recursive: true });
      
      const sampleChangeSpecContent = `# Sample Change Specification

This is a sample specification delta showing what will change.
`;
      
      fs.writeFileSync(path.join(changeSpecsDir, 'sample-spec.md'), sampleChangeSpecContent);
      
      // Provide success feedback
      return {
        type: 'message',
        messageType: 'info',
        content: `✅ OpenSpec successfully initialized!

Created directory structure:
openspec/
├── specs/                 # Current source-of-truth specifications
│   └── sample-spec.md     # Sample specification
├── changes/               # Proposed updates (active changes)
│   └── sample-change/     # Sample change folder
│       ├── proposal.md    # Change proposal
│       ├── tasks.md       # Implementation tasks
│       ├── design.md      # Technical design
│       └── specs/         # Specification deltas
│           └── sample-spec.md  # Sample spec delta
└── archive/               # Completed changes

Next steps:
1. Review and customize the sample files
2. Create your own specifications in specs/
3. Propose changes using /openspec change <change-name>
`,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to initialize OpenSpec: ${(error as Error).message}`,
      };
    }
  },
};