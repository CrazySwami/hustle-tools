# Separation of Concerns - Code Architecture Principle

**Date:** October 26, 2025
**Status:** ✅ Enforced Across All Code Generation & Editing

---

## Overview

This project enforces **strict separation of concerns** across all HTML/CSS/JavaScript code generation and editing. This architectural principle ensures clean, maintainable, and professional code by keeping structure, styling, and functionality in their respective files.

---

## The Three Pillars

### 1. HTML = Structure Only

**Purpose:** Define layout, hierarchy, and semantic markup

**Responsibilities:**
- Document structure (sections, divs, headings, paragraphs)
- Content hierarchy (h1 > h2 > p, etc.)
- Semantic meaning (article, nav, aside, header, footer)
- Accessibility attributes (ARIA labels, roles)
- Data attributes for JavaScript hooks (data-toggle, data-target)

**Prohibited:**
- ❌ Inline styles (`<div style="color: red">`)
- ❌ Style attributes
- ❌ `<style>` tags
- ❌ Inline event handlers (`onclick="doSomething()"`)
- ❌ `<script>` tags
- ❌ Presentational attributes (`bgcolor`, `width`, `align`)

**Example - Good HTML:**
```html
<section class="hero-section">
  <div class="hero-content">
    <h1 class="hero-title">Welcome</h1>
    <p class="hero-description">Your journey starts here.</p>
    <button class="hero-cta" data-action="signup">Get Started</button>
  </div>
</section>
```

**Example - Bad HTML (Mixed Concerns):**
```html
<!-- ❌ DON'T DO THIS -->
<section style="background: blue; padding: 50px;">
  <h1 onclick="alert('clicked')" style="color: white;">Welcome</h1>
  <button style="background: red;" onclick="signup()">Get Started</button>
</section>
```

---

### 2. CSS = Styling Only

**Purpose:** Define all visual presentation, colors, spacing, typography

**Responsibilities:**
- Visual design (colors, backgrounds, borders)
- Typography (fonts, sizes, weights, line-height)
- Spacing (padding, margin, gaps)
- Layout (flexbox, grid, positioning)
- Responsive design (media queries)
- Animations and transitions
- Hover/focus/active states

**Prohibited:**
- ❌ HTML markup in CSS
- ❌ JavaScript in CSS
- ❌ Content via `::before`/`::after` (except purely decorative)
- ❌ Functional logic

**Guidelines:**
- ✅ Use CSS custom properties (variables) for theming
- ✅ Mobile-first responsive design
- ✅ Semantic class names (.hero-section, not .blue-box)
- ✅ BEM-like naming for complex components
- ✅ Transitions for smooth interactions

**Example - Good CSS:**
```css
/* CSS Variables at top */
:root {
  --primary-color: #3498db;
  --spacing-lg: 3rem;
  --border-radius: 8px;
}

.hero-section {
  background: linear-gradient(135deg, var(--primary-color), #2c3e50);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
}

.hero-title {
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero-cta {
  background: white;
  color: var(--primary-color);
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.hero-cta:hover {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 1.8rem;
  }
}
```

**Example - Bad CSS (Mixed Concerns):**
```css
/* ❌ DON'T DO THIS */
.hero-section::before {
  content: "Welcome"; /* Adding content in CSS */
}

.hero-cta {
  /* Don't put functional logic in CSS */
  pointer-events: none; /* This should be handled in JS */
}
```

---

### 3. JavaScript = Functionality Only

**Purpose:** Define all interactivity, event handling, dynamic behavior

**Responsibilities:**
- Event listeners (clicks, hovers, scrolls, forms)
- DOM manipulation (add/remove classes, update text)
- API calls and data fetching
- Form validation
- Animations and transitions (via class toggling)
- State management
- Dynamic content loading

**Prohibited:**
- ❌ Inline style manipulation (`element.style.color = 'red'`)
- ❌ Creating HTML structure (unless dynamic content)
- ❌ Presentational logic

**Guidelines:**
- ✅ Use `classList.add/remove/toggle` instead of `style.property`
- ✅ Modern ES6+ syntax (arrow functions, const/let, destructuring)
- ✅ Event delegation for dynamic elements
- ✅ IIFE or modules to avoid global scope pollution
- ✅ Error handling with try/catch
- ✅ Query selectors targeting classes from HTML

**Example - Good JavaScript:**
```javascript
// Vanilla JS with proper separation
(function() {
  'use strict';

  const heroCta = document.querySelector('.hero-cta');
  const heroSection = document.querySelector('.hero-section');

  // Add/remove CSS classes, don't manipulate styles directly
  heroCta.addEventListener('click', () => {
    heroSection.classList.add('hero-section--active');

    // Trigger signup flow
    initiateSignup();
  });

  function initiateSignup() {
    // Handle signup logic
    console.log('Signup initiated');
  }

  // Smooth scroll animation via class
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      heroSection.classList.add('hero-section--scrolled');
    } else {
      heroSection.classList.remove('hero-section--scrolled');
    }
  });
})();
```

**Example - Bad JavaScript (Mixed Concerns):**
```javascript
// ❌ DON'T DO THIS
const button = document.querySelector('.hero-cta');

button.addEventListener('click', () => {
  // Don't manipulate inline styles
  button.style.background = 'red';
  button.style.color = 'white';
  button.style.transform = 'scale(1.2)';

  // Don't create HTML in JS (unless necessary for dynamic content)
  button.innerHTML = '<span style="color: blue;">Clicked!</span>';
});
```

---

## Where This Is Enforced

### 1. Generation API (`/api/generate-html-stream`)

**File:** `/src/app/api/generate-html-stream/route.ts`

All three prompts (HTML, CSS, JS) include separation of concerns section at the top:

**HTML Prompt:**
```
**SEPARATION OF CONCERNS (CRITICAL):**
- **HTML = STRUCTURE ONLY** - Define the layout, hierarchy, and content structure
- **NO STYLING IN HTML** - All visual design belongs in the CSS file (generated separately)
- **NO FUNCTIONALITY IN HTML** - All interactivity belongs in the JavaScript file (generated separately)
- Unless the user explicitly instructs otherwise, ALWAYS maintain strict separation
```

**CSS Prompt:**
```
**SEPARATION OF CONCERNS (CRITICAL):**
- **CSS = STYLING ONLY** - Define all visual presentation, colors, spacing, typography
- **NO STRUCTURE IN CSS** - Do not add content via ::before/::after unless purely decorative
- **NO FUNCTIONALITY IN CSS** - All interactivity belongs in the JavaScript file
- Unless the user explicitly instructs otherwise, ALWAYS maintain strict separation
```

**JS Prompt:**
```
**SEPARATION OF CONCERNS (CRITICAL):**
- **JavaScript = FUNCTIONALITY ONLY** - Define all interactivity, event handling, dynamic behavior
- **NO STRUCTURE IN JS** - Do not create HTML elements in JS unless absolutely necessary for dynamic content
- **NO STYLING IN JS** - Do not manipulate inline styles; add/remove CSS classes instead
- Unless the user explicitly instructs otherwise, ALWAYS maintain strict separation
```

---

### 2. Editing API (`/api/edit-code-stream`)

**File:** `/src/app/api/edit-code-stream/route.ts`

Same separation of concerns guidance appears in all three file type prompts (HTML, CSS, JS):

- Prevents adding inline styles when editing HTML
- Prevents adding HTML markup when editing CSS
- Prevents style manipulation when editing JavaScript
- Encourages class-based styling in JS edits

**Special Handling:**
- Empty file generation follows same rules
- Diff-based edits preserve separation in existing code
- Multi-file context provided to understand cross-file relationships

---

### 3. Chat System Prompt (`/api/chat-elementor`)

**File:** `/src/app/api/chat-elementor/route.ts`

The chat assistant's system prompt includes:

```
**SEPARATION OF CONCERNS (CRITICAL - APPLIES TO ALL OPERATIONS):**
- **HTML = STRUCTURE ONLY** - Layout, hierarchy, semantic markup
- **CSS = STYLING ONLY** - Visual design, colors, spacing, typography
- **JavaScript = FUNCTIONALITY ONLY** - Interactivity, event handling, dynamic behavior
- **NEVER mix concerns** - No inline styles, no onclick handlers, no style manipulation in JS
- **Unless the user explicitly instructs otherwise**, ALWAYS maintain strict separation across all files
- Structure belongs in HTML, styling in CSS, functionality in JavaScript
```

**Multi-File Edit Examples:**
- "Add button and make it blue" → editCode(html) + editCode(css)
- "Make the menu toggle on click" → editCode(html) + editCode(js)

---

## User Override

All prompts include the clause:

> **Unless the user explicitly instructs otherwise**, ALWAYS maintain strict separation

**Valid Override Examples:**
- "Add inline styles for email HTML" (email clients require inline styles)
- "Use onclick for tracking" (specific tracking requirement)
- "Generate single-file HTML with embedded styles" (specific delivery format)

**When user overrides:**
- AI will follow user's explicit instruction
- But will warn if it violates best practices (optional)
- Will maintain separation for other parts not explicitly overridden

---

## Benefits

### 1. Maintainability
- Changes to structure don't affect styling or functionality
- Easy to find and fix bugs (know which file to check)
- Clear ownership of concerns

### 2. Reusability
- CSS can be reused across multiple HTML structures
- JavaScript modules work with any HTML structure (via classes)
- Components are portable

### 3. Performance
- CSS can be cached separately
- JavaScript can be deferred/async loaded
- Smaller inline HTML (no embedded styles/scripts)

### 4. Collaboration
- Designers work on CSS without touching HTML/JS
- Developers work on JS without touching CSS
- Content editors work on HTML without breaking styles

### 5. Debugging
- Visual issues → check CSS file
- Behavior issues → check JS file
- Structure issues → check HTML file
- No need to search across inline styles/scripts

### 6. Testing
- Unit test JavaScript functions independently
- Visual regression test CSS changes
- Accessibility test HTML structure
- Clear separation enables focused testing

---

## Common Patterns

### Pattern 1: Toggle States

**HTML:**
```html
<button class="toggle-btn" data-target="menu">Menu</button>
<nav class="menu">...</nav>
```

**CSS:**
```css
.menu {
  display: none;
}

.menu--visible {
  display: block;
}
```

**JavaScript:**
```javascript
document.querySelector('.toggle-btn').addEventListener('click', (e) => {
  const target = document.querySelector(`.${e.target.dataset.target}`);
  target.classList.toggle('menu--visible');
});
```

---

### Pattern 2: Form Validation

**HTML:**
```html
<form class="signup-form">
  <input type="email" class="form-input" required>
  <button type="submit" class="form-submit">Submit</button>
</form>
```

**CSS:**
```css
.form-input--error {
  border-color: red;
}

.form-input--valid {
  border-color: green;
}
```

**JavaScript:**
```javascript
document.querySelector('.signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.target.querySelector('.form-input');

  if (validateEmail(input.value)) {
    input.classList.remove('form-input--error');
    input.classList.add('form-input--valid');
    submitForm(input.value);
  } else {
    input.classList.remove('form-input--valid');
    input.classList.add('form-input--error');
  }
});
```

---

### Pattern 3: Dynamic Content Loading

**HTML:**
```html
<div class="content-container" data-endpoint="/api/posts">
  <div class="loading-spinner">Loading...</div>
</div>
```

**CSS:**
```css
.loading-spinner {
  display: block;
  animation: spin 1s linear infinite;
}

.content-container--loaded .loading-spinner {
  display: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**JavaScript:**
```javascript
const container = document.querySelector('.content-container');
const endpoint = container.dataset.endpoint;

fetch(endpoint)
  .then(response => response.json())
  .then(data => {
    container.innerHTML = renderPosts(data);
    container.classList.add('content-container--loaded');
  });
```

---

## Migration Guide

If you have existing code with mixed concerns, here's how to refactor:

### Step 1: Extract Inline Styles to CSS

**Before:**
```html
<div style="background: blue; padding: 20px; color: white;">
  Content
</div>
```

**After:**
```html
<div class="content-box">Content</div>
```

```css
.content-box {
  background: blue;
  padding: 20px;
  color: white;
}
```

---

### Step 2: Extract Inline Handlers to JavaScript

**Before:**
```html
<button onclick="alert('clicked')">Click</button>
```

**After:**
```html
<button class="alert-btn">Click</button>
```

```javascript
document.querySelector('.alert-btn').addEventListener('click', () => {
  alert('clicked');
});
```

---

### Step 3: Replace Style Manipulation with Class Toggling

**Before:**
```javascript
element.style.color = 'red';
element.style.fontSize = '20px';
element.style.fontWeight = 'bold';
```

**After:**
```javascript
element.classList.add('highlight');
```

```css
.highlight {
  color: red;
  font-size: 20px;
  font-weight: bold;
}
```

---

## Exceptions

### When to Break Separation of Concerns:

1. **Email HTML** - Email clients require inline styles
   ```html
   <table style="width: 100%; background: blue;">
   ```

2. **Dynamic Inline Styles** - When values come from user input/database
   ```javascript
   element.style.backgroundColor = userSelectedColor; // OK
   ```

3. **Critical CSS** - For above-the-fold performance
   ```html
   <style>
     .hero { display: block; } /* Critical styles */
   </style>
   ```

4. **SVG Inline Styles** - When styling SVG elements dynamically
   ```javascript
   svgPath.style.fill = dynamicColor; // OK for SVG
   ```

5. **Canvas/WebGL** - Requires programmatic style manipulation
   ```javascript
   ctx.fillStyle = 'red'; // OK for canvas
   ```

**Rule of Thumb:** Only break separation when technically necessary, not for convenience.

---

## Testing Separation

### Manual Checklist:

- [ ] HTML file contains NO `style` attributes
- [ ] HTML file contains NO `<style>` tags
- [ ] HTML file contains NO `<script>` tags
- [ ] HTML file contains NO inline event handlers (`onclick`, etc.)
- [ ] CSS file contains NO HTML markup
- [ ] CSS file contains NO JavaScript
- [ ] JavaScript file uses `classList` instead of `style.property`
- [ ] JavaScript creates HTML only for dynamic content (not static structure)

### Automated Checks (Future Enhancement):

Could implement linting rules to enforce:
- No inline styles in HTML (except email templates)
- No `element.style.x =` in JavaScript (except exceptions)
- No HTML in CSS (except content for ::before/::after decorations)

---

## Summary

✅ **HTML** = Structure, hierarchy, semantic meaning
✅ **CSS** = Visual design, colors, spacing, typography
✅ **JavaScript** = Interactivity, behavior, dynamic content

❌ **Never** mix concerns unless explicitly required by user or technical necessity
❌ **Never** use inline styles, onclick handlers, or style manipulation in JS
❌ **Never** add structural HTML in JS (except dynamic content)

This principle is enforced across:
- `/api/generate-html-stream` - All three file generation prompts
- `/api/edit-code-stream` - All three file editing prompts
- `/api/chat-elementor` - System prompt for chat assistant

**Result:** Clean, maintainable, professional code that follows web development best practices.
