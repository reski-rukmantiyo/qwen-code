# OpenSpec Workflow Tutorials

This document provides step-by-step tutorials for common OpenSpec workflows within Qwen Code. These tutorials demonstrate how OpenSpec integrates with Qwen Code's AI workflow and file system to enable specification-driven development.

## Tutorial 1: Adding a New Feature

This tutorial walks through the complete process of adding a new feature using OpenSpec, demonstrating how the integration with Qwen Code's AI workflow enables specification-driven development.

### Scenario

You want to add a feature to allow users to reset their passwords via email.

### Step 1: Initialize OpenSpec (if not already done)

```
/openspec init
```

This command creates the OpenSpec directory structure in your project and generates sample files to help you understand the expected format. The implementation validates your Node.js version (>= 20.19.0) and sets up file watching to automatically detect changes to your specifications.

### Step 2: Create a Change Proposal

```
/openspec change add-password-reset
```

This command creates a new change directory at `openspec/changes/add-password-reset/` with template files (proposal.md, tasks.md, design.md) and a specs/ directory. The implementation automatically opens the proposal.md file in your configured editor, allowing you to immediately start defining your change. The command validates the change name for filesystem compatibility and provides helpful feedback on successful creation.

### Step 3: Define the Proposal

Edit `openspec/changes/add-password-reset/proposal.md`:

The implementation uses efficient file reading through `OpenSpecFileUtils.readFileEfficiently()` when displaying this content with the `/openspec show` command, ensuring good performance even with large specification files.

```markdown
# Add Password Reset Functionality

## Overview
Implement password reset functionality that allows users to reset their password via email.

## Motivation
Users occasionally forget their passwords and need a secure way to reset them. This feature improves user experience and reduces support requests.

## Implementation Plan
1. Add "resetToken" and "resetTokenExpiry" fields to User model
2. Create request password reset endpoint
3. Send password reset email with token
4. Create reset password endpoint
5. Add validation and security measures

## Impact Assessment
- Modifies User model
- Adds new API endpoints
- Requires email service integration
- Adds new database fields
```

### Step 4: Specify Implementation Tasks

Edit `openspec/changes/add-password-reset/tasks.md`:

```markdown
# Implementation Tasks

- [ ] Add resetToken and resetTokenExpiry fields to User model
- [ ] Create POST /api/auth/request-reset endpoint
- [ ] Implement password reset token generation (crypto.randomBytes)
- [ ] Integrate with email service to send reset links
- [ ] Create GET /api/auth/reset-password/:token endpoint
- [ ] Create POST /api/auth/reset-password endpoint
- [ ] Add validation for token expiration
- [ ] Add rate limiting for reset requests
- [ ] Add tests for all new endpoints
- [ ] Update API documentation
```

### Step 5: Document Technical Design

Edit `openspec/changes/add-password-reset/design.md`:

```markdown
# Technical Design for Password Reset

## Approach
Use cryptographically secure tokens with expiration times sent via email.

## Architecture
- Extend User model with resetToken and resetTokenExpiry fields
- Create dedicated auth controller methods for reset functionality
- Use existing email service abstraction
- Implement rate limiting to prevent abuse

## Security Considerations
- Tokens must be cryptographically random
- Tokens expire after 1 hour
- Rate limit reset requests per IP and email
- Hash tokens before storing in database
- Do not reveal if email exists in database

## Dependencies
- crypto module for token generation
- nodemailer or similar for email sending
- Existing User model and auth controllers
- Rate limiting middleware
```

### Step 6: Create Specification Deltas

Create `openspec/changes/add-password-reset/specs/api/rest-endpoints.md`:

```markdown
# REST API Endpoints - Password Reset

## New Endpoints

### POST /api/auth/request-reset
Initiates password reset process by sending email with reset link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If account exists, password reset instructions have been sent"
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Too many requests. Please try again later."
}
```

### GET /api/auth/reset-password/:token
Displays password reset form if token is valid.

**Path Parameters:**
- token: Reset token from email link

**Response (200 OK):**
HTML form for entering new password

**Response (400 Bad Request):**
```json
{
  "error": "Invalid or expired reset token"
}
```

### POST /api/auth/reset-password
Resets password if token is valid.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "password": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password successfully reset"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid or expired reset token"
}
```

## Modified Endpoints

### User Model
Added fields:
- resetToken (String, hashed)
- resetTokenExpiry (Date)
```

### Step 7: Validate Your Change

```
/openspec validate add-password-reset
```

This command validates that your change follows the expected structure and has all required files. The implementation checks for the presence of proposal.md and tasks.md files, verifies they're not empty, and provides detailed feedback on any issues found. This helps catch problems early in the development process before asking AI to implement the feature.

### Step 8: Implement with AI

Ask Qwen Code to implement the feature:

```
Please implement the password reset functionality as specified in /openspec/changes/add-password-reset. Follow the tasks listed in the tasks.md file and ensure the implementation matches the technical design.
```

Qwen Code's AI integration automatically incorporates your specifications as context through the `OpenSpecMemoryIntegration` service. This ensures that the AI assistant has access to your detailed requirements and implementation tasks. The integration also validates that generated code conforms to your specifications before execution, reducing the likelihood of implementation errors.

### Step 9: Archive When Complete

```
/openspec archive add-password-reset
```

This command moves your completed change from `openspec/changes/` to `openspec/archive/`, keeping your active changes organized. The implementation handles file moving efficiently and provides confirmation of successful archiving. Archived changes remain available for historical reference and can be useful for understanding past decisions and implementations.

## Tutorial 2: Modifying an Existing Specification

This tutorial shows how to modify an existing specification using OpenSpec, demonstrating how change proposals enable controlled evolution of your system design.

### Scenario

You need to add rate limiting to an existing API endpoint.

### Step 1: Create a Change Proposal

```
/openspec change add-rate-limiting
```

This command creates a structured approach to modifying your existing system. Rather than directly changing specifications, OpenSpec encourages creating change proposals that clearly document what is being modified and why. The implementation provides auto-completion for existing change names, making it easy to work with your current changes.

### Step 2: Define the Proposal

Edit `openspec/changes/add-rate-limiting/proposal.md`:

```markdown
# Add Rate Limiting to API Endpoints

## Overview
Implement rate limiting on public API endpoints to prevent abuse and ensure service availability.

## Motivation
Without rate limiting, our API is vulnerable to denial-of-service attacks and excessive usage that could impact performance for legitimate users.

## Implementation Plan
1. Choose rate limiting strategy (token bucket or sliding window)
2. Implement middleware for rate limiting
3. Configure limits for different endpoint categories
4. Add configuration options
5. Implement logging for rate limit events

## Impact Assessment
- Adds middleware to API routes
- Requires Redis or in-memory storage for counters
- May affect response times slightly
- Adds new configuration options
```

### Step 3: Specify Implementation Tasks

Edit `openspec/changes/add-rate-limiting/tasks.md`:

```markdown
# Implementation Tasks

- [ ] Research and select rate limiting algorithm
- [ ] Create rate limiting middleware
- [ ] Define rate limits for different endpoint categories
- [ ] Implement storage mechanism (Redis or in-memory)
- [ ] Add configuration options for limits
- [ ] Implement logging for rate limit events
- [ ] Add tests for rate limiting behavior
- [ ] Update API documentation with rate limit information
- [ ] Deploy and monitor rate limit metrics
```

### Step 4: Document Technical Design

Edit `openspec/changes/add-rate-limiting/design.md`:

```markdown
# Technical Design for Rate Limiting

## Approach
Use sliding window rate limiting with Redis for distributed storage.

## Architecture
- Create express middleware that intercepts requests
- Use Redis for storing request counters with TTL
- Implement different limits for authenticated vs anonymous users
- Return appropriate HTTP status codes (429) when limits exceeded

## Configuration
Rate limits by endpoint category:
- Auth endpoints: 10 requests/minute
- Public API: 100 requests/minute
- Authenticated API: 1000 requests/minute

## Dependencies
- redis client
- express middleware framework
- Existing configuration system
```

### Step 5: Update Specification Deltas

Modify the existing API specification in `openspec/specs/api/rest-endpoints.md` by creating a delta in `openspec/changes/add-rate-limiting/specs/api/rest-endpoints.md`:

The implementation uses the specs/ directory within each change to clearly show what will be modified. This approach enables precise tracking of specification changes and makes it easy to understand the impact of each change. When you run `/openspec show add-rate-limiting`, the implementation efficiently reads and displays these specification deltas using `OpenSpecFileUtils.readFileEfficiently()`.

```markdown
# REST API Endpoints - Rate Limiting

## Rate Limiting

All API endpoints are subject to rate limiting to ensure fair usage and service availability.

### Limits by Category

#### Authentication Endpoints
- Path patterns: /api/auth/*
- Limit: 10 requests per minute per IP
- Response when exceeded: 429 Too Many Requests

#### Public API Endpoints
- Path patterns: /api/public/*
- Limit: 100 requests per minute per IP
- Response when exceeded: 429 Too Many Requests

#### Authenticated API Endpoints
- Path patterns: /api/*
- Limit: 1000 requests per minute per user
- Response when exceeded: 429 Too Many Requests

### Response Format for Rate Limited Requests

**Status Code:** 429 Too Many Requests

**Response Body:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

### Headers

Rate limited responses include the following headers:
- Retry-After: Seconds until rate limit resets
- X-RateLimit-Limit: Maximum requests allowed
- X-RateLimit-Remaining: Requests remaining in current window
- X-RateLimit-Reset: Unix timestamp when limit resets
```

### Step 6: Validate and Implement

```
/openspec validate add-rate-limiting
```

The validation command checks that your specification deltas are properly structured and all required files are present. This implementation step ensures that your changes follow the expected format before proceeding to implementation.

Ask Qwen Code to implement the feature:

```
Please implement rate limiting as specified in /openspec/changes/add-rate-limiting. Pay special attention to the sliding window algorithm and Redis integration.
```

Qwen Code's AI integration automatically incorporates both your existing specifications and the proposed changes as context, ensuring that the implementation aligns with your overall system design while incorporating the new requirements. The `OpenSpecMemoryIntegration` service collects content from both the specs/ and changes/ directories to provide comprehensive context to the AI assistant.

## Tutorial 3: Refactoring with OpenSpec

This tutorial demonstrates how to use OpenSpec for refactoring existing code, showing how the structured approach supports complex architectural changes.

### Scenario

You want to refactor the authentication system to use a more modular approach.

### Step 1: Create a Change Proposal

```
/openspec change refactor-auth-system
```

This command creates a structured framework for tackling complex refactoring tasks. The implementation generates template files that guide you through documenting the refactoring approach, which is especially valuable for complex changes that affect multiple parts of your system. The changeCommand implementation ensures that all necessary directories and files are created with appropriate templates.

### Step 2: Define the Proposal

Edit `openspec/changes/refactor-auth-system/proposal.md`:

```markdown
# Refactor Authentication System

## Overview
Refactor the authentication system to use a more modular, service-oriented approach.

## Motivation
The current authentication implementation is tightly coupled and difficult to maintain. A modular approach will improve testability, maintainability, and extensibility.

## Implementation Plan
1. Extract authentication logic into separate service modules
2. Create AuthService class to coordinate authentication operations
3. Separate token management into TokenService
4. Create UserService for user-related operations
5. Update controllers to use new service architecture
6. Maintain backward compatibility during transition

## Impact Assessment
- Significant changes to authentication codebase
- Potential breaking changes if not handled carefully
- Improved code organization and maintainability
- Better separation of concerns
```

### Step 3: Specify Implementation Tasks

Edit `openspec/changes/refactor-auth-system/tasks.md`:

```markdown
# Implementation Tasks

- [ ] Create AuthService class to coordinate authentication operations
- [ ] Extract token management into TokenService
- [ ] Create UserService for user-related operations
- [ ] Move password hashing to UserService
- [ ] Create AuthController to handle HTTP requests
- [ ] Implement dependency injection for service classes
- [ ] Add comprehensive tests for new service classes
- [ ] Update existing tests to work with new architecture
- [ ] Ensure backward compatibility during transition
- [ ] Update documentation to reflect new architecture
- [ ] Remove old tightly-coupled authentication code
```

### Step 4: Document Technical Design

Edit `openspec/changes/refactor-auth-system/design.md`:

```markdown
# Technical Design for Authentication System Refactor

## Approach
Extract authentication logic into separate, single-responsibility service classes while maintaining the existing API interface.

## New Architecture

### AuthService
Central coordinator that orchestrates authentication operations:
- Delegates to UserService for user operations
- Delegates to TokenService for token operations
- Handles authentication flow coordination

### UserService
Handles all user-related operations:
- User creation and retrieval
- Password hashing and verification
- User validation

### TokenService
Manages all token operations:
- JWT token generation and verification
- Refresh token handling
- Token validation

## Dependency Injection
Use constructor injection to provide services with their dependencies, enabling easier testing and flexibility.

## Backward Compatibility
Maintain the same public API interface to avoid breaking existing clients during the transition.

## Dependencies
- Existing User model
- jsonwebtoken library
- bcryptjs library
- Express router
```

### Step 5: Create Specification Deltas

Create `openspec/changes/refactor-auth-system/specs/architecture/authentication.md`:

This specification delta clearly documents the architectural changes, which is essential for complex refactorings. The implementation stores these deltas in the change's specs/ directory, making it easy to understand what will change. When you run `/openspec show refactor-auth-system`, the implementation efficiently reads and displays these architectural changes, providing a comprehensive view of the proposed refactoring.

```markdown
# Authentication System Architecture

## Overview
The authentication system has been refactored to use a service-oriented architecture with clear separation of concerns.

## Component Diagram

```
[Client] --> [AuthController] --> [AuthService] --> [UserService]
                              |
                              --> [TokenService]
```

## Services

### AuthService
Coordinates authentication operations and serves as the main entry point.

**Methods:**
- authenticate(credentials): Validates credentials and returns user/token
- refreshToken(oldToken): Generates new token from refresh token
- logout(token): Invalidates token

### UserService
Manages user-related operations.

**Methods:**
- createUser(userData): Creates new user with hashed password
- findUserByEmail(email): Retrieves user by email
- validatePassword(plainPassword, hashedPassword): Verifies password
- updateUser(userId, updates): Updates user information

### TokenService
Handles all token operations.

**Methods:**
- generateAccessToken(user): Creates JWT access token
- generateRefreshToken(user): Creates refresh token
- verifyAccessToken(token): Validates access token
- verifyRefreshToken(token): Validates refresh token
- invalidateToken(token): Marks token as invalid

## Integration Points
- Controllers depend on AuthService only
- AuthService depends on UserService and TokenService
- Services are instantiated with dependency injection
```

### Step 6: Validate and Implement

```
/openspec validate refactor-auth-system
```

This validation ensures that your complex refactoring proposal is properly structured with all required documentation. The implementation checks for the presence of all necessary files and provides detailed feedback on any issues.

Ask Qwen Code to implement the refactoring:

```
Please refactor the authentication system as specified in /openspec/changes/refactor-auth-system. Focus on extracting the logic into the service classes while maintaining backward compatibility.
```

Qwen Code's AI integration is particularly valuable for complex refactorings like this one. The implementation automatically provides both your existing architecture documentation and the proposed changes as context, enabling the AI assistant to understand both the current state and the desired end state. The `OpenSpecMemoryIntegration` service ensures that all relevant specifications are available to guide the refactoring implementation.

## Best Practices Demonstrated

These tutorials demonstrate several key OpenSpec best practices that are supported by the implementation:

1. **Incremental Changes**: Each tutorial addresses a single, well-defined change. The implementation enforces this approach by creating separate change directories, making it easy to track and manage individual changes.

2. **Complete Specifications**: All aspects of the change are documented. The implementation provides template files (proposal.md, tasks.md, design.md) that guide you through documenting all necessary aspects of your change.

3. **Clear Tasks**: Implementation tasks are specific and actionable for AI. The implementation's task.md template encourages writing tasks that are clear and actionable, which improves the quality of AI-assisted implementation.

4. **Technical Design**: Architectural decisions are documented upfront. The implementation includes a design.md template to encourage documenting technical decisions before implementation begins.

5. **Validation**: Changes are validated before implementation. The `/openspec validate` command implementation provides automated checking to catch issues early in the development process.

6. **Archiving**: Completed changes are archived for historical reference. The `/openspec archive` command implementation helps you maintain a clean workspace while preserving completed work for future reference.

7. **Specification Deltas**: Changes to existing specifications are clearly documented as deltas. The implementation uses the specs/ directory within each change to show exactly what will be modified, enabling precise tracking of specification changes.

8. **Environment Management**: When needed, completely reset your OpenSpec environment with `/openspec clear` to start fresh while preserving the benefits of specification-driven development. Use `/openspec clear --cache-only` for lightweight cache clearing while preserving files.

By following these patterns, you can ensure successful specification-driven development with OpenSpec in Qwen Code. The implementation provides robust support for these best practices through thoughtful command design and integration with Qwen Code's existing systems.