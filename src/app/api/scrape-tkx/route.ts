import { NextRequest, NextResponse } from 'next/server';

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '\"')
    .replace(/&#39;/g, "'");
}

function extractBetween(html: string, regex: RegExp) {
  const m = regex.exec(html);
  return m ? decodeHtml(m[1].trim()) : null;
}

function extractAll(html: string, regex: RegExp) {
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(decodeHtml(match[1].trim()));
  }
  return matches;
}

// Universal parser for both new and old formats
function parseEventPage(html: string, sourceUrl:string) {
  let title: string | null = null;
  let specialGuests: string[] = [];
  let imageUrl: string | null = null;
  let month: string | null = null;
  let day: string | null = null;
  let week: string | null = null;
  let venue: string | null = null;
  let time: string | null = null;
  let promoter: string | null = null;

  // --- Artist & Special Guest Parsing (New Priority) ---
  const eventArtistMatch = html.match(/<div[^>]*class=["']event-artist["'][^>]*>([\s\S]*?)<\/div>/i);
  if (eventArtistMatch && eventArtistMatch[1]) {
    const artistHtml = eventArtistMatch[1];
    // This regex finds text within tags or just plain text between tags.
    const artists = extractAll(artistHtml, />([^<]+)</g).filter(name => name.trim() !== '');
    if (artists.length > 0) {
      title = artists[0];
      specialGuests = artists.slice(1);
    }
  }

  // --- Format-Specific Parsing ---
  if (html.includes('bg-tkx-blue-75')) { // New Format
    const imageMatch = html.match(/<img[^>]*src=["']\/_next\/image\?url=([^&"']+)[^"']*["'][^>]*>/);
    imageUrl = imageMatch && imageMatch[1] ? decodeURIComponent(imageMatch[1]) : null;
    month = extractBetween(html, /<div[^>]*bg-tkx-blue-75[^>]*>.*?<p[^>]*font-semibold[^>]*>([^<]+)<\/p>/s);
    day = extractBetween(html, /<div[^>]*bg-tkx-blue-75[^>]*>.*?<p[^>]*font-extrabold[^>]*>([^<]+)<\/p>/s);
    week = extractBetween(html, /<div[^>]*bg-tkx-blue[^>]*>.*?<p[^>]*>([^<]+)<\/p>/s);
    const venueAndTimeRaw = extractBetween(html, /<p[^>]*text-tkx-blue-75 font-medium[^>]*>([^<]+<!-- --> \| <!-- -->[^<]+)<\/p>/s);
    if (venueAndTimeRaw) {
      const parts = venueAndTimeRaw.split(' | ');
      venue = parts[0]?.trim() || null;
      time = parts[1]?.trim() || null;
    }
    // If artist parsing failed, fallback to old title logic for new format
    if (!title) {
      title = extractBetween(html, /<p[^>]*text-tkx-black font-semibold[^>]*>([^<]+)<\/p>/s);
    }
  } else { // Original Format
    imageUrl = extractBetween(html, /<div[^>]*class=[\"'][^\"']*\bmain-image\b[^\"']*[\"'][^>]*style=[\"'][^\"']*background-image\s*:\s*url\(([^)]+)\)[^\"']*[\"'][^>]*>/i)
      ?.replace(/^['\"]|['\"]$/g, '').replace(/^url\(|\)$/g, '').replace(/^['\"]|['\"]$/g, '').replace(/&amp;/g, '&');
    month = extractBetween(html, /<div[^>]*class=[\"']month[\"'][^>]*>([^<]+)<\/div>/i);
    day = extractBetween(html, /<div[^>]*class=[\"']day[\"'][^>]*>([^<]+)<\/div>/i);
    week = extractBetween(html, /<div[^>]*class=[\"']week[\"'][^>]*>([^<]+)<\/div>/i);
    const postCategoryRaw = extractBetween(html, /<div[^>]*class=[\"']post-category[\"'][^>]*>([\s\S]*?)<\/div>/i);
    if (postCategoryRaw) {
      const parts = postCategoryRaw.split(/<br\s*\/?>/i).map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      if (parts.length > 0) {
        const first = parts[0];
        const pipeSplit = first.split('|');
        venue = (pipeSplit[0] || first).trim();
      }
      if (parts.length > 1) {
        const second = parts[1];
        const m = second.match(/(\d{1,2}(?::\d{2})?\s*[ap]m)/i);
        time = m ? m[1].replace(/\s+/g, '').toLowerCase() : null;
      }
    }
    promoter = extractBetween(html, /<div[^>]*class=[\"']event-promoter[\"'][^>]*>([^<]+)<\/div>/i);
    if (promoter && promoter.toLowerCase().includes('foundation presents')) {
      promoter = null;
    }
    // Fallback for title if new artist logic didn't run/succeed
    if (!title) {
      title = extractBetween(html, /<h2[^>]*>([^<]+)<\/h2>/i);
    }
  }

  return { url: sourceUrl, imageUrl, month, day, week, venue, time, title, promoter, specialGuests };
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urls: string[] = Array.isArray(body?.urls)
      ? body.urls
      : typeof body?.urlsText === 'string'
        ? body.urlsText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean)
        : [];

    if (!urls.length) {
      return NextResponse.json({ success: false, error: 'No URLs provided' }, { status: 400 });
    }

    const results = await Promise.all(
      urls.map(async (u) => {
        try {
          const res = await fetch(u, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
          const html = await res.text();
          if (!res.ok || !html) {
            return { url: u, error: `Failed to fetch page (${res.status})` };
          }
          return parseEventPage(html, u);
        } catch (e: any) {
          return { url: u, error: e?.message || 'Failed to fetch' };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}