/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { DeltaOperationsParser, type DeltaOperation } from './OpenSpecDeltaOperationsParser.js';

describe('OpenSpecDeltaOperationsParser', () => {
  it('should parse ADDED operations correctly', () => {
    const content = `## [ADDED] New Authentication Endpoint
    
This is a new endpoint for user authentication.
    
### Endpoint
POST /api/auth/login`;

    const operations = DeltaOperationsParser.parseDeltaOperations(content);
    
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: 'ADDED',
      header: 'New Authentication Endpoint',
      content: 'This is a new endpoint for user authentication.\n\n### Endpoint\nPOST /api/auth/login'
    });
  });

  it('should parse MODIFIED operations correctly', () => {
    const content = `## [MODIFIED] Rate Limiting Policy
    
Updated the global rate limit from 1000 to 2000 requests per hour.
    
### Previous
1000 requests per hour
    
### Updated
2000 requests per hour`;

    const operations = DeltaOperationsParser.parseDeltaOperations(content);
    
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: 'MODIFIED',
      header: 'Rate Limiting Policy',
      content: 'Updated the global rate limit from 1000 to 2000 requests per hour.\n\n### Previous\n1000 requests per hour\n\n### Updated\n2000 requests per hour'
    });
  });

  it('should parse REMOVED operations correctly', () => {
    const content = `## [REMOVED] Legacy User Endpoints
    
The following endpoints have been removed:
- GET /api/legacy/users
- POST /api/legacy/users`;

    const operations = DeltaOperationsParser.parseDeltaOperations(content);
    
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: 'REMOVED',
      header: 'Legacy User Endpoints',
      content: 'The following endpoints have been removed:\n- GET /api/legacy/users\n- POST /api/legacy/users'
    });
  });

  it('should parse RENAMED operations correctly', () => {
    const content = `## [RENAMED] Old Header -> New Header
    
The header has been renamed for clarity.
    
### Previous Value
old_value
    
### New Value
new_value`;

    const operations = DeltaOperationsParser.parseDeltaOperations(content);
    
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: 'RENAMED',
      header: 'New Header',
      previousHeader: 'Old Header',
      content: 'The header has been renamed for clarity.\n\n### Previous Value\nold_value\n\n### New Value\nnew_value'
    });
  });

  it('should parse multiple operations correctly', () => {
    const content = `## [ADDED] New Feature
    
This is a new feature.
    
## [MODIFIED] Existing Feature
    
This feature has been updated.`;

    const operations = DeltaOperationsParser.parseDeltaOperations(content);
    
    expect(operations).toHaveLength(2);
    expect(operations[0]).toEqual({
      type: 'ADDED',
      header: 'New Feature',
      content: 'This is a new feature.'
    });
    expect(operations[1]).toEqual({
      type: 'MODIFIED',
      header: 'Existing Feature',
      content: 'This feature has been updated.'
    });
  });

  it('should format delta operations back to markdown', () => {
    const operations: DeltaOperation[] = [
      {
        type: 'ADDED',
        header: 'New Feature',
        content: 'This is a new feature.'
      },
      {
        type: 'MODIFIED',
        header: 'Existing Feature',
        content: 'This feature has been updated.'
      }
    ];

    const formatted = DeltaOperationsParser.formatDeltaOperations(operations);
    
    expect(formatted).toBe(`## [ADDED] New Feature
This is a new feature.

## [MODIFIED] Existing Feature
This feature has been updated.`);
  });

  it('should format RENAMED operations correctly', () => {
    const operations: DeltaOperation[] = [
      {
        type: 'RENAMED',
        header: 'New Header',
        previousHeader: 'Old Header',
        content: 'The header has been renamed.'
      }
    ];

    const formatted = DeltaOperationsParser.formatDeltaOperations(operations);
    
    expect(formatted).toBe(`## [RENAMED] Old Header -> New Header
The header has been renamed.`);
  });

  it('should validate correct delta format', () => {
    const content = `## [ADDED] New Feature
    
This is a new feature.`;

    const result = DeltaOperationsParser.validateDeltaFormat(content);
    
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect invalid delta format', () => {
    const content = `## ADDED New Feature
    
This is a new feature without proper brackets.`;

    const result = DeltaOperationsParser.validateDeltaFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('No valid delta operations found. At least one operation with format "## [TYPE] Header" is required.');
  });

  it('should detect empty operation headers', () => {
    const content = `## [ADDED] 
    
This operation has an empty header.`;

    const result = DeltaOperationsParser.validateDeltaFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Line 1: Operation header cannot be empty');
  });

  it('should detect invalid RENAMED format', () => {
    const content = `## [RENAMED] Invalid Rename Format
    
This rename operation is missing the arrow.`;

    const result = DeltaOperationsParser.validateDeltaFormat(content);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Line 1: RENAMED operation should follow format "Previous Header -> New Header"');
  });
});