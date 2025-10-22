/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext, OpenDialogWithDataActionReturn, MessageActionReturn } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

export const proposalCommand: SlashCommand = {
  name: 'proposal',
  description: 'Interactively create and manage OpenSpec change proposals',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    try {
      const projectRoot = process.cwd();
      const openspecDir = path.join(projectRoot, 'openspec');
      const changesDir = path.join(openspecDir, 'changes');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(openspecDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        } as MessageActionReturn;
      }
      
      // Check if changes directory exists, create it if it doesn't
      if (!fs.existsSync(changesDir)) {
        fs.mkdirSync(changesDir, { recursive: true });
      }
      
      // List directories under openspec/changes (excluding archive)
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(changesDir, { withFileTypes: true });
      } catch (error) {
        // If we can't read the directory, treat it as empty
        console.warn(`Could not read changes directory: ${(error as Error).message}`);
      }
      
      const directories = entries
        .filter(entry => entry.isDirectory() && entry.name !== 'archive')
        .map(entry => entry.name);
      
      if (directories.length === 0) {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No change directories found. Create a change first with /openspec change <change-name>',
        } as MessageActionReturn;
      }
      
      // Debug information
      if (context.services.config?.getDebugMode()) {
        console.log(`[DEBUG] Found ${directories.length} change directories: ${directories.join(', ')}`);
      }
      
      // If a directory name was provided in args, use it
      if (args.trim()) {
        const argDir = args.trim();
        if (directories.includes(argDir)) {
          // Continue with the specified directory
          return await processProposalForDirectory(context, argDir, changesDir);
        } else {
          return {
            type: 'message',
            messageType: 'error',
            content: `Change directory "${argDir}" not found. Available directories: ${directories.join(', ')}`,
          } as MessageActionReturn;
        }
      } else {
        // Interactive selection of directory
        return {
          type: 'dialog',
          dialog: 'openspec_proposal_dir_selection',
          data: {
            directories: directories
          }
        } as OpenDialogWithDataActionReturn;
      }
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to process proposal: ${(error as Error).message}`,
      } as MessageActionReturn;
    }
  },
};

// Function to process proposal for a selected directory
async function processProposalForDirectory(context: CommandContext, selectedDir: string, changesDir: string) {
  try {
    // Debug information
    if (context.services.config?.getDebugMode()) {
      console.log(`[DEBUG] Processing proposal for directory: ${selectedDir}`);
    }
    
    // Check files in the selected directory
    const changeDir = path.join(changesDir, selectedDir);
    const files = {
      proposal: path.join(changeDir, 'proposal.md'),
      tasks: path.join(changeDir, 'tasks.md'),
      design: path.join(changeDir, 'design.md')
    };
    
    // Check existence and content
    interface FileStatus {
      exists: boolean;
      content: string | null;
      isTemplate: boolean;
    }
    
    const fileStatus: Record<string, FileStatus> = {};
    let allFilesExist = true;
    
    for (const [key, filePath] of Object.entries(files)) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        fileStatus[key] = {
          exists: true,
          content: content,
          isTemplate: isTemplateContent(content, filePath)
        };
      } else {
        fileStatus[key] = {
          exists: false,
          content: null,
          isTemplate: false
        };
        allFilesExist = false;
      }
    }
    
    // If files don't exist or contain templates, we need to ask for description
    if (!allFilesExist || Object.values(fileStatus).some(status => status.isTemplate)) {
      // Ask for description to generate content
      return {
        type: 'dialog',
        dialog: 'openspec_proposal_description_input',
        data: {
          directory: selectedDir,
          fileStatus: fileStatus,
          allFilesExist: allFilesExist
        }
      } as OpenDialogWithDataActionReturn;
    } else {
      // All files exist and are modified, ask for description to update
      return {
        type: 'dialog',
        dialog: 'openspec_proposal_description_input',
        data: {
          directory: selectedDir,
          fileStatus: fileStatus,
          allFilesExist: allFilesExist
        }
      } as OpenDialogWithDataActionReturn;
    }
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process directory ${selectedDir}: ${(error as Error).message}`,
    } as MessageActionReturn;
  }
}

// Function to process the description and generate/update content
export async function processProposalDescription(context: CommandContext, selectedDir: string, description: string, fileStatus: Record<string, any>, allFilesExist: boolean) {
  try {
    // Debug information
    if (context.services.config?.getDebugMode()) {
      console.log(`[DEBUG] Processing proposal description for directory: ${selectedDir}`);
      console.log(`[DEBUG] Description: ${description}`);
    }
    
    // Add a message to inform the user that content generation is starting
    context.ui.addItem({
      type: 'info',
      text: `Generating documentation content for "${selectedDir}"... Please wait.`,
    }, Date.now());
    
    const projectRoot = process.cwd();
    const changesDir = path.join(projectRoot, 'openspec', 'changes');
    const changeDir = path.join(changesDir, selectedDir);
    
    // Generate new content based on description
    const newContent = await generateContentFromDescription(context, description, selectedDir);
    
    // Check files in the selected directory
    const files = {
      proposal: path.join(changeDir, 'proposal.md'),
      tasks: path.join(changeDir, 'tasks.md'),
      design: path.join(changeDir, 'design.md')
    };
    
    // Update or create files as needed
    if (!fileStatus['proposal'].exists || fileStatus['proposal'].isTemplate) {
      fs.writeFileSync(files.proposal, newContent.proposal);
    }
    
    if (!fileStatus['tasks'].exists || fileStatus['tasks'].isTemplate) {
      fs.writeFileSync(files.tasks, newContent.tasks);
    }
    
    if (!fileStatus['design'].exists || fileStatus['design'].isTemplate) {
      fs.writeFileSync(files.design, newContent.design);
    }
    
    return {
      type: 'message',
      messageType: 'info',
      content: `✅ Processed change proposal for "${selectedDir}"
      
File status:
- proposal.md: ${fileStatus['proposal'] ? (fileStatus['proposal'].exists ? 'exists' : 'missing') : 'missing'} ${fileStatus['proposal'] && fileStatus['proposal'].exists ? (fileStatus['proposal'].isTemplate ? '(template)' : '(modified)') : ''}
- tasks.md: ${fileStatus['tasks'] ? (fileStatus['tasks'].exists ? 'exists' : 'missing') : 'missing'} ${fileStatus['tasks'] && fileStatus['tasks'].exists ? (fileStatus['tasks'].isTemplate ? '(template)' : '(modified)') : ''}
- design.md: ${fileStatus['design'] ? (fileStatus['design'].exists ? 'exists' : 'missing') : 'missing'} ${fileStatus['design'] && fileStatus['design'].exists ? (fileStatus['design'].isTemplate ? '(template)' : '(modified)') : ''}`
    };
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process description: ${(error as Error).message}`,
    };
  }
}

// Function to check if content matches template patterns using structural matching
function isTemplateContent(content: string, filePath: string): boolean {
  // For proposal creation, we'll simply check if the content matches our template
  // This is a simplified approach that just checks for the presence of template sections
  const templateSections = [
    '## Overview',
    '## Motivation',
    '## Implementation Plan',
    '## Impact Assessment'
  ];
  
  // For tasks.md
  if (path.basename(filePath) === 'tasks.md') {
    return content.includes('# Implementation Tasks') && 
           content.includes('- [ ] Task 1:') && 
           content.includes('- [ ] Task 2:') && 
           content.includes('- [ ] Task 3:');
  }
  
  // For design.md
  if (path.basename(filePath) === 'design.md') {
    return content.includes('## Approach') && 
           content.includes('## Architecture') && 
           content.includes('## Dependencies');
  }
  
  // For proposal.md
  return templateSections.every(section => content.includes(section));
}

// Helper function to generate meaningful short name with heuristics (fallback)
export function generateMeaningfulShortNameWithHeuristics(description: string): string {
  // Extract key terms from description
  const words = description.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 5); // Take first 5 significant words
  
  // Join with hyphens and limit length
  return words.join('-').substring(0, 20);
}

// Helper function to generate content using LLM or heuristics
async function generateContentFromDescription(context: CommandContext, description: string, changeName: string): Promise<{proposal: string, tasks: string, design: string}> {
  try {
    // Get the LLM client from the config
    const config = context.services.config;
    if (!config) {
      // Fallback to heuristic-based generation if config is not available
      return generateContentWithHeuristics(description);
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to heuristic-based generation if LLM client is not available
      return generateContentWithHeuristics(description);
    }
    
    // Generate content for each file type
    const [proposal, tasks, design] = await Promise.all([
      generateProposalContent(context, description, changeName),
      generateTasksContent(context, description),
      generateDesignContent(context, description, changeName)
    ]);
    
    return {
      proposal,
      tasks,
      design
    };
  } catch (error) {
    // Fallback if LLM generation fails
    return generateContentWithHeuristics(description);
  }
}

// Helper function to generate content using heuristics (fallback)
function generateContentWithHeuristics(description: string): {proposal: string, tasks: string, design: string} {
  // For heuristic fallback, we'll use the template structure directly
  return {
    proposal: `# ${description}

## Overview
Briefly describe what this change proposes to implement.

## Motivation
Explain why this change is needed and what problem it solves.

## Implementation Plan
Detail the steps required to implement this change.

## Impact Assessment
Describe the potential impact of this change on the system.`,
    tasks: `# Implementation Tasks

- [ ] Task 1: Describe the first implementation task
  Subagent: [appropriate-subagent-type]
- [ ] Task 2: Describe the second implementation task
  Subagent: [appropriate-subagent-type]
- [ ] Task 3: Describe the third implementation task
  Subagent: [appropriate-subagent-type]`,
    design: `# Technical Design for ${description}

## Approach
Describe the technical approach for implementing this change.

## Architecture
Outline any architectural considerations or changes.

## Dependencies
List any dependencies or prerequisites for this change.`
  };
}

// Helper functions to generate content from descriptions using LLM
async function generateProposalContent(context: CommandContext, description: string, changeName: string): Promise<string> {
  const prompt = `Generate a change proposal DOCUMENTATION with the following description: "${description}".
  IMPORTANT: Focus ONLY on documentation and specifications. DO NOT include any code implementation details, code examples, or technical implementation specifics.
  Use this exact template structure:
  
  # ${changeName}
  
  ## Overview
  Briefly describe what this change proposes to DOCUMENT.
  
  ## Motivation
  Explain WHY this documentation is needed and WHAT problem it solves.
  
  ## Implementation Plan
  Detail the steps required to CREATE this documentation.
  
  ## Impact Assessment
  Describe the potential impact of this documentation on the system.`;
  
  const content = await generateContentWithLLM(context, prompt);
  
  // Ensure the content follows the template structure
  if (!content.includes('## Overview') || !content.includes('## Motivation') || 
      !content.includes('## Implementation Plan') || !content.includes('## Impact Assessment')) {
    // Fallback to template if LLM didn't follow structure
    return `# ${changeName}

## Overview
Briefly describe what this change proposes to DOCUMENT.

## Motivation
Explain WHY this documentation is needed and WHAT problem it solves.

## Implementation Plan
Detail the steps required to CREATE this documentation.

## Impact Assessment
Describe the potential impact of this documentation on the system.`;
  }
  
  return content;
}

async function generateTasksContent(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a list of implementation tasks for a change proposal with the following description: "${description}".
  Include BOTH documentation tasks AND source code implementation tasks based on the proposal and design documents.
  For each task, also suggest an appropriate subagent that would be best suited to handle that task.
  Use this exact template structure:
  
  # Implementation Tasks
  
  - [ ] Task 1: Describe the first implementation task
    Subagent: [appropriate-subagent-type]
  - [ ] Task 2: Describe the second implementation task
    Subagent: [appropriate-subagent-type]
  - [ ] Task 3: Describe the third implementation task
    Subagent: [appropriate-subagent-type]
  
  Suggested subagent types:
  - documentation-writer: For documentation tasks
  - react-specialist: For React frontend implementation
  - typescript-monorepo-ai-expert: For TypeScript/JavaScript backend implementation
  - devops-expert: For DevOps/deployment tasks
  - code-reviewer: For code review tasks
  - go-testing-expert: For Go testing implementation
  - golang-expert: For Go implementation`;

  const content = await generateContentWithLLM(context, prompt);
  
  // Ensure the content follows the template structure
  if (!content.includes('# Implementation Tasks') || !content.includes('- [ ]')) {
    // Fallback to template if LLM didn't follow structure
    return `# Implementation Tasks

- [ ] Task 1: Describe the first implementation task
  Subagent: [appropriate-subagent-type]
- [ ] Task 2: Describe the second implementation task
  Subagent: [appropriate-subagent-type]
- [ ] Task 3: Describe the third implementation task
  Subagent: [appropriate-subagent-type]`;
  }
  
  return content;
}

async function generateDesignContent(context: CommandContext, description: string, changeName: string): Promise<string> {
  const prompt = `Generate a technical design DOCUMENTATION section for a change proposal with the following description: "${description}".
  IMPORTANT: Focus ONLY on documentation of the technical design. DO NOT include any code implementation details, code examples, or technical implementation specifics.
  Use this exact template structure:
  
  # Technical Design for ${changeName}
  
  ## Approach
  Describe the approach for DOCUMENTING this technical design.
  
  ## Architecture
  Outline the ARCHITECTURAL DOCUMENTATION considerations.
  
  ## Dependencies
  List any documentation dependencies or prerequisites.`;
  
  const content = await generateContentWithLLM(context, prompt);
  
  // Ensure the content follows the template structure
  if (!content.includes('## Approach') || !content.includes('## Architecture') || 
      !content.includes('## Dependencies')) {
    // Fallback to template if LLM didn't follow structure
    return `# Technical Design for ${changeName}

## Approach
Describe the approach for DOCUMENTING this technical design.

## Architecture
Outline the ARCHITECTURAL DOCUMENTATION considerations.

## Dependencies
List any documentation dependencies or prerequisites.`;
  }
  
  return content;
}

// Helper function to generate content using LLM
async function generateContentWithLLM(context: CommandContext, prompt: string): Promise<string> {
  try {
    // Get the LLM client from the config
    const config = context.services.config;
    if (!config) {
      // Fallback to heuristic-based generation if config is not available
      return generateContentWithHeuristics(prompt).proposal;
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to heuristic-based generation if LLM client is not available
      return generateContentWithHeuristics(prompt).proposal;
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
    return generateContentWithHeuristics(prompt).proposal;
  } catch (error) {
    // Fallback if LLM generation fails
    return generateContentWithHeuristics(prompt).proposal;
  }
}