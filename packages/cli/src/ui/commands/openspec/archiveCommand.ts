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
import chalk from 'chalk';
import { OpenSpecTaskProgress } from '../../../services/OpenSpecTaskProgress.js';
import { OpenSpecArchiveValidator } from '../../../services/OpenSpecArchiveValidator.js';
import { DeltaOperationsParser } from '../../../services/OpenSpecDeltaOperationsParser.js';
import { SpecificationValidator, type SpecificationRequirement } from '../../../services/OpenSpecSpecificationValidator.js';
import { OpenSpecMemoryIntegration } from '../../../services/OpenSpecMemoryIntegration.js';
import { OpenSpecCacheService } from '../../../services/OpenSpecCacheService.js';

interface SpecUpdate {
  source: string;
  target: string;
  exists: boolean;
}

/**
 * Generates a specification file by summarizing content from a change directory using LLM
 * @param changeName Name of the change directory to summarize
 * @param projectRoot Project root directory
 * @param context Command context for LLM integration
 * @returns Path to the generated spec file
 */
async function generateSpecFile(changeName: string, projectRoot: string, context?: any): Promise<string> {
  const changesDir = path.join(projectRoot, 'openspec', 'changes');
  const changeDir = path.join(changesDir, changeName);
  const specsDir = path.join(projectRoot, 'openspec', 'specs');
  const targetSpecDir = path.join(specsDir, changeName);
  const targetSpecFile = path.join(targetSpecDir, 'specs.md');
  
  // Ensure target directory exists
  fs.mkdirSync(targetSpecDir, { recursive: true });
  
  // Read key files from change directory
  let proposalContent = '';
  let tasksContent = '';
  let designContent = '';
  
  try {
    const proposalPath = path.join(changeDir, 'proposal.md');
    if (fs.existsSync(proposalPath)) {
      proposalContent = fs.readFileSync(proposalPath, 'utf-8');
    }
  } catch (_error) {
    // Ignore if file doesn't exist
  }
  
  try {
    const tasksPath = path.join(changeDir, 'tasks.md');
    if (fs.existsSync(tasksPath)) {
      tasksContent = fs.readFileSync(tasksPath, 'utf-8');
    }
  } catch (_error) {
    // Ignore if file doesn't exist
  }
  
  try {
    const designPath = path.join(changeDir, 'design.md');
    if (fs.existsSync(designPath)) {
      designContent = fs.readFileSync(designPath, 'utf-8');
    }
  } catch (_error) {
    // Ignore if file doesn't exist
  }
  
  // Initialize content variables
  let title = changeName;
  let overview = '';
  let motivation = '';
  let implementationApproach = '';
  let technicalDesign = '';
  let llmSuccess = false;
  
  // Collect all content for LLM processing
  let allContent = '';
  
  if (proposalContent) {
    allContent += `# Change Proposal\n\n${proposalContent}\n\n`;
  }
  
  if (tasksContent) {
    allContent += `# Implementation Tasks\n\n${tasksContent}\n\n`;
  }
  
  if (designContent) {
    allContent += `# Technical Design\n\n${designContent}\n\n`;
  }
  
  if (allContent) {
    // Try to use LLM for sophisticated summarization
    try {
      const config = context?.services?.config;
      if (config) {
        const geminiClient = config.getGeminiClient();
        if (geminiClient) {
          // Create a prompt for generating structured specification content
          const prompt = `Generate a structured specification document based on the following OpenSpec change materials.
Follow the OpenSpec specification format conventions documented in openspec/AGENTS.md and openspec/project.md.

Extract and organize the content into these sections:
1. Title - Extract from the main heading of the proposal
2. Overview - Summarize the main purpose and scope
3. Motivation - Explain why this change is needed
4. Implementation Approach - Describe how the change will be implemented
5. Technical Design - Detail the technical architecture (if available)

Change Materials:
${allContent}

Return ONLY a structured specification in this exact format:
# [Title]
## Overview
[Overview content]
## Motivation
[Motivation content]
## Implementation Approach
[Implementation approach content]
## Technical Design
[Technical design content if available]

Do not include any other text, explanations, or markdown formatting beyond what's shown above.`;

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
                // Parse the LLM-generated content
                const llmContent = part.text.trim();
                
                // Extract title (first H1 header)
                const titleMatch = llmContent.match(/^#\s+(.+)$/m);
                if (titleMatch) {
                  title = titleMatch[1];
                  llmSuccess = true;
                }
                
                // Extract overview section
                const overviewMatch = llmContent.match(/## Overview\n([\s\S]*?)(?=\n## [^\n]|$)/);
                if (overviewMatch) {
                  overview = overviewMatch[1].trim();
                }
                
                // Extract motivation section
                const motivationMatch = llmContent.match(/## Motivation\n([\s\S]*?)(?=\n## [^\n]|$)/);
                if (motivationMatch) {
                  motivation = motivationMatch[1].trim();
                }
                
                // Extract implementation approach section
                const approachMatch = llmContent.match(/## Implementation Approach\n([\s\S]*?)(?=\n## [^\n]|$)/);
                if (approachMatch) {
                  implementationApproach = approachMatch[1].trim();
                }
                
                // Extract technical design section
                const designMatch = llmContent.match(/## Technical Design\n([\s\S]*?)(?=\n## [^\n]|$)/);
                if (designMatch) {
                  technicalDesign = designMatch[1].trim();
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`LLM specification generation failed: ${(error as Error).message}`);
    }
  }
  
  // Fallback to regex-based extraction if LLM is not available or fails
  if (!llmSuccess) {
    if (proposalContent) {
      // Extract title (first H1 header)
      const titleMatch = proposalContent.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1];
      }
      
      // Extract overview section (everything between ## Overview and the next ## header or end of file)
      // Handle both actual newlines and escaped newlines
      const normalizedContent = proposalContent.replace(/\\n/g, '\n');
      const overviewMatch = normalizedContent.match(/## Overview\n([\s\S]*?)(?=\n## [^\n]|$)/);
      if (overviewMatch) {
        overview = overviewMatch[1].trim();
      }
      
      // Extract motivation section
      const motivationMatch = normalizedContent.match(/## Motivation\n([\s\S]*?)(?=\n## [^\n]|$)/);
      if (motivationMatch) {
        motivation = motivationMatch[1].trim();
      }
      
      // Extract implementation plan section (convert to approach)
      const planMatch = normalizedContent.match(/## Implementation Plan\n([\s\S]*?)(?=\n## [^\n]|$)/);
      if (planMatch) {
        implementationApproach = planMatch[1].trim();
      }
    }
    
    if (designContent) {
      // Normalize design content and extract content after the first line (which is the title)
      const normalizedDesign = designContent.replace(/\\n/g, '\n');
      const designLines = normalizedDesign.split('\n');
      if (designLines.length > 1) {
        technicalDesign = designLines.slice(1).join('\n').trim();
      }
    }
  }
  
  // Parse tasks to determine completion status
  let tasksSummary = '';
  if (tasksContent) {
    const totalTasks = (tasksContent.match(/-\s*\[.\]/g) || []).length;
    const completedTasks = (tasksContent.match(/-\s*\[[xX]\]/g) || []).length;
    tasksSummary = `Completed ${completedTasks} of ${totalTasks} tasks`;
  }
  
  // Generate structured markdown content
  let specContent = `# ${title} Specification\n\n`;
  
  if (overview) {
    specContent += `## Overview\n${overview}\n\n`;
  }
  
  if (motivation) {
    specContent += `## Motivation\n${motivation}\n\n`;
  }
  
  if (implementationApproach) {
    specContent += `## Implementation Approach\n${implementationApproach}\n\n`;
  }
  
  if (tasksSummary) {
    specContent += `## Implementation Status\n${tasksSummary}\n\n`;
  }
  
  if (technicalDesign) {
    specContent += `## Technical Design\n${technicalDesign}\n\n`;
  }
  
  // Add reference to archived change
  specContent += `## Archived Change Reference\nThis specification was automatically generated from the archived change: ${changeName}\n\n`;
  
  // Write to spec file
  fs.writeFileSync(targetSpecFile, specContent);
  
  return targetSpecFile;
}

export const archiveCommand: SlashCommand = {
  name: 'archive',
  description: 'Move completed changes to archive',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args: string) => {
    // Parse arguments
    const argsArray = args.trim().split(/\s+/);
    let changeName = '';
    let autoConfirm = false;
    let skipSpecs = false;
    let noValidate = false;
    let validate = true;
    
    // Check if this is a re-invocation after confirmation
    const isConfirmed = context.overwriteConfirmed || false;
    
    for (let i = 0; i < argsArray.length; i++) {
      const arg = argsArray[i];
      if (arg === '--yes' || arg === '-y') {
        autoConfirm = true;
      } else if (arg === '--skip-specs') {
        skipSpecs = true;
      } else if (arg === '--no-validate') {
        noValidate = true;
        validate = false;
      } else if (arg === '--validate') {
        validate = true;
      } else if (!changeName) {
        changeName = arg;
      }
    }
    
    if (!changeName) {
      return {
        type: 'message' as const,
        messageType: 'error' as const,
        content: 'Please specify a change name. Usage: /openspec archive <change-name> [--yes|-y] [--skip-specs] [--no-validate] [--validate]',
      };
    }
    
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      const changeDir = path.join(changesDir, changeName);
      const archiveDir = path.join(projectRoot, 'openspec', 'archive');
      const mainSpecsDir = path.join(projectRoot, 'openspec', 'specs');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(changesDir)) {
        return {
          type: 'message' as const,
          messageType: 'error' as const,
          content: "No OpenSpec changes directory found. Run 'openspec init' first.",
        };
      }
      
      // Check if change exists
      if (!fs.existsSync(changeDir)) {
        return {
          type: 'message' as const,
          messageType: 'error' as const,
          content: `Change "${changeName}" not found. Run /openspec list to see available changes.`,
        };
      }
      
      // Check if already archived
      const archivedChangeDir = path.join(archiveDir, changeName);
      if (fs.existsSync(archivedChangeDir)) {
        return {
          type: 'message' as const,
          messageType: 'error' as const,
          content: `Change "${changeName}" is already archived.`,
        };
      }
      
      const skipValidation = !validate || noValidate;
      
      // Validate specs and change before archiving
      if (!skipValidation) {
        const hasValidationErrors = await validateChangesAndSpecs(changeDir, changesDir, changeName);
        if (hasValidationErrors) {
          return {
            type: 'message' as const,
            messageType: 'error' as const,
            content: 'Validation failed. Please fix the errors before archiving.\nTo skip validation (not recommended), use --no-validate flag.',
          };
        }
      } else if (!autoConfirm && !isConfirmed) {
        // Log warning when validation is skipped
        return {
          type: 'confirm_action',
          prompt: `⚠️  WARNING: Skipping validation may archive invalid specs. Continue?`,
          originalInvocation: {
            raw: context.invocation?.raw || `/openspec archive ${changeName}`,
          },
        } as const;
      }
      
      // Show progress and check for incomplete tasks
      const progress = await OpenSpecTaskProgress.getTaskProgressForChange(changesDir, changeName);
      // Check for incomplete tasks
      const incompleteTasks = Math.max(progress.total - progress.completed, 0);
      if (incompleteTasks > 0 && !autoConfirm && !isConfirmed) {
        return {
          type: 'confirm_action',
          prompt: `Warning: ${incompleteTasks} incomplete task(s) found. Continue?`,
          originalInvocation: {
            raw: context.invocation?.raw || `/openspec archive ${changeName}`,
          },
        } as const;
      } else if (incompleteTasks > 0 && autoConfirm) {
        console.log(`Warning: ${incompleteTasks} incomplete task(s) found. Continuing due to --yes flag.`);
      }
      
      // Proceed with archiving
      return await performArchive(context, changeName, autoConfirm, skipSpecs, skipValidation, projectRoot, changesDir, changeDir, archiveDir, mainSpecsDir);
    } catch (error) {
      return {
        type: 'message' as const,
        messageType: 'error' as const,
        content: `Failed to archive change "${changeName}": ${(error as Error).message}`,
      };
    }
  },
  completion: async (context, partialArg) => {
    // Don't suggest completion for flags
    if (partialArg.startsWith('-')) {
      return ['--yes', '-y', '--skip-specs', '--no-validate', '--validate'];
    }
    
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      if (!fs.existsSync(changesDir)) {
        return [];
      }
      
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.toLowerCase() !== 'archive')
        .map(dirent => dirent.name);
      
      return changes.filter(change => change.startsWith(partialArg));
    } catch (_error) {
      return [];
    }
  },
};

/**
 * Validates changes and specs before archiving
 * @param changeDir Path to the change directory
 * @param changesDir Path to the changes directory
 * @param changeName Name of the change
 * @returns True if there are validation errors, false otherwise
 */
async function validateChangesAndSpecs(changeDir: string, _changesDir: string, _changeName: string): Promise<boolean> {
  let hasValidationErrors = false;
  
  // Validate proposal.md (non-blocking unless strict mode desired in future)
  const changeFile = path.join(changeDir, 'proposal.md');
  try {
    const changeReport = await OpenSpecArchiveValidator.validateChange(changeFile);
    // Proposal validation is informative only (do not block archive)
    if (!changeReport.valid) {
      console.log(chalk.yellow(`\nProposal warnings in proposal.md (non-blocking):`));
      for (const issue of changeReport.issues) {
        const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
        console.log(chalk.yellow(`  ${symbol} ${issue.message}`));
      }
    }
  } catch {
    // Change file doesn't exist, skip validation
  }
  
  // Validate delta-formatted spec files under the change directory if present
  const changeSpecsDir = path.join(changeDir, 'specs');
  let hasDeltaSpecs = false;
  try {
    const candidates = fs.readdirSync(changeSpecsDir, { withFileTypes: true });
    for (const c of candidates) {
      if (c.isDirectory()) {
        try {
          const candidatePath = path.join(changeSpecsDir, c.name, 'spec.md');
          if (fs.existsSync(candidatePath)) {
            const content = fs.readFileSync(candidatePath, 'utf-8');
            if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/m.test(content)) {
              hasDeltaSpecs = true;
              break;
            }
          }
        } catch (_error) {
          // Continue to next candidate
        }
      }
    }
  } catch (_error) {
    // No delta specs directory
  }
  
  if (hasDeltaSpecs) {
    const deltaReport = await OpenSpecArchiveValidator.validateChangeDeltaSpecs(changeDir);
    if (!deltaReport.valid) {
      hasValidationErrors = true;
      console.log(chalk.red(`\nValidation errors in change delta specs:`));
      for (const issue of deltaReport.issues) {
        if (issue.level === 'ERROR') {
          console.log(chalk.red(`  ✗ ${issue.message}`));
        } else if (issue.level === 'WARNING') {
          console.log(chalk.yellow(`  ⚠ ${issue.message}`));
        }
      }
    }
  }
  
  return hasValidationErrors;
}

/**
 * Performs the actual archiving process
 * @param context Command context
 * @param changeName Name of the change to archive
 * @param autoConfirm Whether to auto-confirm
 * @param skipSpecs Whether to skip spec updates
 * @param skipValidation Whether to skip validation
 * @param projectRoot Project root directory
 * @param changesDir Changes directory
 * @param changeDir Change directory
 * @param archiveDir Archive directory
 * @param mainSpecsDir Main specs directory
 * @returns Result message
 */
async function performArchive(
  context: CommandContext,
  changeName: string,
  autoConfirm: boolean,
  skipSpecs: boolean,
  skipValidation: boolean,
  projectRoot: string,
  changesDir: string,
  changeDir: string,
  archiveDir: string,
  mainSpecsDir: string
) {
  // Generate specification file before archiving
  try {
    const specFilePath = await generateSpecFile(changeName, projectRoot, context);
    console.log(chalk.green(`✅ Generated specification file: ${specFilePath}`));
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Warning: Failed to generate specification file: ${(error as Error).message}`));
    // Continue with archiving even if spec generation fails
  }
  
  // Handle spec updates unless skipSpecs flag is set
  if (skipSpecs) {
    console.log('Skipping spec updates (--skip-specs flag provided).');
  } else {
    // Find specs to update
    const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir, changeName);
    
    if (specUpdates.length > 0) {
      console.log('\nSpecs to update:');
      for (const update of specUpdates) {
        const status = update.exists ? 'update' : 'create';
        const specName = changeName; // According to requirements, spec name is same as change name
        console.log(`  ${specName}: ${status}`);
      }
      
      // In a real implementation, we would show a confirmation dialog here
      // For now, we'll proceed with the updates
      
      // Prepare all updates first (validation pass, no writes)
      const prepared: Array<{ update: SpecUpdate; rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> = [];
      try {
        for (const update of specUpdates) {
          const built = await buildUpdatedSpec(update, changeName);
          prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
          type: 'message' as const,
          messageType: 'error' as const,
          content: errorMessage + '\nAborted. No files were changed.'
        };
      }
      
      // All validations passed; pre-validate rebuilt full spec and then write files and display counts
      const totals = { added: 0, modified: 0, removed: 0, renamed: 0 };
      for (const p of prepared) {
        const specName = changeName; // According to requirements, spec name is same as change name
        if (!skipValidation) {
          const report = await OpenSpecArchiveValidator.validateSpecContent(specName, p.rebuilt);
          if (!report.valid) {
            console.log(chalk.red(`\nValidation errors in rebuilt spec for ${specName} (will not write changes):`));
            for (const issue of report.issues) {
              if (issue.level === 'ERROR') console.log(chalk.red(`  ✗ ${issue.message}`));
              else if (issue.level === 'WARNING') console.log(chalk.yellow(`  ⚠ ${issue.message}`));
            }
            return {
              type: 'message' as const,
              messageType: 'error' as const,
              content: 'Aborted. No files were changed.'
            };
          }
        }
        await writeUpdatedSpec(p.update, p.rebuilt, p.counts, changeName);
        totals.added += p.counts.added;
        totals.modified += p.counts.modified;
        totals.removed += p.counts.removed;
        totals.renamed += p.counts.renamed;
      }
      console.log(
        `Totals: + ${totals.added}, ~ ${totals.modified}, - ${totals.removed}, → ${totals.renamed}`
      );
      console.log('Specs updated successfully.');
    }
  }
  
  // Create archive directory with date prefix
  const archiveName = `${getArchiveDate()}-${changeName}`;
  const archivePath = path.join(archiveDir, archiveName);
  
  // Check if archive already exists
  try {
    if (fs.existsSync(archivePath)) {
      return {
        type: 'message' as const,
        messageType: 'error' as const,
        content: `Archive '${archiveName}' already exists.`
      };
    }
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Create archive directory if needed
  fs.mkdirSync(archiveDir, { recursive: true });
  
  // Summarize the change using LLM before archiving
  try {
    const cacheService = new OpenSpecCacheService();
    const memoryIntegration = new OpenSpecMemoryIntegration(cacheService);
    const summary = await memoryIntegration.summarizeChangeForArchive(changeName, context);
    
    if (summary) {
      console.log(chalk.blue('\n📝 Change Summary:'));
      console.log(summary);
      console.log('');
    }
  } catch (error) {
    console.warn('Failed to generate change summary:', (error as Error).message);
  }
  
  // Move change to archive
  fs.renameSync(changeDir, archivePath);
  
  return {
    type: 'message' as const,
    messageType: 'info' as const,
    content: `✅ Change "${changeName}" has been archived as "${archiveName}".`,
  };
}

/**
 * Finds spec updates for a change
 * @param changeDir Change directory
 * @param mainSpecsDir Main specs directory
 * @param changeName Name of the change
 * @returns Array of spec updates
 */
async function findSpecUpdates(changeDir: string, mainSpecsDir: string, changeName: string): Promise<SpecUpdate[]> {
  const updates: SpecUpdate[] = [];
  
  // According to requirements, the spec name should be the same as the change name
  const specName = changeName;
  const changeSpecFile = path.join(changeDir, 'spec.md');
  const targetFile = path.join(mainSpecsDir, specName, 'spec.md');
  
  try {
    // Check if change has a spec.md file directly in the change directory
    if (fs.existsSync(changeSpecFile)) {
      // Check if target exists
      let exists = false;
      try {
        if (fs.existsSync(targetFile)) {
          exists = true;
        }
      } catch {
        exists = false;
      }
      
      updates.push({
        source: changeSpecFile,
        target: targetFile,
        exists
      });
    }
  } catch {
    // Source spec doesn't exist, skip
  }
  
  return updates;
}

/**
 * Builds an updated spec by applying delta operations
 * @param update Spec update information
 * @param changeName Name of the change
 * @returns Rebuilt spec content and operation counts
 */
async function buildUpdatedSpec(update: SpecUpdate, changeName: string): Promise<{ rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> {
  // Read change spec content (delta-format expected)
  const changeContent = fs.readFileSync(update.source, 'utf-8');
  
  // Parse deltas from the change spec file
  const operations = DeltaOperationsParser.parseDeltaOperations(changeContent);
  const plan = DeltaOperationsParser.organizeOperationsByType(operations);
  const specName = changeName; // According to requirements, spec name is same as change name
  
  // Pre-validate duplicates within sections
  const addedNames = new Set<string>();
  for (const add of plan.added) {
    const name = add.requirements?.[0]?.header || add.header;
    if (addedNames.has(name)) {
      throw new Error(
        `${specName} validation failed - duplicate requirement in ADDED for header "### Requirement: ${add.header}"`
      );
    }
    addedNames.add(name);
  }
  
  const modifiedNames = new Set<string>();
  for (const mod of plan.modified) {
    const name = mod.requirements?.[0]?.header || mod.header;
    if (modifiedNames.has(name)) {
      throw new Error(
        `${specName} validation failed - duplicate requirement in MODIFIED for header "### Requirement: ${mod.header}"`
      );
    }
    modifiedNames.add(name);
  }
  
  const removedNamesSet = new Set<string>();
  for (const rem of plan.removed) {
    const name = rem.header;
    if (removedNamesSet.has(name)) {
      throw new Error(
        `${specName} validation failed - duplicate requirement in REMOVED for header "### Requirement: ${rem.header}"`
      );
    }
    removedNamesSet.add(name);
  }
  
  const renamedFromSet = new Set<string>();
  const renamedToSet = new Set<string>();
  for (const ren of plan.renamed) {
    const fromName = ren.from?.header || ren.header;
    const toName = ren.to?.header || ren.header;
    if (renamedFromSet.has(fromName)) {
      throw new Error(
        `${specName} validation failed - duplicate FROM in RENAMED for header "### Requirement: ${fromName}"`
      );
    }
    if (renamedToSet.has(toName)) {
      throw new Error(
        `${specName} validation failed - duplicate TO in RENAMED for header "### Requirement: ${toName}"`
      );
    }
    renamedFromSet.add(fromName);
    renamedToSet.add(toName);
  }
  
  // Pre-validate cross-section conflicts
  const conflicts: Array<{ name: string; a: string; b: string }> = [];
  for (const n of modifiedNames) {
    if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'REMOVED' });
    if (addedNames.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'ADDED' });
  }
  for (const n of addedNames) {
    if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'ADDED', b: 'REMOVED' });
  }
  
  // Renamed interplay: MODIFIED must reference the NEW header, not FROM
  for (const ren of plan.renamed) {
    const fromName = ren.from?.header || ren.header;
    const toName = ren.to?.header || ren.header;
    if (modifiedNames.has(fromName)) {
      throw new Error(
        `${specName} validation failed - when a rename exists, MODIFIED must reference the NEW header "### Requirement: ${toName}"`
      );
    }
    // Detect ADDED colliding with a RENAMED TO
    if (addedNames.has(toName)) {
      throw new Error(
        `${specName} validation failed - RENAMED TO header collides with ADDED for "### Requirement: ${toName}"`
      );
    }
  }
  
  if (conflicts.length > 0) {
    const c = conflicts[0];
    throw new Error(
      `${specName} validation failed - requirement present in multiple sections (${c.a} and ${c.b}) for header "### Requirement: ${c.name}"`
    );
  }
  
  const hasAnyDelta = (plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length) > 0;
  if (!hasAnyDelta) {
    throw new Error(
      `Delta parsing found no operations for ${path.basename(path.dirname(update.source))}. ` +
      `Provide ADDED/MODIFIED/REMOVED/RENAMED sections in change spec.`
    );
  }
  
  // Load or create base target content
  let targetContent: string;
  try {
    targetContent = fs.readFileSync(update.target, 'utf-8');
  } catch {
    // Target spec does not exist; only ADDED operations are permitted
    if (plan.modified.length > 0 || plan.removed.length > 0 || plan.renamed.length > 0) {
      throw new Error(
        `${specName}: target spec does not exist; only ADDED requirements are allowed for new specs.`
      );
    }
    targetContent = buildSpecSkeleton(specName, changeName);
  }
  
  // Extract requirements section and build name->block map
  const requirements = SpecificationValidator.parseSpecificationRequirements(targetContent);
  const nameToBlock = new Map<string, SpecificationRequirement>();
  for (const req of requirements) {
    nameToBlock.set(req.header, req);
  }
  
  // Apply operations in order: RENAMED → REMOVED → MODIFIED → ADDED
  // RENAMED
  for (const ren of plan.renamed) {
    const fromName = ren.from?.header || ren.header;
    const toName = ren.to?.header || ren.header;
    
    if (!nameToBlock.has(fromName)) {
      throw new Error(
        `${specName} RENAMED failed for header "### Requirement: ${fromName}" - source not found`
      );
    }
    if (nameToBlock.has(toName)) {
      throw new Error(
        `${specName} RENAMED failed for header "### Requirement: ${toName}" - target already exists`
      );
    }
    
    const block = nameToBlock.get(fromName)!;
    nameToBlock.delete(fromName);
    nameToBlock.set(toName, block);
  }
  
  // REMOVED
  for (const rem of plan.removed) {
    const name = rem.header;
    if (!nameToBlock.has(name)) {
      throw new Error(
        `${specName} REMOVED failed for header "### Requirement: ${name}" - not found`
      );
    }
    nameToBlock.delete(name);
  }
  
  // MODIFIED
  for (const mod of plan.modified) {
    const req = mod.requirements?.[0];
    const name = req?.header || mod.header;
    if (!nameToBlock.has(name)) {
      throw new Error(
        `${specName} MODIFIED failed for header "### Requirement: ${name}" - not found`
      );
    }
    // Replace block with provided content
    if (req) {
      nameToBlock.set(name, req);
    }
  }
  
  // ADDED
  for (const add of plan.added) {
    const req = add.requirements?.[0];
    const name = req?.header || add.header;
    if (nameToBlock.has(name)) {
      throw new Error(
        `${specName} ADDED failed for header "### Requirement: ${name}" - already exists`
      );
    }
    if (req) {
      nameToBlock.set(name, req);
    }
  }
  
  // Rebuild spec content
  let rebuiltContent = `# ${specName} Specification\n\n`;
  for (const [name, block] of nameToBlock.entries()) {
    rebuiltContent += `### Requirement: ${name}\n\n`;
    for (const scenario of block.scenarios) {
      rebuiltContent += `#### Scenario: ${scenario.header}\n\n`;
      rebuiltContent += `${scenario.description}\n\n`;
    }
    rebuiltContent += '\n';
  }
  
  return {
    rebuilt: rebuiltContent.trim(),
    counts: {
      added: plan.added.length,
      modified: plan.modified.length,
      removed: plan.removed.length,
      renamed: plan.renamed.length,
    }
  };
}

/**
 * Writes an updated spec to file
 * @param update Spec update information
 * @param rebuilt Rebuilt spec content
 * @param counts Operation counts
 * @param changeName Name of the change (used as spec name)
 */
async function writeUpdatedSpec(update: SpecUpdate, rebuilt: string, counts: { added: number; modified: number; removed: number; renamed: number }, changeName: string): Promise<void> {
  // Create target directory if needed
  const targetDir = path.dirname(update.target);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(update.target, rebuilt);
  
  const specName = changeName; // According to requirements, spec name is same as change name
  console.log(`Applying changes to openspec/specs/${specName}/spec.md:`);
  if (counts.added) console.log(`  + ${counts.added} added`);
  if (counts.modified) console.log(`  ~ ${counts.modified} modified`);
  if (counts.removed) console.log(`  - ${counts.removed} removed`);
  if (counts.renamed) console.log(`  → ${counts.renamed} renamed`);
}

/**
 * Builds a spec skeleton for new specs
 * @param specFolderName Name of the spec folder
 * @param changeName Name of the change
 * @returns Spec skeleton content
 */
function buildSpecSkeleton(specFolderName: string, changeName: string): string {
  const titleBase = specFolderName;
  return `# ${titleBase} Specification\n\n## Purpose\nTBD - created by archiving change ${changeName}. Update Purpose after archive.\n\n## Requirements\n`;
}

/**
 * Gets the current date in YYYY-MM-DD format for archive naming
 * @returns Date string in YYYY-MM-DD format
 */
export function getArchiveDate(): string {
  return new Date().toISOString().split('T')[0];
}