/**
 * @license
 * Copyright 2025 QwenLM
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoriExtension } from './memori-extension.js';

// Mock MCP Client
const mockClient = {
  callTool: vi.fn(),
};

describe('MemoriExtension', () => {
  let memoriExtension: MemoriExtension;

  beforeEach(() => {
    memoriExtension = new MemoriExtension('test-project');
    memoriExtension.initialize(mockClient as any);
    mockClient.callTool.mockClear();
  });

  describe('storeConversationTurn', () => {
    it('should store a conversation turn successfully', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '✅ Stored memory for [conversation] in [test-project]: CONVERSATION_TURN' }]
      });

      const result = await memoriExtension.storeConversationTurn(
        'Hello, how are you?',
        'I am doing well, thank you for asking!'
      );

      expect(result).toBe(true);
      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: 'store_memory',
        arguments: {
          content: expect.stringContaining('CONVERSATION_TURN'),
          project_id: 'test-project',
          agent_role: 'conversation'
        }
      });
    });

    it('should return false when storage fails', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '❌ Failed to store memory' }]
      });

      const result = await memoriExtension.storeConversationTurn(
        'Hello, how are you?',
        'I am doing well, thank you for asking!'
      );

      expect(result).toBe(false);
    });

    it('should use provided session ID when specified', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '✅ Stored memory for [conversation] in [test-project]: CONVERSATION_TURN' }]
      });

      const result = await memoriExtension.storeConversationTurn(
        'Hello, how are you?',
        'I am doing well, thank you for asking!',
        'custom-session-123'
      );

      expect(result).toBe(true);
      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: 'store_memory',
        arguments: {
          content: expect.stringContaining('[custom-session-123]'),
          project_id: 'test-project',
          agent_role: 'conversation'
        }
      });
    });
  });

  describe('searchConversationHistory', () => {
    it('should search conversation history and return results', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{
          type: 'text',
          text: `Key: [test-project][conversation] CONVERSATION_TURN [session-123]: USER: Hello | ASSISTANT: Hi there!
---
Key: [test-project][conversation] CONVERSATION_TURN [session-123]: USER: How are you? | ASSISTANT: I'm good!`
        }]
      });

      const results = await memoriExtension.searchConversationHistory(
        'hello',
        'session-123',
        5
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        userInput: 'Hello',
        assistantResponse: 'Hi there!',
        sessionId: 'session-123'
      });
    });

    it('should filter results by session ID', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{
          type: 'text',
          text: `Key: [test-project][conversation] CONVERSATION_TURN [session-123]: USER: Hello | ASSISTANT: Hi there!
---
Key: [test-project][conversation] CONVERSATION_TURN [other-session]: USER: Goodbye | ASSISTANT: See you later!`
        }]
      });

      const results = await memoriExtension.searchConversationHistory(
        'hello',
        'session-123',
        5
      );

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-123');
    });

    it('should return empty array when no results found', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '🔍 No memories found in [test-project] for query: nonexistent' }]
      });

      const results = await memoriExtension.searchConversationHistory(
        'nonexistent',
        'session-123',
        5
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('getSessionId', () => {
    it('should return the current session ID', () => {
      const sessionId = memoriExtension.getSessionId();
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
    });
  });

  describe('setSessionId', () => {
    it('should set a new session ID', () => {
      const newSessionId = 'new-session-456';
      memoriExtension.setSessionId(newSessionId);
      expect(memoriExtension.getSessionId()).toBe(newSessionId);
    });
  });

  describe('storeCodeContext', () => {
    it('should store code context successfully', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '✅ Stored memory for [code-context] in [test-project]: CODE_CONTEXT' }]
      });

      const result = await memoriExtension.storeCodeContext(
        'src/main.py',
        'print("Hello, World!")',
        'Simple hello world program'
      );

      expect(result).toBe(true);
      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: 'store_memory',
        arguments: {
          content: expect.stringContaining('CODE_CONTEXT'),
          project_id: 'test-project',
          agent_role: 'code-context'
        }
      });
    });
  });

  describe('searchCodeContext', () => {
    it('should search code context and return results', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{
          type: 'text',
          text: `Key: [test-project][code-context] CODE_CONTEXT [src/main.py]: Simple hello world program
print("Hello, World!")`
        }]
      });

      const results = await memoriExtension.searchCodeContext('hello world', 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        filePath: 'src/main.py',
        codeSnippet: 'print("Hello, World!")',
        description: 'Simple hello world program'
      });
    });
  });
});