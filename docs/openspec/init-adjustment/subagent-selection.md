# Subagent Selection for OpenSpec Init Adjustment

This document identifies the proper subagents to use for executing the OpenSpec init adjustment tasks.

## Recommended Subagents

### 1. typescript-monorepo-ai-expert
**Primary Responsibility:** Implementation of core TypeScript functionality

**Tasks Handled:**
- Directory structure enhancement
- Mode support (interactive/non-interactive)
- Enhanced AGENTS.md handling
- Validation and error handling improvements

**Justification:**
This subagent is specifically designed for TypeScript/JavaScript monorepo management and is ideal for implementing the core functionality changes needed for the init command.

### 2. general-purpose
**Primary Responsibility:** Research and reference implementation analysis

**Tasks Handled:**
- Deep dive into Fission-AI/OpenSpec reference implementation
- Understanding of interactive UI patterns
- Research on tool integration patterns

**Justification:**
This agent is best suited for research tasks and understanding complex codebases, which will be valuable for understanding the nuances of the reference implementation.

### 3. code-reviewer
**Primary Responsibility:** Code quality assurance

**Tasks Handled:**
- Reviewing all code changes for best practices
- Ensuring security compliance
- Verifying performance considerations
- Checking maintainability of new code

**Justification:**
Every significant code change should be reviewed by this agent to ensure high quality and adherence to best practices.

### 4. documentation-writer (Optional)
**Primary Responsibility:** Documentation updates

**Tasks Handled:**
- Updating user guides for new features
- Creating API documentation for new functionality
- Updating README files with new capabilities

**Justification:**
As we add new features, documentation will need to be updated to reflect these changes.

## Implementation Approach

### Phase 1: Foundation
1. Use **general-purpose** agent to thoroughly analyze the reference implementation
2. Use **typescript-monorepo-ai-expert** to implement directory structure enhancements
3. Use **code-reviewer** to review changes

### Phase 2: Feature Expansion
1. Use **typescript-monorepo-ai-expert** to implement mode support
2. Use **general-purpose** agent for research on interactive UI patterns
3. Use **code-reviewer** to review changes

### Phase 3: Polish and Documentation
1. Use **documentation-writer** to update documentation
2. Use **code-reviewer** for final quality assurance

## Collaboration Pattern

The **typescript-monorepo-ai-expert** will be the primary agent for implementation, with the **general-purpose** agent providing research support. The **code-reviewer** should be used after each significant change to ensure quality.

For complex UI interactions, the **react-specialist** could be brought in, but the current init command doesn't heavily rely on React components, so it may not be necessary.