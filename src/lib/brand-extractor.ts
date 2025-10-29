import * as cheerio from 'cheerio';

interface Logo {
  url: string;
  type: 'favicon' | 'apple-touch-icon' | 'og:image' | 'twitter:image' | 'nav-logo' | 'fallback';
  score: number;
  dimensions?: { width: number; height: number };
  alt?: string;
}

interface ColorInfo {
  hex: string;
  rgb: string;
  frequency: number;
  category?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background';
}

interface FontInfo {
  family: string;
  frequency: number;
  source?: 'google-fonts' | 'adobe-fonts' | 'system' | 'custom';
  weights?: number[];
  url?: string;
}

/**
 * Extract logo candidates from HTML with scoring
 */
export function extractLogos(html: string, baseUrl: string): Logo[] {
  const $ = cheerio.load(html);
  const logos: Logo[] = [];
  const domain = new URL(baseUrl).origin;

  // Helper to resolve relative URLs
  const resolveUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${domain}${url}`;
    return `${domain}/${url}`;
  };

  // 1. Favicon (link[rel~=icon])
  $('link[rel*="icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      logos.push({
        url: resolveUrl(href),
        type: 'favicon',
        score: 0.5, // Lower score, often small
      });
    }
  });

  // 2. Apple Touch Icon
  $('link[rel="apple-touch-icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      logos.push({
        url: resolveUrl(href),
        type: 'apple-touch-icon',
        score: 0.7, // Better quality than favicon
      });
    }
  });

  // 3. Open Graph Image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    logos.push({
      url: resolveUrl(ogImage),
      type: 'og:image',
      score: 0.8, // High quality, brand representative
    });
  }

  // 4. Twitter Image
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage) {
    logos.push({
      url: resolveUrl(twitterImage),
      type: 'twitter:image',
      score: 0.8,
    });
  }

  // 5. Nav/Header logos (img with "logo" in src/alt/class)
  $('header img, nav img, [class*="header"] img, [class*="nav"] img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    const className = $(el).attr('class') || '';

    if (src && (
      src.toLowerCase().includes('logo') ||
      alt.toLowerCase().includes('logo') ||
      className.toLowerCase().includes('logo')
    )) {
      logos.push({
        url: resolveUrl(src),
        type: 'nav-logo',
        score: 0.9, // Very likely to be the main logo
        alt,
      });
    }
  });

  // 6. Fallback: /favicon.ico
  logos.push({
    url: `${domain}/favicon.ico`,
    type: 'fallback',
    score: 0.3,
  });

  // Deduplicate by URL
  const uniqueLogos = Array.from(
    new Map(logos.map(logo => [logo.url, logo])).values()
  );

  // Sort by score (highest first)
  return uniqueLogos.sort((a, b) => b.score - a.score);
}

/**
 * Extract colors from CSS with frequency counting
 */
export function extractColors(css: string): ColorInfo[] {
  const colorMap = new Map<string, number>();

  // Regex patterns for different color formats
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
  const rgbPattern = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/g;
  const hslPattern = /hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/g;

  // Extract and normalize HEX colors
  let match;
  while ((match = hexPattern.exec(css)) !== null) {
    let hex = match[0].toLowerCase();
    // Expand 3-digit hex to 6-digit
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }

  // Extract and normalize RGB colors
  while ((match = rgbPattern.exec(css)) !== null) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }

  // Extract and normalize HSL colors
  while ((match = hslPattern.exec(css)) !== null) {
    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);
    const rgb = hslToRgb(h / 360, s / 100, l / 100);
    const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }

  // Convert to array and filter out common utility colors
  const colors = Array.from(colorMap.entries())
    .map(([hex, frequency]) => ({
      hex,
      rgb: hexToRgb(hex),
      frequency,
    }))
    .filter(color => {
      // Filter out pure white/black and very light/dark grays
      const { r, g, b } = parseRgb(color.rgb);
      const isWhiteish = r > 250 && g > 250 && b > 250;
      const isBlackish = r < 10 && g < 10 && b < 10;
      return !isWhiteish && !isBlackish;
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20); // Top 20 colors

  // Cluster similar colors and assign categories
  return clusterAndCategorizeColors(colors);
}

/**
 * Extract fonts from CSS and link tags
 */
export function extractFonts(html: string, css: string): FontInfo[] {
  const $ = cheerio.load(html);
  const fontMap = new Map<string, FontInfo>();

  // 1. Extract from Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      // Parse family name from URL: ?family=Roboto:wght@400;700
      const familyMatch = href.match(/family=([^:&]+)/);
      const weightsMatch = href.match(/wght@([\d;]+)/);

      if (familyMatch) {
        const family = decodeURIComponent(familyMatch[1].replace(/\+/g, ' '));
        const weights = weightsMatch
          ? weightsMatch[1].split(';').map(w => parseInt(w))
          : [];

        fontMap.set(family, {
          family,
          frequency: 0,
          source: 'google-fonts',
          weights,
          url: href,
        });
      }
    }
  });

  // 2. Extract from Adobe/Typekit
  $('link[href*="typekit.net"], link[href*="use.typekit.net"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      // Adobe fonts don't expose family names in URL, mark as adobe-fonts
      fontMap.set(`Adobe Fonts`, {
        family: 'Adobe Fonts',
        frequency: 0,
        source: 'adobe-fonts',
        url: href,
      });
    }
  });

  // 3. Extract from CSS font-family declarations
  const fontFamilyPattern = /font-family:\s*([^;]+);/g;
  let match;

  while ((match = fontFamilyPattern.exec(css)) !== null) {
    const families = match[1]
      .split(',')
      .map(f => f.trim().replace(/['"]/g, ''))
      .filter(f => f && !f.includes('var(') && !isGenericFontFamily(f));

    families.forEach(family => {
      const existing = fontMap.get(family);
      if (existing) {
        existing.frequency += 1;
      } else {
        fontMap.set(family, {
          family,
          frequency: 1,
          source: fontMap.has(family) ? fontMap.get(family)!.source : 'custom',
        });
      }
    });
  }

  // Convert to array and sort by frequency
  return Array.from(fontMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10); // Top 10 fonts
}

/**
 * Helper: Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Helper: Convert HEX to RGB string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'rgb(0, 0, 0)';
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
}

/**
 * Helper: Parse RGB string to components
 */
function parseRgb(rgb: string): { r: number; g: number; b: number } {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
  };
}

/**
 * Helper: Cluster similar colors and assign categories
 */
function clusterAndCategorizeColors(colors: ColorInfo[]): ColorInfo[] {
  if (colors.length === 0) return [];

  // Simple clustering: merge colors within 20 units of RGB distance
  const clustered: ColorInfo[] = [];

  for (const color of colors) {
    const { r, g, b } = parseRgb(color.rgb);

    // Check if similar to existing cluster
    const similar = clustered.find(c => {
      const { r: r2, g: g2, b: b2 } = parseRgb(c.rgb);
      const distance = Math.sqrt(
        Math.pow(r - r2, 2) +
        Math.pow(g - g2, 2) +
        Math.pow(b - b2, 2)
      );
      return distance < 30;
    });

    if (similar) {
      // Merge into existing cluster
      similar.frequency += color.frequency;
    } else {
      // Create new cluster
      clustered.push({ ...color });
    }
  }

  // Sort by frequency again after clustering
  clustered.sort((a, b) => b.frequency - a.frequency);

  // Assign categories to top colors
  if (clustered.length > 0) clustered[0].category = 'primary';
  if (clustered.length > 1) clustered[1].category = 'secondary';
  if (clustered.length > 2) clustered[2].category = 'accent';

  // Categorize remaining as neutral or background
  for (let i = 3; i < clustered.length; i++) {
    const { r, g, b } = parseRgb(clustered[i].rgb);
    const avg = (r + g + b) / 3;
    clustered[i].category = avg > 200 ? 'background' : 'neutral';
  }

  return clustered.slice(0, 12); // Return top 12 clustered colors
}

/**
 * Helper: Check if font family is generic
 */
function isGenericFontFamily(family: string): boolean {
  const generic = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];
  return generic.includes(family.toLowerCase());
}
