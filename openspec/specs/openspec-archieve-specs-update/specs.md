# openspec-archieve-specs-update Specification

## Overview
This change proposal modifies the archive command to automatically generate a specs.md file in ./openspec/specs/[change-name]/ before archiving, which will contain a summary of the changes made in ./openspec/changes/[change-name].

## Motivation
This change proposal addresses a critical gap in the OpenSpec workflow by ensuring proper documentation continuity when archiving changes. Currently, when changes are moved from `./openspec/changes/[change-name]` to the archive, there's no automated mechanism to preserve a summarized specification snapshot.

Without this enhancement, teams risk losing valuable contextual information about implemented changes. The raw change files in the archive directory lack the structured summarization needed for future reference, audit trails, and knowledge transfer. This creates inefficiencies when revisiting past implementations or onboarding new team members.

By automatically generating `./openspec/specs/[change-name]/specs.md` during archive operations, we establish:

1. **Persistent Documentation**: Ensures every archived change maintains a concise, standardized summary
2. **Improved Discoverability**: Structured spec files enable easier navigation and understanding of historical changes
3. **Enhanced Compliance**: Supports audit requirements by maintaining clear records of implemented specifications
4. **Streamlined Onboarding**: New team members can quickly grasp past changes through well-organized summaries

This change aligns with OpenSpec's core principle of maintaining "truth" specifications while improving the archival process integrity. It ensures that valuable implementation knowledge isn't lost during routine cleanup operations, supporting long-term project maintainability and transparency.

## Implementation Approach
This change modifies the archive command to automatically generate specification files before archiving. The implementation will create a summary of change details in `./openspec/specs/[change-name]/specs.md` by analyzing content from `./openspec/changes/[change-name]`.

The approach involves:
1. Creating a new utility function `generateSpecFile(changeName: string)` in `archiveCommand.ts`
2. Reading all files from `./openspec/changes/[change-name]/**/*`
3. Parsing and extracting key information:
   - Change metadata from `change.json`
   - Summary from `overview.md`
   - Implementation details from code modifications
4. Generating structured markdown content in spec format
5. Writing to `./openspec/specs/[change-name]/specs.md`
6. Modifying existing archive flow to call `generateSpecFile()` before archive execution
7. Adding validation to ensure target spec directory exists
8. Implementing error handling for file operations
9. Maintaining backward compatibility with existing archive functionality

## Implementation Status
Completed 50 of 50 tasks

## Technical Design
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

### Dependencies
- Existing OpenSpec file system operations
- Markdown processing utilities from core package
- Standard file I/O operations
- Node.js file system APIs for reading change directories and writing spec files
- Path resolution utilities for constructing file paths according to OpenSpec structure
- Console logging utilities for status output during archive process

## Archived Change Reference
This specification was automatically generated from the archived change: openspec-archieve-specs-update

