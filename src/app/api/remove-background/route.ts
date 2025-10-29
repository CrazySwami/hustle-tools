import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Option 1: Using remove.bg API (requires API key)
    if (process.env.REMOVE_BG_API_KEY) {
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.REMOVE_BG_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`remove.bg API error: ${response.statusText}`);
      }

      const resultBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(resultBuffer).toString('base64');

      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64}`,
        method: 'remove.bg',
      });
    }

    // Option 2: Using imgly background removal API (free tier available)
    const imglyResponse = await fetch('https://api.img.ly/v1/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.IMGLY_API_KEY && { 'Authorization': `Bearer ${process.env.IMGLY_API_KEY}` }),
      },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (!imglyResponse.ok) {
      throw new Error(`imgly API error: ${imglyResponse.statusText}`);
    }

    const imglyResult = await imglyResponse.json();

    return NextResponse.json({
      success: true,
      imageUrl: imglyResult.output_url || imglyResult.data,
      method: 'imgly',
    });
  } catch (error: any) {
    console.error('Background removal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove background' },
      { status: 500 }
    );
  }
}
