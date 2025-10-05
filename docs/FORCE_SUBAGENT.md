# Force Subagent Delegation

## Overview

This document explains the process flow after user prompt submission and provides recommendations for making subagent delegation more controllable by the application rather than the LLM.

## Process Flow After User Prompt Submission

### 1. User Input Flow

```
User submits prompt (App.tsx:854-860)
  ↓
handleFinalSubmit appends delegation instruction (line 857)
  ↓
addMessage queues the message (useMessageQueue hook)
  ↓
submitQuery sends to GeminiClient (client.ts:498)
```

### 2. Delegation Decision Mechanism

Currently, delegation is **controlled by the LLM** with automatic hints. Here's how it works:

#### In `client.ts:606-645` (sendMessageStream method):

1. **Auto-matching to subagent:**
   - Checks if request is "Please continue" (skip delegation)
   - For new prompts: calls `matchPromptToSubagent()` using keyword similarity
   - If match found: injects system-reminder to use matched subagent
   - If no match: injects system-reminder to use "general-purpose" subagent

2. **Current implementation (line 856-857 in App.tsx):**
```typescript
const messageWithInstruction = submittedValue + '\n\nALWAYS use proper subagent. Delegate ALWAYS to subagent.';
```

3. **System reminders added (client.ts:619-644):**
```typescript
// Example of auto-delegation hint
{
  text: `<system-reminder>AUTOMATICALLY delegate this task to the ${matchedSubagent.name} subagent using the ${TaskTool.Name} tool...`
}
```

**Problem:** The LLM can still **ignore** these hints since they're just system reminders, not forced tool calls.

---

## How to Make Delegation More Controllable

### Option 1: Force Subagent Call Programmatically (Recommended)

Instead of asking the LLM to delegate, directly inject a tool call:

**Modify `client.ts:619-645` to:**

```typescript
if (!isPleaseContinue) {
  const prompt = partToString(request);
  const matchedSubagent = await this.config.getSubagentManager().matchPromptToSubagent(prompt);

  // Instead of adding a system reminder, directly create a tool response
  const subagentToUse = matchedSubagent?.name || 'general-purpose';

  // Add user message
  this.getChat().addHistory({
    role: 'user',
    parts: request,
  });

  // Add model's forced tool call
  this.getChat().addHistory({
    role: 'model',
    parts: [
      {
        functionCall: {
          name: TaskTool.Name,
          args: {
            description: 'Auto-delegated task',
            prompt: prompt,
            subagent_type: subagentToUse,
          },
        },
      },
    ],
  });

  // Now handle this as a pending tool call
  // Skip the normal turn.run() and execute the tool directly
}
```

### Option 2: Configuration Flag

Add a setting to control delegation behavior:

```typescript
// In settings.json
{
  "subagents": {
    "forceDelegation": true, // Always force, never ask LLM
    "delegationMode": "auto" | "manual" | "forced",
    "matchingThreshold": 0.3 // For matchPromptToSubagent
  }
}
```

Then modify `client.ts` to check this config:

```typescript
const delegationMode = this.config.getSettings().subagents?.delegationMode;

if (delegationMode === 'forced' && !isPleaseContinue) {
  // Force delegation (Option 1 approach)
} else if (delegationMode === 'auto') {
  // Current behavior (hints)
} else {
  // Manual - no delegation unless explicitly requested
}
```

### Option 3: Remove LLM's Choice Entirely

Modify the flow to **never let the main LLM respond directly**:

**In `useGeminiStream.ts` or client wrapper:**

```typescript
async function submitQuery(prompt: string) {
  // Match to subagent
  const subagent = await matchPromptToSubagent(prompt) || 'general-purpose';

  // Execute subagent directly without asking main LLM
  const result = await executeSubagent(subagent, prompt);

  // Return result to user
  return result;
}
```

---

## Current Issues with Existing Implementation

### In App.tsx:856-857:
```typescript
const messageWithInstruction = submittedValue + '\n\nALWAYS use proper subagent. Delegate ALWAYS to subagent.';
```

**Problems:**
1. Appends to every message (including tool responses)
2. LLM can ignore this instruction
3. Creates confusing context

### In client.ts:619-644:
```typescript
this.getChat().addHistory({
  role: 'user',
  parts: [{ text: `<system-reminder>AUTOMATICALLY delegate...` }]
});
```

**Problems:**
1. Adds as user message (pollutes history)
2. LLM sees it but can choose to ignore
3. No guarantee of delegation

---

## Recommended Implementation

**Implement a "forced delegation" mode in `client.ts:sendMessageStream`:**

```typescript
async *sendMessageStream(request, signal, prompt_id, turns, originalModel) {
  // ... existing code ...

  const isPleaseContinue = /* check */;

  if (!isPleaseContinue && this.config.getForcedDelegation()) {
    // Match to subagent
    const prompt = partToString(request);
    const matchedSubagent = await this.config.getSubagentManager()
      .matchPromptToSubagent(prompt, 0.2); // Lower threshold

    const subagentName = matchedSubagent?.name || 'general-purpose';

    // Add user request to history
    this.getChat().addHistory({ role: 'user', parts: request });

    // Create tool invocation directly
    const taskTool = this.config.getToolRegistry().getTool(TaskTool.Name);
    const invocation = taskTool.createInvocation({
      description: 'Auto-delegated task',
      prompt: prompt,
      subagent_type: subagentName,
    });

    // Execute and yield results
    const result = await invocation.execute(signal);

    // Add to history as completed tool call
    this.getChat().addHistory({
      role: 'model',
      parts: [{ functionCall: { name: TaskTool.Name, args: invocation.params } }],
    });
    this.getChat().addHistory({
      role: 'user',
      parts: [{ functionResponse: { name: TaskTool.Name, response: result } }],
    });

    // Continue with normal flow
  }

  // ... rest of existing code ...
}
```

This approach:
- ✅ **Completely bypasses LLM decision-making**
- ✅ **Guarantees subagent usage**
- ✅ **Maintains proper conversation history**
- ✅ **Allows configuration-based control**

---

## Summary

**Current State:**
- Delegation is controlled by the **LLM** through system reminders
- Code adds hints (`App.tsx:857` and `client.ts:619-644`) but LLM can ignore them
- `matchPromptToSubagent()` uses keyword similarity (threshold 0)

**To Force Subagent Usage:**
1. **Best approach:** Programmatically create tool invocations in `client.ts:sendMessageStream`
2. **Alternative:** Add configuration flag for delegation modes
3. **Remove** the string concatenation in `App.tsx:857` (ineffective)
4. **Modify** `client.ts:619-645` to execute tools directly instead of adding hints

**Key Insight:** Don't ask the LLM to delegate—just delegate directly.

---

## Implementation Checklist

- [ ] Add `forceDelegation` configuration option
- [ ] Modify `client.ts:sendMessageStream` to support forced delegation
- [ ] Remove ineffective delegation hints from `App.tsx`
- [ ] Update system reminders in `client.ts:619-644`
- [ ] Add tests for forced delegation mode
- [ ] Document configuration options in settings
