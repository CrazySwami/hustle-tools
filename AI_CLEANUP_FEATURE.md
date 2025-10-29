# AI Cleanup Feature for Elementor Style Kits

## Overview

The AI Cleanup feature uses **Claude Haiku 4.5** to automatically validate, optimize, and fix generated Elementor Style Kits. It ensures font families are correct, weights are optimal, colors are valid, and the overall configuration is production-ready.

## How It Works

### 1. User Workflow

```
Generate Complete Style Kit → 🤖 Clean with AI → Review Changes → Apply to Playground
```

1. User generates a Style Kit (from Brand Extract or manual editing)
2. User clicks **"🤖 Clean with AI"** button in toolbar
3. AI analyzes the Style Kit and brand context
4. AI returns:
   - **Cleaned Style Kit JSON** (with fixes applied)
   - **List of changes** made
   - **Warnings** for issues that couldn't be fixed
5. Dialog shows all changes and warnings
6. User reviews and applies to WordPress Playground

### 2. What AI Validates

The AI cleanup performs 7 key validations:

#### ✅ **Font Family Validation**
- Ensures all font families are real, web-safe fonts or valid Google Fonts
- Fixes typos (e.g., "Roboto" → "Roboto")
- Removes invalid font names
- Suggests alternatives for unsupported fonts

#### ✅ **Font Weight Optimization**
- Ensures weights exist for the font family
- Common weights: 300, 400, 500, 600, 700, 800
- Adjusts weights if they don't exist (e.g., Roboto doesn't have weight 950)
- Maintains semantic meaning (headings stay bold, body stays normal)

#### ✅ **Color Consistency**
- Validates hex codes (6 characters, valid hex)
- Fixes malformed hex codes (e.g., "#abc" → "#aabbcc")
- Ensures consistent color usage across similar elements
- Checks contrast for accessibility

#### ✅ **Typography Hierarchy**
- Verifies H1-H6 have descending sizes
- Ensures appropriate weights for each heading level
- Validates line-height ratios (1.2-2.0)
- Checks that headings are bolder than body text

#### ✅ **Size Validation**
- Font sizes: 10-72px (reasonable range)
- Line heights: 1.2-2.0 (readable range)
- Padding/margins: non-negative values
- Border radius: reasonable values

#### ✅ **Required Fields Check**
- Ensures all required Elementor fields are present
- Adds missing fields with sensible defaults
- Validates field structure matches Elementor schema

#### ✅ **Naming Improvements**
- Ensures custom typography titles are descriptive
- Follows Elementor naming conventions
- Makes titles human-readable

### 3. Technical Implementation

#### API Endpoint: `/api/cleanup-stylekit`

**File**: `src/app/api/cleanup-stylekit/route.ts`

**Request**:
```json
{
  "styleKit": { /* Elementor Style Kit JSON */ },
  "brandAnalysis": { /* Optional brand context */ }
}
```

**Response**:
```json
{
  "cleanedStyleKit": { /* Improved Style Kit */ },
  "changes": [
    "Fixed font weight for H1 from 950 to 700 (Roboto doesn't support 950)",
    "Corrected hex code for primary color from #abc to #aabbcc",
    "Added missing line-height for body typography"
  ],
  "warnings": [
    "Font 'CustomFont' is not a Google Font - may not load correctly"
  ]
}
```

#### AI Model: Claude Haiku 4.5

- **Model**: `claude-4-5-haiku-20250110`
- **Temperature**: 0.3 (conservative, minimal hallucination)
- **Max Tokens**: 4000 (enough for detailed analysis + JSON)
- **Cost**: ~$0.001 per cleanup (very affordable)

#### UI Components

**Button** (in toolbar):
```tsx
<button onClick={handleCleanupWithAI} disabled={cleanupLoading}>
  {cleanupLoading ? '🤖 Cleaning...' : '🤖 Clean with AI'}
</button>
```

**Dialog** (after cleanup):
- Shows all changes made
- Shows warnings for unfixable issues
- Allows user to review before applying

### 4. Example AI Cleanup

**Before Cleanup**:
```json
{
  "system_typography": [
    {
      "_id": "primary",
      "typography_font_family": "Roboto",
      "typography_font_weight": "950",  // ❌ Roboto doesn't have 950
      "typography_font_size": { "unit": "px", "size": 48 }
    }
  ],
  "system_colors": [
    { "_id": "primary", "color": "#abc" }  // ❌ Invalid hex (3 chars)
  ]
}
```

**After Cleanup**:
```json
{
  "system_typography": [
    {
      "_id": "primary",
      "typography_font_family": "Roboto",
      "typography_font_weight": "700",  // ✅ Fixed to valid weight
      "typography_font_size": { "unit": "px", "size": 48 }
    }
  ],
  "system_colors": [
    { "_id": "primary", "color": "#aabbcc" }  // ✅ Fixed hex code
  ]
}
```

**Changes Reported**:
- "Fixed font weight for Primary typography from 950 to 700 (Roboto supports: 100, 300, 400, 500, 700, 900)"
- "Expanded hex color for primary from #abc to #aabbcc"

## Usage Instructions

### From Brand Extract Workflow

1. Navigate to `/elementor-editor`
2. Click **"🎨 Brand Extract"** mode
3. Enter URL (e.g., `https://stripe.com`)
4. Click **"🔍 Analyze Brand"**
5. Click **"✨ Generate Complete Style Kit →"**
6. **NEW**: Click **"🤖 Clean with AI"** to optimize
7. Review changes in dialog
8. Click **"🚀 Apply to Playground"**

### From Manual Editing

1. Edit Style Kit JSON in Monaco editor
2. Click **"🤖 Clean with AI"**
3. Review changes
4. Apply to Playground

## Benefits

### 1. **Production-Ready Output**
- Ensures Style Kits work in real WordPress/Elementor environments
- Catches errors before deployment
- No more "font not loading" or "invalid color" issues

### 2. **Time Savings**
- Automates 7+ manual validation steps
- Finds issues humans might miss
- Reduces back-and-forth testing

### 3. **Educational**
- Shows exactly what was changed and why
- Teaches users about Elementor best practices
- Improves user's future Style Kit creation

### 4. **Cost-Effective**
- Uses Haiku 4.5 (fastest, cheapest Claude model)
- ~$0.001 per cleanup
- Much faster than GPT-5 or Sonnet

## Technical Details

### Files Modified

1. **`src/app/api/cleanup-stylekit/route.ts`** (NEW)
   - API endpoint for AI cleanup
   - Claude Haiku 4.5 integration
   - JSON parsing and validation

2. **`src/components/elementor/StyleGuideUnified.tsx`** (MODIFIED)
   - Added cleanup state variables (lines 93-97)
   - Added `handleCleanupWithAI` function (lines 312-349)
   - Added "🤖 Clean with AI" button (lines 535-550)
   - Added cleanup results dialog (lines 1390-1468)

### AI Prompt Engineering

The cleanup prompt is carefully designed to:
- Be **conservative** (only fix clear errors)
- Provide **detailed explanations** for each change
- Return **structured JSON** for easy parsing
- Include **warnings** for unfixable issues
- Consider **brand context** when available

### Error Handling

- API errors are caught and shown to user
- Invalid AI responses are logged and reported
- Fallback to original Style Kit if parsing fails
- User can always reject changes

## Future Enhancements

### Potential Improvements

1. **Undo/Redo**: Allow users to revert AI changes
2. **Batch Cleanup**: Clean multiple Style Kits at once
3. **Custom Rules**: Let users define their own validation rules
4. **A/B Testing**: Compare original vs cleaned Style Kit side-by-side
5. **Font Suggestions**: AI suggests better font pairings
6. **Accessibility Checks**: WCAG contrast ratio validation
7. **Performance Optimization**: Remove unused colors/fonts

## Conclusion

The AI Cleanup feature adds a critical **quality assurance layer** to the Style Kit generation workflow. It ensures that generated Style Kits are:

- ✅ **Valid** (correct font families, weights, colors)
- ✅ **Optimized** (best practices for typography hierarchy)
- ✅ **Production-Ready** (works in real WordPress/Elementor)
- ✅ **Educational** (explains what was fixed and why)

All powered by Claude Haiku 4.5 for fast, affordable, and accurate validation.
