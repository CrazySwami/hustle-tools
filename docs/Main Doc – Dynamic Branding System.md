# Main Doc – Dynamic Branding System
Date: 2025-11-10
Time: 9:45 PM EST

## TL;DR

Complete white-label branding system that allows customizing company name, logos, colors, and footer text via a settings page. All changes are stored in Supabase and applied globally across the app.

## Overview

The Dynamic Branding System replaces all hard-coded company information (Mirror Factory, logos, colors) with configurable variables that can be changed through a web interface at `/branding-settings`.

## Architecture

### 1. Database Schema

**Table:** `branding_settings`

Location: `/supabase/migrations/004_branding_settings.sql`

**Columns:**
- `company_name` - Company name (default: "Mirror Factory")
- `tagline` - Optional tagline
- `footer_text` - Footer text with branding
- `logo_light_url` - Logo for light mode
- `logo_dark_url` - Logo for dark mode
- `favicon_url` - Favicon URL
- `primary_color` - Accent color (default: mint `oklch(0.87 0.13 166)`)
- `background_light/dark` - Background colors
- `foreground_light/dark` - Text colors
- `card_light/dark` - Card backgrounds
- `muted_light/dark` - Muted/secondary colors
- `border_light/dark` - Border colors

**RLS Policies:**
- Anyone can read active branding
- Users can manage their own branding

### 2. React Context

**File:** `/src/contexts/BrandingContext.tsx`

**Provider:** `<BrandingProvider>`
- Fetches branding on mount
- Applies CSS variables dynamically
- Updates favicon
- Provides `useBranding()` hook

**Hook:** `useBranding()`
```typescript
const { branding, updateBranding, refreshBranding, isLoading } = useBranding();
```

### 3. API Route

**File:** `/src/app/api/branding/route.ts`

**Endpoints:**
- `GET /api/branding` - Fetch active branding
- `POST /api/branding` - Update branding settings

**Current Status:** ✅ Fully integrated with Supabase
- Auto-creates default branding on first access
- Falls back to default branding if database is unavailable
- Supports both creating new and updating existing branding records

### 4. Settings Page

**File:** `/src/app/branding-settings/page.tsx`
**URL:** `/branding-settings`

**Features:**
- Company information form
- Logo URL inputs with live preview
- Color pickers with visual preview
- Save/Reset buttons
- Success/error messages

## Integration Points

### Pages Using Dynamic Branding

1. **Landing Page** (`/src/app/page.tsx`)
   - Company name
   - Light/dark logos
   - Primary button color
   - Footer text

2. **Chat Doc Page** (`/src/app/chat-doc/page.tsx`)
   - Header logo (light/dark)
   - Company name

3. **Root Layout** (`/src/app/layout.tsx`)
   - Wraps entire app with `<BrandingProvider>`
   - CSS variables applied globally

## Usage

### For Developers

**Add branding to a new component:**

```typescript
'use client';
import { useBranding } from '@/contexts/BrandingContext';

export function MyComponent() {
  const { branding, isLoading } = useBranding();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{branding.company_name}</h1>
      <p>{branding.footer_text}</p>
      <button style={{ backgroundColor: branding.primary_color }}>
        Click Me
      </button>
    </div>
  );
}
```

### For End Users

1. Navigate to `/branding-settings`
2. Update company information, logos, or colors
3. Click "Save Changes"
4. Changes apply instantly across the entire application

## Supabase Integration

**Status:** ✅ Fully Implemented

The branding system is now integrated with Supabase and includes:

1. **Database Schema:** Table `branding_settings` with RLS policies
2. **Migration File:** `/supabase/migrations/004_branding_settings.sql`
3. **API Integration:** Full CRUD operations with automatic fallbacks
4. **Auto-Initialization:** Creates default branding on first access
5. **Graceful Degradation:** Falls back to default values if database is unavailable

**To apply the migration:**
```bash
supabase migration up
```

**Features:**
- Automatic default branding creation on first GET request
- Update existing or create new branding via POST
- Fallback to default values if Supabase is not configured
- Row-Level Security for multi-user support

## Color Format

**Recommended:** Use `oklch()` format for better color control:
- `oklch(lightness chroma hue)`
- Example: `oklch(0.87 0.13 166)` (mint green)
- Better than RGB/HSL for perceptual uniformity

## CSS Variables Applied

The system automatically applies these CSS variables:
```css
--primary
--background-light / --background-dark
--foreground-light / --foreground-dark
--card-light / --card-dark
--muted-light / --muted-dark
--border-light / --border-dark
```

## Future Enhancements

- [ ] Logo file upload (instead of URLs)
- [ ] Multiple branding profiles per user
- [ ] Export/import branding JSON
- [ ] Preview mode before saving
- [ ] Font family customization
- [ ] Advanced color scheme editor
- [ ] Branding templates library

## Changelog

---
Updated: 2025-11-11
Author: Claude Code
Changes: Completed Supabase integration - API now persists branding to database with automatic default creation and graceful fallbacks
---

---
Created: 2025-11-10 9:45 PM EST
Author: Claude Code
Changes: Initial dynamic branding system implementation
---
