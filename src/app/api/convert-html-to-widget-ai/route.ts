// AI-based HTML to Elementor Widget converter using Claude Sonnet 4.5
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

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
    const anthropic = createAnthropic({
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: 'https://gateway.ai.cloudflare.com/v1/6f90d9dd78ebf00d5d3e7c0e20c68d0f/hustle-tools/anthropic',
    });

    const prompt = `You are an expert Elementor widget developer. I have programmatically parsed an HTML structure and identified all elements that need controls.

**YOUR TASK:** Generate a complete, production-ready Elementor widget PHP class that includes comprehensive controls for EVERY element identified.

**PARSED ELEMENTS:**
${JSON.stringify(parsedElements, null, 2)}

**ORIGINAL HTML:**
\`\`\`html
${html}
\`\`\`

**ORIGINAL CSS:**
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

**CRITICAL REQUIREMENTS:**

1. **CORRECT CLASS STRUCTURE**: The widget MUST extend \`\\Elementor\\Widget_Base\` (with double backslash). Example:
   \`\`\`php
   class My_Widget extends \\Elementor\\Widget_Base {
   \`\`\`

2. **REQUIRED METHODS**: Include these EXACT methods:
   - \`public function get_name()\` - Return widget slug
   - \`public function get_title()\` - Return widget title
   - \`public function get_icon()\` - Return Elementor icon class
   - \`public function get_categories()\` - Return \`['hustle-tools']\`
   - \`protected function register_controls()\` - Register ALL controls
   - \`protected function render()\` - Output the HTML

3. **GUARANTEE ALL CONTROLS**: For each element in the parsed list, you MUST create ALL the controls specified in "controlsNeeded"

4. **PRESERVE STRUCTURE**: The render() method must output HTML that matches the original structure exactly

5. **CSS SCOPING**: The CSS will be automatically scoped with {{WRAPPER}} prefix, so you can reference the original selectors in your PHP comments

6. **ORGANIZE INTELLIGENTLY**: Group related controls into logical sections:
   - Content Tab: Text content, images, links, media
   - Style Tab: Typography, colors, backgrounds, borders, shadows, spacing
   - Advanced Tab: Custom CSS, Custom JS, animations, visibility

7. **ELEMENT CLASS/ID DISPLAY**: In every control description, show the CSS selector:
   \`'description' => 'CSS Selector: .class-name | ID: #element-id'\`

8. **CUSTOM CSS/JS BOXES**: Include Custom CSS and Custom JavaScript code boxes in Advanced tab with the original CSS/JS as defaults

9. **WIDGET CATEGORY**: Use category ['hustle-tools'] to group all widgets together

10. **SEMANTIC NAMING**: Use intelligent control names based on context (e.g., "hero_title" not "text_1")

11. **RESPONSIVE CONTROLS**: Use add_responsive_control() for spacing, typography where appropriate

12. **NO SHORTCUTS**: Do not skip ANY element. Every element must have corresponding controls.

13. **DYNAMIC RENDERING**: In the render() method, use \$settings = \$this->get_settings_for_display() and dynamically inject control values into the HTML

14. **ABSPATH CHECK**: Start with:
    \`\`\`php
    if ( ! defined( 'ABSPATH' ) ) {
        exit; // Exit if accessed directly
    }
    \`\`\`

**OUTPUT FORMAT:** Generate ONLY the complete PHP widget class. Start with:
\`\`\`php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ${widgetName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Widget extends \\Elementor\\Widget_Base {
    // ... implementation
}
\`\`\`

Do NOT include any text before <?php or after the closing }. ONLY output the PHP code.`;

    const result = streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
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
