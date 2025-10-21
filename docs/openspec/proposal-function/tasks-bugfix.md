# Bug Fixes for /openspec proposal Function

## Identified Bugs
1. When running "/openspec proposal", it won't allow user to choose directory under ./openspec/changes directory
2. There is no description textbox after directory selection
3. When running "/openspec proposal", it doesn't do anything

## Bug Analysis

### Bug 1: Directory Selection Not Working
- **Location**: Interactive directory listing feature in proposalCommand.ts
- **Impact**: Users cannot select existing change directories, preventing them from updating existing proposals
- **Root Cause**: The command returns a dialog action but the UI dialog for directory selection was not properly connected to the App component
- **Code Reference**: `return { type: 'dialog', dialog: 'openspec_proposal_dir_selection', data: { directories: directories } }`

### Bug 2: Missing Description Prompt
- **Location**: Description input phase in proposalCommand.ts
- **Impact**: Users cannot provide a description for their change, which is required for proposal generation
- **Root Cause**: The command returns a dialog action for description input but the UI dialog was not properly connected to the App component
- **Code Reference**: `return { type: 'dialog', dialog: 'openspec_proposal_description_input', data: { directory: selectedDir, fileStatus: fileStatus, allFilesExist: allFilesExist } }`

### Bug 3: Command Does Nothing
- **Location**: Command execution flow in proposalCommand.ts
- **Impact**: Users get no response when running the command, making the feature unusable
- **Root Cause**: The command may not be properly registered or there might be an issue in the command processing flow that prevents it from executing

## Fix Tasks

### Task 1: Fix Directory Selection Dialog Implementation
- [x] Implement the 'openspec_proposal_dir_selection' dialog in the UI layer
- [x] Ensure the dialog properly displays the list of available change directories
- [x] Implement selection mechanism that returns the chosen directory back to the command
- [x] Add proper error handling for cases when no directories exist
- [x] Test directory selection with various scenarios (empty directory, multiple directories, special characters)
- [x] Ensure the dialog integrates properly with the command flow

### Task 2: Implement Description Input Dialog
- [x] Implement the 'openspec_proposal_description_input' dialog in the UI layer
- [x] Create a text input field for users to enter their change description
- [x] Add input validation for user descriptions (length, characters, etc.)
- [x] Handle empty descriptions gracefully with retry prompts or cancellation
- [x] Ensure the dialog properly returns the description back to the command processing function
- [x] Test description prompt with various inputs (empty, long text, special characters)

### Task 3: Connect Dialogs to Command Processing
- [x] Implement the dialog handling mechanism that routes user input back to the appropriate command functions
- [x] Ensure the selected directory from the first dialog is properly passed to the description dialog
- [x] Verify that the description input is correctly processed by the `processProposalDescription` function
- [x] Add proper state management for the multi-step dialog flow
- [x] Implement cancellation handling for both dialogs

### Task 4: Integration Testing
- [x] Test the complete workflow with directory selection and description input
- [x] Verify that existing directories can be selected and updated
- [x] Confirm that new proposals can be created with proper description
- [x] Test edge cases such as nonexistent directories, permission issues, etc.
- [x] Validate that the fix works across different operating systems

### Task 5: Documentation Update
- [x] Update implementation plan to reflect bug fixes
- [x] Document the dialog-based interaction pattern for future reference
- [x] Add troubleshooting steps for dialog implementation issues
- [x] Update any relevant developer documentation about the UI dialog system

### Task 6: Fix Command Execution Issue
- [x] Investigate why "/openspec proposal" command doesn't execute
- [x] Check command registration in the command system
- [x] Verify command processing flow in slashCommandProcessor.ts
- [x] Add proper error handling and user feedback
- [x] Test command execution with various scenarios