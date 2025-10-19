# AGENTS.md Documentation

AGENTS.md files are specialized instruction files that provide guidance to AI assistants working in Qwen Code projects. These files help ensure that AI assistants understand project-specific workflows, conventions, and requirements.

## Overview

There are two distinct AGENTS.md files that serve different purposes in Qwen Code projects:

1. **Root-level AGENTS.md (Universal Stub)** - A minimal redirect file at the project root
2. **OpenSpec Instructions AGENTS.md** - A comprehensive instruction file in the OpenSpec directory

Both files are automatically created and managed when using the OpenSpec integration with Qwen Code.

## 1. Root-level AGENTS.md (Universal Stub)

### Location
`{project-root}/AGENTS.md`

### Purpose
This file acts as a universal compatibility stub that redirects AI assistants to the main OpenSpec instructions. It's designed to work with AGENTS.md-aware tools that aren't natively supported by Qwen Code.

### When It's Created/Updated
- **Created:** When running `openspec init`
- **Updated:** When running `openspec update`

### Content Structure
The root-level AGENTS.md contains minimal content that instructs AI assistants to open the comprehensive OpenSpec instructions:

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

## 2. OpenSpec Instructions AGENTS.md

### Location
`{project-root}/openspec/AGENTS.md`

### Purpose
This file contains comprehensive instructions for AI assistants working with OpenSpec for specification-driven development. It provides detailed guidance on workflows, commands, best practices, and integration with Qwen Code.

### When It's Created/Updated
- **Created:** When running `openspec init` (as part of the base structure)
- **Updated:** When running `openspec update` (through complete file replacement)

### Content Structure
The OpenSpec Instructions AGENTS.md is a comprehensive guide that includes:

1. **Overview** - Introduction to OpenSpec and specification-driven development
2. **Three-Stage Workflow** - Creating, Implementing, and Archiving changes
3. **CLI Commands Reference** - Complete reference for all OpenSpec commands
4. **Directory Structure** - Explanation of the OpenSpec directory layout
5. **Spec File Format Rules** - Guidelines for writing specifications
6. **Best Practices** - Recommendations for specification writing and change management
7. **Troubleshooting Guides** - Solutions to common issues
8. **Integration with Qwen Code** - How OpenSpec works with Qwen Code's AI workflow

## Creation Flow

### During `openspec init`:
1. Creates the OpenSpec directory structure:
   - `openspec/`
   - `openspec/specs/`
   - `openspec/changes/`
   - `openspec/archive/`
2. Generates core files:
   - `openspec/AGENTS.md` (full instructions)
   - `openspec/project.md` (project context)
3. Configures AI tools:
   - Always: `{project-root}/AGENTS.md` (universal stub)

### During `openspec update`:
1. Performs a full replacement of `openspec/AGENTS.md`
2. Updates the root `AGENTS.md` via AgentsStandardConfigurator
3. Refreshes any existing tool-specific configurations

## Key Points

1. **Two Separate Files** - Don't confuse them:
   - Root `/AGENTS.md` = routing stub (universal compatibility)
   - OpenSpec `/openspec/AGENTS.md` = full instructions

2. **Always Created Together** during `openspec init`

3. **Different Update Strategies:**
   - Root stub: Uses marker-based updates (`OPENSPEC:START/END`)
   - OpenSpec instructions: Full file replacement

4. **Root Stub is Optional But Recommended** - It provides compatibility with AGENTS.md-aware tools that aren't natively supported by Qwen Code (like Amp, VS Code extensions, etc.)

## Integration with Qwen Code

OpenSpec integrates deeply with Qwen Code's AI workflow:

1. **Context Provision:** Specifications are automatically provided as context to AI models
2. **Guidance Generation:** Change proposals guide AI implementation tasks
3. **Validation:** Ensuring AI outputs conform to specifications
4. **Tracking:** Archiving completed AI-assisted work

When implementing changes:
- Specifications are automatically included in your context
- Change proposals guide your implementation tasks
- Validation ensures your outputs conform to specifications
- Completed work is archived for historical reference

## Best Practices for AI Assistants

1. **Follow the Three-Stage Workflow:**
   - Create changes with proper proposals and tasks
   - Implement changes guided by specifications
   - Archive completed changes

2. **Reference Specifications:** Always consult the appropriate specifications before implementing changes

3. **Use Proper Naming Conventions:** 
   - Use verb-led prefixes (add-, update-, remove-, refactor-)
   - Create descriptive change names

4. **Validate Changes:** Use `/openspec validate` to ensure compliance with format rules

5. **Seek Clarification:** Ask for clarification when requirements are ambiguous rather than making assumptions

## Troubleshooting

Common issues AI assistants might encounter:

1. **Change Not Found:** Verify the change name exists in `openspec/changes/`
2. **Validation Failures:** Check that all required files exist and follow format rules
3. **Permission Errors:** Ensure you have write access to the OpenSpec directories

For detailed troubleshooting, refer to the comprehensive troubleshooting section in the OpenSpec Instructions AGENTS.md file.