# Morph Fast Apply: Diff Preview & Collapsible Widget

## Summary of Changes

Added two major UX improvements to the Morph Fast Apply widget:

1. **Collapsible Widget** - Can collapse the widget after accepting changes
2. **Diff Preview Workflow** - Opens file tab, shows Accept/Decline buttons, waits for user confirmation before applying

## New Workflow

### Before (Old Flow):
1. User asks chat to make code changes
2. Morph widget appears with "Apply Changes" button
3. Click button → Code immediately applied to editor
4. Widget shows "Applied" (can't collapse)

### After (New Flow):
1. User asks chat to make code changes
2. Morph widget appears with "Apply Changes" button
3. Click "Apply Changes" →
   - ✅ **Switches to the file tab** (HTML/CSS/JS)
   - ✅ Shows merged code preview in widget
   - ✅ Shows **Accept** and **Decline** buttons
   - ❌ **Does NOT apply** yet (waiting for user decision)
4. User can now see the git diff in the editor
5. User clicks **Accept** →
   - Code applied to editor
   - Widget **auto-collapses** to save space
6. OR user clicks **Decline** →
   - Changes discarded
   - Widget resets to idle state

## Files Changed

### 1. `/src/components/tool-ui/edit-code-morph-widget.tsx`

**Added**:
- `onSwitchCodeTab` prop to receive callback from parent
- `isCollapsed` state for collapse/expand functionality
- `handleAcceptChanges()` - Applies code and collapses widget
- `handleDeclineChanges()` - Discards changes and resets
- Collapse/expand toggle button in header
- Accept/Decline buttons instead of Applied/Reset

**Modified**:
- `handleApplyChanges()` - Now calls Morph API but doesn't apply code immediately
- Calls `onSwitchCodeTab(data.file)` to switch to the file tab
- Sets success state to show Accept/Decline buttons

**UI Changes**:
```tsx
// Header: Added collapse/expand toggle
<button onClick={() => setIsCollapsed(!isCollapsed)}>
  {isCollapsed ? <ChevronDown /> : <ChevronUp />}
</button>

// Success State: Changed from "Applied" to Accept/Decline
<Button onClick={handleDeclineChanges} variant="outline">
  <XCircle /> Decline
</Button>
<Button onClick={handleAcceptChanges}>
  <CheckCircle2 /> Accept Changes
</Button>

// Collapsed View: Shows summary
{isCollapsed && (
  <CardContent>
    ✓ Changes accepted and applied to {file}
  </CardContent>
)}
```

### 2. `/src/components/tool-ui/tool-result-renderer.tsx`

**Changed**:
```tsx
case 'editCodeWithMorph':
  return (
    <EditCodeMorphWidget
      data={{...}}
      onSwitchCodeTab={onSwitchCodeTab}  // ⭐ Pass callback
    />
  );
```

Now the widget receives the `onSwitchCodeTab` callback from the parent renderer, which was already being passed down from ElementorChat.

## User Experience Flow

### Step-by-Step Example

**User**: "add CSS to style the page with purple background"

**1. Morph Widget Appears (Idle State)**
```
🌀 Morph Fast Apply                             CSS    ▲
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instruction:
I am adding CSS styles with purple background

Changes (125 chars):
* { margin: 0; padding: 0; }
body { background: purple; }

[Apply Changes]

⚡ Morph Fast Apply: 10,500 tok/sec, 98% accuracy...
```

**2. User Clicks "Apply Changes"**
- 🌀 Widget shows "Merging with Morph..." (loading state)
- ⚡ Calls Morph API to get merged code
- 📁 **Auto-switches to CSS tab** in editor
- ✅ Morph merge completes

**3. Preview State (Success - Waiting for Decision)**
```
🌀 Morph Fast Apply                             CSS    ▲
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instruction:
I am adding CSS styles with purple background

Changes (125 chars):
* { margin: 0; padding: 0; }
body { background: purple; }

ℹ Preview Changes (Switch to CSS tab to see diff)
✅ Merged 125 characters
⚡ 234ms | 168 tokens | $0.000123

[Decline]  [Accept Changes]

⚡ Morph Fast Apply: 10,500 tok/sec, 98% accuracy...
```

**User Now Sees**:
- CSS tab is selected
- Git diff showing changes (green/red highlighting)
- Widget shows Accept/Decline buttons

**4. User Clicks "Accept Changes"**
- ✅ Code applied to editor
- 📦 Widget auto-collapses
- 💾 State saved to localStorage

**5. Collapsed View**
```
🌀 Morph Fast Apply                             CSS    ▼
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Changes accepted and applied to CSS
```

**User can click ▼ to expand again if needed**

### Decline Workflow

If user clicks **Decline** instead:
- ❌ Changes discarded (editor unchanged)
- 🔄 Widget resets to idle state
- 🗑️ localStorage cleared
- Widget shows "Apply Changes" button again

## Technical Implementation

### Callback Chain

```
ElementorChat.tsx
  ↓ passes onSwitchCodeTab prop
ToolResultRenderer
  ↓ passes onSwitchCodeTab prop
EditCodeMorphWidget
  ↓ calls onSwitchCodeTab('css')
Parent Component
  ↓ switches active tab to CSS
Monaco Editor Shows Diff
```

### State Machine

```
idle
  ↓ [Click "Apply Changes"]
loading (Morph API call)
  ↓ [API Success]
success (Preview - NOT applied yet!)
  ↓ [Click "Accept"] → Apply code → Collapse widget
  ↓ [Click "Decline"] → Reset to idle
```

### localStorage Persistence

Widget state persists across chat open/close:
- Key: `morph-widget-{file}-{instruction-snippet}`
- Stored: `state`, `stats`, `usage`, `timestamp`
- Cleared: When user clicks Decline or Reset

### Collapsed State Persistence

- `isCollapsed` starts as `false`
- When user accepts: `setIsCollapsed(true)`
- Widget collapses showing summary
- User can toggle anytime with chevron button

## Benefits

1. **Better Control** - User can preview changes before applying
2. **Visual Feedback** - See git diff in editor before accepting
3. **Less Clutter** - Collapsed widgets save chat space
4. **Cleaner Workflow** - Matches the old generate tool behavior users loved
5. **Safer Changes** - Can decline if Morph did something unexpected

## Testing Instructions

**Test Server**: http://localhost:3005/elementor-editor

### Test 1: Basic Accept Flow

1. Open Elementor Editor
2. Ask: "add CSS to style the page"
3. Morph widget appears with "Apply Changes" button
4. **Click "Apply Changes"**
5. **Should see**:
   - Widget shows "Merging with Morph..." (loading)
   - Tab switches to CSS automatically
   - Widget shows Accept/Decline buttons
   - Stats displayed: tokens, cost, duration
6. **Click "Accept Changes"**
7. **Should see**:
   - Code applied to CSS editor
   - Widget collapses showing "✓ Changes accepted and applied to CSS"

### Test 2: Decline Flow

1. Ask: "add an h1 heading"
2. Click "Apply Changes"
3. Widget switches to HTML tab, shows Accept/Decline
4. **Click "Decline"**
5. **Should see**:
   - Widget resets to idle state
   - Shows "Apply Changes" button again
   - HTML editor unchanged

### Test 3: Collapse/Expand

1. Ask: "add CSS styles"
2. Apply changes → Accept
3. Widget collapses
4. **Click chevron down (▼) in header**
5. **Should see**: Widget expands showing full details
6. **Click chevron up (▲)**
7. **Should see**: Widget collapses again

### Test 4: Multiple Widgets

1. Ask: "add CSS styles"
2. Apply → Accept (widget collapses)
3. Ask: "add an h1 heading"
4. Apply → Accept (widget collapses)
5. **Should see**: Two collapsed widgets, both showing accepted state
6. Expand either one independently

### Test 5: State Persistence

1. Ask: "add CSS styles"
2. Apply changes (don't accept yet!)
3. **Close chat panel**
4. **Reopen chat panel**
5. **Should see**: Widget still shows Accept/Decline buttons (state persisted)
6. Click Accept
7. **Should see**: Widget collapses

### Test 6: Empty File

1. Clear HTML editor (make it empty)
2. Ask: "add an h1 that says hello"
3. Click "Apply Changes"
4. **Should see**:
   - Tab switches to HTML
   - Shows "Write New Code" (not "Apply Changes")
   - Accept/Decline buttons appear
5. Click Accept
6. **Should see**: New code added to empty file, widget collapses

## Related Documentation

- [MORPH_UI_IMPROVEMENTS.md](MORPH_UI_IMPROVEMENTS.md) - Hidden parameters & state persistence
- [MORPH_FAST_APPLY_INTEGRATION.md](MORPH_FAST_APPLY_INTEGRATION.md) - Original Morph integration
- [docs/how-to-make-tools.md](docs/how-to-make-tools.md) - Tool creation guide

## Status: ✅ COMPLETE

All features implemented and ready for testing:
- ✅ Collapsible widget with chevron toggle
- ✅ Auto-switch to file tab on Apply
- ✅ Accept/Decline buttons instead of immediate apply
- ✅ Auto-collapse on Accept
- ✅ Decline resets to idle
- ✅ State persists across chat open/close
- ✅ Collapsed summary view
- ✅ Callback passed through renderer chain

Ready for testing at: http://localhost:3005/elementor-editor
