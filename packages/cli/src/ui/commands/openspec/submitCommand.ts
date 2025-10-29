/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext, SlashCommandActionReturn } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

export const submitCommand: SlashCommand = {
  name: 'submit',
  description: 'Submit a new change proposal with activity type and description, or ask questions about the codebase',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string): Promise<SlashCommandActionReturn> => {
    try {
      // Check if this is a question-mode request with specific syntax
      const trimmedArgs = args.trim();
      if (trimmedArgs.startsWith('"question:') && trimmedArgs.endsWith('"')) {
        console.log('[OpenSpec] Detected deprecated question syntax in submit command');
        return {
          type: "message",
          messageType: "error",
          content: 'The question feature has been deprecated. Please use other tools for asking questions about the codebase.',
        };
      }
      
      const projectRoot = process.cwd();
      const openspecDir = path.join(projectRoot, 'openspec');
      const changesDir = path.join(openspecDir, 'changes');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(openspecDir)) {
        return {
          type: "message",
          messageType: "error",
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      // Check if changes directory exists, create it if it doesn't
      if (!fs.existsSync(changesDir)) {
        fs.mkdirSync(changesDir, { recursive: true });
      }
      
      // Parse arguments
      const argParts = args.trim().split(/\s+/);
      const changeName = argParts[0];
      const activity = argParts[1];
      const description = argParts.slice(2).join(' ');
      
      // Debug logging to understand argument parsing
      console.log(`[OpenSpec Debug] args: "${args}"`);
      console.log(`[OpenSpec Debug] argParts:`, argParts);
      console.log(`[OpenSpec Debug] changeName: "${changeName}"`);
      console.log(`[OpenSpec Debug] activity: "${activity}"`);
      console.log(`[OpenSpec Debug] description: "${description}"`);
      
      // If no arguments provided, list available changes
      if (!changeName) {
        // List directories under openspec/changes (excluding archive)
        let entries: fs.Dirent[] = [];
        try {
          entries = fs.readdirSync(changesDir, { withFileTypes: true });
        } catch (_error) {
          // If we can't read the directory, treat it as empty
          console.warn(`Could not read changes directory: ${(_error as Error).message}`);
        }
        
        const directories = entries
          .filter(entry => entry.isDirectory() && entry.name !== 'archive')
          .map(entry => entry.name);
        
        if (directories.length === 0) {
          return {
            type: "message",
            messageType: "info",
            content: 'No change directories found. Create a change first with /openspec change <change-name>',
          };
        }
        
        // Interactive selection of directory
        return {
          type: 'dialog',
          dialog: 'openspec_submit_change_selection',
          data: {
            directories
          }
        };
      }
      
      // Validate change name exists
      const changeDir = path.join(changesDir, changeName);
      if (!fs.existsSync(changeDir) || !fs.statSync(changeDir).isDirectory()) {
        return {
          type: "message",
          messageType: "error",
          content: `Change "${changeName}" does not exist. Available changes: ${
            fs.readdirSync(changesDir, { withFileTypes: true })
              .filter(entry => entry.isDirectory() && entry.name !== 'archive')
              .map(entry => entry.name)
              .join(', ')
          }`,
        };
      }
      
      // If change name provided but no activity, ask for activity
      if (changeName && !activity) {
        return {
          type: 'dialog',
          dialog: 'openspec_submit_activity_selection',
          data: {
            changeName
          }
        };
      }
      
      // Validate activity
      console.log(`[OpenSpec Debug] Validating activity: "${activity}"`);
      if (activity && activity !== 'bugs' && activity !== 'features' && activity !== 'question') {
        console.log(`[OpenSpec Debug] Invalid activity: "${activity}"`);
        return {
          type: "message",
          messageType: "error",
          content: 'Activity must be either "bugs", "features", or "question"',
        };
      }
      console.log(`[OpenSpec Debug] Valid activity: "${activity}"`);
      
      // If change name and activity provided but no description, ask for description
      if (changeName && activity && !description) {
        // Special handling for question activity - ask for the question directly
        if (activity === 'question') {
          return {
            type: 'dialog',
            dialog: 'openspec_question_input',
            data: {
              changeName
            }
          };
        }
        
        return {
          type: 'dialog',
          dialog: 'openspec_submit_description_input',
          data: {
            changeName,
            activity
          }
        };
      }
      
      // If all arguments provided, process the submission
      if (changeName && activity && description) {
        console.log(`[OpenSpec Debug] All arguments provided, processing submission`);
        console.log(`[OpenSpec Debug] changeName: "${changeName}", activity: "${activity}", description: "${description}"`);
        if (activity === 'question') {
          console.log(`[OpenSpec] Processing question for change "${changeName}": ${description}`);
          // Handle question activity
          const { processQuestion } = await import('./qaHandler.js');
          return await processQuestion(context, description);
        }
        console.log(`[OpenSpec Debug] Not a question, processing as regular submission`);
        return await processSubmission(context, changeName, activity, description, changesDir);
      }
      
      // Default response
      return {
        type: "message",
        messageType: "info",
        content: 'Invalid command usage. Use /openspec submit [change-name] [activity] [description] where activity can be "bugs", "features", or "question"',
      };
    } catch (error) {
      console.error('[OpenSpec] Failed to process submission:', error);
      return {
        type: "message",
        messageType: "error",
        content: `Failed to process submission: ${(error as Error).message}`,
      };
    }
  },
};

// Function to process the submission with all parameters
async function processSubmission(context: CommandContext, changeName: string, activity: string, description: string, changesDir: string): Promise<SlashCommandActionReturn> {
  try {
    // Add a message to inform the user that content generation is starting
    context.ui.addItem({
      type: 'info',
      text: `Processing submission for "${changeName}" (${activity})... Please wait.`,
    }, Date.now());
    
    const changeDir = path.join(changesDir, changeName);
    
    // Ensure the change directory exists
    if (!fs.existsSync(changeDir)) {
      fs.mkdirSync(changeDir, { recursive: true });
    }
    
    // Define file paths
    const files = {
      proposal: path.join(changeDir, 'proposal.md'),
      tasks: path.join(changeDir, 'tasks.md'),
      design: path.join(changeDir, 'design.md')
    };
    
    // Check if proposal.md and design.md exist
    const proposalExists = fs.existsSync(files.proposal);
    const designExists = fs.existsSync(files.design);
    
    if (!proposalExists || !designExists) {
      return {
        type: "message",
        messageType: "error",
        content: `Missing required files in change directory "${changeName}". Both proposal.md and design.md must exist before submitting.`,
      };
    }
    
    // Read existing content
    const proposalContent = fs.readFileSync(files.proposal, 'utf8');
    const designContent = fs.readFileSync(files.design, 'utf8');
    
    // Generate new tasks content based on inputs and existing files
    const newTasksContent = await generateTasksContent(context, changeName, activity, description, proposalContent, designContent);
    
    // Write to tasks.md (append or create)
    let finalTasksContent = newTasksContent;
    if (fs.existsSync(files.tasks)) {
      const existingTasksContent = fs.readFileSync(files.tasks, 'utf8');
      finalTasksContent = existingTasksContent + '\n\n' + newTasksContent;
    }
    
    fs.writeFileSync(files.tasks, finalTasksContent);
    
    return {
      type: "message",
      messageType: "info",
      content: `✅ Successfully submitted "${changeName}" (${activity}) with description: "${description}"\n\nTasks have been added to tasks.md`
    };
  } catch (error) {
    return {
      type: "message",
      messageType: "error",
      content: `Failed to process submission: ${(error as Error).message}`,
    };
  }
}

// Helper function to generate tasks content using LLM or heuristics
async function generateTasksContent(context: CommandContext, changeName: string, activity: string, description: string, proposalContent: string, designContent: string): Promise<string> {
  try {
    // Get the LLM client from the config
    const config = context.services.config;
    if (!config) {
      // Fallback to heuristic-based generation if config is not available
      return generateTasksWithHeuristics(changeName, activity, description);
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to heuristic-based generation if LLM client is not available
      return generateTasksWithHeuristics(changeName, activity, description);
    }
    
    // Generate tasks content
    return await generateTasksWithLLM(context, changeName, activity, description, proposalContent, designContent);
  } catch (_error) {
    // Fallback if LLM generation fails
    return generateTasksWithHeuristics(changeName, activity, description);
  }
}

// Helper function to generate tasks using heuristics (fallback)
function generateTasksWithHeuristics(changeName: string, activity: string, description: string): string {
  const timestamp = new Date().toISOString();
  const tasksHeader = `# Implementation Tasks - ${activity.charAt(0).toUpperCase() + activity.slice(1)} Submission
Generated on: ${timestamp}

Description: ${description}`;

  const tasksContent = `
- [ ] Review and validate the ${activity} submission for "${changeName}"
- [ ] Analyze impact of "${description}" on existing functionality
- [ ] Implement necessary code changes for ${activity} fix/feature
- [ ] Update documentation to reflect ${activity} changes
- [ ] Add unit tests for new ${activity} functionality
- [ ] Perform integration testing of ${activity} changes`;

  return `${tasksHeader}${tasksContent}`;
}

// Helper function to generate tasks using LLM
async function generateTasksWithLLM(context: CommandContext, changeName: string, activity: string, description: string, proposalContent: string, designContent: string): Promise<string> {
  try {
    // Get the LLM client from the config
    const config = context.services.config;
    if (!config) {
      // Fallback to heuristic-based generation if config is not available
      return generateTasksWithHeuristics(changeName, activity, description);
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to heuristic-based generation if LLM client is not available
      return generateTasksWithHeuristics(changeName, activity, description);
    }
    
    const prompt = `Generate implementation tasks for an OpenSpec change based on the following information:
    
Change Name: ${changeName}
Activity Type: ${activity}
Description: ${description}
Subagent: {SUBAGENT name}

Proposal Document:
${proposalContent.substring(0, 1000)}...

Design Document:
${designContent.substring(0, 1000)}...

Please create a list of implementation tasks that would address the ${activity} described. Format the response as a markdown task list with checkboxes. Include tasks for code implementation, testing, and documentation.

IMPORTANT: 
- EXCEPT for SUBAGENT, DO NOT USE TOOLS
- ALWAYS OBEY ./AGENTS.md, ./openspec/project.md, and ./openspec/AGENTS.md. 
- Generate task content only.
- Do not include any explanations or additional text outside of the task list.
- Ensure the tasks are specific to the provided change and activity type.
- Limit the response to 500 words maximum per task
- Use markdown formatting with checkboxes.
- Use appropriate subagent for this.
`;
    
    // Use the LLM to generate content
    const response = await geminiClient.generateContent(
      [{ role: 'user', parts: [{ text: prompt }] }],
      {},
      new AbortController().signal
    );
    
    // Extract the text from the response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        if (part.text) {
          const timestamp = new Date().toISOString();
          return `# Implementation Tasks - ${activity.charAt(0).toUpperCase() + activity.slice(1)} Submission
Generated on: ${timestamp}

Description: ${description}

${part.text.trim()}`;
        }
      }
    }
    
    // Fallback if no content was generated
    return generateTasksWithHeuristics(changeName, activity, description);
  } catch (_error) {
    // Fallback if LLM generation fails
    return generateTasksWithHeuristics(changeName, activity, description);
  }
}

// Export function for processing dialog responses
export async function processSubmitChangeSelection(context: CommandContext, selectedChange: string): Promise<SlashCommandActionReturn> {
  try {
    // After selecting a change, ask for activity type
    return {
      type: 'dialog',
      dialog: 'openspec_submit_activity_selection',
      data: {
        changeName: selectedChange
      }
    };
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process change selection: ${(error as Error).message}`,
    };
  }
}

export async function processSubmitActivitySelection(context: CommandContext, changeName: string, selectedActivity: string): Promise<SlashCommandActionReturn> {
  try {
    // After selecting activity, ask for description
    if (selectedActivity !== 'bugs' && selectedActivity !== 'features' && selectedActivity !== 'question') {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Activity must be either "bugs", "features", or "question"',
      };
    }
    
    // Special handling for question activity - ask for the question directly
    if (selectedActivity === 'question') {
      return {
        type: 'dialog',
        dialog: 'openspec_question_input',
        data: {
          changeName
        }
      };
    }
    
    return {
      type: 'dialog',
      dialog: 'openspec_submit_description_input',
      data: {
        changeName,
        activity: selectedActivity
      }
    };
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process activity selection: ${(error as Error).message}`,
    };
  }
}

export async function processSubmitDescriptionInput(context: CommandContext, changeName: string, activity: string, description: string): Promise<SlashCommandActionReturn> {
  try {
    // After entering description, process the submission
    const projectRoot = process.cwd();
    const changesDir = path.join(projectRoot, 'openspec', 'changes');
    return await processSubmission(context, changeName, activity, description, changesDir);
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process description input: ${(error as Error).message}`,
    };
  }
}

export async function processSubmitQuestionInput(context: CommandContext, changeName: string, question: string): Promise<SlashCommandActionReturn> {
  try {
    console.log(`[OpenSpec] Processing question input for change "${changeName}": ${question}`);
    // Process the question using the QA handler
    const { processQuestion } = await import('./qaHandler.js');
    return await processQuestion(context, question);
  } catch (error) {
    console.error('[OpenSpec] Failed to process question input:', error);
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process question input: ${(error as Error).message}`,
    };
  }
}