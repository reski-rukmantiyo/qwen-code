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
    // Check files in the selected directory
    const changeDir = path.join(changesDir, selectedDir);
    const files = {
      proposal: path.join(changeDir, 'proposal.md'),
      tasks: path.join(changeDir, 'tasks.md'),
      design: path.join(changeDir, 'design.md')
    };
    
    // Check existence
    interface FileStatus {
      exists: boolean;
      content: string | null;
    }
    
    const fileStatus: Record<string, FileStatus> = {};
    let allFilesExist = true;
    
    for (const [key, filePath] of Object.entries(files)) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        fileStatus[key] = {
          exists: true,
          content: content
        };
      } else {
        fileStatus[key] = {
          exists: false,
          content: null
        };
        allFilesExist = false;
      }
    }
    
    // Always ask for description to generate or update content
    return {
      type: 'dialog',
      dialog: 'openspec_proposal_description_input',
      data: {
        directory: selectedDir,
        fileStatus: fileStatus,
        allFilesExist: allFilesExist
      }
    } as OpenDialogWithDataActionReturn;
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
    // Add a message to inform the user that content generation is starting
    context.ui.addItem({
      type: 'info',
      text: `Generating content for "${selectedDir}"... Please wait.`,
    }, Date.now());
    
    const projectRoot = process.cwd();
    const changesDir = path.join(projectRoot, 'openspec', 'changes');
    const changeDir = path.join(changesDir, selectedDir);
    
    // Ensure the change directory exists
    if (!fs.existsSync(changeDir)) {
      fs.mkdirSync(changeDir, { recursive: true });
    }
    
    // Generate new content based on description
    const newContent = await generateContentFromDescription(context, description, selectedDir);
    
    // Define file paths
    const files = {
      proposal: path.join(changeDir, 'proposal.md'),
      tasks: path.join(changeDir, 'tasks.md'),
      design: path.join(changeDir, 'design.md')
    };
    
    // Always replace content for all files when processing a proposal
    fs.writeFileSync(files.proposal, newContent.proposal);
    fs.writeFileSync(files.tasks, newContent.tasks);
    fs.writeFileSync(files.design, newContent.design);
    
    // Prepare file status information for the user
    const fileStatusInfo = `
File status:
- proposal.md: ✅ created
- tasks.md: ✅ created
- design.md: ✅ created`;
    
    return {
      type: 'message',
      messageType: 'info',
      content: `✅ Processed change proposal for "${selectedDir}"${fileStatusInfo}`
    };
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process description: ${(error as Error).message}`,
    };
  }
}

// Helper function to generate content using LLM or heuristics
async function generateContentFromDescription(context: CommandContext, description: string, changeName: string): Promise<{proposal: string, tasks: string, design: string}> {
  try {
    // Get the LLM client from the config
    const config = context.services.config;
    if (!config) {
      // Fallback to heuristic-based generation if config is not available
      return generateContentWithHeuristics(description, changeName);
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to heuristic-based generation if LLM client is not available
      return generateContentWithHeuristics(description, changeName);
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
    return generateContentWithHeuristics(description, changeName);
  }
}

// Helper function to generate content using heuristics (fallback)
function generateContentWithHeuristics(description: string, changeName: string): {proposal: string, tasks: string, design: string} {
  // For heuristic fallback, we'll use the template structure directly
  // Apply the same filtering to remove tool mentions
  const proposal = filterToolMentions(`# Technical Design for ${changeName}

## Approach
Describe the technical approach for implementing this change.

## Architecture
Outline any architectural considerations or changes.

## Dependencies
List any dependencies or prerequisites for this change.`);
  
  const tasks = filterToolMentions(`# Implementation Tasks

- [ ] Task 1: Describe the first implementation task
  Subagent: [appropriate-subagent-type]
- [ ] Task 2: Describe the second implementation task
  Subagent: [appropriate-subagent-type]
- [ ] Task 3: Describe the third implementation task
  Subagent: [appropriate-subagent-type]`);
  
  const design = filterToolMentions(`# ${changeName}

## Overview
Briefly describe what this change proposes to implement.

## Motivation
Explain why this change is needed and what problem it solves.

## Implementation Plan
Detail the steps required to implement this change.

## Impact Assessment
Describe the potential impact of this change on the system.`);
  
  return {
    proposal,
    tasks,
    design
  };
}

// Helper function to filter out tool mentions from generated content
function filterToolMentions(content: string): string {
  // List of tool names that should not appear in generated documentation
  // Focus on actual tool call patterns rather than just keywords
  const toolPatterns = [
    /\<function=task\>/, /\<function=edit\>/, /\<function=write_file\>/,
    /\<function=read_file\>/, /\<function=search_file_content\>/, /\<function=glob\>/,
    /\<function=run_shell_command\>/, /\<function=save_memory\>/, /\<function=todo_write\>/,
    /\<function=web_fetch\>/,
    // Also catch tool references in prose
    /\busing the [a-zA-Z_]+ tool\b/i,
    /\bthe [a-zA-Z_]+ tool (can|will|should) be used\b/i
  ];
  
  // Remove any lines that contain tool mentions
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => {
    return !toolPatterns.some(pattern => pattern.test(line));
  });
  
  return filteredLines.join('\n');
}

// Helper functions to generate content from descriptions using LLM
async function generateProposalContent(context: CommandContext, description: string, changeName: string): Promise<string> {
  const prompt = `Generate a technical design DOCUMENTATION section for a change proposal with the following description: "${description}".
  IMPORTANT: Focus ONLY on documentation of the technical design. DO NOT include any code implementation details, code examples, or technical implementation specifics.
  IMPORTANT: DO NOT mention any tools or tool names in the documentation.
  IMPORTANT: Do not call any tools and create document only.
  Use this exact template structure:
  
  # Technical Design for ${changeName}
  
  ## Approach
  Describe the approach for DOCUMENTING this technical design.
  
  ## Architecture
  Outline the ARCHITECTURAL DOCUMENTATION considerations.
  
  ## Dependencies
  List any documentation dependencies or prerequisites.`;
  
  const content = await generateContentWithLLM(context, prompt);
  
  // Filter out any tool mentions from the generated content
  return filterToolMentions(content);
}

async function generateTasksContent(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a list of implementation tasks for a change proposal with the following description: "${description}".
  Include BOTH documentation tasks AND source code implementation tasks based on the proposal and design documents.
  For each task, also suggest an appropriate subagent that would be best suited to handle that task.
  IMPORTANT: DO NOT mention any tools or tool names in the task descriptions.
  IMPORTANT: Do not call any tools and create document only.
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
  
  // Filter out any tool mentions from the generated content
  return filterToolMentions(content);
}

async function generateDesignContent(context: CommandContext, description: string, changeName: string): Promise<string> {
  const prompt = `Generate a change proposal DOCUMENTATION with the following description: "${description}".
  IMPORTANT: Focus ONLY on documentation and specifications. DO NOT include any code implementation details, code examples, or technical implementation specifics.
  IMPORTANT: DO NOT mention any tools or tool names in the documentation.
  IMPORTANT: Do not call any tools and create document only.
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
  
  // Filter out any tool mentions from the generated content
  return filterToolMentions(content);
}

// Helper function to generate content using LLM
async function generateContentWithLLM(context: CommandContext, prompt: string): Promise<string> {
  try {
    // Get the LLM client from the config
    const config = context.services.config;
    if (!config) {
      // Fallback to heuristic-based generation if config is not available
      return "# Default Title\n\n## Overview\nDefault overview content.";
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to heuristic-based generation if LLM client is not available
      return "# Default Title\n\n## Overview\nDefault overview content.";
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
    return "# Default Title\n\n## Overview\nDefault overview content.";
  } catch (error) {
    // Fallback if LLM generation fails
    return "# Default Title\n\n## Overview\nDefault overview content.";
  }
}