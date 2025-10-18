/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { SpecificationValidator, type SpecificationRequirement } from './OpenSpecSpecificationValidator.js';

describe('OpenSpecSpecificationValidator', () => {
  it('should validate correct specification format', () => {
    const content = `# Authentication API Specification

### Requirement: User Login
The system shall allow users to authenticate with email and password.

#### Scenario: Valid Credentials
When a user provides valid email and password credentials, the system should return an authentication token.

#### Scenario: Invalid Credentials
When a user provides invalid credentials, the system should return an appropriate error message.

### Requirement: Password Reset
The system shall allow users to reset their password via email.

#### Scenario: Request Password Reset
When a user requests a password reset, the system should send an email with a reset link.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect missing requirement headers', () => {
    const content = `# Authentication API Specification

The system shall allow users to authenticate with email and password.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('No requirement headers found. Specifications should include at least one "### Requirement:" header.');
  });

  it('should detect invalid requirement header format', () => {
    const content = `# Authentication API Specification

### Requirement
The system shall allow users to authenticate with email and password.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Line 3: Requirement header should start with "Requirement:"');
  });

  it('should detect empty requirement headers', () => {
    const content = `# Authentication API Specification

### Requirement:
The system shall allow users to authenticate with email and password.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Line 3: Requirement header cannot be empty');
  });

  it('should detect invalid scenario header format', () => {
    const content = `# Authentication API Specification

### Requirement: User Login
The system shall allow users to authenticate with email and password.

#### Scenario
When a user provides valid email and password credentials, the system should return an authentication token.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Line 6: Scenario header should start with "Scenario:"');
  });

  it('should detect empty scenario headers', () => {
    const content = `# Authentication API Specification

### Requirement: User Login
The system shall allow users to authenticate with email and password.

#### Scenario:
When a user provides valid email and password credentials, the system should return an authentication token.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Line 6: Scenario header cannot be empty');
  });

  it('should detect duplicate requirement headers', () => {
    const content = `# Authentication API Specification

### Requirement: User Login
The system shall allow users to authenticate with email and password.

### Requirement: User Login
The system shall allow users to authenticate with email and password.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Duplicate requirement headers found: Requirement: User Login');
  });

  it('should detect duplicate scenario headers', () => {
    const content = `# Authentication API Specification

### Requirement: User Login
The system shall allow users to authenticate with email and password.

#### Scenario: Valid Credentials
When a user provides valid email and password credentials, the system should return an authentication token.

#### Scenario: Valid Credentials
When a user provides valid email and password credentials, the system should return an authentication token.`;

    const result = SpecificationValidator.validateSpecificationFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Duplicate scenario headers found: Scenario: Valid Credentials');
  });

  it('should parse specification requirements correctly', () => {
    const content = `# Authentication API Specification

### Requirement: User Login
The system shall allow users to authenticate with email and password.

#### Scenario: Valid Credentials
When a user provides valid email and password credentials, the system should return an authentication token.

#### Scenario: Invalid Credentials
When a user provides invalid credentials, the system should return an appropriate error message.

### Requirement: Password Reset
The system shall allow users to reset their password via email.

#### Scenario: Request Password Reset
When a user requests a password reset, the system should send an email with a reset link.`;

    const requirements = SpecificationValidator.parseSpecificationRequirements(content);
    
    expect(requirements).toHaveLength(2);
    
    expect(requirements[0]).toEqual({
      header: 'User Login',
      scenarios: [
        {
          header: 'Valid Credentials',
          description: 'When a user provides valid email and password credentials, the system should return an authentication token.'
        },
        {
          header: 'Invalid Credentials',
          description: 'When a user provides invalid credentials, the system should return an appropriate error message.'
        }
      ]
    });
    
    expect(requirements[1]).toEqual({
      header: 'Password Reset',
      scenarios: [
        {
          header: 'Request Password Reset',
          description: 'When a user requests a password reset, the system should send an email with a reset link.'
        }
      ]
    });
  });

  it('should format specification requirements correctly', () => {
    const requirements: SpecificationRequirement[] = [
      {
        header: 'User Login',
        scenarios: [
          {
            header: 'Valid Credentials',
            description: 'When a user provides valid email and password credentials, the system should return an authentication token.'
          }
        ]
      }
    ];

    const formatted = SpecificationValidator.formatSpecificationRequirements(requirements);
    
    expect(formatted).toBe(`### Requirement: User Login

#### Scenario: Valid Credentials

When a user provides valid email and password credentials, the system should return an authentication token.`);
  });
});