// HTML to Widget Conversion API - Hybrid Approach
// 1. Parse HTML programmatically to guarantee all controls
// 2. Use AI to organize and enhance them intelligently

import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const maxDuration = 60;

interface ParsedElement {
  tag: string;
  classes: string[];
  id?: string;
  attributes: Record<string, string>;
  textContent?: string;
  children: ParsedElement[];
  requiredControls: string[];
}

// Programmatic HTML parser - guarantees nothing is missed
function parseHTMLStructure(html: string): ParsedElement[] {
  const elements: ParsedElement[] = [];

  // Regex patterns for different element types
  const patterns = {
    heading: /<(h[1-6])[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/\1>/gi,
    paragraph: /<p[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/p>/gi,
    button: /<button[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/button>/gi,
    link: /<a[^>]*class=["']([^"']*)["'][^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
    image: /<img[^>]*class=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*\/?>/gi,
    video: /<video[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/video>/gi,
    div: /<div[^>]*class=["']([^"']*)["'][^>]*id=["']([^"']*)["'][^>]*>/gi,
    section: /<section[^>]*class=["']([^"']*)["'][^>]*>/gi,
    input: /<input[^>]*type=["']([^"']*)["'][^>]*class=["']([^"']*)["'][^>]*\/?>/gi,
    textarea: /<textarea[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/textarea>/gi,
    select: /<select[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/select>/gi,
    iframe: /<iframe[^>]*class=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*><\/iframe>/gi,
    svg: /<svg[^>]*class=["']([^"']*)["'][^>]*>(.*?)<\/svg>/gi,
  };

  // Map element types to required controls
  const controlMap: Record<string, string[]> = {
    h1: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING'],
    h2: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING'],
    h3: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING'],
    h4: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING'],
    h5: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING'],
    h6: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'TEXT_SHADOW', 'MARGIN', 'PADDING'],
    p: ['TEXT', 'TYPOGRAPHY', 'COLOR', 'MARGIN', 'PADDING'],
    button: ['TEXT', 'URL', 'TYPOGRAPHY', 'COLOR', 'HOVER_COLOR', 'BG_COLOR', 'HOVER_BG', 'BORDER', 'BORDER_RADIUS', 'BOX_SHADOW', 'PADDING'],
    a: ['TEXT', 'URL', 'TYPOGRAPHY', 'COLOR', 'HOVER_COLOR'],
    img: ['MEDIA', 'ALT', 'WIDTH', 'HEIGHT', 'OBJECT_FIT', 'BORDER', 'BORDER_RADIUS', 'BOX_SHADOW', 'CSS_FILTERS'],
    video: ['MEDIA', 'AUTOPLAY', 'LOOP', 'MUTED', 'CONTROLS', 'POSTER', 'WIDTH', 'HEIGHT', 'BORDER', 'BORDER_RADIUS'],
    div: ['BG_COLOR', 'BG_IMAGE', 'BORDER', 'BORDER_RADIUS', 'BOX_SHADOW', 'PADDING', 'MARGIN', 'WIDTH', 'HEIGHT'],
    section: ['BG_COLOR', 'BG_IMAGE', 'BORDER', 'PADDING', 'MARGIN'],
    input: ['PLACEHOLDER', 'DEFAULT_VALUE', 'REQUIRED', 'BORDER', 'BG_COLOR', 'TEXT_COLOR', 'FOCUS_COLOR'],
    textarea: ['PLACEHOLDER', 'DEFAULT_VALUE', 'ROWS', 'BORDER', 'BG_COLOR', 'TEXT_COLOR'],
    select: ['OPTIONS', 'DEFAULT', 'BORDER', 'BG_COLOR', 'TEXT_COLOR'],
    iframe: ['URL', 'WIDTH', 'HEIGHT', 'BORDER', 'ALLOW_FULLSCREEN'],
    svg: ['SVG_CODE', 'COLOR', 'WIDTH', 'HEIGHT', 'ROTATION'],
  };

  // Parse HTML and build element structure
  Object.entries(patterns).forEach(([type, pattern]) => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const tag = match[1] || type;
      const classes = (match[2] || match[1] || '').split(' ').filter(Boolean);

      elements.push({
        tag,
        classes,
        id: match[3] || undefined,
        attributes: {},
        textContent: match[3] || match[2] || '',
        children: [],
        requiredControls: controlMap[tag] || controlMap[type] || [],
      });
    }
  });

  return elements;
}

export async function POST(req: Request) {
  try {
    const {
      html,
      css = '',
      js = '',
      description = '',
      model = 'anthropic/claude-sonnet-4-5-20250929',
    }: {
      html: string;
      css?: string;
      js?: string;
      description?: string;
      model?: string;
    } = await req.json();

    console.log('🔄 Converting HTML to Elementor Widget...');

    // Step 1: Programmatic parsing (guarantees completeness)
    const parsedElements = parseHTMLStructure(html);

    console.log(`📊 Parsed ${parsedElements.length} elements programmatically`);

    // Create structured data about what controls are needed
    const elementSummary = parsedElements.map(el => ({
      type: el.tag,
      classes: el.classes.join(' '),
      id: el.id,
      text: el.textContent?.substring(0, 50),
      controlsNeeded: el.requiredControls,
    }));

    // Step 2: AI Enhancement Layer with Elementor Best Practices
    const enhancementPrompt = `You are an expert Elementor widget developer following strict best practices for inline CSS and dynamic controls.

**YOUR TASK:** Generate a complete, production-ready Elementor widget PHP class with embedded CSS in the render() method.

**CRITICAL CSS RULES (MUST FOLLOW):**

1. **INLINE CSS IN <style> TAG**: ALL CSS must be embedded in the render() method using a <style> tag. NO separate CSS files.

2. **STRUCTURAL CSS ONLY IN <style>**: The inline <style> tag should ONLY contain:
   - Layout (display, grid, flexbox, position)
   - Spacing structure (gap, aspect-ratio)
   - Transitions and animations
   - Responsive breakpoints (@media)
   - Transform effects

3. **NO HARDCODED COLORS/TYPOGRAPHY IN CSS**: Colors, backgrounds, font-family, font-size, font-weight MUST use Elementor controls with 'selectors'

4. **USE GLOBAL DEFAULTS**: All color/typography controls should default to empty string (uses Elementor global colors/typography)

5. **{{WRAPPER}} SCOPING**: Every CSS rule MUST use {{WRAPPER}} prefix to prevent global style leaking

**GOOD EXAMPLE (Structural CSS + Dynamic Controls):**
\`\`\`php
protected function render() {
    $settings = $this->get_settings_for_display();
    ?>
    <style>
    {{WRAPPER}} .hero-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        transition: all 0.3s ease;
    }

    @media (max-width: 768px) {
        {{WRAPPER}} .hero-container {
            grid-template-columns: 1fr;
        }
    }
    </style>

    <div class="hero-container">
        <h1><?php echo esc_html($settings['title']); ?></h1>
    </div>
    <?php
}

// In register_controls():
$this->add_control('hero_bg_color', [
    'label' => 'Background Color',
    'type' => \\Elementor\\Controls_Manager::COLOR,
    'default' => '', // Empty = uses global default
    'selectors' => [
        '{{WRAPPER}} .hero-container' => 'background-color: {{VALUE}}'
    ]
]);

$this->add_group_control(
    \\Elementor\\Group_Control_Typography::get_type(),
    [
        'name' => 'title_typography',
        'selector' => '{{WRAPPER}} h1',
    ]
);
\`\`\`

**BAD EXAMPLE (DO NOT DO THIS):**
\`\`\`php
<style>
{{WRAPPER}} .hero-container {
    background-color: #667eea; /* ❌ WRONG - use control */
    color: white; /* ❌ WRONG - use control */
    font-family: Arial; /* ❌ WRONG - use typography control */
    padding: 40px; /* ❌ WRONG - use spacing control */
}
</style>
\`\`\`

**PARSED ELEMENTS:**
${JSON.stringify(elementSummary, null, 2)}

**ORIGINAL HTML:**
\`\`\`html
${html}
\`\`\`

**ORIGINAL CSS (convert to structural + controls):**
\`\`\`css
${css}
\`\`\`

**ORIGINAL JAVASCRIPT (embed in render() if needed):**
\`\`\`javascript
${js}
\`\`\`

**DESCRIPTION:** ${description || 'Convert this HTML section to an Elementor widget'}

**ADDITIONAL REQUIREMENTS:**

1. **GUARANTEE ALL CONTROLS**: For each element in the parsed list, create ALL the controls specified in "controlsNeeded"

2. **PRESERVE STRUCTURE**: The render() method must output HTML that matches the original structure exactly

3. **ORGANIZE INTELLIGENTLY**: Group related controls into logical sections:
   - Content Tab: Text content, images, links, media
   - Style Tab: Typography, colors, backgrounds, borders, shadows, spacing
   - Advanced Tab: Custom CSS, Custom JS, animations, visibility

4. **ELEMENT CLASS/ID DISPLAY**: In every control description, show the CSS selector:
   \`'description' => 'CSS Selector: .class-name | ID: #element-id'\`

5. **SEMANTIC NAMING**: Use intelligent control names based on context (e.g., "hero_title" not "text_1")

6. **RESPONSIVE CONTROLS**: Use add_responsive_control() for spacing, dimensions where appropriate

7. **NO SHORTCUTS**: Do not skip ANY element. Every element must have corresponding controls.

**OUTPUT FORMAT:**
Generate the complete PHP widget class with:
- <?php opening tag
- Proper class definition extending \\Elementor\\Widget_Base
- Complete register_controls() with all controls
- render() method with embedded <style> tag + HTML output
- NO separate CSS/JS file references

Start generating now:`;

    // Stream the AI-enhanced widget generation
    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      prompt: enhancementPrompt,
      temperature: 0.7,
    });

    console.log('✅ Streaming AI-enhanced widget generation');

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('❌ HTML to Widget conversion error:', error);
    return Response.json(
      {
        error: error.message || 'Conversion failed',
      },
      { status: 500 }
    );
  }
}
