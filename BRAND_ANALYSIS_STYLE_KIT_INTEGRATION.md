# Brand Analysis → Elementor Style Kit Integration

## Overview

The Brand Analysis tool automatically extracts brand identity (logos, colors, fonts) from any website and applies them directly to Elementor's global Style Kit settings in WordPress Playground.

## How It Works

### 1. Brand Extraction (`/api/analyze-brand`)

**What it extracts:**
- **Logos**: Favicons, apple-touch-icons, og:image, twitter:image, nav logos
- **Colors**: All colors from CSS (hex, rgb, hsl) with intelligent clustering and categorization
- **Fonts**: Google Fonts, Adobe Fonts, custom fonts with weights and sources

**Extraction Process:**
```
User enters URL → Fetch HTML + CSS → Parse assets → Score & cluster → Return JSON
```

**Logo Scoring:**
- Nav logos: 0.9 (highest - most likely to be brand logo)
- OG/Twitter images: 0.8 (high - brand representative)
- Apple touch icons: 0.7 (good quality)
- Favicons: 0.5 (lower - often small)
- Fallback (/favicon.ico): 0.3

**Color Clustering:**
- Extracts all colors from CSS properties (color, background, border, etc.)
- Filters out pure white/black utility colors
- Clusters similar colors within 30 RGB units
- Assigns categories: primary, secondary, accent, neutral, background
- Returns top 12 most frequent colors

**Font Detection:**
- Parses Google Fonts from `<link>` tags with weights
- Detects Adobe/Typekit fonts
- Counts font-family usage in CSS
- Filters out generic system fonts

### 2. Style Kit Conversion (`brand-to-stylekit.ts`)

Converts brand analysis to Elementor's Style Kit format:

**Elementor Style Kit Structure:**
```typescript
{
  custom_colors: [
    { _id: 'brand_color_1', title: 'Primary', color: '#0A2540' },
    { _id: 'brand_color_2', title: 'Secondary', color: '#F6F9FC' },
    // ... up to 8 colors
  ],
  custom_typography: [
    { _id: 'brand_font_1', title: 'Primary Heading', typography_font_family: 'Inter', typography_font_weight: '700' },
    { _id: 'brand_font_2', title: 'Body Text', typography_font_family: 'Inter', typography_font_weight: '400' },
    // ... up to 6 fonts
  ]
}
```

**Color Mapping:**
- Top 8 colors from brand analysis
- Titles based on category (Primary, Secondary, Accent) or position (Color 1, Color 2)
- Hex codes converted to uppercase

**Font Mapping:**
- Filters out system fonts (-apple-system, BlinkMacSystemFont, etc.)
- Top 6 custom fonts
- Titles: "Primary Heading", "Secondary Heading", "Body Text", "Font 4", etc.
- Default weight: 400 or first available weight

### 3. WordPress Playground Integration

**Functions in `playground.js`:**

#### `getElementorStyleKit()`
Retrieves current Style Kit from WordPress:
- Reads `elementor_active_kit` option
- Gets `_elementor_page_settings` post meta
- Returns system_colors, system_typography, custom_colors, custom_typography

#### `setElementorStyleKit(styleKit)`
Applies Style Kit to WordPress:
1. Gets or creates active kit post (type: `elementor_library`, template_type: `kit`)
2. Merges new colors/fonts with existing kit settings
3. Updates `_elementor_page_settings` post meta
4. Returns success confirmation

**File-Based Approach:**
Uses JSON temp files (not string interpolation) to avoid PHP escaping issues:
```javascript
await playgroundClient.writeFile('/tmp/style_kit.json', JSON.stringify(styleKit));
// PHP reads: $data = json_decode(file_get_contents('/tmp/style_kit.json'), true);
```

### 4. User Flow

1. **Extract Brand:**
   - User enters URL in Brand Analysis tab
   - Click "Analyze Brand"
   - System fetches HTML/CSS and extracts assets
   - Results displayed: logos grid, color swatches, font previews

2. **Preview Fonts:**
   - Google Fonts automatically loaded via dynamic `<link>` tags
   - Custom fonts attempted via Google Fonts API
   - Fonts render in "The quick brown fox..." previews

3. **Apply to Style Kit:**
   - User clicks "🎨 Apply to Style Kit" button
   - Brand data converted to Elementor format
   - `setElementorStyleKit()` called to write to WordPress
   - Success message: "✅ Style Kit updated! Colors and fonts have been applied to Elementor globals."

4. **Use in Elementor:**
   - Open WordPress Playground tab
   - Edit any page with Elementor
   - Global colors/fonts now available in style picker
   - Changes apply site-wide across all Elementor pages

## Files Created/Modified

### New Files:
- `src/components/elementor/BrandAnalyzer.tsx` - UI component for brand extraction
- `src/app/api/analyze-brand/route.ts` - API endpoint for brand analysis
- `src/lib/brand-extractor.ts` - Core extraction logic (logos, colors, fonts)
- `src/lib/brand-to-stylekit.ts` - Converter from brand format to Elementor format

### Modified Files:
- `src/app/elementor-editor/page.tsx` - Added Brand Analysis tab
- `public/playground.js` - Already had `getElementorStyleKit()` and `setElementorStyleKit()`

## Technical Details

### Color Extraction Algorithm

1. **Parse CSS:**
   - Regex patterns for hex (#RRGGBB), rgb(), hsl()
   - Extract from all CSS files + inline `<style>` tags

2. **Normalize:**
   - Convert all formats to hex
   - Expand 3-digit hex (#ABC → #AABBCC)

3. **Filter:**
   - Remove pure white (RGB > 250, 250, 250)
   - Remove pure black (RGB < 10, 10, 10)

4. **Cluster:**
   - Calculate RGB distance between colors
   - Merge colors within 30 units (perceptual similarity)
   - Combine frequency counts

5. **Categorize:**
   - 1st = Primary
   - 2nd = Secondary
   - 3rd = Accent
   - Others = Neutral or Background (based on lightness)

6. **Rank:**
   - Sort by frequency (most used first)
   - Return top 12 colors

### Font Loading Strategy

**For Brand Preview:**
- Google Fonts: Use original URL from site's `<link>` tags
- Custom fonts: Attempt Google Fonts API with all weights (400;500;600;700)
- System fonts: Rely on user's OS fonts
- Fallback chain: `"FontName", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`

**For Style Kit:**
- Only include non-system fonts
- Detect Google Fonts source when available
- Store font family name + default weight in Elementor globals

### WordPress Integration Points

**Elementor Active Kit:**
- Post type: `elementor_library`
- Template type: `kit`
- Settings stored in: `_elementor_page_settings` post meta
- Option reference: `elementor_active_kit` (post ID)

**Custom Colors:**
- Array of objects with `_id`, `title`, `color`
- IDs: `brand_color_1`, `brand_color_2`, etc.
- Colors: Uppercase hex (#RRGGBB)

**Custom Typography:**
- Array of objects with `_id`, `title`, `typography_font_family`, `typography_font_weight`
- IDs: `brand_font_1`, `brand_font_2`, etc.
- Weights: String numbers ('400', '700')

## Usage Examples

### Example 1: Stripe.com
```
Colors extracted:
- Primary: #0A2540 (dark blue)
- Secondary: #F6F9FC (light blue-gray)
- Accent: #32325D (purple-gray)
+ 9 more colors

Fonts extracted:
- sohne-var (custom)
- SourceCodePro (monospace)
```

### Example 2: Figma.com
```
Colors extracted:
- Primary: #972121 (red)
- Secondary: #697485 (gray)
- Accent: #FFBB3B (yellow)
+ 9 more colors

Fonts extracted:
- Inter (Google Fonts)
- Roboto Mono (Google Fonts)
```

## Limitations & Future Enhancements

### Current Limitations:
1. **Same-origin CSS only** - Only fetches CSS from the same domain (polite scraping)
2. **No computed styles** - Reads static CSS, not runtime computed styles
3. **Basic clustering** - Simple RGB distance, not perceptually accurate (L*a*b* space)
4. **Font licensing** - Doesn't download/redistribute font files, only references
5. **No logo quality scoring** - Doesn't analyze image content (square vs wide, etc.)

### Potential Enhancements:
1. **Puppeteer integration:**
   - Render page with headless Chrome
   - Get `getComputedStyle()` for accurate color usage
   - Detect actual rendered fonts (not just CSS declarations)
   - Extract typography scale (H1-H6 sizes, weights, line-heights)

2. **Advanced clustering:**
   - Use L*a*b* color space for perceptual distance
   - K-means clustering for better palette extraction
   - Detect dominant brand color (most saturated + frequent)

3. **Logo intelligence:**
   - Image dimension analysis (square = mark, wide = wordmark)
   - Transparent background detection (SVG/PNG)
   - Position scoring (header > footer)
   - Optional: Tiny vision model to filter non-logos

4. **Cross-origin CSS:**
   - Add allow-list for common CDNs
   - Respect CORS policies
   - Cache fetched CSS

5. **Export functionality:**
   - Download brand kit as JSON
   - Generate CSS variables file
   - Export to Figma/Sketch
   - Share via URL

6. **Two-way sync:**
   - Edit Style Kit in Elementor
   - Sync back to Brand Analysis
   - Version history

## Testing

**Manual Test Flow:**
1. Go to `/elementor-editor`
2. Click "Brand Analysis" tab
3. Enter URL: `https://stripe.com`
4. Click "Analyze Brand"
5. Wait 2-3 seconds
6. Verify colors, fonts, logos displayed
7. Click "🎨 Apply to Style Kit"
8. See success message
9. Switch to "WordPress Playground" tab
10. Open Elementor editor on any page
11. Check Global Colors and Global Fonts - should see extracted brand assets

**API Test:**
```bash
curl -X POST http://localhost:3000/api/analyze-brand \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://stripe.com"}'
```

Expected response: JSON with `colors`, `fonts`, `logos` arrays.

## Architecture Diagram

```
┌─────────────────┐
│   User Input    │
│  (Website URL)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  /api/analyze-brand     │
│  ├─ Fetch HTML          │
│  ├─ Extract CSS URLs    │
│  ├─ Parse inline styles │
│  └─ Run extractors:     │
│     ├─ extractLogos()   │
│     ├─ extractColors()  │
│     └─ extractFonts()   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Brand Analysis JSON   │
│   { colors, fonts,      │
│     logos, metadata }   │
└────────┬────────────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  UI Preview      │    │  Apply to Style Kit  │
│  ├─ Logo grid    │    │  brandAnalysisTo     │
│  ├─ Color swatches│   │  StyleKit()          │
│  └─ Font previews│    └──────────┬───────────┘
└──────────────────┘               │
                                   ▼
                        ┌─────────────────────────┐
                        │  setElementorStyleKit() │
                        │  (playground.js)        │
                        └──────────┬──────────────┘
                                   │
                                   ▼
                        ┌─────────────────────────┐
                        │  WordPress Playground   │
                        │  ├─ Create/get kit post │
                        │  ├─ Update post meta    │
                        │  └─ Save colors/fonts   │
                        └─────────────────────────┘
                                   │
                                   ▼
                        ┌─────────────────────────┐
                        │  Elementor Editor       │
                        │  Global styles available│
                        └─────────────────────────┘
```

## Conclusion

This integration provides a seamless workflow from brand discovery to WordPress theme setup:
1. Extract → 2. Preview → 3. Apply → 4. Use

The system leverages existing Elementor Style Kit infrastructure and WordPress Playground's PHP execution to directly modify global theme settings without manual configuration.
