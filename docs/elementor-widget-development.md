# Elementor Widget Development Guide

## Overview

This document explains Elementor's widget development capabilities, our existing converter tools, and how they work together.

---

## Table of Contents

- [Official Elementor Widget Development](#official-elementor-widget-development)
- [Our Converter Tools](#our-converter-tools)
- [Level of Customization](#level-of-customization)
- [Comparison: Official API vs Our Tools](#comparison-official-api-vs-our-tools)
- [Recommended Workflows](#recommended-workflows)

---

## Official Elementor Widget Development

### What It Is

The **Elementor Developer API** allows you to create custom widgets using PHP, JavaScript, and CSS within a WordPress plugin. This is the official, recommended way to create complex, reusable widgets.

**Documentation:** https://developers.elementor.com/docs/widgets/

### Programming Requirements

**Required Knowledge:**
- **PHP** - Widget registration, controls, server-side rendering
- **JavaScript** - Frontend behavior, dynamic interactions
- **CSS** - Styling and animations (optional but recommended)
- **WordPress Plugin Development** - Understanding hooks, filters, and plugin structure

### Main Steps to Create a Widget

1. **Establish Widget Structure**
   - Create a PHP class extending `\Elementor\Widget_Base`
   - Define widget name, title, icon, and categories

2. **Define Widget Data**
   - Set widget metadata (name, title, description)
   - Specify which categories it belongs to

3. **Set Up Dependencies**
   - Enqueue scripts and styles
   - Define external library dependencies

4. **Configure Controls**
   - Add input fields for end-user customization
   - Create sections and tabs in the editor panel
   - Define control types (text, color, slider, repeater, etc.)

5. **Handle Rendering**
   - Implement `render()` method for frontend output
   - Implement `content_template()` for live editor preview
   - Support inline editing and dynamic tags

### Widget Registration Process

```php
// Register widget
add_action('elementor/widgets/register', function($widgets_manager) {
    $widgets_manager->register(new My_Custom_Widget());
});

// Unregister existing widget
add_action('elementor/widgets/register', function($widgets_manager) {
    $widgets_manager->unregister('widget-name');
});
```

### Level of Customization

**Complete Control Over:**
- Widget appearance and structure
- Custom controls (input fields) for end-user data entry
- Frontend rendering (HTML output)
- Backend editor preview
- JavaScript behavior and interactions
- CSS styling and animations
- Repeater fields for dynamic content
- Inline editing capabilities
- Output caching and DOM optimization
- Responsive controls (desktop/tablet/mobile)
- Dynamic tags integration
- Template conditions

**Available Control Types:**
- Text, Textarea, Rich Text (WYSIWYG)
- Number, Slider, Color Picker
- Image Chooser, Gallery, Media Upload
- Select, Choose (radio/checkbox)
- URL, Code Editor
- Repeater (nested fields)
- Switcher (toggle)
- Date/Time Picker
- Dimensions (margin, padding)
- Typography, Border, Box Shadow
- Background (color, image, gradient)
- And many more...

### Example Widget Structure

```php
<?php
class My_Custom_Widget extends \Elementor\Widget_Base {

    // Widget name
    public function get_name() {
        return 'my-custom-widget';
    }

    // Widget title (shown in editor)
    public function get_title() {
        return __('My Custom Widget', 'plugin-name');
    }

    // Widget icon
    public function get_icon() {
        return 'eicon-code';
    }

    // Categories
    public function get_categories() {
        return ['general'];
    }

    // Register controls
    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'plugin-name'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'title',
            [
                'label' => __('Title', 'plugin-name'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Default Title', 'plugin-name'),
            ]
        );

        $this->end_controls_section();
    }

    // Frontend rendering
    protected function render() {
        $settings = $this->get_settings_for_display();
        echo '<h2>' . $settings['title'] . '</h2>';
    }

    // Editor preview
    protected function content_template() {
        ?>
        <h2>{{{ settings.title }}}</h2>
        <?php
    }
}
```

---

## Our Converter Tools

### Do We Still Have Them? **YES!**

We have **8 different converter tools and components** actively maintained in the codebase. Here's the complete inventory:

### 1. HTML to Elementor Converter (Main Converter)

**File:** `/src/lib/elementor/html-converter.js`

**What It Does:**
- Converts HTML/CSS/JavaScript into Elementor JSON format
- Uses AI (OpenAI Assistant API) with vector store for widget validation
- 5-step conversion pipeline:
  1. **Extract Styles** - Computes styles from rendered HTML
  2. **Convert to JSON** - AI-powered conversion to Elementor format
  3. **Post-Process** - Enforces Elementor structure requirements
  4. **Validate** - Checks for errors and required fields
  5. **Return Results** - Complete validation report

**Key Features:**
- Extracts 30+ computed CSS properties
- RGB to Hex color conversion
- Automatic widget type validation
- ID generation for all elements
- Recursive element processing

**Input:**
```javascript
{
  html: "<div>...</div>",
  css: "...",
  js: "...",
  images: ["url1", "url2"]
}
```

**Output:**
```json
{
  "elements": [
    {
      "id": "abc123",
      "elType": "widget",
      "widgetType": "heading",
      "settings": {
        "title": "Welcome",
        "title_color": "#000000",
        "typography_typography": "custom"
      }
    }
  ]
}
```

### 2. Section to Elementor Converter

**File:** `/src/lib/section-to-elementor.ts`

**What It Does:**
Converts our internal `Section` schema to Elementor widget format and vice versa.

**Functions:**
- `sectionToHtmlWidget()` - Single section → Elementor HTML widget
- `sectionsToHtmlWidgets()` - Multiple sections → widget array
- `sectionsToElementorContainer()` - Wrap sections in Elementor container
- `sectionsToElementorTemplate()` - Generate complete Elementor template JSON
- `generateSectionsPreviewHTML()` - Create HTML preview for iframes
- `validateElementorWidget()` - Validate widget structure
- `elementorWidgetToSection()` - **Reverse conversion** (Elementor → Section)

**Example Usage:**
```typescript
import { sectionToElementorTemplate } from '@/lib/section-to-elementor';

const section = {
  id: 'section-1',
  name: 'Hero Section',
  html: '<div class="hero">...</div>',
  css: '.hero { ... }',
  js: 'console.log("init")',
  settings: {
    padding: { top: 50, right: 20, bottom: 50, left: 20 },
    background: { type: 'color', color: '#ffffff' },
    animation: 'fadeIn'
  }
};

const template = sectionToElementorTemplate([section]);
// Ready to import into Elementor
```

### 3. Elementor AI Tools

**File:** `/src/lib/elementor-tools.ts`

**What It Does:**
Provides Vercel AI SDK tool definitions for chat-based Elementor operations.

**Available Tools:**
1. **generateJsonPatch** - Surgical JSON edits using RFC 6902 patches
2. **analyzeJsonStructure** - Analyze template structure, list widgets, search
3. **searchElementorDocs** - Vector store search for widget documentation
4. **openTemplateInPlayground** - Launch template in WordPress Playground
5. **capturePlaygroundScreenshot** - Capture preview screenshots
6. **convertHtmlToElementorJson** - Trigger converter from chat
7. **listAvailableTools** - Documentation of all tools

**Example (Chat):**
```
User: "Convert this HTML to Elementor JSON"
AI: *uses convertHtmlToElementorJson tool*
Result: Elementor JSON template
```

### 4. HTML Generator Component

**File:** `/src/components/elementor/HtmlGeneratorNew.tsx`

**What It Does:**
- UI for generating HTML/CSS/JS with AI
- Supports design mockup uploads (desktop/tablet/mobile)
- Live preview with responsive viewport switcher
- "Send to Converter" buttons to trigger conversion
- Code editor with syntax highlighting

**Features:**
- Prompt input for AI generation
- Model selection (GPT-4, Claude, etc.)
- Mockup upload (max 3 images)
- Responsive preview tabs
- One-click conversion to Elementor

### 5. HTML/CSS/JS Section Editor

**File:** `/src/components/elementor/HtmlSectionEditor.tsx`

**What It Does:**
- Monaco code editor for HTML, CSS, JavaScript
- Live preview with animation support
- Section save/library management
- WordPress Playground integration
- Settings panel (padding, margin, background, animation)

### 6. Section Schema & Utilities

**File:** `/src/lib/section-schema.ts`

**What It Does:**
TypeScript schema for internal Section format with utility functions:
- `sectionSettingsToCSS()` - Settings → inline CSS
- `getAnimationCSS()` - Generate animation keyframes
- `getAnimationClassName()` - Create animation class names
- `validateSection()` - Validate section structure

### 7. Tool Result Renderer

**File:** `/src/components/tool-ui/tool-result-renderer.tsx`

**What It Does:**
Renders AI tool execution results in the UI.

**Components:**
- `HTMLGeneratorWidget` - Displays HTML generator output
- `EditCodeWidget` - Shows diff-based code edits
- `UpdateSectionToolResult` - Renders section update results

### 8. Elementor Chat API

**File:** `/src/app/api/chat-elementor/route.ts`

**What It Does:**
Backend API endpoint for Elementor-specific chat with tool integration.

**Capabilities:**
- HTML generation from prompts
- Code editing (HTML/CSS/JS)
- Tab navigation
- Direct converter tool access

---

## Level of Customization

### Official Elementor API

**Pros:**
✅ **Full Control** - Complete customization of widget behavior
✅ **Native Integration** - Proper Elementor editor experience
✅ **Reusable** - Can be distributed as a plugin
✅ **Professional** - Recommended by Elementor for production
✅ **Dynamic Content** - Support for dynamic tags, templates, conditions
✅ **Performance** - Output caching, DOM optimization

**Cons:**
❌ **Requires Coding** - PHP, JS, CSS knowledge needed
❌ **Plugin Development** - Must create WordPress plugin
❌ **Learning Curve** - Understanding Elementor API
❌ **Time-Intensive** - Proper development takes time
❌ **Server-Side** - Requires WordPress environment

**Best For:**
- Complex, reusable widgets
- Professional plugin development
- Widgets with advanced logic
- Distribution to clients/marketplace

### Our Converter Tools

**Pros:**
✅ **No Coding Required** - Convert existing HTML/CSS/JS
✅ **Fast Prototyping** - Quick conversion from designs
✅ **AI-Powered** - Automatic style extraction and validation
✅ **Client-Side** - Works in browser, no server needed
✅ **Multiple Formats** - HTML widget or full template
✅ **Bidirectional** - Convert back and forth
✅ **Preview** - Live preview before importing

**Cons:**
❌ **HTML Widget Only** - Outputs custom HTML widget type
❌ **No Native Controls** - End users can't edit in Elementor panel
❌ **Static Output** - No dynamic tag support
❌ **Limited Reusability** - Each conversion is unique
❌ **AI Dependency** - Requires API keys for conversion

**Best For:**
- Converting existing HTML sections
- Quick prototyping and mockups
- One-off custom designs
- Learning Elementor structure
- Importing external templates

---

## Comparison: Official API vs Our Tools

| Feature | Official Elementor API | Our Converters |
|---------|------------------------|----------------|
| **Customization Level** | Complete | Limited to HTML widget |
| **Coding Required** | Yes (PHP/JS/CSS) | No |
| **Elementor Controls** | Full panel controls | Static HTML only |
| **Reusability** | Plugin distribution | Copy/paste JSON |
| **Dynamic Content** | Yes (tags, conditions) | No |
| **Learning Curve** | Steep | Minimal |
| **Time to Create** | Hours/Days | Minutes |
| **Production Ready** | Yes | For static sections |
| **Distribution** | Plugin/Marketplace | JSON export |

---

## Recommended Workflows

### Workflow 1: Prototype → Production

**Use Case:** Start with converter, upgrade to custom widget later

1. **Prototype with Converter**
   - Generate HTML/CSS/JS with AI or design tools
   - Use our HTML converter to create Elementor JSON
   - Preview in WordPress Playground
   - Iterate quickly with live edits

2. **Test in Real Environment**
   - Import JSON to actual WordPress site
   - Test across devices and browsers
   - Gather client feedback

3. **Upgrade to Custom Widget** (if needed)
   - Study generated JSON structure
   - Create proper PHP widget class
   - Add Elementor panel controls
   - Package as plugin for reusability

### Workflow 2: Simple Sections (Converter Only)

**Use Case:** One-off custom sections, landing pages, unique designs

1. **Design in Code**
   - Write HTML/CSS/JS manually or with AI
   - Use our Section Editor for live preview
   - Add animations and responsive styles

2. **Convert to Elementor**
   - Click "Send to Converter"
   - Review generated JSON
   - Validate structure

3. **Import & Deploy**
   - Save to Section Library
   - Import to WordPress Playground or live site
   - Publish immediately

### Workflow 3: Complex Widgets (API Only)

**Use Case:** Reusable components, client plugins, marketplace products

1. **Plan Widget Structure**
   - Define required controls
   - Sketch widget layout
   - List dependencies

2. **Develop Widget**
   - Create PHP class extending `Widget_Base`
   - Add controls with `register_controls()`
   - Implement `render()` and `content_template()`
   - Style with CSS

3. **Test & Package**
   - Test in Elementor editor
   - Test frontend rendering
   - Package as WordPress plugin
   - Distribute to clients/marketplace

### Workflow 4: Hybrid Approach

**Use Case:** Speed + Quality

1. **Generate Base with Converter**
   - Use AI to generate initial HTML/CSS
   - Convert to Elementor JSON
   - Study the structure Elementor expects

2. **Extract Reusable Parts**
   - Identify patterns that repeat
   - Note which widgets are used
   - Document style patterns

3. **Create Custom Widget**
   - Use converter output as reference
   - Build proper PHP widget
   - Add customization controls
   - Maintain same visual output

---

## Quick Start Examples

### Example 1: Convert Existing HTML with Our Tool

```javascript
// In Elementor Editor page
import { convertHtmlToElementorJson } from '@/lib/elementor/html-converter';

const html = `
  <div class="hero">
    <h1>Welcome to My Site</h1>
    <p>Beautiful design made easy</p>
    <button>Get Started</button>
  </div>
`;

const css = `
  .hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 100px 20px;
    text-align: center;
    color: white;
  }

  .hero h1 {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .hero button {
    background: white;
    color: #667eea;
    padding: 15px 30px;
    border-radius: 50px;
    font-weight: bold;
  }
`;

const result = await convertHtmlToElementorJson({ html, css });
console.log(result.json); // Ready to import
```

### Example 2: Create Simple Custom Widget (Official API)

```php
<?php
/**
 * Plugin Name: My Hero Widget
 * Description: Simple hero section widget
 */

class Hero_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'hero-widget';
    }

    public function get_title() {
        return 'Hero Section';
    }

    protected function register_controls() {
        // Content Section
        $this->start_controls_section('content', [
            'label' => 'Content',
        ]);

        $this->add_control('title', [
            'label' => 'Title',
            'type' => \Elementor\Controls_Manager::TEXT,
            'default' => 'Welcome',
        ]);

        $this->add_control('description', [
            'label' => 'Description',
            'type' => \Elementor\Controls_Manager::TEXTAREA,
            'default' => 'Beautiful design made easy',
        ]);

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section('style', [
            'label' => 'Style',
            'tab' => \Elementor\Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control('bg_color', [
            'label' => 'Background',
            'type' => \Elementor\Controls_Manager::COLOR,
            'default' => '#667eea',
        ]);

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="hero" style="background: <?php echo $settings['bg_color']; ?>">
            <h1><?php echo $settings['title']; ?></h1>
            <p><?php echo $settings['description']; ?></p>
        </div>
        <?php
    }
}

// Register widget
add_action('elementor/widgets/register', function($widgets_manager) {
    $widgets_manager->register(new Hero_Widget());
});
```

---

## Summary & Recommendations

### When to Use Our Converters

✅ Quick prototypes
✅ One-off custom sections
✅ Learning Elementor JSON structure
✅ Converting existing HTML designs
✅ Non-technical users
✅ Fast iteration needed

### When to Use Official API

✅ Reusable widgets
✅ Professional plugin development
✅ Advanced customization controls
✅ Dynamic content needs
✅ Marketplace distribution
✅ Long-term maintenance

### Best of Both Worlds

**Start with our converters** to prototype quickly, then **upgrade to custom widgets** when you need reusability and advanced controls. Use converter output as a learning tool to understand Elementor's JSON structure.

---

## Additional Resources

- **Elementor Developer Docs:** https://developers.elementor.com/
- **Widget Development Guide:** https://developers.elementor.com/docs/widgets/
- **Controls Reference:** https://developers.elementor.com/docs/controls/
- **Our Converter Docs:** `/docs/README.md` → Elementor Section Builder
- **Section Schema:** `/src/lib/section-schema.ts`
- **HTML Converter:** `/src/lib/elementor/html-converter.js`

---

**Last Updated:** 2025-01-24
**Maintained By:** Hustle Together LLC
