# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hustle Tools** is a comprehensive Next.js application combining multiple productivity tools with AI-powered features:
1. **HTML-Only Section Builder** - Build WordPress/Elementor sections using HTML/CSS/JS (no complex JSON)
2. **AI Chat Interface** - Multi-model chat with tool calling and web search
3. **Site Crawler** - Firecrawl integration for website scraping and mapping

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test-reasoning  # Test API reasoning endpoints
```

The dev server runs on `http://localhost:3000` by default. Uses Next.js 15.4.6 with Turbopack for fast HMR.

## Environment Variables

Required in `.env.local`:
```
FIRECRAWL_API_KEY=your_firecrawl_api_key
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

Optional (for Supabase authentication):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: Supabase is completely optional. The app works without authentication if these variables are not set.

## Current Development Phase

**Working from**: `/HTML_ONLY_IMPLEMENTATION_PLAN.md` (main roadmap document)

**Progress**: 73/154 tasks completed (47%)
- ✅ Phase 1-5.5: Complete (Cleanup, WordPress Stylesheet, Style Guide, Section Editor, Section Library, Page Splitter)
- 🔄 Phase 6: WordPress Playground Integration (6/8 tasks) - **IN PROGRESS**
- 🔄 Phase 7: Vercel AI SDK Migration (25/40 tasks) - **IN PROGRESS**
- ⏳ Phase 8: Global CSS Integration (3/9 tasks)
- ⏳ Phase 9: Testing & Polish (0/14 tasks)

## Architecture Overview

This is a multi-tool Next.js application with four main feature areas:

### 1. HTML-Only Section Builder (`/elementor-editor`)
A comprehensive WordPress/Elementor development environment with browser-based WordPress Playground integration. **This is the main focus of current development.**

**Key Components:**
- **Chat Panel** (left/bottom drawer on mobile): AI chat interface with tool calling for HTML/CSS/JS generation
- **Main Tabs** (right panel):
  - **Section Editor**: HTML/CSS/JS Monaco editors with live preview and visual settings panel
  - **Section Library**: Multi-section management with localStorage persistence, drag-to-reorder, import/export
  - **WordPress Playground**: Live WordPress instance (auto-launches on page load)
  - **Site Content**: WordPress settings & pages CRUD manager
  - **Style Guide**: Visual style guide editor with global CSS management

**Mobile Optimization:**
- Swipeable chat drawer from bottom (70vh when open, 60px handle when closed)
- Horizontal scrolling tabs with abbreviated labels
- Full-height tab content on mobile
- Responsive breakpoint: 768px

**WordPress Playground Integration:**
- Lives in `/public/playground.js` - handles all WP/Elementor operations
- Auto-launches on page mount via `PlaygroundView.tsx`
- Uses file-based JSON approach (not string interpolation) to avoid PHP escaping issues
- Blueprint installs: Elementor, Yoast SEO, Hello Elementor theme
- Global functions exposed:
  - `openPlaygroundDirect()` - Launch WordPress instance
  - `applySiteConfig()` - Save settings and pages to WordPress
  - `getWordPressSettings()` - Pull WordPress settings
  - `getWordPressPages()` - Get all WordPress pages
  - `getElementorStyleKit()` - Get Elementor global styles
  - `setElementorStyleKit()` - Save Elementor global styles
  - `saveHtmlSectionToLibrary()` - Save section to Elementor template library
  - `importHtmlSectionToPage()` - Import single section to preview page
  - `importMultipleSectionsToPage()` - Import multiple sections to create full page preview (NEW)

**State Management:**
- Uses custom hook `useElementorState` for undo/redo history
- Global `playgroundReady` state controls tab availability
- Status indicator at bottom shows playground initialization state

**Critical Implementation Details:**
- Tabs (Site Content, Style Guide) are DISABLED until `playgroundReady === true`
- All WordPress data sync happens via PHP functions in playground.js
- Settings push/pull uses `isset()` checks (NOT empty string checks) to allow clearing fields
- Pages include comprehensive fields: title, slug, content, excerpt, status, date, featured image, author, template, parent page, menu order, comments, pingbacks, custom CSS, and full Yoast SEO (focus keyword, meta title, meta description, canonical URL, noindex, nofollow)

**Chat-Based HTML Generation:**
- `generateHTML` tool triggered by keywords: "generate", "create", "build", "make"
- Opens dialog for description input and optional image upload (max 3)
- Images analyzed by Claude Haiku 4.5 vision for detailed layout/design descriptions
- Streams HTML, CSS, and JS sequentially to Section Editor
- Automatically switches tabs (HTML → CSS → JS) during generation
- Prompts enforce section-only output (NO DOCTYPE, html, head, body, style, or script tags)
- Uses selected chat model for all generation

### 2. AI Chat Interface (`/chat`)
Vercel AI SDK-powered chat with streaming responses and tool calling.

**Architecture:**
- Backend: `/src/app/api/chat/route.ts` - uses AI Gateway for multi-provider support
- Frontend: Uses `useChat` hook from `@ai-sdk/react`
- Tools: Defined in `/src/lib/tools.ts` using Zod schemas
- Message parts: `text`, `tool-call`, `tool-result`
- Custom UI widgets: `/src/components/tool-ui/tool-result-renderer.tsx`

**Adding New AI Tools:**
1. Define tool in `src/lib/tools.ts` with description, inputSchema, execute function
2. (Optional) Create custom widget component
3. Add case to `tool-result-renderer.tsx` switch statement

**Adding New Models:**
Add to `modelGroups` array in `/src/app/chat/page.tsx` using AI Gateway format: `provider/model-name`

### 3. Site Crawler (`/firecrawl`)
Firecrawl API integration for website mapping and scraping.

**Features:**
- Map entire sites to discover all pages
- Batch scrape multiple URLs
- Download as Markdown (individual or combined)
- Uses batch processing API for efficiency

## Key Technical Patterns

### File-Based JSON for WordPress Operations
**CRITICAL**: When writing data to WordPress Playground, ALWAYS use file-based approach:
```javascript
// Write JSON to temp file
await playgroundClient.writeFile('/tmp/data.json', JSON.stringify(data));

// PHP reads from file
const phpCode = `<?php
  $json = file_get_contents('/tmp/data.json');
  $data = json_decode($json, true);
  // ... use $data
  @unlink('/tmp/data.json');
?>`;
```

**Never use string interpolation** - it breaks with quotes, special chars, HTML.

### WordPress Settings Sync Pattern
- Pull: `getWordPressSettings()` returns all WP options
- Push: `applySiteConfig({ settings, pages })` writes to WP
- ALL fields use `isset()` checks, not empty string checks
- New fields: `siteIcon` (site icon URL), `blogPublic` (search visibility)

### Playground Ready Pattern
Components that need WordPress Playground must:
1. Accept `playgroundReady` prop
2. Only execute WP operations when `playgroundReady === true`
3. Use `useEffect(() => { if (playgroundReady) { ... } }, [playgroundReady])`

### Chat-to-JSON Workflow
1. User sends natural language request to ChatInterface
2. Backend classifies intent: `modify_json`, `generate_json`, `explain_json`, `complex`
3. For modify_json: extracts targeted context (only relevant widgets)
4. AI generates JSON patch or full replacement
5. Frontend applies patch using `applyPatch()` or replaces JSON
6. Undo/redo stack maintained via useElementorState

## Component Structure

### Elementor Editor Components (`/src/components/elementor/`)
- `ChatInterface.tsx` - Left panel AI chat (renamed from "Elementor JSON Editor" to "Chat")
- `JsonEditor.tsx` - JSON editor with validation
- `PlaygroundView.tsx` - WordPress Playground iframe wrapper (auto-launches)
- `HtmlGeneratorNew.tsx` - JSON → HTML/CSS/JS converter
- `JsonConverter.tsx` - HTML/CSS → JSON converter (uses GPT-4 vision for mockups)
- `SiteContentManager.tsx` - WordPress settings & pages CRUD (comprehensive fields)
- `StyleKitEditorNew.tsx` - Elementor color/typography editor
- `WidgetPropertiesPanel.tsx` - JSON property editor UI

### AI Chat Components (`/src/components/ai-elements/`)
- Uses Vercel AI SDK Elements
- Custom markdown rendering with syntax highlighting
- Source citation widgets for web search results

## Styling

Uses CSS variables defined in `/src/app/globals.css`:
```
--background, --foreground, --card, --primary, --muted, --border, --destructive
```

Supports dark/light mode via `next-themes`. Elementor editor uses custom CSS in `elementor-editor.css`.

## API Routes

### Chat APIs
- `/api/chat` - Main chat endpoint (streaming)
- `/api/chat-doc` - Document-based chat variant
- `/api/chat-elementor` - Elementor-specific chat
- `/api/classify-intent` - Intent classification for JSON operations
- `/api/prepare-context` - Extract targeted JSON context
- `/api/generate-site-config` - Generate WP site config from prompt

### Utility APIs
- `/api/firecrawl-map` - Map website structure
- `/api/firecrawl-batch` - Batch scrape URLs
- `/api/firecrawl-batch-status` - Check batch status
- `/api/search-docs` - Vector search (currently returns empty, relies on tool calls)

## Testing

Browser-executable test suite for WordPress Playground:
```javascript
// In browser console after playground loads:
runPlaygroundTests()
```

Tests cover: WordPress settings, pages CRUD, style kit sync, Elementor JSON, special characters, Unicode handling.

## Important Implementation Notes

1. **WordPress Playground Auto-Launch**: PlaygroundView component automatically launches WordPress on mount. No manual button click needed.

2. **Tab Dependencies**: HTML Generator, JSON Converter, Site Content, and Style Kit tabs are disabled until playground is ready. Status indicator shows initialization progress.

3. **PHP Serialized Data**: Elementor style kits use PHP serialized format. The app uses WordPress PHP to handle serialization/deserialization, NOT JavaScript parsers.

4. **Model Selection**: Default model is `openai/gpt-5`. All GPT-5 variants supported: gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro.

5. **Resizable Panels**: Elementor editor has draggable divider between chat (25-60% width) and tabs panels.

6. **State Persistence**: JSON editor maintains undo/redo history stack. No localStorage persistence by default.

7. **Supabase Auth**: Optional authentication system. If env vars not set, app still works without auth.

## Documentation & Implementation Plans

### Main Documentation (`/docs/`)
- `README.md` - Main architecture guide
- `fire-crawl-docs.md` - Firecrawl integration
- `ui-stack.md` - UI component library guide
- `models.md` - Supported AI models
- `how-to-make-tools.md` - Tool creation guide
- `/vercel-ai-sdk-ui-docs/` - Vercel AI SDK documentation

### Implementation Plans (Root Level)
**PRIMARY ROADMAP**: `/HTML_ONLY_IMPLEMENTATION_PLAN.md`
- Complete phase-by-phase implementation guide for HTML-only section builder
- 9 phases with 154 total tasks
- Current progress: 73/154 completed (47%)
- Detailed task breakdowns, technical specs, and file references

**Other Implementation Docs**:
- `ELEMENTOR_EDITOR_IMPLEMENTATION_PLAN.md` - Original Elementor JSON approach (deprecated)
- `ELEMENTOR_EDITOR_IMPLEMENTATION_COMPLETE.md` - Completion notes for old approach
- `WORDPRESS_PLAYGROUND_INTEGRATION_COMPLETE.md` - WordPress Playground integration details
- `ELEMENTOR_MIGRATION_PACKAGE_ANALYSIS.md` - Analysis of Elementor packages
- `ELEMENTOR_FIXES_APPLIED.md` - Bug fixes and improvements log
- `SMART_CONTEXT_SYSTEM.md` - AI context optimization strategy
- `OPTIMIZATION_COMPLETE.md` - Performance optimization notes
- `TESTING.md` - Testing procedures and test suites

### Reference Materials (`/elementor-migration-reference/`)
- Legacy Elementor JSON implementation code
- Migration guides and package manifests
- Archived for reference only

## Recent Updates & Completed Features (2025)

### January 2025
- ✅ **Mobile UI Optimization**: Swipeable chat drawer, responsive tabs, fixed scrollbar issues
- ✅ **WordPress Playground Multi-Section Preview**: `importMultipleSectionsToPage()` function creates full pages from section library
- ✅ **Supabase Optional Auth**: Made authentication completely optional - app builds and works without Supabase env vars
- ✅ **Build Fixes**: Fixed prerender errors, edge runtime issues, and production build process
- ✅ **Chat UI Improvements**: Changed Send button from text to arrow icon, fixed double scrollbars
- ✅ **Section Library Enhancements**: Load sections into editor, preview all in WordPress Playground
- ✅ **Chat-Based HTML Generation**: Tool calling for HTML/CSS/JS generation with image analysis
- ✅ **Streaming Code Generation**: Real-time streaming to Monaco editors with auto tab-switching

### Phase Completion Status
- ✅ **Phase 1**: Cleanup & Remove Elementor JSON Components
- ✅ **Phase 2**: WordPress Global Stylesheet Integration
- ✅ **Phase 3**: Style Guide Tab (Visual Editor + CSS Editor)
- ✅ **Phase 4**: HTML/CSS/JS Section Editor
- ✅ **Phase 5**: Section Library (Multi-Section Management)
- ✅ **Phase 5.5**: HTML Page Splitter
- 🔄 **Phase 6**: WordPress Playground Integration (6/8 - nearly complete)
- 🔄 **Phase 7**: Vercel AI SDK Migration (25/40 - in progress)
- ⏳ **Phase 8**: Global CSS Integration (3/9)
- ⏳ **Phase 9**: Testing & Polish (0/14)

## Common Gotchas

1. **Don't use string interpolation for WordPress PHP**: Always use file-based approach
2. **Check `playgroundReady` before WP operations**: Prevents "Playground not running" errors
3. **Use `isset()` not empty checks**: Allows clearing WordPress settings fields
4. **File paths must be absolute**: Next.js requires absolute paths, not relative
5. **Playground.js is vanilla JS**: Not a React component, uses global window functions
6. **Status indicator is fixed at bottom**: z-index 1000, shows across all tabs
7. **Model names include provider prefix**: e.g., `openai/gpt-5` not just `gpt-5`
8. **Supabase is optional**: App works without authentication if env vars not set
9. **Mobile chat drawer**: On screens < 768px, chat appears as bottom drawer instead of left panel
