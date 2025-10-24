# How to Create and Add New Tools

This guide provides a clear, repeatable process for adding new tools to the chat application. Following these steps will allow you to seamlessly extend the AI's capabilities.

## Tool Types

There are **two types of tools** you can create:

### 1. **Simple Tools** (Synchronous)
- Tool executes immediately and returns data
- Result is displayed in chat
- Example: `getStockPrice`, `searchDocs`

### 2. **Streaming Tools** (Asynchronous with UI)
- Tool returns metadata only
- Triggers a custom widget with streaming logic
- Streams data from separate API endpoint
- Example: `generateHTML` (generates code with live character counts)

---

## Simple Tools (Synchronous)

**IMPORTANT:** Before creating any tool, read the [AI SDK 5: Tool Part Rendering](#ai-sdk-5-tool-part-rendering-critical) section at the end of this document. You MUST add your tool to the chat component's switch statement or it won't render!

## Step 1: Define the Tool (Backend)

All tool definitions live in `src/lib/tools.ts`. This is the single source of truth for all tools in the application.

1.  **Open `src/lib/tools.ts`**.

2.  **Import necessary modules**: You'll always need `tool` from `ai` and `z` from `zod`.

3.  **Add your new tool** to the `tools` object. Use the `tool` helper function from the Vercel AI SDK.

    -   `description`: A clear, concise description of what the tool does. The AI uses this to decide when to use your tool.
    -   `inputSchema`: A schema defined with Zod. This validates the parameters that the AI provides to your tool.
    -   `execute`: An `async` function that contains the logic for your tool. It receives the validated parameters and should return a JSON object with the results.

### Example: Creating a `getStockPrice` Tool

```typescript
// src/lib/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

// A hypothetical function to fetch stock data
async function fetchStockPrice(symbol: string) {
  // In a real scenario, you would call an external API here
  console.log(`Fetching stock price for ${symbol}...`);
  return Math.random() * 1000;
}

export const tools = {
  // ... other existing tools

  getStockPrice: tool({
    description: 'Get the current stock price for a given stock symbol.',
    inputSchema: z.object({
      symbol: z.string().describe('The stock symbol, e.g., GOOGL, AAPL'),
    }),
    execute: async ({ symbol }) => {
      const price = await fetchStockPrice(symbol);
      return {
        symbol,
        price: price.toFixed(2),
        timestamp: new Date().toISOString(),
      };
    },
  }),
};
```

Once you save this file, the AI will automatically have access to this new tool. No changes are needed in the API route (`src/app/api/chat/route.ts`).

---

## Step 2: Create a Custom UI Widget (Optional Frontend)

By default, the tool's result will be displayed as raw JSON. To provide a better user experience, you can create a custom React component to render the result.

1.  **Create a new widget file** in `src/components/tool-ui/`. For our example, let's call it `stock-widget.tsx`.

2.  **Build the component**. It will receive the `result` from the tool's `execute` function as a `data` prop.

### Example: Creating a `StockWidget`

```tsx
// src/components/tool-ui/stock-widget.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface StockData {
  symbol: string;
  price: string;
  timestamp: string;
}

export function StockWidget({ data }: { data: StockData }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-500" />
          Stock Price: {data.symbol.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">${data.price}</p>
        <p className="text-sm text-muted-foreground">
          As of {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## Step 3: Integrate the New Widget (Frontend)

Finally, tell the `ToolResultRenderer` to use your new widget.

1.  **Open `src/components/tool-ui/tool-result-renderer.tsx`**.

2.  **Import your new widget** at the top of the file.

3.  **Add a new `case`** to the `switch` statement. The case should match the name of your tool in `tools.ts` (`getStockPrice` in our example).

### Example: Updating the Renderer

```tsx
// src/components/tool-ui/tool-result-renderer.tsx

// ... other imports
import { StockWidget } from './stock-widget'; // 1. Import your widget

export function ToolResultRenderer({ toolResult }: ToolResultRendererProps) {
  const { toolName, result } = toolResult;

  switch (toolName) {
    // ... other cases

    // 2. Add the new case for your tool
    case 'getStockPrice':
      return <StockWidget data={result} />;

    default:
      // Fallback renderer
      return (
        // ...
      );
  }
}
```

And that's it! The next time the AI uses the `getStockPrice` tool, the frontend will automatically render your custom `StockWidget` instead of the raw JSON.

---

## Troubleshooting & Common Pitfalls

If your tools are not working as expected, check these common issues.

### 1. Backend API Crashes or Returns `TypeError`

If you see an error in your server logs like `TypeError: result.toAIStreamResponse is not a function` or other streaming-related crashes, the cause is almost always an incorrect response method in your API route.

**Solution:**

In your `src/app/api/chat/route.ts`, ensure you are using `toUIMessageStreamResponse()`. This function is specifically designed to work with the `useChat` hook and correctly formats tool calls and results for the frontend UI.

```typescript
// src/app/api/chat/route.ts

// ... inside the POST handler

const result = await streamText({
  // ... model, messages, tools
});

// CORRECT: Use this for UI streaming with tools
return result.toUIMessageStreamResponse();

// INCORRECT: Do NOT use this for UI streaming
// return result.toAIStreamResponse(); 
```

### 2. AI Does Not Use the Tool

If you ask the AI a question that should trigger a tool, but it responds with a generic text answer instead, your system prompt is likely not specific enough.

**Solution:**

Make your system prompt in `src/app/api/chat/route.ts` more direct and explicit. Clearly instruct the model to use the tool when appropriate.

**Weak Prompt (may not work):**
`'You are a helpful assistant with access to tools.'`

**Strong Prompt (more reliable):**
`'You are a helpful assistant with access to tools. Use them when helpful. When a user asks for weather, use the displayWeather tool.'`

By providing clear, direct instructions, you significantly increase the likelihood that the AI will use your tools correctly.

---

## Streaming Tools (Asynchronous with UI)

Streaming tools provide real-time feedback and live updates. The **HTML/CSS/JS generator** in the Elementor Editor is a perfect working example.

### Architecture Overview

```
User Message ("create a hero section")
    ↓
Chat API (/api/chat-elementor)
    ↓
AI calls generateHTML tool
    ↓
Tool returns metadata (NOT code)
    ↓
HTMLGeneratorWidget renders in chat
    ↓
User clicks "Generate" in dialog
    ↓
Widget calls /api/generate-html-stream
    ↓
Streams HTML → CSS → JS sequentially
    ↓
Live updates to Section Editor
```

### Step 1: Define the Tool (Metadata Only)

**Key Principle:** The tool's `execute` function should **NOT** generate the actual content. It should only return metadata to trigger the UI widget.

```typescript
// src/lib/tools.ts
export const htmlGeneratorTool = tool({
  description: 'REQUIRED TOOL: Use this tool whenever a user asks to generate, create, build, or make an HTML section...',
  inputSchema: z.object({
    description: z.string().describe('Detailed description of what to generate'),
    images: z.array(z.object({
      url: z.string(),
      filename: z.string(),
    })).max(3).optional().describe('Optional reference images'),
  }),
  execute: async ({ description, images = [] }) => {
    // KEY POINT: Tool does NOT generate code
    // It only returns metadata to trigger UI
    return {
      description,
      imageCount: images.length,
      images,
      timestamp: new Date().toISOString(),
      status: 'ready_to_generate',
      message: 'HTML generation tool activated. Opening generator interface...'
    };
  },
});
```

**Why this works:**
- Tool execution is synchronous and instant (no slow generation blocking chat)
- Chat can continue responding while generation happens later
- Metadata tells the widget what to generate

### Step 2: Create the Widget Component

The widget handles the actual streaming logic.

```tsx
// src/components/tool-ui/html-generator-widget.tsx
'use client';

import { useState } from 'react';

export function HTMLGeneratorWidget({
  data,
  onStreamUpdate,
  onSwitchCodeTab
}: {
  data: {
    description: string;
    images?: { url: string; filename: string }[];
  };
  onStreamUpdate?: (type: 'html' | 'css' | 'js', content: string) => void;
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js') => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState({ html: '', css: '', js: '' });
  const [currentStep, setCurrentStep] = useState<'html' | 'css' | 'js' | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // STEP 1: Generate HTML
    setCurrentStep('html');
    if (onSwitchCodeTab) onSwitchCodeTab('html');

    const htmlResponse = await fetch('/api/generate-html-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: data.description,
        images: data.images,
        type: 'html'
      }),
    });

    // Stream HTML chunks
    const htmlReader = htmlResponse.body?.getReader();
    const htmlDecoder = new TextDecoder();
    let html = '';

    if (htmlReader) {
      while (true) {
        const { done, value } = await htmlReader.read();
        if (done) break;

        const chunk = htmlDecoder.decode(value);
        html += chunk;

        // Update local state
        setGeneratedCode(prev => ({ ...prev, html }));

        // Stream to parent component (Section Editor)
        if (onStreamUpdate) {
          onStreamUpdate('html', html);
        }
      }
    }

    // STEP 2: Generate CSS (passes HTML as context)
    setCurrentStep('css');
    if (onSwitchCodeTab) onSwitchCodeTab('css');

    const cssResponse = await fetch('/api/generate-html-stream', {
      method: 'POST',
      body: JSON.stringify({
        description: data.description,
        type: 'css',
        generatedHtml: html // CSS prompt uses HTML structure
      }),
    });

    // Stream CSS chunks (similar pattern)
    const cssReader = cssResponse.body?.getReader();
    let css = '';

    if (cssReader) {
      while (true) {
        const { done, value } = await cssReader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        css += chunk;
        setGeneratedCode(prev => ({ ...prev, css }));
        if (onStreamUpdate) onStreamUpdate('css', css);
      }
    }

    // STEP 3: Generate JS (similar pattern)
    setCurrentStep('js');
    if (onSwitchCodeTab) onSwitchCodeTab('js');

    // ... (same streaming pattern for JS)

    setIsGenerating(false);
    setCurrentStep(null);
  };

  return (
    <div>
      <h3>HTML Generator</h3>
      <p>{data.description}</p>

      {/* Live character counts */}
      <div>
        <div className={currentStep === 'html' ? 'active' : ''}>
          {currentStep === 'html' ? '→' : '✓'} HTML: {generatedCode.html.length} characters
        </div>
        <div className={currentStep === 'css' ? 'active' : ''}>
          {currentStep === 'css' ? '→' : '✓'} CSS: {generatedCode.css.length} characters
        </div>
        <div className={currentStep === 'js' ? 'active' : ''}>
          {currentStep === 'js' ? '→' : '✓'} JS: {generatedCode.js.length} characters
        </div>
      </div>

      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
```

**Key Points:**
- Uses `ReadableStream` API for real streaming
- Updates local state on every chunk (reactive character counts)
- Calls `onStreamUpdate()` callback to update parent component
- Sequential generation: HTML → CSS (with HTML context) → JS (with both)

### Step 3: Create the Streaming API Endpoint

```typescript
// src/app/api/generate-html-stream/route.ts
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export async function POST(req: Request) {
  const {
    description,
    type = 'html', // 'html', 'css', or 'js'
    generatedHtml = '',
    generatedCss = '',
  } = await req.json();

  const prompts = {
    html: `Generate semantic HTML5 for: ${description}

Rules:
- NO markdown fences (\`\`\`)
- NO DOCTYPE, html, head, body tags
- NO style or script tags
- Pure HTML only
- Use semantic tags (header, section, nav, etc.)
- Add ARIA labels for accessibility`,

    css: `Generate CSS to style this HTML:

${generatedHtml}

Rules:
- NO markdown fences
- NO <style> tags
- Pure CSS only
- Use CSS custom properties at top
- Mobile-first responsive design
- Modern CSS (Grid, Flexbox)`,

    js: `Generate JavaScript for this section:

HTML:
${generatedHtml}

CSS:
${generatedCss}

Rules:
- NO markdown fences
- NO <script> tags
- Pure JavaScript only
- Vanilla ES6+
- Add interactivity (if needed)
- Return "// No JavaScript needed" if no JS required`
  };

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4-5-20250929', {
      apiKey: process.env.AI_GATEWAY_API_KEY!,
    }),
    prompt: prompts[type],
    temperature: 0.7,
  });

  // This returns a streaming Response
  return result.toTextStreamResponse();
}
```

**Key Points:**
- Uses `streamText()` from AI SDK
- `toTextStreamResponse()` returns streaming `Response` object
- Each type (html/css/js) has specialized prompt
- CSS/JS prompts receive generated code as context

### Step 4: Register Widget in Tool Result Renderer

```tsx
// src/components/tool-ui/tool-result-renderer.tsx
import { HTMLGeneratorWidget } from './html-generator-widget';

export function ToolResultRenderer({
  toolResult,
  onStreamUpdate,
  onSwitchCodeTab
}: ToolResultRendererProps) {
  const { toolName, result } = toolResult;

  switch (toolName) {
    case 'generateHTML':
      return (
        <HTMLGeneratorWidget
          data={result}
          onStreamUpdate={onStreamUpdate}
          onSwitchCodeTab={onSwitchCodeTab}
        />
      );

    // ... other cases

    default:
      return <pre>{JSON.stringify(result, null, 2)}</pre>;
  }
}
```

### Step 5: Pass Callbacks from Parent Component

The parent component (like `ChatInterface.tsx`) needs to provide the callbacks:

```tsx
// src/components/elementor/ChatInterface.tsx (or similar)
<ToolResultRenderer
  toolResult={toolResult}
  onStreamUpdate={(type, content) => {
    // Update the Section Editor in real-time
    setStreamedCode(prev => ({ ...prev, [type]: content }));
  }}
  onSwitchCodeTab={(tab) => {
    // Switch to HTML/CSS/JS tab
    setActiveCodeTab(tab);
  }}
/>
```

### Why This Pattern Works

✅ **Clean Separation of Concerns**
- Tool execution = metadata only (fast, synchronous)
- UI rendering = immediate (dialog opens)
- Code generation = async streaming (separate API call)

✅ **Real Streaming (Not Fake)**
- Uses native `ReadableStream` API
- Actual text chunks from AI SDK
- Updates UI on every chunk
- No buffering or delays

✅ **Sequential Generation**
- HTML first (structure)
- CSS second (uses HTML context)
- JS third (uses both HTML/CSS context)
- Each step completes before next starts

✅ **Live UI Updates**
- Character counts update in real-time
- Tab switching shows current generation
- Progress indicators (→ and ✓)
- Streamed directly to Monaco editor

✅ **Proper Error Handling**
- `try/catch` wraps generation
- Sets `isGenerating = false` on error
- Shows error message to user

---

## Comparison: Simple vs Streaming Tools

| Feature | Simple Tool | Streaming Tool |
|---------|-------------|----------------|
| **Tool execute()** | Returns full data | Returns metadata only |
| **Generation speed** | Synchronous (blocks chat) | Asynchronous (doesn't block) |
| **UI updates** | Once (after complete) | Real-time (every chunk) |
| **API endpoint** | None needed | Separate streaming endpoint |
| **Use cases** | Quick lookups, searches | Code generation, long content |
| **Example** | `getStockPrice` | `generateHTML` |

---

## AI SDK 5: Tool Part Rendering (CRITICAL)

**IMPORTANT:** Vercel AI SDK 5 uses **typed tool parts** instead of generic `'tool-result'` types. Each tool creates message parts with type `'tool-TOOLNAME'`.

### The Problem

When using `useChat` with AI SDK 5, tool invocations are returned as message parts with type-specific identifiers:

```typescript
// AI SDK 5 creates parts like this:
{
  type: 'tool-testPing',  // NOT 'tool-result'
  output: { ... },
  toolCallId: '...',
  // ...
}
```

**If your chat component doesn't handle these typed parts, tool results will not render** (blank/empty UI).

### The Solution

**Step 1: Handle Typed Tool Parts in Your Chat Component**

In your chat rendering component (e.g., `ChatInterface.tsx` or `ElementorChat.tsx`), you must add cases for each tool type:

```tsx
// src/components/elementor/ElementorChat.tsx (example)

{message.parts.map((part, i) => {
  switch (part.type) {
    case 'text':
      return <div key={i}>{part.text}</div>;

    // CRITICAL: Add cases for each tool
    case 'tool-testPing':
    case 'tool-switchTab':
    case 'tool-generateHTML':
    case 'tool-updateSectionHtml':
    // ... add ALL your tools here
    {
      // Extract tool name from part type
      const toolName = part.type.replace('tool-', '');

      // If tool has finished (has output/result)
      if (part.output || part.result) {
        const result = part.output ?? part.result;

        return (
          <ToolResultRenderer
            key={i}
            toolResult={{
              toolCallId: part.toolCallId ?? '',
              toolName,
              args: part.input ?? part.args ?? {},
              result: result.type === 'json' ? result.value : result,
            }}
          />
        );
      }

      // Tool is still executing (show input only)
      return (
        <Tool key={i} defaultOpen>
          <ToolHeader type={toolName} state="input-available" />
          <ToolContent>
            <ToolInput input={part.input ?? part.args ?? {}} />
          </ToolContent>
        </Tool>
      );
    }

    default:
      console.warn('Unknown part type:', part.type);
      return null;
  }
})}
```

### Key Points

1. **Every tool needs a case** - If you add a new tool, you MUST add it to the switch statement
2. **Pattern: `'tool-TOOLNAME'`** - The part type is always `'tool-'` + the tool name from `tools.ts`
3. **Check for result** - Use `part.output || part.result` to detect if tool has finished
4. **Extract tool name** - Use `.replace('tool-', '')` to get the original tool name

### Why This Pattern?

AI SDK 5 provides:
- **Type safety** - TypeScript knows the exact shape of each tool's input/output
- **Streaming support** - Tool inputs stream as the model generates them
- **State tracking** - The `state` property tells you if a tool is executing, finished, or failed

### Debugging Tool Rendering

If your tool results aren't showing:

**1. Check Browser Console**

Look for logs like:
```
🎨 Rendering message part: { type: 'tool-testPing', output: {...} }
```

If you see `type: 'tool-TOOLNAME'` but no widget renders, you're missing a case in your switch statement.

**2. Check Server Logs**

Look for tool execution:
```
🏓 TEST PING TOOL EXECUTED! { message: '...' }
```

If tool executes but UI is blank, it's a **frontend rendering issue**, not a backend issue.

**3. Verify Tool Name Matches**

The case in your switch statement MUST exactly match the tool name:
```typescript
// tools.ts
export const tools = {
  testPing: tool({ ... }),  // ← Tool name is 'testPing'
};

// ChatInterface.tsx
case 'tool-testPing':  // ← Must be 'tool-' + exact tool name
```

---

## Real-World Example Reference

The **HTML/CSS/JS generator** in the Elementor Editor (`/elementor-editor`) is a production-ready implementation:

- **Tool:** [src/lib/tools.ts:174-195](src/lib/tools.ts#L174-L195)
- **Widget:** [src/components/tool-ui/html-generator-widget.tsx](src/components/tool-ui/html-generator-widget.tsx)
- **API:** [src/app/api/generate-html-stream/route.ts](src/app/api/generate-html-stream/route.ts)
- **Chat Renderer:** [src/components/elementor/ElementorChat.tsx:182-227](src/components/elementor/ElementorChat.tsx#L182-L227)
- **Tool Renderer:** [src/components/tool-ui/tool-result-renderer.tsx](src/components/tool-ui/tool-result-renderer.tsx)

Study these files to see a complete working implementation with:
- **Typed tool part handling** (AI SDK 5 pattern)
- Sequential streaming (HTML → CSS → JS)
- Live character count updates
- Tab switching during generation
- Image analysis with Claude Haiku vision
- Error handling and loading states

---
