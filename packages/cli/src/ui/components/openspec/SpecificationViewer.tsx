/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';

interface SpecificationViewerProps {
  content: string;
  fileName: string;
  isPending?: boolean;
}

export const SpecificationViewer: React.FC<SpecificationViewerProps> = ({
  content,
  fileName,
  isPending = false,
}) => {
  const { columns: terminalWidth, rows: terminalHeight } = useTerminalSize();
  // Reserve space for header and padding
  const availableHeight = Math.max(0, terminalHeight - 10);

  return (
    <Box flexDirection="column">
      {/* File header */}
      <Box
        borderBottomColor={Colors.AccentBlue}
        borderBottom={true}
        paddingBottom={1}
        marginBottom={1}
      >
        <Text bold color={Colors.AccentBlue}>
          {fileName}
        </Text>
      </Box>

      {/* Specification content */}
      <Box flexGrow={1}>
        <MarkdownDisplay
          text={content}
          isPending={isPending}
          availableTerminalHeight={availableHeight}
          terminalWidth={terminalWidth}
        />
      </Box>

      {/* Footer with navigation hint */}
      <Box
        borderTopColor={Colors.Gray}
        borderTop={true}
        paddingTop={1}
        marginTop={1}
      >
        <Text dimColor>
          Use arrow keys to navigate • q to quit
        </Text>
      </Box>
    </Box>
  );
};