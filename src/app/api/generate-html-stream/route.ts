// HTML/CSS/JS generation API with streaming
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      description,
      images = [],
      type = 'html', // 'html', 'css', or 'js'
      mode = 'section', // 'section' or 'widget'
      model = 'anthropic/claude-sonnet-4-5-20250929',
      generatedHtml = '', // Pass HTML to CSS/JS generation
      generatedCss = '', // Pass CSS to JS generation
    }: {
      description: string;
      images: Array<{ url: string; filename: string; description: string }>;
      type: 'html' | 'css' | 'js';
      mode?: 'section' | 'widget';
      model?: string;
      generatedHtml?: string;
      generatedCss?: string;
    } = await req.json();

    console.log(`🎨 Generating ${type.toUpperCase()}...`, {
      description: description.substring(0, 100),
      imageCount: images.length,
      hasHtml: !!generatedHtml,
      hasCss: !!generatedCss,
    });

    // Build comprehensive prompt
    const imageContext = images.length > 0
      ? `\n\n**Reference Images:**\n${images.map((img, i) => `\nImage ${i + 1} (${img.filename}):\n${img.description}`).join('\n\n')}`
      : '';

    // Widget mode: Generate PHP class with render() method containing the HTML
    if (mode === 'widget' && type === 'html') {
      const widgetPrompt = `You are an expert Elementor widget developer. Generate a complete, production-ready Elementor custom widget PHP class based on this description:

**Description:** ${description}${imageContext}

**CRITICAL REQUIREMENTS:**
- Generate a COMPLETE Elementor widget class extending \\Elementor\\Widget_Base
- NO markdown code fences - NO \`\`\`php or \`\`\` markers
- NO explanatory text before or after the code
- Start immediately with <?php and end with the final closing brace
- Include all required methods: get_name(), get_title(), get_icon(), get_categories(), register_controls(), render()
- The render() method should output the HTML for the widget
- Use a unique, descriptive widget name (snake_case)
- Choose an appropriate icon class (eicon-*)
- Set category to ['general']
- Include proper escaping (esc_html, esc_attr, etc.)
- Add helpful inline comments

**COMPREHENSIVE CONTROLS REQUIREMENT (CRITICAL):**
You MUST create granular controls for EVERY customizable element. For each piece of content, add these control types:

**For EVERY Text Element (headings, paragraphs, labels, etc.):**
- TEXT control for the content
- TYPOGRAPHY control (font family, size, weight, line-height, letter-spacing)
- COLOR control for text color
- Add these in separate "Content" and "Style" tabs

**For EVERY Visual Element (buttons, cards, containers, etc.):**
- Background COLOR or GRADIENT control
- Border controls (type, width, color, radius)
- Box shadow control
- Padding/margin DIMENSIONS controls
- Width/height controls where applicable

**For EVERY Image:**
- MEDIA control for image selection
- Image size control
- Border/shadow controls
- Alignment control

**For EVERY Interactive Element (buttons, links):**
- TEXT control for label/text
- URL control for link
- CHOOSE control for button size/style variants
- Hover state COLOR controls
- Icon controls if applicable

**CONTROL ORGANIZATION:**
- Group controls into logical sections using start_controls_section/end_controls_section
- Use tabs: TAB_CONTENT for content, TAB_STYLE for styling, TAB_ADVANCED for advanced options
- Add HEADING control type to separate groups visually
- Use descriptive labels and helpful default values

**EXAMPLE - Comprehensive Controls for a Simple Card:**
\`\`\`php
// Content Tab - Card Title
$this->add_control('card_title', [
    'label' => 'Title',
    'type' => \\Elementor\\Controls_Manager::TEXT,
    'default' => 'Card Title'
]);

// Content Tab - Card Description
$this->add_control('card_description', [
    'label' => 'Description',
    'type' => \\Elementor\\Controls_Manager::TEXTAREA,
    'default' => 'Card description text...'
]);

// Style Tab - Title Typography
$this->add_group_control(
    \\Elementor\\Group_Control_Typography::get_type(),
    [
        'name' => 'title_typography',
        'selector' => '{{WRAPPER}} .card-title',
    ]
);

// Style Tab - Title Color
$this->add_control('title_color', [
    'label' => 'Title Color',
    'type' => \\Elementor\\Controls_Manager::COLOR,
    'selectors' => ['{{WRAPPER}} .card-title' => 'color: {{VALUE}}']
]);

// Style Tab - Description Typography
$this->add_group_control(
    \\Elementor\\Group_Control_Typography::get_type(),
    [
        'name' => 'description_typography',
        'selector' => '{{WRAPPER}} .card-description',
    ]
);

// Style Tab - Card Background
$this->add_control('card_background', [
    'label' => 'Background Color',
    'type' => \\Elementor\\Controls_Manager::COLOR,
    'selectors' => ['{{WRAPPER}} .card' => 'background-color: {{VALUE}}']
]);

// Style Tab - Card Border
$this->add_group_control(
    \\Elementor\\Group_Control_Border::get_type(),
    [
        'name' => 'card_border',
        'selector' => '{{WRAPPER}} .card',
    ]
);

// Style Tab - Card Padding
$this->add_responsive_control('card_padding', [
    'label' => 'Padding',
    'type' => \\Elementor\\Controls_Manager::DIMENSIONS,
    'selectors' => ['{{WRAPPER}} .card' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}']
]);
\`\`\`

**For EVERY Video Element:**
- VIDEO_URL or MEDIA control for video source
- Autoplay, loop, muted toggles
- Poster image control
- Controls visibility toggle
- Width/height controls
- Border/shadow controls
- Aspect ratio control

**For EVERY Audio Element:**
- MEDIA control for audio source
- Autoplay, loop toggles
- Volume control
- Player style controls

**For EVERY Iframe/Embed:**
- URL control
- Width/height controls
- Responsive aspect ratio
- Border controls
- Allow fullscreen toggle

**For EVERY SVG/Icon:**
- SVG code or icon library selector
- Color/fill controls
- Size controls
- Stroke width/color
- Rotation/transform

**For Form Elements:**
- Placeholder text
- Default value
- Required toggle
- Validation rules
- Label text and styling
- Input styling (border, background, text color)
- Focus state styles
- Error state styles

**For EVERY Accordion/Tab:**
- Repeater for items (title + content)
- Active item control
- Transition duration
- Title styling
- Content styling
- Border/spacing controls

**REQUIRED ADVANCED CONTROLS (ALL WIDGETS):**
- **Custom CSS Box**: RAW_HTML control type for custom CSS (scoped to widget)
- **Custom JavaScript Box**: CODE control type for custom JS
- **Element Class/ID Display**: Show the CSS selector for each element in control descriptions (e.g., "Target: .pricing-card-title or #pricing-title-1")
- **Widget Category**: Set category to ['hustle-tools'] to group all generated widgets together

**ELEMENT SELECTOR DISPLAY PATTERN:**
In every control description, include the CSS selector:
\`\`\`php
$this->add_control('title_text', [
    'label' => 'Title Text',
    'description' => 'CSS Selector: .widget-title | ID: #title-1',
    'type' => \\Elementor\\Controls_Manager::TEXT,
]);
\`\`\`

**CUSTOM CSS/JS SECTIONS (REQUIRED IN EVERY WIDGET):**
\`\`\`php
// Advanced Tab - Custom CSS
$this->start_controls_section(
    'custom_css_section',
    [
        'label' => 'Custom CSS',
        'tab' => \\Elementor\\Controls_Manager::TAB_ADVANCED,
    ]
);

$this->add_control(
    'custom_css',
    [
        'label' => 'Custom CSS',
        'type' => \\Elementor\\Controls_Manager::CODE,
        'language' => 'css',
        'description' => 'Add custom CSS. Will be scoped to this widget instance.',
        'rows' => 10,
    ]
);

$this->end_controls_section();

// Advanced Tab - Custom JavaScript
$this->start_controls_section(
    'custom_js_section',
    [
        'label' => 'Custom JavaScript',
        'tab' => \\Elementor\\Controls_Manager::TAB_ADVANCED,
    ]
);

$this->add_control(
    'custom_js',
    [
        'label' => 'Custom JavaScript',
        'type' => \\Elementor\\Controls_Manager::CODE,
        'language' => 'javascript',
        'description' => 'Add custom JavaScript. Use jQuery or vanilla JS.',
        'rows' => 10,
    ]
);

$this->end_controls_section();
\`\`\`

**RENDER METHOD - Include Custom CSS/JS:**
\`\`\`php
protected function render() {
    $settings = $this->get_settings_for_display();

    // Output custom CSS if provided
    if (!empty($settings['custom_css'])) {
        echo '<style>' . $settings['custom_css'] . '</style>';
    }

    ?>
    <!-- Widget HTML here -->
    <?php

    // Output custom JS if provided
    if (!empty($settings['custom_js'])) {
        echo '<script>' . $settings['custom_js'] . '</script>';
    }
}
\`\`\`

**DO NOT SKIP ANY ELEMENT - Every visible element must have corresponding controls!**

**WIDGET CLASS STRUCTURE:**
\`\`\`php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class Elementor_Your_Widget extends \\Elementor\\Widget_Base {

    public function get_name() {
        return 'unique_widget_name';
    }

    public function get_title() {
        return esc_html__( 'Widget Title', 'text-domain' );
    }

    public function get_icon() {
        return 'eicon-icon-name'; // Choose from https://elementor.github.io/elementor-icons/
    }

    public function get_categories() {
        return [ 'hustle-tools' ]; // Custom category to group all our widgets
    }

    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => esc_html__( 'Content', 'text-domain' ),
                'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
            ]
        );

        // Add controls here (title, description, colors, etc.)
        $this->add_control(
            'title',
            [
                'label' => esc_html__( 'Title', 'text-domain' ),
                'type' => \\Elementor\\Controls_Manager::TEXT,
                'default' => esc_html__( 'Default title', 'text-domain' ),
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <!-- HTML output goes here -->
        <div class="my-widget">
            <h2><?php echo esc_html( $settings['title'] ); ?></h2>
        </div>
        <?php
    }
}
\`\`\`

OUTPUT FORMAT: Start immediately with <?php (no opening comment) and end with the final closing brace. Include the complete, working widget class. NOTHING else.`;

      const result = streamText({
        model: gateway(model, {
          apiKey: process.env.AI_GATEWAY_API_KEY!,
        }),
        prompt: widgetPrompt,
        temperature: 0.7,
      });

      console.log(`✅ Streaming PHP widget class response`);
      return result.toTextStreamResponse();
    }

    const prompts = {
      html: `You are an expert web developer. Generate clean, semantic HTML5 code for a SECTION/COMPONENT (NOT a full page) based on this description:

**Description:** ${description}${imageContext}

**CRITICAL REQUIREMENTS:**
- Generate ONLY the section content - NO <!DOCTYPE>, NO <html>, NO <head>, NO <body> tags
- NO markdown code fences - NO \`\`\`html or \`\`\` markers
- DO NOT include ANY CSS - NO <style> tags, NO inline styles, NO style attributes
- NO explanatory text before or after the code
- The CSS will be generated separately, so only output pure HTML markup
- This is a reusable section/component that will be inserted into an existing page
- Use semantic HTML5 elements (section, article, header, div, etc.)
- Include appropriate ARIA labels for accessibility
- Add data attributes for potential JavaScript hooks
- Include comments for major sections
- Make it responsive-ready with appropriate class names
- Use descriptive class names (e.g., "hero-section", "pricing-card", "contact-form")

OUTPUT FORMAT: Start immediately with the opening tag (e.g., <section class="...">) and end with the closing tag (e.g., </section>). NOTHING else. No markdown. No explanations.`,

      css: `You are an expert CSS developer. Generate modern, production-ready CSS code for this section/component:

**Description:** ${description}${imageContext}

${generatedHtml ? `**GENERATED HTML STRUCTURE:**
\`\`\`html
${generatedHtml}
\`\`\`

Study the HTML structure above carefully. You MUST style ALL elements, classes, and components present in this HTML.` : ''}

**IMPORTANT CONTEXT:**
- The HTML has already been generated${generatedHtml ? ' (shown above)' : ' separately'}
- You are ONLY generating the CSS that styles that HTML
- DO NOT include any HTML markup in your response

**CRITICAL REQUIREMENTS:**
- This is PURE CSS ONLY for a SECTION/COMPONENT (not a full page)
- NO markdown code fences - NO \`\`\`css or \`\`\` markers
- NO <style> tags, NO <html> tags, NO HTML markup whatsoever
- NO explanatory text before or after the code
- **COMPREHENSIVE STYLING REQUIRED:** Style EVERY element in the HTML - headings, paragraphs, buttons, cards, containers, icons, etc.
- **VISUAL POLISH:** Add beautiful typography, spacing, colors, shadows, borders, and visual hierarchy
- Use CSS custom properties (variables) for colors, spacing, typography at the TOP of the CSS
- Implement responsive design with mobile-first approach
- Use modern CSS (Grid, Flexbox, Container Queries if appropriate)
- Include smooth transitions and hover states for interactive elements
- Add professional shadows, gradients, and visual effects where appropriate
- Style buttons with hover, active, and focus states
- Add subtle animations for visual appeal (fade-ins, scale effects, etc.)
- Ensure proper spacing and alignment for a polished look
- Add comments for major sections
- Use descriptive class selectors matching the HTML structure
- Include common breakpoints (mobile: 768px, tablet: 1024px, desktop: 1280px)
- Scope styles to the section to avoid conflicts with other page elements
- Make it production-ready and visually impressive

OUTPUT FORMAT: Start immediately with the first CSS selector (e.g., .hero-section { or :root {) and end with the last closing brace. NOTHING else.`,

      js: `You are an expert JavaScript developer. Generate clean, modern JavaScript code for this section/component:

**Description:** ${description}${imageContext}

${generatedHtml ? `**GENERATED HTML STRUCTURE:**
\`\`\`html
${generatedHtml}
\`\`\`

Study the HTML structure above carefully. Target the specific classes and elements shown.` : ''}

${generatedCss ? `**GENERATED CSS:**
\`\`\`css
${generatedCss.substring(0, 500)}...
\`\`\`

The CSS above provides styling context for your JavaScript.` : ''}

**IMPORTANT CONTEXT:**
- The HTML and CSS have already been generated${generatedHtml ? ' (shown above)' : ' separately'}
- You are ONLY generating the JavaScript that adds interactivity
- DO NOT include any HTML or CSS in your response

**CRITICAL REQUIREMENTS:**
- This is PURE JavaScript ONLY for a SECTION/COMPONENT (not a full page)
- NO markdown code fences - NO \`\`\`javascript or \`\`\` markers
- NO <script> tags, NO <html> tags, NO <style> tags, NO HTML/CSS markup whatsoever
- NO explanatory text before or after the code
- Use vanilla JavaScript (ES6+)
- Add interactivity, animations, or dynamic functionality as needed
- Include event listeners for user interactions (clicks, hovers, scrolls, etc.)
- Use modern patterns (arrow functions, destructuring, etc.)
- Add error handling where appropriate
- Include helpful comments
- Keep it modular and scoped to avoid conflicts
- Use query selectors that target the specific section classes from the HTML
- Wrap code in IIFE or use const/let to avoid global scope pollution
- Use DOMContentLoaded or defer execution if needed

OUTPUT FORMAT: Start immediately with JavaScript code (e.g., (function() { or const pricing = ...) and end with the last semicolon or closing brace. If no JavaScript is needed, output ONLY a comment like: // No JavaScript needed for this static section

NOTHING else. No markdown. No explanations.`,
    };

    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      prompt: prompts[type],
      temperature: 0.7,
    });

    console.log(`✅ Streaming ${type.toUpperCase()} response`);

    // Create custom response with usage tracking
    const textStream = result.textStream;
    const usagePromise = result.usage;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the generated text
          for await (const chunk of textStream) {
            controller.enqueue(encoder.encode(chunk));
          }

          // Wait for usage data
          const usage = await usagePromise;
          console.log(`📊 ${type.toUpperCase()} generation usage:`, {
            model,
            inputTokens: usage.promptTokens,
            outputTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
          });

          // Append usage as JSON at the end (with delimiter)
          const usageData = {
            _usage: {
              model,
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens,
              type,
            }
          };
          controller.enqueue(encoder.encode(`\n\n__USAGE__${JSON.stringify(usageData)}__END__`));

          controller.close();
        } catch (error) {
          console.error(`❌ Stream error for ${type}:`, error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Model': model,
      },
    });

  } catch (error: any) {
    console.error('❌ HTML generation error:', error);
    return Response.json(
      {
        error: error.message || 'HTML generation failed',
      },
      { status: 500 }
    );
  }
}
