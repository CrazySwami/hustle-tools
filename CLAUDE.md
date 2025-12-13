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
pnpm dev             # Start development server with Turbopack
pnpm build           # Production build
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm test-reasoning  # Test API reasoning endpoints
```

**Note:** This project uses **pnpm** (v10.11.0) as the package manager, not npm. If you don't have pnpm installed:
```bash
npm install -g pnpm
```

The dev server runs on `http://localhost:3000` by default. Uses Next.js 15.4.6 with Turbopack for fast HMR.

## Documentation Standards & Structure

**Updated:** November 10, 2025 – 6:45 PM EST

This project follows a universal documentation framework that applies to all READMEs, Main Docs, and technical specifications. These standards ensure consistency, permanence, and clarity across all documentation.

### Documentation Philosophy

Every README and doc file should be both **instructional** and **historical**. Key principles:

1. **Never delete content without clear justification** - Mark with `// deprecated:` and explain why
2. **Version every edit** - Include date/time and short note for each major update
3. **Preserve context** - Keep related sections as historical or reference material
4. **Timestamp everything** - All updates include EST timestamps

### Universal Document Structure

Every Main Doc or README must include (in order):

```markdown
# Main Doc – [System or Project Name]
Date: YYYY-MM-DD
Time: HH:MM [Timezone]

## TL;DR
[One concise paragraph summarizing the file's purpose]

## Table of Contents (optional for longer docs)

## Main Sections
- Setup
- Usage
- Maintenance
- Structure
- Notes

## Instructions for Updating This File

## Changelog
```

### File Naming Convention

```
/docs/
│
├── Main Doc – [Topic].md           # Primary authoritative documentation
├── README – [Submodule].md         # Local or per-feature documentation
├── Notes – [Short Context].md      # Session notes or context
└── Archive – [Deprecated].md       # Deprecated but preserved content
```

**Rules:**
- Prefix "Main Doc –" for primary sources
- Use "README –" for local/feature docs
- Never overwrite Main Doc files; version them: `Main Doc – Topic (2025-11-10).md`
- All docs open with prefix and timestamp

### Changelog Format

Every doc includes a changelog section at the top:

```markdown
---
Updated: 2025-11-10 6:45 PM EST
Author: Alfonso Morales
Changes: Refactored setup and added new API integration section.
---
```

For major revisions:
- Keep prior versions under `/docs/archive/`
- Reference them: `// Previous version: /docs/archive/Main Doc – Topic (2025-09-12).md`

### Update Procedures

When editing any README:

1. **Add changelog entry** at the top with date, author, and summary
2. **Mark removed content** instead of deleting:
   ```markdown
   // deprecated: replaced by /docs/api/auth.md
   ```
3. **Leave redirect notes** if content moves:
   ```markdown
   // Moved: See /docs/config/auth.md
   ```
4. **Preserve structure** - don't overwrite context unless clear system replacement
5. **Treat docs as immutable records** - not replaceable summaries

### Tone Standards

All documentation should be:
- **Readable** - Full sentences with minimal jargon
- **Actionable** - Short, numbered instructions over vague commentary
- **Contextual** - Explain WHY decisions were made, not just WHAT
- **Consistent** - Same section order, spacing, and heading style

### Future-Proofing

When adding new systems:
- Duplicate this structure as `Main Doc – [System Name].md`
- Cross-link between systems: `See also: Main Doc – AI System Integration.md`
- Use existing docs as templates for depth and detail

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
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Main Doc – Supabase Database & Authentication System

**📘 See:** `/docs/Main Doc – Supabase Database System.md`

**Quick Summary:**
- ✅ Complete database schema (5 tables: documents, folders, dittos, shares, uploaded_files)
- ✅ All API routes implemented (`/api/documents`, `/api/folders`, `/api/dittos`, `/api/shares`, `/api/files`)
- ✅ Supabase-backed React hooks with realtime sync
- ✅ File uploads to Supabase Storage (50MB limit)
- ✅ Sharing system with view/edit permissions
- ✅ Row-Level Security (RLS) on all tables
- ✅ Full authentication (email/password + Google OAuth)

**Migration File:** `/supabase/migrations/001_initial_schema.sql`

**One-Line Frontend Migration:**
```typescript
// In /src/app/chat-doc/page.tsx, change import to:
import { useDocuments, useProjects, useFolders } from '@/hooks/useSupabaseProjectHierarchy';
```

**Authentication Pattern:**
- All Supabase client creation functions check for environment variables first
- If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing:
  - Mock clients are returned instead
  - App functions normally without auth
- This allows development without Supabase setup
- Auth pages available at `/login` and `/signup`

**For full setup instructions, see the Main Doc above ↑**

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

**AI Widget Converter (NEW ⭐):**
- **"⚡ Generate Widget"** button uses Claude Sonnet 4.5 for AI-based widget generation
- **Hybrid approach**: Programmatic CSS scoping + AI PHP generation
- **Process**:
  1. Scope CSS with `{{WRAPPER}}` prefix (programmatic)
  2. Parse HTML to identify elements needing controls (programmatic)
  3. Use Sonnet 4.5 to generate complete PHP widget class (AI streaming)
  4. Create comprehensive Elementor controls for ALL elements
  5. Create NEW widget project (non-destructive)
- **Features**:
  - Real-time streaming: Watch PHP being generated live
  - CSS scoping prevents global style conflicts
  - Preserves original HTML project
  - 10-45 seconds generation time
  - Cost: ~$0.05-0.15 per widget
- **API**: `/api/convert-html-to-widget-ai` - streams PHP using Vercel AI SDK
- **Why AI**: Template-based approaches miss complex control logic; AI generates production-ready widgets with proper control organization, dynamic rendering, and semantic naming

**IMPORTANT: Single-File Widget Structure:**
- Elementor widgets are generated as a SINGLE PHP file with inline CSS/JS
- NO separate .css or .js files are created
- CSS is embedded in `<style>` tags inside the `render()` method with `{{WRAPPER}}` scoping
- JavaScript (if needed) is embedded in `<script>` tags inside the `render()` method
- Only TWO tabs shown for PHP projects: `widget.php` and `README.md`
- This ensures CSS/JS are properly scoped to the widget instance and avoids global conflicts

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

### Vercel AI SDK Tool Rendering (CRITICAL)

**Problem**: Duplicate tool widgets appear in chat (same tool rendered twice)

**Root Cause**: Vercel AI SDK 5 creates TWO message parts for each tool invocation:
1. **Generic part**: `{ type: 'tool-call', toolName: 'planBlogTopics', args: {...} }`
2. **Typed part**: `{ type: 'tool-planBlogTopics', input: {...}, output: {...} }`

If both parts are rendered, users see duplicate widgets for the same tool call.

**Solution** (implemented in `/src/components/chat/UniversalChat.tsx:205-228`):

```typescript
case 'tool-call': {
  // Skip generic tool-call if we have a typed tool part in this message
  // This prevents duplicate rendering when AI SDK creates both types
  const toolName = part.toolName ?? part.toolCall?.toolName;
  const hasTypedPart = message.parts.some((p: any) =>
    p.type === `tool-${toolName}` && p !== part
  );

  if (hasTypedPart) {
    console.log('⏭️ Skipping generic tool-call, typed part exists:', toolName);
    return null;
  }

  // Only render if no typed part exists
  console.log('🔨 Tool call detected (no typed part):', toolName);
  return (
    <Tool key={i} defaultOpen>
      <ToolHeader type={toolName} state="input-available" />
      <ToolContent>
        <ToolInput input={part.args ?? part.toolCall?.args} />
      </ToolContent>
    </Tool>
  );
}
```

**How it works**:
1. When rendering `tool-call` part, check if typed `tool-TOOLNAME` part exists in same message
2. If typed part exists → skip generic part (return `null`)
3. If NO typed part → render generic part with Tool component
4. Typed parts are always rendered via `ToolResultRenderer` component

**Why this happens**:
- AI SDK 5 uses typed parts for better TypeScript support and tool-specific rendering
- Generic `tool-call` exists for backwards compatibility
- Without deduplication, both render simultaneously

**Testing**:
Open browser console and trigger any tool. You should see:
- `⏭️ Skipping generic tool-call, typed part exists: toolName` (for generic part)
- Only ONE widget renders in the UI

This fix applies to ALL tools across all features (blog planner, elementor, etc.) since they all use UniversalChat.tsx.

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

1. **🚨 CRITICAL: Duplicate Tool Rendering (Vercel AI SDK 5)**: The AI SDK creates TWO parts for each tool call - a generic `tool-call` part AND a typed `tool-TOOLNAME` part. If both are rendered, you'll see duplicate widgets in the chat. **Fix**: In UniversalChat.tsx, check if typed part exists before rendering generic part. See "Vercel AI SDK Tool Rendering" section below for full implementation.

2. **Don't use string interpolation for WordPress PHP**: Always use file-based approach

3. **Check `playgroundReady` before WP operations**: Prevents "Playground not running" errors

4. **Use `isset()` not empty checks**: Allows clearing WordPress settings fields

5. **File paths must be absolute**: Next.js requires absolute paths, not relative

6. **Playground.js is vanilla JS**: Not a React component, uses global window functions

7. **Status indicator is fixed at bottom**: z-index 1000, shows across all tabs

8. **Model names include provider prefix**: e.g., `openai/gpt-5` not just `gpt-5`

9. **GrapeJS is client-side only**: Must use dynamic import and 'use client' directive

10. **Global CSS in GrapeJS**: Convert to data URL via `btoa()` before injecting into canvas.styles

11. **Visual ↔ Code sync**: Always update `currentSection` state when switching between editors

12. **Visual Editor blocks panel**: Must append to visible DOM element (not hidden div) to show "+" buttons

13. **WordPress imports use zero padding**: Section and column defaults ensure full-width layouts

14. **Supabase is optional**: See "Supabase Database Setup" section above for authentication pattern and mock client behavior

15. **Documentation standards**: All new docs must follow the "Documentation Standards & Structure" section - use `Main Doc –` prefix, include timestamps, and never delete content without justification


## Hustle API Development Workflow (v3.7.0)

This project uses **@hustle-together/api-dev-tools** for interview-driven, research-first API development.

### Available Commands

| Command | Purpose |
|---------|---------|
| `/hustle-api-create [endpoint]` | Complete 13-phase workflow |
| `/hustle-api-interview [endpoint]` | Questions FROM research findings |
| `/hustle-api-research [library]` | Adaptive propose-approve research |
| `/hustle-api-verify [endpoint]` | Re-research and verify implementation |
| `/hustle-api-env [endpoint]` | Check API keys |
| `/hustle-api-status [endpoint]` | Track progress |
| `/hustle-api-continue [endpoint]` | Resume interrupted workflow |
| `/hustle-api-sessions` | Browse saved session logs |

### 13-Phase Flow

```
Phase 1:  DISAMBIGUATION     - Clarify ambiguous terms before research
Phase 2:  SCOPE              - Confirm understanding of endpoint
Phase 3:  INITIAL RESEARCH   - 2-3 targeted searches (Context7, WebSearch)
Phase 4:  INTERVIEW          - Questions generated FROM discovered params
Phase 5:  DEEP RESEARCH      - Propose additional searches based on answers
Phase 6:  SCHEMA             - Create Zod schema from research + interview
Phase 7:  ENVIRONMENT        - Verify API keys exist
Phase 8:  TDD RED            - Write failing tests from schema
Phase 9:  TDD GREEN          - Minimal implementation to pass tests
Phase 10: VERIFY             - Re-research docs, compare to implementation
Phase 11: TDD REFACTOR       - Clean up code while tests pass
Phase 12: DOCUMENTATION      - Update manifests, cache research
Phase 13: COMPLETION         - Final verification, commit
```

### Key Principles

1. **Loop Until Green** - Every verification phase loops back if not successful
2. **Questions FROM Research** - Never use generic template questions
3. **Adaptive Research** - Propose searches based on context, not shotgun
4. **7-Turn Re-grounding** - Context injected every 7 turns to prevent dilution
5. **Verify After Green** - Re-research to catch memory-based implementation errors

### State Tracking

All progress is tracked in `.claude/api-dev-state.json`:
- Current phase and status for each endpoint
- Interview decisions (injected during implementation)
- Research sources with freshness tracking
- Turn count for re-grounding
- Multi-API support with active endpoint pointer

### Research Cache

Research is cached in `.claude/research/` with 7-day freshness:
- `index.json` - Freshness tracking
- `[api-name]/CURRENT.md` - Latest research
- `[api-name]/sources.json` - Research sources
- `[api-name]/interview.json` - Interview decisions
- `[api-name]/schema.json` - Schema snapshot
- Stale research (>7 days) triggers re-research prompt

### Hooks (25 Total - Automatic Enforcement)

| Hook | Event | Action |
|------|-------|--------|
| `session-startup.py` | SessionStart | Inject state context |
| `detect-interruption.py` | SessionStart | Detect interrupted workflows |
| `enforce-external-research.py` | UserPromptSubmit | Require research first |
| `enforce-disambiguation.py` | PreToolUse | Phase 1 enforcement |
| `enforce-scope.py` | PreToolUse | Phase 2 enforcement |
| `enforce-research.py` | PreToolUse | Phase 3 enforcement |
| `enforce-interview.py` | PreToolUse | Phase 4 - inject decisions |
| `enforce-deep-research.py` | PreToolUse | Phase 5 enforcement |
| `enforce-schema.py` | PreToolUse | Phase 6 enforcement |
| `enforce-environment.py` | PreToolUse | Phase 7 enforcement |
| `enforce-tdd-red.py` | PreToolUse | Phase 8 enforcement |
| `verify-implementation.py` | PreToolUse | Phase 9 helper |
| `enforce-verify.py` | PreToolUse | Phase 10 enforcement |
| `enforce-refactor.py` | PreToolUse | Phase 11 enforcement |
| `enforce-documentation.py` | PreToolUse | Phase 12 enforcement |
| `enforce-questions-sourced.py` | PreToolUse | Validate questions from research |
| `enforce-schema-from-interview.py` | PreToolUse | Validate schema from interview |
| `track-tool-use.py` | PostToolUse | Log research, count turns |
| `periodic-reground.py` | PostToolUse | Re-inject context every 7 turns |
| `track-scope-coverage.py` | PostToolUse | Track implemented vs deferred |
| `verify-after-green.py` | PostToolUse | Trigger Phase 10 after tests pass |
| `cache-research.py` | PostToolUse | Create research cache files |
| `generate-manifest-entry.py` | PostToolUse | Auto-generate API documentation |
| `api-workflow-check.py` | Stop | Block if incomplete, generate output |
| `session-logger.py` | Stop | Save session to api-sessions |

### Auto-Generated Documentation

When Phase 12 completes, `generate-manifest-entry.py` automatically creates:
- **Comprehensive curl examples** (minimal, full, auth, enum variations, boundary values)
- **Complete test cases** (success, validation, required fields, types, boundaries, arrays)
- **Parameter documentation** with all possible values
- **Ready-to-use entries** for `api-tests-manifest.json`

### Usage

```bash
# Full automated workflow
/hustle-api-create my-endpoint

# Manual step-by-step
/hustle-api-research [library]
/hustle-api-interview [endpoint]
/hustle-api-env [endpoint]
/red
/green
/hustle-api-verify [endpoint]
/refactor
/commit
```
