# Quick Widget Error Debugging Guide

## Overview

Quick Widget generation now includes **two-stage error checking** to catch PHP errors before they break WordPress:

1. **Syntax Check**: Validates PHP syntax with `php -l`
2. **Runtime Check**: Tests widget instantiation to catch fatal errors

This prevents the "infinite loop" issue where broken widgets cause 500 errors in the Elementor widget library.

## Error Checking Flow

### Stage 1: Syntax Validation
```bash
php -l widget.php
```

**Catches**:
- Missing semicolons
- Unbalanced brackets/braces
- Invalid PHP syntax
- Parse errors

**Console Output**:
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_OK
```

**If Failed**:
```
❌ PHP SYNTAX ERROR IN WIDGET:
Parse error: syntax error, unexpected '}' in /tmp/widget-check.php on line 42
```

### Stage 2: Runtime Validation
```php
<?php
require_once '/wordpress/wp-load.php';
require_once '/tmp/widget-test.php';

$widget = new Widget_Class(); // Test instantiation
?>
```

**Catches**:
- Missing parent class methods
- Undefined functions/constants
- Type errors in constructor
- Namespace/import issues
- WordPress/Elementor API misuse

**Console Output**:
```
🧪 Testing widget instantiation...
📋 Runtime check result: PHP_RUNTIME_OK
```

**If Failed**:
```
❌ PHP RUNTIME ERROR IN WIDGET:
Fatal error: Call to undefined function esc_html() in /tmp/widget-test.php on line 42
```

## Common Error Scenarios

### Error 1: Orphaned PHP Tags
**Symptom**: Widget fails syntax check

**Example**:
```php
protected function render() {
    $settings = $this->get_settings_for_display();

<?php  // ❌ ERROR: Already in PHP mode!
    $heading = $settings['heading'];
```

**Fix**: Validator catches this automatically now. Generator should never create orphaned tags.

### Error 2: Missing Parent Methods
**Symptom**: Widget passes syntax but fails runtime check

**Error Message**:
```
Fatal error: Class Widget_Test must implement method get_name()
```

**Fix**: Ensure all required Elementor methods are present:
- `get_name()`
- `get_title()`
- `get_icon()`
- `get_categories()`
- `register_controls()`
- `render()`

### Error 3: Undefined Functions
**Symptom**: Widget passes syntax but fails runtime check

**Error Message**:
```
Fatal error: Call to undefined function some_custom_function()
```

**Fix**: Remove or define the missing function in the widget.

### Error 4: CSS Leaking to Editor
**Symptom**: Widget deploys successfully but breaks Elementor editor UI

**Root Cause**: Global CSS selectors like `body { ... }` or `html { ... }`

**Fix**: Automatic - CSS cleaner strips these selectors at generation time (see [quick-widget-css-scoping.md](quick-widget-css-scoping.md))

### Error 5: 500 Error After Deployment
**Symptom**: Widget passes all checks but causes 500 error when loading in Elementor

**Root Cause**: Runtime error during WordPress/Elementor initialization

**Debug Steps**:
1. Open browser console on **localhost:3000** (not WordPress iframe)
2. Generate a new Quick Widget
3. Watch for error messages:
   ```
   🔍 Checking PHP syntax...
   📋 Syntax check result: PHP_SYNTAX_ERROR: ...
   ```
4. If both checks pass but 500 error occurs, check WordPress error log

## Debugging Workflow

### Step 1: Check Main App Console
Open **localhost:3000** (NOT the WordPress iframe) and look for:

```
🔍 Checking PHP syntax...
📋 Syntax check result: [result]

🧪 Testing widget instantiation...
📋 Runtime check result: [result]
```

### Step 2: Identify Error Stage
**If Syntax Check Fails**:
- Problem: Invalid PHP syntax
- Location: The error message shows line number
- Fix: Update generator to produce valid PHP

**If Runtime Check Fails**:
- Problem: PHP fatal error at runtime
- Location: Error shows file and line number
- Fix: Check for missing functions, undefined methods, etc.

**If Both Pass But 500 Error Occurs**:
- Problem: Error during WordPress/Elementor initialization
- Next: Check WordPress debug log or add more logging

### Step 3: Review Generated Widget
Look at the PHP code in the modal before deploying:

**Check for**:
- ✅ Class extends `\Elementor\Widget_Base`
- ✅ All required methods present
- ✅ No orphaned `<?php` tags
- ✅ HTML sections properly closed with `?>`
- ✅ No global CSS selectors (`body`, `html`)
- ✅ Control names are alphanumeric + underscore only

### Step 4: Test Widget Manually
If errors persist:

1. Copy the generated PHP code
2. Save to `/wordpress/wp-content/plugins/test-widget/test-widget.php`
3. Create main plugin file:
   ```php
   <?php
   /**
    * Plugin Name: Test Widget
    */
   require_once __DIR__ . '/test-widget.php';
   add_action('elementor/widgets/register', function($manager) {
       $manager->register(new Test_Widget());
   });
   ```
4. Activate plugin in WordPress
5. Check WordPress debug log for errors

## Error Prevention

### Generator Best Practices
1. **Use Template-Based Generation**: Proven templates reduce errors
2. **Validate Before Returning**: Run both syntax and runtime checks
3. **Strip Dangerous CSS**: Remove `body`/`html` selectors automatically
4. **Test Control Names**: Ensure alphanumeric + underscore only
5. **Check PHP Mode**: Track when in PHP vs HTML mode

### TypeScript Validation
[php-syntax-validator.ts](../src/lib/php-syntax-validator.ts) catches many issues before deployment:

```typescript
const validation = validatePhpWidget(phpCode);

if (!validation.valid) {
  throw new Error(formatValidationResult(validation));
}
```

**Checks**:
- Orphaned PHP tags
- HTML document structure (DOCTYPE, html, head, body)
- PHP mode transitions
- Unescaped output (warnings)
- Dangerous CSS selectors (warnings)
- Invalid control names
- Balanced quotes
- Required class structure

### PHP Runtime Checks
[playground.js](../public/playground.js) tests widget loading:

```javascript
// Test widget instantiation
const runtimeCheck = await playgroundClient.run({ code: runtimeCheckCode });

if (runtimeCheck.text.includes('PHP_RUNTIME_ERROR')) {
  throw new Error(`Widget has runtime errors: ${errorMsg}`);
}
```

## Console Output Reference

### Successful Generation
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_OK

🧪 Testing widget instantiation...
📋 Runtime check result: PHP_RUNTIME_OK

📁 Created plugin directory: /wordpress/wp-content/plugins/elementor-test-widget
✅ Widget files written

🔌 Activation result: SUCCESS: Widget activated
🔄 Cache refresh result: SUCCESS: Elementor cache cleared and regenerated
```

### Syntax Error
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_ERROR:
Parse error: syntax error, unexpected '}' in /tmp/widget-check.php on line 42

❌ PHP SYNTAX ERROR IN WIDGET:
Parse error: syntax error, unexpected '}' in /tmp/widget-check.php on line 42

Error: Widget has PHP syntax errors:

Parse error: syntax error, unexpected '}' in /tmp/widget-check.php on line 42

Fix these errors and try again.
```

### Runtime Error
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_OK

🧪 Testing widget instantiation...
📋 Runtime check result: PHP_RUNTIME_ERROR:
Call to undefined function esc_html() in /tmp/widget-test.php on line 42

❌ PHP RUNTIME ERROR IN WIDGET:
Call to undefined function esc_html() in /tmp/widget-test.php on line 42

Error: Widget has runtime errors:

Call to undefined function esc_html() in /tmp/widget-test.php on line 42

Fix these errors and try again.
```

### 500 Error (After Deployment)
```
// In WordPress console (playground iframe):
POST https://playground.wordpress.net/.../admin-ajax.php 500 (Internal Server Error)

// This means:
// - Both checks passed
// - Widget deployed successfully
// - Error occurred during WordPress/Elementor initialization
// - Need to check WordPress debug log
```

## Troubleshooting Tips

### "Widget passes all checks but still breaks Elementor"
**Possible causes**:
1. CSS with global selectors (should be stripped automatically)
2. JavaScript errors in widget.js
3. Conflicting widget name/slug with existing widget
4. WordPress/Elementor API version mismatch

**Debug**:
- Check browser console for JavaScript errors
- Check Network tab for 500 errors
- Test widget on empty page first
- Try different widget name/slug

### "Can't see error messages in console"
**Solution**:
- Open console on **localhost:3000** (main app), NOT WordPress iframe
- Look for messages starting with 🔍, 🧪, ❌
- If no messages appear, dev server might need restart

### "Error shows wrong line number"
**Explanation**:
- Line numbers are from `/tmp/widget-test.php` (temporary file)
- Count lines in your widget PHP to find actual location
- Look for context clues in error message

### "Widget works in playground but not on real WordPress"
**Possible causes**:
1. Missing WordPress plugins (playground has Elementor, your site might not)
2. PHP version differences
3. WordPress version differences
4. Plugin conflicts on real site

**Solution**:
- Ensure Elementor is installed and active
- Check PHP version compatibility (7.4+)
- Test on clean WordPress install first

## Related Documentation

- [Quick Widget Validation](quick-widget-validation.md) - Comprehensive validation system overview
- [Quick Widget CSS Scoping](quick-widget-css-scoping.md) - CSS leaking prevention
- [Quick Widget Guide](quick-widget-guide.md) - General usage guide
- [PHP Syntax Validator Tests](../src/lib/__tests__/php-syntax-validator.test.ts) - Test cases for known errors

## Getting Help

If you encounter errors not covered here:

1. **Check console output** - Look for 🔍 and 🧪 messages
2. **Review generated PHP** - Check for obvious issues
3. **Run unit tests** - `npm test -- php-syntax-validator`
4. **Check error logs** - WordPress debug.log or browser console
5. **Report issue** - Include console output and generated widget PHP
