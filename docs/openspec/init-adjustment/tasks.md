# OpenSpec Init Adjustment Tasks

This document outlines the tasks required to adjust our `/openspec init` command to align more closely with the reference implementation from Fission-AI/OpenSpec.

## Task Breakdown

### 1. Directory Structure Enhancement

**Task:** Enhance the directory structure creation to match the reference implementation more closely.

**Subtasks:**
- Add creation of `project.md` file with project conventions
- Implement capability-based organization for specifications (directory structure only)
- Create structured change proposal templates (directory structure only):
  - `proposal.md` - Explaining why and what changes are needed
  - `tasks.md` - Implementation checklist for AI guidance
  - `design.md` - Technical decisions (optional)
  - `specs/` - Directory for specification deltas
- Note: Actual content population should happen through `/openspec spec` and `/openspec change` commands

**Files to Modify:**
- `packages/cli/src/ui/commands/openspec/initCommand.ts`
- Template files for new directory structures

### 2. Interactive Tool Selection Wizard

**Task:** Implement an interactive terminal-based wizard for tool selection.

**Subtasks:**
- Add interactive UI using `@inquirer/core` or similar library
- Display available tools with configuration status
- Provide visual feedback for selections
- Support keyboard navigation (arrow keys, space, enter)
- Show headings for different tool categories

**Files to Modify:**
- `packages/cli/src/ui/commands/openspec/initCommand.ts`
- Potentially new UI component files

### 3. Mode Support (Interactive/Non-Interactive)

**Task:** Support both interactive and non-interactive modes.

**Subtasks:**
- Add `--tools` command line argument for non-interactive mode
- Support special values like "all" and "none"
- Validate tool selections against available options
- Handle extension mode (pre-select already configured tools)

**Files to Modify:**
- `packages/cli/src/ui/commands/openspec/initCommand.ts`
- Command argument parsing logic

### 4. Enhanced AGENTS.md Handling

**Task:** Improve AGENTS.md file handling based on tool selection.

**Subtasks:**
- Create tool-specific AGENTS.md configurations
- Implement dynamic AGENTS.md generation based on tool selection
- Add refresh capability for existing configurations

**Files to Modify:**
- `packages/cli/src/templates/agentsMdTemplates.ts`
- `packages/cli/src/ui/commands/openspec/initCommand.ts`

### 5. Visual Feedback Enhancement

**Task:** Add visual feedback elements to improve user experience.

**Subtasks:**
- Integrate ora spinners for long-running operations
- Add color-coded output with consistent palette
- Implement multi-step workflow visualization

**Files to Modify:**
- `packages/cli/src/ui/commands/openspec/initCommand.ts`
- Potentially new UI utility files

### 6. Validation and Error Handling

**Task:** Enhance validation and error handling capabilities.

**Subtasks:**
- Implement idempotent operations for updating existing configurations
- Add more sophisticated validation for tool configurations
- Improve error recovery mechanisms

**Files to Modify:**
- `packages/cli/src/ui/commands/openspec/initCommand.ts`

## Implementation Priority

### Phase 1 (High Priority - Immediate)
1. Directory Structure Enhancement
2. Enhanced AGENTS.md Handling

### Phase 2 (Medium Priority - Near Term)
3. Mode Support (Interactive/Non-Interactive)
4. Validation and Error Handling

### Phase 3 (Low Priority - Future)
5. Interactive Tool Selection Wizard
6. Visual Feedback Enhancement

## Required Subagents

For executing these tasks, the following specialized subagents should be used:

1. **typescript-monorepo-ai-expert** - For handling the TypeScript implementation and monorepo integration
2. **react-specialist** - For implementing interactive UI components (if needed)
3. **general-purpose** - For research and understanding of the reference implementation
4. **code-reviewer** - For reviewing the implementation changes

## Success Criteria

1. Directory structure matches reference implementation
2. Both interactive and non-interactive modes work correctly
3. All existing functionality is preserved
4. New features are well-tested
5. Documentation is updated to reflect changes
6. Content population is properly deferred to `/openspec spec` and `/openspec change` commands