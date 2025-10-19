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

export const validateCommand: SlashCommand = {
  name: 'validate',
  description: 'Validate specification formatting',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse arguments for flags
    const argsArray = args.trim().split(/\s+/);
    let allFlag = false;
    let strictFlag = false;
    let changeName = '';
    
    for (const arg of argsArray) {
      if (arg === '--all') {
        allFlag = true;
      } else if (arg === '--strict') {
        strictFlag = true;
      } else if (!changeName && !arg.startsWith('-')) {
        changeName = arg;
      }
    }
    
    // If no change name and not using --all, show available changes
    if (!changeName && !allFlag) {
      // Get list of available changes for interactive selection
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      if (!fs.existsSync(changesDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();
      
      if (changes.length === 0) {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No active changes found. Use /openspec change <change-name> to create a new change.',
        };
      }
      
      // For now, return a message with available changes
      // In a full implementation, this would show an interactive selection dialog
      let content = 'Please specify a change name or use --all flag. Available changes:\\n\\n';
      changes.forEach((change, index) => {
        content += `${index + 1}. ${change}\\n`;
      });
      content += '\\nUsage: /openspec validate <change-name> [--all] [--strict]\\nOptions:\\n  --all     Validate all changes\\n  --strict  Enable strict validation mode';
      
      return {
        type: 'message',
        messageType: 'info',
        content,
      };
    }
    
    try {
      const projectRoot = process.cwd();
      const openspecDir = path.join(projectRoot, 'openspec');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(openspecDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      let content = '';
      let hasErrors = false;
      
      if (allFlag) {
        content += '# Validating all changes\n\n';
        const changesDir = path.join(openspecDir, 'changes');
        
        if (!fs.existsSync(changesDir)) {
          return {
            type: 'message',
            messageType: 'error',
            content: 'Changes directory not found.',
          };
        }
        
        const changes = fs.readdirSync(changesDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        if (changes.length === 0) {
          content += 'No changes found to validate.\n';
        } else {
          // Process changes with bounded concurrency (max 5 concurrent validations)
          const MAX_CONCURRENT = 5;
          const results: { change: string; result: { content: string; hasErrors: boolean }; }[] = [];
          
          // Process in batches to limit concurrency
          for (let i = 0; i < changes.length; i += MAX_CONCURRENT) {
            const batch = changes.slice(i, i + MAX_CONCURRENT);
            const batchPromises = batch.map(async (change) => {
              const result = await validateChange(projectRoot, change, strictFlag);
              return { change, result };
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
          }
          
          // Sort results by change name to maintain consistent order
          results.sort((a, b) => a.change.localeCompare(b.change));
          
          for (const { change, result } of results) {
            content += `## ${change}\n${result.content}\n`;
            if (result.hasErrors) hasErrors = true;
          }
        }
      } else {
        // Validate specific change
        const result = await validateChange(projectRoot, changeName!, strictFlag);
        content += `# Validating change: ${changeName}\n\n${result.content}`;
        hasErrors = result.hasErrors;
      }
      
      return {
        type: 'message',
        messageType: hasErrors ? 'error' : 'info',
        content,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to validate: ${(error as Error).message}`,
      };
    }
  },
  completion: async (context, partialArg) => {
    // Suggest completion for flags
    if (partialArg.startsWith('-')) {
      return ['--all', '--strict'];
    }
    
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      if (!fs.existsSync(changesDir)) {
        return [];
      }
      
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      return changes.filter(change => change.startsWith(partialArg));
    } catch (_error) {
      return [];
    }
  },
};

async function validateChange(projectRoot: string, changeName: string, strictMode: boolean = false): Promise<{ content: string; hasErrors: boolean }> {
  const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
  
  // Check if change exists
  if (!fs.existsSync(changeDir)) {
    return {
      content: `❌ Error: Change "${changeName}" not found.\n`,
      hasErrors: true,
    };
  }
  
  let content = '';
  let hasErrors = false;
  let hasWarnings = false;
  
  // Add strict mode indicator to output
  if (strictMode) {
    content += '🔍 Strict validation mode enabled\n\n';
  }
  
  // Check required files
  const requiredFiles = ['proposal.md', 'tasks.md'];
  for (const file of requiredFiles) {
    const filePath = path.join(changeDir, file);
    if (!fs.existsSync(filePath)) {
      content += `❌ Error: Required file "${file}" not found.\n`;
      hasErrors = true;
    } else {
      // Check if file is not empty
      const fileContent = fs.readFileSync(filePath, 'utf-8').trim();
      if (fileContent.length === 0) {
        content += `⚠️ Warning: File "${file}" is empty.\n`;
        hasWarnings = true;
        if (strictMode) {
          hasErrors = true; // In strict mode, empty files are errors
        }
      } else {
        // For specification files, validate structured format
        if (file === 'proposal.md' || file.endsWith('.md') && filePath.includes('specs')) {
          // Import specification validator
          const { SpecificationValidator } = await import('../../../services/OpenSpecSpecificationValidator.js');
          const validationResult = SpecificationValidator.validateSpecificationFormat(fileContent, strictMode);
          
          if (!validationResult.isValid) {
            if (strictMode) {
              content += `❌ Error: File "${file}" has specification format issues:\n`;
              hasErrors = true;
            } else {
              content += `⚠️ Warning: File "${file}" has specification format issues:\n`;
              hasWarnings = true;
            }
            validationResult.issues.forEach(issue => {
              content += `  - ${issue}\n`;
            });
          }
          
          // Additional validation for spec files
          if (file.endsWith('.md') && filePath.includes('specs')) {
            const specValidationResult = validateSpecificationFormat(fileContent);
            if (!specValidationResult.isValid) {
              if (strictMode) {
                content += `❌ Error: Spec file "${file}" has format compliance issues:\n`;
                hasErrors = true;
              } else {
                content += `❌ Error: Spec file "${file}" has format compliance issues:\n`;
                hasErrors = true;
              }
              specValidationResult.issues.forEach(issue => {
                content += `  - ${issue}\n`;
              });
            }
          }
        }
      }
    }
  }
  
  // Check design.md (optional)
  const designPath = path.join(changeDir, 'design.md');
  if (fs.existsSync(designPath)) {
    const designContent = fs.readFileSync(designPath, 'utf-8').trim();
    if (designContent.length === 0) {
      content += `⚠️ Warning: File "design.md" is empty.\n`;
      hasWarnings = true;
      if (strictMode) {
        hasErrors = true; // In strict mode, empty files are errors
      }
    }
  }
  
  // Check specs directory
  const specsDir = path.join(changeDir, 'specs');
  if (fs.existsSync(specsDir)) {
    const specFiles = fs.readdirSync(specsDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
      .map(dirent => dirent.name);
    
    if (specFiles.length === 0) {
      if (strictMode) {
        content += `❌ Error: Specs directory is empty. Add specification deltas using proper format (ADDED/MODIFIED/REMOVED).\n`;
        hasErrors = true;
      } else {
        content += `⚠️ Warning: Specs directory is empty. Add specification deltas using proper format (ADDED/MODIFIED/REMOVED).\n`;
        hasWarnings = true;
      }
    } else {
      // Validate delta operations in spec files
      for (const file of specFiles) {
        const filePath = path.join(specsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8').trim();
        
        if (fileContent.length === 0) {
          if (strictMode) {
            content += `❌ Error: Spec file "${file}" is empty.\n`;
            hasErrors = true;
          } else {
            content += `⚠️ Warning: Spec file "${file}" is empty.\n`;
            hasWarnings = true;
          }
        } else {
          // Import delta operations parser
          const { DeltaOperationsParser } = await import('../../../services/OpenSpecDeltaOperationsParser.js');
          const validationResult = DeltaOperationsParser.validateDeltaFormat(fileContent);
          
          if (!validationResult.isValid) {
            if (strictMode) {
              content += `❌ Error: Spec file "${file}" has delta format issues:\n`;
              hasErrors = true;
            } else {
              content += `⚠️ Warning: Spec file "${file}" has delta format issues:\n`;
              hasWarnings = true;
            }
            validationResult.issues.forEach(issue => {
              content += `  - ${issue}\n`;
            });
          }
          
          // Additional validation for delta format compliance
          const deltaValidationResult = validateDeltaOperationsFormat(fileContent);
          if (!deltaValidationResult.isValid) {
            if (strictMode) {
              content += `❌ Error: Spec file "${file}" has delta operation compliance issues:\n`;
              hasErrors = true;
            } else {
              content += `❌ Error: Spec file "${file}" has delta operation compliance issues:\n`;
              hasErrors = true;
            }
            deltaValidationResult.issues.forEach(issue => {
              content += `  - ${issue}\n`;
            });
          }
          
          // In strict mode, check for additional requirements
          if (strictMode) {
            // Check that change has at least one delta
            const { DeltaOperationsParser } = await import('../../../services/OpenSpecDeltaOperationsParser.js');
            const operations = DeltaOperationsParser.parseDeltaOperations(fileContent);
            if (operations.length === 0) {
              content += `❌ Error: Change must have at least one delta operation.\n`;
              hasErrors = true;
            }
            
            // Check that each requirement has at least one scenario
            const { SpecificationValidator } = await import('../../../services/OpenSpecSpecificationValidator.js');
            for (const operation of operations) {
              const requirements = SpecificationValidator.parseSpecificationRequirements(operation.content);
              for (const requirement of requirements) {
                if (requirement.scenarios.length === 0) {
                  content += `❌ Error: Requirement "${requirement.header}" must have at least one scenario.\n`;
                  hasErrors = true;
                }
              }
            }
          }
        }
      }
    }
  } else {
    if (strictMode) {
      content += `❌ Error: No specs directory found. Changes must include specification deltas.\n`;
      hasErrors = true;
    } else {
      content += `⚠️ Warning: No specs directory found. Changes should include specification deltas.\n`;
      hasWarnings = true;
    }
  }
  
  // If no issues found
  if (content === '') {
    content = '✅ No issues found.\n';
  } else if (!hasErrors && !hasWarnings) {
    content += '\n✅ No issues found.\n';
  } else if (!hasErrors && hasWarnings) {
    content += '\n✅ Validation passed with warnings.\n';
  }
  
  return { content, hasErrors };
}

// Additional validation functions for specification format compliance
function validateSpecificationFormat(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for proper requirement headers (SHALL/MUST)
  const requirementRegex = /^### Requirement: /gm;
  const requirements = content.match(requirementRegex);
  
  if (requirements) {
    // Check each requirement for SHALL/MUST usage
    const lines = content.split('\n');
    let inRequirement = false;
    let requirementHasShallMust = false;
    let currentRequirementLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('### Requirement: ')) {
        if (inRequirement && !requirementHasShallMust) {
          issues.push(`Line ${currentRequirementLine}: Requirement should use SHALL/MUST for mandatory requirements. Example: "The system SHALL validate user input."`);
        }
        inRequirement = true;
        requirementHasShallMust = false;
        currentRequirementLine = i + 1;
      } else if (line.startsWith('### ') && inRequirement) {
        // New section, check if previous requirement had SHALL/MUST
        if (!requirementHasShallMust) {
          issues.push(`Line ${currentRequirementLine}: Requirement should use SHALL/MUST for mandatory requirements. Example: "The system SHALL validate user input."`);
        }
        inRequirement = line.startsWith('### Requirement: ');
        requirementHasShallMust = false;
        if (inRequirement) {
          currentRequirementLine = i + 1;
        }
      } else if (inRequirement && (line.includes(' SHALL ') || line.includes(' MUST '))) {
        requirementHasShallMust = true;
      }
    }
    
    // Check last requirement
    if (inRequirement && !requirementHasShallMust) {
      issues.push(`Line ${currentRequirementLine}: Requirement should use SHALL/MUST for mandatory requirements. Example: "The system SHALL validate user input."`);
    }
  }
  
  // Check for proper scenario formatting (#### Scenario:)
  const scenarioRegex = /^#### Scenario: /gm;
  const scenarios = content.match(scenarioRegex);
  
  if (requirements && !scenarios) {
    issues.push('Requirement must have at least one scenario');
  }
  
  if (scenarios) {
    // Check for improper scenario formatting
    const improperScenarioRegex = /^[\*\-\d]*\s*\**Scenario[\*:]/gm;
    const improperScenarios = content.match(improperScenarioRegex);
    if (improperScenarios) {
      issues.push('Scenarios must use proper format: #### Scenario: [Name] (exactly 4 hashtags). Example: "#### Scenario: User Login with Valid Credentials"');
    }
  }
  
  // Check for bullet points or other improper formatting
  const bulletPointLines = content.split('\n').filter((line, index) => {
    return line.match(/^[\*\-\d]+\s+[A-Za-z]/) && 
           !line.includes('**WHEN**') && 
           !line.includes('**THEN**');
  });
  
  if (bulletPointLines.length > 0) {
    issues.push('Avoid using bullet points for scenarios. Use the structured format: "#### Scenario: [Name]" followed by WHEN/THEN statements.');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

function validateDeltaOperationsFormat(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for proper delta operation headers
  const validHeaders = ['## ADDED Requirements', '## MODIFIED Requirements', '## REMOVED Requirements', '## RENAMED Requirements'];
  const headerRegex = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/gm;
  const headers = content.match(headerRegex) || [];
  
  for (const header of headers) {
    if (!validHeaders.includes(header)) {
      // Check if it's a close variant that should be corrected
      if (header.includes('ADDED') && !header.includes('## ADDED Requirements')) {
        issues.push(`Header should be exactly "## ADDED Requirements" but found "${header}". Correct format example: "## ADDED Requirements"`);
      } else if (header.includes('MODIFIED') && !header.includes('## MODIFIED Requirements')) {
        issues.push(`Header should be exactly "## MODIFIED Requirements" but found "${header}". Correct format example: "## MODIFIED Requirements"`);
      } else if (header.includes('REMOVED') && !header.includes('## REMOVED Requirements')) {
        issues.push(`Header should be exactly "## REMOVED Requirements" but found "${header}". Correct format example: "## REMOVED Requirements"`);
      } else if (header.includes('RENAMED') && !header.includes('## RENAMED Requirements')) {
        issues.push(`Header should be exactly "## RENAMED Requirements" but found "${header}". Correct format example: "## RENAMED Requirements"`);
      } else {
        issues.push(`Invalid operation header: "${header}". Valid headers are: ## ADDED Requirements, ## MODIFIED Requirements, ## REMOVED Requirements, ## RENAMED Requirements`);
      }
    }
  }
  
  // Check that at least one delta operation exists
  const hasValidDelta = validHeaders.some(header => content.includes(header));
  if (!hasValidDelta) {
    issues.push('Specification delta must contain at least one operation (ADDED, MODIFIED, REMOVED, or RENAMED). Example: "## ADDED Requirements"');
  }
  
  // Check for common formatting mistakes
  const lowercaseHeaders = content.match(/^## [a-z]/gm);
  if (lowercaseHeaders) {
    issues.push('Operation headers must be uppercase. Example: "## ADDED Requirements" not "## Added Requirements"');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}