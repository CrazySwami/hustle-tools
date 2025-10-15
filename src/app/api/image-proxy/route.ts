import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const imageBlob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');

    return new NextResponse(imageBlob, { status: 200, headers });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
