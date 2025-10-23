# GrapeJS Visual Editor Integration

**Last Updated:** October 21, 2025
**Branch:** `development`, `staging` (deployed)
**Status:** Phase 1 Complete ✅ | Phase 2 Complete ✅

---

## Overview

The GrapeJS Visual Editor integration adds a professional drag-and-drop visual HTML/CSS/JS builder to the Elementor Editor page. This allows users to visually design sections alongside the existing code-based Monaco editor, providing the best of both worlds: visual design for rapid prototyping and code editing for fine-tuned control.

### Key Capabilities

- **3-Column Layout**: Blocks panel (left), visual canvas (center), styles panel (right)
- **Visible Blocks Panel**: Drag-and-drop elements with clear "+" buttons for adding components
- **Live Style Editing**: Real-time CSS property manipulation via Style Manager
- **Responsive Preview**: Desktop, Tablet, and Mobile device modes
- **Global CSS Integration**: Automatically loads and respects global stylesheets
- **Bidirectional Sync**: Seamlessly switch between Visual ↔ Code editors with automatic state sync
- **Navigation Buttons**: Switch between editors with one click from either tab
- **CSS Cascade Inspector**: Shows exactly where each CSS style comes from (inline, class, global)

---

## Architecture

### Component Structure

```
src/
├── components/
│   └── elementor/
│       └── VisualSectionEditor.tsx    # Main GrapeJS wrapper component
├── app/
│   └── elementor-editor/
│       └── page.tsx                    # Updated with Visual Editor tab
└── lib/
    └── global-stylesheet-context.tsx   # Global CSS integration
```

### Dependencies

```json
{
  "grapesjs": "^1.0.105",
  "@grapesjs/react": "^1.0.11"
}
```

- **grapesjs**: Core visual editor library (262KB)
- **@grapesjs/react**: Official React wrapper for declarative UI

---

## Implementation Details

### Phase 1: Basic GrapeJS Integration ✅

#### 1. VisualSectionEditor Component

**File:** `src/components/elementor/VisualSectionEditor.tsx`

**Key Features:**
- Client-side only rendering (GrapeJS requires DOM)
- Dynamic import of GrapeJS library
- Integration with `useGlobalStylesheet` hook
- Component selection event listeners (foundation for Phase 2)

**Props:**
```typescript
interface VisualSectionEditorProps {
  initialSection?: Section;           // Load existing section
  onSectionChange?: (section: Section) => void;  // Update parent state
  onSwitchToCodeEditor?: () => void;  // Switch to Code tab
}
```

**GrapeJS Configuration:**
```typescript
{
  height: '100%',
  width: '100%',
  storageManager: false,  // No auto-save (we handle it)
  canvas: {
    styles: [globalCssDataUrl]  // Inject global CSS
  },
  styleManager: {
    sectors: [
      { name: 'Typography', properties: [...] },
      { name: 'Dimension', properties: [...] },
      { name: 'Background', properties: [...] },
      { name: 'Border', properties: [...] },
      { name: 'Extra', properties: [...] }
    ]
  },
  deviceManager: {
    devices: [
      { name: 'Desktop', width: '' },
      { name: 'Tablet', width: '768px' },
      { name: 'Mobile', width: '320px' }
    ]
  }
}
```

#### 2. Tab Integration

**Changes to `elementor-editor/page.tsx`:**
- Added "Visual Editor" tab between "Code Editor" and "Section Library"
- Renamed "Section Editor" → "Code Editor" for clarity
- Added EyeIcon for visual editor tab
- Tab syncs `currentSection` state bidirectionally

**Tab Order:**
1. Code Editor (Monaco - HTML/CSS/JS)
2. **Visual Editor (GrapeJS)** ⭐ NEW
3. Section Library
4. WordPress Playground
5. Site Content
6. Style Guide

#### 3. Global CSS Integration

**How it works:**
```typescript
const { globalCss } = useGlobalStylesheet();

// Convert CSS to data URL for GrapeJS canvas
const globalCssDataUrl = globalCss
  ? `data:text/css;base64,${btoa(globalCss)}`
  : undefined;

// Inject into GrapeJS
canvas: {
  styles: globalCssDataUrl ? [globalCssDataUrl] : []
}
```

**Benefits:**
- Elements automatically inherit from global styles
- Matches WordPress theme styles
- Consistent styling across Visual and Code editors

#### 4. Import/Export Workflow

**Import from Code Editor:**
```typescript
if (initialSection?.html) {
  editor.setComponents(initialSection.html);
  if (initialSection.css) {
    editor.setStyle(initialSection.css);
  }
}
```

**Export to Code Editor:**
```typescript
const html = editor.getHtml();
const css = editor.getCss();

onSectionChange({
  ...initialSection,
  html,
  css,
  js: initialSection?.js || '',
  updatedAt: Date.now()
});
```

**Export Standalone HTML:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Section Export</title>
  <style>
    {css}
  </style>
</head>
<body>
  {html}
</body>
</html>
```

---

## Latest Enhancements (October 2025) ✅

### 3-Column Layout Implementation

The Visual Editor now uses a professional 3-column layout:

1. **Left Panel - Blocks (256px)**
   - Visible blocks panel with drag-and-drop components
   - Clear "+" icons for adding elements
   - Scrollable component library

2. **Center Panel - Canvas (flex-1)**
   - GrapeJS visual editor canvas
   - Click-to-select elements
   - Responsive device preview toolbar

3. **Right Panel - Styles & Inspector (320px)**
   - Tabbed interface: Styles / Layers / Traits
   - Style Manager with all CSS properties
   - Integrated CSS Cascade Inspector (collapsible)

### Bidirectional Code Synchronization

- **Code → Visual**: `useEffect` hook watches `initialSection.id` and `initialSection.updatedAt`
- **Visual → Code**: Real-time updates via `onSectionChange` callback
- **Tab Switching**: State preserved when switching between Code and Visual tabs

### Navigation Buttons

- **Code Editor**: Purple "👁️ Visual Editor" button in toolbar
- **Visual Editor**: "Code View" button to switch back to code
- Both buttons save current changes before switching

### WordPress Import Enhancements

All section imports to WordPress now apply full-width defaults:

**Section Settings:**
```javascript
{
  content_width: 'full',
  padding: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true },
  margin: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true }
}
```

**Column Settings:**
```javascript
{
  _column_size: 100,
  padding: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true },
  margin: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true }
}
```

Applied in:
- `saveSectionToTemplateLibrary()` - Template library imports
- `importHtmlSectionToPage()` - Page preview imports

---

## Phase 2: CSS Cascade Inspector ✅

### Objective

Build a custom inspector panel that shows **exactly where each CSS property value comes from** in the cascade hierarchy:

1. **Inline Styles** (highest priority)
2. **Class-Based Styles** (from component classes)
3. **Global CSS Styles** (from external stylesheet)

### Visual Design

When a user clicks any element in the GrapeJS canvas, a side panel appears:

```
┌─ CSS Cascade Inspector ──────────────────────┐
│ Selected: <button class="btn primary">       │
│                                               │
│ ▼ font-size: 16px                            │
│   ├─ [Inline Style] 16px ✓ ACTIVE            │
│   ├─ [.btn] 14px                             │
│   └─ [button] 12px (Global CSS)              │
│                                               │
│ ▼ font-family: 'Inter'                       │
│   ├─ [.btn] 'Inter' ✓ ACTIVE                 │
│   └─ [body] 'Arial' (Global CSS)             │
│                                               │
│ ▼ color: #0066cc                             │
│   ├─ [.primary] #0066cc ✓ ACTIVE             │
│   ├─ [.btn] #333333                          │
│   └─ [:root] #000000 (Global CSS)            │
│                                               │
│ ▼ background: linear-gradient(...)           │
│   └─ [.primary] linear-gradient(...) ✓       │
│                                               │
│ ▼ padding: 12px 24px                         │
│   ├─ [.btn] 12px 24px ✓ ACTIVE              │
│   └─ [button] 8px 16px (Global CSS)          │
└───────────────────────────────────────────────┘
```

**Color Coding:**
- 🔵 Blue: Inline styles (highest priority)
- 🟢 Green: Class-based styles
- 🟠 Orange: Global CSS styles

**Interactive Features:**
- ✓ Checkmarks show which rule is "winning" in cascade
- Click a rule to jump to its definition
- Expand/collapse properties
- Search filter for properties
- Toggle visibility of computed-only properties

### Technical Implementation

#### 1. Component Architecture

**New Component:** `CSSCascadeInspector.tsx`

```typescript
interface CSSCascadeInspectorProps {
  editor: grapesjs.Editor;
  selectedComponent: grapesjs.Component | null;
  globalCss: string;
}
```

#### 2. Style Source Detection

**Algorithm:**
```typescript
function getStyleSources(component: Component, property: string) {
  const sources: StyleSource[] = [];

  // 1. Check inline styles
  const inlineValue = component.getStyle()[property];
  if (inlineValue) {
    sources.push({
      type: 'inline',
      selector: 'Inline Style',
      value: inlineValue,
      specificity: [1, 0, 0, 0],
      active: true
    });
  }

  // 2. Check class-based styles from GrapeJS CSS rules
  const classes = component.getClasses();
  classes.forEach(cls => {
    const rule = editor.Css.getRule(`.${cls}`);
    const value = rule?.getStyle()[property];
    if (value) {
      sources.push({
        type: 'class',
        selector: `.${cls}`,
        value,
        specificity: calculateSpecificity(`.${cls}`),
        active: false
      });
    }
  });

  // 3. Check global CSS (external stylesheet)
  const globalRules = parseGlobalCSS(globalCss);
  globalRules.forEach(rule => {
    if (matchesSelector(component, rule.selector)) {
      const value = rule.styles[property];
      if (value) {
        sources.push({
          type: 'global',
          selector: rule.selector,
          value,
          specificity: calculateSpecificity(rule.selector),
          active: false
        });
      }
    }
  });

  // 4. Sort by specificity (highest first)
  sources.sort((a, b) => compareSpecificity(b.specificity, a.specificity));

  // 5. Mark the highest priority rule as active
  if (sources.length > 0 && !sources[0].active) {
    sources[0].active = true;
  }

  return sources;
}
```

#### 3. CSS Specificity Calculation

```typescript
function calculateSpecificity(selector: string): [number, number, number, number] {
  // Returns [inline, id, class, element]
  // e.g., "button.btn#submit" -> [0, 1, 1, 1]

  const inline = 0; // Only for inline styles
  const ids = (selector.match(/#/g) || []).length;
  const classes = (selector.match(/\./g) || []).length +
                  (selector.match(/\[/g) || []).length +
                  (selector.match(/:/g) || []).length;
  const elements = selector.split(' ').filter(s =>
    !s.startsWith('.') && !s.startsWith('#') && s !== '>' && s !== '+'
  ).length;

  return [inline, ids, classes, elements];
}
```

#### 4. Global CSS Parsing

```typescript
function parseGlobalCSS(css: string): CSSRule[] {
  const rules: CSSRule[] = [];

  // Create temporary style element
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Access CSSOM
  const sheet = style.sheet as CSSStyleSheet;

  for (let i = 0; i < sheet.cssRules.length; i++) {
    const rule = sheet.cssRules[i];

    if (rule instanceof CSSStyleRule) {
      const styles: Record<string, string> = {};

      for (let j = 0; j < rule.style.length; j++) {
        const prop = rule.style[j];
        styles[prop] = rule.style.getPropertyValue(prop);
      }

      rules.push({
        selector: rule.selectorText,
        styles
      });
    }
  }

  // Cleanup
  document.head.removeChild(style);

  return rules;
}
```

#### 5. Event Integration

```typescript
// In VisualSectionEditor.tsx
editor.on('component:selected', (component) => {
  setSelectedComponent(component);
  // Trigger cascade inspector to show
});

editor.on('component:deselected', () => {
  setSelectedComponent(null);
  // Hide cascade inspector
});

editor.on('component:update:style', (component) => {
  // Refresh cascade inspector when styles change
  if (selectedComponent?.getId() === component.getId()) {
    refreshCascadeInspector();
  }
});
```

---

## GrapeJS API Reference

### Core Editor Methods

```typescript
const editor = editorRef.current;

// Components
editor.getSelected();              // Get selected component
editor.setComponents(html);        // Load HTML
editor.getHtml();                  // Export HTML
editor.getComponents();            // Get component tree

// Styles
editor.setStyle(css);              // Load CSS
editor.getCss();                   // Export CSS
editor.Css.getRule(selector);      // Get CSS rule by selector
editor.Css.setRule(selector, styles); // Add/update CSS rule

// Devices
editor.Devices.select('Tablet');   // Switch device
editor.Devices.getAll();           // Get all devices

// Selection
editor.select(component);          // Select component
editor.selectAdd(component);       // Add to selection
editor.selectRemove(component);    // Remove from selection

// Events
editor.on('component:selected', handler);
editor.on('component:deselected', handler);
editor.on('component:update', handler);
editor.on('component:update:style', handler);
editor.on('selector:add', handler);
```

### Component Methods

```typescript
const component = editor.getSelected();

// Attributes
component.getEl();                 // Get DOM element
component.getId();                 // Get unique ID
component.getName();               // Get component type
component.getClasses();            // Get class names
component.addClass(className);     // Add class
component.removeClass(className);  // Remove class

// Styles
component.getStyle();              // Get inline styles object
component.setStyle({ color: 'red' }); // Set inline styles
component.addStyle({ margin: '10px' }); // Add inline styles
component.removeStyle('color');    // Remove inline style

// Traits/Attributes
component.getTrait(name);          // Get trait (attribute)
component.addTrait(trait);         // Add trait
component.get('attributes');       // Get all HTML attributes

// Hierarchy
component.parent();                // Get parent component
component.components();            // Get child components
component.append(child);           // Add child component
component.remove();                // Remove component
```

---

## Usage Examples

### 1. Load Section from AI-Generated HTML

```typescript
// User generates HTML via AI chat
const aiGeneratedHtml = `
  <section class="hero">
    <h1>Welcome</h1>
    <button class="cta">Get Started</button>
  </section>
`;

const aiGeneratedCss = `
  .hero { background: #f0f0f0; padding: 60px; }
  .cta { background: #0066cc; color: white; }
`;

// Load into Visual Editor
editor.setComponents(aiGeneratedHtml);
editor.setStyle(aiGeneratedCss);
```

### 2. Switch Between Editors

```typescript
// Code Editor → Visual Editor
const handleLoadInVisual = () => {
  setCurrentSection({
    html: codeEditorHtml,
    css: codeEditorCss,
    js: codeEditorJs
  });
  setActiveTab('visual');
};

// Visual Editor → Code Editor
const handleExportToCode = () => {
  const html = editor.getHtml();
  const css = editor.getCss();

  setCurrentSection({
    html,
    css,
    js: currentSection?.js || ''
  });
  setActiveTab('json'); // Switch to Code Editor
};
```

### 3. Save to Section Library

```typescript
const handleSaveToLibrary = () => {
  const html = editor.getHtml();
  const css = editor.getCss();

  const section: Section = {
    id: `section-${Date.now()}`,
    name: 'Hero Section',
    html,
    css,
    js: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Save to localStorage
  const sections = JSON.parse(localStorage.getItem('html-sections') || '[]');
  sections.push(section);
  localStorage.setItem('html-sections', JSON.stringify(sections));
};
```

---

## Best Practices

### 1. Global CSS Management

**DO:**
- Load global CSS via `canvas.styles` for consistent inheritance
- Use CSS variables for theme colors
- Keep global CSS minimal (base styles only)

**DON'T:**
- Mix global CSS with component CSS in GrapeJS editor
- Override global CSS with inline styles (use classes instead)
- Load multiple conflicting stylesheets

### 2. Component Organization

**DO:**
- Use semantic HTML elements (section, article, header, footer)
- Add meaningful class names for styling
- Group related components in containers
- Use GrapeJS components for reusability

**DON'T:**
- Over-nest components (keep DOM shallow)
- Use inline styles for everything (affects cascade inspector)
- Create components without classes (hard to style)

### 3. Performance

**DO:**
- Lazy-load GrapeJS (only when tab is active)
- Limit number of components in canvas
- Use device preview sparingly (re-renders canvas)
- Debounce auto-save operations

**DON'T:**
- Load large images directly in canvas
- Keep too many unused components
- Trigger frequent re-renders

---

## Troubleshooting

### Issue: GrapeJS not loading

**Symptoms:** Spinner shows indefinitely, editor never appears

**Solutions:**
1. Check browser console for errors
2. Verify GrapeJS CDN is accessible (`https://unpkg.com/grapesjs/dist/css/grapes.min.css`)
3. Ensure dynamic import succeeds: `import('grapesjs')`
4. Check that component is client-side only (`'use client'`)

### Issue: Global CSS not applying

**Symptoms:** Elements don't inherit from global stylesheet

**Solutions:**
1. Verify `globalCss` is not empty
2. Check data URL conversion: `btoa(globalCss)`
3. Inspect canvas iframe: open DevTools, select iframe, check `<style>` tags
4. Ensure global CSS has proper selectors (e.g., `button`, `.btn`, not `:root` only)

### Issue: Styles lost after export

**Symptoms:** HTML exports but CSS is missing or incomplete

**Solutions:**
1. Check `editor.getCss()` returns non-empty string
2. Verify `onSectionChange` callback is called
3. Look for console errors during export
4. Check that CSS rules are added to GrapeJS CSS manager, not just inline

### Issue: Component selection not working

**Symptoms:** Clicking elements doesn't select them

**Solutions:**
1. Check `selectable: true` on components
2. Verify canvas is not in preview mode
3. Ensure no overlays blocking clicks
4. Check for `editor.on('component:selected')` event firing

---

## Future Enhancements

### Phase 3: Custom Component Library

- Pre-built section templates (Hero, Features, Pricing, etc.)
- WordPress/Elementor-specific blocks
- Animated components with Framer Motion
- Responsive grid system

### Phase 4: Advanced Features

- Real-time collaboration (multiple users editing)
- Version history with undo/redo across sessions
- AI-powered component suggestions
- Integration with WordPress Playground (live preview)

### Phase 5: Developer Tools

- Export to React/Vue components
- CSS-in-JS conversion
- Component props editor
- TypeScript type generation

---

## Related Documentation

- [Elementor Editor Implementation](../ELEMENTOR_EDITOR_IMPLEMENTATION_COMPLETE.md)
- [Global Stylesheet Context](../src/lib/global-stylesheet-context.tsx)
- [Section Schema](../src/lib/section-schema.ts)
- [GrapeJS Official Docs](https://grapesjs.com/docs/)
- [GrapeJS React Wrapper](https://github.com/GrapesJS/react)

---

## Changelog

### 2025-10-21 - Phase 1 Complete
- ✅ Added VisualSectionEditor component
- ✅ Integrated GrapeJS with React wrapper
- ✅ Global CSS auto-loading
- ✅ Import/Export HTML/CSS workflow
- ✅ Visual Editor tab in Elementor Editor
- ✅ Build successful, committed to branch

### 2025-10-21 - Phase 2 In Progress
- 🚧 CSS Cascade Inspector component
- 🚧 Style source hierarchy tree
- 🚧 Inline vs Class vs Global indicators
- 🚧 Interactive style explorer

---

**Maintained by:** Claude Code
**Last Updated:** October 21, 2025
