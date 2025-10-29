import { NextRequest, NextResponse } from 'next/server';
import { extractLogos, extractColors, extractFonts } from '@/lib/brand-extractor';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('🎨 Analyzing brand:', url);

    // 1. Fetch HTML
    const htmlResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandExtractor/1.0)',
      },
    });

    if (!htmlResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${htmlResponse.statusText}` },
        { status: htmlResponse.status }
      );
    }

    const html = await htmlResponse.text();
    console.log('✅ HTML fetched');

    // 2. Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // 3. Extract logos
    const logos = extractLogos(html, url);
    console.log(`✅ Found ${logos.length} logo candidates`);

    // 4. Fetch and combine CSS
    const cssUrls = extractCssUrls(html, targetUrl.origin);
    console.log(`📄 Found ${cssUrls.length} CSS files`);

    let combinedCss = '';

    // Fetch same-origin CSS files
    for (const cssUrl of cssUrls.slice(0, 10)) { // Limit to first 10 files
      try {
        const cssResponse = await fetch(cssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BrandExtractor/1.0)',
          },
        });

        if (cssResponse.ok) {
          combinedCss += await cssResponse.text() + '\n';
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch CSS: ${cssUrl}`, err);
      }
    }

    // Also extract inline styles
    const inlineStylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = inlineStylePattern.exec(html)) !== null) {
      combinedCss += styleMatch[1] + '\n';
    }

    console.log(`✅ Combined CSS: ${combinedCss.length} chars`);

    // 5. Extract colors
    const colors = extractColors(combinedCss);
    console.log(`✅ Found ${colors.length} colors`);

    // 6. Extract fonts
    const fonts = extractFonts(html, combinedCss);
    console.log(`✅ Found ${fonts.length} fonts`);

    // 7. Return analysis
    return NextResponse.json({
      url,
      title,
      logos,
      colors,
      fonts,
      extractedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Brand analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze brand' },
      { status: 500 }
    );
  }
}

/**
 * Extract CSS file URLs from HTML
 */
function extractCssUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkPattern = /<link[^>]+rel=["']stylesheet["'][^>]+>/gi;
  const domain = new URL(baseUrl).origin;

  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      let href = hrefMatch[1];

      // Resolve relative URLs
      if (href.startsWith('http')) {
        urls.push(href);
      } else if (href.startsWith('//')) {
        urls.push(`https:${href}`);
      } else if (href.startsWith('/')) {
        urls.push(`${domain}${href}`);
      } else {
        urls.push(`${domain}/${href}`);
      }
    }
  }

  // Filter to same-origin only for politeness
  return urls.filter(url => url.startsWith(domain));
}
