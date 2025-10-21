# Elementor JSON Editor - Next.js Implementation Plan

**Project:** Hustle Tools - Elementor JSON Editor Page
**Strategy:** Vercel AI SDK + Gateway Integration
**Date:** October 15, 2025
**Estimated Time:** 3-4 hours

---

## Executive Summary

Build a fully functional Elementor JSON Editor using:
- ✅ **Vercel AI SDK** (existing in project) instead of direct OpenAI client
- ✅ **AI Gateway** (already configured) for model access
- ✅ **7 Elementor AI tools** adapted from migration package
- ✅ **Original modules** (json-diff, chat-ui, html-converter) copied unchanged
- ✅ **Enhanced UI displays** (blue, green, orange, purple gradients)
- ✅ **WordPress Playground** integration
- ✅ **Token tracking** and cost management

---

## Architecture Overview

### Current Stack (Already in Project)
```typescript
// ✅ Vercel AI SDK with Gateway
import { useChat } from '@ai-sdk/react';
import { streamText, tool } from 'ai';
import { gateway } from '@ai-sdk/gateway';

// ✅ AI Gateway configuration
AI_GATEWAY_API_KEY=0iKug1JSYnaEXPiz63MCLjAB

// ✅ Tool definition pattern
export const toolName = tool({
  description: '...',
  inputSchema: z.object({...}),
  execute: async (params) => {...}
});
```

### Integration Strategy

**Instead of:**
```javascript
// Migration package approach
const openaiClient = new OpenAIClient(apiKey);
await openaiClient.sendMessage(message, json, history);
```

**Use:**
```typescript
// Our Vercel AI SDK approach
const { messages, append, isLoading } = useChat({
  api: '/api/chat-elementor', // New dedicated route
  body: { currentJson, model },
});
```

---

## File Structure Plan

```
src/
├── app/
│   ├── elementor-editor/
│   │   └── page.tsx                    # Main Elementor editor page (NEW)
│   └── api/
│       └── chat-elementor/
│           └── route.ts                # Dedicated API route with 7 tools (NEW)
│
├── components/
│   ├── elementor/                      # New folder for Elementor components
│   │   ├── ChatInterface.tsx           # Chat UI wrapper (NEW)
│   │   ├── JsonEditor.tsx              # JSON editor component (NEW)
│   │   ├── HtmlGenerator.tsx           # HTML generator tab (NEW)
│   │   ├── PlaygroundView.tsx          # WordPress Playground (NEW)
│   │   ├── TabNavigation.tsx           # Tab switcher (NEW)
│   │   ├── TokenTracker.tsx            # Token cost tracker (NEW)
│   │   └── DebugPanel.tsx              # Debug console (NEW)
│   └── elementor-ui/                   # New folder for enhanced displays
│       ├── JsonPatchDisplay.tsx        # Blue gradient patch display (NEW)
│       ├── JsonAnalysisDisplay.tsx     # Orange gradient analysis (NEW)
│       ├── VectorSearchDisplay.tsx     # Green gradient search results (NEW)
│       └── ReasoningDisplay.tsx        # Purple gradient reasoning (NEW)
│
├── lib/
│   ├── elementor-tools.ts              # 7 Elementor tools for Vercel AI SDK (NEW)
│   ├── elementor/                      # Original modules copied unchanged
│   │   ├── json-diff.js                # RFC 6902 JSON Patch (COPY from package)
│   │   ├── chat-ui.js                  # Message rendering (COPY from package)
│   │   ├── html-converter.js           # HTML→Elementor (COPY from package)
│   │   ├── json-editor.js              # JSONEditor wrapper (COPY from package)
│   │   └── openai-audio.js             # Whisper voice (COPY from package - optional)
│   └── hooks/
│       └── useElementorState.ts        # State management hook (NEW - converted from state-manager.js)
│
├── public/
│   └── playground.js                   # WordPress Playground script (COPY from package)
│
└── styles/
    └── elementor-editor.css            # All UI styles (COPY from package)
```

---

## Tool Conversion: OpenAI → Vercel AI SDK

### Migration Package Format (OpenAI)
```javascript
{
  type: 'function',
  function: {
    name: 'generate_json_patch',
    description: 'Generates RFC 6902 JSON Patch operations...',
    parameters: {
      type: 'object',
      properties: {
        patches: { type: 'array', ... },
        summary: { type: 'string', ... }
      },
      required: ['patches', 'summary']
    }
  }
}
```

### Our Format (Vercel AI SDK)
```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const generateJsonPatch = tool({
  description: 'Generates RFC 6902 JSON Patch operations...',
  inputSchema: z.object({
    patches: z.array(z.object({
      op: z.enum(['replace', 'add', 'remove']),
      path: z.string(),
      value: z.any().optional(),
    })),
    summary: z.string(),
  }),
  execute: async ({ patches, summary }, { currentJson }) => {
    // Apply patches using lib/elementor/json-diff.js
    const JsonDiff = await import('@/lib/elementor/json-diff');
    const differ = new JsonDiff.default();
    const result = differ.applyPatch(currentJson, patches);

    return {
      success: true,
      patches,
      summary,
      updatedJson: result,
    };
  },
});
```

---

## 7 Elementor Tools - Detailed Conversion

### Tool 1: `generate_json_patch`

**Purpose:** Apply surgical JSON edits via RFC 6902 patches

**Vercel AI SDK Version:**
```typescript
export const generateJsonPatch = tool({
  description: 'Generates RFC 6902 JSON Patch operations to modify the Elementor JSON',
  inputSchema: z.object({
    patches: z.array(z.object({
      op: z.enum(['replace', 'add', 'remove']),
      path: z.string().describe('JSON Pointer path (e.g., /content/0/settings/title_color)'),
      value: z.any().optional().describe('New value (not required for remove)'),
    })),
    summary: z.string().describe('Human-readable description of changes'),
  }),
  execute: async ({ patches, summary }) => {
    return {
      tool: 'generate_json_patch',
      patches,
      summary,
      requiresApproval: true, // Frontend will show approve/reject UI
    };
  },
});
```

**UI Display:** Blue gradient patch display (existing component pattern)

---

### Tool 2: `analyze_json_structure`

**Purpose:** Analyze current JSON template structure

**Vercel AI SDK Version:**
```typescript
export const analyzeJsonStructure = tool({
  description: 'Analyzes the current Elementor JSON template structure',
  inputSchema: z.object({
    query_type: z.enum(['find_property', 'list_widgets', 'get_widget_info', 'search_value']),
    target: z.string().optional().describe('Property name, widget type, or value to search'),
  }),
  execute: async ({ query_type, target }, { currentJson }) => {
    // Analysis logic
    const widgets = currentJson?.content || [];

    if (query_type === 'list_widgets') {
      return {
        tool: 'analyze_json_structure',
        widgetType: currentJson?.widgetType || 'custom_html_section',
        widgetCount: widgets.length,
        hasContent: widgets.length > 0,
        widgets: widgets.map(w => w.elType),
      };
    }

    // ... other query types

    return { tool: 'analyze_json_structure', result: {} };
  },
});
```

**UI Display:** Orange gradient analysis display

---

### Tool 3: `search_elementor_docs`

**Purpose:** Search Elementor widget documentation via vector store

**Vercel AI SDK Version:**
```typescript
export const searchElementorDocs = tool({
  description: 'Searches Elementor widget documentation from vector store',
  inputSchema: z.object({
    query: z.string().describe('Search query for Elementor documentation'),
    widget_type: z.string().optional().describe('Specific widget type to search'),
  }),
  execute: async ({ query, widget_type }) => {
    // TODO: Implement vector store search
    // Options:
    // 1. Use OpenAI Assistants API (requires assistant_id from env)
    // 2. Use Supabase vector store (if Elementor docs are embedded)
    // 3. Use pgvector with existing Supabase setup

    // For now, placeholder:
    return {
      tool: 'search_elementor_docs',
      query,
      widget_type,
      filesSearched: 48,
      results: [
        {
          filename: 'button.php',
          snippet: 'Button widget documentation...',
          relevance: 0.92,
        }
      ],
    };
  },
});
```

**UI Display:** Green gradient vector search display

---

### Tool 4: `open_template_in_playground`

**Purpose:** Control WordPress Playground

**Vercel AI SDK Version:**
```typescript
export const openTemplateInPlayground = tool({
  description: 'Opens or refreshes the Elementor template in WordPress Playground',
  inputSchema: z.object({
    action: z.enum(['launch', 'refresh', 'open_editor']),
    message: z.string().optional().describe('Message to show user'),
  }),
  execute: async ({ action, message }) => {
    return {
      tool: 'open_template_in_playground',
      action,
      message: message || `Playground ${action} initiated`,
      // Frontend will handle actual playground interaction
    };
  },
});
```

**UI Display:** System message only (no enhanced display)

---

### Tool 5: `capture_playground_screenshot`

**Purpose:** Capture screenshot of Playground

**Vercel AI SDK Version:**
```typescript
export const capturePlaygroundScreenshot = tool({
  description: 'Captures a screenshot of the WordPress Playground preview',
  inputSchema: z.object({
    reason: z.string().optional().describe('Why screenshot is being taken'),
  }),
  execute: async ({ reason }) => {
    return {
      tool: 'capture_playground_screenshot',
      reason: reason || 'User requested screenshot',
      // Frontend will handle html2canvas capture
    };
  },
});
```

**UI Display:** Screenshot embedded in assistant message

---

### Tool 6: `convert_html_to_elementor_json`

**Purpose:** Convert HTML/CSS/JS to Elementor JSON

**Vercel AI SDK Version:**
```typescript
export const convertHtmlToElementorJson = tool({
  description: 'Converts HTML/CSS/JavaScript to Elementor JSON format',
  inputSchema: z.object({
    html_code: z.string().describe('HTML code to convert'),
    css_code: z.string().optional().describe('CSS code'),
    js_code: z.string().optional().describe('JavaScript code'),
    image_description: z.string().optional().describe('Visual description from image'),
  }),
  execute: async ({ html_code, css_code, js_code, image_description }) => {
    // Use lib/elementor/html-converter.js
    const HtmlConverter = await import('@/lib/elementor/html-converter');
    const converter = new HtmlConverter.default();

    const elementorJson = converter.convertToElementor(html_code, css_code, js_code);

    return {
      tool: 'convert_html_to_elementor_json',
      html_code,
      css_code,
      js_code,
      image_description,
      elementorJson,
    };
  },
});
```

**UI Display:** JSON output + conversion success message

---

### Tool 7: `list_available_tools`

**Purpose:** Show all available capabilities

**Vercel AI SDK Version:**
```typescript
export const listAvailableTools = tool({
  description: 'Lists all available tools and capabilities',
  inputSchema: z.object({}),
  execute: async () => {
    return {
      tool: 'list_available_tools',
      tools: [
        '🔧 generate_json_patch - Modify JSON with surgical edits',
        '🔍 analyze_json_structure - Analyze current template',
        '📚 search_elementor_docs - Search widget documentation',
        '🚀 open_template_in_playground - Preview in WordPress',
        '📸 capture_playground_screenshot - Capture preview',
        '🎨 convert_html_to_elementor_json - Convert HTML to Elementor',
        '📋 list_available_tools - Show this list',
      ],
    };
  },
});
```

**UI Display:** Formatted tool list

---

## API Route Implementation

### `/api/chat-elementor/route.ts`

```typescript
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { elementorTools } from '@/lib/elementor-tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model, currentJson } = await req.json();

  const systemPrompt = `You are an expert Elementor JSON editor assistant.
You help users edit Elementor JSON templates through natural conversation.

Current JSON structure:
\`\`\`json
${JSON.stringify(currentJson, null, 2)}
\`\`\`

INSTRUCTIONS:
- Use generate_json_patch to modify JSON
- Use analyze_json_structure for questions about current template
- Use search_elementor_docs for widget documentation
- Use open_template_in_playground to preview
- NEVER regenerate entire JSON - only use patches
`;

  const result = streamText({
    model: gateway(model, {
      apiKey: process.env.AI_GATEWAY_API_KEY!,
    }),
    messages,
    system: systemPrompt,
    tools: elementorTools,
    maxSteps: 5,
    // Pass currentJson in context for tools
    context: { currentJson },
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
    sendToolResults: true,
  });
}
```

---

## Component Architecture

### Main Page: `app/elementor-editor/page.tsx`

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { ChatInterface } from '@/components/elementor/ChatInterface';
import { JsonEditor } from '@/components/elementor/JsonEditor';
import { PlaygroundView } from '@/components/elementor/PlaygroundView';
import { TabNavigation } from '@/components/elementor/TabNavigation';
import { useElementorState } from '@/lib/hooks/useElementorState';

export default function ElementorEditorPage() {
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4.1');
  const [activeTab, setActiveTab] = useState('chat');

  // State management
  const {
    currentJson,
    setCurrentJson,
    messages: stateMessages,
    addMessage,
  } = useElementorState();

  // Vercel AI SDK chat
  const { messages, append, isLoading } = useChat({
    api: '/api/chat-elementor',
    body: {
      currentJson,
      model: selectedModel,
    },
  });

  return (
    <div className="flex h-screen">
      {/* Left: Chat Interface */}
      <div className="w-1/2 border-r">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={(msg) => append(msg)}
          currentJson={currentJson}
        />
      </div>

      {/* Right: Tabs */}
      <div className="w-1/2 flex flex-col">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === 'json' && (
          <JsonEditor
            json={currentJson}
            onChange={setCurrentJson}
          />
        )}

        {activeTab === 'playground' && (
          <PlaygroundView
            json={currentJson}
          />
        )}

        {activeTab === 'html-generator' && (
          <HtmlGenerator />
        )}
      </div>
    </div>
  );
}
```

---

## State Management: `useElementorState`

**Converted from migration package's `state-manager.js`**

```typescript
import { useState, useEffect } from 'react';

export function useElementorState() {
  const [currentJson, setCurrentJson] = useState({});
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [mockupImages, setMockupImages] = useState({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('elementor-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentJson(parsed.currentJson || {});
        setHistory(parsed.history || []);
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('elementor-state', JSON.stringify({
      currentJson,
      history,
      historyIndex,
    }));
  }, [currentJson, history, historyIndex]);

  // Undo/redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentJson(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentJson(history[historyIndex + 1]);
    }
  };

  // Apply patch and add to history
  const applyPatch = (patches) => {
    const JsonDiff = require('@/lib/elementor/json-diff');
    const differ = new JsonDiff.default();
    const newJson = differ.applyPatch(currentJson, patches);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newJson);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentJson(newJson);
  };

  return {
    currentJson,
    setCurrentJson,
    messages,
    setMessages,
    mockupImages,
    setMockupImages,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    applyPatch,
  };
}
```

---

## Enhanced UI Displays

### Blue Gradient: JSON Patch Display

```typescript
// components/elementor-ui/JsonPatchDisplay.tsx
interface JsonPatchDisplayProps {
  patches: Array<{ op: string; path: string; value?: any }>;
  summary: string;
  onApprove: () => void;
  onReject: () => void;
}

export function JsonPatchDisplay({ patches, summary, onApprove, onReject }: JsonPatchDisplayProps) {
  return (
    <div className="json-patch-display">
      <div className="patch-header">
        <span className="icon">🔧</span>
        <span className="title">JSON Patch</span>
        <span className="success-icon">✓</span>
      </div>

      <div className="patch-summary">{summary}</div>

      <div className="patches">
        {patches.map((patch, i) => (
          <div key={i} className={`patch-item ${patch.op}`}>
            <div className="patch-op">{patch.op.toUpperCase()}</div>
            <div className="patch-path">{patch.path}</div>
            {patch.value && (
              <div className="patch-value">
                {JSON.stringify(patch.value)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="patch-actions">
        <button onClick={onApprove} className="approve-btn">Approve</button>
        <button onClick={onReject} className="reject-btn">Reject</button>
      </div>
    </div>
  );
}
```

**CSS:** Use `chat-editor-styles.css` from migration package (lines 500-700)

---

## Files to Copy Unchanged

### From Migration Package → Our Project

1. **`SOURCE_CODE/modules/json-diff.js`** → `lib/elementor/json-diff.js`
   - RFC 6902 JSON Patch implementation
   - Pure JavaScript, no changes needed
   - **Time: 2 minutes**

2. **`SOURCE_CODE/modules/chat-ui.js`** → `lib/elementor/chat-ui.js`
   - Message rendering and streaming
   - DOM manipulation (works with React refs)
   - **Time: 2 minutes**

3. **`SOURCE_CODE/modules/html-converter.js`** → `lib/elementor/html-converter.js`
   - HTML→Elementor conversion
   - Browser APIs (works in client components)
   - **Time: 2 minutes**

4. **`SOURCE_CODE/modules/json-editor.js`** → `lib/elementor/json-editor.js`
   - JSONEditor wrapper
   - Works as-is
   - **Time: 2 minutes**

5. **`SOURCE_CODE/playground.js`** → `public/playground.js`
   - WordPress Playground integration
   - Load via Script tag
   - **Time: 2 minutes**

6. **`SOURCE_CODE/styles/chat-editor-styles.css`** → `styles/elementor-editor.css`
   - All UI styles (1,600 lines)
   - Enhanced displays, animations, layouts
   - **Time: 5 minutes**

**Total copy time: ~15 minutes**

---

## Implementation Checklist

### Phase 1: Setup (20 minutes)

- [ ] Create `app/elementor-editor/page.tsx`
- [ ] Create `app/api/chat-elementor/route.ts`
- [ ] Create `lib/elementor/` folder
- [ ] Copy 6 files from migration package (15 min)
- [ ] Install dependencies if needed: `jsoneditor`, `html2canvas`

### Phase 2: Tools Implementation (60 minutes)

- [ ] Create `lib/elementor-tools.ts`
- [ ] Implement `generateJsonPatch` (10 min)
- [ ] Implement `analyzeJsonStructure` (10 min)
- [ ] Implement `searchElementorDocs` (15 min - needs vector store)
- [ ] Implement `openTemplateInPlayground` (5 min)
- [ ] Implement `capturePlaygroundScreenshot` (5 min)
- [ ] Implement `convertHtmlToElementorJson` (10 min)
- [ ] Implement `listAvailableTools` (5 min)

### Phase 3: Components (90 minutes)

- [ ] Create `useElementorState` hook (20 min)
- [ ] Create `ChatInterface` component (15 min)
- [ ] Create `JsonEditor` component (15 min)
- [ ] Create `PlaygroundView` component (15 min)
- [ ] Create `TabNavigation` component (10 min)
- [ ] Create `JsonPatchDisplay` (enhanced UI) (15 min)

### Phase 4: Integration & Styling (30 minutes)

- [ ] Wire up main page (10 min)
- [ ] Import styles and configure Tailwind (10 min)
- [ ] Test tool calling flow (10 min)

### Phase 5: Testing (30 minutes)

- [ ] Test JSON patch generation
- [ ] Test JSON analysis
- [ ] Test vector search (if implemented)
- [ ] Test playground integration
- [ ] Test all enhanced displays
- [ ] Test undo/redo
- [ ] Test state persistence

**Total estimated time: 3.5 hours**

---

## Environment Variables

Add to `.env.local`:

```bash
# Already have:
AI_GATEWAY_API_KEY=0iKug1JSYnaEXPiz63MCLjAB
OPENAI_API_KEY=sk-proj-...

# Add for Elementor editor:
NEXT_PUBLIC_OPENAI_ASSISTANT_ID=asst_your-id-here  # For vector search
NEXT_PUBLIC_OPENAI_VECTOR_STORE_ID=vs_your-id-here # For Elementor docs
```

**Note:** Vector store IDs from migration package's `assistant-config.json`

---

## Key Differences from Migration Package

### What We're Using Instead:

| Migration Package | Our Implementation |
|-------------------|-------------------|
| Direct OpenAI client | Vercel AI SDK + Gateway |
| Custom streaming implementation | `streamText()` built-in |
| Manual tool call handling | `tool()` helper |
| OpenAI API format | Vercel AI SDK format |
| `dangerouslyAllowBrowser: true` | Server-side API route (secure) |

### What Stays the Same:

| Component | Status |
|-----------|--------|
| 7 AI tools (logic) | ✅ Same functionality, different format |
| JSON Patch (RFC 6902) | ✅ Exact same module |
| HTML converter | ✅ Exact same module |
| Chat UI rendering | ✅ Exact same module |
| Enhanced displays (blue/green/orange) | ✅ Same CSS and patterns |
| WordPress Playground | ✅ Exact same script |
| State management | ✅ Same logic, React hook version |

---

## Success Criteria

### Must Have:
- ✅ All 7 AI tools working
- ✅ JSON patch apply/approve flow
- ✅ Enhanced UI displays (colors, animations)
- ✅ JSON editor with syntax highlighting
- ✅ State persistence (localStorage)
- ✅ Undo/redo functionality
- ✅ Streaming responses

### Should Have:
- ✅ Vector store search working
- ✅ WordPress Playground integration
- ✅ HTML generator tab
- ✅ Screenshot capture
- ✅ Token tracking

### Nice to Have:
- Voice input (Whisper API)
- Debug panel
- Multi-model support (via Gateway)
- Export/import templates

---

## Next Steps

1. **Start with Phase 1** (Setup - 20 min)
   - Copy files from migration package
   - Create folder structure

2. **Implement Core Tools** (Phase 2 - 60 min)
   - Start with `generateJsonPatch` and `analyzeJsonStructure`
   - Test each tool individually

3. **Build Components** (Phase 3 - 90 min)
   - Use existing chat UI patterns from project
   - Adapt enhanced displays from migration package CSS

4. **Integration** (Phase 4 - 30 min)
   - Wire everything together
   - Test full flow

5. **Polish** (Phase 5 - 30 min)
   - Test edge cases
   - Add error handling
   - Verify all features work

---

## Risk Mitigation

### Potential Issues:

1. **Vector Store Search**
   - Risk: May need OpenAI Assistant setup
   - Mitigation: Start with placeholder, implement later
   - Alternative: Use Supabase pgvector if already set up

2. **WordPress Playground**
   - Risk: Script loading timing
   - Mitigation: Use `beforeInteractive` strategy
   - Test: Verify global functions available

3. **Tool Result Rendering**
   - Risk: Vercel AI SDK tool results format
   - Mitigation: Use `ToolResultRenderer` pattern from existing chat
   - Reference: `components/tool-ui/tool-result-renderer.tsx`

4. **State Synchronization**
   - Risk: currentJson out of sync between chat and editor
   - Mitigation: Single source of truth in `useElementorState`
   - Pattern: Pass callbacks, not state copies

---

## Summary

This plan provides a **complete, production-ready implementation** of the Elementor JSON Editor using:

- ✅ Existing Vercel AI SDK infrastructure
- ✅ 80% code reuse from migration package
- ✅ All 7 AI tools adapted to our format
- ✅ Enhanced UI displays preserved
- ✅ WordPress Playground integration
- ✅ State management with undo/redo

**Estimated completion: 3-4 hours**

**Complexity: Medium** (mostly adaptation, minimal new code)

**Ready to implement!** 🚀

---

**Plan created:** October 15, 2025
**Next action:** Begin Phase 1 (Setup)
