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

// Helper function to generate content using LLM with fallback
async function generateContentWithLLM(context: CommandContext, prompt: string): Promise<string> {
  try {
    // Get the LLM client from the config
    const config = context.services.config;
    if (!config) {
      // Fallback to heuristic-based generation if config is not available
      return generateContentWithHeuristics(prompt);
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to heuristic-based generation if LLM client is not available
      return generateContentWithHeuristics(prompt);
    }
    
    // Create a simple prompt for content generation
    const fullPrompt = `${prompt}\n\nPlease provide a concise and well-structured response.`;
    
    // Use the LLM to generate content
    // Note: We're using a simplified approach here since we just need text content
    const response = await geminiClient.generateContent(
      [{ role: 'user', parts: [{ text: fullPrompt }] }],
      {},
      new AbortController().signal
    );
    
    // Extract the text from the response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        if (part.text) {
          return part.text.trim();
        }
      }
    }
    
    // Fallback if no content was generated
    return generateContentWithHeuristics(prompt);
  } catch (error) {
    // Fallback if LLM generation fails
    return generateContentWithHeuristics(prompt);
  }
}

// Helper function to generate content using heuristics (fallback)
function generateContentWithHeuristics(prompt: string): string {
  // Extract the description from the prompt
  const descriptionMatch = prompt.match(/: "(.+)"\s*\n/);
  const description = descriptionMatch ? descriptionMatch[1] : prompt;
  
  // Simple heuristic-based generation based on the prompt content
  if (prompt.includes('specification')) {
    return `# System Specification

## Overview
${description}

## Requirements
- Functional requirements based on the description
- Non-functional requirements for performance and security

## Implementation Details
- Technology stack and architecture
- Implementation guidelines and constraints

## Testing
- Unit testing approach
- Integration testing strategy
- Acceptance criteria`;
  }
  
  // Generic fallback with the requested structure
  return `## Overview
Describe the purpose and scope of this specification.

## Requirements
List the functional and non-functional requirements.

## Implementation Details
Provide implementation guidelines and constraints.

## Testing
Outline testing approaches and acceptance criteria.`;
}

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
      fs.mkdirSync(openspecDir, { recursive: true });
      fs.mkdirSync(specsDir, { recursive: true });
      fs.mkdirSync(changesDir, { recursive: true });
      fs.mkdirSync(archiveDir, { recursive: true });
      
      // Create project.md file with project conventions
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
      
      // Create AGENTS.md files
      try {
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
      } catch (error) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Failed to create AGENTS.md files: ${(error as Error).message}`,
        };
      }
      
      // Create a sample spec file based on description or use default
      let sampleSpecContent: string;
      let usedLLM = false;
      let specFileName = 'sample-spec.md';
      
      if (description) {
        const specPrompt = `Generate a software specification document based on the following description: "${description}". 
        Create a complete specification with these sections:
        1. Overview - Describe the purpose and scope of this specification
        2. Requirements - List the functional and non-functional requirements
        3. Implementation Details - Provide implementation guidelines and constraints
        4. Testing - Outline testing approaches and acceptance criteria
        
        Use proper markdown formatting with appropriate headers. Do not include a top-level title, start directly with ## Overview.
        Each section should have the exact header specified above.`;
        
        sampleSpecContent = await generateContentWithLLM(context, specPrompt);
        // Check if the content was generated by LLM or fell back to heuristics
        // The heuristic fallback contains "Describe the purpose and scope of this specification"
        // while LLM-generated content should be based on the actual description
        usedLLM = !sampleSpecContent.includes("Describe the purpose and scope of this specification") && 
                  sampleSpecContent.includes("## Overview");
      } else {
        sampleSpecContent = `## Overview
Describe the purpose and scope of this specification.

## Requirements
List the functional and non-functional requirements.

## Implementation Details
Provide implementation guidelines and constraints.

## Testing
Outline testing approaches and acceptance criteria.
`;
      }
      
      // Generate a filename based on the description or use default
      if (description && usedLLM) {
        // Use LLM to generate a short, descriptive filename based on the specification content
        try {
          const filenamePrompt = `Based on the following software specification content, generate a short, descriptive filename (without extension) that summarizes the main topic. The filename should be concise (3-5 words max), use only lowercase letters, numbers, and hyphens, and clearly represent the main subject of the specification.
          
          Specification content:
          ${sampleSpecContent}
          
          Provide only the filename without any additional text or explanation.`;
          
          const filenameResponse = await generateContentWithLLM(context, filenamePrompt);
          // Clean up the filename response
          specFileName = filenameResponse
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .substring(0, 30) // Limit to 30 characters
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            + '.md';
            
          // Validate the filename
          if (specFileName === '.md' || specFileName.startsWith('-') || specFileName.length < 5) {
            throw new Error('LLM generated an invalid filename');
          }
        } catch (error) {
          // Inform user about the failure and stop the process
          return {
            type: 'message',
            messageType: 'error',
            content: `Failed to generate a meaningful filename for the specification: ${(error as Error).message}. Please try again with a different description.`,
          };
        }
      } else if (description) {
        // If we have a description but didn't use LLM (fell back to heuristics), 
        // create a filename from the description
        try {
          specFileName = description
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .substring(0, 30) // Limit to 30 characters
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            + '.md';
            
          // Validate the filename
          if (specFileName === '.md' || specFileName.startsWith('-')) {
            throw new Error('Failed to generate a valid filename from description');
          }
        } catch (error) {
          // Inform user about the failure and stop the process
          return {
            type: 'message',
            messageType: 'error',
            content: `Failed to generate a filename for the specification: ${(error as Error).message}. Please try again with a different description.`,
          };
        }
      }
      
      // Create sample spec file in the specs directory
      const sampleSpecPath = path.join(specsDir, specFileName);
      fs.writeFileSync(sampleSpecPath, sampleSpecContent);
      
      // Create a sample change folder to demonstrate the structure
      const sampleChangeDir = path.join(changesDir, 'sample-change');
      fs.mkdirSync(sampleChangeDir, { recursive: true });
      
      // Create sample change files
      const sampleProposalContent = `# Sample Change

## Overview
This is a sample change proposal to demonstrate the structure.

## Motivation
Explain why this change is needed and what problem it solves.

## Implementation Plan
Detail the steps required to implement this change.

## Impact Assessment
Describe the potential impact of this change on the system.
`;
      
      const sampleTasksContent = `# Implementation Tasks

- [ ] Task 1: Describe the first implementation task
- [ ] Task 2: Describe the second implementation task
- [ ] Task 3: Describe the third implementation task
`;
      
      const sampleDesignContent = `# Technical Design for Sample Change

## Approach
Describe the technical approach for implementing this change.

## Architecture
Outline any architectural considerations or changes.

## Dependencies
List any dependencies or prerequisites for this change.
`;
      
      fs.writeFileSync(path.join(sampleChangeDir, 'proposal.md'), sampleProposalContent);
      fs.writeFileSync(path.join(sampleChangeDir, 'tasks.md'), sampleTasksContent);
      fs.writeFileSync(path.join(sampleChangeDir, 'design.md'), sampleDesignContent);
      
      // Create specs directory for the sample change
      const sampleChangeSpecsDir = path.join(sampleChangeDir, 'specs');
      fs.mkdirSync(sampleChangeSpecsDir, { recursive: true });
      
      // Create structured delta template with proper specification formatting
      const sampleSpecDeltaContent = `# Specification Deltas for Change: Sample Change

## ADDED Requirements

### Requirement: [Descriptive Name]
[Requirement description using SHALL/MUST for mandatory requirements]

#### Scenario: [Descriptive Name]
- **WHEN** [specific condition or action]
- **THEN** [expected outcome]

#### Scenario: [Alternative or Edge Case]
- **WHEN** [specific condition or action]
- **THEN** [expected outcome]

## MODIFIED Requirements

### Requirement: [Existing Requirement Name]
[Complete updated requirement description]

#### Scenario: [Descriptive Name]
- **WHEN** [specific condition or action]
- **THEN** [expected outcome]

## REMOVED Requirements

### Requirement: [Deprecated Requirement Name]
**Reason**: [Justification for removal]
**Migration**: [How to handle existing usage]

## RENAMED Requirements
- FROM: \`[Old Requirement Name]\`
- TO: \`[New Requirement Name]\`

---
Specification Format Guidelines:
- Use SHALL/MUST for mandatory requirements
- Use SHOULD/RECOMMENDED for recommended practices  
- Use MAY/OPTIONAL for optional features
- Each requirement MUST have at least one scenario
- Scenarios MUST use the format: #### Scenario: [Name] (4 hashtags)
- WHEN/THEN format MUST be used in scenarios
`;

      fs.writeFileSync(path.join(sampleChangeSpecsDir, 'delta-template.md'), sampleSpecDeltaContent);
      
      // Clear cache since we've created new files
      const cacheService = getOpenSpecCacheService();
      if (cacheService) {
        cacheService.clearCache();
      }
      
      // Provide success feedback
      const hasDescription = !!description;
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
│   └── ${specFileName}     # ${hasDescription && usedLLM ? 'Specification based on your description' : 'Sample specification'}
├── changes/               # Proposed updates (active changes)
│   └── sample-change/     # Sample change folder
│       ├── proposal.md    # Change proposal
│       ├── tasks.md       # Implementation tasks
│       ├── design.md      # Technical design
│       └── specs/         # Specification deltas
│           └── delta-template.md  # Sample spec delta
├── tools/                 # Tool-specific AGENTS.md files
│   ├── qwen-code-agents.md    # Qwen Code integration instructions
│   ├── claude-agents.md       # Claude integration instructions
│   ├── chatgpt-agents.md      # ChatGPT integration instructions
│   └── github-copilot-agents.md  # GitHub Copilot integration instructions
└── archive/               # Completed changes

Next steps:
1. Review and customize the specification file
2. Create your own specifications in specs/
3. Propose changes using /openspec change <change-name>
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