# OpenSpec Developer Documentation

This document provides technical documentation for developers working on the OpenSpec integration in Qwen Code, including API interfaces, architecture decisions, contribution guidelines, and testing strategies.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Interfaces](#api-interfaces)
3. [Integration Points](#integration-points)
4. [Services and Utilities](#services-and-utilities)
5. [Testing Strategies](#testing-strategies)
6. [Contribution Guidelines](#contribution-guidelines)

## Architecture Overview

The OpenSpec integration in Qwen Code follows a modular architecture that integrates seamlessly with the existing command system, file watching capabilities, and AI workflow. The implementation consists of:

### Command Layer

The command layer implements the `/openspec` slash command with subcommands following Qwen Code's existing patterns:

```
/packages/cli/src/ui/commands/
├── openspecCommand.ts         # Main OpenSpec command
/packages/cli/src/ui/commands/openspec/
├── initCommand.ts             # Init subcommand
├── updateCommand.ts           # Update subcommand
├── listCommand.ts             # List subcommand
├── viewCommand.ts             # View subcommand
├── showCommand.ts             # Show subcommand
├── changeCommand.ts           # Change subcommand
├── archiveCommand.ts          # Archive subcommand
├── specCommand.ts             # Spec subcommand
└── validateCommand.ts         # Validate subcommand
```

### Service Layer

The service layer provides core functionality for file operations, caching, and AI integration:

```
/packages/cli/src/services/
├── OpenSpecCacheService.ts        # File content caching
├── OpenSpecWatcherService.ts      # File system watching
├── OpenSpecMemoryIntegration.ts   # AI context integration
└── OpenSpecFileUtils.ts           # File utilities
```

### Hooks Layer

The hooks layer provides React hooks for UI components:

```
/packages/cli/src/hooks/
├── useOpenSpecWatcher.ts          # File watching hook
└── useOpenSpecCache.ts            # Caching hook
```

### UI Components

The UI components provide interactive interfaces for OpenSpec features:

```
/packages/cli/src/ui/components/
├── OpenSpecDashboard.tsx          # Interactive dashboard
├── OpenSpecViewer.tsx             # Specification viewer
└── OpenSpecChangeList.tsx         # Change list component
```

## API Interfaces

### Command Interface

All OpenSpec commands implement the `SlashCommand` interface from Qwen Code:

```typescript
interface SlashCommand {
  name: string;
  description: string;
  kind: CommandKind;
  action: (context: CommandContext, args: string) => Promise<MessageActionReturn>;
  subCommands?: SlashCommand[];
  completion?: (context: CommandContext, partialArg: string) => Promise<string[]>;
}
```

### Command Context

Commands receive a `CommandContext` with access to Qwen Code services:

```typescript
interface CommandContext {
  invocation: {
    raw: string;
    name: string;
    args: string;
  };
  services: {
    config: ConfigService | null;
    settings: LoadedSettings;
    git?: GitService;
    logger: Logger;
  };
  ui: {
    addItem: (item: HistoryItem, timestamp: number) => void;
    clear: () => void;
    // ... other UI methods
  };
  session: {
    sessionShellAllowlist: Set<string>;
    stats: SessionStatsState;
  };
  overwriteConfirmed?: boolean;
}
```

### Message Action Return

Commands return a `MessageActionReturn` to communicate with the user:

```typescript
type MessageActionReturn = 
  | {
      type: 'message';
      messageType: 'info' | 'error' | 'warning';
      content: string;
    }
  | {
      type: 'submit_prompt';
      content: string;
    }
  | {
      type: 'confirm_action';
      prompt: ReactElement;
      originalInvocation: CommandInvocation;
    }
  | void;
```

### Example Command Implementation

```typescript
import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

export const listCommand: SlashCommand = {
  name: 'list',
  description: 'List active changes',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, _args: string) => {
    try {
      const projectRoot = process.cwd();
      const changesDir = path.join(projectRoot, 'openspec', 'changes');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(changesDir)) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
        };
      }
      
      // Read changes directory
      const changes = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();
      
      if (changes.length === 0) {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No active changes found.',
        };
      }
      
      // Format output
      let content = `Active changes (${changes.length}):\n\n`;
      changes.forEach((change, index) => {
        content += `${index + 1}. ${change}\n`;
      });
      
      return {
        type: 'message',
        messageType: 'info',
        content,
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Failed to list changes: ${(error as Error).message}`,
      };
    }
  },
};
```

## Integration Points

### Command System Integration

OpenSpec commands integrate with Qwen Code's command system through:

1. **Registration**: Commands are registered in `openspecCommand.ts` as subcommands
2. **Discovery**: Commands automatically appear in help system and auto-completion
3. **Execution**: Commands follow Qwen Code's error handling and messaging patterns

### File System Integration

OpenSpec interacts with the file system through:

1. **Direct Operations**: Using Node.js `fs` module for file operations
2. **Caching**: Using `OpenSpecCacheService` for performance optimization
3. **Watching**: Using `OpenSpecWatcherService` for real-time updates
4. **Utilities**: Using `OpenSpecFileUtils` for efficient file reading

### AI Workflow Integration

OpenSpec integrates with Qwen Code's AI workflow through:

1. **Context Provision**: `OpenSpecMemoryIntegration` provides specifications as AI context
2. **Guidance Generation**: Change proposals guide AI implementation tasks
3. **Validation**: Ensuring AI outputs conform to specifications
4. **Tracking**: Archiving completed AI-assisted work

### UI System Integration

OpenSpec integrates with Qwen Code's UI system through:

1. **Components**: Custom React components for dashboard and viewers
2. **Hooks**: React hooks for state management and data fetching
3. **Theming**: Following Qwen Code's theming system for consistent appearance
4. **Navigation**: Integrating with Qwen Code's navigation patterns

## Services and Utilities

### OpenSpecCacheService

Provides efficient caching of file content to improve performance:

```typescript
class OpenSpecCacheService {
  getFileContent(filePath: string): string;
  preloadDirectory(directoryPath: string): void;
  clearCache(): void;
}
```

Key features:
- LRU caching with configurable size limits
- Automatic cache invalidation based on file modification times
- Directory preloading for bulk operations

### OpenSpecWatcherService

Monitors file system changes for real-time updates:

```typescript
class OpenSpecWatcherService {
  startWatching(): Promise<void>;
  stopWatching(): void;
  addWatchDirectory(directoryPath: string): void;
}
```

Key features:
- Recursive directory watching
- Efficient event handling
- Integration with cache invalidation

### OpenSpecMemoryIntegration

Integrates OpenSpec with Qwen Code's AI memory system:

```typescript
class OpenSpecMemoryIntegration {
  generateOpenSpecMemory(): Promise<string>;
  validateCodeConformance(code: string, filename: string): Promise<ValidationResult>;
  getActiveChanges(): string[];
}
```

Key features:
- Context generation for AI models
- Code conformance validation
- Active change tracking

### OpenSpecFileUtils

Provides utilities for efficient file operations:

```typescript
function readFileEfficiently(filePath: string): Promise<string>;
function getFileStats(filePath: string): FileInfo;
```

Key features:
- Memory-efficient large file reading
- File statistics collection
- Error handling

## Testing Strategies

### Unit Testing

Unit tests for OpenSpec commands follow Qwen Code's testing patterns:

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import { listCommand } from './listCommand.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const existsSync = vi.fn();
  const readdirSync = vi.fn();
  return {
    ...actual,
    existsSync,
    readdirSync,
    default: {
      ...(actual as unknown as Record<string, unknown>),
      existsSync,
      readdirSync,
    },
  } as unknown as typeof import('node:fs');
});

describe('listCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = createMockCommandContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct name and description', () => {
    expect(listCommand.name).toBe('list');
    expect(listCommand.description).toBe('List active changes');
    expect(listCommand.kind).toBe('built-in');
  });

  it('should return error when OpenSpec is not initialized', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await listCommand.action!(mockContext, '');

    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'OpenSpec is not initialized in this project. Run /openspec init first.',
    });
  });
});
```

Key testing patterns:
- Mocking file system operations
- Using `createMockCommandContext` for consistent test contexts
- Testing both success and error cases
- Verifying output formatting

### Integration Testing

Integration tests verify end-to-end workflows:

```typescript
import { describe, it, expect } from 'vitest';
import { TestRig } from './test-helper.js';

describe('openspec workflow', () => {
  it('should be able to initialize OpenSpec and create a change proposal', async () => {
    const rig = new TestRig();
    await rig.setup('should be able to initialize OpenSpec and create a change proposal');

    // Initialize OpenSpec
    const initResult = await rig.run('Initialize OpenSpec in this project');
    const initToolCall = await rig.waitForToolCall('initCommand');
    
    expect(initToolCall).toBeTruthy();

    // Create a change proposal
    const changeResult = await rig.run('Create a new change proposal called "user-authentication"');
    const changeToolCall = await rig.waitForToolCall('changeCommand');
    
    expect(changeToolCall).toBeTruthy();
  });
});
```

Key testing patterns:
- Using `TestRig` for isolated test environments
- Verifying tool call sequences
- Checking file system changes
- Testing AI workflow integration

### Service Testing

Services are tested independently of the command layer:

```typescript
describe('OpenSpec File System Integration', () => {
  let tempDir: string;
  let cacheService: OpenSpecCacheService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-test-'));
    cacheService = new OpenSpecCacheService();
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should cache file content and invalidate when modified', async () => {
    const testFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(testFile, '# Original Content');
    
    // Get content to populate cache
    const originalContent = cacheService.getFileContent(testFile);
    expect(originalContent).toBe('# Original Content');
    
    // Modify the file
    fs.writeFileSync(testFile, '# Updated Content');
    
    // Get content again - should reflect the update
    const updatedContent = cacheService.getFileContent(testFile);
    expect(updatedContent).toBe('# Updated Content');
  });
});
```

Key testing patterns:
- Isolated temporary directories
- Direct service instantiation
- State verification
- Cache behavior testing

## Contribution Guidelines

### Code Structure

Follow these principles when contributing to OpenSpec:

1. **Modularity**: Keep commands and services focused on single responsibilities
2. **Consistency**: Follow existing patterns in the codebase
3. **Error Handling**: Provide clear error messages and graceful degradation
4. **Documentation**: Document public APIs and complex logic
5. **Testing**: Include comprehensive tests for new functionality

### Pull Request Process

1. **Fork and Branch**: Create a feature branch from `main`
2. **Implement**: Follow the coding standards and patterns
3. **Test**: Ensure all tests pass and add new tests for your changes
4. **Document**: Update relevant documentation files
5. **Review**: Submit a pull request with a clear description

### Code Standards

#### TypeScript Guidelines

- Use strict typing with explicit interfaces
- Enable strict TypeScript compiler options
- Avoid `any` types except where necessary
- Use proper error handling with `Error` objects

#### File Naming

- Use camelCase for file names
- Use `.ts` extension for TypeScript files
- Use `.tsx` extension for React components
- Match file names to exported class/function names

#### Error Handling

```typescript
// Good
try {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
} catch (error) {
  throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
}

// Avoid
try {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
} catch (error) {
  console.error(error);
  return null; // Silent failure
}
```

#### Async/Await Patterns

```typescript
// Good
export const listCommand: SlashCommand = {
  name: 'list',
  description: 'List active changes',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, _args: string) => {
    try {
      // Implementation
      return {
        type: 'message',
        messageType: 'info',
        content: 'Success message',
      };
    } catch (error) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Error message: ${(error as Error).message}`,
      };
    }
  },
};
```

### Documentation Standards

#### Command Documentation

Each command should have clear documentation covering:

1. **Purpose**: What the command does
2. **Usage**: Syntax and examples
3. **Parameters**: Required and optional parameters
4. **Integration**: How it works with Qwen Code
5. **Error Cases**: Possible error conditions

#### API Documentation

Public APIs should include:

1. **Interface Definitions**: Clear TypeScript interfaces
2. **Method Signatures**: Parameter types and return values
3. **Usage Examples**: Practical examples of usage
4. **Error Conditions**: Documented exceptions and error cases

### Testing Requirements

#### Coverage Goals

- **Commands**: 100% coverage for command parsing and validation
- **Services**: 90%+ coverage for core business logic
- **Edge Cases**: Test error conditions and boundary cases
- **Integration**: Test end-to-end workflows

#### Test Organization

```
/packages/cli/src/ui/commands/openspec/
├── *.test.ts              # Unit tests for commands
/packages/cli/src/services/
├── *.test.ts              # Unit tests for services
/integration-tests/
├── openspec-workflow.test.ts  # Integration tests
```

#### Mocking Strategy

- Mock file system operations using `vi.mock`
- Use `createMockCommandContext` for consistent test contexts
- Mock external dependencies but not internal modules unnecessarily
- Clean up mocks and temporary files in `afterEach`

By following these guidelines, you can contribute effectively to the OpenSpec integration in Qwen Code while maintaining code quality and consistency with the existing codebase.