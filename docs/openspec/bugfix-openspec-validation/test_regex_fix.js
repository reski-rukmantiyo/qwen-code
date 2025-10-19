#!/usr/bin/env node

/**
 * Test script to verify the OpenSpec validation bug fix
 * This script tests the regex patterns used in the validation functions
 */

// Test content that should pass validation
const testContent = `# Test Specification

## ADDED Requirements

### Requirement: Test Requirement
This is a test requirement.

#### Scenario: Test Scenario
- **WHEN** the test runs
- **THEN** it should pass validation

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements`;

// Test the current buggy regex pattern
console.log('Testing current buggy regex pattern:');
const buggyPattern = /^## [A-Z]+/gm;
const buggyMatches = testContent.match(buggyPattern) || [];
console.log('Matches:', buggyMatches);

// Test the corrected regex pattern
console.log('\nTesting corrected regex pattern:');
const correctedPattern = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/gm;
const correctedMatches = testContent.match(correctedPattern) || [];
console.log('Matches:', correctedMatches);

// Show validation comparison
console.log('\nValidation Comparison:');
const validHeaders = ['## ADDED Requirements', '## MODIFIED Requirements', '## REMOVED Requirements', '## RENAMED Requirements'];

console.log('With buggy pattern:');
buggyMatches.forEach(match => {
  const isValid = validHeaders.includes(match);
  console.log(`  "${match}" -> ${isValid ? 'VALID' : 'INVALID'}`);
});

console.log('With corrected pattern:');
correctedMatches.forEach(match => {
  const isValid = validHeaders.includes(match);
  console.log(`  "${match}" -> ${isValid ? 'VALID' : 'INVALID'}`);
});