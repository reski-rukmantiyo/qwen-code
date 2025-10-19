/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { updateCommand } from './updateCommand.js';
import { createMockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { type CommandContext } from '../types.js';
import { ROOT_AGENTS_MD_TEMPLATE, OPENSPEC_AGENTS_MD_TEMPLATE } from '../../../templates/agentsMdTemplates.js';

// Mock the file system
vi.mock('node:fs', async () => {
  const actualFs = await vi.importActual('node:fs');
  return {
    ...actualFs,
    existsSync: vi.fn().mockReturnValue(true),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue(''),
    copyFileSync: vi.fn(),
    unlinkSync: vi.fn(),
  };
});

// Mock the OpenSpec services
vi.mock('../../../services/OpenSpecMemoryIntegration.js', () => {
  return {
    OpenSpecMemoryIntegration: vi.fn().mockImplementation(() => {
      return {
        generateOpenSpecMemory: vi.fn().mockResolvedValue('# OpenSpec Context\n\nTest content')
      };
    })
  };
});

vi.mock('../../../services/OpenSpecCacheService.js', () => {
  return {
    OpenSpecCacheService: vi.fn().mockImplementation(() => {
      return {
        getFileContent: vi.fn().mockImplementation((path) => `Content of ${path}`)
      };
    })
  };
});

// Mock AgentsStandardConfigurator
const mockUpdateRootAgentsFile = vi.fn();

vi.mock('../../../services/AgentsStandardConfigurator.js', () => {
  return {
    AgentsStandardConfigurator: vi.fn().mockImplementation(() => {
      return {
        updateRootAgentsFile: mockUpdateRootAgentsFile,
        getRootAgentsPath: vi.fn().mockReturnValue('/tmp/test/AGENTS.md'),
        getOpenSpecAgentsPath: vi.fn().mockReturnValue('/tmp/test/openspec/AGENTS.md')
      };
    })
  };
});

describe('updateCommand - AGENTS.md functionality', () => {
  let mockContext: CommandContext;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-update-test-'));
    
    // Mock process.cwd() to return our temp directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
    
    // Mock the subagent manager
    if (mockContext.services.config) {
      mockContext.services.config.getSubagentManager = vi.fn().mockReturnValue({
        listSubagents: vi.fn().mockResolvedValue([])
      });
    }
    
    // Mock the UI methods
    mockContext.ui.setPendingItem = vi.fn();
    
    // Reset mocks
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.writeFileSync).mockClear();
    vi.mocked(fs.readFileSync).mockClear();
    vi.mocked(fs.copyFileSync).mockClear();
    vi.mocked(fs.unlinkSync).mockClear();
    mockUpdateRootAgentsFile.mockClear();
    
    // Set default mock implementation
    mockUpdateRootAgentsFile.mockReturnValue({
      success: true,
      filePath: path.join(tempDir, 'AGENTS.md'),
      contentUpdated: true
    });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should update openspec/AGENTS.md with the latest template content', async () => {
    // Arrange: Set up the openspec directory structure
    const openspecDir = path.join(tempDir, 'openspec');
    const openSpecAgentsPath = path.join(openspecDir, 'AGENTS.md');
    
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (p === openspecDir) return true;
      return true;
    });

    // Act: Run the command's action
    if (updateCommand.action) {
      await updateCommand.action(mockContext, '');
    }

    // Assert: Check that openspec/AGENTS.md was updated with correct content
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      openSpecAgentsPath,
      OPENSPEC_AGENTS_MD_TEMPLATE,
      'utf-8'
    );
  });

  it('should use AgentsStandardConfigurator to update root AGENTS.md', async () => {
    // Act: Run the command's action
    if (updateCommand.action) {
      await updateCommand.action(mockContext, '');
    }

    // Assert: Check that the configurator was called with the correct template
    expect(mockUpdateRootAgentsFile).toHaveBeenCalledWith(ROOT_AGENTS_MD_TEMPLATE);
  });

  it('should handle AGENTS.md update failure gracefully', async () => {
    // Arrange: Mock the AgentsStandardConfigurator to return an error
    mockUpdateRootAgentsFile.mockReturnValueOnce({
      success: false,
      error: 'Failed to update root AGENTS.md'
    });

    // Act: Run the command's action
    let result;
    if (updateCommand.action) {
      result = await updateCommand.action(mockContext, '');
    }

    // Assert: Check that we still get a success message (errors are handled internally)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
  });

  it('should update both AGENTS.md files', async () => {
    // Arrange: Set up the openspec directory structure
    const openspecDir = path.join(tempDir, 'openspec');
    
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (p === openspecDir) return true;
      return true;
    });

    // Act: Run the command's action
    if (updateCommand.action) {
      await updateCommand.action(mockContext, '');
    }

    // Assert: Check that both AGENTS.md files were updated
    const openSpecAgentsPath = path.join(tempDir, 'openspec', 'AGENTS.md');
    
    // Check that openspec/AGENTS.md was written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      openSpecAgentsPath,
      OPENSPEC_AGENTS_MD_TEMPLATE,
      'utf-8'
    );
    
    // Check that the configurator was called for root AGENTS.md
    expect(mockUpdateRootAgentsFile).toHaveBeenCalledWith(ROOT_AGENTS_MD_TEMPLATE);
  });
});