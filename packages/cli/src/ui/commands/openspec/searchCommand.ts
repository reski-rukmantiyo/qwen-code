/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext, MessageActionReturn } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

export const searchCommand: SlashCommand = {
  name: 'search',
  description: 'Search for text in OpenSpec specifications using ripgrep',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string): Promise<MessageActionReturn> => {
    // Parse arguments
    const argsArray = args.trim().split(/\s+/);
    
    if (argsArray.length < 1) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Usage: /openspec search <pattern> [options]
        
Options:
  --path <path>     Search in specific path (relative to openspec directory)
  --include <glob>  Include only files matching glob pattern
  --max-results <n> Limit results to n matches (default: 20)
  
Examples:
  /openspec search "user authentication"
  /openspec search "SHALL" --include "*.md"
  /openspec search "Scenario:" --path specs`,
      };
    }
    
    const pattern = argsArray[0];
    let searchPath = '';
    let includePattern = '';
    let maxResults = 20;
    
    // Parse options
    for (let i = 1; i < argsArray.length; i++) {
      const arg = argsArray[i];
      if (arg === '--path' && i + 1 < argsArray.length) {
        searchPath = argsArray[i + 1];
        i++; // Skip next argument
      } else if (arg === '--include' && i + 1 < argsArray.length) {
        includePattern = argsArray[i + 1];
        i++; // Skip next argument
      } else if (arg === '--max-results' && i + 1 < argsArray.length) {
        const num = parseInt(argsArray[i + 1]);
        if (!isNaN(num) && num > 0) {
          maxResults = num;
        }
        i++; // Skip next argument
      }
    }
    
    const projectRoot = process.cwd();
    const openspecDir = path.join(projectRoot, 'openspec');
    
    // Check if OpenSpec is initialized
    if (!fs.existsSync(openspecDir)) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
      };
    }
    
    // Determine search directory
    let fullPath = openspecDir;
    if (searchPath) {
      fullPath = path.join(openspecDir, searchPath);
      if (!fs.existsSync(fullPath)) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Search path "${searchPath}" does not exist.`,
        };
      }
    }
    
    try {
      // Import ripgrep path
      const { rgPath } = await import('@lvce-editor/ripgrep');
      
      // Build ripgrep command arguments
      const rgArgs = [
        '--line-number',
        '--color', 'never',
        '--max-count', maxResults.toString(),
        pattern
      ];
      
      // Add file type filter if specified
      if (includePattern) {
        rgArgs.push('--glob', includePattern);
      }
      
      // Add search path
      rgArgs.push(fullPath);
      
      // Execute ripgrep
      const child = spawn(rgPath, rgArgs, {
        cwd: projectRoot
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Wait for completion
      const exitCode = await new Promise<number>((resolve) => {
        child.on('close', resolve);
      });
      
      if (exitCode !== 0 && exitCode !== 1) { // 1 means no matches found, which is OK
        return {
          type: 'message',
          messageType: 'error',
          content: `Search failed with exit code ${exitCode}: ${stderr}`,
        };
      }
      
      // Parse results
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        let content = `# Search Results for "${pattern}"\n\n`;
        content += `Found ${lines.length} matches:\n\n`;
        
        for (const line of lines) {
          content += `${line}\n`;
        }
        
        return {
          type: 'message',
          messageType: 'info',
          content,
        };
      } else {
        return {
          type: 'message',
          messageType: 'info',
          content: `No matches found for "${pattern}".`,
        };
      }
    } catch (error: any) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to execute search: ${error.message}`,
      };
    }
  },
};