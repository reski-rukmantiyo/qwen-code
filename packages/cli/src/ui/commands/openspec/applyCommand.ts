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
import { readFileEfficiently } from '../../../services/OpenSpecFileUtils.js';

export const applyCommand: SlashCommand = {
  name: 'apply',
  description: 'Apply a change by submitting tasks to AI for implementation',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse change name from args
    const changeName = args.trim();
    
    if (!changeName) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name. Usage: /openspec apply <change-name>',
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
      
      // Read tasks.md file
      const tasksPath = path.join(changeDir, 'tasks.md');
      if (!fs.existsSync(tasksPath)) {
        return {
          type: 'message',
          messageType: 'error',
          content: `No tasks.md file found for change "${changeName}". Please create tasks before applying.`,
        };
      }
      
      // Read the tasks content
      const tasksContent = await readFileEfficiently(tasksPath);
      
      // Check if tasks file is empty
      if (!tasksContent.trim()) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Tasks file for change "${changeName}" is empty. Please add tasks before applying.`,
        };
      }
      
      // Prepare the prompt for AI implementation
      let content = `# Applying OpenSpec Change: ${changeName}\n\n`;
      content += 'Please implement the following tasks as specified in the OpenSpec change proposal.\n\n';
      content += '## Tasks to Implement\n';
      content += tasksContent;
      content += '\n\n## Implementation Guidelines\n';
      content += '1. Follow the tasks in order as listed above\n';
      content += '2. Reference the specifications in the specs/ directory\n';
      content += '3. Mark tasks as complete by checking the boxes as you implement them\n';
      content += '4. Ensure your implementation matches the technical design if provided\n';
      content += '5. Validate your implementation against the change proposal\n\n';
      content += '## Next Steps\n';
      content += `After completing these tasks, run "/openspec archive ${changeName}" to archive this change.`;
      
      // Return a submit_prompt action to have Qwen Code process this with AI
      return {
        type: 'submit_prompt',
        content,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to apply change "${changeName}": ${(error as Error).message}`,
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