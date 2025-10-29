import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const maxDuration = 60;

// OpenRouter configuration (direct, not via AI Gateway due to Cloudflare config requirements)
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENROUTER_API_KEY || '',
  headers: {
    'HTTP-Referer': 'https://hustle-tools.vercel.app',
    'X-Title': 'Hustle Tools - Style Kit Cleanup',
  },
});

/**
 * AI Cleanup API for Elementor Style Kits
 * Uses Claude Haiku 4.5 via AI Gateway to validate and refine generated Style Kits
 */
export async function POST(req: Request) {
  try {
    const { styleKit, brandAnalysis } = await req.json();

    if (!styleKit) {
      return Response.json({ error: 'Style Kit is required' }, { status: 400 });
    }

    // Build context about the brand
    const brandContext = brandAnalysis ? `
Brand Context:
- Colors: ${brandAnalysis.colors.map((c: any) => `${c.hex} (${c.category || 'unknown'})`).join(', ')}
- Fonts: ${brandAnalysis.fonts.map((f: any) => `${f.family} (weights: ${f.weights?.join(', ') || 'unknown'})`).join(', ')}
` : '';

    // Use Claude Haiku 4.5 via OpenRouter to analyze and clean up the Style Kit
    const { text } = await generateText({
      model: openrouter('anthropic/claude-4.5-haiku'),
      temperature: 0.3,
      maxTokens: 8000,
      messages: [
        {
          role: 'user',
          content: `You are an expert in Elementor WordPress theme configuration and design systems. Analyze and improve this Elementor Style Kit JSON to create a production-ready, accessible, and visually balanced design system.

${brandContext}

Current Style Kit JSON:
${JSON.stringify(styleKit, null, 2)}

## ELEMENTOR STYLE KIT BEST PRACTICES:

### Typography Structure:
- **system_typography**: 4 presets (Primary, Secondary, Text, Accent) - these are GLOBAL typography styles
- **custom_typography**: Up to 6 custom presets (Primary Heading, Secondary Heading, Body Text, Caption, Small Text, Accent Text)
- **H1-H6**: Individual heading configurations with proper hierarchy
  - H1: 48-72px, weight 700-900 (hero/display headings)
  - H2: 36-48px, weight 600-700 (section headings)
  - H3: 28-36px, weight 600 (subsection headings)
  - H4: 20-24px, weight 600 (card/widget titles)
  - H5: 16-20px, weight 600 (small headings)
  - H6: 14-16px, weight 600-700 (labels/metadata)

### Color Best Practices:
- **Primary color**: Brand's main color - use for CTAs, primary buttons, links
- **Secondary color**: Supporting brand color - for secondary actions
- **Text color**: MUST be dark enough for readability (avoid neon/bright colors for body text)
  - Light backgrounds: Use #202020, #333333, or similar dark grays for text
  - Dark backgrounds: Use #FFFFFF, #F5F5F5, or light grays for text
- **Accent color**: Highlight color - for emphasis, badges, hover states
- **Never use primary brand color as text color** if it's neon, bright, or low-contrast

### Typography Field Structure (each typography preset needs):
{
  "_id": "unique_id",
  "title": "Display Name",
  "typography_typography": "custom",
  "typography_font_family": "Font Name",
  "typography_font_size": { "unit": "px", "size": 16, "sizes": [] },
  "typography_font_size_tablet": { "unit": "px", "size": 14, "sizes": [] },
  "typography_font_size_mobile": { "unit": "px", "size": 14, "sizes": [] },
  "typography_font_weight": "400",
  "typography_line_height": { "unit": "em", "size": 1.6, "sizes": [] },
  "typography_letter_spacing": { "unit": "px", "size": 0, "sizes": [] },
  "typography_text_transform": "none",
  "typography_font_style": "normal",
  "typography_text_decoration": "none"
}

### Required Fields to Fill:
1. **body_typography**: Main body text (16px, weight 400, line-height 1.6-1.8)
2. **button_typography**: Button text (14-16px, weight 500-600)
3. **form_field_typography**: Form input text
4. **link_typography**: Link styling with hover states
5. **All H1-H6 must be complete** with proper responsive sizing

### Color Assignment Logic:
- **body_color**: Use text color (dark for light bg, light for dark bg)
- **link_normal_color**: Use primary or accent color
- **button_background_color**: Use primary color
- **button_text_color**: Use contrasting color (white for dark buttons, dark for light buttons)
- **form_field_border_color**: Use neutral/border color (not primary)

### Validation Checklist:
1. ✅ Font families are real Google Fonts or web-safe fonts
2. ✅ Font weights exist for the specified font family
3. ✅ All hex codes are valid 6-character codes
4. ✅ Text colors have sufficient contrast (WCAG AA minimum)
5. ✅ Typography hierarchy is logical (H1 > H2 > H3 > H4 > H5 > H6)
6. ✅ Line heights are readable (1.3-1.8 for body, 1.2-1.4 for headings)
7. ✅ Font sizes have responsive breakpoints (desktop/tablet/mobile)
8. ✅ All typography presets have "typography_typography": "custom"
9. ✅ Button, form, and body typography are fully defined
10. ✅ Colors are semantically assigned (not random)

### Common Fixes Needed:
- If primary color is neon/bright (e.g., #00FF00), DON'T use it for text color
- If typography_font_family is set but typography_typography is missing, add "typography_typography": "custom"
- If font_size is set but line_height is missing, add appropriate line_height
- If H1-H6 are missing responsive sizes, add tablet/mobile variants
- If button_text_color is same as button_background_color, fix contrast
- Fill in ALL missing typography fields using the brand fonts provided

### Your Task:
1. Validate all fonts are real and weights exist
2. Ensure colors are semantically correct and accessible
3. **FILL IN ALL MISSING TYPOGRAPHY FIELDS** - don't leave them empty
4. Add responsive font sizes for all typography (desktop/tablet/mobile)
5. Ensure proper typography hierarchy
6. Fix any contrast issues
7. Add missing fields like body_typography, button_typography, form_field_typography
8. Ensure line heights are set for all typography
9. Make sure text colors are readable (not neon/bright colors)
10. Apply brand fonts to ALL typography presets

Return ONLY a valid JSON object with this structure:
{
  "cleanedStyleKit": { /* the improved Style Kit JSON with ALL fields filled */ },
  "changes": [
    "Detailed description of each change made"
  ],
  "warnings": [
    "Any issues that couldn't be automatically fixed"
  ]
}

**CRITICAL**: Be thorough - fill in ALL missing typography fields. Don't leave body_typography, button_typography, form_field_typography, or H1-H6 empty. Use the brand fonts provided to create a complete, production-ready Style Kit.`,
        },
      ],
    });

    // Parse the AI response
    let result;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return Response.json({
        error: 'Failed to parse AI response',
        rawResponse: text,
      }, { status: 500 });
    }

    return Response.json(result);
  } catch (error: any) {
    console.error('AI cleanup error:', error);
    return Response.json({
      error: error.message || 'Failed to clean up Style Kit',
    }, { status: 500 });
  }
}
