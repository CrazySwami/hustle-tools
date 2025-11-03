import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { content, keywords } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log('📊 Performing programmatic analysis...');

    // Word count
    const words = content.split(/\s+/).filter((w: string) => w.length > 0);
    const wordCount = words.length;

    // Sentence analysis
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;

    // Paragraph count
    const paragraphs = content.split(/\n\n+/).filter((p: string) => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // Heading count
    const headings = (content.match(/^#{1,6}\s/gm) || []).length;

    // Keyword frequency
    const focusKeyword = keywords?.[0] || '';
    const keywordRegex = new RegExp(focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const keywordFrequency = focusKeyword ? (content.match(keywordRegex) || []).length : 0;

    // Simple readability score (Flesch Reading Ease approximation)
    // Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const avgSyllablesPerWord = 1.5; // Simplified estimate
    const readabilityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord)
      )
    );

    const analysis = {
      wordCount,
      readabilityScore,
      keywordFrequency,
      avgSentenceLength,
      paragraphCount,
      headingCount,
    };

    console.log('✅ Analysis completed:', analysis);

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('❌ Analysis error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to perform analysis' },
      { status: 500 }
    );
  }
}
