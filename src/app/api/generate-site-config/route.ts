import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, logo, favicon, model = 'openai/gpt-5' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🤖 Generating site configuration from prompt:', prompt);
    console.log('🎯 Using model:', model);

    // Extract model name (remove openai/ prefix if present)
    const modelName = model.replace('openai/', '');

    const systemPrompt = `You are a WordPress site configuration expert. Generate complete WordPress site settings and pages based on the user's prompt.

Return a JSON object with this exact structure:
{
  "settings": {
    "siteTitle": "string (site name)",
    "tagline": "string (catchy tagline, max 100 chars)",
    "adminEmail": "string (example email like admin@example.com)",
    "timezone": "string (timezone like America/New_York based on context)",
    "dateFormat": "string (F j, Y or m/d/Y)",
    "timeFormat": "string (g:i a or H:i)",
    "startOfWeek": "number (0-6, where 0 is Sunday)",
    "language": "en_US",
    "permalinkStructure": "string (/%postname%/ for blog, /%category%/%postname%/ for news)",
    "postsPerPage": "number (10 default)",
    "commentsEnabled": "boolean (false for business, true for blog)",
    "pingbacksEnabled": false,
    "searchEngineVisibility": false
  },
  "pages": [
    {
      "title": "string (page title)",
      "slug": "string (url-friendly slug)",
      "content": "string (rich HTML content, 200-400 words, well-formatted with headings, paragraphs, lists)",
      "excerpt": "string (1-2 sentence summary)",
      "yoast": {
        "focusKeyword": "string (1-3 word SEO keyword)",
        "metaTitle": "string (compelling title, exactly 50-60 chars)",
        "metaDescription": "string (compelling description, exactly 150-160 chars)"
      }
    }
  ]
}

Guidelines:
- Generate 4-6 pages: Home, About, Services/Products, Contact, and 1-2 relevant extras
- Content should be professional, engaging, and industry-appropriate
- Use proper HTML formatting: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>
- Meta titles must be 50-60 characters (strict)
- Meta descriptions must be 150-160 characters (strict)
- Focus keywords should be specific and relevant
- Infer business type, tone, and industry from the prompt
- Be creative but professional

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

    const userPrompt = `Generate a complete WordPress site configuration for:

${prompt}

${logo ? 'Logo image will be provided separately.' : ''}
${favicon ? 'Favicon image will be provided separately.' : ''}

Consider the industry, target audience, and purpose when generating content and settings.`;

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const siteConfig = JSON.parse(responseText);

    console.log('✅ Site configuration generated:', {
      siteTitle: siteConfig.settings.siteTitle,
      pagesCount: siteConfig.pages.length,
    });

    return NextResponse.json(siteConfig);
  } catch (error: any) {
    console.error('❌ Site config generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate site configuration' },
      { status: 500 }
    );
  }
}
