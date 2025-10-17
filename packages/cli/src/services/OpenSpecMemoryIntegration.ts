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