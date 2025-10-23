# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Branching Strategy

**⚠️ IMPORTANT: Claude Code Working Branch**

**ALWAYS use this branch for all Claude Code work:**

**`claude/grapejs-visual-editor-011CULKQ2LsnwPgcpmWrmkTA`**

- Start all work on this branch
- Make all commits to this branch
- Push all changes to this branch
- Never create temporary session branches

---

This project also uses a three-tier deployment workflow for production releases:

- **`development`** - Active development and testing branch
- **`staging`** - Pre-production testing with beta testers
- **`main`** - Production branch deployed to main website URL

**Workflow for production**: `development` → `staging` → `main`

On Vercel, each branch deploys to a separate URL for isolated testing.

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

## Architecture Overview

This is a multi-tool Next.js application with three main feature areas:

### 1. Elementor Section Builder (`/elementor-editor`)
A comprehensive WordPress/Elementor development environment with browser-based WordPress Playground integration.

**Key Components:**
- **Left Panel**: AI chat interface with tool calling for HTML/CSS/JS generation
- **Right Panel**: Tabbed interface with 6 main views
  - Code Editor: HTML/CSS/JS Monaco editor with live preview and settings panel
  - **Visual Editor**: GrapeJS drag-and-drop visual builder (NEW ⭐)
  - Section Library: Manage multiple sections, drag-to-reorder
  - WordPress Playground: Live WordPress instance (auto-launches on page load)
  - Site Content: WordPress settings and pages manager
  - Style Guide: Visual style guide editor with global CSS management

**Visual Editor (GrapeJS):**
- **3-Column Layout**: Blocks panel (left), canvas (center), styles panel (right)
- **Blocks Panel**: Visible "+" buttons to drag-and-drop elements (text, images, buttons, etc.)
- **Visual Canvas**: Click elements to select and style them visually
- **Style Manager**: Typography, dimensions, background, borders, effects with live preview
- **Bidirectional Sync**: Changes sync between Visual Editor ↔ Code Editor automatically
- **Navigation Buttons**: "Visual Editor" button in Code Editor, "Code View" button in Visual Editor
- **Global CSS Integration**: WordPress theme styles auto-load into canvas
- **Responsive Preview**: Desktop/Tablet/Mobile device switcher
- **CSS Cascade Inspector**: Shows inline, class, and global CSS sources with specificity hierarchy
- See full documentation: `/docs/grapejs-visual-editor.md`

**WordPress Playground Integration:**
- Lives in `/public/playground.js` - handles all WP/Elementor operations
- Auto-launches on page mount via `PlaygroundView.tsx`
- Uses file-based JSON approach (not string interpolation) to avoid PHP escaping issues
- Blueprint installs: Elementor, Yoast SEO, Hello Elementor theme
- Global functions exposed: `openPlaygroundDirect()`, `applySiteConfig()`, `getWordPressSettings()`, `getWordPressPages()`, `getElementorStyleKit()`, `setElementorStyleKit()`

**WordPress Import Settings:**
When sections are imported to WordPress (via template library or page preview), the following defaults are applied:
- **Section**: `content_width: 'full'`, `padding: 0px`, `margin: 0px`
- **Column**: `padding: 0px`, `margin: 0px`
- This ensures imported sections take full width without unwanted spacing
- Applied in both `saveSectionToTemplateLibrary()` and `importHtmlSectionToPage()` functions

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

**Diff-Based Code Editing (NEW ⭐):**
- Chat can now make **targeted edits** to specific parts of HTML/CSS/JS
- Uses unified diff format (70% fewer tokens than full file replacement)
- Visual diff preview with Monaco DiffEditor (inline view)
- **Approval flow**: Accept, Reject, or Edit Manually
- Keyboard shortcuts: ⌘↵ (accept), Esc (reject), ⌘↑/↓ (navigate changes)
- Tools: `getEditorContent` (read code), `editCodeWithDiff` (make changes)
- See full documentation: `/docs/diff-based-code-editing.md`

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
- `HtmlSectionEditor.tsx` - Code Editor tab with Monaco editor for HTML/CSS/JS
- `VisualSectionEditor.tsx` - Visual Editor tab with GrapeJS drag-and-drop builder ⭐ NEW
- `SectionLibrary.tsx` - Section Library tab for managing saved sections
- `PlaygroundView.tsx` - WordPress Playground iframe wrapper (auto-launches)
- `SiteContentManager.tsx` - WordPress settings & pages CRUD (comprehensive fields)
- `StyleGuide.tsx` - Style Guide tab with global CSS editor
- `HtmlGeneratorNew.tsx` - JSON → HTML/CSS/JS converter
- `JsonConverter.tsx` - HTML/CSS → JSON converter (uses GPT-4 vision for mockups)
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

## Documentation

Comprehensive docs in `/docs/`:
- `README.md` - Main architecture guide
- `grapejs-visual-editor.md` - GrapeJS Visual Editor integration guide ⭐
- `diff-based-code-editing.md` - Diff-based code editing with AI ⭐ NEW
- `fire-crawl-docs.md` - Firecrawl integration
- `ui-stack.md` - UI component library guide
- `models.md` - Supported AI models
- `how-to-make-tools.md` - Tool creation guide
- `/vercel-ai-sdk-ui-docs/` - Vercel AI SDK documentation

## Common Gotchas

1. **Don't use string interpolation for WordPress PHP**: Always use file-based approach
2. **Check `playgroundReady` before WP operations**: Prevents "Playground not running" errors
3. **Use `isset()` not empty checks**: Allows clearing WordPress settings fields
4. **File paths must be absolute**: Next.js requires absolute paths, not relative
5. **Playground.js is vanilla JS**: Not a React component, uses global window functions
6. **Status indicator is fixed at bottom**: z-index 1000, shows across all tabs
7. **Model names include provider prefix**: e.g., `openai/gpt-5` not just `gpt-5`
8. **GrapeJS is client-side only**: Must use dynamic import and 'use client' directive
9. **Global CSS in GrapeJS**: Convert to data URL via `btoa()` before injecting into canvas.styles
10. **Visual ↔ Code sync**: Always update `currentSection` state when switching between editors
11. **Visual Editor blocks panel**: Must append to visible DOM element (not hidden div) to show "+" buttons
12. **WordPress imports use zero padding**: Section and column defaults ensure full-width layouts
13. **Supabase is optional**: All client creation functions check for credentials and return mock clients if missing
