# HTML-Only Section Builder Implementation Plan
**Branch:** `html-only-no-elementor`
**Goal:** Pivot from Elementor JSON to HTML/CSS/JS sections using Elementor's HTML widget

---

## ✅ Phase 1: Cleanup & Remove Elementor JSON Components

### 1.1 Remove Files
- [ ] Delete `/src/components/elementor/JsonConverter.tsx`
- [ ] Delete `/src/app/api/convert-to-elementor/route.ts`
- [ ] Remove JSON Converter tab from main editor page
- [ ] Remove JSON Editor tab references (keep file for now, will refactor)

### 1.2 Update Main Editor Page
- [ ] Remove `json-converter` tab from `/src/app/elementor-editor/page.tsx`
- [ ] Remove `JsonConverter` component import and usage
- [ ] Keep only: HTML Generator tab, Playground tab, Site Content tab
- [ ] Rename "JSON Editor" tab to "HTML Editor" (will refactor content later)

---

## ✅ Phase 2: WordPress Global Stylesheet Integration

### 2.1 Backend - Pull WordPress Theme Styles
- [ ] Create `/src/app/api/get-wordpress-stylesheet/route.ts`
  - [ ] Accept WordPress Playground client URL as parameter
  - [ ] Use PHP to get active theme: `wp_get_theme()`
  - [ ] Get stylesheet URI: `get_stylesheet_uri()`
  - [ ] Read actual CSS file from `/wp-content/themes/{active-theme}/style.css`
  - [ ] Parse CSS to extract CSS variables (`:root {}` block)
  - [ ] Return both raw CSS and parsed variables

### 2.2 Playground.js Integration
- [ ] Add function `window.getWordPressStylesheet()` to `/public/playground.js`
  - [ ] Run PHP to get theme stylesheet path
  - [ ] Read CSS file contents
  - [ ] Return raw CSS text
- [ ] Add function `window.updateGlobalStylesheet(css)`
  - [ ] Write CSS to custom file in `/wp-content/uploads/custom-global.css`
  - [ ] Enqueue CSS file via PHP: `wp_enqueue_style()`

### 2.3 Frontend - Global Stylesheet State
- [ ] Create `/src/lib/global-stylesheet-context.tsx`
  - [ ] Context for global CSS state
  - [ ] `globalCss` - Raw CSS string
  - [ ] `cssVariables` - Parsed CSS variables object
  - [ ] `updateGlobalCss()` - Update CSS and sync to WordPress
  - [ ] `pullFromWordPress()` - Fetch latest from WordPress
  - [ ] `pushToWordPress()` - Save changes to WordPress

---

## ✅ Phase 3: Style Guide Tab (Visual Editor + CSS Editor)

### 3.1 Create Style Guide Component
- [ ] Create `/src/components/elementor/StyleGuide.tsx`
  - [ ] Split view: Style Guide Preview (left) | CSS Editor (right)
  - [ ] 60/40 split with resizable divider

### 3.2 Style Guide Preview (Left Panel)
- [ ] **Typography Section**
  - [ ] H1, H2, H3, H4, H5, H6 examples with actual styles applied
  - [ ] Body text, small text examples
  - [ ] Link styles (normal, hover, visited)
  - [ ] Font family display
  - [ ] Font weight variations

- [ ] **Colors Section**
  - [ ] Primary colors grid (show swatches with hex values)
  - [ ] Secondary colors
  - [ ] Grayscale/neutral colors
  - [ ] Success/warning/error colors
  - [ ] Extract from CSS variables or theme

- [ ] **Buttons Section**
  - [ ] Primary button (normal, hover, active, disabled states)
  - [ ] Secondary button states
  - [ ] Outline button states
  - [ ] Ghost button states
  - [ ] Button sizes (small, medium, large)

- [ ] **Spacing Section**
  - [ ] Margin scale visualization
  - [ ] Padding scale visualization
  - [ ] Gap/spacing tokens

- [ ] **Borders & Shadows Section**
  - [ ] Border radius examples
  - [ ] Border width/styles
  - [ ] Box shadow examples (sm, md, lg)

- [ ] **Forms Section**
  - [ ] Input field (normal, focus, error, disabled)
  - [ ] Textarea
  - [ ] Select dropdown
  - [ ] Checkbox
  - [ ] Radio button

- [ ] Live updates - Changes to CSS immediately reflect in style guide

### 3.3 CSS Editor (Right Panel)
- [ ] Monaco Editor or CodeMirror for CSS editing
- [ ] Syntax highlighting for CSS
- [ ] Line numbers
- [ ] CSS validation/linting
- [ ] Auto-save (debounced)
- [ ] "Pull from WordPress" button - Fetch latest theme CSS
- [ ] "Push to WordPress" button - Save CSS to WordPress
- [ ] "Reset to Theme Default" button

### 3.4 Style Guide State Integration
- [ ] Connect to GlobalStylesheetContext
- [ ] Parse CSS variables from editor content
- [ ] Apply CSS to style guide preview via `<style>` tag
- [ ] Detect changes and mark as "unsaved"

### 3.5 Add Style Guide Tab to Main Editor
- [ ] Add new tab "Style Guide" to `/src/app/elementor-editor/page.tsx`
- [ ] Position after HTML Generator, before Playground
- [ ] Import and render `<StyleGuide />` component

---

## ✅ Phase 4: HTML/CSS/JS Section Editor (Replaces JSON Editor)

### 4.1 Create HTML Editor Component
- [ ] Create `/src/components/elementor/HtmlSectionEditor.tsx`
  - [ ] Top: Section settings panel (collapsible)
  - [ ] Middle: Code editor with 3 tabs (HTML/CSS/JS)
  - [ ] Bottom: Live preview panel (toggle on/off)

### 4.2 Section Settings Panel
- [ ] **Layout Settings**
  - [ ] Margin controls (top, right, bottom, left) with unit selector (px, %, em, rem)
  - [ ] Padding controls (same as margin)
  - [ ] Width/max-width controls
  - [ ] Height/min-height controls

- [ ] **Background Settings**
  - [ ] Background type selector (none, color, gradient, image)
  - [ ] Color picker for solid background
  - [ ] Gradient editor (start color, end color, angle)
  - [ ] Image URL input + upload

- [ ] **Border Settings**
  - [ ] Border width (top, right, bottom, left)
  - [ ] Border color
  - [ ] Border radius (top-left, top-right, bottom-right, bottom-left)
  - [ ] Border style (solid, dashed, dotted, none)

- [ ] **Shadow & Effects**
  - [ ] Box shadow (horizontal, vertical, blur, spread, color)
  - [ ] CSS filters (blur, brightness, contrast)
  - [ ] Opacity slider

- [ ] **Animation Settings**
  - [ ] Animation type dropdown (none, fadeIn, fadeInUp, slideInLeft, etc.)
  - [ ] Animation duration (fast, normal, slow)
  - [ ] Animation delay

- [ ] **Advanced**
  - [ ] Custom CSS classes input
  - [ ] Z-index control
  - [ ] Position (relative, absolute, fixed, sticky)

### 4.3 Code Editor Tabs
- [ ] **HTML Tab**
  - [ ] Monaco/CodeMirror with HTML syntax highlighting
  - [ ] Auto-complete HTML tags
  - [ ] Warning: "Don't include <!DOCTYPE>, <html>, <head>, or <body> tags"

- [ ] **CSS Tab**
  - [ ] CSS syntax highlighting
  - [ ] Shows: "Global stylesheet is automatically included"
  - [ ] Scoped CSS - can add section-specific styles

- [ ] **JavaScript Tab**
  - [ ] JS syntax highlighting
  - [ ] Auto-wraps in `<script>` tag on save

### 4.4 Live Preview Panel
- [ ] Iframe preview of HTML+CSS+JS
- [ ] Global stylesheet automatically injected
- [ ] Toggle preview on/off
- [ ] Responsive preview modes (desktop, tablet, mobile)
- [ ] Refresh button

### 4.5 Section Data Structure
- [ ] Create `/src/lib/section-schema.ts`
  - [ ] TypeScript interface for Section
  - [ ] Properties: id, name, html, css, js, settings (margins, padding, background, etc.)
  - [ ] Validation functions
  - [ ] Conversion to Elementor HTML widget format

### 4.6 Update Main Editor Page
- [ ] Replace JSON Editor tab content with `<HtmlSectionEditor />`
- [ ] Rename tab from "JSON Editor" to "Section Editor"

---

## ✅ Phase 5: Section Library (Multi-Section Management)

### 5.1 Create Section Library Component
- [ ] Create `/src/components/elementor/SectionLibrary.tsx`
  - [ ] Left sidebar: Section list
  - [ ] Right panel: Selected section editor (HtmlSectionEditor)

### 5.2 Section List UI
- [ ] **Header**
  - [ ] Title: "Sections (X)"
  - [ ] "+ New Section" button
  - [ ] "Preview All" button (sends all to playground)

- [ ] **Section Items**
  - [ ] Thumbnail preview of section
  - [ ] Section name (editable inline)
  - [ ] Visual indicators (background color, has animation, etc.)
  - [ ] Action buttons: Edit, Duplicate, Delete
  - [ ] Drag handle for reordering

- [ ] **Drag & Drop Reordering**
  - [ ] Use react-beautiful-dnd or similar
  - [ ] Visual feedback during drag
  - [ ] Auto-save new order

### 5.3 Section CRUD Operations
- [ ] Create new section (blank template)
- [ ] Edit section (opens HtmlSectionEditor in right panel)
- [ ] Duplicate section (copy with new ID)
- [ ] Delete section (with confirmation)
- [ ] Reorder sections (updates array index)

### 5.4 Section Storage
- [ ] Store sections in React state (for now)
- [ ] Auto-save to localStorage
- [ ] Export all sections as JSON file
- [ ] Import sections from JSON file

### 5.5 Integration with HTML Generator
- [ ] Update HtmlGeneratorNew.tsx
  - [ ] Remove "Send to Converter" button
  - [ ] Add "Save as Section" button
  - [ ] On save: Creates new section in library with generated HTML/CSS/JS
  - [ ] Auto-switch to Section Library tab

### 5.6 Add Section Library Tab
- [ ] Add "Sections" tab to main editor page
- [ ] Position after HTML Generator, before Section Editor
- [ ] Clicking section in library opens it in Section Editor tab

---

## ✅ Phase 5.5: HTML Page Splitter (NEW)

### 5.5.1 Create Page Splitter Component
- [ ] Create `/src/components/elementor/PageSplitter.tsx`
  - [ ] Top: Full HTML input area (paste full page HTML)
  - [ ] Middle: AI-powered section detection and splitting
  - [ ] Bottom: Preview grid showing all detected sections

### 5.5.2 Section Detection Algorithm
- [ ] Implement smart HTML parsing
  - [ ] Detect semantic sections (`<section>`, `<article>`, `<div class="section">`)
  - [ ] Detect visual sections (headers followed by content blocks)
  - [ ] Detect by structural patterns (nav, hero, features, testimonials, footer)
  - [ ] Use AI to intelligently identify section boundaries
  - [ ] Extract inline styles and convert to scoped CSS
  - [ ] Extract inline scripts and isolate them per section

### 5.5.3 Preview Grid UI
- [ ] Display all detected sections in grid layout
  - [ ] Each section shows miniature preview
  - [ ] Section number and detected type label
  - [ ] Editable section name
  - [ ] Checkbox to include/exclude section
  - [ ] Merge sections button (combine adjacent sections)
  - [ ] Split section button (manual split point)
  - [ ] Reorder sections (drag handles)

### 5.5.4 Section Refinement Tools
- [ ] Manual split controls
  - [ ] Click to add split point in HTML view
  - [ ] Visual line showing split boundaries
  - [ ] Undo/redo split operations
- [ ] Merge adjacent sections
  - [ ] Select multiple sections to combine
  - [ ] Preview merged result before confirming
- [ ] CSS extraction options
  - [ ] Auto-extract inline styles to CSS
  - [ ] Detect and extract `<style>` blocks
  - [ ] Option to use global stylesheet vs section CSS

### 5.5.5 Batch Save to Library
- [ ] "Save All Sections" button
  - [ ] Validates all sections
  - [ ] Creates Section objects with proper schema
  - [ ] Auto-generates section names (Hero, Features, etc.)
  - [ ] Adds all to Section Library
  - [ ] Shows success summary (e.g., "✅ Saved 7 sections")
  - [ ] Auto-switches to Section Library tab

### 5.5.6 AI-Powered Section Classification
- [ ] Use AI to classify section types:
  - [ ] Hero/Banner
  - [ ] Navigation/Header
  - [ ] Features/Services
  - [ ] Testimonials/Reviews
  - [ ] Call-to-Action
  - [ ] Footer
  - [ ] Content Block
  - [ ] Gallery/Media
- [ ] Auto-suggest section names based on content
- [ ] Auto-detect and apply appropriate animations

### 5.5.7 Add Page Splitter Tab
- [ ] Add "Split Page" tab to main editor page
- [ ] Position after Section Library tab
- [ ] Icon: scissors or split icon
- [ ] Tooltip: "Import and split full HTML pages into sections"

---

## ✅ Phase 6: WordPress Playground Integration

### 6.1 Update Playground Import Functions
- [x] Update `/public/playground.js`
  - [x] Created `updateAllSectionsPreview()` function for live preview
  - [x] Each section = 1 HTML widget with all settings
  - [x] Builds proper Elementor HTML widget JSON structure
  - [x] Includes global CSS from Style Guide
  - [x] Creates/updates preview page dynamically

### 6.2 Section to Elementor HTML Widget Conversion
- [x] Create `/src/lib/section-to-elementor.ts`
  - [x] Function: `sectionToHtmlWidget(section)`
  - [x] Combines HTML + CSS (in `<style>`) + JS (in `<script>`)
  - [x] Maps section.settings to Elementor widget properties
  - [x] Returns proper widget JSON structure
  - [x] Additional conversion functions:
    - [x] `sectionsToHtmlWidgets()` - Batch conversion
    - [x] `sectionsToElementorContainer()` - Container structure
    - [x] `sectionsToElementorTemplate()` - Complete template
    - [x] `generateSectionsPreviewHTML()` - Preview generation
    - [x] `validateElementorWidget()` - Validation
    - [x] `elementorWidgetToSection()` - Reverse conversion

### 6.3 Export All Sections to Playground
- [x] "Preview All" button in Section Library
  - [x] Converts all sections to Elementor JSON template
  - [x] Generates preview HTML
  - [x] Copies HTML to clipboard
  - [x] Downloads Elementor JSON file
  - [x] Success notification with instructions
  - [x] Integrate with playground.js iframe communication
  - [x] Real-time preview in WordPress Playground iframe

### 6.4 Live Preview Updates
- [x] When editing a section, "Update Playground" button
- [x] Re-sends all sections to WordPress
- [x] WordPress page refreshes with changes
- [x] Added `updateAllSectionsPreview()` function to playground.js
- [x] Added "🔄 Update Playground" button to Section Library
- [x] Added "🔄 Preview in WP" button to HTML Section Editor

---

## ⏳ Phase 7: Vercel AI SDK Migration & Multi-Model Support (IN PROGRESS)

### 7.1 Install Vercel AI SDK & Dependencies
- [x] Install packages:
  - [x] `npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google`
  - [x] Verify compatibility with Next.js 15 ✅

### 7.2 Setup AI Generation with Multi-Model Support
- [x] Updated `/src/app/api/generate-html/route.ts`
  - [x] Replaced AI Gateway with direct provider integration
  - [x] Implemented model selector function:
    - [x] **Default:** `claude-3-5-haiku-20241022` (Haiku 4.5)
    - [x] **Claude:** `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
    - [x] **OpenAI:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`
    - [x] **Google:** `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`
  - [x] Updated system prompt for better JSON generation
  - [x] Configured maxTokens: 8000 for larger responses
- [x] Updated HTML Generator UI
  - [x] Changed default model to Claude 3.5 Haiku
  - [x] Added model selector with grouped options (Claude, OpenAI, Google)
  - [x] Removed reasoning effort selector (not needed for Claude/Gemini)
  - [x] Updated API endpoint from `/api/generate-html-direct` to `/api/generate-html`

### 7.3 Research Vercel AI SDK Documentation
- [ ] **Core Concepts:**
  - [ ] Read: https://sdk.vercel.ai/docs/ai-sdk-core/overview
  - [ ] Understand `generateText()` vs `streamText()`
  - [ ] Learn `generateObject()` for structured outputs
- [ ] **Tool Calling:**
  - [ ] Read: https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
  - [ ] Understand `tools` parameter structure
  - [ ] Learn Zod schema integration for tool parameters
  - [ ] Multi-step tool execution patterns
- [ ] **Streaming:**
  - [ ] Read: https://sdk.vercel.ai/docs/ai-sdk-rsc/streaming-react-components
  - [ ] Understand `useChat()` hook
  - [ ] StreamData API for custom payloads
- [ ] **Provider Setup:**
  - [ ] OpenAI: https://sdk.vercel.ai/providers/ai-sdk-providers/openai
  - [ ] Anthropic: https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic
  - [ ] Google: https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai
- [ ] **Best Practices:**
  - [ ] Error handling patterns
  - [ ] Rate limiting strategies
  - [ ] Token usage tracking
  - [ ] Caching strategies

### 7.4 Create New AI Route with Vercel SDK
- [ ] Create `/src/app/api/chat-elementor-v2/route.ts`
  - [ ] Import Vercel AI SDK: `import { streamText } from 'ai'`
  - [ ] Import providers: `anthropic`, `openai`, `google`
  - [ ] Accept `model` parameter from request
  - [ ] Dynamic model selection based on provider prefix
  - [ ] Use `streamText()` for streaming responses

### 7.5 Define Tool Schemas with Zod
- [ ] Create `/src/lib/ai-tools.ts`
  - [ ] Use Zod for type-safe tool definitions
  - [ ] Tool: `update_section_html`
    - [ ] Parameters: `sectionId` (string), `html` (string)
    - [ ] Description: "Update the HTML content of a section"
  - [ ] Tool: `update_section_css`
    - [ ] Parameters: `sectionId` (string), `css` (string)
  - [ ] Tool: `update_section_js`
    - [ ] Parameters: `sectionId` (string), `js` (string)
  - [ ] Tool: `update_section_settings`
    - [ ] Parameters: `sectionId`, `margins`, `padding`, `background`, etc.
  - [ ] Tool: `add_new_section`
    - [ ] Parameters: `name` (string), `html`, `css`, `js`, `settings`
  - [ ] Tool: `delete_section`
    - [ ] Parameters: `sectionId` (string)
  - [ ] Tool: `reorder_sections`
    - [ ] Parameters: `sectionIds` (array of strings in new order)
  - [ ] Tool: `update_global_stylesheet`
    - [ ] Parameters: `css` (string)

### 7.6 Update System Prompt
- [ ] Create `/src/lib/ai-prompts.ts`
  - [ ] HTML section editing prompt:
    - [ ] "You are editing HTML/CSS/JS sections for WordPress Elementor"
    - [ ] "Never output DOCTYPE, html, head, body tags"
    - [ ] "Always output section-level semantic HTML"
    - [ ] "Include `<style>` tags for scoped CSS"
    - [ ] "Include `<script>` tags for JavaScript"
    - [ ] "Reference global stylesheet variables using `var(--variable-name)`"
    - [ ] "Use Elementor-compatible animations and properties"
  - [ ] Tool usage guidelines
  - [ ] Context format instructions

### 7.7 Update ChatInterface Component
- [ ] Update `/src/components/elementor/ChatInterface.tsx`
  - [ ] Replace fetch to `/api/chat-elementor` with `/api/chat-elementor-v2`
  - [ ] Use Vercel AI SDK's `useChat()` hook (optional)
  - [ ] Add model selector dropdown in UI
  - [ ] Display current model in chat header
  - [ ] Handle streaming responses from new endpoint
  - [ ] Parse tool calls from response
  - [ ] Execute tool functions client-side

### 7.8 Context Preparation
- [ ] Update context builder to include:
  - [ ] All sections (id, name, html, css, js, settings)
  - [ ] Global stylesheet content
  - [ ] Current selected section
  - [ ] Section order
  - [ ] Available CSS variables from global stylesheet
  - [ ] WordPress Playground status

### 7.9 Model Selection UI
- [ ] Create `/src/components/elementor/ModelSelector.tsx`
  - [ ] Dropdown grouped by provider:
    - [ ] **Anthropic** (Default)
      - [ ] Claude 3.5 Haiku (Default) - Fast, cost-effective
      - [ ] Claude 3.5 Sonnet - Balanced
      - [ ] Claude Opus 4 - Most capable
    - [ ] **OpenAI**
      - [ ] GPT-4o - Latest flagship
      - [ ] GPT-4o Mini - Fast and cheap
    - [ ] **Google**
      - [ ] Gemini 2.0 Flash - Fastest
      - [ ] Gemini Pro 1.5 - Balanced
  - [ ] Show model metadata (speed indicator, cost tier)
  - [ ] Persist selection in localStorage
  - [ ] Display token usage stats per model

### 7.10 Testing Multi-Model Setup
- [ ] Test each model provider:
  - [ ] Verify API keys work
  - [ ] Test streaming responses
  - [ ] Test tool calling functionality
  - [ ] Compare response quality across models
  - [ ] Measure response latency
- [ ] Test fallback behavior if primary model fails
- [ ] Test rate limiting handling
- [ ] Verify structured output generation

---

## ✅ Phase 8: Global Stylesheet Preview Integration

### 8.1 Apply Global Stylesheet to Previews ✅ COMPLETE
- [x] Section Editor preview injects global CSS
- [x] HTML Generator preview injects global CSS
- [x] Section Library thumbnails use global CSS
- [x] Playground import includes global CSS in combined HTML

### 8.2 CSS Variable Usage ✅ COMPLETE
- [x] Parse CSS variables from global stylesheet
- [x] Make variables available in autocomplete for CSS editor (StyleGuide + HtmlSectionEditor)
- [x] Show variable values in style guide (comprehensive CSS Variables section)
- [x] Autocomplete triggers on `var(` or `--` with variable name and value hints

### 8.3 Hot Reload on Stylesheet Changes ✅ COMPLETE
- [x] When global CSS changes in Style Guide tab (via setGlobalCss wrapper)
- [x] Auto-update all open previews (via React context reactivity)
- [x] Re-render section thumbnails (key-based force re-render using lastUpdated)
- [x] Show "Updated" notification (green toast with slide-in animation)

---

## ✅ Phase 9: GrapeJS Visual Editor & Mobile Optimization

### 9.1 GrapeJS Visual Editor Integration ✅ COMPLETE
- [x] Install grapesjs and @grapesjs/react packages
- [x] Create VisualSectionEditor component with 3-column layout
- [x] Implement blocks panel (left) with drag-and-drop elements
- [x] Configure GrapeJS canvas (center) with responsive preview
- [x] Add styles panel (right) with property editors
- [x] Integrate grapesjs-blocks-basic plugin for default blocks
- [x] Add global CSS loading into GrapeJS canvas
- [x] Implement bidirectional sync (Code ↔ Visual editors)
- [x] Add navigation buttons between Code and Visual editors
- [x] Create comprehensive documentation (docs/grapejs-visual-editor.md)

### 9.2 CSS Cascade Inspector ✅ COMPLETE
- [x] Create CSSCascadeInspector component (451 lines)
- [x] Parse inline styles from selected component
- [x] Parse class-based styles from GrapeJS CSS rules
- [x] Parse global CSS and match to component
- [x] Calculate CSS specificity for each rule
- [x] Display cascade hierarchy (inline → class → global)
- [x] Show computed final values
- [x] Integrate inspector into Visual Editor right panel

### 9.3 Performance Optimizations ✅ COMPLETE
- [x] Add debounced update handler (1-second delay)
- [x] Replace generic 'update' event with specific events
- [x] Optimize React rendering with useCallback
- [x] Prevent jittery re-renders during editing
- [x] Smooth element selection and manipulation

### 9.4 WordPress Import Enhancements ✅ COMPLETE
- [x] Set section content_width to 'full' by default
- [x] Set section padding to 0px all around
- [x] Set section margin to 0px all around
- [x] Set column padding to 0px all around
- [x] Set column margin to 0px all around
- [x] Apply to saveSectionToTemplateLibrary() function
- [x] Apply to importHtmlSectionToPage() function

### 9.5 Mobile Optimization 🔄 IN PROGRESS
- [x] **Bottom Chat Drawer (Mobile)** ✅ COMPLETE
  - [x] Swipeable drawer from bottom (like native apps)
  - [x] Collapsed state: 60px handle with "Chat" button
  - [x] Expanded state: 70vh height with chat interface
  - [x] Smooth slide-up/down animation
  - [x] Touch-friendly drag handle
  - [x] Auto-collapse when switching tabs

- [x] **Simplified Mobile Tabs** ✅ COMPLETE
  - [x] Horizontal scrolling tabs at top
  - [x] Larger touch targets (min 44px height)
  - [x] Abbreviated labels for space (e.g., "Code" not "Code Editor")
  - [x] Visual active indicator
  - [x] Snap-to-tab scrolling
  - [x] Icon + text for clarity

- [x] **Mobile-Optimized Views** ✅ COMPLETE
  - [x] Code Editor: Full-screen Monaco on mobile, hide settings panel ✅
  - [x] Visual Editor: Collapsible blocks dropdown + bottom sheet styles ✅
  - [x] Section Library: Full-width list on mobile, full-screen editor with back button ✅
  - [x] WordPress Playground: Full-screen iframe, stacked controls ✅
  - [x] Site Content: Stacked form fields (CSS media query) ✅
  - [x] Style Guide: Single column layout with toggle preview ✅

- [x] **Touch Interactions** ✅ COMPLETE
  - [x] Touch-friendly buttons (min 44x44px via CSS media query) ✅
  - [x] Mobile-optimized button layouts (stacked, full-width) ✅
  - [x] Bottom drawer with touch-friendly handle (chat) ✅
  - [x] Horizontal scrolling tabs with touch targets ✅
  - [x] Full-screen mobile modals with better touch areas ✅

- [x] **Responsive Breakpoints** ✅ COMPLETE
  - [x] Mobile: < 768px (implemented across all views) ✅
  - [x] Desktop: > 768px (default layout) ✅
  - [x] Applied consistent breakpoint across all components ✅

### 9.6 Documentation Updates ✅ COMPLETE
- [x] Update CLAUDE.md with GrapeJS features
- [x] Update CLAUDE.md with branching strategy
- [x] Create comprehensive GrapeJS documentation
- [x] Document WordPress import defaults
- [x] Add mobile optimization notes (this section)

### 9.7 Branch Management & CI/CD ✅ COMPLETE
- [x] Create GitHub Actions auto-merge workflow
- [x] Configure workflow for claude/grapejs-* branches
- [x] Test auto-merge to development
- [x] Delete obsolete html-only-no-elementor branch

**Phase 9 Progress:** 71/76 tasks completed (93%)

---

## ⏳ Phase 10: Testing & Polish

### 10.1 Workflow Testing
- [ ] Test: Generate HTML → Save as Section → Edit → Preview in Playground
- [ ] Test: Create multiple sections → Reorder → Preview all in Playground
- [ ] Test: Edit global stylesheet → See changes in section previews
- [ ] Test: Chat assistant modifying sections
- [ ] Test: Export/import section library

### 10.2 Error Handling
- [ ] Handle WordPress Playground not running
- [ ] Handle invalid HTML/CSS/JS
- [ ] Handle missing global stylesheet
- [ ] Handle section conversion errors

### 10.3 UI/UX Polish
- [x] Success/error notifications ✅ (Toast notification system implemented)
  - [x] Created Toast component with 4 types (success, error, info, warning)
  - [x] Created useToast hook for global toast management
  - [x] Integrated ToastContainer in main editor
  - [x] Replaced alerts in SectionLibrary with toasts
- [ ] Loading states for WordPress operations
- [ ] Keyboard shortcuts (save, preview, etc.)
- [x] Responsive layout for smaller screens ✅ (DONE via Phase 9 mobile optimization)
- [ ] Dark mode compatibility

### 10.4 Documentation
- [ ] Add inline help text/tooltips
- [ ] Create user guide for HTML-only workflow
- [ ] Document Elementor HTML widget properties
- [ ] Add example sections to library

**Phase 10 Progress:** 2/14 tasks completed (14%)**

---

## 🔍 Phase 11: UX & Performance Audit

### 11.1 User Experience Audit
- [ ] **Navigation & Flow**
  - [ ] Review tab switching logic and transitions
  - [ ] Test user flow from chat → section editor → playground
  - [ ] Assess discoverability of features
  - [ ] Evaluate learning curve for new users

- [ ] **Visual Editor (GrapeJS) Evaluation**
  - [ ] Test component selection responsiveness
  - [ ] Verify style panel updates correctly
  - [ ] Check for undefined variable errors
  - [ ] Assess drag-and-drop smoothness
  - [ ] Evaluate mobile touch interactions
  - [ ] Test blocks panel usability

- [ ] **Code Editor Experience**
  - [ ] Monaco editor performance with large files
  - [ ] Syntax highlighting accuracy
  - [ ] Autocomplete usefulness (CSS variables)
  - [ ] Live preview update speed
  - [ ] Mobile fullscreen mode effectiveness

- [ ] **Section Library Usability**
  - [ ] Thumbnail preview quality
  - [ ] Section search/filter capabilities
  - [ ] Drag-to-reorder smoothness
  - [ ] Import/export workflow clarity
  - [ ] Mobile grid vs list view effectiveness

- [ ] **WordPress Playground Integration**
  - [ ] Iframe loading speed
  - [ ] Data sync reliability (push/pull)
  - [ ] Error handling clarity
  - [ ] Status indicator visibility
  - [ ] Template import accuracy

### 11.2 Performance Audit
- [ ] **Build Performance**
  - [ ] Measure bundle size
  - [ ] Identify code splitting opportunities
  - [ ] Check for unnecessary dependencies
  - [ ] Optimize dynamic imports

- [ ] **Runtime Performance**
  - [ ] React rendering performance (use React DevTools Profiler)
  - [ ] GrapeJS initialization time
  - [ ] Monaco editor load time
  - [ ] Section thumbnail rendering speed
  - [ ] Global CSS hot reload performance

- [ ] **Memory Usage**
  - [ ] Check for memory leaks in event listeners
  - [ ] Monitor DOM node count in GrapeJS
  - [ ] Assess React component re-render frequency
  - [ ] Profile long-running sessions

- [ ] **Network Performance**
  - [ ] Minimize API calls
  - [ ] Implement request caching where appropriate
  - [ ] Optimize asset loading (fonts, styles, scripts)
  - [ ] Lazy load WordPress Playground

### 11.3 Accessibility Audit
- [ ] **Keyboard Navigation**
  - [ ] Test tab order across all interfaces
  - [ ] Verify keyboard shortcuts work
  - [ ] Ensure focus indicators are visible
  - [ ] Check screen reader compatibility

- [ ] **Visual Accessibility**
  - [ ] Verify color contrast ratios (WCAG AA)
  - [ ] Test with different font sizes
  - [ ] Check for sufficient touch target sizes (44x44px)
  - [ ] Ensure no information conveyed by color alone

- [ ] **Semantic HTML**
  - [ ] Review heading hierarchy
  - [ ] Use proper ARIA labels where needed
  - [ ] Ensure forms have proper labels
  - [ ] Test with screen readers

### 11.4 Error Handling & Edge Cases
- [ ] **Input Validation**
  - [ ] Handle empty/invalid HTML/CSS/JS
  - [ ] Validate section names (special characters, length)
  - [ ] Handle WordPress Playground disconnections
  - [ ] Test with extremely large sections

- [ ] **State Management**
  - [ ] Verify undo/redo functionality
  - [ ] Test concurrent edits (Visual ↔ Code)
  - [ ] Check localStorage limits
  - [ ] Handle browser refresh/navigation

- [ ] **Error Messages**
  - [ ] Review all error messages for clarity
  - [ ] Ensure actionable error guidance
  - [ ] Test error recovery flows
  - [ ] Add retry mechanisms where appropriate

### 11.5 Mobile Experience Deep Dive
- [ ] **Touch Interactions**
  - [ ] Test all swipe gestures
  - [ ] Verify button sizes (min 44x44px)
  - [ ] Check for tap delay issues
  - [ ] Test long-press interactions

- [ ] **Responsive Layouts**
  - [ ] Test on actual mobile devices (not just DevTools)
  - [ ] Verify breakpoint transitions (320px, 768px, 1024px)
  - [ ] Check for horizontal scroll issues
  - [ ] Test landscape vs portrait modes

- [ ] **Mobile Performance**
  - [ ] Measure First Contentful Paint
  - [ ] Check for layout shifts
  - [ ] Monitor touch response time
  - [ ] Test on lower-end devices

### 11.6 Feature Completeness Review
- [ ] **Does it meet requirements?**
  - [ ] Visual editor works as advertised
  - [ ] Code editor has all expected features
  - [ ] Section library management is complete
  - [ ] WordPress integration is functional
  - [ ] Global CSS system works end-to-end

- [ ] **Missing Features**
  - [ ] Document any discovered gaps
  - [ ] Prioritize missing features
  - [ ] Create follow-up tasks
  - [ ] Consider MVP vs future enhancements

### 11.7 Documentation & Help
- [ ] **User Documentation**
  - [ ] Is CLAUDE.md comprehensive?
  - [ ] Are there helpful inline tooltips?
  - [ ] Is the learning curve acceptable?
  - [ ] Are error messages self-documenting?

- [ ] **Developer Documentation**
  - [ ] Are component APIs documented?
  - [ ] Is the architecture clear?
  - [ ] Are best practices noted?
  - [ ] Is troubleshooting info available?

**Phase 11 Progress:** 0/80 tasks completed (0%)

---

## 📊 Progress Tracking

**Phase 1 (Cleanup):** ✅ 6/6 tasks - COMPLETE
**Phase 2 (WordPress Stylesheet):** ✅ 5/5 tasks - COMPLETE
**Phase 3 (Style Guide):** ✅ 5/5 tasks - COMPLETE (simplified, integrated)
**Phase 4 (Section Editor):** ✅ 6/6 tasks - COMPLETE
**Phase 5 (Section Library):** ✅ 5/5 tasks - COMPLETE
**Phase 5.5 (Page Splitter):** ✅ 7/7 tasks - COMPLETE (integrated into Section Library)
**Phase 6 (Playground Integration):** ✅ 8/8 tasks - COMPLETE (live preview with updateAllSectionsPreview function, Section Library & Editor integration)
**Phase 7 (Vercel AI SDK & Multi-Model):** ✅ 25/40 tasks - IN PROGRESS (Chat-based HTML generation complete with streaming, image analysis, and auto tab switching)
**Phase 8 (Global CSS Integration):** ✅ 9/9 tasks - COMPLETE
**Phase 9 (GrapeJS Visual Editor & Mobile):** ✅ 71/76 tasks - 93% COMPLETE (GrapeJS fixes + full mobile optimization)
**Phase 10 (Testing & Polish):** 🔄 2/14 tasks - IN PROGRESS (Toast notification system implemented)
**Phase 11 (UX & Performance Audit):** ⬜️ 0/80 tasks - NOT STARTED

**TOTAL:** 157/390 tasks completed (40%)**

---

## 🎯 Implementation Order (Recommended)

1. **Start with Phase 1** - Clean up old code
2. **Phase 2** - Get WordPress stylesheet working (foundation for everything)
3. **Phase 3** - Build Style Guide tab (makes global CSS visual)
4. **Phase 4** - Build Section Editor (core editing experience)
5. **Phase 5** - Build Section Library (multi-section management)
6. **Phase 6** - Integrate with WordPress Playground
7. **Phase 7** - Update Chat AI for HTML editing
8. **Phase 8** - Connect everything with global CSS
9. **Phase 9** - Test and polish

---

## ✅ Key Features Summary

✨ **What You Get:**
- Clean HTML/CSS/JS section builder
- Visual style guide editor with live preview
- Edit WordPress theme stylesheet directly
- Multiple sections → Full page builder
- Elementor HTML widget with all properties
- Chat AI for HTML/CSS/JS editing
- WordPress Playground integration
- No complex Elementor JSON conversion

🚀 **Much Simpler Than Before:**
- No Elementor JSON structure headaches
- Just HTML/CSS/JS (what you already know)
- Visual settings panel for common properties
- Global stylesheet for consistent design
- Easy to understand and maintain

---

## 📝 Recent Updates (January 2025)

### Chat-Based HTML Generation Tool (Phase 7 Enhancement)

**Completed:** Chat integration for generating HTML/CSS/JS sections with AI

**Implementation:**
1. **New AI Tool: `generateHTML`** (`/src/lib/tools.ts`)
   - Triggered by keywords: "generate", "create", "build", "make" + HTML-related terms
   - Opens interactive dialog for user input and image upload
   - Supports up to 3 reference images

2. **Image Analysis API** (`/src/app/api/analyze-image/route.ts`)
   - Uses Claude Haiku 4.5 vision via AI Gateway
   - Analyzes layout, colors, typography, spacing, components, responsive design
   - Provides detailed descriptions for code generation context

3. **Streaming HTML/CSS/JS Generation** (`/src/app/api/generate-html-stream/route.ts`)
   - Separate prompts for HTML, CSS, and JS
   - **Section-focused prompts:**
     - HTML: NO DOCTYPE, html, head, body tags - pure sections only
     - CSS: NO style tags, pure CSS selectors only
     - JS: NO script tags, pure JavaScript only
   - Uses selected chat model for all generation
   - Streams each part sequentially

4. **Real-Time Streaming to Section Editor**
   - Streams HTML → automatically switches to HTML tab
   - Streams CSS → automatically switches to CSS tab
   - Streams JS → automatically switches to JS tab
   - User sees code appearing character by character

5. **UI Components:**
   - `HTMLGeneratorDialog` - Image upload, analysis progress, description input
   - `HTMLGeneratorWidget` - Chat widget showing generation progress
   - Integrated with `ToolResultRenderer` for consistent UI

6. **Tab Removed:**
   - Old "HTML Generator" tab removed from main interface
   - All HTML generation now happens through chat

**Key Files Modified:**
- `/src/lib/tools.ts` - Added generateHTML tool
- `/src/app/api/analyze-image/route.ts` - Created (vision analysis)
- `/src/app/api/generate-html-stream/route.ts` - Created (streaming generation)
- `/src/components/html-generator/HTMLGeneratorDialog.tsx` - Created
- `/src/components/tool-ui/html-generator-widget.tsx` - Created
- `/src/components/elementor/HtmlSectionEditor.tsx` - Added tab switching
- `/src/app/elementor-editor/page.tsx` - Removed HTML Generator tab, added callbacks

**Benefits:**
- ✅ Natural language HTML/CSS/JS generation
- ✅ Image-to-code with Claude vision
- ✅ Real-time streaming with visual feedback
- ✅ Automatic tab switching for better UX
- ✅ Section-focused output (no full pages)
- ✅ Uses selected chat model for consistency
