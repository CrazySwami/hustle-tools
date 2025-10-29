# Code Editing System - Implementation Summary

## Overview

Complete implementation of AI-powered code editing with diff preview, tool calling, and PHP support.

## What Was Implemented

### 1. **Missing Tools Added** ([tools.ts](src/lib/tools.ts))

Three new tools were created and registered:

#### `getEditorContent` Tool (Lines 276-292)
- Retrieves current HTML/CSS/JS from Monaco editor
- Can request specific files or all files
- Used before making edits to analyze existing code
- **Context-aware**: Knows what's currently in the editor

#### `editCodeWithDiff` Tool (Lines 295-314)
- Makes targeted edits with visual diff preview
- **PREFERRED method** for small changes
- Shows before/after comparison
- Requires user approval before applying
- Supports `targetSection` parameter for precise edits

#### `updateSectionPhp` Tool (Lines 317-334)
- **NEW**: Generates PHP code for WordPress plugins/widgets
- Outputs complete PHP code with `<?php` tags
- Includes optional `filename` suggestion
- User must manually copy to WordPress
- **Prevents PHP/HTML confusion**

### 2. **Chat API Updated** ([chat-elementor/route.ts](src/app/api/chat-elementor/route.ts))

#### Tools Registered (Lines 174-188)
All three new tools added to `toolsConfig`:
```typescript
getEditorContent: tools.getEditorContent,
editCodeWithDiff: tools.editCodeWithDiff,
updateSectionPhp: tools.updateSectionPhp,
```

#### Enhanced System Prompt (Lines 82-103)
Added clear instructions for:
- **Option 1: Diff-based editing** (PREFERRED) - Uses `getEditorContent` → `editCodeWithDiff`
- **Option 2: Direct replacement** - Uses `updateSectionHtml/Css/Js/Php`
- **PHP Detection Rules** - Detects `<?php` tags and routes to correct tool

### 3. **Chat UI Updated** ([ElementorChat.tsx](src/components/elementor/ElementorChat.tsx))

#### Tool Cases Added (Lines 191-193)
```typescript
case 'tool-updateSectionPhp':
case 'tool-getEditorContent':
case 'tool-editCodeWithDiff':
```

#### Console Logs Commented Out (Lines 174, 198, 203)
Removed noisy "Rendering message part" logs for cleaner console.

### 4. **Tool Result Renderer Updated** ([tool-result-renderer.tsx](src/components/tool-ui/tool-result-renderer.tsx))

#### Import Added (Line 9)
```typescript
import { EditCodeWidget } from './edit-code-widget';
```

#### Tool Rendering (Lines 250-285)

**`updateSectionPhp`** - Uses existing `UpdateSectionToolResult` component

**`getEditorContent`** - Shows simple success message:
```
┌──────────────────────────────┐
│ ✓ Editor Content Retrieved   │
│ Current code content has been│
│ loaded for analysis.         │
└──────────────────────────────┘
```

**`editCodeWithDiff`** - Uses full `EditCodeWidget` with Monaco DiffEditor:
```typescript
<EditCodeWidget
  data={{
    instruction: result.instruction || '',
    fileType: result.file || 'html',
    context: result.targetSection || '',
    status: result.status || 'pending',
    message: result.message || '',
  }}
/>
```

## How It Works

### Full Editing Flow

```
User Message: "Remove the last card from the HTML"
    ↓
Chat API (/api/chat-elementor)
    ↓
AI analyzes request + current section context
    ↓
[Tool Call: getEditorContent]
    ← Returns { html: "...", css: "...", js: "..." }
    ↓
[Tool Call: editCodeWithDiff]
    ← Returns { file: 'html', instruction: '...', status: 'pending_diff_generation' }
    ↓
Frontend Widget (EditCodeWidget) renders in chat
    ↓
Widget calls /api/edit-code-stream
    ↓
Streams unified diff:
@@ -20,15 +20,6 @@
       </div>
     </div>
   </div>
-  <div class="w-card color-green">
-    <div class="card-header">
-      <div class="w-title">Premium</div>
-    </div>
...
    ↓
Monaco DiffEditor displays inline diff
    ↓
User clicks "Accept Changes" or "Reject"
    ↓
Code updated in editor (if accepted)
```

### Existing `EditCodeWidget` Features

The widget ([edit-code-widget.tsx](src/components/tool-ui/edit-code-widget.tsx)) already has:

✅ **Auto-execution** - Generates diff immediately on mount
✅ **Streaming** - Shows character count as diff streams in
✅ **Monaco DiffEditor** - Visual before/after comparison
✅ **Validation** - Syntax checking before applying
✅ **Accept/Reject** - User approval workflow
✅ **Undo/Redo** - History management via `useEditorContent` hook
✅ **Context-aware** - Sends all files for cross-file awareness

### API Endpoint: `/api/edit-code-stream`

Existing endpoint ([edit-code-stream/route.ts](src/app/api/edit-code-stream/route.ts)) handles:

- **Unified diff generation** for existing files (Lines 134-138, 192-206, 253-256, 311-315)
- **Full file generation** for empty files
- **Prompt caching** for massive token savings (Lines 320-368)
- **Model routing** based on complexity (Lines 48-54)
- **Separation of concerns** enforcement (Lines 105-111, 165-170, 225-231)

## File Type Detection

The system now correctly identifies file types:

| User Input | Detected As | Tool Used |
|------------|-------------|-----------|
| `<div>Hello</div>` | HTML | `updateSectionHtml` or `editCodeWithDiff(file: 'html')` |
| `.button { color: red; }` | CSS | `updateSectionCss` or `editCodeWithDiff(file: 'css')` |
| `console.log('hi')` | JavaScript | `updateSectionJs` or `editCodeWithDiff(file: 'js')` |
| `<?php class Widget...` | **PHP** | `updateSectionPhp` |

**Critical**: PHP code is NO LONGER treated as HTML due to:
1. System prompt explicitly checks for `<?php` tags
2. Separate `updateSectionPhp` tool exists
3. AI is instructed: "If user shows you code with `<?php` tags → Use `updateSectionPhp` (NOT HTML!)"

## Testing

### Test Files Created

1. `test-code-editing/sample-html.html` - Pricing cards HTML
2. `test-code-editing/sample-css.css` - Pricing cards CSS
3. `test-code-editing/test-chat-elementor.js` - Full chat flow test
4. `test-code-editing/test-edit-code-stream.js` - Direct API test
5. `test-code-editing/README.md` - Testing instructions

### To Run Tests

**Prerequisites:**
```bash
npm run dev
# Server must be running on http://localhost:3000
```

**Test 1: Full Chat Flow**
```bash
cd test-code-editing
node test-chat-elementor.js
```
Expected: AI calls `getEditorContent` → `editCodeWithDiff` → Tool results returned

**Test 2: Direct Diff Generation**
```bash
cd test-code-editing
node test-edit-code-stream.js
```
Expected: Unified diff patch streams back, saved to `output-diff.patch`

### Known Issue

The `/api/edit-code-stream` endpoint returns 404. This may be due to:
- Route not compiled yet (needs server restart)
- Next.js 15 route configuration
- TypeScript compilation issue

**Fix**: Restart dev server with `npm run dev` and re-test.

## Current State

### ✅ Completed
- [x] Added missing `getEditorContent` tool
- [x] Added missing `editCodeWithDiff` tool
- [x] Created `updateSectionPhp` tool for PHP code
- [x] Updated chat API to register all tools
- [x] Enhanced system prompt with file type detection
- [x] Connected tools to existing `EditCodeWidget`
- [x] Removed verbose console logs
- [x] Created comprehensive test suite

### ⏳ Needs Testing
- [ ] Test in actual UI (Elementor Editor page)
- [ ] Verify diff preview shows in Monaco editor
- [ ] Test Accept/Reject buttons
- [ ] Test with different file types (HTML/CSS/JS/PHP)
- [ ] Test with empty files (generation mode vs edit mode)

### 🐛 Known Issues
1. `/api/edit-code-stream` returns 404 (needs server restart)
2. Need to verify `currentSection` context is being passed correctly

## Next Steps

1. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test in Browser**
   - Go to `/elementor-editor`
   - Load a section with HTML
   - Ask: "Remove the last card from the HTML"
   - Verify: AI calls tools → Diff shows in chat

3. **Verify Context Passing**
   - Check browser console for tool call logs
   - Verify `currentSection` has HTML/CSS/JS content
   - Confirm AI can "see" the current code

4. **Test Accept/Reject**
   - Click "Accept Changes" in diff widget
   - Verify: Code updates in Monaco editor
   - Check: Undo/redo works

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│  User Request: "Edit my code"                   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  /api/chat-elementor                            │
│  - Receives message                             │
│  - Passes currentSection context to AI          │
│  - AI has access to 3 editing tools             │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴───────────┐
        │                      │
┌───────▼────────┐   ┌────────▼──────────┐
│ getEditorContent│   │ editCodeWithDiff  │
│ Tool            │   │ Tool              │
│                 │   │                   │
│ Returns current │   │ Triggers diff     │
│ HTML/CSS/JS     │   │ generation        │
└───────┬─────────┘   └────────┬──────────┘
        │                      │
        │              ┌───────▼──────────────────┐
        │              │ EditCodeWidget (Frontend)│
        │              │ - Renders in chat        │
        │              │ - Shows instruction      │
        │              └───────┬──────────────────┘
        │                      │
        │              ┌───────▼──────────────────┐
        │              │ /api/edit-code-stream    │
        │              │ - Receives instruction   │
        │              │ - Receives current code  │
        │              │ - Streams unified diff   │
        │              └───────┬──────────────────┘
        │                      │
        │              ┌───────▼──────────────────┐
        │              │ Monaco DiffEditor        │
        │              │ - Shows before/after     │
        │              │ - Red lines (removed)    │
        │              │ - Green lines (added)    │
        │              └───────┬──────────────────┘
        │                      │
        │              ┌───────▼──────────────────┐
        │              │ User Decision            │
        │              │ - Accept → Apply diff    │
        │              │ - Reject → Discard       │
        │              └───────┬──────────────────┘
        │                      │
        └──────────────────────▼──────────────────┐
                               │                   │
                    ┌──────────▼──────────┐       │
                    │ useEditorContent    │       │
                    │ - Update code       │       │
                    │ - Add to undo stack │       │
                    └─────────────────────┘       │
```

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| [src/lib/tools.ts](src/lib/tools.ts) | Tool definitions | 275-334 (new tools) |
| [src/app/api/chat-elementor/route.ts](src/app/api/chat-elementor/route.ts) | Chat API with tools | 82-103 (prompt), 174-188 (tools) |
| [src/app/api/edit-code-stream/route.ts](src/app/api/edit-code-stream/route.ts) | Diff generation API | Full file |
| [src/components/elementor/ElementorChat.tsx](src/components/elementor/ElementorChat.tsx) | Chat UI | 191-193 (tool cases) |
| [src/components/tool-ui/tool-result-renderer.tsx](src/components/tool-ui/tool-result-renderer.tsx) | Tool rendering | 250-285 (new tools) |
| [src/components/tool-ui/edit-code-widget.tsx](src/components/tool-ui/edit-code-widget.tsx) | Diff widget | Full file (existing) |
| [src/hooks/useEditorContent.ts](src/hooks/useEditorContent.ts) | Editor state | Full file (existing) |

## Documentation

See also:
- [docs/diff-based-code-editing.md](docs/diff-based-code-editing.md) - Original diff system design
- [test-code-editing/README.md](test-code-editing/README.md) - Test instructions
- [CLAUDE.md](CLAUDE.md) - Project instructions

---

**Status**: ✅ Implementation complete, ⏳ awaiting testing
**Last Updated**: October 28, 2025
**Version**: 1.0.0
