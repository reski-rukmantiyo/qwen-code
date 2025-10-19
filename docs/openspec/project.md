# OpenSpec Project Conventions

This file defines the project conventions for using OpenSpec with Qwen Code.

## Project Information
- **Project Name**: Qwen Code OpenSpec Integration
- **Version**: 1.0.0
- **Last Updated**: 2025-10-19

## Conventions

### Change Naming
Changes should use kebab-case with verb-led prefixes:
- `add-*` for new features
- `update-*` for enhancements
- `remove-*` for deprecations
- `refactor-*` for restructuring

Examples:
- `add-user-authentication`
- `update-api-documentation`
- `remove-deprecated-endpoints`
- `refactor-database-connection`

Change IDs should be short and descriptive, ensuring uniqueness (with `-2`, `-3`, etc. if needed).

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

Requirements should use SHALL/MUST for normative requirements and should/may only for intentionally non-normative requirements.

### Scenario Format
All requirements must include at least one scenario using this format:
```markdown
#### Scenario: [Descriptive Name]
- **WHEN** [specific condition or action]
- **THEN** [expected outcome]
```

Scenarios must use the proper format:
- `#### Scenario: Name` format (4 hashtags)
- Incorrect formats are rejected (bullet points, bold formatting, 3 or fewer hashtags)

### Delta Operations
Specification deltas use proper format:
- `## ADDED Requirements`
- `## MODIFIED Requirements`
- `## REMOVED Requirements`
- `## RENAMED Requirements`

Each requirement has at least one `#### Scenario:` with proper formatting.
Overlapping specs are detected and coordination mechanisms exist for change owners.

## Best Practices

### Simplicity First
- Default to <100 lines of new code per change
- Prefer single-file implementations until proven insufficient
- Only add complexity with clear justification
- Frameworks are only used with clear justification

### Capability Organization
- Use verb-noun naming (e.g., `user-auth`, `payment-processing`)
- Each capability should have a single, focused purpose
- Keep descriptions understandable within 10 minutes
- Each capability has a single purpose and follows the 10-minute understandability rule

### Validation
- Always run `/openspec validate [change] --strict` before submitting changes
- Ensure all requirements have at least one scenario
- Verify proper requirement header formatting (ADDED/MODIFIED/REMOVED)
- `--strict` mode provides comprehensive checks
- JSON output is available for debugging
- Spec file format issues are properly identified

## Tooling

### Search
Use ripgrep (`rg`) for full-text search across specifications:
```bash
# Search for requirements
rg -n "Requirement:" openspec/specs

# Search for scenarios
rg -n "Scenario:" openspec/

# Search for specific patterns
rg -n "SHALL|MUST" openspec/
```

You can also use the OpenSpec search command:
```bash
# Search within OpenSpec using the built-in search command
/openspec search "Requirement:"
/openspec search "SHALL" --include "*.md"
/openspec search "Scenario:" --path specs
```

### Integration with Qwen Code
- Specifications are automatically provided as context to AI models
- Change proposals guide AI implementation tasks
- Validation ensures AI outputs conform to specifications

## Error Recovery

### Change Conflicts
- Overlapping specs are detected
- Coordination mechanisms exist for change owners
- Proposal combination is supported

### Validation Failures
- `--strict` mode provides comprehensive checks
- JSON output is available for debugging
- Spec file format issues are properly identified

### Missing Context
- `project.md` is consulted first
- Related specs are checked
- Recent archives are reviewed

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