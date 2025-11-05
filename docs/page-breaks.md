# Page Breaks Feature Documentation

## Overview

The Tiptap editor now includes **semantic page breaks** that allow users to manually insert visual page break indicators at any point in their document. This feature works seamlessly with the Google Docs-style page layout.

## Features

### Manual Page Break Insertion
- **Toolbar Button**: Dedicated page break button with FileDown icon
- **Keyboard Shortcut**: `Ctrl/Cmd + Enter` for quick insertion
- **Visual Indicator**: Dashed line with "PAGE BREAK" label
- **Non-Editable**: Page breaks cannot be accidentally modified
- **Semantic Node**: Implemented as a proper Tiptap extension

### Visual Design
- **Dashed Line**: Repeating dashed pattern across full width
- **Centered Label**: "PAGE BREAK" text in uppercase
- **Elevated Styling**: Subtle box shadow for depth
- **Dark Mode Support**: Automatically adjusts colors for dark theme
- **Professional Appearance**: Matches Google Docs page break style

## Usage

### Inserting a Page Break

#### Method 1: Toolbar Button
1. Place cursor where you want the page break
2. Click the **Page Break button** (FileDown icon) in the toolbar
3. Page break appears immediately at cursor position

#### Method 2: Keyboard Shortcut
1. Place cursor where you want the page break
2. Press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
3. Page break appears immediately

### Deleting a Page Break

- **Backspace**: Position cursor after page break and press Backspace
- **Delete**: Position cursor before page break and press Delete
- **Select + Delete**: Select the page break node and press Delete

### Navigation

Page breaks are treated as block-level nodes:
- Arrow keys navigate around them
- They create natural stopping points when scrolling
- They don't interrupt text flow

## Technical Implementation

### PageBreak Extension

Location: [PageBreakExtension.tsx](../src/components/editor/PageBreakExtension.tsx)

```typescript
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,  // Cannot be edited

  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({ type: this.name })
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    }
  },
})
```

**Key Properties**:
- `atom: true` - Makes node non-editable and indivisible
- `group: 'block'` - Block-level node (like paragraphs, headings)
- React component rendering for visual display

### Component Structure

**PageBreakComponent** (React Node View):
```typescript
function PageBreakComponent() {
  return (
    <NodeViewWrapper className="page-break-wrapper">
      <div className="page-break" contentEditable={false}>
        <div className="page-break-label">Page Break</div>
      </div>
    </NodeViewWrapper>
  )
}
```

**CSS Classes**:
- `.page-break-wrapper` - Outer container with margins
- `.page-break` - Inner container for layout
- `.page-break-label` - Styled label text

### Integration with TiptapEditor

**Extension Registration**:
```typescript
extensions: [
  // ... other extensions
  PageBreak,
  // ... more extensions
]
```

**Toolbar Button**:
```typescript
<MenuButton
  onClick={() => editor?.chain().focus().setPageBreak().run()}
  title="Insert Page Break (Ctrl/Cmd+Enter)"
>
  <FileDown className="h-4 w-4" />
</MenuButton>
```

## Styling

All page break styles are defined in [globals.css](../src/app/globals.css):

### Light Mode
```css
.page-break-wrapper {
  margin: 32px 0;  /* Vertical spacing */
  user-select: none;  /* Prevent text selection */
}

.page-break::before {
  /* Dashed line */
  background: repeating-linear-gradient(
    to right,
    #d0d0d0 0px,
    #d0d0d0 8px,
    transparent 8px,
    transparent 16px
  );
}

.page-break-label {
  background: white;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 500;
  color: #666;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
```

### Dark Mode
```css
.dark .page-break::before {
  background: repeating-linear-gradient(
    to right,
    #555 0px,
    #555 8px,
    transparent 8px,
    transparent 16px
  );
}

.dark .page-break-label {
  background: #2a2a2a;
  color: #aaa;
  border-color: #555;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

## HTML Output

When exporting to HTML, page breaks are rendered as:

```html
<div data-type="page-break" class="page-break-wrapper">
  <div class="page-break">
    <div class="page-break-label">Page Break</div>
  </div>
</div>
```

## Use Cases

### 1. Document Organization
```
Introduction
(Content...)

---PAGE BREAK---

Chapter 1
(Content...)

---PAGE BREAK---

Chapter 2
(Content...)
```

### 2. Print Preparation
Insert page breaks at logical section boundaries to control where pages break when printing or exporting to PDF.

### 3. Visual Separation
Use page breaks to create clear visual separations between major document sections without creating new files.

### 4. Export Control
Page breaks serve as markers for DOCX/PDF export engines to know where to create actual page breaks.

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Full support (touch-friendly)

## Accessibility

### Current Implementation
- **Semantic HTML**: Uses proper div structure
- **Non-interactive**: contentEditable=false prevents confusion
- **Keyboard navigable**: Arrow keys work correctly
- **Screen readers**: Announced as "Page Break"

### Future Improvements
- Add `role="separator"` for better semantics
- Add `aria-label="Page break"` for explicit labeling
- Add visual focus indicator for keyboard navigation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Insert page break at cursor |
| `Backspace` | Delete page break (cursor after) |
| `Delete` | Delete page break (cursor before) |
| `Arrow Keys` | Navigate around page breaks |

## Known Limitations

1. **No Auto-Pagination**: Page breaks are manual only (no automatic insertion based on content height)
2. **Print Styles**: Page breaks don't yet enforce actual page breaks in print media queries
3. **Export**: DOCX/PDF export doesn't yet respect page breaks (planned for Phase 4)
4. **No Customization**: Page break appearance is fixed (no user styling options)

## Roadmap

### Phase 3: Completed ✅
- ✅ Manual page break insertion
- ✅ Visual page break indicators
- ✅ Page break toolbar button
- ✅ Keyboard shortcut (Ctrl/Cmd+Enter)

### Phase 4: Export Features (Next)
- [ ] DOCX export respects page breaks
- [ ] PDF export with proper page breaks
- [ ] Print stylesheet with page-break-after
- [ ] Page break settings (keep with next, etc.)

### Phase 5: Auto-Pagination
- [ ] Automatic page break suggestion
- [ ] "Orphan/Widow" prevention
- [ ] Page break preview before inserting
- [ ] Smart page break positioning

## Troubleshooting

### Page Break Not Inserting
- **Cause**: Editor not focused
- **Solution**: Click in editor before using shortcut or button

### Page Break Not Visible
- **Cause**: CSS not loaded
- **Solution**: Check that globals.css is imported

### Keyboard Shortcut Not Working
- **Cause**: Conflicting browser/OS shortcut
- **Solution**: Use toolbar button instead

### Page Break Deleted Accidentally
- **Cause**: User pressed Backspace/Delete near it
- **Solution**: Use Undo (Ctrl/Cmd+Z) to restore

## Examples

### Basic Page Break
```
This is page one content.

[PAGE BREAK]

This is page two content.
```

### Multiple Sections
```
# Executive Summary
(Content...)

[PAGE BREAK]

# Introduction
(Content...)

[PAGE BREAK]

# Methodology
(Content...)

[PAGE BREAK]

# Results
(Content...)
```

### Before Export
```
# My Document

## Section 1
Lorem ipsum dolor sit amet...

[PAGE BREAK]  ← Forces new page in PDF

## Section 2
Consectetur adipiscing elit...
```

## Related Features

Page breaks work seamlessly with:
- ✅ **Google Docs-Style Pages**: Visual page layout from Phase 2
- ✅ **Table of Contents**: Page breaks don't interfere with TOC
- ✅ **Comments**: Can comment on text around page breaks
- ⏳ **DOCX Export**: Will respect page breaks (Phase 4)
- ⏳ **PDF Export**: Will enforce page breaks (Phase 4)

## API Reference

### Commands

```typescript
// Insert page break at current cursor position
editor.commands.setPageBreak()

// Check if page break can be inserted
editor.can().setPageBreak()

// Insert page break with chaining
editor.chain().focus().setPageBreak().run()
```

### Node Attributes

The PageBreak node has no custom attributes (it's a simple atomic node).

### Events

No custom events - page breaks use standard Tiptap transaction events.

---

**Last Updated**: November 5, 2025
**Component Version**: 3.0.0
**Feature Status**: Phase 3 Complete ✅
