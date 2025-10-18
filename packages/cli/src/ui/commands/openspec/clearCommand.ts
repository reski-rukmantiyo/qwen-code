/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import { getOpenSpecCacheService } from '../../hooks/useOpenSpecWatcher.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

export const clearCommand: SlashCommand = {
  name: 'clear',
  description: 'Completely reset OpenSpec (use --cache-only to clear cache only)',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    try {
      // Parse arguments
      const argsArray = args.trim().split(/\s+/);
      let cacheOnly = false;
      
      for (let i = 0; i < argsArray.length; i++) {
        const arg = argsArray[i];
        if (arg === '--cache-only' || arg === '-c') {
          cacheOnly = true;
        }
      }
      
      if (cacheOnly) {
        // Only clear the cache, don't remove files
        const cacheService = getOpenSpecCacheService();
        
        if (!cacheService) {
          return {
            type: 'message',
            messageType: 'error',
            content: 'OpenSpec cache service is not available.',
          };
        }
        
        // Reset the caches (this will reinitialize them)
        cacheService.resetCaches();
        
        return {
          type: 'message',
          messageType: 'info',
          content: '✅ OpenSpec cache has been cleared and reset successfully.\\n\\nNote: This command only clears the in-memory cache. To completely reset OpenSpec and remove all specifications and changes, run "/openspec clear" without flags.',
        };
      }
      
      // Default behavior: completely reset OpenSpec by removing the directory structure
      const projectRoot = process.cwd();
      const openspecDir = path.join(projectRoot, 'openspec');
      
      if (fs.existsSync(openspecDir)) {
        fs.rmSync(openspecDir, { recursive: true, force: true });
        return {
          type: 'message',
          messageType: 'info',
          content: '✅ OpenSpec has been completely reset. All specifications and changes have been removed.\\n\\nYou can now run "/openspec init" to initialize a fresh OpenSpec environment.',
        };
      } else {
        return {
          type: 'message',
          messageType: 'info',
          content: '✅ No OpenSpec directory found. Nothing to reset.',
        };
      }
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to clear OpenSpec: ${(error as Error).message}`,
      };
    }
  },
};