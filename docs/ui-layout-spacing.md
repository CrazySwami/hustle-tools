# UI Layout & Spacing Guide

Comprehensive guide for layout patterns, spacing rules, navbar integration, and global styles in Hustle Tools.

## Table of Contents

- [Navbar & Global Layout](#navbar--global-layout)
- [Page Layout Patterns](#page-layout-patterns)
- [Spacing System](#spacing-system)
- [Global Styles & CSS Variables](#global-styles--css-variables)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Common Patterns](#common-patterns)

---

## Navbar & Global Layout

### Navbar Specifications

**Location:** `/src/components/ui/navbar.tsx`

**Fixed Dimensions:**
- Height: `h-16` (64px)
- Position: `fixed top-0 left-0 right-0`
- Z-index: `z-50`
- Background: `bg-background/80 backdrop-blur-sm`
- Border: `border-b border-border`

**Key Features:**
- Fixed to top of viewport
- Semi-transparent backdrop with blur effect
- Dropdown navigation menus (Desktop)
- Hamburger menu (Mobile < 768px)
- Dark/Light mode toggle
- Responsive design

**Nav Structure:**
```tsx
<div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
  <div className="flex h-16 items-center justify-between px-4 md:px-6">
    {/* Logo, Navigation, Mode Toggle */}
  </div>
</div>
```

### Page Top Padding Rules

**ALL pages must account for the fixed navbar height (64px).**

#### Standard Pages (Scrollable Content)
Use `pt-24` (96px) for comfortable spacing:

```tsx
<div className="container mx-auto px-4 py-8 max-w-6xl pt-24">
  {/* Page content */}
</div>
```

**Examples:**
- `/page-extractor` ✅
- `/firecrawl` ✅
- `/tkx-calendar` ✅
- `/chat` ✅
- `/image-alterations` ✅

#### Fullscreen Layouts (h-screen)
Use `pt-16` (64px) exactly matching navbar height:

```tsx
<div className="flex h-screen flex-col md:flex-row overflow-hidden pt-16">
  {/* Fullscreen split panels */}
</div>
```

**Examples:**
- `/blog-planner` ✅ - Split panel layout
- `/elementor-editor` ✅ - Uses `marginTop: '64px'` and `height: 'calc(100vh - 64px)'`

#### Special Cases

**Home Page (`/`):**
```tsx
<div className="relative h-screen">
  {/* Fullscreen background, no padding needed */}
</div>
```

**Login/Signup Pages:**
```tsx
<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  {/* Fullscreen centered, navbar is hidden/transparent */}
</div>
```

---

## Page Layout Patterns

### Pattern 1: Standard Content Page

**Use Case:** Pages with scrollable content, headers, and sections

```tsx
export default function MyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pt-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Page Title</h1>
        <p className="text-muted-foreground text-lg">Description</p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Content sections */}
      </div>
    </div>
  );
}
```

**Key Classes:**
- `pt-24` - Top padding for navbar clearance
- `container mx-auto` - Centered container
- `px-4 py-8` - Horizontal and vertical padding
- `max-w-6xl` - Maximum width constraint

### Pattern 2: Fullscreen Split Panel

**Use Case:** Chat interfaces, split editors, side-by-side views

```tsx
export default function SplitPanelPage() {
  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden pt-16">
      {/* Left Panel */}
      <div className="flex-[60%] flex flex-col border-r">
        {/* Panel content */}
      </div>

      {/* Right Panel */}
      <div className="flex-[40%] flex flex-col bg-muted/30">
        {/* Panel content */}
      </div>
    </div>
  );
}
```

**Key Classes:**
- `pt-16` - Exact navbar height offset
- `h-screen` - Full viewport height
- `overflow-hidden` - Prevent scroll on container
- `flex-[60%]` / `flex-[40%]` - Proportional widths

### Pattern 3: Custom Viewport Height

**Use Case:** Complex layouts with precise height calculations

```tsx
export default function CustomHeightPage() {
  return (
    <div
      className="chat-editor-container"
      style={{
        marginTop: '64px', // Fixed navbar height
        height: 'calc(100vh - 64px)', // Remaining viewport height
        paddingBottom: isMobile ? '48px' : '0'
      }}
    >
      {/* Content */}
    </div>
  );
}
```

**Key Values:**
- `marginTop: '64px'` - Navbar clearance
- `height: 'calc(100vh - 64px)'` - Fill remaining space
- Inline styles when dynamic calculations needed

### Pattern 4: Centered Auth Pages

**Use Case:** Login, signup, password reset

```tsx
export default function AuthPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Auth form */}
      </div>
    </div>
  );
}
```

**Key Classes:**
- `min-h-svh` - Minimum full viewport height
- `flex items-center justify-center` - Centered content
- `max-w-sm` - Narrow form width

---

## Spacing System

### Tailwind Spacing Scale

```
0    = 0px
0.5  = 2px
1    = 4px
2    = 8px
3    = 12px
4    = 16px  ← Common base spacing
5    = 20px
6    = 24px  ← Section spacing
8    = 32px  ← Large section spacing
12   = 48px
16   = 64px  ← Navbar height
20   = 80px
24   = 96px  ← Standard page top padding
```

### Common Spacing Patterns

**Card/Component Padding:**
```tsx
<div className="p-4">           // 16px all sides
<div className="px-4 py-6">     // 16px horizontal, 24px vertical
<div className="p-6 md:p-8">    // Responsive padding
```

**Vertical Spacing (Stacks):**
```tsx
<div className="space-y-2">     // 8px gaps (tight)
<div className="space-y-4">     // 16px gaps (normal)
<div className="space-y-6">     // 24px gaps (comfortable)
<div className="space-y-8">     // 32px gaps (sections)
```

**Grid Gaps:**
```tsx
<div className="grid gap-4">           // 16px gap
<div className="grid gap-6">           // 24px gap
<div className="grid grid-cols-3 gap-4"> // 3 columns, 16px gap
```

---

## Global Styles & CSS Variables

**Location:** `/src/app/globals.css`

### CSS Variable Structure

```css
:root {
  /* Background Colors */
  --background: 0 0% 100%;           /* Page background */
  --foreground: 20 14.3% 4.1%;       /* Main text */

  /* UI Elements */
  --card: 0 0% 100%;                  /* Card backgrounds */
  --card-foreground: 20 14.3% 4.1%;  /* Card text */

  --popover: 0 0% 100%;
  --popover-foreground: 20 14.3% 4.1%;

  --primary: 24 9.8% 10%;             /* Primary actions */
  --primary-foreground: 60 9.1% 97.8%;

  --secondary: 60 4.8% 95.9%;         /* Secondary actions */
  --secondary-foreground: 24 9.8% 10%;

  --muted: 60 4.8% 95.9%;             /* Muted backgrounds */
  --muted-foreground: 25 5.3% 44.7%;  /* Muted text */

  --accent: 60 4.8% 95.9%;            /* Accent elements */
  --accent-foreground: 24 9.8% 10%;

  /* Borders & Inputs */
  --border: 20 5.9% 90%;              /* Border color */
  --input: 20 5.9% 90%;               /* Input borders */
  --ring: 20 14.3% 4.1%;              /* Focus rings */

  /* Status Colors */
  --destructive: 0 84.2% 60.2%;       /* Error/Delete */
  --destructive-foreground: 60 9.1% 97.8%;

  /* Border Radius */
  --radius: 0.5rem;                   /* 8px default radius */
}

.dark {
  /* Dark mode overrides */
  --background: 20 14.3% 4.1%;
  --foreground: 60 9.1% 97.8%;
  /* ... */
}
```

### Using CSS Variables

**In Tailwind Classes:**
```tsx
<div className="bg-background text-foreground">
<div className="bg-card border border-border">
<div className="text-muted-foreground">
<Button variant="destructive">
```

**In Custom Styles:**
```css
.custom-element {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}
```

### Theme Colors Reference

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `background` | White | Dark Gray | Page background |
| `foreground` | Black | Off-White | Main text |
| `card` | White | Lighter Dark | Cards, panels |
| `border` | Light Gray | Dark Border | All borders |
| `primary` | Dark | Light | Buttons, links |
| `muted` | Light Gray | Muted Dark | Subtle backgrounds |
| `destructive` | Red | Red | Errors, delete actions |

---

## Responsive Breakpoints

### Tailwind Breakpoints

```
sm:  640px   - Small tablets
md:  768px   - Tablets (navbar switches to desktop)
lg:  1024px  - Small laptops
xl:  1280px  - Desktops
2xl: 1536px  - Large screens
```

### Common Responsive Patterns

**Mobile-First Approach:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // 1 column mobile, 2 tablet, 3 desktop
</div>

<div className="text-base md:text-lg lg:text-xl">
  // Responsive typography
</div>

<div className="px-4 md:px-6 lg:px-8">
  // Responsive padding
</div>
```

**Layout Switching:**
```tsx
<div className="flex flex-col md:flex-row">
  // Stack on mobile, side-by-side on tablet+
</div>

<div className="hidden md:block">
  // Show on tablet+
</div>

<div className="block md:hidden">
  // Show on mobile only
</div>
```

---

## Common Patterns

### Container Widths

```tsx
// Full width with padding
<div className="w-full px-4 md:px-6">

// Centered with max width
<div className="container mx-auto max-w-6xl">

// Responsive max widths
<div className="max-w-sm">    // 384px
<div className="max-w-md">    // 448px
<div className="max-w-lg">    // 512px
<div className="max-w-xl">    // 576px
<div className="max-w-2xl">   // 672px
<div className="max-w-4xl">   // 896px
<div className="max-w-6xl">   // 1152px
```

### Typography Scale

```tsx
<h1 className="text-4xl font-bold">      // 36px
<h2 className="text-3xl font-bold">      // 30px
<h3 className="text-2xl font-semibold">  // 24px
<h4 className="text-xl font-semibold">   // 20px
<p className="text-base">                // 16px (default)
<p className="text-sm text-muted-foreground"> // 14px muted
<span className="text-xs">               // 12px
```

### Button Sizes

```tsx
<Button size="sm">  // Small (height: 36px)
<Button size="default"> // Medium (height: 40px)
<Button size="lg">  // Large (height: 44px)
<Button size="icon"> // Square icon button
```

### Border Radius

```tsx
<div className="rounded">       // 4px (0.25rem)
<div className="rounded-md">    // 6px (0.375rem)
<div className="rounded-lg">    // 8px (0.5rem) - default
<div className="rounded-xl">    // 12px (0.75rem)
<div className="rounded-full">  // Fully round
```

### Shadows

```tsx
<div className="shadow">        // Subtle shadow
<div className="shadow-md">     // Medium shadow
<div className="shadow-lg">     // Large shadow
<div className="shadow-xl">     // Extra large shadow
<div className="shadow-none">   // No shadow
```

---

## Quick Reference Checklist

When creating a new page, ensure:

- [ ] **Navbar Clearance:** Add `pt-24` (standard) or `pt-16` (fullscreen) to account for fixed navbar
- [ ] **Container:** Use `container mx-auto` for centered content
- [ ] **Max Width:** Apply `max-w-6xl` or appropriate max width
- [ ] **Padding:** Use `px-4 md:px-6` for responsive horizontal padding
- [ ] **Spacing:** Use `space-y-*` for vertical rhythm between sections
- [ ] **Responsive:** Test mobile (`< 768px`) and desktop (`>= 768px`) layouts
- [ ] **Dark Mode:** Ensure all custom colors use CSS variables
- [ ] **Accessibility:** Maintain proper heading hierarchy (h1 → h2 → h3)

---

## Examples from Codebase

### Page Extractor (Standard Content)
```tsx
<div className="container mx-auto px-4 py-8 max-w-6xl pt-24">
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">Page Extractor</h1>
    <p className="text-muted-foreground text-lg">
      Extract clean HTML, CSS, and JavaScript files from any webpage
    </p>
  </div>
  <PageExtractor />
</div>
```

### Blog Planner (Fullscreen Split)
```tsx
<div className="flex h-screen flex-col md:flex-row overflow-hidden pt-16">
  <div className="flex-[60%] flex flex-col border-r">
    {/* Left panel: Chat */}
  </div>
  <div className="flex-[40%] flex flex-col bg-muted/30">
    {/* Right panel: Blog plan */}
  </div>
</div>
```

### Elementor Editor (Custom Height)
```tsx
<div
  className="chat-editor-container"
  style={{
    marginTop: '64px',
    height: 'calc(100vh - 64px)',
    paddingBottom: isMobile ? '48px' : '0'
  }}
>
  {/* Split panels with resizer */}
</div>
```

---

## Additional Resources

- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **shadcn/ui Components:** https://ui.shadcn.com
- **CSS Variables Spec:** https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **Responsive Design:** https://tailwindcss.com/docs/responsive-design

---

**Last Updated:** 2025-01-24
**Maintained By:** Hustle Together LLC
