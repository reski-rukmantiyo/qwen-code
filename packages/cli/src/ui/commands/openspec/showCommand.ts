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

export const showCommand: SlashCommand = {
  name: 'show',
  description: 'Show details of a specific change',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse change name from args
    const changeName = args.trim();
    
    if (!changeName) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name. Usage: /openspec show <change-name>',
      };
    }
    
    try {
      const projectRoot = process.cwd();
      const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(changeDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Change "${changeName}" not found. Run /openspec list to see available changes.`,
        };
      }
      
      // Read change files
      let content = `# Change: ${changeName}\n\n`;
      
      // Read proposal.md
      const proposalPath = path.join(changeDir, 'proposal.md');
      if (fs.existsSync(proposalPath)) {
        content += '## Proposal\n';
        content += fs.readFileSync(proposalPath, 'utf-8');
        content += '\n\n';
      } else {
        content += '## Proposal\nNo proposal.md file found.\n\n';
      }
      
      // Read tasks.md
      const tasksPath = path.join(changeDir, 'tasks.md');
      if (fs.existsSync(tasksPath)) {
        content += '## Tasks\n';
        content += fs.readFileSync(tasksPath, 'utf-8');
        content += '\n\n';
      } else {
        content += '## Tasks\nNo tasks.md file found.\n\n';
      }
      
      // Read design.md (optional)
      const designPath = path.join(changeDir, 'design.md');
      if (fs.existsSync(designPath)) {
        content += '## Design\n';
        content += fs.readFileSync(designPath, 'utf-8');
        content += '\n\n';
      }
      
      // List spec deltas
      const specsDir = path.join(changeDir, 'specs');
      if (fs.existsSync(specsDir)) {
        const specFiles = fs.readdirSync(specsDir, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
          .map(dirent => dirent.name);
        
        if (specFiles.length > 0) {
          content += '## Specification Deltas\n';
          specFiles.forEach(file => {
            content += `- ${file}\n`;
          });
          content += '\n';
        }
      }
      
      return {
        type: 'message',
        messageType: 'info',
        content,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to show change "${changeName}": ${(error as Error).message}`,
      };
    }
  },
  completion: async (context, partialArg) => {
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      if (!fs.existsSync(changesDir)) {
        return [];
      }
      
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      return changes.filter(change => change.startsWith(partialArg));
    } catch (_error) {
      return [];
    }
  },
};