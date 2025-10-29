// API endpoint to scrape website content
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🌐 Scraping URL:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const content = await response.text();

    console.log('✅ Successfully scraped URL, content length:', content.length);

    return new Response(
      JSON.stringify({
        url,
        content,
        contentLength: content.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Scrape error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to scrape URL' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
