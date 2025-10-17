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

export const listCommand: SlashCommand = {
  name: 'list',
  description: 'List active changes',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, _args: string) => {
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(changesDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      // Read changes directory
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();
      
      if (changes.length === 0) {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No active changes found.',
        };
      }
      
      // Format output
      let content = `Active changes (${changes.length}):\n\n`;
      changes.forEach((change, index) => {
        content += `${index + 1}. ${change}\n`;
      });
      
      return {
        type: 'message',
        messageType: 'info',
        content,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to list changes: ${(error as Error).message}`,
      };
    }
  },
};