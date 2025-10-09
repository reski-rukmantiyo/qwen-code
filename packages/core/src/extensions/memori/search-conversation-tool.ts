/**
 * @license
 * Copyright 2025 QwenLM
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ToolResult } from '../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
} from '../../tools/tools.js';
import type { FunctionDeclaration } from '@google/genai';
import { MemoriExtension } from './index.js';

const searchConversationToolSchemaData: FunctionDeclaration = {
  name: 'search_conversation_history',
  description:
    'Searches conversation history in persistent memory with session isolation. Use this to retrieve previously stored conversation context.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The search query to find relevant conversation turns',
      },
      session_id: {
        type: 'string',
        description:
          'Optional session identifier to search within. If not provided, searches within the current session.',
      },
      limit: {
        type: 'integer',
        description:
          'Maximum number of results to return (default: 5)',
        minimum: 1,
        maximum: 20,
      },
    },
    required: ['query'],
  },
};

const searchConversationToolDescription = `
Searches conversation history in persistent memory with session isolation.

Use this tool when you need to retrieve previously stored conversation context. This is particularly useful for:

- Recalling user preferences or context mentioned earlier in the conversation
- Finding important facts or decisions made during previous interactions
- Continuing discussions or tasks from previous sessions

The tool automatically searches within the current session, ensuring that conversation context is properly isolated.

## Parameters

- \`query\` (string, required): The search query to find relevant conversation turns
- \`session_id\` (string, optional): Session identifier to search within. If not provided, searches within the current session.
- \`limit\` (integer, optional): Maximum number of results to return (default: 5, maximum: 20)
`;

interface SearchConversationParams {
  query: string;
  session_id?: string;
  limit?: number;
}

class SearchConversationToolInvocation extends BaseToolInvocation<
  SearchConversationParams,
  ToolResult
> {
  private memoriExtension: MemoriExtension;

  constructor(params: SearchConversationParams, memoriExtension: MemoriExtension) {
    super(params);
    this.memoriExtension = memoriExtension;
  }

  getDescription(): string {
    return `Search conversation history for: "${this.params.query}" in session ${this.params.session_id || this.memoriExtension.getSessionId()}`;
  }

  async execute(_signal: AbortSignal): Promise<ToolResult> {
    const { query, session_id, limit } = this.params;

    try {
      const results = await this.memoriExtension.searchConversationHistory(
        query,
        session_id,
        limit || 5
      );

      if (results.length > 0) {
        const formattedResults = results.map((result, index) => 
          `#${index + 1} [Session: ${result.sessionId}]
User: ${result.userInput}
Assistant: ${result.assistantResponse}`
        ).join('\n\n');
        
        const successMessage = `🔍 Found ${results.length} relevant conversation turns:

${formattedResults}`;
        return {
          llmContent: JSON.stringify({
            success: true,
            results: results,
            count: results.length,
          }),
          returnDisplay: successMessage,
        };
      } else {
        const message = `🔍 No relevant conversation turns found for query: "${query}"`;
        return {
          llmContent: JSON.stringify({
            success: true,
            results: [],
            count: 0,
          }),
          returnDisplay: message,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[SearchConversationTool] Error executing search_conversation_history: ${errorMessage}`,
      );
      return {
        llmContent: JSON.stringify({
          success: false,
          error: `Failed to search conversation history. Detail: ${errorMessage}`,
        }),
        returnDisplay: `Error searching conversation history: ${errorMessage}`,
      };
    }
  }
}

export class SearchConversationTool
  extends BaseDeclarativeTool<SearchConversationParams, ToolResult>
{
  static readonly Name: string = searchConversationToolSchemaData.name!;
  private memoriExtension: MemoriExtension;

  constructor(memoriExtension: MemoriExtension) {
    super(
      SearchConversationTool.Name,
      'SearchConversationHistory',
      searchConversationToolDescription,
      Kind.Think,
      searchConversationToolSchemaData.parametersJsonSchema as Record<string, unknown>,
    );
    this.memoriExtension = memoriExtension;
  }

  protected override validateToolParamValues(
    params: SearchConversationParams,
  ): string | null {
    if (!params.query || params.query.trim() === '') {
      return 'Parameter "query" must be a non-empty string.';
    }

    if (params.limit !== undefined && (params.limit < 1 || params.limit > 20)) {
      return 'Parameter "limit" must be between 1 and 20.';
    }

    return null;
  }

  protected createInvocation(params: SearchConversationParams) {
    return new SearchConversationToolInvocation(params, this.memoriExtension);
  }
}