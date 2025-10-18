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
import { readFileEfficiently, getFileStats } from '../../../services/OpenSpecFileUtils.js';

export const showCommand: SlashCommand = {
  name: 'show',
  description: 'Show details of a specific change',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse change name from args
    const changeName = args.trim();
    
    if (!changeName) {
      // Get list of available changes for interactive selection
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      if (!fs.existsSync(changesDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();
      
      if (changes.length === 0) {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No active changes found. Use /openspec change <change-name> to create a new change.',
        };
      }
      
      // For now, return a message with available changes
      // In a full implementation, this would show an interactive selection dialog
      let content = 'Please specify a change name. Available changes:\\n\\n';
      changes.forEach((change, index) => {
        content += `${index + 1}. ${change}\\n`;
      });
      content += '\\nUsage: /openspec show <change-name>';
      
      return {
        type: 'message',
        messageType: 'info',
        content,
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
      
      // Read change files efficiently
      let content = `# Change: ${changeName}\n\n`;
      
      // Read proposal.md
      const proposalPath = path.join(changeDir, 'proposal.md');
      if (fs.existsSync(proposalPath)) {
        const stats = getFileStats(proposalPath);
        content += `## Proposal (${stats.sizeFormatted})\n`;
        content += await readFileEfficiently(proposalPath);
        content += '\n\n';
      } else {
        content += '## Proposal\nNo proposal.md file found.\n\n';
      }
      
      // Read tasks.md
      const tasksPath = path.join(changeDir, 'tasks.md');
      if (fs.existsSync(tasksPath)) {
        const stats = getFileStats(tasksPath);
        content += `## Tasks (${stats.sizeFormatted})\n`;
        content += await readFileEfficiently(tasksPath);
        content += '\n\n';
      } else {
        content += '## Tasks\nNo tasks.md file found.\n\n';
      }
      
      // Read design.md (optional)
      const designPath = path.join(changeDir, 'design.md');
      if (fs.existsSync(designPath)) {
        const stats = getFileStats(designPath);
        content += `## Design (${stats.sizeFormatted})\n`;
        content += await readFileEfficiently(designPath);
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
          for (const file of specFiles) {
            const filePath = path.join(specsDir, file);
            const stats = getFileStats(filePath);
            content += `- ${file} (${stats.sizeFormatted})\n`;
          }
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