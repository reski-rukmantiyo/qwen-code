# OpenSpec Usage Guide for Qwen Code

This guide explains how to use OpenSpec within Qwen Code to implement specification-driven development workflows that ensure alignment between you and AI assistants on detailed specifications before implementation.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Command Reference](#command-reference)
4. [Workflow Tutorial](#workflow-tutorial)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Implementation Status](#implementation-status)

## Getting Started

### Initializing OpenSpec in Your Project

To begin using OpenSpec in your project, run the initialization command:

```
/openspec init
```

This command creates the following directory structure in your project:

```
openspec/
├── specs/      # Source-of-truth specifications
├── changes/    # Proposed updates (active changes)
└── archive/    # Completed changes
```

After initialization, you'll see sample files that demonstrate the structure and format of specification files.

### Understanding the Directory Structure

- **specs/**: Contains your current source-of-truth specifications that describe how your system should work
- **changes/**: Contains proposed changes that modify your specifications and implementation
- **archive/**: Stores completed changes for historical reference

## Core Concepts

### Specifications

Specifications are detailed documents that describe how your system should behave. They serve as the "source of truth" for your project and are stored in the `openspec/specs/` directory.

Each specification should include:
- Overview and purpose
- Functional and non-functional requirements
- Implementation guidelines
- Testing approaches

### Changes

Changes represent proposed modifications to your system. Each change is contained in its own directory within `openspec/changes/` and includes:

- **proposal.md**: Explains why and what changes are being proposed
- **tasks.md**: Implementation checklist for AI assistants
- **design.md**: Technical design decisions (optional)
- **specs/**: Specification deltas showing exactly what will change

### Archiving

Once a change is implemented, it should be moved to the archive directory using the `/openspec archive` command. This keeps your active changes organized and provides a historical record of completed work.

## Command Reference

All OpenSpec functionality is accessed through the `/openspec` command with subcommands.

### /openspec init

Initializes OpenSpec in your project by creating the required directory structure.

**Usage:**
```
/openspec init
```

**What it does:**
- Creates the OpenSpec directory structure
- Generates sample specification and change files
- Integrates with Qwen Code's file watching system

### /openspec list

Views all active change folders in your project.

**Usage:**
```
/openspec list
```

**Output Example:**
```
Active changes (2):

1. add-user-authentication
2. refactor-api-endpoints
```

### /openspec show

Displays detailed information about a specific change.

**Usage:**
```
/openspec show <change-name>
```

**Example:**
```
/openspec show add-user-authentication
```

**What it shows:**
- Proposal details
- Implementation tasks
- Technical design
- Specification deltas

### /openspec change

Creates or modifies change proposals.

**Usage:**
```
/openspec change <change-name>
```

**Example:**
```
/openspec change implement-payment-processing
```

**What it does:**
- Creates a new change directory
- Generates template files (proposal.md, tasks.md, design.md)
- Opens files in your configured editor

### /openspec spec

Manages specification files.

**Usage:**
```
/openspec spec <action> <spec-path>
```

**Actions:**
- `create`: Creates a new specification
- `edit`: Edits an existing specification
- `delete`: Removes a specification

**Examples:**
```
/openspec spec create auth/user-authentication
/openspec spec edit api/rest-endpoints
/openspec spec delete deprecated/legacy-feature
```

### /openspec validate

Checks specification formatting and structure.

**Usage:**
```
/openspec validate <change-name>
/openspec validate --all
```

**Examples:**
```
/openspec validate add-payment-gateway
/openspec validate --all
```

**What it validates:**
- Required files exist
- Files are not empty
- Proper formatting

### /openspec archive

Moves completed changes to the archive directory.

**Usage:**
```
/openspec archive <change-name> [--yes|-y]
```

**Examples:**
```
/openspec archive implement-user-profile
/openspec archive implement-user-profile --yes
```

### /openspec update

Refreshes agent instructions and regenerates AI guidance.

**Usage:**
```
/openspec update
```

### /openspec view

Provides an interactive dashboard of specifications and changes.

**Usage:**
```
/openspec view
```

### /openspec clear

Completely reset OpenSpec (removes all files and directories).

**Usage:**
```
/openspec clear [--cache-only|-c]
```

**Options:**
- `--cache-only`, `-c`: Only clear the cache, don't remove files

**What it does:**
- Without flags: Completely removes the "openspec/" directory and all its contents (default behavior)
- With `--cache-only` flag: Clears the OpenSpec cache and reinitializes cache instances

**Examples:**
```bash
# Completely reset OpenSpec (removes all files) - DEFAULT BEHAVIOR
/openspec clear

# Clear the cache only (preserve files)
/openspec clear --cache-only
```

## Workflow Tutorial

This tutorial walks you through a complete OpenSpec workflow for implementing a new feature.

### Step 1: Initialize OpenSpec

If you haven't already, initialize OpenSpec in your project:

```
/openspec init
```

### Step 2: Create a Change Proposal

Create a new change proposal for implementing user authentication:

```
/openspec change add-user-authentication
```

This creates:
```
openspec/changes/add-user-authentication/
├── proposal.md
├── tasks.md
├── design.md
└── specs/
```

### Step 3: Define the Proposal

Edit `proposal.md` to describe what you're implementing and why:

```markdown
# Add User Authentication

## Overview
Implement user authentication system with email/password login and registration.

## Motivation
Currently, our application lacks user authentication, which limits personalization and data security.

## Implementation Plan
1. Create user registration endpoint
2. Create user login endpoint
3. Implement password hashing
4. Add JWT token generation
5. Create protected routes middleware

## Impact Assessment
- Adds new database tables for users
- Requires new API endpoints
- Affects all routes that should be protected
```

### Step 4: Specify Implementation Tasks

Edit `tasks.md` to create a checklist for AI assistants:

```markdown
# Implementation Tasks

- [ ] Create User model with email, passwordHash fields
- [ ] Implement register endpoint POST /api/auth/register
- [ ] Implement login endpoint POST /api/auth/login
- [ ] Add password hashing with bcrypt
- [ ] Generate JWT tokens upon successful login
- [ ] Create authentication middleware
- [ ] Protect existing endpoints with authentication
- [ ] Add logout functionality
```

### Step 5: Document Technical Design

Edit `design.md` to outline technical decisions:

```markdown
# Technical Design for User Authentication

## Approach
Use JWT tokens for stateless authentication with bcrypt for password hashing.

## Architecture
- Users collection/table with email (unique), passwordHash
- Auth controller with register/login methods
- Middleware to verify JWT tokens
- Environment variables for JWT secret

## Dependencies
- bcryptjs for password hashing
- jsonwebtoken for JWT operations
- express for routing
```

### Step 6: Create Specification Deltas

Create specification files in the `specs/` directory that show exactly what will change:

```
openspec/changes/add-user-authentication/specs/api/rest-endpoints.md
```

```markdown
# REST API Endpoints - Authentication

## New Endpoints

### POST /api/auth/register
Registers a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "123",
    "email": "user@example.com"
  },
  "token": "jwt.token.here"
}
```

### POST /api/auth/login
Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "123",
    "email": "user@example.com"
  },
  "token": "jwt.token.here"
}
```

## Modified Endpoints

### All Protected Routes
Add Authorization header requirement:

**Headers:**
```
Authorization: Bearer <jwt-token>
```
```

### Step 7: Validate Your Change

Check that your change is properly formatted:

```
/openspec validate add-user-authentication
```

### Step 8: Review Your Change

View the details of your change:

```
/openspec show add-user-authentication
```

### Step 9: Implement with AI Assistance

Now you can ask Qwen Code to implement the feature, referencing your specification:

```
Please implement the user authentication feature as specified in /openspec/changes/add-user-authentication
```

### Step 10: Archive When Complete

After implementation, archive the completed change:

```
/openspec archive add-user-authentication
```

This moves the change to the `openspec/archive/` directory.

### Cache Management

If you experience any issues with OpenSpec not reflecting recent changes or if you want to ensure a clean state, you can clear the OpenSpec cache:

```
/openspec clear
```

This command resets the cache and reinitializes it, which can help resolve caching-related issues.

## Best Practices

### Writing Effective Specifications

1. **Be Specific**: Clearly define what should be implemented
2. **Include Examples**: Provide concrete examples of inputs and outputs
3. **Consider Edge Cases**: Document how to handle error conditions
4. **Keep it Updated**: Maintain specifications as requirements evolve

### Creating Good Change Proposals

1. **Clear Motivation**: Explain why the change is needed
2. **Detailed Implementation Plan**: Break down the work into steps
3. **Impact Assessment**: Consider how the change affects the system
4. **Collaborative Tasks**: Write tasks that are clear for AI assistants

### Working with AI Assistants

1. **Reference Specifications**: Always point AI to relevant specifications
2. **Validate Outputs**: Check that AI-generated code matches specifications
3. **Iterate**: Refine specifications based on implementation feedback
4. **Document Decisions**: Record important technical decisions

## Troubleshooting

### Common Issues

**Issue: "OpenSpec is not initialized in this project"**
**Solution:** Run `/openspec init` to set up the directory structure.

**Issue: "Change not found"**
**Solution:** Verify the change name with `/openspec list` and check spelling.

**Issue: Validation errors**
**Solution:** Check that all required files exist and are not empty.

### Getting Help

For additional help with OpenSpec commands, use:
```
/help openspec
```

This will show detailed help information for all OpenSpec commands.

## Implementation Status

All usage scenarios covered in this guide have been implemented and validated through the OpenSpec integration with Qwen Code. The integration provides a complete specification-driven development workflow with:

- Full command-line interface with all documented commands
- Interactive dashboard for viewing specifications and changes
- Comprehensive validation of specification files
- Cache management for improved performance
- Seamless integration with Qwen Code's AI workflow
- Detailed error handling and troubleshooting support

The usage guide covers:

- Getting started with OpenSpec initialization
- Core concepts of specifications and changes
- Complete command reference with examples
- Step-by-step workflow tutorial
- Best practices for specification writing
- Troubleshooting common issues

By following this usage guide, you can effectively leverage OpenSpec within Qwen Code to implement specification-driven development workflows that ensure alignment between you and AI assistants on detailed specifications before implementation.