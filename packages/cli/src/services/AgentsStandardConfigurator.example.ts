/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Example usage of the AgentsStandardConfigurator class
 * 
 * This is a conceptual example of how the AgentsStandardConfigurator would be used
 * in an update command to manage root AGENTS.md files with OPENSPEC:START/END markers.
 */

import type { CommandContext } from '../types.js';
import { AgentsStandardConfigurator } from '../../../services/AgentsStandardConfigurator.js';
import { ROOT_AGENTS_MD_TEMPLATE } from '../../../templates/agentsMdTemplates.js';
import process from 'node:process';
import * as path from 'node:path';

/**
 * Example function showing how the AgentsStandardConfigurator would be used
 * in an update command to refresh root AGENTS.md files
 */
async function updateRootAgentsExample(context: CommandContext) {
  try {
    const projectRoot = process.cwd();
    const openspecDir = path.join(projectRoot, 'openspec');
    
    // Initialize the configurator
    const configurator = new AgentsStandardConfigurator({
      projectRoot,
      openSpecDir: openspecDir,
      enableRollback: true
    });
    
    // Check if root AGENTS.md exists
    const existingContent = configurator.readRootAgentsFile();
    
    if (existingContent === null) {
      // Create new root AGENTS.md file with markers
      const result = configurator.createRootAgentsFile(ROOT_AGENTS_MD_TEMPLATE);
      
      if (result.success) {
        context.ui.displayMessage({
          type: 'info',
          content: `✅ Created new root AGENTS.md file at ${result.filePath}`
        });
      } else {
        context.ui.displayMessage({
          type: 'error',
          content: result.error || 'Failed to create root AGENTS.md file'
        });
      }
    } else {
      // Update existing root AGENTS.md file
      // In a real implementation, this would be dynamic content based on current OpenSpec state
      const updatedContent = `Redirect AI assistants to use the latest OpenSpec instructions.
Always open \`@/openspec/AGENTS.md\` when working with specifications.`;
      
      const result = configurator.updateRootAgentsFile(updatedContent);
      
      if (result.success) {
        if (result.contentUpdated) {
          context.ui.displayMessage({
            type: 'info',
            content: `✅ Updated root AGENTS.md file at ${result.filePath}`
          });
        } else {
          context.ui.displayMessage({
            type: 'info',
            content: `ℹ️ Root AGENTS.md file is already up to date at ${result.filePath}`
          });
        }
      } else {
        context.ui.displayMessage({
          type: 'error',
          content: result.error || 'Failed to update root AGENTS.md file'
        });
      }
    }
  } catch (error) {
    context.ui.displayMessage({
      type: 'error',
      content: `❌ Error updating root AGENTS.md: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

export { updateRootAgentsExample };