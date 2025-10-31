# Quick Widget CSS Scoping

## Critical Issue: CSS Leaking to Elementor Editor

### The Problem

When converting full-page designs (like landing pages) to Elementor widgets, CSS that targets global selectors can **break the entire Elementor editor**.

**Example of Dangerous CSS:**
```css
body, html {
  min-width: 100%;
  min-height: 100vh;
  margin: 0;
  font-family: AdiHaus;
}

body {
  display: flex;
  background: url('https://assets.codepen.io/6060109/waves.png');
  background-size: cover;
}
```

### What Happens

When this CSS is included in a widget:
1. ❌ **Background leaks** - Editor gets the background image
2. ❌ **Layout breaks** - `display: flex` on body breaks editor UI
3. ❌ **Infinite loops** - Widget selector becomes unusable
4. ❌ **UI freezes** - Can't click, drag, or edit anything
5. ❌ **Editor unresponsive** - Have to reload the page

### The Root Cause

Widgets output CSS in `<style>` tags that apply to the **entire page**, not just the widget. Global selectors like `body` and `html` affect:
- The Elementor editor UI
- The widget selector panel
- The page structure panel
- All other widgets on the page

## Automatic Protection

Quick Widget **automatically strips** dangerous selectors:

### Before (Dangerous):
```php
$custom_css = $settings['custom_css'];
?>
<style>
    body, html { min-height: 100vh; }
    body { display: flex; background: url(...); }
</style>
```

### After (Safe):
```php
$custom_css = str_replace('selector', '{{WRAPPER}}', $settings['custom_css']);
$custom_css = str_replace('{{WRAPPER}}', '.elementor-element-' . $this->get_id(), $custom_css);

// Strip dangerous global selectors
$custom_css = preg_replace('/\\bbody\\s*,?\\s*/i', '', $custom_css);
$custom_css = preg_replace('/\\bhtml\\s*,?\\s*/i', '', $custom_css);
$custom_css = preg_replace('/^\\s*,/m', '', $custom_css);
?>
<style>
    <?php echo $custom_css; ?>
</style>
```

### Transformation Example:

**Input CSS:**
```css
body, html {
  margin: 0;
  padding: 0;
}

body {
  display: flex;
  background: #000;
}

.all-container {
  width: 100%;
}
```

**Output CSS (after stripping):**
```css
{
  margin: 0;
  padding: 0;
}

{
  display: flex;
  background: #000;
}

.all-container {
  width: 100%;
}
```

The `body` and `html` selectors are removed, leaving empty rules or converting them to widget-scoped rules.

## Validation Warnings

The validator will warn you when dangerous selectors are detected:

```
⚠️  Found 1 warning(s):

1. [BEST-PRACTICE] Custom CSS contains global 'body' or 'html' selectors.
   These will be automatically removed to prevent breaking the Elementor editor.
   Scope your CSS to the widget using class selectors instead.
```

## Best Practices

### ❌ DON'T Use Global Selectors

```css
/* BAD - Affects entire page */
body {
  font-family: Arial;
}

html {
  font-size: 16px;
}

* {
  box-sizing: border-box;
}
```

### ✅ DO Use Class Selectors

```css
/* GOOD - Scoped to widget */
.my-widget-wrapper {
  font-family: Arial;
  font-size: 16px;
}

.my-widget-wrapper * {
  box-sizing: border-box;
}
```

### ✅ DO Use the Widget Wrapper

```css
/* GOOD - Use selector placeholder */
selector {
  min-height: 100vh;
  background: url(...);
}

selector .content {
  display: flex;
}
```

The `selector` placeholder gets replaced with `.elementor-element-{ID}` automatically.

## Converting Full-Page Designs

When converting landing pages or full-page designs:

### 1. **Wrap Everything in a Container**

**Before:**
```html
<body>
  <h1>Hello World</h1>
</body>
```

**After:**
```html
<div class="landing-page-wrapper">
  <h1>Hello World</h1>
</div>
```

### 2. **Replace body/html with Container Class**

**Before:**
```css
body {
  min-height: 100vh;
  display: flex;
}
```

**After:**
```css
.landing-page-wrapper {
  min-height: 100vh;
  display: flex;
}
```

### 3. **Use Elementor Section Settings**

Instead of CSS for full-width/height, use Elementor's section settings:
- **Content Width**: Full Width (100%)
- **Height**: Min Height + 100vh
- **Column Position**: Middle (for vertical centering)

## @font-face and Global Styles

Some CSS is legitimately global (like fonts):

### @font-face is OK

```css
/* This is fine - fonts are global by design */
@font-face {
  font-family: 'MyFont';
  src: url('font.ttf') format('truetype');
}
```

Font faces are **not stripped** - they need to be global to work.

### Media Queries are OK

```css
/* This is fine - media queries need to be top-level */
@media (min-width: 768px) {
  .my-widget {
    display: flex;
  }
}
```

## Debugging CSS Issues

### Symptom 1: Editor Background Changes

**Cause:** `body { background: ... }` in widget CSS

**Fix:** Change to `.widget-wrapper { background: ... }`

### Symptom 2: Layout Breaks (Can't Click)

**Cause:** `body { display: flex; }` or `body { position: ... }`

**Fix:** Move layout CSS to widget container

### Symptom 3: Font Changes in Editor

**Cause:** `body { font-family: ... }` or `* { font-family: ... }`

**Fix:** Scope fonts to widget: `.widget { font-family: ... }`

### Symptom 4: Infinite Loop / Widget Selector Frozen

**Cause:** Multiple global selectors breaking editor JavaScript

**Fix:** Regenerate widget with latest Quick Widget (auto-strips globals)

## Manual Cleanup

If you have an existing widget with leaking CSS:

1. **Go to Widget's Advanced Tab** → Custom Code
2. **Find the Custom CSS field**
3. **Remove or replace** `body` and `html` selectors:
   ```css
   /* Replace this */
   body, html { margin: 0; }

   /* With this */
   selector { margin: 0; }
   ```
4. **Save and re-test** in Elementor editor

## Related Files

- **Stripper Logic**: `/src/lib/programmatic-widget-converter.ts` (lines 544-548)
- **Validator**: `/src/lib/php-syntax-validator.ts` (`checkDangerousCss` function)
- **Documentation**: `/docs/quick-widget-validation.md`

## See Also

- [Quick Widget Validation System](/docs/quick-widget-validation.md)
- [Elementor Widget Best Practices](/docs/elementor-widget-best-practices.md)
- [CSS Scoping in Web Components](https://developer.mozilla.org/en-US/docs/Web/CSS/:host)
