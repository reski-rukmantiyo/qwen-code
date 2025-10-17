/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box } from 'ink';
import { ChangeDashboard } from '../openspec/ChangeDashboard.js';
import { SpecificationViewer } from '../openspec/SpecificationViewer.js';

interface OpenSpecDashboardMessageProps {
  // For now, we'll just render a simple placeholder
  // In a full implementation, we would fetch and display actual data
}

export const OpenSpecDashboardMessage: React.FC<OpenSpecDashboardMessageProps> = () => {
  // Sample data for demonstration
  const sampleChanges = [
    {
      id: 'change-1',
      name: 'api-authentication',
      status: 'in-progress' as const,
      lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      description: 'Implement JWT-based authentication for API endpoints',
    },
    {
      id: 'change-2',
      name: 'database-migration',
      status: 'review' as const,
      lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      description: 'Migrate user data to new schema with enhanced security',
    },
    {
      id: 'change-3',
      name: 'ui-components',
      status: 'draft' as const,
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      description: 'Create reusable UI components for dashboard views',
    },
  ];

  const sampleSpecContent = `# Authentication API Specification

## Overview
This specification defines the authentication endpoints for the Qwen Code API.

## Endpoints

### POST /auth/login
Authenticate a user with email and password.

**Request Body:**
\`\`\`json
{
  "email": "string",
  "password": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "string",
  "expiresIn": "number"
}
\`\`\`

## Security
All endpoints require HTTPS and use JWT tokens for authorization.
`;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <ChangeDashboard changes={sampleChanges} />
      </Box>
      <Box>
        <SpecificationViewer 
          content={sampleSpecContent} 
          fileName="specs/auth/api-spec.md" 
        />
      </Box>
    </Box>
  );
};