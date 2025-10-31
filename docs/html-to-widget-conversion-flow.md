# HTML to Widget Conversion Flow

## Overview

There are **TWO separate conversion systems** for turning HTML/CSS/JS into Elementor PHP widgets:

1. **Quick Widget** (Programmatic) - Fast, template-based, ~100ms
2. **AI Conversion** (AI-powered) - Slow, comprehensive, 3-5 minutes

---

## Quick Widget (Programmatic) Flow

**Entry Point**: "Quick Widget" button in Code Editor
**Location**: [HtmlSectionEditor.tsx:565](../src/components/elementor/HtmlSectionEditor.tsx#L565)

### Flow Diagram

```
User clicks "Quick Widget"
    ↓
handleQuickConvert()
    ↓
Step 1: Generate Metadata (AI - Fast)
    ├─→ /api/analyze-widget-metadata
    │   └─→ Claude Haiku 4.5 (~200ms)
    │       Input: { html, css, js }
    │       Output: { name, title, description, category, icon }
    ↓
Step 2: Parse HTML (Client-side)
    ├─→ parseHTML(html)
    │   └─→ DOMParser extracts element structure
    │       Output: ParsedElement[]
    ↓
Step 3: Generate PHP Widget (Client-side)
    ├─→ convertToWidgetProgrammatic()
    │   ├─→ Lookup control templates from JSON
    │   ├─→ Generate widget class structure
    │   ├─→ Generate register_controls() method
    │   ├─→ Generate render() method with dynamic HTML
    │   └─→ Validate PHP syntax
    │       Output: { widgetPhp, widgetCss, widgetJs, validation }
    ↓
Step 4: Show Deployment Modal
    └─→ User clicks "Deploy to WordPress"
        ↓
Step 5: Deploy to WordPress Playground
    └─→ window.deployElementorWidget()
        ├─→ PHP Syntax Check (php -l)
        ├─→ Runtime Check (instantiate widget class)
        ├─→ Create plugin directory
        ├─→ Write widget.php, widget.css, widget.js
        ├─→ Activate plugin
        └─→ Clear Elementor cache
```

### Step 1: Generate Metadata (AI)

**API Endpoint**: `/api/analyze-widget-metadata`
**File**: [src/app/api/analyze-widget-metadata/route.ts](../src/app/api/analyze-widget-metadata/route.ts)

**Input**:
```json
{
  "html": "<div class=\"hero\">...</div>",
  "css": ".hero { background: blue; }",
  "js": "console.log('hello');"
}
```

**AI Prompt** (Haiku 4.5):
```
You are analyzing HTML/CSS/JS to generate metadata for an Elementor widget.

HTML:
{html}

CSS:
{css}

JavaScript:
{js}

Generate metadata in this exact JSON format:
{
  "name": "snake_case_widget_name",
  "title": "Human Readable Title",
  "description": "Brief one-sentence description",
  "category": "marketing|layout|content|media|form",
  "icon": "eicon-[icon-name]"
}

Rules:
- name: lowercase, underscores only (e.g., "hero_section")
- title: 2-4 words (e.g., "Hero Section")
- description: One sentence under 100 chars
- category: Choose most relevant from list above
- icon: Use Elementor icon name (eicon-banner, eicon-section, etc.)
```

**Output**:
```json
{
  "name": "coming_soon_landing",
  "title": "Coming Soon Landing",
  "description": "A landing page component featuring a logo, headline, description text, and email subscription form for upcoming launches.",
  "category": "marketing",
  "icon": "eicon-banner"
}
```

**Cost**: ~$0.001 per widget (~200ms)

---

### Step 2: Parse HTML (Client-side)

**Function**: `parseHTML(html)`
**File**: [src/lib/programmatic-widget-converter.ts:37-82](../src/lib/programmatic-widget-converter.ts#L37-L82)

**Input**: HTML string
```html
<div class="hero">
  <h1 class="hero-title">Welcome</h1>
  <p class="hero-subtitle">Subtitle here</p>
  <button class="cta-button">Click Me</button>
</div>
```

**Process**:
1. Use browser `DOMParser` to parse HTML
2. Recursively walk DOM tree
3. Extract for each element:
   - Tag name (e.g., "h1")
   - Classes (e.g., ["hero-title"])
   - ID (if present)
   - Text content
   - Attributes (href, src, etc.)
   - Children (nested elements)
   - CSS selector (e.g., "h1.hero-title")

**Output**: `ParsedElement[]`
```json
[
  {
    "tag": "div",
    "classes": ["hero"],
    "id": undefined,
    "text": "Welcome Subtitle here Click Me",
    "attributes": {},
    "selector": "div.hero",
    "children": [
      {
        "tag": "h1",
        "classes": ["hero-title"],
        "text": "Welcome",
        "selector": "h1.hero-title",
        "children": []
      },
      {
        "tag": "p",
        "classes": ["hero-subtitle"],
        "text": "Subtitle here",
        "selector": "p.hero-subtitle",
        "children": []
      },
      {
        "tag": "button",
        "classes": ["cta-button"],
        "text": "Click Me",
        "selector": "button.cta-button",
        "children": []
      }
    ]
  }
]
```

---

### Step 3: Generate PHP Widget (Client-side)

**Function**: `convertToWidgetProgrammatic()`
**File**: [src/lib/programmatic-widget-converter.ts:212-311](../src/lib/programmatic-widget-converter.ts#L212-L311)

**Input**:
```typescript
{
  metadata: WidgetMetadata,
  html: string,
  css: string,
  js: string
}
```

**Process**:

#### 3.1: Parse Elements
```typescript
const elements = parseHTML(html);
```

#### 3.2: Generate Widget Class Header
```typescript
const className = metadata.name
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('_') + '_Widget';

// Example: "coming_soon_landing" → "Coming_Soon_Landing_Widget"
```

**Template**:
```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Coming_Soon_Landing_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'coming_soon_landing';
    }

    public function get_title() {
        return esc_html__( 'Coming Soon Landing', 'text-domain' );
    }

    public function get_icon() {
        return 'eicon-banner';
    }

    public function get_categories() {
        return [ 'hustle-tools' ];
    }
```

#### 3.3: Generate register_controls() Method

**Function**: `generateControlsCode(elements, css, js)`
**File**: [src/lib/programmatic-widget-converter.ts:152-210](../src/lib/programmatic-widget-converter.ts#L152-L210)

**Control Template Lookup**:
**File**: [src/lib/elementor-control-templates.json](../src/lib/elementor-control-templates.json)

For each element, looks up control template:

```json
{
  "elementControls": {
    "h1": {
      "content": ["TEXT", "TYPOGRAPHY", "COLOR"],
      "style": ["TEXT_SHADOW", "MARGIN", "PADDING"]
    },
    "button": {
      "content": ["TEXT", "URL"],
      "style": ["TYPOGRAPHY", "COLOR", "BG_COLOR", "BORDER", "PADDING"]
    }
  }
}
```

**Generated PHP**:
```php
protected function register_controls() {
    // Content Controls
    $this->start_controls_section(
        'content_section',
        [
            'label' => esc_html__( 'Content', 'text-domain' ),
            'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
        ]
    );

    $this->add_control(
        'hero_title',
        [
            'label' => esc_html__( 'Hero Title', 'text-domain' ),
            'type' => \Elementor\Controls_Manager::TEXT,
            'default' => 'Welcome',
            'description' => 'CSS Selector: h1.hero-title',
        ]
    );

    $this->add_control(
        'cta_text',
        [
            'label' => esc_html__( 'CTA Text', 'text-domain' ),
            'type' => \Elementor\Controls_Manager::TEXT,
            'default' => 'Click Me',
            'description' => 'CSS Selector: button.cta-button',
        ]
    );

    $this->end_controls_section();

    // Style Controls
    $this->start_controls_section(
        'style_section',
        [
            'label' => esc_html__( 'Style', 'text-domain' ),
            'tab' => \Elementor\Controls_Manager::TAB_STYLE,
        ]
    );

    $this->add_control(
        'hero_title_color',
        [
            'label' => esc_html__( 'Title Color', 'text-domain' ),
            'type' => \Elementor\Controls_Manager::COLOR,
            'selectors' => [
                '{{WRAPPER}} .hero-title' => 'color: {{VALUE}};',
            ],
        ]
    );

    $this->end_controls_section();

    // Custom CSS/JS
    $this->start_controls_section(
        'custom_css_section',
        [
            'label' => esc_html__( 'Custom CSS', 'text-domain' ),
            'tab' => \Elementor\Controls_Manager::TAB_ADVANCED,
        ]
    );

    $this->add_control(
        'custom_css',
        [
            'label' => esc_html__( 'Custom CSS', 'text-domain' ),
            'type' => \Elementor\Controls_Manager::CODE,
            'language' => 'css',
            'default' => '.hero { background: blue; }',
        ]
    );

    $this->end_controls_section();
}
```

#### 3.4: Generate render() Method

**Function**: `generateRenderMethod(html, elements)`
**File**: [src/lib/programmatic-widget-converter.ts:515-625](../src/lib/programmatic-widget-converter.ts#L515-L625)

**Process**:
1. Parse HTML into dynamic PHP
2. Replace static text with `<?php echo esc_html($settings['control_name']); ?>`
3. Preserve HTML structure exactly
4. Handle PHP mode transitions (`?>` and `<?php`)

**Input HTML**:
```html
<div class="hero">
  <h1 class="hero-title">Welcome</h1>
  <button class="cta-button">Click Me</button>
</div>
```

**Output PHP**:
```php
protected function render() {
    $settings = $this->get_settings_for_display();
    ?>
    <div class="hero">
        <h1 class="hero-title"><?php echo esc_html($settings['hero_title']); ?></h1>
        <button class="cta-button"><?php echo esc_html($settings['cta_text']); ?></button>
    </div>

    <?php
    // Custom CSS
    if (!empty($settings['custom_css'])) {
        $custom_css = str_replace('selector', '{{WRAPPER}}', $settings['custom_css']);
        $custom_css = str_replace('{{WRAPPER}}', '.elementor-element-' . $this->get_id(), $custom_css);
        ?>
        <style>
            <?php echo $custom_css; ?>
        </style>
        <?php
    }

    // Custom JavaScript
    if (!empty($settings['custom_js'])) {
        ?>
        <script>
            (function() {
                <?php echo $settings['custom_js']; ?>
            })();
        </script>
        <?php
    }
}
```

#### 3.5: Validate PHP Syntax

**Function**: `validatePhpWidget(widgetPhp)`
**File**: [src/lib/php-syntax-validator.ts](../src/lib/php-syntax-validator.ts)

**Checks**:
- ✅ No orphaned `<?php` tags
- ✅ No HTML document structure (DOCTYPE, html, head, body)
- ✅ PHP mode transitions correct
- ✅ Balanced quotes
- ✅ Required class methods present
- ⚠️ Dangerous CSS selectors (body, html)
- ⚠️ Unescaped output

**Output**:
```typescript
{
  valid: true,
  errors: [],
  warnings: [
    {
      type: 'best-practice',
      message: 'Custom CSS contains global body/html selectors. These will be stripped.'
    }
  ]
}
```

---

### Step 4: Deployment Modal

**Component**: Quick Widget Deployment Modal
**Triggers**: After successful conversion

**User sees**:
```
✅ Widget Generated Successfully!

Widget Name: Coming Soon Landing
Class: Coming_Soon_Landing_Widget

[View PHP] [View CSS] [View JS]

[Deploy to WordPress] [Download Files]
```

---

### Step 5: Deploy to WordPress Playground

**Function**: `window.deployElementorWidget()`
**File**: [public/playground.js:1995-2230](../public/playground.js#L1995-L2230)

**Input**:
```javascript
{
  widgetPhp: "<?php class Coming_Soon_Landing_Widget...",
  widgetCss: ".hero { background: blue; }",
  widgetJs: "console.log('hello');"
}
```

**Process**:

#### 5.1: Extract Widget Metadata
```javascript
const classMatch = widgetPhp.match(/class\s+(\w+)\s+extends/);
const widgetClassName = classMatch ? classMatch[1] : 'Elementor_Custom_Widget';

const nameMatch = widgetPhp.match(/return\s+['"]([\w-]+)['"]\s*;/);
const widgetSlug = nameMatch ? nameMatch[1] : 'custom_widget';
```

#### 5.2: PHP Syntax Check
```javascript
const syntaxCheckCode = `<?php
    $widget_code = <<<'PHPCODE'
${widgetPhp}
PHPCODE;

    $temp_file = '/tmp/widget-check.php';
    file_put_contents($temp_file, $widget_code);

    exec('php -l ' . $temp_file . ' 2>&1', $output, $return_code);

    if ($return_code !== 0) {
        echo 'PHP_SYNTAX_ERROR: ' . implode("\\n", $output);
    } else {
        echo 'PHP_SYNTAX_OK';
    }

    unlink($temp_file);
?>`;

const syntaxCheck = await playgroundClient.run({ code: syntaxCheckCode });
console.log('🔍 Checking PHP syntax...', syntaxCheck.text);

if (syntaxCheck.text.includes('PHP_SYNTAX_ERROR')) {
    throw new Error(`PHP syntax error: ${syntaxCheck.text}`);
}
```

**Console Output**:
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_OK
```

#### 5.3: Runtime Check (NEW)
```javascript
const runtimeCheckCode = `<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once '/wordpress/wp-load.php';

    $widget_code = <<<'PHPCODE'
${widgetPhp}
PHPCODE;

    $temp_file = '/tmp/widget-test.php';
    file_put_contents($temp_file, $widget_code);

    try {
        require_once $temp_file;

        $class_name = '${widgetClassName}';
        if (class_exists($class_name)) {
            $widget = new $class_name();
            echo 'PHP_RUNTIME_OK';
        } else {
            echo 'PHP_RUNTIME_ERROR: Class not found';
        }
    } catch (Throwable $e) {
        echo 'PHP_RUNTIME_ERROR: ' . $e->getMessage();
    }

    unlink($temp_file);
?>`;

const runtimeCheck = await playgroundClient.run({ code: runtimeCheckCode });
console.log('🧪 Testing widget instantiation...', runtimeCheck.text);

if (runtimeCheck.text.includes('PHP_RUNTIME_ERROR')) {
    throw new Error(`Runtime error: ${runtimeCheck.text}`);
}
```

**Console Output**:
```
🧪 Testing widget instantiation...
📋 Runtime check result: PHP_RUNTIME_OK
```

#### 5.4: Create Plugin Structure
```javascript
const pluginSlug = `elementor-${widgetSlug}`;
const pluginDir = `/wordpress/wp-content/plugins/${pluginSlug}`;

await playgroundClient.mkdir(pluginDir);

// Main plugin file
await playgroundClient.writeFile(
  `${pluginDir}/${pluginSlug}.php`,
  mainPluginFile
);

// Widget PHP
await playgroundClient.writeFile(
  `${pluginDir}/widget.php`,
  widgetPhp
);

// Widget CSS (if exists)
if (widgetCss && widgetCss.trim()) {
  await playgroundClient.writeFile(
    `${pluginDir}/widget.css`,
    widgetCss
  );
}

// Widget JS (if exists)
if (widgetJs && widgetJs.trim()) {
  await playgroundClient.writeFile(
    `${pluginDir}/widget.js`,
    widgetJs
  );
}
```

**File Structure**:
```
/wordpress/wp-content/plugins/
  elementor-coming-soon-landing/
    elementor-coming-soon-landing.php  (main plugin file)
    widget.php                          (widget class)
    widget.css                          (widget styles)
    widget.js                           (widget scripts)
```

#### 5.5: Main Plugin File Template
```php
<?php
/**
 * Plugin Name: Coming_Soon_Landing_Widget
 * Description: Custom Elementor widget
 * Version: 1.0.0
 * Requires Plugins: elementor
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Register custom widget category
function register_hustle_tools_category( $elements_manager ) {
    $elements_manager->add_category(
        'hustle-tools',
        [
            'title' => __( 'Hustle Tools', 'text-domain' ),
            'icon' => 'fa fa-plug',
        ]
    );
}
add_action( 'elementor/elements/categories_registered', 'register_hustle_tools_category' );

// Register the widget
function register_coming_soon_landing_widget( $widgets_manager ) {
    require_once( __DIR__ . '/widget.php' );
    $widgets_manager->register( new Coming_Soon_Landing_Widget() );
}
add_action( 'elementor/widgets/register', 'register_coming_soon_landing_widget' );

// Enqueue widget styles
function coming_soon_landing_enqueue_styles() {
    if ( file_exists( __DIR__ . '/widget.css' ) ) {
        wp_enqueue_style(
            'coming-soon-landing-style',
            plugins_url( 'widget.css', __FILE__ ),
            [],
            '1.0.0'
        );
    }
}
add_action( 'wp_enqueue_scripts', 'coming_soon_landing_enqueue_styles' );
add_action( 'elementor/editor/after_enqueue_styles', 'coming_soon_landing_enqueue_styles' );

// Enqueue widget scripts
function coming_soon_landing_enqueue_scripts() {
    if ( file_exists( __DIR__ . '/widget.js' ) ) {
        wp_enqueue_script(
            'coming-soon-landing-script',
            plugins_url( 'widget.js', __FILE__ ),
            [ 'jquery' ],
            '1.0.0',
            true
        );
    }
}
add_action( 'wp_enqueue_scripts', 'coming_soon_landing_enqueue_scripts' );
add_action( 'elementor/frontend/after_register_scripts', 'coming_soon_landing_enqueue_scripts' );
```

#### 5.6: Activate Plugin
```javascript
const activateCode = `<?php
    require_once '/wordpress/wp-load.php';
    require_once ABSPATH . 'wp-admin/includes/plugin.php';

    $plugin_file = '${pluginSlug}/${pluginSlug}.php';

    if ( !is_plugin_active( $plugin_file ) ) {
        $result = activate_plugin( $plugin_file );
        if ( is_wp_error( $result ) ) {
            echo 'ERROR: ' . $result->get_error_message();
        } else {
            echo 'SUCCESS: Widget activated';
        }
    } else {
        echo 'INFO: Widget already active';
    }
?>`;

const activateResult = await playgroundClient.run({ code: activateCode });
console.log('🔌 Activation result:', activateResult.text);
```

**Console Output**:
```
🔌 Activation result: SUCCESS: Widget activated
```

#### 5.7: Clear Elementor Cache
```javascript
const refreshCode = `<?php
    require_once '/wordpress/wp-load.php';

    if ( class_exists( '\\Elementor\\Plugin' ) ) {
        \\Elementor\\Plugin::instance()->files_manager->clear_cache();

        if ( method_exists( \\Elementor\\Plugin::instance()->files_manager, 'regenerate_all_files' ) ) {
            \\Elementor\\Plugin::instance()->files_manager->regenerate_all_files();
        }

        delete_transient( 'elementor_remote_info_api_data_' . ELEMENTOR_VERSION );
        wp_cache_flush();

        echo 'SUCCESS: Elementor cache cleared';
    } else {
        echo 'ERROR: Elementor not loaded';
    }
?>`;

const refreshResult = await playgroundClient.run({ code: refreshCode });
console.log('🔄 Cache refresh result:', refreshResult.text);
```

**Console Output**:
```
🔄 Cache refresh result: SUCCESS: Elementor cache cleared
```

#### 5.8: Success
```javascript
return {
  success: true,
  message: 'Widget deployed successfully',
  widgetClassName: widgetClassName,
  widgetSlug: widgetSlug,
  pluginPath: `${pluginDir}/${pluginSlug}.php`
};
```

**User Alert**:
```
✅ SUCCESS: Widget deployed successfully

Next steps:
1. Go to the WordPress Playground tab
2. Navigate to an Elementor page
3. Find your widget "Coming_Soon_Landing_Widget" in the Hustle Tools category
4. Drag it onto the page!
```

---

## AI Conversion (Comprehensive) Flow

**Entry Point**: "Generate Widget" button in Code Editor (three-dot menu)
**Location**: [HtmlSectionEditor.tsx:582-586](../src/components/elementor/HtmlSectionEditor.tsx#L582-L586)

### Flow Diagram

```
User clicks "Generate Widget"
    ↓
handleConvertToWidget()
    ↓
Confirm dialog (shows token estimate)
    ↓
POST /api/convert-html-to-widget
    ↓
Step 1: Programmatic HTML Parsing
    ├─→ parseHTMLStructure(html)
    │   └─→ Regex-based extraction
    │       Output: ParsedElement[] with requiredControls
    ↓
Step 2: AI Enhancement (Sonnet 4.5)
    ├─→ streamText with enhancement prompt
    │   Input: parsedElements + html + css + js
    │   Output: Complete PHP widget (streaming)
    ↓
Step 3: Stream to Editor
    └─→ Display PHP code in editor
        (NO automatic validation or deployment)
```

### Step 1: Programmatic HTML Parsing

**Function**: `parseHTMLStructure(html)`
**File**: [src/app/api/convert-html-to-widget/route.ts:21-83](../src/app/api/convert-html-to-widget/route.ts#L21-L83)

**Method**: Regex-based parsing (NOT DOMParser)

**Patterns**:
```typescript
const patterns = {
  heading: /<(h[1-6])[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/\1>/gi,
  paragraph: /<p[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/p>/gi,
  button: /<button[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/button>/gi,
  link: /<a[^>]*class=["']([^"']*)["'][^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
  image: /<img[^>]*class=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*\/?>/gi,
  // ... more patterns
};
```

**Control Map**:
```typescript
const controlMap: Record<string, string[]> = {
  h1: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING'],
  button: ['TEXT', 'URL', 'TYPOGRAPHY', 'COLOR', 'HOVER_COLOR', 'BG_COLOR', 'HOVER_BG', 'BORDER', 'BORDER_RADIUS', 'BOX_SHADOW', 'PADDING'],
  img: ['MEDIA', 'ALT', 'WIDTH', 'HEIGHT', 'OBJECT_FIT', 'BORDER', 'BORDER_RADIUS', 'BOX_SHADOW', 'CSS_FILTERS'],
  // ... more mappings
};
```

**Output**:
```json
[
  {
    "type": "h1",
    "classes": "hero-title",
    "id": "",
    "text": "Welcome",
    "controlsNeeded": ["TEXT", "TYPOGRAPHY", "COLOR", "TEXT_SHADOW", "MARGIN", "PADDING"]
  },
  {
    "type": "button",
    "classes": "cta-button",
    "text": "Click Me",
    "controlsNeeded": ["TEXT", "URL", "TYPOGRAPHY", "COLOR", "HOVER_COLOR", "BG_COLOR", "HOVER_BG", "BORDER", "BORDER_RADIUS", "BOX_SHADOW", "PADDING"]
  }
]
```

### Step 2: AI Enhancement Prompt

**Model**: Claude Sonnet 4.5 (anthropic/claude-sonnet-4-5-20250929)
**Temperature**: 0.7
**Streaming**: Yes

**Full Prompt**:
```
You are an expert Elementor widget developer. I have programmatically parsed an HTML structure and identified all elements that need controls.

**YOUR TASK:** Generate a complete, production-ready Elementor widget PHP class that includes comprehensive controls for EVERY element identified.

**PARSED ELEMENTS:**
[
  {
    "type": "h1",
    "classes": "hero-title",
    "id": "",
    "text": "Welcome",
    "controlsNeeded": ["TEXT", "TYPOGRAPHY", "COLOR", "TEXT_SHADOW", "MARGIN", "PADDING"]
  },
  {
    "type": "button",
    "classes": "cta-button",
    "text": "Click Me",
    "controlsNeeded": ["TEXT", "URL", "TYPOGRAPHY", "COLOR", "HOVER_COLOR", "BG_COLOR", "HOVER_BG", "BORDER", "BORDER_RADIUS", "BOX_SHADOW", "PADDING"]
  }
]

**ORIGINAL HTML:**
```html
<div class="hero">
  <h1 class="hero-title">Welcome</h1>
  <button class="cta-button">Click Me</button>
</div>
```

**ORIGINAL CSS:**
```css
.hero { background: blue; }
.hero-title { font-size: 48px; }
.cta-button { padding: 16px 32px; }
```

**ORIGINAL JAVASCRIPT:**
```javascript
console.log('hero loaded');
```

**DESCRIPTION:** Convert this HTML section to an Elementor widget

**CRITICAL REQUIREMENTS:**

1. **GUARANTEE ALL CONTROLS**: For each element in the parsed list, you MUST create ALL the controls specified in "controlsNeeded"

2. **PRESERVE STRUCTURE**: The render() method must output HTML that matches the original structure exactly

3. **PRESERVE STYLING**: Include the original CSS in widget.css (will be handled separately, but reference it in your plan)

4. **ORGANIZE INTELLIGENTLY**: Group related controls into logical sections:
   - Content Tab: Text content, images, links, media
   - Style Tab: Typography, colors, backgrounds, borders, shadows, spacing
   - Advanced Tab: Custom CSS, Custom JS, animations, visibility

5. **ELEMENT CLASS/ID DISPLAY**: In every control description, show the CSS selector:
   `'description' => 'CSS Selector: .class-name | ID: #element-id'`

6. **CUSTOM CSS/JS BOXES**: Include Custom CSS and Custom JavaScript code boxes in Advanced tab

7. **WIDGET CATEGORY**: Use category ['hustle-tools'] to group all widgets together

8. **SEMANTIC NAMING**: Use intelligent control names based on context (e.g., "hero_title" not "text_1")

9. **RESPONSIVE CONTROLS**: Use add_responsive_control() for spacing, typography where appropriate

10. **NO SHORTCUTS**: Do not skip ANY element. Every element must have corresponding controls.

**OUTPUT:** Generate the complete PHP widget class. Start with <?php and include the full implementation.
```

**Cost**: ~$0.05-0.15 per widget (depends on complexity)
**Time**: 10-45 seconds (streaming)

### Step 3: Stream to Editor

**Output**: PHP code streamed directly to PHP editor tab

**Differences from Quick Widget**:
- ❌ NO automatic validation
- ❌ NO automatic deployment modal
- ✅ User must manually deploy via "🚀 Deploy to WordPress" button
- ✅ Full control over generated PHP before deployment

---

## Key Differences: Quick Widget vs AI Conversion

| Feature | Quick Widget | AI Conversion |
|---------|--------------|---------------|
| **Speed** | ~100ms (+ 200ms for metadata) | 10-45 seconds |
| **Cost** | ~$0.001 | ~$0.05-0.15 |
| **Method** | Template-based | AI-generated |
| **Controls** | Basic (from templates) | Comprehensive (all types) |
| **Organization** | Generic sections | Intelligent grouping |
| **Validation** | Automatic | Manual |
| **Deployment** | Automatic modal | Manual button |
| **Best For** | Simple sections, rapid prototyping | Complex widgets, production use |

---

## Files Reference

### Quick Widget System
- [programmatic-widget-converter.ts](../src/lib/programmatic-widget-converter.ts) - Main converter
- [elementor-control-templates.json](../src/lib/elementor-control-templates.json) - Control templates
- [php-syntax-validator.ts](../src/lib/php-syntax-validator.ts) - PHP validation
- [analyze-widget-metadata/route.ts](../src/app/api/analyze-widget-metadata/route.ts) - Metadata API
- [playground.js:deployElementorWidget](../public/playground.js#L1995) - Deployment function

### AI Conversion System
- [convert-html-to-widget/route.ts](../src/app/api/convert-html-to-widget/route.ts) - Conversion API
- [HtmlSectionEditor.tsx:handleConvertToWidget](../src/components/elementor/HtmlSectionEditor.tsx#L118) - UI handler

### Shared Components
- [HtmlSectionEditor.tsx](../src/components/elementor/HtmlSectionEditor.tsx) - Main editor UI
- [playground.js](../public/playground.js) - WordPress Playground integration

---

## Console Output Examples

### Successful Quick Widget Deployment
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_OK

🧪 Testing widget instantiation...
📋 Runtime check result: PHP_RUNTIME_OK

📁 Created plugin directory: /wordpress/wp-content/plugins/elementor-coming-soon-landing
✅ Widget files written

🔌 Activation result: SUCCESS: Widget activated
🔄 Cache refresh result: SUCCESS: Elementor cache cleared
```

### Failed Deployment (Syntax Error)
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_ERROR:
Parse error: syntax error, unexpected '}' in /tmp/widget-check.php on line 42

❌ PHP SYNTAX ERROR IN WIDGET:
Parse error: syntax error, unexpected '}' in /tmp/widget-check.php on line 42
```

### Failed Deployment (Runtime Error)
```
🔍 Checking PHP syntax...
📋 Syntax check result: PHP_SYNTAX_OK

🧪 Testing widget instantiation...
📋 Runtime check result: PHP_RUNTIME_ERROR:
Call to undefined function esc_html() in /tmp/widget-test.php on line 42

❌ PHP RUNTIME ERROR IN WIDGET:
Call to undefined function esc_html() in /tmp/widget-test.php on line 42
```

---

## Related Documentation

- [Quick Widget Validation](quick-widget-validation.md) - Validation system details
- [Quick Widget Error Debugging](quick-widget-error-debugging.md) - Debugging guide
- [Quick Widget CSS Scoping](quick-widget-css-scoping.md) - CSS leaking prevention
- [Programmatic Widget Converter](programmatic-widget-converter.md) - Converter architecture
