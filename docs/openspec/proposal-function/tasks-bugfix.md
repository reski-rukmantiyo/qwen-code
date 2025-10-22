# Bug Fixes for /openspec proposal Function

## Overview
This document tracks bug fixes and improvements for the `/openspec proposal` function, specifically addressing issues with tool mentions in generated content.

## Identified Bugs

### 1. Tool Mentions in Generated Content
- **Issue**: LLM-generated content in proposal.md and tasks.md sometimes includes tool references that should be removed
- **Impact**: Generated documentation contains implementation details that should be abstracted away
- **Priority**: High

## Fix Plan

### Task 1: Update Content Generation Prompts
- Modify prompts used for generating proposal.md to explicitly exclude tool mentions
- Update prompts used for generating tasks.md to explicitly exclude tool mentions
- Add validation to ensure generated content doesn't contain tool references

### Task 2: Implement Content Filtering
- Add post-processing step to filter out tool mentions from generated content
- Create a list of disallowed terms that should not appear in generated documentation
- Implement validation to reject content that contains disallowed terms

### Task 3: Update Test Cases
- Modify existing test cases to verify that generated content doesn't contain tool mentions
- Add new test cases specifically for content filtering functionality
- Update test expectations to match the new behavior

## Implementation Steps

1. Update the `generateProposalContent` function to include explicit instructions about avoiding tool mentions
2. Update the `generateTasksContent` function to include explicit instructions about avoiding tool mentions
3. Add a content filtering function that removes or flags inappropriate content
4. Integrate the content filtering into the generation pipeline
5. Update unit tests to verify the new behavior
6. Run integration tests to ensure the fix works end-to-end

## Completed Implementation

All implementation steps have been completed:

1. ✅ Updated the `generateProposalContent` function to include explicit instructions about avoiding tool mentions in the prompt
2. ✅ Updated the `generateTasksContent` function to include explicit instructions about avoiding tool mentions in the prompt
3. ✅ Added a `filterToolMentions` function that removes lines containing tool references from generated content
4. ✅ Integrated the content filtering into the generation pipeline for both LLM and heuristic fallback paths
5. ✅ Updated unit tests to verify the new behavior
6. ✅ Ran integration tests to ensure the fix works end-to-end

## Verification Results

After implementing these fixes, we have verified that:

- ✅ Generated proposal.md files don't contain tool mentions
- ✅ Generated tasks.md files don't contain tool mentions
- ✅ The content still follows the required template structure
- ✅ All existing functionality remains intact
- ✅ Tests pass successfully
- ✅ Build completes without errors

## Technical Details

### Content Filtering Approach

The solution implements a two-layer approach to prevent tool mentions in generated content:

1. **Prompt Engineering**: Updated prompts explicitly instruct the LLM to avoid mentioning tools
2. **Post-processing Filter**: Added a `filterToolMentions` function that removes lines containing tool references

### Filter Implementation

The `filterToolMentions` function uses regex patterns to identify and remove lines containing tool call references, focusing on actual tool usage patterns rather than simple keyword matching to avoid false positives.

### Heuristic Fallback

The heuristic fallback functions were also updated to apply the same filtering to ensure consistency between LLM-generated and heuristic-generated content.

## Test Results

- All proposalCommand tests pass (6/6)
- All proposalCommand bugfix tests pass (2/2)
- Build completes successfully
- No regressions in related functionality