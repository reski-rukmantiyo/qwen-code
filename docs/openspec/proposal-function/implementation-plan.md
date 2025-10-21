# Implementation Plan for /openspec proposal Function

## Overview
This document outlines the implementation plan for the `/openspec proposal` function which will allow users to interactively create and manage OpenSpec change proposals through a guided workflow.

## Key Features
1. List all directory names under ./openspec/changes (exclude archive)
2. Allow user to interactively select a change directory
3. Prompt user for "Description of the change" with input validation
4. Process files based on existence and content:
   - If files (proposal.md, tasks.md, design.md) don't exist: Generate them based on templates + description
   - If files exist:
     - Compare existing content with templates using structural matching
     - If content matches template (still placeholder): Replace with new generated content
     - If content differs from template (has been modified):
       - Generate new content based on description using LLM with heuristic fallback
       - Create detailed diff comparison (ADD/MODIFIED/REMOVE) with line-by-line analysis
       - Save diff to: ./openspec/changes/[change-name]/spec/[LLM-generated-meaningful-short-name]/spec.md
5. One-time task: Generate implementation tasks in @docs/openspec/proposal-function/tasks.md

## Implementation Steps

### Step 1: Directory Structure Initialization
- Create the openspec directory structure if it doesn't exist
- Ensure proper permissions and access
- Define template detection criteria and placeholder identification rules

### Step 2: Interactive Directory Listing Feature
- Implement functionality to list directories under ./openspec/changes
- Exclude the archive directory from the listing
- Provide an interactive user interface for selection with cancellation handling

### Step 3: Enhanced User Interaction Flow
- Implement the flow where user interactively selects a directory name
- Store the selected change name in app memory
- Prompt user for "Description of the change" with input validation
- Handle empty descriptions gracefully with retry prompts
- Add input cancellation handling

### Step 4: Robust File Processing Logic
- Check for existence of proposal.md, tasks.md, design.md files
- Implement comprehensive template comparison logic using structural matching and hash-based comparison
- Create file generation functionality based on templates
- Implement diff comparison mechanism with proper line-by-line analysis
- Create diff saving functionality with proper error handling

### Step 5: Advanced Diff Generation and Storage
- Implement logic to generate detailed diffs when content has been modified
- Create functionality to save diffs to the spec directory with proper formatting
- Ensure proper naming of diff files with LLM-generated meaningful short names
- Add fallback naming strategy for when LLM is unavailable
- Ensure generated spec.md files follow the exact specification format

### Step 6: Specification Format Compliance
- Implement validation for requirement and scenario structures
- Add parsing of existing specification content for accurate delta creation

### Step 7: Integration and Testing
- Integrate the new function with existing OpenSpec commands
- Test the complete workflow with various scenarios
- Handle edge cases such as missing directories, permission issues, etc.
- Implement proper error handling and user feedback mechanisms
- Add unit tests for core functions
- Implement integration tests for the full workflow
- Create test cases for edge scenarios and error conditions

### Step 8: Documentation
- Create implementation tasks document in @docs/openspec/proposal-function/tasks.md
- Document the usage of the new function
- Update any relevant existing documentation
- Create examples and use cases for users
- Document troubleshooting steps and common error resolutions

## Technical Considerations
- Use the templates from /packages/cli/src/ui/commands/openspec/changeCommand.ts as reference
- Ensure backward compatibility with existing OpenSpec functionality
- Handle edge cases such as missing directories, permission issues, etc.
- Implement proper error handling and user feedback mechanisms
- Use existing OpenSpec diff utilities as reference for implementing proper diff algorithms
- Ensure generated content complies with OpenSpec formatting standards
- Implement graceful degradation when LLM is unavailable