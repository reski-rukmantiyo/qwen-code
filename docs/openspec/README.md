# OpenSpec Integration for Qwen Code

This document provides a comprehensive overview of the OpenSpec integration for Qwen Code, including command documentation and implementation tasks.

## Table of Contents

1. [Overview](#overview)
2. [OpenSpec CLI Commands](#openspec-cli-commands)
3. [Documentation](#documentation)
4. [Implementation Tasks](#implementation-tasks)
5. [File Structures](#file-structures)
6. [Dependencies](#dependencies)

## Overview

OpenSpec is a specification-driven development tool that enables deterministic, spec-driven workflows by ensuring alignment between humans and AI on detailed specifications before implementation. It maintains "truth" specifications in `openspec/specs/` and proposed changes in `openspec/changes/`.

The integration with Qwen Code provides structured human-AI collaboration where specifications are defined before implementation, reducing ambiguity and improving code quality.

## OpenSpec CLI Commands

### 1. init

**Purpose**: Initializes OpenSpec in a project by creating the required directory structure.

## Documentation

For detailed information on using OpenSpec with Qwen Code, please refer to the following documentation:

### User Documentation
- [Usage Guide](usage-guide.md) - Comprehensive guide for using OpenSpec features
- [Workflow Tutorials](workflow-tutorial.md) - Step-by-step tutorials for common workflows
- [Best Practices](best-practices.md) - Guidelines for effective specification-driven development
- [Troubleshooting](troubleshooting.md) - Solutions to common issues and problems

### Developer Documentation
- [Developer Guide](developer-guide.md) - Technical documentation for developers working on OpenSpec integration
- [Implementation Tasks](implementation-tasks.md) - Technical tasks for implementing OpenSpec features
- [Command Reference](openspec-commands.md) - Detailed documentation for OpenSpec slash commands

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

**File Structure Created**:
```
openspec/
├── specs/      # Current source-of-truth specifications
├── changes/    # Proposed updates (active changes)
└── archive/    # Completed changes
```

**Integration with Qwen Code**:
This command integrates with Qwen Code's existing project initialization workflow and follows the same pattern as other built-in commands. When executed, it will:
- Create the OpenSpec directory structure in your project
- Integrate with Qwen Code's file watching system
- Make specifications available to AI models through the contextual memory system

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

**Integration with Qwen Code**:
This command integrates with Qwen Code's agent system and will automatically refresh any subagents that are configured to use OpenSpec specifications. The updated guidance is immediately available to AI models in your current session.

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

**Integration with Qwen Code**:
This command integrates with Qwen Code's UI system and will display active changes in a format consistent with other list-based commands in Qwen Code. The output is optimized for terminal display within the Qwen Code interface.

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

**Integration with Qwen Code**:
This command leverages Qwen Code's built-in UI capabilities to provide an interactive experience. When terminal support is available, it will launch an enhanced dashboard that integrates with Qwen Code's theming and navigation systems.

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

**Integration with Qwen Code**:
This command integrates with Qwen Code's file viewing capabilities and will display change details with proper formatting and syntax highlighting. The output is optimized for readability within the Qwen Code terminal interface.

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

**Integration with Qwen Code**:
This command integrates with Qwen Code's editor system and will automatically open the appropriate files for editing using your configured editor. It follows Qwen Code's conventions for file creation and integrates with the checkpointing system for easy rollback.

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

**Integration with Qwen Code**:
This command integrates with Qwen Code's confirmation system and will prompt for confirmation using Qwen Code's standard dialog interface. When used with the `--yes` flag, it bypasses confirmation dialogs for automated workflows.

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

**Integration with Qwen Code**:
This command integrates with Qwen Code's file management system and editor integration. When creating or editing specifications, it will use your configured editor and follow Qwen Code's file creation conventions. Deletion operations will use Qwen Code's standard confirmation dialogs.

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

**Integration with Qwen Code**:
This command integrates with Qwen Code's error reporting system and will display validation results with appropriate syntax highlighting and error formatting. Issues are presented in a way that's consistent with Qwen Code's diagnostic display.

### 10. clear

**Purpose**: Clears the OpenSpec cache and resets it.

**Usage Syntax**:
```bash
/openspec clear
```

**Description**: 
Clears the OpenSpec cache and reinitializes it. This is useful when you want to reset the cache and start fresh, particularly after making significant changes to your specifications or when experiencing caching issues.

**Examples**:
```bash
# Clear the OpenSpec cache
/openspec clear
```

**Integration with Qwen Code**:
This command integrates with Qwen Code's caching system and will reset the OpenSpec cache service. The cache will be reinitialized with fresh instances, ensuring that subsequent operations start with a clean state.

## Implementation Status

The OpenSpec integration for Qwen Code has been fully implemented with all core commands and features. The implementation follows Qwen Code's existing patterns and integrates seamlessly with its command system, file watching capabilities, and AI workflow.

### Completed Implementation Tasks

1. **Command Implementation**:
   - `/openspec init` - Fully implemented with proper directory structure creation
   - `/openspec update` - Fully implemented with agent integration
   - `/openspec list` - Fully implemented with proper formatting
   - `/openspec view` - Fully implemented with interactive dashboard support
   - `/openspec show` - Fully implemented with detailed change display
   - `/openspec change` - Fully implemented with template file generation
   - `/openspec archive` - Fully implemented with move functionality
   - `/openspec spec` - Fully implemented with create/edit/delete actions
   - `/openspec validate` - Fully implemented with comprehensive validation
   - `/openspec clear` - Fully implemented with cache reset functionality

2. **Service Layer Implementation**:
   - `OpenSpecCacheService` - Implemented for efficient file content caching
   - `OpenSpecWatcherService` - Implemented for file system watching
   - `OpenSpecMemoryIntegration` - Implemented for AI context integration
   - `OpenSpecFileUtils` - Implemented for efficient file operations

3. **UI Component Implementation**:
   - `OpenSpecDashboard` - Implemented for interactive dashboard
   - `OpenSpecViewer` - Implemented for specification viewing
   - `OpenSpecChangeList` - Implemented for change list display

4. **Hook Implementation**:
   - `useOpenSpecWatcher` - Implemented for file watching in React components
   - `useOpenSpecCache` - Implemented for caching in React components

5. **Integration Points**:
   - Full integration with Qwen Code's command system
   - Full integration with Qwen Code's file system operations
   - Full integration with Qwen Code's AI workflow
   - Full integration with Qwen Code's UI system

### Testing Status

All OpenSpec commands have comprehensive unit tests and integration tests:
- Unit tests for each command implementation
- Integration tests for end-to-end workflows
- Service tests for core business logic
- UI component tests for React components

### Documentation Status

All documentation has been updated to reflect the implemented features:
- User documentation (usage guide, tutorials, best practices)
- Developer documentation (API interfaces, architecture, contribution guidelines)
- Command reference documentation
- Troubleshooting guide

## File Structures

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

### Command Files Structure
```
/packages/cli/src/ui/commands/openspec/
├── index.ts              # Main OpenSpec command
├── initCommand.ts        # Init subcommand
├── updateCommand.ts      # Update subcommand
├── listCommand.ts        # List subcommand
├── viewCommand.ts        # View subcommand
├── showCommand.ts        # Show subcommand
├── changeCommand.ts      # Change subcommand
├── archiveCommand.ts     # Archive subcommand
├── specCommand.ts        # Spec subcommand
├── validateCommand.ts    # Validate subcommand
└── clearCommand.ts       # Clear subcommand
```

## Dependencies

### System Requirements
- Node.js >= 20.19.0 (verify with `node --version`)

### Package Dependencies
- TypeScript (primary language)
- JavaScript (supporting utilities)
- pnpm (package manager)

### AI Tool Integration
Within Qwen Code, OpenSpec integrates directly with the AI workflow:
- Specifications are automatically provided as context to AI models
- Change proposals guide AI implementation tasks
- Validation ensures AI outputs conform to specifications
- Archive functionality tracks completed AI-assisted work

## Usage Workflow

1. **Initialize**: Set up OpenSpec with `/openspec init`
2. **Draft**: Create change proposals with `/openspec change`
3. **Define**: Create detailed specifications with `/openspec spec`
4. **Review**: Validate and refine with `/openspec validate/show`
5. **Implement**: Apply changes according to specifications
6. **Archive**: Complete changes with `/openspec archive`

This workflow is seamlessly integrated into Qwen Code's existing development workflow, with commands appearing in the command palette and following the same interaction patterns as other Qwen Code features.