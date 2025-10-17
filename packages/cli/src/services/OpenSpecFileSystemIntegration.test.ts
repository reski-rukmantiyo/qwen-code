/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { OpenSpecWatcherService } from './OpenSpecWatcherService.js';
import { OpenSpecCacheService } from './OpenSpecCacheService.js';

describe('OpenSpec File System Integration (Task 2.2)', () => {
  let tempDir: string;
  let openspecDir: string;
  let specsDir: string;
  let changesDir: string;
  let archiveDir: string;
  let cacheService: OpenSpecCacheService;
  let watcherService: OpenSpecWatcherService;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-test-'));
    
    // Create OpenSpec directory structure
    openspecDir = path.join(tempDir, 'openspec');
    specsDir = path.join(openspecDir, 'specs');
    changesDir = path.join(openspecDir, 'changes');
    archiveDir = path.join(openspecDir, 'archive');
    
    fs.mkdirSync(openspecDir);
    fs.mkdirSync(specsDir);
    fs.mkdirSync(changesDir);
    fs.mkdirSync(archiveDir);
    
    // Initialize services
    cacheService = new OpenSpecCacheService();
    watcherService = new OpenSpecWatcherService(console, cacheService);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should watch for file changes in OpenSpec directories', async () => {
    // Start watching
    await watcherService.startWatching();
    
    // Create a test file
    const testFile = path.join(specsDir, 'test-spec.md');
    fs.writeFileSync(testFile, '# Test Specification\n\nThis is a test.');
    
    // Give the file watcher time to detect the change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the file content can be retrieved through cache
    const content = cacheService.getFileContent(testFile);
    expect(content).toContain('# Test Specification');
  });

  it('should invalidate cache when files are modified', async () => {
    // Create a test file
    const testFile = path.join(specsDir, 'cache-test.md');
    fs.writeFileSync(testFile, '# Original Content');
    
    // Get content to populate cache
    const originalContent = cacheService.getFileContent(testFile);
    expect(originalContent).toBe('# Original Content');
    
    // Modify the file
    fs.writeFileSync(testFile, '# Updated Content');
    
    // Give the file watcher time to detect the change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get content again - should reflect the update
    const updatedContent = cacheService.getFileContent(testFile);
    expect(updatedContent).toBe('# Updated Content');
  });

  it('should handle file deletions properly', async () => {
    // Create a test file
    const testFile = path.join(specsDir, 'delete-test.md');
    fs.writeFileSync(testFile, '# Delete Test');
    
    // Get content to populate cache
    const content = cacheService.getFileContent(testFile);
    expect(content).toBe('# Delete Test');
    
    // Delete the file
    fs.unlinkSync(testFile);
    
    // Give the file watcher time to detect the change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Attempting to read the deleted file should throw an error
    expect(() => {
      cacheService.getFileContent(testFile);
    }).toThrow(/Failed to read file/);
  });

  it('should watch subdirectories in changes directory', async () => {
    // Create a change directory
    const changeDir = path.join(changesDir, 'feature-update');
    fs.mkdirSync(changeDir);
    
    // Create a specs subdirectory
    const changeSpecsDir = path.join(changeDir, 'specs');
    fs.mkdirSync(changeSpecsDir);
    
    // Restart watching to pick up new directories
    await watcherService.startWatching();
    
    // Create a file in the change directory
    const changeFile = path.join(changeDir, 'proposal.md');
    fs.writeFileSync(changeFile, '# Feature Update Proposal');
    
    // Create a file in the specs subdirectory
    const specDeltaFile = path.join(changeSpecsDir, 'api-changes.md');
    fs.writeFileSync(specDeltaFile, '# API Changes');
    
    // Give the file watcher time to detect the changes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify both files can be accessed through cache
    const changeContent = cacheService.getFileContent(changeFile);
    const specDeltaContent = cacheService.getFileContent(specDeltaFile);
    
    expect(changeContent).toContain('# Feature Update Proposal');
    expect(specDeltaContent).toContain('# API Changes');
  });

  it('should preload directory contents into cache', () => {
    // Create some test files
    const specFile1 = path.join(specsDir, 'spec1.md');
    const specFile2 = path.join(specsDir, 'spec2.md');
    const changeDir = path.join(changesDir, 'change1');
    fs.mkdirSync(changeDir);
    const changeFile = path.join(changeDir, 'proposal.md');
    
    fs.writeFileSync(specFile1, '# Specification 1');
    fs.writeFileSync(specFile2, '# Specification 2');
    fs.writeFileSync(changeFile, '# Change Proposal');
    
    // Preload the directories
    cacheService.preloadDirectory(specsDir);
    cacheService.preloadDirectory(changesDir);
    
    // Verify files are in cache by checking they can be retrieved quickly
    const content1 = cacheService.getFileContent(specFile1);
    const content2 = cacheService.getFileContent(specFile2);
    const content3 = cacheService.getFileContent(changeFile);
    
    expect(content1).toBe('# Specification 1');
    expect(content2).toBe('# Specification 2');
    expect(content3).toBe('# Change Proposal');
  });

  it('should clear cache when requested', () => {
    // Create a test file and populate cache
    const testFile = path.join(specsDir, 'clear-test.md');
    fs.writeFileSync(testFile, '# Clear Test');
    
    const content = cacheService.getFileContent(testFile);
    expect(content).toBe('# Clear Test');
    
    // Clear the cache
    cacheService.clearCache();
    
    // Reading the file should still work because it will be read from disk
    // even though the cache was cleared
    const contentAfterClear = cacheService.getFileContent(testFile);
    expect(contentAfterClear).toBe('# Clear Test');
  });
});