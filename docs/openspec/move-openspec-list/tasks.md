# Implementation Tasks: Modify /openspec List Command to Exclude Archive Directory

## Overview
This document outlines the implementation tasks required to modify the `/openspec list` command to exclude the `archive` directory inside `openspec/changes`.

## Implementation Tasks

### 1. Modify List Command Implementation
- [ ] Identify the current implementation of the `/openspec list` command
- [ ] Locate the code responsible for scanning/gathering files in the `openspec/changes` directory
- [ ] Modify the file scanning logic to exclude any files or directories named `archive` within `openspec/changes`
- [ ] Ensure the exclusion is case-insensitive and handles various naming conventions (e.g., `Archive`, `ARCHIVE`)
- [ ] Verify that the exclusion only applies to the `archive` directory within `openspec/changes` and not other directories

### 2. Update Related Functionality
- [ ] Review any other commands or functions that might interact with the `openspec/changes` directory
- [ ] Check if other commands (like move, delete, etc.) need similar modifications
- [ ] Update any utility functions that scan or list files in the `openspec` directory structure
- [ ] Ensure backward compatibility with existing functionality
- [ ] Verify that archived files are still accessible through direct path references if needed

### 3. Testing
- [ ] Create test cases for the modified list command
- [ ] Test with various archive directory naming conventions
- [ ] Test with nested archive directories
- [ ] Verify that non-archive directories and files are still listed correctly
- [ ] Test edge cases (empty archive directory, archive directory with special characters)
- [ ] Run existing test suite to ensure no regressions
- [ ] Perform integration testing with the broader openspec workflow

### 4. Documentation Updates
- [ ] Update the openspec usage guide to reflect the change in list behavior
- [ ] Document the exclusion of archive directory in the command reference
- [ ] Add examples showing the difference in output with and without archive directory
- [ ] Update any relevant troubleshooting documentation
- [ ] Review and update the openspec developer guide if necessary

## Dependencies
- Understanding of the current openspec implementation
- Access to test environments
- Knowledge of the existing test framework

## Acceptance Criteria
- The `/openspec list` command excludes archive directories from its output
- All existing functionality remains intact
- All tests pass
- Documentation is updated and accurate