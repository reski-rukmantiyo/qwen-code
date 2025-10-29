# Troubleshooting Guide: Question Submission Errors and Resolutions

This guide provides solutions for common issues encountered when using the question functionality in the `/openspec submit` command.

## Common Issues and Solutions

### 1. "Configuration not available" Error

**Error Message**: `Configuration not available. Cannot process question.`

**Cause**: The OpenSpec system is not properly initialized or the configuration is not accessible.

**Solution**:
1. Ensure OpenSpec is initialized in your project:
   ```bash
   /openspec init
   ```
2. Verify that you're running the command in a directory with an initialized OpenSpec project
3. Restart Qwen Code if the issue persists

### 2. "LLM client not available" Error

**Error Message**: `LLM client not available. Cannot process question.`

**Cause**: The AI language model client is not properly configured or accessible.

**Solution**:
1. Check your Qwen Code authentication status:
   ```bash
   /auth
   ```
2. Ensure you have a valid Qwen API key or are logged in with Google credentials
3. Verify your internet connection
4. Check that the Qwen Code service is functioning properly

### 3. "OpenSpec is not initialized" Error

**Error Message**: `OpenSpec is not initialized in this project. Run /openspec init first.`

**Cause**: Attempting to use the question functionality in a directory without an initialized OpenSpec project.

**Solution**:
1. Initialize OpenSpec in your project:
   ```bash
   /openspec init
   ```
2. Ensure you're running the command in the correct project directory
3. Verify that the `openspec` directory exists in your project root

### 4. No Relevant Context Found

**Issue**: The response indicates that no relevant source code context was found.

**Cause**: The keywords in your question don't match any files in the project, or all matching files were filtered out.

**Solution**:
1. Rephrase your question with more specific technical terms:
   - Instead of: "How does this work?"
   - Try: "How does the file search functionality work?"
2. Check that the files you're asking about actually exist in the project
3. Ensure that the files are not excluded by .gitignore or .qwenignore patterns

### 5. Slow Response Times

**Issue**: Questions take a long time to process.

**Cause**: Large codebase, complex questions, or network latency.

**Solution**:
1. Simplify your question to focus on specific aspects:
   - Instead of: "Explain the entire authentication system"
   - Try: "How is JWT token validation implemented?"
2. Ensure you have a stable internet connection
3. Consider asking questions about smaller, more focused areas of the codebase

### 6. Incomplete or Vague Answers

**Issue**: The response doesn't fully address your question.

**Cause**: Insufficient context in the retrieved files or limitations in the AI model's understanding.

**Solution**:
1. Make your question more specific and detailed:
   - Instead of: "How does search work?"
   - Try: "How does the file search functionality handle binary files and what algorithms are used for text search?"
2. Ask follow-up questions to get more details
3. Reference specific files or components if you know them:
   - "In the searchCommand.ts file, how does the filtering logic work?"

### 7. Binary File Processing Errors

**Issue**: Errors related to processing non-text files.

**Cause**: The system attempted to process binary files as text.

**Solution**:
1. The system should automatically filter out binary files, but if you encounter this issue:
   - Ensure your question focuses on text-based source code files
   - Avoid asking about binary assets like images or compiled files
2. Check that the IGNORED_EXTENSIONS list in qaHandler.ts is up to date

### 8. File Size Limitations

**Issue**: Very large files are not included in the context.

**Cause**: Files larger than 100KB are automatically skipped to prevent memory issues.

**Solution**:
1. This is by design to prevent performance issues
2. If you need information from large files, ask more specific questions about particular functions or classes within those files
3. Consider breaking down large files into smaller, more focused questions

### 9. Permission Denied Errors

**Issue**: Unable to read certain files due to file system permissions.

**Cause**: The Qwen Code process doesn't have read permissions for certain files.

**Solution**:
1. Check file permissions on the files in question:
   ```bash
   ls -la <filename>
   ```
2. Ensure that the files are readable by the user running Qwen Code
3. If files are intentionally restricted, ask questions about accessible parts of the codebase instead

### 10. Network Timeout Errors

**Issue**: Connection timeouts when communicating with the AI service.

**Cause**: Poor network connectivity or service interruptions.

**Solution**:
1. Check your internet connection
2. Try again after a few minutes if the service is temporarily unavailable
3. Consider using the feature during off-peak hours if you're experiencing consistent timeouts

## Best Practices for Better Results

### Crafting Effective Questions

1. **Be Specific**: Include technical terms, function names, or file names when known
2. **Focus on One Topic**: Ask about one concept or feature at a time
3. **Provide Context**: If relevant, mention the broader area you're interested in

### Examples of Good Questions

- "How does the FileSearchFactory in qaHandler.ts determine which files to include in the context?"
- "What is the difference between the extractSourceCodeContext and generateAnswerStream functions?"
- "How does the question-mode detection work in submitCommand.ts?"

### Examples of Questions That Might Need Refinement

- "Tell me about the code" → Too vague
- "How does everything work?" → Too broad
- "Explain this project" → Unclear scope

## Debugging Steps

If you encounter an unexpected error:

1. **Check the Error Message**: Note the exact error message and any file names or line numbers mentioned
2. **Verify OpenSpec Initialization**: Ensure `/openspec init` has been run successfully
3. **Test Basic Functionality**: Try a simple question like "What files are in this project?"
4. **Check Logs**: Look for any additional error information in Qwen Code's logs
5. **Restart Qwen Code**: Sometimes a simple restart resolves transient issues
6. **Update Qwen Code**: Ensure you're using the latest version

## Reporting Issues

If you continue to experience problems:

1. Note the exact command you ran
2. Record the complete error message
3. Include information about your environment:
   - Qwen Code version
   - Operating system
   - Project type and size
4. Report the issue through Qwen Code's feedback mechanism or GitHub issues

## Performance Considerations

- Questions with many keywords may take longer to process as the system searches more files
- Very large projects may require more time for context retrieval
- Complex questions that require analysis of many code segments may take longer to answer
- The system caches file search results for 1 minute to improve performance for repeated questions