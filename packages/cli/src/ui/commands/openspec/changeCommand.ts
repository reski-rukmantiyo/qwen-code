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

export const changeCommand: SlashCommand = {
  name: 'change',
  description: 'Create or modify change proposals',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse change name and description from args
    const trimmedArgs = args.trim();
    let changeName = '';
    let description = '';
    
    // More robust argument parsing that handles quoted strings properly
    // This handles cases where the command processor naively splits on whitespace
    if (!trimmedArgs) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name. Usage: /openspec change <change-name> [description]',
      };
    }
    
    // Handle case where args might have been split incorrectly by command processor
    // We need to reconstruct the original command line
    const parts = trimmedArgs.split(' ');
    
    if (parts.length === 1) {
      // Only a change name provided
      changeName = parts[0];
    } else {
      // Multiple parts - need to determine where change name ends and description begins
      // Look for quotes in the parts to identify where description starts
      let quoteStartIndex = -1;
      let quoteChar = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if ((part.startsWith('"') && part.length > 1 && part.endsWith('"')) || 
            (part.startsWith("'") && part.length > 1 && part.endsWith("'"))) {
          // This part is a complete quoted string
          changeName = parts.slice(0, i).join(' ') || parts[0];
          description = part.substring(1, part.length - 1);
          break;
        } else if (part.startsWith('"') || part.startsWith("'")) {
          // This part starts a quoted string
          quoteStartIndex = i;
          quoteChar = part[0];
          break;
        }
      }
      
      if (quoteStartIndex >= 0) {
        // Found start of quoted description
        if (quoteStartIndex === 0) {
          // First part starts with quote but is the only part - error
          return {
            type: 'message',
            messageType: 'error',
            content: 'Please specify a change name. Usage: /openspec change <change-name> [description]',
          };
        }
        
        // Change name is everything before the quoted part
        changeName = parts.slice(0, quoteStartIndex).join(' ');
        
        // Description is the quoted part plus any following parts until we find the closing quote
        let descriptionParts = [];
        
        for (let i = quoteStartIndex; i < parts.length; i++) {
          const part = parts[i];
          descriptionParts.push(part);
          
          // Check if this part ends with the same quote character
          if (i > quoteStartIndex || part.length > 1) {
            const endQuoteIndex = part.indexOf(quoteChar, i === quoteStartIndex ? 1 : 0);
            if (endQuoteIndex >= 0) {
              break;
            }
          }
        }
        
        if (descriptionParts.length > 0) {
          let descString = descriptionParts.join(' ');
          // Remove surrounding quotes if they match
          if (descString.startsWith(quoteChar) && descString.endsWith(quoteChar) && descString.length > 1) {
            description = descString.substring(1, descString.length - 1);
          } else {
            description = descString;
          }
        }
      } else if (parts.length > 1) {
        // No quotes found, treat first part as change name and rest as description
        changeName = parts[0];
        description = parts.slice(1).join(' ');
      } else {
        // Fallback
        changeName = trimmedArgs;
      }
    }
    
    if (!changeName) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Please specify a change name. Usage: /openspec change <change-name> [description]',
      };
    }
    
    // Validate change name for filesystem compatibility
    if (!/^[a-zA-Z0-9-_]+$/.test(changeName)) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Change name can only contain letters, numbers, hyphens, and underscores.',
      };
    }
    
    try {
      const projectRoot = process.cwd();
      const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      
      // Check if OpenSpec is initialized
      const openspecDir = path.join(projectRoot, 'openspec');
      if (!fs.existsSync(openspecDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      // Check if change already exists
      const isNewChange = !fs.existsSync(changeDir);
      
      if (isNewChange) {
        // Create directory structure
        fs.mkdirSync(changeDir, { recursive: true });
        
        // Generate content based on whether a description was provided
        let proposalContent, tasksContent, designContent;
        
        if (description) {
          // Generate structured content from description using LLM
          const [
            overview,
            motivation,
            implementationPlan,
            impactAssessment,
            tasks,
            approach,
            architecture,
            dependencies
          ] = await Promise.all([
            generateOverviewFromDescription(context, description),
            generateMotivationFromDescription(context, description),
            generateImplementationPlanFromDescription(context, description),
            generateImpactAssessmentFromDescription(context, description),
            generateTasksFromDescription(context, description),
            generateApproachFromDescription(context, description),
            generateArchitectureFromDescription(context, description),
            generateDependenciesFromDescription(context, description)
          ]);
          
          proposalContent = `# ${changeName}

## Overview
${overview}

## Motivation
${motivation}

## Implementation Plan
${implementationPlan}

## Impact Assessment
${impactAssessment}
`;
          
          tasksContent = `# Implementation Tasks

${tasks}
`;
          
          designContent = `# Technical Design for ${changeName}

## Approach
${approach}

## Architecture
${architecture}

## Dependencies
${dependencies}
`;
        } else {
          // Use default templates when no description is provided
          proposalContent = `# ${changeName}

## Overview
Briefly describe what this change proposes to implement.

## Motivation
Explain why this change is needed and what problem it solves.

## Implementation Plan
Detail the steps required to implement this change.

## Impact Assessment
Describe the potential impact of this change on the system.
`;
          
          tasksContent = `# Implementation Tasks

- [ ] Task 1: Describe the first implementation task
- [ ] Task 2: Describe the second implementation task
- [ ] Task 3: Describe the third implementation task
`;
          
          designContent = `# Technical Design for ${changeName}

## Approach
Describe the technical approach for implementing this change.

## Architecture
Outline any architectural considerations or changes.

## Dependencies
List any dependencies or prerequisites for this change.
`;
        }
        
        fs.writeFileSync(path.join(changeDir, 'proposal.md'), proposalContent);
        fs.writeFileSync(path.join(changeDir, 'tasks.md'), tasksContent);
        fs.writeFileSync(path.join(changeDir, 'design.md'), designContent);
        
        // Create specs directory
        const specsDir = path.join(changeDir, 'specs');
        fs.mkdirSync(specsDir, { recursive: true });
        
        // Create structured delta template
        const specDeltaContent = `# Delta Operations for Change: ${changeName}

## [ADDED] New Feature or Section

Description of what is being added.

### Details
- Specific details about the addition
- Implementation considerations

## [MODIFIED] Existing Feature

Description of what is being modified.

### Before
Previous implementation details

### After
New implementation details

## [REMOVED] Deprecated Feature

Description of what is being removed.

### Reason
Justification for removal

## [RENAMED] Old Name -> New Name

Description of what is being renamed.

### Previous
Description of the previous name/context

### Updated
Description of the new name/context
`;

        fs.writeFileSync(path.join(specsDir, 'delta-template.md'), specDeltaContent);
        
        // Provide feedback
        return {
          type: 'message',
          messageType: 'info',
          content: `✅ Created new change proposal: ${changeName}${description ? ' with generated content from description' : ''}

Files created:
- proposal.md - Describe what and why you're changing
- tasks.md - List implementation tasks for AI assistants
- design.md - Document technical design decisions
- specs/ - Directory for specification deltas
  - delta-template.md - Template for structured delta operations

Next steps:
1. Edit the files to define your change
2. Replace delta-template.md with your actual specification deltas using the structured format
3. Use /openspec show ${changeName} to view your change
`,
        };
      } else {
        // Change already exists, provide feedback
        return {
          type: 'message',
          messageType: 'info',
          content: `Change proposal "${changeName}" already exists.

Files:
- proposal.md - Describe what and why you're changing
- tasks.md - List implementation tasks for AI assistants
- design.md - Document technical design decisions
- specs/ - Directory for specification deltas

Use /openspec show ${changeName} to view your change.
`,
        };
      }
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to create/change proposal "${changeName}": ${(error as Error).message}`,
      };
    }
  },
};

// Helper function to generate content using LLM
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
  if (prompt.includes('brief overview')) {
    // Simple heuristic: First sentence becomes overview
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length > 0 ? sentences[0].trim() + '.' : 'Briefly describe what this change proposes to implement.';
  }
  
  if (prompt.includes('motivation')) {
    // Look for words indicating motivation like "to", "for", "because"
    if (description.toLowerCase().includes(' to ')) {
      const parts = description.split(/ to /i);
      if (parts.length > 1) {
        return `This change is needed ${parts.slice(1).join(' to ').trim()}${description.endsWith('.') ? '' : '.'}`;
      }
    }
    if (description.toLowerCase().includes(' because ')) {
      const parts = description.split(/ because /i);
      if (parts.length > 1) {
        return `This change addresses the issue that ${parts.slice(1).join(' because ').trim()}${description.endsWith('.') ? '' : '.'}`;
      }
    }
    return 'Explain why this change is needed and what problem it solves.';
  }
  
  if (prompt.includes('implementation plan')) {
    // Look for implementation keywords
    if (description.toLowerCase().includes(' by ')) {
      const parts = description.split(/ by /i);
      if (parts.length > 1) {
        return `Implement this change ${parts.slice(1).join(' by ').trim()}${description.endsWith('.') ? '' : '.'}`;
      }
    }
    return 'Detail the steps required to implement this change.';
  }
  
  if (prompt.includes('impact assessment')) {
    // Look for impact keywords
    if (description.toLowerCase().includes(' will ')) {
      const parts = description.split(/ will /i);
      if (parts.length > 1) {
        return `This change will ${parts.slice(1).join(' will ').trim()}${description.endsWith('.') ? '' : '.'}`;
      }
    }
    return 'Describe the potential impact of this change on the system.';
  }
  
  if (prompt.includes('implementation tasks')) {
    // Extract potential tasks from description
    const tasks: string[] = [];
    
    // Simple heuristics for identifying tasks
    if (description.toLowerCase().includes('add')) {
      tasks.push('- [ ] Add new features as described');
    }
    if (description.toLowerCase().includes('modify') || description.toLowerCase().includes('update')) {
      tasks.push('- [ ] Modify existing components as needed');
    }
    if (description.toLowerCase().includes('remove') || description.toLowerCase().includes('delete')) {
      tasks.push('- [ ] Remove deprecated functionality');
    }
    if (description.toLowerCase().includes('test')) {
      tasks.push('- [ ] Implement tests for new functionality');
    }
    if (description.toLowerCase().includes('document')) {
      tasks.push('- [ ] Update documentation');
    }
    
    // Add generic tasks if none were identified
    if (tasks.length === 0) {
      tasks.push('- [ ] Task 1: Describe the first implementation task');
      tasks.push('- [ ] Task 2: Describe the second implementation task');
      tasks.push('- [ ] Task 3: Describe the third implementation task');
    }
    
    return tasks.join('\n');
  }
  
  if (prompt.includes('technical approach')) {
    // Look for technical approach indicators
    if (description.toLowerCase().includes('using')) {
      const parts = description.split(/ using /i);
      if (parts.length > 1) {
        return `Implement using ${parts.slice(1).join(' using ').trim()}${description.endsWith('.') ? '' : '.'}`;
      }
    }
    return 'Describe the technical approach for implementing this change.';
  }
  
  if (prompt.includes('architecture')) {
    // Look for architecture indicators
    if (description.toLowerCase().includes('architecture') || description.toLowerCase().includes('structure')) {
      return `Based on the description, the architecture will need to accommodate: ${description}`;
    }
    return 'Outline any architectural considerations or changes.';
  }
  
  if (prompt.includes('dependencies')) {
    // Look for dependency indicators
    if (description.toLowerCase().includes('depend') || description.toLowerCase().includes('require')) {
      return `Based on the description, this change may require: ${description}`;
    }
    return 'List any dependencies or prerequisites for this change.';
  }
  
  // Generic fallback
  return 'Generated content based on description: ' + description;
}

// Helper functions to generate content from descriptions using LLM
async function generateOverviewFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a brief overview for a change proposal with the following description: "${description}". 
  The overview should be a single sentence that captures the essence of the change.`;
  
  return await generateContentWithLLM(context, prompt);
}

async function generateMotivationFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a motivation section for a change proposal with the following description: "${description}". 
  Explain why this change is needed and what problem it solves.`;
  
  return await generateContentWithLLM(context, prompt);
}

async function generateImplementationPlanFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate an implementation plan for a change proposal with the following description: "${description}". 
  Detail the steps required to implement this change.`;
  
  return await generateContentWithLLM(context, prompt);
}

async function generateImpactAssessmentFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate an impact assessment for a change proposal with the following description: "${description}". 
  Describe the potential impact of this change on the system.`;
  
  return await generateContentWithLLM(context, prompt);
}

async function generateTasksFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a list of implementation tasks for a change proposal with the following description: "${description}". 
  Provide 3-5 specific tasks in a markdown checklist format.`;
  
  const tasks = await generateContentWithLLM(context, prompt);
  
  // Ensure the tasks are in checklist format
  if (!tasks.includes('- [ ]')) {
    return `- [ ] ${tasks.replace(/\n/g, '\n- [ ] ')}`;
  }
  
  return tasks;
}

async function generateApproachFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a technical approach section for a change proposal with the following description: "${description}". 
  Describe the technical approach for implementing this change.`;
  
  return await generateContentWithLLM(context, prompt);
}

async function generateArchitectureFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate an architecture section for a change proposal with the following description: "${description}". 
  Outline any architectural considerations or changes.`;
  
  return await generateContentWithLLM(context, prompt);
}

async function generateDependenciesFromDescription(context: CommandContext, description: string): Promise<string> {
  const prompt = `Generate a dependencies section for a change proposal with the following description: "${description}". 
  List any dependencies or prerequisites for this change.`;
  
  return await generateContentWithLLM(context, prompt);
}