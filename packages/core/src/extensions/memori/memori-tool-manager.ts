/**
 * @license
 * Copyright 2025 QwenLM
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ToolRegistry } from '../../tools/tool-registry.js';
import { MemoriExtension } from './index.js';
import { ConversationMemoryTool, SearchConversationTool } from './tools.js';

/**
 * Manages the initialization and registration of memori extension tools
 */
export class MemoriToolManager {
  private memoriExtension: MemoriExtension;
  private toolRegistry: ToolRegistry;
  private toolsRegistered: boolean = false;

  constructor(toolRegistry: ToolRegistry, projectId: string = 'qwen-code') {
    this.toolRegistry = toolRegistry;
    this.memoriExtension = new MemoriExtension(projectId);
  }

  /**
   * Initialize the memori extension with an MCP client
   * @param client The MCP client to use for communication
   */
  initialize(client: Client): void {
    this.memoriExtension.initialize(client);
  }

  /**
   * Register the memori tools with the tool registry
   */
  registerTools(): void {
    // Prevent duplicate registrations
    if (this.toolsRegistered) {
      return;
    }
    
    // Register the conversation memory tool
    const conversationMemoryTool = new ConversationMemoryTool(this.memoriExtension);
    this.toolRegistry.registerTool(conversationMemoryTool);
    
    // Register the search conversation tool
    const searchConversationTool = new SearchConversationTool(this.memoriExtension);
    this.toolRegistry.registerTool(searchConversationTool);
    
    // Mark tools as registered
    this.toolsRegistered = true;
  }

  /**
   * Unregister the memori tools from the tool registry
   */
  unregisterTools(): void {
    // Reset the registration flag to allow re-registration
    this.toolsRegistered = false;
  }

  /**
   * Get the memori extension instance
   * @returns The memori extension instance
   */
  getMemoriExtension(): MemoriExtension {
    return this.memoriExtension;
  }
}