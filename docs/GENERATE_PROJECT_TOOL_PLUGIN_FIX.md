# Generate Project Tool - Plugin Creation Fix

**Date:** January 2025

## Problem

When using the `generateProject` AI tool to create Elementor plugins, the system was creating regular PHP widget projects instead of proper WordPress plugins. This caused:

1. **No plugin structure** - Only widget.php and README.md were generated (missing main-plugin.php)
2. **No streaming animation** - Generation appeared instant with no visual feedback
3. **Wrong project type** - Project was marked as PHP widget instead of plugin

## Root Cause

The `generateProject` tool has a `projectType` parameter that can be `'html'` or `'elementor'`. When set to `'elementor'`, it should create a WordPress plugin, but the `GenerateProjectWidget` component was:

1. Creating a regular PHP project (`type: 'php'`)
2. NOT marking it as a plugin (`isPlugin: false` by default)
3. Therefore, plugin-specific logic never ran

## Solution

### Updated GenerateProjectWidget.tsx

**File:** `/src/components/tool-ui/GenerateProjectWidget.tsx` (lines 116-126)

Added logic to immediately mark Elementor projects as plugins after creation:

```typescript
// Create project FIRST with 'generating' state (use editable projectName)
const projectId = onProjectCreate(
  projectName,
  projectType === 'elementor' ? 'php' : projectType === 'hubspot' ? 'hubspot' : 'html',
  'generating' // Set initial state to 'generating'
);

// If it's an Elementor project, immediately mark it as a plugin
if (projectType === 'elementor' && onProjectMetadataUpdate) {
  onProjectMetadataUpdate(projectId, {
    isPlugin: true,
    pluginName: projectName,
    pluginSlug: projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  });
  console.log('🔌 Marked project as plugin:', projectName);
}
```

### How It Works

1. **Project Creation**: Creates a PHP project with `generationState: 'generating'`
2. **Plugin Flag**: Immediately calls `onProjectMetadataUpdate` to set `isPlugin: true`
3. **Metadata**: Sets plugin name and auto-generates slug from project name
4. **Parsing**: Existing parser detects `isPlugin: true` and looks for both:
   - `main-plugin.php` (plugin registration file)
   - `widget.php` (initial widget class)

### Parser Logic (Already Exists)

The parser in `GenerateProjectWidget.tsx` (lines 213-263) already handles plugin files correctly:

```typescript
if (projectType === 'elementor') {
  // Find ALL php blocks
  const phpBlocks = fullCode.match(/```php\n([\s\S]*?)```/gi) || [];

  // Identify which is which by content:
  // Main plugin: contains "Plugin Name:" and "add_action"
  // Widget: contains "class" and "extends \\Elementor\\Widget_Base"

  if (mainPluginCode && onProjectMetadataUpdate) {
    onProjectMetadataUpdate(projectId, {
      isPlugin: true,
      pluginMainFile: mainPluginCode
    });
  }

  if (widgetCode && onProjectUpdate) {
    onProjectUpdate(projectId, 'php', widgetCode);
  }
}
```

## Files Changed

1. **GenerateProjectWidget.tsx** (lines 116-126) - Added plugin metadata setting after project creation

## Expected Behavior After Fix

### When User Says: "Generate a pricing table widget"

**AI Tool Call:**
```json
{
  "description": "pricing table widget",
  "projectType": "elementor",
  "suggestedName": "pricing_table"
}
```

**System Actions:**
1. Opens GenerateProjectWidget with projectType='elementor'
2. Creates PHP project with `generationState: 'generating'`
3. ✅ **Immediately marks as plugin** (`isPlugin: true`)
4. Calls `/api/generate-project` with `projectType: 'elementor'`
5. Streams back 3 code blocks:
   - `main-plugin.php` - Plugin registration file
   - `widget.php` - Widget class
   - `README.md` - Documentation (auto-generated)
6. Parser extracts all 3 files
7. Saves to project:
   - `pluginMainFile` - main-plugin.php content
   - `php` - widget.php content
   - `projectManifest` - README.md content
8. Sets `generationState: 'ready'`
9. Shows completion notification

### Streaming Animation

With `generationState: 'generating'` set during creation:
- Loading spinner appears in project sidebar
- Monaco editor shows real-time code streaming
- Phase indicator shows current file being generated
- Completion notification appears when done

## Testing Checklist

- [ ] User says "create a hero widget" in chat
- [ ] AI calls generateProject tool with projectType='elementor'
- [ ] GenerateProjectWidget modal shows "Elementor Plugin (with Widget)"
- [ ] Project is created with `isPlugin: true`
- [ ] Streaming animation visible during generation
- [ ] All 3 files are generated and saved:
  - main-plugin.php
  - widget.php
  - README.md
- [ ] Project shows plugin icon in sidebar
- [ ] Plugin can be downloaded as .zip
- [ ] Can add more widgets to plugin later

## Related Fixes

This fix complements the earlier fix in `NewGroupDialog`:
- **NewGroupDialog** - When user manually creates plugin via "New Project" button
- **GenerateProjectWidget** - When AI creates plugin via `generateProject` tool

Both paths now correctly create plugin structures.

## Previous Issues (Now Fixed)

1. ❌ Plugin generation only created widget.php
   ✅ Now creates main-plugin.php + widget.php + README.md

2. ❌ No streaming animation visible
   ✅ Shows loading spinner and real-time code streaming

3. ❌ Project wasn't marked as plugin
   ✅ `isPlugin: true` set immediately after creation

4. ❌ User had to manually click "Update Project Docs" for README
   ✅ README auto-generated when state becomes 'ready'
