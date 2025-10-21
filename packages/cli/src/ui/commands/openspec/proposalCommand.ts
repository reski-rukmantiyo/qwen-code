/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext, OpenDialogWithDataActionReturn, MessageActionReturn } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
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
    
    // Check existence and content
    interface FileStatus {
      exists: boolean;
      content: string | null;
      isTemplate: boolean;
      hash: string | null;
    }
    
    const fileStatus: Record<string, FileStatus> = {};
    let allFilesExist = true;
    
    for (const [key, filePath] of Object.entries(files)) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        fileStatus[key] = {
          exists: true,
          content: content,
          isTemplate: isTemplateContent(content, filePath),
          hash: calculateContentHash(content)
        };
      } else {
        fileStatus[key] = {
          exists: false,
          content: null,
          isTemplate: false,
          hash: null
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
    const projectRoot = process.cwd();
    const changesDir = path.join(projectRoot, 'openspec', 'changes');
    const changeDir = path.join(changesDir, selectedDir);
    
    // Generate new content based on description
    const newContent = await generateContentFromDescription(context, description);
    
    // Check files in the selected directory
    const files = {
      proposal: path.join(changeDir, 'proposal.md'),
      tasks: path.join(changeDir, 'tasks.md'),
      design: path.join(changeDir, 'design.md')
    };
    
    // Generate diff
    const diff = generateDiff(fileStatus, newContent, selectedDir);
    
    // Save diff to spec directory
    const diffPath = await saveDiff(context, diff, selectedDir, description);
    
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
- design.md: ${fileStatus['design'] ? (fileStatus['design'].exists ? 'exists' : 'missing') : 'missing'} ${fileStatus['design'] && fileStatus['design'].exists ? (fileStatus['design'].isTemplate ? '(template)' : '(modified)') : ''}

Diff saved to: ${diffPath}`
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
  
  // Count how many template phrases are present
  const templatePhraseCount = templatePhrases.filter(phrase => content.includes(phrase)).length;
  
  // If more than half of the template phrases are present, consider it a template
  // But also check for structural patterns that indicate a template
  const hasTemplateStructure = checkTemplateStructure(content);
  
  // Additionally, check if the content matches known template files by hash
  const isKnownTemplate = isKnownTemplateFile(content, filePath);
  
  return templatePhraseCount > templatePhrases.length / 2 || hasTemplateStructure || isKnownTemplate;
}

// Function to check if content matches known template files by hash
function isKnownTemplateFile(content: string, filePath: string): boolean {
  // Calculate hash of current content
  const currentHash = calculateContentHash(content);
  
  // Known template hashes for different file types
  const knownTemplateHashes: Record<string, string[]> = {
    'proposal.md': [
      // Hash of the default proposal template
      'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890' // Placeholder hash
    ],
    'tasks.md': [
      // Hash of the default tasks template
      'b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890a' // Placeholder hash
    ],
    'design.md': [
      // Hash of the default design template
      'c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890ab' // Placeholder hash
    ]
  };
  
  // Extract filename from path
  const fileName = path.basename(filePath);
  
  // Check if the hash matches any known template hash for this file type
  if (knownTemplateHashes[fileName]) {
    return knownTemplateHashes[fileName].includes(currentHash);
  }
  
  return false;
}

// Function to check for template structural patterns
function checkTemplateStructure(content: string): boolean {
  // Check for common template structural patterns
  const lines = content.split('\n');
  
  // Count lines that look like template placeholders
  const placeholderLines = lines.filter(line => {
    // Lines with brackets or placeholder-like text
    return /\{\{.*\}\}/.test(line) || 
           /\[.*\]/.test(line) || 
           line.includes('TODO') ||
           line.includes('FIXME') ||
           line.includes('placeholder') ||
           line.includes('fill in') ||
           line.includes('describe here');
  }).length;
  
  // Count lines with common template section headers
  const templateHeaders = lines.filter(line => {
    return line.startsWith('## Overview') ||
           line.startsWith('## Motivation') ||
           line.startsWith('## Implementation') ||
           line.startsWith('## Impact') ||
           line.startsWith('# Implementation Tasks') ||
           line.startsWith('## Approach') ||
           line.startsWith('## Architecture') ||
           line.startsWith('## Dependencies');
  }).length;
  
  // Check if content has a high ratio of placeholder-like lines or template headers
  const placeholderRatio = placeholderLines / lines.length;
  const headerRatio = templateHeaders / lines.length;
  
  // Consider it a template if either ratio is high enough
  return placeholderRatio > 0.1 || headerRatio > 0.1;
}

// Function to calculate content hash for comparison
function calculateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Function to generate diff comparison with proper line-by-line analysis
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
      // Check if content has actually changed using hash comparison
      const originalHash = originalFiles['proposal'].hash;
      const newHash = calculateContentHash(newContent.proposal);
      
      if (originalHash !== newHash) {
        // Generate line-by-line diff
        const lineDiff = generateLineDiff(
          originalFiles['proposal'].content || '',
          newContent.proposal
        );
        
        diff.modified.push({
          file: 'proposal.md',
          type: 'content update',
          original: originalFiles['proposal'].content,
          new: newContent.proposal,
          content: lineDiff
        });
      }
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
      // Check if content has actually changed using hash comparison
      const originalHash = originalFiles['tasks'].hash;
      const newHash = calculateContentHash(newContent.tasks);
      
      if (originalHash !== newHash) {
        // Generate line-by-line diff
        const lineDiff = generateLineDiff(
          originalFiles['tasks'].content || '',
          newContent.tasks
        );
        
        diff.modified.push({
          file: 'tasks.md',
          type: 'content update',
          original: originalFiles['tasks'].content,
          new: newContent.tasks,
          content: lineDiff
        });
      }
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
      // Check if content has actually changed using hash comparison
      const originalHash = originalFiles['design'].hash;
      const newHash = calculateContentHash(newContent.design);
      
      if (originalHash !== newHash) {
        // Generate line-by-line diff
        const lineDiff = generateLineDiff(
          originalFiles['design'].content || '',
          newContent.design
        );
        
        diff.modified.push({
          file: 'design.md',
          type: 'content update',
          original: originalFiles['design'].content,
          new: newContent.design,
          content: lineDiff
        });
      }
    }
  } else {
    diff.added.push({
      file: 'design.md',
      content: newContent.design
    });
  }
  
  return diff;
}

// Function to generate line-by-line diff using a simple algorithm
function generateLineDiff(original: string, modified: string): string {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  // Simple diff algorithm - in a real implementation, you might want to use a more sophisticated algorithm
  const diffLines = [];
  let i = 0, j = 0;
  
  while (i < originalLines.length || j < modifiedLines.length) {
    if (i < originalLines.length && j < modifiedLines.length) {
      if (originalLines[i] === modifiedLines[j]) {
        // Lines are the same
        diffLines.push(`  ${originalLines[i]}`);
        i++;
        j++;
      } else {
        // Lines are different - check if this is an addition, deletion, or modification
        // Simple heuristic: if the next line in original matches current line in modified, it's a deletion
        if (i + 1 < originalLines.length && originalLines[i + 1] === modifiedLines[j]) {
          diffLines.push(`- ${originalLines[i]}`);
          i++;
        }
        // If the next line in modified matches current line in original, it's an addition
        else if (j + 1 < modifiedLines.length && modifiedLines[j + 1] === originalLines[i]) {
          diffLines.push(`+ ${modifiedLines[j]}`);
          j++;
        }
        // Otherwise, it's a modification
        else {
          diffLines.push(`- ${originalLines[i]}`);
          diffLines.push(`+ ${modifiedLines[j]}`);
          i++;
          j++;
        }
      }
    } else if (i < originalLines.length) {
      // Remaining lines in original (deletions)
      diffLines.push(`- ${originalLines[i]}`);
      i++;
    } else if (j < modifiedLines.length) {
      // Remaining lines in modified (additions)
      diffLines.push(`+ ${modifiedLines[j]}`);
      j++;
    }
  }
  
  return diffLines.join('\n');
}

// Function to save diff to spec directory with proper specification format
async function saveDiff(context: CommandContext, diff: any, changeName: string, description: string): Promise<string> {
  const projectRoot = process.cwd();
  const changesDir = path.join(projectRoot, 'openspec', 'changes');
  
  // Generate a meaningful short name based on description
  let shortName = await generateMeaningfulShortName(context, description);
  
  // Ensure uniqueness of the short name
  const specBaseDir = path.join(changesDir, changeName, 'specs');
  let counter = 1;
  let uniqueShortName = shortName;
  while (fs.existsSync(path.join(specBaseDir, uniqueShortName))) {
    uniqueShortName = `${shortName}-${counter}`;
    counter++;
  }
  shortName = uniqueShortName;
  
  // Create spec directory
  const specDir = path.join(specBaseDir, shortName);
  fs.mkdirSync(specDir, { recursive: true });
  
  // Create diff content in structured specification format
  let diffContent = '# Delta Template\n\n';
  
  if (diff.added.length > 0) {
    diffContent += '## ADDED Requirements\n\n';
    diffContent += '### Requirement: New Content Files\n';
    diffContent += 'The application SHALL create new content files when they do not exist.\n\n';
    
    diffContent += '#### Scenario: Files do not exist\n';
    diffContent += '- **WHEN** a user runs the proposal command on a change directory with missing files\n';
    diffContent += '- **THEN** the system SHALL generate new content files based on the provided description\n\n';
    
    diff.added.forEach((item: any) => {
      diffContent += `#### Scenario: Create ${item.file}\n`;
      diffContent += `- **WHEN** the ${item.file} file is missing\n`;
      diffContent += `- **THEN** the system SHALL create the ${item.file} file with generated content\n\n`;
    });
  }
  
  if (diff.modified.length > 0) {
    diffContent += '## MODIFIED Requirements\n\n';
    diffContent += '### Requirement: Update Existing Content\n';
    diffContent += 'The application SHALL update existing content files based on new descriptions.\n\n';
    
    diffContent += '#### Scenario: Template content detected\n';
    diffContent += '- **WHEN** existing files contain template placeholder content\n';
    diffContent += '- **THEN** the system SHALL replace the template content with generated content\n\n';
    
    diffContent += '#### Scenario: Modified content detected\n';
    diffContent += '- **WHEN** existing files contain user-modified content\n';
    diffContent += '- **THEN** the system SHALL generate a diff of changes and save it as a specification delta\n\n';
    
    diff.modified.forEach((item: any) => {
      if (item.type === 'template replacement') {
        diffContent += `#### Scenario: Update ${item.file} template\n`;
        diffContent += `- **WHEN** the ${item.file} file contains template content\n`;
        diffContent += `- **THEN** the system SHALL replace the template with generated content\n\n`;
      } else {
        diffContent += `#### Scenario: Update ${item.file} content\n`;
        diffContent += `- **WHEN** the ${item.file} file contains modified content\n`;
        diffContent += `- **THEN** the system SHALL generate a specification delta documenting the changes\n\n`;
        
        // Add line-by-line diff information if available
        if (item.content) {
          diffContent += `#### Scenario: Line-by-line changes in ${item.file}\n`;
          diffContent += `- **WHEN** the system detects line-by-line changes in ${item.file}\n`;
          diffContent += `- **THEN** the system SHALL document the specific changes in the specification delta\n\n`;
          
          diffContent += `##### Line-by-Line Diff for ${item.file}\n`;
          diffContent += '```\n';
          diffContent += item.content;
          diffContent += '\n```\n\n';
        }
      }
    });
  }
  
  if (diff.removed.length > 0) {
    diffContent += '## REMOVED Requirements\n\n';
    diff.removed.forEach((item: any) => {
      diffContent += `### Requirement: ${item.file} Removal\n`;
      diffContent += `**Reason**: ${item.reason || 'File marked for removal'}\n`;
      diffContent += `**Migration**: ${item.migration || 'No migration needed'}\n\n`;
    });
  }
  
  // Add specification format guidelines
  diffContent += `---\nSpecification Format Guidelines:\n- Use SHALL/MUST for mandatory requirements\n- Use SHOULD/RECOMMENDED for recommended practices  \n- Use MAY/OPTIONAL for optional features\n- Each requirement MUST have at least one scenario\n- Scenarios MUST use the format: #### Scenario: [Name] (4 hashtags)\n- WHEN/THEN format MUST be used in scenarios\n`;
  
  // Save diff file
  const diffFilePath = path.join(specDir, 'spec.md');
  fs.writeFileSync(diffFilePath, diffContent);
  
  return diffFilePath;
}

// Function to generate meaningful short name from description
async function generateMeaningfulShortName(context: CommandContext, description: string): Promise<string> {
  try {
    // Try to use LLM to generate a meaningful short name
    const config = context.services.config;
    if (config) {
      const geminiClient = config.getGeminiClient();
      if (geminiClient) {
        const prompt = `Generate a short, meaningful name (max 20 characters) for a change proposal with the following description: "${description}". 
        The name should be concise, descriptive, and use only lowercase letters, numbers, and hyphens. Do not include any explanation, just provide the name.`;
        
        const response = await geminiClient.generateContent(
          [{ role: 'user', parts: [{ text: prompt }] }],
          {},
          new AbortController().signal
        );
        
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            const part = candidate.content.parts[0];
            if (part.text) {
              // Clean and format the generated name
              let name = part.text.trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 20);
              
              // Ensure it's not empty
              if (name.length > 0) {
                return name;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // Fall back to heuristic-based generation if LLM fails
    console.warn('LLM-based short name generation failed, falling back to heuristics:', error);
  }
  
  // Fallback to heuristic-based generation
  return generateMeaningfulShortNameWithHeuristics(description);
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
  // Extract key information from description using more sophisticated heuristics
  const keywords = extractKeywords(description);
  const actionVerbs = extractActionVerbs(description);
  const entities = extractEntities(description);
  
  // Generate more contextually relevant content
  return {
    proposal: generateProposalWithHeuristics(description, keywords, actionVerbs, entities),
    tasks: generateTasksWithHeuristics(description, keywords, actionVerbs, entities),
    design: generateDesignWithHeuristics(description, keywords, actionVerbs, entities)
  };
}

// Helper function to extract keywords from description
function extractKeywords(description: string): string[] {
  // Simple keyword extraction based on common programming and technical terms
  const commonTerms = [
    'api', 'endpoint', 'database', 'frontend', 'backend', 'ui', 'ux', 'security',
    'performance', 'optimization', 'authentication', 'authorization', 'testing',
    'documentation', 'deployment', 'ci/cd', 'monitoring', 'logging', 'caching',
    'validation', 'error handling', 'internationalization', 'accessibility'
  ];
  
  return commonTerms.filter(term => 
    description.toLowerCase().includes(term.toLowerCase())
  );
}

// Helper function to extract action verbs from description
function extractActionVerbs(description: string): string[] {
  // Common action verbs in software development
  const actionVerbs = [
    'add', 'implement', 'create', 'develop', 'build', 'design', 'update', 'modify',
    'enhance', 'improve', 'optimize', 'refactor', 'remove', 'delete', 'fix', 'resolve',
    'integrate', 'connect', 'configure', 'setup', 'deploy', 'test', 'validate',
    'document', 'secure', 'protect', 'monitor', 'log', 'cache', 'authenticate'
  ];
  
  return actionVerbs.filter(verb => 
    description.toLowerCase().includes(verb.toLowerCase())
  );
}

// Helper function to extract entities from description
function extractEntities(description: string): string[] {
  // Extract potential entities (nouns) from description
  // This is a simplified approach - in a real implementation, you might use NLP
  const words = description.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Filter for common entity types
  const entityIndicators = ['service', 'component', 'module', 'feature', 'function', 'class', 'method'];
  return words.filter(word => 
    entityIndicators.some(indicator => word.includes(indicator))
  );
}

// Helper function to generate proposal content with heuristics
function generateProposalWithHeuristics(
  description: string, 
  keywords: string[], 
  actionVerbs: string[], 
  entities: string[]
): string {
  // Determine motivation based on keywords
  let motivation = 'This change is needed to address the requirements described.';
  if (keywords.includes('security')) {
    motivation = 'This change is needed to improve the security posture of the system.';
  } else if (keywords.includes('performance') || keywords.includes('optimization')) {
    motivation = 'This change is needed to optimize system performance and efficiency.';
  } else if (keywords.includes('ui') || keywords.includes('ux')) {
    motivation = 'This change is needed to improve the user experience and interface design.';
  }
  
  // Generate implementation plan based on action verbs
  const implementationSteps = [];
  if (actionVerbs.includes('add') || actionVerbs.includes('create') || actionVerbs.includes('implement')) {
    implementationSteps.push('1. Design and implement the new functionality');
  }
  if (actionVerbs.includes('test') || actionVerbs.includes('validate')) {
    implementationSteps.push('2. Create comprehensive tests for the new functionality');
  }
  if (keywords.includes('documentation')) {
    implementationSteps.push('3. Update relevant documentation');
  }
  if (actionVerbs.includes('deploy')) {
    implementationSteps.push('4. Deploy changes to staging environment for testing');
  }
  
  // If no specific steps were identified, use generic ones
  if (implementationSteps.length === 0) {
    implementationSteps.push(
      '1. Analyze requirements',
      '2. Design solution',
      '3. Implement changes',
      '4. Test functionality'
    );
  }
  
  return `# Change Proposal

## Overview
${description}

## Motivation
${motivation}

## Implementation Plan
${implementationSteps.join('\n')}

## Impact Assessment
This change will improve the system according to the description. The primary impact areas include: ${keywords.length > 0 ? keywords.join(', ') : 'general system improvements'}.`;
}

// Helper function to generate tasks content with heuristics
function generateTasksWithHeuristics(
  description: string, 
  keywords: string[], 
  actionVerbs: string[], 
  entities: string[]
): string {
  const tasks = [];
  
  // Add tasks based on keywords and action verbs
  if (actionVerbs.includes('implement') || actionVerbs.includes('add') || actionVerbs.includes('create')) {
    tasks.push('- [ ] Implement the core functionality');
  }
  
  if (keywords.includes('testing') || actionVerbs.includes('test')) {
    tasks.push('- [ ] Write unit and integration tests');
  }
  
  if (keywords.includes('documentation')) {
    tasks.push('- [ ] Update relevant documentation');
  }
  
  if (keywords.includes('security')) {
    tasks.push('- [ ] Perform security review and validation');
  }
  
  if (entities.length > 0) {
    tasks.push(`- [ ] Develop ${entities.join(', ')} components`);
  }
  
  // Add generic tasks if none were identified
  if (tasks.length === 0) {
    tasks.push(
      '- [ ] Analyze the requirements',
      '- [ ] Design the solution',
      '- [ ] Implement the changes',
      '- [ ] Test the functionality',
      '- [ ] Document the changes'
    );
  }
  
  return `# Implementation Tasks

${tasks.join('\n')}`;
}

// Helper function to generate design content with heuristics
function generateDesignWithHeuristics(
  description: string, 
  keywords: string[], 
  actionVerbs: string[], 
  entities: string[]
): string {
  // Determine approach based on keywords
  let approach = `Implement the solution as described: ${description}`;
  if (keywords.includes('api')) {
    approach = 'Design and implement RESTful API endpoints following best practices';
  } else if (keywords.includes('database')) {
    approach = 'Design database schema and implement data access layers';
  } else if (keywords.includes('frontend') || keywords.includes('ui')) {
    approach = 'Implement responsive UI components using modern frontend frameworks';
  }
  
  // Determine architecture considerations
  const architecturePoints = [];
  if (keywords.includes('performance') || keywords.includes('optimization')) {
    architecturePoints.push('- Implement caching strategies for improved performance');
  }
  if (keywords.includes('security')) {
    architecturePoints.push('- Apply security best practices including input validation and authentication');
  }
  if (keywords.includes('monitoring')) {
    architecturePoints.push('- Add monitoring and logging for observability');
  }
  
  // Add generic architecture points if none were identified
  if (architecturePoints.length === 0) {
    architecturePoints.push(
      '- Follow existing architectural patterns',
      '- Ensure modular and maintainable code structure',
      '- Apply separation of concerns principles'
    );
  }
  
  // Determine dependencies
  let dependencies = 'None beyond existing system dependencies.';
  if (keywords.includes('api')) {
    dependencies = 'Requires integration with existing backend services and APIs.';
  } else if (keywords.includes('database')) {
    dependencies = 'Requires database schema migrations and data access libraries.';
  }
  
  return `# Technical Design

## Approach
${approach}

## Architecture
${architecturePoints.join('\n')}

## Dependencies
${dependencies}`;
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