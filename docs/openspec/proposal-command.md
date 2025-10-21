# /openspec proposal Command

## Overview
The `/openspec proposal` command provides an interactive workflow for creating and managing OpenSpec change proposals. It allows users to select existing change directories, review current files, and generate updated content based on descriptions.

## Usage
```
/openspec proposal [change-directory]
```

If no change directory is specified, the command will use the first available directory in the `openspec/changes` folder.

## Features
1. **Directory Listing**: Lists all available change directories under `openspec/changes` (excluding the archive directory)
2. **File Status Checking**: Checks the status of proposal.md, tasks.md, and design.md files in the selected directory
3. **Template Detection**: Identifies whether files contain template placeholder content or user-modified content
4. **Content Generation**: Generates new content based on user descriptions using either LLM or heuristic-based approaches
5. **Diff Generation**: Creates structured diffs showing added, modified, or removed requirements
6. **Specification Saving**: Saves diffs to the appropriate specification directory with generated short names

## Workflow
1. List available change directories
2. Select a change directory (interactive or specified via arguments)
3. Check existing files for template content
4. Prompt user for change description
5. Generate new content based on description
6. Compare new content with existing content
7. Generate structured diff
8. Save diff to specification directory

## File Structure
The command works with the standard OpenSpec change directory structure:
```
openspec/
  changes/
    [change-name]/
      proposal.md
      tasks.md
      design.md
      specs/
        [short-name]/
          spec.md
```

## Implementation Details
- Uses LLM generation when available, with heuristic-based fallback
- Detects template content by looking for specific placeholder phrases
- Generates structured diffs with ADD/MODIFY/REMOVE operations
- Creates specification files in the standardized OpenSpec format