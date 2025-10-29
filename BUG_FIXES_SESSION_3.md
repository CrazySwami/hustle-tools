# Bug Fixes - Session 3

**Date:** October 27, 2025
**Issues Fixed:** 5 major bugs

---

## Issues Reported by User

### 1. CSS Wiped to 0 Characters
**User Report:**
> "I asked 'How does the H1 styling work?' and it erased everything and made it zero characters (687 chars → 0 chars)"

**Root Cause:**
- The system was forcing tool usage when it detected keywords like "h1", "h2", etc.
- User's QUESTION contained "h1" → system forced `editCode` tool call
- AI misinterpreted the question as an edit instruction
- Generated empty diff (nothing to change) → 0 characters

**Fix:**
Added question detection logic to prevent forcing tool usage for questions.

**File:** `/src/app/api/chat/route.ts` (lines 281-312)

```typescript
// Question indicators - if user is asking a question, don't force tool usage
const questionIndicators = [
  'how does', 'how do', 'what does', 'what is', 'why does', 'why is',
  'can you explain', 'explain', 'tell me', 'describe',
  'what\'s', 'how\'s', 'where\'s', 'when\'s',
  '?', // Question mark
];

const isQuestion = questionIndicators.some(indicator =>
  userText.toLowerCase().includes(indicator)
);

// Only force tool usage for ACTION keywords, not questions
const forceToolKeywords = [
  'test ping', 'ping test', 'ping',
  'change', 'edit', 'update', 'modify',
  'switch tab', 'open', 'navigate to', 'go to',
  'generate', 'create', 'build', 'make', 'add',
];

const shouldForceTool = !isQuestion && forceToolKeywords.some(keyword =>
  userText.toLowerCase().includes(keyword)
);

if (shouldForceTool) {
  toolChoice = 'required';
  console.log('🎯 Forcing tool usage for Elementor request with keywords:', userText.substring(0, 100));
} else if (isQuestion) {
  console.log('❓ Question detected, NOT forcing tool usage:', userText.substring(0, 100));
}
```

**Result:**
✅ Questions now trigger TEXT responses instead of tool calls
✅ No more accidental code deletion

---

### 2. No Text Response After Tool Calls
**User Report:**
> "I asked it to edit HTML and tell me about the CSS, but it didn't respond after the tool call. I thought it was set up to have 10 tool calls, so shouldn't it have responded to me after the tool call and told me based on the message?"

**Root Cause:**
- System was configured with `stopWhen: stepCountIs(1)`
- This STOPPED after ONE tool call
- AI couldn't make multiple tool calls (HTML + CSS)
- AI couldn't provide text explanation after tools

**Fix:**
Changed from `stopWhen: stepCountIs(1)` to `maxSteps: 10`

**File:** `/src/app/api/chat/route.ts` (line 336)

**Before:**
```typescript
stopWhen: stepCountIs(1), // Only allow ONE tool call per response
```

**After:**
```typescript
maxSteps: 10, // Allow up to 10 tool calls per response (for multi-file edits + text response)
```

**Result:**
✅ AI can now make multiple tool calls (e.g., editCode(html) → editCode(css))
✅ AI can provide text explanations AFTER tool execution
✅ Multi-step workflows work correctly

---

### 3. Can't Re-View Declined Changes
**User Report:**
> "When some things decline, can we have the ability to re-see it again so it can be accepted if anything, as opposed to just having the generate code button appear out of nowhere?"

**Root Cause:**
- When user clicked "Decline", widget went to 'idle' state
- 'idle' state only shows "Generate Edit" button
- Diff data was LOST - user couldn't review again

**Fix:**
Created new **'declined'** state that preserves the diff and allows re-review.

**File:** `/src/components/tool-ui/edit-code-widget.tsx`

**Reject Handler (lines 192-198):**
```typescript
const handleRejectChanges = () => {
  console.log(`❌ Rejecting changes to ${data.fileType}`);
  // Don't clear the code - keep it so user can re-view later
  setState('declined');
  // Close the diff view
  window.dispatchEvent(new CustomEvent('close-code-diff'));
};
```

**New Declined State UI (lines 399-446):**
```typescript
{/* DECLINED STATE - Changes rejected but can be reviewed again */}
{state === 'declined' && (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-orange-600">
      <XCircleIcon size={16} />
      <p className="text-sm font-medium">Changes Declined</p>
    </div>
    <div className="text-xs text-muted-foreground">
      <div>You declined these changes. The editor was not modified.</div>
      <div className="mt-1">Original: {originalCode.length} chars → Proposed: {editedCode.length} chars</div>
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Re-show the diff view for review
          window.dispatchEvent(new CustomEvent('show-code-diff', {
            detail: {
              fileType: data.fileType,
              original: originalCode,
              modified: editedCode,
            }
          }));
          // Go back to reviewing state
          setState('reviewing');
        }}
        className="flex-1"
      >
        👁️ Review Again
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Clear and start over
          setState('idle');
          setEditedCode('');
          setStreamedCode('');
          setValidationResult(null);
        }}
        className="flex-1"
      >
        Make Another Edit
      </Button>
    </div>
  </div>
)}
```

**Result:**
✅ User can click "Review Again" to re-open the diff
✅ Diff data is preserved after declining
✅ User can change their mind and accept later
✅ "Make Another Edit" button available to start fresh

---

### 4. Empty Response on First Request
**User Report:**
> "The very first go ahead gave me an empty response. So then I said 'Hey', the AI responded again and it worked."

**Status:** 🔍 **Under Investigation**

This appears to be an intermittent issue that may be related to:
- AI model initialization delay
- First request timeout
- Streaming connection issues

**Needs Further Testing:**
- Check if this happens consistently on first request
- Monitor dev server logs for errors on initial load
- Verify WebSocket/SSE streaming connection

---

### 5. viewEditorCode Still Being Called (From Previous Session)
**User Report:**
> "When I said 'edit', it just kept trying to load files using the load file tool"

**Root Cause:**
- Requests were routing to `/api/chat` instead of `/api/chat-elementor`
- `/api/chat` still had `viewEditorCode` in its Elementor tools configuration

**Fix (Completed in Previous Session):**
Removed `viewEditorCode` from `/api/chat` Elementor tools and updated system prompt.

**File:** `/src/app/api/chat/route.ts` (lines 224-233, 170-196)

**Result:**
✅ "Edit" keyword now triggers `editCode` directly
✅ No more broken file selector UI

---

## Summary of Changes

### Files Modified:

1. **`/src/app/api/chat/route.ts`**
   - Lines 281-312: Added question detection logic
   - Line 336: Changed `stopWhen: stepCountIs(1)` → `maxSteps: 10`

2. **`/src/components/tool-ui/edit-code-widget.tsx`**
   - Lines 192-198: Updated reject handler to use 'declined' state
   - Lines 399-446: Added new 'declined' state UI with "Review Again" button

### Expected Behavior After Fixes:

✅ **Questions trigger text responses, not tool calls**
- "How does the H1 styling work?" → Text explanation
- "What is this code doing?" → Text explanation

✅ **Multiple tool calls work correctly**
- "Edit HTML and CSS" → editCode(html) + editCode(css) + text response
- AI can explain AFTER executing tools

✅ **Declined changes can be reviewed again**
- User declines → "Declined" state shown
- User clicks "Review Again" → diff reopens
- User can accept or decline again

✅ **No accidental code deletion**
- Question keywords don't trigger edits
- Tool forcing is smarter

---

## Testing Checklist

### Test Case 1: Question About Code
```
User: "How does the H1 styling work?"
Expected: Text response explaining CSS
Status: ✅ FIXED
```

### Test Case 2: Multi-File Edit
```
User: "Edit HTML to add a heading and CSS to style it red"
Expected: editCode(html) + editCode(css) + text confirmation
Status: ✅ FIXED
```

### Test Case 3: Decline Then Review Again
```
1. User: "Edit CSS to change color"
2. AI: Shows diff
3. User: Clicks "Decline"
4. Widget shows "Changes Declined" with "Review Again" button
5. User: Clicks "Review Again"
6. Diff reopens in Monaco
Expected: User can now accept the same changes
Status: ✅ FIXED
```

### Test Case 4: Empty Response on First Request
```
User: First message after page load
Expected: Normal response
Status: 🔍 NEEDS TESTING
```

---

## Remaining Issues

### 1. Empty Response Bug (Intermittent)
**Priority:** Medium
**Status:** Under Investigation
**Next Steps:**
- Add detailed logging for first request
- Check streaming connection initialization
- Monitor for timeout issues

### 2. Vercel AI SDK UI Elements (Feature Request)
**Priority:** Low
**Status:** Deferred
**User Request:** Migrate to https://ai-sdk.dev/elements/components/tool
**Reason for Deferral:** Current custom UI is working well after fixes

---

## Performance Notes

### Before Fixes:
- Questions → Wrong tool call → Empty diff → Code deletion ❌
- Single tool call limit → No multi-file edits → No text responses ❌
- Declined changes → Lost forever → User frustration ❌

### After Fixes:
- Questions → Text responses → User gets explanations ✅
- Multi-file edits → Sequential tool calls → Text summary ✅
- Declined changes → Can review again → User flexibility ✅

---

## Code Quality Improvements

### Better Separation of Concerns:
- Tool forcing logic is now context-aware (questions vs actions)
- State management is clearer (added 'declined' state)
- User feedback is more informative (shows diff stats in all states)

### Enhanced UX:
- Users have more control over declined changes
- Multi-step workflows are fully supported
- AI can provide context after tool execution

---

## Developer Notes

### maxSteps Configuration:
The `maxSteps: 10` configuration allows:
1. Multiple tool calls in sequence (editCode(html), editCode(css), editCode(js))
2. Text response AFTER tools complete
3. Complex workflows (e.g., blog planner with 5+ steps)

**Important:** If you need to limit tool calls in the future, use `maxToolRoundtrips` instead of `stopWhen` to preserve text responses.

### Question Detection Pattern:
The question detection uses a simple keyword matching approach. Future improvements could use:
- NLP sentiment analysis
- Grammatical structure parsing
- Intent classification models

For now, the keyword approach works well for common cases.

### State Machine Diagram:
```
idle → loading → reviewing → applied
              ↓            ↘ declined ↗ (can go back to reviewing)
              ↓
            error
```

---

## Conclusion

All major user-reported bugs have been fixed:
1. ✅ CSS deletion bug (question detection)
2. ✅ Missing text responses (maxSteps)
3. ✅ Can't review declined changes (new state)
4. 🔍 Empty first response (under investigation)
5. ✅ viewEditorCode issue (fixed in previous session)

The editing system is now more robust, flexible, and user-friendly!
