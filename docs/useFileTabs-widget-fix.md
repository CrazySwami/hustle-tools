# useFileTabs Hook - Widget Tab Switching Fix

**Date:** January 2025
**Status:** ✅ COMPLETE
**Impact:** Fixes critical widget tab switching bug in WordPress plugin projects

---

## 🎯 TL;DR

**Problem:** Widget tabs in WordPress plugins jump back to main plugin file when clicked.

**Root Cause:** 3-layer state management system with race condition between parent and child components.

**Solution:** Created `useFileTabs` hook that provides single source of truth for all file tabs, eliminating widget tab special cases.

**Result:** Widget tabs now work correctly, code complexity reduced by ~100 lines.

---

## 📊 Changes Summary

### Files Created
- **`/src/hooks/useFileTabs.ts`** (285 lines)
  - Unified tab management hook
  - Automatic tab generation from project structure
  - Smart content persistence
  - Backward compatible with existing code

### Files Modified
- **`/src/components/elementor/HtmlSectionEditor.tsx`**
  - **Net change:** -63 lines (5037 → 4974 lines)
  - **Complexity reduced:** Simplified tab management from ~160 lines to ~90 lines
  - **Key changes:**
    - Added hook integration (lines 146-217): +72 lines
    - Simplified `handleCodeTabChange` (lines 1265-1278): -35 lines
    - Simplified Monaco editor value/onChange (lines 3520-3527): -16 lines
    - Simplified tab button rendering (lines 3168-3215): -84 lines

---

## 🔧 Technical Details

### **Before: 3-Layer State System** ❌

```typescript
// Layer 1: Parent state
const externalActiveCodeTab = props.activeCodeTab;

// Layer 2: Component state
const [internalActiveCodeTab, setInternalActiveCodeTab] = useState('html');

// Layer 3: Widget selection state
const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

// Derived active tab
const activeCodeTab = externalActiveCodeTab ?? internalActiveCodeTab;
```

**Problem Flow:**
```
User clicks widget tab
  ↓
Component sets activeWidgetId='abc123'
  ↓
Component calls onCodeTabChange('php')
  ↓
Parent receives notification
  ↓
Parent calls handleCodeTabChange('php')  ← RACE CONDITION!
  ↓
handleCodeTabChange sees 'php' (not 'widget-abc123')
  ↓
Clears activeWidgetId to null
  ↓
Widget selection lost! 💥
```

### **After: useFileTabs Hook** ✅

```typescript
// Single source of truth
const { tabs, activeTabId, activeTab, switchTab, updateTabContent } = useFileTabs({
  project: fileGroups.activeGroup,
  onTabContentChange: (tabId, content) => {
    // Automatically handles widget files vs main files
    // Persists to fileGroups.onProjectMetadataUpdate
  }
});

// Backward compatibility (derived values)
const activeCodeTab = activeTab?.type || 'html';
const activeWidgetId = activeTab?.isWidget ? activeTab.widgetId : null;
```

**Fixed Flow:**
```
User clicks widget tab
  ↓
Component calls switchTab('widget-abc123')
  ↓
Hook updates activeTabId to 'widget-abc123'
  ↓
Component only notifies parent for main file tabs (NOT widgets)
  ↓
Parent never interferes with widget selection! ✅
```

---

## 📝 Hook API

### **`useFileTabs(options)`**

**Parameters:**
```typescript
{
  project: FileGroup | null;           // Current project from fileGroups
  onTabContentChange?: (tabId, content) => void;  // Callback for content updates
  defaultTab?: string;                 // Initial tab (default: 'html')
}
```

**Returns:**
```typescript
{
  tabs: FileTab[];                    // Array of all tabs for this project
  activeTabId: string;                // Currently active tab ID
  activeTab: FileTab | null;          // Currently active tab object
  switchTab: (tabId: string) => void; // Switch to different tab
  updateTabContent: (tabId: string, content: string) => void; // Update tab content
  getTabContent: (tabId: string) => string; // Get content for specific tab
}
```

### **Tab ID Format**

- **Main files:** `'html'`, `'css'`, `'js'`, `'php'`, `'hubl'`, `'docs'`
- **Widget files:** `'widget-{widgetId}'` (e.g., `'widget-abc123'`)

### **FileTab Interface**

```typescript
interface FileTab {
  id: string;          // Unique tab identifier
  type: FileType;      // File type: 'html' | 'css' | 'js' | 'php' | 'hubl' | 'docs'
  label: string;       // Display label (e.g., "Hero Widget", "styles.css")
  content: string;     // File content
  isWidget?: boolean;  // True if this is a widget file
  widgetId?: string;   // Widget ID (only for widget tabs)
  language: string;    // Monaco language identifier
  fileName?: string;   // File name for display
}
```

---

## 🔄 Key Changes in HtmlSectionEditor

### **1. Hook Integration (Lines 146-217)**

```typescript
const {
  tabs,
  activeTabId,
  activeTab,
  switchTab,
  updateTabContent
} = useFileTabs({
  project: fileGroups.activeGroup,
  onTabContentChange: (tabId, content) => {
    // Widget tabs
    if (tabId.startsWith('widget-')) {
      const widgetId = tabId.replace('widget-', '');
      if (fileGroups.activeGroup.widgetFiles?.[widgetId]) {
        fileGroups.onProjectMetadataUpdate(fileGroups.activeGroup.id, {
          widgetFiles: {
            ...fileGroups.activeGroup.widgetFiles,
            [widgetId]: {
              ...fileGroups.activeGroup.widgetFiles[widgetId],
              content: content
            }
          }
        });
      }
    }
    // Main files
    else {
      const updates: any = {};
      if (tabId === 'php') updates.pluginMainFile = content;
      else if (tabId === 'docs') updates.projectManifest = content;
      else updates[tabId] = content;

      fileGroups.onProjectMetadataUpdate(fileGroups.activeGroup.id, updates);
    }

    // Update editor content for chat access
    updateContent(tabId as any, content);
  }
});
```

### **2. Simplified handleCodeTabChange (Lines 1265-1278)**

**Before (40 lines):**
```typescript
const handleCodeTabChange = (tab) => {
  if (tab.startsWith('widget-')) {
    const widgetId = tab.replace('widget-', '');
    setActiveWidgetId(widgetId);
    setInternalActiveCodeTab('php');
    const widget = fileGroups.activeGroup.widgetFiles[widgetId];
    updateContent('php', widget.content);
    // ... 15 more lines
  } else {
    setActiveWidgetId(null);
    setInternalActiveCodeTab(tab);
    // ... 15 more lines
  }
};
```

**After (6 lines):**
```typescript
const handleCodeTabChange = (tab) => {
  switchTab(tab);

  if (onCodeTabChange && !tab.startsWith('widget-')) {
    onCodeTabChange(tab as "html" | "css" | "js" | "php" | "hubl");
  }
};
```

### **3. Simplified Monaco Editor (Lines 3520-3527)**

**Before (20 lines):**
```typescript
value={
  activeCodeTab === "html" ? editorHtml :
  activeCodeTab === "css" ? editorCss :
  activeCodeTab === "js" ? editorJs :
  activeCodeTab === "php" ? (
    activeWidgetId && fileGroups.activeGroup?.widgetFiles?.[activeWidgetId]
      ? fileGroups.activeGroup.widgetFiles[activeWidgetId].content
      : editorPhp
  ) :
  activeCodeTab === "hubl" ? editorHubl : ""
}

onChange={(value) => {
  if (activeCodeTab === 'php' && activeWidgetId && fileGroups.activeGroup?.widgetFiles?.[activeWidgetId]) {
    // 10 lines of widget update logic
  } else {
    updateSection({ [activeCodeTab]: value || "" });
  }
}}
```

**After (8 lines):**
```typescript
value={activeTab?.content || ""}

onChange={(value) => {
  if (value !== undefined && activeTabId) {
    updateTabContent(activeTabId, value);
  }
}}
```

### **4. Simplified Tab Button Rendering (Lines 3168-3215)**

**Before (110 lines):**
```typescript
{(() => {
  const projectType = fileGroups.activeGroup?.type;

  if (projectType === 'php') {
    const files = [{ tab: 'php', icon: <DiPhp />, name: 'plugin.php' }];

    if (activeGroup.widgetFiles) {
      Object.entries(activeGroup.widgetFiles).forEach(([widgetId, widget]) => {
        files.push({
          tab: `widget-${widgetId}`,
          icon: <DiPhp />,
          name: `${widget.slug}.php`
        });
      });
    }

    files.push({ tab: 'docs', icon: <FileText />, name: 'README.md' });
    return files;
  }

  if (projectType === 'hubspot') { return [...]; }

  return [...default files...];
})().map((file) => {
  const isActive = file.tab.startsWith('widget-')
    ? (activeWidgetId === file.tab.replace('widget-', '') && activeCodeTab === 'php')
    : (activeCodeTab === file.tab && !activeWidgetId);

  return <button onClick={() => handleCodeTabChange(file.tab)}>...</button>;
})}
```

**After (47 lines):**
```typescript
{tabs.map((tab) => {
  const icon = tab.type === 'html' ? <AiFillHtml5 /> :
    tab.type === 'css' ? <DiCss3 /> :
    tab.type === 'js' ? <DiJavascript1 /> :
    tab.type === 'php' ? <DiPhp color={tab.isWidget ? "#777BB4" : "#9B59B6"} /> :
    tab.type === 'hubl' ? <SiHubspot /> :
    <FileText />;

  const isActive = activeTabId === tab.id;

  return (
    <button
      key={tab.id}
      onClick={() => handleCodeTabChange(tab.id)}
      style={{ /* existing styles */ }}
    >
      {icon}
      {tab.label}
    </button>
  );
})}
```

---

## ✅ Benefits

1. **Eliminates widget tab bug** - Widget selection no longer lost when clicking tabs
2. **Reduces complexity** - 160+ lines of tab logic reduced to ~90 lines
3. **Single source of truth** - No more conflicting state layers
4. **Automatic widget support** - Hook generates widget tabs from project structure
5. **Easier to maintain** - Tab logic centralized in one hook
6. **Type-safe** - Full TypeScript support with `FileTab` interface
7. **Extensible** - Easy to add new file types by updating `generateTabs()`
8. **Backward compatible** - Derives `activeCodeTab` and `activeWidgetId` for existing code

---

## 🧪 Testing

### **Manual Testing Steps**

1. Open `/elementor-editor` in browser
2. Generate WordPress plugin with 2+ widgets:
   - Click chat "New Project" button
   - Select "Elementor Widget"
   - Enter description: "plugin with hero widget and pricing widget"
   - Click Generate
3. **Test widget tab switching:**
   - Click first widget tab → should stay selected ✅
   - Click second widget tab → should switch and stay selected ✅
   - Click main plugin file tab → should switch to main file ✅
   - Click back to widget tab → should return to widget ✅
4. **Test content editing:**
   - Edit widget PHP code
   - Switch to another tab
   - Switch back → edits should persist ✅
5. **Check console logs:**
   - Should see: `🔄 useFileTabs: Switching to tab: widget-abc123`
   - Should see: `💾 useFileTabs: Content changed for tab: widget-abc123`
   - Should NOT see: `❌ Clearing activeWidgetId`

### **Expected Console Output**

```
🔄 useFileTabs: Switching to tab: widget-abc123
💾 useFileTabs: Content changed for tab: widget-abc123 (1234 chars)
🔄 useFileTabs: Switching to tab: php
🔄 useFileTabs: Switching to tab: widget-def456
💾 useFileTabs: Content changed for tab: widget-def456 (987 chars)
```

---

## 📚 Related Files

- `/src/hooks/useFileTabs.ts` - Main hook implementation
- `/src/components/elementor/HtmlSectionEditor.tsx` - Integration point
- `/docs/MODAL_GENERATION_ISSUES_FIX.md` - Related fixes documentation

---

## 🔮 Future Enhancements

1. **Persist active tab** - Save `activeTabId` to localStorage
2. **Tab reordering** - Allow drag-and-drop to reorder tabs
3. **Tab grouping** - Group related tabs (e.g., all widget files)
4. **Tab search** - Search/filter tabs in large projects
5. **Tab preview** - Show content preview on hover
6. **Tab close** - Allow closing individual tabs

---

## 📝 Architecture Notes

### **Why Widget IDs in Tab IDs?**

Widget files use IDs like `widget-abc123` instead of just `php` because:
- Multiple widgets can exist in one project
- Each widget needs unique tab identifier
- Prevents confusion with main plugin file tab
- Makes active tab tracking unambiguous

### **Why Not Use Widget Name?**

Using widget ID instead of name because:
- Names can contain spaces/special characters
- Names may not be unique
- IDs are guaranteed unique and stable
- Easier to match with `fileGroups.widgetFiles` keys

### **Backward Compatibility Strategy**

The hook provides `activeCodeTab` and `activeWidgetId` as derived values to maintain compatibility with:
- Parent component expecting `activeCodeTab` prop
- Existing code checking `activeWidgetId`
- Monaco editor language selection
- File-specific logic throughout component

This allows gradual migration without breaking existing functionality.

---

## 🎓 Lessons Learned

1. **Avoid multi-layer state** - Always prefer single source of truth
2. **Make special cases first-class** - Widget tabs worked better as unique IDs than as special cases of 'php'
3. **Centralize complex logic** - Custom hooks are perfect for complex state management
4. **Derive when possible** - Derive backward-compatible values instead of maintaining duplicate state
5. **Test race conditions** - Parent/child communication can create subtle bugs

---

**Status:** ✅ Complete and ready for production use
