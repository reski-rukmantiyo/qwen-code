# Implementation Checklist - Task 4: Update Update Command to Use AgentsStandardConfigurator

## Task Status
- [ ] Not Started
- [ ] In Progress
- [x] Completed

## Roles and Responsibilities

### Human Developer Responsibilities
- Engage subagents at appropriate stages
- Implement code based on subagent guidance
- Verify implementation meets requirements
- Manage task progress through checklist

### Subagent Responsibilities
- **typescript-monorepo-ai-expert**: Provide technical design guidance and code structure
- **code-reviewer**: Review implementation for quality and correctness

## Implementation Phases

### Phase 1: Design and Planning (Human + typescript-monorepo-ai-expert)
**Objective**: Get technical design guidance before implementation

**Human Actions**:
- [x] Engage typescript-monorepo-ai-expert with the prompt: "Please help me integrate the AgentsStandardConfigurator with the existing updateCommand.ts. I need help with:
    1. Properly importing and instantiating the AgentsStandardConfigurator class
    2. Integrating it with the existing update logic
    3. Implementing file operations for both full replacement of openspec/AGENTS.md and marker-based updates for root AGENTS.md
    4. Ensuring proper dependency injection and error handling patterns"
- [x] Document the agreed-upon approach from the subagent's response

**Subagent Actions**:
- Provide detailed guidance on class integration
- Suggest method signatures and implementation approach
- Recommend error handling patterns
- Identify potential challenges

### Phase 2: Implementation (Human Developer)
**Objective**: Implement the changes based on the design guidance

**Implementation Steps**:
#### Step 1: Import and use the AgentsStandardConfigurator in the update command
- [x] Add import statement for `AgentsStandardConfigurator` in `updateCommand.ts`
- [x] Instantiate the `AgentsStandardConfigurator` class in the update command
- [x] Ensure proper dependency injection for any required services

#### Step 2: Implement full replacement of openspec/AGENTS.md
- [x] Add logic to read the OpenSpec instructions template
- [x] Implement file writing logic to replace the entire openspec/AGENTS.md file
- [x] Add proper error handling for file operations
- [x] Ensure the replacement preserves the file permissions

#### Step 3: Implement marker-based updates for root AGENTS.md
- [x] Use the `AgentsStandardConfigurator` to update the root AGENTS.md file
- [x] Implement logic to update content within OPENSPEC:START/END markers
- [x] Preserve existing content outside the markers
- [x] Handle cases where markers don't exist by adding them

### Phase 3: Review and Refinement (Human + code-reviewer)
**Objective**: Ensure implementation quality through expert review

**Human Actions**:
- [x] Engage code-reviewer with the prompt: "Please review my implementation of the updateCommand.ts changes to use AgentsStandardConfigurator. Focus on:
    1. Correctness of the integration with existing code
    2. Efficiency of the file operations
    3. TypeScript best practices and type safety
    4. Error handling and edge case management"
- [x] Incorporate feedback from code-reviewer

**Subagent Actions**:
- Review code for correctness and efficiency
- Identify potential improvements
- Suggest best practices
- Point out any issues or edge cases

## Verification Steps
- [x] Verify that the update command properly imports and uses the `AgentsStandardConfigurator`
- [x] Test full replacement of openspec/AGENTS.md with correct template content
- [x] Confirm marker-based updates work correctly for root AGENTS.md
- [x] Validate error handling for various failure scenarios

## Files to Modify
- [x] `packages/cli/src/ui/commands/openspec/updateCommand.ts`