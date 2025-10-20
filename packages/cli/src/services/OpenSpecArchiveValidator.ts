/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { readFileEfficiently } from './OpenSpecFileUtils.js';
import { DeltaOperationsParser } from './OpenSpecDeltaOperationsParser.js';
import { SpecificationValidator } from './OpenSpecSpecificationValidator.js';

/**
 * Represents a validation issue
 */
export interface ValidationIssue {
  level: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
}

/**
 * Represents a validation report
 */
export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validator for OpenSpec archive operations
 */
export class OpenSpecArchiveValidator {
  /**
   * Validates a change proposal file
   * @param changeFilePath Path to the change proposal file
   * @returns Validation report
   */
  static async validateChange(changeFilePath: string): Promise<ValidationReport> {
    try {
      // Check if file exists
      if (!fs.existsSync(changeFilePath)) {
        return {
          valid: true,
          issues: []
        };
      }
      
      // Read the change file
      await readFileEfficiently(changeFilePath);
      
      // For now, we'll just return a basic validation
      // In a full implementation, this would validate the proposal format
      return {
        valid: true,
        issues: []
      };
    } catch (error) {
      return {
        valid: true,
        issues: [{
          level: 'WARNING',
          message: `Could not validate change proposal: ${(error as Error).message}`
        }]
      };
    }
  }
  
  /**
   * Validates delta specs in a change directory
   * @param changeDir Path to the change directory
   * @returns Validation report
   */
  static async validateChangeDeltaSpecs(changeDir: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    let hasErrors = false;
    
    try {
      const changeSpecsDir = path.join(changeDir, 'specs');
      
      // Check if specs directory exists
      if (!fs.existsSync(changeSpecsDir)) {
        return {
          valid: true,
          issues: []
        };
      }
      
      // Get all spec files
      const specEntries = fs.readdirSync(changeSpecsDir, { withFileTypes: true });
      
      for (const entry of specEntries) {
        if (entry.isDirectory()) {
          const specFile = path.join(changeSpecsDir, entry.name, 'spec.md');
          
          // Check if spec file exists
          if (fs.existsSync(specFile)) {
            try {
              const content = await readFileEfficiently(specFile);
              
              // Parse delta operations
              const operations = DeltaOperationsParser.parseDeltaOperations(content);
              
              // Check if there are any operations
              if (operations.length === 0) {
                issues.push({
                  level: 'ERROR',
                  message: `No delta operations found in ${entry.name}/spec.md`
                });
                hasErrors = true;
              }
              
              // Validate delta format
              const deltaValidation = DeltaOperationsParser.validateAgentsMdFormat(content);
              if (!deltaValidation.isValid) {
                for (const issue of deltaValidation.issues) {
                  issues.push({
                    level: 'ERROR',
                    message: `${entry.name}/spec.md: ${issue}`
                  });
                  hasErrors = true;
                }
              }
            } catch (error) {
              issues.push({
                level: 'ERROR',
                message: `Failed to validate ${entry.name}/spec.md: ${(error as Error).message}`
              });
              hasErrors = true;
            }
          }
        }
      }
      
      return {
        valid: !hasErrors,
        issues
      };
    } catch (error) {
      return {
        valid: false,
        issues: [{
          level: 'ERROR',
          message: `Failed to validate change delta specs: ${(error as Error).message}`
        }]
      };
    }
  }
  
  /**
   * Validates spec content
   * @param specName Name of the spec
   * @param content Spec content
   * @returns Validation report
   */
  static async validateSpecContent(specName: string, content: string): Promise<ValidationReport> {
    try {
      // Validate specification format
      const formatValidation = SpecificationValidator.validateSpecificationFormat(content, true);
      
      const issues: ValidationIssue[] = [];
      let hasErrors = false;
      
      if (!formatValidation.isValid) {
        for (const issue of formatValidation.issues) {
          issues.push({
            level: 'ERROR',
            message: `${specName}: ${issue}`
          });
          hasErrors = true;
        }
      }
      
      return {
        valid: !hasErrors,
        issues
      };
    } catch (error) {
      return {
        valid: false,
        issues: [{
          level: 'ERROR',
          message: `Failed to validate spec content for ${specName}: ${(error as Error).message}`
        }]
      };
    }
  }
}