# Element Inspector Implementation

## Overview

The Element Inspector feature allows users to inspect and edit elements in the preview iframes. It works by:
1. Enabling "inspect mode" with a toggle button
2. Hovering over elements to see blue highlights
3. Clicking an element to grab its details and send to AI chat

## Components

### 1. ElementInspectorModal (`src/components/elementor/ElementInspectorModal.tsx`)

A beautiful modal that displays element data when an element is clicked in inspect mode.

**Features:**
- Shows HTML, attributes, computed styles, and context
- Copy-to-clipboard buttons for each section
- Prompt input field for editing instructions
- Keyboard shortcut: ⌘ + Enter to submit
- Sends both element data + user prompt to chat

**Usage:**
```tsx
<ElementInspectorModal
  elementData={inspectedElement}
  onClose={() => setInspectedElement(null)}
  onSubmit={(prompt, data) => {
    // Send to chat
  }}
/>
```

### 2. PreviewGrab (`src/components/elementor/PreviewGrab.tsx`)

The core inspector component that works with same-origin iframes.

**How it works:**
- Creates a blue overlay for highlighting elements on hover
- Captures click events and extracts element data
- Works with `sandbox="allow-scripts allow-same-origin"` iframes
- Only works within the same-origin context

**Usage:**
```tsx
<PreviewGrab
  previewRef={iframeRef}
  isActive={inspectMode}
  onGrabElement={(data) => {
    setInspectedElement(data);
  }}
/>
```

### 3. HtmlSectionEditor Implementation

**Inspect Mode Toggle:**
- Added toggle button in the preview toolbar
- Visual feedback: green flash when element is grabbed
- Auto-disables inspect mode after element selection

**Iframe Configuration:**
- Changed from `sandbox="allow-scripts"` to `sandbox="allow-scripts allow-same-origin"`
- This enables same-origin access for element inspection
- **Important:** `srcDoc` iframes are same-origin by default, so this works in production

**Files Modified:**
- `src/components/elementor/HtmlSectionEditor.tsx`:
  - Line 2403: Fixed iframe sandbox attribute
  - Lines 95-103: Added `inspectedElement` state
  - Lines 949-1030: Updated click handler to open modal
  - Lines 2971-3003: Rendered modal with submit handler

### 4. PlaygroundView Implementation

**Cross-Origin Limitation:**
- WordPress Playground uses cross-origin iframe (`https://playground.wordpress.net/remote.html`)
- Cannot access iframe content due to CORS restrictions
- Inspector cannot work directly within the iframe

**Solution: "Open in New Tab" Button**
- Added "🔍 Open in New Tab" button in playground options
- Opens the current playground URL in a new browser window
- Users can then use browser DevTools (F12) to inspect elements
- Helpful alert guides users through the process

**Files Modified:**
- `src/components/elementor/PlaygroundView.tsx`:
  - Lines 285-307: Added "Open in New Tab" button

## User Flow

### HtmlSectionEditor (Code Editor Preview)

1. User clicks "🔍 Inspect" button in preview toolbar
2. Inspect mode activates, cursor changes to crosshair
3. User hovers over elements to see blue highlight
4. User clicks an element
5. Modal opens showing all element data
6. User types prompt: "Change background to blue"
7. User presses ⌘ + Enter
8. Element data + prompt sent to AI chat
9. Inspect mode automatically turns off

### PlaygroundView (WordPress Preview)

**Limited Functionality:**
- Click "👁️ View Live" to navigate to preview page
- Click "🔍 Open in New Tab" to open in new window
- Use browser DevTools (F12) to inspect elements
- Select element and copy HTML/selectors manually
- Paste into chat for editing

## Technical Details

### Same-Origin Policy

The element inspector only works with same-origin iframes:

✅ **Works:**
- `srcDoc` iframes (auto same-origin)
- `sandbox="allow-scripts allow-same-origin"` iframes
- Same-domain iframes

❌ **Doesn't Work:**
- Cross-origin iframes (WordPress Playground)
- `sandbox` without `allow-same-origin`

### Element Data Captured

```typescript
{
  html: string;           // Full outerHTML of element
  selector: string;       // CSS selector (id > class > tag)
  classList: string[];    // Array of class names
  tagName: string;        // HTML tag name
  attributes: Record<string, string>;  // All HTML attributes
  computedStyles: Record<string, string>;  // Important computed styles
  context: string;        // Parent/sibling information
}
```

### Copy to Clipboard

Each section in the modal has a copy button:
- Click to copy section content
- Green checkmark appears for 2 seconds
- All copy buttons are independent

## Future Enhancements

### Potential Improvements

1. **Cross-Origin Inspection**
   - Inject iframe message bridge for cross-origin communication
   - Use `postMessage` API to request element data
   - More complex, but would enable Playground inspection

2. **Visual Element Picker**
   - Click anywhere on page to highlight element
   - Navigation breadcrumbs showing element hierarchy
   - "Select Parent/Sibling" buttons

3. **Style Editor**
   - Live CSS editing in modal
   - Preview changes before applying
   - "Apply Changes" button to send to chat

4. **History**
   - Track previously inspected elements
   - Quick re-select recent elements
   - "Inspect Similar" feature

## Testing

### Manual Testing Checklist

**HtmlSectionEditor:**
- [ ] Inspect mode toggle works
- [ ] Hover highlights elements in blue
- [ ] Click opens modal with element data
- [ ] Copy buttons work for each section
- [ ] Prompt input accepts keyboard shortcut
- [ ] Submit sends data to chat
- [ ] Inspect mode auto-disables after submit
- [ ] Green flash feedback shows on grab

**PlaygroundView:**
- [ ] "Open in New Tab" button appears
- [ ] Opens iframe URL in new window
- [ ] Helpful alert shows if playground not loaded
- [ ] DevTools work in new tab

### Edge Cases

**Empty Elements:**
- Empty divs still capture correct bounds
- Inline elements capture parent context

**Dynamic Content:**
- Inspector works with dynamically added elements
- Re-renders don't break inspector

**Mobile:**
- Touch events work for mobile
- Modal is responsive
- Copy buttons work on mobile

## Troubleshooting

### Inspector Not Working

**Issue:** No highlights when hovering
- Check iframe sandbox attribute includes `allow-same-origin`
- Verify inspect mode is actually toggled on
- Check console for CORS errors

**Issue:** "Cannot access iframe" error
- Iframe is cross-origin (expected for Playground)
- Use "Open in New Tab" instead

**Issue:** Modal doesn't open
- Check if `inspectedElement` state is set
- Verify modal component is rendered
- Check console for errors

### Cross-Origin Playground

**Issue:** "Inspector doesn't work in Playground"
- This is expected due to CORS
- Solution: Use "Open in New Tab" + DevTools
- Feature request: Implement `postMessage` bridge

## References

- [MDN: HTML Drag & Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [MDN: Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [React Flow Learn](https://reactflow.dev/learn)
- Vercel AI Agents: [How to build agents with the AI SDK](https://vercel.com/guides/ai-agents#how-to-build-agents-with-the-ai-sdk)

---

Last updated: 2025-01-02
