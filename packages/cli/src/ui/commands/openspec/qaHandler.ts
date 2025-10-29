/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandContext } from '../types.js';
import type { SubmitPromptActionReturn } from '../types.js';
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
 * @returns A submit prompt result that lets Qwen Code handle the LLM interaction.
 */
export async function processQuestion(
  context: CommandContext,
  question: string
): Promise<SubmitPromptActionReturn> {
  try {
    console.log(`[OpenSpec QA] Processing question: ${question}`);
    
    // Get project root
    const projectRoot = process.cwd();
    console.log(`[OpenSpec QA] Extracting context from project: ${projectRoot}`);
    
    // Extract relevant context from source code
    const contextContent = await extractSourceCodeContext(projectRoot, question);
    console.log(`[OpenSpec QA] Extracted context length: ${contextContent.length} characters`);
    
    // Use the proper LLM generation pattern from applyCommand.ts
    const config = context.services.config;
    if (!config) {
      // Fallback to simple prompt submission if config is not available
      console.log('[OpenSpec QA] Config not available, falling back to default prompt submission');
      return await generateAnswerWithSimplePrompt(question, contextContent);
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback to simple prompt submission if LLM client is not available
      console.log('[OpenSpec QA] LLM client not available, falling back to default prompt submission');
      return await generateAnswerWithSimplePrompt(question, contextContent);
    }
    
    // Generate prompt for LLM using the proper pattern
    const prompt = `You are an expert software engineer helping to answer questions about source code. 
The user has asked a question about the codebase, and you have been provided with relevant source code context.

QUESTION: ${question}

SOURCE CODE CONTEXT:
${contextContent}

Please provide a clear, concise answer to the user's question based on the provided source code context.
Focus only on answering the question and do not suggest any code changes or modifications.
If the context doesn't contain enough information to answer the question, say so.
Do not make up information that isn't in the provided context.

IMPORTANT:
- ALWAYS OBEY ./AGENTS.md, ./openspec/project.md, and ./openspec/AGENTS.md.
- DO NOT USE TOOLS
- Generate answer content only.
- Do not include any explanations or additional text outside of the answer.
- Ensure the answer is specific to the provided question and context.
- Limit the response to 1000 words maximum
`;

    // Use the LLM to generate content with proper streaming
    return {
      type: 'submit_prompt',
      content: [{ text: prompt }],
    };
  } catch (error) {
    console.error('[OpenSpec QA] Failed to process question:', error);
    return await handleQuestionError(context, question, error);
  }
}

/**
 * Generates an answer using a simple prompt submission (fallback method)
 * @param question The user's question
 * @param contextContent The extracted source code context
 * @returns A submit prompt result
 */
async function generateAnswerWithSimplePrompt(
  question: string,
  contextContent: string
): Promise<SubmitPromptActionReturn> {
  const prompt = `You are an expert software engineer helping to answer questions about source code. 
The user has asked a question about the codebase, and you have been provided with relevant source code context.

QUESTION: ${question}

SOURCE CODE CONTEXT:
${contextContent}

Please provide a clear, concise answer to the user's question based on the provided source code context.
Focus only on answering the question and do not suggest any code changes or modifications.
If the context doesn't contain enough information to answer the question, say so.
Do not make up information that isn't in the provided context.

IMPORTANT:
- ALWAYS OBEY ./AGENTS.md, ./openspec/project.md, and ./openspec/AGENTS.md.
- DO NOT USE TOOLS
- Generate answer content only.
- Do not include any explanations or additional text outside of the answer.
- Ensure the answer is specific to the provided question and context.
- Limit the response to 1000 words maximum
`;

  return {
    type: 'submit_prompt',
    content: [{ text: prompt }],
  };
}

/**
 * Handles errors that occur during question processing
 * @param context The command context
 * @param question The user's question
 * @param error The error that occurred
 * @returns A submit prompt result with error information
 */
async function handleQuestionError(
  context: CommandContext,
  question: string,
  error: unknown
): Promise<SubmitPromptActionReturn> {
  console.error('[OpenSpec QA] Failed to process question:', error);
  
  // Try to use LLM client for error handling with proper error handling pattern
  try {
    const config = context.services.config;
    if (!config) {
      // Fallback if config is not available
      return await generateErrorFallbackPrompt(question, error);
    }
    
    const geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // Fallback if LLM client is not available
      return await generateErrorFallbackPrompt(question, error);
    }
    
    // Generate error prompt for LLM with proper error handling
    const fallbackPrompt = `You are an expert software engineer helping to answer questions about source code.
    
The user asked a question but there was an error processing the context. Please apologize and explain that there was an issue processing their question.

ERROR: ${(error as Error).message}

QUESTION: ${question}

Please provide a helpful response to the user's question while acknowledging the processing error.`;

    // Use the LLM to generate content with proper error handling
    return {
      type: 'submit_prompt',
      content: [{ text: fallbackPrompt }],
    };
  } catch (llmError) {
    // If LLM error handling also fails, use the simple fallback
    console.error('[OpenSpec QA] Failed to generate error response with LLM:', llmError);
    return await generateErrorFallbackPrompt(question, error);
  }
}

/**
 * Generates a fallback prompt for error handling
 * @param question The user's question
 * @param error The error that occurred
 * @returns A submit prompt result with error information
 */
async function generateErrorFallbackPrompt(
  question: string,
  error: unknown
): Promise<SubmitPromptActionReturn> {
  const fallbackPrompt = `You are an expert software engineer helping to answer questions about source code.
    
The user asked a question but there was an error processing the context. Please apologize and explain that there was an issue processing their question.

ERROR: ${(error as Error).message}

QUESTION: ${question}

Please provide a helpful response to the user's question while acknowledging the processing error.`;

  return {
    type: 'submit_prompt',
    content: [{ text: fallbackPrompt }],
  };
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