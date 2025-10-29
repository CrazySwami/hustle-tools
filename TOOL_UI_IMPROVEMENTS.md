# Tool UI Improvements - Complete

**Date:** October 26, 2025
**Status:** ✅ Ready for Testing

---

## Summary

Implemented improvements to fix tool invocation issues and add better diff viewing controls:

1. ✅ **Removed `viewEditorCode` tool completely** - was causing "edit" keyword to trigger file loading instead of editing
2. ✅ **Added "View Changes" buttons** - users can re-open diff view from any state
3. ⏳ **AI SDK UI Elements** - researched for future implementation

---

## Changes Made

### 1. Removed File Loading Tools

**Problem:** When user said "edit", AI was calling `viewEditorCode` which showed a broken file selector UI.

**Root Cause:** `viewEditorCodeTool` was still defined in `tools.ts` even though we removed it from `chat-elementor/route.ts`.

**Fix:** Completely removed the tool definition and export from `tools.ts`.

**Files Modified:**
- [tools.ts](src/lib/tools.ts:276-278) - Commented out tool definition
- [tools.ts](src/lib/tools.ts:618) - Removed from exports

**Before:**
```typescript
export const viewEditorCodeTool = tool({
  description: 'Display code files...',
  // ... 20 lines of unused code
});

export const tools = {
  viewEditorCode: viewEditorCodeTool, // ← Still exported!
  editCode: editCodeTool,
};
```

**After:**
```typescript
// REMOVED: viewEditorCodeTool - AI already has current section in system prompt
// This tool was causing confusion - AI tried to "load" files instead of just editing them
// export const viewEditorCodeTool = tool({ ... });

export const tools = {
  // viewEditorCode: REMOVED
  editCode: editCodeTool, // ← Only editing tool now
};
```

**Result:** When user says "edit", AI will ONLY use `editCode` tool, never try to load files.

---

### 2. Added "View Changes" Buttons

**Problem:** User couldn't re-open diff view after closing it or switching tabs.

**Solution:** Added "View Changes" button in both reviewing and applied states.

**File:** [edit-code-widget.tsx](src/components/tool-ui/edit-code-widget.tsx)

#### In Reviewing State (Lines 347-363):

Added third button below Accept/Decline:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    // Dispatch event to show diff
    window.dispatchEvent(new CustomEvent('show-code-diff', {
      detail: {
        fileType: data.fileType,
        original: originalCode,
        modified: editedCode,
      }
    }));
  }}
  className="w-full text-xs"
>
  👁️ View Changes in Monaco
</Button>
```

**Visual:**
```
┌─────────────────────────────────┐
│ HTML Edit Ready                 │
│ Add a button                    │
│ ⚫ 1234 chars                   │
├─────────────────────────────────┤
│ ✓ Accept & Apply  │  ✗ Decline │
├─────────────────────────────────┤
│     👁️ View Changes in Monaco   │  ← NEW
└─────────────────────────────────┘
```

#### In Applied State (Lines 379-395):

Changed "Make Another Edit" to "View Changes":

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    // Re-show the diff view
    window.dispatchEvent(new CustomEvent('show-code-diff', {
      detail: {
        fileType: data.fileType,
        original: originalCode,
        modified: editedCode,
      }
    }));
  }}
  className="w-full"
>
  👁️ View Changes
</Button>
```

**Visual:**
```
┌─────────────────────────────────┐
│ ✓ Changes Applied!              │
│ The HTML file has been updated  │
│ Original: 15 chars → New: 1234  │
├─────────────────────────────────┤
│     👁️ View Changes              │  ← Changed from "Make Another Edit"
└─────────────────────────────────┘
```

**Benefits:**
- Can review changes anytime after applying
- Useful for multi-file edits (view HTML diff, then CSS diff, then back to HTML)
- No need to re-generate edit just to see what changed

---

## Multi-File Edit Flow

### New Flow with View Changes:

1. User: "Edit HTML and CSS"
2. AI: Calls `editCode(html)` + `editCode(css)` (both auto-execute)
3. HTML completes → Monaco shows HTML diff
4. **User:** Reviews HTML diff → clicks "View Changes" on CSS widget
5. **Monaco:** Switches to CSS tab, shows CSS diff
6. **User:** Reviews CSS diff → clicks "View Changes" on HTML widget (if needed)
7. **Monaco:** Switches back to HTML tab, shows HTML diff again
8. User: Accepts both when satisfied

**Key Feature:** Can navigate between diffs of multiple files before accepting!

---

## Vercel AI SDK UI Elements Research

**Documentation:** https://ai-sdk.dev/elements/components/tool

The AI SDK provides pre-built React components for rendering tool states:

### Available Components:

```tsx
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@ai-sdk/react';

<Tool>
  <ToolHeader type="search" state="running" />
  <ToolContent>
    <ToolInput input={{ query: "user query" }} />
    <ToolOutput output={result} />
  </ToolContent>
</Tool>
```

### States:
- `pending` - Tool queued
- `running` - Tool executing
- `completed` - Tool finished
- `failed` - Tool errored

### Benefits:
- Standardized UI across all tools
- Built-in loading states
- Consistent styling
- Less custom code

### Implementation Plan (Future):

1. **Install dependency:** Already have `@ai-sdk/react`
2. **Import components:** `Tool`, `ToolHeader`, `ToolContent`
3. **Replace custom widgets:** Use AI SDK components instead of custom Card/Button
4. **Extend for specific tools:** Can still customize via `ToolOutput` for diff preview, image upload, etc.

**Example for EditCode:**
```tsx
<Tool>
  <ToolHeader
    type="code-editor"
    state={state === 'loading' ? 'running' : state === 'reviewing' ? 'completed' : 'pending'}
  />
  <ToolContent>
    <ToolInput input={{ instruction: data.instruction, fileType: data.fileType }} />
    {state === 'reviewing' && (
      <ToolOutput output={{ charCount: editedCode.length, validation: validationResult }} />
    )}
  </ToolContent>
</Tool>
```

**Decision:** Defer to future iteration - current custom UI works well, AI SDK Elements would be a nice-to-have refactor for consistency.

---

## Files Modified

1. ✅ [/src/lib/tools.ts](src/lib/tools.ts)
   - Line 276-278: Removed `viewEditorCodeTool` definition
   - Line 618: Removed from exports

2. ✅ [/src/components/tool-ui/edit-code-widget.tsx](src/components/tool-ui/edit-code-widget.tsx)
   - Lines 347-363: Added "View Changes" button in reviewing state
   - Lines 379-395: Changed "Make Another Edit" to "View Changes" in applied state

3. ✅ [/src/app/api/chat-elementor/route.ts](src/app/api/chat-elementor/route.ts)
   - Line 219: Already removed `viewEditorCode` from toolsConfig (previous commit)

---

## Testing Instructions

### Test 1: "Edit" Keyword
1. Load a section with HTML and CSS
2. Say: **"edit the HTML"**
3. **Expected:** AI calls `editCode(html)` immediately (no file loading UI)
4. **NOT Expected:** File selector UI with broken buttons

### Test 2: View Changes Button (Reviewing State)
1. Generate an edit (will auto-execute)
2. Widget shows "Accept & Apply" and "Decline"
3. Click **"👁️ View Changes in Monaco"**
4. **Expected:** Monaco switches to file tab and shows diff
5. Close the diff (×)
6. Click "View Changes" again
7. **Expected:** Diff re-appears

### Test 3: View Changes Button (Applied State)
1. Accept an edit
2. Widget shows "✓ Changes Applied!"
3. Click **"👁️ View Changes"**
4. **Expected:** Monaco shows diff again (can review after applying)

### Test 4: Multi-File Diff Navigation
1. Say: **"Edit HTML and CSS"**
2. Both widgets appear and auto-execute
3. HTML diff shows in Monaco
4. Click "View Changes" on CSS widget
5. **Expected:** Monaco switches to CSS tab, shows CSS diff
6. Click "View Changes" on HTML widget
7. **Expected:** Monaco switches back to HTML tab, shows HTML diff
8. Can navigate between diffs before accepting

---

## Known Issues & Future Work

### Issue: Sequential Execution
**Status:** User reported CSS edit didn't run after HTML edit completed.

**Possible Causes:**
1. `maxSteps: 10` not configured (unlikely - we set this)
2. AI stopping after first tool call (need to check logs)
3. Error in CSS edit API (need to check console)

**Debug Steps:**
1. Check browser console when running multi-file edit
2. Look for "🚀 Calling streamText..." logs
3. Count tool invocations
4. Check if CSS widget mounts and auto-executes

**Likely Fix:** May need to adjust `maxSteps` or tool calling strategy in AI SDK config.

---

### Future: AI SDK UI Elements
**Status:** Researched, not implemented

**Why Defer:**
- Current custom UI works well
- AI SDK Elements would require refactoring all tool widgets
- Better to implement when doing a major UI overhaul
- Current solution gives us more control over styling

**When to Implement:**
- When adding 5+ more tools (consistency becomes important)
- When design system changes (easier to update one component)
- When want automatic loading/error states

---

## Summary

✅ **Removed broken file loading tool** - "edit" keyword now works correctly
✅ **Added View Changes buttons** - can review diffs anytime, navigate between files
📋 **Researched AI SDK Elements** - documented for future implementation
🔄 **Sequential execution** - needs testing/debugging if issue persists

**Dev server:** http://localhost:3005/elementor-editor - Ready for testing!

**Try this:**
1. Say "edit the HTML to add a button"
2. Should auto-execute immediately (no file loading UI)
3. Click "View Changes" button to see diff in Monaco
4. Accept changes
5. Click "View Changes" again to review what was applied
