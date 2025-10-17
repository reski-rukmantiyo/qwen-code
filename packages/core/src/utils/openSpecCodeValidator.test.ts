/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { OpenSpecCodeValidator } from './openSpecCodeValidator.js';

describe('OpenSpecCodeValidator', () => {
  let tempDir: string;
  let openspecDir: string;
  let changesDir: string;
  let validator: OpenSpecCodeValidator;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-validator-test-'));
    
    // Create OpenSpec directory structure
    openspecDir = path.join(tempDir, 'openspec');
    changesDir = path.join(openspecDir, 'changes');
    
    fs.mkdirSync(openspecDir);
    fs.mkdirSync(changesDir);
    
    // Initialize validator
    validator = new OpenSpecCodeValidator();
    
    // Mock process.cwd() to return our temp directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should validate code conformance successfully', async () => {
    // Create a simple change directory
    const changeDir = path.join(changesDir, 'test-change');
    fs.mkdirSync(changeDir);
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Test Change\n\nA simple test change.');
    
    // Test valid code
    const validCode = 'function test() {\n  return "valid";\n}';
    const validationResult = await validator.validateCodeConformance(validCode, 'test.js');
    
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.issues).toHaveLength(0);
  });

  it('should detect code issues that violate best practices', async () => {
    // Test code with obvious issues
    const invalidCode = 'function test() {\n  console.log("debug");\n  return "valid";\n}';
    const validationResult = await validator.validateCodeConformance(invalidCode, 'test.js');
    
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.issues).toContain('Code contains obvious issues that violate best practices');
  });

  it('should return valid result when OpenSpec is not initialized', async () => {
    // Remove the openspec directory
    fs.rmSync(openspecDir, { recursive: true });
    
    const code = 'function test() {\n  return "valid";\n}';
    const validationResult = await validator.validateCodeConformance(code, 'test.js');
    
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.issues).toHaveLength(0);
  });

  it('should get active changes', () => {
    // Create some change directories
    fs.mkdirSync(path.join(changesDir, 'change-1'));
    fs.mkdirSync(path.join(changesDir, 'change-2'));
    
    const activeChanges = validator.getActiveChanges();
    
    expect(activeChanges).toHaveLength(2);
    expect(activeChanges).toContain('change-1');
    expect(activeChanges).toContain('change-2');
  });

  it('should return empty array when no changes directory exists', () => {
    // Remove the changes directory
    fs.rmSync(changesDir, { recursive: true });
    
    const activeChanges = validator.getActiveChanges();
    expect(activeChanges).toHaveLength(0);
  });

  it('should get change specification', () => {
    // Create a change directory with proposal
    const changeDir = path.join(changesDir, 'test-change');
    fs.mkdirSync(changeDir);
    const proposalContent = '# Test Change\n\nThis is a test change proposal.';
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), proposalContent);
    
    const spec = validator.getChangeSpecification('test-change');
    expect(spec).toBe(proposalContent);
  });

  it('should return null when change specification does not exist', () => {
    const spec = validator.getChangeSpecification('non-existent-change');
    expect(spec).toBeNull();
  });
});