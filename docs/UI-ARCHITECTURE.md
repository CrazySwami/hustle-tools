# UI Architecture Guide

**🎯 Main UI Documentation for Hustle Tools**

This document describes the core UI patterns, components, and architecture used throughout the Hustle Tools application.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Core Layout Pattern](#core-layout-pattern)
3. [Navigation System](#navigation-system)
4. [Z-Index Layering](#z-index-layering)
5. [AI Chat Integration](#ai-chat-integration)
6. [Vercel AI SDK UI](#vercel-ai-sdk-ui)
7. [Streaming & Tool Calling](#streaming--tool-calling)
8. [Component Generation with v0](#component-generation-with-v0)
9. [Widget & Tool Rendering](#widget--tool-rendering)

---

## Design Philosophy

Hustle Tools follows a **chat-first, AI-powered** interface philosophy:

- **Left Panel**: AI chat interface with tool calling capabilities
- **Right Panel**: Primary content/editor for the current tool
- **Mobile**: Bottom drawer for chat, full-width content area
- **Navigation**: Floating, draggable "Hustle Tools" button (mobile: bottom-left, desktop: draggable)

This pattern is inspired by modern AI interfaces like ChatGPT, Claude, and Cursor, where the AI assistant is always accessible alongside the work content.

---

## Core Layout Pattern

### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  [HT Button - Draggable]                                │
│                                                          │
│  ┌─────────────────────┬────────────────────────────┐  │
│  │                     │                            │  │
│  │   AI Chat Panel     │    Content/Editor Panel    │  │
│  │   ─────────────     │    ──────────────────      │  │
│  │                     │                            │  │
│  │   • Messages        │    • Doc Editor            │  │
│  │   • Model selector  │    • HTML/CSS/JS Editor    │  │
│  │   • Tool widgets    │    • Visual Editor         │  │
│  │   • Streaming       │    • WordPress Playground  │  │
│  │                     │    • etc.                  │  │
│  │                     │                            │  │
│  └─────────────────────┴────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌──────────────────────────────────┐
│  [HT] ═══════════ [⋮ Options]    │ ← Bottom Nav (z-3100)
│                                   │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │   Content/Editor Panel     │  │
│  │   (Full Width)             │  │
│  │                            │  │
│  │                            │  │
│  └────────────────────────────┘  │
│  ▲ Open Chat                     │ ← Chat Drawer Handle (z-3200)
└──────────────────────────────────┘

When chat open:
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │   AI Chat (Drawer)         │  │ ← (z-3200)
│  │   95vh height              │  │
│  │                            │  │
│  │   [Messages, tools, etc]   │  │
│  │                            │  │
│  └────────────────────────────┘  │
│  ▼ Close Chat                    │
└──────────────────────────────────┘
```

### Key Examples

1. **AI Doc Editor** (`/chat-doc`)
   - Left: Chat with document analysis tools
   - Right: Rich text document editor with formatting

2. **Elementor Builder** (`/elementor-editor`)
   - Left: Chat with HTML/CSS/JS generation tools
   - Right: Tabbed interface (Code Editor, Visual Editor, WordPress Playground, etc.)
   - Mobile: Three-dot options menu in bottom-right

3. **Image Editor** (`/image-editor`)
   - Left: Chat with image generation/editing tools
   - Right: Canvas with image preview and controls

---

## Navigation System

### Navbar Component

Location: `/src/components/ui/navbar.tsx`

The navbar is a **floating, draggable button** that provides global navigation:

**Desktop:**
- Positioned via `position: fixed` with draggable coordinates
- Default: top-left corner (16px margin)
- User can drag to any corner (snaps to nearest corner on release)
- Displays "Hustle Tools" text
- Z-index: 3100 (below chat drawer)

**Mobile:**
- Circular button showing "HT" text
- Default: bottom-left corner (10px margin)
- Renders into `#bottom-nav-left` portal via BottomNav
- Z-index: 3100 (below chat drawer)

**Features:**
- Click vs drag detection (5px threshold)
- Water-fill hover animation with color inversion:
  - Light mode: fills with black, text turns white
  - Dark mode: fills with white, text turns black
- localStorage persistence for position
- Dropdown menu (desktop) / slide-in panel (mobile)

### BottomNav Component

Location: `/src/components/ui/BottomNav.tsx`

Provides consistent bottom navigation on mobile:

```typescript
<BottomNav pageActions={optionalRightSideContent} />
```

**Layout:**
- Fixed bottom positioning
- Padding: 58px from bottom (48px chat handle + 10px spacing)
- Two portal injection points:
  - `#bottom-nav-left`: Navbar button (HT)
  - `#bottom-nav-right`: Page-specific options (three-dot menu)
- Z-index: 3100 (below chat drawer at 3200)
- Mobile-only by default (`mobileOnly={true}`)

**Usage Pattern:**
```typescript
// In page component
<>
  <MainContent />
  <BottomNav /> // Navbar auto-injects here
</>

// In tab components with options
<OptionsButton
  isMobile={isMobile}
  isVisible={isTabVisible}  // Only render when tab active
  options={menuItems}
/>
```

### OptionsButton Component

Location: `/src/components/ui/OptionsButton.tsx`

Three-dot menu button that adapts to mobile/desktop:

**Desktop:**
- Absolute positioned (bottom-left by default)
- Circular button with dropdown menu above
- Z-index: 100 (relative to parent container)

**Mobile:**
- Renders into `#bottom-nav-right` via React portal
- Bottom-right position
- Menu opens upward
- Only renders when `isVisible={true}` (prevents duplicate buttons in tabbed layouts)

**Critical Pattern for Tabbed Layouts:**
```typescript
// Parent page: Pass visibility based on active tab
<HtmlSectionEditor
  isTabVisible={activeTab === 'code'}
  // ... other props
/>

// Child component: Forward to OptionsButton
<OptionsButton
  isMobile={isMobile}
  isVisible={isTabVisible}  // ← Prevents portal stacking!
  options={[...]}
/>
```

Without `isVisible`, all tabs' OptionsButtons would portal into the same div, causing visual stacking.

---

## Z-Index Layering

**Critical z-index hierarchy** (from lowest to highest):

| Layer | Z-Index | Component | Purpose |
|-------|---------|-----------|---------|
| Base Content | 0-99 | Main content, editors | Default document flow |
| Floating Options | 100-199 | OptionsButton (desktop) | Tab-specific menus |
| Bottom Nav | 3100 | BottomNav, Navbar button | Global navigation |
| Nav Backdrop | 3140 | Navbar mobile backdrop | Dim background when menu open |
| Nav Menu | 3150 | Navbar dropdown/slide-in | Navigation menu overlay |
| **Chat Drawer** | **3200** | Mobile chat drawer | **Highest priority** |

**Rules:**
1. Chat drawer (3200) is **always on top** - nothing should overlap it
2. BottomNav (3100) sits just below chat, above all content
3. Navbar menus (3150) can appear above BottomNav but below chat
4. Content-level floating buttons (100-199) stay within their containers

**Why this matters:**
- On mobile, the chat drawer can slide up from bottom
- BottomNav buttons (HT, three-dot menu) should NOT overlap the chat handle
- When chat is open, it covers everything except itself

---

## AI Chat Integration

### Chat Component Pattern

All chat interfaces use a consistent structure:

```typescript
interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  // Tool-specific props...
}
```

### Key Features

1. **Message History**: Array of user/assistant messages
2. **Model Selector**: Dropdown to choose AI model (GPT-4.5, Claude, etc.)
3. **Streaming**: Real-time token-by-token display
4. **Tool Calling**: Embedded UI widgets for tool results
5. **File Upload**: Image/document attachment support
6. **Copy/Regenerate**: Message-level actions

### Chat Positioning

**Desktop:**
- Left panel, resizable (25-75% width typically)
- Vertical splitter to adjust chat/content ratio
- Example: Elementor editor has draggable divider

**Mobile:**
- Bottom drawer (95vh height when open)
- 48px handle bar to open/close
- Overlay mode (covers content when open)
- Z-index 3200 (above all other UI)

---

## Vercel AI SDK UI

**Guiding Light**: The [Vercel AI SDK UI documentation](https://sdk.vercel.ai/docs/ai-sdk-ui) is our primary reference for chat interfaces.

### Core Hook: `useChat`

```typescript
import { useChat } from '@ai-sdk/react';

const {
  messages,        // Message[] - all messages
  input,          // string - current input value
  handleSubmit,   // Submit handler
  handleInputChange, // Input change handler
  isLoading,      // boolean - generating response
  reload,         // Regenerate last message
  stop,           // Stop generation
  append,         // Add message programmatically
  setMessages,    // Replace all messages
} = useChat({
  api: '/api/chat',
  onFinish: (message) => { /* ... */ },
  onError: (error) => { /* ... */ },
});
```

### Message Structure

```typescript
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  // Tool calling
  toolInvocations?: ToolInvocation[];
};
```

### Streaming Pattern

```typescript
// API Route (server-side)
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages,
    tools: { /* ... */ },
  });

  return result.toDataStreamResponse();
}

// Client (auto-handled by useChat)
// Messages update in real-time as tokens stream
```

### Tool Calling with UI

```typescript
// Define tools with UI components
const tools = {
  generateHTML: {
    description: 'Generate HTML from description',
    parameters: z.object({
      description: z.string(),
    }),
    execute: async ({ description }) => {
      // Server-side execution
      return { html: '...' };
    },
  },
};

// Custom tool UI rendering
<Tool>
  <ToolHeader type="generateHTML" state="completed" />
  <ToolContent>
    <HTMLPreview html={result.html} />
  </ToolContent>
</Tool>
```

### AI SDK Elements

Location: `/src/components/ai-elements/`

Pre-built components from Vercel AI SDK:

- `UniversalChat.tsx` - Main chat interface with message rendering
- `MarkdownRenderer.tsx` - Formats markdown with syntax highlighting
- `SourceCitations.tsx` - Displays web search result links
- `ToolResultRenderer.tsx` - Custom tool UI widgets (blog planner, HTML generator, etc.)

**Key Pattern:**
```typescript
// Universal tool rendering
{messages.map((message) =>
  message.toolInvocations?.map((tool) => (
    <ToolResultRenderer
      toolName={tool.toolName}
      args={tool.args}
      result={tool.result}
    />
  ))
)}
```

---

## Streaming & Tool Calling

### Streaming Text Generation

**Pattern**: Token-by-token display as model generates

```typescript
// API route
const result = streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  messages,
  onChunk: (chunk) => {
    // Optional: process each chunk
  },
});

return result.toDataStreamResponse();

// Client - automatic via useChat
// No additional code needed!
```

### Streaming Code Generation

**Example**: Elementor HTML/CSS/JS generation

```typescript
// Tool definition
generateHTML: {
  description: 'Generate section HTML',
  parameters: z.object({
    description: z.string(),
    images: z.array(z.string()).optional(),
  }),
  execute: async ({ description, images }, { messages }) => {
    // Stream to frontend via callback
    const result = streamText({
      model,
      messages: [
        ...messages,
        { role: 'user', content: buildPrompt(description, images) },
      ],
      onChunk: ({ text }) => {
        // Extract <html>, <css>, <js> sections
        // Send to frontend via server-sent events
      },
    });

    return result;
  },
}

// Frontend - receive stream
onStreamUpdate={(type, content) => {
  setCode(prev => ({ ...prev, [type]: content }));
}}
```

### Tool Invocation Flow

1. **User sends message** → `useChat` calls `/api/chat`
2. **Model decides to use tool** → Returns tool invocation
3. **Server executes tool** → Runs async function
4. **Result returned to model** → Model continues generation
5. **Custom UI renders** → `ToolResultRenderer` displays widget

**Critical: Tool Deduplication**

Vercel AI SDK 5 creates **two message parts** for each tool:
1. Generic `tool-call` part (for backward compatibility)
2. Typed `tool-TOOLNAME` part (for type safety)

**Must prevent duplicate rendering:**

```typescript
case 'tool-call': {
  // Skip if typed part exists
  const toolName = part.toolName;
  const hasTypedPart = message.parts.some((p) =>
    p.type === `tool-${toolName}`
  );

  if (hasTypedPart) {
    return null; // Don't render generic part
  }

  // Only render if no typed part
  return <Tool>...</Tool>;
}
```

See: `/src/components/chat/UniversalChat.tsx:205-228`

---

## Component Generation with v0

**v0.dev** is our AI-powered component generator for creating new UI elements.

### When to Use v0

1. **New page layouts** - Generate entire page structures
2. **Complex widgets** - Multi-part tool result displays
3. **Custom forms** - Multi-step wizards, settings panels
4. **Data visualizations** - Charts, tables, dashboards

### Workflow

1. **Describe component** in natural language
2. **v0 generates** React + Tailwind code
3. **Copy code** to clipboard
4. **Import into project**:
   - Create new file in `/src/components/`
   - Adjust imports (use project's existing components)
   - Add to relevant page

### Integration Checklist

After generating with v0:

- [ ] Replace `shadcn/ui` imports with our components
- [ ] Update icon imports (`lucide-react` → `/src/components/ui/icons`)
- [ ] Use project's utility functions (`cn` from `/src/lib/utils`)
- [ ] Match existing color variables (`var(--background)`, `var(--foreground)`, etc.)
- [ ] Add `'use client'` if component has state/hooks
- [ ] Test responsive behavior (mobile + desktop)

### Example: Generating a Tool Widget

**Prompt to v0:**
```
Create a React component that displays blog post outlines with:
- Title and description at top
- Expandable sections for each post
- Keywords as tags
- Word count estimate
- "Generate Post" button per section
- Dark mode support with Tailwind
```

**Output:**
```typescript
'use client';

import { useState } from 'react';
// ... v0 generates full component

export function BlogOutlineWidget({ outline }) {
  // ... generated code
}
```

**Integration:**
```typescript
// Save as: /src/components/tool-ui/BlogOutlineWidget.tsx
// Import in: /src/components/tool-ui/tool-result-renderer.tsx

case 'tool-planBlogTopics':
  return <BlogOutlineWidget outline={result.outline} />;
```

---

## Widget & Tool Rendering

### Custom Tool Widgets

Location: `/src/components/tool-ui/tool-result-renderer.tsx`

This is the **central dispatch** for all tool result UIs:

```typescript
export function ToolResultRenderer({ toolName, args, result }) {
  switch (toolName) {
    case 'planBlogTopics':
      return <BlogOutlineWidget outline={result.outline} />;

    case 'generateHTML':
      return <HTMLPreviewWidget html={result.html} />;

    case 'searchWeb':
      return <SourceCitations sources={result.sources} />;

    default:
      return <DefaultToolResult result={result} />;
  }
}
```

### Adding a New Tool Widget

1. **Define tool** in `/src/lib/tools.ts`:

```typescript
export const tools = {
  myNewTool: {
    description: 'Does something cool',
    parameters: z.object({
      input: z.string(),
    }),
    execute: async ({ input }) => {
      // ... implementation
      return { output: 'result' };
    },
  },
};
```

2. **Create widget component** in `/src/components/tool-ui/MyToolWidget.tsx`:

```typescript
'use client';

export function MyToolWidget({ result }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">Result:</h3>
      <p>{result.output}</p>
    </div>
  );
}
```

3. **Register in renderer**:

```typescript
// /src/components/tool-ui/tool-result-renderer.tsx
import { MyToolWidget } from './MyToolWidget';

case 'tool-myNewTool':
  return <MyToolWidget result={result} />;
```

### Widget Best Practices

**Visual Design:**
- Use `var(--background)`, `var(--foreground)` for colors
- Add `border border-border` for containers
- Use `rounded-lg` or `rounded-xl` for modern feel
- Include `p-4` or `p-6` for comfortable padding

**Interactivity:**
- Add loading states for async actions
- Show success/error feedback
- Disable buttons during operations
- Use optimistic UI updates

**Responsive:**
- Stack vertically on mobile (`flex-col md:flex-row`)
- Adjust text sizes (`text-sm md:text-base`)
- Hide non-critical info on small screens
- Use horizontal scroll for wide content

**Accessibility:**
- Add aria-labels to buttons
- Use semantic HTML (`<button>`, not `<div onClick>`)
- Ensure keyboard navigation works
- Test with screen readers

---

## Summary

This architecture provides:

1. **Consistent Layout**: Chat left, content right (desktop) / drawer bottom (mobile)
2. **Flexible Navigation**: Draggable button, portal-based positioning
3. **Proper Layering**: Z-index hierarchy ensures chat is never blocked
4. **AI-First**: Vercel AI SDK powers streaming, tools, and widgets
5. **Extensible**: v0 for rapid component generation, easy tool integration
6. **Responsive**: Mobile-optimized with bottom nav and chat drawer

**Key Files:**
- `/src/components/ui/navbar.tsx` - Global navigation
- `/src/components/ui/BottomNav.tsx` - Mobile bottom bar
- `/src/components/ui/OptionsButton.tsx` - Three-dot menu
- `/src/components/ai-elements/UniversalChat.tsx` - Main chat UI
- `/src/components/tool-ui/tool-result-renderer.tsx` - Tool widget dispatch
- `/src/lib/tools.ts` - Tool definitions
- `/src/app/api/chat/route.ts` - Chat API endpoint

**Reference Docs:**
- [Vercel AI SDK UI](https://sdk.vercel.ai/docs/ai-sdk-ui)
- [Vercel AI SDK Docs](../vercel-ai-sdk-ui-docs/)
- [UI Stack Guide](./ui-stack.md)
- [Tool Creation Guide](./how-to-make-tools.md)
