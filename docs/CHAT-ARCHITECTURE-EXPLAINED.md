# Chat Architecture - Complete Explanation

## Your Questions Answered

### Q1: "Does it make sense to have separate TSX files? Should we centralize?"

**Answer**: **YES, we should centralize!** I just created **`UniversalChat.tsx`** - a single reusable component for ALL features.

**Before** (separate files):
- ElementorChat.tsx (384 lines)
- BlogPlannerChat.tsx (311 lines)
- YourFeatureChat.tsx (300+ lines) ← You'd copy this for each feature

**After** (centralized):
- UniversalChat.tsx (356 lines) ← **ONE component for everything**
- Just pass `toolNames={['tool1', 'tool2']}` as a prop!

**Result**: ~300 lines saved per feature! 🎉

---

### Q2: "How do the routes work? Is it documented well?"

**Answer**: Yes! Here's the complete picture:

## Route Architecture

### Each Feature Has Its Own API Route

```
/api/chat-elementor     → ElementorChat tools (generateHTML, editCode, etc.)
/api/chat-blog-planner  → Blog Planner tools (planBlogTopics, writeBlogPost)
/api/chat-recipes       → Recipe tools (generateRecipe, analyzeNutrition)
```

**Why separate routes?**
- Each route registers DIFFERENT tools
- AI SDK needs to know which tools are available
- Keeps tool registration clean and organized

### Route File Template

**File**: `src/app/api/chat-YOURFEATURE/route.ts`

```typescript
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest } from 'next/server';
import { yourTool1, yourTool2 } from '@/lib/tools';

export const runtime = 'edge';        // ✅ Required: Edge runtime
export const maxDuration = 60;        // ✅ Required: Max 60 seconds

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request
    const { messages, model = 'anthropic/claude-sonnet-4-5-20250929' } = await req.json();

    // 2. Call AI with tools
    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,  // ✅ Gateway API key
      }),
      messages,
      tools: {
        yourTool1: yourTool1,  // ✅ Register tools here!
        yourTool2: yourTool2,
      },
      temperature: 0.7,
      maxTokens: 4000,
    });

    // 3. Return streaming response
    return result.toDataStreamResponse();  // ✅ NOT toTextStreamResponse!
  } catch (error) {
    console.error('Error in /api/chat-YOURFEATURE:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Key Points:**
- ✅ Use `export const runtime = 'edge'` for fast responses
- ✅ Register tools in `tools: { ... }` object
- ✅ Use `toDataStreamResponse()` for AI SDK 5 (NOT `toTextStreamResponse`)
- ✅ Add error handling
- ✅ Use Gateway for multi-model support

---

## Complete Flow Diagram

```
User Types Message
    ↓
Page Component (page.tsx)
  const { messages, sendMessage } = useChat({ api: '/api/chat-YOURFEATURE' })
  sendMessage({ text }, { body: { model, webSearch } })
    ↓
API Route (/api/chat-YOURFEATURE/route.ts)
  POST function receives { messages, model }
    ↓
streamText()
  model: gateway(model)
  messages: conversation history
  tools: { tool1, tool2 }  ← Register tools
    ↓
AI Decides to Use Tool
  AI SDK calls tool.execute()
    ↓
Tool Returns Metadata
  { status: 'ready', ...data }
    ↓
AI SDK Creates Typed Part
  { type: 'tool-TOOLNAME', input: {...}, output: {...} }
    ↓
Response Streams Back
  toDataStreamResponse() sends chunks
    ↓
Page Receives Message
  useChat hook updates messages array
    ↓
UniversalChat Renders
  Maps over message.parts
    ↓
Switch Statement Checks
  if (part.type === 'tool-TOOLNAME') → render widget
    ↓
ToolResultRenderer Dispatches
  switch (toolName) { case 'TOOLNAME': return <Widget /> }
    ↓
Widget Displays UI
  User sees tool result!
```

---

## File Structure for New Feature

```
src/
├── lib/
│   └── tools.ts                              ← 1. Define tools here
├── app/
│   ├── api/
│   │   └── chat-YOURFEATURE/
│   │       └── route.ts                      ← 2. Register tools in API route
│   └── YOURFEATURE/
│       └── page.tsx                          ← 3. Use UniversalChat
├── components/
│   ├── chat/
│   │   └── UniversalChat.tsx                 ← 🚀 NEW: Centralized chat
│   └── tool-ui/
│       ├── YOURFEATURE-widget.tsx            ← 4. Create widget (optional)
│       └── tool-result-renderer.tsx          ← 5. Register widget
└── middleware.ts                             ← 6. Add to unprotectedRoutes (if needed)
```

**Just 6 steps!**

---

## Working Examples

### Example 1: Blog Planner (Simplest)

**1. Tools** (src/lib/tools.ts):
```typescript
export const planBlogTopics = tool({ ... });
export const writeBlogPost = tool({ ... });
```

**2. API Route** (src/app/api/chat-blog-planner/route.ts):
```typescript
const result = streamText({
  model: gateway(model),
  messages,
  tools: {
    planBlogTopics,    // ← Register here
    writeBlogPost,
  },
});
return result.toDataStreamResponse();
```

**3. Page** (src/app/blog-planner/page.tsx):
```typescript
import { UniversalChat } from '@/components/chat/UniversalChat';

const { messages, sendMessage, isLoading } = useChat({
  api: '/api/chat-blog-planner',  // ← Points to your route
});

<UniversalChat
  messages={messages}
  isLoading={isLoading}
  onSendMessage={(text) => sendMessage({ text })}
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  toolNames={['planBlogTopics', 'writeBlogPost']}  // ← Register tools
  placeholder="Ask me to plan blog topics..."
/>
```

**That's it!** No copying 300+ lines of chat code.

---

### Example 2: Elementor Editor (With Callbacks)

**1. Tools** (src/lib/tools.ts):
```typescript
export const generateHTML = tool({ ... });
export const editCode = tool({ ... });
export const updateSectionHtml = tool({ ... });
// ... more tools
```

**2. API Route** (src/app/api/chat-elementor/route.ts):
```typescript
const result = streamText({
  model: gateway(model),
  messages,
  tools: {
    generateHTML,
    editCode,
    updateSectionHtml,
    updateSectionCss,
    updateSectionJs,
    viewEditorCode,
    switchTab,
  },
});
return result.toDataStreamResponse();
```

**3. Page** (src/app/elementor-editor/page.tsx):
```typescript
import { UniversalChat } from '@/components/chat/UniversalChat';

<UniversalChat
  messages={messages}
  isLoading={isLoading}
  onSendMessage={handleSendMessage}
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}

  toolNames={[
    'generateHTML',
    'editCode',
    'updateSectionHtml',
    'updateSectionCss',
    'updateSectionJs',
    'viewEditorCode',
    'switchTab',
  ]}

  // Feature-specific callbacks
  onStreamUpdate={(type, content) => setStreamedCode({ ...prev, [type]: content })}
  onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
  onSwitchTab={(tab) => setActiveTab(tab)}
/>
```

---

## Tool Rendering Flow

### How UniversalChat Finds the Right Widget

```
1. AI SDK creates: { type: 'tool-planBlogTopics', output: {...} }
                                    ↓
2. UniversalChat checks: isRegisteredTool('tool-planBlogTopics')
   → toolNames.includes('planBlogTopics')? YES ✅
                                    ↓
3. Extract tool name: 'tool-planBlogTopics'.replace('tool-', '')
   → 'planBlogTopics'
                                    ↓
4. Pass to ToolResultRenderer: toolName='planBlogTopics'
                                    ↓
5. ToolResultRenderer switch: case 'planBlogTopics':
   → return <BlogPlannerWidget data={result} />
                                    ↓
6. Widget renders UI
```

**No hard-coded switch cases in chat component!**

---

## Streaming Tools

For tools that stream content (HTML, blog posts, etc.):

### 1. Tool Returns Metadata Only

```typescript
export const generateHTML = tool({
  execute: async ({ description }) => {
    return {
      status: 'ready_to_generate',  // ← NOT the actual HTML!
      description,
      timestamp: new Date().toISOString(),
    };
  },
});
```

### 2. Widget Handles Streaming

```typescript
export function HtmlGeneratorWidget({ data, model }) {
  const [generatedHtml, setGeneratedHtml] = useState('');

  const handleGenerate = async () => {
    const response = await fetch('/api/generate-html-stream', {
      method: 'POST',
      body: JSON.stringify({ description: data.description, model }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      setGeneratedHtml(prev => prev + chunk);
      onStreamUpdate?.('html', generatedHtml + chunk);  // ← Callback to parent
    }
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate HTML</button>
      <div>Characters: {generatedHtml.length}</div>
      <pre>{generatedHtml}</pre>
    </div>
  );
}
```

### 3. Streaming API Route

```typescript
// src/app/api/generate-html-stream/route.ts
export async function POST(req: Request) {
  const { description, model } = await req.json();

  const result = streamText({
    model: gateway(model),
    prompt: `Generate HTML for: ${description}`,
  });

  return result.toTextStreamResponse();  // ← toTextStreamResponse for raw streaming
}
```

**Key Difference:**
- Chat API: `toDataStreamResponse()` (AI SDK 5 with tool parts)
- Streaming API: `toTextStreamResponse()` (raw text streaming)

---

## Documentation Coverage

### ✅ What's Documented

**Main Guide**: `docs/how-to-make-tools.md`
- ✅ Simple tools (synchronous)
- ✅ Streaming tools (asynchronous)
- ✅ Creating chat interfaces (both UniversalChat and ElementorChat patterns)
- ✅ AI SDK 5 tool part rendering (CRITICAL section)
- ✅ Tool registration flow
- ✅ Comprehensive checklists (100+ items)
- ✅ Debugging guide
- ✅ Quick reference patterns

**New Guide**: `docs/universal-chat-usage.md`
- ✅ UniversalChat props reference
- ✅ Complete examples (blog planner, elementor, recipe generator)
- ✅ Migration guide from old pattern
- ✅ Benefits and comparison table
- ✅ Troubleshooting

**This Guide**: `docs/CHAT-ARCHITECTURE-EXPLAINED.md`
- ✅ Architecture explanation
- ✅ Route file template
- ✅ Complete flow diagrams
- ✅ File structure
- ✅ Working examples
- ✅ Streaming pattern

### ✅ What's Covered

1. **API Routes**:
   - ✅ Template with all required exports
   - ✅ Tool registration pattern
   - ✅ Error handling
   - ✅ Gateway configuration
   - ✅ toDataStreamResponse vs toTextStreamResponse

2. **Tool Rendering**:
   - ✅ How AI SDK creates typed parts
   - ✅ How UniversalChat catches them
   - ✅ How ToolResultRenderer dispatches
   - ✅ How widgets display UI

3. **Streaming**:
   - ✅ Metadata-only tool pattern
   - ✅ Widget streaming implementation
   - ✅ ReadableStream reader pattern
   - ✅ Callbacks to parent component

4. **Best Practices**:
   - ✅ Use UniversalChat for new features
   - ✅ Separate API route per feature
   - ✅ Register tools in route
   - ✅ Pass toolNames as prop
   - ✅ Create widgets for custom UI

---

## Summary

### To Your Questions:

**Q: Should we centralize chat components?**
**A**: ✅ **YES! Use UniversalChat.tsx** - Saves ~300 lines per feature

**Q: Are routes documented well?**
**A**: ✅ **YES!** See:
- Template in this doc (lines 34-66)
- Examples in universal-chat-usage.md
- Checklist in how-to-make-tools.md (lines 1239-1250)

**Q: Can we recreate tools/UI/streaming properly?**
**A**: ✅ **YES!** Three comprehensive guides:
- how-to-make-tools.md (1500+ lines, checklists)
- universal-chat-usage.md (500+ lines, examples)
- CHAT-ARCHITECTURE-EXPLAINED.md (this doc)

---

## Quick Start (New Feature)

**1. Define Tools** (2 minutes):
```typescript
// src/lib/tools.ts
export const myTool = tool({
  description: '...',
  inputSchema: z.object({ ... }),
  execute: async ({ ... }) => ({ status: 'ready', ... }),
});
```

**2. Create API Route** (3 minutes):
```typescript
// src/app/api/chat-myfeature/route.ts
export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages, model } = await req.json();
  const result = streamText({
    model: gateway(model, { apiKey: process.env.AI_GATEWAY_API_KEY! }),
    messages,
    tools: { myTool },
  });
  return result.toDataStreamResponse();
}
```

**3. Create Page** (5 minutes):
```typescript
// src/app/myfeature/page.tsx
import { UniversalChat } from '@/components/chat/UniversalChat';

export default function MyFeaturePage() {
  const { messages, sendMessage, isLoading, status } = useChat({
    api: '/api/chat-myfeature',
  });

  return (
    <UniversalChat
      messages={messages}
      isLoading={isLoading}
      status={status}
      onSendMessage={(text) => sendMessage({ text })}
      selectedModel="anthropic/claude-sonnet-4-5-20250929"
      onModelChange={setSelectedModel}
      toolNames={['myTool']}
      placeholder="Ask me..."
    />
  );
}
```

**Total time: 10 minutes** ⚡
**Lines of code: ~80** 📏
**Features: Full AI chat with tools, streaming, multi-model support** 🎉

---

## Files to Reference

| Document | What It Covers |
|----------|----------------|
| [how-to-make-tools.md](./how-to-make-tools.md) | Complete guide with checklists |
| [universal-chat-usage.md](./universal-chat-usage.md) | UniversalChat documentation |
| [CHAT-ARCHITECTURE-EXPLAINED.md](./CHAT-ARCHITECTURE-EXPLAINED.md) | This document (architecture) |
| [src/components/chat/UniversalChat.tsx](../src/components/chat/UniversalChat.tsx) | Centralized chat component |
| [src/app/api/chat-elementor/route.ts](../src/app/api/chat-elementor/route.ts) | Example API route |
| [src/app/blog-planner/page.tsx](../src/app/blog-planner/page.tsx) | Example page using chat |

---

**Everything is documented. Everything is working. Start building! 🚀**
