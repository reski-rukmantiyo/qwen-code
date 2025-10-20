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
  OPENSPEC_AGENTS_MD_TEMPLATE,
  QWEN_CODE_AGENTS_TEMPLATE,
  CLAUDE_AGENTS_TEMPLATE,
  CHATGPT_AGENTS_TEMPLATE,
  GITHUB_COPILOT_AGENTS_TEMPLATE
} from '../../../templates/agentsMdTemplates.js';

// Import chalk for colorful output
import chalk from 'chalk';




// Helper function to detect already configured tools
function detectConfiguredTools(openspecDir: string): string[] {
  const toolsDir = path.join(openspecDir, 'tools');
  if (!fs.existsSync(toolsDir)) {
    return [];
  }
  
  try {
    const toolFiles = fs.readdirSync(toolsDir);
    const configuredTools: string[] = [];
    
    for (const file of toolFiles) {
      if (file.endsWith('-agents.md')) {
        const toolName = file.replace('-agents.md', '');
        configuredTools.push(toolName);
      }
    }
    
    return configuredTools;
  } catch (error) {
    console.warn('Failed to detect configured tools:', error);
    return [];
  }
}

// Helper function to create tool-specific AGENTS.md files
function createToolSpecificAgentsFiles(openspecDir: string, tools: string[] | null = [], extensionMode: boolean = false): void {
  const toolsDir = path.join(openspecDir, 'tools');
  fs.mkdirSync(toolsDir, { recursive: true });
  
  // Normalize tools to empty array if null
  const normalizedTools = tools || [];
  
  // If no tools specified and not in extension mode, create a default set
  let finalTools = normalizedTools;
  if (normalizedTools.length === 0 && !extensionMode) {
    finalTools = ['qwen-code', 'claude', 'chatgpt', 'github-copilot'];
  }
  
  // If in extension mode, pre-select already configured tools
  if (extensionMode) {
    const configuredTools = detectConfiguredTools(openspecDir);
    finalTools = [...new Set([...configuredTools, ...normalizedTools])]; // Merge and deduplicate
  }
  
  // Create tool-specific AGENTS.md files
  for (const tool of finalTools) {
    let templateContent = '';
    
    switch (tool.toLowerCase()) {
      case 'qwen-code':
        templateContent = QWEN_CODE_AGENTS_TEMPLATE;
        break;
      case 'claude':
        templateContent = CLAUDE_AGENTS_TEMPLATE;
        break;
      case 'chatgpt':
        templateContent = CHATGPT_AGENTS_TEMPLATE;
        break;
      case 'github-copilot':
        templateContent = GITHUB_COPILOT_AGENTS_TEMPLATE;
        break;
      default:
        // Create a generic template for unknown tools
        templateContent = `# ${tool.charAt(0).toUpperCase() + tool.slice(1)} Integration Instructions

These instructions are for ${tool} when working with OpenSpec projects.

## Core Principles

1. **Specification-Driven Development**: Always reference specifications in \`openspec/specs/\` before implementing changes
2. **Change Management**: Follow the three-stage workflow (Create, Implement, Archive) for all modifications
3. **Validation First**: Ensure compliance with specifications before implementation
4. **Context Awareness**: Understand that specifications are the source of truth for requirements

## Working with Specifications

### Reading Specifications
- Specifications are located in \`openspec/specs/\` directory
- Each specification follows a structured format with Overview, Requirements, Implementation Details, and Testing sections

## Working with Changes

### Implementing Changes
When implementing changes:
- Follow tasks in \`tasks.md\` in sequential order
- Reference specifications in \`openspec/specs/\` for implementation guidelines
- Validate implementation against change proposals

## Best Practices for ${tool}

1. **Be Explicit**: Clearly state which specifications and requirements you're addressing
2. **Ask Questions**: If anything is unclear, ask for clarification before proceeding
3. **Validate Assumptions**: Double-check your understanding of requirements before implementation
4. **Follow Structure**: Maintain the structured format of specifications and changes
`;
    }
    
    const toolAgentsPath = path.join(toolsDir, `${tool}-agents.md`);
    fs.writeFileSync(toolAgentsPath, templateContent);
  }
}

export const initCommand: SlashCommand = {
  name: 'init',
  description: 'Initialize OpenSpec in your project',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    try {
      const projectRoot = process.cwd();
      
      // Declare variables at the top to avoid scoping issues
      let tools: string[] | null = null;
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
          const toolsDirExists = fs.existsSync(path.join(openspecDir, 'tools'));
          
          // If properly initialized, update instead of failing
          if (sampleSpecExists || sampleChangeExists || toolsDirExists) {
            // Clear cache since we're re-initializing
            const cacheService = getOpenSpecCacheService();
            if (cacheService) {
              cacheService.clearCache();
            }
            
            // If tools were specified, update tool-specific AGENTS.md files
            if (tools !== null) {
              try {
                const toolsArray: string[] = tools || [];
                createToolSpecificAgentsFiles(openspecDir, toolsArray, true); // Use extension mode
                const toolsMessage = toolsArray.length > 0 
                  ? `Updated tool-specific AGENTS.md files for: ${toolsArray.join(', ')}`
                  : "Removed tool-specific AGENTS.md files (none specified)";
                  
                return {
                  type: 'message',
                  messageType: 'info',
                  content: `✅ OpenSpec already initialized. ${toolsMessage}\n\nUse /openspec update to refresh all AGENTS.md files.`,
                };
              } catch (error) {
                return {
                  type: 'message',
                  messageType: 'error',
                  content: `Failed to update tool-specific AGENTS.md files: ${(error as Error).message}`,
                };
              }
            }
            
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
      // description and tools are already declared at the top
      
      // Parse command line arguments
      if (trimmedArgs) {
        const argsArray = trimmedArgs.split(/\s+/);
        let i = 0;
        
        // Check for --tools flag
        while (i < argsArray.length) {
          if (argsArray[i] === '--tools' || argsArray[i] === '-t') {
            i++;
            if (i < argsArray.length) {
              const toolsArg = argsArray[i];
              if (toolsArg === 'all') {
                tools = ['qwen-code', 'claude', 'chatgpt', 'github-copilot'];
              } else if (toolsArg === 'none') {
                tools = [];
              } else {
                tools = toolsArg.split(',').map(tool => tool.trim()).filter(tool => tool.length > 0);
                
                // Validate tool selections
                const validTools = ['qwen-code', 'claude', 'chatgpt', 'github-copilot'];
                const invalidTools = tools.filter(tool => !validTools.includes(tool.toLowerCase()));
                if (invalidTools.length > 0) {
                  return {
                    type: 'message',
                    messageType: 'error',
                    content: `Invalid tools specified: ${invalidTools.join(', ')}. Valid tools are: ${validTools.join(', ')}`,
                  };
                }
                
                // Normalize tool names to lowercase
                tools = tools.map(tool => tool.toLowerCase());
              }
              i++;
            } else {
              return {
                type: 'message',
                messageType: 'error',
                content: 'Please specify tools after --tools flag. Usage: /openspec init [--tools <tool1,tool2|all|none>] [description]',
              };
            }
          } else {
            // Treat remaining args as description
            const remainingArgs = argsArray.slice(i);
            const remainingStr = remainingArgs.join(' ');
            
            // Check if we have a quoted description
            if (remainingStr.startsWith('"') && remainingStr.endsWith('"') && remainingStr.length > 1) {
              description = remainingStr.substring(1, remainingStr.length - 1);
            } else if (remainingStr.startsWith("'") && remainingStr.endsWith("'") && remainingStr.length > 1) {
              description = remainingStr.substring(1, remainingStr.length - 1);
            } else {
              description = remainingStr;
            }
            break;
          }
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
        
        // Create tool-specific AGENTS.md files
        createToolSpecificAgentsFiles(openspecDir, tools, false); // Not in extension mode
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
      const toolsArray: string[] = tools || [];
      const toolsMessage = tools !== null 
        ? `\nTool-specific AGENTS.md files created for: ${toolsArray.length > 0 ? toolsArray.join(', ') : 'no tools (none specified)'}`
        : "\nDefault tool-specific AGENTS.md files created for common AI tools";
      
      return {
        type: 'message',
        messageType: 'info',
        content: `✅ OpenSpec successfully initialized!
${
  hasDescription 
    ? `\nSpecification content was created from your description using ${contentSource} approach.` 
    : "\nNo description provided, using default template."
}
${toolsMessage}

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