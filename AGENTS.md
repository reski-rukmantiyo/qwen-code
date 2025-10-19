# Qwen Code Agents Documentation

This document provides technical documentation for Qwen Code's agent system, covering initialization, update processes, implementation details, and command references.

## Overview

Qwen Code uses a sophisticated agent system to delegate specialized tasks. Agents are configured as Markdown files with YAML frontmatter that define their behavior, available tools, and execution parameters. The system supports three levels of agents:

1. **Project-level agents** - Stored in `.qwen/agents/` within the project directory
2. **User-level agents** - Stored in `~/.qwen/agents/` in the user's home directory
3. **Built-in agents** - Embedded in the codebase and always available

## Agent Configuration Format

Agents are defined using Markdown files with YAML frontmatter:

```markdown
---
name: agent-name
description: Brief description of when to use this agent
tools:
  - tool1
  - tool2
modelConfig:
  model: gemini-2.5-pro
  temp: 0.7
runConfig:
  max_time_minutes: 10
  max_turns: 15
---

System prompt content that defines the agent's behavior.
Supports ${variable} templating via ContextState.
```

### Configuration Fields

- `name` (required): Unique identifier for the agent
- `description` (required): Human-readable description of when and how to use this agent
- `tools` (optional): List of tool names the agent can use (inherits all tools if omitted)
- `modelConfig` (optional): Model configuration parameters
  - `model`: The model to use (e.g., 'gemini-2.5-pro')
  - `temp`: Temperature setting for the model
  - `top_p`: Top-p value for nucleus sampling
- `runConfig` (optional): Runtime execution constraints
  - `max_time_minutes`: Maximum execution time in minutes
  - `max_turns`: Maximum number of conversational turns
- `color` (optional): Display color for the agent

## Initialization Process

When initializing Qwen Code's agent system:

1. The system creates a `SubagentManager` instance with the project configuration
2. It establishes paths for project-level (`./.qwen/agents/`) and user-level (`~/.qwen/agents/`) agents
3. Built-in agents are registered from the `BuiltinAgentRegistry`
4. The system prepares to load agents on-demand from their respective storage locations

### Creating New Agents

Agents can be created programmatically using the `SubagentManager.createSubagent()` method:

```typescript
await subagentManager.createSubagent(config, {
  level: 'project', // or 'user'
  overwrite: false,
  customPath: '/custom/path/agent.md'
});
```

This process:
1. Validates the agent configuration
2. Determines the appropriate file path based on the level
3. Ensures the target directory exists
4. Serializes the agent configuration to Markdown format
5. Writes the file to disk
6. Refreshes the agent cache

## Update Process

Updating an existing agent involves:

1. Loading the existing agent configuration
2. Merging updates with the existing configuration
3. Validating the updated configuration
4. Serializing and writing the updated configuration to disk
5. Refreshing the agent cache

```typescript
await subagentManager.updateSubagent(name, updates, level);
```

Note that built-in agents cannot be modified.

## Runtime Execution

When executing an agent:

1. A `SubAgentScope` is created from the agent configuration
2. The system initializes a chat context with the agent's system prompt
3. Available tools are configured based on the agent's tool restrictions
4. The agent runs in non-interactive mode, processing tasks autonomously
5. Execution continues until:
   - The agent reaches its goal
   - Time limits are exceeded
   - Turn limits are exceeded
   - An error occurs
   - The process is cancelled

### Termination Modes

Agents can terminate in several modes:
- `GOAL`: Successfully completed all defined goals
- `TIMEOUT`: Exceeded maximum allowed working time
- `MAX_TURNS`: Exceeded maximum number of conversational turns
- `ERROR`: Encountered an unrecoverable error
- `CANCELLED`: Was cancelled via an abort signal

## Built-in Agents

Qwen Code includes built-in agents that are always available:

### general-purpose
A versatile research and code analysis agent that excels at:
- Searching for code, configurations, and patterns across large codebases
- Analyzing multiple files to understand system architecture
- Investigating complex questions that require exploring many files
- Performing multi-step research tasks

## Command References

### `/agents` Command
Manages subagents for specialized task delegation with the following subcommands:

- `/agents manage`: Manage existing subagents (view, edit, delete)
- `/agents create`: Create a new subagent with guided setup
- `/agents default`: Set the default subagent for task delegation

## Implementation Details

### SubagentManager
The central class for managing agent configurations:
- Handles CRUD operations for agent configurations
- Manages agent discovery across all three levels
- Provides caching for improved performance
- Handles configuration validation

### SubAgentScope
Manages the runtime context for executing an agent:
- Orchestrates the agent's lifecycle
- Manages chat interactions with the model
- Tracks execution statistics and performance metrics
- Handles tool execution and result processing

### Configuration Serialization
Agents are serialized to/from Markdown with YAML frontmatter:
- Frontmatter contains structured configuration data
- The body contains the system prompt
- Templating is supported using `${variable}` syntax

### Context State
Agents can use templated variables in their system prompts:
- Variables are provided through a `ContextState` object
- The system replaces `${variable}` placeholders with actual values
- Missing variables cause an error during prompt construction

## Performance Monitoring

The system tracks various performance metrics:
- Execution duration
- Number of conversational turns
- Tool call statistics (success/failure rates)
- Token usage (input/output/total)
- Estimated costs based on token usage

Agents provide both compact and detailed execution summaries upon completion.

## Error Handling

The system uses a `SubagentError` class with specific error codes:
- `NOT_FOUND`: Agent not found
- `ALREADY_EXISTS`: Attempting to create an agent that already exists
- `INVALID_CONFIG`: Invalid agent configuration
- `FILE_ERROR`: Issues reading/writing agent files
- `VALIDATION_ERROR`: Configuration validation failures

## Security Considerations

- Built-in agents cannot be modified or deleted
- Agents can be restricted to specific tools
- File paths are carefully validated
- User-level agents are isolated from project-level agents