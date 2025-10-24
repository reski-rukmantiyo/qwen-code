/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { OpenSpecCacheService } from './OpenSpecCacheService.js';

/**
 * Service that integrates OpenSpec with Qwen Code's memory system
 */
export class OpenSpecMemoryIntegration {
  private cacheService: OpenSpecCacheService;
  private logger: Console;

  constructor(cacheService: OpenSpecCacheService, logger: Console = console) {
    this.cacheService = cacheService;
    this.logger = logger;
  }

  /**
   * Generates memory content from OpenSpec files to be included in AI context
   * @returns Formatted string containing OpenSpec context for AI models
   */
  async generateOpenSpecMemory(): Promise<string> {
    try {
      const projectRoot = process.cwd();
      const openspecDir = path.join(projectRoot, 'openspec');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(openspecDir)) {
        return '';
      }
      
      // Check if required directories exist
      const specsDir = path.join(openspecDir, 'specs');
      const changesDir = path.join(openspecDir, 'changes');
      
      if (!fs.existsSync(specsDir) || !fs.existsSync(changesDir)) {
        return '';
      }
      
      let memoryContent = '\n# OpenSpec Context\n\n';
      memoryContent += 'This project uses OpenSpec for specification-driven development.\n\n';
      
      // Add specifications as context
      const specFilesContent = await this.collectMarkdownFilesContent(specsDir);
      if (specFilesContent) {
        memoryContent += '## Current Specifications\n\n';
        memoryContent += specFilesContent;
        memoryContent += '\n';
      }
      
      // Add active changes as context
      const changesContent = await this.collectChangesContent(changesDir);
      if (changesContent) {
        memoryContent += '## Active Changes\n\n';
        memoryContent += changesContent;
        memoryContent += '\n';
      }
      
      // Add guidance for AI
      memoryContent += '## AI Guidance\n\n';
      memoryContent += 'When implementing changes:\n';
      memoryContent += '- Follow the specifications in the specs/ directory\n';
      memoryContent += '- Consider the proposed changes in the changes/ directory\n';
      memoryContent += '- Ensure all code conforms to the defined specifications\n';
      memoryContent += '- Validate implementation against change proposals before execution\n';
      
      return memoryContent;
    } catch (error) {
      this.logger.warn(`Failed to generate OpenSpec memory: ${(error as Error).message}`);
      return '';
    }
  }

  /**
   * Collects content from all markdown files in a directory
   */
  private async collectMarkdownFilesContent(directory: string): Promise<string> {
    try {
      if (!fs.existsSync(directory)) {
        return '';
      }
      
      let content = '';
      const files = fs.readdirSync(directory, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(directory, file.name);
        
        if (file.isFile() && file.name.endsWith('.md')) {
          try {
            const fileContent = this.cacheService.getFileContent(fullPath);
            if (fileContent.trim()) {
              content += `### ${path.basename(file.name, '.md')}\n\n`;
              content += `${fileContent}\n\n`;
            }
          } catch (error) {
            this.logger.warn(`Failed to read file ${fullPath}: ${(error as Error).message}`);
          }
        } else if (file.isDirectory()) {
          const subdirContent = await this.collectMarkdownFilesContent(fullPath);
          if (subdirContent) {
            content += `### ${file.name}\n\n`;
            content += subdirContent;
            content += '\n';
          }
        }
      }
      
      return content;
    } catch (error) {
      this.logger.warn(`Failed to collect markdown files from ${directory}: ${(error as Error).message}`);
      return '';
    }
  }

  /**
   * Collects content from change proposal directories
   */
  private async collectChangesContent(changesDir: string): Promise<string> {
    try {
      if (!fs.existsSync(changesDir)) {
        return '';
      }
      
      let content = '';
      const changeDirs = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(changesDir, dirent.name));
        
      for (const changeDir of changeDirs) {
        const changeName = path.basename(changeDir);
        content += `### ${changeName}\n\n`;
        
        // Read proposal.md
        const proposalPath = path.join(changeDir, 'proposal.md');
        if (fs.existsSync(proposalPath)) {
          try {
            const proposalContent = this.cacheService.getFileContent(proposalPath);
            if (proposalContent.trim()) {
              content += '<details>\n<summary>Change Proposal</summary>\n\n';
              content += `${proposalContent}\n\n`;
              content += '</details>\n\n';
            }
          } catch (error) {
            this.logger.warn(`Failed to read proposal ${proposalPath}: ${(error as Error).message}`);
          }
        }
        
        // Read tasks.md
        const tasksPath = path.join(changeDir, 'tasks.md');
        if (fs.existsSync(tasksPath)) {
          try {
            const tasksContent = this.cacheService.getFileContent(tasksPath);
            if (tasksContent.trim()) {
              content += '<details>\n<summary>Implementation Tasks</summary>\n\n';
              content += `${tasksContent}\n\n`;
              content += '</details>\n\n';
            }
          } catch (error) {
            this.logger.warn(`Failed to read tasks ${tasksPath}: ${(error as Error).message}`);
          }
        }
        
        // Read design.md
        const designPath = path.join(changeDir, 'design.md');
        if (fs.existsSync(designPath)) {
          try {
            const designContent = this.cacheService.getFileContent(designPath);
            if (designContent.trim()) {
              content += '<details>\n<summary>Technical Design</summary>\n\n';
              content += `${designContent}\n\n`;
              content += '</details>\n\n';
            }
          } catch (error) {
            this.logger.warn(`Failed to read design ${designPath}: ${(error as Error).message}`);
          }
        }
        
        // Read spec deltas
        const specsDir = path.join(changeDir, 'specs');
        if (fs.existsSync(specsDir)) {
          const specDeltasContent = await this.collectMarkdownFilesContent(specsDir);
          if (specDeltasContent) {
            content += '<details>\n<summary>Specification Deltas</summary>\n\n';
            content += specDeltasContent;
            content += '</details>\n\n';
          }
        }
      }
      
      return content;
    } catch (error) {
      this.logger.warn(`Failed to collect changes content from ${changesDir}: ${(error as Error).message}`);
      return '';
    }
  }

  /**
   * Validates that generated code conforms to OpenSpec specifications
   * @param code The code to validate
   * @param filePath The file path where the code will be written
   * @returns Validation result with any issues found
   */
  async validateCodeConformance(code: string, filePath: string): Promise<{isValid: boolean; issues: string[]}> {
    try {
      const projectRoot = process.cwd();
      const openspecDir = path.join(projectRoot, 'openspec');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(openspecDir)) {
        return { isValid: true, issues: [] };
      }
      
      // For now, we'll do basic validation
      // In a full implementation, this would check against specific specifications
      const issues: string[] = [];
      
      // Check for basic code quality issues
      if (this.hasObviousIssues(code)) {
        issues.push('Code contains obvious issues that violate best practices');
      }
      
      // Check if the file is part of an active change
      const changesDir = path.join(openspecDir, 'changes');
      if (fs.existsSync(changesDir)) {
        const changeDirs = fs.readdirSync(changesDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
          
        // Simple check - in a real implementation, this would be more sophisticated
        if (changeDirs.length > 0) {
          // This is just a placeholder - a real implementation would check
          // the code against the specific change requirements
          this.logger.debug(`Validating code for file ${filePath} against ${changeDirs.length} active changes`);
        }
      }
      
      return { isValid: issues.length === 0, issues };
    } catch (error) {
      this.logger.warn(`Failed to validate code conformance: ${(error as Error).message}`);
      return { isValid: true, issues: [`Validation error: ${(error as Error).message}`] };
    }
  }

  /**
   * Summarizes OpenSpec change files using LLM before archiving
   * @param changeName Name of the change to summarize
   * @param context Command context containing services needed for LLM interaction
   * @returns Summary of the change files or null if summarization failed
   */
  async summarizeChangeForArchive(changeName: string, context: any): Promise<string | null> {
    try {
      const projectRoot = process.cwd();
      const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      
      // Check if change directory exists
      if (!fs.existsSync(changeDir)) {
        this.logger.warn(`Change directory not found: ${changeDir}`);
        return null;
      }
      
      // Collect content from the key files
      let changeContent = '';
      
      // Read proposal.md
      const proposalPath = path.join(changeDir, 'proposal.md');
      if (fs.existsSync(proposalPath)) {
        try {
          const proposalContent = this.cacheService.getFileContent(proposalPath);
          if (proposalContent.trim()) {
            changeContent += `# Change Proposal\n\n${proposalContent}\n\n`;
          }
        } catch (error) {
          this.logger.warn(`Failed to read proposal ${proposalPath}: ${(error as Error).message}`);
        }
      }
      
      // Read tasks.md
      const tasksPath = path.join(changeDir, 'tasks.md');
      if (fs.existsSync(tasksPath)) {
        try {
          const tasksContent = this.cacheService.getFileContent(tasksPath);
          if (tasksContent.trim()) {
            changeContent += `# Implementation Tasks\n\n${tasksContent}\n\n`;
          }
        } catch (error) {
          this.logger.warn(`Failed to read tasks ${tasksPath}: ${(error as Error).message}`);
        }
      }
      
      // Read design.md
      const designPath = path.join(changeDir, 'design.md');
      if (fs.existsSync(designPath)) {
        try {
          const designContent = this.cacheService.getFileContent(designPath);
          if (designContent.trim()) {
            changeContent += `# Technical Design\n\n${designContent}\n\n`;
          }
        } catch (error) {
          this.logger.warn(`Failed to read design ${designPath}: ${(error as Error).message}`);
        }
      }
      
      // If no content was found, return null
      if (!changeContent.trim()) {
        this.logger.warn(`No content found for change: ${changeName}`);
        return null;
      }
      
      // Try to use LLM for summarization if available
      try {
        // Get the LLM client from the config
        const config = context?.services?.config;
        if (config) {
          const geminiClient = config.getGeminiClient();
          if (geminiClient) {
            // Create a prompt that obeys AGENTS.md, openspec/project.md, and openspec/AGENTS.md
            const prompt = `Summarize the following OpenSpec change for archiving purposes. 
This summary should capture the key points from the proposal, tasks, and design documents.

Please ensure your summary:
1. Follows the guidelines in AGENTS.md
2. Respects the project context in openspec/project.md (if it exists)
3. Aligns with the OpenSpec workflow described in openspec/AGENTS.md (if it exists)
4. Is concise but comprehensive
5. Highlights the main objectives and outcomes of the change

Change Content:
${changeContent}

Summary:`;

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
                  return part.text.trim();
                }
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn(`LLM summarization failed: ${(error as Error).message}`);
      }
      
      // Fallback to simple extraction if LLM is not available or fails
      return this.extractSimpleSummary(changeContent);
    } catch (error) {
      this.logger.warn(`Failed to summarize change ${changeName}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Extracts a simple summary from change content as fallback
   */
  private extractSimpleSummary(content: string): string {
    // Simple heuristic to extract key information
    const lines = content.split('\n');
    const summaryLines: string[] = [];
    
    // Extract headers and first sentences of sections
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i].trim();
      if (line.startsWith('#') || line.startsWith('##') || line.startsWith('###')) {
        summaryLines.push(line);
      } else if (line.length > 50 && !line.startsWith('-') && !line.startsWith('*')) {
        // Add first substantial line of content
        if (summaryLines.length > 0 && !summaryLines[summaryLines.length - 1].startsWith('#')) {
          summaryLines.push(line);
        }
      }
    }
    
    return summaryLines.join('\n').substring(0, 1000) + (summaryLines.join('\n').length > 1000 ? '...' : '');
  }

  /**
   * Checks for obvious code issues
   */
  private hasObviousIssues(code: string): boolean {
    // This is a simple heuristic - a real implementation would be much more sophisticated
    const lines = code.split('\n');
    
    // Check for excessively long lines
    for (const line of lines) {
      if (line.length > 200) {
        return true;
      }
    }
    
    // Check for obvious anti-patterns
    if (code.includes('console.log(') && !code.includes('// Debug') && !code.includes('// debug')) {
      // Allow console.log in debug contexts
      return true;
    }
    
    return false;
  }

  /**
   * Gets a list of active changes for agent configuration
   * @returns Array of active change names
   */
  getActiveChanges(): string[] {
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      if (!fs.existsSync(changesDir)) {
        return [];
      }
      
      return fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    } catch (error) {
      this.logger.warn(`Failed to get active changes: ${(error as Error).message}`);
      return [];
    }
  }
}