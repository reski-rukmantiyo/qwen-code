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

export const changeCommand: SlashCommand = {
  name: 'change',
  description: 'Create or modify change proposals',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse change name from args
    const changeName = args.trim();
    
    if (!changeName) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name. Usage: /openspec change <change-name>',
      };
    }
    
    // Validate change name for filesystem compatibility
    if (!/^[a-zA-Z0-9-_]+$/.test(changeName)) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Change name can only contain letters, numbers, hyphens, and underscores.',
      };
    }
    
    try {
      const projectRoot = process.cwd();
      const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      
      // Check if OpenSpec is initialized
      const openspecDir = path.join(projectRoot, 'openspec');
      if (!fs.existsSync(openspecDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      // Check if change already exists
      const isNewChange = !fs.existsSync(changeDir);
      
      if (isNewChange) {
        // Create directory structure
        fs.mkdirSync(changeDir, { recursive: true });
        
        // Generate template files
        const proposalContent = `# ${changeName}

## Overview
Briefly describe what this change proposes to implement.

## Motivation
Explain why this change is needed and what problem it solves.

## Implementation Plan
Detail the steps required to implement this change.

## Impact Assessment
Describe the potential impact of this change on the system.
`;
        
        const tasksContent = `# Implementation Tasks

- [ ] Task 1: Describe the first implementation task
- [ ] Task 2: Describe the second implementation task
- [ ] Task 3: Describe the third implementation task
`;
        
        const designContent = `# Technical Design for ${changeName}

## Approach
Describe the technical approach for implementing this change.

## Architecture
Outline any architectural considerations or changes.

## Dependencies
List any dependencies or prerequisites for this change.
`;
        
        fs.writeFileSync(path.join(changeDir, 'proposal.md'), proposalContent);
        fs.writeFileSync(path.join(changeDir, 'tasks.md'), tasksContent);
        fs.writeFileSync(path.join(changeDir, 'design.md'), designContent);
        
        // Create specs directory
        const specsDir = path.join(changeDir, 'specs');
        fs.mkdirSync(specsDir, { recursive: true });
        
        // Provide feedback
        return {
          type: 'message',
          messageType: 'info',
          content: `✅ Created new change proposal: ${changeName}

Files created:
- proposal.md - Describe what and why you're changing
- tasks.md - List implementation tasks for AI assistants
- design.md - Document technical design decisions
- specs/ - Directory for specification deltas

Next steps:
1. Edit the files to define your change
2. Use /openspec show ${changeName} to view your change
`,
        };
      } else {
        // Change already exists, provide feedback
        return {
          type: 'message',
          messageType: 'info',
          content: `Change proposal "${changeName}" already exists.

Files:
- proposal.md - Describe what and why you're changing
- tasks.md - List implementation tasks for AI assistants
- design.md - Document technical design decisions
- specs/ - Directory for specification deltas

Use /openspec show ${changeName} to view your change.
`,
        };
      }
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to create/change proposal "${changeName}": ${(error as Error).message}`,
      };
    }
  },
};