# Animated Poem Widget - Installation Guide

## Problem You're Experiencing

You're getting "There has been a critical error on this website" because the WordPress plugin is **missing the main registration file**. Your current plugin only has the widget class, but it's never been registered with Elementor.

## What You Currently Have (BROKEN)

```
wp-content/plugins/animated-poem-widget/
├── Elementor_Animated_Poem_Widget.php  ← Widget class (not registered!)
└── widget.php                          ← Duplicate/wrong structure
```

## What You NEED (FIXED)

```
wp-content/plugins/animated-poem-widget/
├── elementor-animated-poem-widget.php  ← Main plugin file (registers widget)
└── widgets/
    └── class-animated-poem-widget.php  ← Widget class
```

---

## Installation Steps

### Option 1: Quick Fix in WordPress Playground

1. **Delete the broken plugin**:
   - Go to WordPress Dashboard → Plugins
   - Deactivate "Animated Poem Widget" (if active)
   - Delete the plugin completely

2. **Create new plugin folder structure** in WordPress Playground:
   ```javascript
   // In browser console:
   await playgroundClient.mkdir('/wordpress/wp-content/plugins/animated-poem-widget');
   await playgroundClient.mkdir('/wordpress/wp-content/plugins/animated-poem-widget/widgets');
   ```

3. **Upload the main plugin file**:
   - Copy contents of `elementor-animated-poem-widget-FIXED.php` (from this repo)
   - Paste into `/wordpress/wp-content/plugins/animated-poem-widget/elementor-animated-poem-widget.php`

4. **Upload the widget class file**:
   - Copy contents of `widgets/class-animated-poem-widget.php` (from this repo)
   - Paste into `/wordpress/wp-content/plugins/animated-poem-widget/widgets/class-animated-poem-widget.php`

5. **Activate the plugin**:
   - Go to WordPress Dashboard → Plugins
   - Find "Animated Poem Widget for Elementor"
   - Click "Activate"

6. **Test the widget**:
   - Go to Pages → Edit with Elementor (any page)
   - Search for "Animated Poem" in the widgets panel
   - Drag it onto the page
   - It should work without errors!

---

### Option 2: Using JavaScript Commands (Faster)

**Step 1: Delete old plugin** (in browser console):
```javascript
// Delete broken plugin
await playgroundClient.run({
    code: `<?php
        $plugin_dir = '/wordpress/wp-content/plugins/animated-poem-widget';
        if (is_dir($plugin_dir)) {
            system('rm -rf ' . escapeshellarg($plugin_dir));
            echo 'Old plugin deleted';
        }
    ?>`
});
```

**Step 2: Create new plugin structure**:
```javascript
// Create directories
await playgroundClient.mkdir('/wordpress/wp-content/plugins/animated-poem-widget');
await playgroundClient.mkdir('/wordpress/wp-content/plugins/animated-poem-widget/widgets');
```

**Step 3: Upload main plugin file**:
```javascript
// Read from local file and write to playground
const mainPluginContent = `[PASTE CONTENTS OF elementor-animated-poem-widget-FIXED.php HERE]`;

await playgroundClient.writeFile(
    '/wordpress/wp-content/plugins/animated-poem-widget/elementor-animated-poem-widget.php',
    mainPluginContent
);
```

**Step 4: Upload widget class file**:
```javascript
// Read from local file and write to playground
const widgetClassContent = `[PASTE CONTENTS OF widgets/class-animated-poem-widget.php HERE]`;

await playgroundClient.writeFile(
    '/wordpress/wp-content/plugins/animated-poem-widget/widgets/class-animated-poem-widget.php',
    widgetClassContent
);
```

**Step 5: Activate plugin via PHP**:
```javascript
await playgroundClient.run({
    code: `<?php
        require_once('/wordpress/wp-load.php');
        activate_plugin('animated-poem-widget/elementor-animated-poem-widget.php');
        echo 'Plugin activated successfully!';
    ?>`
});
```

---

## Key Differences from Broken Version

### Main Plugin File (`elementor-animated-poem-widget.php`)

**NEW - This file was MISSING before!**

This file does 4 critical things:

1. **Plugin Header**: Tells WordPress this is a plugin
   ```php
   /**
    * Plugin Name: Animated Poem Widget for Elementor
    * Description: Custom Elementor widget for displaying animated poems
    * Version: 1.0.0
    * ...
    */
   ```

2. **Dependency Checks**: Verifies Elementor is installed
   ```php
   if (!did_action('elementor/loaded')) {
       // Show error if Elementor not installed
   }
   ```

3. **Register Widget Category**: Creates "Hustle Tools" category in Elementor
   ```php
   add_action('elementor/elements/categories_registered', [$this, 'add_widget_category']);
   ```

4. **Register Widget**: Loads and registers your widget class
   ```php
   require_once(__DIR__ . '/widgets/class-animated-poem-widget.php');
   $widgets_manager->register(new \Elementor_Animated_Poem_Widget());
   ```

### Widget Class File (`widgets/class-animated-poem-widget.php`)

**UNCHANGED** - This is the same widget code you already have, just moved to correct location.

---

## Why It Broke

The issue wasn't with your **widget code** - that's perfect! The issue was with the **plugin structure**.

WordPress plugins need:
1. ✅ Widget class (you had this)
2. ❌ Main plugin file to REGISTER the widget (you were missing this!)

Without the main plugin file:
- WordPress doesn't know the plugin exists
- Elementor never receives the widget registration
- PHP tries to use an unregistered class → FATAL ERROR

---

## How to Verify It Works

After installation:

1. **Check WordPress Plugins page**:
   - Should show "Animated Poem Widget for Elementor" as Active
   - Version: 1.0.0

2. **Check Elementor Widget Panel**:
   - Open any page in Elementor editor
   - Widget panel should show "HUSTLE TOOLS" category
   - "Animated Poem" widget should be inside

3. **Test Widget**:
   - Drag "Animated Poem" onto page
   - Should render without errors
   - All style controls should work

4. **Check for Errors**:
   - No "Critical Error" message
   - No PHP errors in browser console
   - Widget appears in both editor and frontend

---

## Files to Copy

From this repository:

1. **`elementor-animated-poem-widget-FIXED.php`** → `/wordpress/wp-content/plugins/animated-poem-widget/elementor-animated-poem-widget.php`

2. **`widgets/class-animated-poem-widget.php`** → `/wordpress/wp-content/plugins/animated-poem-widget/widgets/class-animated-poem-widget.php`

---

## Troubleshooting

### Error: "Plugin could not be activated because it triggered a fatal error"

**Cause**: File path mismatch in main plugin file

**Fix**: Check that line 172 in `elementor-animated-poem-widget.php` matches your structure:
```php
require_once(__DIR__ . '/widgets/class-animated-poem-widget.php');
```

### Error: "Widget category 'hustle-tools' does not exist"

**Cause**: Widget category registration failed

**Fix**: Make sure `add_widget_category()` function is being called. Check that Elementor is active and version is 3.0.0+.

### Widget doesn't appear in Elementor panel

**Cause**: Widget registration failed

**Fix**:
1. Deactivate and reactivate the plugin
2. Clear Elementor cache: Dashboard → Elementor → Tools → Regenerate CSS & Data

### Still seeing critical error

**Cause**: Old plugin files still present

**Fix**:
1. Completely delete the plugin folder via FTP/File Manager
2. Reinstall using the corrected structure above

---

## Next Steps

Once the plugin is working:

1. **Test all widget features**:
   - Typography controls
   - Color controls
   - Spacing controls
   - Custom CSS/JS
   - Visibility settings
   - Animations

2. **Create more widgets**:
   - Use this structure as template
   - Add new widget classes to `widgets/` folder
   - Register them in main plugin file

3. **Export plugin** (optional):
   - Zip the entire `animated-poem-widget` folder
   - Can install on other WordPress sites

---

## Summary

**Problem**: Missing main plugin registration file
**Solution**: Created proper WordPress plugin structure with:
- Main plugin file (registers widget with Elementor)
- Widget class file (defines widget behavior)

**Result**: Widget works perfectly in Elementor without errors!
