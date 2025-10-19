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
   * @param strictMode Whether to enforce strict validation rules
   * @returns Validation result with any issues found
   */
  static validateSpecificationFormat(content: string, strictMode: boolean = false): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const lines = content.split('\n');
    
    // Track requirement and scenario headers
    let requirementHeaders: string[] = [];
    let scenarioHeaders: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for requirement headers (### Requirement:)
      const requirementMatch = line.match(/^###\s+(Requirement:.+)$/);
      // Also check for malformed requirement headers
      const malformedRequirementMatch = line.match(/^###\s+(Requirement.*)$/);
      
      if (requirementMatch) {
        const header = requirementMatch[1];
        requirementHeaders.push(header);
        
        // Validate requirement header format
        if (!header.startsWith('Requirement:')) {
          issues.push(`Line ${i + 1}: Requirement header should start with "Requirement:"`);
        } else if (header.length <= 12) { // "Requirement:".length = 12
          issues.push(`Line ${i + 1}: Requirement header cannot be empty`);
        }
        
        // Check for normative language (SHALL/MUST) - only in strict mode
        if (strictMode) {
          let hasNormativeLanguage = false;
          for (let j = i + 1; j < lines.length && !lines[j].match(/^#{2,4}\s+/); j++) {
            if (lines[j].includes(' SHALL ') || lines[j].includes(' MUST ')) {
              hasNormativeLanguage = true;
              break;
            }
          }
          if (!hasNormativeLanguage) {
            issues.push(`Line ${i + 1}: Requirement should use SHALL/MUST for mandatory requirements. Example: "The system SHALL validate user credentials."`);
          }
        }
      } else if (malformedRequirementMatch) {
        // Handle malformed requirement headers like "### Requirement" without colon
        const header = malformedRequirementMatch[1];
        if (header === 'Requirement' || header === 'Requirement ') {
          issues.push(`Line ${i + 1}: Requirement header should start with "Requirement:"`);
        }
        // Handle "### Requirement:" with nothing after
        if (header === 'Requirement:') {
          issues.push(`Line ${i + 1}: Requirement header cannot be empty`);
        }
      }
      
      // Check for scenario headers (#### Scenario:)
      const scenarioMatch = line.match(/^####\s+(Scenario:.+)$/);
      // Also check for malformed scenario headers
      const malformedScenarioMatch = line.match(/^####\s+(Scenario.*)$/);
      
      if (scenarioMatch) {
        const header = scenarioMatch[1];
        scenarioHeaders.push(header);
        
        // Validate scenario header format
        if (!header.startsWith('Scenario:')) {
          issues.push(`Line ${i + 1}: Scenario header should start with "Scenario:"`);
        } else if (header.length <= 9) { // "Scenario:".length = 9
          issues.push(`Line ${i + 1}: Scenario header cannot be empty`);
        }
      } else if (malformedScenarioMatch) {
        // Handle malformed scenario headers like "#### Scenario" without colon
        const header = malformedScenarioMatch[1];
        if (header === 'Scenario' || header === 'Scenario ') {
          issues.push(`Line ${i + 1}: Scenario header should start with "Scenario:"`);
        }
        // Handle "#### Scenario:" with nothing after
        if (header === 'Scenario:') {
          issues.push(`Line ${i + 1}: Scenario header cannot be empty`);
        }
      }
      
      // Check for improper scenario formatting
      const improperScenarioMatch = line.match(/^[\*\-\d]*\s*\**Scenario[\*:]/i);
      if (improperScenarioMatch) {
        issues.push(`Line ${i + 1}: Scenario must use proper format: #### Scenario: [Name] (exactly 4 hashtags). Example: "#### Scenario: Valid User Login"`);
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
    
    // Check that each requirement has at least one scenario
    const requirementBlocks = content.split(/^###\s+Requirement:/m).slice(1);
    for (let i = 0; i < requirementBlocks.length; i++) {
      const block = requirementBlocks[i];
      const scenarioCount = (block.match(/^####\s+Scenario:/gm) || []).length;
      if (scenarioCount === 0) {
        const firstLine = block.split('\n')[0];
        issues.push(`Requirement "${firstLine}" must have at least one scenario. Add a scenario using the format: "#### Scenario: [Descriptive Name]"`);
      }
    }
    
    // In strict mode, check for additional requirements
    if (strictMode) {
      // Check for silent scenario parsing failures
      const scenarioLines = lines.filter(line => line.match(/^####\s+Scenario:/));
      for (const line of scenarioLines) {
        const match = line.match(/^####\s+Scenario:\s*(.*)$/);
        if (match && !match[1]) {
          issues.push('Scenario header cannot be empty. Example: "#### Scenario: Valid User Login"');
        }
      }
      
      // Validate scenario format for WHEN/THEN compliance
      const requirements = this.parseSpecificationRequirements(content);
      for (const requirement of requirements) {
        // Check that each requirement has at least one scenario (more detailed check)
        if (requirement.scenarios.length === 0) {
          issues.push(`Requirement "${requirement.header}" must have at least one scenario.`);
        }
        
        for (const scenario of requirement.scenarios) {
          const scenarioValidation = this.validateScenarioFormat(scenario.description);
          if (!scenarioValidation.isValid) {
            issues.push(`Scenario "${scenario.header}": ${scenarioValidation.issues.join(', ')}`);
          }
        }
      }
    }
    
    return { isValid: issues.length === 0, issues };
  }
  
  /**
   * Validates delta operations format for specification changes
   * @param content The markdown content to validate
   * @returns Validation result with any issues found
   */
  static validateDeltaOperationsFormat(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for proper delta operation headers
    const validHeaders = ['## ADDED Requirements', '## MODIFIED Requirements', '## REMOVED Requirements', '## RENAMED Requirements'];
    const headerRegex = /^## [A-Z]+/gm;
    const headers = content.match(headerRegex) || [];
    
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
        }
      }
    }
    
    // Check that at least one delta operation exists
    const hasValidDelta = validHeaders.some(header => content.includes(header));
    if (!hasValidDelta) {
      issues.push('Specification delta must contain at least one operation (ADDED, MODIFIED, REMOVED, or RENAMED)');
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
   * Validates scenario format for WHEN/THEN compliance
   * @param scenarioDescription The scenario description to validate
   * @returns Validation result with any issues found
   */
  static validateScenarioFormat(scenarioDescription: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if scenario description contains WHEN/THEN format
    const hasWhen = scenarioDescription.includes('**WHEN**');
    const hasThen = scenarioDescription.includes('**THEN**');
    
    if (!hasWhen && !hasThen) {
      issues.push('Scenario should use the WHEN/THEN format. Example: "- **WHEN** user enters valid credentials - **THEN** system grants access"');
    } else if (!hasWhen) {
      issues.push('Scenario missing **WHEN** clause. Example: "- **WHEN** user enters valid credentials"');
    } else if (!hasThen) {
      issues.push('Scenario missing **THEN** clause. Example: "- **THEN** system grants access"');
    }
    
    // Check for proper WHEN/THEN formatting
    const whenMatches = scenarioDescription.match(/\*\*WHEN\*\*/g) || [];
    const thenMatches = scenarioDescription.match(/\*\*THEN\*\*/g) || [];
    
    if (whenMatches.length > 1) {
      issues.push('Scenario should have only one **WHEN** clause');
    }
    
    if (thenMatches.length > 1) {
      issues.push('Scenario should have only one **THEN** clause');
    }
    
    return { isValid: issues.length === 0, issues };
  }
  
  /**
   * Formats specification requirements back to markdown
   * @param requirements Array of requirements to format
   * @returns Formatted markdown string
   */
  static formatSpecificationRequirements(requirements: SpecificationRequirement[]): string {
    let content = '';
    
    for (const requirement of requirements) {
      content += `### Requirement: ${requirement.header}\n\n`;
      
      for (const scenario of requirement.scenarios) {
        content += `#### Scenario: ${scenario.header}\n\n`;
        content += `${scenario.description}\n`;
      }
      
      // Only add a newline if this isn't the last requirement
      if (requirements.indexOf(requirement) < requirements.length - 1) {
        content += '\n';
      }
    }
    
    // Remove trailing newlines
    return content.trimEnd();
  }
  
  /**
   * Validates the overall structure of a specification
   * @param content The markdown content to validate
   * @returns Validation result with any issues found
   */
  static validateSpecificationStructure(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for required sections
    const hasOverview = content.includes('## Overview') || content.includes('# Overview');
    const hasRequirements = content.includes('### Requirement:');
    
    if (!hasOverview) {
      issues.push('Specification should include an Overview section. Example: "## Overview"');
    }
    
    if (!hasRequirements) {
      issues.push('Specification should include at least one requirement. Example: "### Requirement: User Authentication"');
    }
    
    // Check for proper heading hierarchy
    const lines = content.split('\n');
    let lastHeadingLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#+)\s/);
      
      if (headingMatch) {
        const level = headingMatch[1].length;
        
        // Check for proper heading hierarchy (should not skip levels by more than 1)
        if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
          issues.push(`Line ${i + 1}: Heading hierarchy skips level. Current level ${level} after level ${lastHeadingLevel}`);
        }
        
        lastHeadingLevel = level;
      }
    }
    
    return { isValid: issues.length === 0, issues };
  }
}