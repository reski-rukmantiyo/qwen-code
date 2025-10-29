/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandContext, MessageActionReturn } from '../types.js';
import type { GeminiClient } from '@qwen-code/qwen-code-core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { FileSearchFactory } from '@qwen-code/qwen-code-core';

// Common binary file extensions to ignore
const IGNORED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
  '.mp3', '.wav', '.ogg', '.flac', '.m4a',
  '.mp4', '.avi', '.mov', '.mkv', '.wmv',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
];

/**
 * Processes user questions about source code without triggering any modifications.
 * @param context The command context containing services and UI helpers.
 * @param question The user's question about the source code.
 * @returns A message action return with the answer to the question.
 */
export async function processQuestion(
  context: CommandContext,
  question: string
): Promise<MessageActionReturn> {
  try {
    console.log(`[OpenSpec QA] Processing question: ${question}`);
    // Check if we have access to the LLM client
    const config = context.services.config;
    if (!config) {
      console.warn('[OpenSpec QA] Configuration not available');
      return {
        type: 'message',
        messageType: 'error',
        content: 'Configuration not available. Cannot process question.',
      };
    }

    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      console.warn('[OpenSpec QA] LLM client not available');
      return {
        type: 'message',
        messageType: 'error',
        content: 'LLM client not available. Cannot process question.',
      };
    }

    // Get project root
    const projectRoot = process.cwd();
    console.log(`[OpenSpec QA] Extracting context from project: ${projectRoot}`);
    
    // Extract relevant context from source code
    const contextContent = await extractSourceCodeContext(projectRoot, question);
    console.log(`[OpenSpec QA] Extracted context length: ${contextContent.length} characters`);
    
    // Generate answer using LLM with streaming
    console.log('[OpenSpec QA] Generating answer with LLM');
    const answerStream = await generateAnswerStream(geminiClient, question, contextContent);
    
    // Add a pending item to show that we're processing
    const pendingItem = {
      type: 'info' as const,
      text: 'Processing your question...',
    };
    context.ui.setPendingItem(pendingItem);
    
    // Process the stream and update the UI in real-time
    let fullAnswer = '';
    for await (const chunk of answerStream) {
      fullAnswer += chunk;
      // Update the pending item with the current answer
      context.ui.setPendingItem({
        type: 'info',
        text: fullAnswer,
      });
    }
    
    // Clear the pending item and add the final answer
    context.ui.setPendingItem(null);
    context.ui.addItem({
      type: 'info',
      text: fullAnswer,
    }, Date.now());
    
    console.log(`[OpenSpec QA] Question processed successfully. Answer length: ${fullAnswer.length} characters`);
    
    // Return a simple success message since we've already displayed the answer
    return {
      type: 'message',
      messageType: 'info',
      content: 'Question processed successfully.',
    };
  } catch (error) {
    // Clear the pending item on error
    context.ui.setPendingItem(null);
    console.error('[OpenSpec QA] Failed to process question:', error);
    
    return {
      type: 'message',
      messageType: 'error',
      content: `Failed to process question: ${(error as Error).message}`,
    };
  }
}

/**
 * Extracts relevant source code context based on the question.
 * @param projectRoot The root directory of the project.
 * @param question The user's question.
 * @returns A string containing relevant source code context.
 */
async function extractSourceCodeContext(
  projectRoot: string,
  question: string
): Promise<string> {
  try {
    console.log(`[OpenSpec QA] Extracting source code context for question: ${question}`);
    // Use file search to find relevant files
    const fileSearch = FileSearchFactory.create({
      projectRoot,
      ignoreDirs: ['.git', 'node_modules', 'dist', 'build'],
      useGitignore: true,
      useGeminiignore: true,
      cache: true,
      cacheTtl: 60000, // 1 minute
      enableRecursiveFileSearch: true,
      disableFuzzySearch: false,
    });

    await fileSearch.initialize();

    // Extract keywords from the question
    const keywords = question.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)];
    console.log(`[OpenSpec QA] Extracted keywords: ${uniqueKeywords.join(', ')}`);
    
    // If we have keywords, search for files matching those keywords
    let matchingFiles: string[] = [];
    if (uniqueKeywords.length > 0) {
      // Search for each keyword and collect results
      const searchResults = await Promise.all(
        uniqueKeywords.map(keyword => 
          fileSearch.search(`*${keyword}*`, { maxResults: 5 })
        )
      );
      
      // Flatten and deduplicate results
      matchingFiles = [...new Set(searchResults.flat())];
    } else {
      // If no keywords, get some common files
      matchingFiles = await fileSearch.search('*', { maxResults: 10 });
    }
    
    console.log(`[OpenSpec QA] Found ${matchingFiles.length} matching files`);
    
    // Sort files by relevance (prefer files with more keyword matches)
    if (uniqueKeywords.length > 0) {
      matchingFiles.sort((a, b) => {
        const aMatches = uniqueKeywords.filter(keyword => 
          a.toLowerCase().includes(keyword)
        ).length;
        const bMatches = uniqueKeywords.filter(keyword => 
          b.toLowerCase().includes(keyword)
        ).length;
        return bMatches - aMatches;
      });
    }
    
    // Limit to top 10 files
    matchingFiles = matchingFiles.slice(0, 10);
    console.log(`[OpenSpec QA] Top 10 files: ${matchingFiles.join(', ')}`);
    
    // Read content from the most relevant files
    let contextContent = '';
    for (const file of matchingFiles) {
      try {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          
          // Skip directories
          if (stats.isDirectory()) continue;
          
          // Skip large files
          if (stats.size > 100000) continue; // Skip files larger than 100KB
          
          // Skip binary files and files with ignored extensions
          const ext = path.extname(filePath).toLowerCase();
          if (IGNORED_EXTENSIONS.includes(ext)) continue;
          
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Skip files that are likely binary despite extension
          if (isLikelyBinary(content)) continue;
          
          // Add file header and content to context (limit content length)
          contextContent += `\n\n--- ${file} ---\n${content.substring(0, 3000)}`;
        }
      } catch (error) {
        // Continue with other files if one fails
        console.warn(`[OpenSpec QA] Failed to read file ${file}:`, error);
      }
    }
    
    console.log(`[OpenSpec QA] Total context length: ${contextContent.length} characters`);
    return contextContent || 'No relevant source code context found.';
  } catch (error) {
    console.warn('[OpenSpec QA] Failed to extract source code context:', error);
    return 'Unable to extract source code context.';
  }
}

/**
 * Simple heuristic to detect if content is likely binary
 * @param content The content to check
 * @returns true if content appears to be binary
 */
function isLikelyBinary(content: string): boolean {
  // Check for null bytes which are a strong indicator of binary content
  if (content.includes('\0')) return true;
  
  // Sample first 1000 characters to check for printable characters
  const sample = content.substring(0, Math.min(1000, content.length));
  let nonPrintableCount = 0;
  
  for (let i = 0; i < sample.length; i++) {
    const charCode = sample.charCodeAt(i);
    // Count non-printable ASCII characters (below 32 except for common whitespace)
    if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
      nonPrintableCount++;
    }
  }
  
  // If more than 30% of characters are non-printable, consider it binary
  return nonPrintableCount / sample.length > 0.3;
}

/**
 * Generates an answer to the question using the LLM with streaming.
 * @param geminiClient The LLM client to use for generation.
 * @param question The user's question.
 * @param contextContent The relevant source code context.
 * @returns An async generator that yields chunks of the answer.
 */
async function* generateAnswerStream(
  geminiClient: GeminiClient,
  question: string,
  contextContent: string
): AsyncGenerator<string> {
  try {
    const prompt = `You are an expert software engineer helping to answer questions about source code. 
The user has asked a question about the codebase, and you have been provided with relevant source code context.

QUESTION: ${question}

SOURCE CODE CONTEXT:
${contextContent}

Please provide a clear, concise answer to the user's question based on the provided source code context.
Focus only on answering the question and do not suggest any code changes or modifications.
If the context doesn't contain enough information to answer the question, say so.
Do not make up information that isn't in the provided context.`;

    // Get the content generator from the client
    const contentGenerator = (geminiClient as any).getContentGenerator();
    
    if (!contentGenerator || !contentGenerator.generateContentStream) {
      // Fallback to non-streaming if streaming is not available
      const response = await geminiClient.generateContent(
        [{ role: 'user', parts: [{ text: prompt }] }],
        {},
        new AbortController().signal
      );

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (part.text) {
            yield part.text.trim();
            return;
          }
        }
      }
      yield 'Unable to generate an answer to the question.';
      return;
    }

    // Use streaming if available
    const stream = await contentGenerator.generateContentStream(
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {}
      },
      'question-answer-stream'
    );

    for await (const chunk of stream) {
      if (chunk.candidates && chunk.candidates.length > 0) {
        const candidate = chunk.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (part.text) {
            yield part.text;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to generate answer stream:', error);
    yield `Error generating answer: ${(error as Error).message}`;
  }
}