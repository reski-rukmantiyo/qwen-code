/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { OpenSpecWatcherService } from '../../services/OpenSpecWatcherService.js';
import { OpenSpecCacheService } from '../../services/OpenSpecCacheService.js';
import type { Config } from '@qwen-code/qwen-code-core';

let openSpecWatcherService: OpenSpecWatcherService | null = null;
let openSpecCacheService: OpenSpecCacheService | null = null;

/**
 * Hook to initialize and manage the OpenSpec watcher service
 */
export function useOpenSpecWatcher(config: Config): void {
  useEffect(() => {
    // Initialize the OpenSpec cache service if not already done
    if (!openSpecCacheService) {
      openSpecCacheService = new OpenSpecCacheService();
    }
    
    // Initialize the OpenSpec watcher service if not already done
    if (!openSpecWatcherService) {
      openSpecWatcherService = new OpenSpecWatcherService(console, openSpecCacheService);
      openSpecWatcherService.startWatching();
    }

    // Periodically check if OpenSpec has been initialized
    const interval = setInterval(() => {
      if (openSpecWatcherService) {
        openSpecWatcherService.checkAndRestartWatching();
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
      if (openSpecWatcherService) {
        openSpecWatcherService.stopWatching();
        openSpecWatcherService = null;
      }
      // Note: We don't reset the cache service as it can be reused
    };
  }, [config]);
}

/**
 * Gets the OpenSpec cache service instance
 */
export function getOpenSpecCacheService(): OpenSpecCacheService | null {
  return openSpecCacheService;
}