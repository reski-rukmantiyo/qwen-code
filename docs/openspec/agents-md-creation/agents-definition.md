# How AGENTS.md is Created

Based on the source code, there are **two AGENTS.md files** that serve different purposes:

## 1. Root-level AGENTS.md (Universal Stub)

**Location:** `{project-root}/AGENTS.md`

**Created when:**
- Running `openspec init` (always created)
- Running `openspec update` (refreshed if exists)

**Content:** A minimal stub that redirects AI assistants to the main OpenSpec instructions:

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

---

## 2. OpenSpec Instructions AGENTS.md

**Location:** `{project-root}/openspec/AGENTS.md`

**Created when:**
- Running `openspec init` (always created as part of base structure)

**Updated when:**
- Running `openspec update` (complete file replacement)

**Content:** Comprehensive instructions for AI assistants (~800 lines) including:
- Three-stage workflow (Creating, Implementing, Archiving changes)
- CLI commands reference
- Directory structure
- Spec file format rules
- Troubleshooting guides
- Best practices

---

## Creation Flow

### During `openspec init`:

```typescript
// From src/core/init.ts

1. Create directory structure:
   - openspec/
   - openspec/specs/
   - openspec/changes/
   - openspec/changes/archive/

2. Generate core files (TemplateManager.getTemplates()):
   - openspec/AGENTS.md (full instructions)
   - openspec/project.md (project context)

3. Configure AI tools:
   - Always: {project-root}/AGENTS.md (universal stub)
   - Optional: Tool-specific files (CLAUDE.md, slash commands, etc.)
```

### During `openspec update`:

```typescript
// From src/core/update.ts

1. Full replacement of openspec/AGENTS.md
2. Update root AGENTS.md via AgentsStandardConfigurator
3. Refresh any existing tool-specific configurations
```

---

## Key Points

1. **Two separate files** - Don't confuse them:
   - Root `/AGENTS.md` = routing stub (universal compatibility)
   - OpenSpec `/openspec/AGENTS.md` = full instructions

2. **Always created together** during `openspec init`

3. **Different update strategies:**
   - Root stub: Uses marker-based updates (`OPENSPEC:START/END`)
   - OpenSpec instructions: Full file replacement

4. **Root stub is optional but recommended** - It provides compatibility with AGENTS.md-aware tools that aren't natively supported (Amp, VS Code extensions, etc.)