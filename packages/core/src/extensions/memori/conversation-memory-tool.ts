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

const conversationMemoryToolSchemaData: FunctionDeclaration = {
  name: 'store_conversation_turn',
  description:
    'Stores a conversation turn in persistent memory with session isolation. Use this to remember important conversation context that should be available in future interactions within the same session.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      user_input: {
        type: 'string',
        description:
          'The user\'s input in the conversation',
      },
      assistant_response: {
        type: 'string',
        description:
          'The assistant\'s response to the user\'s input',
      },
      session_id: {
        type: 'string',
        description:
          'Optional session identifier for isolating conversations. If not provided, uses the current session.',
      },
    },
    required: ['user_input', 'assistant_response'],
  },
};

const conversationMemoryToolDescription = `
Stores a conversation turn in persistent memory with session isolation.

Use this tool when you want to remember important conversation context that should be available in future interactions within the same session. This is particularly useful for:

- Remembering user preferences or context mentioned earlier in the conversation
- Storing important facts or decisions made during the conversation
- Keeping track of ongoing tasks or discussions

The tool automatically associates the conversation turn with the current session, ensuring that different conversation sessions don't interfere with each other.

## Parameters

- \`user_input\` (string, required): The user's input in the conversation
- \`assistant_response\` (string, required): The assistant's response to the user's input
- \`session_id\` (string, optional): Session identifier for isolating conversations. If not provided, uses the current session.
`;

interface StoreConversationTurnParams {
  user_input: string;
  assistant_response: string;
  session_id?: string;
}

class ConversationMemoryToolInvocation extends BaseToolInvocation<
  StoreConversationTurnParams,
  ToolResult
> {
  private memoriExtension: MemoriExtension;

  constructor(params: StoreConversationTurnParams, memoriExtension: MemoriExtension) {
    super(params);
    this.memoriExtension = memoriExtension;
  }

  getDescription(): string {
    return `Store conversation turn in session ${this.params.session_id || this.memoriExtension.getSessionId()}`;
  }

  async execute(_signal: AbortSignal): Promise<ToolResult> {
    const { user_input, assistant_response, session_id } = this.params;

    try {
      const success = await this.memoriExtension.storeConversationTurn(
        user_input,
        assistant_response,
        session_id
      );

      if (success) {
        const sessionId = session_id || this.memoriExtension.getSessionId();
        const successMessage = `✅ Successfully stored conversation turn in session ${sessionId}`;
        return {
          llmContent: JSON.stringify({
            success: true,
            message: successMessage,
          }),
          returnDisplay: successMessage,
        };
      } else {
        const errorMessage = 'Failed to store conversation turn in memory';
        return {
          llmContent: JSON.stringify({
            success: false,
            error: errorMessage,
          }),
          returnDisplay: `Error: ${errorMessage}`,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[ConversationMemoryTool] Error executing store_conversation_turn: ${errorMessage}`,
      );
      return {
        llmContent: JSON.stringify({
          success: false,
          error: `Failed to store conversation turn. Detail: ${errorMessage}`,
        }),
        returnDisplay: `Error storing conversation turn: ${errorMessage}`,
      };
    }
  }
}

export class ConversationMemoryTool
  extends BaseDeclarativeTool<StoreConversationTurnParams, ToolResult>
{
  static readonly Name: string = conversationMemoryToolSchemaData.name!;
  private memoriExtension: MemoriExtension;

  constructor(memoriExtension: MemoriExtension) {
    super(
      ConversationMemoryTool.Name,
      'StoreConversationTurn',
      conversationMemoryToolDescription,
      Kind.Think,
      conversationMemoryToolSchemaData.parametersJsonSchema as Record<string, unknown>,
    );
    this.memoriExtension = memoriExtension;
  }

  protected override validateToolParamValues(
    params: StoreConversationTurnParams,
  ): string | null {
    if (!params.user_input || params.user_input.trim() === '') {
      return 'Parameter "user_input" must be a non-empty string.';
    }

    if (!params.assistant_response || params.assistant_response.trim() === '') {
      return 'Parameter "assistant_response" must be a non-empty string.';
    }

    return null;
  }

  protected createInvocation(params: StoreConversationTurnParams) {
    return new ConversationMemoryToolInvocation(params, this.memoriExtension);
  }
}