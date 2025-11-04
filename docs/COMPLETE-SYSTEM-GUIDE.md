# Hustle Tools: Complete System Guide

**Version**: 2.0
**Last Updated**: January 2025
**Maintainers**: Development Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Features by Tool](#features-by-tool)
4. [AI Integration](#ai-integration)
5. [Component Library](#component-library)
6. [API Reference](#api-reference)
7. [State Management](#state-management)
8. [File Operations](#file-operations)
9. [WordPress Integration](#wordpress-integration)
10. [Responsive Design System](#responsive-design-system)
11. [Token Management](#token-management)
12. [Development Workflows](#development-workflows)
13. [Deployment](#deployment)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)
16. [Advanced Techniques](#advanced-techniques)

---

## System Overview

Hustle Tools is a comprehensive multi-tool Next.js application providing AI-powered solutions for content creation, web development, and WordPress/Elementor workflow automation.

### Technology Stack

**Frontend**:
- Next.js 15.4.6 with Turbopack
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4
- Radix UI components
- Monaco Editor
- GrapeJS (visual editor)

**AI & ML**:
- Vercel AI SDK 5.0.11
- Multiple LLM providers (Anthropic, OpenAI, Google, Perplexity)
- Tool calling and function execution
- Streaming responses

**Backend**:
- Next.js API routes
- Edge runtime support
- Supabase (optional authentication)
- WordPress Playground (WebAssembly)

**Development**:
- pnpm package manager
- ESLint 9
- Git version control
- Vercel deployment

### Core Capabilities

1. **AI Chat Interfaces** - Multi-model conversational AI
2. **WordPress/Elementor Development** - Browser-based WordPress environment
3. **Visual HTML/CSS Editor** - Drag-and-drop page builder
4. **Code Generation** - AI-powered HTML/CSS/JS creation
5. **Content Planning** - Blog post planning and research
6. **Web Scraping** - Firecrawl integration for content extraction
7. **Image Editing** - AI-powered image manipulation
8. **SEO Tools** - Keyword research and content optimization

---

## Architecture

### Application Structure

```
hustle-tools/
├── src/
│   ├── app/                          # Next.js 15 app directory
│   │   ├── api/                      # API routes (40+ endpoints)
│   │   ├── blog-builder/             # Blog planning tool
│   │   ├── blog-planner/             # Content research tool
│   │   ├── chat/                     # General AI chat
│   │   ├── chat-doc/                 # Document chat
│   │   ├── chat-doc-editor/          # Document editor
│   │   ├── editor/                   # TipTap editor
│   │   ├── elementor-editor/         # Main Elementor tool
│   │   ├── firecrawl/                # Web scraper
│   │   ├── hubspot-converter/        # HubSpot module converter
│   │   ├── image-editor/             # AI image editor
│   │   ├── keyword-research/         # SEO keyword tool
│   │   ├── page-extractor/           # Page content extractor
│   │   ├── test-cartesia/            # Voice synthesis test
│   │   ├── tkx-calendar/             # Calendar management
│   │   ├── voice-chat/               # Voice AI interface
│   │   └── layout.tsx                # Root layout
│   │
│   ├── components/
│   │   ├── ai-elements/              # AI UI components
│   │   │   ├── actions.tsx           # Message actions
│   │   │   ├── blog-builder-tool.tsx # Blog builder UI
│   │   │   ├── conversation.tsx      # Chat container
│   │   │   ├── inner-navigation-bar.tsx # Responsive nav
│   │   │   ├── loader.tsx            # Loading states
│   │   │   ├── markdown-with-citations.tsx # Markdown renderer
│   │   │   ├── message.tsx           # Chat message
│   │   │   ├── MobilePromptActions.tsx # Responsive actions
│   │   │   ├── project-context-badge.tsx # Context indicator
│   │   │   ├── prompt-input.tsx      # Input components
│   │   │   ├── response.tsx          # AI response
│   │   │   ├── source.tsx            # Source citations
│   │   │   └── tool.tsx              # Tool call display
│   │   │
│   │   ├── chat/
│   │   │   └── UniversalChat.tsx     # Unified chat component
│   │   │
│   │   ├── editor/
│   │   │   ├── CommentsPanel.tsx     # Document comments
│   │   │   ├── DocumentChat.tsx      # Chat sidebar
│   │   │   ├── TabbedSidePanel.tsx   # Tabbed UI
│   │   │   └── TiptapEditor.tsx      # Rich text editor
│   │   │
│   │   ├── elementor/                # WordPress/Elementor tools
│   │   │   ├── BrandfetchImporter.tsx # Brand asset import
│   │   │   ├── ChatInterface.tsx     # Elementor chat
│   │   │   ├── ElementorChat.tsx     # Chat component
│   │   │   ├── GenerateProjectModal.tsx # Project creator
│   │   │   ├── HtmlSectionEditor.tsx # Code editor
│   │   │   ├── HtmlSplitter.tsx      # HTML parser
│   │   │   ├── HublPreviewPanel.tsx  # HubL preview
│   │   │   ├── NewGroupDialog.tsx    # File group creator
│   │   │   ├── PageSplitter.tsx      # Page parser
│   │   │   ├── PlaygroundView.tsx    # WordPress iframe
│   │   │   ├── ProjectSidebar.tsx    # File manager
│   │   │   ├── SectionLibrary.tsx    # Section manager
│   │   │   ├── SiteContentManager.tsx # WordPress settings
│   │   │   ├── StyleGuide.tsx        # Global CSS editor
│   │   │   ├── UnifiedStyleKit.tsx   # Style kit editor
│   │   │   ├── UnifiedStyleKitSidebar.tsx # Kit sidebar
│   │   │   └── VisualSectionEditor.tsx # GrapeJS editor
│   │   │
│   │   ├── hubspot/
│   │   │   └── hubspot-module-converter.tsx # HubSpot tool
│   │   │
│   │   ├── layouts/
│   │   │   └── TwoPanelChatLayout.tsx # Resizable layout
│   │   │
│   │   ├── tool-ui/
│   │   │   ├── document-morph-widget.tsx # Doc morphing
│   │   │   └── tool-result-renderer.tsx # Tool output
│   │   │
│   │   └── ui/                       # shadcn/ui components
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── dialog.tsx
│   │       ├── documents-sidebar.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── GoogleFontPicker.tsx
│   │       ├── hover-card.tsx
│   │       ├── label.tsx
│   │       ├── MobileTabBar.tsx
│   │       ├── navbar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── OptionsButton.tsx
│   │       ├── PieChartIcon.tsx
│   │       ├── PromptTokenCounter.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── slider.tsx
│   │       ├── SystemPromptViewer.tsx
│   │       ├── TabWithDropdown.tsx
│   │       ├── textarea.tsx
│   │       └── tooltip.tsx
│   │
│   ├── hooks/
│   │   ├── useEditorContent.ts       # Editor state
│   │   └── useFileGroups.ts          # File management
│   │
│   ├── lib/
│   │   ├── brand-extractor.ts        # Brand analysis
│   │   ├── file-group-manager.ts     # File operations
│   │   ├── generate-doc-system-prompt.ts # Doc prompts
│   │   ├── generate-elementor-system-prompt.ts # Elementor prompts
│   │   ├── global-stylesheet-context.tsx # Global CSS
│   │   ├── hubspot-converter.ts      # HubSpot logic
│   │   ├── project-storage.ts        # LocalStorage
│   │   ├── section-schema.ts         # Section types
│   │   ├── token-validator.ts        # Token counting
│   │   ├── tools.ts                  # AI tools
│   │   ├── utils.ts                  # Utilities
│   │   └── supabase/                 # Auth (optional)
│   │
│   └── middleware.ts                 # Edge middleware
│
├── public/
│   └── playground.js                 # WordPress Playground
│
├── docs/
│   ├── COMPLETE-SYSTEM-GUIDE.md      # This file
│   ├── diff-based-code-editing.md    # Diff editing
│   ├── fire-crawl-docs.md            # Firecrawl
│   ├── grapejs-visual-editor.md      # GrapeJS
│   ├── how-to-make-tools.md          # Tool creation
│   ├── models.md                     # AI models
│   ├── README.md                     # Architecture
│   ├── ui-stack.md                   # UI components
│   └── wordpress-playground-capabilities.md # Playground
│
├── package.json                      # Dependencies
├── pnpm-lock.yaml                    # Lock file
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config
├── next.config.mjs                   # Next.js config
└── .env.local                        # Environment vars
```

### Data Flow

```
User Input → React Component → API Route → AI Provider → Stream Response → UI Update
                ↓                                              ↓
          State Management                            Tool Execution
                ↓                                              ↓
          Local Storage                              Side Effects
```

---

## Features by Tool

### 1. Elementor Section Builder (`/elementor-editor`)

**Purpose**: Comprehensive WordPress/Elementor development environment with browser-based WordPress Playground.

#### Layout Structure

**Two-Panel Layout**:
- **Left Panel (25-60% width)**: AI chat interface
- **Right Panel (40-75% width)**: 6 tabbed views

**Resizable Divider**: Drag to adjust panel widths

#### Tab 1: Code Editor

**Features**:
- Monaco editor with syntax highlighting
- Three code panels: HTML, CSS, JavaScript
- Live preview iframe
- Settings panel (optional)
- Auto-save to project storage
- Undo/redo support

**Code Structure**:
```typescript
interface Section {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  createdAt: string;
  updatedAt: string;
  type: 'section' | 'widget';
}
```

**Key Components**:
- `HtmlSectionEditor.tsx` - Main editor component
- Monaco editor instances for HTML/CSS/JS
- Live preview with iframe sandbox
- Settings toggle for additional controls

**Operations**:
1. Edit HTML structure
2. Write custom CSS
3. Add JavaScript functionality
4. Preview in real-time
5. Save to section library
6. Export to WordPress

#### Tab 2: Visual Editor (GrapeJS)

**Features**:
- Drag-and-drop page builder
- 3-column layout: Blocks | Canvas | Styles
- Pre-built components (text, images, buttons, forms)
- Visual styling (typography, colors, spacing)
- Responsive design preview (desktop/tablet/mobile)
- Bidirectional sync with Code Editor
- CSS cascade inspector

**Architecture**:
```typescript
interface GrapeJSConfig {
  container: string;
  storageManager: false; // No persistence
  panels: {
    defaults: Panel[];
  };
  blockManager: {
    blocks: Block[];
  };
  styleManager: {
    sectors: StyleSector[];
  };
}
```

**Component Library**:
- **Basic**: Text, Image, Video, Map, Link
- **Layout**: Container, Row, Column
- **Forms**: Input, Textarea, Select, Button, Checkbox, Radio
- **Media**: Video embed, YouTube, Vimeo
- **Advanced**: Custom HTML, Script

**Style Manager Sectors**:
1. **Typography**: Font family, size, weight, line height, letter spacing, text align, text transform, text decoration
2. **Dimensions**: Width, height, max-width, max-height, margin, padding
3. **Background**: Color, image, size, position, repeat
4. **Borders**: Width, style, color, radius
5. **Effects**: Box shadow, opacity, transform, transition
6. **Position**: Display, position, top, right, bottom, left, z-index
7. **Flexbox**: Direction, justify-content, align-items, flex-wrap, gap

**Responsive Preview**:
- Desktop (default)
- Tablet (768px)
- Mobile (320px)

**Sync Mechanism**:
```typescript
// Visual → Code
const html = editor.getHtml();
const css = editor.getCss();
updateSection({ html, css });

// Code → Visual
editor.setComponents(section.html);
editor.setStyle(section.css);
```

**Navigation**:
- "Visual Editor" button in Code Editor tab
- "Code View" button in Visual Editor tab
- Seamless state preservation

**CSS Cascade Inspector**:
Shows CSS sources in order of specificity:
1. Inline styles
2. Class styles
3. Global styles (from Style Guide)

#### Tab 3: Section Library

**Features**:
- View all saved sections/widgets
- Drag-and-drop reordering
- Search and filter
- Preview thumbnails
- Duplicate sections
- Delete sections
- Import from template library
- Export to WordPress

**Project Management**:
```typescript
interface FileGroup {
  id: string;
  name: string;
  type: 'section' | 'widget';
  html: string;
  css: string;
  js: string;
  createdAt: string;
  updatedAt: string;
}
```

**Operations**:
1. **Create New**: Open dialog to create section/widget
2. **Edit**: Select section to load in editor
3. **Duplicate**: Clone existing section
4. **Rename**: Update section name
5. **Delete**: Remove from library
6. **Reorder**: Drag to change order
7. **Import**: Add from WordPress template library
8. **Export**: Push to WordPress Playground

**Storage**: LocalStorage with automatic persistence

#### Tab 4: WordPress Playground

**Features**:
- Embedded WordPress instance (WebAssembly)
- Auto-launches on page load
- Full WordPress admin access
- Elementor plugin pre-installed
- Yoast SEO plugin included
- Hello Elementor theme active
- Direct section import
- Live page preview

**Pre-installed Software**:
- WordPress (latest version)
- Elementor (latest)
- Yoast SEO
- Hello Elementor theme

**Operations**:
1. **View WordPress Admin**: Access /wp-admin/
2. **Create Pages**: Add new pages with Elementor
3. **Import Sections**: Push sections from library
4. **Preview Pages**: View live page rendering
5. **Manage Plugins**: Install/activate plugins
6. **Theme Customization**: Modify theme settings

**Import Settings**:
When sections are imported to WordPress:
- `content_width`: 'full'
- `padding`: 0px
- `margin`: 0px
- Ensures full-width layouts without spacing

**Global Functions** (exposed via `window`):
```javascript
// Open WordPress admin in new tab
openPlaygroundDirect();

// Apply site configuration
applySiteConfig({ settings, pages });

// Get WordPress settings
getWordPressSettings();

// Get all pages
getWordPressPages();

// Get Elementor style kit
getElementorStyleKit();

// Set Elementor style kit
setElementorStyleKit(styleKitData);
```

**File-Based JSON Approach**:
```javascript
// Write data to temp file
await client.writeFile('/tmp/data.json', JSON.stringify(data));

// PHP reads from file
const phpCode = `<?php
  $json = file_get_contents('/tmp/data.json');
  $data = json_decode($json, true);
  // Use $data
  @unlink('/tmp/data.json');
?>`;
```

**Why**: Avoids issues with quotes, special characters, and HTML in string interpolation.

#### Tab 5: Site Content Manager

**Features**:
- WordPress settings editor
- Pages CRUD operations
- Comprehensive field support
- Yoast SEO integration
- Custom CSS per page
- Featured image upload
- Menu order management

**WordPress Settings Fields**:
- Site Title
- Tagline
- Site Icon (URL)
- Timezone
- Date Format
- Time Format
- Week Starts On
- Blog Visibility (Search Engine Visibility)
- Posts per Page
- Permalink Structure
- Default Category
- Default Comment Status

**Page Fields**:
- Title
- Slug
- Content (HTML)
- Excerpt
- Status (publish, draft, private)
- Date
- Featured Image URL
- Author
- Template
- Parent Page
- Menu Order
- Comments Enabled
- Pingbacks Enabled
- Custom CSS

**Yoast SEO Fields**:
- Focus Keyword
- Meta Title
- Meta Description
- Canonical URL
- No Index
- No Follow

**Operations**:
1. **Edit Settings**: Update WordPress configuration
2. **Create Page**: Add new page with all fields
3. **Edit Page**: Modify existing page
4. **Delete Page**: Remove page from WordPress
5. **Sync Settings**: Pull current settings from WordPress
6. **Push Settings**: Apply settings to WordPress

**Implementation Notes**:
- Uses `isset()` checks (not empty string checks)
- Allows clearing fields by setting empty strings
- File-based JSON approach for data sync
- Auto-saves on blur/change

#### Tab 6: Style Guide

**Features**:
- Global CSS editor
- Monaco editor with CSS syntax highlighting
- Auto-injection into Visual Editor
- WordPress theme integration
- Typography presets
- Color palette management
- Spacing system

**Global CSS Structure**:
```css
/* Typography */
:root {
  --font-primary: 'Inter', sans-serif;
  --font-heading: 'Playfair Display', serif;
}

/* Colors */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
}

/* Spacing */
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 4rem;
}

/* Custom Classes */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
}
```

**Integration with Visual Editor**:
```typescript
// Inject global CSS into GrapeJS canvas
const globalCss = getGlobalStylesheet();
editor.setStyle(globalCss);
```

**WordPress Integration**:
- Syncs with Elementor Theme Style Kit
- Applies to all pages globally
- Overrides theme defaults

#### Chat Interface (Left Panel)

**Features**:
- Multi-model AI chat (Claude, GPT, Gemini, Perplexity)
- Tool calling support
- Streaming responses
- Project context awareness
- Web search integration
- Image upload (max 3)
- CSS context toggle
- Responsive actions (dropdown on narrow width)

**AI Models Available**:
```typescript
const modelGroups = [
  {
    provider: 'Claude',
    models: [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-1-20250805',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku-20241022'
    ]
  },
  {
    provider: 'OpenAI',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4o', 'o3']
  },
  {
    provider: 'Google',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash-exp']
  },
  {
    provider: 'Perplexity',
    models: ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro']
  }
];
```

**Tool Calls**:

1. **generateHTML** - Triggered by keywords: "generate", "create", "build", "make"
   - Opens modal for description + image upload
   - Analyzes images with Claude Haiku 4.5 vision
   - Streams HTML, CSS, JS sequentially
   - Auto-switches tabs during generation
   - Enforces section-only output (no DOCTYPE, html, head, body tags)

2. **getEditorContent** - Reads current HTML/CSS/JS from editor
   - Returns current section content
   - Used for targeted edits

3. **editCodeWithDiff** - Makes targeted code changes
   - Uses unified diff format (70% fewer tokens)
   - Visual diff preview with Monaco DiffEditor
   - Approval flow: Accept, Reject, Edit Manually
   - Keyboard shortcuts: ⌘↵ (accept), Esc (reject)

4. **updateSection** - Updates section metadata

5. **morphDocument** - Applies inline edits to content
   - Auto-closes chat on mobile after apply

**Context Options**:
- **Project Files**: Include HTML/CSS/JS from current section
- **Style Kit CSS**: Include global stylesheet
- **Web Search**: Enable Perplexity search

**Responsive Behavior**:
- **Wide (>600px)**: Show all action buttons horizontally
- **Narrow (<600px)**: Collapse into 3-dot dropdown menu

**Mobile-Specific**:
- Chat drawer slides up from bottom
- Auto-close on morph apply (optional)
- Z-index: 10000 (highest on page)

#### Chat-to-JSON Workflow (Deprecated)

*Note: This feature has been superseded by direct HTML/CSS/JS generation.*

Previous workflow:
1. Natural language → Intent classification
2. Extract targeted context
3. Generate JSON patch
4. Apply to Elementor structure
5. Maintain undo/redo stack

Current workflow:
1. Natural language → HTML/CSS/JS generation
2. Stream directly to Code Editor
3. Save to section library
4. Import to WordPress

#### Status Indicator

**Location**: Fixed at bottom of screen (z-index: 1000)

**States**:
- "WordPress Playground: Not Started"
- "WordPress Playground: Initializing..."
- "WordPress Playground: Ready" (green)
- "WordPress Playground: Error" (red)

**Updates**: Real-time status from playground.js

### 2. Blog Builder (`/blog-builder`)

**Purpose**: AI-powered content order form generation and blog post planning.

**Features**:
- Blog topic research
- Content outline generation
- Keyword analysis
- Content structure planning
- Multi-model AI support

**Tool Integration**:
- `planBlogTopics` - Generate topic ideas
- `researchTopic` - Deep dive into specific topics
- `generateOutline` - Create content structure
- `analyzeKeywords` - SEO keyword research

**Use Case**: Content marketers planning editorial calendars.

### 3. Blog Planner (`/blog-planner`)

**Purpose**: Comprehensive blog post planning with research and analysis.

**Features**:
- Topic research with web search
- Competitor analysis
- Content brief generation
- SEO optimization recommendations
- Writing guidelines

**AI Tools**:
```typescript
const blogPlannerTools = {
  researchTopic: {
    description: 'Research a blog topic using web search',
    parameters: { topic: string, depth: 'shallow' | 'deep' }
  },
  analyzeCompetitors: {
    description: 'Analyze competitor content',
    parameters: { topic: string, urls: string[] }
  },
  generateBrief: {
    description: 'Create content brief',
    parameters: { topic: string, targetAudience: string }
  }
};
```

**Workflow**:
1. Enter topic
2. Research phase (web search + analysis)
3. Brief generation
4. Outline creation
5. Export to document

### 4. General AI Chat (`/chat`)

**Purpose**: Multi-purpose conversational AI interface.

**Features**:
- Multiple AI models
- Streaming responses
- Web search integration
- Source citations
- Tool calling support

**Models**:
- Claude (Haiku, Sonnet, Opus)
- GPT (4o, 5, o3)
- Gemini (2.0 Flash, 2.5 Pro/Flash)
- Perplexity (Sonar variants)

**Use Cases**:
- General Q&A
- Code generation
- Research assistance
- Content writing
- Problem solving

### 5. Document Chat (`/chat-doc`)

**Purpose**: Chat interface with document context.

**Features**:
- Document upload
- Context-aware responses
- Citation highlighting
- Version history
- Export to PDF

**Document Types Supported**:
- Markdown (.md)
- Plain text (.txt)
- HTML (.html)
- PDF (coming soon)

### 6. Document Editor (`/chat-doc-editor`)

**Purpose**: Rich text editor with AI assistance.

**Features**:
- TipTap rich text editor
- AI writing assistance
- Comment system
- Version control
- Collaboration (coming soon)

**TipTap Extensions**:
- Bold, Italic, Underline, Strikethrough
- Headings (H1-H6)
- Lists (ordered, unordered, task lists)
- Links
- Code blocks with syntax highlighting
- Tables
- Images
- Horizontal rules

**AI Features**:
- Continue writing
- Improve writing
- Summarize
- Translate
- Change tone

### 7. Firecrawl Web Scraper (`/firecrawl`)

**Purpose**: Extract and process website content.

**Features**:
- Site mapping (discover all pages)
- Batch scraping
- Markdown conversion
- Content extraction
- Download as files

**API Integration**:
```typescript
// Map website
const map = await fetch('/api/map', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://example.com' })
});

// Batch scrape
const job = await fetch('/api/batch-scrape/start', {
  method: 'POST',
  body: JSON.stringify({ urls: ['url1', 'url2'] })
});

// Check status
const status = await fetch(`/api/batch-scrape/status/${jobId}`);
```

**Use Cases**:
- Content migration
- Competitive analysis
- Research compilation
- Data extraction

### 8. HubSpot Module Converter (`/hubspot-converter`)

**Purpose**: Convert HTML/CSS to HubSpot modules.

**Features**:
- HTML parsing
- CSS tokenization
- Field generation
- Module manifest creation
- Import instructions

**Conversion Process**:
1. Paste HTML/CSS
2. Parse structure
3. Identify editable elements
4. Generate HubL templates
5. Create field definitions
6. Output module files

**Output**:
- module.html (HubL template)
- fields.json (field definitions)
- module.css (styles)
- module.js (scripts)

### 9. Image Editor (`/image-editor`)

**Purpose**: AI-powered image manipulation.

**Features**:
- Background removal
- Image generation (DALL-E, Gemini)
- Style transfer
- Image upscaling
- Format conversion

**AI Providers**:
- OpenAI DALL-E 3
- Google Gemini Imagen

**Operations**:
```typescript
// Remove background
await fetch('/api/remove-background', {
  method: 'POST',
  body: formData // image file
});

// Generate image
await fetch('/api/generate-image-openai', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'A futuristic city',
    size: '1024x1024',
    quality: 'hd'
  })
});
```

### 10. Keyword Research (`/keyword-research`)

**Purpose**: SEO keyword analysis and research.

**Features**:
- Keyword suggestions
- Search volume data
- Competition analysis
- SERP analysis
- Keyword clustering

**Data Sources**:
- Perplexity API
- Google Search API (optional)
- Internal analysis

### 11. Page Extractor (`/page-extractor`)

**Purpose**: Extract structured data from web pages.

**Features**:
- URL scraping
- HTML parsing
- Content extraction
- Metadata extraction
- Schema.org data

**Use Cases**:
- Content migration
- Data collection
- Research compilation

### 12. Voice Chat (`/voice-chat`)

**Purpose**: Voice-based AI interaction.

**Features**:
- Speech-to-text (Whisper)
- Text-to-speech (Cartesia)
- Voice conversation
- Real-time transcription

**Technologies**:
- OpenAI Whisper (transcription)
- Cartesia (voice synthesis)
- Web Audio API (recording)

**Workflow**:
1. Record audio
2. Transcribe with Whisper
3. Process with AI
4. Synthesize response
5. Play audio

---

## AI Integration

### Vercel AI SDK

The application uses Vercel AI SDK 5.0.11 for unified AI integration.

**Supported Providers**:
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

// Usage
const result = await streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  messages: [...],
  tools: {...}
});
```

### Tool Calling

**Tool Definition**:
```typescript
import { z } from 'zod';
import { tool } from 'ai';

export const generateHTML = tool({
  description: 'Generate HTML section with CSS and JavaScript',
  parameters: z.object({
    description: z.string().describe('Description of the section to generate'),
    images: z.array(z.object({
      url: z.string(),
      analysis: z.string()
    })).optional()
  }),
  execute: async ({ description, images }) => {
    // Generate HTML/CSS/JS
    return { html, css, js };
  }
});
```

**Tool Registration**:
```typescript
// In API route
const result = await streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  messages,
  tools: {
    generateHTML,
    getEditorContent,
    editCodeWithDiff,
    updateSection
  }
});
```

**Tool Rendering**:
```typescript
// In UniversalChat.tsx
{message.parts.map((part) => {
  if (part.type === 'tool-result') {
    return (
      <ToolResultRenderer
        toolResult={{
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.args,
          result: part.result
        }}
      />
    );
  }
})}
```

### Message Part Types

Vercel AI SDK creates two parts for each tool call:

1. **Generic Part**: `{ type: 'tool-call', toolName: 'generateHTML', args: {...} }`
2. **Typed Part**: `{ type: 'tool-generateHTML', input: {...}, output: {...} }`

**Deduplication Pattern**:
```typescript
case 'tool-call': {
  const toolName = part.toolName;
  const hasTypedPart = message.parts.some(p =>
    p.type === `tool-${toolName}` && p !== part
  );

  if (hasTypedPart) {
    return null; // Skip generic, render typed
  }

  return <Tool>...</Tool>;
}
```

### Streaming Responses

**Backend (API Route)**:
```typescript
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages,
    onChunk: ({ chunk }) => {
      console.log('Chunk:', chunk);
    }
  });

  return result.toDataStreamResponse();
}
```

**Frontend (React)**:
```typescript
import { useChat } from '@ai-sdk/react';

const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  onResponse: (response) => {
    console.log('Response started');
  },
  onFinish: (message) => {
    console.log('Response finished:', message);
  }
});
```

### Context Management

**System Prompt Generation**:
```typescript
// For Elementor chat
export function generateElementorSystemPrompt({
  currentSection,
  globalCss,
  includeContext,
  includeCss
}: ContextOptions): string {
  let prompt = `You are an expert web developer specializing in Elementor and WordPress.`;

  if (includeContext && currentSection) {
    prompt += `\n\nCurrent Section:\n${currentSection.html}`;
  }

  if (includeCss && globalCss) {
    prompt += `\n\nGlobal CSS:\n${globalCss}`;
  }

  return prompt;
}
```

**Token Counting**:
```typescript
import { encodingForModel } from 'js-tiktoken';

export function countTokens(text: string, model: string): number {
  const encoding = encodingForModel(model);
  const tokens = encoding.encode(text);
  encoding.free();
  return tokens.length;
}
```

**Context Limits**:
```typescript
const MODEL_CONTEXT_LIMITS = {
  'claude-sonnet-4-5-20250929': 200000,
  'gpt-5': 128000,
  'gemini-2.5-pro': 2000000
};
```

### Web Search Integration

**Perplexity Integration**:
```typescript
// Enable web search in chat
const result = await streamText({
  model: perplexity('sonar'),
  messages,
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'web-search'
  }
});
```

**Source Citations**:
```typescript
// In response
{message.parts.map((part) => {
  if (part.type === 'source-url') {
    return (
      <Source
        href={part.url}
        title={part.title}
      />
    );
  }
})}
```

---

## Component Library

### AI Elements

Located in `src/components/ai-elements/`

#### Conversation Components

**Conversation** - Chat container
```tsx
<Conversation className="flex-1">
  <ConversationContent>
    {/* Messages */}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```

**Message** - Individual message
```tsx
<Message from="user" | "assistant">
  <MessageContent>
    {/* Content */}
  </MessageContent>
</Message>
```

**Response** - AI response with markdown
```tsx
<Response>
  {markdownContent}
</Response>
```

**Loader** - Loading indicator
```tsx
{status === 'streaming' && <Loader />}
```

#### Input Components

**PromptInput** - Input container
```tsx
<PromptInput onSubmit={handleSubmit}>
  <PromptInputTextarea
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Ask me anything..."
  />
  <PromptInputToolbar>
    <PromptInputTools>
      {/* Action buttons */}
    </PromptInputTools>
    <PromptInputSubmit status={status} />
  </PromptInputToolbar>
</PromptInput>
```

**PromptInputButton** - Action button
```tsx
<PromptInputButton
  variant="default" | "ghost"
  onClick={handleClick}
  title="Button title"
>
  <IconComponent />
</PromptInputButton>
```

**MobilePromptActions** - Responsive action buttons
```tsx
<MobilePromptActions
  actions={[
    {
      id: 'web-search',
      label: 'Web Search',
      icon: <GlobeIcon />,
      isActive: webSearch,
      onClick: () => setWebSearch(!webSearch)
    }
  ]}
  breakpoint={600}
  containerWidth={panelWidth}
/>
```

#### Tool Components

**Tool** - Tool call display
```tsx
<Tool defaultOpen>
  <ToolHeader type="generateHTML" state="output-available" />
  <ToolContent>
    <ToolInput input={args} />
    <ToolOutput output={result} />
  </ToolContent>
</Tool>
```

**ToolResultRenderer** - Custom tool widgets
```tsx
<ToolResultRenderer
  toolResult={{
    toolCallId: string,
    toolName: string,
    args: object,
    result: any
  }}
  onStreamUpdate={handleUpdate}
/>
```

#### Source Components

**Sources** - Source citations
```tsx
<Sources>
  <SourcesTrigger count={sourceCount} />
  <SourcesContent>
    {sources.map(source => (
      <Source
        key={source.url}
        href={source.url}
        title={source.title}
      />
    ))}
  </SourcesContent>
</Sources>
```

#### Navigation Components

**NavigationBar** - Responsive navigation
```tsx
<NavigationBar
  tabs={[
    { id: 'code', label: 'Code Editor', icon: <Code /> },
    { id: 'visual', label: 'Visual Editor', icon: <Eye /> }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  containerWidth={panelWidth} // For responsive behavior
/>
```

**Properties**:
- `tabs`: Array of tab objects
- `activeTab`: Current active tab ID
- `onTabChange`: Tab change handler
- `containerWidth`: Panel width for responsive breakpoints
- `showOnDesktop`: Show on desktop (default: true)
- `showOnMobile`: Show on mobile (default: true)
- `dimmed`: Dim appearance

**Breakpoints**:
- Panel mode: 450px (mobile), 600px (compact)
- Window mode: 768px (mobile), 1024px (compact)

### Layout Components

#### TwoPanelChatLayout

**Purpose**: Resizable two-panel layout for chat + content.

**Usage**:
```tsx
<TwoPanelChatLayout
  leftPanel={<ChatInterface />}
  rightPanel={<ContentArea />}
  defaultSplitPercent={40}
  minLeftPercent={25}
  maxLeftPercent={75}
  navigationBarProps={{
    tabs: [...],
    activeTab: activeTab,
    onTabChange: setActiveTab
  }}
  navigationBarPosition="right"
/>
```

**Features**:
- Draggable divider
- Percentage-based widths
- Min/max constraints
- ResizeObserver for width tracking
- Passes containerWidth to NavigationBar

**Width Measurement**:
```typescript
const [leftPanelPixelWidth, setLeftPanelPixelWidth] = useState(0);
const leftPanelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!leftPanelRef.current) return;

  const observer = new ResizeObserver(() => {
    setLeftPanelPixelWidth(leftPanelRef.current!.offsetWidth);
  });

  observer.observe(leftPanelRef.current);
  return () => observer.disconnect();
}, []);
```

### UI Components (shadcn/ui)

Located in `src/components/ui/`

#### Button
```tsx
<Button variant="default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
        size="default" | "sm" | "lg" | "icon">
  Click Me
</Button>
```

#### Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### DropdownMenu
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleClick}>
      Item 1
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Select
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Textarea
```tsx
<Textarea
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### Tooltip
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button>Hover me</Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Tooltip text</p>
  </TooltipContent>
</Tooltip>
```

---

## API Reference

### Chat Endpoints

#### POST `/api/chat`
General chat endpoint with multi-model support.

**Request**:
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model: string; // e.g., 'anthropic/claude-sonnet-4-5-20250929'
}
```

**Response**: Streaming data stream

**Example**:
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'anthropic/claude-sonnet-4-5-20250929'
  })
});
```

#### POST `/api/chat-elementor`
Elementor-specific chat with tool support.

**Additional Parameters**:
```typescript
{
  currentSection?: Section;
  globalCss?: string;
  includeContext?: boolean;
  includeCss?: boolean;
}
```

**Tools**:
- `generateHTML`
- `getEditorContent`
- `editCodeWithDiff`
- `updateSection`

#### POST `/api/chat-doc`
Document chat with context.

**Parameters**:
```typescript
{
  messages: Message[];
  document?: {
    content: string;
    metadata: object;
  };
}
```

### Generation Endpoints

#### POST `/api/generate-html`
Generate HTML section from description.

**Request**:
```typescript
{
  description: string;
  images?: Array<{ url: string; filename: string }>;
  model?: string;
}
```

**Response**: Streaming HTML/CSS/JS

#### POST `/api/generate-css`
Generate CSS from description.

**Request**:
```typescript
{
  description: string;
  html?: string; // Optional HTML context
}
```

**Response**: CSS code

#### POST `/api/generate-stylekit`
Generate Elementor style kit.

**Request**:
```typescript
{
  brandDescription: string;
}
```

**Response**:
```typescript
{
  colors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  typography: {
    primary: string;
    secondary: string;
  };
}
```

### Image Endpoints

#### POST `/api/generate-image-openai`
Generate image with DALL-E.

**Request**:
```typescript
{
  prompt: string;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
}
```

**Response**:
```typescript
{
  url: string;
}
```

#### POST `/api/remove-background`
Remove image background.

**Request**: FormData with image file

**Response**: Image buffer

#### POST `/api/edit-image-gemini`
Edit image with Gemini.

**Request**:
```typescript
{
  imageUrl: string;
  prompt: string;
}
```

**Response**: Edited image URL

### Scraping Endpoints

#### POST `/api/map`
Map website structure.

**Request**:
```typescript
{
  url: string;
  maxPages?: number;
}
```

**Response**:
```typescript
{
  pages: Array<{
    url: string;
    title: string;
  }>;
}
```

#### POST `/api/batch-scrape/start`
Start batch scraping job.

**Request**:
```typescript
{
  urls: string[];
  format?: 'markdown' | 'html' | 'text';
}
```

**Response**:
```typescript
{
  jobId: string;
  status: 'pending';
}
```

#### GET `/api/batch-scrape/status/[jobId]`
Check scraping job status.

**Response**:
```typescript
{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: Array<{
    url: string;
    content: string;
  }>;
}
```

### WordPress Playground Endpoints

#### POST `/api/get-wordpress-stylesheet`
Get global CSS from WordPress theme.

**Response**:
```typescript
{
  css: string;
}
```

#### POST `/api/get-system-prompt`
Get system prompt with context.

**Request**:
```typescript
{
  feature: 'elementor' | 'document';
  currentSection?: Section;
  globalCss?: string;
  includeContext?: boolean;
  includeCss?: boolean;
}
```

**Response**:
```typescript
{
  systemPrompt: string;
  tokenCount: number;
}
```

### Utility Endpoints

#### POST `/api/analyze-brand`
Analyze brand from URL.

**Request**:
```typescript
{
  url: string;
}
```

**Response**:
```typescript
{
  name: string;
  colors: string[];
  fonts: string[];
  logo: string;
}
```

#### POST `/api/search-docs`
Search documentation.

**Request**:
```typescript
{
  query: string;
  limit?: number;
}
```

**Response**:
```typescript
{
  results: Array<{
    title: string;
    content: string;
    url: string;
  }>;
}
```

---

## State Management

### Local Storage

**File Groups** (Sections/Widgets):
```typescript
// Save
localStorage.setItem('fileGroups', JSON.stringify(groups));

// Load
const groups = JSON.parse(localStorage.getItem('fileGroups') || '[]');
```

**Structure**:
```typescript
interface FileGroupsState {
  groups: FileGroup[];
  activeGroupId: string | null;
  lastModified: string;
}
```

**Operations**:
```typescript
// Add group
const newGroup = {
  id: uuid(),
  name: 'New Section',
  type: 'section',
  html: '',
  css: '',
  js: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
groups.push(newGroup);
localStorage.setItem('fileGroups', JSON.stringify(groups));

// Update group
const index = groups.findIndex(g => g.id === groupId);
groups[index] = { ...groups[index], ...updates };
localStorage.setItem('fileGroups', JSON.stringify(groups));

// Delete group
const filtered = groups.filter(g => g.id !== groupId);
localStorage.setItem('fileGroups', JSON.stringify(groups));
```

### React State Hooks

**useFileGroups**:
```typescript
export function useFileGroups() {
  const [state, setState] = useState<FileGroupsState>(() => {
    if (typeof window === 'undefined') return initialState;
    return loadFromStorage();
  });

  const addGroup = (group: FileGroup) => {
    setState(prev => ({
      ...prev,
      groups: [...prev.groups, group]
    }));
  };

  const updateGroup = (id: string, updates: Partial<FileGroup>) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === id ? { ...g, ...updates } : g
      )
    }));
  };

  const deleteGroup = (id: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== id)
    }));
  };

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return { state, addGroup, updateGroup, deleteGroup };
}
```

**useEditorContent**:
```typescript
export function useEditorContent(initialContent: Section) {
  const [content, setContent] = useState(initialContent);
  const [history, setHistory] = useState<Section[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateContent = (updates: Partial<Section>) => {
    const newContent = { ...content, ...updates };
    setContent(newContent);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  return { content, updateContent, undo, redo, canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 };
}
```

### Global Context

**GlobalStylesheetContext**:
```typescript
interface GlobalStylesheetContextValue {
  globalCss: string;
  setGlobalCss: (css: string) => void;
  designSystemSummary: string;
}

export function GlobalStylesheetProvider({ children }) {
  const [globalCss, setGlobalCss] = useState('');

  const designSystemSummary = useMemo(() => {
    // Parse CSS to extract design system info
    return generateSummary(globalCss);
  }, [globalCss]);

  return (
    <GlobalStylesheetContext.Provider value={{ globalCss, setGlobalCss, designSystemSummary }}>
      {children}
    </GlobalStylesheetContext.Provider>
  );
}
```

**Usage**:
```typescript
const { globalCss, setGlobalCss } = useGlobalStylesheet();
```

---

## File Operations

### File Group Manager

**Location**: `src/lib/file-group-manager.ts`

**Operations**:

#### Create Group
```typescript
export function createFileGroup(name: string, type: 'section' | 'widget'): FileGroup {
  return {
    id: uuid(),
    name,
    type,
    html: '',
    css: '',
    js: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

#### Load Groups
```typescript
export function loadFileGroups(): FileGroup[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem('fileGroups');
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse file groups:', error);
    return [];
  }
}
```

#### Save Groups
```typescript
export function saveFileGroups(groups: FileGroup[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('fileGroups', JSON.stringify(groups));
  } catch (error) {
    console.error('Failed to save file groups:', error);
  }
}
```

#### Export Group
```typescript
export function exportFileGroup(group: FileGroup): Blob {
  const data = {
    id: group.id,
    name: group.name,
    type: group.type,
    html: group.html,
    css: group.css,
    js: group.js,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  };

  return new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
}
```

#### Import Group
```typescript
export async function importFileGroup(file: File): Promise<FileGroup> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Validate structure
  if (!data.name || !data.type) {
    throw new Error('Invalid file group format');
  }

  return {
    ...data,
    id: uuid(), // Generate new ID
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

### Project Storage

**Location**: `src/lib/project-storage.ts`

**Features**:
- Auto-save on change
- Debounced saves
- Export/import
- Backup/restore

**Implementation**:
```typescript
export class ProjectStorage {
  private static STORAGE_KEY = 'hustle-tools-projects';
  private static saveTimeout: NodeJS.Timeout | null = null;

  static save(project: Project): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      const projects = this.loadAll();
      const index = projects.findIndex(p => p.id === project.id);

      if (index >= 0) {
        projects[index] = project;
      } else {
        projects.push(project);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }, 500); // Debounce 500ms
  }

  static loadAll(): Project[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static load(id: string): Project | null {
    const projects = this.loadAll();
    return projects.find(p => p.id === id) || null;
  }

  static delete(id: string): void {
    const projects = this.loadAll().filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
  }

  static export(id: string): Blob {
    const project = this.load(id);
    if (!project) throw new Error('Project not found');

    return new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json'
    });
  }

  static async import(file: File): Promise<Project> {
    const text = await file.text();
    const project = JSON.parse(text);

    // Generate new ID to avoid conflicts
    project.id = uuid();
    project.createdAt = new Date().toISOString();

    this.save(project);
    return project;
  }
}
```

---

## WordPress Integration

### WordPress Playground

**Location**: `/public/playground.js`

**Technology**: WebAssembly PHP + SQLite

**Blueprint**:
```javascript
const blueprint = {
  landingPage: '/wp-admin/',
  preferredVersions: {
    php: '8.0',
    wp: 'latest'
  },
  steps: [
    {
      step: 'login',
      username: 'admin',
      password: 'password'
    },
    {
      step: 'installPlugin',
      pluginData: {
        resource: 'wordpress.org/plugins',
        slug: 'elementor'
      },
      options: { activate: true }
    },
    {
      step: 'installPlugin',
      pluginData: {
        resource: 'wordpress.org/plugins',
        slug: 'wordpress-seo'
      },
      options: { activate: true }
    },
    {
      step: 'installTheme',
      themeData: {
        resource: 'wordpress.org/themes',
        slug: 'hello-elementor'
      },
      options: { activate: true }
    }
  ]
};
```

### Global Functions

**openPlaygroundDirect()**:
```javascript
function openPlaygroundDirect() {
  if (!playgroundClient) {
    console.error('Playground not initialized');
    return;
  }

  const playgroundWindow = window.open('about:blank', '_blank');
  playgroundWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head><title>WordPress Playground</title></head>
      <body style="margin:0;overflow:hidden;">
        <iframe src="${playgroundUrl}/wp-admin/"
                style="width:100%;height:100vh;border:none;">
        </iframe>
      </body>
    </html>
  `);
}
```

**applySiteConfig(config)**:
```javascript
async function applySiteConfig(config) {
  const { settings, pages } = config;

  // Write config to temp file
  await playgroundClient.writeFile(
    '/tmp/site-config.json',
    JSON.stringify(config)
  );

  // Apply settings via PHP
  const phpCode = `<?php
    require_once 'wordpress/wp-load.php';

    $config = json_decode(file_get_contents('/tmp/site-config.json'), true);

    // Update settings
    foreach ($config['settings'] as $key => $value) {
      update_option($key, $value);
    }

    // Update/create pages
    foreach ($config['pages'] as $page) {
      if (isset($page['ID'])) {
        wp_update_post($page);
      } else {
        wp_insert_post($page);
      }
    }

    @unlink('/tmp/site-config.json');
    echo 'Settings applied successfully';
  ?>`;

  await playgroundClient.run({ code: phpCode });
}
```

**getWordPressSettings()**:
```javascript
async function getWordPressSettings() {
  const phpCode = `<?php
    require_once 'wordpress/wp-load.php';

    $settings = [
      'blogname' => get_option('blogname'),
      'blogdescription' => get_option('blogdescription'),
      'siteurl' => get_option('siteurl'),
      'home' => get_option('home'),
      'timezone_string' => get_option('timezone_string'),
      'date_format' => get_option('date_format'),
      'time_format' => get_option('time_format'),
      'start_of_week' => get_option('start_of_week'),
      'blog_public' => get_option('blog_public'),
      'posts_per_page' => get_option('posts_per_page'),
      'permalink_structure' => get_option('permalink_structure'),
      'default_category' => get_option('default_category'),
      'default_comment_status' => get_option('default_comment_status')
    ];

    echo json_encode($settings);
  ?>`;

  const response = await playgroundClient.run({ code: phpCode });
  return JSON.parse(response.text);
}
```

**getWordPressPages()**:
```javascript
async function getWordPressPages() {
  const phpCode = `<?php
    require_once 'wordpress/wp-load.php';

    $pages = get_posts([
      'post_type' => 'page',
      'posts_per_page' => -1,
      'post_status' => 'any'
    ]);

    $result = array_map(function($page) {
      return [
        'ID' => $page->ID,
        'post_title' => $page->post_title,
        'post_name' => $page->post_name,
        'post_content' => $page->post_content,
        'post_excerpt' => $page->post_excerpt,
        'post_status' => $page->post_status,
        'post_date' => $page->post_date,
        'post_modified' => $page->post_modified,
        'menu_order' => $page->menu_order,
        'post_parent' => $page->post_parent,
        'comment_status' => $page->comment_status,
        'ping_status' => $page->ping_status
      ];
    }, $pages);

    echo json_encode($result);
  ?>`;

  const response = await playgroundClient.run({ code: phpCode });
  return JSON.parse(response.text);
}
```

**saveSectionToTemplateLibrary(section)**:
```javascript
async function saveSectionToTemplateLibrary(section) {
  // Write section data to temp file
  await playgroundClient.writeFile(
    '/tmp/section-data.json',
    JSON.stringify(section)
  );

  const phpCode = `<?php
    require_once 'wordpress/wp-load.php';

    $section = json_decode(file_get_contents('/tmp/section-data.json'), true);

    // Create Elementor template
    $template_id = wp_insert_post([
      'post_title' => $section['name'],
      'post_type' => 'elementor_library',
      'post_status' => 'publish'
    ]);

    // Set template type
    update_post_meta($template_id, '_elementor_template_type', 'section');

    // Convert HTML to Elementor structure
    $elementor_data = [
      [
        'id' => uniqid(),
        'elType' => 'section',
        'settings' => [
          'content_width' => 'full',
          'padding' => ['top' => 0, 'right' => 0, 'bottom' => 0, 'left' => 0],
          'margin' => ['top' => 0, 'right' => 0, 'bottom' => 0, 'left' => 0]
        ],
        'elements' => [
          [
            'id' => uniqid(),
            'elType' => 'column',
            'settings' => [
              'padding' => ['top' => 0, 'right' => 0, 'bottom' => 0, 'left' => 0],
              'margin' => ['top' => 0, 'right' => 0, 'bottom' => 0, 'left' => 0]
            ],
            'elements' => [
              [
                'id' => uniqid(),
                'elType' => 'widget',
                'widgetType' => 'html',
                'settings' => [
                  'html' => $section['html']
                ]
              ]
            ]
          ]
        ]
      ]
    ];

    update_post_meta($template_id, '_elementor_data', json_encode($elementor_data));

    // Save custom CSS
    update_post_meta($template_id, '_elementor_page_settings', [
      'custom_css' => $section['css']
    ]);

    @unlink('/tmp/section-data.json');
    echo $template_id;
  ?>`;

  const response = await playgroundClient.run({ code: phpCode });
  return parseInt(response.text);
}
```

### Import Settings

**Section Import Defaults**:
```javascript
{
  content_width: 'full',
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
}
```

**Column Import Defaults**:
```javascript
{
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
}
```

**Why**: Ensures imported sections take full width without unwanted spacing.

---

## Responsive Design System

### Breakpoint Strategy

**Window-Based** (full screen):
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Panel-Based** (resizable containers):
- Mobile: < 450px
- Compact: 450px - 600px
- Wide: > 600px

### Component Responsive Behavior

#### NavigationBar

**States**:
1. **Mobile** (< 450px panel / < 768px window)
   - Hamburger menu
   - Vertical tab list
   - Full-width dropdowns

2. **Compact** (450-600px panel / 768-1024px window)
   - Horizontal tabs
   - Condensed spacing
   - Icon + text labels

3. **Wide** (> 600px panel / > 1024px window)
   - Full horizontal tabs
   - Standard spacing
   - All features visible

**Implementation**:
```typescript
useEffect(() => {
  const checkSize = () => {
    const width = containerWidth || window.innerWidth;
    const isUsingContainerWidth = containerWidth !== undefined && containerWidth > 0;
    const mobileBreakpoint = isUsingContainerWidth ? 450 : 768;
    const compactBreakpoint = isUsingContainerWidth ? 600 : 1024;

    setIsMobile(width < mobileBreakpoint);
    setIsCompactMode(width >= mobileBreakpoint && width < compactBreakpoint);
  };

  checkSize();

  if (!containerWidth) {
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }
}, [containerWidth]);
```

#### MobilePromptActions

**States**:
1. **Narrow** (< 600px)
   - 3-dot dropdown menu
   - All actions in menu
   - Checkmark for active state

2. **Wide** (> 600px)
   - Horizontal button row
   - Individual action buttons
   - Active state via variant

**Implementation**:
```typescript
const effectiveWidth = containerWidth || windowWidth;
const isNarrow = effectiveWidth > 0 && effectiveWidth < 600;

if (isNarrow) {
  return (
    <DropdownMenu>
      {/* Dropdown implementation */}
    </DropdownMenu>
  );
}

return (
  <div className="flex gap-1">
    {actions.map(action => (
      <PromptInputButton
        variant={action.isActive ? 'default' : 'ghost'}
        onClick={action.onClick}
      >
        {action.icon}
      </PromptInputButton>
    ))}
  </div>
);
```

#### TwoPanelChatLayout

**Mobile** (< 768px):
- Single panel (chat drawer from bottom)
- Overlay layout
- Swipe gestures

**Desktop**:
- Two-panel side-by-side
- Resizable divider
- Percentage-based widths

**Implementation**:
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

if (isMobile) {
  return (
    <div className="mobile-layout">
      {/* Chat drawer */}
      <div className={cn('chat-drawer', { open: drawerOpen })}>
        {leftPanel}
      </div>
      {/* Content */}
      <div className="content-full">
        {rightPanel}
      </div>
    </div>
  );
}

return (
  <div className="desktop-layout flex">
    <div style={{ width: `${leftPanelWidth}%` }}>
      {leftPanel}
    </div>
    <div className="divider" onMouseDown={handleResize} />
    <div style={{ width: `${100 - leftPanelWidth}%` }}>
      {rightPanel}
    </div>
  </div>
);
```

### Z-Index Hierarchy

```
10000 - Mobile chat drawer (highest)
9999  - Mobile chat drawer overlay
6000  - NavigationBar dropdowns
5000  - NavigationBar backdrop
3000  - Modals/dialogs
2000  - Tooltips
1000  - Status indicators
100   - Sticky headers
1     - Default content
```

### Responsive Utilities

**useMediaQuery Hook**:
```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

**Container Width Hook**:
```typescript
export function useContainerWidth(ref: RefObject<HTMLElement>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

// Usage
const containerRef = useRef<HTMLDivElement>(null);
const width = useContainerWidth(containerRef);
```

---

## Token Management

### Token Counting

**Library**: `js-tiktoken`

**Implementation**:
```typescript
import { encodingForModel } from 'js-tiktoken';

export function countTokens(text: string, model: string): number {
  try {
    const encoding = encodingForModel(getBaseModel(model));
    const tokens = encoding.encode(text);
    encoding.free(); // Important: free memory
    return tokens.length;
  } catch (error) {
    console.error('Token counting error:', error);
    return Math.ceil(text.length / 4); // Fallback estimate
  }
}

function getBaseModel(model: string): string {
  if (model.includes('gpt-4')) return 'gpt-4';
  if (model.includes('gpt-3.5')) return 'gpt-3.5-turbo';
  return 'gpt-4'; // Default
}
```

### Context Limits

```typescript
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Claude
  'claude-sonnet-4-5-20250929': 200000,
  'claude-opus-4-1-20250805': 200000,
  'claude-haiku-4-5-20251001': 200000,

  // OpenAI
  'gpt-5': 128000,
  'gpt-5-mini': 128000,
  'gpt-4o': 128000,
  'o3': 128000,

  // Google
  'gemini-2.5-pro': 2000000,
  'gemini-2.5-flash': 1000000,

  // Perplexity
  'sonar': 127000,
  'sonar-pro': 127000
};
```

### PromptTokenCounter Component

**Features**:
- Real-time token counting
- Context limit display
- Warning states
- Image token estimation
- Breakdown view

**Usage**:
```tsx
<PromptTokenCounter
  prompt={inputText}
  systemPrompt={systemPrompt}
  contextLimit={128000}
  conversationTokens={existingTokens}
  onSendDisabled={(disabled) => setSendDisabled(disabled)}
  showDetails={true}
  model="gpt-5"
  attachedImage={imageFile}
/>
```

**Implementation**:
```typescript
export function PromptTokenCounter({
  prompt,
  systemPrompt,
  contextLimit,
  conversationTokens,
  onSendDisabled,
  showDetails,
  model,
  attachedImage
}: PromptTokenCounterProps) {
  const promptTokens = countTokens(prompt, model);
  const systemTokens = countTokens(systemPrompt, model);
  const imageTokens = attachedImage ? estimateImageTokens(attachedImage, model) : 0;

  const totalTokens = promptTokens + systemTokens + conversationTokens + imageTokens;
  const remainingTokens = contextLimit - totalTokens;
  const percentUsed = (totalTokens / contextLimit) * 100;

  const warningState =
    percentUsed >= 95 ? 'critical' :
    percentUsed >= 85 ? 'warning' :
    percentUsed >= 75 ? 'caution' : 'normal';

  useEffect(() => {
    onSendDisabled?.(warningState === 'critical');
  }, [warningState, onSendDisabled]);

  return (
    <div className={cn('token-counter', warningState)}>
      <div className="token-bar">
        <div className="token-fill" style={{ width: `${percentUsed}%` }} />
      </div>
      <div className="token-info">
        <span>{totalTokens.toLocaleString()} / {contextLimit.toLocaleString()}</span>
        {showDetails && (
          <div className="token-breakdown">
            <div>System: {systemTokens.toLocaleString()}</div>
            <div>Conversation: {conversationTokens.toLocaleString()}</div>
            <div>Current: {promptTokens.toLocaleString()}</div>
            {imageTokens > 0 && <div>Image: {imageTokens.toLocaleString()}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Image Token Estimation

```typescript
export function estimateImageTokens(
  image: { file: File; preview: string },
  model: string
): number {
  const isHighRes = model.includes('gpt') && model.includes('vision');

  // Base tokens
  let tokens = 85; // Fixed cost

  // Size-based calculation
  const width = image.file.width || 1024;
  const height = image.file.height || 1024;

  if (isHighRes) {
    // High-res: 170 tokens per 512x512 tile
    const tiles = Math.ceil(width / 512) * Math.ceil(height / 512);
    tokens += tiles * 170;
  } else {
    // Low-res: fixed 85 tokens
    tokens = 85;
  }

  return tokens;
}
```

### AI-Powered Summarization

**When**: Conversation exceeds 75% of context limit

**Provider**: Google Gemini 2.5 Flash (cheap + fast)

**Endpoint**: `/api/summarize-conversation`

**Process**:
1. Detect context limit warning
2. Call summarization API
3. Replace old messages with summary
4. Keep recent messages intact
5. Update token count

**Implementation**:
```typescript
async function summarizeConversation(messages: Message[]): Promise<Message[]> {
  // Keep last 3 messages
  const recentMessages = messages.slice(-3);
  const oldMessages = messages.slice(0, -3);

  // Summarize old messages
  const response = await fetch('/api/summarize-conversation', {
    method: 'POST',
    body: JSON.stringify({ messages: oldMessages })
  });

  const { summary } = await response.json();

  // Create summary message
  const summaryMessage: Message = {
    role: 'system',
    content: `Conversation summary: ${summary}`
  };

  return [summaryMessage, ...recentMessages];
}
```

---

## Development Workflows

### Local Development

**Start Development Server**:
```bash
pnpm dev
```

**Environment Variables** (`.env.local`):
```
# Required
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Optional (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Port**: `http://localhost:3000` (or next available)

**Hot Module Replacement**: Turbopack for instant updates

### Git Workflow

**Branch Strategy**:
- `main` - Production branch
- `staging` - Pre-production testing
- `development` - Active development
- `claude/*` - AI assistant working branches

**Commit Message Format**:
```
type: short description

Detailed description of changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructure
- `test` - Tests
- `chore` - Maintenance

**Example**:
```
feat: add responsive prompt actions with dropdown

- Created MobilePromptActions component
- Collapses buttons into dropdown at 600px breakpoint
- Added containerWidth prop support
- Integrated with ElementorChat

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Code Generation

**New AI Tool**:

1. Define tool in `src/lib/tools.ts`:
```typescript
export const myNewTool = tool({
  description: 'Description of what the tool does',
  parameters: z.object({
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional()
  }),
  execute: async ({ param1, param2 }) => {
    // Implementation
    return { result: 'success' };
  }
});
```

2. Add to API route tools object:
```typescript
// In src/app/api/chat/route.ts
const result = await streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  messages,
  tools: {
    myNewTool,
    // ... other tools
  }
});
```

3. (Optional) Create custom widget in `src/components/tool-ui/tool-result-renderer.tsx`:
```typescript
case 'myNewTool':
  return (
    <MyNewToolWidget
      result={toolResult.result}
      args={toolResult.args}
    />
  );
```

**New API Route**:

1. Create file in `src/app/api/my-route/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Process request
    const result = await processData(body);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

2. Call from frontend:
```typescript
const response = await fetch('/api/my-route', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

const result = await response.json();
```

**New UI Component**:

1. Create file in `src/components/ui/my-component.tsx`:
```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'base-styles',
          variant === 'outline' && 'outline-styles',
          className
        )}
        {...props}
      />
    );
  }
);

MyComponent.displayName = 'MyComponent';
```

2. Use in application:
```tsx
import { MyComponent } from '@/components/ui/my-component';

<MyComponent variant="outline">Content</MyComponent>
```

### Testing

**Manual Testing**:
1. Start dev server
2. Navigate to feature
3. Test functionality
4. Check console for errors
5. Test responsive behavior
6. Test edge cases

**Browser Testing**:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Android)

**Debugging**:
```typescript
// Add console logs
console.log('Debug:', { variable, state });

// Use debugger
debugger;

// React DevTools
// Inspect component props and state
```

---

## Deployment

### Vercel Deployment

**Automatic Deployment**:
- Push to `main` → Production
- Push to `staging` → Staging environment
- Push to `development` → Development preview

**Manual Deployment**:
```bash
vercel --prod
```

**Environment Variables**:
Set in Vercel dashboard under Project Settings → Environment Variables

**Build Settings**:
- Framework: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

### Performance Optimization

**Code Splitting**:
```typescript
// Dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

**Image Optimization**:
```tsx
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  quality={85}
/>
```

**Font Optimization**:
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});
```

**API Route Optimization**:
```typescript
// Enable Edge Runtime for faster cold starts
export const runtime = 'edge';

// Or Node.js runtime for full Node.js features
export const runtime = 'nodejs';
```

---

## Troubleshooting

### Common Issues

#### 1. Build Errors

**Problem**: Module not found errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

#### 2. TypeScript Errors

**Problem**: Type errors in components

**Solution**:
```bash
# Check types
pnpm tsc --noEmit

# Fix auto-fixable issues
pnpm tsc --noEmit --incremental false
```

#### 3. Dependency Conflicts

**Problem**: Package version conflicts

**Solution**:
```json
// In package.json
{
  "pnpm": {
    "overrides": {
      "package-name": "specific-version"
    }
  }
}
```

**Example** (from our entities fix):
```json
{
  "pnpm": {
    "overrides": {
      "entities": "^4.5.0",
      "parse5@7.3.0": "7.2.1",
      "htmlparser2": "^9.1.0"
    }
  }
}
```

#### 4. WordPress Playground Not Loading

**Problem**: Playground stuck on initialization

**Solution**:
1. Check browser console for errors
2. Clear browser cache
3. Check `playground.js` loaded correctly
4. Verify CORS settings
5. Try different browser

#### 5. Token Limit Exceeded

**Problem**: Context limit errors from AI

**Solution**:
1. Enable summarization (automatic at 75%)
2. Reduce system prompt length
3. Clear conversation history
4. Switch to higher-context model

#### 6. Responsive Layout Issues

**Problem**: Components not responding to container width

**Solution**:
```typescript
// Ensure containerWidth is passed
<NavigationBar
  {...props}
  containerWidth={measuredWidth} // Must be provided
/>

// Ensure ResizeObserver is working
useEffect(() => {
  if (!ref.current) return;

  const observer = new ResizeObserver(() => {
    setWidth(ref.current!.offsetWidth);
  });

  observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

### Debug Mode

**Enable Debug Logging**:
```typescript
// In component
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { state, props });
}
```

**API Route Debugging**:
```typescript
// In API route
export async function POST(req: Request) {
  console.log('Request:', {
    url: req.url,
    headers: req.headers,
    body: await req.json()
  });

  // ... rest of handler
}
```

**React DevTools**:
1. Install React DevTools browser extension
2. Open DevTools
3. Navigate to Components tab
4. Inspect props/state/hooks

---

## Advanced Techniques

### Custom Hooks

**useDebounce**:
```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  performSearch(debouncedSearch);
}, [debouncedSearch]);
```

**useLocalStorage**:
```typescript
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Usage
const [user, setUser] = useLocalStorage('user', { name: '', email: '' });
```

**useKeyPress**:
```typescript
export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) setKeyPressed(true);
    };

    const upHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) setKeyPressed(false);
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}

// Usage
const enterPressed = useKeyPress('Enter');

useEffect(() => {
  if (enterPressed) {
    handleSubmit();
  }
}, [enterPressed]);
```

### Performance Patterns

**React.memo**:
```typescript
export const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
  onUpdate
}: ExpensiveComponentProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

**useMemo**:
```typescript
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);
```

**useCallback**:
```typescript
const handleClick = useCallback(() => {
  performAction(id);
}, [id]);
```

**Virtual Scrolling**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Error Boundaries

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Security Best Practices

**API Key Protection**:
```typescript
// Never expose API keys in client-side code
// ❌ Bad
const apiKey = 'sk-1234...';

// ✅ Good - use server-side API routes
export async function POST(req: Request) {
  const apiKey = process.env.API_KEY; // Server-side only
  // Make API call
}
```

**Input Sanitization**:
```typescript
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title']
  });
}
```

**XSS Prevention**:
```tsx
// React automatically escapes values
<div>{userInput}</div> // Safe

// For dangerouslySetInnerHTML, sanitize first
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />
```

**CSRF Protection**:
```typescript
// Use SameSite cookies
export function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; SameSite=Strict; Secure`;
}
```

---

## Appendix

### Keyboard Shortcuts

**Elementor Editor**:
- `Cmd/Ctrl + S` - Save current section
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Cmd/Ctrl + K` - Open command palette
- `Cmd/Ctrl + 1-6` - Switch tabs
- `Cmd/Ctrl + Enter` - Accept diff (in diff view)
- `Esc` - Reject diff (in diff view)

**Navigation Bar**:
- `Cmd/Ctrl + 1-9` - Switch tabs (when tabs < 10)
- `Arrow keys` - Navigate tabs
- `Enter` - Select tab

### File Size Limits

- Image uploads: 5MB max
- HTML sections: No limit (LocalStorage ~5-10MB)
- CSS files: No limit
- JavaScript files: No limit
- Export ZIP: Browser-dependent (~50-100MB)

### Browser Compatibility

**Fully Supported**:
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

**Partial Support**:
- Chrome 85-89 (no container queries)
- Safari 13 (limited ResizeObserver)

**Not Supported**:
- IE 11 (EOL)
- Chrome < 85
- Firefox < 85
- Safari < 13

### Resource Links

**Documentation**:
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Vercel AI SDK: https://sdk.vercel.ai
- Tailwind CSS: https://tailwindcss.com
- Radix UI: https://radix-ui.com

**Tools**:
- WordPress Playground: https://wordpress.github.io/wordpress-playground/
- GrapeJS: https://grapesjs.com
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- Firecrawl: https://firecrawl.dev

**Community**:
- GitHub: https://github.com/your-repo/hustle-tools
- Discord: [Coming soon]
- Twitter: [Coming soon]

---

**Document Version**: 2.0
**Last Updated**: January 2025
**Contributors**: Development Team
**License**: Proprietary

For questions or support, contact the development team.
