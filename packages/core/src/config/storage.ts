/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';

export const GEMINI_DIR = '.qwen';
export const GOOGLE_ACCOUNTS_FILENAME = 'google_accounts.json';
const TMP_DIR_NAME = 'tmp';

// Helper function to get nested property from an object
function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

// Helper function to set nested property in an object
function setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return;

  let current: Record<string, unknown> = obj;
  for (const key of keys) {
    if (current[key] === undefined) {
      current[key] = {};
    }
    const next = current[key];
    if (typeof next === 'object' && next !== null) {
      current = next as Record<string, unknown>;
    } else {
      // This path is invalid, so we stop.
      return;
    }
  }
  current[lastKey] = value;
}

export class Storage {
  private readonly targetDir: string;
  private storageData: Record<string, unknown> = {};

  constructor(targetDir: string) {
    this.targetDir = targetDir;
    this.loadStorageData();
  }

  static getGlobalGeminiDir(): string {
    const homeDir = os.homedir();
    if (!homeDir) {
      return path.join(os.tmpdir(), '.qwen');
    }
    return path.join(homeDir, GEMINI_DIR);
  }

  static getMcpOAuthTokensPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'mcp-oauth-tokens.json');
  }

  static getGlobalSettingsPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'settings.json');
  }

  static getInstallationIdPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'installation_id');
  }

  static getGoogleAccountsPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), GOOGLE_ACCOUNTS_FILENAME);
  }

  static getUserCommandsDir(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'commands');
  }

  static getGlobalMemoryFilePath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'memory.md');
  }

  static getGlobalTempDir(): string {
    return path.join(Storage.getGlobalGeminiDir(), TMP_DIR_NAME);
  }

  getGeminiDir(): string {
    return path.join(this.targetDir, GEMINI_DIR);
  }

  getProjectTempDir(): string {
    const hash = this.getFilePathHash(this.getProjectRoot());
    const tempDir = Storage.getGlobalTempDir();
    return path.join(tempDir, hash);
  }

  ensureProjectTempDirExists(): void {
    fs.mkdirSync(this.getProjectTempDir(), { recursive: true });
  }

  static getOAuthCredsPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'oauth_creds.json');
  }

  getProjectRoot(): string {
    return this.targetDir;
  }

  private getFilePathHash(filePath: string): string {
    return crypto.createHash('sha256').update(filePath).digest('hex');
  }

  getHistoryDir(): string {
    const hash = this.getFilePathHash(this.getProjectRoot());
    const historyDir = path.join(Storage.getGlobalGeminiDir(), 'history');
    return path.join(historyDir, hash);
  }

  getWorkspaceSettingsPath(): string {
    return path.join(this.getGeminiDir(), 'settings.json');
  }

  getProjectCommandsDir(): string {
    return path.join(this.getGeminiDir(), 'commands');
  }

  getProjectTempCheckpointsDir(): string {
    return path.join(this.getProjectTempDir(), 'checkpoints');
  }

  getExtensionsDir(): string {
    return path.join(this.getGeminiDir(), 'extensions');
  }

  getExtensionsConfigPath(): string {
    return path.join(this.getExtensionsDir(), 'qwen-extension.json');
  }

  getHistoryFilePath(): string {
    return path.join(this.getProjectTempDir(), 'shell_history');
  }

  /**
   * Get a value from the storage.
   * @param key The key to retrieve the value for.
   * @returns The value associated with the key, or undefined if not found.
   */
  getValue(key: string): unknown {
    return getNestedProperty(this.storageData, key);
  }

  /**
   * Set a value in the storage.
   * @param key The key to set the value for.
   * @param value The value to set.
   */
  setValue(key: string, value: unknown): void {
    setNestedProperty(this.storageData, key, value);
    this.saveStorageData();
  }

  /**
   * Load storage data from the workspace settings file.
   */
  private loadStorageData(): void {
    try {
      const settingsPath = this.getWorkspaceSettingsPath();
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        if (typeof settings === 'object' && settings !== null) {
          this.storageData = settings;
        }
      }
    } catch (error) {
      console.warn('Failed to load storage data:', error);
    }
  }

  /**
   * Save storage data to the workspace settings file.
   */
  private saveStorageData(): void {
    try {
      const settingsPath = this.getWorkspaceSettingsPath();
      const dirPath = path.dirname(settingsPath);
      
      // Ensure the directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write the data to the file
      fs.writeFileSync(settingsPath, JSON.stringify(this.storageData, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save storage data:', error);
    }
  }
}
