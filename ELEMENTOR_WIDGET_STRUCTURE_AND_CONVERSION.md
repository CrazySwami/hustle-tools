# Elementor Widget Structure & Conversion Guide

## Overview
This document explains how Elementor PHP widgets work and how to convert HTML/CSS/JS into Elementor widgets programmatically.

---

## Elementor Widget Structure

### Yes, it's essentially HTML + CSS + JS wrapped in PHP!

An Elementor widget is a **PHP class** that:
1. **Defines controls** (settings users can adjust in the Elementor editor)
2. **Renders HTML output** using those control values
3. **Embeds CSS and JS** inline or as separate controls

### The Anatomy of an Elementor Widget

```php
<?php
class My_Widget extends \Elementor\Widget_Base {

    // 1. METADATA (Widget Info)
    public function get_name() { return 'my_widget'; }
    public function get_title() { return 'My Widget'; }
    public function get_icon() { return 'eicon-text'; }
    public function get_categories() { return ['general']; }

    // 2. CONTROLS (Elementor Editor Settings)
    protected function register_controls() {
        // Content Tab
        $this->start_controls_section('content', [...]);
        $this->add_control('text', ['type' => 'TEXT', ...]);
        $this->add_control('color', ['type' => 'COLOR', ...]);
        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section('style', ['tab' => TAB_STYLE]);
        $this->add_control('font_size', ['type' => 'SLIDER', ...]);
        $this->end_controls_section();

        // Advanced Tab
        $this->start_controls_section('advanced', ['tab' => TAB_ADVANCED]);
        $this->add_control('custom_css', ['type' => 'CODE', ...]);
        $this->add_control('custom_js', ['type' => 'CODE', ...]);
        $this->end_controls_section();
    }

    // 3. RENDER (Output HTML/CSS/JS)
    protected function render() {
        $settings = $this->get_settings_for_display();

        // HTML Output
        ?>
        <div class="my-widget">
            <h2 style="color: <?php echo $settings['color']; ?>">
                <?php echo $settings['text']; ?>
            </h2>
        </div>

        <?php
        // CSS Output (if custom CSS provided)
        if (!empty($settings['custom_css'])) { ?>
            <style>
                <?php echo $settings['custom_css']; ?>
            </style>
        <?php }

        // JS Output (if custom JS provided)
        if (!empty($settings['custom_js'])) { ?>
            <script>
                (function($) {
                    $(document).ready(function() {
                        <?php echo $settings['custom_js']; ?>
                    });
                })(jQuery);
            </script>
        <?php }
    }
}
```

---

## Key Concepts

### 1. Controls = User-Editable Settings

Controls are what appear in the **Elementor editor sidebar**. They let users customize the widget without touching code.

**Common Control Types:**
- `TEXT` - Text input
- `TEXTAREA` - Multiline text
- `WYSIWYG` - Rich text editor
- `NUMBER` - Number input
- `SLIDER` - Range slider
- `SELECT` - Dropdown menu
- `CHOOSE` - Icon button group (alignment, etc.)
- `COLOR` - Color picker
- `MEDIA` - Image/video uploader
- `URL` - Link picker
- `REPEATER` - Repeating fields (e.g., list items)
- `CODE` - Code editor with syntax highlighting
- `DIMENSIONS` - Top/Right/Bottom/Left inputs
- `TYPOGRAPHY` - Font family, size, weight, etc.
- `BOX_SHADOW` - Shadow configuration
- `BORDER` - Border width, style, color, radius

### 2. Tabs = Organization

Controls are organized into tabs:
- **Content Tab** (`TAB_CONTENT`) - Main content settings
- **Style Tab** (`TAB_STYLE`) - Visual styling options
- **Advanced Tab** (`TAB_ADVANCED`) - CSS/JS/animation/responsive settings

### 3. Render Method = Output

The `render()` method outputs the final HTML that appears on the page. It:
- Gets control values via `$this->get_settings_for_display()`
- Outputs HTML using those values
- Can embed `<style>` and `<script>` tags inline

---

## Is PHP Easily Split from HTML/CSS/JS?

### YES! Here's how:

### HTML
```html
<div class="my-widget">
    <h2>Hello World</h2>
</div>
```

**Becomes:**
```php
<div class="my-widget">
    <h2><?php echo $settings['heading_text']; ?></h2>
</div>
```

**Process:**
1. Identify dynamic parts (text, colors, URLs, etc.)
2. Replace with `<?php echo $settings['control_name']; ?>`
3. Add escaping: `esc_html()`, `esc_url()`, `esc_attr()`

---

### CSS
```css
.my-widget h2 {
    color: #ff0000;
    font-size: 24px;
}
```

**Becomes (Option A - Inline):**
```php
<style>
.elementor-element-<?php echo $this->get_id(); ?> .my-widget h2 {
    color: <?php echo $settings['heading_color']; ?>;
    font-size: <?php echo $settings['heading_size']; ?>px;
}
</style>
```

**Becomes (Option B - Selectors):**
```php
$this->add_control('heading_color', [
    'label' => 'Heading Color',
    'type' => 'COLOR',
    'selectors' => [
        '{{WRAPPER}} .my-widget h2' => 'color: {{VALUE}};'
    ]
]);
```

**Process:**
1. Extract CSS rules
2. Identify dynamic values (colors, sizes, etc.)
3. Either:
   - Use `selectors` property (Elementor generates CSS automatically) ✅ **PREFERRED**
   - Embed as `<style>` in `render()` method

---

### JavaScript
```javascript
document.querySelector('.my-widget').addEventListener('click', function() {
    alert('Clicked!');
});
```

**Becomes:**
```php
<script>
(function($) {
    $(document).ready(function() {
        $('.my-widget').on('click', function() {
            alert('Clicked!');
        });
    });
})(jQuery);
</script>
```

**Process:**
1. Wrap in jQuery's `$(document).ready()`
2. Embed in `<script>` tag in `render()` method
3. Optionally make it a control value for user customization

---

## Current Conversion Process (AI-Based)

### How It Works Now

**File:** `/src/app/api/convert-to-widget/route.ts`

**Flow:**
```
User clicks "Generate Widget"
    ↓
Frontend sends: { html, css, js, widgetName }
    ↓
Backend API calls GPT-4o/Claude
    ↓
AI analyzes HTML/CSS/JS
    ↓
AI generates PHP widget class with:
  - Control definitions
  - Render method with PHP-embedded HTML
  - Inline CSS/JS
    ↓
Returns complete PHP file
```

**What AI Does:**
1. **Parses HTML** - Identifies elements, classes, structure
2. **Analyzes CSS** - Finds colors, fonts, sizes, etc.
3. **Extracts JS** - Identifies interactive behaviors
4. **Creates Controls** - Generates appropriate Elementor controls for each customizable aspect
5. **Generates PHP** - Wraps everything in proper Elementor widget structure

**Current System Prompt (Simplified):**
```
You are an expert Elementor widget developer.

Given HTML/CSS/JS, generate a complete Elementor widget PHP class.

Requirements:
- Use comprehensive controls for all visual aspects
- Organize controls into Content/Style/Advanced tabs
- Use selector-based styling where possible
- Properly escape all output
- Include custom CSS/JS controls for advanced users
- Generate helpful descriptions and tooltips
```

---

## Can We Make It Programmatic/Automatic?

### YES! Here's How:

The conversion can be **mostly programmatic** with **optional AI enhancement**.

### Level 1: Pure Programmatic (No AI) - Fast, Limited

```typescript
function convertToWidgetProgrammatic(html: string, css: string, js: string, widgetName: string) {

  // 1. Parse HTML with DOM parser
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const elements = dom.querySelectorAll('*');

  // 2. Extract text nodes → TEXT controls
  const textControls = [];
  elements.forEach(el => {
    if (el.textContent.trim()) {
      textControls.push({
        id: `text_${textControls.length}`,
        label: `Text ${textControls.length + 1}`,
        type: 'TEXT',
        default: el.textContent.trim(),
        selector: `.${el.className || el.tagName.toLowerCase()}`
      });
    }
  });

  // 3. Parse CSS → Style controls
  const cssRules = parseCSSRules(css);
  const styleControls = cssRules.map(rule => {
    if (rule.property === 'color') {
      return {
        type: 'COLOR',
        label: 'Color',
        selector: rule.selector,
        default: rule.value
      };
    }
    if (rule.property === 'font-size') {
      return {
        type: 'SLIDER',
        label: 'Font Size',
        selector: rule.selector,
        default: parseInt(rule.value),
        range: { min: 10, max: 100 }
      };
    }
    // ... more mappings
  });

  // 4. Generate PHP widget code
  return generatePHPWidget({
    name: widgetName,
    controls: [...textControls, ...styleControls],
    html: html,
    css: css,
    js: js
  });
}
```

**Pros:**
- ⚡ **Fast** - No AI API call (~10ms vs ~3 seconds)
- 💰 **Free** - No API costs
- 🎯 **Predictable** - Always produces same output for same input
- 🔄 **Offline** - Works without internet

**Cons:**
- 🎨 **Limited** - Can only handle simple patterns
- 📏 **Rigid** - Can't understand complex layouts
- 🧠 **No Context** - Doesn't understand semantic meaning
- ❌ **Brittle** - Breaks on unusual structures

---

### Level 2: Hybrid (Programmatic + AI) - Balanced ✅ **RECOMMENDED**

```typescript
async function convertToWidgetHybrid(html: string, css: string, js: string, widgetName: string) {

  // STEP 1: Programmatic Extraction (Fast)
  const extracted = {
    textNodes: extractTextNodes(html),
    cssRules: parseCSSRules(css),
    colors: extractColors(css),
    images: extractImages(html),
    links: extractLinks(html),
    structure: analyzeStructure(html)
  };

  // STEP 2: AI Enhancement (Smart)
  const aiPrompt = `
    I've analyzed this HTML/CSS/JS and extracted:
    - ${extracted.textNodes.length} text elements
    - ${extracted.cssRules.length} CSS rules
    - ${extracted.colors.length} unique colors

    Generate only the CONTROLS for an Elementor widget.
    Focus on:
    1. Grouping related controls logically
    2. Creating intuitive labels
    3. Choosing appropriate control types
    4. Adding helpful descriptions

    HTML Structure:
    ${extracted.structure}

    Colors Found:
    ${extracted.colors.join(', ')}
  `;

  const aiControls = await callAI(aiPrompt); // Much smaller prompt!

  // STEP 3: Programmatic Assembly (Fast)
  return assemblePHPWidget({
    name: widgetName,
    controls: aiControls,
    html: html,
    css: css,
    js: js,
    extracted: extracted
  });
}
```

**Pros:**
- ⚡ **Faster** - Smaller AI prompt = faster response (~1 second)
- 💰 **Cheaper** - ~70% fewer tokens
- 🎯 **Reliable** - Programmatic parts always work
- 🧠 **Smart** - AI handles complex decisions
- 🔄 **Cacheable** - AI only generates controls once

**Cons:**
- 🔌 **Still needs AI** - Not 100% offline
- 🤖 **API dependency** - Requires AI service

---

### Level 3: Template-Based (No AI for Common Patterns) - Fastest ⚡

```typescript
function convertToWidgetTemplated(html: string, css: string, js: string) {

  // Detect pattern
  const pattern = detectPattern(html);

  switch (pattern) {
    case 'hero-section':
      return applyHeroTemplate({
        heading: extractHeading(html),
        subheading: extractSubheading(html),
        ctaButton: extractButton(html),
        background: extractBackground(css)
      });

    case 'testimonial-card':
      return applyTestimonialTemplate({
        quote: extractQuote(html),
        author: extractAuthor(html),
        avatar: extractAvatar(html),
        rating: extractRating(html)
      });

    case 'pricing-table':
      return applyPricingTemplate({
        tiers: extractPricingTiers(html),
        features: extractFeatures(html),
        prices: extractPrices(html)
      });

    default:
      // Fall back to hybrid approach
      return convertToWidgetHybrid(html, css, js);
  }
}
```

**Pros:**
- ⚡⚡⚡ **Instant** - No AI needed for common patterns
- 💰 **Free** - Zero API costs for templates
- ✨ **Best Quality** - Hand-crafted templates
- 📚 **Reusable** - Build template library over time

**Cons:**
- 📝 **Requires Templates** - Need to create templates first
- 🎯 **Limited Coverage** - Only works for predefined patterns
- 🔄 **Maintenance** - Templates need updates

---

## Recommended Implementation Strategy

### Phase 1: Add Programmatic Extraction (Current + Enhancement)

Keep current AI system, but add programmatic pre-processing:

```typescript
// /src/lib/widget-converter.ts

export function analyzeHTMLForWidget(html: string, css: string, js: string) {
  return {
    textElements: extractTextNodes(html),
    headings: extractHeadings(html),
    images: extractImages(html),
    links: extractLinks(html),
    forms: extractForms(html),
    colors: extractColors(css),
    fonts: extractFonts(css),
    animations: extractAnimations(css + js),
    interactive: hasInteractivity(js),
    complexity: calculateComplexity(html, css, js),
    suggestedControls: suggestControls(html, css, js)
  };
}
```

**Benefits:**
- Provides AI with **structured data** instead of raw code
- **Reduces prompt size** by 50-70%
- **Faster responses** (less to process)
- **Better results** (AI has context)

---

### Phase 2: Add Template System (Future)

Create library of common widget patterns:

```typescript
// /src/lib/widget-templates.ts

export const WIDGET_TEMPLATES = {
  'hero-section': {
    controls: [
      { id: 'heading', type: 'TEXT', tab: 'content' },
      { id: 'subheading', type: 'TEXTAREA', tab: 'content' },
      { id: 'button_text', type: 'TEXT', tab: 'content' },
      { id: 'button_link', type: 'URL', tab: 'content' },
      { id: 'background_image', type: 'MEDIA', tab: 'style' },
      { id: 'overlay_color', type: 'COLOR', tab: 'style' },
    ],
    renderTemplate: (settings) => `
      <div class="hero-section">
        <h1><?php echo esc_html($settings['heading']); ?></h1>
        <p><?php echo esc_html($settings['subheading']); ?></p>
        <a href="<?php echo esc_url($settings['button_link']); ?>">
          <?php echo esc_html($settings['button_text']); ?>
        </a>
      </div>
    `
  },
  // Add more templates...
};
```

User clicks "Generate Widget" → Detects pattern → Uses template → Done in ~100ms!

---

### Phase 3: Smart Hybrid (Best of Both)

```typescript
async function convertToWidget(html: string, css: string, js: string, widgetName: string) {

  // 1. Try template matching first (instant)
  const template = findMatchingTemplate(html);
  if (template && template.confidence > 0.8) {
    console.log('✅ Using template:', template.name);
    return applyTemplate(template, html, css, js);
  }

  // 2. Extract programmatically (fast)
  const analysis = analyzeHTMLForWidget(html, css, js);

  // 3. AI generation with analysis (smart)
  if (analysis.complexity < 50) {
    // Simple widget - use programmatic only
    console.log('✅ Simple widget - programmatic generation');
    return generateProgrammatically(analysis, widgetName);
  } else {
    // Complex widget - use AI with analysis
    console.log('🤖 Complex widget - AI generation');
    return generateWithAI(analysis, widgetName);
  }
}
```

**Result:**
- **Simple widgets**: 100ms (programmatic)
- **Common patterns**: 100ms (template)
- **Complex widgets**: 1-2s (AI with analysis)
- **Exotic widgets**: 3-5s (full AI)

---

## Implementation Checklist

To make conversion programmatic and faster:

### Quick Wins (Easy)
- [ ] Add HTML parsing to extract structure
- [ ] Add CSS parser to extract rules
- [ ] Extract colors, fonts, sizes automatically
- [ ] Provide structured data to AI (reduce prompt size)
- [ ] Cache analysis results (don't re-analyze same code)

### Medium Term (Moderate)
- [ ] Create 5-10 common widget templates
- [ ] Add pattern detection (hero, card, grid, etc.)
- [ ] Implement template-first fallback
- [ ] Add control suggestion engine
- [ ] Create programmatic PHP generator

### Long Term (Complex)
- [ ] Build ML model to classify widget patterns
- [ ] Create visual template builder
- [ ] Add widget marketplace (share templates)
- [ ] Implement incremental generation (stream controls)
- [ ] Add widget diff/merge for updates

---

## Code Splitting Examples

### Example 1: Hero Section

**Original HTML:**
```html
<div class="hero">
  <h1>Welcome to Our Site</h1>
  <p>We make awesome things</p>
  <button>Get Started</button>
</div>
```

**Split into PHP:**
```php
<div class="hero">
  <h1><?php echo esc_html($settings['heading']); ?></h1>
  <p><?php echo esc_html($settings['subheading']); ?></p>
  <button><?php echo esc_html($settings['button_text']); ?></button>
</div>
```

**Controls:**
```php
$this->add_control('heading', [
    'label' => 'Heading',
    'type' => Controls_Manager::TEXT,
    'default' => 'Welcome to Our Site'
]);

$this->add_control('subheading', [
    'label' => 'Subheading',
    'type' => Controls_Manager::TEXT,
    'default' => 'We make awesome things'
]);

$this->add_control('button_text', [
    'label' => 'Button Text',
    'type' => Controls_Manager::TEXT,
    'default' => 'Get Started'
]);
```

**100% Programmatic!** No AI needed.

---

### Example 2: Card with Image

**Original HTML:**
```html
<div class="card">
  <img src="/image.jpg" alt="Card Image">
  <h3>Card Title</h3>
  <p>Card description goes here.</p>
  <a href="#">Read More</a>
</div>
```

**Original CSS:**
```css
.card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}
.card h3 {
  color: #333333;
  font-size: 24px;
}
```

**Programmatic Extraction:**
```javascript
{
  texts: [
    { selector: 'h3', content: 'Card Title', type: 'heading' },
    { selector: 'p', content: 'Card description...', type: 'paragraph' },
    { selector: 'a', content: 'Read More', type: 'link' }
  ],
  images: [
    { selector: 'img', src: '/image.jpg', alt: 'Card Image' }
  ],
  styles: [
    { selector: '.card', property: 'background', value: '#ffffff' },
    { selector: '.card', property: 'border-color', value: '#e0e0e0' },
    { selector: '.card', property: 'border-radius', value: '8px' },
    { selector: '.card', property: 'padding', value: '20px' },
    { selector: '.card h3', property: 'color', value: '#333333' },
    { selector: '.card h3', property: 'font-size', value: '24px' }
  ]
}
```

**Generated Controls (Programmatic):**
```php
// Content Tab
$this->add_control('card_image', [
    'label' => 'Card Image',
    'type' => Controls_Manager::MEDIA,
    'default' => ['url' => '/image.jpg']
]);

$this->add_control('card_title', [
    'label' => 'Title',
    'type' => Controls_Manager::TEXT,
    'default' => 'Card Title'
]);

$this->add_control('card_description', [
    'label' => 'Description',
    'type' => Controls_Manager::TEXTAREA,
    'default' => 'Card description goes here.'
]);

// Style Tab
$this->add_control('card_background', [
    'label' => 'Background Color',
    'type' => Controls_Manager::COLOR,
    'default' => '#ffffff',
    'selectors' => ['{{WRAPPER}} .card' => 'background-color: {{VALUE}};']
]);

$this->add_control('card_border_color', [
    'label' => 'Border Color',
    'type' => Controls_Manager::COLOR,
    'default' => '#e0e0e0',
    'selectors' => ['{{WRAPPER}} .card' => 'border-color: {{VALUE}};']
]);

$this->add_control('heading_color', [
    'label' => 'Heading Color',
    'type' => Controls_Manager::COLOR,
    'default' => '#333333',
    'selectors' => ['{{WRAPPER}} .card h3' => 'color: {{VALUE}};']
]);
```

**100% Programmatic!** Generated in ~50ms.

---

## Summary

### Current State (AI-Only)
- ✅ Works for all complexity levels
- ⏱️ Slow (3-5 seconds)
- 💰 Expensive (~10-20K tokens per widget)
- 🎯 Inconsistent results

### Recommended Hybrid Approach
- ⚡ Fast for simple cases (100ms)
- ⚡⚡ Instant for templates (10ms)
- 🧠 Smart for complex cases (1-2s with AI)
- 💰 Cheap (70% token reduction)
- 🎯 Consistent + Quality

### Implementation Priority
1. **NOW**: Add programmatic HTML/CSS parsing
2. **NEXT**: Create 10 widget templates
3. **LATER**: Pattern detection + template matching
4. **FUTURE**: ML-based classification

The PHP is **easily split** - it's just a matter of identifying patterns and replacing values with control references. Most of this can be automated!
