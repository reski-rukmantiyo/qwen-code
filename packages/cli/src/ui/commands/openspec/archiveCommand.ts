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

export const archiveCommand: SlashCommand = {
  name: 'archive',
  description: 'Move completed changes to archive',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse arguments
    const argsArray = args.trim().split(/\s+/);
    let changeName = '';
    let autoConfirm = false;
    
    for (let i = 0; i < argsArray.length; i++) {
      const arg = argsArray[i];
      if (arg === '--yes' || arg === '-y') {
        autoConfirm = true;
      } else if (!changeName) {
        changeName = arg;
      }
    }
    
    if (!changeName) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name. Usage: /openspec archive <change-name> [--yes|-y]',
      };
    }
    
    try {
      const projectRoot = process.cwd();
      const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      const archiveDir = path.join(projectRoot, 'openspec', 'archive');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(changeDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Change "${changeName}" not found. Run /openspec list to see available changes.`,
        };
      }
      
      // Check if already archived
      const archivedChangeDir = path.join(archiveDir, changeName);
      if (fs.existsSync(archivedChangeDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Change "${changeName}" is already archived.`,
        };
      }
      
      // If not auto-confirming, check if we should prompt for confirmation
      // In this implementation, we'll just proceed with the archive
      // In a full implementation, we would integrate with Qwen Code's confirmation system
      if (!autoConfirm) {
        // In a full implementation, we would show a confirmation dialog here
        // For now, we just proceed with the archival
      }
      
      // Create archive directory if it doesn't exist
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      
      // Move change directory to archive
      fs.renameSync(changeDir, archivedChangeDir);
      
      return {
        type: 'message',
        messageType: 'info',
        content: `✅ Change "${changeName}" has been archived successfully.`,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to archive change "${changeName}": ${(error as Error).message}`,
      };
    }
  },
  completion: async (context, partialArg) => {
    // Don't suggest completion for flags
    if (partialArg.startsWith('-')) {
      return ['--yes', '-y'];
    }
    
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