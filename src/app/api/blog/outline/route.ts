import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { contentForm, research, model = 'anthropic/claude-haiku-4-5-20251001' } = await request.json();

    if (!contentForm) {
      return NextResponse.json(
        { error: 'Content form is required' },
        { status: 400 }
      );
    }

    console.log('📋 Generating outline with model:', model);

    const { text } = await generateText({
      model,
      prompt: `You are a content strategist creating a detailed blog article outline.

Content Order Form:
- Business: ${contentForm.businessName}
- Niche: ${contentForm.niche}
- Target Audience: ${contentForm.targetAudience}
- Keywords: ${contentForm.keywords?.join(', ')}
- Intended Result: ${contentForm.intendedResult}
- Geographic Focus: ${contentForm.geoLocations}
- Additional Instructions: ${contentForm.additionalInstructions}

${research ? `Research Findings:\n${research}\n\n` : ''}

Task: Create a comprehensive blog article outline that:

1. Starts with an engaging introduction that hooks the target audience
2. Covers all relevant aspects of the topic based on the research
3. Naturally integrates the focus keywords
4. Includes H2 and H3 headings (indicate with ## and ###)
5. Ends with a strong conclusion and clear CTA aligned with the intended result
6. Addresses the target audience's pain points and interests
7. Is structured for good SEO and readability

Provide ONLY the outline in markdown format with heading levels (##, ###).

Example format:
## Introduction to [Topic]
## Understanding [Key Concept]
### Subsection One
### Subsection Two
## Benefits and Applications
## Implementation Guide
### Step One
### Step Two
## Conclusion and Next Steps`,
      temperature: 0.6,
      maxTokens: 1500,
    });

    console.log('✅ Outline generated successfully');

    return NextResponse.json({ outline: text });
  } catch (error: any) {
    console.error('❌ Outline generation error:', error);

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
      { error: error.message || 'Failed to generate outline' },
      { status: 500 }
    );
  }
}
