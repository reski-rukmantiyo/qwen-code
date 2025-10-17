/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { LruCache } from '@qwen-code/qwen-code-core/src/utils/LruCache.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class OpenSpecCacheService {
  private contentCache: LruCache<string, string>;
  private metadataCache: LruCache<string, { mtime: number; size: number }>;
  private readonly MAX_CACHE_SIZE = 100; // Cache up to 100 files

  constructor() {
    this.contentCache = new LruCache<string, string>(this.MAX_CACHE_SIZE);
    this.metadataCache = new LruCache<string, { mtime: number; size: number }>(this.MAX_CACHE_SIZE);
  }

  /**
   * Gets file content from cache or reads from disk if not cached or stale
   */
  getFileContent(filePath: string): string {
    try {
      const stats = fs.statSync(filePath);
      const cachedMetadata = this.metadataCache.get(filePath);
      
      // Check if cache is valid (exists and mtime matches)
      if (cachedMetadata && 
          cachedMetadata.mtime === stats.mtime.getTime() && 
          cachedMetadata.size === stats.size) {
        const cachedContent = this.contentCache.get(filePath);
        if (cachedContent !== undefined) {
          return cachedContent;
        }
      }
      
      // Read from disk and update cache
      const content = fs.readFileSync(filePath, 'utf-8');
      this.contentCache.set(filePath, content);
      this.metadataCache.set(filePath, {
        mtime: stats.mtime.getTime(),
        size: stats.size
      });
      
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Invalidates cache for a specific file
   */
  invalidateFileCache(filePath: string): void {
    this.contentCache.set(filePath, undefined as any); // Remove from content cache
    this.metadataCache.set(filePath, undefined as any); // Remove from metadata cache
  }

  /**
   * Clears all cached data
   */
  clearCache(): void {
    this.contentCache.clear();
    this.metadataCache.clear();
  }

  /**
   * Preloads cache with content from a directory
   */
  preloadDirectory(directoryPath: string): void {
    try {
      if (!fs.existsSync(directoryPath)) {
        return;
      }
      
      const files = fs.readdirSync(directoryPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(directoryPath, file.name);
        
        if (file.isFile() && fullPath.endsWith('.md')) {
          // Preload markdown files
          this.getFileContent(fullPath);
        } else if (file.isDirectory()) {
          // Recursively preload subdirectories
          this.preloadDirectory(fullPath);
        }
      }
    } catch (error) {
      // Silently fail on preload errors to not interrupt startup
      console.warn(`Failed to preload directory ${directoryPath}: ${(error as Error).message}`);
    }
  }
}