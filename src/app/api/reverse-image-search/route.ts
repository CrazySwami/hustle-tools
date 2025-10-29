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

    // Primary: SerpAPI Google Reverse Image Search
    if (process.env.SERPAPI_API_KEY) {
      try {
        let serpResponse;
        const isDataUrl = imageUrl.startsWith('data:');

        if (isDataUrl) {
          // For data URLs, upload to Imgur (Google Lens trusts Imgur more than ImgBB)
          console.log('Data URL detected - uploading to Imgur to get public URL...');

          const base64Data = imageUrl.split(',')[1];

          // Use Imgur anonymous upload
          const uploadResponse = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
              'Authorization': 'Client-ID 546c25a59c58ad7',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              type: 'base64',
            }),
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Imgur upload failed:', uploadResponse.status, errorText);
            throw new Error('Failed to upload image to Imgur');
          }

          const uploadData = await uploadResponse.json();

          if (!uploadData.success || !uploadData.data?.link) {
            console.error('Imgur returned error:', uploadData);
            throw new Error('Imgur upload failed');
          }

          const publicImageUrl = uploadData.data.link;
          console.log('Image uploaded to Imgur successfully:', publicImageUrl);

          // Now use the public URL with SerpAPI Google Lens (better for image matching)
          const serpApiUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(publicImageUrl)}&api_key=${process.env.SERPAPI_API_KEY}`;
          console.log('Using SerpAPI Google Lens with uploaded image');
          serpResponse = await fetch(serpApiUrl);
        } else {
          // For public URLs, use Google Lens API
          console.log('Using SerpAPI Google Lens with image_url:', imageUrl);
          const serpApiUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${process.env.SERPAPI_API_KEY}`;
          serpResponse = await fetch(serpApiUrl);
        }

        // Check if response is JSON
        const contentType = serpResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('SerpAPI returned non-JSON response:', contentType);
          throw new Error('SerpAPI returned invalid response. Check your API key.');
        }

        const serpData = await serpResponse.json();
        console.log('SerpAPI response keys:', Object.keys(serpData));
        console.log('Has visual_matches:', !!serpData.visual_matches, 'count:', serpData.visual_matches?.length);
        console.log('Has inline_images:', !!serpData.inline_images, 'count:', serpData.inline_images?.length);
        console.log('Has image_results:', !!serpData.image_results, 'count:', serpData.image_results?.length);
        console.log('Has image_sources:', !!serpData.image_sources, 'count:', serpData.image_sources?.length);

        // Log first result to see structure
        if (serpData.visual_matches?.[0]) {
          console.log('First visual_match:', JSON.stringify(serpData.visual_matches[0], null, 2));
        }
        if (serpData.inline_images?.[0]) {
          console.log('First inline_image:', JSON.stringify(serpData.inline_images[0], null, 2));
        }
        if (serpData.image_results?.[0]) {
          console.log('First image_result:', JSON.stringify(serpData.image_results[0], null, 2));
        }

        // Check for SerpAPI errors (but ignore "no results" error)
        if (serpData.error) {
          console.log('SerpAPI message:', serpData.error);

          // If it's a "no results" message, return empty results instead of erroring
          if (serpData.error.includes("hasn't returned any results")) {
            return NextResponse.json({
              success: true,
              results: {
                bestGuess: 'No matches found',
                visuallySimilarImages: [],
                pagesWithMatchingImages: [],
                totalResults: 0,
                message: 'Google couldn\'t find any similar images for this query. Try a different image or use Google Lens manually.',
              },
              method: 'serpapi',
            });
          }

          // For other errors, throw
          console.error('SerpAPI error:', serpData.error);
          throw new Error(serpData.error);
        }

        // Google Lens returns visual_matches with thumbnails
        const visualMatches = serpData.visual_matches?.map((match: any) => ({
          url: match.thumbnail || match.source,
          title: match.title,
          snippet: match.source_name || match.source,
          link: match.link || match.source,
        })) || [];

        console.log('Parsed visual matches:', visualMatches.length);

        const allImages = visualMatches;

        return NextResponse.json({
          success: true,
          results: {
            bestGuess: serpData.search_information?.query_displayed || serpData.search_metadata?.google_lens_title || serpData.best_guess || 'Unknown',
            visuallySimilarImages: allImages.slice(0, 20),
            pagesWithMatchingImages: serpData.organic_results?.map((result: any) => ({
              url: result.link,
              title: result.title,
              snippet: result.snippet,
            })) || [],
            totalResults: allImages.length,
          },
          method: 'serpapi',
        });
      } catch (error: any) {
        console.error('SerpAPI request failed:', error?.message || error);
        console.error('Full error:', error);
        // Fall through to fallback
      }
    }

    // Fallback: Return Google Lens URL for manual search
    const isDataUrl = imageUrl.startsWith('data:');
    const googleLensUrl = isDataUrl
      ? 'https://lens.google.com/search?p'
      : `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;

    const message = isDataUrl
      ? 'For uploaded or generated images, use Google Lens to manually search. Click the button below to open Google Lens and upload your image.'
      : 'SerpAPI request failed. Click the button below to search with Google Lens.';

    return NextResponse.json({
      success: true,
      results: {
        message,
        googleLensUrl,
      },
      method: 'manual',
    });
  } catch (error: any) {
    console.error('Reverse image search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform reverse image search' },
      { status: 500 }
    );
  }
}
