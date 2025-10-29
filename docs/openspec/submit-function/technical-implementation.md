# Technical Implementation Details: Question Interpretation and Response Generation

## Overview

This document provides technical implementation details for the question interpretation and response generation functionality added to the `/openspec submit` command. This feature enables users to ask questions about the codebase without triggering any modifications, using intelligent file discovery and AI-powered response generation.

## Architecture

The question handling functionality follows a layered architecture:

1. **Input Detection Layer** - Identifies question-mode requests
2. **Routing Layer** - Directs questions to the dedicated handler
3. **Context Retrieval Layer** - Extracts relevant source code context
4. **Response Generation Layer** - Generates AI-powered responses
5. **Presentation Layer** - Displays responses to users

## Implementation Details

### 1. Input Detection Layer

**Location**: `/packages/cli/src/ui/commands/openspec/submitCommand.ts`

The input detection layer extends the existing command parser to identify question-mode requests via specific syntax:

```javascript
// Check if this is a question-mode request with specific syntax
const trimmedArgs = args.trim();
if (trimmedArgs.startsWith('"question:') && trimmedArgs.endsWith('"')) {
  const question = trimmedArgs.substring(10, trimmedArgs.length - 1).trim();
  return await processQuestion(context, question);
}
```

This implementation supports the syntax: `/openspec submit "question: how does X work?"`

### 2. Routing Layer

**Location**: `/packages/cli/src/ui/commands/openspec/submitCommand.ts` and `/packages/cli/src/ui/commands/openspec/qaHandler.ts`

The routing mechanism directs question queries to a dedicated question handler instead of the standard proposal workflow:

```javascript
// In submitCommand.ts
if (activity === 'question') {
  // Handle question activity
  return await processQuestion(context, description);
}

// In submitCommand.ts for direct syntax
return await processQuestion(context, question);
```

### 3. Context Retrieval Layer

**Location**: `/packages/cli/src/ui/commands/openspec/qaHandler.ts`

The context retrieval functionality implements intelligent file discovery based on question keywords:

#### Keyword Extraction
```javascript
// Extract keywords from the question
const keywords = question.toLowerCase().match(/\b\w{3,}\b/g) || [];
const uniqueKeywords = [...new Set(keywords)];
```

#### File Discovery
```javascript
// Use file search to find relevant files
const fileSearch = FileSearchFactory.create({
  projectRoot,
  ignoreDirs: ['.git', 'node_modules', 'dist', 'build'],
  useGitignore: true,
  useGeminiignore: true,
  cache: true,
  cacheTtl: 60000, // 1 minute
  enableRecursiveFileSearch: true,
  disableFuzzySearch: false,
});

await fileSearch.initialize();

// Search for files matching keywords
const searchResults = await Promise.all(
  uniqueKeywords.map(keyword => 
    fileSearch.search(`*${keyword}*`, { maxResults: 5 })
  )
);
```

#### Context Construction
```javascript
// Read content from the most relevant files
let contextContent = '';
for (const file of matchingFiles) {
  try {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      
      // Skip directories and large files
      if (stats.isDirectory()) continue;
      if (stats.size > 100000) continue; // Skip files larger than 100KB
      
      // Skip binary files
      const ext = path.extname(filePath).toLowerCase();
      if (IGNORED_EXTENSIONS.includes(ext)) continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Skip files that are likely binary
      if (isLikelyBinary(content)) continue;
      
      // Add file header and content to context (limit content length)
      contextContent += `\n\n--- ${file} ---\n${content.substring(0, 3000)}`;
    }
  } catch (error) {
    // Continue with other files if one fails
    console.warn(`Failed to read file ${file}:`, error);
  }
}
```

### 4. Response Generation Layer

**Location**: `/packages/cli/src/ui/commands/openspec/qaHandler.ts`

The response generation pipeline uses a lightweight LLM interface for question answering with streaming support:

#### Streaming Response Generation
```javascript
async function* generateAnswerStream(
  geminiClient: GeminiClient,
  question: string,
  contextContent: string
): AsyncGenerator<string> {
  try {
    const prompt = `You are an expert software engineer helping to answer questions about source code. 
The user has asked a question about the codebase, and you have been provided with relevant source code context.

QUESTION: ${question}

SOURCE CODE CONTEXT:
${contextContent}

Please provide a clear, concise answer to the user's question based on the provided source code context.
Focus only on answering the question and do not suggest any code changes or modifications.
If the context doesn't contain enough information to answer the question, say so.
Do not make up information that isn't in the provided context.`;

    // Get the content generator from the client
    const contentGenerator = (geminiClient as any).getContentGenerator();
    
    if (!contentGenerator || !contentGenerator.generateContentStream) {
      // Fallback to non-streaming if streaming is not available
      // ... implementation details
    }

    // Use streaming if available
    const stream = await contentGenerator.generateContentStream(
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {}
      },
      'question-answer-stream'
    );

    for await (const chunk of stream) {
      if (chunk.candidates && chunk.candidates.length > 0) {
        const candidate = chunk.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (part.text) {
            yield part.text;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to generate answer stream:', error);
    yield `Error generating answer: ${(error as Error).message}`;
  }
}
```

#### Response Presentation
```javascript
// Process the stream and update the UI in real-time
let fullAnswer = '';
for await (const chunk of answerStream) {
  fullAnswer += chunk;
  // Update the pending item with the current answer
  context.ui.setPendingItem({
    type: 'info',
    text: fullAnswer,
  });
}

// Clear the pending item and add the final answer
context.ui.setPendingItem(null);
context.ui.addItem({
  type: 'info',
  text: fullAnswer,
}, Date.now());
```

### 5. Integration Points

#### File System Operations
- **Location**: `/packages/cli/src/ui/commands/openspec/qaHandler.ts`
- **Dependencies**: `@qwen-code/qwen-code-core` for file search utilities
- **Operations**: File discovery, content reading, binary file detection

#### AI Interaction Layer
- **Location**: `/packages/cli/src/ui/commands/openspec/qaHandler.ts`
- **Dependencies**: `@qwen-code/qwen-code-core` for LLM integration
- **Operations**: Prompt construction, response generation, streaming

#### Context Management
- **Location**: Throughout the implementation
- **Behavior**: Maintains separation between questioning and proposal creation contexts
- **Constraints**: Read-only operations, no filesystem writes or modifications

## Behavioral Constraints

### Read-Only Operations
The implementation ensures no filesystem writes or modifications occur:
- All file operations are read-only
- No files are created, modified, or deleted
- No state changes are persisted

### State Isolation
The question handling maintains strict separation from active change proposals:
- Questions do not affect the OpenSpec workflow
- No interference with existing change proposals
- Independent processing from standard submission flows

### Resource Management
The implementation follows existing timeout and retry mechanisms:
- Respects configured timeouts for AI operations
- Implements proper error handling and recovery
- Uses caching for file search operations

## Security Considerations

### Input Sanitization
The implementation applies existing command validation to question inputs:
- Filters control characters from user input
- Limits file content extraction to prevent memory issues
- Validates file paths to prevent directory traversal

### Scope Limitation
Access is restricted to project files only:
- File discovery is limited to the project root directory
- Ignores common binary and build directories
- Respects .gitignore and .qwenignore patterns

## Performance Optimization

### Caching
- File search results are cached for 1 minute
- Reuses initialized file search instances
- Limits context payload size to prevent memory issues

### Content Limiting
- Limits file content extraction to 3000 characters per file
- Skips files larger than 100KB
- Processes a maximum of 10 most relevant files

### Binary File Detection
- Implements heuristic-based binary file detection
- Skips known binary file extensions
- Prevents processing of non-text content

## Error Handling

### Graceful Degradation
The implementation gracefully degrades to informative error messages:
- Handles missing configuration gracefully
- Provides fallback for unavailable LLM features
- Continues processing despite individual file read errors

### Error Recovery
- Implements proper resource cleanup on errors
- Clears UI state on error conditions
- Provides meaningful error messages to users

## Testing

### Unit Tests
- Tests for JSX syntax correctness in prompt components
- Tests for question-mode detection and routing
- Tests for context retrieval functionality
- Tests for response generation pipeline

### Integration Tests
- Tests for end-to-end question submission workflow
- Tests for various question types and complexities
- Tests for error conditions and edge cases

### Mocking Strategy
- Mocks file system operations for consistent testing
- Mocks LLM responses for predictable test outcomes
- Mocks file search utilities for isolated testing

## Dependencies

### Core Dependencies
- **OpenSpec CLI Infrastructure**: Existing `openspec` command structure
- **Source Code Analysis Utilities**: File search capabilities from core package
- **AI Integration Framework**: Qwen Code AI integration for processing queries
- **File System Operations**: Standard file I/O operations

### Technical Prerequisites
- **Node.js Runtime Environment**: Async/await support for AI query processing
- **Markdown Processing Libraries**: Existing utilities for content parsing
- **Path Resolution Tools**: Standard utilities for file path handling
- **Console I/O Handling**: Established logging and output formatting utilities