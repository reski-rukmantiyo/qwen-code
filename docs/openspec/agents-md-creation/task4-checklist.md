# Implementation Checklist - Task 4: Update Update Command to Use AgentsStandardConfigurator

## Task Status
- [ ] Not Started
- [ ] In Progress
- [ ] Completed

## Implementation Steps

### Step 1: Import and use the AgentsStandardConfigurator in the update command
- [ ] Add import statement for `AgentsStandardConfigurator` in `updateCommand.ts`
- [ ] Instantiate the `AgentsStandardConfigurator` class in the update command
- [ ] Ensure proper dependency injection for any required services

### Step 2: Implement full replacement of openspec/AGENTS.md
- [ ] Add logic to read the OpenSpec instructions template
- [ ] Implement file writing logic to replace the entire openspec/AGENTS.md file
- [ ] Add proper error handling for file operations
- [ ] Ensure the replacement preserves the file permissions

### Step 3: Implement marker-based updates for root AGENTS.md
- [ ] Use the `AgentsStandardConfigurator` to update the root AGENTS.md file
- [ ] Implement logic to update content within OPENSPEC:START/END markers
- [ ] Preserve existing content outside the markers
- [ ] Handle cases where markers don't exist by adding them

## Verification Steps
- [ ] Verify that the update command properly imports and uses the `AgentsStandardConfigurator`
- [ ] Test full replacement of openspec/AGENTS.md with correct template content
- [ ] Confirm marker-based updates work correctly for root AGENTS.md
- [ ] Validate error handling for various failure scenarios

## Subagents to Use
- [ ] **typescript-monorepo-ai-expert**: To properly integrate the configurator with existing update logic
- [ ] **code-reviewer**: To review the changes for correctness and efficiency

## Files to Modify
- [ ] `packages/cli/src/ui/commands/openspec/updateCommand.ts`