# Submit Function Documentation

## Overview
The submit function is an OpenSpec command that allows users to submit new change proposals with activity type and description. It integrates with the existing OpenSpec workflow to generate implementation tasks based on the provided information.

Additionally, users can ask questions about the codebase without triggering any modifications.

## Usage
```
/openspec submit [change-name] [activity] [description]
```

### Question Mode
```
/openspec submit "question: your question here"
```

### Parameters
- `change-name`: The name of the change directory under `openspec/changes`
- `activity`: Either "bugs", "features", or "question" to categorize the submission
- `description`: A detailed description of the change, fix, or question

## Interactive Mode
If no parameters are provided, the submit command will operate in interactive mode:
1. Lists available changes (directories under `openspec/changes` excluding `archive`)
2. Prompts for activity type (bugs/features/question)
3. Prompts for description
4. For questions: Answers the question without making any changes
5. For bugs/features: Generates and appends tasks to the change's `tasks.md` file

## Question Mode Workflow
When using the question mode, the submit command:
1. Extracts relevant context from source code files based on keywords in the question
2. Sends the question and context to the AI for processing
3. Streams the response back to the user in real-time
4. Does not make any modifications to the codebase or OpenSpec files

## Standard Workflow
1. Validates that OpenSpec is initialized in the project
2. Checks that the specified change directory exists
3. Verifies that required files (`proposal.md` and `design.md`) exist in the change directory
4. Generates implementation tasks based on the activity type and description
5. Appends the generated tasks to `tasks.md` in the change directory

## Requirements
- OpenSpec must be initialized in the project (`openspec` directory must exist)
- The specified change directory must exist under `openspec/changes`
- Both `proposal.md` and `design.md` must exist in the change directory before submitting (for bugs/features)
- For questions: No specific requirements other than an initialized OpenSpec project

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

# Ask a question about the codebase
/openspec submit "question: how does the file search functionality work?"

# Use interactive mode
/openspec submit
```