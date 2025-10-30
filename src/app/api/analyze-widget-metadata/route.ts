import { streamText } from 'ai';
import { createModel } from '@/lib/ai-models';

export const runtime = 'nodejs';

/**
 * Analyze HTML/CSS/JS and generate widget metadata using Claude Haiku 4.5
 * Fast (~200ms) metadata generation for programmatic widget converter
 */
export async function POST(req: Request) {
  try {
    const { html, css, js } = await req.json();

    if (!html) {
      return Response.json(
        { error: 'HTML is required' },
        { status: 400 }
      );
    }

    const prompt = `Analyze this HTML component and suggest Elementor widget metadata.

HTML (first 800 chars):
${html.substring(0, 800)}

CSS (first 400 chars):
${css?.substring(0, 400) || 'None'}

JS (first 400 chars):
${js?.substring(0, 400) || 'None'}

Based on the structure, content, and purpose of this component, suggest appropriate metadata.

Guidelines:
- name: snake_case, descriptive (e.g., "hero_banner", "pricing_table", "testimonial_card")
- title: Human-readable, 2-4 words (e.g., "Hero Banner", "Pricing Table")
- description: One clear sentence describing what it does
- category: Choose from: general, marketing, content, media, social, forms, theme-elements
- icon: Elementor icon class (e.g., "eicon-banner", "eicon-table", "eicon-testimonial")

Common icons:
- eicon-banner (hero sections)
- eicon-table (pricing, data tables)
- eicon-testimonial (testimonials, reviews)
- eicon-button (buttons, CTAs)
- eicon-image-box (image cards)
- eicon-text (text blocks)
- eicon-form (forms, inputs)
- eicon-code (custom code)

Respond ONLY with valid JSON in this exact format:
{
  "name": "widget_name",
  "title": "Widget Title",
  "description": "Description here",
  "category": "category_here",
  "icon": "eicon-name"
}`;

    const result = await streamText({
      model: createModel('anthropic/claude-haiku-4-5-20251001'),
      prompt,
      maxTokens: 300,
      temperature: 0.7,
    });

    const text = (await result.text).trim();

    // Extract JSON if wrapped in markdown code blocks
    let jsonText = text;
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    const metadata = JSON.parse(jsonText);

    // Validate required fields
    if (!metadata.name || !metadata.title) {
      throw new Error('Invalid metadata: missing required fields');
    }

    // Ensure defaults for optional fields
    const validatedMetadata = {
      name: metadata.name,
      title: metadata.title,
      description: metadata.description || `${metadata.title} widget`,
      category: metadata.category || 'general',
      icon: metadata.icon || 'eicon-code',
    };

    console.log('✅ Generated widget metadata:', validatedMetadata);

    return Response.json(validatedMetadata);
  } catch (error: any) {
    console.error('❌ Widget metadata generation error:', error);

    return Response.json(
      {
        error: 'Failed to generate widget metadata',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
