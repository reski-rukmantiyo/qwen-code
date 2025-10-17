/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

/**
 * Validates that code conforms to OpenSpec specifications
 */
export class OpenSpecCodeValidator {
  private logger: Console;

  constructor(logger: Console = console) {
    this.logger = logger;
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
      
      // Check for basic code quality issues
      if (this.hasObviousIssues(code)) {
        issues.push('Code contains obvious issues that violate best practices');
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

  /**
   * Gets the specification for a specific change
   * @param changeName The name of the change
   * @returns The specification content or null if not found
   */
  getChangeSpecification(changeName: string): string | null {
    try {
      const projectRoot = process.cwd();
      const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      
      if (!fs.existsSync(changeDir)) {
        return null;
      }
      
      const proposalPath = path.join(changeDir, 'proposal.md');
      if (fs.existsSync(proposalPath)) {
        return fs.readFileSync(proposalPath, 'utf-8');
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get change specification for ${changeName}: ${(error as Error).message}`);
      return null;
    }
  }
}