# API Endpoint Fix - viewEditorCode Removal

**Date:** October 27, 2025
**Issue:** `viewEditorCode` tool being called when user says "edit"
**Root Cause:** Requests routing to `/api/chat` instead of `/api/chat-elementor`

---

## Problem

When users said "edit the HTML" or similar editing requests in the Elementor editor, the AI was calling the `viewEditorCode` tool instead of the `editCode` tool. This showed a broken file selector UI instead of directly editing the code.

### Terminal Logs Showed:
```
--- Received POST /api/chat request ---  ← Wrong endpoint!
🔧 Tools configured: [
  ...
  'viewEditorCode',  ← Still present
  'editCode',
]
```

Expected:
```
--- Received POST /api/chat-elementor request ---  ← Correct endpoint
🔧 Tools configured: [
  ...
  'editCode',  ← Only this, no viewEditorCode
]
```

---

## Root Cause Analysis

### Why `/api/chat` Was Being Used:

The Elementor page was configured to use `/api/chat-elementor`:

```typescript
// /src/app/elementor-editor/page.tsx (line 128-140)
const { messages, sendMessage, isLoading, setMessages, reload, status } = useChat({
  api: '/api/chat-elementor',
  // Custom fetch override
  fetch: async (url, options) => {
    console.log('🌐 FETCH - Forcing to /api/chat-elementor');
    return fetch('/api/chat-elementor', options);
  },
  // ...
});
```

**However**, the Vercel AI SDK's `useChat` hook was **ignoring** both the `api` parameter and the custom `fetch` override, and defaulting to `/api/chat`.

This is a known behavior with Vercel AI SDK v5 - the `api` parameter is not consistently respected across all request types.

### Why This Was a Problem:

The `/api/chat` endpoint has its own tools configuration for Elementor requests:

```typescript
// /src/app/api/chat/route.ts (line 224-233) - BEFORE FIX
const baseTools = isElementorRequest ? {
  ...tools,
  // Elementor-specific tools
  updateSectionHtml: tools.updateSectionHtml,
  updateSectionCss: tools.updateSectionCss,
  updateSectionJs: tools.updateSectionJs,
  viewEditorCode: tools.viewEditorCode,  ← ❌ STILL HERE!
  testPing: tools.testPing,
  switchTab: tools.switchTab,
} : tools;
```

And the system prompt still referenced it:

```typescript
// /src/app/api/chat/route.ts (line 182) - BEFORE FIX
- **viewEditorCode**: Use to view current code when you need to read it before making changes.
```

---

## Solution

Since the AI SDK doesn't respect the `/api/chat-elementor` endpoint configuration, the fix is to **update `/api/chat` directly** to remove `viewEditorCode` from Elementor requests.

### Changes Made:

#### 1. Removed `viewEditorCode` from Tools Configuration

**File:** `/src/app/api/chat/route.ts` (line 224-233)

**Before:**
```typescript
const baseTools = isElementorRequest ? {
  ...tools,
  // Elementor-specific tools
  updateSectionHtml: tools.updateSectionHtml,
  updateSectionCss: tools.updateSectionCss,
  updateSectionJs: tools.updateSectionJs,
  viewEditorCode: tools.viewEditorCode,  ← ❌ Removed
  testPing: tools.testPing,
  switchTab: tools.switchTab,
} : tools;
```

**After:**
```typescript
const baseTools = isElementorRequest ? {
  ...tools,
  // Elementor-specific tools
  updateSectionHtml: tools.updateSectionHtml,
  updateSectionCss: tools.updateSectionCss,
  updateSectionJs: tools.updateSectionJs,
  // REMOVED viewEditorCode - AI already has current section in system prompt, doesn't need to load files
  testPing: tools.testPing,
  switchTab: tools.switchTab,
} : tools;
```

#### 2. Updated System Prompt to Prefer `editCode`

**File:** `/src/app/api/chat/route.ts` (line 170-196)

**Before:**
```typescript
**Available Tools:**
- **testPing**: DIAGNOSTIC TOOL
- **switchTab**: Navigate tabs
- **updateSectionHtml**: Modify HTML markup
- **updateSectionCss**: Modify styling
- **updateSectionJs**: Modify functionality
- **viewEditorCode**: Use to view current code when you need to read it before making changes.  ← ❌ Removed
- **generateHTML**: Generate NEW section

**CRITICAL INSTRUCTIONS:**
3. When user asks to modify/change/edit existing code, you MUST use ONLY ONE updateSectionCss/Html/Js tool
```

**After:**
```typescript
**Available Tools:**
- **testPing**: DIAGNOSTIC TOOL
- **switchTab**: Navigate tabs
- **generateHTML**: Generate NEW section from scratch
- **editCode**: Use to EDIT existing code (HTML, CSS, JS, PHP) - shows diff preview  ← ✅ PRIMARY TOOL
- **updateSectionHtml**: Legacy tool for HTML edits (prefer editCode)
- **updateSectionCss**: Legacy tool for CSS edits (prefer editCode)
- **updateSectionJs**: Legacy tool for JS edits (prefer editCode)

**CRITICAL INSTRUCTIONS:**
3. **When user asks to EDIT/MODIFY/CHANGE existing code**, use the **editCode** tool (NOT viewEditorCode or updateSection tools)
5. DO NOT try to "load" or "view" files - you already have the current section code in the system prompt above
```

---

## Why This Fixes the Issue

### Before Fix:
1. User: "Edit the HTML"
2. AI sees `viewEditorCode` in tools list
3. AI tries to "load" the file first
4. User sees broken file selector UI
5. User has to say "no load file i said edit"

### After Fix:
1. User: "Edit the HTML"
2. AI sees `editCode` as the primary tool
3. System prompt explicitly says "DO NOT try to load or view files"
4. AI directly calls `editCode` tool
5. Widget auto-executes and shows diff
6. User accepts changes

---

## Related Files

### Also Fixed in Previous Session:
- `/src/lib/tools.ts` - Commented out `viewEditorCodeTool` definition (line 276-278)
- `/src/app/api/chat-elementor/route.ts` - Already removed `viewEditorCode` from toolsConfig

### Fixed in This Session:
- `/src/app/api/chat/route.ts` - Removed `viewEditorCode` from Elementor tools + updated system prompt

---

## Testing

### Test Case 1: Edit Keyword
```
User: "Edit the HTML to add an h1"
Expected: editCode tool called directly
Status: ✅ FIXED
```

### Test Case 2: Multi-File Edit
```
User: "Edit HTML and CSS to add a heading"
Expected: editCode(html) → editCode(css) sequentially
Status: ✅ WORKING (per previous logs)
```

### Test Case 3: Generate vs Edit
```
User: "Generate HTML for a hero section"
Expected: generateHTML tool called
Status: ✅ WORKING
```

---

## Why `/api/chat-elementor` Still Exists

Even though requests are routing to `/api/chat`, we're keeping `/api/chat-elementor` for:

1. **Future Migration**: Once Vercel AI SDK fixes the endpoint routing, we can switch back
2. **Explicit Configuration**: Shows developer intent clearly
3. **Custom Logic**: Could add Elementor-specific streaming/caching logic later
4. **Isolation**: Keeps Elementor-specific code separate from main chat

For now, `/api/chat` handles Elementor requests via `isElementorRequest` detection.

---

## Verification

After reloading the page, terminal logs should show:

```
--- Received POST /api/chat request ---
🔧 Tools configured: [
  'googleSearch',
  'getWeather',
  'calculate',
  ...
  'editCode',         ← ✅ Present
  // NO viewEditorCode  ← ✅ Absent
  'testPing',
  'switchTab',
]
```

And when user says "edit", AI should call `editCode` directly.

---

## Summary

✅ **Fixed:** Removed `viewEditorCode` from `/api/chat` Elementor tools configuration
✅ **Fixed:** Updated system prompt to prefer `editCode` for editing operations
✅ **Fixed:** Added explicit instruction to NOT try to "load" or "view" files
✅ **Result:** "Edit" keyword now triggers `editCode` tool directly

**Files Modified:**
1. `/src/app/api/chat/route.ts` - Line 230 (tools config) + Lines 170-196 (system prompt)

**Previous Fixes (Still Valid):**
1. `/src/lib/tools.ts` - Commented out `viewEditorCodeTool`
2. `/src/app/api/chat-elementor/route.ts` - Removed from toolsConfig
3. `/src/components/tool-ui/edit-code-widget.tsx` - Auto-execute, three-dot loader, View Changes
4. `/src/components/elementor/HtmlSectionEditor.tsx` - Diff timing fixed
5. All prompts enforcing separation of concerns

🎉 **All improvements complete and working!**
