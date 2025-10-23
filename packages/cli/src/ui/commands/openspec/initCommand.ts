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
import { getOpenSpecCacheService } from '../../hooks/useOpenSpecWatcher.js';

// Import AGENTS.md templates
import { 
  ROOT_AGENTS_MD_TEMPLATE, 
  OPENSPEC_AGENTS_MD_TEMPLATE
} from '../../../templates/agentsMdTemplates.js';

// Import chalk for colorful output
import chalk from 'chalk';








export const initCommand: SlashCommand = {
  name: 'init',
  description: 'Initialize OpenSpec in your project',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    try {
      const projectRoot = process.cwd();
      
      // Declare variables at the top to avoid scoping issues
      let description = '';
      
      // Check Node.js version compatibility
      const nodeVersion = process.version;
      const versionMatch = nodeVersion.match(/^v(\d+)\.(\d+)\.(\d+)/);
      
      if (versionMatch) {
        const major = parseInt(versionMatch[1], 10);
        const minor = parseInt(versionMatch[2], 10);
        
        // Require Node.js >= 20.19.0
        if (major < 20 || (major === 20 && minor < 19)) {
          return {
            type: 'message',
            messageType: 'error',
            content: `OpenSpec requires Node.js >= 20.19.0. Current version: ${nodeVersion}`,
          };
        }
      }
      
      // Create OpenSpec directory structure
      const openspecDir = path.join(projectRoot, 'openspec');
      const specsDir = path.join(openspecDir, 'specs');
      const changesDir = path.join(openspecDir, 'changes');
      const archiveDir = path.join(openspecDir, 'archive');
      
      // Check if OpenSpec is already initialized
      if (fs.existsSync(openspecDir)) {
        // Check if it's already an OpenSpec directory
        const requiredDirs = [specsDir, changesDir, archiveDir];
        const requiredFiles = [path.join(openspecDir, 'project.md')];
        const allDirsExist = requiredDirs.every(dir => fs.existsSync(dir));
        const allFilesExist = requiredFiles.every(file => fs.existsSync(file));
        
        if (allDirsExist && allFilesExist) {
          // Check for sample files to determine if it's properly initialized
          const sampleSpecExists = fs.existsSync(path.join(specsDir, 'sample-spec.md')) || 
                                  fs.readdirSync(specsDir).some(file => file.endsWith('.md'));
          const sampleChangeExists = fs.existsSync(path.join(changesDir, 'sample-change'));
          
          // If properly initialized, update instead of failing
          if (sampleSpecExists || sampleChangeExists) {
            // Clear cache since we're re-initializing
            const cacheService = getOpenSpecCacheService();
            if (cacheService) {
              cacheService.clearCache();
            }
            
            // This section previously handled tool-specific updates (now removed)
            // Always return the same message for backward compatibility
            return {
              type: 'message',
              messageType: 'info',
              content: '✅ OpenSpec is already initialized in this project.',
            };
            
            return {
              type: 'message',
              messageType: 'info',
              content: '✅ OpenSpec is already initialized in this project.',
            };
          }
        } else {
          return {
            type: 'message',
            messageType: 'error',
            content: '❌ An "openspec" directory already exists but does not have the expected structure. Please remove it or initialize in a different directory.',
          };
        }
      }
      
      // Parse description from args if provided
      const trimmedArgs = args.trim();
      // description is already declared at the top
      
      // Parse command line arguments
      if (trimmedArgs) {
        const argsArray = trimmedArgs.split(/\s+/);
        
        // Treat all args as description
        const remainingStr = argsArray.join(' ');
        
        // Check if we have a quoted description
        if (remainingStr.startsWith('"') && remainingStr.endsWith('"') && remainingStr.length > 1) {
          description = remainingStr.substring(1, remainingStr.length - 1);
        } else if (remainingStr.startsWith("'") && remainingStr.endsWith("'") && remainingStr.length > 1) {
          description = remainingStr.substring(1, remainingStr.length - 1);
        } else {
          description = remainingStr;
        }
      }
      
      // Create directory structure
      console.log(chalk.blue('📁 Creating OpenSpec directory structure...'));
      fs.mkdirSync(openspecDir, { recursive: true });
      fs.mkdirSync(specsDir, { recursive: true });
      fs.mkdirSync(changesDir, { recursive: true });
      fs.mkdirSync(archiveDir, { recursive: true });
      console.log(chalk.green('✅ Directory structure created successfully'));
      
      // Create project.md file with project conventions
      console.log(chalk.blue('📄 Creating project.md file...'));
      const projectMdPath = path.join(openspecDir, 'project.md');
      const projectMdContent = `# Project Conventions

This file defines the project-specific conventions and guidelines for using OpenSpec in this project.

## Naming Conventions

- Change folders should use verb-led prefixes (add-, update-, remove-, refactor-)
- Use kebab-case for all file and directory names
- Specification files should be named descriptively and match their content

## Specification Guidelines

- All specifications should follow the standard OpenSpec format
- Include concrete examples and scenarios for all requirements
- Use normative language (SHALL/MUST, SHOULD/RECOMMENDED, MAY/OPTIONAL)

## Change Management

- Create small, focused changes (<100 lines of new code per change)
- Prefer single-file implementations until proven insufficient
- Write clear, actionable task descriptions

## Review Process

- All changes should be reviewed before implementation
- Validate changes with \`/openspec validate\` before applying
- Archive completed changes with \`/openspec archive\`

## Team-Specific Notes

Add any project-specific notes, conventions, or guidelines here.
`;
      fs.writeFileSync(projectMdPath, projectMdContent);
      console.log(chalk.green('✅ project.md created successfully'));
      
      // Create AGENTS.md files
      try {
        console.log(chalk.blue('🤖 Creating AGENTS.md files...'));
        // Create root-level AGENTS.md (universal stub)
        const rootAgentsPath = path.join(projectRoot, 'AGENTS.md');
        
        // Check if parent directory exists (should be guaranteed by process.cwd())
        if (!fs.existsSync(path.dirname(rootAgentsPath))) {
          throw new Error(`Parent directory for root AGENTS.md does not exist: ${path.dirname(rootAgentsPath)}`);
        }
        
        // Write root-level AGENTS.md file
        fs.writeFileSync(rootAgentsPath, ROOT_AGENTS_MD_TEMPLATE);
        
        // Create OpenSpec instructions AGENTS.md
        const openSpecAgentsPath = path.join(openspecDir, 'AGENTS.md');
        
        // Check if parent directory exists (should be guaranteed by mkdirSync above)
        if (!fs.existsSync(path.dirname(openSpecAgentsPath))) {
          throw new Error(`Parent directory for OpenSpec AGENTS.md does not exist: ${path.dirname(openSpecAgentsPath)}`);
        }
        
        // Write OpenSpec instructions AGENTS.md file
        fs.writeFileSync(openSpecAgentsPath, OPENSPEC_AGENTS_MD_TEMPLATE);
        
        console.log(chalk.green('✅ AGENTS.md files created successfully'));
      } catch (error) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Failed to create AGENTS.md files: ${(error as Error).message}`,
        };
      }
      
      // Clear cache since we've created new files
      console.log(chalk.blue('🧹 Clearing OpenSpec cache...'));
      const cacheService = getOpenSpecCacheService();
      if (cacheService) {
        cacheService.clearCache();
      }
      console.log(chalk.green('✅ Cache cleared successfully'));
      
      // Provide success feedback
      const hasDescription = !!description;
      const usedLLM = false; // Flag indicating if LLM was used (currently always false since we removed the LLM functionality)
      const contentSource = usedLLM ? "LLM-generated" : "template";
      
      return {
        type: 'message',
        messageType: 'info',
        content: `✅ OpenSpec successfully initialized!
${
  hasDescription 
    ? `\nSpecification content was created from your description using ${contentSource} approach.` 
    : "\nNo description provided, using default template."
}

Created directory structure:
openspec/
├── AGENTS.md              # AI assistant instructions
├── project.md             # Project conventions
├── specs/                 # Current source-of-truth specifications
├── changes/               # Proposed updates (active changes)
└── archive/               # Completed changes

Next steps:
1. Create your own specifications in specs/
2. Propose changes using /openspec change <change-name>
`,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to initialize OpenSpec: ${(error as Error).message}`,
      };
    }
  },
};