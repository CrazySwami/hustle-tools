import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('🔍 Vector store search requested:', query);

    // For now, return empty results
    // The search_elementor_docs tool in the main chat handles actual vector search
    // This endpoint is just for pre-fetching docs in parallel with classification
    // We'll rely on the tool call instead since it works correctly

    return NextResponse.json({
      results: []
    });

  } catch (error: any) {
    console.error('❌ Vector store search error:', error);
    return NextResponse.json({ results: [] });
  }
}
