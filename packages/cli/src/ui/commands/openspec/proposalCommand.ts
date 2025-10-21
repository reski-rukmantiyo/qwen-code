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
        };
      }
      
      // List directories under openspec/changes (excluding archive)
      const entries = fs.readdirSync(changesDir, { withFileTypes: true });
      const directories = entries
        .filter(entry => entry.isDirectory() && entry.name !== 'archive')
        .map(entry => entry.name);
      
      if (directories.length === 0) {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No change directories found. Create a change first with /openspec change <change-name>',
        };
      }
      
      // For now, we'll just show the available directories
      // In a full implementation, this would be an interactive selection
      let selectedDir = '';
      
      // If a directory name was provided in args, use it
      if (args.trim()) {
        const argDir = args.trim();
        if (directories.includes(argDir)) {
          selectedDir = argDir;
        } else {
          return {
            type: 'message',
            messageType: 'error',
            content: `Change directory "${argDir}" not found. Available directories: ${directories.join(', ')}`,
          };
        }
      } else {
        // If no directory specified, use the first one (in a real implementation, this would be interactive)
        selectedDir = directories[0];
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
      
      for (const [key, filePath] of Object.entries(files)) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          fileStatus[key] = {
            exists: true,
            content: content,
            isTemplate: isTemplateContent(content)
          };
        } else {
          fileStatus[key] = {
            exists: false,
            content: null,
            isTemplate: false
          };
        }
      }
      
      // Ask for description (in a real implementation, this would be interactive)
      const description = "Sample description for updating the change proposal";
      
      // Generate new content based on description
      const newContent = await generateContentFromDescription(context, description);
      
      // Generate diff
      const diff = generateDiff(fileStatus, newContent, selectedDir);
      
      // Save diff to spec directory
      const diffPath = saveDiff(diff, selectedDir, description);
      
      return {
        type: 'message',
        messageType: 'info',
        content: `✅ Processed change proposal for "${selectedDir}"
        
File status:
- proposal.md: ${fileStatus['proposal'] ? (fileStatus['proposal'].exists ? 'exists' : 'missing') : 'missing'} ${fileStatus['proposal'] && fileStatus['proposal'].exists ? (fileStatus['proposal'].isTemplate ? '(template)' : '(modified)') : ''}
- tasks.md: ${fileStatus['tasks'] ? (fileStatus['tasks'].exists ? 'exists' : 'missing') : 'missing'} ${fileStatus['tasks'] && fileStatus['tasks'].exists ? (fileStatus['tasks'].isTemplate ? '(template)' : '(modified)') : ''}
- design.md: ${fileStatus['design'] ? (fileStatus['design'].exists ? 'exists' : 'missing') : 'missing'} ${fileStatus['design'] && fileStatus['design'].exists ? (fileStatus['design'].isTemplate ? '(template)' : '(modified)') : ''}

Diff saved to: ${diffPath}`
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to process proposal: ${(error as Error).message}`,
      };
    }
  },
};

// Function to check if content matches template patterns
function isTemplateContent(content: string): boolean {
  // Check for typical template placeholder phrases
  const templatePhrases = [
    'Briefly describe what this change proposes to implement',
    'Explain why this change is needed and what problem it solves',
    'Detail the steps required to implement this change',
    'Describe the potential impact of this change on the system',
    'Describe the first implementation task',
    'Describe the technical approach for implementing this change',
    'Outline any architectural considerations or changes',
    'List any dependencies or prerequisites for this change'
  ];
  
  return templatePhrases.some(phrase => content.includes(phrase));
}

// Function to generate diff comparison
function generateDiff(originalFiles: Record<string, any>, newContent: any, changeName: string) {
  interface DiffItem {
    file: string;
    type?: string;
    original?: string;
    new?: string;
    content?: string;
    reason?: string;
  }
  
  const diff = {
    added: [] as DiffItem[],
    modified: [] as DiffItem[],
    removed: [] as DiffItem[]
  };
  
  // Compare proposal.md
  if (originalFiles['proposal'] && originalFiles['proposal'].exists) {
    if (originalFiles['proposal'].isTemplate) {
      diff.modified.push({
        file: 'proposal.md',
        type: 'template replacement',
        original: originalFiles['proposal'].content,
        new: newContent.proposal
      });
    } else {
      diff.modified.push({
        file: 'proposal.md',
        type: 'content update',
        original: originalFiles['proposal'].content,
        new: newContent.proposal
      });
    }
  } else {
    diff.added.push({
      file: 'proposal.md',
      content: newContent.proposal
    });
  }
  
  // Compare tasks.md
  if (originalFiles['tasks'] && originalFiles['tasks'].exists) {
    if (originalFiles['tasks'].isTemplate) {
      diff.modified.push({
        file: 'tasks.md',
        type: 'template replacement',
        original: originalFiles['tasks'].content,
        new: newContent.tasks
      });
    } else {
      diff.modified.push({
        file: 'tasks.md',
        type: 'content update',
        original: originalFiles['tasks'].content,
        new: newContent.tasks
      });
    }
  } else {
    diff.added.push({
      file: 'tasks.md',
      content: newContent.tasks
    });
  }
  
  // Compare design.md
  if (originalFiles['design'] && originalFiles['design'].exists) {
    if (originalFiles['design'].isTemplate) {
      diff.modified.push({
        file: 'design.md',
        type: 'template replacement',
        original: originalFiles['design'].content,
        new: newContent.design
      });
    } else {
      diff.modified.push({
        file: 'design.md',
        type: 'content update',
        original: originalFiles['design'].content,
        new: newContent.design
      });
    }
  } else {
    diff.added.push({
      file: 'design.md',
      content: newContent.design
    });
  }
  
  return diff;
}

// Function to save diff to spec directory
function saveDiff(diff: any, changeName: string, description: string): string {
  const projectRoot = process.cwd();
  const changesDir = path.join(projectRoot, 'openspec', 'changes');
  
  // Generate a short name based on description (simplified)
  const shortName = description.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);
  
  // Create spec directory
  const specDir = path.join(changesDir, changeName, 'specs', shortName);
  fs.mkdirSync(specDir, { recursive: true });
  
  // Create diff content
  let diffContent = '# Delta Template\n\n';
  
  if (diff.added.length > 0) {
    diffContent += '## ADDED Requirements\n\n';
    diff.added.forEach((item: any) => {
      diffContent += `### Added file: ${item.file}\n`;
      diffContent += `${item.content}\n\n`;
    });
  }
  
  if (diff.modified.length > 0) {
    diffContent += '## MODIFIED Requirements\n\n';
    diff.modified.forEach((item: any) => {
      diffContent += `### Modified file: ${item.file}\n`;
      diffContent += `Type: ${item.type}\n\n`;
    });
  }
  
  if (diff.removed.length > 0) {
    diffContent += '## REMOVED Requirements\n\n';
    diff.removed.forEach((item: any) => {
      diffContent += `### Removed file: ${item.file}\n`;
      diffContent += `Reason: ${item.reason}\n\n`;
    });
  }
  
  // Save diff file
  const diffFilePath = path.join(specDir, 'spec.md');
  fs.writeFileSync(diffFilePath, diffContent);
  
  return diffFilePath;
}

// Helper function to generate content using LLM or heuristics
async function generateContentFromDescription(context: CommandContext, description: string): Promise<{proposal: string, tasks: string, design: string}> {
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
      generateProposalContent(context, description),
      generateTasksContent(context, description),
      generateDesignContent(context, description)
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
  return {
    proposal: `# Change Proposal\n\n## Overview\n${description}\n\n## Motivation\nThis change is needed to address the requirements described.\n\n## Implementation Plan\n1. Analyze requirements\n2. Design solution\n3. Implement changes\n4. Test functionality\n\n## Impact Assessment\nThis change will improve the system according to the description.`,
    tasks: `# Implementation Tasks\n\n- [ ] Analyze the requirements: ${description}\n- [ ] Design the solution\n- [ ] Implement the changes\n- [ ] Test the functionality\n- [ ] Document the changes`,
    design: `# Technical Design\n\n## Approach\nImplement the solution as described: ${description}\n\n## Architecture\nFollow existing architectural patterns.\n\n## Dependencies\nNone beyond existing system dependencies.`
  };
}

// Helper functions to generate content from descriptions using LLM
async function generateProposalContent(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a change proposal with the following description: "${description}". 
  Include sections for Overview, Motivation, Implementation Plan, and Impact Assessment.`;
  
  return await generateContentWithLLM(context, prompt);
}

async function generateTasksContent(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a list of implementation tasks for a change proposal with the following description: "${description}". 
  Provide 3-5 specific tasks in a markdown checklist format.`;
  
  const tasks = await generateContentWithLLM(context, prompt);
  
  // Ensure the tasks are in checklist format
  if (!tasks.includes('- [ ]')) {
    return `- [ ] ${tasks.replace(/\n/g, '\n- [ ] ')}`;
  }
  
  return tasks;
}

async function generateDesignContent(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a technical design section for a change proposal with the following description: "${description}". 
  Include sections for Approach, Architecture, and Dependencies.`;
  
  return await generateContentWithLLM(context, prompt);
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