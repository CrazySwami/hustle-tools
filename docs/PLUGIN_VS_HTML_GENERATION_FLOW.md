# Plugin vs HTML Generation Flow

**Date:** January 2025

This document explains how WordPress plugin generation differs from HTML generation, how the modal and chat tool work, and the complete flow for both project types.

---

## Table of Contents

1. [Overview](#overview)
2. [HTML Generation Flow](#html-generation-flow)
3. [Plugin Generation Flow](#plugin-generation-flow)
4. [Key Differences Table](#key-differences-table)
5. [Modal vs Chat Tool](#modal-vs-chat-tool)
6. [Code Architecture](#code-architecture)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The system supports generating three types of projects:
- **HTML Sections** - Static HTML/CSS/JS sections
- **WordPress Plugins** - Complete Elementor plugins with widget classes
- **HubSpot Modules** - Email or page modules with HubL tokenization

This document focuses on the differences between HTML and Plugin generation, as they use fundamentally different data structures and workflows.

---

## HTML Generation Flow

### Step-by-Step Flow

#### 1. **User Triggers Generation**

**Via Chat Tool (`generateProject` tool call):**
```typescript
{
  description: "hero section with call-to-action",
  projectType: "html",
  suggestedName: "hero_section"
}
```

**Via Modal (User clicks "Generate Project" button):**
- Opens `GenerateProjectModal`
- User selects "HTML Section"
- Enters description

---

#### 2. **Project Creation**
*File: `/src/app/elementor-editor/page.tsx` (lines 1673-1684)*

```typescript
onProjectCreate={(name, type, generationState = 'ready') => {
  // Create HTML project
  const newGroup = fileGroups.createNewGroup(name, 'html', 'empty', generationState);
  fileGroups.selectGroup(newGroup.id);
  setActiveTab('json'); // Switch to Code Editor tab
  setActiveCodeTab('html'); // Switch to HTML file tab
  return newGroup.id;
}}
```

**What happens:**
- Calls `fileGroups.createNewGroup()` (file-group-manager.ts:342)
- Creates `FileGroup` object with empty `html`, `css`, `js` fields
- Sets `generationState: 'generating'` for loading spinner
- Returns new project ID

**Data Structure:**
```typescript
{
  id: "group_123456",
  name: "hero_section",
  type: "html",
  html: "",
  css: "",
  js: "",
  generationState: "generating",
  createdAt: 1699123456,
  updatedAt: 1699123456
}
```

---

#### 3. **API Call**
*File: `/src/app/api/generate-project/route.ts` (lines 226-241)*

**Request:**
```json
{
  "description": "hero section with call-to-action",
  "projectType": "html",
  "projectName": "hero_section",
  "model": "anthropic/claude-sonnet-4-5-20250929"
}
```

**System Prompt:**
```
You are an expert frontend developer.
Create clean, modern, responsive HTML/CSS/JS code.
Return THREE code blocks:
- ```html (section HTML only, no DOCTYPE/head/body)
- ```css (scoped styles)
- ```javascript (optional interactivity)
```

**API Response Stream:**
````
Here's a hero section with a call-to-action:

```html
<section class="hero">
  <div class="container">
    <h1>Welcome to Our Site</h1>
    <p>This is a call-to-action</p>
    <button>Get Started</button>
  </div>
</section>
```

```css
.hero {
  padding: 80px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
/* ... more CSS */
```

```javascript
document.querySelector('.hero button').addEventListener('click', () => {
  alert('Button clicked!');
});
```
````

---

#### 4. **File Parsing & Streaming**
*File: `/src/components/tool-ui/GenerateProjectWidget.tsx` (lines 300-319)*

```typescript
// Parse HTML/CSS/JS from code blocks
const htmlMatch = fullCode.match(/```html\n([\s\S]*?)(?:```|$)/);
const cssMatch = fullCode.match(/```css\n([\s\S]*?)(?:```|$)/);
const jsMatch = fullCode.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

// Stream to project via onProjectUpdate callback
if (htmlMatch && onProjectUpdate) {
  onProjectUpdate(projectId, 'html', htmlMatch[1].trim());
}
if (cssMatch && onProjectUpdate) {
  onProjectUpdate(projectId, 'css', cssMatch[1].trim());
}
if (jsMatch && onProjectUpdate) {
  onProjectUpdate(projectId, 'js', jsMatch[1].trim());
}
```

---

#### 5. **State Update & Monaco Sync**
*File: `/src/app/elementor-editor/page.tsx` (lines 1669-1724)*

```typescript
onProjectUpdate={(projectId, file, content) => {
  // 1. Update Zustand state
  fileGroups.updateGroupFile(projectId, file, content);

  // 2. Update Monaco editor directly (if active project)
  if (projectId === fileGroups.activeGroupId) {
    const editorRef = editorRefs[file]; // editorRefs.html, editorRefs.css, editorRefs.js
    if (editorRef) {
      const model = editorRef.getModel();
      model.pushEditOperations([], [{
        range: model.getFullModelRange(),
        text: content
      }], () => null);
    }
  }
}}
```

**Result:** User sees code streaming into Monaco editor in real-time.

---

#### 6. **Completion**
*File: `/src/components/tool-ui/GenerateProjectWidget.tsx` (line 424)*

```typescript
// Update state to 'ready' when done
if (onProjectStateUpdate) {
  onProjectStateUpdate(projectId, 'ready');
}
```

**Final State:**
```typescript
{
  id: "group_123456",
  name: "hero_section",
  type: "html",
  html: "<section class=\"hero\">...</section>",
  css: ".hero { padding: 80px 20px; ... }",
  js: "document.querySelector('.hero button')...",
  generationState: "ready",
  updatedAt: 1699123499
}
```

---

## Plugin Generation Flow

### Step-by-Step Flow

#### 1. **User Triggers Generation**

**Via Chat Tool:**
```typescript
{
  description: "pricing table widget with 3 tiers",
  projectType: "elementor",
  suggestedName: "pricing_table"
}
```

**Via Modal:**
- Opens `GenerateProjectModal`
- User selects "Elementor Plugin (with Widget)"
- Enters description

---

#### 2. **Plugin Creation**
*File: `/src/app/elementor-editor/page.tsx` (lines 1673-1684)*

```typescript
onProjectCreate={(name, type, generationState = 'ready') => {
  if (type === 'php') {
    // Use createPlugin() instead of createGroup()
    const newGroup = fileGroups.createNewPlugin(name, '', generationState);
    fileGroups.selectGroup(newGroup.id);
    setActiveTab('json'); // Code Editor
    setActiveCodeTab('php'); // PHP tab
    return newGroup.id;
  }
}}
```

**What happens:**
- Calls `fileGroups.createNewPlugin()` (file-group-manager.ts:1310)
- Creates plugin structure with Hello World demo widget
- Sets `generationState: 'generating'`
- Returns new project ID

**Data Structure:**
```typescript
{
  id: "group_789012",
  name: "pricing_table",
  type: "php",
  isPlugin: true,
  pluginName: "pricing_table",
  pluginSlug: "pricing-table",
  pluginMainFile: "<?php\n/**\n * Plugin Name: pricing_table\n */\n...", // Full main file
  widgetFiles: {
    "widget_1699123456": {
      name: "Hello World",
      slug: "hello-world",
      content: "<?php\nclass Hello_World_Widget extends \\Elementor\\Widget_Base {...}",
      className: "Hello_World_Widget"
    }
  },
  html: "",
  css: "",
  js: "",
  generationState: "generating",
  projectManifest: "# Plugin README...",
  createdAt: 1699123456,
  updatedAt: 1699123456
}
```

---

#### 3. **API Call**
*File: `/src/app/api/generate-project/route.ts` (lines 267-425)*

**Request:**
```json
{
  "description": "pricing table widget with 3 tiers",
  "projectType": "elementor",
  "projectName": "pricing_table",
  "model": "anthropic/claude-sonnet-4-5-20250929"
}
```

**System Prompt:**
```
You are an expert Elementor widget developer.
Generate a complete WordPress plugin with TWO PHP FILES:

1. Main Plugin File (main-plugin.php):
   - WordPress plugin headers
   - Register widget class with Elementor
   - Enqueue scripts/styles

2. Widget Class File (widget.php):
   - Extend \Elementor\Widget_Base
   - Implement get_name(), get_title(), get_icon()
   - Define controls in _register_controls()
   - Implement render() method

Return TWO ```php code blocks.
```

**API Response Stream:**
````
Here's a pricing table widget plugin:

```php
<?php
/**
 * Plugin Name: Pricing Table Widget
 * Description: A pricing table widget for Elementor
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

function register_pricing_table_widget($widgets_manager) {
  require_once(__DIR__ . '/widget.php');
  $widgets_manager->register(new \Pricing_Table_Widget());
}
add_action('elementor/widgets/register', 'register_pricing_table_widget');
```

```php
<?php
class Pricing_Table_Widget extends \Elementor\Widget_Base {

  public function get_name() {
    return 'pricing_table';
  }

  public function get_title() {
    return 'Pricing Table';
  }

  protected function _register_controls() {
    // Control definitions
  }

  protected function render() {
    // HTML output
  }
}
```
````

---

#### 4. **File Parsing & Streaming**
*File: `/src/components/tool-ui/GenerateProjectWidget.tsx` (lines 214-285)*

```typescript
// Parse ALL PHP blocks
const phpBlocks = fullCode.match(/```php\n([\s\S]*?)(?:```|$)/g) || [];

// Identify which is main plugin file vs widget file
let mainPluginCode = '';
let widgetCode = '';

phpBlocks.forEach(block => {
  const code = block.replace(/```php\n/, '').replace(/```$/, '').trim();

  // Main plugin: contains "Plugin Name:" header
  if (code.includes('Plugin Name:') && code.includes('add_action')) {
    mainPluginCode = code;
  }
  // Widget file: contains "extends \Elementor\Widget_Base"
  else if (code.includes('class') && code.includes('extends') && code.includes('Widget_Base')) {
    widgetCode = code;
  }
});

// Stream main plugin file via onProjectMetadataUpdate
if (mainPluginCode && onProjectMetadataUpdate) {
  onProjectMetadataUpdate(projectId, {
    pluginMainFile: mainPluginCode
  });
}

// Stream widget file via onProjectMetadataUpdate
if (widgetCode && onProjectMetadataUpdate) {
  // Extract widget metadata from class
  const classNameMatch = widgetCode.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
  const className = classNameMatch ? classNameMatch[1] : 'Generated_Widget';
  const widgetSlug = className.toLowerCase().replace(/_/g, '-');
  const widgetName = className.replace(/_/g, ' ').replace(/\bWidget\b/, '').trim();

  // Generate unique widget ID
  const widgetId = `widget_${Date.now()}`;

  // Replace Hello World widget with generated widget
  onProjectMetadataUpdate(projectId, {
    widgetFiles: {
      [widgetId]: {
        name: widgetName,
        slug: widgetSlug,
        content: widgetCode,
        className: className
      }
    }
  });
}
```

---

#### 5. **Metadata Update & Monaco Sync**
*File: `/src/app/elementor-editor/page.tsx` (lines 1642-1672)*

```typescript
onProjectMetadataUpdate={(projectId, metadata) => {
  // Merge widgetFiles instead of replacing
  if (metadata.widgetFiles) {
    const currentGroup = fileGroups.groups.find(g => g.id === projectId);
    if (currentGroup?.widgetFiles) {
      metadata.widgetFiles = { ...currentGroup.widgetFiles, ...metadata.widgetFiles };
    }
  }

  // Update state
  fileGroups.updateGroup(projectId, metadata);

  // Update Monaco editor if active
  if (projectId === fileGroups.activeGroupId && metadata.pluginMainFile) {
    if (editorRefs.php) {
      const model = editorRefs.php.getModel();
      model.pushEditOperations([], [{
        range: model.getFullModelRange(),
        text: metadata.pluginMainFile
      }], () => null);
    }
  }
}}
```

**Result:** User sees main plugin file streaming into Monaco PHP editor. Widget files are saved to `widgetFiles` map.

---

#### 6. **Completion**

**Final State:**
```typescript
{
  id: "group_789012",
  name: "pricing_table",
  type: "php",
  isPlugin: true,
  pluginName: "pricing_table",
  pluginSlug: "pricing-table",
  pluginMainFile: "<?php\n/**\n * Plugin Name: Pricing Table Widget\n */\n...",
  widgetFiles: {
    "widget_1699123499": {
      name: "Pricing Table",
      slug: "pricing-table",
      content: "<?php\nclass Pricing_Table_Widget extends \\Elementor\\Widget_Base {...}",
      className: "Pricing_Table_Widget"
    }
  },
  generationState: "ready",
  updatedAt: 1699123499
}
```

Note: Hello World widget was replaced by the generated pricing table widget.

---

## Key Differences Table

| Aspect | HTML Generation | Plugin Generation |
|--------|----------------|-------------------|
| **Project Type** | `type: 'html'` | `type: 'php'` |
| **Creation Method** | `createNewGroup()` | `createNewPlugin()` |
| **Files Generated** | `html`, `css`, `js` | `pluginMainFile`, `widgetFiles` |
| **API Blocks** | 3 blocks (html, css, js) | 2 blocks (main-plugin.php, widget.php) |
| **Update Callback** | `onProjectUpdate()` | `onProjectMetadataUpdate()` |
| **Storage Fields** | Direct fields (`group.html`, `group.css`) | Metadata (`group.pluginMainFile`, `group.widgetFiles`) |
| **Monaco Editors** | 3 editors (HTML, CSS, JS tabs) | 1 editor (PHP tab for main file) |
| **Widget Management** | N/A | `widgetFiles` map with unique IDs |
| **Demo Content** | Empty fields | Hello World widget (replaced during generation) |
| **Regex Pattern** | ````html\n([\s\S]*?)```` | `if (code.includes('Plugin Name:'))` |
| **Metadata Merge** | Not needed | Required (merge `widgetFiles` to preserve multiple widgets) |

---

## Modal vs Chat Tool

Both the modal popup and chat tool use the **same generation flow** but were previously broken in different ways.

### How They Work Now (Fixed)

#### GenerateProjectModal
*File: `/src/components/elementor/GenerateProjectModal.tsx`*

**Props Received:**
```typescript
<GenerateProjectModal
  isOpen={generateDialogOpen}
  onClose={() => setGenerateDialogOpen(false)}
  onProjectCreate={(name, type, generationState) => { ... }}
  onProjectUpdate={(projectId, file, content) => { ... }}
  onProjectMetadataUpdate={(projectId, metadata) => { ... }} // ✅ NOW PASSED
  onProjectStateUpdate={(projectId, state, error) => { ... }} // ✅ NOW PASSED
  isEditorReady={isEditorReady} // ✅ NOW PASSED
/>
```

**Flow:**
1. User clicks "Generate Project" button
2. Modal opens, user selects type and enters description
3. Calls API `/api/generate-project`
4. Streams code back using callbacks above
5. Saves to state via `fileGroups.updateGroup()` and `fileGroups.updateGroupFile()`

---

#### GenerateProjectWidget (Chat Tool)
*File: `/src/components/tool-ui/GenerateProjectWidget.tsx`*

**Props Received from ElementorChat:**
```typescript
<GenerateProjectWidget
  projectType="elementor"
  projectName="pricing_table"
  description="pricing table with 3 tiers"
  onProjectCreate={(name, type, generationState) => { ... }}
  onProjectUpdate={(projectId, file, content) => { ... }}
  onProjectMetadataUpdate={(projectId, metadata) => { ... }} // ✅ NOW PASSED
  onProjectStateUpdate={(projectId, state, error) => { ... }} // ✅ NOW PASSED
/>
```

**Flow:**
1. AI calls `generateProject` tool
2. Widget appears in chat with loading state
3. Calls API `/api/generate-project`
4. Streams code back using callbacks above
5. Saves to state via same callbacks as modal

---

### Previous Issues (Fixed)

**Before Fix:**
- **Modal:** Missing `onProjectMetadataUpdate` callback → plugin files lost
- **Modal:** Used `createNewGroup()` instead of `createNewPlugin()` → wrong structure
- **Chat Tool:** Had callbacks but handler not implemented in page.tsx → files never saved
- **Both:** Used separate `updateGroup()` call for `generationState` → extra complexity

**After Fix:**
- ✅ Both receive all callbacks (`onProjectMetadataUpdate`, `onProjectStateUpdate`, `isEditorReady`)
- ✅ Both use `createNewPlugin()` for PHP projects
- ✅ `onProjectMetadataUpdate` handler implemented in page.tsx (lines 1642-1672)
- ✅ `createPlugin()` accepts `generationState` parameter directly

---

## Code Architecture

### Callback Flow Diagram

```
┌─────────────────────────────────────────────────┐
│           page.tsx (Main Page)                   │
│                                                   │
│  State Management:                                │
│  - fileGroups (Zustand)                          │
│  - editorRefs (Monaco editors)                   │
│  - activeTab, activeCodeTab                      │
│                                                   │
│  Callbacks Defined:                               │
│  - onProjectCreate (lines 1673-1684)             │
│  - onProjectUpdate (lines 1669-1724)             │
│  - onProjectMetadataUpdate (lines 1642-1672) ✅   │
│  - onProjectStateUpdate (uses updateProjectState)│
└─────────────────┬───────────────────────────────┘
                  │
                  │ Props passed to:
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  ElementorChat   │  │ GenerateProject  │
│  (Desktop/Mobile)│  │     Modal        │
│                  │  │                  │
│  Lines 1618-1732 │  │ Lines 2555-2672  │
│  Lines 2382-2527 │  │                  │
└──────┬───────────┘  └─────────┬────────┘
       │                        │
       │ Props passed to:       │
       │                        │
       ▼                        │
┌──────────────────┐           │
│ GenerateProject  │◄──────────┘
│     Widget       │
│                  │
│  Parsing Logic:  │
│  - HTML: lines 300-319      │
│  - Plugin: lines 214-285    │
│                  │
│  API Call:       │
│  - /api/generate-project    │
│                  │
│  Callbacks Used: │
│  - onProjectCreate          │
│  - onProjectUpdate          │
│  - onProjectMetadataUpdate  │
│  - onProjectStateUpdate     │
└─────────────────────────────┘
```

---

### File Group Manager Functions

**Location:** `/src/lib/file-group-manager.ts`

#### For HTML Projects:

```typescript
// Create HTML/HubSpot project
export function createGroup(
  name: string,
  type: 'html' | 'hubspot' = 'html',
  template: 'empty' | 'starter' = 'empty',
  generationState: 'generating' | 'ready' | 'error' = 'ready'
): FileGroup {
  return {
    id: generateId(),
    name,
    type,
    html: '',
    css: '',
    js: '',
    generationState,
    // ...
  };
}

// Update file content
export function updateGroupFile(
  id: string,
  file: 'html' | 'css' | 'js' | 'php' | 'hubl',
  content: string
): void {
  const group = groups.find(g => g.id === id);
  if (!group) return;

  // Special handling for plugins
  if (group.isPlugin && file === 'php') {
    updateGroup(id, { pluginMainFile: content });
  } else {
    updateGroup(id, { [file]: content });
  }
}
```

#### For Plugin Projects:

```typescript
// Create WordPress plugin
export function createPlugin(
  name: string,
  description?: string,
  generationState: 'generating' | 'ready' | 'error' = 'ready'
): FileGroup {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const mainFileContent = generateMainPluginFile(name, slug, description);
  const helloWorldCode = generateHelloWorldWidget();
  const helloWorldId = generateId();

  return {
    id: generateId(),
    name,
    type: 'php',
    isPlugin: true,
    pluginName: name,
    pluginSlug: slug,
    pluginMainFile: mainFileContent,
    widgetFiles: {
      [helloWorldId]: {
        name: 'Hello World',
        slug: 'hello-world',
        content: helloWorldCode,
        className: 'Hello_World_Widget'
      }
    },
    generationState, // ✅ Now accepted as parameter
    // ...
  };
}

// Update plugin metadata
export function updateGroup(
  id: string,
  updates: Partial<FileGroup>
): void {
  const group = groups.find(g => g.id === id);
  if (!group) return;

  Object.assign(group, updates, { updatedAt: Date.now() });
  saveGroups();
}
```

---

## Troubleshooting

### Issue: Plugin files not saving

**Symptoms:**
- Generation completes but only Hello World widget shows
- Main plugin file is empty
- Console shows "Metadata update requested" but no state change

**Cause:**
`onProjectMetadataUpdate` callback not passed or not implemented

**Fix:**
Check that page.tsx passes `onProjectMetadataUpdate` to both ElementorChat and GenerateProjectModal (lines 1642, 2406, 2595)

---

### Issue: Widget tabs not appearing

**Symptoms:**
- Only see "main-plugin.php" tab, no widget tabs
- `widgetFiles` is undefined or empty in state

**Cause:**
- Widget parsing regex not matching
- `onProjectMetadataUpdate` not merging widgets correctly

**Fix:**
1. Check regex in GenerateProjectWidget.tsx (line 226): `code.includes('extends') && code.includes('Widget_Base')`
2. Ensure merge logic in page.tsx (lines 1647-1651)

---

### Issue: Monaco editor not updating

**Symptoms:**
- Files save to state but editor stays empty
- No real-time streaming visible

**Cause:**
- Editor ref not available yet
- Wrong file type passed to editorRefs

**Fix:**
Check `isEditorReady` callback and ensure file type matches: `editorRefs.php` for plugins, `editorRefs.html` for HTML

---

### Issue: Generation state stuck on "generating"

**Symptoms:**
- Loading spinner never stops
- `generationState` stays "generating"

**Cause:**
- `onProjectStateUpdate` not called at end
- `updateProjectState()` method missing

**Fix:**
1. Ensure GenerateProjectWidget calls `onProjectStateUpdate(projectId, 'ready')` at completion (line 424)
2. Verify `updateProjectState()` exists in file-group-manager.ts

---

### Issue: Modal and chat tool produce different files

**Symptoms:**
- Modal creates empty plugin
- Chat tool creates complete plugin
- Or vice versa

**Cause:**
- Different callbacks passed to modal vs chat
- Different project creation methods (createGroup vs createPlugin)

**Fix:**
Ensure BOTH use same callbacks and same creation logic (see page.tsx lines 2572-2593 for modal, 1673-1684 for chat)

---

## Summary

**HTML Generation:**
- Simple, direct field storage (`html`, `css`, `js`)
- Single callback (`onProjectUpdate`)
- 3 Monaco editors

**Plugin Generation:**
- Complex metadata structure (`pluginMainFile`, `widgetFiles` map)
- Specialized callback (`onProjectMetadataUpdate`)
- Widget merging logic required
- 1 Monaco editor for main file, widget files in separate state

**Both:**
- Use same API endpoint (`/api/generate-project`)
- Stream code in real-time
- Update Monaco editors directly for smooth UX
- Support generation state tracking (`generating` → `ready`)

**Key Takeaway:**
The modal and chat tool now use **identical flows** with all callbacks properly implemented. Plugins use metadata updates to preserve widget structure, while HTML uses direct field updates for simplicity.
