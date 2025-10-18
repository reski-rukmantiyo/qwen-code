/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext, MessageActionReturn } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { readFileEfficiently, getFileStats } from '../../../services/OpenSpecFileUtils.js';

export const specCommand: SlashCommand = {
  name: 'spec',
  description: 'Manage OpenSpec specification files',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string): Promise<MessageActionReturn> => {
    // Parse arguments
    const argsArray = args.trim().split(/\s+/);
    
    if (argsArray.length < 1) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Usage: /openspec spec <action> [options]
        
Actions:
  create <spec-path>    Create a new specification file
  edit <spec-path>      Edit an existing specification
  delete <spec-path>    Remove a specification file
  
Examples:
  /openspec spec create auth/user-authentication
  /openspec spec edit api/rest-endpoints
  /openspec spec delete deprecated/legacy-feature`,
      };
    }
    
    const action = argsArray[0];
    const specPath = argsArray.slice(1).join(' ');
    
    const projectRoot = process.cwd();
    const specsDir = path.join(projectRoot, 'openspec', 'specs');
    
    // Check if OpenSpec is initialized
    if (!fs.existsSync(specsDir)) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
      };
    }
    
    switch (action) {
      case 'create':
        return createSpec(specsDir, specPath, context);
      case 'edit':
        return editSpec(specsDir, specPath, context);
      case 'delete':
        return deleteSpec(specsDir, specPath, context);
      default:
        return {
          type: 'message',
          messageType: 'error',
          content: `Unknown action: ${action}. Supported actions: create, edit, delete`,
        };
    }
  },
};

function createSpec(specsDir: string, specPath: string, context: CommandContext): MessageActionReturn {
  if (!specPath) {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Please specify a spec path. Usage: /openspec spec create <spec-path>',
    };
  }
  
  // Validate spec path
  if (!/^[a-zA-Z0-9-_\/]+$/.test(specPath)) {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Spec path can only contain letters, numbers, hyphens, underscores, and forward slashes.',
    };
  }
  
  const fullPath = path.join(specsDir, `${specPath}.md`);
  const dirName = path.dirname(fullPath);
  
  // Check if spec already exists
  if (fs.existsSync(fullPath)) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Specification "${specPath}" already exists.`,
    };
  }
  
  try {
    // Create directory structure if needed
    fs.mkdirSync(dirName, { recursive: true });
    
    // Create template content with structured requirements
    const templateContent = `# ${path.basename(specPath)}

## Overview
Briefly describe what this specification covers.

### Requirement: Primary Functionality
Describe the main functionality this specification addresses.

#### Scenario: Normal Operation
Describe the expected behavior under normal conditions.

#### Scenario: Error Conditions
Describe how the system should handle error conditions.

### Requirement: Security Considerations
Describe any security requirements or considerations.

#### Scenario: Authentication
Describe authentication requirements.

#### Scenario: Authorization
Describe authorization requirements.

## Implementation Details
Provide implementation guidelines and constraints.

## Testing
Outline testing approaches and acceptance criteria.
`;
    
    // Write the file
    fs.writeFileSync(fullPath, templateContent);
    
    return {
      type: 'message',
      messageType: 'info',
      content: `✅ Created new specification: ${specPath}
      
File created at: ${fullPath}

Next steps:
1. Edit the file to define your specification
2. Use /openspec spec edit ${specPath} to modify it later`,
    };
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to create specification "${specPath}": ${(error as Error).message}`,
    };
  }
}

async function editSpec(specsDir: string, specPath: string, context: CommandContext): Promise<MessageActionReturn> {
  if (!specPath) {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Please specify a spec path. Usage: /openspec spec edit <spec-path>',
    };
  }
  
  const fullPath = path.join(specsDir, `${specPath}.md`);
  
  // Check if spec exists
  if (!fs.existsSync(fullPath)) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Specification "${specPath}" not found.`,
    };
  }
  
  try {
    // Get file stats
    const stats = getFileStats(fullPath);
    
    // Read the spec file efficiently
    const content = await readFileEfficiently(fullPath);
    
    // Display the content with file information
    return {
      type: 'message',
      messageType: 'info',
      content: `Specification "${specPath}" (${stats.sizeFormatted})
Last modified: ${stats.modified.toLocaleString()}

${content}

To edit this specification:
1. Use /openspec spec edit ${specPath} to open it in your editor
2. Or manually edit the file at:
   ${fullPath}`,
    };
  } catch (error) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to read specification "${specPath}": ${(error as Error).message}`,
    };
  }
}

function deleteSpec(specsDir: string, specPath: string, context: CommandContext): MessageActionReturn {
  if (!specPath) {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Please specify a spec path. Usage: /openspec spec delete <spec-path>',
    };
  }
  
  const fullPath = path.join(specsDir, `${specPath}.md`);
  
  // Check if spec exists
  if (!fs.existsSync(fullPath)) {
    return {
      type: 'message',
      messageType: 'error',
      content: `Specification "${specPath}" not found.`,
    };
  }
  
  // TODO: Integrate with Qwen Code's confirmation system for deletion
  // For now, just provide a warning and instructions
  return {
    type: 'message',
    messageType: 'info',
    content: `To delete specification "${specPath}":
1. Manually delete the following file:
   ${fullPath}
   
Note: This command would normally prompt for confirmation before deletion.`,
  };
}