import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to debug fetch issues
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Starting fetch test...');
    console.log('Supabase URL from env:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/documents?select=*&limit=1`;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Fetching URL:', url);

    const response = await fetch(url, {
      headers: {
        'apikey': apiKey!,
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('Response data:', data);

    return NextResponse.json({
      success: true,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      responseStatus: response.status,
      data,
    });
  } catch (error: any) {
    console.error('❌ Fetch test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }, { status: 500 });
  }
}
