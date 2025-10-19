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
      // Check for operation header pattern: ## OPERATION_TYPE Requirements
      const operationMatch = line.match(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements(?:\s*:\s*(.+))?$/);
      if (operationMatch) {
        // Save previous operation if exists
        if (currentOperation) {
          currentOperation.content = currentContent.trim();
          operations.push(currentOperation);
        }

        // Start new operation
        const type = operationMatch[1] as 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED';
        const header = operationMatch[2] || '';
        currentOperation = { type, header, content: '' };

        currentContent = '';
        continue;
      }

      // Check for requirement headers within operations
      const requirementMatch = line.match(/^### Requirement: (.+)$/);
      if (requirementMatch && currentOperation) {
        // This is part of the operation content
        currentContent += line + '\n';
        continue;
      }

      // Check for scenario headers within operations
      const scenarioMatch = line.match(/^#### Scenario: (.+)$/);
      if (scenarioMatch && currentOperation) {
        // This is part of the operation content
        currentContent += line + '\n';
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
      content += `## ${operation.type} Requirements\n`;
      content += `${operation.content}\n\n`;
    }
    
    return content.trim();
  }

  /**
   * Validates that the content follows the structured delta format
   * @param content The markdown content to validate
   * @param strictMode Whether to enforce strict validation rules
   * @returns Validation result with any issues found
   */
  static validateDeltaFormat(content: string, strictMode: boolean = false): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const lines = content.split('\n');
    let hasValidOperations = false;
    let addedOperations = 0;
    let modifiedOperations = 0;
    let removedOperations = 0;
    let renamedOperations = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for operation header pattern (AGENTS.md format)
      const operationMatch = line.match(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements$/);
      if (operationMatch) {
        hasValidOperations = true;
        const type = operationMatch[1];
        
        // Count operation types
        switch (type) {
          case 'ADDED':
            addedOperations++;
            break;
          case 'MODIFIED':
            modifiedOperations++;
            break;
          case 'REMOVED':
            removedOperations++;
            break;
          case 'RENAMED':
            renamedOperations++;
            break;
        }

        // Validate that operation has content
        let hasContent = false;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          // Stop if we reach another operation header
          if (nextLine.match(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements$/)) {
            break;
          }
          // Check if there's meaningful content
          if (nextLine.trim() && !nextLine.match(/^\s*$/)) {
            hasContent = true;
            break;
          }
        }
        
        if (!hasContent) {
          issues.push(`Line ${i + 1}: ${type} operation should have content. Example: "## ${type} Requirements" followed by requirement definitions.`);
        }
        
        // Type-specific validation
        switch (type) {
          case 'ADDED':
            // ADDED operations should contain new requirements
            break;
          case 'MODIFIED':
            // MODIFIED operations should reference existing requirements
            break;
          case 'REMOVED':
            // REMOVED operations should include reason and migration info
            break;
          case 'RENAMED':
            // RENAMED operations should have FROM/TO format
            break;
        }
      }
      
      // Check for improperly formatted operation headers
      const improperMatch = line.match(/^## \[(ADDED|MODIFIED|REMOVED|RENAMED)\]/);
      if (improperMatch) {
        issues.push(`Line ${i + 1}: Operation header should use format "## TYPE Requirements" not "## [TYPE] ...". Example: "## ${improperMatch[1]} Requirements"`);
      }
      
      // Check for other common formatting mistakes
      const bracketMatch = line.match(/^## (ADDED|MODIFIED|REMOVED|RENAMED) \[Requirements\]/);
      if (bracketMatch) {
        issues.push(`Line ${i + 1}: Operation header should not have brackets around "Requirements". Use "## ${bracketMatch[1]} Requirements" not "## ${bracketMatch[1]} [Requirements]"`);
      }
    }

    // Check if any valid operations were found
    if (!hasValidOperations) {
      issues.push('No valid delta operations found. At least one operation with format "## TYPE Requirements" is required. Example: "## ADDED Requirements"');
    }

    // In strict mode, check for additional requirements
    if (strictMode) {
      // Check that change has at least one delta
      const operations = this.parseDeltaOperations(content);
      if (operations.length === 0) {
        issues.push('Change must have at least one delta');
      }
      
      // Check that each requirement has at least one scenario
      for (const operation of operations) {
        // Parse requirements in each operation
        const requirementLines = operation.content.split('\n');
        let currentRequirement: string | null = null;
        let hasScenarios = false;
        
        for (const line of requirementLines) {
          const requirementMatch = line.match(/^### Requirement: (.+)$/);
          if (requirementMatch) {
            // If we were processing a previous requirement, check if it had scenarios
            if (currentRequirement && !hasScenarios) {
              issues.push(`Requirement "${currentRequirement}" must have at least one scenario.`);
            }
            
            // Start new requirement
            currentRequirement = requirementMatch[1];
            hasScenarios = false;
            continue;
          }
          
          // Check for scenario headers within requirements
          const scenarioMatch = line.match(/^#### Scenario: /);
          if (scenarioMatch && currentRequirement) {
            hasScenarios = true;
          }
        }
        
        // Check the last requirement
        if (currentRequirement && !hasScenarios) {
          issues.push(`Requirement "${currentRequirement}" must have at least one scenario.`);
        }
      }
    }

    return { isValid: issues.length === 0, issues };
  }
  
  /**
   * Validates delta operations format for AGENTS.md compliance
   * @param content The markdown content to validate
   * @returns Validation result with any issues found
   */
  static validateAgentsMdFormat(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for proper delta operation headers
    const validHeaders = ['## ADDED Requirements', '## MODIFIED Requirements', '## REMOVED Requirements', '## RENAMED Requirements'];
    const headerRegex = /^## [A-Z]+/gm;
    const headers = content.match(headerRegex) || [];
    
    // Track operation types
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;
    let renamedCount = 0;
    
    for (const header of headers) {
      if (!validHeaders.includes(header)) {
        // Check if it's a close variant that should be corrected
        if (header.includes('ADDED') && !header.includes('## ADDED Requirements')) {
          issues.push(`Header should be exactly "## ADDED Requirements" but found "${header}"`);
        } else if (header.includes('MODIFIED') && !header.includes('## MODIFIED Requirements')) {
          issues.push(`Header should be exactly "## MODIFIED Requirements" but found "${header}"`);
        } else if (header.includes('REMOVED') && !header.includes('## REMOVED Requirements')) {
          issues.push(`Header should be exactly "## REMOVED Requirements" but found "${header}"`);
        } else if (header.includes('RENAMED') && !header.includes('## RENAMED Requirements')) {
          issues.push(`Header should be exactly "## RENAMED Requirements" but found "${header}"`);
        } else {
          issues.push(`Invalid operation header: "${header}". Valid headers are: ## ADDED Requirements, ## MODIFIED Requirements, ## REMOVED Requirements, ## RENAMED Requirements`);
        }
      } else {
        // Count valid operations
        if (header === '## ADDED Requirements') addedCount++;
        if (header === '## MODIFIED Requirements') modifiedCount++;
        if (header === '## REMOVED Requirements') removedCount++;
        if (header === '## RENAMED Requirements') renamedCount++;
      }
    }
    
    // Check that at least one delta operation exists
    const hasValidDelta = validHeaders.some(header => content.includes(header));
    if (!hasValidDelta) {
      issues.push('Specification delta must contain at least one operation (ADDED, MODIFIED, REMOVED, or RENAMED)');
    }
    
    // Check for proper requirement format within operations
    const requirementRegex = /^### Requirement: /gm;
    const requirements = content.match(requirementRegex);
    
    if (requirements) {
      // Check for proper scenario format
      const scenarioRegex = /^#### Scenario: /gm;
      const scenarios = content.match(scenarioRegex);
      
      if (!scenarios) {
        issues.push('Each requirement must have at least one scenario with format "#### Scenario: [Name]"');
      }
      
      // Validate operation-specific requirements
      const lines = content.split('\n');
      let inOperation = false;
      let currentOperationType = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for operation headers
        const operationMatch = line.match(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements$/);
        if (operationMatch) {
          inOperation = true;
          currentOperationType = operationMatch[1];
          continue;
        }
        
        // Validate content based on operation type
        if (inOperation) {
          switch (currentOperationType) {
            case 'ADDED':
              // ADDED operations should have new requirements
              break;
            case 'MODIFIED':
              // MODIFIED operations should reference existing requirements
              break;
            case 'REMOVED':
              // REMOVED operations should have reason and migration
              if (line.includes('**Reason**:') && !line.includes('**Migration**:')) {
                // Look for migration section
                let hasMigration = false;
                for (let j = i + 1; j < lines.length; j++) {
                  if (lines[j].includes('**Migration**:')) {
                    hasMigration = true;
                    break;
                  }
                  // Stop if we reach another operation
                  if (lines[j].match(/^## [A-Z]+/)) {
                    break;
                  }
                }
                if (!hasMigration) {
                  issues.push('REMOVED operation should include a "Migration" section');
                }
              }
              break;
            case 'RENAMED':
              // RENAMED operations should have FROM/TO format
              if (line.includes('- FROM:') && !line.includes('- TO:')) {
                // Look for TO section
                let hasTo = false;
                for (let j = i + 1; j < lines.length; j++) {
                  if (lines[j].includes('- TO:')) {
                    hasTo = true;
                    break;
                  }
                  // Stop if we reach another operation
                  if (lines[j].match(/^## [A-Z]+/)) {
                    break;
                  }
                }
                if (!hasTo) {
                  issues.push('RENAMED operation should include both "FROM" and "TO" specifications');
                }
              }
              break;
          }
        }
      }
    }
    
    return { isValid: issues.length === 0, issues };
  }
}