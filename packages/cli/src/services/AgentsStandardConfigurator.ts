/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Configuration options for the AgentsStandardConfigurator
 */
export interface AgentsConfiguratorOptions {
  /**
   * The root directory of the project
   */
  projectRoot: string;
  
  /**
   * The path to the OpenSpec directory
   */
  openSpecDir: string;
  
  /**
   * Whether to enable rollback functionality
   */
  enableRollback?: boolean;
}

/**
 * Result of an AGENTS.md update operation
 */
export interface UpdateResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * Path to the updated file
   */
  filePath: string;
  
  /**
   * Any error message if the operation failed
   */
  error?: string;
  
  /**
   * Whether a new file was created
   */
  createdNewFile?: boolean;
  
  /**
   * Whether content was updated
   */
  contentUpdated?: boolean;
}

/**
 * Class responsible for managing root AGENTS.md files with OPENSPEC:START/END markers
 */
export class AgentsStandardConfigurator {
  private readonly projectRoot: string;
  private readonly openSpecDir: string;
  private readonly enableRollback: boolean;
  private readonly rootAgentsPath: string;
  private readonly openSpecAgentsPath: string;
  
  // Marker constants
  private static readonly START_MARKER = 'OPENSPEC:START';
  private static readonly END_MARKER = 'OPENSPEC:END';
  private static readonly BACKUP_EXTENSION = '.backup';
  
  /**
   * Creates a new AgentsStandardConfigurator instance
   * 
   * @param options - Configuration options
   */
  constructor(options: AgentsConfiguratorOptions) {
    this.projectRoot = options.projectRoot;
    this.openSpecDir = options.openSpecDir;
    this.enableRollback = options.enableRollback ?? true;
    
    // Construct file paths
    this.rootAgentsPath = path.join(this.projectRoot, 'AGENTS.md');
    this.openSpecAgentsPath = path.join(this.openSpecDir, 'AGENTS.md');
  }
  
  /**
   * Reads the existing root AGENTS.md file
   * 
   * @returns The content of the file or null if it doesn't exist
   * @throws Error if there's an issue reading the file (other than it not existing)
   */
  readRootAgentsFile(): string | null {
    try {
      if (!fs.existsSync(this.rootAgentsPath)) {
        return null;
      }
      
      return fs.readFileSync(this.rootAgentsPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read root AGENTS.md file: ${this.getErrorMessage(error)}`);
    }
  }
  
  /**
   * Identifies and extracts content between OPENSPEC:START/END markers
   * 
   * @param content - The content to search within
   * @returns The content between markers or null if markers are not found
   */
  extractMarkedContent(content: string): string | null {
    const startMarkerIndex = content.indexOf(AgentsStandardConfigurator.START_MARKER);
    if (startMarkerIndex === -1) {
      return null;
    }
    
    const endMarkerIndex = content.indexOf(AgentsStandardConfigurator.END_MARKER, startMarkerIndex);
    if (endMarkerIndex === -1) {
      return null;
    }
    
    // Extract content between markers (excluding the markers themselves)
    const startContentIndex = startMarkerIndex + AgentsStandardConfigurator.START_MARKER.length;
    return content.substring(startContentIndex, endMarkerIndex).trim();
  }
  
  /**
   * Updates content within OPENSPEC:START/END markers while preserving surrounding content
   * 
   * @param existingContent - The existing file content
   * @param newContent - The new content to insert between markers
   * @returns The updated content with new content between markers
   */
  updateContentWithMarkers(existingContent: string, newContent: string): string {
    const startMarkerIndex = existingContent.indexOf(AgentsStandardConfigurator.START_MARKER);
    const endMarkerIndex = existingContent.indexOf(AgentsStandardConfigurator.END_MARKER);
    
    // If markers don't exist, create them with the new content
    if (startMarkerIndex === -1 || endMarkerIndex === -1) {
      return this.createContentWithMarkers(newContent, existingContent);
    }
    
    // Extract content before start marker
    const beforeStart = existingContent.substring(0, startMarkerIndex + AgentsStandardConfigurator.START_MARKER.length);
    
    // Extract content after end marker
    const afterEnd = existingContent.substring(
      endMarkerIndex + AgentsStandardConfigurator.END_MARKER.length,
      existingContent.length
    );
    
    // Combine everything with the new content between markers
    return `${beforeStart}\n${newContent}\n${AgentsStandardConfigurator.END_MARKER}${afterEnd}`;
  }
  
  /**
   * Creates new content with OPENSPEC:START/END markers
   * 
   * @param markedContent - The content to place between markers
   * @param existingContent - Optional existing content to preserve
   * @returns The new content with markers
   */
  private createContentWithMarkers(markedContent: string, existingContent?: string): string {
    const markerSection = `${AgentsStandardConfigurator.START_MARKER}\n${markedContent}\n${AgentsStandardConfigurator.END_MARKER}`;
    
    if (!existingContent) {
      return markerSection;
    }
    
    // If we have existing content but no markers, append the markers at the end
    return `${existingContent}\n\n${markerSection}`;
  }
  
  /**
   * Creates a new root AGENTS.md file with markers
   * 
   * @param initialContent - Initial content to place between markers
   * @returns UpdateResult indicating success or failure
   */
  createRootAgentsFile(initialContent: string): UpdateResult {
    try {
      // Ensure parent directory exists
      const parentDir = path.dirname(this.rootAgentsPath);
      if (!fs.existsSync(parentDir)) {
        throw new Error(`Parent directory does not exist: ${parentDir}`);
      }
      
      // Create content with markers
      const content = this.createContentWithMarkers(initialContent);
      
      // Write file
      fs.writeFileSync(this.rootAgentsPath, content, 'utf-8');
      
      return {
        success: true,
        filePath: this.rootAgentsPath,
        createdNewFile: true,
        contentUpdated: true
      };
    } catch (error) {
      return {
        success: false,
        filePath: this.rootAgentsPath,
        error: `Failed to create root AGENTS.md file: ${this.getErrorMessage(error)}`
      };
    }
  }
  
  /**
   * Updates the root AGENTS.md file with new content between markers
   * 
   * @param newMarkedContent - The new content to place between markers
   * @returns UpdateResult indicating success or failure
   */
  updateRootAgentsFile(newMarkedContent: string): UpdateResult {
    const fileExistedBefore = fs.existsSync(this.rootAgentsPath);
    
    // Save backup if rollback is enabled
    let backupPath: string | null = null;
    if (this.enableRollback && fileExistedBefore) {
      try {
        backupPath = `${this.rootAgentsPath}${AgentsStandardConfigurator.BACKUP_EXTENSION}`;
        fs.copyFileSync(this.rootAgentsPath, backupPath);
      } catch (error) {
        // If we can't create a backup, continue without it
        console.warn(`Warning: Could not create backup file: ${this.getErrorMessage(error)}`);
        backupPath = null;
      }
    }
    
    try {
      let content: string;
      let contentUpdated = false;
      
      // Read existing content or create new file
      if (fs.existsSync(this.rootAgentsPath)) {
        content = fs.readFileSync(this.rootAgentsPath, 'utf-8');
        
        // Check if content actually needs to be updated
        const existingMarkedContent = this.extractMarkedContent(content);
        if (existingMarkedContent !== newMarkedContent) {
          content = this.updateContentWithMarkers(content, newMarkedContent);
          contentUpdated = true;
        }
      } else {
        // Create new file with markers
        content = this.createContentWithMarkers(newMarkedContent);
        contentUpdated = true;
      }
      
      // Write updated content
      fs.writeFileSync(this.rootAgentsPath, content, 'utf-8');
      
      // Remove backup since operation succeeded
      if (backupPath && fs.existsSync(backupPath)) {
        try {
          fs.unlinkSync(backupPath);
        } catch (error) {
          // Ignore errors when removing backup
          console.warn(`Warning: Could not remove backup file: ${this.getErrorMessage(error)}`);
        }
      }
      
      return {
        success: true,
        filePath: this.rootAgentsPath,
        contentUpdated,
        createdNewFile: !fileExistedBefore
      };
    } catch (error) {
      // Rollback if enabled and backup exists
      if (this.enableRollback && backupPath && fs.existsSync(backupPath)) {
        try {
          fs.copyFileSync(backupPath, this.rootAgentsPath);
          // Remove backup after successful rollback
          fs.unlinkSync(backupPath);
        } catch (rollbackError) {
          console.error(`Rollback failed: ${this.getErrorMessage(rollbackError)}`);
        }
      } else if (backupPath && fs.existsSync(backupPath)) {
        // Remove backup if it exists but rollback wasn't performed
        try {
          fs.unlinkSync(backupPath);
        } catch (unlinkError) {
          console.warn(`Could not remove backup file: ${this.getErrorMessage(unlinkError)}`);
        }
      }
      
      return {
        success: false,
        filePath: this.rootAgentsPath,
        error: `Failed to update root AGENTS.md file: ${this.getErrorMessage(error)}`
      };
    }
  }
  
  /**
   * Validates marker syntax in content
   * 
   * @param content - The content to validate
   * @returns True if markers are properly formatted, false otherwise
   */
  validateMarkerSyntax(content: string): boolean {
    const startMarkers = (content.match(new RegExp(AgentsStandardConfigurator.START_MARKER, 'g')) || []).length;
    const endMarkers = (content.match(new RegExp(AgentsStandardConfigurator.END_MARKER, 'g')) || []).length;
    
    // Must have equal numbers of start and end markers
    if (startMarkers !== endMarkers) {
      return false;
    }
    
    // Validate proper ordering
    if (startMarkers > 0) {
      let lastIndex = 0;
      for (let i = 0; i < startMarkers; i++) {
        const startIdx = content.indexOf(AgentsStandardConfigurator.START_MARKER, lastIndex);
        const endIdx = content.indexOf(AgentsStandardConfigurator.END_MARKER, startIdx + 1);
        
        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
          return false;
        }
        
        lastIndex = endIdx + 1;
      }
    }
    
    return true;
  }
  
  /**
   * Gets the path to the root AGENTS.md file
   * 
   * @returns The absolute path to the root AGENTS.md file
   */
  getRootAgentsPath(): string {
    return this.rootAgentsPath;
  }
  
  /**
   * Gets the path to the OpenSpec AGENTS.md file
   * 
   * @returns The absolute path to the OpenSpec AGENTS.md file
   */
  getOpenSpecAgentsPath(): string {
    return this.openSpecAgentsPath;
  }
  
  /**
   * Gets a standardized error message from an unknown error
   * 
   * @param error - The error to process
   * @returns A string representation of the error
   */
  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}