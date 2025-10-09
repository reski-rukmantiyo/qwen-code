# Memori Extension for Qwen Code

The Memori extension provides session-aware conversation memory capabilities for Qwen Code, allowing it to remember and retrieve conversation context across different sessions.

## Features

- **Session Isolation**: Conversations are stored with unique session IDs, ensuring that different conversation sessions don't interfere with each other
- **Persistent Storage**: Conversation history is stored in a local database via the local-memori MCP server
- **Semantic Search**: Uses advanced embedding models for intelligent conversation retrieval
- **Code Context Storage**: Ability to store and retrieve code snippets with contextual descriptions

## Architecture

The Memori extension is built on top of the Model Context Protocol (MCP) and integrates with the local-memori MCP server. It provides two main tools:

1. `store_conversation_turn` - Stores conversation turns with session isolation
2. `search_conversation_history` - Searches conversation history with session filtering

## Configuration

To use the Memori extension, you need to configure the local-memori MCP server in your `.qwen/settings.json`:

```json
{
  "mcpServers": {
    "local-memori": {
      "httpUrl": "http://localhost:4004/mcp",
      "headers": {}
    }
  },
  "memori": {
    "project_id": "qwen-code",
    "default_agent_role": "code-assistant",
    "conversation_agent_role": "conversation",
    "code_context_agent_role": "code-context"
  }
}
```

## Tools

### store_conversation_turn

Stores a conversation turn in persistent memory with session isolation.

**Parameters:**
- `user_input` (string, required): The user's input in the conversation
- `assistant_response` (string, required): The assistant's response to the user's input
- `session_id` (string, optional): Session identifier for isolating conversations. If not provided, uses the current session.

### search_conversation_history

Searches conversation history in persistent memory with session isolation.

**Parameters:**
- `query` (string, required): The search query to find relevant conversation turns
- `session_id` (string, optional): Session identifier to search within. If not provided, searches within the current session.
- `limit` (integer, optional): Maximum number of results to return (default: 5, maximum: 20)

## Usage Examples

### Storing a Conversation Turn

```javascript
// Store a conversation turn in the current session
await store_conversation_turn({
  user_input: "How do I implement a binary search algorithm?",
  assistant_response: "Binary search is an efficient algorithm for finding an item in a sorted array..."
});

// Store a conversation turn in a specific session
await store_conversation_turn({
  user_input: "What is the time complexity of binary search?",
  assistant_response: "The time complexity of binary search is O(log n)...",
  session_id: "session_12345"
});
```

### Searching Conversation History

```javascript
// Search conversation history in the current session
const results = await search_conversation_history({
  query: "binary search algorithm",
  limit: 5
});

// Search conversation history in a specific session
const results = await search_conversation_history({
  query: "time complexity",
  session_id: "session_12345",
  limit: 10
});
```

## Session Management

The Memori extension automatically generates a unique session ID for each conversation session. You can also manually set a session ID:

```javascript
import { getMemoriExtension } from './extensions/memori';

const memoriExtension = getMemoriExtension();
memoriExtension.setSessionId('my_custom_session_id');
```

## Code Context Storage

The extension also provides tools for storing and retrieving code context:

```javascript
// Store code context
await memoriExtension.storeCodeContext(
  'src/main.py',
  'def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1',
  'Implementation of binary search algorithm'
);

// Search code context
const codeResults = await memoriExtension.searchCodeContext('binary search');
```

## Benefits

1. **Session Isolation**: Different users or conversation contexts don't interfere with each other
2. **Persistent Memory**: Conversation history is retained across Qwen Code restarts
3. **Intelligent Search**: Semantic search capabilities help find relevant conversations even with different wording
4. **Scalable**: Can handle large volumes of conversation data efficiently
5. **Flexible**: Works with both local LLMs (via LM Studio) and cloud-based embedding services

## Requirements

- Local-memori MCP server running on `http://localhost:4004/mcp`
- Optional: LM Studio for local embedding generation
- SQLite database for persistent storage

## Implementation Details

The Memori extension is implemented as follows:

1. **MemoriExtension Class**: Core class that handles communication with the local-memori MCP server
2. **ConversationMemoryTool**: Tool for storing conversation turns with session isolation
3. **SearchConversationTool**: Tool for searching conversation history with session filtering
4. **MemoriToolManager**: Manager class that initializes and registers the memori tools

The extension is automatically integrated into Qwen Code's tool system when MCP servers are configured.