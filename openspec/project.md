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

## Team-Specific Notes

Add any project-specific notes, conventions, or guidelines here.
