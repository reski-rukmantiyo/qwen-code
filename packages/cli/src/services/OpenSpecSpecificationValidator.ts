/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a requirement in a specification
 */
export interface SpecificationRequirement {
  header: string;
  scenarios: SpecificationScenario[];
}

/**
 * Represents a scenario within a requirement
 */
export interface SpecificationScenario {
  header: string;
  description: string;
}

/**
 * Validates specification files for structured format compliance
 */
export class SpecificationValidator {
  /**
   * Validates that the content follows the structured specification format
   * @param content The markdown content to validate
   * @returns Validation result with any issues found
   */
  static validateSpecificationFormat(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const lines = content.split('\n');
    
    // Track requirement and scenario headers
    let requirementHeaders: string[] = [];
    let scenarioHeaders: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for requirement headers (### Requirement:)
      const requirementMatch = line.match(/^###\s+(Requirement:.+)$/);
      if (requirementMatch) {
        const header = requirementMatch[1];
        requirementHeaders.push(header);
        
        // Validate requirement header format
        if (!header.startsWith('Requirement:')) {
          issues.push(`Line ${i + 1}: Requirement header should start with "Requirement:"`);
        } else if (header.length <= 12) { // "Requirement:".length = 12
          issues.push(`Line ${i + 1}: Requirement header cannot be empty`);
        }
      }
      
      // Check for scenario headers (#### Scenario:)
      const scenarioMatch = line.match(/^####\s+(Scenario:.+)$/);
      if (scenarioMatch) {
        const header = scenarioMatch[1];
        scenarioHeaders.push(header);
        
        // Validate scenario header format
        if (!header.startsWith('Scenario:')) {
          issues.push(`Line ${i + 1}: Scenario header should start with "Scenario:"`);
        } else if (header.length <= 9) { // "Scenario:".length = 9
          issues.push(`Line ${i + 1}: Scenario header cannot be empty`);
        }
      }
    }
    
    // Check if any requirements were found
    if (requirementHeaders.length === 0) {
      issues.push('No requirement headers found. Specifications should include at least one "### Requirement:" header.');
    }
    
    // Check for duplicate requirement headers
    const duplicateRequirements = requirementHeaders.filter((item, index) => requirementHeaders.indexOf(item) !== index);
    if (duplicateRequirements.length > 0) {
      issues.push(`Duplicate requirement headers found: ${[...new Set(duplicateRequirements)].join(', ')}`);
    }
    
    // Check for duplicate scenario headers
    const duplicateScenarios = scenarioHeaders.filter((item, index) => scenarioHeaders.indexOf(item) !== index);
    if (duplicateScenarios.length > 0) {
      issues.push(`Duplicate scenario headers found: ${[...new Set(duplicateScenarios)].join(', ')}`);
    }
    
    return { isValid: issues.length === 0, issues };
  }
  
  /**
   * Parses specification content to extract requirements and scenarios
   * @param content The markdown content to parse
   * @returns Array of parsed requirements
   */
  static parseSpecificationRequirements(content: string): SpecificationRequirement[] {
    const requirements: SpecificationRequirement[] = [];
    const lines = content.split('\n');
    
    let currentRequirement: SpecificationRequirement | null = null;
    let currentScenario: SpecificationScenario | null = null;
    let currentContent = '';
    
    for (const line of lines) {
      // Check for requirement headers
      const requirementMatch = line.match(/^###\s+Requirement:(.+)$/);
      if (requirementMatch) {
        // Save previous requirement if exists
        if (currentRequirement) {
          if (currentScenario) {
            currentScenario.description = currentContent.trim();
            currentRequirement.scenarios.push(currentScenario);
          }
          requirements.push(currentRequirement);
        }
        
        // Start new requirement
        const header = requirementMatch[1].trim();
        currentRequirement = { header, scenarios: [] };
        currentScenario = null;
        currentContent = '';
        continue;
      }
      
      // Check for scenario headers
      const scenarioMatch = line.match(/^####\s+Scenario:(.+)$/);
      if (scenarioMatch && currentRequirement) {
        // Save previous scenario if exists
        if (currentScenario) {
          currentScenario.description = currentContent.trim();
          currentRequirement.scenarios.push(currentScenario);
        }
        
        // Start new scenario
        const header = scenarioMatch[1].trim();
        currentScenario = { header, description: '' };
        currentContent = '';
        continue;
      }
      
      // Accumulate content for current section
      if (currentRequirement) {
        currentContent += line + '\n';
      }
    }
    
    // Save the last scenario and requirement
    if (currentRequirement) {
      if (currentScenario) {
        currentScenario.description = currentContent.trim();
        currentRequirement.scenarios.push(currentScenario);
      }
      requirements.push(currentRequirement);
    }
    
    return requirements;
  }
  
  /**
   * Formats requirements back to structured specification markdown
   * @param requirements Array of requirements
   * @returns Markdown formatted string
   */
  static formatSpecificationRequirements(requirements: SpecificationRequirement[]): string {
    let content = '';
    
    for (const requirement of requirements) {
      content += `### Requirement: ${requirement.header}\n\n`;
      
      for (const scenario of requirement.scenarios) {
        content += `#### Scenario: ${scenario.header}\n\n`;
        content += `${scenario.description}\n\n`;
      }
    }
    
    return content.trim();
  }
}