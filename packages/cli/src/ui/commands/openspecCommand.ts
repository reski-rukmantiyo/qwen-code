/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';

// Import subcommands
import { initCommand } from './openspec/initCommand.js';
import { listCommand } from './openspec/listCommand.js';
import { showCommand } from './openspec/showCommand.js';
import { changeCommand } from './openspec/changeCommand.js';
import { validateCommand } from './openspec/validateCommand.js';
import { archiveCommand } from './openspec/archiveCommand.js';
import { updateCommand } from './openspec/updateCommand.js';
import { viewCommand } from './openspec/viewCommand.js';
import { specCommand } from './openspec/specCommand.js';
import { clearCommand } from './openspec/clearCommand.js';
import { applyCommand } from './openspec/applyCommand.js';
import { diffCommand } from './openspec/diffCommand.js';
import { searchCommand } from './openspec/searchCommand.js';
import { proposalCommand } from './openspec/proposalCommand.js';

export const openspecCommand: SlashCommand = {
  name: 'openspec',
  description: 'Manage OpenSpec specifications and changes',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    initCommand,
    listCommand,
    showCommand,
    changeCommand,
    validateCommand,
    archiveCommand,
    updateCommand,
    viewCommand,
    specCommand,
    clearCommand,
    applyCommand,
    diffCommand,
    searchCommand,
    proposalCommand,
  ],
  action: async (context: any, args: string) => {
    // If no subcommand is provided, show help
    if (!args.trim()) {
      return {
        type: 'message',
        messageType: 'info',
        content: `OpenSpec - Specification-driven development tool

Usage: /openspec <command> [options]

Commands:
  init        Initialize OpenSpec in your project
  list        List active changes
  show        Show details of a specific change
  change      Create or modify change proposals
  validate    Validate specification formatting
  archive     Move completed changes to archive
  update      Refresh agent instructions
  view        Display interactive dashboard
  spec        Manage specification files
  clear       Completely reset OpenSpec (use --cache-only to clear cache only)
  apply       Apply a change by submitting tasks to AI for implementation
  diff        Show specification differences for a change
  search      Search for text in OpenSpec specifications using ripgrep
  proposal    Interactively create and manage change proposals

Use /openspec <command> --help for more information about a command.
See documentation at https://github.com/google-gemini/qwen-code/blob/main/docs/openspec/proposal-command.md for details on the proposal command.`,
      };
    }
    
    // For now, just show a message that the command is recognized
    return {
      type: 'message',
      messageType: 'info',
      content: `OpenSpec command recognized. Args: ${args}`,
    };
  },
};