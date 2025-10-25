# openspec-archieve-specs-update

## Overview
This change proposal modifies the archive command to automatically generate a specs.md file in ./openspec/specs/[change-name]/ before archiving, which will contain a summary of the changes made in ./openspec/changes/[change-name].

## Motivation
# Motivation

This change proposal addresses a critical gap in the OpenSpec workflow by ensuring proper documentation continuity when archiving changes. Currently, when changes are moved from `./openspec/changes/[change-name]` to the archive, there's no automated mechanism to preserve a summarized specification snapshot.

## Problem Statement

Without this enhancement, teams risk losing valuable contextual information about implemented changes. The raw change files in the archive directory lack the structured summarization needed for future reference, audit trails, and knowledge transfer. This creates inefficiencies when revisiting past implementations or onboarding new team members.

## Solution Benefits

By automatically generating `./openspec/specs/[change-name]/specs.md` during archive operations, we establish:

1. **Persistent Documentation**: Ensures every archived change maintains a concise, standardized summary
2. **Improved Discoverability**: Structured spec files enable easier navigation and understanding of historical changes
3. **Enhanced Compliance**: Supports audit requirements by maintaining clear records of implemented specifications
4. **Streamlined Onboarding**: New team members can quickly grasp past changes through well-organized summaries

This change aligns with OpenSpec's core principle of maintaining "truth" specifications while improving the archival process integrity. It ensures that valuable implementation knowledge isn't lost during routine cleanup operations, supporting long-term project maintainability and transparency.

## Implementation Plan
# Implementation Plan: Generate Specs Summary Before Archive

## Overview
Modify the archive command to automatically generate a specs.md summary file before archiving a change. This ensures documentation is created for each change's implementation details.

## Steps Required

### 1. Analyze Current Archive Command
- Review `packages/cli/src/ui/commands/openspec/archiveCommand.ts`
- Understand existing archive flow and data structures
- Identify where to inject spec generation logic

### 2. Create Spec Generation Logic
- Develop function to summarize change contents from `./openspec/changes/[change-name]`
- Include key elements:
  - Change description
  - Implemented specifications
  - Key modifications made
  - Files affected

### 3. Integrate Spec Generation into Archive Flow
- Add spec generation step before archive execution
- Create `./openspec/specs/[change-name]/specs.md` with summarized content
- Ensure proper error handling if generation fails

### 4. Update Archive Process
- Modify archive flow to:
  1. Generate specs.md file first
  2. Proceed with existing archive logic only if generation succeeds
  3. Handle cleanup if archive fails after spec generation

### 5. Testing
- Test spec generation with various change types
- Verify correct markdown formatting
- Confirm archive process still works correctly
- Validate error handling scenarios

### 6. Documentation Update
- Update any relevant documentation about archive command behavior
- Note the automatic spec generation feature

This implementation ensures that every archived change automatically generates proper documentation summarizing its implementation details.

## Impact Assessment
# Impact Assessment: Archive Command Enhancement

## Change Description
Modify `archiveCommand.ts` to automatically generate specification files in `./openspec/specs/[change-name]/specs.md` before archiving, containing a summary of changes from `./openspec/changes/[change-name]`.

## Potential Impacts

### Positive Impacts
1. **Improved Documentation**: Automatic spec generation ensures archived changes maintain contextual documentation
2. **Enhanced Traceability**: Links archived changes directly to their summarized specifications
3. **Workflow Efficiency**: Eliminates manual step of creating spec files before archiving
4. **Knowledge Preservation**: Prevents loss of change context during archive process

### Technical Considerations
1. **File System Operations**: Additional I/O operations during archive process
2. **Error Handling**: New failure points for file creation/summary generation
3. **Performance**: Slight increase in archive command execution time
4. **Dependencies**: Requires reliable summary generation mechanism

### Integration Points
1. **Archive Workflow**: Direct modification to existing archive command flow
2. **File Structure**: New automated file creation in `openspec/specs/` directory
3. **Change Management**: Enhanced linkage between changes and specifications

## Risk Level: Low-Medium
Primary risks involve file system operations and dependency on summary generation accuracy. Proper error handling should mitigate most concerns.
