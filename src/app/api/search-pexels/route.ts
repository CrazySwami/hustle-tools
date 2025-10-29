import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      type = 'photos', // 'photos' or 'videos'
      page = 1,
      perPage = 20,
      orientation = 'landscape', // 'landscape', 'portrait', 'square'
      size = 'large', // 'large', 'medium', 'small'
      color = null,
      minWidth = null,
      minHeight = null,
      minDuration = null,
      maxDuration = null,
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PEXELS_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Build API URL based on type
    const baseUrl = type === 'videos'
      ? 'https://api.pexels.com/videos/search'
      : 'https://api.pexels.com/v1/search';

    // Build query parameters
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (orientation) params.append('orientation', orientation);
    if (size) params.append('size', size);
    if (color) params.append('color', color);

    // Video-specific parameters
    if (type === 'videos') {
      if (minWidth) params.append('min_width', minWidth.toString());
      if (minHeight) params.append('min_height', minHeight.toString());
      if (minDuration) params.append('min_duration', minDuration.toString());
      if (maxDuration) params.append('max_duration', maxDuration.toString());
    }

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pexels API error:', response.status, errorText);
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    // Format response based on type
    if (type === 'videos') {
      const videos = data.videos?.map((video: any) => ({
        id: video.id,
        width: video.width,
        height: video.height,
        duration: video.duration,
        image: video.image,
        videoFiles: video.video_files?.map((file: any) => ({
          id: file.id,
          quality: file.quality,
          fileType: file.file_type,
          width: file.width,
          height: file.height,
          link: file.link,
        })),
        photographer: video.user?.name || video.photographer,
        photographerUrl: video.user?.url || video.photographer_url,
        url: video.url,
      })) || [];

      return NextResponse.json({
        success: true,
        type: 'videos',
        results: videos,
        page: data.page,
        perPage: data.per_page,
        totalResults: data.total_results,
        nextPage: data.next_page,
      });
    } else {
      const photos = data.photos?.map((photo: any) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
        src: {
          original: photo.src?.original,
          large2x: photo.src?.large2x,
          large: photo.src?.large,
          medium: photo.src?.medium,
          small: photo.src?.small,
          portrait: photo.src?.portrait,
          landscape: photo.src?.landscape,
          tiny: photo.src?.tiny,
        },
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        photographerId: photo.photographer_id,
        avgColor: photo.avg_color,
        url: photo.url,
        alt: photo.alt,
      })) || [];

      return NextResponse.json({
        success: true,
        type: 'photos',
        results: photos,
        page: data.page,
        perPage: data.per_page,
        totalResults: data.total_results,
        nextPage: data.next_page,
      });
    }
  } catch (error: any) {
    console.error('Pexels search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search Pexels' },
      { status: 500 }
    );
  }
}
