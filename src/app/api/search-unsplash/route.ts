import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      page = 1,
      perPage = 20,
      orientation = null, // 'landscape', 'portrait', 'squarish'
      color = null, // 'black_and_white', 'black', 'white', 'yellow', 'orange', 'red', 'purple', 'magenta', 'green', 'teal', 'blue'
      orderBy = 'relevant', // 'latest' or 'relevant'
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      return NextResponse.json(
        { error: 'UNSPLASH_ACCESS_KEY not configured' },
        { status: 500 }
      );
    }

    // Build API URL
    const baseUrl = 'https://api.unsplash.com/search/photos';

    // Build query parameters
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      per_page: perPage.toString(),
      order_by: orderBy,
    });

    if (orientation) params.append('orientation', orientation);
    if (color) params.append('color', color);

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unsplash API error:', response.status, errorText);
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    // Format response
    const photos = data.results?.map((photo: any) => ({
      id: photo.id,
      width: photo.width,
      height: photo.height,
      color: photo.color,
      description: photo.description || photo.alt_description,
      urls: {
        raw: photo.urls?.raw,
        full: photo.urls?.full,
        regular: photo.urls?.regular,
        small: photo.urls?.small,
        thumb: photo.urls?.thumb,
      },
      links: {
        self: photo.links?.self,
        html: photo.links?.html,
        download: photo.links?.download,
        downloadLocation: photo.links?.download_location,
      },
      photographer: photo.user?.name,
      photographerUsername: photo.user?.username,
      photographerUrl: photo.user?.links?.html,
      photographerProfile: photo.user?.profile_image?.medium,
    })) || [];

    return NextResponse.json({
      success: true,
      results: photos,
      page: data.page || page,
      perPage: data.per_page || perPage,
      totalResults: data.total || 0,
      totalPages: data.total_pages || 0,
    });
  } catch (error: any) {
    console.error('Unsplash search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search Unsplash' },
      { status: 500 }
    );
  }
}
