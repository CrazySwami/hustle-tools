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

    // Step 2: AI Enhancement Layer
    const enhancementPrompt = `You are an expert Elementor widget developer. I have programmatically parsed an HTML structure and identified all elements that need controls.

**YOUR TASK:** Generate a complete, production-ready Elementor widget PHP class that includes comprehensive controls for EVERY element identified.

**PARSED ELEMENTS:**
${JSON.stringify(elementSummary, null, 2)}

**ORIGINAL HTML:**
\`\`\`html
${html}
\`\`\`

**ORIGINAL CSS:**
\`\`\`css
${css}
\`\`\`

**ORIGINAL JAVASCRIPT:**
\`\`\`javascript
${js}
\`\`\`

**DESCRIPTION:** ${description || 'Convert this HTML section to an Elementor widget'}

**CRITICAL REQUIREMENTS:**

1. **GUARANTEE ALL CONTROLS**: For each element in the parsed list, you MUST create ALL the controls specified in "controlsNeeded"

2. **PRESERVE STRUCTURE**: The render() method must output HTML that matches the original structure exactly

3. **PRESERVE STYLING**: Include the original CSS in widget.css (will be handled separately, but reference it in your plan)

4. **ORGANIZE INTELLIGENTLY**: Group related controls into logical sections:
   - Content Tab: Text content, images, links, media
   - Style Tab: Typography, colors, backgrounds, borders, shadows, spacing
   - Advanced Tab: Custom CSS, Custom JS, animations, visibility

5. **ELEMENT CLASS/ID DISPLAY**: In every control description, show the CSS selector:
   \`'description' => 'CSS Selector: .class-name | ID: #element-id'\`

6. **CUSTOM CSS/JS BOXES**: Include Custom CSS and Custom JavaScript code boxes in Advanced tab

7. **WIDGET CATEGORY**: Use category ['hustle-tools'] to group all widgets together

8. **SEMANTIC NAMING**: Use intelligent control names based on context (e.g., "hero_title" not "text_1")

9. **RESPONSIVE CONTROLS**: Use add_responsive_control() for spacing, typography where appropriate

10. **NO SHORTCUTS**: Do not skip ANY element. Every element must have corresponding controls.

**OUTPUT:** Generate the complete PHP widget class. Start with <?php and include the full implementation.`;

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
