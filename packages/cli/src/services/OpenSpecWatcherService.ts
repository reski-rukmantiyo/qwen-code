/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { OpenSpecCacheService } from './OpenSpecCacheService.js';

export class OpenSpecWatcherService {
  private watchers: fs.FSWatcher[] = [];
  private logger: Console;
  private isOpenSpecInitialized = false;
  private cacheService: OpenSpecCacheService;
  private lastCheckpointTime: number = 0;
  private readonly CHECKPOINT_MIN_INTERVAL_MS = 30000; // 30 seconds minimum between checkpoints

  constructor(logger: Console, cacheService: OpenSpecCacheService) {
    this.logger = logger;
    this.cacheService = cacheService;
  }

  /**
   * Starts watching for changes in OpenSpec directories
   */
  async startWatching(): Promise<void> {
    try {
      const projectRoot = process.cwd();
      const openspecDir = path.join(projectRoot, 'openspec');
      
      // Check if OpenSpec is initialized
      if (!fs.existsSync(openspecDir)) {
        this.isOpenSpecInitialized = false;
        this.logger.debug('OpenSpec not initialized, skipping file watching');
        return;
      }
      
      // Check if required directories exist
      const specsDir = path.join(openspecDir, 'specs');
      const changesDir = path.join(openspecDir, 'changes');
      const archiveDir = path.join(openspecDir, 'archive');
      
      if (!fs.existsSync(specsDir) || !fs.existsSync(changesDir) || !fs.existsSync(archiveDir)) {
        this.isOpenSpecInitialized = false;
        this.logger.debug('OpenSpec directory structure incomplete, skipping file watching');
        return;
      }
      
      this.isOpenSpecInitialized = true;
      
      // Close existing watchers if any
      this.closeWatchers();
      
      // Watch the main directories
      this.setupWatcher(specsDir);
      this.setupWatcher(changesDir);
      this.setupWatcher(archiveDir);
      
      // Watch subdirectories in changes directory
      const changeDirs = fs.readdirSync(changesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(changesDir, dirent.name));
        
      for (const changeDir of changeDirs) {
        this.setupWatcher(changeDir);
        
        // Watch specs subdirectory if it exists
        const changeSpecsDir = path.join(changeDir, 'specs');
        if (fs.existsSync(changeSpecsDir)) {
          this.setupWatcher(changeSpecsDir);
        }
      }
      
      this.logger.debug('OpenSpec file watching started successfully');
    } catch (error) {
      this.logger.warn(`Failed to start OpenSpec file watching: ${(error as Error).message}`);
    }
  }

  /**
   * Stops watching for changes
   */
  stopWatching(): void {
    this.closeWatchers();
    this.isOpenSpecInitialized = false;
    this.logger.debug('OpenSpec file watching stopped');
  }

  /**
   * Checks if OpenSpec is initialized and restarts watching if needed
   */
  async checkAndRestartWatching(): Promise<void> {
    if (!this.isOpenSpecInitialized) {
      await this.startWatching();
    }
  }

  /**
   * Sets up a watcher for a specific directory
   */
  private setupWatcher(directoryPath: string): void {
    try {
      const watcher = fs.watch(directoryPath, (eventType: string, filename: string | null) => {
        if (filename) {
          const fullPath = path.join(directoryPath, filename);
          this.logger.debug(`OpenSpec file change detected: ${eventType} ${fullPath}`);
          
          // Emit an event or trigger a callback when files change
          // This could be used to refresh cached content or notify the UI
          this.handleFileChange(eventType, fullPath);
        }
      });
      
      this.watchers.push(watcher);
      this.logger.debug(`Watching directory: ${directoryPath}`);
    } catch (error) {
      this.logger.warn(`Failed to watch directory ${directoryPath}: ${(error as Error).message}`);
    }
  }

  /**
   * Handles file change events
   */
  private async handleFileChange(eventType: string, filePath: string): Promise<void> {
    // This method can be extended to:
    // 1. Refresh cached content
    // 2. Notify the UI of changes
    // 3. Trigger re-validation of specifications
    // 4. Update any internal state
    
    this.logger.debug(`Processing OpenSpec file change: ${eventType} ${filePath}`);
    
    // Invalidate cache when files change
    if (eventType === 'change' || eventType === 'rename') {
      this.cacheService.invalidateFileCache(filePath);
      this.logger.debug(`Invalidated cache for file: ${filePath}`);
    }
    
    // For significant changes, consider creating a checkpoint
    if ((eventType === 'change' || eventType === 'rename') && this.shouldCreateCheckpoint()) {
      await this.requestCheckpoint(`OpenSpec change: ${path.basename(filePath)}`);
    }
  }

  /**
   * Determines if enough time has passed to create a new checkpoint
   */
  private shouldCreateCheckpoint(): boolean {
    const now = Date.now();
    return (now - this.lastCheckpointTime) > this.CHECKPOINT_MIN_INTERVAL_MS;
  }

  /**
   * Requests a checkpoint through Qwen Code's checkpointing system
   */
  private async requestCheckpoint(message: string): Promise<void> {
    // In a full implementation, this would integrate with Qwen Code's GitService
    // to create a checkpoint of the current state
    this.logger.debug(`Checkpoint requested: ${message}`);
    this.lastCheckpointTime = Date.now();
    
    // Note: Actual checkpointing implementation would require access to Qwen Code's
    // GitService, which is outside the scope of this service
  }

  /**
   * Closes all active watchers
   */
  private closeWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher.close();
      } catch (error) {
        this.logger.warn(`Error closing watcher: ${(error as Error).message}`);
      }
    }
    this.watchers = [];
  }
}