/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a delta operation in a specification change
 */
export interface DeltaOperation {
  type: 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED';
  header: string;
  content: string;
  previousHeader?: string; // For RENAMED operations
}

/**
 * Parses structured delta operations from markdown content
 */
export class DeltaOperationsParser {
  /**
   * Parses markdown content to extract delta operations
   * @param content The markdown content to parse
   * @returns Array of parsed delta operations
   */
  static parseDeltaOperations(content: string): DeltaOperation[] {
    const operations: DeltaOperation[] = [];
    const lines = content.split('\n');
    let currentOperation: DeltaOperation | null = null;
    let currentContent = '';

    for (const line of lines) {
      // Check for operation header pattern: ## [OPERATION_TYPE] Header Text
      const operationMatch = line.match(/^## \$\[(ADDED|MODIFIED|REMOVED|RENAMED)\]\s*(.+)$/);
      if (operationMatch) {
        // Save previous operation if exists
        if (currentOperation) {
          currentOperation.content = currentContent.trim();
          operations.push(currentOperation);
        }

        // Start new operation
        const type = operationMatch[1] as 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED';
        const header = operationMatch[2];
        currentOperation = { type, header, content: '' };

        // For RENAMED operations, check if there's a previous header pattern
        if (type === 'RENAMED') {
          const previousMatch = header.match(/^(.+)\s*\->\s*(.+)$/);
          if (previousMatch) {
            currentOperation.previousHeader = previousMatch[1];
            currentOperation.header = previousMatch[2];
          }
        }

        currentContent = '';
        continue;
      }

      // Accumulate content for current operation
      if (currentOperation) {
        currentContent += line + '\n';
      }
    }

    // Save the last operation
    if (currentOperation) {
      currentOperation.content = currentContent.trim();
      operations.push(currentOperation);
    }

    return operations;
  }

  /**
   * Converts delta operations back to markdown format
   * @param operations Array of delta operations
   * @returns Markdown formatted string
   */
  static formatDeltaOperations(operations: DeltaOperation[]): string {
    let content = '';
    
    for (const operation of operations) {
      content += `## [${operation.type}] `;
      
      if (operation.type === 'RENAMED' && operation.previousHeader) {
        content += `${operation.previousHeader} -> ${operation.header}\n`;
      } else {
        content += `${operation.header}\n`;
      }
      
      content += `${operation.content}\n\n`;
    }
    
    return content.trim();
  }

  /**
   * Validates that the content follows the structured delta format
   * @param content The markdown content to validate
   * @returns Validation result with any issues found
   */
  static validateDeltaFormat(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const lines = content.split('\n');
    let hasValidOperations = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for operation header pattern
      const operationMatch = line.match(/^## \$\[(ADDED|MODIFIED|REMOVED|RENAMED)\]\s*(.+)$/);
      if (operationMatch) {
        hasValidOperations = true;
        const type = operationMatch[1];
        const header = operationMatch[2];

        // Validate header is not empty
        if (!header.trim()) {
          issues.push(`Line ${i + 1}: Operation header cannot be empty`);
        }

        // Validate RENAMED operations have proper format
        if (type === 'RENAMED') {
          const renameMatch = header.match(/^(.+)\s*\->\s*(.+)$/);
          if (!renameMatch) {
            issues.push(`Line ${i + 1}: RENAMED operation should follow format "Previous Header -> New Header"`);
          } else {
            const previousHeader = renameMatch[1];
            const newHeader = renameMatch[2];
            if (!previousHeader.trim() || !newHeader.trim()) {
              issues.push(`Line ${i + 1}: RENAMED operation headers cannot be empty`);
            }
          }
        }
      }
    }

    // Check if any valid operations were found
    if (!hasValidOperations) {
      issues.push('No valid delta operations found. At least one operation with format "## [TYPE] Header" is required.');
    }

    return { isValid: issues.length === 0, issues };
  }
}