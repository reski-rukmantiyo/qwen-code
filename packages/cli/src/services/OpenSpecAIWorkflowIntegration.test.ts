/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { OpenSpecMemoryIntegration } from '../services/OpenSpecMemoryIntegration.js';
import { OpenSpecCacheService } from '../services/OpenSpecCacheService.js';
import { OpenSpecCodeValidator } from '../../../core/src/utils/openSpecCodeValidator.js';

describe('OpenSpec AI Workflow Integration (Task 2.3)', () => {
  let tempDir: string;
  let openspecDir: string;
  let specsDir: string;
  let changesDir: string;
  let cacheService: OpenSpecCacheService;
  let memoryIntegration: OpenSpecMemoryIntegration;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-test-'));
    
    // Create OpenSpec directory structure
    openspecDir = path.join(tempDir, 'openspec');
    specsDir = path.join(openspecDir, 'specs');
    changesDir = path.join(openspecDir, 'changes');
    
    fs.mkdirSync(openspecDir);
    fs.mkdirSync(specsDir);
    fs.mkdirSync(changesDir);
    
    // Initialize services
    cacheService = new OpenSpecCacheService();
    memoryIntegration = new OpenSpecMemoryIntegration(cacheService);
    
    // Mock process.cwd() to return our temp directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should generate memory content from OpenSpec files', async () => {
    // Create some test specification files
    const apiSpecContent = '# API Specification\n\nThis document describes the API endpoints.';
    const dbSpecContent = '# Database Schema\n\nThis document describes the database structure.';
    
    fs.writeFileSync(path.join(specsDir, 'api.md'), apiSpecContent);
    fs.writeFileSync(path.join(specsDir, 'database.md'), dbSpecContent);
    
    // Create a change directory with files
    const changeDir = path.join(changesDir, 'user-authentication');
    fs.mkdirSync(changeDir);
    
    const proposalContent = '# User Authentication\n\nImplement user login and registration.';
    const tasksContent = '# Implementation Tasks\n\n- [ ] Create login endpoint\n- [ ] Create registration endpoint';
    const designContent = '# Technical Design\n\nUse JWT tokens for authentication.';
    
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), proposalContent);
    fs.writeFileSync(path.join(changeDir, 'tasks.md'), tasksContent);
    fs.writeFileSync(path.join(changeDir, 'design.md'), designContent);
    
    // Create spec deltas
    const specsDeltaDir = path.join(changeDir, 'specs');
    fs.mkdirSync(specsDeltaDir);
    fs.writeFileSync(path.join(specsDeltaDir, 'api.md'), '# Updated API for authentication');
    
    // Generate memory content
    const memoryContent = await memoryIntegration.generateOpenSpecMemory();
    
    // Verify the content includes the expected sections
    expect(memoryContent).toContain('# OpenSpec Context');
    expect(memoryContent).toContain('## Current Specifications');
    expect(memoryContent).toContain('## Active Changes');
    expect(memoryContent).toContain('### user-authentication');
    expect(memoryContent).toContain('User Authentication');
    expect(memoryContent).toContain('Implementation Tasks');
    expect(memoryContent).toContain('Technical Design');
    expect(memoryContent).toContain('## AI Guidance');
  });

  it('should return empty content when OpenSpec is not initialized', async () => {
    // Remove the openspec directory
    fs.rmSync(openspecDir, { recursive: true });
    
    const memoryContent = await memoryIntegration.generateOpenSpecMemory();
    expect(memoryContent).toBe('');
  });

  it('should validate code conformance to OpenSpec specifications', async () => {
    // Create a simple change directory
    const changeDir = path.join(changesDir, 'test-change');
    fs.mkdirSync(changeDir);
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Test Change\n\nA simple test change.');
    
    // Test valid code
    const validCode = 'function test() {\n  return "valid";\n}';
    const validationResult = await memoryIntegration.validateCodeConformance(validCode, 'test.js');
    
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.issues).toHaveLength(0);
  });

  it('should detect code issues that violate best practices', async () => {
    // Test code with obvious issues
    const invalidCode = 'function test() {\n  console.log("debug");\n  return "valid";\n}';
    const validationResult = await memoryIntegration.validateCodeConformance(invalidCode, 'test.js');
    
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.issues).toContain('Code contains obvious issues that violate best practices');
  });

  it('should get active changes for agent configuration', () => {
    // Create some change directories
    fs.mkdirSync(path.join(changesDir, 'change-1'));
    fs.mkdirSync(path.join(changesDir, 'change-2'));
    fs.mkdirSync(path.join(changesDir, 'change-3'));
    
    const activeChanges = memoryIntegration.getActiveChanges();
    
    expect(activeChanges).toHaveLength(3);
    expect(activeChanges).toContain('change-1');
    expect(activeChanges).toContain('change-2');
    expect(activeChanges).toContain('change-3');
  });

  it('should return empty array when no changes directory exists', () => {
    // Remove the changes directory
    fs.rmSync(changesDir, { recursive: true });
    
    const activeChanges = memoryIntegration.getActiveChanges();
    expect(activeChanges).toHaveLength(0);
  });
});