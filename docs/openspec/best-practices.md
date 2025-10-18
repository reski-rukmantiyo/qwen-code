# OpenSpec Best Practices

This document outlines best practices for using OpenSpec effectively within Qwen Code to ensure successful specification-driven development.

## Table of Contents

1. [Specification Writing](#specification-writing)
2. [Change Management](#change-management)
3. [Working with AI](#working-with-ai)
4. [File Organization](#file-organization)
5. [Validation and Quality](#validation-and-quality)
6. [Cache Management](#cache-management)
7. [Collaboration](#collaboration)
8. [Implementation Status](#implementation-status)

## Specification Writing

### Be Specific and Detailed

Specifications should leave no room for ambiguity. Instead of saying "implement user authentication," specify exactly what that means:

**Avoid:**
```
Implement user authentication
```

**Prefer:**
```
Implement email/password authentication with JWT tokens, including:
- User registration with email verification
- Login with email/password
- Password reset via email
- Account lockout after 5 failed attempts
```

### Include Concrete Examples

Examples make specifications clearer and easier to implement:

```markdown
### POST /api/users
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "12345",
    "email": "user@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```
```

### Consider Edge Cases

Document how the system should handle error conditions and edge cases:

```markdown
## Error Responses

### Invalid Input (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Resource Not Found (404 Not Found)
```json
{
  "error": "Resource not found",
  "message": "User with ID 12345 not found"
}
```
```

### Keep Specifications Up to Date

As requirements evolve, update your specifications to reflect the current understanding:

- Review specifications regularly
- Update them when requirements change
- Archive outdated specifications
- Communicate changes to team members

## Change Management

### Create Focused Changes

Each change should address a single, well-defined problem or feature:

**Avoid:** A change that "improves the entire authentication system"
**Prefer:** Separate changes for "add password reset," "add two-factor authentication," and "refactor authentication services"

### Write Meaningful Change Names

Use descriptive names that clearly indicate what the change accomplishes:

**Good:**
- `add-password-reset-functionality`
- `refactor-authentication-services`
- `implement-user-profile-management`

**Avoid:**
- `fix-auth` (too vague)
- `auth-changes` (doesn't specify what changes)
- `new-feature` (doesn't describe the feature)

### Provide Complete Information

Each change should include all necessary information:

1. **proposal.md**: Why and what you're changing
2. **tasks.md**: Specific implementation steps
3. **design.md**: Technical approach and decisions
4. **specs/**: Exact specification changes

### Validate Before Implementation

Always validate your changes before asking AI to implement them:

```
/openspec validate <change-name>
```

This catches issues early and ensures all required files are present.

### Apply Changes with the Apply Command

Once you've defined your tasks in the tasks.md file, use the apply command to submit them to AI for implementation:

```
/openspec apply <change-name>
```

This command will submit the tasks defined in your change's tasks.md file to the AI for implementation, ensuring that the implementation follows your specifications exactly.

## Working with AI

### Reference Specifications Explicitly

When asking Qwen Code to implement something, always reference the relevant specifications:

**Better:**
```
Please implement the password reset functionality as specified in /openspec/changes/add-password-reset. Follow the tasks listed in tasks.md and ensure the implementation matches the technical design.
```

**Less Effective:**
```
Add password reset to the app
```

### Provide Context for Complex Changes

For complex changes, provide additional context to help AI understand the requirements:

```
This is a complex refactoring that involves separating the authentication logic into distinct service classes. Please pay special attention to maintaining backward compatibility and following the dependency injection pattern described in the design document.
```

### Review and Iterate

AI-generated code should be reviewed against specifications:

1. Check that all requirements are met
2. Verify that the implementation matches the design
3. Test edge cases and error conditions
4. Update specifications if implementation reveals issues

### Use Tasks Effectively

Write tasks that are specific and actionable for AI:

**Good:**
```markdown
- [ ] Create POST /api/auth/request-reset endpoint that generates a cryptographically secure token and sends it via email
- [ ] Implement token hashing before storing in database
- [ ] Add rate limiting of 5 requests per hour per email address
```

**Less Effective:**
```markdown
- [ ] Add password reset functionality
- [ ] Handle security
```

## File Organization

### Organize Specifications by Domain

Group related specifications together:

```
openspec/specs/
├── auth/
│   ├── user-authentication.md
│   └── password-policy.md
├── api/
│   ├── rest-endpoints.md
│   └── rate-limiting.md
├── database/
│   ├── schema.md
│   └── migrations.md
└── ui/
    ├── design-system.md
    └── component-library.md
```

### Use Consistent Naming Conventions

Follow consistent naming patterns:

- Use kebab-case for file and directory names
- Use descriptive names that indicate content
- Maintain consistent structure across similar files

### Keep Files Manageable

Avoid extremely large specification files:

- Break large specifications into logical sections
- Use separate files for different aspects of a system
- Link related specifications rather than duplicating content

## Validation and Quality

### Regular Validation

Validate changes regularly during development:

```
/openspec validate <change-name>
```

### Peer Review

Have team members review specifications before implementation:

- Check for completeness
- Verify technical feasibility
- Ensure clarity and precision
- Identify missing edge cases

### Automated Checking

Where possible, use automated tools to check specification quality:

- Linting for markdown files
- Validation of JSON examples
- Consistency checking across related specifications

### Quality Metrics

Track specification quality metrics:

- Completeness (required sections present)
- Clarity (understandable by team members)
- Consistency (follows established patterns)
- Currency (up to date with implementation)

## Cache Management

### When to Clear the Cache

Clear the OpenSpec cache when:

- You've made significant changes to specification files that aren't being reflected
- You're experiencing performance issues that might be cache-related
- You suspect the cache contains stale or corrupted data
- You want to ensure a clean state before important operations

To clear only the cache (preserving your files):
```
/openspec clear --cache-only
```

To completely reset OpenSpec (removing all files):
```
/openspec clear
```

### Cache Performance Considerations

For optimal cache performance:

- Avoid extremely large specification files that can slow cache operations
- Organize specifications into smaller, focused documents
- Regularly clean up unused or archived specifications
- Monitor cache performance and clear when needed

### Cache Troubleshooting

If you encounter issues that might be cache-related:

1. Try clearing the cache first:
   ```
   /openspec clear --cache-only
   ```

2. If issues persist, you can completely reset OpenSpec:
   ```
   /openspec clear
   ```

3. If issues persist after a full reset, check for:
   - Very large specification files
   - File permission issues
   - Disk space limitations

## Collaboration

### Version Control

Use version control effectively for specifications:

- Commit specifications with meaningful messages
- Review changes in pull requests
- Tag releases that correspond to specification versions
- Branch for experimental specifications

### Communication

Communicate specification changes to team members:

- Announce major specification updates
- Discuss controversial or complex specifications
- Document decisions made during specification development
- Share templates and best practices

### Team Onboarding

Help new team members understand the specification process:

- Provide documentation on OpenSpec workflow
- Show examples of well-written specifications
- Pair on creating first specifications
- Review early attempts for feedback

### Continuous Improvement

Regularly assess and improve your specification practices:

- Retrospective on specification effectiveness
- Gather feedback from implementers
- Update templates and guidelines
- Share lessons learned across the team

## Common Pitfalls to Avoid

### Vague Requirements

Avoid specifications that are open to interpretation:

**Avoid:**
```
The system should be fast.
```

**Prefer:**
```
API responses should return within 200ms for 95% of requests under normal load conditions.
```

### Missing Context

Don't assume shared understanding of business context:

**Avoid:**
```
Implement the checkout flow.
```

**Prefer:**
```
Implement a checkout flow that supports credit card payments, applies promotional codes, calculates tax based on shipping address, and sends order confirmation emails.
```

### Incomplete Error Handling

Don't forget to specify how errors should be handled:

**Avoid:**
```
Create a user registration endpoint.
```

**Prefer:**
```
Create a user registration endpoint that handles duplicate email addresses, invalid input, and database errors appropriately, returning meaningful error messages to the client.
```

### Over-Specification

While detail is important, avoid specifying implementation details that don't matter:

**Avoid:**
```
Use bcrypt with exactly 12 rounds to hash passwords.
```

**Prefer:**
```
Passwords must be securely hashed using an industry-standard algorithm with appropriate strength for the security requirements.
```

## Implementation Status

All best practices outlined in this document are supported by the current OpenSpec implementation in Qwen Code. The integration provides robust support for specification-driven development, with features like:

- Automated validation of specification files (`/openspec validate`)
- Cache management for improved performance (`/openspec clear`)
- Seamless integration with Qwen Code's AI workflow (`/openspec apply`)
- Comprehensive command-line interface for managing specifications (`/openspec` with subcommands)
- Interactive dashboard for viewing specifications and changes (`/openspec view`)

By following these best practices, you can maximize the effectiveness of OpenSpec in your development workflow and ensure successful specification-driven development with Qwen Code.