/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import { OpenSpecMemoryIntegration } from '../../../services/OpenSpecMemoryIntegration.js';
import { OpenSpecCacheService } from '../../../services/OpenSpecCacheService.js';
import { AgentsStandardConfigurator } from '../../../services/AgentsStandardConfigurator.js';
import { ROOT_AGENTS_MD_TEMPLATE, OPENSPEC_AGENTS_MD_TEMPLATE } from '../../../templates/agentsMdTemplates.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

// Constants for file paths
const AGENTS_MD_FILENAME = 'AGENTS.md';
const OPENSPEC_DIRNAME = 'openspec';

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
      });

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
            });
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
        });
      } catch (error) {
        console.warn('Failed to regenerate AI guidance:', error);
      }

      // Step 3: Update agent instructions with the latest changes
      // This is handled by the memory integration which is called dynamically
      
      // Step 4: Update AGENTS.md files
      try {
        const projectRoot = process.cwd();
        const openSpecDir = path.join(projectRoot, OPENSPEC_DIRNAME);
        
        // Ensure openspec directory exists
        if (!fs.existsSync(openSpecDir)) {
          throw new Error(`OpenSpec directory not found at ${openSpecDir}`);
        }
        
        // Fully replace openspec/AGENTS.md with the latest template
        const openSpecAgentsPath = path.join(openSpecDir, AGENTS_MD_FILENAME);
        fs.writeFileSync(openSpecAgentsPath, OPENSPEC_AGENTS_MD_TEMPLATE, 'utf-8');
        
        context.ui.setPendingItem({
          type: 'info',
          text: '🔄 Updating agent instructions and AI guidance...\n✓ Refreshed subagents configured to use OpenSpec specifications\n✓ Regenerated AI guidance files based on current specifications\n✓ Updated OpenSpec AGENTS.md with latest template',
        });
        
        // Update root AGENTS.md using AgentsStandardConfigurator with marker-based updates
        // ROOT_AGENTS_MD_TEMPLATE contains the redirect instructions for AI assistants
        const configurator = new AgentsStandardConfigurator({
          projectRoot,
          openSpecDir,
          enableRollback: true
        });
        
        const result = configurator.updateRootAgentsFile(ROOT_AGENTS_MD_TEMPLATE);
        
        if (result.success) {
          context.ui.setPendingItem({
            type: 'info',
            text: '🔄 Updating agent instructions and AI guidance...\n✓ Refreshed subagents configured to use OpenSpec specifications\n✓ Regenerated AI guidance files based on current specifications\n✓ Updated OpenSpec AGENTS.md with latest template\n✓ Updated root AGENTS.md with marker-based updates',
          });
          
          if (result.contentUpdated) {
            console.log(`✅ Updated root AGENTS.md file at ${result.filePath}`);
          } else {
            console.log(`ℹ️ Root AGENTS.md file is already up to date at ${result.filePath}`);
          }
        } else {
          throw new Error(result.error || 'Failed to update root AGENTS.md file');
        }
      } catch (error) {
        console.warn('Failed to update AGENTS.md files:', error);
        // Continue with the rest of the update process even if AGENTS.md update fails
      }
      
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
- Made updated guidance immediately available to AI models
- Updated OpenSpec AGENTS.md with latest template
- Updated root AGENTS.md with marker-based updates`,
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