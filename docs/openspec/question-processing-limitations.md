# OpenSpec Question Processing: Inconsistencies and Limitations

This document outlines the discovered inconsistencies and limitations in the current OpenSpec question-processing approach.

## Inconsistencies

### 1. Deprecated vs. Active Question Feature

**Issue**: There's a clear inconsistency in how the question feature is handled:
- The feature is marked as deprecated with explicit error messages for the direct syntax `/openspec submit "question: ..."`
- But the underlying implementation, components, and integration points remain active for the activity-based approach
- The deprecation only applies to the specific syntax but not to the general question activity type

**Impact**: This creates confusion for users who may try the deprecated syntax and get an error message, but can still use the question activity through the interactive workflow.

### 2. Documentation vs. Implementation Mismatch

**Issue**: The documentation refers to question functionality in the `apply` command, but the actual implementation is in the `submit` command.

**Impact**: Users following the documentation will not find the question functionality where they expect it.

## Limitations

### 1. Context Extraction Limitations

**Issue**: The current keyword-based approach for extracting context has several limitations:
- Only extracts words with 3 or more characters, missing important shorter terms
- Doesn't handle special programming terms with symbols (like `@decorator`, `#method`, `variable_name`)
- No filtering for common English stop words that don't contribute to code search
- No semantic analysis or understanding of technical terminology
- Searches each keyword independently rather than finding files that match multiple keywords

**Impact**: This can lead to less relevant context being provided to the LLM, potentially resulting in less accurate answers.

### 2. Content Extraction Limitations

**Issue**: The current approach has limitations in content extraction:
- Hard-coded 3000 character limit may truncate important information
- No intelligent extraction of relevant sections based on keywords
- No prioritization of file content (e.g., class definitions over comments)
- Simple concatenation without organization by relevance or type

**Impact**: Important information may be missed or less relevant information may be included, affecting answer quality.

### 3. Conceptual Mismatch

**Issue**: The current implementation requires selecting a change name before asking a question, which doesn't align with the concept that questions are general inquiries not tied to specific changes.

**Impact**: This creates an unintuitive workflow for users who want to ask general questions about the codebase.

### 4. Parameter Structure Issues

**Issue**: The question processing function signature requires a change name that isn't actually needed for general questions.

**Impact**: This creates unnecessary coupling between questions and specific changes.

## Recommendations for Future Improvements

### 1. Resolve Inconsistencies

- Either fully enable or fully disable the question feature across all access methods
- Update documentation to accurately reflect where question functionality exists
- Provide clearer guidance on how to use the question feature

### 2. Enhance Context Extraction

- Implement semantic search to find files semantically related to the question
- Add stop word filtering to eliminate common English words that don't help with code search
- Improve keyword processing to handle programming-specific syntax

### 3. Improve Content Extraction

- Use more intelligent methods to extract relevant content based on where keywords appear
- Prioritize code over comments and extract entire functions or classes that contain keywords
- Implement dynamic context sizing based on question complexity and token budget

### 4. Refactor Question Workflow

- Allow general questions without requiring a change name
- Decouple question processing from change-specific workflows
- Simplify the parameter structure for question processing

## Conclusion

While the current implementation provides basic question-answering functionality, there are several inconsistencies and limitations that should be addressed in future iterations. The most pressing issues are the mixed messaging about deprecation and the conceptual mismatch between how questions are handled and how they should logically work.