# Implementation Plan for /openspec proposal Function

## Overview
This document outlines the implementation plan for the `/openspec proposal` function which will allow users to interactively create and manage OpenSpec change proposals through a guided workflow.

## Key Features
1. List all directory names under ./openspec/changes (exclude archive)
2. Allow user to select a change directory
3. Ask for "Description of the change"
4. Process files based on existence and content:
   - If files (proposal.md, tasks.md, design.md) don't exist: Generate them based on templates + description
   - If files exist:
     - Compare existing content with templates
     - If content matches template (still placeholder): Replace with new generated content
     - If content differs from template (has been modified):
       - Generate new content based on description
       - Create diff comparison (ADD/MODIFIED/REMOVE)
       - Save diff to: ./openspec/changes/[change-name]/spec/[LLM-generated-short-name]/spec.md
5. One-time task: Generate implementation tasks in @docs/openspec/proposal-function/tasks.md

## Implementation Steps

### Step 1: Directory Structure Initialization
- Create the openspec directory structure if it doesn't exist
- Ensure proper permissions and access

### Step 2: Directory Listing Feature
- Implement functionality to list directories under ./openspec/changes
- Exclude the archive directory from the listing
- Provide a user-friendly interface for selection

### Step 3: User Interaction Flow
- Implement the flow where user selects a directory name
- Store the selected change name in app memory
- Prompt user for "Description of the change"

### Step 4: File Processing Logic
- Check for existence of proposal.md, tasks.md, design.md files
- Implement template comparison logic
- Create file generation functionality based on templates
- Implement diff comparison mechanism
- Create diff saving functionality

### Step 5: Diff Generation and Storage
- Implement logic to generate diffs when content has been modified
- Create functionality to save diffs to the spec directory
- Ensure proper naming of diff files with LLM-generated short names

### Step 6: Documentation
- Create implementation tasks document in @docs/openspec/proposal-function/tasks.md
- Document the usage of the new function
- Update any relevant existing documentation

## Technical Considerations
- Use the templates from /packages/cli/src/ui/commands/openspec/changeCommand.ts as reference
- Ensure backward compatibility with existing OpenSpec functionality
- Handle edge cases such as missing directories, permission issues, etc.
- Implement proper error handling and user feedback mechanisms