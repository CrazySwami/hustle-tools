# Plugin Main File Generation - Bug Fix

**Date:** January 2025

## Problem

When generating Elementor plugins with the "Generate Widget" tool, the system was attempting to parse and store the main plugin file (`main-plugin.php`) but failing because:

1. The parser in `GenerateProjectWidget.tsx` used an invalid file type `'pluginMain'`
2. The `onProjectUpdate` callback only accepted standard file types: `'html' | 'css' | 'js' | 'php' | 'hubl'`
3. Plugin projects weren't being flagged with `isPlugin: true` on creation
4. There was no mechanism to update the `pluginMainFile` property in the FileGroup

## Root Cause

The `FileGroup` interface already supported plugin files via the `pluginMainFile` property (defined in `/src/lib/file-group-manager.ts:37`), but the streaming parser and callbacks weren't using it correctly.

**Error Location:** [GenerateProjectWidget.tsx:225](src/components/tool-ui/GenerateProjectWidget.tsx#L225)

```typescript
// BROKEN CODE:
if (mainPluginMatch) {
  console.log(`📝 Streaming main-plugin.php (${mainPluginMatch[1].trim().length} chars)`);
  onProjectUpdate(projectId, 'pluginMain', mainPluginMatch[1].trim()); // ❌ 'pluginMain' is not a valid type
}
```

This would cause a TypeScript error and runtime failure because `'pluginMain'` is not in the union type `'html' | 'css' | 'js' | 'php' | 'hubl'`.

## Solution

Created a new callback `onProjectMetadataUpdate` that can update any property of the FileGroup using `Partial<FileGroup>`:

### 1. Added New Callback Interface

**File:** [GenerateProjectWidget.tsx:19](src/components/tool-ui/GenerateProjectWidget.tsx#L19)

```typescript
interface GenerateProjectWidgetProps {
  // ... existing props ...
  onProjectMetadataUpdate?: (projectId: string, metadata: Partial<{
    isPlugin: boolean;
    pluginMainFile: string;
    pluginName: string;
    pluginSlug: string
  }>) => void; // Update plugin metadata
}
```

### 2. Updated Parser to Use New Callback

**File:** [GenerateProjectWidget.tsx:225-230](src/components/tool-ui/GenerateProjectWidget.tsx#L225-L230)

```typescript
// FIXED CODE:
if (mainPluginMatch && onProjectMetadataUpdate) {
  console.log(`📝 Streaming main-plugin.php (${mainPluginMatch[1].trim().length} chars)`);
  onProjectMetadataUpdate(projectId, {
    isPlugin: true,
    pluginMainFile: mainPluginMatch[1].trim()
  });
}
```

### 3. Implemented Callback in HtmlSectionEditor

**File:** [HtmlSectionEditor.tsx:4223-4227](src/components/elementor/HtmlSectionEditor.tsx#L4223-L4227)

```typescript
onProjectMetadataUpdate={(projectId, metadata) => {
  // Update plugin metadata (pluginMainFile, isPlugin flag, etc.)
  fileGroups.updateGroup(projectId, metadata);
  console.log(`🔧 Updated plugin metadata for ${projectId}:`, metadata);
}}
```

This uses the existing `fileGroups.updateGroup()` method which accepts `Partial<FileGroup>` and can update any property.

### 4. Ensure Plugin Flag on Creation

**File:** [HtmlSectionEditor.tsx:4158-4168](src/components/elementor/HtmlSectionEditor.tsx#L4158-L4168)

```typescript
// For PHP projects (Elementor plugins), mark as plugin and initialize metadata
if (type === 'php') {
  const pluginSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  fileGroups.updateGroup(newGroup.id, {
    isPlugin: true,
    pluginName: name,
    pluginSlug: pluginSlug,
    pluginMainFile: '', // Will be populated by streaming
  });
  console.log('🔌 Marked as plugin:', { pluginName: name, pluginSlug });
}
```

### 5. Pass Callback Through Component Tree

Updated the following components to accept and pass `onProjectMetadataUpdate`:

- [tool-result-renderer.tsx:59](src/components/tool-ui/tool-result-renderer.tsx#L59) - Interface
- [tool-result-renderer.tsx:130](src/components/tool-ui/tool-result-renderer.tsx#L130) - Function params
- [tool-result-renderer.tsx:359](src/components/tool-ui/tool-result-renderer.tsx#L359) - Pass to GenerateProjectWidget
- [ElementorChat.tsx:62](src/components/elementor/ElementorChat.tsx#L62) - Interface
- [ElementorChat.tsx:117](src/components/elementor/ElementorChat.tsx#L117) - Function params
- [ElementorChat.tsx:397, 457](src/components/elementor/ElementorChat.tsx#L397) - Pass to ToolResultRenderer (2 locations)

## How It Works

1. **Project Creation**: When creating an Elementor plugin (`type === 'php'`), the project is immediately flagged with:
   - `isPlugin: true`
   - `pluginName: <project name>`
   - `pluginSlug: <kebab-case-slug>`
   - `pluginMainFile: ''` (empty, will be populated)

2. **Streaming**: As the AI generates code:
   - Widget PHP code → parsed and sent to `onProjectUpdate(projectId, 'php', content)`
   - Main plugin file → parsed and sent to `onProjectMetadataUpdate(projectId, { isPlugin: true, pluginMainFile: content })`

3. **Storage**: Both files are stored in the same FileGroup:
   - `group.php` = Widget class file (widget.php)
   - `group.pluginMainFile` = Main plugin file (main-plugin.php)

## File Structure

A complete Elementor plugin FileGroup now has:

```typescript
{
  id: "fg_123456789",
  name: "My Hero Widget",
  type: "php",
  isPlugin: true,
  pluginName: "My Hero Widget",
  pluginSlug: "my-hero-widget",
  php: "<?php\nclass Elementor_My_Hero_Widget extends ...", // widget.php
  pluginMainFile: "<?php\n/**\n * Plugin Name: My Hero Widget ...", // main-plugin.php
  projectManifest: "# Project Documentation\n...",
  // ... other properties
}
```

## Benefits

1. **Type Safety**: No more invalid file types passed to callbacks
2. **Extensibility**: Can easily update other plugin metadata (version, description, etc.)
3. **Clean Architecture**: Uses existing `updateGroup()` infrastructure
4. **Backward Compatible**: Standard projects (HTML, HubSpot) unaffected
5. **Future-Proof**: Can add more widget files using `widgetFiles` map

## Testing Checklist

- [x] Generate new Elementor plugin via chat ("create a hero widget plugin")
- [x] Verify project created with `isPlugin: true` flag
- [x] Verify both `main-plugin.php` and `widget.php` are parsed and stored
- [x] Verify no TypeScript errors
- [x] Check browser console for successful streaming logs:
  - `📦 Project created: <name> Type: php ID: <id>`
  - `🔌 Marked as plugin: { pluginName, pluginSlug }`
  - `📝 Streaming main-plugin.php (<X> chars)`
  - `📝 Streaming widget.php (<Y> chars)`
  - `🔧 Updated plugin metadata for <id>: { isPlugin: true, pluginMainFile: ... }`

## Related Files

- [/src/components/tool-ui/GenerateProjectWidget.tsx](src/components/tool-ui/GenerateProjectWidget.tsx) - Parser and widget
- [/src/components/tool-ui/tool-result-renderer.tsx](src/components/tool-ui/tool-result-renderer.tsx) - Tool renderer
- [/src/components/elementor/HtmlSectionEditor.tsx](src/components/elementor/HtmlSectionEditor.tsx) - Callback implementation
- [/src/components/elementor/ElementorChat.tsx](src/components/elementor/ElementorChat.tsx) - Chat interface
- [/src/lib/file-group-manager.ts](src/lib/file-group-manager.ts) - Data structures
- [/src/app/api/generate-project/route.ts](src/app/api/generate-project/route.ts) - AI prompt for generation

## Additional Fix: Style Kit Font Enforcement

While investigating, also fixed an issue where Style Kit generation wasn't respecting user-specified fonts (e.g., "use Futura as the font only").

**File:** [generate-stylekit/route.ts:91-97](src/app/api/generate-stylekit/route.ts#L91-L97)

**Changes:**
- Strengthened STAGE2 RULES to make font selection **CRITICAL** and **NON-NEGOTIABLE**
- Added similar notes to STAGE3 and STAGE4 to preserve font choices
- Changed from "Use provided brand fonts if available" to "If user specifies brand fonts, YOU MUST use them EXACTLY"

This ensures the AI strictly follows user font specifications rather than choosing alternatives.

---

**Status:** ✅ All fixes implemented and tested
**Last Updated:** January 2025
