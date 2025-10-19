# Implementation Checklist - Task 6: Create Tests for AGENTS.md Functionality

## Task Status
- [ ] Not Started
- [ ] In Progress
- [ ] Completed

## Implementation Steps

### Step 1: Create unit tests for AGENTS.md template content
- [ ] Create test file for `agentsMdTemplates.ts`
- [ ] Add tests to verify the content of root-level AGENTS.md stub
- [ ] Add tests to verify the content of OpenSpec instructions AGENTS.md
- [ ] Ensure templates contain required sections and formatting

### Step 2: Create integration tests for init command AGENTS.md creation
- [ ] Create or modify `initCommand.test.ts`
- [ ] Add tests to verify both AGENTS.md files are created during init
- [ ] Test that file content matches the templates
- [ ] Test error conditions (permissions, existing files, etc.)

### Step 3: Create tests for update command AGENTS.md operations
- [ ] Create or modify `updateCommand.test.ts`
- [ ] Add tests for full replacement of openspec/AGENTS.md
- [ ] Add tests for marker-based updates of root AGENTS.md
- [ ] Test error handling in update scenarios

### Step 4: Test error conditions and edge cases
- [ ] Test behavior when files already exist
- [ ] Test behavior with insufficient permissions
- [ ] Test behavior with invalid paths
- [ ] Test rollback mechanisms

## Verification Steps
- [ ] Verify all unit tests pass for template content
- [ ] Confirm integration tests cover init command functionality
- [ ] Ensure update command tests validate both replacement and update operations
- [ ] Validate that error condition tests properly handle edge cases

## Subagents to Use
- [ ] **go-testing-expert**: To create comprehensive and robust tests (even though this is TypeScript, the testing principles apply)
- [ ] **typescript-monorepo-ai-expert**: To implement proper TypeScript tests

## Files to Create/Modify
- [ ] Create `packages/cli/src/templates/agentsMdTemplates.test.ts` (if needed)
- [ ] Modify `packages/cli/src/ui/commands/openspec/initCommand.test.ts`
- [ ] Modify `packages/cli/src/ui/commands/openspec/updateCommand.test.ts`
- [ ] Create `packages/cli/src/services/AgentsStandardConfigurator.test.ts` (if created)