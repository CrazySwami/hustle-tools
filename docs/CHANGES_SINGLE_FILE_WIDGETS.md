# Single-File Widget Generation - Changes Summary

**Date:** January 2025

## Problem

User reported two issues:
1. WordPress Elementor widgets were showing "3 files" (widget.php, widget.css, widget.js)
2. Streaming wasn't working properly

## Root Causes

### Issue 1: UI Showing 3 Tabs
The problem wasn't that the AI was generating 3 separate files - it was that the **UI was showing 3 tabs** for PHP projects even though CSS/JS are inline in the PHP file.

**Location:** `HtmlSectionEditor.tsx` lines 2873-2879 and 3460-3478

### Issue 2: Already Fixed
The streaming race condition was already addressed in previous session with editor ready state tracking.

## Changes Made

### 1. Updated HtmlSectionEditor.tsx

**Desktop File Tree (Lines 2872-2878):**
```typescript
// BEFORE:
if (projectType === 'php') {
  return [
    { tab: 'php', icon: <DiPhp size={18} color="#777BB4" />, name: 'widget.php', lang: 'PHP' },
    { tab: 'css', icon: <DiCss3 size={18} color="#1572B6" />, name: 'widget.css', lang: 'CSS' },
    { tab: 'js', icon: <DiJavascript1 size={18} color="#F7DF1E" />, name: 'widget.js', lang: 'JavaScript' },
    { tab: 'docs', icon: <FileText size={16} color="#4CAF50" />, name: 'README.md', lang: 'Markdown' }
  ];
}

// AFTER:
// For regular PHP widgets (CSS/JS are inline in PHP, so only show PHP and docs)
if (projectType === 'php') {
  return [
    { tab: 'php', icon: <DiPhp size={18} color="#777BB4" />, name: 'widget.php', lang: 'PHP' },
    { tab: 'docs', icon: <FileText size={16} color="#4CAF50" />, name: 'README.md', lang: 'Markdown' }
  ];
}
```

**Mobile Tab Selector (Lines 3460-3479):**
```typescript
// BEFORE:
{["html", "css", "js"].map((tab) => (
  <button onClick={() => handleCodeTabChange(tab as "html" | "css" | "js")}>

// AFTER:
{/* Show appropriate tabs based on project type */}
{(projectType === 'php' ? ["php", "docs"] : projectType === 'hubspot' ? ["html", "hubl", "docs"] : ["html", "css", "js"]).map((tab) => (
  <button onClick={() => handleCodeTabChange(tab as "html" | "css" | "js" | "php" | "hubl" | "docs")}>
```

### 2. Updated Documentation

**File:** `docs/system-prompts-reference.md` (Lines 22-33)
- Updated section 1.1 to clarify single-file generation
- Added note about NO separate CSS/JS files
- Specified inline `<style>` and `<script>` tags in render() method

**File:** `CLAUDE.md` (Lines 147-153)
- Added new section: "IMPORTANT: Single-File Widget Structure"
- Clarified only TWO tabs for PHP projects
- Explained CSS/JS embedding approach

## Technical Details

### Widget Structure (from generate-project/route.ts)

Elementor widgets are now generated with this structure:

```php
<?php
class Elementor_Widget_Name extends \Elementor\Widget_Base {
    // ... widget methods ...

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <style>
        {{WRAPPER}} .my-class {
            /* All CSS here with {{WRAPPER}} scoping */
        }
        </style>

        <div class="my-widget">
            <!-- HTML output here -->
        </div>

        <script>
        (function($) {
            // JavaScript here if needed
        })(jQuery);
        </script>
        <?php
    }
}
?>
```

### Parsing Logic (from GenerateProjectWidget.tsx)

For `projectType === 'elementor'`, only PHP blocks are parsed:

```typescript
if (projectType === 'elementor') {
  const phpMatch = fullCode.match(/```php\n([\s\S]*?)(?:```|$)/);

  if (phpMatch) {
    onProjectUpdate(projectId, 'php', phpMatch[1].trim());
  }
}
```

CSS and JS matches are NO LONGER extracted for Elementor widgets.

## Benefits

1. **Clearer UI**: Users see only relevant tabs (widget.php + README.md)
2. **No Confusion**: No empty CSS/JS tabs that might confuse users
3. **Correct Workflow**: Matches actual file structure (single PHP file)
4. **Better Scoping**: CSS is {{WRAPPER}}-scoped, preventing global conflicts
5. **Proper Loading**: JS runs after widget renders (inline in render() method)

## Testing Checklist

- [ ] Generate new Elementor widget via chat ("create a hero widget")
- [ ] Verify only 2 tabs appear: widget.php and README.md
- [ ] Verify streaming works and content appears in PHP editor
- [ ] Verify no CSS or JS tabs are shown
- [ ] Check mobile view shows only PHP and DOCS buttons
- [ ] Test with existing PHP projects (should also show only 2 tabs)
- [ ] Verify HubSpot projects still show HTML, HubL, and Docs tabs
- [ ] Verify HTML projects still show HTML, CSS, and JS tabs

## Related Files

- `/src/components/elementor/HtmlSectionEditor.tsx` - Tab rendering logic
- `/src/components/tool-ui/GenerateProjectWidget.tsx` - Parsing logic
- `/src/app/api/generate-project/route.ts` - AI prompt for widget generation
- `/docs/system-prompts-reference.md` - Documentation
- `/CLAUDE.md` - Project instructions

## Subsequent Fix: Plugin Main File Storage

**See:** `/docs/PLUGIN_GENERATION_FIX.md` for full details

After the tab display fix, a second issue was discovered: the plugin main file (`main-plugin.php`) wasn't being stored correctly. The parser was using an invalid file type `'pluginMain'` which caused TypeScript errors.

**Fix Summary:**
- Created new `onProjectMetadataUpdate` callback to update `pluginMainFile` property
- Updated parser to use new callback instead of invalid file type
- Ensured plugin projects are flagged with `isPlugin: true` on creation
- Plugin slug is auto-generated from project name

**Files Changed:**
- `GenerateProjectWidget.tsx` - Added metadata callback, fixed parser
- `tool-result-renderer.tsx` - Pass callback through
- `HtmlSectionEditor.tsx` - Implement callback using `fileGroups.updateGroup()`
- `ElementorChat.tsx` - Pass callback to renderer

This fix ensures both `main-plugin.php` and `widget.php` are properly parsed and stored when generating Elementor plugins.
