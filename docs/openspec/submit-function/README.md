# Submit Function Documentation

## Overview
The submit function is an OpenSpec command that allows users to submit new change proposals with activity type and description. It integrates with the existing OpenSpec workflow to generate implementation tasks based on the provided information.

## Usage
```
/openspec submit [change-name] [activity] [description]
```

### Parameters
- `change-name`: The name of the change directory under `openspec/changes`
- `activity`: Either "bugs" or "features" to categorize the submission
- `description`: A detailed description of the change or fix

## Interactive Mode
If no parameters are provided, the submit command will operate in interactive mode:
1. Lists available changes (directories under `openspec/changes` excluding `archive`)
2. Prompts for activity type (bugs/features)
3. Prompts for description
4. Generates and appends tasks to the change's `tasks.md` file

## Workflow
1. Validates that OpenSpec is initialized in the project
2. Checks that the specified change directory exists
3. Verifies that required files (`proposal.md` and `design.md`) exist in the change directory
4. Generates implementation tasks based on the activity type and description
5. Appends the generated tasks to `tasks.md` in the change directory

## Requirements
- OpenSpec must be initialized in the project (`openspec` directory must exist)
- The specified change directory must exist under `openspec/changes`
- Both `proposal.md` and `design.md` must exist in the change directory before submitting

## Generated Content
The submit function generates implementation tasks that are appended to the existing `tasks.md` file. The generated content includes:
- A header with the activity type and timestamp
- The provided description
- A list of implementation tasks relevant to the activity type

## Examples
```
# Submit a bug fix with all parameters
/openspec submit login-feature bugs "Fix issue with login validation"

# Submit a feature request with all parameters
/openspec submit dashboard-rewrite features "Add dark mode toggle to dashboard"

# Use interactive mode
/openspec submit
```