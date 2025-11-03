import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { contentForm, research, outline, model = 'anthropic/claude-haiku-4-5-20251001' } = await request.json();

    if (!contentForm || !outline) {
      return NextResponse.json(
        { error: 'Content form and outline are required' },
        { status: 400 }
      );
    }

    console.log('✍️ Generating content with model:', model);

    const { text } = await generateText({
      model,
      prompt: `You are an expert content writer creating a comprehensive, SEO-optimized blog article.

Content Order Form:
- Business: ${contentForm.businessName}
- Niche: ${contentForm.niche}
- Target Audience: ${contentForm.targetAudience}
- Keywords: ${contentForm.keywords?.join(', ')}
- Intended Result: ${contentForm.intendedResult}
- Geographic Focus: ${contentForm.geoLocations}
- Additional Instructions: ${contentForm.additionalInstructions}
${contentForm.competitors && contentForm.competitors.length > 0 ? `- Competitors to Research (for context only, NO direct comparisons): ${contentForm.competitors.join(', ')}` : ''}

${research ? `Research Findings:\n${research}\n\n` : ''}

Outline to Follow:
${outline}

Task: Write a complete, high-quality blog article that:

1. **Follows the outline exactly** - Use the same heading structure
2. **Targets the keywords naturally** - Include primary keyword "${contentForm.keywords?.[0] || 'topic'}" 5-8 times throughout
3. **Engages the target audience** - Write directly to their needs, pain points, and interests
4. **Is comprehensive** - Aim for 1800-2500 words minimum
5. **Includes actionable information** - Practical tips, steps, or advice readers can use
6. **Maintains professional tone** - Follow the style indicated in additional instructions
7. **Incorporates local references** - Mention geographic locations naturally where relevant
8. **Ends with strong CTA** - Align with the intended result: ${contentForm.intendedResult}
9. **Uses markdown formatting** - Proper headings (##, ###), **bold** for emphasis, bullet points where appropriate
10. **NO competitor comparisons** - Only mention them as references if absolutely necessary

Write the full article content now in markdown format:`,
      temperature: 0.7,
      maxTokens: 4000,
    });

    console.log('✅ Content generated successfully');

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error('❌ Content generation error:', error);

    if (error.message && error.message.includes('AI Gateway')) {
      return NextResponse.json(
        {
          error: 'AI Gateway not configured. Please configure the Cloudflare AI Gateway in your Cloudflare dashboard, or contact your administrator.',
          details: error.message
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
