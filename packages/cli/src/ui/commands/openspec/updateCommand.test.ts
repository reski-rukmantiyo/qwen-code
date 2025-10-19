/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  };
});

// Mock process.cwd()
vi.mock('node:process', () => ({
  default: {
    cwd: vi.fn().mockReturnValue('/mock/project/path')
  }
}));

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

// Mock the AgentsStandardConfigurator
vi.mock('../../../services/AgentsStandardConfigurator.js', () => {
  return {
    AgentsStandardConfigurator: vi.fn().mockImplementation(() => {
      return {
        updateRootAgentsFile: vi.fn().mockReturnValue({
          success: true,
          filePath: '/mock/project/path/AGENTS.md',
          contentUpdated: true
        })
      };
    })
  };
});

describe('updateCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    // Create a fresh mock context for each test
    mockContext = createMockCommandContext();
    
    // Mock the subagent manager
    if (mockContext.services.config) {
      (mockContext.services.config as any).getSubagentManager = vi.fn().mockReturnValue({
        listSubagents: vi.fn().mockResolvedValue([])
      });
    }
    
    // Mock the UI methods
    mockContext.ui.setPendingItem = vi.fn();
  });

  it('should have the correct name and description', () => {
    expect(updateCommand.name).toBe('update');
    expect(updateCommand.description).toBe('Refresh agent instructions and regenerate AI guidance');
    expect(updateCommand.kind).toBe('built-in');
  });

  it('should return success message when update completes', async () => {
    // Act: Run the command's action
    const result = await updateCommand.action!(mockContext, '');

    // Assert: Check for the correct success message
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
    
    const content = (result as any).content;
    expect(content).toContain('Refreshed any subagents configured to use OpenSpec specifications');
    expect(content).toContain('Regenerated AI guidance files based on current specifications');
    expect(content).toContain('Updated agent instructions with the latest changes');
    expect(content).toContain('Made updated guidance immediately available to AI models');
    expect(content).toContain('Updated OpenSpec AGENTS.md with latest template');
    expect(content).toContain('Updated root AGENTS.md with marker-based updates');
  });

  it('should update AGENTS.md files with correct templates', async () => {
    // Import the actual modules to access the constants
    const fs = await import('node:fs');
    const path = await import('node:path');
    
    // Act: Run the command's action
    await updateCommand.action!(mockContext, '');
    
    // Assert: Check that AGENTS.md files were updated with correct templates
    const projectRoot = '/mock/project/path';
    const openSpecDir = path.join(projectRoot, 'openspec');
    
    // Check that OpenSpec AGENTS.md was updated with the correct template
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(openSpecDir, 'AGENTS.md'),
      OPENSPEC_AGENTS_MD_TEMPLATE,
      'utf-8'
    );
    
    // Verify that the AgentsStandardConfigurator was called with the correct template
    const { AgentsStandardConfigurator } = await import('../../../services/AgentsStandardConfigurator.js');
    const configuratorInstance = (AgentsStandardConfigurator as any).mock.results[0].value;
    expect(configuratorInstance.updateRootAgentsFile).toHaveBeenCalledWith(ROOT_AGENTS_MD_TEMPLATE);
  });

  it('should ignore any arguments passed to the command', async () => {
    // Act: Run the command's action with arguments
    const result = await updateCommand.action!(mockContext, '--force --verbose');

    // Assert: Check for the correct success message (same as without arguments)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
  });
  
  it('should handle errors gracefully', async () => {
    // Mock an error in subagent manager
    if (mockContext.services.config) {
      (mockContext.services.config as any).getSubagentManager = vi.fn().mockReturnValue({
        listSubagents: vi.fn().mockRejectedValue(new Error('Test error'))
      });
    }

    // Act: Run the command's action
    const result = await updateCommand.action!(mockContext, '');

    // Assert: Check that we still get a success message (errors are handled internally)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
  });
  
  it('should handle AGENTS.md update errors gracefully', async () => {
    // Mock an error in AgentsStandardConfigurator
    const { AgentsStandardConfigurator } = await import('../../../services/AgentsStandardConfigurator.js');
    (AgentsStandardConfigurator as any).mockImplementation(() => {
      return {
        updateRootAgentsFile: vi.fn().mockReturnValue({
          success: false,
          error: 'Test error'
        })
      };
    });
    
    // Mock fs.writeFileSync to throw an error for OpenSpec AGENTS.md
    const fs = await import('node:fs');
    (fs.writeFileSync as any).mockImplementation((filePath: string) => {
      if (filePath.includes('openspec') && filePath.includes('AGENTS.md')) {
        throw new Error('Permission denied');
      }
    });

    // Act: Run the command's action
    const result = await updateCommand.action!(mockContext, '');

    // Assert: Check that we still get a success message (errors are handled internally)
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: expect.stringContaining('✅ Agent instructions and AI guidance updated successfully!'),
    });
  });
});