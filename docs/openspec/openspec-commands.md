# OpenSpec Commands Documentation

This document provides comprehensive documentation for OpenSpec slash commands in Qwen Code and outlines the technical implementation details of the OpenSpec integration.

## Overview

OpenSpec is a specification-driven development tool that enables deterministic, spec-driven workflows by ensuring alignment between humans and AI on detailed specifications before implementation. It maintains "truth" specifications in `openspec/specs/` and proposed changes in `openspec/changes/`.

In Qwen Code, OpenSpec commands are accessed through the `/openspec` slash command with subcommands, following the same pattern as other built-in commands like `/help`, `/agents`, and `/model`.

## Implementation Architecture

The OpenSpec integration in Qwen Code follows a modular architecture consisting of:

1. **Command Layer**: Implements the `/openspec` slash command with subcommands in `/packages/cli/src/ui/commands/openspec/`
2. **Service Layer**: Provides core functionality through services in `/packages/cli/src/services/`
3. **Integration Layer**: Connects OpenSpec with Qwen Code's AI workflow, file watching, and caching systems
4. **UI Components**: Provides interactive interfaces for OpenSpec features in `/packages/cli/src/ui/components/`

## OpenSpec Slash Commands

All OpenSpec functionality is accessible through the `/openspec` command with the following subcommands:

### 1. init

**Purpose**: Initializes OpenSpec in a project by creating the required directory structure.

**Usage Syntax**:
```bash
/openspec init
```

**Description**: 
Sets up the OpenSpec directory structure in the current project. This command creates the foundational folders needed for specification-driven development.

**Examples**:
```bash
# Initialize OpenSpec in current directory
/openspec init
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/initCommand.ts`
- Validates Node.js version compatibility (requires >= 20.19.0)
- Creates directory structure: `openspec/specs/`, `openspec/changes/`, `openspec/archive/`
- Generates sample specification and change files for reference
- Integrates with Qwen Code's file watching system through `OpenSpecWatcherService`
- Makes specifications available to AI models through `OpenSpecMemoryIntegration`
- Clears cache using `OpenSpecCacheService` when re-initializing
- Provides user feedback on successful initialization

**File Structure Created**:
```
openspec/
├── specs/                 # Current source-of-truth specifications
│   └── sample-spec.md     # Sample specification
├── changes/               # Proposed updates (active changes)
│   └── sample-change/     # Sample change folder
│       ├── proposal.md    # Change proposal
│       ├── tasks.md       # Implementation tasks
│       ├── design.md      # Technical design
│       └── specs/         # Specification deltas
│           └── sample-spec.md  # Sample spec delta
└── archive/               # Completed changes
```

### 2. update

**Purpose**: Refreshes agent instructions and regenerates AI guidance.

**Usage Syntax**:
```bash
/openspec update
```

**Description**: 
Updates agent instructions and regenerates AI guidance based on the current specifications and changes. This ensures that AI assistants have the most current information when implementing changes.

**Examples**:
```bash
# Update agent instructions
/openspec update
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/updateCommand.ts`
- Integrates with Qwen Code's agent system to refresh any subagents configured to use OpenSpec specifications
- Regenerates AI guidance files by calling `OpenSpecMemoryIntegration.generateOpenSpecMemory()`
- Provides progress feedback during update process using Qwen Code's progress indicators
- Handles errors gracefully with appropriate error messages
- Ensures updated guidance is immediately available to AI models in the current session

### 3. list

**Purpose**: Views active change folders.

**Usage Syntax**:
```bash
/openspec list
```

**Description**: 
Displays a list of all active change folders in the `openspec/changes/` directory. This helps developers track ongoing work and proposed changes.

**Examples**:
```bash
# List all active changes
/openspec list
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/listCommand.ts`
- Reads from the `openspec/changes/` filesystem directly
- Uses `OpenSpecCacheService` to preload directory content for better performance
- Sorts changes alphabetically for consistent output
- Handles empty states gracefully with appropriate messaging
- Formats output for terminal display with proper numbering
- Integrates with Qwen Code's UI system for consistent appearance

### 4. view

**Purpose**: Provides an interactive dashboard of specifications and changes.

**Usage Syntax**:
```bash
/openspec view
```

**Description**: 
Launches an interactive dashboard that visualizes current specifications and proposed changes. This provides a holistic view of the project's specification landscape.

**Examples**:
```bash
# View interactive dashboard
/openspec view
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/viewCommand.ts`
- Leverages Qwen Code's built-in UI capabilities for interactive experience
- Launches enhanced dashboard that integrates with Qwen Code's theming and navigation systems
- Provides static summary as fallback for terminals without interactive support
- Handles keyboard navigation and selection using Qwen Code's standard UI patterns
- Implements error handling for unsupported terminals
- Uses efficient file reading through `OpenSpecFileUtils.readFileEfficiently()`

### 5. show

**Purpose**: Displays detailed information about a specific change.

**Usage Syntax**:
```bash
/openspec show <change-name>
```

**Parameters**:
- `<change-name>`: Name of the change folder to display

**Description**: 
Shows detailed information about a specific change including its proposal, tasks, and specification updates. This command provides insight into what a particular change entails.

**Options**:
None

**Examples**:
```bash
# Show details for a specific change
/openspec show add-user-authentication

# Show details for another change
/openspec show refactor-api-endpoints
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/showCommand.ts`
- Accepts change name as parameter and validates its existence
- Reads and parses change files (proposal.md, tasks.md, design.md) efficiently
- Uses `OpenSpecFileUtils.readFileEfficiently()` for memory-efficient file reading
- Formats content for terminal display with proper markdown rendering
- Handles missing files gracefully with informative messages
- Implements auto-completion for change names using the `completion` function
- Integrates with Qwen Code's UI system for consistent appearance and formatting
- Provides file size information for each component using `getFileStats()`

### 6. change

**Purpose**: Creates or modifies change proposals.

**Usage Syntax**:
```bash
/openspec change <change-name>
```

**Parameters**:
- `<change-name>`: Name for the new change folder

**Description**: 
Creates a new change proposal or modifies an existing one. This command sets up the necessary files for defining what changes should be made to the codebase.

**Options**:
None

**Examples**:
```bash
# Create a new change proposal
/openspec change implement-payment-processing

# Modify an existing change
/openspec change update-authentication-flow
```

**Files Created in Change Folder**:
```
<change-name>/
├── proposal.md   # Rationale and overview of proposed change
├── tasks.md      # Implementation checklist
├── design.md     # Technical design decisions (optional)
└── specs/        # Specification deltas
    └── ...
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/changeCommand.ts`
- Accepts change name as parameter and validates filesystem compatibility
- Creates directory structure under `openspec/changes/` with proper error handling
- Generates template files (proposal.md, tasks.md, design.md) with helpful examples
- Creates specs/ directory for specification deltas
- Integrates with Qwen Code's editor system to automatically open files using configured editor
- Follows Qwen Code's conventions for file creation and naming
- Integrates with Qwen Code's checkpointing system for easy rollback
- Provides user feedback with instructions on next steps using `/openspec show`

### 7. archive

**Purpose**: Moves completed changes to the archive directory.

**Usage Syntax**:
```bash
/openspec archive <change-name> [--yes|-y]
```

**Parameters**:
- `<change-name>`: Name of the change to archive

**Options**:
- `--yes`, `-y`: Automatically confirm archiving without interactive prompts

**Description**: 
Moves a completed change from the `openspec/changes/` directory to the `openspec/archive/` directory. This helps maintain a clean workspace by removing completed work from active view.

**Examples**:
```bash
# Archive a completed change (interactive)
/openspec archive implement-user-profile

# Archive a change without confirmation
/openspec archive implement-user-profile --yes
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/archiveCommand.ts`
- Accepts change name as parameter and validates its existence
- Supports --yes/-y flag for non-interactive mode
- Moves directory from `openspec/changes/` to `openspec/archive/` using filesystem operations
- Handles conflicts in archive directory with proper error messages
- Integrates with Qwen Code's confirmation system using standard dialog interface
- Provides confirmation feedback with success messages
- Uses `OpenSpecCacheService` to invalidate cached content for moved files
- Handles errors gracefully with informative messages for missing changes

### 8. spec

**Purpose**: Manages specification files.

**Usage Syntax**:
```bash
/openspec spec <action> [options]
```

**Actions**:
- `create <spec-path>`: Creates a new specification file
- `edit <spec-path>`: Edits an existing specification
- `delete <spec-path>`: Removes a specification file

**Description**: 
Manages specification files in the `openspec/specs/` directory. This includes creating, editing, and deleting specification documents that serve as the source of truth for the project.

**Examples**:
```bash
# Create a new specification
/openspec spec create auth/user-authentication

# Edit an existing specification
/openspec spec edit api/rest-endpoints

# Delete a specification
/openspec spec delete deprecated/legacy-feature
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/specCommand.ts`
- Supports actions: create, edit, delete with proper parameter validation
- Handles nested paths (e.g., auth/user-authentication) with automatic directory creation
- Integrates with Qwen Code's editor system to automatically open files using configured editor
- Implements proper file validation to prevent accidental operations
- Handles deletion with confirmation using Qwen Code's standard confirmation dialogs
- Follows Qwen Code's file management conventions for consistent user experience
- Uses `OpenSpecCacheService` to invalidate cached content when files are modified
- Provides helpful error messages for invalid paths or missing files

### 9. validate

**Purpose**: Checks specification formatting and structure.

**Usage Syntax**:
```bash
/openspec validate <change-name>
```

**Parameters**:
- `<change-name>`: Name of the change to validate

**Description**: 
Validates the formatting and structure of specifications and changes. This ensures that all specification files adhere to the required format and are properly structured for AI processing.

**Examples**:
```bash
# Validate a specific change
/openspec validate add-payment-gateway

# Validate all changes
/openspec validate --all
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/validateCommand.ts`
- Accepts change name as parameter or --all flag for validating all changes
- Executes validation logic directly without external CLI dependencies
- Checks for required files (proposal.md, tasks.md) and validates they're not empty
- Parses validation results and formats them for display with appropriate syntax highlighting
- Highlights errors and warnings with appropriate coloring following Qwen Code's theming system
- Provides suggestions for fixing common issues
- Integrates with Qwen Code's error reporting system for consistent diagnostic display
- Uses efficient file operations through `OpenSpecFileUtils` for better performance

### 10. apply

**Purpose**: Apply a change by submitting tasks to AI for implementation.

**Usage Syntax**:
```bash
/openspec apply <change-name>
```

**Parameters**:
- `<change-name>`: Name of the change to apply

**Description**: 
Submits the tasks defined in a change's `tasks.md` file to the AI for implementation. This command triggers the implementation phase of the OpenSpec workflow where AI coding assistants execute the agreed-upon tasks while referencing the change's specifications.

**Examples**:
```bash
# Apply a specific change
/openspec apply add-user-authentication

# Apply another change
/openspec apply refactor-api-endpoints
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/applyCommand.ts`
- Reads tasks from `openspec/changes/<change-name>/tasks.md`
- Validates that the change exists and has tasks defined
- Returns a `submit_prompt` action to have Qwen Code process the tasks with AI
- Provides auto-completion for change names
- Follows Qwen Code's AI interaction patterns
- Integrates with the existing OpenSpec directory structure
- Handles errors gracefully with appropriate error messages

### 11. clear

**Purpose**: Completely reset OpenSpec (removes all files and directories).

**Usage Syntax**:
```bash
/openspec clear [--cache-only|-c]
```

**Options**:
- `--cache-only`, `-c`: Only clear the cache, don't remove files

**Description**: 
Completely removes the OpenSpec directory structure by default. With the `--cache-only` flag, it only clears the OpenSpec cache and reinitializes it. This is useful when you want to start fresh with OpenSpec, particularly after making significant changes to your specifications or when experiencing issues.

**Examples**:
```bash
# Completely reset OpenSpec (removes all files) - DEFAULT BEHAVIOR
/openspec clear

# Clear the OpenSpec cache only (preserve files)
/openspec clear --cache-only
```

**Implementation Details**:
- Located in `/packages/cli/src/ui/commands/openspec/clearCommand.ts`
- By default, uses `fs.rmSync()` to recursively remove the openspec/ directory
- With `--cache-only` flag, accesses the OpenSpec cache service through the existing hook system
- With `--cache-only` flag, calls the `resetCaches()` method to completely reinitialize cache instances
- Provides user feedback on successful cache clearing or complete reset
- Handles errors gracefully with appropriate error messages
- Follows Qwen Code's messaging patterns for user feedback
- Useful for resolving issues or ensuring a clean state
- Particularly helpful when specification files aren't reflecting recent changes
- Allows users to start with a completely fresh OpenSpec environment (default behavior)
- Also allows lightweight cache clearing when files should be preserved

## Integration with Qwen Code Command System

The OpenSpec commands follow the same pattern as other built-in Qwen Code commands like `/help`, `/agents`, and `/model`. They are implemented as subcommands under the main `/openspec` command, providing a consistent user experience.

Key integration points with the Qwen Code command system:

1. **Help System**: All OpenSpec commands are automatically included in the `/help` output, making them discoverable alongside other Qwen Code commands.

2. **Auto-completion**: The `/openspec` command and its subcommands are available through Qwen Code's auto-completion system, accessible by pressing Tab after typing `/openspec`.

3. **Error Handling**: OpenSpec commands follow Qwen Code's standard error handling patterns, providing consistent error messages and recovery options.

4. **Configuration**: OpenSpec commands respect Qwen Code's configuration system, including project-level and user-level settings.

5. **Theming**: The output of OpenSpec commands follows Qwen Code's theming system, ensuring consistent appearance with the rest of the interface.

## Core Services Implementation

### OpenSpecCacheService

Located in `/packages/cli/src/services/OpenSpecCacheService.ts`, this service provides efficient caching of file content to improve performance:

- Uses LRU caching with configurable size limits (default 100 files)
- Automatically invalidates cache based on file modification times
- Provides directory preloading for bulk operations
- Supports complete cache reset functionality for the `/openspec clear` command

### OpenSpecWatcherService

Located in `/packages/cli/src/services/OpenSpecWatcherService.ts`, this service monitors file system changes for real-time updates:

- Implements recursive directory watching for all OpenSpec directories
- Integrates with cache invalidation to ensure fresh content
- Provides callbacks for memory updates when files change
- Automatically restarts watching when OpenSpec is initialized

### OpenSpecMemoryIntegration

Located in `/packages/cli/src/services/OpenSpecMemoryIntegration.ts`, this service integrates OpenSpec with Qwen Code's AI memory system:

- Generates contextual memory content from specifications for AI models
- Collects content from all markdown files in specs/ and changes/ directories
- Provides code conformance validation to ensure AI outputs match specifications
- Tracks active changes for agent configuration

### OpenSpecFileUtils

Located in `/packages/cli/src/services/OpenSpecFileUtils.ts`, this service provides utilities for efficient file operations:

- Implements memory-efficient large file reading
- Provides file statistics collection with formatted size information
- Handles file reading errors gracefully

## File Structures Managed by OpenSpec

### Project Structure After Initialization
```
openspec/
├── specs/                 # Current source-of-truth specifications
│   └── auth/             # Example spec category
│       └── spec.md       # Individual spec file
├── changes/              # Proposed updates (active changes)
│   └── add-2fa/          # Example change folder
│       ├── proposal.md   # Why and what changes
│       ├── tasks.md      # Implementation checklist
│       ├── design.md     # Technical decisions (optional)
│       └── specs/        # Spec deltas for this change
│           └── auth/
│               └── spec.md  # Delta showing additions/changes
└── archive/              # Completed changes (automatically managed)
    └── ...
```

### Change Folder Components

1. **proposal.md**: Captures the rationale and overview of the proposed change
2. **tasks.md**: Contains implementation tasks/checklist for AI assistants
3. **design.md** (optional): Technical design decisions
4. **specs/**: Directory containing spec deltas showing exactly what will change

## Dependencies and Prerequisites

### System Requirements
- Node.js >= 20.19.0 (verified during `/openspec init` command execution)
- Read/write access to project directories
- Terminal with ANSI color support for optimal display

### Package Dependencies
- TypeScript (primary language)
- JavaScript (supporting utilities)
- pnpm (package manager)
- Built-in Node.js modules: fs, path, process

### AI Tool Integration
Within Qwen Code, OpenSpec integrates directly with the AI workflow:
- Specifications are automatically provided as context to AI models through `OpenSpecMemoryIntegration.generateOpenSpecMemory()`
- Change proposals guide AI implementation tasks with structured task lists in tasks.md
- Validation ensures AI outputs conform to specifications using `OpenSpecMemoryIntegration.validateCodeConformance()`
- Archive functionality tracks completed AI-assisted work for historical reference
- Active changes are tracked and made available to subagents through the agent configuration system

## Implementation Status

All OpenSpec commands have been fully implemented with comprehensive test coverage. The implementation follows Qwen Code's existing patterns and integrates seamlessly with its command system, file watching capabilities, and AI workflow.

### Testing
- Unit tests for all commands in `/packages/cli/src/ui/commands/openspec/*.test.ts`
- Integration tests for end-to-end workflows in `/integration-tests/`
- Service tests for core functionality in `/packages/cli/src/services/*.test.ts`
- Mocking strategies for file system operations and external dependencies

### Performance Optimization
- File content caching with automatic invalidation
- Efficient file reading for large specification files
- Directory preloading for improved response times
- Memory-efficient processing of specification content

### Error Handling
- Comprehensive error handling for file system operations
- Graceful degradation for missing or malformed files
- User-friendly error messages with actionable guidance
- Proper error propagation through Qwen Code's error reporting system

## Usage Workflow

1. **Initialize**: Set up OpenSpec with `/openspec init`
2. **Draft**: Create change proposals with `/openspec change`
3. **Define**: Create detailed specifications with `/openspec spec`
4. **Review**: Validate and refine with `/openspec validate/show`
5. **Implement**: Apply changes according to specifications
6. **Archive**: Complete changes with `/openspec archive`

This workflow is seamlessly integrated into Qwen Code's existing development workflow, with commands appearing in the command palette and following the same interaction patterns as other Qwen Code features.