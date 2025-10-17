/**
 * @license
 * Copyright 2025 QwenLM
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { ToolCallResponseInfo } from '../core/turn.js';
import type { SubagentStatsSummary } from '../subagents/subagent-statistics.js';

/**
 * Service for automatically saving tool and subagent outputs to ByteRover MCP memory
 */
export class MemoryAutoSaveService {
  private client: Client | null = null;
  private projectId: string;
  private enabled: boolean = true;

  constructor(projectId: string = 'qwen-code') {
    this.projectId = projectId;
  }

  /**
   * Initialize the service with an MCP client
   * @param client The MCP client to use for memory operations
   */
  initialize(client: Client): void {
    this.client = client;
  }

  /**
   * Enable or disable auto-save functionality
   * @param enabled Whether auto-save should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if auto-save is enabled and client is initialized
   */
  private isReady(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Save tool execution output to memory
   * @param toolName The name of the tool that was executed
   * @param toolArgs The arguments passed to the tool
   * @param response The tool's response
   * @param success Whether the tool execution was successful
   */
  async saveToolOutput(
    toolName: string,
    toolArgs: Record<string, unknown>,
    response: ToolCallResponseInfo,
    success: boolean,
  ): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      // Format the tool output for memory storage
      const timestamp = new Date().toISOString();
      const status = success ? 'SUCCESS' : 'FAILED';
      const resultDisplay = typeof response.resultDisplay === 'string'
        ? response.resultDisplay
        : JSON.stringify(response.resultDisplay);

      const content = `TOOL_EXECUTION [${timestamp}] ${toolName} - ${status}
Args: ${JSON.stringify(toolArgs, null, 2)}
Result: ${resultDisplay}`;

      const memoryResponse = await this.client!.callTool({
        name: 'store_memory',
        arguments: {
          content: content,
          project_id: this.projectId,
          agent_role: 'tool-execution'
        }
      });

      if (memoryResponse.content && Array.isArray(memoryResponse.content)) {
        const textContent = memoryResponse.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent && textContent.text && textContent.text.includes('✅')) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('Failed to save tool output to memory:', error);
      return false;
    }
  }

  /**
   * Save subagent execution summary to memory
   * @param subagentName The name of the subagent
   * @param summary Execution statistics summary
   * @param finalOutput The final output from the subagent
   * @param terminateReason Why the subagent terminated
   */
  async saveSubagentOutput(
    subagentName: string,
    summary: SubagentStatsSummary,
    finalOutput: string,
    terminateReason: string,
  ): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      // Format the subagent output for memory storage
      const timestamp = new Date().toISOString();

      const content = `SUBAGENT_EXECUTION [${timestamp}] ${subagentName} - ${terminateReason}
Statistics:
  - Rounds: ${summary.rounds}
  - Duration: ${summary.totalDurationMs}ms
  - Tool Calls: ${summary.totalToolCalls} (${summary.successfulToolCalls} success, ${summary.failedToolCalls} failed)
  - Tokens: ${summary.totalTokens} (${summary.inputTokens} in, ${summary.outputTokens} out)

Final Output:
${finalOutput}`;

      const memoryResponse = await this.client!.callTool({
        name: 'store_memory',
        arguments: {
          content: content,
          project_id: this.projectId,
          agent_role: 'subagent-execution'
        }
      });

      if (memoryResponse.content && Array.isArray(memoryResponse.content)) {
        const textContent = memoryResponse.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent && textContent.text && textContent.text.includes('✅')) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('Failed to save subagent output to memory:', error);
      return false;
    }
  }

  /**
   * Retrieve recent memory for a given role
   * @param agentRole The role to filter by (e.g., 'tool-execution', 'subagent-execution')
   * @param limit Maximum number of results to return
   */
  async retrieveMemory(
    agentRole: string,
    limit: number = 10
  ): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const response = await this.client.callTool({
        name: 'search_memory',
        arguments: {
          query: '', // Empty query to get recent entries
          project_id: this.projectId,
          agent_role: agentRole,
          scope: 'agent',
          limit: limit
        }
      });

      if (response.content && Array.isArray(response.content)) {
        const textContent = response.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent && textContent.text) {
          // Parse the memory results
          return this.parseMemoryResults(textContent.text);
        }
      }

      return [];
    } catch (error) {
      console.warn('Failed to retrieve memory:', error);
      return [];
    }
  }

  /**
   * Parse memory results from the response text
   * @param text The raw text response from the memory system
   */
  private parseMemoryResults(text: string): string[] {
    const results: string[] = [];
    const lines = text.split('\n');

    let currentEntry = '';
    for (const line of lines) {
      if (line.startsWith('Key:')) {
        // Start of a new entry
        if (currentEntry) {
          results.push(currentEntry.trim());
        }
        currentEntry = line;
      } else if (line.trim() !== '' && !line.startsWith('---')) {
        // Continuation of current entry
        currentEntry += '\n' + line;
      }
    }

    // Don't forget the last entry
    if (currentEntry) {
      results.push(currentEntry.trim());
    }

    return results;
  }

  /**
   * Save compacted context to memory
   * @param content The formatted context content to save
   */
  async saveCompactedContext(content: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const memoryResponse = await this.client!.callTool({
        name: 'store_memory',
        arguments: {
          content: content,
          project_id: this.projectId,
          agent_role: 'context-compaction'
        }
      });

      if (memoryResponse.content && Array.isArray(memoryResponse.content)) {
        const textContent = memoryResponse.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent && textContent.text && textContent.text.includes('✅')) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('Failed to save compacted context to memory:', error);
      return false;
    }
  }

  /**
   * Retrieve all recent outputs at startup to provide context
   */
  async retrieveStartupContext(): Promise<{
    toolExecutions: string[];
    subagentExecutions: string[];
    compactedContexts: string[];
  }> {
    const [toolExecutions, subagentExecutions, compactedContexts] = await Promise.all([
      this.retrieveMemory('tool-execution', 20),
      this.retrieveMemory('subagent-execution', 10),
      this.retrieveMemory('context-compaction', 5),
    ]);

    return {
      toolExecutions,
      subagentExecutions,
      compactedContexts,
    };
  }
}
