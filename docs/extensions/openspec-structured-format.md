# Structured Specification Format

Qwen Code's OpenSpec integration uses a structured specification format to ensure consistency and enable better validation. This format is based on requirement headers and scenario definitions.

## Specification Structure

Specifications follow a hierarchical structure:

```
# Specification Title

### Requirement: Requirement Name
Description of the requirement.

#### Scenario: Scenario Name
Description of a specific scenario for this requirement.

#### Scenario: Another Scenario
Description of another scenario.

### Requirement: Another Requirement
Description of another requirement.

#### Scenario: Scenario for Second Requirement
Description of a scenario for the second requirement.
```

Note: Specifications do not require an "## Overview" section as part of the structured format validation.

## Requirement Headers

Requirement headers use the format:

```markdown
### Requirement: Brief Description
```

Requirements should:
- Be unique within a specification
- Clearly describe a specific functionality or constraint
- Be concise but descriptive

## Scenario Headers

Scenario headers use the format:

```markdown
#### Scenario: Brief Description
```

Scenarios should:
- Be unique within a requirement
- Describe a specific use case or condition
- Include both normal and edge cases
- Be detailed enough to guide implementation and testing

## Parsing and Formatting Methods

The `SpecificationValidator` class provides methods for parsing and formatting specifications:

- `parseSpecificationRequirements(content: string): SpecificationRequirement[]` - Parses specification content to extract requirements and scenarios
- `formatSpecificationRequirements(requirements: SpecificationRequirement[]): string` - Formats requirements back to structured specification markdown

## Example Specification

```markdown
# User Authentication API

### Requirement: User Login
The system shall allow users to authenticate with email and password.

#### Scenario: Valid Credentials
When a user provides valid email and password credentials, the system should return an authentication token.

#### Scenario: Invalid Credentials
When a user provides invalid credentials, the system should return an appropriate error message.

### Requirement: Password Reset
The system shall allow users to reset their password via email.

#### Scenario: Request Password Reset
When a user requests a password reset, the system should send an email with a reset link.
```

## Validation Rules

Specifications are validated by the `SpecificationValidator.validateSpecificationFormat()` method for:

- Presence of at least one requirement header (starting with "### Requirement:")
- Proper formatting of requirement headers (must start with "Requirement:" followed by non-empty content)
- Proper formatting of scenario headers (must start with "Scenario:" followed by non-empty content)
- Unique requirement headers within the specification
- Unique scenario headers within each requirement
- Non-empty requirement and scenario headers

## Requirement and Scenario Structure

The `SpecificationValidator` class defines the following interfaces for requirements and scenarios:

```typescript
interface SpecificationRequirement {
  header: string;
  scenarios: SpecificationScenario[];
}

interface SpecificationScenario {
  header: string;
  description: string;
}
```

## Benefits

The structured format provides several benefits:
- Enables automated validation of specification quality
- Facilitates requirement traceability
- Supports better organization of complex specifications
- Allows for programmatic processing of specifications
- Improves collaboration by providing clear structure