# Evaluation Criteria: Modify /openspec List Command to Exclude Archive Directory

## Overview
This document defines the success criteria and evaluation metrics for the implementation that modifies the `/openspec list` command to exclude the `archive` directory inside `openspec/changes`.

## Success Criteria

### Functional Requirements
1. **Primary Requirement**: The `/openspec list` command MUST exclude any directory named `archive` (case-insensitive) from its output when scanning the `openspec/changes` directory.
2. **Scope Limitation**: The exclusion MUST only apply to directories named `archive` within the `openspec/changes` path and not affect other directories or files.
3. **Preservation of Functionality**: All other functionality of the `/openspec list` command MUST remain unchanged.
4. **Backward Compatibility**: Existing workflows and integrations MUST continue to work without modification.

### Technical Requirements
1. **Code Quality**: Implementation MUST follow established coding standards and practices.
2. **Performance**: The modified command MUST not introduce significant performance degradation.
3. **Error Handling**: Appropriate error handling MUST be maintained for edge cases.
4. **Test Coverage**: Implementation MUST include adequate test coverage for the new functionality.

## Evaluation Metrics

### 1. Functional Testing
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Archive exclusion accuracy | 100% | Manual verification and automated tests |
| Non-archive inclusion accuracy | 100% | Manual verification and automated tests |
| Command functionality preservation | 100% | Regression test suite |
| Edge case handling | 100% | Specialized test cases |

### 2. Performance Testing
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Command execution time | ≤10% increase | Benchmark comparison |
| Memory usage | No significant increase | Resource monitoring |

### 3. Code Quality
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Code review score | ≥4/5 | Peer review |
| Test coverage | ≥80% | Coverage report |
| Linting compliance | 100% | Automated linting tools |

## Test Scenarios

### Primary Test Cases
1. **Basic Exclusion**: 
   - Given: A directory structure with `openspec/changes/archive` and other directories
   - When: Running `/openspec list`
   - Then: The `archive` directory should not appear in the output

2. **Case Insensitive Exclusion**:
   - Given: Directories named `Archive`, `ARCHIVE`, `ArChIvE` in `openspec/changes`
   - When: Running `/openspec list`
   - Then: All variations should be excluded from output

3. **Nested Directory Preservation**:
   - Given: A directory structure with `openspec/changes/subdir/archive`
   - When: Running `/openspec list`
   - Then: The `subdir` should be listed, but not its `archive` subdirectory

4. **Non-archive Directory Inclusion**:
   - Given: Directories named `archived`, `archives`, `my_archive` in `openspec/changes`
   - When: Running `/openspec list`
   - Then: These directories should still appear in the output

### Edge Case Test Cases
1. **Empty Archive Directory**:
   - Given: An empty `openspec/changes/archive` directory
   - When: Running `/openspec list`
   - Then: No output difference compared to when the directory doesn't exist

2. **Archive Directory with Special Characters**:
   - Given: A directory named `archivé` or `archivë` in `openspec/changes`
   - When: Running `/openspec list`
   - Then: These should not be excluded (only exact "archive" match)

3. **Multiple Archive Directories**:
   - Given: Multiple directories named `archive` in different subdirectories
   - When: Running `/openspec list`
   - Then: Only the one in `openspec/changes` should be excluded

## Acceptance Validation

### Approval Process
1. Implementation passes all defined test cases
2. Code review completed by senior team members
3. Documentation reviewed and approved
4. Performance benchmarks verified
5. Integration testing completed successfully

### Sign-off Criteria
- All success criteria met
- All test scenarios passing
- No critical or high severity issues identified
- Documentation updated and accurate
- Stakeholder approval obtained