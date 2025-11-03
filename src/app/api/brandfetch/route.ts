import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface BrandfetchResponse {
  id: string;
  name: string;
  domain: string;
  claimed: boolean;
  description: string;
  longDescription: string;
  links: Array<{
    name: string;
    url: string;
  }>;
  logos: Array<{
    type: string;
    theme: string;
    formats: Array<{
      src: string;
      background: string;
      format: string;
      height: number;
      width: number;
      size: number;
    }>;
  }>;
  colors: Array<{
    hex: string;
    type: string;
    brightness: number;
  }>;
  fonts: Array<{
    name: string;
    type: string;
    origin: string;
    originId: string;
    weights: number[];
  }>;
  images: Array<{
    type: string;
    formats: Array<{
      src: string;
      background: string;
      format: string;
      height: number;
      width: number;
      size: number;
    }>;
  }>;
  company: {
    employees: string;
    foundedYear: number;
    kind: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Clean domain (remove protocol, www, etc.)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    console.log('🔍 Fetching brand data for:', cleanDomain);

    // Fetch from Brandfetch API
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // Add API key if available in environment
    if (process.env.BRANDFETCH_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.BRANDFETCH_API_KEY}`;
    }

    const response = await fetch(`https://api.brandfetch.io/v2/brands/${cleanDomain}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Brandfetch API error:', error);
      return NextResponse.json(
        { error: `Brandfetch API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: BrandfetchResponse = await response.json();

    console.log('✅ Brand data fetched successfully:', {
      name: data.name,
      logos: data.logos?.length || 0,
      colors: data.colors?.length || 0,
      fonts: data.fonts?.length || 0,
      images: data.images?.length || 0,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Brandfetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brand data' },
      { status: 500 }
    );
  }
}
