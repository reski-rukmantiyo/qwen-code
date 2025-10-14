/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export class PasteSessionManager {
  private sessionPasteCounters: Map<string, number> = new Map();
  
  /**
   * Get the next paste number for a session
   * @param sessionId The session ID
   * @returns The next paste number
   */
  getNextPasteNumber(sessionId: string): number {
    const current = this.sessionPasteCounters.get(sessionId) || 0;
    const next = current + 1;
    this.sessionPasteCounters.set(sessionId, next);
    return next;
  }
  
  /**
   * Reset the paste counter for a session
   * @param sessionId The session ID
   */
  resetSessionCounter(sessionId: string): void {
    this.sessionPasteCounters.set(sessionId, 0);
  }
  
  /**
   * Get the current paste counter for a session
   * @param sessionId The session ID
   * @returns The current paste counter
   */
  getCurrentCounter(sessionId: string): number {
    return this.sessionPasteCounters.get(sessionId) || 0;
  }
}