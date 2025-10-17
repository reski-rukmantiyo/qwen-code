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

export const validateCommand: SlashCommand = {
  name: 'validate',
  description: 'Validate specification formatting',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Check for --all flag
    const allFlag = args.trim() === '--all';
    const changeName = allFlag ? null : args.trim();
    
    if (!changeName && !allFlag) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name or use --all flag. Usage: /openspec validate <change-name> or /openspec validate --all',
      };
    }
    
    try {
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
      
      let content = '';
      let hasErrors = false;
      
      if (allFlag) {
        content += '# Validating all changes\n\n';
        const changesDir = path.join(openspecDir, 'changes');
        
        if (!fs.existsSync(changesDir)) {
          return {
            type: 'message',
            messageType: 'error',
            content: 'Changes directory not found.',
          };
        }
        
        const changes = fs.readdirSync(changesDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        if (changes.length === 0) {
          content += 'No changes found to validate.\n';
        } else {
          for (const change of changes) {
            const result = validateChange(projectRoot, change);
            content += `## ${change}\n${result.content}\n`;
            if (result.hasErrors) hasErrors = true;
          }
        }
      } else {
        // Validate specific change
        const result = validateChange(projectRoot, changeName!);
        content += `# Validating change: ${changeName}\n\n${result.content}`;
        hasErrors = result.hasErrors;
      }
      
      return {
        type: 'message',
        messageType: hasErrors ? 'error' : 'info',
        content,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to validate: ${(error as Error).message}`,
      };
    }
  },
  completion: async (context, partialArg) => {
    // Don't suggest completion for --all flag
    if (partialArg.startsWith('-')) {
      return ['--all'];
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

function validateChange(projectRoot: string, changeName: string): { content: string; hasErrors: boolean } {
  const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
  
  // Check if change exists
  if (!fs.existsSync(changeDir)) {
    return {
      content: `❌ Error: Change "${changeName}" not found.\n`,
      hasErrors: true,
    };
  }
  
  let content = '';
  let hasErrors = false;
  
  // Check required files
  const requiredFiles = ['proposal.md', 'tasks.md'];
  for (const file of requiredFiles) {
    const filePath = path.join(changeDir, file);
    if (!fs.existsSync(filePath)) {
      content += `❌ Error: Required file "${file}" not found.\n`;
      hasErrors = true;
    } else {
      // Check if file is not empty
      const fileContent = fs.readFileSync(filePath, 'utf-8').trim();
      if (fileContent.length === 0) {
        content += `⚠️ Warning: File "${file}" is empty.\n`;
      }
    }
  }
  
  // Check design.md (optional)
  const designPath = path.join(changeDir, 'design.md');
  if (fs.existsSync(designPath)) {
    const designContent = fs.readFileSync(designPath, 'utf-8').trim();
    if (designContent.length === 0) {
      content += `⚠️ Warning: File "design.md" is empty.\n`;
    }
  }
  
  // Check specs directory
  const specsDir = path.join(changeDir, 'specs');
  if (fs.existsSync(specsDir)) {
    const specFiles = fs.readdirSync(specsDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
      .map(dirent => dirent.name);
    
    if (specFiles.length === 0) {
      content += `⚠️ Warning: Specs directory is empty.\n`;
    }
  }
  
  // If no issues found
  if (content === '') {
    content = '✅ No issues found.\n';
  }
  
  return { content, hasErrors };
}