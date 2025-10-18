# Delta Operations

Qwen Code's OpenSpec integration uses structured delta operations to represent changes to specifications. This approach enables precise tracking of what is being modified and programmatic application of changes during the archiving process.

## Delta Operation Types

There are four types of delta operations:

### ADDED
Represents new content being added to a specification.

```markdown
## [ADDED] New Feature Name
Description of what is being added.
```

### MODIFIED
Represents existing content being changed.

```markdown
## [MODIFIED] Existing Feature Name
Description of what is being modified.
```

### REMOVED
Represents content being removed from a specification.

```markdown
## [REMOVED] Deprecated Feature Name
Description of what is being removed.
```

### RENAMED
Represents content being renamed.

```markdown
## [RENAMED] Old Name -> New Name
Description of what is being renamed.
```

## Delta File Structure

Delta files are stored in the `changes/<change-name>/specs/` directory and follow this structure:

```markdown
## [ADDED] New Feature or Section
...

## [MODIFIED] Existing Feature
...

## [REMOVED] Deprecated Feature
...

## [RENAMED] Old Name -> New Name
...
```

Note: Unlike the example in the previous version, delta files don't require a top-level heading as they directly contain the delta operations.

## Example Delta File

```markdown
## [ADDED] User Search Endpoint
Adds a new endpoint for searching users by various criteria.

### Endpoint
POST /api/users/search

### Request
{
  "query": "string",
  "filters": {
    "department": "string",
    "role": "string"
  }
}

### Response
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  ]
}

## [MODIFIED] Rate Limiting Policy
Updates the global rate limit policy.

## [REMOVED] Legacy User Endpoints
Removes deprecated legacy endpoints.

## [RENAMED] Authentication Header -> Authorization Header
Renames the authentication header for consistency.
```

## Validation Rules

Delta files are validated for:
- Proper operation header format (`## [TYPE] Header`) where TYPE is one of ADDED, MODIFIED, REMOVED, or RENAMED
- Non-empty operation headers
- Correct RENAMED format (`Previous Header -> New Header`)
- Presence of at least one valid operation
- Validations performed by `DeltaOperationsParser.validateDeltaFormat()`

Additional validation during archiving:
- MODIFIED, REMOVED, and RENAMED operations must reference existing requirements in the baseline specification
- If no baseline exists, only ADDED operations are permitted
- Validation performed by `DeltaApplier.validateDeltaApplication()`

## Application During Archiving

When a change is archived using `/openspec archive <change-name>`, the delta operations are programmatically applied to the baseline specifications:

1. Each specification file in `changes/<change-name>/specs/` is processed
2. For each file, delta operations are parsed using `DeltaOperationsParser.parseDeltaOperations()`
3. Operations are validated against the baseline using `DeltaApplier.validateDeltaApplication()`
4. Operations are applied to the baseline using `DeltaApplier.applyDelta()`:
   - ADDED operations create new requirements in the baseline
   - MODIFIED operations update existing requirement headers (content replacement in current implementation)
   - REMOVED operations delete requirements from the baseline
   - RENAMED operations update requirement headers from old to new names
5. The merged result becomes the new baseline specification, ensuring that all changes are properly incorporated
6. The change directory is then moved to the `openspec/archive/` directory

The application process ensures that baseline specifications maintain the structured format with Requirement and Scenario headers as validated by `SpecificationValidator`.