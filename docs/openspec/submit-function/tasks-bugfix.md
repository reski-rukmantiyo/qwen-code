# Tasks-Bugfix Documentation - Submit Function Dialog Issue - COMPLETED

## Problem Description
The `/openspec submit` command was incorrectly using dialogs from the proposal command, causing confusing behavior where:
- `/openspec submit` showed the same dialog as `/openspec proposal`
- The user experience didn't match the documented behavior in summary.md
- Dialog identifiers were incorrect for the submit function's purpose

## Root Cause Analysis
In `/Users/reski/Documents/GitHub/qwen-code/packages/cli/src/ui/commands/openspec/submitCommand.ts`:
1. Line ~45: Was using `'openspec_proposal_dir_selection'` instead of `'openspec_submit_change_selection'`
2. Line ~70: Was using `'openspec_proposal_description_input'` instead of proper activity selection dialog
3. Line ~80: Was using `'openspec_proposal_description_input'` instead of `'openspec_submit_description_input'`
4. Missing implementation of `'openspec_submit_activity_selection'` dialog

## Required Bug Fixes

### 1. Fix Dialog Identifiers
- [x] Replace `'openspec_proposal_dir_selection'` with `'openspec_submit_change_selection'`
- [x] Replace `'openspec_proposal_description_input'` with `'openspec_submit_activity_selection'` for activity selection
- [x] Replace `'openspec_proposal_description_input'` with `'openspec_submit_description_input'` for description input

### 2. Implement Missing Activity Selection Dialog
- [x] Create proper `'openspec_submit_activity_selection'` dialog implementation
- [x] Ensure dialog shows options for "bugs" and "features" activities

### 3. Update Dialog Response Handlers
- [x] Update `processSubmitChangeSelection` function to use correct dialog flow
- [x] Create `processSubmitActivitySelection` function
- [x] Update `processSubmitDescriptionInput` function to handle submit workflow

### 4. Verify Implementation Matches summary.md Specification
According to summary.md, the correct workflow should be:
1. `/openspec submit` → Lists available changes → `openspec_submit_change_selection` dialog
2. Select change → Prompt for activity type → `openspec_submit_activity_selection` dialog
3. Select activity → Prompt for description → `openspec_submit_description_input` dialog
4. Enter description → Process submission and update tasks.md

## Implementation Plan

### Step 1: Update Dialog Identifiers
```typescript
// Changed from:
dialog: 'openspec_proposal_dir_selection'
// To:
dialog: 'openspec_submit_change_selection'

// Changed from:
dialog: 'openspec_proposal_description_input'
// To:
dialog: 'openspec_submit_activity_selection' // for activity selection
// And:
dialog: 'openspec_submit_description_input' // for description input
```

### Step 2: Implement Missing Functions
Created the missing dialog processing functions that match the submit workflow rather than the proposal workflow.

### Step 3: Update Tests
Updated all tests to reflect the correct dialog identifiers and workflow.

## Expected Behavior After Fix
When running `/openspec submit`:
1. User sees a list of available changes (not a description input)
2. After selecting a change, user is prompted for activity type (bugs/features)
3. After selecting activity, user is prompted for description
4. Tasks are generated and appended to tasks.md
5. User receives confirmation message

This matches the documented behavior in summary.md and provides a clear distinction between the proposal and submit commands.

## Verification
- [x] All unit tests passing (8/8)
- [x] Correct dialog flow implemented
- [x] Implementation matches summary.md specification
- [x] No breaking changes to existing functionality