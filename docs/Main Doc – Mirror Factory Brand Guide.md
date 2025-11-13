# Main Doc – Mirror Factory Brand Guide
Date: 2025-11-11
Time: 10:30 PM EST

## TL;DR

Complete brand identity system for Mirror Factory and Ditto, covering visual design, color systems, typography, effects, voice/tone, and terminology. Defines the glassmorphism aesthetic with animated gradients, noise textures, and comprehensive usage guidelines.

---

## Table of Contents

1. [Brand Story & Mission](#brand-story--mission)
2. [Visual Identity Overview](#visual-identity-overview)
3. [Logo System](#logo-system)
4. [Color Palette](#color-palette)
5. [Typography](#typography)
6. [Visual Effects & Treatments](#visual-effects--treatments)
7. [Background Systems](#background-systems)
8. [UI Components](#ui-components)
9. [Spacing & Layout](#spacing--layout)
10. [Voice & Tone](#voice--tone)
11. [Terminology](#terminology)
12. [Usage Examples](#usage-examples)

---

## Brand Story & Mission

### Who We Are

Knowledge workers can only be in one place at a time. **Ditto multiplies their expertise across every project.**

As a knowledge worker, your most valuable asset isn't what you do - it's what you know. Your judgement, instincts, and hard-earned insights. But your calendar has limits.

Ditto changes that.

### What is Ditto?

A Ditto is your personalized AI agent: trained on your work, connected to your live data, and deployable anywhere your expertise is needed. Ditto learns and shares your unique expertise. We go beyond the explicit information that can be found across the internet and instead focus on curating your **tacit knowledge**: how you approach problems, what you prioritize, and the nuances that make your work distinctly yours.

As you work together, Ditto authors a context profile that mirrors your personal expertise, capturing your values, insights, and decision-making patterns in a form AI agents can understand and apply. You can then deploy your Ditto across multiple projects simultaneously. Share it with collaborators so they can work with your expertise even when you're not in the room.

### The Vision

Dittos are verified expertise that you can share or sell. We're starting with agency teams sharing internal expert Dittos, then expanding to a marketplace where business authors and thought leaders distribute their judgment to their audiences at scale. Instead of burning out from spreading too thin, you create a network effect that amplifies your impact without diluting your attention.

### Starting with Workstation

We're launching with **Workstation** - an agentic document editor designed for multi-Ditto workflows. Our initial target is agencies juggling multiple client projects, where managers coordinate across teams, tools, and stakeholders.

In Workstation, an agency manager drafting a client proposal can pull in Dittos from their creative director, strategist, and technical lead. As they write, they get real-time input: the creative director weighs in on brand alignment, the strategist refines the approach, and the tech lead flags implementation risks - all without pulling anyone away from their own work.

Bobby and Kyle bootstrapped their agency, 302 Interactive, to $2M serving clients like Universal Creative, Niantic, the US Navy, and US Marines. We've lived this problem: senior expertise is the constraint on growth. AI makes it solvable for the first time.

### Our Mission

**Our mission is to expand human capacity for meaningful work.** The future of work isn't about doing more - it's about making what you know accessible to everyone who needs it. Ditto makes that possible.

---

## Visual Identity Overview

The Mirror Factory brand embodies **sophisticated simplicity** with a focus on:

- **Glassmorphism** - Frosted glass effects with backdrop blur
- **Depth through layers** - Animated gradients, noise textures, grid patterns
- **Breathing animations** - Subtle pulse effects that feel alive
- **Dark-first design** - Optimized for dark mode with light mode support
- **Mint accent** - A distinctive, energetic primary color
- **Professional yet approachable** - Clean, modern, trustworthy

The visual language communicates expertise without complexity, power without intimidation, and innovation without gimmickry.

---

## Logo System

### Primary Logos

**Logo Files:**
- Light Mode: `/MF-Workstation-Logo.png`
- Dark Mode: `/MF-Workstation-Logo-Light.png`

### Usage Guidelines

**Minimum Size:**
- Web: 150px width minimum
- Print: 1.5 inches width minimum

**Clear Space:**
- Maintain clear space equal to the height of the "M" on all sides
- No text, graphics, or UI elements within clear space

**Backgrounds:**
- Dark Mode Logo: Use on dark backgrounds (#1a1a1a to #000000)
- Light Mode Logo: Use on light backgrounds (#FFFFFF to #F5F5F5)
- On gradient/textured backgrounds: Place within glassmorphism container with backdrop blur

**Placement:**
- Landing page: Centered, large format (700px width)
- App header: Left-aligned, compact format (150px width)
- Footer: Centered or left-aligned, small format (120px width)

**Don'ts:**
- Do not stretch or distort logo proportions
- Do not rotate logo
- Do not add effects (shadows, outlines, gradients) to logo
- Do not place logo on busy backgrounds without glassmorphism container
- Do not alter logo colors

---

## Color Palette

### Primary Color - Mint

**Mint Green** (Brand Accent)
```
oklch(0.87 0.13 166)
HSL: ~160°, 65%, 87%
RGB: ~177, 242, 216
Hex: ~#B1F2D8
```

**Usage:**
- Primary CTAs and buttons
- Accent elements
- Hover states
- Loading indicators
- Active states
- Gradient orbs in backgrounds
- Links (sparingly)

**Accessibility:**
- ✅ WCAG AAA on dark backgrounds
- ⚠️ Use dark text (#0a0a0a) on mint buttons for readability

### Dark Mode Colors

**Background Spectrum:**
```
Background Primary: #1a1a1a
Background Secondary: #0a0a0a
Card/Panel: #2a2a2a
Muted/Subtle: #333333
```

**Text Colors:**
```
Foreground Primary: oklch(0.985 0 0)  /* Near white */
Foreground Secondary: #e5e5e5
Muted Text: #999999
Disabled: #666666
```

**Borders & Dividers:**
```
Border Primary: oklch(1 0 0 / 8%)     /* White 8% opacity */
Border Subtle: rgba(255,255,255,0.05)
Border Strong: rgba(255,255,255,0.15)
```

### Light Mode Colors

**Background Spectrum:**
```
Background Primary: oklch(1 0 0)      /* Pure white */
Background Secondary: #FAFAFA
Card/Panel: oklch(1 0 0)
Muted/Subtle: oklch(0.97 0 0)
```

**Text Colors:**
```
Foreground Primary: oklch(0.145 0 0)  /* Near black */
Foreground Secondary: #333333
Muted Text: #666666
Disabled: #999999
```

**Borders & Dividers:**
```
Border Primary: oklch(0.922 0 0)
Border Subtle: #F0F0F0
Border Strong: #D0D0D0
```

### Semantic Colors

**Success:**
```
Success: #22c55e (Green)
Success Light: #86efac
Success Dark: #15803d
```

**Warning:**
```
Warning: #f59e0b (Amber)
Warning Light: #fcd34d
Warning Dark: #b45309
```

**Error/Destructive:**
```
Error: #ef4444 (Red)
Error Light: #fca5a5
Error Dark: #b91c1c
```

**Info:**
```
Info: #3b82f6 (Blue)
Info Light: #93c5fd
Info Dark: #1e40af
```

---

## Typography

### Font Stack

**Primary Font:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Helvetica Neue', Arial, sans-serif;
```

**Monospace Font (for code/data):**
```css
font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono',
             'Courier New', monospace;
```

### Type Scale

**Headings:**
```
H1: 48px / 3rem     - font-weight: 700 (bold)
H2: 36px / 2.25rem  - font-weight: 700 (bold)
H3: 30px / 1.875rem - font-weight: 600 (semibold)
H4: 24px / 1.5rem   - font-weight: 600 (semibold)
H5: 20px / 1.25rem  - font-weight: 600 (semibold)
H6: 18px / 1.125rem - font-weight: 600 (semibold)
```

**Body Text:**
```
Large:   18px / 1.125rem - font-weight: 400 (regular)
Default: 16px / 1rem     - font-weight: 400 (regular)
Small:   14px / 0.875rem - font-weight: 400 (regular)
Tiny:    12px / 0.75rem  - font-weight: 400 (regular)
```

**Line Heights:**
```
Tight:   1.25
Normal:  1.5
Relaxed: 1.75
Loose:   2.0
```

**Letter Spacing:**
```
Tight:   -0.025em
Normal:  0
Wide:    0.025em
Wider:   0.05em
```

### Usage Guidelines

**Headlines & Titles:**
- Use bold weights (600-700)
- Tight line height (1.25)
- Normal or tight letter spacing
- Dark mode: foreground primary color
- Light mode: foreground primary color

**Body Copy:**
- Regular weight (400)
- Normal line height (1.5)
- Normal letter spacing
- Maximum width: 65-75 characters per line
- Dark mode: foreground primary or secondary
- Light mode: foreground primary or secondary

**UI Labels:**
- Medium weight (500-600)
- Smaller sizes (12-14px)
- Wide letter spacing for all-caps labels
- Dark mode: muted text color
- Light mode: muted text color

**Code/Data:**
- Monospace font stack
- Slightly reduced size (0.9em)
- Light background with subtle border
- Consider syntax highlighting for code blocks

---

## Visual Effects & Treatments

### Glassmorphism

The signature Mirror Factory aesthetic. Creates depth and sophistication.

**Standard Glass Container:**
```css
backdrop-filter: blur(12px);
background: rgba(var(--background), 0.3);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 24px;
```

**Glass Button (Subtle):**
```css
backdrop-filter: blur(8px);
background: rgba(var(--background), 0.4);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 12px;
transition: all 300ms;
```

**Glass Button (Hover):**
```css
background: rgba(var(--background), 0.6);
transform: scale(1.02);
```

**Usage:**
- Logo containers
- Navigation panels
- Modal dialogs
- Floating action buttons
- Toggle switches
- Card overlays on busy backgrounds

**Best Practices:**
- Use sparingly - glassmorphism should enhance, not dominate
- Always pair with sufficient backdrop blur (8-16px)
- Ensure text contrast meets WCAG AA minimum
- Test on various backgrounds before finalizing

### Animations

**Pulse Animation (Gradient Orbs):**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.05);
  }
}

animation: pulse 4s ease-in-out infinite;
```

**Hover Scale:**
```css
transition: transform 300ms ease, box-shadow 300ms ease;
```
```css
/* On hover */
transform: scale(1.05);
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
```

**Fade In:**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: fadeIn 600ms ease-out;
```

**Loading Spinner:**
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

animation: spin 1.5s linear infinite;
```

### Shadows

**Elevation System:**
```
None:     box-shadow: none
Subtle:   box-shadow: 0 1px 3px rgba(0,0,0,0.12)
Small:    box-shadow: 0 4px 6px rgba(0,0,0,0.1)
Medium:   box-shadow: 0 10px 20px rgba(0,0,0,0.15)
Large:    box-shadow: 0 20px 40px rgba(0,0,0,0.2)
XLarge:   box-shadow: 0 30px 60px rgba(0,0,0,0.3)
```

**Usage:**
- Subtle: Input fields, small cards
- Small: Buttons, dropdowns
- Medium: Panels, modals
- Large: Floating elements, hover states
- XLarge: Key CTAs on hover

---

## Background Systems

### Gradient Orbs

Creates depth and visual interest without distraction.

**Large Orb (Top Left):**
```css
position: absolute;
top: 0;
left: -25%;
width: 50%;
height: 50%;
background-color: oklch(0.87 0.13 166); /* Mint */
opacity: 0.2;
filter: blur(80px);
border-radius: 50%;
animation: pulse 4s ease-in-out infinite;
```

**Medium Orb (Bottom Right):**
```css
position: absolute;
bottom: 0;
right: -25%;
width: 50%;
height: 50%;
background-color: oklch(0.87 0.13 166); /* Mint */
opacity: 0.15;
filter: blur(80px);
border-radius: 50%;
animation: pulse 6s ease-in-out infinite;
animation-delay: 1s;
```

**Small Orb (Center Right):**
```css
position: absolute;
top: 33%;
right: 25%;
width: 33%;
height: 33%;
background: radial-gradient(circle, oklch(0.87 0.13 166), transparent);
opacity: 0.1;
filter: blur(60px);
border-radius: 50%;
animation: pulse 5s ease-in-out infinite;
animation-delay: 2s;
```

**Usage:**
- Landing pages
- Hero sections
- Marketing pages
- Empty states
- Login/signup flows

**Best Practices:**
- Always use on solid background colors
- Keep opacity low (0.1-0.2)
- Use blur generously (60-100px)
- Vary animation durations (4-6s)
- Stagger animation delays (0-2s)

### Noise Texture

Adds subtle grain for depth and premium feel.

**Implementation:**
```css
position: absolute;
inset: 0;
opacity: 0.015;
mix-blend-mode: overlay;
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
background-repeat: repeat;
pointer-events: none;
```

**Usage:**
- Full-page backgrounds
- Large panels
- Hero sections
- Modal overlays

**Best Practices:**
- Keep opacity very low (0.01-0.02)
- Use mix-blend-mode: overlay
- Ensure pointer-events: none
- Works on both dark and light backgrounds

### Grid Pattern

Reinforces structure and technical credibility.

**Implementation:**
```css
position: absolute;
inset: 0;
opacity: 0.02;
background-image:
  linear-gradient(to right, currentColor 1px, transparent 1px),
  linear-gradient(to bottom, currentColor 1px, transparent 1px);
background-size: 60px 60px;
pointer-events: none;
```

**Variants:**
```
Tight Grid:   background-size: 30px 30px
Standard:     background-size: 60px 60px
Loose Grid:   background-size: 120px 120px
```

**Usage:**
- Technical/product pages
- Developer documentation
- Dashboard backgrounds
- Data-heavy interfaces

**Best Practices:**
- Keep opacity very low (0.01-0.03)
- Use currentColor for theme compatibility
- Adjust grid size based on content density
- Combine with noise texture for added depth

### Full Background Stack

**Complete layering system:**
```html
<div class="background-container">
  <!-- Base color -->
  <div class="bg-background"></div>

  <!-- Gradient orbs -->
  <div class="gradient-orb gradient-orb-1"></div>
  <div class="gradient-orb gradient-orb-2"></div>
  <div class="gradient-orb gradient-orb-3"></div>

  <!-- Noise texture -->
  <div class="noise-texture"></div>

  <!-- Grid pattern -->
  <div class="grid-pattern"></div>
</div>
```

---

## UI Components

### Buttons

**Primary Button (CTA):**
```css
background-color: oklch(0.87 0.13 166); /* Mint */
color: #0a0a0a; /* Dark text */
padding: 16px 32px;
border-radius: 12px;
font-weight: 600;
font-size: 18px;
border: 1px solid rgba(255,255,255,0.2);
backdrop-filter: blur(4px);
transition: all 300ms ease;
```
```css
/* Hover */
transform: scale(1.05);
box-shadow: 0 20px 40px rgba(0,0,0,0.3);
```

**Secondary Button (Ghost):**
```css
background: rgba(var(--background), 0.4);
color: var(--foreground);
padding: 16px 32px;
border-radius: 12px;
font-weight: 600;
font-size: 18px;
border: 1px solid var(--border);
backdrop-filter: blur(12px);
transition: all 300ms ease;
```
```css
/* Hover */
background: rgba(var(--background), 0.6);
transform: scale(1.05);
```

**Icon Button:**
```css
padding: 12px;
border-radius: 12px;
background: rgba(var(--background), 0.4);
border: 1px solid rgba(255,255,255,0.1);
backdrop-filter: blur(12px);
transition: all 300ms ease;
```

### Input Fields

**Text Input:**
```css
width: 100%;
padding: 12px 16px;
border-radius: 8px;
border: 1px solid var(--border);
background: var(--background);
color: var(--foreground);
font-size: 16px;
transition: all 200ms ease;
```
```css
/* Focus */
outline: none;
border-color: oklch(0.87 0.13 166);
box-shadow: 0 0 0 3px rgba(177, 242, 216, 0.1);
```

### Cards

**Standard Card:**
```css
background: var(--card);
border: 1px solid var(--border);
border-radius: 16px;
padding: 24px;
transition: all 300ms ease;
```

**Glass Card (on busy background):**
```css
background: rgba(var(--background), 0.3);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 24px;
padding: 32px;
backdrop-filter: blur(12px);
```

---

## Spacing & Layout

### Spacing Scale

```
xs:  4px   / 0.25rem
sm:  8px   / 0.5rem
md:  16px  / 1rem
lg:  24px  / 1.5rem
xl:  32px  / 2rem
2xl: 48px  / 3rem
3xl: 64px  / 4rem
4xl: 96px  / 6rem
```

### Container Widths

```
SM: 640px   - Mobile landscape
MD: 768px   - Tablets
LG: 1024px  - Small desktop
XL: 1280px  - Desktop
2XL: 1536px - Large desktop

Content Max: 1440px (for readability)
```

### Border Radius Scale

```
sm:  4px
md:  8px
lg:  12px
xl:  16px
2xl: 24px
full: 9999px (pill shape)
```

---

## Voice & Tone

### Brand Voice Principles

**1. Confident, not arrogant**
- We know AI and expertise sharing deeply
- Speak from experience, not theory
- Avoid hype and buzzwords
- Be direct and honest about limitations

**2. Professional, not stuffy**
- Clear, accessible language
- No jargon unless necessary
- Conversational but not casual
- Respect the user's intelligence

**3. Empowering, not condescending**
- Focus on user capabilities, not product features
- "You can" not "Our platform allows you to"
- Celebrate user expertise
- Make complex things feel achievable

**4. Human, not robotic**
- Write like a knowledgeable colleague
- Show personality without being quirky
- Use "we" and "you" naturally
- Real examples, real scenarios

### Tone Across Contexts

**Marketing & Landing Pages:**
- Bold and inspiring
- Focus on transformation and impact
- Use concrete examples
- Call out pain points directly
- Example: "Your calendar has limits. Ditto doesn't."

**Product UI:**
- Clear and instructional
- Action-oriented
- Helpful without being chatty
- Example: "Pull in a Ditto to get expert input as you write"

**Documentation:**
- Thorough and structured
- Assume technical competence
- Step-by-step when needed
- Example: "Deploy your Ditto across multiple projects by sharing the context profile URL"

**Error Messages:**
- Honest and solution-focused
- Never blame the user
- Provide clear next steps
- Example: "We couldn't load that Ditto. Check your connection and try again."

### Writing Guidelines

**DO:**
- Lead with value and outcomes
- Use active voice
- Write in second person ("you") when addressing users
- Use specific examples from agency work
- Break up long paragraphs
- Use formatting (bold, lists) for scannability
- Define terms on first use

**DON'T:**
- Use AI clichés ("leveraging", "unlock", "game-changing")
- Oversell or make unrealistic promises
- Speak in passive voice
- Use corporate speak ("synergize", "optimize", "maximize")
- Bury the lede
- Use exclamation marks excessively (one per page max)

---

## Terminology

### Core Terms

**Ditto** (noun, proper)
- Definition: A personalized AI agent trained on a knowledge worker's expertise
- Usage: Always capitalize. Plural: "Dittos"
- Example: "Create your first Ditto in minutes"

**Context Profile** (noun)
- Definition: The structured representation of a person's expertise that Dittos use
- Usage: Lowercase unless starting sentence
- Example: "Your context profile captures how you think, not just what you know"

**Tacit Knowledge** (noun)
- Definition: Know-how that's hard to articulate but shapes how experts work
- Usage: Lowercase, explain on first use
- Example: "Ditto captures your tacit knowledge - the instincts and judgment that make you effective"

**Deploy** (verb)
- Definition: To make a Ditto available in a workspace or project
- Usage: Active voice preferred
- Example: "Deploy your creative director Ditto to review brand alignment"

**Workstation** (noun, proper)
- Definition: Mirror Factory's agentic document editor for multi-Ditto workflows
- Usage: Always capitalize
- Example: "Draft proposals in Workstation with input from multiple expert Dittos"

**Pull In** (verb phrase)
- Definition: To activate a Ditto within a document or project
- Usage: Casual but clear
- Example: "Pull in your strategist Ditto when planning campaigns"

### Terms to Avoid

❌ **"AI Assistant"** → ✅ "Ditto" or "AI agent"
❌ **"Train the AI"** → ✅ "Build your Ditto" or "Capture your expertise"
❌ **"Prompt engineering"** → ✅ "Working with your Ditto"
❌ **"LLM"** → ✅ Use in technical docs only, not marketing
❌ **"Clone"** → ✅ "Ditto" (clone implies replacement, we're about multiplication)

### Product-Specific Terms

**Multi-Ditto Workflow** (noun phrase)
- Collaborating with multiple expert Dittos simultaneously
- Example: "Multi-Ditto workflows let you coordinate expertise without calendar conflicts"

**Expert Marketplace** (noun)
- Future platform where thought leaders sell access to their Dittos
- Example: "In the expert marketplace, authors distribute their judgment at scale"

**Agency Mode** (noun, proper)
- Initial Workstation use case optimized for agency teams
- Example: "Agency Mode helps creative teams share internal expertise"

---

## Usage Examples

### Landing Page Hero

```
[Glassmorphism container with logo - 700px width]

"Knowledge workers can only be in one place at a time.
Ditto multiplies their expertise across every project."

[Primary CTA: Get Started]  [Secondary CTA: Learn More]
```

**CSS:**
- Logo container: 32px padding, backdrop-blur-md, border-radius 24px
- Headline: 48px, font-weight 700, line-height 1.25
- Buttons: 16px padding vertical, 32px horizontal, 18px font size

### Marketing Headline

```
"Instead of burning out from spreading too thin,
create a network effect that amplifies your impact."
```

**Formatting:**
- Bold key phrase: "amplifies your impact"
- Use on gradient orb background
- Pair with concrete example below

### Product Onboarding

```
Welcome to Workstation

Create your first Ditto by connecting your work:
1. Link your project files
2. Share how you approach problems
3. Deploy across your team

[Continue →]
```

**Tone:**
- Welcoming but efficient
- Action-oriented steps
- Clear progression

### Error Message

```
⚠️ Couldn't load Ditto

We couldn't connect to your creative director Ditto.
This usually happens when:
• Your internet connection dropped
• The Ditto profile moved or was deleted

[Try Again]  [Contact Support]
```

**Approach:**
- Icon for context
- Specific to what failed
- Likely causes listed
- Clear actions offered

---

## Changelog

---
Created: 2025-11-11 10:30 PM EST
Author: Claude Code
Changes: Initial comprehensive brand guide covering visual identity, colors, typography, effects, voice/tone, and terminology for Mirror Factory and Ditto product line
---
