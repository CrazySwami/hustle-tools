# Universal Chat Component Usage Guide

## Overview

The `UniversalChat` component is a **centralized, reusable chat interface** that works for ALL features in the app. Instead of copying ElementorChat.tsx for each new feature, you now use this single component.

## Location

**File**: `src/components/chat/UniversalChat.tsx`

## Key Features

✅ **Single component for all chat interfaces**
✅ **Dynamic tool registration** - Just pass tool names as props
✅ **Optional callbacks** - Only pass what your feature needs
✅ **Customizable empty states & placeholders**
✅ **AI SDK 5 typed tool part handling** built-in
✅ **Web search toggle** (optional)
✅ **Model selector** (Claude, GPT, Gemini, Perplexity)

---

## Basic Usage

### Example 1: Blog Planner (Simplest)

```typescript
// src/app/blog-planner/page.tsx
import { UniversalChat } from '@/components/chat/UniversalChat';
import { Calendar } from 'lucide-react';

export default function BlogPlannerPage() {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4-5-20250929');

  const { messages, sendMessage, isLoading, status, reload } = useChat({
    api: '/api/chat-blog-planner',
    body: { model: selectedModel },
  });

  const handleSendMessage = (text, imageData, settings) => {
    sendMessage({ text }, { body: { model: selectedModel, ...settings } });
  };

  return (
    <UniversalChat
      messages={messages}
      isLoading={isLoading}
      status={status}
      onSendMessage={handleSendMessage}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      onReload={reload}

      // 🎯 TOOL REGISTRATION - Just list your tool names!
      toolNames={['planBlogTopics', 'writeBlogPost']}

      // 🎨 CUSTOMIZATION
      placeholder="Ask me to plan blog topics or write a blog post..."
      emptyState={
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Start Planning Your Content</h2>
          <p className="text-muted-foreground">Ask me to plan blog topics for any month.</p>
        </div>
      }
    />
  );
}
```

**That's it!** No need to copy 300+ lines of chat code.

---

### Example 2: Elementor Editor (With Callbacks)

```typescript
// src/app/elementor-editor/page.tsx
import { UniversalChat } from '@/components/chat/UniversalChat';

export default function ElementorEditorPage() {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [currentSection, setCurrentSection] = useState(null);

  const { messages, sendMessage, isLoading, status, reload } = useChat({
    api: '/api/chat-elementor',
    body: { model: selectedModel },
  });

  const handleStreamUpdate = (type: 'html' | 'css' | 'js', content: string) => {
    // Update editor with streamed content
    setStreamedCode(prev => ({ ...prev, [type]: content }));
  };

  const handleSwitchCodeTab = (tab: 'html' | 'css' | 'js') => {
    setActiveCodeTab(tab);
  };

  return (
    <UniversalChat
      messages={messages}
      isLoading={isLoading}
      status={status}
      onSendMessage={(text, imageData, settings) => {
        sendMessage({ text }, { body: { model: selectedModel, ...settings } });
      }}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      onReload={reload}

      // 🎯 TOOL REGISTRATION
      toolNames={[
        'generateHTML',
        'editCode',
        'updateSectionHtml',
        'updateSectionCss',
        'updateSectionJs',
        'viewEditorCode',
        'switchTab'
      ]}

      // 🔗 FEATURE-SPECIFIC CALLBACKS (optional!)
      onStreamUpdate={handleStreamUpdate}
      onSwitchCodeTab={handleSwitchCodeTab}
      onSwitchTab={(tab) => setActiveTab(tab)}
      currentSection={currentSection}

      // 🎨 CUSTOMIZATION
      placeholder="Ask me to modify the Elementor JSON..."
    />
  );
}
```

---

## Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `messages` | `any[]` | Messages array from `useChat` |
| `isLoading` | `boolean` | Loading state from `useChat` |
| `onSendMessage` | `function` | Callback to send messages |
| `selectedModel` | `string` | Current AI model |
| `onModelChange` | `function` | Model change handler |
| `toolNames` | `string[]` | **Array of tool names to register** |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `string` | - | Chat status (streaming, etc.) |
| `onReload` | `function` | - | Regenerate message handler |
| `emptyState` | `ReactNode` | - | Custom empty state UI |
| `placeholder` | `string` | `"Ask me anything..."` | Input placeholder text |
| `showWebSearch` | `boolean` | `true` | Show web search toggle |
| `onStreamUpdate` | `function` | - | Streaming content callback |
| `onSwitchCodeTab` | `function` | - | Code tab switching callback |
| `onSwitchTab` | `function` | - | General tab switching |
| `onSwitchToSectionEditor` | `function` | - | Section editor callback |
| `onUpdateSection` | `function` | - | Section update callback |
| `currentSection` | `any` | - | Current section data |

---

## How Tool Registration Works

**Old Way (ElementorChat.tsx):**
```typescript
switch (part.type) {
  case 'tool-generateHTML':     // Hard-coded
  case 'tool-editCode':          // Hard-coded
  case 'tool-updateSectionHtml': // Hard-coded
    return <ToolResultRenderer ... />;
}
```

**New Way (UniversalChat):**
```typescript
// Just pass tool names as a prop!
<UniversalChat
  toolNames={['generateHTML', 'editCode', 'updateSectionHtml']}
/>

// UniversalChat dynamically checks if part.type matches any registered tool
const isRegisteredTool = (partType: string): boolean => {
  if (!partType.startsWith('tool-')) return false;
  const toolName = partType.replace('tool-', '');
  return toolNames.includes(toolName);
};
```

**Result**: No more copying switch statements! Just list your tools.

---

## Migration Guide

### Migrating from ElementorChat/BlogPlannerChat

**Before (BlogPlannerChat.tsx - 311 lines):**
```typescript
// src/components/blog-planner/BlogPlannerChat.tsx
export function BlogPlannerChat({ messages, isLoading, ... }) {
  // 300+ lines of code
  switch (part.type) {
    case 'tool-planBlogTopics':
    case 'tool-writeBlogPost':
      // ...
  }
}

// src/app/blog-planner/page.tsx
import { BlogPlannerChat } from '@/components/blog-planner/BlogPlannerChat';

<BlogPlannerChat
  messages={messages}
  isLoading={isLoading}
  status={status}
  onSendMessage={handleSendMessage}
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  onReload={reload}
/>
```

**After (Universal - 3 lines):**
```typescript
// No separate chat file needed!
// src/app/blog-planner/page.tsx
import { UniversalChat } from '@/components/chat/UniversalChat';

<UniversalChat
  messages={messages}
  isLoading={isLoading}
  status={status}
  onSendMessage={handleSendMessage}
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  onReload={reload}
  toolNames={['planBlogTopics', 'writeBlogPost']}
  placeholder="Ask me to plan blog topics..."
/>
```

**Savings**: **308 lines of code eliminated** per feature! 🎉

---

## Complete Example: New Feature From Scratch

Let's create a "Recipe Generator" feature:

### 1. Define Tools (src/lib/tools.ts)

```typescript
export const generateRecipe = tool({
  description: 'Generate a recipe based on ingredients and dietary preferences',
  inputSchema: z.object({
    ingredients: z.array(z.string()).describe('Available ingredients'),
    cuisine: z.string().describe('Cuisine type'),
    dietary: z.enum(['vegetarian', 'vegan', 'gluten-free', 'none']),
  }),
  execute: async ({ ingredients, cuisine, dietary }) => {
    return {
      status: 'ready_to_generate',
      ingredients,
      cuisine,
      dietary,
      timestamp: new Date().toISOString(),
    };
  },
});

export const analyzeNutrition = tool({
  description: 'Analyze nutritional content of a recipe',
  inputSchema: z.object({
    recipe: z.string().describe('Recipe text'),
  }),
  execute: async ({ recipe }) => {
    return { status: 'ready_to_analyze', recipe };
  },
});
```

### 2. Create API Route (src/app/api/chat-recipes/route.ts)

```typescript
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest } from 'next/server';
import { generateRecipe, analyzeNutrition } from '@/lib/tools';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'anthropic/claude-sonnet-4-5-20250929' } = await req.json();

    const result = streamText({
      model: gateway(model, { apiKey: process.env.AI_GATEWAY_API_KEY! }),
      messages,
      tools: {
        generateRecipe,
        analyzeNutrition,
      },
      temperature: 0.7,
      maxTokens: 4000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### 3. Create Page (src/app/recipes/page.tsx)

```typescript
'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { UniversalChat } from '@/components/chat/UniversalChat';
import { ChefHat } from 'lucide-react';

export default function RecipesPage() {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4-5-20250929');

  const { messages, sendMessage, isLoading, status, reload } = useChat({
    api: '/api/chat-recipes',
    body: { model: selectedModel },
  });

  const handleSendMessage = (text, imageData, settings) => {
    sendMessage({ text }, { body: { model: selectedModel, ...settings } });
  };

  return (
    <div className="flex h-screen overflow-hidden pt-16">
      <div className="flex-1">
        <div className="border-b p-4 bg-card">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Recipe Generator
          </h1>
        </div>

        <div className="h-[calc(100vh-8rem)] p-4">
          <UniversalChat
            messages={messages}
            isLoading={isLoading}
            status={status}
            onSendMessage={handleSendMessage}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onReload={reload}

            // 🎯 Just register your tools!
            toolNames={['generateRecipe', 'analyzeNutrition']}

            // 🎨 Customize UI
            placeholder="Tell me what ingredients you have..."
            emptyState={
              <div className="flex flex-col items-center justify-center h-full">
                <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">What's in your fridge?</h2>
                <p className="text-muted-foreground">
                  Tell me what ingredients you have and I'll create a delicious recipe!
                </p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
```

### 4. Create Widget (src/components/tool-ui/recipe-widget.tsx)

```typescript
'use client';

export function RecipeWidget({ data }: { data: any }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Recipe Generator</h3>
      <p>Ingredients: {data.ingredients.join(', ')}</p>
      <p>Cuisine: {data.cuisine}</p>
      <p>Dietary: {data.dietary}</p>
    </div>
  );
}
```

### 5. Register Widget (src/components/tool-ui/tool-result-renderer.tsx)

```typescript
import { RecipeWidget } from './recipe-widget';

// In switch statement:
case 'generateRecipe':
  return <RecipeWidget data={result} />;
```

**Done!** New feature in 5 files, ~150 lines total instead of ~500 lines with separate chat component.

---

## Benefits

### ✅ **Less Code Duplication**
- **Before**: 311-384 lines per chat component
- **After**: 0 lines (use UniversalChat)
- **Savings**: ~300 lines per feature

### ✅ **Easier Maintenance**
- Bug fix in UniversalChat? All features get it automatically
- Want to add a new AI model? Update once, works everywhere
- UI improvements propagate to all chats

### ✅ **Faster Development**
- New feature? Just register tools and add API route
- No need to copy/modify 300+ lines of chat code
- Focus on your tools and widgets, not chat infrastructure

### ✅ **Type Safety**
- TypeScript props ensure you don't miss required fields
- IDE autocomplete for all callbacks

### ✅ **Flexibility**
- Only pass callbacks your feature needs
- Custom empty states per feature
- Toggle web search on/off
- Custom placeholders

---

## When to Use

**Use UniversalChat for:**
- ✅ New chat-based features
- ✅ Tools that need AI interaction
- ✅ Features with streaming content
- ✅ Multi-model support

**Don't use UniversalChat for:**
- ❌ Non-chat interfaces
- ❌ Static forms
- ❌ Direct API calls without conversation

---

## Troubleshooting

### Tools not rendering?

**Check:**
1. Tool names in `toolNames` prop match exactly (case-sensitive)
2. Tools are registered in API route's `tools` object
3. Browser console shows `type: 'tool-TOOLNAME'`

### Callbacks not working?

**Check:**
1. Callback is passed as prop to UniversalChat
2. Widget calls the callback from ToolResultRenderer props
3. ToolResultRenderer passes callback to widget

### Empty state not showing?

**Check:**
1. `messages.length === 0`
2. `emptyState` prop is valid React element
3. No error in browser console

---

## Comparison Table

| Feature | Old Way (ElementorChat) | New Way (UniversalChat) |
|---------|------------------------|-------------------------|
| **Lines of code per feature** | 311-384 | 0 (reuse) |
| **Tool registration** | Hard-coded switch cases | Dynamic prop array |
| **Customization** | Edit entire file | Pass props |
| **Maintenance** | Fix in each file | Fix once |
| **Development time** | 30 minutes | 5 minutes |
| **Type safety** | Partial | Full |

---

## Next Steps

1. **Migrate existing features** (optional):
   - Replace ElementorChat with UniversalChat
   - Replace BlogPlannerChat with UniversalChat
   - Delete old chat files

2. **Create new features** using UniversalChat:
   - Define tools in `tools.ts`
   - Create API route with tool registration
   - Use UniversalChat with `toolNames` prop
   - Create widgets for custom UI

3. **Customize** as needed:
   - Add callbacks for feature-specific behavior
   - Create custom empty states
   - Adjust placeholders

---

## Summary

**UniversalChat is now the recommended way to create chat interfaces.** It eliminates code duplication, speeds up development, and makes maintenance easier.

**3 simple steps:**
1. Register tools in API route
2. Pass `toolNames` to UniversalChat
3. Done!

No more copying 300+ lines of chat code for every feature! 🎉
