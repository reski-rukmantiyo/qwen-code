/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { DeltaApplier } from './OpenSpecDeltaApplier.js';

describe('OpenSpecDeltaApplier', () => {
  let tempDir: string;
  let baselinePath: string;
  let deltaPath: string;
  let outputPath: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'delta-applier-test-'));
    baselinePath = path.join(tempDir, 'baseline.md');
    deltaPath = path.join(tempDir, 'delta.md');
    outputPath = path.join(tempDir, 'output.md');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should apply ADDED operations to create new specifications', async () => {
    const baselineContent = '';
    const deltaContent = `## [ADDED] New Authentication Feature

This is a new authentication feature.

#### Scenario: User Login
User should be able to log in with credentials.`;

    fs.writeFileSync(baselinePath, baselineContent);
    fs.writeFileSync(deltaPath, deltaContent);

    const result = await DeltaApplier.applyDelta(baselinePath, deltaPath, outputPath);
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    expect(outputContent).toContain('### Requirement: New Authentication Feature');
    expect(outputContent).toContain('#### Scenario: User Login');
  });

  it('should apply MODIFIED operations to existing specifications', async () => {
    const baselineContent = `# Authentication API

### Requirement: User Login
Users should be able to log in with email and password.

#### Scenario: Valid Credentials
System returns auth token for valid credentials.`;

    const deltaContent = `## [MODIFIED] User Login

Updated login requirements.

#### Scenario: Two-Factor Authentication
Users must provide 2FA code after password.`;

    fs.writeFileSync(baselinePath, baselineContent);
    fs.writeFileSync(deltaPath, deltaContent);

    const result = await DeltaApplier.applyDelta(baselinePath, deltaPath, outputPath);
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    expect(outputContent).toContain('### Requirement: User Login');
  });

  it('should apply REMOVED operations to delete requirements', async () => {
    const baselineContent = `# Authentication API

### Requirement: User Login
Users should be able to log in with email and password.

### Requirement: Password Reset
Users should be able to reset passwords via email.`;

    const deltaContent = `## [REMOVED] Password Reset

This feature is being deprecated.`;

    fs.writeFileSync(baselinePath, baselineContent);
    fs.writeFileSync(deltaPath, deltaContent);

    const result = await DeltaApplier.applyDelta(baselinePath, deltaPath, outputPath);
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    expect(outputContent).toContain('### Requirement: User Login');
    expect(outputContent).not.toContain('### Requirement: Password Reset');
  });

  it('should apply RENAMED operations to rename requirements', async () => {
    const baselineContent = `# Authentication API

### Requirement: User Login
Users should be able to log in with email and password.`;

    const deltaContent = `## [RENAMED] User Login -> User Authentication

Renaming for clarity.`;

    fs.writeFileSync(baselinePath, baselineContent);
    fs.writeFileSync(deltaPath, deltaContent);

    const result = await DeltaApplier.applyDelta(baselinePath, deltaPath, outputPath);
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    expect(outputContent).toContain('### Requirement: User Authentication');
    expect(outputContent).not.toContain('### Requirement: User Login');
  });

  it('should validate delta application for non-existent requirements', async () => {
    const baselineContent = `# Authentication API

### Requirement: User Login
Users should be able to log in with email and password.`;

    const deltaContent = `## [MODIFIED] Non-existent Feature

This feature doesn't exist in baseline.`;

    fs.writeFileSync(baselinePath, baselineContent);
    fs.writeFileSync(deltaPath, deltaContent);

    const result = await DeltaApplier.validateDeltaApplication(baselinePath, deltaPath);
    
    expect(result.canApply).toBe(false);
    expect(result.issues).toContain('Operation MODIFIED references non-existent requirement: "Non-existent Feature"');
  });

  it('should validate delta application for operations on non-existent baseline', async () => {
    const deltaContent = `## [MODIFIED] User Login

This operation cannot be applied to non-existent baseline.`;

    fs.writeFileSync(deltaPath, deltaContent);

    const result = await DeltaApplier.validateDeltaApplication(baselinePath, deltaPath);
    
    expect(result.canApply).toBe(false);
    expect(result.issues).toContain('Operation MODIFIED cannot be applied because no baseline specification exists');
  });

  it('should handle empty delta content gracefully', async () => {
    const baselineContent = `# Authentication API

### Requirement: User Login
Users should be able to log in with email and password.`;

    const deltaContent = '';

    fs.writeFileSync(baselinePath, baselineContent);
    fs.writeFileSync(deltaPath, deltaContent);

    const result = await DeltaApplier.applyDelta(baselinePath, deltaPath, outputPath);
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    expect(outputContent).toBe(baselineContent);
  });
});