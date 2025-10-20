import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

export const diffCommand: SlashCommand = {
  name: 'diff',
  description: 'Show specification differences for a change',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse change name from args
    const changeName = args.trim();
    
    if (!changeName) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name. Usage: /openspec diff <change-name>',
      };
    }
    
    try {
      const projectRoot = process.cwd();
      const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(changeDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Change "${changeName}" not found. Run /openspec list to see available changes.`,
        };
      }
      
      // Check if specs directory exists
      const specsDir = path.join(changeDir, 'specs');
      if (!fs.existsSync(specsDir)) {
        return {
          type: 'message',
          messageType: 'info',
          content: `No specification deltas found for change "${changeName}".`,
        };
      }
      
      // Read specification deltas
      let content = `# Specification Differences for Change: ${changeName}\n\n`;
      
      const readSpecDiffs = (dir: string, prefix: string = '') => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            readSpecDiffs(fullPath, `${prefix}${item.name}/`);
          } else if (item.isFile() && item.name.endsWith('.md')) {
            const relativePath = `${prefix}${item.name}`;
            content += `## ${relativePath}\n\n`;
            
            try {
              const fileContent = fs.readFileSync(fullPath, 'utf-8');
              if (fileContent.trim()) {
                content += fileContent + '\n\n';
              } else {
                content += '*Empty specification delta*\n\n';
              }
            } catch (error) {
              content += `*Error reading file: ${(error as Error).message}*\n\n`;
            }
          }
        }
      };
      
      readSpecDiffs(specsDir);
      
      if (content === `# Specification Differences for Change: ${changeName}\n\n`) {
        content += 'No specification deltas found.\n';
      }
      
      return {
        type: 'message',
        messageType: 'info',
        content,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to show differences for change "${changeName}": ${(error as Error).message}`,
      };
    }
  },
  completion: async (context, partialArg) => {
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      if (!fs.existsSync(changesDir)) {
        return [];
      }
      
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.toLowerCase() !== 'archive')
        .map(dirent => dirent.name);
      
      return changes.filter(change => change.startsWith(partialArg));
    } catch (_error) {
      return [];
    }
  },
};