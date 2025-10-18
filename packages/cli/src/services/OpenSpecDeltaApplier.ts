/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { DeltaOperationsParser, type DeltaOperation } from './OpenSpecDeltaOperationsParser.js';
import { SpecificationValidator, type SpecificationRequirement } from './OpenSpecSpecificationValidator.js';

/**
 * Applies delta operations to merge changes into baseline specifications during archiving
 */
export class DeltaApplier {
  /**
   * Applies delta operations from a change to merge into baseline specifications
   * @param baselineSpecPath Path to the baseline specification file
   * @param deltaSpecPath Path to the delta specification file
   * @param outputPath Path where the merged specification should be written
   * @returns Result of the merge operation
   */
  static async applyDelta(
    baselineSpecPath: string,
    deltaSpecPath: string,
    outputPath: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Read baseline specification
      let baselineContent = '';
      if (fs.existsSync(baselineSpecPath)) {
        baselineContent = fs.readFileSync(baselineSpecPath, 'utf-8');
      }

      // Read delta specification
      const deltaContent = fs.readFileSync(deltaSpecPath, 'utf-8');
      
      // Parse delta operations
      const operations = DeltaOperationsParser.parseDeltaOperations(deltaContent);
      
      // Apply operations to baseline
      const mergedContent = this.applyOperationsToBaseline(baselineContent, operations);
      
      // Validate merged content
      const validationResult = SpecificationValidator.validateSpecificationFormat(mergedContent);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: `Merged specification has validation issues: ${validationResult.issues.join(', ')}`
        };
      }
      
      // Write merged content to output path
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, mergedContent);
      
      return {
        success: true,
        message: `Successfully applied delta operations and merged specification to ${outputPath}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to apply delta operations: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Applies delta operations to baseline content
   * @param baselineContent The baseline specification content
   * @param operations Array of delta operations to apply
   * @returns Merged content with operations applied
   */
  private static applyOperationsToBaseline(
    baselineContent: string,
    operations: DeltaOperation[]
  ): string {
    // Parse baseline requirements if it exists
    let baselineRequirements: SpecificationRequirement[] = [];
    if (baselineContent.trim()) {
      baselineRequirements = SpecificationValidator.parseSpecificationRequirements(baselineContent);
    }
    
    // Apply each operation
    for (const operation of operations) {
      switch (operation.type) {
        case 'ADDED':
          // Add new requirement
          baselineRequirements.push({
            header: operation.header,
            scenarios: [] // Will be populated if scenarios are defined in content
          });
          break;
          
        case 'MODIFIED':
          // Find and modify existing requirement
          const modIndex = baselineRequirements.findIndex(req => req.header === operation.header);
          if (modIndex !== -1) {
            // For simplicity, we'll replace the entire requirement
            // In a more sophisticated implementation, we might parse scenarios from content
            baselineRequirements[modIndex] = {
              header: operation.header,
              scenarios: [] // Could parse from operation.content in a fuller implementation
            };
          }
          break;
          
        case 'REMOVED':
          // Remove requirement
          const remIndex = baselineRequirements.findIndex(req => req.header === operation.header);
          if (remIndex !== -1) {
            baselineRequirements.splice(remIndex, 1);
          }
          break;
          
        case 'RENAMED':
          // Rename requirement
          if (operation.previousHeader) {
            const renIndex = baselineRequirements.findIndex(req => req.header === operation.previousHeader);
            if (renIndex !== -1) {
              baselineRequirements[renIndex].header = operation.header;
            }
          }
          break;
      }
    }
    
    // Format merged requirements back to markdown
    return SpecificationValidator.formatSpecificationRequirements(baselineRequirements);
  }
  
  /**
   * Validates that delta operations can be applied to baseline specifications
   * @param baselineSpecPath Path to the baseline specification file
   * @param deltaSpecPath Path to the delta specification file
   * @returns Validation result
   */
  static async validateDeltaApplication(
    baselineSpecPath: string,
    deltaSpecPath: string
  ): Promise<{ canApply: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Read delta specification
      const deltaContent = fs.readFileSync(deltaSpecPath, 'utf-8');
      
      // Parse delta operations
      const operations = DeltaOperationsParser.parseDeltaOperations(deltaContent);
      
      // Check for operations that reference non-existent requirements (for MODIFIED/REMOVED/RENAMED)
      if (fs.existsSync(baselineSpecPath)) {
        const baselineContent = fs.readFileSync(baselineSpecPath, 'utf-8');
        const baselineRequirements = SpecificationValidator.parseSpecificationRequirements(baselineContent);
        const baselineHeaders = baselineRequirements.map(req => req.header);
        
        for (const operation of operations) {
          if ((operation.type === 'MODIFIED' || operation.type === 'REMOVED') && 
              !baselineHeaders.includes(operation.header)) {
            issues.push(`Operation ${operation.type} references non-existent requirement: "${operation.header}"`);
          }
          
          if (operation.type === 'RENAMED' && operation.previousHeader && 
              !baselineHeaders.includes(operation.previousHeader)) {
            issues.push(`Rename operation references non-existent requirement: "${operation.previousHeader}"`);
          }
        }
      } else {
        // If no baseline exists, only ADDED operations should be allowed
        for (const operation of operations) {
          if (operation.type !== 'ADDED') {
            issues.push(`Operation ${operation.type} cannot be applied because no baseline specification exists`);
          }
        }
      }
      
      return { canApply: issues.length === 0, issues };
    } catch (error) {
      return {
        canApply: false,
        issues: [`Failed to validate delta application: ${(error as Error).message}`]
      };
    }
  }
}