# Bug Report: OpenSpec Validation Issue

## Problem Description
When running `/openspec validate [change-name]`, the validation fails with the following errors:
- Warning: File "proposal.md" has specification format issues: No requirement headers found.
- Error: Spec file "delta-template.md" has delta operation compliance issues with headers like:
  - Header should be exactly "## ADDED Requirements" but found "## ADDED"

## Root Cause Analysis
The issue is in the regex pattern used to extract delta operation headers in two files:

1. `/packages/cli/src/ui/commands/openspec/validateCommand.ts` (line 462)
2. `/packages/cli/src/services/OpenSpecDeltaOperationsParser.ts` (line 246)

Both files use the incorrect regex pattern:
```javascript
const headerRegex = /^## [A-Z]+/gm;
```

This pattern only matches the first part of headers (e.g., "## ADDED") instead of the full headers (e.g., "## ADDED Requirements").

## Files Affected
1. `proposal.md` - Needs proper requirement headers with scenarios
2. `delta-template.md` - Needs to be in the correct location (`specs/` directory) with proper header format

## Solution
1. Fix the file structure: Move `delta-template.md` to `specs/delta-template.md`
2. Ensure `proposal.md` includes proper requirement headers with scenarios
3. Ensure `delta-template.md` uses correct headers like "## ADDED Requirements"
4. (Optional) Fix the regex pattern in the validation code to properly match full headers

## Current Status
After fixing the file structure and content, the validation passes when run through the CLI, but the underlying bug in the regex pattern remains.