import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const {
      content,
      contentForm,
      analysis,
      topic,
      keyword,
      additionalCriteria,
      model = 'anthropic/claude-haiku-4-5-20251001'
    } = await request.json();

    if (!content || !contentForm) {
      return NextResponse.json(
        { error: 'Content and content form are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Reviewing content with model:', model);

    const { text } = await generateText({
      model,
      prompt: `You are a content quality reviewer performing a final check on a blog article.

Content Order Form Requirements:
- Business: ${contentForm.businessName}
- Niche: ${contentForm.niche}
- Target Audience: ${contentForm.targetAudience}
- Keywords: ${contentForm.keywords?.join(', ')}
- Intended Result: ${contentForm.intendedResult}
- Geographic Focus: ${contentForm.geoLocations}

Focus Topic: ${topic || contentForm.niche}
Focus Keyword: ${keyword || contentForm.keywords?.[0] || ''}

Analysis Results:
- Word Count: ${analysis?.wordCount || 'N/A'}
- Readability Score: ${analysis?.readabilityScore || 'N/A'}
- Keyword Frequency: ${analysis?.keywordFrequency || 'N/A'}
- Avg Sentence Length: ${analysis?.avgSentenceLength || 'N/A'}
- Paragraph Count: ${analysis?.paragraphCount || 'N/A'}
- Heading Count: ${analysis?.headingCount || 'N/A'}

${additionalCriteria ? `Additional Check Criteria:\n${additionalCriteria}\n\n` : ''}

Content to Review:
${content}

Task: Provide a comprehensive content review covering:

## Content Review Analysis

**Topic Alignment:** ✅ or ❌ - Does the content fully address the topic and niche?

**Keyword Integration:** ✅ or ❌ - Is the focus keyword used appropriately (not stuffed, but present 5-8 times)?

**Requirements Checklist:**
- ✅ or ❌ Current URL referenced appropriately
- ✅ or ❌ Business/Company name mentioned
- ✅ or ❌ Niche clearly covered
- ✅ or ❌ Intended result/CTA included
- ✅ or ❌ Target audience addressed
- ✅ or ❌ Geographic locations mentioned
- ✅ or ❌ Keywords naturally integrated
- ✅ or ❌ Additional instructions followed

**Content Quality:**
- Evaluate introduction effectiveness
- Check logical flow and structure
- Assess heading usage and scannability
- Verify actionable information provided
- Review tone and style appropriateness

**SEO Optimization:**
- Keyword density appropriate?
- Headings properly structured (H2, H3)?
- Content length sufficient (1800+ words)?
- Meta-relevant information present?

**Suggested Improvements:**
List 3-5 specific, actionable edits to improve the content. Be concrete and specific.

Provide your review now:`,
      temperature: 0.5,
      maxTokens: 2000,
    });

    // Extract suggested edits from the review
    const editsMatch = text.match(/\*\*Suggested Improvements:\*\*([\s\S]*?)(\n##|\n\*\*|$)/);
    const editsSection = editsMatch ? editsMatch[1] : '';
    const suggestedEdits = editsSection
      .split(/\n/)
      .filter(line => line.trim().match(/^[\d\-\*]/) || line.trim().startsWith('•'))
      .map(line => line.replace(/^[\d\-\*\•\)\.\s]+/, '').trim())
      .filter(Boolean);

    console.log('✅ Review completed successfully');

    return NextResponse.json({
      review: text,
      suggestedEdits: suggestedEdits.length > 0 ? suggestedEdits : [
        'Consider adding more specific examples or case studies',
        'Strengthen the call-to-action with urgency or value proposition',
        'Include more local references relevant to the geographic focus',
        'Add internal links to related pages or resources',
        'Incorporate social proof or testimonials if applicable'
      ]
    });
  } catch (error: any) {
    console.error('❌ Review error:', error);

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
      { error: error.message || 'Failed to review content' },
      { status: 500 }
    );
  }
}
