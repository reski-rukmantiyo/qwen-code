/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tool-specific AGENTS.md templates for different AI tools that can integrate with OpenSpec.
 * These templates provide specialized instructions for each tool to work effectively with OpenSpec.
 */

// Template for Qwen Code integration
export const QWEN_CODE_AGENTS_TEMPLATE = `# Qwen Code Integration Instructions

These instructions are for Qwen Code when working with OpenSpec projects.

## Core Principles

1. **Specification-Driven Development**: Always reference specifications in \`openspec/specs/\` before implementing changes
2. **Change Management**: Follow the three-stage workflow (Create, Implement, Archive) for all modifications
3. **Validation First**: Use \`/openspec validate\` to ensure compliance before implementation
4. **Context Awareness**: Understand that specifications are the source of truth for requirements

## Working with Specifications

### Reading Specifications
- Specifications are located in \`openspec/specs/\` directory
- Each specification follows a structured format with Overview, Requirements, Implementation Details, and Testing sections
- Requirements use normative language (SHALL/MUST, SHOULD/RECOMMENDED, MAY/OPTIONAL)
- Every requirement includes at least one scenario with WHEN/THEN format

### Implementing Against Specifications
- Reference the relevant specification files when implementing features
- Ensure all requirements are met as specified
- If a requirement is unclear, ask for clarification rather than making assumptions
- Validate your implementation against the scenarios provided

## Working with Changes

### Creating Changes
When proposing modifications:
- Use verb-led prefixes (add-, update-, remove-, refactor-)
- Create change folders in \`openspec/changes/\` with descriptive names
- Define proposals in \`proposal.md\` explaining why and what changes are needed
- List implementation tasks in \`tasks.md\` for AI guidance
- Specify technical designs in \`design.md\` when needed
- Create specification deltas in \`specs/\` showing exactly what will change

### Implementing Changes
When implementing changes:
- Follow tasks in \`tasks.md\` in sequential order
- Reference specifications in \`openspec/specs/\` for implementation guidelines
- Validate implementation against change proposals
- Mark tasks as complete by checking boxes as you implement them
- Seek clarification when requirements are ambiguous

### Archiving Changes
After implementing changes:
- Run \`/openspec archive <change-name>\` to move completed changes to history
- Ensure all tasks are marked complete before archiving
- Verify implementation matches the change proposal

## Best Practices for Qwen Code

1. **Use Built-in Tools**: Leverage Qwen Code's tool ecosystem for file operations, search, and execution
2. **Follow Confirmation Prompts**: Respect user confirmation prompts for file modifications and command execution
3. **Provide Context**: Include relevant specification excerpts when discussing implementation details
4. **Maintain Consistency**: Ensure code style and patterns match existing project conventions
5. **Document Thoroughly**: Update specifications and change proposals as you work

## Integration with Qwen Code Commands

OpenSpec integrates deeply with Qwen Code's AI workflow:

1. **Context Provision**: Specifications are automatically provided as context to AI models
2. **Guidance Generation**: Change proposals guide AI implementation tasks
3. **Validation**: Ensuring AI outputs conform to specifications
4. **Tracking**: Archiving completed AI-assisted work

When implementing changes:
- Specifications are automatically included in your context
- Change proposals guide your implementation tasks
- Validation ensures your outputs conform to specifications
- Completed work is archived for historical reference
`;

// Template for Claude integration
export const CLAUDE_AGENTS_TEMPLATE = `# Claude Integration Instructions

These instructions are for Claude when working with OpenSpec projects.

## Core Principles

1. **Specification-Driven Development**: Always reference specifications in \`openspec/specs/\` before implementing changes
2. **Change Management**: Follow the three-stage workflow (Create, Implement, Archive) for all modifications
3. **Validation First**: Ensure compliance with specifications before implementation
4. **Context Awareness**: Understand that specifications are the source of truth for requirements

## Working with Specifications

### Reading Specifications
- Specifications are located in \`openspec/specs/\` directory
- Each specification follows a structured format with Overview, Requirements, Implementation Details, and Testing sections
- Requirements use normative language (SHALL/MUST, SHOULD/RECOMMENDED, MAY/OPTIONAL)
- Every requirement includes at least one scenario with WHEN/THEN format

### Implementing Against Specifications
- Reference the relevant specification files when implementing features
- Ensure all requirements are met as specified
- If a requirement is unclear, ask for clarification rather than making assumptions
- Validate your implementation against the scenarios provided

## Working with Changes

### Creating Changes
When proposing modifications:
- Use verb-led prefixes (add-, update-, remove-, refactor-)
- Create change folders in \`openspec/changes/\` with descriptive names
- Define proposals in \`proposal.md\` explaining why and what changes are needed
- List implementation tasks in \`tasks.md\` for AI guidance
- Specify technical designs in \`design.md\` when needed
- Create specification deltas in \`specs/\` showing exactly what will change

### Implementing Changes
When implementing changes:
- Follow tasks in \`tasks.md\` in sequential order
- Reference specifications in \`openspec/specs/\` for implementation guidelines
- Validate implementation against change proposals
- Mark tasks as complete by checking boxes as you implement them
- Seek clarification when requirements are ambiguous

### Archiving Changes
After implementing changes:
- Ensure all tasks are marked complete before considering the change finished
- Verify implementation matches the change proposal

## Best Practices for Claude

1. **Be Explicit**: Clearly state which specifications and requirements you're addressing
2. **Ask Questions**: If anything is unclear, ask for clarification before proceeding
3. **Validate Assumptions**: Double-check your understanding of requirements before implementation
4. **Document Decisions**: Note any design decisions or tradeoffs in the change's \`design.md\` file
5. **Follow Structure**: Maintain the structured format of specifications and changes

## Integration with OpenSpec Workflow

OpenSpec ensures alignment between humans and AI on detailed specifications before implementation:

1. **Context Provision**: Specifications are provided as context for implementation tasks
2. **Guidance Generation**: Change proposals guide implementation tasks
3. **Validation**: Ensuring outputs conform to specifications
4. **Tracking**: Archiving completed work for historical reference
`;

// Template for ChatGPT integration
export const CHATGPT_AGENTS_TEMPLATE = `# ChatGPT Integration Instructions

These instructions are for ChatGPT when working with OpenSpec projects.

## Core Principles

1. **Specification-Driven Development**: Always reference specifications in \`openspec/specs/\` before implementing changes
2. **Change Management**: Follow the three-stage workflow (Create, Implement, Archive) for all modifications
3. **Validation First**: Ensure compliance with specifications before implementation
4. **Context Awareness**: Understand that specifications are the source of truth for requirements

## Working with Specifications

### Reading Specifications
- Specifications are located in \`openspec/specs/\` directory
- Each specification follows a structured format with Overview, Requirements, Implementation Details, and Testing sections
- Requirements use normative language (SHALL/MUST, SHOULD/RECOMMENDED, MAY/OPTIONAL)
- Every requirement includes at least one scenario with WHEN/THEN format

### Implementing Against Specifications
- Reference the relevant specification files when implementing features
- Ensure all requirements are met as specified
- If a requirement is unclear, ask for clarification rather than making assumptions
- Validate your implementation against the scenarios provided

## Working with Changes

### Creating Changes
When proposing modifications:
- Use verb-led prefixes (add-, update-, remove-, refactor-)
- Create change folders in \`openspec/changes/\` with descriptive names
- Define proposals in \`proposal.md\` explaining why and what changes are needed
- List implementation tasks in \`tasks.md\` for AI guidance
- Specify technical designs in \`design.md\` when needed
- Create specification deltas in \`specs/\` showing exactly what will change

### Implementing Changes
When implementing changes:
- Follow tasks in \`tasks.md\` in sequential order
- Reference specifications in \`openspec/specs/\` for implementation guidelines
- Validate implementation against change proposals
- Mark tasks as complete by checking boxes as you implement them
- Seek clarification when requirements are ambiguous

### Archiving Changes
After implementing changes:
- Ensure all tasks are marked complete before considering the change finished
- Verify implementation matches the change proposal

## Best Practices for ChatGPT

1. **Be Methodical**: Work through tasks systematically, one at a time
2. **Reference Explicitly**: Clearly cite which specifications and requirements you're addressing
3. **Seek Clarification**: If anything is unclear, ask for clarification before proceeding
4. **Validate Implementation**: Check that your implementation meets all specified requirements
5. **Follow Structure**: Maintain the structured format of specifications and changes

## Integration with OpenSpec Workflow

OpenSpec ensures alignment between humans and AI on detailed specifications before implementation:

1. **Context Provision**: Specifications are provided as context for implementation tasks
2. **Guidance Generation**: Change proposals guide implementation tasks
3. **Validation**: Ensuring outputs conform to specifications
4. **Tracking**: Archiving completed work for historical reference
`;

// Template for GitHub Copilot integration
export const GITHUB_COPILOT_AGENTS_TEMPLATE = `# GitHub Copilot Integration Instructions

These instructions are for GitHub Copilot when working with OpenSpec projects.

## Core Principles

1. **Specification-Driven Development**: Always reference specifications in \`openspec/specs/\` before implementing changes
2. **Change Management**: Follow the three-stage workflow (Create, Implement, Archive) for all modifications
3. **Validation First**: Ensure compliance with specifications before implementation
4. **Context Awareness**: Understand that specifications are the source of truth for requirements

## Working with Specifications

### Reading Specifications
- Specifications are located in \`openspec/specs/\` directory
- Each specification follows a structured format with Overview, Requirements, Implementation Details, and Testing sections
- Requirements use normative language (SHALL/MUST, SHOULD/RECOMMENDED, MAY/OPTIONAL)
- Every requirement includes at least one scenario with WHEN/THEN format

### Implementing Against Specifications
- Reference the relevant specification files when implementing features
- Ensure all requirements are met as specified
- If a requirement is unclear, ask for clarification rather than making assumptions
- Validate your implementation against the scenarios provided

## Working with Changes

### Creating Changes
When proposing modifications:
- Use verb-led prefixes (add-, update-, remove-, refactor-)
- Create change folders in \`openspec/changes/\` with descriptive names
- Define proposals in \`proposal.md\` explaining why and what changes are needed
- List implementation tasks in \`tasks.md\` for AI guidance
- Specify technical designs in \`design.md\` when needed
- Create specification deltas in \`specs/\` showing exactly what will change

### Implementing Changes
When implementing changes:
- Follow tasks in \`tasks.md\` in sequential order
- Reference specifications in \`openspec/specs/\` for implementation guidelines
- Validate implementation against change proposals
- Mark tasks as complete by checking boxes as you implement them
- Seek clarification when requirements are ambiguous

### Archiving Changes
After implementing changes:
- Ensure all tasks are marked complete before considering the change finished
- Verify implementation matches the change proposal

## Best Practices for GitHub Copilot

1. **Contextual Suggestions**: Provide code suggestions that align with the project's specifications
2. **Requirement Mapping**: Clearly map your suggestions to specific requirements in the specifications
3. **Consistent Patterns**: Follow existing code patterns and conventions in the project
4. **Documentation Integration**: Suggest updates to documentation that align with code changes
5. **Quality Validation**: Recommend validation approaches that match the testing requirements in specifications

## Integration with OpenSpec Workflow

OpenSpec ensures alignment between humans and AI on detailed specifications before implementation:

1. **Context Provision**: Specifications are provided as context for implementation tasks
2. **Guidance Generation**: Change proposals guide implementation tasks
3. **Validation**: Ensuring outputs conform to specifications
4. **Tracking**: Archiving completed work for historical reference
`;