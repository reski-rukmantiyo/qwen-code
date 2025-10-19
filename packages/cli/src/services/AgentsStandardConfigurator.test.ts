/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { AgentsStandardConfigurator } from './AgentsStandardConfigurator.js';

describe('AgentsStandardConfigurator', () => {
  let tempDir: string;
  let openspecDir: string;
  let configurator: AgentsStandardConfigurator;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-config-test-'));
    openspecDir = path.join(tempDir, 'openspec');
    fs.mkdirSync(openspecDir);
    
    // Initialize the configurator
    configurator = new AgentsStandardConfigurator({
      projectRoot: tempDir,
      openSpecDir: openspecDir,
      enableRollback: true
    });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create a new root AGENTS.md file with markers', () => {
    const initialContent = 'Test content for markers';
    const result = configurator.createRootAgentsFile(initialContent);
    
    expect(result.success).toBe(true);
    expect(result.createdNewFile).toBe(true);
    expect(result.filePath).toBe(path.join(tempDir, 'AGENTS.md'));
    
    // Verify file content
    const fileContent = fs.readFileSync(result.filePath, 'utf-8');
    expect(fileContent).toContain('OPENSPEC:START');
    expect(fileContent).toContain(initialContent);
    expect(fileContent).toContain('OPENSPEC:END');
  });

  it('should read an existing root AGENTS.md file', () => {
    const testContent = '# Test AGENTS.md\nSome content here';
    const agentsPath = path.join(tempDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, testContent);
    
    const content = configurator.readRootAgentsFile();
    expect(content).toBe(testContent);
  });

  it('should return null when reading non-existent file', () => {
    const content = configurator.readRootAgentsFile();
    expect(content).toBeNull();
  });

  it('should extract content between markers', () => {
    const content = `# AGENTS.md
Some content before markers
OPENSPEC:START
Extracted content here
OPENSPEC:END
Some content after markers`;
    
    const extracted = configurator.extractMarkedContent(content);
    expect(extracted).toBe('Extracted content here');
  });

  it('should return null when extracting from content without markers', () => {
    const content = `# AGENTS.md
Some content without markers
Just regular content`;
    
    const extracted = configurator.extractMarkedContent(content);
    expect(extracted).toBeNull();
  });

  it('should update content between markers', () => {
    const existingContent = `# AGENTS.md
Existing content
OPENSPEC:START
Old content
OPENSPEC:END
More existing content`;
    
    const newContent = 'New updated content';
    const updatedContent = configurator.updateContentWithMarkers(existingContent, newContent);
    
    expect(updatedContent).toContain('OPENSPEC:START');
    expect(updatedContent).toContain(newContent);
    expect(updatedContent).toContain('OPENSPEC:END');
    expect(updatedContent).toContain('# AGENTS.md');
    expect(updatedContent).toContain('Existing content');
    expect(updatedContent).toContain('More existing content');
  });

  it('should create markers when updating content without existing markers', () => {
    const existingContent = `# AGENTS.md
Existing content without markers`;
    
    const newContent = 'New content to be marked';
    const updatedContent = configurator.updateContentWithMarkers(existingContent, newContent);
    
    expect(updatedContent).toContain('OPENSPEC:START');
    expect(updatedContent).toContain(newContent);
    expect(updatedContent).toContain('OPENSPEC:END');
    expect(updatedContent).toContain('# AGENTS.md');
    expect(updatedContent).toContain('Existing content without markers');
  });

  it('should update root AGENTS.md file with new content', () => {
    const newContent = 'Updated marked content';
    const result = configurator.updateRootAgentsFile(newContent);
    
    expect(result.success).toBe(true);
    expect(result.filePath).toBe(path.join(tempDir, 'AGENTS.md'));
    
    // Verify file content
    const fileContent = fs.readFileSync(result.filePath, 'utf-8');
    expect(fileContent).toContain('OPENSPEC:START');
    expect(fileContent).toContain(newContent);
    expect(fileContent).toContain('OPENSPEC:END');
  });

  it('should validate correct marker syntax', () => {
    const validContent = `# AGENTS.md
OPENSPEC:START
Valid content
OPENSPEC:END`;
    
    expect(configurator.validateMarkerSyntax(validContent)).toBe(true);
  });

  it('should invalidate incorrect marker syntax', () => {
    const invalidContent = `# AGENTS.md
OPENSPEC:START
Invalid content
Missing end marker`;
    
    expect(configurator.validateMarkerSyntax(invalidContent)).toBe(false);
  });

  it('should handle rollback on update failure', () => {
    // Create an initial file
    const initialContent = '# Initial content';
    const agentsPath = path.join(tempDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, initialContent);
    
    // Make the directory read-only to simulate failure
    fs.chmodSync(tempDir, 0o444);
    
    const result = configurator.updateRootAgentsFile('New content');
    
    // Restore permissions for cleanup
    fs.chmodSync(tempDir, 0o755);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Verify original content is preserved
    const fileContent = fs.readFileSync(agentsPath, 'utf-8');
    expect(fileContent).toBe(initialContent);
  });

  it('should correctly report when no content update is needed', () => {
    const content = 'Same content';
    const agentsPath = path.join(tempDir, 'AGENTS.md');
    
    // Create file with specific content
    const initialContent = `# AGENTS.md
OPENSPEC:START
${content}
OPENSPEC:END`;
    fs.writeFileSync(agentsPath, initialContent);
    
    // Update with same content
    const result = configurator.updateRootAgentsFile(content);
    
    expect(result.success).toBe(true);
    expect(result.contentUpdated).toBe(false);
  });
});