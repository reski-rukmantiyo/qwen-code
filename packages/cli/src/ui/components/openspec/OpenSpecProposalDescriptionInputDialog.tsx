/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '../shared/TextInput.js';
import { Colors } from '../../colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { useState } from 'react';

export interface OpenSpecProposalDescriptionInputDialogProps {
  onSubmit: (description: string) => void;
  onCancel: () => void;
  initialDescription?: string;
}

export const OpenSpecProposalDescriptionInputDialog: React.FC<OpenSpecProposalDescriptionInputDialogProps> = ({
  onSubmit,
  onCancel,
  initialDescription = '',
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [showError, setShowError] = useState(false);

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onCancel();
      }
    },
    { isActive: true },
  );

  const handleSubmit = () => {
    if (description.trim().length > 0) {
      onSubmit(description.trim());
    } else {
      setShowError(true);
    }
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
        <Text bold>Change Description</Text>
        <Text>Provide a description for your change proposal:</Text>
      </Box>

      <Box marginBottom={1}>
        <TextInput
          value={description}
          onChange={setDescription}
          placeholder="Describe your change..."
          onSubmit={handleSubmit}
          height={3}
        />
      </Box>

      {showError && (
        <Box marginBottom={1}>
          <Text color={Colors.AccentRed}>Description cannot be empty</Text>
        </Box>
      )}

      <Box>
        <Text color={Colors.Gray}>Press Enter to submit, Esc to cancel</Text>
      </Box>
    </Box>
  );
};