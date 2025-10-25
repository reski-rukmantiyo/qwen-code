# Technical Design for openspec-archieve-specs-update

## Approach
# Technical Approach

## Overview
This change modifies the archive command to automatically generate specification files before archiving. The implementation will create a summary of change details in `./openspec/specs/[change-name]/specs.md` by analyzing content from `./openspec/changes/[change-name]`.

## Implementation Steps

### 1. Specification Generation Logic
- Create a new utility function `generateSpecFile(changeName: string)` in `archiveCommand.ts`
- Read all files from `./openspec/changes/[change-name]/**/*`
- Parse and extract key information:
  - Change metadata from `change.json`
  - Summary from `overview.md`
  - Implementation details from code modifications
- Generate structured markdown content in spec format
- Write to `./openspec/specs/[change-name]/specs.md`

### 2. Archive Command Modification
- Modify existing archive flow to call `generateSpecFile()` before archive execution
- Add validation to ensure target spec directory exists
- Implement error handling for file operations
- Maintain backward compatibility with existing archive functionality

### 3. Integration Considerations
- Follow OpenSpec directory structure conventions
- Use existing file parsing utilities from `packages/core`
- Maintain consistency with specification format defined in `openspec/AGENTS.md`
- Ensure generated specs align with project documentation standards

## Dependencies
- Existing OpenSpec file system operations
- Markdown processing utilities from core package
- Standard file I/O operations

This approach ensures specifications are automatically maintained while preserving existing archive workflows.

## Architecture
## Architecture Section for Change Proposal: Enhanced Archive Command with Spec Generation

### Overview
This change modifies the archive command in `/packages/cli/src/ui/commands/openspec/archiveCommand.ts` to automatically generate specification summary files before archiving changes. The enhancement ensures better documentation continuity by creating a summarized spec file in `./openspec/specs/[change-name]/specs.md` that captures the essence of changes made in `./openspec/changes/[change-name]`.

### Architectural Considerations

#### 1. **Spec Generation Logic**
- **Input Source**: Content from `./openspec/changes/[change-name]` including proposal documents, implementation notes, and any supplementary files
- **Output Target**: New spec file at `./openspec/specs/[change-name]/specs.md`
- **Summarization Process**: 
  - Parse key files in the change directory (proposal.md, implementation-notes.md)
  - Extract essential elements: change purpose, key decisions, implementation approach
  - Generate structured markdown summary following OpenSpec spec format conventions
  - Include references to archived materials

#### 2. **Execution Flow Modification**
- **Pre-Archive Hook**: Insert spec generation step before existing archive logic
- **Validation Check**: Ensure change directory exists and contains required files
- **Error Handling**: Gracefully handle cases where source content is incomplete
- **Atomic Operation**: Both spec generation and archiving succeed or fail together

#### 3. **Integration Points**
- **File System Operations**: 
  - Read operations on change directories
  - Write operations to specs directory
  - Directory creation if target doesn't exist
- **Path Resolution**: 
  - Resolve relative paths from project root
  - Handle cross-platform path differences
- **CLI Command Interface**: Maintain existing command signature while extending functionality

#### 4. **Dependencies and Constraints**
- **Markdown Processing**: Leverage existing markdown utilities in the codebase
- **OpenSpec Conventions**: Adhere to established spec file structure and naming
- **Performance**: Minimize overhead added to archive process
- **Backward Compatibility**: Preserve existing archive behavior when spec generation fails

### Implementation Approach
1. Add spec generation function that processes change directory content
2. Modify archive command to call spec generation before archiving
3. Implement file I/O operations with proper error handling
4. Add validation for required source files and target directory permissions
5. Update command tests to verify both spec generation and archiving occur correctly

## Dependencies
# Dependencies and Prerequisites

## Required Files and Directories
- `./openspec/AGENTS.md` (OpenSpec instructions for AI assistants)
- `./openspec/project.md` (Project context and specifications)
- `./packages/cli/src/ui/commands/openspec/archiveCommand.ts` (Target command file to modify)
- `./openspec/changes/[change-name]/` (Existing change directory with content to summarize)
- `./openspec/specs/` (Directory where generated spec files will be stored)

## Functional Dependencies
1. **OpenSpec CLI Infrastructure** - The existing OpenSpec command structure and dependency injection system must be operational
2. **File System Operations Module** - Core file reading and writing capabilities used by OpenSpec commands
3. **Markdown Processing Utilities** - Functions for parsing and generating markdown content
4. **Change Directory Structure** - Standardized OpenSpec change folder layout (`description.md`, `proposal.md`, etc.)

## Implementation Prerequisites
1. Understanding of OpenSpec's three-stage workflow (Create/Implement/Archive)
2. Knowledge of specification file format conventions documented in `./openspec/AGENTS.md`
3. Access to existing archive command logic for integration points
4. Compliance with project's TypeScript coding standards and error handling patterns

## External Dependencies
- Node.js file system APIs for reading change directories and writing spec files
- Path resolution utilities for constructing file paths according to OpenSpec structure
- Console logging utilities for status output during archive process
