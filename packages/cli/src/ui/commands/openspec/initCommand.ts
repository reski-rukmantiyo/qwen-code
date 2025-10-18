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

export const initCommand: SlashCommand = {
  name: 'init',
  description: 'Initialize OpenSpec in your project',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    try {
      const projectRoot = process.cwd();
      
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
        const allExist = requiredDirs.every(dir => fs.existsSync(dir));
        
        if (allExist) {
          // Clear cache since we're re-initializing
          const cacheService = getOpenSpecCacheService();
          if (cacheService) {
            cacheService.clearCache();
          }
          
          return {
            type: 'message',
            messageType: 'info',
            content: '✅ OpenSpec is already initialized in this project.',
          };
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
      let description = '';
      
      // Check if we have a quoted description
      if (trimmedArgs.startsWith('"') && trimmedArgs.endsWith('"') && trimmedArgs.length > 1) {
        description = trimmedArgs.substring(1, trimmedArgs.length - 1);
      } else if (trimmedArgs.startsWith("'") && trimmedArgs.endsWith("'") && trimmedArgs.length > 1) {
        description = trimmedArgs.substring(1, trimmedArgs.length - 1);
      } else if (trimmedArgs) {
        description = trimmedArgs;
      }
      
      // Create directory structure
      fs.mkdirSync(openspecDir, { recursive: true });
      fs.mkdirSync(specsDir, { recursive: true });
      fs.mkdirSync(changesDir, { recursive: true });
      fs.mkdirSync(archiveDir, { recursive: true });
      
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
      
      const sampleSpecPath = path.join(specsDir, specFileName);
      fs.writeFileSync(sampleSpecPath, sampleSpecContent);
      
      // Clear cache since we've created new files
      const cacheService = getOpenSpecCacheService();
      if (cacheService) {
        cacheService.clearCache();
      }
      
      // Provide success feedback
      const hasDescription = !!description;
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
├── specs/                 # Current source-of-truth specifications
│   └── ${specFileName}     # ${hasDescription && usedLLM ? 'Specification based on your description' : 'Sample specification'}
├── changes/               # Proposed updates (active changes)
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