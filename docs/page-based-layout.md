# Google Docs-Style Page Layout Documentation

## Overview

The Tiptap editor now features a **Google Docs-style page-based layout** that presents content on realistic paper pages with shadows, margins, and authentic document styling.

## Features

### Visual Paper Experience
- **Realistic Page Rendering**: Content appears on white "paper" pages that look like physical documents
- **Page Shadows**: Subtle multi-layer shadows create depth and separate pages from background
- **Page Spacing**: 24px gap between pages for clear visual separation
- **Centered Layout**: Pages are horizontally centered in the viewport

### Page Dimensions

#### US Letter (Default)
- **Size**: 8.5" × 11" (816px × 1056px at 96 DPI)
- **Margins**: 1 inch on all sides (96px)
- **Content Area**: 6.5" × 9" (624px × 864px)

#### A4 (Alternative)
- **Size**: 210mm × 297mm (794px × 1123px at 96 DPI)
- **Margins**: 1 inch on all sides (96px)
- **Content Area**: 148mm × 245mm (562px × 931px)

### Dark Mode Support
- **Background**: Darker gray (#1a1a1a) for reduced eye strain
- **Pages**: Dark charcoal (#2a2a2a) with lighter shadows
- **Maintains readability** in both light and dark themes

### Infinite Scroll
- **Vertical scrolling** through multiple pages
- **No pagination breaks** - seamless content flow
- **Automatic page creation** as content grows

## Technical Implementation

### CSS Classes

#### Main Container
```css
.tiptap-page-view
```
- Background color for area around pages (#f0f0f0 light, #1a1a1a dark)
- Minimum height of 100vh
- 40px vertical padding

#### Individual Page
```css
.tiptap-page
```
- US Letter dimensions (816px × 1056px)
- 96px padding (1-inch margins)
- White background (#ffffff light, #2a2a2a dark)
- Multi-layer box shadow for depth
- Centered with auto margins
- 24px bottom margin for page spacing

#### A4 Variant
```css
.tiptap-page-a4
```
- A4 dimensions (794px × 1123px)
- Same margins and styling as Letter
- Use by adding class: `<div class="tiptap-page tiptap-page-a4">`

### Component Integration

#### TiptapEditor.tsx

The editor content is wrapped in the page layout structure:

```tsx
<div className={cn(
  "p-4 h-full overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out",
  isDocumentsPanelOpen && "md:pl-[17.5rem]",
  isCommentsPanelOpen && "md:pr-[21.5rem]",
  viewMode === 'editor' ? "tiptap-page-view" : "bg-background"
)}>
  {viewMode === 'editor' ? (
    <div className="tiptap-page">
      <EditorContent editor={editor} className="w-full" />
    </div>
  ) : (
    // HTML/Markdown view
  )}
</div>
```

**Key Points**:
- Page view only applied in `editor` view mode
- HTML/Markdown views maintain original full-width layout
- Preserves panel offsets for Documents and Comments panels
- Maintains smooth transitions when toggling panels

### globals.css

All page styling is defined in `/src/app/globals.css`:

```css
/* Google Docs-Style Page Layout */
.tiptap-page-view { /* Container styling */ }
.tiptap-page { /* Letter-size page */ }
.tiptap-page-a4 { /* A4-size page */ }
.dark .tiptap-page-view { /* Dark mode container */ }
.dark .tiptap-page { /* Dark mode page */ }
```

## Page Break Support (Future)

CSS classes are pre-defined for page breaks:

```css
.page-break {
  /* Dashed horizontal line with label */
  position: relative;
  height: 24px;
  margin: 24px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-break-label {
  /* "Page Break" label */
  background: white;
  padding: 4px 12px;
  font-size: 11px;
  color: #666;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
}
```

## Usage

### Basic Setup

The page layout is **automatically applied** when the editor is in `editor` view mode. No additional configuration needed.

### Switching Between Layouts

Users can toggle between views using the View Mode selector in the toolbar:
- **Editor**: Page-based layout (Google Docs style)
- **HTML**: Full-width code view
- **Markdown**: Full-width code view

### Customizing Page Size

To switch from Letter to A4:

```tsx
<div className="tiptap-page tiptap-page-a4">
  <EditorContent editor={editor} className="w-full" />
</div>
```

## Design Specifications

### Shadows (Light Mode)
```css
box-shadow:
  0 0 0 1px rgba(0, 0, 0, 0.1),      /* 1px border */
  0 2px 4px rgba(0, 0, 0, 0.08),     /* Soft close shadow */
  0 4px 8px rgba(0, 0, 0, 0.05);     /* Soft far shadow */
```

### Shadows (Dark Mode)
```css
box-shadow:
  0 0 0 1px rgba(255, 255, 255, 0.1), /* Light border */
  0 2px 4px rgba(0, 0, 0, 0.3),       /* Medium close shadow */
  0 4px 8px rgba(0, 0, 0, 0.2);       /* Medium far shadow */
```

### Colors

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | #f0f0f0 | #1a1a1a |
| Page | #ffffff | #2a2a2a |
| Text | Inherited | Inherited |

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Responsive design adapts to viewport

## Performance Considerations

### Optimizations
- **CSS-only layout**: No JavaScript overhead
- **Single page initially**: Only one page div rendered
- **Smooth scrolling**: Native browser scrolling
- **Font smoothing**: Antialiased text rendering

### Future Multi-Page Support
When implementing multiple pages:
- Use virtualization for 100+ pages
- Lazy load off-screen pages
- Monitor scroll position for page indicators

## Accessibility

### Current Implementation
- Semantic HTML structure
- Maintains focus management from Tiptap
- Keyboard navigation unaffected
- Screen reader compatible

### Future Improvements
- Add `role="document"` to page container
- Add `aria-label="Page 1 of X"` for multi-page
- Add page jump navigation for screen readers

## Multi-Page Pagination (Phase 4)

### Overview
The editor now includes **automatic page pagination** that calculates the number of pages based on content height and provides visual feedback about the current page position.

### Features

#### Automatic Page Calculation
- Content height is measured in real-time
- Page count calculated automatically: `Math.ceil(contentHeight / 864px)`
- Updates dynamically as content changes
- Debounced for performance (100ms delay)

#### Page Indicator
- Fixed position at bottom-right of screen
- Shows format: "Page X of Y"
- Only appears when document has multiple pages
- Backdrop blur for modern appearance
- Dark mode support

#### Scroll Position Tracking
- Automatically detects which page is in view
- Updates current page indicator as user scrolls
- Calculated based on viewport midpoint
- Smooth tracking without performance impact

### Implementation

The multi-page system is implemented in [MultiPageRenderer.tsx](../src/components/editor/MultiPageRenderer.tsx):

```typescript
const CONTENT_HEIGHT = 864 // 9 inches (11 - 2 inch margins)

const calculatePages = () => {
  const totalHeight = proseMirror.scrollHeight
  const pagesNeeded = Math.max(1, Math.ceil(totalHeight / CONTENT_HEIGHT))
  setPageCount(pagesNeeded)
}
```

**Observers**:
- `ResizeObserver` - Detects content size changes
- Tiptap `update` event - Triggered on content edits
- Tiptap `transaction` event - Triggered on all document changes

### User Experience

As users type and add content:
1. Content flows naturally within the page
2. Page count automatically increases when height exceeds 864px per page
3. Scroll position shows which page they're currently viewing
4. Page breaks force content to start on a "new page" (increases page count)

### Known Limitations

1. **Visual Pages Only**: Currently calculates pages but renders as single scrolling document
2. **Fixed Width**: Pages don't resize responsively (matches print dimensions)
3. **No Physical Splitting**: Content doesn't actually split across separate page containers (planned for export feature)
4. **Approximate Calculation**: Page count is based on total height, not element-by-element flow

## Roadmap

### Phase 2: Completed ✅
- ✅ Page-based layout (Letter/A4)
- ✅ 1-inch margins
- ✅ Page shadows and spacing
- ✅ Infinite vertical scroll

### Phase 3: Semantic Page Breaks - Completed ✅
- ✅ Manual page break insertion
- ✅ Visual page break indicators
- ✅ Page break toolbar button

### Phase 4: Multi-Page Pagination - Completed ✅
- ✅ Automatic page count calculation based on content height
- ✅ Dynamic page indicator showing current page
- ✅ Page break support for forcing new pages
- ✅ Scroll position tracking across pages

### Phase 5: Export Features (Next)
- [ ] DOCX export with proper pagination
- [ ] PDF export with page layout preserved
- [ ] Print stylesheet for accurate printing
- [ ] Physical page splitting for export

## Related Features

This page layout works seamlessly with:
- ✅ **Table of Contents**: Headings from all pages appear in TOC
- ✅ **Comments Panel**: Comments work across all content
- ✅ **Documents Panel**: Multiple documents can each have page layout
- ✅ **Dark Mode**: Fully themed for light/dark preferences

## Examples

### Basic Page Layout
```tsx
// Automatically applied in editor view
<div className="tiptap-page-view">
  <div className="tiptap-page">
    <EditorContent editor={editor} />
  </div>
</div>
```

### A4 Page Layout
```tsx
<div className="tiptap-page-view">
  <div className="tiptap-page tiptap-page-a4">
    <EditorContent editor={editor} />
  </div>
</div>
```

### Multiple Pages (Future)
```tsx
<div className="tiptap-page-view">
  <div className="tiptap-page">
    {/* Page 1 content */}
  </div>
  <div className="tiptap-page">
    {/* Page 2 content */}
  </div>
  <div className="tiptap-page">
    {/* Page 3 content */}
  </div>
</div>
```

## Troubleshooting

### Page Not Centered
- **Cause**: Parent container restricting width
- **Solution**: Ensure parent has sufficient width (min 816px + padding)

### Shadows Not Visible
- **Cause**: z-index conflicts or parent overflow:hidden
- **Solution**: Check parent container styles

### Content Overflowing Page
- **Cause**: Content wider than 624px (page width - margins)
- **Solution**: Add max-width constraints to wide content (images, tables)

### Dark Mode Colors Wrong
- **Cause**: CSS specificity issues
- **Solution**: Ensure `.dark` class applied to document root

---

**Last Updated**: November 5, 2025
**Component Version**: 2.0.0
**Feature Status**: Phase 2 Complete ✅
