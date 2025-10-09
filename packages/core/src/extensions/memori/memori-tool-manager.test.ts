/**
 * @license
 * Copyright 2025 QwenLM
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoriToolManager } from './memori-tool-manager.js';
import { ToolRegistry } from '../../tools/tool-registry.js';

// Mock classes
const mockToolRegistry = {
  registerTool: vi.fn(),
};

const mockClient = {
  callTool: vi.fn(),
};

describe('MemoriToolManager', () => {
  let memoriToolManager: MemoriToolManager;

  beforeEach(() => {
    memoriToolManager = new MemoriToolManager(mockToolRegistry as unknown as ToolRegistry);
    mockToolRegistry.registerTool.mockClear();
    mockClient.callTool.mockClear();
  });

  describe('initialize', () => {
    it('should initialize the memori extension with a client', () => {
      memoriToolManager.initialize(mockClient as any);
      // Should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('registerTools', () => {
    it('should register the memori tools with the tool registry', () => {
      memoriToolManager.registerTools();
      
      // Should register two tools: ConversationMemoryTool and SearchConversationTool
      expect(mockToolRegistry.registerTool).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMemoriExtension', () => {
    it('should return the memori extension instance', () => {
      const extension = memoriToolManager.getMemoriExtension();
      expect(extension).toBeDefined();
      expect(typeof extension.getSessionId).toBe('function');
    });
  });
});