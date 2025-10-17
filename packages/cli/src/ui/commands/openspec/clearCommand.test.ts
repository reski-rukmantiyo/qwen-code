/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommand } from './clearCommand.js';
import type { CommandContext, MessageActionReturn } from '../types.js';

// Mock the OpenSpec cache service
const mockCacheService = {
  resetCaches: vi.fn(),
};

// Mock the hook that provides the cache service
vi.mock('../../hooks/useOpenSpecWatcher.js', () => ({
  getOpenSpecCacheService: vi.fn(),
}));

describe('clearCommand', () => {
  const mockContext: CommandContext = {
    services: {
      config: null,
      settings: {} as any,
      git: undefined,
      logger: {} as any,
    },
    ui: {
      addItem: vi.fn(),
      clear: vi.fn(),
      setDebugMessage: vi.fn(),
      pendingItem: null,
      setPendingItem: vi.fn(),
      loadHistory: vi.fn(),
      toggleCorgiMode: vi.fn(),
      toggleVimEnabled: vi.fn(),
      setGeminiMdFileCount: vi.fn(),
      reloadCommands: vi.fn(),
    },
    session: {
      stats: {} as any,
      sessionShellAllowlist: new Set(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear the OpenSpec cache when service is available', async () => {
    // Arrange
    const { getOpenSpecCacheService } = await import('../../hooks/useOpenSpecWatcher.js');
    (getOpenSpecCacheService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCacheService);

    // Act
    const result = await clearCommand.action!(mockContext, '') as MessageActionReturn;

    // Assert
    expect(mockCacheService.resetCaches).toHaveBeenCalled();
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect(result.content).toContain('✅ OpenSpec cache has been cleared and reset successfully.');
  });

  it('should return an error message when cache service is not available', async () => {
    // Arrange
    const { getOpenSpecCacheService } = await import('../../hooks/useOpenSpecWatcher.js');
    (getOpenSpecCacheService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);

    // Act
    const result = await clearCommand.action!(mockContext, '') as MessageActionReturn;

    // Assert
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('error');
    expect(result.content).toBe('OpenSpec cache service is not available.');
  });

  it('should handle errors during cache clearing', async () => {
    // Arrange
    const { getOpenSpecCacheService } = await import('../../hooks/useOpenSpecWatcher.js');
    const errorMessage = 'Test error';
    (getOpenSpecCacheService as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      resetCaches: vi.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      }),
    });

    // Act
    const result = await clearCommand.action!(mockContext, '') as MessageActionReturn;

    // Assert
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('error');
    expect(result.content).toContain('Failed to clear OpenSpec cache:');
    expect(result.content).toContain(errorMessage);
  });
});