/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { TestRig, printDebugInfo, validateModelOutput } from './test-helper.js';

describe('openspec workflow', () => {
  it('should be able to initialize OpenSpec and create a change proposal', async () => {
    const rig = new TestRig();
    await rig.setup('should be able to initialize OpenSpec and create a change proposal');

    // First, initialize OpenSpec
    const initPrompt = 'Initialize OpenSpec in this project';
    
    const initResult = await rig.run(initPrompt);
    
    // Wait for the init command to be called
    const initToolCall = await rig.waitForToolCall('initCommand');
    
    // Add debugging information
    if (!initToolCall) {
      printDebugInfo(rig, initResult);
    }
    
    expect(initToolCall, 'Expected to find an initCommand tool call').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      initResult,
      ['OpenSpec successfully initialized', 'specs/', 'changes/', 'archive/'],
      'OpenSpec initialization test',
    );
    
    // Check that the openspec directory structure was created
    const openspecExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(openspecExists).toContain('openspec/');
    
    // Check that sample files were created
    const sampleSpecExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(sampleSpecExists).toContain('openspec/specs/sample-spec.md');
    
    const sampleChangeExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(sampleChangeExists).toContain('openspec/changes/sample-change/proposal.md');
    
    // Now create a new change proposal
    const changePrompt = 'Create a new change proposal called "user-authentication" with a proposal to implement user login and registration functionality';
    
    const changeResult = await rig.run(changePrompt);
    
    // Wait for the change command to be called
    const changeToolCall = await rig.waitForToolCall('changeCommand');
    
    // Add debugging information
    if (!changeToolCall) {
      printDebugInfo(rig, changeResult);
    }
    
    expect(changeToolCall, 'Expected to find a changeCommand tool call').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      changeResult,
      ['Created new change proposal', 'user-authentication', 'proposal.md', 'tasks.md'],
      'OpenSpec change creation test',
    );
    
    // Check that the change directory was created
    const changeDirExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(changeDirExists).toContain('openspec/changes/user-authentication/');
    
    // Check that the change files were created
    const proposalExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(proposalExists).toContain('openspec/changes/user-authentication/proposal.md');
    
    const tasksExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(tasksExists).toContain('openspec/changes/user-authentication/tasks.md');
    
    // Log success info if verbose
    vi.stubEnv('VERBOSE', 'true');
    if (process.env['VERBOSE'] === 'true') {
      console.log('OpenSpec workflow test completed successfully');
    }
  });

  it('should be able to list and show change proposals', async () => {
    const rig = new TestRig();
    await rig.setup('should be able to list and show change proposals');
    
    // First, initialize OpenSpec
    const initPrompt = 'Initialize OpenSpec in this project';
    await rig.run(initPrompt);
    await rig.waitForToolCall('initCommand');
    
    // Create a change proposal
    const changePrompt = 'Create a change proposal called "api-improvements" to enhance the REST API endpoints';
    await rig.run(changePrompt);
    await rig.waitForToolCall('changeCommand');
    
    // List the changes
    const listPrompt = 'List all active changes in the OpenSpec project';
    
    const listResult = await rig.run(listPrompt);
    
    // Wait for the list command to be called
    const listToolCall = await rig.waitForToolCall('listCommand');
    
    // Add debugging information
    if (!listToolCall) {
      printDebugInfo(rig, listResult);
    }
    
    expect(listToolCall, 'Expected to find a listCommand tool call').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      listResult,
      ['Active changes', 'api-improvements', 'sample-change'],
      'OpenSpec list changes test',
    );
    
    // Show details of a specific change
    const showPrompt = 'Show details of the "api-improvements" change';
    
    const showResult = await rig.run(showPrompt);
    
    // Wait for the show command to be called
    const showToolCall = await rig.waitForToolCall('showCommand');
    
    // Add debugging information
    if (!showToolCall) {
      printDebugInfo(rig, showResult);
    }
    
    expect(showToolCall, 'Expected to find a showCommand tool call').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      showResult,
      ['Change: api-improvements', 'Proposal', 'Tasks', 'design.md'],
      'OpenSpec show change test',
    );
    
    // Log success info if verbose
    vi.stubEnv('VERBOSE', 'true');
    if (process.env['VERBOSE'] === 'true') {
      console.log('OpenSpec list and show test completed successfully');
    }
  });

  it('should be able to create and manage specifications', async () => {
    const rig = new TestRig();
    await rig.setup('should be able to create and manage specifications');
    
    // First, initialize OpenSpec
    const initPrompt = 'Initialize OpenSpec in this project';
    await rig.run(initPrompt);
    await rig.waitForToolCall('initCommand');
    
    // Create a new specification
    const createSpecPrompt = 'Create a new specification called "auth/user-authentication" to define the user authentication system';
    
    const createSpecResult = await rig.run(createSpecPrompt);
    
    // Wait for the spec command to be called
    const specToolCall = await rig.waitForToolCall('specCommand');
    
    // Add debugging information
    if (!specToolCall) {
      printDebugInfo(rig, createSpecResult);
    }
    
    expect(specToolCall, 'Expected to find a specCommand tool call').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      createSpecResult,
      ['Created new specification', 'auth/user-authentication'],
      'OpenSpec spec creation test',
    );
    
    // Check that the spec file was created
    const specExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(specExists).toContain('openspec/specs/auth/user-authentication.md');
    
    // Edit the specification
    const editSpecPrompt = 'Show the "auth/user-authentication" specification';
    
    const editSpecResult = await rig.run(editSpecPrompt);
    
    // Wait for the spec command to be called again
    const editSpecToolCall = await rig.waitForToolCall('specCommand');
    
    // Add debugging information
    if (!editSpecToolCall) {
      printDebugInfo(rig, editSpecResult);
    }
    
    expect(editSpecToolCall, 'Expected to find a specCommand tool call for editing').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      editSpecResult,
      ['Specification "auth/user-authentication"', 'Requirements', 'Implementation Details'],
      'OpenSpec spec edit test',
    );
    
    // Log success info if verbose
    vi.stubEnv('VERBOSE', 'true');
    if (process.env['VERBOSE'] === 'true') {
      console.log('OpenSpec specification management test completed successfully');
    }
  });

  it('should be able to validate changes and archive completed ones', async () => {
    const rig = new TestRig();
    await rig.setup('should be able to validate changes and archive completed ones');
    
    // First, initialize OpenSpec
    const initPrompt = 'Initialize OpenSpec in this project';
    await rig.run(initPrompt);
    await rig.waitForToolCall('initCommand');
    
    // Create a change proposal
    const changePrompt = 'Create a change proposal called "completed-feature" for a feature that is ready to be archived';
    await rig.run(changePrompt);
    await rig.waitForToolCall('changeCommand');
    
    // Validate the change
    const validatePrompt = 'Validate the "completed-feature" change to check for any issues';
    
    const validateResult = await rig.run(validatePrompt);
    
    // Wait for the validate command to be called
    const validateToolCall = await rig.waitForToolCall('validateCommand');
    
    // Add debugging information
    if (!validateToolCall) {
      printDebugInfo(rig, validateResult);
    }
    
    expect(validateToolCall, 'Expected to find a validateCommand tool call').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      validateResult,
      ['Validating change: completed-feature', 'No issues found'],
      'OpenSpec validate change test',
    );
    
    // Archive the change
    const archivePrompt = 'Archive the "completed-feature" change since it is completed';
    
    const archiveResult = await rig.run(archivePrompt);
    
    // Wait for the archive command to be called
    const archiveToolCall = await rig.waitForToolCall('archiveCommand');
    
    // Add debugging information
    if (!archiveToolCall) {
      printDebugInfo(rig, archiveResult);
    }
    
    expect(archiveToolCall, 'Expected to find an archiveCommand tool call').toBeTruthy();
    
    // Validate model output
    validateModelOutput(
      archiveResult,
      ['Change "completed-feature" has been archived successfully'],
      'OpenSpec archive change test',
    );
    
    // Check that the change was moved to archive
    const archivedExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(archivedExists).toContain('openspec/archive/completed-feature/');
    
    const changeNoLongerExists = rig.readFile('.qwen/checkpoint/files.json');
    expect(changeNoLongerExists).not.toContain('openspec/changes/completed-feature/');
    
    // Log success info if verbose
    vi.stubEnv('VERBOSE', 'true');
    if (process.env['VERBOSE'] === 'true') {
      console.log('OpenSpec validation and archiving test completed successfully');
    }
  });
});