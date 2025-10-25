# How to Create and Add New Tools

This guide provides a clear, repeatable process for adding new tools to the chat application. Following these steps will allow you to seamlessly extend the AI's capabilities.

## Table of Contents

1. [**Standard Tool UI Design** ⭐ START HERE](#standard-tool-ui-design)
2. [Step-Based Planning UI](#step-based-planning-ui-advanced)
3. [Tool Types Overview](#tool-types)
4. [Global State Management with Tools](#global-state-management-with-tools)
5. [Simple Tools (Synchronous)](#simple-tools-synchronous)
6. [Streaming Tools (Asynchronous)](#streaming-tools-asynchronous-with-ui)
7. [Creating a Chat Interface](#creating-a-chat-interface-complete-guide)
8. [AI SDK 5 Tool Part Rendering](#ai-sdk-5-tool-part-rendering-critical)
9. [Troubleshooting](#troubleshooting--common-pitfalls)
10. [Checklists](#implementation-checklists)

---

## Standard Tool UI Design

**The canonical design system for ALL tool widgets in this application.**

When creating tool UIs, follow this standardized design to ensure consistency, polish, and excellent UX across all features.

### Design Principles

1. **Clean, Compact Layout** - Matches AI Elements design system from https://ai-sdk.dev/elements/components/
2. **Smooth Animations** - All state transitions animate (200-300ms duration)
3. **Collapsible Sections** - Keep UI lightweight, user controls information density
4. **Clear Visual Hierarchy** - Consistent spacing (`gap-2.5`, `space-y-3`, etc.)
5. **Color-Coded Status** - Green = success, Blue = info/loading, Red = error
6. **Tools Render Outside Chat Bubbles** - Full-width widgets for better visibility

### Reference Implementation

See [StandardToolWidget.tsx](../src/components/tool-ui/StandardToolWidget.tsx) for the complete reference implementation.

### Anatomy of a Standard Tool Widget

```
┌─────────────────────────────────────────────────────────┐
│  [Icon] Tool Title                            [Chevron] │  ← Header (always visible)
│         Description text                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Main Content Area (collapsible)                       │  ← Content (expandable)
│  - Data display                                        │
│  - Interactive elements                                │
│  - Preview/results                                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                           [Action Button] [Cancel] │  ← Footer (conditional)
└─────────────────────────────────────────────────────────┘
```

### Visual Specification

**Container:**
```tsx
className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden
           animate-in fade-in slide-in-from-bottom-2 duration-300"
```

**Header:**
```tsx
className="flex items-center justify-between border-b border-border/50 px-4 py-3
           transition-colors duration-200"
```

**Icon Badge:**
```tsx
className="flex h-7 w-7 items-center justify-center rounded-md
           transition-all duration-200 bg-blue-500/10"  // Changes color by status
```

**Chevron Toggle:**
```tsx
className="h-3 w-3 transition-transform duration-200
           ${isExpanded ? 'rotate-180' : ''}"
```

**Content:**
```tsx
className="animate-in slide-in-from-top-2 fade-in duration-200"
```

**Footer:**
```tsx
className="flex items-center justify-end gap-2 border-t border-border/50
           px-4 py-3 bg-muted/20"
```

### Animation Guidelines

**1. Initial Render:**
```tsx
// Entire widget fades in and slides up from bottom
animate-in fade-in slide-in-from-bottom-2 duration-300
```

**2. Expand/Collapse:**
```tsx
// Content slides down from top when expanding
{isExpanded && (
  <div className="animate-in slide-in-from-top-2 fade-in duration-200">
    {/* content */}
  </div>
)}

// Chevron rotates smoothly
<ChevronDown className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
```

**3. Status Changes:**
```tsx
// Icon changes with smooth transition
className="transition-all duration-200 ${statusConfig.bgColor}"

// Background color transitions
className="transition-colors duration-200 ${statusBgColor}"
```

**4. Loading State:**
```tsx
<Loader2 className="h-4 w-4 animate-spin" />  // Built-in spin animation
```

**5. Success Animation:**
```tsx
// Success banner at top
<div className="animate-in fade-in slide-in-from-top-1 duration-300">
  <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in duration-300" />
</div>
```

### Color System

**Status Colors:**
```typescript
const statusColors = {
  idle: {
    icon: 'text-muted-foreground',
    bg: 'bg-muted/10',
    border: 'border-border/50',
  },
  loading: {
    icon: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    headerBg: 'bg-blue-500/5',  // Subtle header tint during loading
  },
  success: {
    icon: 'text-green-600',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    headerBg: 'bg-green-500/5',
  },
  error: {
    icon: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    headerBg: 'bg-red-500/5',
  },
};
```

**Semantic Colors:**
- **Primary Action** - Default button color or green for positive actions
- **Muted Background** - `bg-muted/20` for footer/secondary areas
- **Border** - `border-border/50` for subtle separators
- **Text Hierarchy** - `font-medium` for labels, `text-muted-foreground` for secondary

### Spacing Scale

**Consistent spacing throughout:**
```typescript
gap-1      // 4px  - Very tight (icon + text)
gap-1.5    // 6px  - Tight (inline elements)
gap-2      // 8px  - Default inline spacing
gap-2.5    // 10px - Header elements
gap-3      // 12px - Section spacing

space-y-1.5  // 6px  - Form field spacing
space-y-2    // 8px  - List item spacing
space-y-3    // 12px - Content block spacing

px-4  // 16px - Horizontal padding
py-3  // 12px - Vertical padding (header/footer)
```

### Typography

**Size Scale:**
```typescript
text-xs    // 12px - Descriptions, metadata
text-sm    // 14px - Body text, titles
text-base  // 16px - (rarely used in tools)

font-medium  // 500 - Titles, labels
font-semibold // 600 - (sparingly for emphasis)
```

### Interactive Elements

**Buttons:**
```tsx
<Button
  size="sm"              // h-8 height
  className="h-8 text-xs transition-all duration-200"
>
  {status === 'loading' ? (
    <>
      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
      Loading...
    </>
  ) : (
    <>
      <CheckCircle2 className="mr-1.5 h-3 w-3" />
      Success
    </>
  )}
</Button>
```

**Collapsible Headers:**
```tsx
<button
  onClick={() => setIsExpanded(!isExpanded)}
  className="w-full flex items-center justify-between px-4 py-2.5
             hover:bg-muted/30 transition-colors"
>
  <span className="text-xs font-medium text-muted-foreground">
    Section Title ({itemCount})
  </span>
  <ChevronDown className={`h-3 w-3 transition-transform duration-200
                           ${isExpanded ? 'rotate-180' : ''}`} />
</button>
```

### Examples by Use Case

#### 1. Simple Data Display Tool

```tsx
// Example: Stock price lookup
export function StockPriceWidget({ result }: { result: StockData }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-500/10">
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">{result.symbol}</h3>
          <p className="text-xs text-muted-foreground">${result.price}</p>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Change:</span>
            <span className={result.change > 0 ? 'text-green-600' : 'text-red-600'}>
              {result.change > 0 ? '+' : ''}{result.change}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Volume:</span>
            <span>{result.volume.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2. Confirmation Tool (Interactive)

```tsx
// Example: Google Search confirmation
export function SearchConfirmWidget({ args }: { args: SearchParams }) {
  const [status, setStatus] = useState<'pending' | 'loading' | 'complete'>('pending');
  const [keyword, setKeyword] = useState(args.keyword);

  const handleSearch = async () => {
    setStatus('loading');
    // ... search logic
    setStatus('complete');
  };

  if (status === 'complete') {
    return <SearchResultsWidget result={searchData} />;
  }

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={`border-b border-border/50 px-4 py-3 transition-colors duration-200
                       ${status === 'loading' ? 'bg-blue-500/5' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200
                          ${status === 'loading' ? 'bg-blue-500/10 animate-pulse' : 'bg-muted/10'}`}>
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium">
              {status === 'loading' ? 'Searching Google...' : 'Confirm Search'}
            </h3>
            <p className="text-xs text-muted-foreground">Review parameters</p>
          </div>
        </div>
      </div>

      {/* Loading progress bar */}
      {status === 'loading' && (
        <div className="relative h-1 bg-muted overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500
                          animate-loading-bar" />
        </div>
      )}

      <div className="p-4 space-y-3">
        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 border-t border-border/50 px-4 py-3 bg-muted/20">
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          Cancel
        </Button>
        <Button
          onClick={handleSearch}
          disabled={status === 'loading'}
          size="sm"
          className="h-8 text-xs transition-all duration-200"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-1.5 h-3 w-3" />
              Search Google
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

#### 3. Results List Tool

```tsx
// Example: Search results
export function SearchResultsWidget({ result }: { result: SearchResult }) {
  const [expandedSections, setExpandedSections] = useState({
    organic: true,
    related: false,
  });

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card">
      {/* Success banner */}
      <div className="border-b border-green-500/20 bg-green-500/5 p-3
                      animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in duration-300" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Search completed successfully
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
          <Search className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium truncate">{result.keyword}</h3>
          <p className="text-xs text-muted-foreground">
            {result.totalResults.toLocaleString()} results
          </p>
        </div>
      </div>

      {/* Organic Results - Collapsible */}
      <div className="border-b border-border/50">
        <button
          onClick={() => setExpandedSections(prev => ({ ...prev, organic: !prev.organic }))}
          className="w-full flex items-center justify-between px-4 py-2.5
                     hover:bg-muted/30 transition-colors"
        >
          <span className="text-xs font-medium text-muted-foreground">
            Organic Results ({result.organicResults.length})
          </span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200
                                   ${expandedSections.organic ? 'rotate-180' : ''}`} />
        </button>

        {expandedSections.organic && (
          <div className="divide-y divide-border/30">
            {result.organicResults.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:bg-muted/20 transition-colors group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full
                                  bg-primary/10 text-[10px] font-semibold text-primary
                                  flex-shrink-0 mt-0.5">
                    {item.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                      <h4 className="text-sm font-medium text-blue-600 group-hover:underline
                                    line-clamp-2 flex-1">
                        {item.title}
                      </h4>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0
                                                group-hover:opacity-100 transition-opacity
                                                flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                      {item.displayedLink}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {item.snippet}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Custom Animations

**Loading Bar Animation:**
```tsx
<style jsx global>{`
  @keyframes loading-bar {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }

  .animate-loading-bar {
    animation: loading-bar 2s ease-in-out infinite;
  }
`}</style>

{/* Usage */}
<div className="relative h-1 bg-muted overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500
                  animate-loading-bar" />
</div>
```

### Checklist for New Tool Widgets

When creating a new tool widget, verify:

- [ ] **Container** - Uses standard rounded-lg border with fade-in animation
- [ ] **Header** - Icon badge (h-7 w-7), title, description, chevron toggle
- [ ] **Collapsible** - Content wrapped in conditional with slide-in animation
- [ ] **Status Colors** - Green (success), Blue (loading), Red (error), Muted (idle)
- [ ] **Spacing** - Consistent px-4 py-3 padding, gap-2.5 for elements
- [ ] **Typography** - text-sm for titles, text-xs for descriptions
- [ ] **Transitions** - All color/transform changes have transition-* classes
- [ ] **Loading States** - Shows Loader2 spinner with animate-spin
- [ ] **Success Animation** - CheckCircle2 with zoom-in if applicable
- [ ] **Hover States** - Interactive elements have hover:bg-muted/30
- [ ] **Icons** - Consistent h-3 w-3 or h-4 w-4 sizing
- [ ] **Responsive** - Uses truncate, line-clamp-* for long text
- [ ] **Accessibility** - Buttons have aria-labels, semantic HTML
- [ ] **Tools Render Outside Bubbles** - Widget rendered outside <Message> component

### Common Patterns Library

**Pattern: Status-Driven Icon Badge**
```tsx
const getStatusIcon = () => {
  switch (status) {
    case 'loading':
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <YourIcon className="h-4 w-4 text-muted-foreground" />;
  }
};
```

**Pattern: Collapsible Section**
```tsx
const [isOpen, setIsOpen] = useState(true);

<div>
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="w-full flex items-center justify-between px-4 py-2.5
               hover:bg-muted/30 transition-colors"
  >
    <span className="text-xs font-medium text-muted-foreground">
      Section ({itemCount})
    </span>
    <ChevronDown className={`h-3 w-3 transition-transform duration-200
                             ${isOpen ? 'rotate-180' : ''}`} />
  </button>
  {isOpen && (
    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
      {/* content */}
    </div>
  )}
</div>
```

**Pattern: Success Banner**
```tsx
{status === 'success' && (
  <div className="border-b border-green-500/20 bg-green-500/5 p-3
                  animate-in fade-in slide-in-from-top-1 duration-300">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in duration-300" />
      <p className="text-sm font-medium text-green-700 dark:text-green-400">
        Operation completed successfully
      </p>
    </div>
  </div>
)}
```

**Pattern: Error Display**
```tsx
{error && (
  <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
    <div className="flex items-start gap-2">
      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-red-600">Error occurred</p>
        <p className="text-xs text-red-600/80 mt-1">{error}</p>
      </div>
    </div>
  </div>
)}
```

---

## Step-Based Planning UI (Advanced)

**Build AI agents that break down complex tasks into visual, trackable steps with collapsible tool results.**

### What is Step-Based Planning?

Instead of the AI executing one tool and responding, **step-based planning** allows the AI to:

1. **Plan** - Break down complex requests into numbered steps
2. **Execute** - Run multiple tools sequentially to complete each step
3. **Track** - Show visual progress indicators (loading → complete)
4. **Collapse** - Display tool results in collapsible accordions for clean UI

**Example User Flow:**

```
User: "Research Elementor widget development and create a custom widget generator"

AI Response with Steps:
  ✓ Step 1: Research Elementor widget structure (WebSearch tool)
  → Step 2: Analyze PHP, JS, CSS requirements (tool-analyzeCode)
  ⏳ Step 3: Design widget generator architecture
  ⏳ Step 4: Implement streaming widget generator
```

Each step shows:
- **Status indicator** - ✓ (complete), → (in progress), ⏳ (pending)
- **Collapsible content** - Click to expand/collapse tool results
- **Real-time updates** - Steps update as AI works through them

### How It Works (AI SDK Architecture)

Vercel AI SDK 5 provides built-in support for multi-step reasoning:

```typescript
// Backend: Enable multi-step tool calling
streamText({
  model: yourModel,
  maxSteps: 10,  // ← Allow up to 10 sequential tool calls
  messages,
  tools: {
    webSearch: webSearchTool,
    analyzeCode: analyzeCodeTool,
    generateWidget: generateWidgetTool,
  },
  onStepFinish: ({ text, toolCalls, toolResults, stepType, finishReason }) => {
    // Called after each step completes
    console.log('Step finished:', { stepType, toolCalls: toolCalls.length });
  }
})
```

**What `maxSteps` does:**
- Without it: AI calls ONE tool, then waits for user input
- With it: AI can call MULTIPLE tools in sequence autonomously
- AI decides when to stop based on task completion

**Backend Flow:**

```
User: "Research X and build Y"
    ↓
AI with maxSteps: 10
    ↓
Step 1: AI calls webSearch('X')
    ↓ (automatically continues)
Step 2: AI calls analyzeResults()
    ↓ (automatically continues)
Step 3: AI calls generateY()
    ↓ (AI decides task is complete, stops at step 3)
Response: "Done! Here's Y based on my research about X."
```

### AI SDK Message Parts for Steps

AI SDK 5 creates special message parts to mark step boundaries:

```typescript
// Message structure with steps
{
  role: 'assistant',
  parts: [
    { type: 'step-start', stepNumber: 1, stepType: 'tool-call' },
    { type: 'tool-webSearch', input: {...}, output: {...} },
    { type: 'text', text: 'Based on the research...' },

    { type: 'step-start', stepNumber: 2, stepType: 'tool-call' },
    { type: 'tool-analyzeCode', input: {...}, output: {...} },
    { type: 'text', text: 'I found that...' },

    { type: 'step-start', stepNumber: 3, stepType: 'continue' },
    { type: 'text', text: 'Final summary: ...' },
  ]
}
```

**Part Types:**
- `step-start` - Marks the beginning of a new reasoning step
- `tool-TOOLNAME` - Tool execution within that step
- `text` - AI's reasoning/explanation for that step

### Frontend: Rendering Steps with Collapsible UI

**Pattern 1: Simple Step Dividers**

```tsx
{message.parts?.map((part, i) => {
  switch (part.type) {
    case 'step-start':
      return (
        <div key={i} className="step-divider">
          <div className="step-number">Step {part.stepNumber}</div>
          <div className="step-type">{part.stepType}</div>
        </div>
      );

    case 'text':
      return <Response key={i}>{part.text}</Response>;

    case 'tool-webSearch':
    case 'tool-analyzeCode':
      // Tool rendering (covered below)
      return <ToolResultRenderer ... />;

    default:
      return null;
  }
})}
```

**Pattern 2: Collapsible Tool Results (AI Elements)**

Vercel provides pre-built collapsible components via **AI Elements**:

```tsx
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';

// Rendering tool with collapsible UI
case 'tool-webSearch': {
  const toolName = part.type.replace('tool-', '');

  if (part.output || part.result) {
    // Tool completed - render with result
    return (
      <Tool key={i} defaultOpen={false}>  {/* ← Collapsed by default */}
        <ToolHeader type={toolName} state="output-available" />
        <ToolContent>
          <ToolInput input={part.input} />
          <ToolOutput output={part.output} />
        </ToolContent>
      </Tool>
    );
  }

  // Tool executing - show loading state
  return (
    <Tool key={i} defaultOpen>  {/* ← Open while loading */}
      <ToolHeader type={toolName} state="executing" />
      <ToolContent>
        <ToolInput input={part.input} />
        <div>Loading...</div>
      </ToolContent>
    </Tool>
  );
}
```

**AI Elements `<Tool>` Component Features:**

- **Collapsible** - Click header to expand/collapse
- **State-aware** - Shows different UI for loading/complete/error
- **Keyboard accessible** - Arrow keys to navigate
- **Customizable** - Override styles with your theme

### Pattern 3: Custom Step Planning Tool

Create a dedicated tool that generates a numbered plan:

```typescript
// src/lib/tools.ts
export const planStepsTool = tool({
  description: `Break down a complex task into numbered, actionable steps.

  Use this when user requests:
  - Multi-part workflows ("research X and build Y")
  - Complex implementations ("create a widget generator")
  - Tasks requiring multiple tools

  Return a structured plan that other tools can execute.`,

  inputSchema: z.object({
    task: z.string().describe('The complex task to break down'),
    steps: z.array(z.object({
      number: z.number(),
      description: z.string(),
      toolsNeeded: z.array(z.string()),
      estimatedDuration: z.string().optional(),
    })).describe('The numbered steps to complete the task'),
  }),

  execute: async ({ task, steps }) => {
    return {
      task,
      steps,
      totalSteps: steps.length,
      status: 'plan_ready',
      message: `Created ${steps.length}-step plan for: ${task}`
    };
  },
});
```

**Custom Widget for Plan Display:**

```tsx
// src/components/tool-ui/step-planner-widget.tsx
'use client';

import { useState } from 'react';
import { Check, Clock, PlayCircle } from 'lucide-react';

interface Step {
  number: number;
  description: string;
  toolsNeeded: string[];
  estimatedDuration?: string;
}

export function StepPlannerWidget({ data }: { data: { task: string; steps: Step[] } }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">📋 Plan: {data.task}</h3>

      <div className="space-y-2">
        {data.steps.map((step) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;

          return (
            <div
              key={step.number}
              className={`
                p-3 border rounded-lg transition-colors
                ${isCompleted ? 'bg-green-50 border-green-200' : ''}
                ${isCurrent ? 'bg-blue-50 border-blue-200' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                {isCompleted ? (
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                ) : isCurrent ? (
                  <PlayCircle className="h-5 w-5 text-blue-600 mt-0.5 animate-pulse" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                )}

                {/* Step Content */}
                <div className="flex-1">
                  <div className="font-medium">
                    Step {step.number}: {step.description}
                  </div>

                  <div className="text-sm text-muted-foreground mt-1">
                    Tools: {step.toolsNeeded.join(', ')}
                    {step.estimatedDuration && ` • ~${step.estimatedDuration}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground">
        Progress: {completedSteps.length}/{data.steps.length} steps completed
      </div>
    </div>
  );
}
```

### Complete Implementation Example

**1. Backend: API Route with Multi-Step Support**

```typescript
// src/app/api/chat-widget-generator/route.ts
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import {
  planStepsTool,
  webSearchTool,
  analyzeCodeTool,
  generateWidgetTool
} from '@/lib/tools';

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = streamText({
    model: gateway(model, {
      apiKey: process.env.AI_GATEWAY_API_KEY!,
    }),
    messages,

    // ⭐ Enable multi-step reasoning
    maxSteps: 10,

    // Register all tools the AI can use
    tools: {
      planSteps: planStepsTool,
      webSearch: webSearchTool,
      analyzeCode: analyzeCodeTool,
      generateWidget: generateWidgetTool,
    },

    // ⭐ Track step completion
    onStepFinish: ({ text, toolCalls, toolResults, stepType, finishReason }) => {
      console.log(`✓ Step finished:`, {
        type: stepType,
        tools: toolCalls.map(tc => tc.toolName),
        reason: finishReason,
      });
    },

    // ⭐ Control when to stop
    experimental_continueSteps: true,  // Let AI decide when to stop
  });

  return result.toDataStreamResponse();
}
```

**2. Frontend: Chat Component with Step Rendering**

```tsx
// src/components/widget-generator/WidgetGeneratorChat.tsx
'use client';

import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Response } from '@/components/ai-elements/response';
import { ToolResultRenderer } from '@/components/tool-ui/tool-result-renderer';
import { useState } from 'react';

export function WidgetGeneratorChat({ messages, ... }) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              {message.parts?.map((part, i) => {
                switch (part.type) {
                  // ⭐ Render step dividers
                  case 'step-start': {
                    const isExpanded = expandedSteps.includes(part.stepNumber);

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-2 px-3 bg-muted rounded-lg my-2 cursor-pointer"
                        onClick={() => {
                          setExpandedSteps(prev =>
                            prev.includes(part.stepNumber)
                              ? prev.filter(s => s !== part.stepNumber)
                              : [...prev, part.stepNumber]
                          );
                        }}
                      >
                        <div className="font-medium text-sm">
                          Step {part.stepNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {part.stepType}
                        </div>
                        <div className="ml-auto text-xs">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    );
                  }

                  case 'text':
                    return <Response key={i}>{part.text}</Response>;

                  // ⭐ Render tools with collapsible UI
                  case 'tool-planSteps':
                  case 'tool-webSearch':
                  case 'tool-analyzeCode':
                  case 'tool-generateWidget': {
                    const toolName = part.type.replace('tool-', '');

                    if (part.output || part.result) {
                      const result = part.output ?? part.result;

                      return (
                        <ToolResultRenderer
                          key={i}
                          toolResult={{
                            toolCallId: part.toolCallId ?? '',
                            toolName,
                            args: part.input ?? {},
                            result: result.type === 'json' ? result.value : result,
                          }}
                        />
                      );
                    }

                    // Tool executing
                    return (
                      <Tool key={i} defaultOpen>
                        <ToolHeader type={toolName} state="executing" />
                        <ToolContent>
                          <ToolInput input={part.input ?? {}} />
                          <div className="animate-pulse">Processing...</div>
                        </ToolContent>
                      </Tool>
                    );
                  }

                  default:
                    return null;
                }
              })}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
    </Conversation>
  );
}
```

**3. Register Custom Widgets**

```tsx
// src/components/tool-ui/tool-result-renderer.tsx
import { StepPlannerWidget } from './step-planner-widget';

export function ToolResultRenderer({ toolResult }: ToolResultRendererProps) {
  const { toolName, result } = toolResult;

  switch (toolName) {
    case 'planSteps':
      return <StepPlannerWidget data={result} />;

    case 'webSearch':
      return <WebSearchWidget data={result} />;

    case 'analyzeCode':
      return <CodeAnalysisWidget data={result} />;

    case 'generateWidget':
      return <WidgetGeneratorWidget data={result} />;

    default:
      // Fallback: Use AI Elements Tool component
      return (
        <Tool defaultOpen={false}>
          <ToolHeader type={toolName as any} state="output-available" />
          <ToolContent>
            <ToolOutput output={<pre>{JSON.stringify(result, null, 2)}</pre>} />
          </ToolContent>
        </Tool>
      );
  }
}
```

### Advanced: Controlling Step Execution

**Stop After N Steps:**

```typescript
streamText({
  maxSteps: 5,  // Hard limit
  experimental_continueSteps: false,  // Stop after maxSteps
})
```

**Conditional Stopping:**

```typescript
streamText({
  maxSteps: 10,
  onStepFinish: ({ finishReason, stepType }) => {
    if (finishReason === 'error') {
      // Could implement error handling here
      console.error('Step failed, stopping execution');
    }
  },

  // AI SDK 5.5+ feature
  experimental_stopWhen: (step) => {
    // Custom logic to stop execution
    return step.toolCalls.some(tc => tc.toolName === 'finalizeTask');
  },
})
```

**Modify Steps Before Execution:**

```typescript
streamText({
  maxSteps: 10,

  // AI SDK 5.5+ feature
  experimental_prepareStep: async (step) => {
    // Intercept before each step executes
    console.log('About to execute:', step.toolCalls);

    // Modify tool arguments dynamically
    if (step.toolCalls[0]?.toolName === 'webSearch') {
      step.toolCalls[0].args.maxResults = 5;
    }

    return step;
  },
})
```

### onStepFinish Callback Details

The `onStepFinish` callback provides detailed information about each completed step:

```typescript
onStepFinish: ({
  text,           // All text generated in this step
  toolCalls,      // Array of tool calls executed
  toolResults,    // Array of tool results received
  finishReason,   // Why step finished: 'stop', 'length', 'tool-calls', etc.
  usage,          // Token usage for this step
  stepType,       // 'initial', 'continue', or 'tool-result'
  warnings,       // Any warnings from this step
  experimental_providerMetadata,  // Provider-specific data
}) => {
  // Your step tracking logic

  // Example: Log step summary
  console.log(`Step ${stepType}:`, {
    textLength: text.length,
    toolsUsed: toolCalls.map(tc => tc.toolName),
    tokensUsed: usage.totalTokens,
  });

  // Example: Track total cost
  totalCost += (usage.totalTokens * 0.00001);

  // Example: Save to database
  await db.steps.create({
    sessionId,
    stepNumber: currentStepNumber++,
    toolCalls: JSON.stringify(toolCalls),
    tokensUsed: usage.totalTokens,
  });
}
```

### Real-World Use Cases

**1. Widget Generator (Your Request)**

```
User: "Research Elementor widgets and create a PHP/JS/CSS generator"

Step 1: planSteps
  → Creates 4-step plan

Step 2: webSearch
  → Searches "Elementor custom widget development PHP JavaScript CSS structure 2024"
  → Returns: 8 results about widget structure

Step 3: analyzeCode
  → Extracts patterns from search results
  → Identifies: PHP class structure, JS handlers, CSS patterns

Step 4: generateWidget
  → Streams PHP code (via /api/generate-widget-stream)
  → Streams JS code
  → Streams CSS code
  → Shows live preview in WordPress Playground
```

**2. Multi-Source Research**

```
User: "Compare Next.js 15 vs Remix for SSR performance"

Step 1: webSearch("Next.js 15 SSR performance benchmarks")
Step 2: webSearch("Remix SSR performance benchmarks")
Step 3: analyzeResults(results from both searches)
Step 4: generateComparison(table with pros/cons)
```

**3. Code Migration**

```
User: "Convert this jQuery code to React"

Step 1: analyzeCode(jQuery code)
Step 2: planRefactoring(analysis results)
Step 3: generateReactComponent(plan)
Step 4: generateTests(component code)
```

### Benefits of Step-Based UI

**For Users:**
- ✅ **Transparency** - See exactly what AI is doing
- ✅ **Control** - Can stop execution if AI goes off track
- ✅ **Reviewability** - Collapse completed steps to focus on current work
- ✅ **Trust** - Understand AI's reasoning process

**For Developers:**
- ✅ **Debugging** - Track which step failed
- ✅ **Cost Control** - Monitor token usage per step via `onStepFinish`
- ✅ **Analytics** - Log step completion rates
- ✅ **Modularity** - Each step can use different tools

### Comparison: Single Tool vs Multi-Step

| Feature | Single Tool | Multi-Step Planning |
|---------|-------------|---------------------|
| **Tool calls per request** | 1 | 1-10+ (configurable) |
| **User visibility** | One result widget | Progress through steps |
| **Complexity handling** | Limited | Excellent |
| **Token efficiency** | High (one call) | Lower (multiple calls) |
| **Error recovery** | Must restart | Can resume from failed step |
| **Best for** | Simple lookups | Complex workflows |

### Best Practices

**1. Set Appropriate `maxSteps`**
- Simple tasks: `maxSteps: 3`
- Complex tasks: `maxSteps: 10`
- Very complex: `maxSteps: 20` (watch costs!)

**2. Provide Clear Tool Descriptions**
```typescript
// ❌ Vague
description: 'Searches the web'

// ✅ Clear
description: 'Search the web for up-to-date information. Use this when you need current data that is not in your training. Returns 5-10 results with titles, URLs, and snippets.'
```

**3. Use `onStepFinish` for Tracking**
```typescript
onStepFinish: ({ usage, stepType }) => {
  metrics.recordStepCompletion({
    type: stepType,
    tokens: usage.totalTokens,
    cost: usage.totalTokens * COST_PER_TOKEN,
    timestamp: Date.now(),
  });
}
```

**4. Design Tools for Composition**
```typescript
// ❌ Monolithic tool
searchAndAnalyzeAndGenerate()  // Does too much

// ✅ Composable tools
webSearch() → analyzeResults() → generateReport()
```

**5. Handle Errors Gracefully**
```typescript
case 'tool-webSearch': {
  if (part.error) {
    return (
      <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
        <div className="font-medium text-red-800">Search Failed</div>
        <div className="text-sm text-red-600">{part.error.message}</div>
      </div>
    );
  }

  // Normal rendering...
}
```

### Performance Considerations

**Token Usage:**
- Each step costs tokens (input + output)
- 10 steps = ~10x cost of single tool call
- Use `onStepFinish` to track: `usage.totalTokens`

**Latency:**
- Steps execute sequentially, not in parallel
- 10 steps @ 2s each = 20 seconds total
- Consider showing "Step X of Y" progress

**Rate Limits:**
- Multiple rapid tool calls can hit API limits
- AI SDK handles retries automatically
- Monitor via `experimental_providerMetadata`

### Troubleshooting

**Steps Not Appearing:**
- [ ] Check `maxSteps > 1` in API route
- [ ] Verify `case 'step-start':` exists in switch statement
- [ ] Confirm tools are registered in `tools` object
- [ ] Check browser console for part types

**AI Stops After One Step:**
- [ ] Set `experimental_continueSteps: true`
- [ ] Increase `maxSteps` value
- [ ] Check if tool returned `stopReason: 'complete'`
- [ ] Verify AI's system prompt encourages multi-step thinking

**Collapsible UI Not Working:**
- [ ] Verify AI Elements installed: `@ai-sdk/react`
- [ ] Import Tool component from correct path
- [ ] Check `defaultOpen` prop (true = expanded, false = collapsed)
- [ ] Ensure `<ToolHeader>` is clickable (CSS not blocking)

**Steps Execute But Don't Display:**
- [ ] Check `step-start` rendering returns valid JSX (not null)
- [ ] Verify step divider has visible styling
- [ ] Check React DevTools for component tree
- [ ] Add console.log to confirm parts are being received

### Next Steps

Now that you understand step-based planning:

1. **Start Simple** - Add `maxSteps: 3` to existing chat route
2. **Add Step Dividers** - Render `step-start` parts with visual separators
3. **Make Tools Collapsible** - Use `<Tool defaultOpen={false}>`
4. **Create Planning Tool** - Build `planSteps` tool for structured workflows
5. **Track Metrics** - Use `onStepFinish` to log step completion
6. **Build Complex Agents** - Combine multiple tools for autonomous workflows

---

## Global State Management with Tools

**CRITICAL CONCEPT:** When building tools that interact with UI components (like code editors), you must understand how global state works to avoid infinite loops, stale data, and sync issues.

### The Problem: Bi-Directional Sync Hell

**❌ THE BROKEN PATTERN (DO NOT USE):**

```typescript
// Component has local state
const [code, setCode] = useState('');

// AND global state
const { editorCode, updateEditorCode } = useGlobalStore();

// Try to keep them in sync (INFINITE LOOP!)
useEffect(() => {
  setCode(editorCode); // Local ← Global
}, [editorCode]);

useEffect(() => {
  updateEditorCode(code); // Global ← Local
}, [code]);

// Monaco editor reads from local state
<Editor value={code} onChange={setCode} />

// Tool tries to update global state
// But Monaco shows old local state!
```

**Why This Fails:**
1. Changes ping-pong between local and global state infinitely
2. Monaco editor reads from stale local state
3. Tools update global state but UI doesn't reflect it
4. Race conditions between updates
5. Impossible to debug which state is "correct"

### The Solution: One-Way Data Flow from Global State

**✅ THE CORRECT PATTERN (USE THIS):**

```typescript
// NO local state for editor content!
// Only global state exists
const { editorHtml, editorCss, editorJs, updateContent, getContent } = useEditorContent();

// Monaco reads directly from global state
<Editor
  value={editorHtml}  // Read from global state
  onChange={(value) => updateContent('html', value)}  // Write to global state
/>

// Preview reads from global state
const generatePreview = () => {
  return `
    <style>${editorCss}</style>  <!-- From global state -->
    <div>${editorHtml}</div>      <!-- From global state -->
    <script>${editorJs}</script>  <!-- From global state -->
  `;
};

// Tools update global state
const toolExecute = async ({ newCode }) => {
  updateContent('html', newCode);  // Single source of truth updated
  // Monaco, Preview, and all other components auto-update
};
```

**Why This Works:**
1. **Single source of truth** - Global state is the ONLY state
2. **One-way data flow** - Global state → UI components
3. **No sync needed** - Everything reads from same source
4. **Tools work immediately** - Update global state, UI reflects it
5. **Predictable** - Easy to debug, no race conditions

### Real-World Example: Code Editor with Tool Updates

This is the working pattern from the Elementor Section Editor:

#### 1. Global State Store (Zustand)

```typescript
// src/hooks/useEditorContent.ts
import { create } from 'zustand';

interface EditorContentStore {
  html: string;
  css: string;
  js: string;

  // Get content for one or more file types
  getContent: (files?: ('html' | 'css' | 'js')[]) => { html?: string; css?: string; js?: string };

  // Update content for a specific file type
  updateContent: (file: 'html' | 'css' | 'js', content: string) => void;

  // Set all content at once
  setAllContent: (content: { html?: string; css?: string; js?: string }) => void;
}

export const useEditorContent = create<EditorContentStore>((set, get) => ({
  html: '',
  css: '',
  js: '',

  getContent: (files) => {
    const state = get();
    if (!files) {
      return { html: state.html, css: state.css, js: state.js };
    }

    const result: any = {};
    files.forEach(file => {
      result[file] = state[file];
    });
    return result;
  },

  updateContent: (file, content) => {
    console.log(`[useEditorContent] Updating ${file}:`, content.length, 'chars');
    set({ [file]: content });
  },

  setAllContent: (content) => {
    console.log('[useEditorContent] Setting all content');
    set({
      html: content.html ?? get().html,
      css: content.css ?? get().css,
      js: content.js ?? get().js,
    });
  },
}));
```

**Key Points:**
- Zustand creates a global store accessible from any component
- No React Context Provider needed (Zustand handles it)
- `updateContent()` is the ONLY way to modify state
- `getContent()` is the ONLY way to read state
- Console logs help debug state changes

#### 2. Monaco Editor Component (Reads Global State)

```typescript
// src/components/elementor/HtmlSectionEditor.tsx
import { useEditorContent } from '@/hooks/useEditorContent';
import Editor from '@monaco-editor/react';

export function HtmlSectionEditor() {
  // Read from global state
  const { editorHtml, editorCss, editorJs, updateContent } = useEditorContent();

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  // Determine which content to show based on active tab
  const currentCode = activeTab === 'html' ? editorHtml
                    : activeTab === 'css' ? editorCss
                    : editorJs;

  return (
    <Editor
      height="100%"
      language={activeTab === 'js' ? 'javascript' : activeTab}
      value={currentCode}  // ✅ Read from global state
      onChange={(value) => {
        // ✅ Write to global state
        updateContent(activeTab, value || '');
      }}
    />
  );
}
```

**Key Points:**
- No local `useState` for code content
- Monaco `value` prop reads directly from global state
- Monaco `onChange` writes directly to global state
- When user types, global state updates, Monaco re-renders
- Simple, predictable flow

#### 3. Preview Component (Reads Global State)

```typescript
// Same file: HtmlSectionEditor.tsx
function PreviewPanel() {
  const { editorHtml, editorCss, editorJs } = useEditorContent();

  // Generate preview HTML from global state
  const previewHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    ${editorCss}  /* ✅ Read from global state */
  </style>
</head>
<body>
  ${editorHtml}  /* ✅ Read from global state */

  <script>
    ${editorJs}  /* ✅ Read from global state */
  </script>
</body>
</html>
`;

  return <iframe srcDoc={previewHTML} />;
}
```

**Key Points:**
- Preview reads the SAME global state as Monaco
- No separate state to keep in sync
- When global state updates, preview auto-updates
- User sees live preview as they type

#### 4. Tool Updates Global State

```typescript
// src/lib/tools.ts
import { z } from 'zod';
import { tool } from 'ai';

export const updateSectionHtmlTool = tool({
  description: 'Modify the HTML code in the section editor',
  inputSchema: z.object({
    html: z.string().describe('The new HTML code'),
    instructions: z.string().describe('What changes were made'),
  }),
  execute: async ({ html, instructions }) => {
    // Tool only returns metadata
    // Frontend widget handles the actual update
    return {
      html,
      instructions,
      timestamp: new Date().toISOString(),
      message: 'HTML changes proposed. Click "Apply Changes" to update the editor.'
    };
  },
});
```

**Key Points:**
- Tool does NOT directly update global state (backend can't access it)
- Tool returns the new code as data
- Frontend widget component handles the actual state update

#### 5. Tool Widget Applies Changes to Global State

```typescript
// src/components/tool-ui/UpdateSectionToolResult.tsx
import { useEditorContent } from '@/hooks/useEditorContent';
import { useState, useRef } from 'react';

export function UpdateSectionToolResult({ toolName, result }) {
  const { updateContent } = useEditorContent();
  const [applied, setApplied] = useState(false);
  const applyingRef = useRef(false);

  // Extract file type from tool name: 'updateSectionHtml' → 'html'
  const fileType = toolName.replace('updateSection', '').toLowerCase() as 'html' | 'css' | 'js';

  const newCode = result[fileType];

  const handleApplyChanges = () => {
    // Prevent duplicate execution (React StrictMode protection)
    if (applyingRef.current) {
      console.log('[UpdateSectionToolResult] Skipping duplicate apply');
      return;
    }

    applyingRef.current = true;
    console.log('[UpdateSectionToolResult] Applying changes:', {
      file: fileType,
      newCodeLength: newCode.length
    });

    // ✅ Update global state - Monaco and Preview will auto-update!
    updateContent(fileType, newCode);
    setApplied(true);
  };

  return (
    <div>
      <h3>{fileType.toUpperCase()} Changes Proposed</h3>
      <p>{result.instructions}</p>

      <button
        onClick={handleApplyChanges}
        disabled={applied}
      >
        {applied ? 'Changes Applied ✓' : 'Apply Changes'}
      </button>

      {applied && (
        <p className="text-green-600">
          Changes applied successfully! Check the {fileType.toUpperCase()} tab.
        </p>
      )}
    </div>
  );
}
```

**Key Points:**
- Widget receives new code from tool result
- Shows "Apply Changes" button for user approval
- When clicked, calls `updateContent()` to update global state
- Monaco editor and preview instantly reflect changes
- `useRef` prevents duplicate execution in React StrictMode

### Data Flow Diagram

```
User types in Monaco Editor
    ↓
updateContent('html', newValue)
    ↓
Zustand Global State Updates
    ↓
Monaco re-renders with new value (same global state)
    ↓
Preview re-renders with new HTML (same global state)
    ↓
User sees changes in both editor and preview

─────────────────────────────────────────

AI Tool Called (updateSectionCss)
    ↓
Tool returns { css: newCode, instructions: '...' }
    ↓
UpdateSectionToolResult widget renders
    ↓
User clicks "Apply Changes"
    ↓
updateContent('css', newCode)
    ↓
Zustand Global State Updates
    ↓
Monaco re-renders with new CSS (global state)
    ↓
Preview re-renders with new styles (global state)
    ↓
User sees changes in both editor and preview
```

### Anti-Patterns to Avoid

**❌ Don't: Keep Tool State Separate from Editor State**

```typescript
// Widget has its own state
const [toolGeneratedCode, setToolGeneratedCode] = useState('');

// Editor has its own state
const [editorCode, setEditorCode] = useState('');

// Now you need to sync them manually (BAD!)
const applyToolChanges = () => {
  setEditorCode(toolGeneratedCode);  // Manual sync = bugs
};
```

**✅ Do: Both Use the Same Global State**

```typescript
const { editorCode, updateContent } = useEditorContent();

const applyToolChanges = () => {
  updateContent('html', toolGeneratedCode);  // Single source of truth
};
```

**❌ Don't: Read from Props, Write to Global State**

```typescript
// Component receives section as prop
function Editor({ section }) {
  const { updateContent } = useEditorContent();

  // Reads from prop (local state)
  <MonacoEditor value={section.html} />

  // Writes to global state
  // These are now OUT OF SYNC!
  const handleToolUpdate = () => {
    updateContent('html', newCode);
  };
}
```

**✅ Do: Read and Write from Same Global State**

```typescript
function Editor() {
  const { editorHtml, updateContent } = useEditorContent();

  // Both read and write use global state
  <MonacoEditor
    value={editorHtml}
    onChange={(v) => updateContent('html', v)}
  />
}
```

**❌ Don't: Update Local State in useEffect from Global State**

```typescript
const [code, setCode] = useState('');
const { editorCode } = useEditorContent();

// This creates infinite loops!
useEffect(() => {
  setCode(editorCode);
}, [editorCode]);

useEffect(() => {
  updateContent('html', code);
}, [code]);
```

**✅ Do: Eliminate Local State Entirely**

```typescript
const { editorCode, updateContent } = useEditorContent();

// Just use global state directly - no useEffect needed!
<MonacoEditor
  value={editorCode}
  onChange={(v) => updateContent('html', v)}
/>
```

### Benefits of This Pattern

1. **No Sync Bugs** - One source of truth means no sync issues
2. **Tools Work Immediately** - Update global state, everything updates
3. **Easy to Debug** - Console log shows exact state changes
4. **Predictable** - Data flows in one direction only
5. **Performant** - Zustand is faster than Context API
6. **TypeScript Safe** - Full type inference on global state
7. **No Prop Drilling** - Access state from any component
8. **Easy to Test** - Mock the global store, test components

### When to Use Global State for Tools

Use global state when:
- ✅ Tool needs to update UI that user is actively editing (code editors)
- ✅ Multiple components need to show the same data (editor + preview)
- ✅ Tool changes should be immediately visible
- ✅ You need undo/redo functionality
- ✅ State persists across component unmounts

Don't use global state when:
- ❌ Tool output is display-only (weather widget, stock price)
- ❌ State is scoped to a single component
- ❌ Data doesn't change after initial render
- ❌ Tool is completely independent of other UI

### Checklist: Implementing Tools with Global State

When creating a tool that updates global state:

- [ ] Create Zustand store with `create<YourStore>()`
- [ ] Export hook: `export const useYourStore = create(...)`
- [ ] Define state properties (e.g., `html`, `css`, `js`)
- [ ] Define update methods (e.g., `updateContent()`, `getContent()`)
- [ ] Add console.log in update methods for debugging
- [ ] Use hook in ALL components that need this data
- [ ] Read state: `const { data } = useYourStore()`
- [ ] Update state: `updateData(newValue)`
- [ ] NO local useState for the same data
- [ ] Tool execute returns new data as result
- [ ] Widget component calls `updateData()` when user approves
- [ ] Test: type in editor, tool updates, preview shows changes
- [ ] Verify no infinite loops in React DevTools
- [ ] Check console logs show single update per action

---

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

## Creating a Chat Interface (Complete Guide)

When creating a new feature that needs chat functionality (like the Blog Planner), follow this exact pattern based on the working elementor-editor implementation.

### Quick Summary (TL;DR)

## 🎉 NEW: UniversalChat Component (Recommended)

**The EASIEST way to create chat interfaces - use the centralized component!**

```typescript
import { UniversalChat } from '@/components/chat/UniversalChat';

<UniversalChat
  messages={messages}
  isLoading={isLoading}
  status={status}
  onSendMessage={handleSendMessage}
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  onReload={reload}
  toolNames={['yourTool1', 'yourTool2']}  // 🎯 Just register your tools!
  placeholder="Ask me anything..."
/>
```

**Each feature now needs just 2 files:**
1. **API Route** - New endpoint that registers your tools
2. **Page Component** - Uses `useChat` hook + `UniversalChat`

**Savings**: ~300 lines of code per feature eliminated! 🎉

**📖 Full Documentation**: [Universal Chat Usage Guide](./universal-chat-usage.md)

---

## Alternative: Copy ElementorChat (Old Way)

If you need highly custom chat behavior, you can still copy ElementorChat:

**Each feature needs 3 files:**
1. **Chat Component** - Copy `ElementorChat.tsx`, change tool switch cases
2. **API Route** - New endpoint that registers your tools
3. **Page Component** - Uses `useChat` hook, calls your API route

**The working examples to copy:**
- ⭐ **Template**: [ElementorChat.tsx](../src/components/elementor/ElementorChat.tsx) + [/api/chat-elementor](../src/app/api/chat-elementor/route.ts)
- ✅ **Example**: [BlogPlannerChat.tsx](../src/components/blog-planner/BlogPlannerChat.tsx) + [/api/chat-blog-planner](../src/app/api/chat-blog-planner/route.ts)
- 🚀 **NEW: Universal**: [UniversalChat.tsx](../src/components/chat/UniversalChat.tsx) - **USE THIS FOR NEW FEATURES**

**Current Architecture Map:**

```
┌─────────────────────────────────────────────────────────────────┐
│                   Multi-Chat Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /elementor-editor                                              │
│  ├─ ElementorChat.tsx (384 lines)                              │
│  ├─ /api/chat-elementor                                         │
│  └─ Tools: generateHTML, editCode, updateSection*, viewCode    │
│                                                                 │
│  /blog-planner                                                  │
│  ├─ BlogPlannerChat.tsx (311 lines)                            │
│  ├─ /api/chat-blog-planner                                      │
│  └─ Tools: planBlogTopics, writeBlogPost                       │
│                                                                 │
│  /chat (if exists - general purpose)                           │
│  ├─ Uses generic useChat                                        │
│  ├─ /api/chat                                                   │
│  └─ Tools: General tools                                       │
│                                                                 │
│  /your-new-feature ← YOU CREATE THIS                           │
│  ├─ YourFeatureChat.tsx (copy ElementorChat)                   │
│  ├─ /api/chat-your-feature (register your tools)               │
│  └─ Tools: yourTool1, yourTool2                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Shared Components (used by all):
  • src/components/ai-elements/* (Conversation, Message, Response, etc.)
  • src/components/tool-ui/tool-result-renderer.tsx
  • src/lib/tools.ts (all tool definitions)
```

**Key Files Referenced Throughout This Guide:**

| File | Purpose | Used By |
|------|---------|---------|
| [src/components/elementor/ElementorChat.tsx](../src/components/elementor/ElementorChat.tsx) | ⭐ **THE TEMPLATE** - Copy this for new features | All new chat interfaces |
| [src/components/blog-planner/BlogPlannerChat.tsx](../src/components/blog-planner/BlogPlannerChat.tsx) | ✅ Example of copying ElementorChat | Reference for new features |
| [src/app/api/chat-elementor/route.ts](../src/app/api/chat-elementor/route.ts) | Template API route with tool registration | Copy for new API routes |
| [src/app/api/chat-blog-planner/route.ts](../src/app/api/chat-blog-planner/route.ts) | Example new API route | Reference for new routes |
| [src/app/elementor-editor/page.tsx](../src/app/elementor-editor/page.tsx) | Page using `useChat` hook (lines 129-145) | Copy useChat pattern |
| [src/app/blog-planner/page.tsx](../src/app/blog-planner/page.tsx) | Example page with `sendMessage` usage | Reference for new pages |
| [src/lib/tools.ts](../src/lib/tools.ts) | ALL tool definitions | Add new tools here |
| [src/components/tool-ui/tool-result-renderer.tsx](../src/components/tool-ui/tool-result-renderer.tsx) | Widget dispatcher (switch statement) | Register widgets here |
| [src/components/tool-ui/blog-planner-widget.tsx](../src/components/tool-ui/blog-planner-widget.tsx) | Example streaming widget | Reference for new widgets |
| [src/components/tool-ui/blog-writer-widget.tsx](../src/components/tool-ui/blog-writer-widget.tsx) | Example with inline forms | Reference for form patterns |

---

### Why Separate Chat Components?

**Q: Do we reuse the same chat component for everything?**
**A: No!** Each feature gets its own chat component and API route.

**Reason:** While the chat UI is 95% identical, each feature needs:
1. Different tool switch cases in the message renderer
2. Different API endpoints (so tools are properly registered)
3. Feature-specific callbacks (e.g., code editor integration for Elementor)
4. Custom empty states and placeholder text

**The Pattern:**
```
ElementorChat.tsx (384 lines) ← The template
    ↓ Copy & modify tool cases
BlogPlannerChat.tsx (311 lines)
    ↓ Copy & modify for your tools
YourFeatureChat.tsx
```

**What Changes Between Chat Components:**
```diff
// ElementorChat.tsx
case 'tool-generateHTML':
case 'tool-editCode':
case 'tool-updateSectionHtml':
  return <ToolResultRenderer onSwitchCodeTab={...} />

// BlogPlannerChat.tsx
case 'tool-planBlogTopics':
case 'tool-writeBlogPost':
  return <ToolResultRenderer model={selectedModel} />
```

**What Stays the Same:**
- All AI Elements imports
- Message rendering loop structure
- Model selector UI
- Web search toggle
- Submit handling
- Prompt input UI
- 95% of the code!

### Architecture Overview

**We use SEPARATE chat components and API routes for each feature:**

```
Feature Page → Chat Component → API Route → Tools
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Elementor Editor:
/elementor-editor → ElementorChat.tsx → /api/chat-elementor → generateHTML, editCode, etc.

Blog Planner:
/blog-planner → BlogPlannerChat.tsx → /api/chat-blog-planner → planBlogTopics, writeBlogPost

Your Feature:
/your-feature → YourFeatureChat.tsx → /api/chat-your-feature → yourTools
```

**Each chat component is 95% identical** but customized with:
- Different tool switch cases
- Different API endpoints
- Feature-specific callbacks (e.g., `onSwitchCodeTab` for Elementor)
- Feature-specific empty states

**Reference Implementation Files:**

| Component Type | Elementor Editor (Template ⭐) | Blog Planner (Example) |
|---|---|---|
| **Chat Component** | [ElementorChat.tsx](../src/components/elementor/ElementorChat.tsx) | [BlogPlannerChat.tsx](../src/components/blog-planner/BlogPlannerChat.tsx) |
| **Page Component** | [page.tsx](../src/app/elementor-editor/page.tsx) (lines 129-145) | [page.tsx](../src/app/blog-planner/page.tsx) |
| **API Route** | [/api/chat-elementor/route.ts](../src/app/api/chat-elementor/route.ts) | [/api/chat-blog-planner/route.ts](../src/app/api/chat-blog-planner/route.ts) |
| **Tools Used** | `generateHTML`, `editCode`, `updateSectionHtml/Css/Js` | `planBlogTopics`, `writeBlogPost` |
| **Special Callbacks** | `onSwitchCodeTab`, `onUpdateSection`, `onSwitchToSectionEditor` | None (simpler) |
| **Line Count** | 384 lines | 311 lines |

**🎯 To Create Your Own:**
1. Copy `ElementorChat.tsx` → `YourFeatureChat.tsx`
2. Replace tool cases (lines 182-227) with your tools
3. Update placeholder text (line 344)
4. Remove callbacks you don't need
5. Create matching API route with your tools

### How Tools Get Registered & Rendered

**The Complete Flow:**

```
1. Define Tool (src/lib/tools.ts)
   ↓
   export const planBlogTopics = tool({ ... })

2. Register in API Route (src/app/api/chat-blog-planner/route.ts)
   ↓
   streamText({
     tools: {
       planBlogTopics: planBlogTopics,  ← Register here!
       writeBlogPost: writeBlogPost
     }
   })

3. AI SDK Creates Typed Parts
   ↓
   When AI calls planBlogTopics, SDK creates:
   { type: 'tool-planBlogTopics', input: {...}, output: {...} }

4. Chat Component Catches It (BlogPlannerChat.tsx, line 166)
   ↓
   switch (part.type) {
     case 'tool-planBlogTopics':  ← Must match!
       return <ToolResultRenderer />
   }

5. Tool Renderer Dispatches (tool-result-renderer.tsx, line 89)
   ↓
   switch (toolName) {
     case 'planBlogTopics':  ← Without 'tool-' prefix
       return <BlogPlannerWidget />
   }

6. Widget Renders (blog-planner-widget.tsx)
   ↓
   Shows UI with inline form, streaming button, export options
```

**Key Naming Rule:**
- Tool name in tools.ts: `planBlogTopics`
- API route registration: `planBlogTopics: planBlogTopics`
- AI SDK creates part: `'tool-planBlogTopics'` (adds 'tool-' prefix)
- Chat switch case: `case 'tool-planBlogTopics':`
- ToolResultRenderer case: `case 'planBlogTopics':` (removes 'tool-' prefix)

### Data Flow Diagram

```
User types message
    ↓
BlogPlannerChat.tsx (handleSubmit, line 107-117)
    ↓
page.tsx (handleSendMessage, line 20-47)
    ↓
sendMessage({ text }, { body: { model, webSearch } })
    ↓
POST /api/chat-blog-planner (route.ts)
    ↓
streamText() with tools: { planBlogTopics, writeBlogPost }
    ↓
AI decides to use tool and AI SDK creates typed tool parts
    ↓
Part created: { type: 'tool-planBlogTopics', input: {...}, output: {...} }
    ↓
BlogPlannerChat.tsx (switch statement, line 166-212)
    ↓
case 'tool-planBlogTopics': matches!
    ↓
ToolResultRenderer (tool-result-renderer.tsx, line 89)
    ↓
case 'planBlogTopics': matches!
    ↓
BlogPlannerWidget.tsx (displays UI)
```

### Step-by-Step Implementation

#### 1. Create the API Route

**File:** `src/app/api/chat-YOURFEATURE/route.ts`

```typescript
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest } from 'next/server';
import { yourTool1, yourTool2 } from '@/lib/tools';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'anthropic/claude-sonnet-4-5-20250929' } = await req.json();

    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      messages,
      tools: {
        yourTool1: yourTool1,
        yourTool2: yourTool2,
      },
      temperature: 0.7,
      maxTokens: 4000,
    });

    return result.toDataStreamResponse();
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
- Use `streamText()` from AI SDK
- Register your tools in the `tools` object
- Return `result.toDataStreamResponse()` for AI SDK 5
- Add error handling

#### 2. Create the Chat Component

**File:** `src/components/YOURFEATURE/YourFeatureChat.tsx`

**CRITICAL:** Copy the exact pattern from `ElementorChat.tsx`. Here's the essential structure:

```typescript
'use client';

import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Tool, ToolHeader, ToolContent, ToolInput } from '@/components/ai-elements/tool';
import { Loader } from '@/components/ai-elements/loader';
import { ToolResultRenderer } from '@/components/tool-ui/tool-result-renderer';
import { CopyIcon, RotateCcwIcon, GlobeIcon, SendIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface YourFeatureChatProps {
  messages: any[];
  isLoading: boolean;
  status?: string;
  onSendMessage: (text: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReload?: () => void;
}

const modelGroups = [
  // ... copy from ElementorChat.tsx
];

export function YourFeatureChat({
  messages,
  isLoading,
  status,
  onSendMessage,
  selectedModel,
  onModelChange,
  onReload,
}: YourFeatureChatProps) {
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, undefined, {
        webSearchEnabled: webSearch,
        reasoningEffort: 'medium',
        detailedMode: false,
      });
      setInput('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <Conversation className="flex-1" style={{ overflow: 'hidden' }}>
        <ConversationContent style={{ flex: 1, overflow: 'auto' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              {/* Empty state UI */}
            </div>
          )}

          {messages.map((message, index) => (
            <Message from={message.role} key={message.id} className="py-2">
              <MessageContent>
                {message.parts ? (
                  message.parts.filter(part => part != null).map((part: any, i: number) => {
                    switch (part.type) {
                      case 'text':
                        return <Response key={i}>{(part.text ?? part.value) as string}</Response>;

                      case 'step-start':
                        return null;

                      // CRITICAL: Add cases for each of YOUR tools
                      case 'tool-yourTool1':
                      case 'tool-yourTool2': {
                        const toolName = part.type.replace('tool-', '');

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
                              model={selectedModel}
                            />
                          );
                        }

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
                        return null;
                    }
                  })
                ) : (
                  <Response>{message.content || message.text || ''}</Response>
                )}
              </MessageContent>
            </Message>
          ))}
          {status === 'streaming' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} style={{ flexShrink: 0, marginTop: '16px' }}>
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me something..."
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputButton
              variant={webSearch ? 'default' : 'ghost'}
              onClick={() => setWebSearch(!webSearch)}
            >
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>
            <PromptInputModelSelect onValueChange={onModelChange} value={selectedModel}>
              {/* Model selector UI */}
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit disabled={isLoading || !input.trim()} status={status}>
            <SendIcon size={16} />
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
```

**Critical Pattern Notes:**

1. **Switch Statement for Tool Parts** - You MUST add `case 'tool-TOOLNAME':` for each tool
2. **Check for Result** - Use `if (part.output || part.result)` to detect completion
3. **Extract Tool Name** - Use `part.type.replace('tool-', '')`
4. **Pass to ToolResultRenderer** - Let it handle the widget rendering

#### 3. Create the Page Component

**File:** `src/app/YOURFEATURE/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { YourFeatureChat } from '@/components/YOURFEATURE/YourFeatureChat';

export default function YourFeaturePage() {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4-5-20250929');

  const { messages, sendMessage, isLoading, status, reload } = useChat({
    api: '/api/chat-YOURFEATURE',
    body: {
      model: selectedModel,
    },
  });

  const handleSendMessage = (
    text: string,
    imageData?: { url: string; filename: string },
    settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }
  ) => {
    if (!text.trim() || isLoading) return;

    let modelToUse = selectedModel;

    if (settings?.webSearchEnabled && !selectedModel.startsWith('perplexity/')) {
      modelToUse = 'perplexity/sonar-pro';
    }

    // CRITICAL: sendMessage expects { text: string }, NOT just a string
    sendMessage(
      { text },
      {
        body: {
          model: modelToUse,
          webSearch: settings?.webSearchEnabled ?? false,
          reasoningEffort: settings?.reasoningEffort ?? 'medium',
          detailedMode: settings?.detailedMode ?? false,
        },
      }
    );
  };

  return (
    <div className="flex h-screen overflow-hidden pt-16">
      <div className="flex-1">
        <YourFeatureChat
          messages={messages}
          isLoading={isLoading}
          status={status}
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onReload={reload}
        />
      </div>
    </div>
  );
}
```

**Critical Points:**

1. **useChat Hook** - Returns `{ messages, sendMessage, isLoading, status, reload }`
2. **API Endpoint** - Must match your chat API route (`/api/chat-YOURFEATURE`)
3. **sendMessage Format** - ALWAYS use `sendMessage({ text }, { body: {...} })`, NOT `sendMessage(text, ...)`
4. **Model Switching** - Auto-switch to Perplexity when web search is enabled

#### 4. Common Mistakes to Avoid

**❌ WRONG:**
```typescript
sendMessage(text, { body: { model } }); // TypeError: Cannot use 'in' operator
```

**✅ CORRECT:**
```typescript
sendMessage({ text }, { body: { model } });
```

**❌ WRONG:**
```typescript
const { messages, append } = useChat(); // append doesn't exist
```

**✅ CORRECT:**
```typescript
const { messages, sendMessage } = useChat();
```

**❌ WRONG:**
```typescript
// Missing tool cases in switch statement
switch (part.type) {
  case 'text':
    return <Response>{part.text}</Response>;
  default:
    return null; // Tools won't render!
}
```

**✅ CORRECT:**
```typescript
switch (part.type) {
  case 'text':
    return <Response>{part.text}</Response>;

  case 'tool-yourTool1':
  case 'tool-yourTool2':
    // Handle tool rendering
    return <ToolResultRenderer ... />;

  default:
    return null;
}
```

### Complete File Checklist

When creating a new chat interface, you need to create/modify these files:

- [ ] `/src/app/api/chat-YOURFEATURE/route.ts` - Chat API endpoint
- [ ] `/src/components/YOURFEATURE/YourFeatureChat.tsx` - Chat UI component
- [ ] `/src/app/YOURFEATURE/page.tsx` - Page component using useChat
- [ ] `/src/lib/tools.ts` - Define your tools (if new)
- [ ] `/src/components/tool-ui/YOURTOOL-widget.tsx` - Custom widgets (if needed)
- [ ] `/src/components/tool-ui/tool-result-renderer.tsx` - Register widgets
- [ ] `/src/middleware.ts` - Add route to unprotectedRoutes (if bypassing auth)
- [ ] `/src/components/ui/navbar.tsx` - Add navigation link (if needed)

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

## Implementation Checklists

Use these checklists to ensure you've completed all steps when adding tools or creating chat interfaces.

### ✅ Step-Based Planning UI Implementation Checklist

**Backend: API Route with Multi-Step Support**
- [ ] Import `streamText` from `'ai'`
- [ ] Add `maxSteps` parameter (e.g., `maxSteps: 10`)
- [ ] Register all tools AI can use in `tools` object
- [ ] Add `onStepFinish` callback for step tracking (optional but recommended)
- [ ] Set `experimental_continueSteps: true` to let AI decide when to stop
- [ ] Return `result.toDataStreamResponse()` (NOT `toTextStreamResponse`)
- [ ] Add console.log in `onStepFinish` to track step completion
- [ ] Test API route returns step parts in response

**Frontend: Chat Component with Step Rendering**
- [ ] Add state for `expandedSteps` (array of step numbers)
- [ ] Add `case 'step-start':` to message part switch statement
- [ ] Render step divider with step number and type
- [ ] Make step divider clickable to expand/collapse
- [ ] Add visual indicator (▶/▼) for expand/collapse state
- [ ] Style step divider (bg color, border, padding)
- [ ] Update tool cases to use `<Tool defaultOpen={false}>` for collapsible UI
- [ ] Import `Tool`, `ToolHeader`, `ToolContent` from AI Elements
- [ ] Test step dividers appear when AI uses multiple tools
- [ ] Test clicking step divider expands/collapses content

**Custom Step Planning Tool (Optional)**
- [ ] Create `planStepsTool` in `src/lib/tools.ts`
- [ ] Define schema with `task` and `steps` array
- [ ] Each step has: `number`, `description`, `toolsNeeded`, `estimatedDuration`
- [ ] Execute function returns plan metadata
- [ ] Create `StepPlannerWidget` component
- [ ] Widget shows numbered steps with status icons (✓ → ⏳)
- [ ] Add progress indicator (X/Y steps completed)
- [ ] Register widget in `tool-result-renderer.tsx`
- [ ] Test planning tool creates visual plan
- [ ] Test steps update as AI executes them

**Collapsible Tool UI (AI Elements Integration)**
- [ ] Install AI Elements: `npm install @ai-sdk/react`
- [ ] Import `<Tool>`, `<ToolHeader>`, `<ToolContent>` components
- [ ] Update tool rendering to use `<Tool defaultOpen={false}>`
- [ ] Set `state="output-available"` for completed tools
- [ ] Set `state="executing"` for in-progress tools
- [ ] Add `<ToolInput>` to show tool parameters
- [ ] Add `<ToolOutput>` to show tool results
- [ ] Test tools are collapsed by default
- [ ] Test clicking header expands/collapses tool
- [ ] Test loading state shows while tool executes

**Step Tracking & Metrics (onStepFinish)**
- [ ] Add `onStepFinish` callback to `streamText()` config
- [ ] Log step type, tool calls, and token usage
- [ ] Track total cost: `totalCost += usage.totalTokens * COST_PER_TOKEN`
- [ ] Save step data to database/analytics (optional)
- [ ] Monitor step completion rates
- [ ] Add error handling for failed steps
- [ ] Test callback fires after each step completes
- [ ] Verify token usage tracking is accurate

**Advanced: Conditional Step Control**
- [ ] Add `experimental_stopWhen` to stop at specific tool (AI SDK 5.5+)
- [ ] Add `experimental_prepareStep` to modify steps before execution
- [ ] Implement custom stop logic based on step results
- [ ] Add rate limit handling for multiple rapid tool calls
- [ ] Test custom stop conditions work as expected
- [ ] Monitor API rate limits via `experimental_providerMetadata`

**Testing**
- [ ] Send message requiring multiple tools
- [ ] Verify AI calls 2+ tools sequentially
- [ ] Verify step dividers appear between tools
- [ ] Verify tools are collapsed by default
- [ ] Verify clicking step divider expands/collapses
- [ ] Verify `onStepFinish` logs appear in console
- [ ] Check token usage per step is tracked
- [ ] Test stopping after N steps works (`maxSteps`)
- [ ] Test error handling for failed steps
- [ ] Verify total latency is acceptable (steps are sequential)

---

### ✅ Simple Tool Implementation Checklist

**Tool Definition (`src/lib/tools.ts`):**
- [ ] Import `tool` from `'ai'` and `z` from `'zod'`
- [ ] Add tool to exports with descriptive name (e.g., `getStockPrice`)
- [ ] Write clear `description` that tells AI when to use the tool
- [ ] Define `inputSchema` using Zod validation
- [ ] Add `.describe()` to each schema field explaining what it is
- [ ] Implement `execute` function with proper TypeScript types
- [ ] Return JSON object (not string or primitive)
- [ ] Add error handling in execute function
- [ ] Test tool execution with console.log

**Widget Component (Optional `src/components/tool-ui/TOOLNAME-widget.tsx`):**
- [ ] Create new file named after your tool
- [ ] Import necessary UI components (Card, icons, etc.)
- [ ] Define TypeScript interface for `data` prop matching tool output
- [ ] Build responsive UI with proper styling
- [ ] Add loading states if needed
- [ ] Add error states if needed
- [ ] Test with sample data

**Tool Renderer (`src/components/tool-ui/tool-result-renderer.tsx`):**
- [ ] Import your widget component
- [ ] Add `case 'TOOLNAME':` to switch statement
- [ ] Return widget with `<YourWidget data={result} />`
- [ ] Ensure case matches exact tool name from tools.ts
- [ ] Test that widget renders in chat

**Chat Component (`src/components/YOURFEATURE/YourChat.tsx`):**
- [ ] Add `case 'tool-TOOLNAME':` to switch statement in message part rendering
- [ ] Use `part.type.replace('tool-', '')` to extract tool name
- [ ] Check `if (part.output || part.result)` for completion
- [ ] Pass to `<ToolResultRenderer>` with correct props
- [ ] Add fallback for tool-in-progress state
- [ ] Test tool appears in chat when invoked

**Testing:**
- [ ] Run dev server and navigate to chat page
- [ ] Send message that should trigger tool
- [ ] Verify AI calls the tool (check browser console)
- [ ] Verify widget renders correctly
- [ ] Verify error handling works
- [ ] Test with edge cases (empty data, missing fields, etc.)

---

### ✅ Streaming Tool Implementation Checklist

**Tool Definition (`src/lib/tools.ts`):**
- [ ] Tool returns **metadata only** (NOT actual generated content)
- [ ] Include `status: 'ready_to_generate'` in return object
- [ ] Include all necessary context (description, images, etc.)
- [ ] Add `timestamp` field
- [ ] Keep execute function fast (< 100ms)

**Streaming API Endpoint (`src/app/api/TOOLNAME-stream/route.ts`):**
- [ ] Create new route file
- [ ] Export `runtime = 'edge'` and `maxDuration = 60`
- [ ] Import `streamText` and `gateway` from AI SDK
- [ ] Parse request body with type information
- [ ] Create specialized prompts for each generation phase
- [ ] Use `streamText()` with proper model configuration
- [ ] Return `result.toTextStreamResponse()`
- [ ] Add try/catch error handling
- [ ] Return proper error Response with 500 status

**Widget Component (`src/components/tool-ui/TOOLNAME-widget.tsx`):**
- [ ] Mark as `'use client'`
- [ ] Add state for `isGenerating`, `currentStep`, `generatedContent`
- [ ] Create `handleGenerate` async function
- [ ] Fetch from streaming API endpoint
- [ ] Get ReadableStream reader: `response.body?.getReader()`
- [ ] Create TextDecoder for chunks
- [ ] Loop through stream: `while (true) { const { done, value } = await reader.read() }`
- [ ] Decode chunks and append to state
- [ ] Call `onStreamUpdate` callback on each chunk
- [ ] Call `onSwitchCodeTab` when switching phases
- [ ] Handle errors and set `isGenerating = false`
- [ ] Show live progress indicators (character counts, step indicators)
- [ ] Add "Generate" button to trigger streaming
- [ ] Disable button while generating
- [ ] Support sequential generation (HTML → CSS → JS pattern)

**Tool Renderer (`src/components/tool-ui/tool-result-renderer.tsx`):**
- [ ] Import streaming widget
- [ ] Add case for tool name
- [ ] Pass all necessary callbacks: `onStreamUpdate`, `onSwitchCodeTab`, etc.
- [ ] Pass `model` prop if widget needs it
- [ ] Test callbacks are called correctly

**Parent Component Integration:**
- [ ] Define callback functions for stream updates
- [ ] Update parent state when stream chunks arrive
- [ ] Handle tab switching if needed
- [ ] Update editor/preview in real-time
- [ ] Test streaming updates UI smoothly

**Testing:**
- [ ] Verify tool returns metadata instantly
- [ ] Verify widget opens/renders immediately
- [ ] Click "Generate" and verify streaming starts
- [ ] Watch browser Network tab - should see streaming response
- [ ] Verify UI updates in real-time (character counts)
- [ ] Verify sequential phases complete in order
- [ ] Test error handling (network failure, API error)
- [ ] Test with large content (1000+ lines)
- [ ] Verify no memory leaks during long streams

---

### ✅ New Chat Interface Checklist

**API Route (`src/app/api/chat-YOURFEATURE/route.ts`):**
- [ ] Create new file in correct directory
- [ ] Export `runtime = 'edge'` and `maxDuration = 60`
- [ ] Import `streamText` and `gateway`
- [ ] Import tools from `@/lib/tools`
- [ ] Parse `messages` and `model` from request body
- [ ] Configure `streamText()` with model, messages, tools
- [ ] Set appropriate temperature and maxTokens
- [ ] Return `result.toDataStreamResponse()` (NOT `toTextStreamResponse`)
- [ ] Add try/catch error handling
- [ ] Return error response with details
- [ ] Test API route works with curl/Postman

**Chat Component (`src/components/YOURFEATURE/YourChat.tsx`):**
- [ ] Mark as `'use client'`
- [ ] Copy imports from ElementorChat.tsx
- [ ] Define interface with all required props
- [ ] Copy `modelGroups` array for model selector
- [ ] Add state for `input` and `webSearch`
- [ ] Create `handleSubmit` function
- [ ] Render `<Conversation>` wrapper
- [ ] Add empty state UI when `messages.length === 0`
- [ ] Map over messages with unique keys
- [ ] Filter `message.parts` to remove null values
- [ ] Add switch statement for part types
- [ ] Handle `case 'text'` with `<Response>`
- [ ] Handle `case 'step-start'` (return null)
- [ ] Add `case 'tool-TOOLNAME':` for EACH tool
- [ ] Extract tool name: `part.type.replace('tool-', '')`
- [ ] Check `if (part.output || part.result)` for completion
- [ ] Render `<ToolResultRenderer>` with correct props
- [ ] Render `<Tool>` for in-progress state
- [ ] Add `<Loader>` when `status === 'streaming'`
- [ ] Add `<PromptInput>` with textarea
- [ ] Add web search toggle button
- [ ] Add model selector dropdown
- [ ] Add submit button with loading state
- [ ] Test all UI states render correctly

**Page Component (`src/app/YOURFEATURE/page.tsx`):**
- [ ] Mark as `'use client'`
- [ ] Import `useChat` from `'@ai-sdk/react'`
- [ ] Import your chat component
- [ ] Add state for `selectedModel`
- [ ] Call `useChat({ api: '/api/chat-YOURFEATURE' })`
- [ ] Destructure `messages`, `sendMessage`, `isLoading`, `status`, `reload`
- [ ] Create `handleSendMessage` function
- [ ] Check `if (!text.trim() || isLoading) return`
- [ ] Handle Perplexity model switching for web search
- [ ] Call `sendMessage({ text }, { body: { ... } })` (NOT `sendMessage(text, ...)`)
- [ ] Pass all required props to chat component
- [ ] Add page layout with proper height/overflow
- [ ] Test page loads without errors
- [ ] Test sending messages works
- [ ] Test model switching works
- [ ] Test web search toggle works

**Navigation & Auth (`src/components/ui/navbar.tsx` & `src/middleware.ts`):**
- [ ] Import icon for navigation item
- [ ] Add new item to navigation menu
- [ ] Set correct `href` to your page route
- [ ] Add descriptive title and description
- [ ] Add route to `unprotectedRoutes` in middleware (if needed)
- [ ] Test navigation link appears
- [ ] Test clicking link navigates correctly
- [ ] Test auth bypass works (if applicable)

**Integration Testing:**
- [ ] Navigate to page in browser
- [ ] Verify empty state shows
- [ ] Send a test message
- [ ] Verify message appears in chat
- [ ] Verify AI responds
- [ ] Send message that triggers tool
- [ ] Verify tool widget renders
- [ ] Verify tool completes successfully
- [ ] Test model selector changes model
- [ ] Test web search toggle
- [ ] Test regenerate button
- [ ] Test copy message button
- [ ] Check browser console for errors
- [ ] Check Network tab for API calls
- [ ] Test on mobile viewport
- [ ] Test with different models (Claude, GPT, Gemini)

---

### ✅ Debugging Checklist

**Tool Not Triggering:**
- [ ] Check AI's system prompt includes clear instructions to use tool
- [ ] Verify tool `description` is specific and actionable
- [ ] Test with explicit prompt: "Use the [toolName] tool to..."
- [ ] Check browser console for tool execution logs
- [ ] Verify tool is registered in API route's `tools` object
- [ ] Check tool name spelling matches exactly

**Tool Executes But Widget Doesn't Render:**
- [ ] Check browser console for part type: `type: 'tool-TOOLNAME'`
- [ ] Verify switch statement has `case 'tool-TOOLNAME':`
- [ ] Check case spelling matches tool name exactly
- [ ] Verify `<ToolResultRenderer>` case exists for tool
- [ ] Check `result` data structure matches widget props
- [ ] Add console.log in widget to verify it's called
- [ ] Check React DevTools for component tree

**Streaming Not Working:**
- [ ] Verify API route uses `toTextStreamResponse()` (not `toDataStreamResponse()`)
- [ ] Check Network tab shows "streaming" response type
- [ ] Verify `response.body?.getReader()` returns reader
- [ ] Add console.log in stream loop to verify chunks arrive
- [ ] Check for errors in try/catch blocks
- [ ] Verify `onStreamUpdate` callback is provided
- [ ] Test with smaller content first

**TypeError: Cannot use 'in' operator:**
- [ ] Change `sendMessage(text, ...)` to `sendMessage({ text }, ...)`
- [ ] Verify first parameter is object: `{ text: string }`
- [ ] Check you're not using `append` (doesn't exist in AI SDK 5)

**Tools Render as JSON Instead of Widget:**
- [ ] Verify widget is imported in tool-result-renderer.tsx
- [ ] Check switch case exists and returns widget
- [ ] Ensure widget export matches import name
- [ ] Check widget file has no syntax errors
- [ ] Rebuild app and clear browser cache

**Chat Component Errors:**
- [ ] Verify all AI Elements imports are correct
- [ ] Check `messages` prop is array
- [ ] Ensure `message.parts` exists before mapping
- [ ] Filter null parts: `message.parts.filter(part => part != null)`
- [ ] Add null checks: `part.text ?? part.value ?? ''`
- [ ] Verify all callbacks are optional in TypeScript interface

---

## Quick Reference: Common Patterns

### Tool Definition Pattern
```typescript
export const myTool = tool({
  description: 'Clear description of what this does',
  inputSchema: z.object({
    param: z.string().describe('What this parameter is for'),
  }),
  execute: async ({ param }) => {
    return { result: 'data' };
  },
});
```

### Chat Message Rendering Pattern
```typescript
{message.parts?.map((part, i) => {
  switch (part.type) {
    case 'text':
      return <Response key={i}>{part.text}</Response>;

    case 'tool-myTool': {
      const toolName = part.type.replace('tool-', '');
      if (part.output || part.result) {
        return <ToolResultRenderer key={i} toolResult={{...}} />;
      }
      return <Tool key={i}><ToolHeader /><ToolInput /></Tool>;
    }

    default:
      return null;
  }
})}
```

### useChat Hook Pattern
```typescript
const { messages, sendMessage, isLoading, status, reload } = useChat({
  api: '/api/chat-FEATURE',
  body: { model: selectedModel },
});

const handleSendMessage = (text: string) => {
  sendMessage({ text }, { body: { model, webSearch } });
};
```

### Streaming API Pattern
```typescript
export async function POST(req: Request) {
  const { description, type } = await req.json();

  const result = streamText({
    model: gateway(model),
    prompt: `Generate ${type}...`,
  });

  return result.toTextStreamResponse();
}
```

### ReadableStream Reader Pattern
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let content = '';

if (reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    content += chunk;

    setState(content);
    onUpdate?.(content);
  }
}
```

---