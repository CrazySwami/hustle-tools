import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes for long-form content

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      focusKeyword,
      metaDescription,
      contentType,
      estimatedWordCount,
      brandVoice = 'professional',
      additionalInstructions,
      internalLinkPage,
      callToAction,
      researchSummary,
      researchSources = [],
      model = 'anthropic/claude-sonnet-4-5-20250929',
    } = await req.json();

    // Build content type-specific guidelines
    const contentTypeGuide = {
      'how-to': `This is a HOW-TO guide. Structure:
- Introduction (problem + solution overview)
- Prerequisites/Requirements
- Step-by-step instructions (clear numbered steps)
- Tips and best practices
- Common mistakes to avoid
- Conclusion with next steps`,

      'listicle': `This is a LISTICLE. Structure:
- Compelling introduction
- ${Math.floor(estimatedWordCount / 150)} numbered items
- Each item should have a subheading, explanation, and example
- Use bullet points within items for clarity
- Conclusion summarizing key takeaways`,

      'guide': `This is a COMPREHENSIVE GUIDE. Structure:
- Executive summary
- Table of contents (## headings)
- Multiple sections with deep dives
- Examples, case studies, or screenshots descriptions
- Expert tips and pro insights
- Resources and further reading
- Conclusion with action steps`,

      'tutorial': `This is a TUTORIAL. Structure:
- What you'll learn (outcomes)
- Prerequisites and setup
- Detailed step-by-step walkthrough
- Code examples or practical demonstrations
- Troubleshooting common issues
- Next steps and advanced topics`,

      'comparison': `This is a COMPARISON article. Structure:
- Introduction to the topic and why comparison matters
- Criteria for comparison (create comparison table)
- Detailed analysis of each option
- Pros and cons for each
- Use cases and recommendations
- Final verdict and recommendations`
    };

    const guide = contentTypeGuide[contentType as keyof typeof contentTypeGuide];

    // Build research context if available
    const researchContext = researchSummary
      ? `\n\nRESEARCH FINDINGS:\n${researchSummary}\n\nSOURCES:\n${researchSources.map((s: any, i: number) => `[${i + 1}] ${s.title} - ${s.url}`).join('\n')}\n\nIncorporate these findings and cite sources where appropriate using [1], [2], etc.`
      : '';

    // Build comprehensive prompt
    const prompt = `Write a ${contentType} blog post with the following details:

TITLE: ${title}
FOCUS KEYWORD: ${focusKeyword}
META DESCRIPTION: ${metaDescription || 'Not specified'}
TARGET WORD COUNT: ~${estimatedWordCount} words
BRAND VOICE: ${brandVoice}
${additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}` : ''}
${researchContext}

CONTENT TYPE GUIDELINES:
${guide}

REQUIREMENTS:
1. Write in ${brandVoice} tone throughout
2. Use the focus keyword "${focusKeyword}" naturally 3-5 times
3. Include the focus keyword in the first paragraph
4. Use markdown formatting (##, ###, bold, italic, lists, code blocks)
5. Target approximately ${estimatedWordCount} words
6. Include a compelling introduction hook
7. Use subheadings (## and ###) for structure and readability
8. Add a natural internal link to "${internalLinkPage}" where relevant
9. End with a call to action: "${callToAction}"
10. Use short paragraphs (2-4 sentences max)
11. Include actionable insights and examples
12. Avoid fluff - every sentence should add value

FORMATTING:
- Use ## for main sections
- Use ### for subsections
- Use **bold** for emphasis
- Use \`code\` for technical terms
- Use > for important callouts or quotes
- Use - for bullet lists
- Use 1. for numbered lists

OUTPUT FORMAT:
Pure markdown. No code fences. Start with # ${title} then write the complete article.

Begin writing now:`;

    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      prompt,
      temperature: 0.7, // Balanced for creative yet coherent writing
      maxTokens: 16000, // Allow for long-form content
    });

    // Stream the response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in /api/generate-blog-post:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate blog post',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
