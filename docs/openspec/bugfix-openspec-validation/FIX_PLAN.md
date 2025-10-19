# OpenSpec Validation Bug Fix Plan

## Issue Summary
The OpenSpec validation system has a bug in the regex pattern used to extract delta operation headers, causing false validation errors.

## Files That Need Correction

### 1. `/packages/cli/src/ui/commands/openspec/validateCommand.ts`
**Location**: Line 462 in the `validateDeltaOperationsFormat` function
**Current Code**:
```javascript
const headerRegex = /^## [A-Z]+/gm;
```
**Issue**: This pattern only extracts the first part of headers (e.g., "## ADDED") instead of the full headers (e.g., "## ADDED Requirements").

**Fix**:
```javascript
const headerRegex = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/gm;
```

### 2. `/packages/cli/src/services/OpenSpecDeltaOperationsParser.ts`
**Location**: Line 246 in the `validateAgentsMdFormat` function
**Current Code**:
```javascript
const headerRegex = /^## [A-Z]+/gm;
```
**Issue**: Same as above.

**Fix**:
```javascript
const headerRegex = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/gm;
```

## Test Files Structure
To properly test the fix, ensure the following structure:

```
openspec/
└── changes/
    └── create-main-menu/
        ├── proposal.md
        ├── tasks.md
        ├── design.md
        └── specs/
            └── delta-template.md
```

## Validation Commands
After applying the fix, test with:
```bash
/openspec validate create-main-menu
/openspec validate create-main-menu --strict
```

## Expected Outcome
With the corrected regex patterns, the validation should properly recognize headers like "## ADDED Requirements" and not produce false errors about missing "Requirements" in the header names.