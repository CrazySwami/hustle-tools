# HTML Generation Usage Tracking - Complete ✅

## Problem Identified
Usage tracking was missing for HTML/CSS/JS generation. When users generate sections, 3 separate API calls are made:
1. `/api/generate-html-stream` (HTML)
2. `/api/generate-html-stream` (CSS)
3. `/api/generate-html-stream` (JS)

**Before:** These API calls did NOT track token usage
**After:** All 3 calls now track usage and display in Usage tab

## Implementation

### Server-Side Changes (`/src/app/api/generate-html-stream/route.ts`)

Added usage tracking to the stream response:
1. Capture usage data from `result.usage` promise
2. Append usage as JSON delimiter at end of stream: `__USAGE__{json}__END__`
3. Log usage on server for debugging

**Format:**
```
[Generated HTML/CSS/JS content]

__USAGE__{"_usage":{"model":"...", "promptTokens":1234, ...}}__END__
```

### Client-Side Changes (`/src/components/tool-ui/html-generator-widget.tsx`)

1. **Added `useUsageTracking` hook** - Import and use recordUsage
2. **Added `parseUsage()` helper** - Extracts usage JSON from stream
3. **Updated HTML generation** - Parse and record usage after stream completes
4. **Updated CSS generation** - Parse and record usage after stream completes
5. **Updated JS generation** - Parse and record usage after stream completes

**Flow:**
```
Stream → Accumulate chunks → Parse usage delimiter → Record usage → Display clean content
```

## What's Now Tracked

✅ **Chat messages** (via messageMetadata callback)
✅ **HTML generation** (via usage delimiter)
✅ **CSS generation** (via usage delimiter)
✅ **JS generation** (via usage delimiter)
✅ **Morph edits** (already tracked in widget)

## Example Usage Data

When generating a hero section:
```json
{
  "model": "anthropic/claude-sonnet-4-5-20250929",
  "promptTokens": 2500,
  "completionTokens": 800,
  "totalTokens": 3300,
  "type": "html"
}
```

Each of the 3 generations (HTML, CSS, JS) creates a separate usage record in the Usage tab.

## Testing

**To verify:**
1. Open Elementor Editor
2. Generate a new section (e.g., "hero section")
3. Open Usage tab
4. Should see 3 new entries:
   - HTML generation (~2-4k tokens)
   - CSS generation (~1-3k tokens)
   - JS generation (~500-2k tokens)

## Cost Impact

Generating a typical section now shows accurate costs:
- **HTML**: $0.01-0.03
- **CSS**: $0.005-0.02
- **JS**: $0.003-0.015
- **Total per section**: ~$0.02-0.07

Previously these costs were invisible!

## Technical Notes

- Uses delimiter approach instead of SSE metadata (simpler for text streams)
- Usage JSON is stripped before displaying content to user
- Backwards compatible (works even if usage data is missing)
- No changes needed to Monaco editor or preview components
