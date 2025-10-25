import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * SerpAPI Locations API
 * Endpoint: https://serpapi.com/locations.json
 * Free to use, provides location autocomplete for geographic targeting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '10';

    if (!query) {
      return NextResponse.json({ success: true, locations: [] });
    }

    const url = `https://serpapi.com/locations.json?q=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SerpAPI locations request failed: ${response.statusText}`);
    }

    const locations = await response.json();

    return NextResponse.json({
      success: true,
      locations: locations.map((loc: any) => ({
        id: loc.google_id,
        name: loc.name,
        canonicalName: loc.canonical_name,
        country: loc.country_code,
        targetType: loc.target_type,
        reach: loc.reach,
        gps: loc.gps,
      })),
    });
  } catch (error) {
    console.error('SerpAPI locations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
