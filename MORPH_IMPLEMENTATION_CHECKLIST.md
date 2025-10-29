# Morph Fast Apply - Complete Implementation Checklist

## Current Status: ⚠️ INCOMPLETE

The Morph tool exists but is NOT fully integrated. Here's what's missing:

## ❌ Issues Found:

### 1. **Model Pricing Outdated**
- ❌ Missing GPT-5 variants (gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro)
- ✅ **FIXED** - Added all GPT-5 pricing with 90% cache discount

### 2. **No Frontend Usage UI**
- ❌ Usage tracking exists but NOT visible to user
- ❌ No component to show costs, tokens, cache savings
- **Needed**: Usage dashboard component in Elementor editor

### 3. **No Automatic Cache Verification**
- ❌ Caching works but not verified automatically
- ❌ No logs showing cache hit rates
- **Needed**: Add cache stats logging in API responses

### 4. **Morph Tool NOT Fully Integrated**
- ✅ Tool defined in `tools.ts`
- ✅ Registered in `chat-elementor/route.ts`
- ❌ **NO custom UI widget** (will show as JSON!)
- ❌ **NOT wired to Morph API** (execute function doesn't call API)
- ❌ **NOT added to ElementorChat.tsx** switch statement
- **Status**: Tool exists but unusable

### 5. **Old Diff Tool Still Active**
- ✅ `editCodeWithDiff` tool still registered
- ⚠️ **Potential conflict** - AI might use wrong tool
- **Needed**: Mark as deprecated, make Morph primary

---

## 🎯 Implementation Plan

### Phase 1: Fix Morph Tool Integration (URGENT)

#### Step 1: Create Morph Widget Component
**File**: `/src/components/tool-ui/edit-code-morph-widget.tsx`

**Requirements** (from `how-to-make-tools.md`):
- [ ] Follow standard tool UI design (lines 20-555)
- [ ] Collapsible header with icon badge
- [ ] Loading state with spinner
- [ ] Show lazy edit preview
- [ ] "Apply Changes" button
- [ ] Success/error states with animations
- [ ] Call Morph API on button click
- [ ] Update `useEditorContent` global state

#### Step 2: Wire Widget to Tool Result Renderer
**File**: `/src/components/tool-ui/tool-result-renderer.tsx`

```typescript
// Add import
import { EditCodeMorphWidget } from './edit-code-morph-widget';

// Add case
case 'editCodeWithMorph':
  return <EditCodeMorphWidget data={result} />;
```

#### Step 3: Add Tool to ElementorChat Switch
**File**: `/src/components/elementor/ElementorChat.tsx`

Find the switch statement around line 191 and add:
```typescript
case 'tool-editCodeWithMorph':
```

#### Step 4: Update System Prompt Priority
**File**: `/src/app/api/chat-elementor/route.ts`

Change lines 85-98 to make Morph the PRIMARY method:
```typescript
**Option 1: Morph Fast Apply (MOST PREFERRED - 98% accurate, 10x faster):**
- editCodeWithMorph - Uses lazy edits (ALWAYS use this first!)

**Option 2: Diff-based editing (FALLBACK ONLY if Morph fails):**
- editCodeWithDiff - Legacy unified diff approach

**Option 3: Direct replacement (for complete rewrites):**
- updateSectionHtml/Css/Js - Replace entire file
```

---

### Phase 2: Add Usage Tracking UI

#### Step 1: Create Usage Tracker Component
**File**: `/src/components/elementor/UsageTracker.tsx`

**Features**:
- Show total cost for session
- Breakdown by model (AI Gateway vs Morph)
- Token counts (input/output/cached)
- Cache savings percentage
- Per-tool cost breakdown
- Collapsible sections
- Real-time updates

#### Step 2: Add to Elementor Editor
**File**: `/src/app/elementor-editor/page.tsx`

Add floating button in bottom-right corner:
- Small badge showing "$0.15" (current session cost)
- Click to expand full usage panel
- Slide-in drawer with detailed breakdown

---

### Phase 3: Add Cache Verification

#### Step 1: Log Cache Stats in API
**File**: `/src/app/api/edit-code-stream/route.ts`

After streaming completes, log:
```typescript
console.log('✅ Cache Performance:', {
  cacheHitRate: (cacheReadTokens / totalInputTokens * 100).toFixed(1) + '%',
  tokensSaved: cacheReadTokens,
  costSaved: cacheSavings.toFixed(4),
});
```

#### Step 2: Return Cache Stats to Frontend
Add to response metadata:
```typescript
return result.toTextStreamResponse({
  metadata: {
    cacheStats: {
      hitRate: cacheHitRate,
      tokensSaved: cacheReadTokens,
      costSaved: cacheSavings,
    }
  }
});
```

#### Step 3: Show Cache Stats in UI
Add badge to Monaco editor showing:
- "⚡ 90% cached" (green if >80%, yellow if 50-80%, red if <50%)
- Hover tooltip with detailed stats

---

## 📋 Complete Checklist

### Morph Tool (editCodeWithMorph)
- [x] Tool definition in `tools.ts`
- [x] Registered in `chat-elementor/route.ts`
- [x] Morph API endpoint created
- [ ] **Custom UI widget component**
- [ ] **Wired to tool-result-renderer**
- [ ] **Added to ElementorChat switch**
- [ ] **System prompt updated (make primary)**
- [ ] **Handles file type detection (html/css/js)**
- [ ] **Calls `/api/morph-apply` endpoint**
- [ ] **Updates `useEditorContent` global state**
- [ ] **Shows before/after preview**
- [ ] **Apply/Cancel buttons**
- [ ] **Loading/success/error states**

### Usage Tracking UI
- [x] `useUsageTracking` hook exists
- [x] Model pricing updated (GPT-5, Morph)
- [ ] **UsageTracker component created**
- [ ] **Added to Elementor editor UI**
- [ ] **Real-time cost display**
- [ ] **Model breakdown (AI Gateway vs Morph)**
- [ ] **Cache savings calculation shown**
- [ ] **Per-tool cost tracking**
- [ ] **Session reset button**
- [ ] **Export to CSV feature**

### Cache Verification
- [x] 3-layer caching implemented
- [ ] **Cache stats logged to console**
- [ ] **Cache hit rate calculated**
- [ ] **Cost savings displayed**
- [ ] **Warning if cache rate < 50%**
- [ ] **Badge in Monaco editor**
- [ ] **Tooltip with details**

### Old Diff Tool (Deprecation)
- [ ] **Mark `editCodeWithDiff` as fallback**
- [ ] **Update description: "(Legacy - use Morph instead)"**
- [ ] **Lower priority in system prompt**
- [ ] **Keep for backwards compatibility**

---

## 🚀 Quick Start (What to Do Next)

**Immediate Priority**: Get Morph tool working with UI

1. Create `/src/components/tool-ui/edit-code-morph-widget.tsx`
2. Wire it to `tool-result-renderer.tsx`
3. Add case to `ElementorChat.tsx`
4. Test by asking: "Change the button color to red"
5. Verify Morph widget appears with Apply button
6. Click Apply → Should update Monaco editor

**Expected Flow**:
```
User: "Change button color to red"
  ↓
AI calls editCodeWithMorph tool
  ↓
Widget appears showing lazy edit:
  // ... existing code ...
  .button { background: red; }
  // ... existing code ...
  ↓
User clicks "Apply Changes"
  ↓
Widget calls /api/morph-apply
  ↓
Morph merges → Returns full CSS
  ↓
Widget calls useEditorContent.updateContent('css', mergedCode)
  ↓
Monaco editor updates
  ↓
Preview shows new color
```

---

## 📝 Notes

- **Why Morph widget needed?** Tool only returns metadata. Widget handles actual API call + state update.
- **Why global state?** Monaco, Preview, and Tools all need same code content.
- **Why deprecate old diff?** Morph is more reliable (98% vs 85%) and works with Haiku.
- **Morph cost?** ~4% more expensive for large files, 60% cheaper for small files (vs Haiku failures).

---

## ✅ Definition of Done

Morph integration is complete when:
1. User can ask "change button color" in chat
2. Morph widget appears with lazy edit preview
3. User clicks "Apply Changes"
4. Monaco editor updates with merged code
5. Preview shows the changes
6. Usage tracker shows Morph cost
7. Console logs cache stats
8. All tests pass with Haiku model (no failures)
