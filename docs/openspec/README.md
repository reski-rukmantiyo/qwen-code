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
openspec init
```

**Description**: 
Sets up the OpenSpec directory structure in the current project. This command creates the foundational folders needed for specification-driven development.

**Examples**:
```bash
# Initialize OpenSpec in current directory
openspec init
```

**File Structure Created**:
```
openspec/
├── specs/      # Current source-of-truth specifications
├── changes/    # Proposed updates (active changes)
└── archive/    # Completed changes
```

### 2. update

**Purpose**: Refreshes agent instructions and regenerates AI guidance.

**Usage Syntax**:
```bash
openspec update
```

**Description**: 
Updates agent instructions and regenerates AI guidance based on the current specifications and changes. This ensures that AI assistants have the most current information when implementing changes.

**Examples**:
```bash
# Update agent instructions
openspec update
```

### 3. list

**Purpose**: Views active change folders.

**Usage Syntax**:
```bash
openspec list
```

**Description**: 
Displays a list of all active change folders in the `openspec/changes/` directory. This helps developers track ongoing work and proposed changes.

**Examples**:
```bash
# List all active changes
openspec list
```

### 4. view

**Purpose**: Provides an interactive dashboard of specifications and changes.

**Usage Syntax**:
```bash
openspec view
```

**Description**: 
Launches an interactive dashboard that visualizes current specifications and proposed changes. This provides a holistic view of the project's specification landscape.

**Examples**:
```bash
# View interactive dashboard
openspec view
```

### 5. show

**Purpose**: Displays detailed information about a specific change.

**Usage Syntax**:
```bash
openspec show <change-name>
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
openspec show add-user-authentication

# Show details for another change
openspec show refactor-api-endpoints
```

### 6. change

**Purpose**: Creates or modifies change proposals.

**Usage Syntax**:
```bash
openspec change <change-name>
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
openspec change implement-payment-processing

# Modify an existing change
openspec change update-authentication-flow
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

### 7. archive

**Purpose**: Moves completed changes to the archive directory.

**Usage Syntax**:
```bash
openspec archive <change-name> [--yes|-y]
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
openspec archive implement-user-profile

# Archive a change without confirmation
openspec archive implement-user-profile --yes
```

### 8. spec

**Purpose**: Manages specification files.

**Usage Syntax**:
```bash
openspec spec <action> [options]
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
openspec spec create auth/user-authentication

# Edit an existing specification
openspec spec edit api/rest-endpoints

# Delete a specification
openspec spec delete deprecated/legacy-feature
```

### 9. validate

**Purpose**: Checks specification formatting and structure.

**Usage Syntax**:
```bash
openspec validate <change-name>
```

**Parameters**:
- `<change-name>`: Name of the change to validate

**Description**: 
Validates the formatting and structure of specifications and changes. This ensures that all specification files adhere to the required format and are properly structured for AI processing.

**Examples**:
```bash
# Validate a specific change
openspec validate add-payment-gateway

# Validate all changes
openspec validate --all
```

## Implementation Tasks

### 1. Command Implementation Tasks

#### Task 1.1: Create OpenSpec Base Command
**Description**: Create the base OpenSpec command that will house all subcommands.
**Technical Details**:
- Create `/packages/cli/src/ui/commands/openspecCommand.ts`
- Implement command registration in the CLI command service
- Add proper help text and usage information
- Handle global options and error handling

#### Task 1.2: Implement `openspec init` Command
**Description**: Implement the initialization command to set up OpenSpec in a project.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/initCommand.ts`
- Execute `openspec init` via shell command
- Handle directory creation and file structure setup
- Validate Node.js version compatibility (>= 20.19.0)
- Provide user feedback on successful initialization
- Error handling for existing installations

#### Task 1.3: Implement `openspec update` Command
**Description**: Implement the update command to refresh agent instructions.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/updateCommand.ts`
- Execute `openspec update` via shell command
- Handle regeneration of AI guidance files
- Provide progress feedback during update process
- Error handling for network or permission issues

#### Task 1.4: Implement `openspec list` Command
**Description**: Implement the list command to view active change folders.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/listCommand.ts`
- Execute `openspec list` via shell command or directly read from filesystem
- Parse and format output for Qwen Code UI
- Handle empty states gracefully
- Implement sorting and filtering options

#### Task 1.5: Implement `openspec view` Command
**Description**: Implement the view command for interactive dashboard.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/viewCommand.ts`
- Determine if terminal supports interactive mode
- Launch interactive dashboard or provide static summary
- Handle keyboard navigation and selection
- Error handling for unsupported terminals

#### Task 1.6: Implement `openspec show` Command
**Description**: Implement the show command to display change details.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/showCommand.ts`
- Accept change name as parameter
- Read and parse change files (proposal.md, tasks.md, design.md)
- Format content for terminal display with proper markdown rendering
- Handle missing files gracefully
- Implement pagination for long content

#### Task 1.7: Implement `openspec change` Command
**Description**: Implement the change command to create/modify proposals.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/changeCommand.ts`
- Accept change name as parameter
- Create directory structure under `openspec/changes/`
- Generate template files (proposal.md, tasks.md, design.md)
- Open editor for user input (respect EDITOR environment variable)
- Validate change name for filesystem compatibility

#### Task 1.8: Implement `openspec archive` Command
**Description**: Implement the archive command to move completed changes.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/archiveCommand.ts`
- Accept change name as parameter
- Support --yes/-y flag for non-interactive mode
- Move directory from `openspec/changes/` to `openspec/archive/`
- Handle conflicts in archive directory
- Update any references or indices
- Provide confirmation feedback

#### Task 1.9: Implement `openspec spec` Command
**Description**: Implement the spec command to manage specification files.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/specCommand.ts`
- Support actions: create, edit, delete
- Handle nested paths (e.g., auth/user-authentication)
- Create directory structure as needed
- Open editor for create/edit actions
- Implement proper file validation
- Handle deletion with confirmation

#### Task 1.10: Implement `openspec validate` Command
**Description**: Implement the validate command to check specification formatting.
**Technical Details**:
- Create subcommand handler in `/packages/cli/src/ui/commands/openspec/validateCommand.ts`
- Accept change name as parameter or --all flag
- Execute validation logic or delegate to OpenSpec CLI
- Parse validation results and format for display
- Highlight errors and warnings with appropriate coloring
- Provide suggestions for fixing issues

### 2. Integration Tasks

#### Task 2.1: Qwen Code CLI Integration
**Description**: Integrate OpenSpec commands into Qwen Code's command system.
**Technical Details**:
- Register OpenSpec commands with the command service
- Add command to help system and auto-completion
- Implement proper command discovery
- Handle command aliases (/openspec shortcut)

#### Task 2.2: File System Integration
**Description**: Ensure proper interaction with OpenSpec file structures.
**Technical Details**:
- Implement file watching for spec changes
- Handle file permissions and access controls
- Implement caching for improved performance
- Handle large specification files efficiently

#### Task 2.3: AI Workflow Integration
**Description**: Integrate OpenSpec with Qwen Code's AI decision-making process.
**Technical Details**:
- Read specifications from `openspec/changes/` before major code changes
- Enforce workflow for complex tasks
- Provide spec context to AI models
- Implement validation checks before executing AI-generated code

### 3. UI Component Tasks

#### Task 3.1: Specification Viewer Component
**Description**: Create UI components for viewing specifications.
**Technical Details**:
- Implement markdown rendering for spec files
- Add syntax highlighting for code examples
- Support navigation between related specs
- Implement search functionality within specs

#### Task 3.2: Change Dashboard Component
**Description**: Create UI for managing changes.
**Technical Details**:
- Display list of active changes with status indicators
- Provide quick actions for each change
- Implement filtering and sorting
- Show progress indicators for ongoing work

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
└── validateCommand.ts    # Validate subcommand
```

## Dependencies

### System Requirements
- Node.js >= 20.19.0 (verify with `node --version`)
- OpenSpec CLI (@fission-ai/openspec)

### Package Dependencies
- TypeScript (primary language)
- JavaScript (supporting utilities)
- pnpm (package manager)

### AI Tool Integration
OpenSpec works with various AI coding assistants:
- Native slash command support: Claude Code, Cursor, Factory Droid, OpenCode, Kilo Code, Windsurf, Codex, GitHub Copilot, Amazon Q Developer, Auggie
- AGENTS.md compatible: Amp, Jules, Gemini CLI, and others

## Usage Workflow

1. **Initialize**: Set up OpenSpec with `openspec init`
2. **Draft**: Create change proposals with `openspec change`
3. **Define**: Create detailed specifications with `openspec spec`
4. **Review**: Validate and refine with `openspec validate/show`
5. **Implement**: Apply changes according to specifications
6. **Archive**: Complete changes with `openspec archive`

## Implementation Priority

1. **Phase 1**: Basic command infrastructure (init, list, show)
2. **Phase 2**: Core workflow commands (change, validate, archive)
3. **Phase 3**: Advanced features (update, view, spec management)
4. **Phase 4**: Integration with AI workflow and UI components
5. **Phase 5**: Testing, documentation, and refinement

This phased approach ensures that core functionality is available early while allowing for iterative improvements and testing.