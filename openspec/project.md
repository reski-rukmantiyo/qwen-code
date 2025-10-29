# Project Conventions

This file defines the project-specific conventions and guidelines for using OpenSpec in this project.

## Naming Conventions

- Change folders should use verb-led prefixes (add-, update-, remove-, refactor-)
- Use kebab-case for all file and directory names
- Specification files should be named descriptively and match their content

## Specification Guidelines

- All specifications should follow the standard OpenSpec format
- Include concrete examples and scenarios for all requirements
- Use normative language (SHALL/MUST, SHOULD/RECOMMENDED, MAY/OPTIONAL)

## Change Management

- Create small, focused changes (<100 lines of new code per change)
- Prefer single-file implementations until proven insufficient
- Write clear, actionable task descriptions

## Review Process

- All changes should be reviewed before implementation
- Validate changes with `/openspec validate` before applying
- Archive completed changes with `/openspec archive`

## Question Feature

- Use `/openspec submit [change-name] question [your-question]` to ask questions about the codebase
- Questions are processed without making any changes to the codebase
- The system will provide context-aware answers based on relevant source code files

### Usage Examples

1. **Direct Question Syntax**:
   ```
   /openspec submit "question: how does the file search functionality work?"
   ```

2. **Interactive Question Mode**:
   ```
   /openspec submit
   # Then select a change, choose "question" as activity type, and enter your question
   ```

3. **Question About Specific Change**:
   ```
   /openspec submit my-change question "What files are modified in this change?"
   ```

4. **Technical Implementation Questions**:
   ```
   /openspec submit "question: how does the LLM integration work in this project?"
   ```

5. **Architecture Questions**:
   ```
   /openspec submit "question: what is the directory structure of the OpenSpec implementation?"
   ```

## Team-Specific Notes

Add any project-specific notes, conventions, or guidelines here.
