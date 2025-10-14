/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UpdateInfo } from 'update-notifier';

export interface UpdateObject {
  message: string;
  update: UpdateInfo & { current: string };
}

export async function checkForUpdates(): Promise<UpdateObject | null> {
  // Always return null to disable update checks
  return null;
}
