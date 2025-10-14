/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { StreamingState } from '../types.js';
import type { Config } from '@qwen-code/qwen-code-core';
import { PasteStorage } from '../utils/pasteStorage.js';

export interface UseMessageQueueOptions {
  streamingState: StreamingState;
  submitQuery: (query: string) => void;
  config?: Config;
}

export interface UseMessageQueueReturn {
  messageQueue: string[];
  addMessage: (message: string) => void;
  clearQueue: () => void;
  getQueuedMessagesText: () => string;
}

/**
 * Process message text to replace paste placeholders with actual content
 * @param message The message text to process
 * @param config The config object containing session ID
 * @returns Promise resolving to the processed message
 */
const processMessageWithPastes = async (message: string, config?: Config): Promise<string> => {
  // If no config, return message as-is
  if (!config) {
    return message;
  }
  
  const sessionId = config.getSessionId();
  // Regex to match paste placeholders
  const pasteRegex = /\[Paste #(\d+): \d+ chars\]/g;
  let result = message;
  let match;

  // Find all paste placeholders
  const pasteNumbers: number[] = [];
  const placeholders: string[] = [];
  
  while ((match = pasteRegex.exec(message)) !== null) {
    const pasteNumber = parseInt(match[1], 10);
    pasteNumbers.push(pasteNumber);
    placeholders.push(match[0]);
  }
  
  // Process each placeholder
  for (let i = 0; i < placeholders.length; i++) {
    const placeholder = placeholders[i];
    const pasteNumber = pasteNumbers[i];
    
    try {
      const pasteContent = await PasteStorage.loadPaste(sessionId, pasteNumber);
      result = result.replace(placeholder, pasteContent);
    } catch (error) {
      // If paste file not found, leave placeholder as is
      console.warn(`Could not load paste #${pasteNumber}:`, error);
    }
  }
  
  return result;
};

/**
 * Hook for managing message queuing during streaming responses.
 * Allows users to queue messages while the AI is responding and automatically
 * sends them when streaming completes.
 */
export function useMessageQueue({
  streamingState,
  submitQuery,
  config,
}: UseMessageQueueOptions): UseMessageQueueReturn {
  const [messageQueue, setMessageQueue] = useState<string[]>([]);

  // Add a message to the queue
  const addMessage = useCallback((message: string) => {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 0) {
      setMessageQueue((prev) => [...prev, trimmedMessage]);
    }
  }, []);

  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  // Get all queued messages as a single text string
  const getQueuedMessagesText = useCallback(() => {
    if (messageQueue.length === 0) return '';
    return messageQueue.join('\n\n');
  }, [messageQueue]);

  // Process queued messages when streaming becomes idle
  useEffect(() => {
    if (streamingState === StreamingState.Idle && messageQueue.length > 0) {
      const processQueue = async () => {
        // Combine all messages with double newlines for clarity
        let combinedMessage = messageQueue.join('\n\n');
        
        // Only process paste placeholders if there are any and we have config
        if (combinedMessage.includes('[Paste #') && config) {
          // Replace paste placeholders with actual content
          combinedMessage = await processMessageWithPastes(combinedMessage, config);
          
          // Clean up paste files after successful processing
          await PasteStorage.deleteSessionPastes(config.getSessionId()).catch(console.error);
        }
        
        // Clear the queue and submit
        setMessageQueue([]);
        submitQuery(combinedMessage);
      };
      
      processQueue().catch(console.error);
    }
  }, [streamingState, messageQueue, submitQuery, config]);

  return {
    messageQueue,
    addMessage,
    clearQueue,
    getQueuedMessagesText,
  };
}