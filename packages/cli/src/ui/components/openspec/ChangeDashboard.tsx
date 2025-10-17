/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';

interface ChangeItem {
  id: string;
  name: string;
  status: 'draft' | 'in-progress' | 'review' | 'completed';
  lastModified: Date;
  description?: string;
}

interface ChangeDashboardProps {
  changes: ChangeItem[];
  activeChangeId?: string;
  onActivateChange?: (id: string) => void;
  onArchiveChange?: (id: string) => void;
}

const STATUS_COLORS = {
  draft: Colors.Gray,
  'in-progress': Colors.AccentYellow,
  review: Colors.AccentBlue,
  completed: Colors.AccentGreen,
};

const STATUS_LABELS = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  review: 'Review',
  completed: 'Completed',
};

export const ChangeDashboard: React.FC<ChangeDashboardProps> = ({
  changes,
  activeChangeId,
  onActivateChange,
  onArchiveChange,
}) => {
  const { rows: terminalHeight } = useTerminalSize();
  // Reserve space for header and footer
  const availableHeight = Math.max(0, terminalHeight - 8);
  const maxVisibleItems = Math.max(1, availableHeight - 5); // Account for header/footer

  const visibleChanges = changes.slice(0, maxVisibleItems);
  const hasMoreChanges = changes.length > maxVisibleItems;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box
        borderBottomColor={Colors.AccentCyan}
        borderBottom={true}
        paddingBottom={1}
        marginBottom={1}
      >
        <Text bold color={Colors.AccentCyan}>
          OpenSpec Change Dashboard
        </Text>
      </Box>

      {/* Column headers */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width="30%">
          <Text bold color={Colors.Gray}>
            Change Name
          </Text>
        </Box>
        <Box width="20%">
          <Text bold color={Colors.Gray}>
            Status
          </Text>
        </Box>
        <Box width="20%">
          <Text bold color={Colors.Gray}>
            Last Modified
          </Text>
        </Box>
        <Box width="30%">
          <Text bold color={Colors.Gray}>
            Description
          </Text>
        </Box>
      </Box>

      {/* Changes list */}
      <Box flexDirection="column" flexGrow={1}>
        {visibleChanges.length === 0 ? (
          <Box>
            <Text dimColor>No changes found.</Text>
          </Box>
        ) : (
          visibleChanges.map((change) => {
            const isActive = change.id === activeChangeId;
            const statusColor = STATUS_COLORS[change.status];
            const statusLabel = STATUS_LABELS[change.status];

            return (
              <Box
                key={change.id}
                flexDirection="row"
                paddingY={1}
                backgroundColor={isActive ? Colors.Background : undefined}
              >
                <Box width="30%" flexDirection="row">
                  <Text
                    color={isActive ? Colors.Foreground : Colors.Foreground}
                    bold={isActive}
                  >
                    {change.name}
                  </Text>
                  {isActive && (
                    <Text color={Colors.AccentGreen}> {'▶'}</Text>
                  )}
                </Box>
                <Box width="20%">
                  <Text color={statusColor}>{statusLabel}</Text>
                </Box>
                <Box width="20%">
                  <Text color={Colors.Gray}>
                    {formatDate(change.lastModified)}
                  </Text>
                </Box>
                <Box width="30%">
                  <Text
                    color={isActive ? Colors.Foreground : Colors.Gray}
                  >
                    {change.description || ''}
                  </Text>
                </Box>
              </Box>
            );
          })
        )}

        {hasMoreChanges && (
          <Box marginTop={1}>
            <Text dimColor>
              ... and {changes.length - maxVisibleItems} more changes
            </Text>
          </Box>
        )}
      </Box>

      {/* Footer with instructions */}
      <Box
        borderTopColor={Colors.Gray}
        borderTop={true}
        paddingTop={1}
        marginTop={1}
      >
        <Text dimColor>
          ↑/↓ to navigate • Enter to view • a to archive • q to quit
        </Text>
      </Box>
    </Box>
  );
};