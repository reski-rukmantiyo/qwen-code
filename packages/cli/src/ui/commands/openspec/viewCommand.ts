/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from '../types.js';
import { CommandKind } from '../types.js';
import type { HistoryItemOpenSpecDashboard } from '../../types.js';

export const viewCommand: SlashCommand = {
  name: 'view',
  description: 'Display an interactive dashboard of specs and changes',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, _args: string) => {
    const dashboardItem: Omit<HistoryItemOpenSpecDashboard, 'id'> = {
      type: 'openspec_dashboard',
    };

    context.ui.addItem(dashboardItem, Date.now());
  },
};