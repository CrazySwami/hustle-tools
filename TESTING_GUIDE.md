# Hustle Tools - Comprehensive Testing Guide

This guide provides step-by-step instructions for testing all features of the Elementor HTML Section Editor.

---

## 🚀 Prerequisites

Before testing, ensure:
- The application is running (`npm run dev`)
- Browser DevTools are open (Console + Network tabs)
- Test on both desktop (> 768px) and mobile (< 768px) viewports

---

## 📋 Test 1: Complete Workflow - HTML Generation to WordPress

**Goal:** Test the full journey from generating HTML to viewing in WordPress.

### Steps:

1. **Open Application**
   - Navigate to `/elementor-editor`
   - Verify all tabs are visible

2. **Generate HTML via Chat**
   - Click "Chat" tab
   - Type: "Generate a hero section with a title, subtitle, and call-to-action button"
   - Click "Generate HTML" button in the dialog
   - **Expected:** HTML/CSS/JS streams into Code Editor tabs
   - **Verify:** Auto-switching between HTML → CSS → JS tabs during generation

3. **Save as Section**
   - After generation completes, click "💾 Save to Library" button
   - Enter section name: "Hero Section Test"
   - Click "Save"
   - **Expected:** Success message, section appears in Section Library

4. **Switch to Section Library**
   - Click "Section Library" tab
   - **Expected:** See "Hero Section Test" in the list with thumbnail preview
   - Click on the section
   - **Expected:** Section loads in editor on right side

5. **Edit Section**
   - Modify HTML: Change the title text
   - **Expected:** Changes reflect immediately in preview
   - Click "Code View" button to switch to Code Editor
   - **Expected:** Updated HTML shows in Monaco editor

6. **Switch to Visual Editor**
   - Click "Visual Editor" button
   - **Expected:** GrapeJS loads with your section
   - Click on an element
   - **Expected:** Style panel on right updates with element's styles
   - Modify a style (e.g., change background color)
   - **Expected:** Canvas updates immediately

7. **Preview in WordPress Playground**
   - Click "WordPress Playground" tab
   - **Expected:** WordPress loads automatically (wait 5 seconds after blueprint)
   - Wait for "Playground launched successfully" status

8. **Import Section to WordPress**
   - Go back to "Code Editor" tab
   - Click "💾 Save to Library" button
   - Click "📚 Save to Elementor Template Library"
   - **Expected:** Success message with Template ID

9. **View in WordPress**
   - Go back to "WordPress Playground" tab
   - **Expected:** WordPress admin loads
   - Navigate to Templates → Saved Templates
   - **Expected:** See "Hero Section Test" template

### Success Criteria:
✅ HTML generated successfully
✅ Section saved to library
✅ Section editable in Code and Visual editors
✅ WordPress Playground launches
✅ Section imports to WordPress template library

---

## 📋 Test 2: Multiple Sections & Reordering

**Goal:** Test creating, managing, and reordering multiple sections.

### Steps:

1. **Create Multiple Sections**
   - Create 3 sections via chat or manually
   - Names: "Header", "Features", "Footer"
   - **Expected:** All 3 appear in Section Library

2. **Reorder Sections**
   - In Section Library, drag "Footer" above "Features"
   - **Expected:** Order changes immediately
   - **Verify:** Order persists after page refresh (localStorage)

3. **Export All Sections**
   - Click "Export Library" button in Section Library
   - **Expected:** JSON file downloads with all sections

4. **Import Sections**
   - Create a new section manually
   - Click "Import Library" button
   - Select the exported JSON file
   - **Expected:** Alert shows "X sections imported successfully"
   - **Verify:** All imported sections appear in library

### Success Criteria:
✅ Multiple sections created
✅ Drag-to-reorder works
✅ Export/import functionality works
✅ Order persists in localStorage

---

## 📋 Test 3: Global Stylesheet Integration

**Goal:** Test global CSS propagation across all previews.

### Steps:

1. **Open Style Guide**
   - Click "Style Guide" tab
   - **Expected:** Preview on left, CSS editor on right

2. **Pull WordPress Stylesheet**
   - Click "⬇️ Pull from WordPress" button
   - **Expected:** WordPress theme CSS loads into editor
   - **Verify:** CSS Variables section shows parsed variables
   - **Verify:** Color Swatches section displays color variables

3. **Edit Global CSS**
   - Add a new CSS variable in the `:root` block:
   ```css
   :root {
     --test-color: #ff0000;
   }
   ```
   - Add a rule using the variable:
   ```css
   .test-element {
     background: var(--test-color);
   }
   ```
   - **Expected:** CSS Variables section updates with `--test-color`
   - **Expected:** Green toast notification: "Previews updated with new stylesheet"

4. **Verify CSS Variable Autocomplete**
   - In CSS editor, type `background: var(`
   - **Expected:** Autocomplete shows `--test-color` with value `#ff0000`
   - Select the variable
   - **Expected:** Inserts `--test-color)`

5. **Verify Global CSS in Previews**
   - Go to Section Library
   - **Expected:** All section thumbnails now include global CSS
   - Go to Code Editor preview
   - **Expected:** Preview includes global CSS

6. **Push to WordPress**
   - Go back to Style Guide
   - Click "⬆️ Push to WordPress"
   - **Expected:** Success message
   - Go to WordPress Playground
   - View source of preview page
   - **Expected:** Global CSS is included

### Success Criteria:
✅ WordPress CSS pulls successfully
✅ CSS variables parse correctly
✅ Autocomplete works for CSS variables
✅ Hot reload updates all previews
✅ Green toast notification appears
✅ Global CSS in WordPress imports

---

## 📋 Test 4: Mobile Responsiveness

**Goal:** Test mobile optimization across all views.

### Test on Mobile (< 768px viewport):

1. **Chat Tab**
   - **Expected:** Bottom drawer (60px collapsed)
   - Tap chat handle
   - **Expected:** Drawer expands to 70vh with smooth animation
   - **Expected:** Can type and generate HTML

2. **Tabs**
   - **Expected:** Horizontal scrolling tabs
   - Swipe left/right
   - **Expected:** Smooth scrolling, tabs don't wrap

3. **Code Editor**
   - **Expected:** Full-screen Monaco editor
   - **Expected:** Settings panel is hidden
   - **Expected:** Preview toggle works

4. **Visual Editor**
   - Tap "+ Add" button
   - **Expected:** Blocks dropdown slides from top (40vh)
   - Select an element
   - Tap "Styles" button
   - **Expected:** Bottom sheet appears (60vh) with style controls
   - **Expected:** Can edit styles

5. **Section Library**
   - **Expected:** Full-width list (no sidebar)
   - Tap a section
   - **Expected:** Full-screen editor overlay
   - **Expected:** "← Back to List" button at top
   - Tap back button
   - **Expected:** Returns to list

6. **WordPress Playground**
   - **Expected:** Full-screen iframe
   - **Expected:** Controls stacked vertically
   - **Expected:** All buttons full-width, min 44px height

7. **Style Guide**
   - **Expected:** Full-width CSS editor
   - Tap "👁️ Show Preview" button
   - **Expected:** Preview appears at 50% height, editor at 50%
   - Tap "👁️ Hide Preview"
   - **Expected:** Editor uses full height

### Success Criteria:
✅ All views are usable on mobile
✅ Touch targets are 44x44px minimum
✅ No horizontal scrolling issues
✅ Buttons are appropriately sized
✅ Navigation is intuitive

---

## 📋 Test 5: Error Handling

**Goal:** Test error scenarios and recovery.

### Test Cases:

1. **WordPress Playground Not Running**
   - Go to Code Editor
   - Click "📚 Save to Elementor Template Library" (before WordPress launches)
   - **Expected:** Alert: "WordPress Playground is not running. Please launch it first."

2. **Invalid HTML**
   - In Code Editor, enter: `<div><p>Unclosed div`
   - Save to library
   - **Expected:** Section saves (HTML-only editor doesn't validate strictly)
   - Load in Visual Editor
   - **Expected:** GrapeJS attempts to parse/fix invalid HTML

3. **Empty Section**
   - Create new section, don't add any HTML
   - Try to save
   - **Expected:** Section saves with empty HTML (allowed)
   - Try to import to WordPress
   - **Expected:** May show warning or create empty template

4. **Network Errors**
   - Disable network in DevTools
   - Try "Pull from WordPress" in Style Guide
   - **Expected:** Error message: "Failed to pull stylesheet"
   - Re-enable network
   - Try again
   - **Expected:** Works normally

5. **LocalStorage Limits**
   - Create 50+ large sections (lots of HTML/CSS)
   - **Expected:** May hit localStorage limit (~5-10MB)
   - **Expected:** Browser may show quota exceeded error
   - **Recovery:** Export library, clear some sections, re-import

### Success Criteria:
✅ Clear error messages for all scenarios
✅ Application doesn't crash
✅ User can recover from errors
✅ Network failures handled gracefully

---

## 📋 Test 6: GrapeJS Visual Editor Specifics

**Goal:** Test GrapeJS fixes and functionality.

### Test Cases:

1. **Component Selection**
   - Open Visual Editor with a section
   - Click on a text element
   - **Expected:** Element highlights with blue border
   - **Expected:** Style panel on right updates immediately
   - **Expected:** Shows current styles (not empty or undefined)

2. **Style Panel Updates**
   - Select element
   - Check "Typography" section
   - **Expected:** Shows current font-size, color, etc. (NOT undefined)
   - Check "Background" section
   - **Expected:** Shows current background-color (NOT undefined)

3. **Drag & Drop**
   - Drag "Text" block from left panel
   - Drop onto canvas
   - **Expected:** Text element appears
   - **Expected:** Can immediately select and edit

4. **Bidirectional Sync**
   - Make a change in Visual Editor (e.g., change text color)
   - Click "Code View" button
   - **Expected:** CSS in Code Editor reflects the change
   - Edit CSS in Code Editor
   - Switch back to Visual Editor
   - **Expected:** Visual Editor reflects CSS changes

5. **Responsive Preview**
   - Click desktop/tablet/mobile icons
   - **Expected:** Canvas resizes to correct width
   - **Expected:** Can edit in any device mode

6. **Global CSS in Canvas**
   - Ensure Style Guide has global CSS
   - Open Visual Editor
   - **Expected:** Canvas includes global stylesheet
   - **Verify:** Inspect iframe `<style>` tags

### Success Criteria:
✅ No "undefined" errors in style panel
✅ Component selection works smoothly
✅ Style panel updates on selection
✅ Drag & drop works
✅ Code ↔ Visual sync works
✅ Responsive preview works
✅ Global CSS loads in canvas

---

## 📋 Test 7: Site Content Manager

**Goal:** Test WordPress settings and pages management.

### Steps:

1. **Open Site Content Tab**
   - Ensure WordPress Playground is running
   - Click "Site Content" tab
   - **Expected:** Tab is enabled (not grayed out)

2. **Pull WordPress Settings**
   - Click "Pull from WordPress" button
   - **Expected:** Form fields populate with WordPress data
   - **Verify:** Site Title, Tagline, Admin Email, etc.

3. **Modify Settings**
   - Change Site Title to "Test Site"
   - Click "Push to WordPress"
   - **Expected:** Success message

4. **Verify in WordPress**
   - Go to WordPress Playground tab
   - Navigate to Settings → General
   - **Expected:** Site Title shows "Test Site"

5. **Pages Management**
   - In Site Content tab, click "Pages" sub-tab
   - **Expected:** List of WordPress pages
   - Click "+ New Page"
   - Fill in title, content
   - Click "Save"
   - **Expected:** Page created in WordPress

### Success Criteria:
✅ Can pull WordPress settings
✅ Can push settings to WordPress
✅ Can manage pages (create, edit, delete)
✅ Changes reflect in WordPress

---

## 📋 Test 8: Browser Compatibility

**Goal:** Test across different browsers.

### Browsers to Test:
- ✅ Chrome/Chromium (primary)
- ✅ Firefox
- ✅ Safari (if on Mac)
- ✅ Edge

### What to Test in Each:
1. WordPress Playground loads
2. GrapeJS Visual Editor works
3. Monaco editor works
4. LocalStorage persists
5. File upload/download works
6. Mobile view (DevTools responsive mode)

### Known Issues:
- **Safari:** May have stricter CORS policies
- **Firefox:** WordPress Playground may be slower
- **Edge:** Should work identically to Chrome

### Success Criteria:
✅ Core features work in all major browsers
✅ No browser-specific errors
✅ Acceptable performance in all browsers

---

## 📋 Test 9: Performance Testing

**Goal:** Ensure acceptable performance.

### Metrics to Check:

1. **Initial Load**
   - Open `/elementor-editor`
   - Measure time to interactive (TTI)
   - **Target:** < 3 seconds

2. **WordPress Playground Launch**
   - Click WordPress Playground tab
   - Measure time from click to "Playground launched successfully"
   - **Target:** < 10 seconds (depends on network/browser)

3. **GrapeJS Load**
   - Open Visual Editor with a section
   - Measure time to canvas ready
   - **Target:** < 2 seconds

4. **Section Library with Many Sections**
   - Create 20+ sections
   - Open Section Library
   - Measure time to render all thumbnails
   - **Target:** < 5 seconds
   - **Check:** No browser freezing

5. **Global CSS Hot Reload**
   - Edit global CSS in Style Guide
   - Measure time for toast notification to appear
   - **Target:** < 500ms
   - **Verify:** All previews update smoothly

### Tools:
- Chrome DevTools → Performance tab
- Chrome DevTools → Lighthouse
- Network tab (check bundle sizes)

### Success Criteria:
✅ No blocking UI (everything interactive)
✅ Smooth animations (60fps)
✅ Acceptable load times
✅ No memory leaks (use Performance Monitor)

---

## 📋 Test 10: Accessibility

**Goal:** Ensure basic accessibility compliance.

### Tests:

1. **Keyboard Navigation**
   - Tab through all interface elements
   - **Expected:** Logical tab order
   - **Expected:** Visible focus indicators
   - **Expected:** Can activate buttons with Enter/Space

2. **Screen Reader**
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Navigate to each tab
   - **Expected:** Tab names announced
   - **Expected:** Form fields have labels
   - **Expected:** Buttons have accessible names

3. **Color Contrast**
   - Use Chrome DevTools → Accessibility
   - Check all text elements
   - **Expected:** WCAG AA compliance (4.5:1 for normal text)

4. **Touch Targets**
   - On mobile, measure button sizes
   - **Expected:** All interactive elements ≥ 44x44px

### Tools:
- Chrome DevTools → Accessibility tab
- axe DevTools extension
- WAVE browser extension
- Lighthouse accessibility audit

### Success Criteria:
✅ Keyboard navigable
✅ Screen reader friendly
✅ Sufficient color contrast
✅ Touch targets meet minimum size

---

## 🐛 Common Issues & Solutions

### Issue: WordPress Playground Won't Load
**Solution:**
- Refresh page
- Check browser console for errors
- Ensure `/public/playground.js` is loaded
- Try different browser
- Clear browser cache

### Issue: GrapeJS Shows "undefined" in Style Panel
**Solution:**
- ✅ **FIXED:** We changed `properties` to `buildProps`
- If still occurring, check browser console
- Verify GrapeJS version is compatible

### Issue: LocalStorage Quota Exceeded
**Solution:**
- Export section library
- Clear old sections
- Re-import only needed sections
- Consider implementing pagination

### Issue: Mobile View Not Working
**Solution:**
- Verify viewport width < 768px
- Check browser DevTools responsive mode
- Ensure CSS media queries are loading
- Clear browser cache

### Issue: Global CSS Not Updating
**Solution:**
- Check `lastUpdated` timestamp in React DevTools
- Verify global CSS context is wrapping components
- Ensure `useGlobalStylesheet()` hook is called
- Check for JavaScript errors in console

---

## ✅ Final Testing Checklist

Before marking Phase 10 complete, verify:

- [ ] All 5 workflow tests pass
- [ ] Mobile view works on real device (not just DevTools)
- [ ] Error handling is graceful
- [ ] Performance is acceptable
- [ ] No console errors in normal usage
- [ ] WordPress integration works end-to-end
- [ ] GrapeJS visual editor works without errors
- [ ] Global CSS system works across all views
- [ ] LocalStorage persists data correctly
- [ ] Export/import functionality works

---

## 📝 Reporting Issues

When reporting issues, include:
1. **Browser & Version:** e.g., Chrome 120.0.6099.129
2. **Viewport Size:** e.g., 1920x1080 or Mobile 375x667
3. **Steps to Reproduce:** Detailed step-by-step
4. **Expected Behavior:** What should happen
5. **Actual Behavior:** What actually happened
6. **Console Errors:** Copy any JavaScript errors
7. **Screenshots:** If applicable

---

## 🎉 Testing Complete!

Once all tests pass, Phase 10 can be marked as complete!

**Next Step:** Phase 11 - UX & Performance Audit (comprehensive evaluation)
