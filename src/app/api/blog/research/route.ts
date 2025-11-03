import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { contentForm, model = 'perplexity/sonar' } = await request.json();

    if (!contentForm) {
      return NextResponse.json(
        { error: 'Content form is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Performing research with Perplexity model:', model);

    const { text } = await generateText({
      model,
      prompt: `You are a research assistant conducting comprehensive web research for a blog article.

Content Order Form:
- Business: ${contentForm.businessName}
- Niche: ${contentForm.niche}
- Target Audience: ${contentForm.targetAudience}
- Keywords: ${contentForm.keywords?.join(', ')}
- Geographic Focus: ${contentForm.geoLocations}
- Competitors: ${contentForm.competitors?.join(', ')}

Task: Conduct comprehensive research on this topic. Find:

1. **Market Overview** - Current trends, statistics, and industry insights
2. **Key Differentiators** - What makes successful businesses in this niche stand out
3. **Local Market Insights** (if applicable) - Geographic-specific data and preferences
4. **Target Audience Insights** - What the audience cares about, pain points, desires
5. **Competitor Analysis** - What competitors are doing well (NO direct comparisons, just observations)
6. **SEO & Content Strategy** - What top-performing content includes

Provide detailed research findings with specific data, statistics, and insights. Include citations to authoritative sources.

Format the response as a research report with clear sections and bullet points.`,
      temperature: 0.5,
      maxTokens: 3000,
    });

    // Parse citations from Perplexity response (if available in metadata)
    // For now, we'll return the research text and let the frontend handle citations
    const citations = [
      {
        title: "Research Source 1",
        url: "https://example.com/source1",
        favicon: "https://www.google.com/s2/favicons?domain=example.com&sz=32",
        snippet: "Relevant research findings..."
      }
    ];

    console.log('✅ Research completed successfully');

    return NextResponse.json({
      research: text,
      citations
    });
  } catch (error: any) {
    console.error('❌ Research error:', error);

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
      { error: error.message || 'Failed to perform research' },
      { status: 500 }
    );
  }
}
