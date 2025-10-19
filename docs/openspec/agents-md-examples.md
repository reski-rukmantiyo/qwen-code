# AGENTS.md Examples

This document provides examples of the two types of AGENTS.md files that are automatically generated when using OpenSpec with Qwen Code.

## Example 1: Root-level AGENTS.md (Universal Stub)

This is the minimal stub file created at the project root. It serves as a redirect to the comprehensive OpenSpec instructions.

```markdown
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.
```

## Example 2: OpenSpec Instructions AGENTS.md

This is the comprehensive instruction file created in the OpenSpec directory. It provides detailed guidance for AI assistants working with OpenSpec.

```markdown
# OpenSpec Instructions for AI Assistants

These instructions guide AI assistants working in projects that use OpenSpec for specification-driven development.

## Overview

OpenSpec is a specification-driven development tool that ensures alignment between humans and AI on detailed specifications before implementation. It maintains "truth" specifications in `openspec/specs/` and proposed changes in `openspec/changes/`.

## Three-Stage Workflow

OpenSpec follows a three-stage workflow for managing changes:

1. **Creating Changes**: Propose modifications through structured change folders
2. **Implementing Changes**: Apply changes with AI assistance guided by specifications
3. **Archiving Changes**: Move completed changes to historical storage

### Stage 1: Creating Changes

When creating changes:
- Use verb-led prefixes (add-, update-, remove-, refactor-)
- Create change folders in `openspec/changes/` with descriptive names
- Define proposals in `proposal.md` explaining why and what changes are needed
- List implementation tasks in `tasks.md` for AI guidance
- Specify technical designs in `design.md` when needed
- Create specification deltas in `specs/` showing exactly what will change

### Stage 2: Implementing Changes

When implementing changes:
- Follow tasks in `tasks.md` in sequential order
- Reference specifications in `openspec/specs/` for implementation guidelines
- Validate implementation against change proposals
- Mark tasks as complete by checking boxes as you implement them
- Seek clarification when requirements are ambiguous

### Stage 3: Archiving Changes

After implementing changes:
- Run `/openspec archive <change-name>` to move completed changes to history
- Ensure all tasks are marked complete before archiving
- Verify implementation matches the change proposal

## CLI Commands Reference

OpenSpec functionality is accessed through the `/openspec` command with subcommands:

### Core Commands

`/openspec init`
- Initializes OpenSpec in your project
- Creates directory structure: `openspec/specs/`, `openspec/changes/`, `openspec/archive/`
- Generates sample files for reference

`/openspec list`
- Lists all active changes in `openspec/changes/`

`/openspec show <change-name>`
- Displays detailed information about a specific change

`/openspec change <change-name>`
- Creates or modifies change proposals

`/openspec spec <action> <spec-path>`
- Manages specification files (create, edit, delete)

`/openspec validate <change-name>`
- Validates specification formatting and structure

`/openspec archive <change-name>`
- Moves completed changes to the archive directory

`/openspec update`
- Refreshes agent instructions and regenerates AI guidance

`/openspec view`
- Provides an interactive dashboard of specifications and changes

`/openspec apply <change-name>`
- Applies a change by submitting tasks to AI for implementation

### Advanced Commands

`/openspec clear`
- Completely resets OpenSpec (use --cache-only to clear cache only)

`/openspec diff <change-name>`
- Shows specification differences for a change

`/openspec search <query>`
- Searches for text in OpenSpec specifications using ripgrep

## Directory Structure

```
openspec/
├── project.md              # Project conventions
├── specs/                  # Current truth - what IS built
│   └── [capability]/       # Single focused capability
│       ├── spec.md         # Requirements and scenarios
│       └── design.md       # Technical patterns
├── changes/                # Proposals - what SHOULD change
│   ├── [change-name]/
│   │   ├── proposal.md     # Why, what, impact
│   │   ├── tasks.md        # Implementation checklist
│   │   ├── design.md       # Technical decisions (optional)
│   │   └── specs/          # Delta changes
│   │       └── [capability]/
│   │           └── spec.md # ADDED/MODIFIED/REMOVED
│   └── archive/            # Completed changes
```

## Spec File Format Rules

### Specification Structure

All specifications should follow this structure:
1. **Overview** - Purpose and scope
2. **Requirements** - Detailed behavioral specifications
3. **Scenarios** - Specific use cases and edge cases
4. **Design** - Technical implementation approach (if applicable)
5. **Implementation Details** - Implementation guidelines and constraints
6. **Testing** - Testing approaches and acceptance criteria

### Requirement Language

Use normative language in specifications:
- **SHALL**/**MUST** for mandatory requirements
- **SHOULD**/**RECOMMENDED** for recommended practices
- **MAY**/**OPTIONAL** for optional features

### Scenario Format

All requirements must include at least one scenario using this format:
```markdown
#### Scenario: [Descriptive Name]
- **WHEN** [specific condition or action]
- **THEN** [expected outcome]
```

### Delta Operations

Specification deltas use proper format:
- `## ADDED Requirements`
- `## MODIFIED Requirements`
- `## REMOVED Requirements`
- `## RENAMED Requirements`

## Best Practices

### For Specification Writing

1. Keep specifications focused and concise
2. Use clear, unambiguous language
3. Include concrete examples and scenarios
4. Define measurable acceptance criteria
5. Link related specifications appropriately

### For Change Management

1. Create small, focused changes (<100 lines of new code per change)
2. Prefer single-file implementations until proven insufficient
3. Use verb-noun naming (e.g., `add-user-auth`, `update-api-docs`)
4. Write clear, actionable task descriptions
5. Validate changes with `/openspec validate` before implementation

### For AI Implementation

1. Follow tasks in sequential order as listed
2. Reference specifications for implementation details
3. Ask clarifying questions when requirements are unclear
4. Validate implementation against change proposals
5. Mark tasks complete as you implement them

## Troubleshooting Guides

### Common Issues

1. **Change not found**: Verify the change name and that it exists in `openspec/changes/`
2. **Validation failures**: Check that all required files exist and follow format rules
3. **Permission errors**: Ensure you have write access to the OpenSpec directories
4. **Cache issues**: Run `/openspec clear --cache-only` to reset caches

### Error Recovery

1. **Change conflicts**: Coordinate with other change owners when overlapping specs are detected
2. **Validation failures**: Use `--strict` mode for comprehensive checks and JSON output for debugging
3. **Missing context**: Consult `project.md` first, then related specs, then recent archives

## Integration with Qwen Code

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
```