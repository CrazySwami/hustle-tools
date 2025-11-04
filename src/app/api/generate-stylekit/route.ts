import { generateText } from 'ai';
import defaultTemplate from '@/lib/default-stylekit-template.json';

export const maxDuration = 60;

// STAGE 1: Generate brand colors (4 system colors + custom colors if needed)
const STAGE1_COLORS_PROMPT = `Generate brand color palette. Return ONLY valid JSON.

GENERATE:
{
  "system_colors": [
    {"_id": "primary", "title": "Primary", "color": "#HEX"},
    {"_id": "secondary", "title": "Secondary", "color": "#HEX"},
    {"_id": "text", "title": "Text", "color": "#HEX"},
    {"_id": "accent", "title": "Accent", "color": "#HEX"}
  ],
  "custom_colors": [
    {"_id": "custom1", "title": "Custom Color Name", "color": "#HEX"}
  ]
}

RULES:
- Use provided brand colors for primary/secondary/accent
- Generate complementary colors if only 1-2 brand colors provided
- Text color must have WCAG AA contrast (4.5:1)
- Add 2-3 custom_colors for additional brand colors if available`;

// STAGE 2: Generate font selections and system typography with COMPLETE structure
const STAGE2_FONTS_PROMPT = `Generate typography font selections with COMPLETE nested structure. Return ONLY valid JSON.

YOU HAVE ACCESS TO:
- Brand colors: {{COLORS}}

GENERATE COMPLETE system_typography array (ALL 4 items with ALL nested properties):
{
  "primary_font": "Font Name for headings",
  "secondary_font": "Font Name for body text",
  "system_typography": [
    {
      "_id": "primary",
      "title": "Primary",
      "typography_typography": "custom",
      "typography_font_family": "Font Name",
      "typography_font_size": {"unit": "px", "size": 48, "sizes": []},
      "typography_font_size_tablet": {"unit": "px", "size": 40, "sizes": []},
      "typography_font_size_mobile": {"unit": "px", "size": 32, "sizes": []},
      "typography_font_weight": "700",
      "typography_line_height": {"unit": "em", "size": 1.3, "sizes": []},
      "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []},
      "typography_text_transform": "none",
      "typography_font_style": "normal",
      "typography_text_decoration": "none"
    },
    {
      "_id": "secondary",
      "title": "Secondary",
      "typography_typography": "custom",
      "typography_font_family": "Font Name",
      "typography_font_size": {"unit": "px", "size": 32, "sizes": []},
      "typography_font_size_tablet": {"unit": "px", "size": 28, "sizes": []},
      "typography_font_size_mobile": {"unit": "px", "size": 24, "sizes": []},
      "typography_font_weight": "600",
      "typography_line_height": {"unit": "em", "size": 1.4, "sizes": []},
      "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []}
    },
    {
      "_id": "text",
      "title": "Text",
      "typography_typography": "custom",
      "typography_font_family": "Font Name",
      "typography_font_size": {"unit": "px", "size": 16, "sizes": []},
      "typography_font_size_tablet": {"unit": "px", "size": 16, "sizes": []},
      "typography_font_size_mobile": {"unit": "px", "size": 14, "sizes": []},
      "typography_font_weight": "400",
      "typography_line_height": {"unit": "em", "size": 1.6, "sizes": []}
    },
    {
      "_id": "accent",
      "title": "Accent",
      "typography_typography": "custom",
      "typography_font_family": "Font Name",
      "typography_font_size": {"unit": "px", "size": 14, "sizes": []},
      "typography_font_size_tablet": {"unit": "px", "size": 14, "sizes": []},
      "typography_font_size_mobile": {"unit": "px", "size": 12, "sizes": []},
      "typography_font_weight": "500",
      "typography_line_height": {"unit": "em", "size": 1.5, "sizes": []}
    }
  ]
}

RULES:
- Use provided brand fonts if available
- Primary font for headings, secondary for body (can be same)
- Use Google Fonts or web-safe fonts only
- MUST include ALL nested properties shown above (sizes, line-height, etc.)`;

// STAGE 3: Generate all heading typography (h1-h6) with responsive sizes
const STAGE3_HEADINGS_PROMPT = `Generate heading typography (h1-h6). Return ONLY valid JSON.

YOU HAVE ACCESS TO:
- Brand colors: {{COLORS}}
- Selected fonts: {{FONTS}}

GENERATE:
{
  "h1_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{PRIMARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 56, "sizes": []},
    "typography_font_size_tablet": {"unit": "px", "size": 40, "sizes": []},
    "typography_font_size_mobile": {"unit": "px", "size": 32, "sizes": []},
    "typography_font_weight": "700",
    "typography_line_height": {"unit": "em", "size": 1.35, "sizes": []},
    "typography_letter_spacing": {"unit": "px", "size": -1, "sizes": []},
    "typography_text_color": "#HEX"
  },
  "h2_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{PRIMARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 40, "sizes": []},
    "typography_font_size_tablet": {"unit": "px", "size": 32, "sizes": []},
    "typography_font_size_mobile": {"unit": "px", "size": 24, "sizes": []},
    "typography_font_weight": "600",
    "typography_line_height": {"unit": "em", "size": 1.4, "sizes": []},
    "typography_letter_spacing": {"unit": "px", "size": -0.5, "sizes": []},
    "typography_text_color": "#HEX"
  },
  "h3_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{PRIMARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 32, "sizes": []},
    "typography_font_size_tablet": {"unit": "px", "size": 28, "sizes": []},
    "typography_font_size_mobile": {"unit": "px", "size": 20, "sizes": []},
    "typography_font_weight": "600",
    "typography_line_height": {"unit": "em", "size": 1.4, "sizes": []},
    "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []},
    "typography_text_color": "#HEX"
  },
  "h4_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{PRIMARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 24, "sizes": []},
    "typography_font_size_tablet": {"unit": "px", "size": 20, "sizes": []},
    "typography_font_size_mobile": {"unit": "px", "size": 18, "sizes": []},
    "typography_font_weight": "600",
    "typography_line_height": {"unit": "em", "size": 1.5, "sizes": []},
    "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []},
    "typography_text_color": "#HEX"
  },
  "h5_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{PRIMARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 18, "sizes": []},
    "typography_font_size_tablet": {"unit": "px", "size": 16, "sizes": []},
    "typography_font_size_mobile": {"unit": "px", "size": 14, "sizes": []},
    "typography_font_weight": "600",
    "typography_line_height": {"unit": "em", "size": 1.5, "sizes": []},
    "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []},
    "typography_text_color": "#HEX"
  },
  "h6_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{PRIMARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 14, "sizes": []},
    "typography_font_size_tablet": {"unit": "px", "size": 14, "sizes": []},
    "typography_font_size_mobile": {"unit": "px", "size": 12, "sizes": []},
    "typography_font_weight": "700",
    "typography_text_transform": "uppercase",
    "typography_letter_spacing": {"unit": "px", "size": 1, "sizes": []},
    "typography_line_height": {"unit": "em", "size": 1.6, "sizes": []},
    "typography_text_color": "#HEX"
  },
  "body_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{SECONDARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 16, "sizes": []},
    "typography_font_size_tablet": {"unit": "px", "size": 16, "sizes": []},
    "typography_font_size_mobile": {"unit": "px", "size": 14, "sizes": []},
    "typography_font_weight": "400",
    "typography_line_height": {"unit": "em", "size": 1.6, "sizes": []},
    "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []}
  },
  "body_color": "#HEX",
  "link_normal_color": "#HEX"
}

RULES:
- H1 largest (48-64px), H6 smallest (14-16px)
- Line height increases as size decreases (1.2 → 1.6)
- Mobile sizes 60-70% of desktop
- Use primary color for headings`;

// STAGE 4: Generate component styles (buttons, forms, images)
const STAGE4_COMPONENTS_PROMPT = `Generate component styles (buttons, forms, images). Return ONLY valid JSON.

YOU HAVE ACCESS TO:
- Brand colors: {{COLORS}}
- Selected fonts: {{FONTS}}

GENERATE:
{
  "button_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{PRIMARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 16, "sizes": []},
    "typography_font_weight": "600",
    "typography_line_height": {"unit": "em", "size": 1.3, "sizes": []},
    "typography_text_transform": "uppercase",
    "typography_letter_spacing": {"unit": "px", "size": 0.5, "sizes": []}
  },
  "button_background_color": "#HEX",
  "button_text_color": "#FFFFFF",
  "button_border_width": {"unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": true},
  "button_border_radius": {"unit": "px", "top": "5", "right": "5", "bottom": "5", "left": "5", "isLinked": true},
  "form_field_typography": {
    "typography_typography": "custom",
    "typography_font_family": "{{SECONDARY_FONT}}",
    "typography_font_size": {"unit": "px", "size": 16, "sizes": []},
    "typography_font_weight": "400",
    "typography_line_height": {"unit": "em", "size": 1.5, "sizes": []},
    "typography_text_transform": "none",
    "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []}
  },
  "form_field_text_color": "#HEX",
  "form_field_background_color": "#FFFFFF",
  "form_field_border_color": "#DDDDDD",
  "form_field_border_width": {"unit": "px", "top": "1", "right": "1", "bottom": "1", "left": "1", "isLinked": true},
  "form_field_border_radius": {"unit": "px", "top": "3", "right": "3", "bottom": "3", "left": "3", "isLinked": true},
  "container_width": {"unit": "px", "size": 1200, "sizes": []},
  "space_between_widgets": {"column": "20", "row": "20", "isLinked": true, "unit": "px"},
  "viewport_md": 768,
  "viewport_lg": 1025
}

RULES:
- Button hover 10-20% darker than base
- Form focus uses primary/accent color
- Maintain 4px/8px spacing patterns`;

// Helper: Deep merge objects
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Helper: Clean and parse AI JSON response
function parseAIResponse(text: string): any {
  let cleanedText = text.trim();
  cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  return JSON.parse(cleanedText);
}

export async function POST(req: Request) {
  try {
    const { model, brandfetchData, stylePreferences, industry } = await req.json();

    // Validate inputs
    if (!model || !['claude-haiku-4.5', 'gpt-5'].includes(model)) {
      return new Response(JSON.stringify({ error: 'Invalid model selection' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Map to AI Gateway model format (provider/model) - routes through your AI_GATEWAY_API_KEY
    let selectedModel: string;
    switch (model) {
      case 'claude-haiku-4.5':
        selectedModel = 'anthropic/claude-haiku-4.5-20250110';
        break;
      case 'gpt-5':
        selectedModel = 'openai/gpt-5';
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid model' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    // Build base context for all stages
    let baseContext = '';
    if (brandfetchData?.colors?.length) {
      baseContext += `\nBrand Colors Available: ${brandfetchData.colors.join(', ')}`;
    }
    if (brandfetchData?.fonts?.length) {
      baseContext += `\nBrand Fonts Available: ${brandfetchData.fonts.join(', ')}`;
    }
    if (stylePreferences) {
      baseContext += `\nStyle Preferences: ${stylePreferences}`;
    }
    if (industry) {
      baseContext += `\nIndustry: ${industry}`;
    }

    // Start with base template
    let styleKit = JSON.parse(JSON.stringify(defaultTemplate));

    // ===== STAGE 1: Generate Colors =====
    console.log('🎨 Stage 1: Generating colors...');
    const stage1Result = await generateText({
      model: selectedModel,
      prompt: STAGE1_COLORS_PROMPT + baseContext,
      temperature: 0.7,
      maxTokens: 1000,
    });

    const stage1Data = parseAIResponse(stage1Result.text);
    styleKit = deepMerge(styleKit, stage1Data);

    // ===== STAGE 2: Generate Fonts =====
    console.log('🔤 Stage 2: Generating typography...');
    const colorsContext = `\nGenerated Colors: ${JSON.stringify(stage1Data.system_colors)}`;
    const stage2Result = await generateText({
      model: selectedModel,
      prompt: STAGE2_FONTS_PROMPT.replace('{{COLORS}}', colorsContext) + baseContext,
      temperature: 0.7,
      maxTokens: 3000, // Increased for complete nested structure
    });

    const stage2Data = parseAIResponse(stage2Result.text);
    styleKit = deepMerge(styleKit, stage2Data);

    // ===== STAGE 3: Generate Heading Typography =====
    console.log('📐 Stage 3: Generating heading styles...');
    const fontsContext = `\nPrimary Font: ${stage2Data.primary_font}\nSecondary Font: ${stage2Data.secondary_font}`;
    const stage3Result = await generateText({
      model: selectedModel,
      prompt: STAGE3_HEADINGS_PROMPT
        .replace('{{COLORS}}', colorsContext)
        .replace('{{FONTS}}', fontsContext)
        .replace(/\{\{PRIMARY_FONT\}\}/g, stage2Data.primary_font || 'Roboto')
        .replace(/\{\{SECONDARY_FONT\}\}/g, stage2Data.secondary_font || 'Roboto'),
      temperature: 0.7,
      maxTokens: 3000, // Increased for complete nested structures
    });

    const stage3Data = parseAIResponse(stage3Result.text);
    styleKit = deepMerge(styleKit, stage3Data);

    // ===== STAGE 4: Generate Component Styles =====
    console.log('🎛️ Stage 4: Generating component styles...');
    const stage4Result = await generateText({
      model: selectedModel,
      prompt: STAGE4_COMPONENTS_PROMPT
        .replace('{{COLORS}}', colorsContext)
        .replace('{{FONTS}}', fontsContext)
        .replace(/\{\{PRIMARY_FONT\}\}/g, stage2Data.primary_font || 'Roboto')
        .replace(/\{\{SECONDARY_FONT\}\}/g, stage2Data.secondary_font || 'Roboto'),
      temperature: 0.7,
      maxTokens: 2000,
    });

    const stage4Data = parseAIResponse(stage4Result.text);
    styleKit = deepMerge(styleKit, stage4Data);

    // Add title if provided
    if (stylePreferences) {
      const brandName = stylePreferences.split(' ').slice(0, 3).join(' ');
      styleKit.title = `${brandName} Style Kit` || 'Generated Style Kit';
    }

    console.log('✅ Complete Style Kit generated with all 180 fields');

    // Return complete Style Kit
    return new Response(JSON.stringify(styleKit), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Style Kit generation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
