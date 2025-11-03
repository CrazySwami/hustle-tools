import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { companyName, description } = await request.json();

    if (!companyName || !description) {
      return NextResponse.json(
        { error: 'Company name and description are required' },
        { status: 400 }
      );
    }

    console.log('🤖 Generating tagline for:', companyName);

    const { text } = await generateText({
      model: 'google/gemini-2.5-flash',
      prompt: `Generate a short, catchy tagline (5-10 words max) for this company:

Company Name: ${companyName}
Description: ${description}

Requirements:
- Must be concise and memorable
- Should capture the essence of the company
- Professional tone
- No quotes or extra punctuation
- Just the tagline text, nothing else

Tagline:`,
      temperature: 0.8,
      maxTokens: 50,
    });

    const tagline = text.trim();

    console.log('✅ Tagline generated:', tagline);

    return NextResponse.json({ tagline });
  } catch (error: any) {
    console.error('❌ Tagline generation error:', error);

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
      { error: error.message || 'Failed to generate tagline' },
      { status: 500 }
    );
  }
}
