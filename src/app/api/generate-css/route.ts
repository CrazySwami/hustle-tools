import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { prompt, headingFont, bodyFont, primaryColor, secondaryColor } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🎨 Generating CSS with Gemini 2.5 Flash...');

    const { text } = await generateText({
      model: 'google/gemini-2.5-flash',
      prompt: `You are a CSS expert. Generate clean, modern CSS based on the user's request.

Current Style Settings:
- Heading Font: ${headingFont}
- Body Font: ${bodyFont}
- Primary Color: ${primaryColor}
- Secondary Color: ${secondaryColor}

User Request:
${prompt}

Requirements:
1. Generate valid, production-ready CSS
2. Use the provided fonts and colors where appropriate
3. Include CSS variables in :root for reusability
4. Add helpful comments to explain sections
5. Use modern CSS features (flexbox, grid, custom properties)
6. Include responsive styles where applicable
7. Return ONLY the CSS code, no explanations or markdown
8. Start with a comment header describing the generated styles

Generate the CSS:`,
      temperature: 0.7,
      maxTokens: 2000,
    });

    const css = text.trim();

    console.log('✅ CSS generated successfully');

    return NextResponse.json({ css });
  } catch (error: any) {
    console.error('❌ CSS generation error:', error);

    // Check if it's an AI Gateway configuration error
    if (error.message && error.message.includes('AI Gateway')) {
      return NextResponse.json(
        {
          error: 'AI Gateway not configured. Please configure the Cloudflare AI Gateway in your Cloudflare dashboard, or contact your administrator.',
          details: error.message
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate CSS' },
      { status: 500 }
    );
  }
}
