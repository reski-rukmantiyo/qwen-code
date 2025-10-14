/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import os from 'node:os';

export class PasteStorage {
  private static readonly BASE_DIR = path.join(os.homedir(), '.qwen', 'tmp', 'paste');
  
  /**
   * Save paste content to a file
   * @param sessionId The session ID
   * @param pasteNumber The paste number within the session
   * @param content The content to save
   */
  static async savePaste(sessionId: string, pasteNumber: number, content: string): Promise<void> {
    const sessionDir = path.join(this.BASE_DIR, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });
    const filePath = path.join(sessionDir, `paste-${pasteNumber}`);
    await fs.writeFile(filePath, content, 'utf-8');
  }
  
  /**
   * Load paste content from a file
   * @param sessionId The session ID
   * @param pasteNumber The paste number within the session
   * @returns The content of the paste
   */
  static async loadPaste(sessionId: string, pasteNumber: number): Promise<string> {
    const filePath = path.join(this.BASE_DIR, sessionId, `paste-${pasteNumber}`);
    return await fs.readFile(filePath, 'utf-8');
  }
  
  /**
   * Delete all paste files for a session
   * @param sessionId The session ID
   */
  static async deleteSessionPastes(sessionId: string): Promise<void> {
    const sessionDir = path.join(this.BASE_DIR, sessionId);
    await fs.rm(sessionDir, { recursive: true, force: true });
  }
  
  /**
   * Clean up old paste sessions
   * @param maxAgeHours Maximum age of sessions in hours
   */
  static async cleanupOldSessions(maxAgeHours = 24): Promise<void> {
    try {
      // Ensure base directory exists
      await fs.mkdir(this.BASE_DIR, { recursive: true });
      
      const dirs = await fs.readdir(this.BASE_DIR);
      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      
      for (const dir of dirs) {
        const dirPath = path.join(this.BASE_DIR, dir);
        const stats = await fs.stat(dirPath);
        if (now - stats.mtime.getTime() > maxAgeMs) {
          await fs.rm(dirPath, { recursive: true, force: true });
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Failed to clean up old paste sessions:', error);
    }
  }
}