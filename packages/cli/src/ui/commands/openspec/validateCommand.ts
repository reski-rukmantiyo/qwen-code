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
      let content = 'Please specify a change name or use --all flag. Available changes:\\n\\n';
      changes.forEach((change, index) => {
        content += `${index + 1}. ${change}\\n`;
      });
      content += '\\nUsage: /openspec validate <change-name> or /openspec validate --all';
      
      return {
        type: 'message',
        messageType: 'info',
        content,
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
          // Process changes with bounded concurrency (max 5 concurrent validations)
          const MAX_CONCURRENT = 5;
          const results: { change: string; result: { content: string; hasErrors: boolean }; }[] = [];
          
          // Process in batches to limit concurrency
          for (let i = 0; i < changes.length; i += MAX_CONCURRENT) {
            const batch = changes.slice(i, i + MAX_CONCURRENT);
            const batchPromises = batch.map(async (change) => {
              const result = await validateChange(projectRoot, change);
              return { change, result };
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
          }
          
          // Sort results by change name to maintain consistent order
          results.sort((a, b) => a.change.localeCompare(b.change));
          
          for (const { change, result } of results) {
            content += `## ${change}\n${result.content}\n`;
            if (result.hasErrors) hasErrors = true;
          }
        }
      } else {
        // Validate specific change
        const result = await validateChange(projectRoot, changeName!);
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

async function validateChange(projectRoot: string, changeName: string): Promise<{ content: string; hasErrors: boolean }> {
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
      } else {
        // For specification files, validate structured format
        if (file === 'proposal.md' || file.endsWith('.md') && filePath.includes('specs')) {
          // Import specification validator
          const { SpecificationValidator } = await import('../../../services/OpenSpecSpecificationValidator.js');
          const validationResult = SpecificationValidator.validateSpecificationFormat(fileContent);
          
          if (!validationResult.isValid) {
            content += `⚠️ Warning: File "${file}" has specification format issues:\n`;
            validationResult.issues.forEach(issue => {
              content += `  - ${issue}\n`;
            });
          }
        }
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
    } else {
      // Validate delta operations in spec files
      for (const file of specFiles) {
        const filePath = path.join(specsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8').trim();
        
        if (fileContent.length > 0) {
          // Import delta operations parser
          const { DeltaOperationsParser } = await import('../../../services/OpenSpecDeltaOperationsParser.js');
          const validationResult = DeltaOperationsParser.validateDeltaFormat(fileContent);
          
          if (!validationResult.isValid) {
            content += `⚠️ Warning: Spec file "${file}" has delta format issues:\n`;
            validationResult.issues.forEach(issue => {
              content += `  - ${issue}\n`;
            });
          }
        }
      }
    }
  }
  
  // If no issues found
  if (content === '') {
    content = '✅ No issues found.\n';
  }
  
  return { content, hasErrors };
}