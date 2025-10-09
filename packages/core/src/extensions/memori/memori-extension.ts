/**
 * @license
 * Copyright 2025 QwenLM
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';

/**
 * Memori extension for Qwen Code that provides session-aware conversation memory
 */
export class MemoriExtension {
  private client: Client | null = null;
  private sessionId: string;
  private projectId: string;

  constructor(projectId: string = 'qwen-code') {
    this.projectId = projectId;
    // Generate a unique session ID for this conversation session
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate a simple session ID
   * @returns A unique session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Initialize the Memori extension with an MCP client
   * @param client The MCP client to use for communication
   */
  initialize(client: Client): void {
    this.client = client;
  }

  /**
   * Store a conversation turn in the memory system with session isolation
   * @param userInput The user's input
   * @param assistantResponse The assistant's response
   * @param sessionId Optional session ID (defaults to current session)
   * @returns Promise resolving to success status
   */
  async storeConversationTurn(
    userInput: string,
    assistantResponse: string,
    sessionId?: string
  ): Promise<boolean> {
    if (!this.client) {
      console.warn('Memori extension not initialized with MCP client');
      return false;
    }

    const conversationId = sessionId || this.sessionId;
    
    try {
      const response = await this.client.callTool({
        name: 'store_memory',
        arguments: {
          content: `CONVERSATION_TURN [${conversationId}]: USER: ${userInput} | ASSISTANT: ${assistantResponse}`,
          project_id: this.projectId,
          agent_role: 'conversation'
        }
      });

      if (response.content && Array.isArray(response.content)) {
        const textContent = response.content.find(c => c.type === 'text');
        if (textContent && textContent.text && textContent.text.includes('✅')) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error storing conversation turn:', error);
      return false;
    }
  }

  /**
   * Search conversation history with session isolation
   * @param query The search query
   * @param sessionId Optional session ID to filter results (defaults to current session)
   * @param limit Maximum number of results to return
   * @returns Promise resolving to array of conversation turns
   */
  async searchConversationHistory(
    query: string,
    sessionId?: string,
    limit: number = 10
  ): Promise<Array<{userInput: string, assistantResponse: string, sessionId: string}>> {
    if (!this.client) {
      console.warn('Memori extension not initialized with MCP client');
      return [];
    }

    const conversationId = sessionId || this.sessionId;
    
    try {
      const response = await this.client.callTool({
        name: 'search_memory',
        arguments: {
          query: `[${conversationId}] ${query}`,
          project_id: this.projectId,
          agent_role: 'conversation',
          scope: 'agent',
          limit: limit
        }
      });

      if (response.content && Array.isArray(response.content)) {
        const textContent = response.content.find(c => c.type === 'text');
        if (textContent && textContent.text) {
          // Parse the conversation turns from the response
          return this.parseConversationResults(textContent.text, conversationId);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error searching conversation history:', error);
      return [];
    }
  }

  /**
   * Parse conversation results from the memory system
   * @param text The raw text response from the memory system
   * @param conversationId The conversation ID to filter by
   * @returns Array of parsed conversation turns
   */
  private parseConversationResults(
    text: string,
    conversationId: string
  ): Array<{userInput: string, assistantResponse: string, sessionId: string}> {
    const results: Array<{userInput: string, assistantResponse: string, sessionId: string}> = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('Key:') && line.includes('CONVERSATION_TURN')) {
        // Extract conversation data from the line
        const conversationMatch = line.match(/\[([^\]]+)\]: USER: (.*?) \| ASSISTANT: (.*)/);
        if (conversationMatch) {
          const [, sessionId, userInput, assistantResponse] = conversationMatch;
          // Only include results from the specified session
          if (sessionId === conversationId) {
            results.push({
              userInput,
              assistantResponse,
              sessionId
            });
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Get the current session ID
   * @returns The current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Set a new session ID
   * @param sessionId The new session ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Store code context in the memory system
   * @param filePath The path to the file
   * @param codeSnippet The relevant code snippet
   * @param description Description of the context
   * @returns Promise resolving to success status
   */
  async storeCodeContext(
    filePath: string,
    codeSnippet: string,
    description: string
  ): Promise<boolean> {
    if (!this.client) {
      console.warn('Memori extension not initialized with MCP client');
      return false;
    }

    try {
      const response = await this.client.callTool({
        name: 'store_memory',
        arguments: {
          content: `CODE_CONTEXT [${filePath}]: ${description}\n${codeSnippet}`,
          project_id: this.projectId,
          agent_role: 'code-context'
        }
      });

      if (response.content && Array.isArray(response.content)) {
        const textContent = response.content.find(c => c.type === 'text');
        if (textContent && textContent.text && textContent.text.includes('✅')) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error storing code context:', error);
      return false;
    }
  }

  /**
   * Search code context
   * @param query The search query
   * @param limit Maximum number of results to return
   * @returns Promise resolving to array of code contexts
   */
  async searchCodeContext(
    query: string,
    limit: number = 5
  ): Promise<Array<{filePath: string, codeSnippet: string, description: string}>> {
    if (!this.client) {
      console.warn('Memori extension not initialized with MCP client');
      return [];
    }

    try {
      const response = await this.client.callTool({
        name: 'search_memory',
        arguments: {
          query: query,
          project_id: this.projectId,
          agent_role: 'code-context',
          scope: 'project',
          limit: limit
        }
      });

      if (response.content && Array.isArray(response.content)) {
        const textContent = response.content.find(c => c.type === 'text');
        if (textContent && textContent.text) {
          // Parse the code contexts from the response
          return this.parseCodeContextResults(textContent.text);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error searching code context:', error);
      return [];
    }
  }

  /**
   * Parse code context results from the memory system
   * @param text The raw text response from the memory system
   * @returns Array of parsed code contexts
   */
  private parseCodeContextResults(
    text: string
  ): Array<{filePath: string, codeSnippet: string, description: string}> {
    const results: Array<{filePath: string, codeSnippet: string, description: string}> = [];
    const lines = text.split('\n');
    
    let currentContext: {filePath: string, codeSnippet: string, description: string} | null = null;
    
    for (const line of lines) {
      if (line.startsWith('Key:') && line.includes('CODE_CONTEXT')) {
        // Start a new context entry
        if (currentContext) {
          results.push(currentContext);
        }
        
        const contextMatch = line.match(/\[([^\]]+)\]: (.*)/);
        if (contextMatch) {
          const [, filePath, description] = contextMatch;
          currentContext = {
            filePath,
            codeSnippet: '',
            description
          };
        }
      } else if (currentContext && line.trim() !== '' && !line.startsWith('---')) {
        // Append to the current code snippet
        if (currentContext.codeSnippet) {
          currentContext.codeSnippet += '\n' + line;
        } else {
          currentContext.codeSnippet = line;
        }
      }
    }
    
    // Don't forget the last context
    if (currentContext) {
      results.push(currentContext);
    }
    
    return results;
  }
}