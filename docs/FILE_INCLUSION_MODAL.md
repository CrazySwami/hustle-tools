# File Inclusion Modal Feature

**Date:** January 2025

## Overview

Added the ability for users to control which project files are included in the AI context when chatting. Users can click on the "Project files included" badge in the chat interface or use the Filter button in the code editor to open a modal where they can select/deselect files.

## User Problem

When working with large projects (especially plugins with 20+ widgets), users need to selectively include only relevant files in the AI context to:
- Reduce token usage
- Keep context focused and relevant
- Improve AI response quality
- Manage costs effectively

## Solution

### 1. File Inclusion Modal Component

**File:** `/src/components/elementor/FileInclusionModal.tsx`

- Displays checkboxes for each available file type
- Shows only files that exist in the current project
- Includes file type icons (HTML, CSS, JS, PHP, HubL, Plugin Main File, README)
- "Select All" and "Select None" bulk actions
- Saves selection and updates parent state

### 2. State Management

**File:** `/src/app/elementor-editor/page.tsx` (lines 281-290)

File inclusion state lifted to page level:
```typescript
const [fileInclusions, setFileInclusions] = useState({
  html: true,
  css: true,
  js: true,
  php: true,
  hubl: true,
  pluginMainFile: true,
  readme: true,
});
```

### 3. System Prompt Integration

**File:** `/src/lib/generate-elementor-system-prompt.ts`

Updated to accept `fileInclusions` parameter and conditionally include files:

```typescript
${fileInclusions.html && currentSection.html ? `**📄 HTML FILE...**` : ''}
${fileInclusions.css && currentSection.css ? `**🎨 CSS FILE...**` : ''}
${fileInclusions.js && currentSection.js ? `**⚡ JS FILE...**` : ''}
${fileInclusions.php && currentSection.php ? `**🔧 PHP FILE...**` : ''}
${fileInclusions.hubl && currentSection.hubl ? `**🧡 HubL FILE...**` : ''}
${fileInclusions.pluginMainFile && currentSection.pluginMainFile ? `**🔌 PLUGIN MAIN FILE...**` : ''}
${fileInclusions.readme && currentSection.projectManifest ? `**📖 README.md...**` : ''}
```

### 4. Clickable Badge

**File:** `/src/components/ai-elements/project-context-badge.tsx`

Added `onClick` prop to make the "Project files included" badge clickable:
- Hover effect (background darkens)
- Active effect (scales down slightly)
- Tooltip: "Click to filter files included in AI context"

### 5. Event Flow

```
User clicks badge → ProjectContextBadge.onClick
                 ↓
         ElementorChat.onOpenFileInclusions
                 ↓
         Dispatch 'open-file-inclusions-modal' event
                 ↓
         HtmlSectionEditor listens for event
                 ↓
         Opens FileInclusionModal
                 ↓
         User selects files → onSave
                 ↓
         Updates page-level state
                 ↓
         Passed to ElementorChat → System Prompt
```

## Files Changed

1. **FileInclusionModal.tsx** (NEW) - Modal UI component
2. **project-context-badge.tsx** - Added onClick prop and clickable styling
3. **ElementorChat.tsx** - Added onOpenFileInclusions prop, passes onClick to badge
4. **HtmlSectionEditor.tsx** - Added event listener, accepts file inclusions props
5. **page.tsx** - Lifted state, passes to both components, dispatches event
6. **generate-elementor-system-prompt.ts** - Conditionally includes files based on selections

## Usage

### Via Badge (Recommended)
1. Click on the "Project files included" badge in the chat
2. Select/deselect files you want to include
3. Click "Save Selection"
4. Next chat message will only include selected files

### Via Code Editor
1. Click the "Filter" button in the code editor toolbar
2. Same modal and selection process

## Technical Details

### Why Event-Based?

The badge is in `ElementorChat` (chat panel), but the modal is in `HtmlSectionEditor` (editor panel). These are sibling components at the page level, so we use a custom event to communicate:

```typescript
// Page dispatches event
window.dispatchEvent(new CustomEvent('open-file-inclusions-modal'));

// HtmlSectionEditor listens
window.addEventListener('open-file-inclusions-modal', handleOpenFileInclusions);
```

### State Flow

```
Page (fileInclusions state)
  ├── HtmlSectionEditor (receives via props, controls modal)
  └── ElementorChat (receives via props, passes to system prompt)
```

## Testing

- [ ] Click badge → modal opens
- [ ] Filter button → modal opens
- [ ] Uncheck HTML → next chat doesn't include HTML
- [ ] Select All → all files included
- [ ] Select None → only project name in context
- [ ] Plugin with 20 widgets → can selectively include specific widget files
- [ ] Changes persist during session (but reset on page refresh)

## Future Enhancements

1. **Persist selections in localStorage** - Remember user's file preferences per project
2. **Individual widget file selection** - For plugins, show checkbox for each widget file
3. **Preset filters** - "Code only", "Docs only", "Everything", etc.
4. **Token count estimate** - Show how many tokens will be saved by exclusions
5. **Smart suggestions** - AI suggests which files to include based on user's question

## Related Issues

This feature was requested because:
- Plugin generation wasn't showing streaming animation
- Users needed finer control over context size
- Large projects with many widgets needed selective inclusion
