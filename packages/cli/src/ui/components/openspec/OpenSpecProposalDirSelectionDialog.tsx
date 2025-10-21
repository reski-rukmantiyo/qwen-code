/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';
import {
  RadioButtonSelect,
  type RadioSelectItem,
} from '../shared/RadioButtonSelect.js';
import { useKeypress } from '../../hooks/useKeypress.js';

export interface OpenSpecProposalDirSelectionDialogProps {
  directories: string[];
  onSelect: (directory: string) => void;
  onCancel: () => void;
}

export const OpenSpecProposalDirSelectionDialog: React.FC<OpenSpecProposalDirSelectionDialogProps> = ({
  directories,
  onSelect,
  onCancel,
}) => {
  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onCancel();
      }
    },
    { isActive: true },
  );

  const options: Array<RadioSelectItem<string>> = directories.map(
    (dir) => {
      return {
        label: dir,
        value: dir,
      };
    },
  );

  const handleSelect = (directory: string) => {
    onSelect(directory);
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Colors.AccentBlue}
      padding={1}
      width="100%"
      marginLeft={1}
    >
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Select Change Directory</Text>
        <Text>Choose a change directory to work with:</Text>
      </Box>

      <Box marginBottom={1}>
        <RadioButtonSelect
          items={options}
          initialIndex={0}
          onSelect={handleSelect}
          isFocused
        />
      </Box>

      <Box>
        <Text color={Colors.Gray}>Press Enter to select, Esc to cancel</Text>
      </Box>
    </Box>
  );
};