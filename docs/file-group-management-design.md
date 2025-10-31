# File Group Management System Design

## Overview

Allow users to create, manage, and switch between multiple file groups (projects/sections) in the Code Editor. Each group can be either:
- **HTML Project**: HTML + CSS + JavaScript
- **PHP Widget**: PHP + CSS + JavaScript

## User Requirements

1. ✅ Create multiple file groups
2. ✅ Each group has its own set of files (HTML/CSS/JS or PHP/CSS/JS)
3. ✅ Rename groups
4. ✅ Delete groups
5. ✅ Switch active group
6. ✅ Preview uses active group only
7. ✅ Deploy uses active group only
8. ✅ Persist groups in localStorage

## Current Architecture (Single Section)

```typescript
interface Section {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  php?: string;
  settings: SectionSettings;
  animation?: AnimationConfig;
}
```

**Problems**:
- Only ONE section at a time
- No way to manage multiple projects
- Switching sections loses work
- Can't compare or work on multiple widgets simultaneously

## Proposed Architecture (Multiple File Groups)

### Data Structure

```typescript
interface FileGroup {
  id: string;                    // Unique ID
  name: string;                  // User-defined name (e.g., "Hero Section", "Contact Form")
  type: 'html' | 'php';          // Project type
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp

  // Files
  html: string;                  // Only for type='html'
  css: string;
  js: string;
  php?: string;                  // Only for type='php'

  // Legacy section data (keep for backward compatibility)
  settings?: SectionSettings;
  animation?: AnimationConfig;
}

interface EditorState {
  groups: FileGroup[];           // All file groups
  activeGroupId: string | null;  // Currently active group
}
```

### Storage

**localStorage Key**: `elementor-editor-groups`

```json
{
  "groups": [
    {
      "id": "abc123",
      "name": "Hero Section",
      "type": "html",
      "createdAt": 1234567890,
      "updatedAt": 1234567890,
      "html": "<div>...</div>",
      "css": ".hero { ... }",
      "js": "console.log('hero');"
    },
    {
      "id": "def456",
      "name": "Contact Form Widget",
      "type": "php",
      "createdAt": 1234567890,
      "updatedAt": 1234567890,
      "php": "<?php class Contact_Form_Widget...",
      "css": ".contact-form { ... }",
      "js": "// Form validation"
    }
  ],
  "activeGroupId": "abc123"
}
```

## UI Design

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Section Name                     💾 Save  👁 Preview  ⋯    │
├──────────────┬──────────────────────────────────────────────┤
│              │  📄 index.html                    🔄 Preview  │
│  Projects    ├──────────────────────────────────────────────┤
│              │                                               │
│  + New       │                                               │
│              │        Monaco Editor (HTML)                   │
│  📦 Hero     │                                               │
│     Section  │                                               │
│  (active)    │                                               │
│              │                                               │
│  🔧 Contact  │                                               │
│     Form     │                                               │
│              │                                               │
│  📦 Footer   │                                               │
│     Section  │                                               │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

### Left Sidebar (New)

**Width**: 180px (left of file tree)

**Contents**:
1. **Header**: "PROJECTS" label + "New" button
2. **Group List**: Scrollable list of all groups
3. **Group Item**:
   - Icon (📦 for HTML, 🔧 for PHP)
   - Name (truncated if long)
   - Active indicator (blue background)
   - Hover: Show rename/delete buttons

**Actions**:
- Click group → Switch to that group
- Right-click group → Context menu (Rename, Duplicate, Delete)
- Click "+ New" → Show creation dialog

### New Group Dialog

```
┌──────────────────────────────────────┐
│  Create New Project                  │
├──────────────────────────────────────┤
│                                      │
│  Name:                               │
│  [____________________________]      │
│                                      │
│  Type:                               │
│  ( ) HTML Project (HTML/CSS/JS)      │
│  (•) PHP Widget (PHP/CSS/JS)         │
│                                      │
│  Template:                           │
│  [Empty ▼]                           │
│    - Empty                           │
│    - Hero Section (HTML)             │
│    - Contact Form (HTML)             │
│    - Basic Widget (PHP)              │
│                                      │
│        [Cancel]  [Create Project]    │
└──────────────────────────────────────┘
```

### Context Menu (Right-click group)

```
┌──────────────────┐
│ Rename           │
│ Duplicate        │
│ Export           │
│ ─────────────    │
│ Delete           │
└──────────────────┘
```

### Group Item Design

**Inactive**:
```
┌─────────────────────────┐
│ 📦 Hero Section         │
└─────────────────────────┘
```

**Active**:
```
┌─────────────────────────┐
│ ▶ 📦 Hero Section       │  ← Blue background, arrow indicator
└─────────────────────────┘
```

**Hover (inactive)**:
```
┌─────────────────────────┐
│ 📦 Hero Section    ✏ 🗑 │  ← Edit and delete icons appear
└─────────────────────────┘
```

## Workflow Examples

### Creating a New HTML Project

1. User clicks "+ New" in Projects sidebar
2. Dialog appears:
   - Name: "Hero Section"
   - Type: HTML Project
   - Template: Empty
3. User clicks "Create Project"
4. New group added to list
5. Group becomes active
6. Editor shows empty HTML/CSS/JS files

### Creating a New PHP Widget

1. User clicks "+ New"
2. Dialog appears:
   - Name: "Contact Form Widget"
   - Type: PHP Widget
   - Template: Basic Widget
3. User clicks "Create Project"
4. New group added with PHP template boilerplate
5. Group becomes active
6. Editor shows widget.php with basic Elementor structure

### Switching Between Groups

1. User has 3 groups:
   - "Hero Section" (HTML)
   - "Contact Form" (PHP)
   - "Footer Section" (HTML)
2. Currently editing "Hero Section" (HTML)
3. User clicks "Contact Form" in sidebar
4. Editor switches:
   - File tree shows widget.php instead of index.html
   - Monaco editor loads Contact Form PHP code
   - Top bar shows "Contact Form Widget"
5. User clicks "Footer Section"
6. Editor switches back to HTML files

### Previewing a Specific Group

1. User has "Hero Section" active
2. User clicks "Preview in WP" button
3. System:
   - Takes Hero Section's HTML/CSS/JS
   - Imports to WordPress Playground
   - Opens preview page
   - Automatically switches to WordPress Playground tab

### Deploying a Specific Widget

1. User has "Contact Form Widget" active (PHP)
2. User clicks "Deploy to WordPress" (or "Quick Widget")
3. System:
   - Takes Contact Form Widget's PHP/CSS/JS
   - Runs validation checks
   - Deploys to WordPress Playground
   - Shows success message

### Renaming a Group

1. User right-clicks "Hero Section" in sidebar
2. Clicks "Rename" from context menu
3. Inline input appears
4. User types "Hero Banner v2"
5. Presses Enter
6. Group name updates everywhere

### Deleting a Group

1. User right-clicks "Footer Section"
2. Clicks "Delete"
3. Confirmation dialog:
   ```
   Delete "Footer Section"?
   This action cannot be undone.
   [Cancel] [Delete]
   ```
4. User clicks "Delete"
5. Group removed from list
6. If it was active, switch to first remaining group

## Implementation Plan

### Phase 1: Data Layer (Core functionality)

**Files to modify**:
- `/src/lib/file-group-manager.ts` (NEW) - Core data management
- `/src/hooks/useFileGroups.ts` (NEW) - React hook for groups

**Functions**:
```typescript
// Create
createGroup(name: string, type: 'html' | 'php', template?: string): FileGroup

// Read
getGroups(): FileGroup[]
getActiveGroup(): FileGroup | null
getGroup(id: string): FileGroup | null

// Update
updateGroup(id: string, updates: Partial<FileGroup>): void
renameGroup(id: string, name: string): void
setActiveGroup(id: string): void
updateGroupContent(id: string, file: 'html' | 'css' | 'js' | 'php', content: string): void

// Delete
deleteGroup(id: string): void

// Persistence
saveToLocalStorage(): void
loadFromLocalStorage(): EditorState
```

### Phase 2: UI Components

**New Components**:
- `/src/components/elementor/ProjectSidebar.tsx` - Left projects list
- `/src/components/elementor/NewGroupDialog.tsx` - Create new group dialog
- `/src/components/elementor/GroupContextMenu.tsx` - Right-click menu

**Modified Components**:
- `/src/components/elementor/HtmlSectionEditor.tsx` - Integrate with groups

### Phase 3: Editor Integration

**Changes**:
1. Replace single `section` state with `activeGroup` from `useFileGroups()`
2. Update file tree to show files from active group
3. Update Monaco editor to load from active group
4. Update preview/deploy to use active group
5. Add auto-save on content change

### Phase 4: Templates

**Templates to include**:

**HTML Templates**:
- Empty (all files blank)
- Hero Section (basic hero with heading, subtitle, CTA)
- Contact Form (form with inputs)
- Feature Grid (3-column grid of features)
- Pricing Table (pricing cards)

**PHP Templates**:
- Empty (minimal widget structure)
- Basic Widget (widget with text control)
- Button Widget (full button widget example)
- Image Widget (image with caption)

### Phase 5: Export/Import

**Features**:
- Export group as ZIP (html/css/js or php/css/js files)
- Import group from ZIP
- Export all groups (backup)
- Import groups (restore)

## Technical Considerations

### State Management

**Current**: Single section state in HtmlSectionEditor component

**Proposed**:
- `useFileGroups()` hook manages all groups
- Stores in localStorage
- Provides React context for child components

### Backward Compatibility

**Migration Strategy**:
```typescript
function migrateOldSectionToGroups(): void {
  const oldSection = loadOldSection();
  if (oldSection) {
    const newGroup: FileGroup = {
      id: generateId(),
      name: oldSection.name || 'Untitled Section',
      type: oldSection.php ? 'php' : 'html',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      html: oldSection.html || '',
      css: oldSection.css || '',
      js: oldSection.js || '',
      php: oldSection.php,
    };
    saveGroups([newGroup], newGroup.id);
    clearOldSection();
  }
}
```

### Performance

**Concerns**:
- Loading 50+ groups could slow down UI
- Monaco editor re-mounting on switch could lag

**Solutions**:
- Virtual scrolling for group list (only render visible items)
- Lazy load Monaco editor content
- Debounce auto-save (save 500ms after last change)
- Compress localStorage data with LZ-string

### File Size Limits

**localStorage Limits**: ~5-10MB per domain

**Solution**:
- Show warning at 4MB usage
- Suggest exporting old groups
- Compress large files automatically

## User Experience Improvements

### Quick Switcher (Future)

**Keyboard Shortcut**: Cmd+P / Ctrl+P

```
┌──────────────────────────────────────┐
│  Quick Open...                       │
│  [search groups____________]         │
│                                      │
│  📦 Hero Section                     │
│  🔧 Contact Form Widget              │
│  📦 Footer Section                   │
│  📦 Pricing Table                    │
└──────────────────────────────────────┘
```

### Recent Groups

Show last 5 accessed groups at top of sidebar:

```
┌──────────────────────────┐
│ RECENT                   │
│  📦 Hero Section         │
│  🔧 Contact Form         │
│                          │
│ ALL PROJECTS             │
│  📦 Hero Section         │
│  🔧 Contact Form Widget  │
│  📦 Footer Section       │
│  📦 Pricing Table        │
└──────────────────────────┘
```

### Search/Filter

Add search box at top of sidebar:

```
┌──────────────────────────┐
│ [🔍 Search projects...] │
│                          │
│  📦 Hero Section         │
│  📦 Hero Banner v2       │
└──────────────────────────┘
```

### Drag & Drop Reordering

Allow users to drag groups to reorder them in the list.

## Mobile Considerations

**On Mobile**:
- No projects sidebar (too narrow)
- Show dropdown at top instead:
  ```
  [Current: Hero Section ▼]
  ```
- Dropdown shows all groups
- "+ New" button next to dropdown
- Context menu still available (long-press)

## Testing Checklist

- [ ] Create HTML project with template
- [ ] Create PHP project with template
- [ ] Create empty project
- [ ] Switch between groups (content persists)
- [ ] Rename group (updates everywhere)
- [ ] Delete group (removes from list)
- [ ] Delete active group (switches to next)
- [ ] Preview HTML group (correct content)
- [ ] Deploy PHP group (correct widget)
- [ ] Auto-save works (content saved after typing)
- [ ] localStorage persistence (survives page refresh)
- [ ] Migration from old single-section format
- [ ] Export group as ZIP
- [ ] Import group from ZIP
- [ ] Search/filter groups
- [ ] Performance with 50+ groups
- [ ] Mobile dropdown works

## Related Documentation

- [Section Schema](section-schema.md) - Current single-section structure
- [HTML to Widget Conversion Flow](html-to-widget-conversion-flow.md) - Deployment process
- [GrapeJS Visual Editor](grapejs-visual-editor.md) - Visual editor integration

## Implementation Priority

**Phase 1** (Essential):
1. Data layer (file-group-manager.ts)
2. useFileGroups hook
3. ProjectSidebar component
4. Editor integration (switch groups)
5. localStorage persistence

**Phase 2** (Important):
6. New group dialog
7. Rename/delete functionality
8. Templates (empty + basic)
9. Migration from old format

**Phase 3** (Nice to have):
10. Export/import
11. Search/filter
12. Recent groups
13. Quick switcher
14. Drag & drop reordering

## Open Questions

1. **Max groups limit?** - Suggest 100 groups max? Show warning?
2. **Group icons?** - Let users choose icon or auto-detect from content?
3. **Group colors?** - Let users tag groups with colors for organization?
4. **Folder structure?** - Should groups be nested in folders? (v2 feature)
5. **Cloud sync?** - Should groups sync across devices? (requires auth)
