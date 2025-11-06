# Elementor Plugin Generation

**Date:** January 2025

## Overview

Elementor projects now generate complete **WordPress plugins** (not standalone widgets), making them ready to install and extend with additional widgets later.

## Changes Made

### 1. Updated Generation Prompt (`/src/app/api/generate-project/route.ts`)

**Before:** Generated single `widget.php` file
**After:** Generates TWO files for a complete plugin structure

#### File 1: Main Plugin File (`main-plugin.php`)
- WordPress plugin header with metadata
- ABSPATH security check
- Registers custom 'hustle-tools' Elementor category
- Auto-requires `widget.php` from same directory
- Registers widget with Elementor

#### File 2: Widget Class File (`widget.php`)
- Complete widget class extending `\Elementor\Widget_Base`
- All required methods (get_name, get_title, get_icon, etc.)
- Comprehensive Elementor controls
- Inline CSS with `{{WRAPPER}}` scoping in render() method
- Inline JavaScript (if needed) in render() method

### 2. Updated Parsing Logic (`GenerateProjectWidget.tsx`)

Now parses BOTH PHP files from AI response:

```typescript
// Match main-plugin.php (first PHP block after "Main Plugin File" header)
const mainPluginMatch = fullCode.match(/Main Plugin File.*?```php\n([\s\S]*?)```/i);

// Match widget.php (first PHP block after "Widget Class File" or "widget.php" header)
const widgetMatch = fullCode.match(/(?:Widget Class File|widget\.php).*?```php\n([\s\S]*?)```/i);
```

### 3. Updated UI Labels

**GenerateProjectWidget.tsx:**
- Changed: `'Elementor Widget (PHP)'` → `'Elementor Plugin (with Widget)'`

**tools.ts:**
- Updated tool description to mention "complete WordPress plugin with main plugin file + widget file"
- Added note: "you can add more widgets to the plugin later"
- Changed message: "Elementor widget" → "Elementor plugin"

### 4. Updated Documentation

**CLAUDE.md:**
- Added section explaining single-file widget structure
- Clarified only 2 tabs shown for PHP projects (widget.php + README.md)

**system-prompts-reference.md:**
- Updated Elementor Widget Generation section
- Documented single PHP file with inline CSS/JS

## Plugin Structure

```
elementor-hero-section/           # Plugin directory
├── main-plugin.php               # Main plugin file (registration, hooks)
└── widget.php                    # Widget class (extends Widget_Base)
```

## Installation

1. Generate plugin via chat: "create a hero section widget"
2. Project appears in Section Library with 2 tabs:
   - `widget.php` - Widget class with inline CSS/JS
   - `README.md` - Auto-generated documentation
3. Download/export both files
4. Upload folder to `/wp-content/plugins/`
5. Activate plugin in WordPress
6. Widget appears in Elementor under "Hustle Tools" category

## Adding More Widgets

The plugin structure supports adding additional widgets:

1. Create new widget class file (e.g., `widget-pricing.php`)
2. Update `main-plugin.php` to require and register new widget:

```php
add_action('elementor/widgets/register', function($widgets_manager) {
    require_once(__DIR__ . '/widget.php');  // Original widget
    require_once(__DIR__ . '/widget-pricing.php');  // New widget

    $widgets_manager->register(new \Elementor_Hero_Section_Widget());
    $widgets_manager->register(new \Elementor_Pricing_Table_Widget());
});
```

## Benefits

1. **Complete Plugin Structure**: Ready to install in WordPress immediately
2. **Extensible**: Easy to add more widgets to the same plugin
3. **Professional**: Follows WordPress and Elementor best practices
4. **Organized**: Clear separation between plugin registration and widget logic
5. **Reusable**: Single category 'hustle-tools' for all custom widgets

## Related Files

- `/src/app/api/generate-project/route.ts` - AI generation prompt
- `/src/components/tool-ui/GenerateProjectWidget.tsx` - Response parsing
- `/src/lib/tools.ts` - Tool description
- `/docs/CHANGES_SINGLE_FILE_WIDGETS.md` - UI tab changes
