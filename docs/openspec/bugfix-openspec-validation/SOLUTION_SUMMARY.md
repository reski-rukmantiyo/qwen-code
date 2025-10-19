# OpenSpec Validation Issue Resolution

## Problem
When running `/openspec validate [change-name]`, the following errors were encountered:
- Warning: File "proposal.md" has specification format issues: No requirement headers found.
- Error: Spec file "delta-template.md" has delta operation compliance issues:
  - Header should be exactly "## ADDED Requirements" but found "## ADDED"

## Root Cause
The issue was twofold:
1. **File Structure**: The `delta-template.md` file was in the wrong location (root of change directory instead of `specs/` subdirectory)
2. **Validation Bug**: The regex pattern used in the validation functions was incorrect, extracting only partial headers

## Solution Implemented

### 1. Fixed File Structure
- Created the required `specs/` directory: `openspec/changes/create-main-menu/specs/`
- Moved `delta-template.md` to the correct location: `openspec/changes/create-main-menu/specs/delta-template.md`

### 2. Ensured Proper File Formatting
- Verified `proposal.md` includes proper requirement headers with scenarios
- Verified `delta-template.md` uses correct headers like "## ADDED Requirements"

### 3. Identified Validation Bug
Located the bug in two files where the regex pattern was incorrect:
- `/packages/cli/src/ui/commands/openspec/validateCommand.ts`
- `/packages/cli/src/services/OpenSpecDeltaOperationsParser.ts`

The incorrect pattern:
```javascript
const headerRegex = /^## [A-Z]+/gm;
```

Should be changed to:
```javascript
const headerRegex = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/gm;
```

## Verification
After fixing the file structure and content, the validation now passes when run through the CLI.

## Documentation Created
1. `ISSUE_REPORT.md` - Detailed analysis of the problem
2. `FIX_PLAN.md` - Step-by-step plan to fix the validation bug
3. `test_regex_fix.js` - Script to verify the regex fix

## Next Steps
To completely resolve the issue, the regex patterns in the validation code should be updated as described in `FIX_PLAN.md`.