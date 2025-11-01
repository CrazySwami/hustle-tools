// AI-based HTML to Elementor Widget converter using Claude Sonnet 4.5
import { streamText } from 'ai';

export const maxDuration = 60;

// Helper function to parse HTML and extract elements for controls
function parseHTMLStructure(html: string): Array<{
  type: string;
  classes: string;
  id: string;
  text: string;
  controlsNeeded: string[];
}> {
  const elements: Array<{
    type: string;
    classes: string;
    id: string;
    text: string;
    controlsNeeded: string[];
  }> = [];

  // Extract headings
  const headings = html.match(/<(h[1-6])[^>]*>([^<]+)<\/\1>/gi) || [];
  headings.forEach((match) => {
    const tag = match.match(/<(h[1-6])/)?.[1] || 'h1';
    const classes = match.match(/class="([^"]*)"/)?.[1] || '';
    const id = match.match(/id="([^"]*)"/)?.[1] || '';
    const text = match.match(/>([^<]+)</)?.[1] || '';

    elements.push({
      type: tag,
      classes,
      id,
      text: text.trim(),
      controlsNeeded: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING']
    });
  });

  // Extract paragraphs
  const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  paragraphs.forEach((match) => {
    const classes = match.match(/class="([^"]*)"/)?.[1] || '';
    const id = match.match(/id="([^"]*)"/)?.[1] || '';
    const text = match.match(/>([^<]+)</)?.[1] || '';

    elements.push({
      type: 'p',
      classes,
      id,
      text: text.trim(),
      controlsNeeded: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'MARGIN', 'PADDING']
    });
  });

  // Extract buttons
  const buttons = html.match(/<button[^>]*>([^<]+)<\/button>/gi) || [];
  buttons.forEach((match) => {
    const classes = match.match(/class="([^"]*)"/)?.[1] || '';
    const id = match.match(/id="([^"]*)"/)?.[1] || '';
    const text = match.match(/>([^<]+)</)?.[1] || '';

    elements.push({
      type: 'button',
      classes,
      id,
      text: text.trim(),
      controlsNeeded: ['TEXT', 'URL', 'TYPOGRAPHY', 'COLOR', 'HOVER_COLOR', 'BG_COLOR', 'HOVER_BG', 'BORDER', 'BORDER_RADIUS', 'BOX_SHADOW', 'PADDING']
    });
  });

  // Extract links
  const links = html.match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
  links.forEach((match) => {
    const classes = match.match(/class="([^"]*)"/)?.[1] || '';
    const id = match.match(/id="([^"]*)"/)?.[1] || '';
    const text = match.match(/>([^<]+)</)?.[1] || '';
    const href = match.match(/href="([^"]*)"/)?.[1] || '';

    elements.push({
      type: 'a',
      classes,
      id,
      text: text.trim(),
      controlsNeeded: ['TEXT', 'URL', 'TYPOGRAPHY', 'COLOR', 'HOVER_COLOR', 'UNDERLINE']
    });
  });

  // Extract images
  const images = html.match(/<img[^>]*>/gi) || [];
  images.forEach((match) => {
    const classes = match.match(/class="([^"]*)"/)?.[1] || '';
    const id = match.match(/id="([^"]*)"/)?.[1] || '';
    const src = match.match(/src="([^"]*)"/)?.[1] || '';
    const alt = match.match(/alt="([^"]*)"/)?.[1] || '';

    elements.push({
      type: 'img',
      classes,
      id,
      text: alt,
      controlsNeeded: ['IMAGE', 'ALT_TEXT', 'WIDTH', 'HEIGHT', 'BORDER_RADIUS', 'BOX_SHADOW', 'MARGIN', 'PADDING']
    });
  });

  return elements;
}

export async function POST(req: Request) {
  try {
    const { html, css, js, widgetName, widgetTitle, widgetDescription } = await req.json();

    console.log('🤖 AI Widget Conversion Request:', {
      htmlLength: html?.length || 0,
      cssLength: css?.length || 0,
      jsLength: js?.length || 0,
      widgetName,
      widgetTitle
    });

    if (!html) {
      return new Response(
        JSON.stringify({ error: 'HTML is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Programmatic HTML parsing
    const parsedElements = parseHTMLStructure(html);
    console.log('📊 Parsed Elements:', parsedElements.length);

    // Step 2: AI Enhancement with Sonnet 4.5
    // AI Gateway is handled automatically by model string (same as chat-elementor)
    const prompt = `You are an expert Elementor widget developer with deep knowledge of the Elementor Widget_Base API. Generate a production-ready Elementor widget PHP class.

**PARSED HTML ELEMENTS:**
${JSON.stringify(parsedElements, null, 2)}

**ORIGINAL HTML:**
\`\`\`html
${html}
\`\`\`

**ORIGINAL CSS (Already scoped with {{WRAPPER}}):**
\`\`\`css
${css || '/* No CSS provided */'}
\`\`\`

**ORIGINAL JAVASCRIPT:**
\`\`\`javascript
${js || '// No JavaScript provided'}
\`\`\`

**WIDGET METADATA:**
- Name: ${widgetName || 'custom_section'}
- Title: ${widgetTitle || 'Custom Section'}
- Description: ${widgetDescription || 'Convert this HTML section to an Elementor widget'}

---

## ELEMENTOR WIDGET_BASE API REQUIREMENTS

### 1. Class Structure (CRITICAL)
\`\`\`php
class ${widgetName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Widget extends \\Elementor\\Widget_Base {
    // MUST extend \\Elementor\\Widget_Base (double backslash)
}
\`\`\`

### 2. Required Methods (EXACT signatures)
\`\`\`php
public function get_name() {
    return '${widgetName}'; // Widget slug (lowercase, underscores)
}

public function get_title() {
    return __('${widgetTitle}', 'hustle-tools'); // Translatable title
}

public function get_icon() {
    return 'eicon-code'; // Elementor icon class
}

public function get_categories() {
    return ['hustle-tools']; // Custom category
}

protected function register_controls() {
    // Register ALL controls here
}

protected function render() {
    \\$settings = \\$this->get_settings_for_display();
    // Output HTML with dynamic values
}
\`\`\`

---

## ELEMENTOR CONTROL TYPES REFERENCE

### Data Controls (Return single value)
- **TEXT**: \`'type' => \\Elementor\\Controls_Manager::TEXT\`
- **TEXTAREA**: \`'type' => \\Elementor\\Controls_Manager::TEXTAREA\`
- **NUMBER**: \`'type' => \\Elementor\\Controls_Manager::NUMBER\`
- **SELECT**: \`'type' => \\Elementor\\Controls_Manager::SELECT, 'options' => [...]\`
- **CHOOSE**: \`'type' => \\Elementor\\Controls_Manager::CHOOSE, 'options' => [...]\` (Icon buttons)
- **SWITCHER**: \`'type' => \\Elementor\\Controls_Manager::SWITCHER, 'return_value' => 'yes'\`
- **COLOR**: \`'type' => \\Elementor\\Controls_Manager::COLOR\`
- **CODE**: \`'type' => \\Elementor\\Controls_Manager::CODE, 'language' => 'css|html|javascript'\`

### Multi-Value Controls
- **URL**: \`'type' => \\Elementor\\Controls_Manager::URL, 'default' => ['url' => '', 'is_external' => false]\`
- **MEDIA**: \`'type' => \\Elementor\\Controls_Manager::MEDIA, 'default' => ['url' => '']\`
- **ICONS**: \`'type' => \\Elementor\\Controls_Manager::ICONS\`
- **GALLERY**: \`'type' => \\Elementor\\Controls_Manager::GALLERY\`

### Unit Controls
- **SLIDER**: \`'type' => \\Elementor\\Controls_Manager::SLIDER, 'range' => ['px' => ['min' => 0, 'max' => 100]]\`
- **DIMENSIONS**: \`'type' => \\Elementor\\Controls_Manager::DIMENSIONS, 'size_units' => ['px', 'em', '%']\`

### Group Controls (CRITICAL ACTIVATION PATTERN)
**Typography** (MUST activate first):
\`\`\`php
\\$this->add_group_control(
    \\Elementor\\Group_Control_Typography::get_type(),
    [
        'name' => 'heading_typography',
        'selector' => '{{WRAPPER}} .heading',
    ]
);
\`\`\`

**Background** (MUST set type first):
\`\`\`php
\\$this->add_group_control(
    \\Elementor\\Group_Control_Background::get_type(),
    [
        'name' => 'section_background',
        'selector' => '{{WRAPPER}} .section',
    ]
);
\`\`\`

**Border**:
\`\`\`php
\\$this->add_group_control(
    \\Elementor\\Group_Control_Border::get_type(),
    [
        'name' => 'button_border',
        'selector' => '{{WRAPPER}} .button',
    ]
);
\`\`\`

**Box Shadow**, **Text Shadow**, **Text Stroke**, **CSS Filters**: Similar pattern

### UI Controls (No value returned)
- **HEADING**: Section dividers \`'type' => \\Elementor\\Controls_Manager::HEADING\`
- **DIVIDER**: Visual separator \`'type' => \\Elementor\\Controls_Manager::DIVIDER\`

---

## CONTROL REGISTRATION PATTERNS

### Content Tab (Text, Media, Links)
\`\`\`php
\\$this->start_controls_section(
    'content_section',
    [
        'label' => __('Content', 'hustle-tools'),
        'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
    ]
);

\\$this->add_control(
    'heading_text',
    [
        'label' => __('Heading Text', 'hustle-tools'),
        'type' => \\Elementor\\Controls_Manager::TEXT,
        'default' => 'Default heading',
        'dynamic' => ['active' => true],
    ]
);

\\$this->add_control(
    'image',
    [
        'label' => __('Image', 'hustle-tools'),
        'type' => \\Elementor\\Controls_Manager::MEDIA,
        'default' => ['url' => \\Elementor\\Utils::get_placeholder_image_src()],
    ]
);

\\$this->end_controls_section();
\`\`\`

### Style Tab (Typography, Colors, Spacing)
\`\`\`php
\\$this->start_controls_section(
    'style_section',
    [
        'label' => __('Style', 'hustle-tools'),
        'tab' => \\Elementor\\Controls_Manager::TAB_STYLE,
    ]
);

\\$this->add_group_control(
    \\Elementor\\Group_Control_Typography::get_type(),
    [
        'name' => 'heading_typography',
        'selector' => '{{WRAPPER}} .heading',
    ]
);

\\$this->add_control(
    'heading_color',
    [
        'label' => __('Color', 'hustle-tools'),
        'type' => \\Elementor\\Controls_Manager::COLOR,
        'selectors' => [
            '{{WRAPPER}} .heading' => 'color: {{VALUE}};',
        ],
    ]
);

\\$this->add_responsive_control(
    'heading_padding',
    [
        'label' => __('Padding', 'hustle-tools'),
        'type' => \\Elementor\\Controls_Manager::DIMENSIONS,
        'size_units' => ['px', 'em', '%'],
        'selectors' => [
            '{{WRAPPER}} .heading' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
        ],
    ]
);

\\$this->end_controls_section();
\`\`\`

### Advanced Tab (Custom CSS/JS, Animations)
**CRITICAL**: Use heredoc syntax for CSS/JS defaults to avoid quote escaping issues!

\`\`\`php
\\$this->start_controls_section(
    'advanced_section',
    [
        'label' => __('Advanced', 'hustle-tools'),
        'tab' => \\Elementor\\Controls_Manager::TAB_ADVANCED,
    ]
);

\\$this->add_control(
    'custom_css',
    [
        'label' => __('Custom CSS', 'hustle-tools'),
        'type' => \\Elementor\\Controls_Manager::CODE,
        'language' => 'css',
        'default' => <<<CSS
${css || '/* No CSS */'}
CSS,
    ]
);

\\$this->add_control(
    'custom_js',
    [
        'label' => __('Custom JavaScript', 'hustle-tools'),
        'type' => \\Elementor\\Controls_Manager::CODE,
        'language' => 'javascript',
        'default' => <<<JS
${js || '// No JS'}
JS,
    ]
);

\\$this->end_controls_section();
\`\`\`

---

## RENDER METHOD REQUIREMENTS

\`\`\`php
protected function render() {
    \\$settings = \\$this->get_settings_for_display();

    // Output custom CSS
    if (!empty(\\$settings['custom_css'])) {
        echo '<style>' . \\$settings['custom_css'] . '</style>';
    }

    // Output HTML with dynamic values
    ?>
    <div class="custom-widget">
        <h1 class="heading"><?php echo esc_html(\\$settings['heading_text']); ?></h1>
        <?php if (!empty(\\$settings['image']['url'])): ?>
            <img src="<?php echo esc_url(\\$settings['image']['url']); ?>" alt="">
        <?php endif; ?>
    </div>
    <?php

    // Output custom JS
    if (!empty(\\$settings['custom_js'])) {
        echo '<script>' . \\$settings['custom_js'] . '</script>';
    }
}
\`\`\`

---

## CRITICAL REQUIREMENTS

1. **NO SHORTCUTS**: Create controls for EVERY element in the parsed list
2. **SEMANTIC NAMING**: Use descriptive names (e.g., \`hero_title\` not \`text_1\`)
3. **CSS SCOPING**: All CSS already has {{WRAPPER}} prefix
4. **DYNAMIC VALUES**: Use \`\\$settings['control_name']\` in render()
5. **ESCAPE OUTPUT**: Use \`esc_html()\`, \`esc_url()\`, \`esc_attr()\`
6. **RESPONSIVE**: Use \`add_responsive_control()\` for spacing
7. **TRANSLATIONS**: Wrap labels with \`__('Text', 'hustle-tools')\`
8. **DEFAULTS**: Include original HTML/CSS/JS as defaults
9. **ABSPATH CHECK**: Start with \`if (!defined('ABSPATH')) exit;\`
10. **HEREDOC FOR CSS/JS**: ALWAYS use heredoc syntax (<<<CSS / <<<JS) for CSS/JS defaults to avoid quote escaping issues

---

## OUTPUT FORMAT

Generate ONLY the complete PHP widget class. Start with:

\`\`\`php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ${widgetName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Widget extends \\Elementor\\Widget_Base {
    // ... complete implementation
}
\`\`\`

Do NOT include any text before \`<?php\` or after the closing \`}\`. ONLY output the PHP code.`;

    const result = streamText({
      model: 'anthropic/claude-sonnet-4-5-20250929', // AI Gateway handled automatically
      prompt,
      temperature: 0.7,
      maxTokens: 16000,
    });

    // Return the streaming response
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('❌ AI Widget Conversion Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
