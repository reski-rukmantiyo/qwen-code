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
// TODO: Import remaining subcommands once they are implemented
// import { updateCommand } from './openspec/updateCommand.js';
// import { viewCommand } from './openspec/viewCommand.js';
// import { specCommand } from './openspec/specCommand.js';

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
    // TODO: Add remaining subcommands once they are implemented
    // updateCommand,
    // viewCommand,
    // specCommand,
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
  update      Refresh agent instructions (not yet implemented)
  view        Display interactive dashboard (not yet implemented)
  spec        Manage specification files (not yet implemented)

Use /openspec <command> --help for more information about a command.`,
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