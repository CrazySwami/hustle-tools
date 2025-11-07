import { generateText } from 'ai';
import defaultTemplate from '@/lib/default-stylekit-template.json';

export const maxDuration = 60;

// STAGE 1: Generate brand colors (4 system colors + custom colors if needed)
const STAGE1_COLORS_PROMPT = (context: string) => `**CRITICAL TASK: Generate brand color palette that EXACTLY matches user requirements**

${context}

**YOUR TASK WILL BE CONSIDERED FAILED IF:**
- You ignore "Brand Colors Available" listed above
- You use generic colors when specific brand colors are provided
- You do not prioritize user-specified colors above all else

**SUCCESS CRITERIA:**
1. If "Brand Colors Available" are listed above → YOU MUST USE THEM EXACTLY for primary/secondary/accent
2. If user mentions specific colors in "Style Preferences" → YOU MUST USE THEM
3. Only generate complementary colors if user provides 1-2 colors (not 4)
4. Text color must have WCAG AA contrast (4.5:1) against backgrounds

**REQUIRED OUTPUT FORMAT:**
{
  "system_colors": [
    {"_id": "primary", "title": "Primary", "color": "#HEX-FROM-USER-INPUT"},
    {"_id": "secondary", "title": "Secondary", "color": "#HEX-FROM-USER-INPUT"},
    {"_id": "text", "title": "Text", "color": "#HEX-ENSURE-CONTRAST"},
    {"_id": "accent", "title": "Accent", "color": "#HEX-FROM-USER-INPUT-OR-COMPLEMENT"}
  ],
  "custom_colors": [
    {"_id": "custom1", "title": "Descriptive Name", "color": "#HEX"}
  ]
}

**CRITICAL REMINDER:** User requirements in context above are MANDATORY. Following them = success. Ignoring them = failure.

Return ONLY valid JSON. No markdown, no explanations.`;

// STAGE 2: Generate font selections and system typography with COMPLETE structure
const STAGE2_FONTS_PROMPT = (context: string) => `**CRITICAL TASK: Select fonts that EXACTLY match user requirements - THIS IS THE MOST IMPORTANT PART**

${context}

**YOUR TASK WILL BE CONSIDERED FAILED IF:**
- You ignore "Brand Fonts Available" listed in context above
- You ignore font names mentioned in "Style Preferences" (e.g., "Use Futura", "Roboto for headings")
- You use placeholder names like "Font Name" instead of actual font names
- You choose random fonts when the user specified specific fonts

**ABSOLUTE PRIORITY - FONT SELECTION INSTRUCTIONS:**
1. **FIRST:** Check "Brand Fonts Available" in context above
   - If present, YOU MUST USE THESE FONTS EXACTLY AS LISTED
   - Example: If "Brand Fonts Available: Futura, Helvetica" → primary_font MUST be "Futura"

2. **SECOND:** Check "Style Preferences" for ANY font mentions
   - "Use Futura" → primary_font MUST be "Futura"
   - "Roboto for headings" → primary_font MUST be "Roboto"
   - "Inter for body text" → secondary_font MUST be "Inter"

3. **ONLY IF NO FONTS SPECIFIED:** Choose appropriate Google Fonts or web-safe fonts

**REQUIRED OUTPUT (ALL 4 system_typography items with COMPLETE nested properties):**
{
  "primary_font": "ACTUAL-FONT-NAME-FROM-USER-INPUT-OR-YOUR-CHOICE",
  "secondary_font": "ACTUAL-FONT-NAME-FROM-USER-INPUT-OR-YOUR-CHOICE",
  "system_typography": [
    {
      "_id": "primary",
      "title": "Primary",
      "typography_typography": "custom",
      "typography_font_family": "MUST-MATCH-primary_font-EXACTLY",
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
      "typography_font_family": "MUST-MATCH-primary_font-OR-secondary_font-IF-SPECIFIED",
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
      "typography_font_family": "MUST-MATCH-secondary_font-EXACTLY",
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
      "typography_font_family": "MUST-MATCH-primary_font-EXACTLY",
      "typography_font_size": {"unit": "px", "size": 14, "sizes": []},
      "typography_font_size_tablet": {"unit": "px", "size": 14, "sizes": []},
      "typography_font_size_mobile": {"unit": "px", "size": 12, "sizes": []},
      "typography_font_weight": "500",
      "typography_line_height": {"unit": "em", "size": 1.5, "sizes": []}
    }
  ]
}

**VALIDATION CHECKLIST (Check before responding):**
✓ Did I read "Brand Fonts Available" in context?
✓ Did I check "Style Preferences" for font mentions?
✓ Did I use those EXACT font names in my output?
✓ Are all typography_font_family values actual font names (not placeholders)?
✓ Do all 4 system_typography items have typography_font_family set?

**CRITICAL REMINDER:** 
- Using user-specified fonts = SUCCESS
- Ignoring user-specified fonts = FAILURE
- This is the #1 priority for this task

Return ONLY valid JSON. No markdown, no explanations.`;

// STAGE 3: Generate all heading typography (h1-h6) with responsive sizes
const STAGE3_HEADINGS_PROMPT = (context: string, primaryFont: string, secondaryFont: string) => `**CRITICAL TASK: Generate heading typography using EXACT fonts specified**

${context}

**YOUR TASK WILL BE CONSIDERED FAILED IF:**
- You change the font families specified below
- You ignore user color preferences from context above
- You use different fonts than what's provided in the template

**ABSOLUTE PRIORITY:**
- Primary Font: ${primaryFont} ← THIS MUST BE USED FOR ALL HEADINGS (H1-H6, Accent)
- Secondary Font: ${secondaryFont} ← THIS MUST BE USED FOR BODY TEXT
- These fonts were selected based on user requirements - DO NOT CHANGE THEM

**REQUIRED OUTPUT:**
{
  "h1_typography": {
    "typography_typography": "custom",
    "typography_font_family": "${primaryFont}",
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
    "typography_font_family": "${primaryFont}",
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
    "typography_font_family": "${primaryFont}",
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
    "typography_font_family": "${primaryFont}",
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
    "typography_font_family": "${primaryFont}",
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
    "typography_font_family": "${primaryFont}",
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
    "typography_font_family": "${secondaryFont}",
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

**VALIDATION CHECKLIST (Check before responding):**
✓ Did I use "${primaryFont}" for ALL headings (H1-H6)?
✓ Did I use "${secondaryFont}" for body_typography?
✓ Did I check context for color preferences?
✓ Did I keep font families EXACTLY as specified in template above?

**CRITICAL REMINDER:**
- Font families are PRE-SET based on user requirements - DO NOT MODIFY THEM
- Your job is to set sizes, weights, and colors that match the style preferences
- H1 largest (48-64px), H6 smallest (14-16px)
- Line height increases as size decreases (1.2 → 1.6)
- Mobile sizes 60-70% of desktop

Return ONLY valid JSON. No markdown, no explanations.`;

// STAGE 5: Generate image styles and layout settings
const STAGE5_IMAGES_LAYOUT_PROMPT = (context: string, primaryFont: string, secondaryFont: string) => `**CRITICAL TASK: Generate image styles and layout settings based on user requirements**

${context}

**YOUR TASK WILL BE CONSIDERED FAILED IF:**
- You ignore style preferences from context above
- You use generic values when user specifies preferences
- You don't consider the industry context for layout decisions

**ABSOLUTE PRIORITY:**
- Check "Style Preferences" for mentions of border radius, image styles, layout preferences
- Use brand colors from context for image placeholder colors
- Consider industry context for appropriate layout widths

**REQUIRED OUTPUT:**
{
  "image_styles": {
    "image_border_radius": {
      "unit": "px",
      "top": "8",
      "right": "8",
      "bottom": "8",
      "left": "8",
      "isLinked": true
    },
    "image_object_fit": "cover",
    "image_box_shadow": "0 4px 12px rgba(0,0,0,0.08)",
    "image_placeholder_color": "#HEX-FROM-BRAND-COLORS",
    "image_caption_typography": {
      "typography_typography": "custom",
      "typography_font_family": "${secondaryFont}",
      "typography_font_size": {"unit": "px", "size": 14, "sizes": []},
      "typography_font_weight": "400",
      "typography_line_height": {"unit": "em", "size": 1.4, "sizes": []},
      "typography_text_transform": "none",
      "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []}
    },
    "image_caption_color": "#HEX-FROM-BRAND-COLORS"
  },
  "container_width": {
    "unit": "px",
    "size": 1200,
    "sizes": []
  },
  "space_between_widgets": {
    "unit": "px",
    "size": 20,
    "sizes": []
  },
  "viewport_md": 768,
  "viewport_lg": 1025
}

**DESIGN GUIDELINES:**
- Border radius: Modern (8-12px) for rounded, 0px for sharp, 50px+ for pill/circle
- Image placeholder: Use muted version of primary or secondary brand color
- Container width: 1200px for standard, 1440px for wide, 960px for narrow
- Widget spacing: 20-40px for comfortable spacing, 10-20px for tight
- Breakpoints: Standard (768px tablet, 1025px desktop) or custom based on preferences

**VALIDATION CHECKLIST:**
✓ Did I check context for border radius preferences?
✓ Did I use brand colors for placeholder/caption colors?
✓ Did I consider industry context for layout width?
✓ Did I use ${secondaryFont} for image caption typography?

Return ONLY valid JSON. No markdown, no explanations.`;

// STAGE 4: Generate component styles (buttons, forms, images)
const STAGE4_COMPONENTS_PROMPT = (context: string, primaryFont: string, secondaryFont: string) => `**CRITICAL TASK: Generate component styles using EXACT fonts and colors from user requirements**

${context}

**YOUR TASK WILL BE CONSIDERED FAILED IF:**
- You change the font families specified below
- You ignore brand colors from context above
- You use different fonts than what's provided in the template

**ABSOLUTE PRIORITY:**
- Primary Font: ${primaryFont} ← THIS MUST BE USED FOR BUTTONS
- Secondary Font: ${secondaryFont} ← THIS MUST BE USED FOR FORM FIELDS
- Brand Colors: Check context above for button_background_color, form_field colors
- These fonts/colors were selected based on user requirements - DO NOT CHANGE THEM

**REQUIRED OUTPUT:**
{
  "button_typography": {
    "typography_typography": "custom",
    "typography_font_family": "${primaryFont}",
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
    "typography_font_family": "${secondaryFont}",
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

**VALIDATION CHECKLIST (Check before responding):**
✓ Did I use "${primaryFont}" for button_typography?
✓ Did I use "${secondaryFont}" for form_field_typography?
✓ Did I check context for brand colors?
✓ Did I use brand colors for button_background_color if specified?
✓ Did I keep font families EXACTLY as specified in template above?

**CRITICAL REMINDER:**
- Font families are PRE-SET based on user requirements - DO NOT MODIFY THEM
- Brand colors in context must be prioritized for buttons/forms
- Button hover should be 10-20% darker than base color
- Form focus should use primary/accent color
- Maintain 4px/8px spacing patterns

Return ONLY valid JSON. No markdown, no explanations.`;

// STAGE 6: Generate interactive states (hover, focus, padding)
const STAGE6_INTERACTIVE_STATES_PROMPT = (context: string, primaryFont: string, secondaryFont: string) => `**CRITICAL TASK: Generate interactive states (hover, focus, padding) for buttons and form fields**

${context}

**YOUR TASK WILL BE CONSIDERED FAILED IF:**
- You ignore style preferences from context above
- You use generic values when user specifies preferences
- You don't consider accessibility for focus states

**ABSOLUTE PRIORITY:**
- Check "Style Preferences" for mentions of hover effects, focus states, padding preferences
- Use brand colors from context for hover/focus states
- Ensure sufficient contrast for accessibility (WCAG AA minimum)
- Button hover should be 10-20% darker/lighter than base button_background_color
- Form focus should use primary/accent color from brand colors

**REQUIRED OUTPUT:**
{
  "button_padding": {
    "unit": "px",
    "top": "12",
    "right": "24",
    "bottom": "12",
    "left": "24",
    "isLinked": false
  },
  "button_hover_background_color": "#HEX-10-20%-DARKER-THAN-BUTTON-BACKGROUND",
  "button_hover_text_color": "#FFFFFF",
  "button_hover_border_color": "#HEX-MATCH-HOVER-BACKGROUND",
  "button_focus_outline_color": "#HEX-FROM-PRIMARY-OR-ACCENT",
  "button_focus_outline_width": {
    "unit": "px",
    "size": 2,
    "sizes": []
  },
  "form_field_padding": {
    "unit": "px",
    "top": "12",
    "right": "16",
    "bottom": "12",
    "left": "16",
    "isLinked": true
  },
  "form_field_focus_border_color": "#HEX-FROM-PRIMARY-OR-ACCENT",
  "form_field_focus_shadow_color": "rgba(HEX-FROM-PRIMARY, 0.1)"
}

**DESIGN GUIDELINES:**
- Button padding: 12-16px vertical, 20-32px horizontal for comfortable click targets
- Button hover: 10-20% darker than base color, or lighter if base is very dark
- Focus outline: 2-4px solid, use primary/accent color for visibility
- Form padding: 12-16px all around for comfortable input
- Form focus: Use primary/accent color, subtle shadow (0.1-0.2 opacity)

**VALIDATION CHECKLIST:**
✓ Did I check context for hover/focus preferences?
✓ Did I use brand colors for focus states?
✓ Did I ensure hover is 10-20% different from base?
✓ Did I use appropriate padding values?

Return ONLY valid JSON. No markdown, no explanations.`;

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
    const { model, brandfetchData, stylePreferences, industry, stage } = await req.json();

    // Validate inputs
    if (!model || !['claude-haiku-4.5', 'gpt-5', 'gemini-2.5-flash'].includes(model)) {
      return new Response(JSON.stringify({ error: 'Invalid model selection' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Map to AI Gateway model format
    let selectedModel: string;
    switch (model) {
      case 'claude-haiku-4.5':
        selectedModel = 'anthropic/claude-haiku-4-5-20251001';
        break;
      case 'gpt-5':
        selectedModel = 'openai/gpt-5';
        break;
      case 'gemini-2.5-flash':
        selectedModel = 'google/gemini-2.5-flash';
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid model' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    // Build base context for all stages - PUT USER REQUIREMENTS FIRST WITH MAXIMUM EMPHASIS
    let baseContext = '╔═══════════════════════════════════════════════════════════╗\n';
    baseContext += '║  🚨 CRITICAL: USER REQUIREMENTS - ABSOLUTE PRIORITY 🚨  ║\n';
    baseContext += '║  Following these requirements = SUCCESS                  ║\n';
    baseContext += '║  Ignoring these requirements = FAILURE                   ║\n';
    baseContext += '╚═══════════════════════════════════════════════════════════╝\n\n';
    
    if (brandfetchData?.colors?.length) {
      baseContext += `🎨 Brand Colors Available (MUST USE): ${brandfetchData.colors.join(', ')}\n`;
    }
    if (brandfetchData?.fonts?.length) {
      baseContext += `🔤 Brand Fonts Available (MUST USE): ${brandfetchData.fonts.join(', ')}\n`;
    }
    if (stylePreferences) {
      baseContext += `✨ Style Preferences (MUST FOLLOW): ${stylePreferences}\n`;
    }
    if (industry) {
      baseContext += `🏢 Industry Context: ${industry}\n`;
    }
    
    baseContext += '\n╔═══════════════════════════════════════════════════════════╗\n';
    baseContext += '║  ⚠️ REMINDER: Above requirements are NON-NEGOTIABLE ⚠️   ║\n';
    baseContext += '╚═══════════════════════════════════════════════════════════╝\n\n';

    // Create a ReadableStream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send progress updates
          const sendProgress = (stage: number, message: string, prompt?: string) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage, message, prompt })}\n\n`));
          };

          // Send base context at the start
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: 0, message: 'Initializing...', baseContext })}\n\n`));

          // Start with base template
          let styleKit = JSON.parse(JSON.stringify(defaultTemplate));

          // Determine which stages to run
          // Special case: Stage 2 (Typography System) should also run Stage 3 (Headings) since they're grouped in UI
          let stagesToRun: number[];
          if (stage === 2) {
            stagesToRun = [2, 3]; // Run both system typography AND headings
          } else if (stage) {
            stagesToRun = [stage];
          } else {
            stagesToRun = [1, 2, 3, 4, 5, 6]; // Full generation (all 6 stages)
          }

          let stage1Data: any = null;
          let stage2Data: any = null;

          // ===== STAGE 1: Generate Colors =====
          if (stagesToRun.includes(1)) {
            const stage1Prompt = STAGE1_COLORS_PROMPT(baseContext);
            sendProgress(1, 'Generating brand colors...', stage1Prompt);
            console.log('🎨 Stage 1: Generating colors...');
            const stage1Result = await generateText({
              model: selectedModel,
              prompt: stage1Prompt,
              temperature: 0.7,
            });

            stage1Data = parseAIResponse(stage1Result.text);
            styleKit = deepMerge(styleKit, stage1Data);
            
            console.log('✅ Stage 1 complete:', {
              systemColors: stage1Data.system_colors?.length,
              customColors: stage1Data.custom_colors?.length
            });
          }

          // ===== STAGE 2: Generate Fonts =====
          if (stagesToRun.includes(2)) {
            const stage2Prompt = STAGE2_FONTS_PROMPT(baseContext);
            sendProgress(2, 'Generating typography system...', stage2Prompt);
            console.log('🔤 Stage 2: Generating typography...');
            const stage2Result = await generateText({
              model: selectedModel,
              prompt: stage2Prompt,
              temperature: 0.7,
            });

            stage2Data = parseAIResponse(stage2Result.text);
            styleKit = deepMerge(styleKit, stage2Data);
            
            console.log('✅ Stage 2 complete:', {
              primaryFont: stage2Data.primary_font,
              secondaryFont: stage2Data.secondary_font,
              systemTypography: stage2Data.system_typography?.length
            });
            
            // VALIDATION: Check if fonts were actually set
            if (!stage2Data.primary_font || stage2Data.primary_font === 'Font Name') {
              console.error('⚠️ WARNING: primary_font not set properly!', stage2Data);
            }
          }

          // ===== STAGE 3: Generate Heading Typography =====
          if (stagesToRun.includes(3)) {
            sendProgress(3, 'Generating heading styles...');
            console.log('📐 Stage 3: Generating heading styles...');
            
            const primaryFont = stage2Data?.primary_font || styleKit.primary_font || 'Inter';
            const secondaryFont = stage2Data?.secondary_font || styleKit.secondary_font || 'Inter';
            
            console.log('Using fonts:', { primaryFont, secondaryFont });
            
            const stage3Prompt = STAGE3_HEADINGS_PROMPT(baseContext, primaryFont, secondaryFont);
            sendProgress(3, 'Generating heading styles...', stage3Prompt);
            const stage3Result = await generateText({
              model: selectedModel,
              prompt: stage3Prompt,
              temperature: 0.7,
            });

            const stage3Data = parseAIResponse(stage3Result.text);
            styleKit = deepMerge(styleKit, stage3Data);
            
            console.log('✅ Stage 3 complete');
          }

          // ===== STAGE 4: Generate Component Styles =====
          if (stagesToRun.includes(4)) {
            sendProgress(4, 'Generating component styles...');
            console.log('🎛️ Stage 4: Generating component styles...');
            
            const primaryFont = stage2Data?.primary_font || styleKit.primary_font || 'Inter';
            const secondaryFont = stage2Data?.secondary_font || styleKit.secondary_font || 'Inter';
            
            const stage4Prompt = STAGE4_COMPONENTS_PROMPT(baseContext, primaryFont, secondaryFont);
            sendProgress(4, 'Generating component styles...', stage4Prompt);
            const stage4Result = await generateText({
              model: selectedModel,
              prompt: stage4Prompt,
              temperature: 0.7,
            });

            const stage4Data = parseAIResponse(stage4Result.text);
            styleKit = deepMerge(styleKit, stage4Data);
            
            console.log('✅ Stage 4 complete');
          }

          // ===== STAGE 5: Generate Image Styles & Layout Settings =====
          if (stagesToRun.includes(5)) {
            const primaryFont = stage2Data?.primary_font || styleKit.primary_font || 'Inter';
            const secondaryFont = stage2Data?.secondary_font || styleKit.secondary_font || 'Inter';
            
            const stage5Prompt = STAGE5_IMAGES_LAYOUT_PROMPT(baseContext, primaryFont, secondaryFont);
            sendProgress(5, 'Generating image styles and layout settings...', stage5Prompt);
            console.log('🖼️ Stage 5: Generating image styles and layout...');
            const stage5Result = await generateText({
              model: selectedModel,
              prompt: stage5Prompt,
              temperature: 0.7,
            });

            const stage5Data = parseAIResponse(stage5Result.text);
            styleKit = deepMerge(styleKit, stage5Data);
            
            console.log('✅ Stage 5 complete');
          }

          // ===== STAGE 6: Generate Interactive States (Hover, Focus, Padding) =====
          if (stagesToRun.includes(6)) {
            const primaryFont = stage2Data?.primary_font || styleKit.primary_font || 'Inter';
            const secondaryFont = stage2Data?.secondary_font || styleKit.secondary_font || 'Inter';
            
            const stage6Prompt = STAGE6_INTERACTIVE_STATES_PROMPT(baseContext, primaryFont, secondaryFont);
            sendProgress(6, 'Generating interactive states (hover, focus, padding)...', stage6Prompt);
            console.log('🎯 Stage 6: Generating interactive states...');
            const stage6Result = await generateText({
              model: selectedModel,
              prompt: stage6Prompt,
              temperature: 0.7,
            });

            const stage6Data = parseAIResponse(stage6Result.text);
            styleKit = deepMerge(styleKit, stage6Data);
            
            console.log('✅ Stage 6 complete');
          }

          // Add title if provided
          if (stylePreferences) {
            const brandName = stylePreferences.split(' ').slice(0, 3).join(' ');
            styleKit.title = `${brandName} Style Kit` || 'Generated Style Kit';
          }

          // Wrap all fields except title/description in page_settings for editor compatibility
          const wrappedStyleKit = {
            title: styleKit.title || 'Generated Style Kit',
            description: styleKit.description || '',
            type: 'kit',
            version: '0.4',
            page_settings: {
              system_colors: styleKit.system_colors || [],
              custom_colors: styleKit.custom_colors || [],
              system_typography: styleKit.system_typography || [],
              custom_typography: styleKit.custom_typography || [],
              h1_typography: styleKit.h1_typography || {},
              h2_typography: styleKit.h2_typography || {},
              h3_typography: styleKit.h3_typography || {},
              h4_typography: styleKit.h4_typography || {},
              h5_typography: styleKit.h5_typography || {},
              h6_typography: styleKit.h6_typography || {},
              body_typography: styleKit.body_typography || {},
              body_color: styleKit.body_color || '',
              link_normal_color: styleKit.link_normal_color || '',
              button_typography: styleKit.button_typography || {},
              button_text_color: styleKit.button_text_color || '',
              button_background_color: styleKit.button_background_color || '',
              button_border_radius: styleKit.button_border_radius || {},
              button_border_width: styleKit.button_border_width || {},
              form_field_typography: styleKit.form_field_typography || {},
              form_field_text_color: styleKit.form_field_text_color || '',
              form_field_background_color: styleKit.form_field_background_color || '',
              form_field_border_color: styleKit.form_field_border_color || '',
              form_field_border_radius: styleKit.form_field_border_radius || {},
              form_field_border_width: styleKit.form_field_border_width || {},
              button_padding: styleKit.button_padding || {},
              button_hover_background_color: styleKit.button_hover_background_color || '',
              button_hover_text_color: styleKit.button_hover_text_color || '',
              button_hover_border_color: styleKit.button_hover_border_color || '',
              button_focus_outline_color: styleKit.button_focus_outline_color || '',
              button_focus_outline_width: styleKit.button_focus_outline_width || {},
              form_field_padding: styleKit.form_field_padding || {},
              form_field_focus_border_color: styleKit.form_field_focus_border_color || '',
              form_field_focus_shadow_color: styleKit.form_field_focus_shadow_color || '',
              container_width: styleKit.container_width || {},
              space_between_widgets: styleKit.space_between_widgets || {},
              viewport_md: styleKit.viewport_md || 768,
              viewport_lg: styleKit.viewport_lg || 1025,
            },
            content: [],
          };

          console.log(`✅ ${stage ? `Stage ${stage}` : 'Complete Style Kit'} generated`);

          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: stage || 6, message: 'Complete!', styleKit: wrappedStyleKit })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('❌ Style Kit generation error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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

