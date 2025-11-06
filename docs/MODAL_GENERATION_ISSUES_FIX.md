# Modal Generation Issues & Fixes

**Date:** January 2025
**Issues Reported:**
1. Can't tap between PHP files (multiple widgets)
2. No loading indicator visible
3. Chat hitting `/api/chat` instead of `/api/chat-elementor` (404 error)

---

## Issue 1: Widget Files Overwriting Each Other ❌

### Problem
**Location**: [GenerateProjectModal.tsx:665-674](../src/components/elementor/GenerateProjectModal.tsx#L665)

The modal calls `onProjectMetadataUpdate` on **every chunk** of the stream, passing a new `widgetFiles` object each time. This OVERWRITES previous widgets instead of merging them.

```typescript
// ❌ WRONG: Called on every chunk, overwrites previous widgets
onProjectMetadataUpdate(projectId, {
  widgetFiles: {
    [widgetId]: {  // NEW object replaces old one!
      name: widgetName,
      slug: widgetSlug,
      content: parsedFiles.php,
      className: className,
    }
  }
});
```

### Root Cause
The modal updates metadata incrementally during streaming (lines 614-692), but the parent component's `onProjectMetadataUpdate` does a shallow merge, not a deep merge of `widgetFiles`.

### Solution

**Option A**: Only update metadata AFTER streaming completes (recommended)

Move the metadata update logic outside the streaming loop to lines 695-720 (after the `while` loop completes):

```typescript
// After streaming loop completes (line 693)
}

// ✅ Update metadata ONCE after parsing complete
if (projectId && onProjectMetadataUpdate && (projectType === 'elementor' || projectType === 'convert-to-elementor')) {
  const { extractUsageMetadata } = await import('@/lib/project-generation/parser');
  const { code: cleanCode } = extractUsageMetadata(fullCode);

  const { parseProjectCode } = await import('@/lib/project-generation/parser');
  const finalFiles = parseProjectCode(
    cleanCode,
    (projectType === 'elementor' || projectType === 'convert-to-elementor') ? 'elementor' : 'hubspot',
    projectType === 'hubspot' ? hubspotModuleType : undefined
  );

  if (finalFiles.pluginMainFile) {
    onProjectMetadataUpdate(projectId, {
      isPlugin: true,
      pluginMainFile: finalFiles.pluginMainFile
    });
  }

  if (finalFiles.php) {
    const classNameMatch = finalFiles.php.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
    const className = classNameMatch ? classNameMatch[1] : 'Generated_Widget';
    const widgetSlug = className.toLowerCase().replace(/_/g, '-');
    const widgetName = className.replace(/_/g, ' ').replace(/\bWidget\b/, '').trim()
      || projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const widgetId = `widget_${Date.now()}`;

    onProjectMetadataUpdate(projectId, {
      widgetFiles: {
        [widgetId]: {
          name: widgetName,
          slug: widgetSlug,
          content: finalFiles.php,
          className: className,
        }
      }
    });
  }
}
```

**Option B**: Track widgets with a ref and merge at the end

```typescript
// At top of component
const widgetsRef = useRef<Record<string, any>>({});

// In streaming loop - accumulate widgets
if (parsedFiles.php) {
  const widgetId = `widget_${Date.now()}`;
  widgetsRef.current[widgetId] = {
    name: widgetName,
    slug: widgetSlug,
    content: parsedFiles.php,
    className: className,
  };
}

// After stream completes - send all widgets at once
if (Object.keys(widgetsRef.current).length > 0) {
  onProjectMetadataUpdate(projectId, {
    widgetFiles: widgetsRef.current
  });
  widgetsRef.current = {}; // Reset for next generation
}
```

---

## Issue 2: Loading Indicator Not Visible ✅

### Investigation
**Location**: [GenerateProjectModal.tsx:1488](../src/components/elementor/GenerateProjectModal.tsx#L1488)

The loading indicator DOES exist and the state IS being set correctly:
- Line 554: `setGenerating(true)` when generation starts
- Line 1486: `{progress}` shows progress text
- Line 1488: `{generating && (` conditionally shows spinner

### Possible Causes

1. **Z-index Issue**: Modal might be behind other elements
2. **CSS Not Loading**: Spinner animation CSS might not be loaded
3. **State Not Triggering Re-render**: React might not be detecting the state change

### Solution

Check the modal's CSS and ensure the generating indicator has proper z-index:

```typescript
// Line 1479 - Ensure proper z-index
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999, // ✅ Ensure it's above everything
  backdropFilter: 'blur(4px)'
}}>
```

### Debugging Steps

1. **Check Console Logs**:
   ```javascript
   console.log('🔍 Generating state:', generating);
   console.log('🔍 Progress text:', progress);
   ```

2. **Check if modal is rendering**:
   Open browser DevTools → Elements → Search for "Generating" text

3. **Check CSS loading**:
   Look for the spinner animation in DevTools → Styles

---

## Issue 3: Chat API 404 Error ❌

### Problem
**Console Error**: `POST /api/chat 404 in 303ms`

**Expected**: Should hit `/api/chat-elementor`
**Actual**: Hitting `/api/chat` instead

### Investigation
**Location**: [elementor-editor/page.tsx:333](../src/app/elementor-editor/page.tsx#L333)

The page IS correctly configured:

```typescript
// Line 333 - Correct configuration
const { messages, sendMessage, isLoading, setMessages, reload, status } = useChat({
  api: '/api/chat-elementor',  // ✅ Correct endpoint

  // Line 340 - Override fetch to force correct endpoint
  fetch: async (url, options) => {
    console.log('🌐 FETCH CALLED - Original URL:', url);
    console.log('🌐 FETCH - Forcing to /api/chat-elementor');
    return fetch('/api/chat-elementor', options);  // ✅ Forced
  },
});
```

### Root Cause

The Vercel AI SDK might be caching the endpoint or there might be a race condition where an older message is being retried with the wrong endpoint.

### Solution

**Option A**: Check for stale messages in localStorage

```typescript
// Add to useEffect on mount
useEffect(() => {
  // Clear any cached messages that might have the wrong API endpoint
  const clearStaleMessages = () => {
    try {
      // Clear AI SDK cache
      sessionStorage.removeItem('ai-chat-messages');
      localStorage.removeItem('ai-chat-messages');
      console.log('🧹 Cleared stale AI SDK cache');
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }
  };

  clearStaleMessages();
}, []);
```

**Option B**: Force re-initialize useChat when model changes

```typescript
// Reset messages when switching models to force new API calls
useEffect(() => {
  setMessages([]);
}, [selectedModel, setMessages]);
```

**Option C**: Check if `/api/chat` route exists and remove it

```bash
# Check if the old route still exists
ls -la src/app/api/chat/

# If it exists, it should be removed or redirected to /api/chat-elementor
```

### Debugging Steps

1. **Check browser Network tab**:
   - Filter for `chat`
   - Look at Request URL - should be `/api/chat-elementor`
   - Look at Request Headers - check if it's a retry

2. **Check console logs**:
   ```javascript
   console.log('🔧 ELEMENTOR PAGE: useChat configured with api:', '/api/chat-elementor');
   console.log('🌐 FETCH CALLED - Original URL:', url);
   console.log('🌐 FETCH - Forcing to /api/chat-elementor');
   ```

3. **Test with fresh session**:
   - Open incognito window
   - Clear all cookies/cache
   - Try sending a message

---

## Quick Fix Checklist

### For Widget Tab Switching:
- [ ] Move metadata update outside streaming loop (lines 665-674 → after line 693)
- [ ] Or use ref to accumulate widgets and update once at the end
- [ ] Test with multi-widget plugin generation

### For Loading Indicator:
- [ ] Add console.log to verify `generating` state changes
- [ ] Check z-index on modal overlay (line 1479)
- [ ] Inspect DOM to see if spinner is rendering but hidden

### For Chat API:
- [ ] Clear AI SDK cache in useEffect on mount
- [ ] Check Network tab for actual endpoint being called
- [ ] Verify `/api/chat` route doesn't exist
- [ ] Test in incognito mode

---

## Testing Steps

1. **Generate Elementor Plugin**:
   ```
   1. Open /elementor-editor
   2. Click inner navbar "New Project" button
   3. Select "Elementor Widget"
   4. Enter description: "pricing table with 3 tiers"
   5. Click Generate
   6. Watch for:
      - Progress text updates ✅
      - Spinner animation visible ✅
      - PHP files appear in left sidebar ✅
      - Can click between widget files ✅
   ```

2. **Test Chat**:
   ```
   1. Open /elementor-editor
   2. Type message in chat: "hello"
   3. Check browser console:
      - Should see: "🌐 FETCH - Forcing to /api/chat-elementor"
      - Should NOT see: "POST /api/chat 404"
   4. Check Network tab:
      - Request URL should be "/api/chat-elementor"
   ```

---

## Related Files

- [GenerateProjectModal.tsx](../src/components/elementor/GenerateProjectModal.tsx)
- [HtmlSectionEditor.tsx](../src/components/elementor/HtmlSectionEditor.tsx)
- [elementor-editor/page.tsx](../src/app/elementor-editor/page.tsx)
- [/api/chat-elementor/route.ts](../src/app/api/chat-elementor/route.ts)

---

**Status**: Issues documented, fixes proposed, testing steps provided ✅
