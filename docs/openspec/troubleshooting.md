# OpenSpec Troubleshooting Guide

This guide helps you resolve common issues when using OpenSpec with Qwen Code.

## Table of Contents

1. [Initialization Issues](#initialization-issues)
2. [Command Problems](#command-problems)
3. [File and Directory Issues](#file-and-directory-issues)
4. [Validation Errors](#validation-errors)
5. [Integration Issues](#integration-issues)
6. [Performance Problems](#performance-problems)

## Initialization Issues

### "OpenSpec is not initialized in this project"

**Problem:** You receive an error message indicating OpenSpec is not initialized.

**Solution:**
1. Run the initialization command:
   ```
   /openspec init
   ```
2. Verify the directory structure was created:
   ```
   ls -la openspec/
   ```
   You should see `specs/`, `changes/`, and `archive/` directories.

### "An 'openspec' directory already exists but does not have the expected structure"

**Problem:** The `openspec` directory exists but doesn't have the correct subdirectories.

**Solution:**
1. Check the current structure:
   ```
   ls -la openspec/
   ```
2. If the directory is empty or incomplete, you can either:
   - Remove it and reinitialize:
     ```
     rm -rf openspec/
     /openspec init
     ```
   - Manually create the required directories:
     ```
     mkdir -p openspec/specs openspec/changes openspec/archive
     ```

### "OpenSpec requires Node.js >= 20.19.0"

**Problem:** Your Node.js version is incompatible with OpenSpec.

**Solution:**
1. Check your current Node.js version:
   ```
   node --version
   ```
2. Upgrade Node.js to version 20.19.0 or later:
   - Using nvm:
     ```
     nvm install 20.19.0
     nvm use 20.19.0
     ```
   - Or download from [nodejs.org](https://nodejs.org/)

## Command Problems

### Command Not Found

**Problem:** You receive an error that an OpenSpec command doesn't exist.

**Solution:**
1. Verify you're using the correct syntax:
   ```
   /openspec <subcommand>
   ```
2. Check available commands:
   ```
   /help openspec
   ```
3. Ensure you're in a directory with Qwen Code installed

### Arguments Not Recognized

**Problem:** Command arguments are not being processed correctly.

**Solution:**
1. Check the command syntax:
   ```
   /help openspec <subcommand>
   ```
2. Ensure proper spacing and quoting:
   ```
   # Correct
   /openspec change add-user-authentication
   
   # Incorrect
   /openspec change "add-user-authentication"
   ```
3. For commands with flags, place them after the main argument:
   ```
   /openspec archive change-name --yes
   ```

### Commands Not Producing Expected Output

**Problem:** Commands run successfully but don't produce the expected results.

**Solution:**
1. Verify you're in the correct project directory
2. Check that OpenSpec is properly initialized
3. Ensure you have read/write permissions for the openspec directory
4. Try running the command with verbose output (if available)

## File and Directory Issues

### Permission Denied Errors

**Problem:** You receive permission errors when running OpenSpec commands.

**Solution:**
1. Check directory permissions:
   ```
   ls -la openspec/
   ```
2. Fix permissions if necessary:
   ```
   chmod -R u+rwx openspec/
   ```
3. Ensure you're running Qwen Code with appropriate privileges

### Files Not Being Created

**Problem:** Expected files are not being created by OpenSpec commands.

**Solution:**
1. Verify the openspec directory structure exists:
   ```
   ls -la openspec/specs/ openspec/changes/ openspec/archive/
   ```
2. Check available disk space:
   ```
   df -h
   ```
3. Ensure you have write permissions in the project directory

### File Content Issues

**Problem:** Generated files contain unexpected content or are empty.

**Solution:**
1. Check if the command completed successfully
2. Verify template files are properly formatted
3. Ensure there's sufficient disk space
4. Try running the command again

## Validation Errors

### "Required file not found"

**Problem:** Validation fails because a required file is missing.

**Solution:**
1. Check which files are required for the change:
   - `proposal.md`
   - `tasks.md`
2. Create missing files:
   ```
   touch openspec/changes/<change-name>/proposal.md
   touch openspec/changes/<change-name>/tasks.md
   ```
3. Add appropriate content to the files

### "File is empty"

**Problem:** Validation warns that a file is empty.

**Solution:**
1. Open the file in your editor:
   ```
   /openspec spec edit <spec-path>
   ```
2. Add appropriate content to the file
3. Re-run validation:
   ```
   /openspec validate <change-name>
   ```

### "Invalid file format"

**Problem:** Files don't follow the expected format.

**Solution:**
1. Check the file structure against examples
2. Ensure markdown files have proper headings
3. Verify JSON examples are valid
4. Follow the templates provided by OpenSpec

## Integration Issues

### Specifications Not Available to AI

**Problem:** AI assistants don't seem to be using your specifications.

**Solution:**
1. Verify OpenSpec is properly initialized
2. Check that specifications are in the correct location (`openspec/specs/`)
3. Ensure changes are properly structured in `openspec/changes/`
4. Run `/openspec update` to refresh AI guidance

### Changes Not Appearing in Lists

**Problem:** Created changes don't appear when running `/openspec list`.

**Solution:**
1. Verify the change directory exists:
   ```
   ls -la openspec/changes/
   ```
2. Check that the directory name matches what you're looking for
3. Ensure the directory is not empty
4. Restart Qwen Code if necessary

### Archive Operations Failing

**Problem:** `/openspec archive` command fails to move changes.

**Solution:**
1. Check if the change exists in `openspec/changes/`:
   ```
   ls -la openspec/changes/<change-name>/
   ```
2. Verify the archive directory exists:
   ```
   ls -la openspec/archive/
   ```
3. Check for naming conflicts in the archive directory
4. Ensure you have write permissions for both directories

## Performance Problems

### Slow Command Execution

**Problem:** OpenSpec commands take a long time to execute.

**Solution:**
1. Check the size of your specification files:
   ```
   du -sh openspec/
   ```
2. Look for excessively large files that might slow processing
3. Ensure your system has sufficient resources (RAM, CPU)
4. Check for file system issues or network drives that might be slow

### High Memory Usage

**Problem:** OpenSpec commands consume excessive memory.

**Solution:**
1. Check for very large specification files
2. Break up large specifications into smaller, focused documents
3. Ensure your system has adequate RAM
4. Close other memory-intensive applications

### File Watching Issues

**Problem:** Changes to specification files aren't being detected automatically.

**Solution:**
1. Verify file watching is enabled in Qwen Code
2. Check system limits for file watchers:
   ```
   # On Linux/macOS
   sysctl fs.inotify.max_user_watches
   ```
3. Increase limits if necessary
4. Restart Qwen Code to reinitialize file watching

## Advanced Troubleshooting

### Debugging with Logs

If you're experiencing persistent issues, enable verbose logging:

1. Set environment variables for more detailed output:
   ```bash
   export DEBUG=openspec:*
   ```

2. Run Qwen Code with debug output:
   ```bash
   DEBUG=openspec:* qwen
   ```

### Manual Directory Operations

For persistent issues, you can manually manage the OpenSpec directory structure:

1. Create directories:
   ```bash
   mkdir -p openspec/specs openspec/changes openspec/archive
   ```

2. Copy template files from a working installation

3. Ensure proper permissions:
   ```bash
   chmod -R 755 openspec/
   ```

### Resetting OpenSpec

If you need to completely reset OpenSpec:

1. Backup any important specifications:
   ```bash
   cp -r openspec/ openspec-backup/
   ```

2. Remove the openspec directory:
   ```bash
   rm -rf openspec/
   ```

3. Reinitialize:
   ```
   /openspec init
   ```

4. Restore your specifications:
   ```bash
   cp -r openspec-backup/specs/* openspec/specs/
   ```

## Getting Additional Help

If you're unable to resolve an issue with these troubleshooting steps:

1. **Check Documentation**: Review the usage guide and best practices documents
2. **Update Qwen Code**: Ensure you're using the latest version
3. **Search Issues**: Check if others have experienced similar problems
4. **Report Bugs**: If you believe you've found a bug, report it with:
   - Qwen Code version
   - Node.js version
   - Operating system
   - Steps to reproduce
   - Error messages
   - Expected vs. actual behavior

### Community Resources

- Qwen Code GitHub repository issues
- OpenSpec community forums
- Stack Overflow (tag questions with "openspec" and "qwen-code")

By following this troubleshooting guide, you should be able to resolve most common issues with OpenSpec in Qwen Code. If problems persist, don't hesitate to seek help from the community or file a bug report.