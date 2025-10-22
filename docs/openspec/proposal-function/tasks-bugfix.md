# Bug Fixes for /openspec proposal Function

## Identified Bugs
1. When running "/openspec proposal", it won't allow user to choose directory under ./openspec/changes directory
2. There is no description textbox after directory selection
3. When running "/openspec proposal", it doesn't do anything
4. The generated content inside proposal.md, tasks.md, design.md is not using the template of its file
5. The content should be clean
6. Two directories are being processed and shown in the output when only one should be processed
7. When creating proposal.md, tasks.md, design.md, the system attempts to create code instead of focusing only on documentation
8. Content under "specs" directory after "/openspec proposal" executed should not be there - it should be created under ./openspec/specs directory after "/openspec archive"
9. Methods to differentiate proposal.md, design.md and tasks.md should be removed
10. In tasks.md, subagents that match with the tasks should be added
11. When running "/openspec proposal", directory selection dialog doesn't appear even when directories exist
12. After directory selection, description input dialog doesn't appear
13. There's no message after inputting description in "/openspec proposal" flow - it should show a message to wait while content of proposal.md, tasks.md, design.md is generated
14. Content of tasks.md should contain tasks to create source code based on proposal.md and design.md, with information about which subagent should be involved in source code creation (but this is only for tasks documentation)
15. Message while waiting is not proper - duplicated messages and should be in 1 line
16. Content of tasks.md and proposal.md is not created - files should be replaced with new content
17. Waiting message still appears on multiple lines instead of a single line
18. Content of tasks.md is still not proper

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

### Bug 4: Generated Content Not Using File Templates
- **Location**: Content generation in proposalCommand.ts and processProposalDescription function
- **Impact**: Generated files don't follow the expected structure and format, making them inconsistent with OpenSpec standards
- **Root Cause**: The content generation logic may not be properly using the template structure for each file type

### Bug 5: Content Quality Issues
- **Location**: Content generation algorithms in proposalCommand.ts
- **Impact**: Generated content may be messy, repetitive, or not well-structured
- **Root Cause**: The content generation logic may lack proper formatting and cleaning mechanisms

### Bug 6: Duplicate Processing and Output
- **Location**: Process flow in proposalCommand.ts and processProposalDescription function
- **Impact**: Users see confusing duplicate output messages and potentially incorrect diff file generation
- **Root Cause**: The command may be executing twice or there's a duplicate callback in the processing flow

### Bug 7: Incorrect Focus on Code Creation Instead of Documentation
- **Location**: Content generation logic in proposalCommand.ts
- **Impact**: Generated content may include implementation details or code snippets instead of focusing on documentation and specifications
- **Root Cause**: The content generation prompts may be encouraging LLM to generate code implementation details rather than documentation-focused content

### Bug 8: Incorrect Location for Specs Directory Content
- **Location**: Diff generation and saving logic in proposalCommand.ts
- **Impact**: Specification diff files are being created in the wrong location (./openspec/changes/[change-name]/spec/) instead of the correct location (./openspec/specs/)
- **Root Cause**: The diff saving functionality was implemented incorrectly and should only be triggered during the archive process, not during proposal creation

### Bug 9: Unnecessary File Differentiation Logic
- **Location**: Template comparison and file processing logic in proposalCommand.ts
- **Impact**: Overly complex logic for differentiating between file types that is no longer needed
- **Root Cause**: The original implementation plan included complex file differentiation that is not required for the simplified proposal workflow

### Bug 10: Missing Subagent Information in Tasks
- **Location**: Task generation logic in proposalCommand.ts
- **Impact**: Generated tasks.md files don't include subagent information that would help match tasks with appropriate AI assistants
- **Root Cause**: The task generation logic doesn't consider subagent matching when creating implementation tasks

### Bug 11: Directory Selection Dialog Not Appearing
- **Location**: Command execution flow in proposalCommand.ts and UI rendering in App.tsx
- **Impact**: Users cannot select existing change directories even when they exist, preventing them from updating existing proposals
- **Root Cause**: The dialog request may not be properly handled or rendered in the UI layer

### Bug 12: Description Input Dialog Not Appearing
- **Location**: Process flow in proposalCommand.ts and UI rendering in App.tsx
- **Impact**: Users cannot provide a description for their change after selecting a directory
- **Root Cause**: The dialog request may not be properly handled or rendered in the UI layer

### Bug 13: Missing Progress Message During Content Generation
- **Location**: Process flow in proposalCommand.ts and processProposalDescription function
- **Impact**: Users don't receive feedback during the content generation process, leading to uncertainty about whether the system is working
- **Root Cause**: The processProposalDescription function doesn't provide progress updates or status messages during file generation

### Bug 14: Incorrect Task Content in tasks.md
- **Location**: Content generation logic in proposalCommand.ts
- **Impact**: Generated tasks.md files don't contain appropriate tasks for source code creation based on the proposal and design documents
- **Root Cause**: The task generation logic may not be properly considering the need to create implementation tasks based on the generated documentation

### Bug 15: Duplicated and Improper Progress Messages
- **Location**: Process flow in proposalCommand.ts and processProposalDescription function
- **Impact**: Users see duplicated progress messages which are confusing and not properly formatted
- **Root Cause**: The progress message implementation may be adding messages multiple times or not properly managing message display

### Bug 16: Content Not Created/Replaced in Files
- **Location**: File processing logic in proposalCommand.ts and processProposalDescription function
- **Impact**: Generated content is not properly written to proposal.md and tasks.md files
- **Root Cause**: The file writing logic may not be properly replacing existing content or may have issues with file operations

### Bug 17: Improper Progress Message Formatting
- **Location**: Process flow in proposalCommand.ts and processProposalDescription function
- **Impact**: Progress messages appear on multiple lines instead of a single line, causing visual clutter
- **Root Cause**: The progress message implementation may not be properly formatting messages or there may be duplicate message additions

### Bug 18: Incorrect Task Content in tasks.md
- **Location**: Content generation logic in proposalCommand.ts
- **Impact**: Generated tasks.md files don't contain appropriate or properly formatted content for source code creation
- **Root Cause**: The task generation logic may not be properly considering the need to create implementation tasks based on the generated documentation or formatting tasks correctly

### Bug 19: Content Not Created/Replaced in Files
- **Location**: File processing logic in proposalCommand.ts and processProposalDescription function
- **Impact**: Generated content is not properly written to proposal.md and tasks.md files
- **Root Cause**: The file writing logic may not be properly replacing existing content or may have issues with file operations

### Bug 20: Improper Progress Message Formatting
- **Location**: Process flow in proposalCommand.ts and processProposalDescription function
- **Impact**: Progress messages appear on multiple lines instead of a single line, causing visual clutter
- **Root Cause**: The progress message implementation may not be properly formatting messages or there may be duplicate message additions

### Bug 21: Incorrect Task Content in tasks.md
- **Location**: Content generation logic in proposalCommand.ts
- **Impact**: Generated tasks.md files don't contain appropriate or properly formatted content for implementation
- **Root Cause**: The task generation logic may not be properly structuring tasks for implementation or including necessary details

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

### Task 7: Fix Template Usage in Generated Content
- [x] Investigate why generated content is not using proper file templates
- [x] Review template structure for proposal.md, tasks.md, and design.md files
- [x] Ensure content generation follows the correct template structure for each file type
- [x] Implement proper template-based content generation
- [x] Test template usage with various input scenarios

### Task 8: Improve Content Quality and Cleanliness
- [x] Analyze current content generation algorithms for quality issues
- [x] Implement content cleaning and formatting mechanisms
- [x] Ensure generated content is well-structured and readable
- [x] Add validation for content quality before writing to files
- [x] Test content quality with various input descriptions

### Task 9: Fix Duplicate Processing and Output Issue
- [x] Investigate why the command is processing twice and showing duplicate output
- [x] Check for duplicate callbacks or event triggers in the processing flow
- [x] Ensure the processProposalDescription function is only called once per user action
- [x] Verify that diff files are generated correctly without duplication
- [x] Test the fix with various scenarios to ensure single execution

### Task 10: Fix Content Focus to Documentation Only
- [x] Investigate why the content generation includes code implementation details
- [x] Update LLM prompts to focus exclusively on documentation and specifications
- [x] Ensure generated content for proposal.md, tasks.md, and design.md focuses on documentation
- [x] Remove any code generation or implementation details from the generated content
- [x] Test the updated prompts with various input scenarios to ensure documentation focus

### Task 11: Remove Incorrect Specs Directory Creation
- [x] Identify and remove all code related to creating content under "specs" directory during proposal execution
- [x] Ensure no diff files are generated during proposal creation
- [x] Verify that specs directory content creation is handled only during "/openspec archive" command
- [x] Remove all documentation related to incorrect specs directory creation
- [x] Test that proposal creation no longer generates unwanted specs directory content

### Task 12: Remove Unnecessary File Differentiation Logic
- [x] Identify and remove all methods used to differentiate between proposal.md, design.md and tasks.md files
- [x] Simplify file processing logic to treat all files uniformly
- [x] Remove template comparison and hash-based differentiation logic
- [x] Ensure file processing focuses only on creation/updating without complex differentiation
- [x] Test simplified file processing with various scenarios

### Task 13: Add Subagent Information to Tasks
- [x] Update task generation logic to include subagent information in tasks.md
- [x] Implement subagent matching based on task types
- [x] Ensure generated tasks include appropriate subagent recommendations
- [x] Test task generation with subagent information for various input scenarios
- [x] Verify that subagent information is properly formatted and useful

### Task 14: Fix Directory Selection Dialog Not Appearing
- [x] Investigate why the directory selection dialog doesn't appear even when directories exist
- [x] Check command execution flow in proposalCommand.ts
- [x] Verify UI rendering logic in App.tsx for the dialog
- [x] Test directory selection with various scenarios (empty directory, multiple directories, special characters)
- [x] Ensure the dialog appears and functions correctly

### Task 15: Fix Description Input Dialog Not Appearing
- [x] Investigate why the description input dialog doesn't appear after directory selection
- [x] Check process flow in proposalCommand.ts
- [x] Verify UI rendering logic in App.tsx for the dialog
- [x] Test description input with various scenarios (empty input, long text, special characters)
- [x] Ensure the dialog appears and functions correctly

### Task 16: Add Progress Message During Content Generation
- [x] Investigate why no progress message is shown during content generation
- [x] Add status messages to inform users that content is being generated
- [x] Implement progress updates during file creation process
- [x] Test progress messaging with various scenarios
- [x] Ensure messages are clear and informative to the user

### Task 17: Fix Task Content in tasks.md
- [x] Investigate why tasks.md doesn't contain appropriate source code creation tasks
- [x] Update task generation logic to include implementation tasks based on proposal.md and design.md
- [x] Ensure tasks include subagent recommendations for source code creation
- [x] Test task generation with various input scenarios
- [x] Verify that generated tasks are properly formatted and useful for implementation

### Task 18: Fix Duplicated and Improper Progress Messages
- [x] Investigate why progress messages are duplicated and improperly formatted
- [x] Ensure progress messages are displayed only once
- [x] Format progress messages to appear on a single line
- [x] Test message display with various scenarios
- [x] Verify that messages are clear and informative to the user

### Task 19: Fix Content Creation/Replacement in Files
- [x] Investigate why content is not properly created/replaced in proposal.md and tasks.md
- [x] Ensure file writing operations properly replace existing content
- [x] Verify that generated content is correctly written to all files
- [x] Test file creation and replacement with various scenarios
- [x] Ensure proper error handling for file operations

### Task 20: Fix Progress Message Formatting
- [x] Investigate why progress messages are appearing on multiple lines
- [x] Ensure progress messages are formatted to appear on a single line
- [x] Remove any duplicate message additions
- [x] Test message formatting with various scenarios
- [x] Verify that messages are clear and properly formatted

### Task 21: Fix Task Content in tasks.md
- [x] Investigate why tasks.md content is not proper
- [x] Ensure generated tasks are properly formatted and useful
- [x] Verify that tasks include appropriate subagent recommendations
- [x] Test task generation with various input scenarios
- [x] Ensure tasks are properly structured for implementation