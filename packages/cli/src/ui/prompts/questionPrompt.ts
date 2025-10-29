/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';

interface QuestionPromptProps {
  onSubmit: (question: string) => void;
  onCancel: () => void;
}

export function QuestionPrompt({
  onSubmit,
  onCancel,
}: QuestionPromptProps): React.JSX.Element {
  const [question, setQuestion] = useState('');

  useInput((input, key) => {
    // Filter paste-related control sequences
    let cleanInput = (input || '')
      // Filter ESC-started control sequences
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '') // eslint-disable-line no-control-regex
      // Filter paste start marker [200~
      .replace(/\[200~/g, '')
      // Filter paste end marker [201~
      .replace(/\[201~/g, '')
      // Filter standalone [ and ~ characters
      .replace(/^\[|~$/g, '');

    // Filter all invisible characters (ASCII < 32, except for carriage return)
    cleanInput = cleanInput
      .split('')
      .filter((ch) => ch.charCodeAt(0) >= 32)
      .join('');

    if (cleanInput.length > 0) {
      setQuestion((prev) => prev + cleanInput);
      return;
    }

    // Check if it's Enter key
    if (input.includes('\n') || input.includes('\r')) {
      if (question.trim()) {
        onSubmit(question.trim());
      }
      return;
    }

    if (key.escape) {
      onCancel();
      return;
    }

    // Handle backspace
    if (key.backspace || key.delete) {
      setQuestion((prev) => prev.slice(0, -1));
      return;
    }
  });

  return React.createElement(
    Box,
    {
      borderStyle: "round",
      borderColor: Colors.AccentPurple,
      flexDirection: "column",
      padding: 1,
      width: "100%"
    },
    React.createElement(
      Text,
      { bold: true, color: Colors.AccentPurple },
      "Ask a question about the codebase:"
    ),
    React.createElement(
      Box,
      { marginTop: 1, flexDirection: "row" },
      React.createElement(
        Box,
        { flexGrow: 1 },
        React.createElement(
          Text,
          null,
          "> ",
          question || " "
        )
      )
    ),
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(
        Text,
        { color: Colors.Gray },
        "Type your question and press Enter to submit, Esc to cancel"
      )
    )
  );
}