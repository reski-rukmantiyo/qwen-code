# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qwen Code is an AI-powered command-line workflow tool adapted from Google Gemini CLI, specifically optimized for Qwen3-Coder models. It's a Node.js TypeScript project structured as a monorepo with multiple packages.

## Common Commands

### Build & Development
```bash
# Build the entire project
npm run build

# Build all packages and sandbox
npm run build:all

# Build packages only
npm run build:packages

# Build VS Code extension
npm run build:vscode

# Build sandbox
npm run build:sandbox

# Start the CLI
npm run start

# Build and start
npm run build-and-start

# Debug mode with breakpoints
npm run debug

# Bundle for distribution
npm run bundle
```

### Testing
```bash
# Run all tests
npm run test

# Run CI tests with coverage
npm run test:ci

# Run all integration tests
npm run test:integration:all

# Run integration tests (no sandbox)
npm run test:integration:sandbox:none

# Run integration tests with Docker
npm run test:integration:sandbox:docker

# Run integration tests with Podman
npm run test:integration:sandbox:podman

# Run E2E tests
npm run test:e2e

# Run terminal benchmarks
npm run test:terminal-bench

# Run terminal benchmarks for specific models
npm run test:terminal-bench:oracle
npm run test:terminal-bench:qwen
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck

# Run full preflight checks
npm run preflight

# Lint with CI settings (max warnings 0)
npm run lint:ci
```

### Package Management
```bash
# Install dependencies
npm install

# Clean generated files
npm run clean

# Generate git commit info
npm run generate

# Prepare package for release
npm run prepare:package

# Version management
npm run release:version

# Telemetry
npm run telemetry
```

## Architecture

### Monorepo Structure
- **packages/core** - Core functionality, AI integration, tools, and services
- **packages/cli** - Command-line interface, UI components, and user interaction
- **packages/test-utils** - Shared testing utilities
- **packages/vscode-ide-companion** - VS Code integration

### Key Architectural Components

#### Core Package (`packages/core/src`)
- **core/** - Main application logic, AI content generation, client management
- **tools/** - CLI tools and utilities for file operations, git, MCP integration, etc.
- **services/** - Background services and API integrations
- **qwen/** - Qwen-specific model integrations and optimizations
- **config/** - Configuration management
- **telemetry/** - Logging and analytics (Qwen Logger, Clearcut Logger)
- **mcp/** - Model Context Protocol implementation with token storage
- **ide/** - IDE integration, context management, and process utilities
- **utils/** - Utility functions (file search, tokenization, etc.)
- **subagents/** - Sub-agent implementations for specialized tasks
- **code_assist/** - Code assistance and analysis utilities
- **prompts/** - System prompts and templates

#### CLI Package (`packages/cli/src`)
- **ui/** - React-based terminal UI components with Ink
  - **components/** - Reusable UI components
  - **contexts/** - React contexts for state management
  - **editors/** - Text editors and input handling
  - **privacy/** - Privacy notices and consent UI
- **commands/** - Command-line command implementations
- **config/** - CLI-specific configuration and extensions
- **services/** - CLI-specific services and prompt processors
- **utils/** - CLI utility functions
- **zed-integration/** - Zed editor integration
- **test-utils/** - CLI-specific testing utilities

### Technology Stack
- **TypeScript** - Primary language with strict type checking
- **Node.js 20+** - Runtime requirement
- **React + Ink** - Terminal UI framework
- **Vitest** - Testing framework
- **ESBuild** - Build tooling
- **AI Model Integration** - Support for multiple providers (Qwen, OpenAI-compatible APIs)
- **Simple Git** - Git operations
- **Ripgrep** - Fast code searching (@lvce-editor/ripgrep)
- **Node-pty** - Terminal emulation (optional dependency)

### Build System
- Uses custom build scripts in `scripts/` directory
- ESBuild configuration in `esbuild.config.js`
- Workspace-based monorepo structure
- Bundle creation for distribution

### Configuration
- Project uses `.env` files for environment configuration
- TypeScript with strict settings and composite project structure
- ESLint and Prettier for code quality
- ESM modules (type: "module" in package.json)
- Sandbox configuration with Docker/Podman support

### Authentication & Models
- Multiple authentication methods: Qwen OAuth, OpenAI-compatible APIs
- Support for various model providers (Alibaba Cloud, ModelScope, OpenRouter)
- Vision model auto-switching capabilities
- Session token management and compression

## Development Notes

### Package Dependencies
- Core package is dependency-free from CLI package
- CLI package depends on core package via file reference
- Shared test utilities package for common testing patterns
- Optional dependencies for platform-specific node-pty bindings

### Key Features
- Code understanding and editing beyond context limits
- Workflow automation for git operations and complex tasks
- Enhanced parser optimized for Qwen-Coder models
- Vision model support with automatic switching
- Terminal-based interactive UI with React components

### Sandbox Integration
- Docker/Podman sandbox support for safe code execution
- Configurable sandbox image URI: `ghcr.io/qwenlm/qwen-code:0.0.13`
- Integration tests with various sandbox configurations (none, docker, podman)
- Build sandbox with `npm run build:sandbox`