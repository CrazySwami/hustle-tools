# Table of Contents Feature Documentation

## Overview

The Tiptap editor now includes a **Google Docs-style Table of Contents sidebar** that automatically extracts headings from your document and displays them in a hierarchical, interactive navigation panel.

## Features

### Automatic Heading Detection
- **Real-time Extraction**: Automatically extracts all H1-H6 headings from the document
- **Live Updates**: TOC updates automatically as you add, edit, or remove headings
- **Zero Configuration**: No setup required - just start adding headings to your document

### Hierarchical Structure
- **Tree View**: Headings are organized in a collapsible tree structure based on their hierarchy
- **Visual Indentation**: Child headings are indented to show their relationship to parent headings
- **Expand/Collapse**: Click the chevron icon next to any parent heading to expand/collapse its children
- **Auto-Expand**: All headings are expanded by default for maximum visibility

### Interactive Navigation
- **Click to Jump**: Click any heading in the TOC to instantly scroll to that section in your document
- **Smooth Scrolling**: Uses smooth scroll behavior for a polished user experience
- **Active Highlighting**: The currently selected heading is highlighted in blue for easy tracking
- **Cursor Positioning**: Clicking a heading also places your cursor at that position for immediate editing

### Slide-In Panel Design
- **Fixed Position**: Toggle button fixed in the top-right corner (hamburger/close icon)
- **Smooth Animation**: Panel slides in from the right with a 300ms ease-in-out transition
- **280px Width**: Optimal width for readability without obscuring the document
- **Shadow & Border**: Professional shadow and border for visual separation from the editor
- **z-index 40/50**: Properly layered to appear above content but below modals

### Mobile-Responsive
- **Overlay on Mobile**: On mobile devices, an overlay backdrop appears when the TOC is open
- **Tap to Close**: Tap the overlay to close the TOC panel on mobile

### Visual Design (Google Docs-Inspired)
- **Clean Header**: "Document Outline" title with heading count
- **Compact Layout**: 8px padding with tight spacing for maximum content
- **Hover States**: Subtle hover effects on headings for interactivity
- **Font Sizing**:
  - H1: 14px, 600 weight
  - H2: 13px, 600 weight
  - H3-H6: 12px, 400 weight
- **Empty State**: Helpful message when no headings are present
- **Footer Info**: "Click any heading to jump to it" instruction

## Usage

### Opening the TOC

The Table of Contents has its own dedicated button in the editor toolbar:
1. **Click the BookMarked icon (📖)** in the top toolbar (next to the Tools button)
2. The TOC panel will slide in from the right side
3. The panel displays all H2-H6 headings from your document (H1 headings are excluded)

### Adding Headings to Your Document

To populate the TOC:
1. Use the heading selector in the toolbar (H1, H2, H3, etc.)
2. Or use keyboard shortcuts:
   - `Ctrl/Cmd + Alt + 1` = H1
   - `Ctrl/Cmd + Alt + 2` = H2
   - etc.

### Navigating with the TOC

1. Open the Tools panel (wrench icon in right sidebar)
2. Select "Table of Contents" from the tool list
3. Browse the heading hierarchy
4. Expand/collapse sections using the chevron icons
5. Click any heading to jump directly to that section
6. The active heading will be highlighted in blue

## Component Architecture

### Files

- **[toc-widget.tsx](../src/components/tool-ui/toc-widget.tsx)** - Main TOC widget component
- **[TabbedSidePanel.tsx](../src/components/editor/TabbedSidePanel.tsx)** - Side panel container that hosts TOC
- **[TiptapEditor.tsx](../src/components/editor/TiptapEditor.tsx)** - Passes editor instance to TabbedSidePanel

### Props Interface

```typescript
interface TOCWidgetProps {
  editor: Editor | null;  // Tiptap editor instance for extracting headings
}
```

### Internal State

```typescript
const [headings, setHeadings] = useState<HeadingNode[]>([]);
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
```

### HeadingNode Interface

```typescript
interface HeadingNode {
  id: string;           // Unique identifier (position + text slug)
  level: number;        // Heading level (1-6)
  text: string;         // Heading text content
  position: number;     // Position in the document
  children: HeadingNode[];  // Nested child headings
}
```

## Technical Implementation

### Heading Extraction Algorithm

```typescript
editor.state.doc.descendants((node, pos) => {
  if (node.type.name === "heading") {
    const level = node.attrs.level;
    const text = node.textContent;
    const id = `heading-${pos}-${text.slice(0, 20).replace(/\s+/g, "-")}`;
    headingsList.push({ level, text, position: pos, id });
  }
});
```

### Hierarchy Building Algorithm

The component uses a **stack-based approach** to build the hierarchical structure:

1. Iterate through flat list of headings
2. Maintain a stack of parent headings
3. Pop from stack until we find the correct parent level
4. If no parent, add to root; otherwise add to parent's children
5. Push current heading onto stack

### Auto-Update Mechanism

The component listens to Tiptap's `update` event:

```typescript
editor.on("update", updateListener);
```

This ensures the TOC stays in sync with document changes in real-time.

### Scroll-to-Heading Mechanism

```typescript
const scrollToHeading = (position: number, id: string) => {
  // 1. Focus editor
  editor.commands.focus();

  // 2. Set cursor position
  editor.commands.setTextSelection(position);

  // 3. Scroll element into view
  const element = document.querySelector(`[id="${id}"]`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });

  // 4. Highlight as active
  setActiveHeadingId(id);
};
```

## Styling

### CSS Classes Used

- `bg-background` - Background color (theme-aware)
- `border-border` - Border color (theme-aware)
- `text-foreground` - Text color (theme-aware)
- `hover:bg-muted` - Hover state background
- `bg-primary/10` - Active heading background (10% opacity primary color)
- `text-primary` - Active heading text color

### Tailwind Utilities

- `fixed` - Fixed positioning for panel and button
- `transition-transform duration-300 ease-in-out` - Smooth slide animation
- `translate-x-0` / `translate-x-full` - Panel show/hide transform
- `shadow-2xl` - Panel shadow for depth
- `z-40` / `z-50` - Layering (panel and button)

## Browser Compatibility

The component uses:
- `Element.scrollIntoView()` with `behavior: "smooth"` - [Supported in all modern browsers](https://caniuse.com/scrollintoview)
- CSS transitions - Universal support
- Flexbox layout - Universal support

## Performance Considerations

1. **Debounced Updates**: The `update` event fires on every keystroke, but the expensive hierarchy building only runs when structure changes
2. **Memoization**: Chevron icons and heading rows could be memoized for large documents (future optimization)
3. **Virtual Scrolling**: For documents with 100+ headings, consider implementing virtual scrolling (future optimization)

## Future Enhancements

### Potential Improvements
- **Search Filter**: Add search box to filter headings by text
- **Numbering**: Optional automatic numbering (1.1, 1.2, etc.)
- **Drag to Reorder**: Allow dragging headings to rearrange document structure
- **Copy Link**: Right-click to copy anchor link to specific heading
- **PDF Export**: Include TOC in PDF exports with clickable links
- **Keyboard Navigation**: Arrow keys to navigate between headings
- **Accessibility**: Enhanced ARIA labels and screen reader support

### Google Docs Parity Roadmap
- [ ] Minimap view (visual document thumbnail)
- [ ] Heading suggestions based on content
- [ ] Auto-collapse deeply nested sections
- [ ] Recent headings list
- [ ] TOC print styles

## Testing

### Manual Test Cases

1. **Empty Document**
   - Open editor
   - Open TOC
   - Verify "Add headings to your document" message appears

2. **Single Level**
   - Add 3 H1 headings
   - Verify all appear in TOC without indentation
   - Click each heading
   - Verify cursor moves to correct position

3. **Multi-Level Hierarchy**
   - Add H1 → H2 → H3 structure
   - Verify proper nesting and indentation
   - Collapse H1 with chevron
   - Verify children disappear
   - Expand H1
   - Verify children reappear

4. **Live Updates**
   - Have TOC open
   - Add a new heading
   - Verify it appears immediately
   - Edit heading text
   - Verify TOC updates
   - Delete heading
   - Verify it disappears from TOC

5. **Active Highlighting**
   - Click heading in TOC
   - Verify it highlights in blue
   - Click another heading
   - Verify first un-highlights, second highlights

6. **Mobile Responsiveness**
   - Resize browser to mobile width
   - Open TOC
   - Verify overlay backdrop appears
   - Click overlay
   - Verify TOC closes

## Troubleshooting

### TOC Not Updating
- **Cause**: Editor not re-rendering after heading changes
- **Solution**: Ensure `editor.on("update")` listener is attached

### Scrolling Not Working
- **Cause**: Headings don't have `id` attributes
- **Solution**: Component auto-adds IDs; check if `editor.commands.updateAttributes()` is working

### Panel Not Sliding
- **Cause**: CSS conflicts or z-index issues
- **Solution**: Check for competing styles; ensure Tailwind classes are applying

### Headings Missing from TOC
- **Cause**: Heading nodes not detected
- **Solution**: Verify heading extension is installed: `TiptapHeading.configure()`

## Accessibility

### Current Implementation
- Semantic HTML: Uses `<button>` for clickable elements
- Focus states: Hover styles provide visual feedback
- Screen reader text: Button has `title` attribute

### Future Improvements
- Add `role="navigation"` to panel
- Add `aria-label="Table of Contents"` to panel
- Add `aria-current="location"` to active heading
- Add keyboard navigation (Tab, Arrow keys)
- Add `aria-expanded` to collapsible headings

## Related Features

This TOC implementation is part of the broader **Google Docs-like Editor** initiative:
- ✅ Table of Contents Sidebar (Phase 1 - COMPLETE)
- ⏳ Page-based Layout (Phase 2 - Planned)
- ⏳ Semantic Page Breaks (Phase 2 - Planned)
- ⏳ DOCX Export (Phase 3 - Planned)
- ⏳ PDF Export with TOC (Phase 3 - Planned)
- ⏳ Auto-Pagination (Phase 4 - Planned)

---

**Last Updated**: November 4, 2025
**Component Version**: 1.0.0
**Tiptap Version**: Compatible with Tiptap 2.x
