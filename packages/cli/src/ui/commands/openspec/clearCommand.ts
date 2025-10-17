/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import { getOpenSpecCacheService } from '../../hooks/useOpenSpecWatcher.js';

export const clearCommand: SlashCommand = {
  name: 'clear',
  description: 'Clear the OpenSpec cache and reset it',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, _args: string) => {
    try {
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
        content: '✅ OpenSpec cache has been cleared and reset successfully.',
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to clear OpenSpec cache: ${(error as Error).message}`,
      };
    }
  },
};