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

export interface OpenSpecQuestionInputDialogProps {
  changeName: string;
  onSubmit: (question: string) => void;
  onCancel: () => void;
}

export const OpenSpecQuestionInputDialog: React.FC<OpenSpecQuestionInputDialogProps> = ({
  changeName,
  onSubmit,
  onCancel,
}) => {
  const [question, setQuestion] = useState('');
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
    if (question.trim().length > 0) {
      onSubmit(question.trim());
    } else {
      setShowError(true);
    }
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Colors.AccentPurple}
      padding={1}
      width="100%"
      marginLeft={1}
    >
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={Colors.AccentPurple}>Ask a Question</Text>
        <Text>Ask a question about the codebase for change "{changeName}":</Text>
      </Box>

      <Box marginBottom={1}>
        <TextInput
          value={question}
          onChange={setQuestion}
          placeholder="Enter your question..."
          onSubmit={handleSubmit}
          height={3}
        />
      </Box>

      {showError && (
        <Box marginBottom={1}>
          <Text color={Colors.AccentRed}>Question cannot be empty</Text>
        </Box>
      )}

      <Box>
        <Text color={Colors.Gray}>Press Enter to submit, Esc to cancel</Text>
      </Box>
    </Box>
  );
};