import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const {
      month,
      postsPerMonth,
      niche,
      targetAudience,
      brandVoice = 'professional',
      existingTopics = [],
      model = 'anthropic/claude-sonnet-4-5-20250929',
    } = await req.json();

    // Build comprehensive prompt
    const prompt = `Generate ${postsPerMonth} blog post topics for ${month} about ${niche} targeting ${targetAudience}.

Brand Voice: ${brandVoice}

${existingTopics.length > 0 ? `Topics to AVOID (already covered):\n${existingTopics.map((t: string) => `- ${t}`).join('\n')}\n\n` : ''}

For each topic, provide:
1. title: A compelling, SEO-optimized title (50-60 characters)
2. focusKeyword: Primary keyword (2-4 words, lowercase, hyphens between words)
3. metaDescription: SEO meta description (150-160 characters)
4. contentType: One of: "how-to", "listicle", "guide", "tutorial", or "comparison"

Format each topic as a JSON object on a single line:
{"title": "...", "focusKeyword": "...", "metaDescription": "...", "contentType": "..."}

Generate ${postsPerMonth} topics, one per line, no additional text.

Requirements:
- Titles should be specific, actionable, and keyword-rich
- Focus keywords should be realistic (2-4 words)
- Meta descriptions must be compelling and under 160 characters
- Vary content types for diversity
- Topics should target ${targetAudience} specifically
- Use ${brandVoice} tone throughout`;

    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      prompt,
      temperature: 0.8, // Higher for creative topic generation
      maxTokens: 4000,
    });

    // Stream the response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in /api/generate-blog-plan:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate blog plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
