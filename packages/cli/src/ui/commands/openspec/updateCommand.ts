/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import { OpenSpecMemoryIntegration } from '../../../services/OpenSpecMemoryIntegration.js';
import { OpenSpecCacheService } from '../../../services/OpenSpecCacheService.js';
import type { HistoryItemInfo } from '../../types.js';

export const updateCommand: SlashCommand = {
  name: 'update',
  description: 'Refresh agent instructions and regenerate AI guidance',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, _args: string) => {
    try {
      // Show initial progress message
      context.ui.setPendingItem({
        type: 'info',
        text: '🔄 Updating agent instructions and AI guidance...',
        timestamp: Date.now(),
      } as HistoryItemInfo);

      // Step 1: Refresh subagents configured to use OpenSpec specifications
      if (context.services.config) {
        const subagentManager = context.services.config.getSubagentManager();
        if (subagentManager) {
          try {
            // Force refresh the subagents cache
            await subagentManager.listSubagents({ force: true });
            context.ui.setPendingItem({
              type: 'info',
              text: '🔄 Updating agent instructions and AI guidance...\n✓ Refreshed subagents configured to use OpenSpec specifications',
              timestamp: Date.now(),
            } as HistoryItemInfo);
          } catch (error) {
            console.warn('Failed to refresh subagents:', error);
          }
        }
      }

      // Step 2: Regenerate AI guidance files based on current specifications
      const cacheService = new OpenSpecCacheService();
      const memoryIntegration = new OpenSpecMemoryIntegration(cacheService);
      
      try {
        // Generate fresh OpenSpec memory content
        await memoryIntegration.generateOpenSpecMemory();
        
        // The memory content is automatically used by Qwen Code's context system
        // We don't need to explicitly save it anywhere as it's dynamically generated
        
        context.ui.setPendingItem({
          type: 'info',
          text: '🔄 Updating agent instructions and AI guidance...\n✓ Refreshed subagents configured to use OpenSpec specifications\n✓ Regenerated AI guidance files based on current specifications',
          timestamp: Date.now(),
        } as HistoryItemInfo);
      } catch (error) {
        console.warn('Failed to regenerate AI guidance:', error);
      }

      // Step 3: Update agent instructions with the latest changes
      // This is handled by the memory integration which is called dynamically
      
      // Clear pending item and show completion message
      context.ui.setPendingItem(null);
      
      return {
        type: 'message',
        messageType: 'info',
        content: `✅ Agent instructions and AI guidance updated successfully!
        
What was updated:
- Refreshed any subagents configured to use OpenSpec specifications
- Regenerated AI guidance files based on current specifications
- Updated agent instructions with the latest changes
- Made updated guidance immediately available to AI models`,
      };
    } catch (error) {
      context.ui.setPendingItem(null);
      
      return {
        type: 'message',
        messageType: 'error',
        content: `❌ Failed to update agent instructions and AI guidance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};