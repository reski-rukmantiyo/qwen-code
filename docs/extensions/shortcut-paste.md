**Feature: Smart Clipboard Paste Handling for CLI AI Coding Tool**

**Status:** IMPLEMENTED

**Goal:** Improve UX when pasting large content by displaying compact placeholders while preserving the full content behind the scenes.

**Workflow:**

1. **On Paste Event (before Enter):**
   - Detect when user pastes content
   - If content > 50 characters:
     - Assign a sequential number to this paste (1, 2, 3, etc. within the current input session)
     - Display shortened placeholder: `[Paste #N: X chars]` (where N = paste number, X = character count)
     - Save actual clipboard content to: `~/.qwen/tmp/paste/[session_id]/paste-N`
   - If content ≤ 50 characters:
     - Just paste normally (no special handling)

2. **On Enter Key Press:**
   - Parse the text input to find all `[Paste #N: X chars]` placeholders
   - For each placeholder found:
     - Extract the paste number N
     - Load the corresponding content from `~/.qwen/tmp/paste/[session_id]/paste-N`
     - Replace `[Paste #N: X chars]` with the actual content
   - Delete all paste files in the session directory
   - Reset paste counter to 0 (so next paste starts at #1 again)
   - Submit the complete content with all pastes restored

3. **On /clear Command:**
   - Clear current input
   - Delete all paste files in the session directory
   - Reset paste counter to 0

**Multiple Pastes Handling:**
- Support multiple pastes in a single input session with sequential numbering
- Each paste gets its own file: `paste-1`, `paste-2`, `paste-3`, etc.
- The placeholder format `[Paste #N: X chars]` contains the paste number N, which maps directly to the file `paste-N`
- All placeholders are matched and replaced with their corresponding content on submission
- Allows users to paste multiple pieces of content (error logs, code snippets, config files) before submitting
- After submission (Enter key), the counter resets for the next input session

**Implementation Details:**
- Implemented in `packages/cli/src/ui/components/InputPrompt.tsx` for paste detection and placeholder creation
- Implemented in `packages/cli/src/ui/hooks/useMessageQueue.ts` for placeholder replacement on submission
- Uses `packages/cli/src/ui/utils/pasteStorage.ts` for file operations
- Uses `packages/cli/src/ui/utils/pasteSessionManager.ts` for session management
- Temporary paste files are automatically cleaned up after 24 hours