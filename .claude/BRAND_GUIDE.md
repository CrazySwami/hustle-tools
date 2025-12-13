# Hustle Together Brand Guide

> This file is used by `/hustle-ui-create` during Phase 3 (Design Research).
> Update this guide to match your project's branding before creating components.

## Core Colors

### Hustle Brand Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Hustle Red** | #BA0C2F | rgb(186, 12, 47) | Primary accent, buttons, links, focus rings |
| **Hustle Red Hover** | #8A0923 | rgb(138, 9, 35) | Hover states |
| **Hustle Red Light** | rgba(186, 12, 47, 0.1) | - | Backgrounds, badges |

### Light Mode
| Name | Hex | Usage |
|------|-----|-------|
| **Background** | #FFFFFF | Main background |
| **Background Secondary** | #F8F8F8 | Cards, sections |
| **Background Tertiary** | #F0F0F0 | Nested elements |
| **Text** | #1A1A1A | Primary text |
| **Text Muted** | #666666 | Secondary text |
| **Border** | #E5E5E5 | Light borders |
| **Border Strong** | #000000 | Boxy card borders |

### Dark Mode
| Name | Hex | Usage |
|------|-----|-------|
| **Background** | #050505 | Main background |
| **Background Secondary** | #111111 | Cards, sections |
| **Background Tertiary** | #1A1A1A | Nested elements |
| **Text** | #F0F0F0 | Primary text |
| **Text Muted** | #888888 | Secondary text |
| **Border** | #333333 | Dark borders |

### Status Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Success** | #22C55E | Completed, passed, positive |
| **Warning** | #EAB308 | Caution, pending |
| **Error** | #EF4444 | Failed, errors, destructive |
| **Info** | #3B82F6 | Informational |

## Typography

### Font Stack
```css
/* Main font */
--font-main: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;

/* Monospace */
--font-mono: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace;
```

### Font Sizes
- **xs:** 0.75rem (12px)
- **sm:** 0.875rem (14px)
- **base:** 1rem (16px)
- **lg:** 1.125rem (18px)
- **xl:** 1.25rem (20px)
- **2xl:** 1.5rem (24px)
- **3xl:** 1.875rem (30px)
- **4xl:** 2.25rem (36px)
- **5xl:** 3rem (48px)
- **6xl:** 4rem (64px)

### Font Weights
- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700
- **Extrabold:** 800

### Line Heights
- **Tight:** 1.1 (headings)
- **Normal:** 1.5 (body)
- **Relaxed:** 1.6 (paragraphs)

## Spacing

### Base Unit
- **Base:** 4px (0.25rem)

### Scale
| Token | Value | Pixels |
|-------|-------|--------|
| 0 | 0 | 0 |
| 1 | 0.25rem | 4px |
| 2 | 0.5rem | 8px |
| 3 | 0.75rem | 12px |
| 4 | 1rem | 16px |
| 5 | 1.25rem | 20px |
| 6 | 1.5rem | 24px |
| 8 | 2rem | 32px |
| 10 | 2.5rem | 40px |
| 12 | 3rem | 48px |
| 16 | 4rem | 64px |

### Common Usage
- **Component Padding:** 16px (1rem)
- **Card Padding:** 24px (1.5rem)
- **Section Margin:** 32px (2rem)
- **Page Padding:** 60px (desktop), 30px (mobile)

## Component Styling

### Design Philosophy
**90s Boxy Style** - Clean, minimal, sharp edges with solid borders.

### Border Radius
- **Default:** 0 (boxy, no rounding)
- **Soft:** 4px (subtle rounding for inputs only)
- **Full:** 9999px (pills, avatars)

### Border Width
- **Cards:** 2px solid
- **Inputs:** 2px solid (focus: Hustle Red)
- **Subtle:** 1px solid

### Shadows
```css
/* Float effect for cards */
--shadow-float: 0 10px 30px -10px rgba(0, 0, 0, 0.1);

/* Hover shadow */
--shadow-hover: 4px 4px 0px 0px rgba(186, 12, 47, 0.2);

/* No shadow for flat design */
--shadow-none: none;
```

### Focus Ring
```css
/* Hustle Red focus ring */
outline: 2px solid #BA0C2F;
outline-offset: 2px;
```

### Transitions
```css
/* Standard transition */
transition: all 0.2s ease;
transition-property: color, background-color, border-color, opacity, transform, box-shadow;
```

## Buttons

### Primary Button (Hustle Red)
```css
background: #BA0C2F;
color: #ffffff;
padding: 12px 24px;
border: 2px solid #BA0C2F;
border-radius: 0;
font-weight: 700;
```

### Secondary Button
```css
background: #ffffff;
color: #000000;
padding: 12px 24px;
border: 2px solid #000000;
border-radius: 0;
font-weight: 700;
```

### Ghost Button
```css
background: transparent;
color: #000000;
padding: 12px 24px;
border: 2px solid #000000;
border-radius: 0;
font-weight: 700;
```

### Button Hover States
- **Primary:** background: #8A0923
- **Secondary:** border-color: #BA0C2F
- **Ghost:** border-color: #BA0C2F

### Button Sizes
| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 8px 16px | 12px |
| Medium | 12px 24px | 14px |
| Large | 16px 32px | 16px |

## Form Elements

### Input Fields
```css
background: #ffffff;
border: 2px solid #000000;
border-radius: 0;
padding: 12px 16px;
font-size: 14px;
```

### Input States
- **Focus:** `border-color: #BA0C2F;`
- **Error:** `border-color: #EF4444;`
- **Disabled:** `background: #F5F5F5; opacity: 0.5;`

### Labels
```css
display: block;
margin-bottom: 8px;
font-weight: 700;
font-size: 14px;
```

## Cards

### Default Card
```css
background: #ffffff;
border: 2px solid #000000;
border-radius: 0;
padding: 24px;
```

### Card Hover
```css
border-color: #BA0C2F;
box-shadow: 4px 4px 0px 0px rgba(186, 12, 47, 0.2);
```

### Card (Dark Mode)
```css
background: #111111;
border: 2px solid #333333;
```

## Hero Headers

### Animated Grid Hero
- Height: 450px
- Canvas-based 3D perspective grid animation
- Hustle Red accent cells (#BA0C2F)
- Fog/fade gradient overlay
- Left-aligned content
- Padding: 60px (desktop), 30px (mobile)

## Dark Mode Implementation

### CSS Custom Properties
```css
[data-theme="dark"] {
  --bg: #050505;
  --text: #f0f0f0;
  --text-muted: #888888;
  --border: #333333;
  --surface-glass: rgba(20, 20, 20, 0.8);
}
```

### Tailwind Classes
Use `dark:` prefix for all dark mode styles:
```html
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
```

## Voice & Tone

### Writing Style
- **Professional** but approachable
- **Clear** and concise
- **Technical precision** - no fluff
- **No emojis** in code or documentation (unless requested)

### UI Copy Guidelines
- Use active voice
- Keep button labels to 2-3 words
- Error messages should explain how to fix the issue
- Success messages should confirm the action taken

## Accessibility Requirements

### Color Contrast
- **Normal Text:** Minimum 4.5:1 ratio (WCAG AA)
- **Large Text:** Minimum 3:1 ratio
- **Interactive Elements:** Minimum 3:1 ratio

### Focus Indicators
- All interactive elements must have visible focus states
- Hustle Red (#BA0C2F) focus ring
- Focus should not be removed or hidden

### Touch Targets
- Minimum size: 44px x 44px
- Minimum spacing: 8px between targets

---

**Last Updated:** 2025-12-12
**Brand Version:** 3.9.1
**Design System:** Hustle Together
