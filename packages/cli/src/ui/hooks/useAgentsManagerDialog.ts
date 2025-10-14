/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';

export interface UseAgentsManagerDialogReturn {
  isAgentsManagerDialogOpen: boolean;
  openAgentsManagerDialog: (mode?: 'manage' | 'select-default') => void;
  closeAgentsManagerDialog: () => void;
  dialogMode: 'manage' | 'select-default';
}

export const useAgentsManagerDialog = (): UseAgentsManagerDialogReturn => {
  const [isAgentsManagerDialogOpen, setIsAgentsManagerDialogOpen] =
    useState(false);
  const [dialogMode, setDialogMode] = useState<'manage' | 'select-default'>('manage');

  const openAgentsManagerDialog = useCallback((mode: 'manage' | 'select-default' = 'manage') => {
    setDialogMode(mode);
    setIsAgentsManagerDialogOpen(true);
  }, []);

  const closeAgentsManagerDialog = useCallback(() => {
    setIsAgentsManagerDialogOpen(false);
  }, []);

  return {
    isAgentsManagerDialogOpen,
    openAgentsManagerDialog,
    closeAgentsManagerDialog,
    dialogMode,
  };
};
