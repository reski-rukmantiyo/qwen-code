/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommand } from './clearCommand.js';
import type { CommandContext, MessageActionReturn } from '../types.js';
import * as fs from 'node:fs';

// Mock the OpenSpec cache service
const mockCacheService = {
  resetCaches: vi.fn(),
};

// Mock the hook that provides the cache service
vi.mock('../../hooks/useOpenSpecWatcher.js', () => ({
  getOpenSpecCacheService: vi.fn(),
}));

// Mock the 'fs' module with both named and default exports to avoid breaking default import sites
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const rmSync = vi.fn();
  return {
    ...actual,
    existsSync,
    rmSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      rmSync,
    },
  } as unknown as typeof import('node:fs');
});

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

  it('should completely reset OpenSpec by default (removing directory)', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (typeof path === 'string' && path.includes('openspec')) {
        return true;
      }
      return false;
    });
    
    const rmSyncSpy = vi.mocked(fs.rmSync);

    // Act
    const result = await clearCommand.action!(mockContext, '') as MessageActionReturn;

    // Assert
    expect(rmSyncSpy).toHaveBeenCalledWith(expect.stringContaining('openspec'), { recursive: true, force: true });
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect(result.content).toContain('✅ OpenSpec has been completely reset');
  });

  it('should clear the OpenSpec cache when --cache-only flag is used and service is available', async () => {
    // Arrange
    const { getOpenSpecCacheService } = await import('../../hooks/useOpenSpecWatcher.js');
    (getOpenSpecCacheService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCacheService);

    // Act
    const result = await clearCommand.action!(mockContext, '--cache-only') as MessageActionReturn;

    // Assert
    expect(mockCacheService.resetCaches).toHaveBeenCalled();
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect(result.content).toContain('✅ OpenSpec cache has been cleared and reset successfully.');
  });

  it('should return an error message when cache service is not available with --cache-only flag', async () => {
    // Arrange
    const { getOpenSpecCacheService } = await import('../../hooks/useOpenSpecWatcher.js');
    (getOpenSpecCacheService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);

    // Act
    const result = await clearCommand.action!(mockContext, '--cache-only') as MessageActionReturn;

    // Assert
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('error');
    expect(result.content).toBe('OpenSpec cache service is not available.');
  });

  it('should handle errors during cache clearing with --cache-only flag', async () => {
    // Arrange
    const { getOpenSpecCacheService } = await import('../../hooks/useOpenSpecWatcher.js');
    const errorMessage = 'Test error';
    (getOpenSpecCacheService as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      resetCaches: vi.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      }),
    });

    // Act
    const result = await clearCommand.action!(mockContext, '--cache-only') as MessageActionReturn;

    // Assert
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('error');
    expect(result.content).toContain('Failed to clear OpenSpec:');
    expect(result.content).toContain(errorMessage);
  });

  it('should handle errors during complete reset', async () => {
    // Arrange
    const errorMessage = 'Test error';
    vi.mocked(fs.rmSync).mockImplementation(() => {
      throw new Error(errorMessage);
    });
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (typeof path === 'string' && path.includes('openspec')) {
        return true;
      }
      return false;
    });

    // Act
    const result = await clearCommand.action!(mockContext, '') as MessageActionReturn;

    // Assert
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('error');
    expect(result.content).toContain('Failed to clear OpenSpec:');
    expect(result.content).toContain(errorMessage);
  });

  it('should completely reset OpenSpec by default when directory exists', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (typeof path === 'string' && path.includes('openspec')) {
        return true;
      }
      return false;
    });
    
    const rmSyncSpy = vi.mocked(fs.rmSync).mockImplementation(() => {});

    // Act
    const result = await clearCommand.action!(mockContext, '') as MessageActionReturn;

    // Assert
    expect(rmSyncSpy).toHaveBeenCalledWith(expect.stringContaining('openspec'), { recursive: true, force: true });
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect(result.content).toContain('✅ OpenSpec has been completely reset');
  });

  it('should report nothing to reset when no openspec directory exists (default behavior)', async () => {
    // Arrange
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (typeof path === 'string' && path.includes('openspec')) {
        return false;
      }
      return false;
    });

    // Act
    const result = await clearCommand.action!(mockContext, '') as MessageActionReturn;

    // Assert
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
    expect(result.content).toContain('✅ No OpenSpec directory found. Nothing to reset.');
  });
});