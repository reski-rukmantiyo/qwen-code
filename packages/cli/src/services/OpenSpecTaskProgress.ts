/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { readFileEfficiently } from './OpenSpecFileUtils.js';

/**
 * Represents task progress information
 */
export interface TaskProgress {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
}

/**
 * Utility functions for tracking task progress in OpenSpec changes
 */
export class OpenSpecTaskProgress {
  /**
   * Gets task progress for a specific change
   * @param changesDir Path to the changes directory
   * @param changeName Name of the change
   * @returns Task progress information
   */
  static async getTaskProgressForChange(changesDir: string, changeName: string): Promise<TaskProgress> {
    const tasksPath = path.join(changesDir, changeName, 'tasks.md');
    
    try {
      // Check if tasks file exists
      if (!fs.existsSync(tasksPath)) {
        return { total: 0, completed: 0, pending: 0, inProgress: 0 };
      }
      
      // Read the tasks file
      const tasksContent = await readFileEfficiently(tasksPath);
      
      // Parse task checkboxes
      const lines = tasksContent.split('\n');
      let total = 0;
      let completed = 0;
      let inProgress = 0;
      let pending = 0;
      
      for (const line of lines) {
        // Match markdown task list items: - [ ] or - [x] or - [X] or - [~]
        const taskMatch = line.match(/^(\s*)-\s*\[([ xX~])?\]\s*(.*)$/);
        if (taskMatch) {
          total++;
          const status = taskMatch[2];
          if (status === 'x' || status === 'X') {
            completed++;
          } else if (status === '~') {
            inProgress++;
          } else {
            pending++;
          }
        }
      }
      
      return { total, completed, pending, inProgress };
    } catch (error) {
      // If there's an error reading the file, return zero progress
      return { total: 0, completed: 0, pending: 0, inProgress: 0 };
    }
  }
  
  /**
   * Formats task progress as a string for display
   * @param progress Task progress information
   * @returns Formatted progress string
   */
  static formatTaskStatus(progress: TaskProgress): string {
    if (progress.total === 0) {
      return 'No tasks defined';
    }
    
    const completedPercent = Math.round((progress.completed / progress.total) * 100);
    return `${progress.completed}/${progress.total} (${completedPercent}%)`;
  }
}