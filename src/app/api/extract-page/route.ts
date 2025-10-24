import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

interface ExtractOptions {
  urls: string[];
  includeImages?: boolean;
  includeFonts?: boolean;
  includeFullStylesheet?: boolean;
}

async function downloadAsBase64(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'] || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to download: ${url}`, error);
    return null;
  }
}

async function extractPage(url: string, options: ExtractOptions) {
  // Fetch the page with axios using more realistic browser headers
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': new URL(url).origin,
    },
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const html = response.data;
  const $ = cheerio.load(html);
  const parsedUrl = new URL(url);

  // Extract inline styles
  const inlineStyles: string[] = [];
  $('style').each((i, elem) => {
    const content = $(elem).html();
    if (content) {
      inlineStyles.push(content);
    }
  });

  // Extract external stylesheets
  const externalStyles: string[] = [];
  const stylesheetPromises: Promise<string>[] = [];

  $('link[rel="stylesheet"]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      try {
        const absoluteUrl = new URL(href, url).href;
        stylesheetPromises.push(
          axios.get(absoluteUrl, { timeout: 10000 })
            .then(res => res.data)
            .catch(() => `/* Failed to load: ${absoluteUrl} */`)
        );
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });

  const fetchedStyles = await Promise.all(stylesheetPromises);
  externalStyles.push(...fetchedStyles);

  // Extract Google Fonts and other web fonts from <link> tags
  const webFontUrls: string[] = [];
  $('link[rel="stylesheet"]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href && (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com'))) {
      try {
        const absoluteUrl = new URL(href, url).href;
        webFontUrls.push(absoluteUrl);
      } catch (e) {
        // Invalid URL
      }
    }
  });

  // Fetch Google Fonts CSS to get @font-face rules
  const webFontStyles: string[] = [];
  if (options.includeFonts && webFontUrls.length > 0) {
    for (const fontUrl of webFontUrls) {
      try {
        const fontCssResponse = await axios.get(fontUrl, {
          timeout: 10000,
          headers: {
            // Important: Google Fonts returns different CSS based on User-Agent
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
        });
        webFontStyles.push(fontCssResponse.data);
      } catch (e) {
        console.error(`Failed to fetch web font: ${fontUrl}`, e);
      }
    }
  }

  // Combine all CSS including web fonts
  const combinedCss = [...inlineStyles, ...externalStyles, ...webFontStyles]
    .filter(css => css.trim().length > 0)
    .join('\n\n');

  // Extract fonts from CSS (@font-face rules)
  let fonts: { name: string; url: string; base64?: string }[] = [];
  let cssWithLocalFonts = combinedCss;

  if (options.includeFonts) {
    const fontFaceRegex = /@font-face\s*{[^}]*}/gs;
    const fontUrlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
    const fontFamilyRegex = /font-family:\s*['"]?([^'";]+)['"]?/;

    const fontFaces = combinedCss.match(fontFaceRegex) || [];
    const seenUrls = new Set<string>();
    const urlReplacements: { [key: string]: string } = {};

    for (const fontFace of fontFaces) {
      const urls = [...fontFace.matchAll(fontUrlRegex)];
      const familyMatch = fontFace.match(fontFamilyRegex);
      const fontFamily = familyMatch ? familyMatch[1].trim() : 'unknown';

      for (const match of urls) {
        const fontUrl = match[1];
        if (seenUrls.has(fontUrl)) continue;
        seenUrls.add(fontUrl);

        try {
          const absoluteUrl = fontUrl.startsWith('http') ? fontUrl : new URL(fontUrl, url).href;
          const base64 = await downloadAsBase64(absoluteUrl);
          const extension = fontUrl.split('.').pop()?.split('?')[0] || 'woff2';
          const fontName = `${fontFamily.replace(/[^a-z0-9]/gi, '_')}.${extension}`;

          fonts.push({
            name: fontName,
            url: absoluteUrl,
            base64: base64 || undefined,
          });

          // Track replacement for updating CSS
          urlReplacements[fontUrl] = `fonts/${fontName}`;
        } catch (e) {
          console.error(`Failed to process font: ${fontUrl}`, e);
        }
      }
    }

    // Replace font URLs in CSS to point to local files
    cssWithLocalFonts = combinedCss;
    for (const [originalUrl, localPath] of Object.entries(urlReplacements)) {
      // Skip base64 URLs (data:) - they're already embedded
      if (originalUrl.startsWith('data:')) continue;

      // Escape regex special characters
      const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cssWithLocalFonts = cssWithLocalFonts.replace(
        new RegExp(`url\\(['"]?${escapedUrl}['"]?\\)`, 'g'),
        `url('${localPath}')`
      );
    }
  }

  // Extract images and convert to base64 if requested
  let images: { src: string; alt?: string; base64?: string }[] = [];
  if (options.includeImages) {
    const imagePromises: Promise<void>[] = [];

    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt');

      if (src) {
        try {
          const absoluteUrl = new URL(src, url).href;
          images.push({ src: absoluteUrl, alt });

          imagePromises.push(
            downloadAsBase64(absoluteUrl).then(base64 => {
              if (base64) {
                // Find the image in the array and update it
                const img = images.find(i => i.src === absoluteUrl);
                if (img) img.base64 = base64;

                // Replace src in HTML with base64
                $(elem).attr('src', base64);
              }
            })
          );
        } catch (e) {
          // Invalid URL
        }
      }
    });

    await Promise.all(imagePromises);
  }

  // Extract inline scripts
  const inlineScripts: string[] = [];
  $('script:not([src])').each((i, elem) => {
    const content = $(elem).html();
    if (content && content.trim()) {
      inlineScripts.push(content);
    }
  });

  // Extract external scripts (filter out analytics/tracking)
  const externalScripts: string[] = [];
  const scriptPromises: Promise<string>[] = [];

  $('script[src]').each((i, elem) => {
    const src = $(elem).attr('src');
    if (src &&
        !src.includes('google') &&
        !src.includes('analytics') &&
        !src.includes('gtag') &&
        !src.includes('facebook') &&
        !src.includes('pixel')) {
      try {
        const absoluteUrl = new URL(src, url).href;
        scriptPromises.push(
          axios.get(absoluteUrl, { timeout: 10000 })
            .then(res => res.data)
            .catch(() => `/* Failed to load: ${absoluteUrl} */`)
        );
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });

  const fetchedScripts = await Promise.all(scriptPromises);
  externalScripts.push(...fetchedScripts);

  // Clean HTML - remove scripts and style tags
  $('script').remove();
  $('style').remove();
  $('link[rel="stylesheet"]').remove();

  // Remove tracking/analytics elements
  $('[class*="analytics"]').remove();
  $('[id*="analytics"]').remove();
  $('[class*="gtag"]').remove();
  $('[id*="gtag"]').remove();

  // Get clean HTML (body content only)
  const bodyContent = $('body').html() || $.html();

  // Combine all JS
  const combinedJs = [...inlineScripts, ...externalScripts]
    .filter(js => js.trim().length > 0)
    .join('\n\n');

  // Create version WITH inline styles (complete.html)
  // Use $.html() to preserve image base64 conversions
  const $withStyles = cheerio.load($.html());
  $withStyles('script').remove();
  $withStyles('style').remove();
  $withStyles('[style]').removeAttr('style');
  $withStyles('link[rel="stylesheet"]').remove();

  if (!$withStyles('head').length) {
    $withStyles('html').prepend('<head></head>');
  }

  // Use cssWithLocalFonts when fonts are included, otherwise use combinedCss
  const finalCss = options.includeFonts ? cssWithLocalFonts : combinedCss;

  if (finalCss.length > 0) {
    $withStyles('head').append(`<style>${finalCss}</style>`);
  }

  if (combinedJs.length > 0) {
    $withStyles('body').append(`<script>${combinedJs}</script>`);
  }

  const fullHtml = $withStyles.html();

  // Create version with external file links for ZIP download
  // Use $.html() to preserve image base64 conversions
  const $linked = cheerio.load($.html());

  // Remove all inline styles and style tags
  $linked('style').remove();
  $linked('[style]').removeAttr('style');

  // Remove all inline scripts
  $linked('script').remove();

  // Remove existing stylesheet links
  $linked('link[rel="stylesheet"]').remove();

  // Add links to external files in head
  if (!$linked('head').length) {
    $linked('html').prepend('<head></head>');
  }

  // Add CSS link
  if (finalCss.length > 0) {
    $linked('head').append('<link rel="stylesheet" href="styles.css">');
  }

  // Add JS script tag at end of body
  if (combinedJs.length > 0) {
    $linked('body').append('<script src="scripts.js"></script>');
  }

  const fullHtmlWithLinks = $linked.html();

  return {
    html: bodyContent,
    fullHtml,
    fullHtmlWithLinks,
    css: finalCss,
    js: combinedJs,
    fonts,
    images,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls, includeImages = false, includeFonts = false, includeFullStylesheet = false } = body;

    // Support both single URL and array of URLs
    const urlArray = Array.isArray(urls) ? urls : [urls || body.url];

    if (!urlArray.length || !urlArray[0]) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const options: ExtractOptions = {
      urls: urlArray,
      includeImages,
      includeFonts,
      includeFullStylesheet,
    };

    const results: any[] = [];

    for (const url of urlArray) {
      // Validate URL
      try {
        new URL(url);
      } catch (e) {
        results.push({
          url,
          success: false,
          error: `Invalid URL: ${url}`,
        });
        continue;
      }

      try {
        const processed = await extractPage(url, options);

        results.push({
          url,
          success: true,
          files: {
            html: processed.html,
            fullHtml: processed.fullHtml,
            fullHtmlWithLinks: processed.fullHtmlWithLinks,
            css: processed.css,
            js: processed.js,
            markdown: '', // Not available without Firecrawl
          },
          metadata: {
            title: 'Extracted Page',
            description: '',
            sourceUrl: url,
            extractedAt: new Date().toISOString(),
            stats: {
              htmlLength: processed.html.length,
              cssLength: processed.css.length,
              jsLength: processed.js.length,
              inlineStylesCount: 0,
              externalStylesCount: 0,
              inlineScriptsCount: 0,
              externalScriptsCount: 0,
              imagesCount: processed.images.length,
              fontsCount: processed.fonts.length,
            },
          },
          images: processed.images,
          fonts: processed.fonts,
        });
      } catch (error: any) {
        console.error(`Extract page error for ${url}:`, error);
        results.push({
          url,
          success: false,
          error: error.message || 'Failed to extract page',
        });
      }
    }

    // If single URL, return single result
    if (urlArray.length === 1) {
      return NextResponse.json(results[0]);
    }

    // If multiple URLs, return batch result
    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
      results,
    });
  } catch (error: any) {
    console.error('Extract page error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract page' },
      { status: 500 }
    );
  }
}
