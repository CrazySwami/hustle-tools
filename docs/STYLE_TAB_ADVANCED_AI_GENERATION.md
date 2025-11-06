# Style Tab & Advanced Editor - AI-Powered Elementor Style Kit Generation

**Date:** November 6, 2025  
**Purpose:** Complete documentation of the Style tab workflow, Advanced Editor, and AI-powered style kit generation using Vercel AI SDK

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Navigation Flow](#navigation-flow)
4. [Advanced Editor Component](#advanced-editor-component)
5. [AI Generation Flow](#ai-generation-flow)
6. [API Route Architecture](#api-route-architecture)
7. [Vercel AI SDK Integration](#vercel-ai-sdk-integration)
8. [Data Flow Diagram](#data-flow-diagram)
9. [Key Components](#key-components)
10. [Usage Examples](#usage-examples)

---

## Overview

The Style tab in the elementor-editor page provides a comprehensive UI for managing Elementor style kits with AI-powered generation capabilities. It consists of multiple modes, with the **Advanced Editor** being the primary interface for AI-driven style kit creation.

### Key Features

- **Visual Style Kit Editor** - Intuitive UI for editing colors, typography, buttons, forms, and images
- **AI-Powered Generation** - Uses Vercel AI SDK to generate complete Elementor style kits from brand data
- **4-Stage Generation** - Colors → Fonts → Headings → Components
- **Multi-Model Support** - Claude Haiku 4.5, GPT-5, Gemini 2.5 Flash
- **Live Preview** - Real-time preview of style changes
- **WordPress Integration** - Push/pull style kits to/from WordPress Playground

---

## Architecture

### Component Hierarchy

```
elementor-editor/page.tsx (Main Page)
├── StyleGuideUnified (Wrapper Component)
│   ├── MODE: 'advanced-editor'
│   │   └── StyleKitEditorAdvanced (Primary Component)
│   │       ├── StyleKitGeneratorDialog (AI Configuration)
│   │       ├── Visual Editors (Colors, Typography, Buttons, Forms, Images)
│   │       └── Live Preview Panel
│   ├── MODE: 'brand' (Brandfetch Import)
│   ├── MODE: 'converter' (PHP to JSON Converter)
│   └── MODE: 'page' (CSS/Page Extractor)
```

### File Structure

```
src/
├── app/
│   ├── elementor-editor/
│   │   └── page.tsx                           # Main page with tab navigation
│   └── api/
│       └── generate-stylekit/
│           └── route.ts                       # AI generation API endpoint
│
├── components/
│   └── elementor/
│       ├── StyleGuideUnified.tsx              # Wrapper with mode switching
│       ├── StyleKitEditorAdvanced.tsx         # Main advanced editor UI
│       └── StyleKitGeneratorDialog.tsx        # AI generation configuration modal
│
└── lib/
    └── default-stylekit-template.json         # Default Elementor style kit template
```

---

## Navigation Flow

### 1. Accessing the Style Tab

From the main elementor-editor page:

```typescript
// Page navigation tabs
const tabs = [
  { id: 'style-guide', label: 'Style', dropdownItems: ['Advanced Editor', ...] }
];

// When "Advanced Editor" is clicked from dropdown:
window.dispatchEvent(new CustomEvent('open-advanced-editor'));
```

### 2. Mode Switching in StyleGuideUnified

```typescript:src/components/elementor/StyleGuideUnified.tsx
// Default mode is 'advanced-editor'
const [mode, setMode] = useState<Mode>('advanced-editor');

// Listens for navigation events
useEffect(() => {
  const handleOpenAdvancedEditor = () => setMode('advanced-editor');
  window.addEventListener('open-advanced-editor', handleOpenAdvancedEditor);
  return () => window.removeEventListener('open-advanced-editor', handleOpenAdvancedEditor);
}, []);

// Renders the appropriate component
{mode === 'advanced-editor' && (
  <StyleKitEditorAdvanced 
    onStyleKitChange={(kit) => {
      setStyleKit(kit);
      setJsonValue(JSON.stringify(kit, null, 2));
    }}
  />
)}
```

---

## Advanced Editor Component

The `StyleKitEditorAdvanced` component is the core UI for editing and generating style kits.

### Component Structure

```typescript:src/components/elementor/StyleKitEditorAdvanced.tsx
export function StyleKitEditorAdvanced({ onStyleKitChange }: StyleKitEditorAdvancedProps) {
  // State Management
  const [kit, setKit] = useState<any>({
    title: 'My Style Kit',
    type: 'kit',
    version: '0.4',
    page_settings: defaultSettings,  // From default-stylekit-template.json
    content: [],
  });

  // UI Tabs
  type EditorTab = 'global-colors' | 'global-typography' | 'theme-typography' | 
                   'buttons' | 'forms' | 'images';
  const [activeTab, setActiveTab] = useState<EditorTab>('global-colors');

  // AI Generation State
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [currentGeneratingStage, setCurrentGeneratingStage] = useState<1|2|3|4|null>(null);
  
  // Notify parent when kit changes
  useEffect(() => {
    if (onStyleKitChange) {
      onStyleKitChange(kit);
    }
  }, [kit]);
}
```

### Tab Sections

Each tab provides a visual editor for a specific part of the style kit:

#### 1. **Global Colors Tab** (`global-colors`)
- **System Colors** (4 required: Primary, Secondary, Text, Accent)
- **Custom Colors** (unlimited)
- Color picker + hex input
- Add/delete custom colors
- **AI Generation Button** → Triggers Stage 1 (Colors only)

#### 2. **Global Typography Tab** (`global-typography`)
- **System Typography** (4 required: Primary, Secondary, Text, Accent)
- **Custom Typography** (unlimited presets)
- Font family, weight, size controls
- **AI Generation Button** → Triggers Stage 2 (Fonts only)

#### 3. **Theme Typography Tab** (`theme-typography`)
- **H1-H6 Headings** - Full typography controls per heading
- **Body Typography** - Default body text settings
- **Live Preview** for each heading level
- **AI Generation Button** → Triggers Stage 3 (Headings only)

#### 4. **Buttons Tab** (`buttons`)
- Button typography, colors, borders, padding
- Hover & focus states
- Live button preview
- **AI Generation Button** → Triggers Stage 4 (Components only)

#### 5. **Forms Tab** (`forms`)
- Form field typography, colors, borders
- Focus states
- Label styling
- Container width & spacing
- **AI Generation Button** → Triggers Stage 4 (Components only)

#### 6. **Images Tab** (`images`)
- Border radius, opacity, CSS filters
- Hover effects
- Live image preview with hover demo

### AI Generation Section

Each tab section includes an "AI Generate" button:

```typescript
// Example from the Global Colors section
<button
  onClick={() => openDialogForStage(1)}  // Stage 1 = Colors
  disabled={isGenerating}
  style={{
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: isGenerating ? 'var(--muted)' : 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
    borderRadius: '6px',
    cursor: isGenerating ? 'not-allowed' : 'pointer',
  }}
>
  {isGenerating && currentGeneratingStage === 1 
    ? '⏳ Generating Colors...' 
    : '✨ AI Generate Colors'}
</button>
```

When clicked:
1. Opens the `StyleKitGeneratorDialog` modal
2. Pre-selects the appropriate stage (1-4)
3. User configures AI parameters
4. Triggers AI generation workflow

---

## AI Generation Flow

### User Journey

```
1. User clicks "AI Generate [Section]" button
   ↓
2. StyleKitGeneratorDialog opens
   - Pre-selects stage (1-4) based on section
   - User selects model (Claude Haiku 4.5 | GPT-5 | Gemini 2.5 Flash)
   - User enters optional inputs:
     * Brand colors (comma-separated hex codes)
     * Brand fonts (comma-separated font names)
     * Style preferences (text description)
     * Industry
   - User uploads optional mockup images
   ↓
3. User clicks "Generate"
   ↓
4. handleAIGenerate() is called with config
   ↓
5. POST request to /api/generate-stylekit
   ↓
6. Server-Sent Events (SSE) stream back progress
   ↓
7. Final style kit JSON is received
   ↓
8. setKit() updates the component state
   ↓
9. Preview updates in real-time
```

### Stage-Based Generation

The AI generation is broken into 4 independent stages:

| Stage | Name | Generated Fields | Estimated Cost | Duration |
|-------|------|------------------|----------------|----------|
| **1** | Colors | `system_colors`, `custom_colors` | ~$0.01 | 5-10s |
| **2** | Fonts | `system_typography`, `custom_typography`, `primary_font`, `secondary_font` | ~$0.02 | 10-15s |
| **3** | Headings | `h1_typography` → `h6_typography`, `body_typography`, `body_color`, `link_normal_color` | ~$0.02 | 10-15s |
| **4** | Components | `button_typography`, `button_*`, `form_field_*`, `container_width`, `space_between_widgets` | ~$0.02 | 10-15s |

**Full Generation** (all stages): ~$0.05-0.15, 30-60 seconds

### handleAIGenerate Function

```typescript:src/components/elementor/StyleKitEditorAdvanced.tsx
const handleAIGenerate = async (config: {
  model: 'gemini-2.5-flash' | 'claude-haiku-4.5' | 'gpt-5';
  brandfetchData?: {
    colors?: string[];
    fonts?: string[];
    logos?: string[];
    url?: string;
  };
  stylePreferences?: string;
  industry?: string;
  images?: Array<{ url: string; filename: string; description?: string }>;
  stage?: 1 | 2 | 3 | 4;  // Optional: if provided, only generate this stage
}) => {
  console.log('🎯 handleAIGenerate called');
  
  // Update UI state
  setIsGenerating(true);
  setCurrentGeneratingStage(config.stage || null);
  setGenerationProgress(
    config.stage 
      ? `Generating Stage ${config.stage}...` 
      : 'Initializing AI generation...'
  );

  // Auto-close dialog if stage-specific generation
  if (config.stage) {
    setShowAIDialog(false);
    setPreSelectedStage(undefined);
  }

  try {
    // Make API request
    const response = await fetch('/api/generate-stylekit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        brandfetchData: config.brandfetchData,
        stylePreferences: config.stylePreferences,
        industry: config.industry,
        images: config.images,
        stage: config.stage,  // Pass stage to API
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read Server-Sent Events (SSE) stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let generatedKit: any = null;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            // Update progress
            if (data.stage && data.message) {
              console.log(`📊 Stage ${data.stage}: ${data.message}`);
              setGenerationProgress(`Stage ${data.stage}/4: ${data.message}`);
            }

            // Final result
            if (data.styleKit) {
              console.log('✅ StyleKit received');
              generatedKit = data.styleKit;
            }
          }
        }
      }
    }

    // Update component state with generated kit
    if (generatedKit) {
      setGenerationProgress('Style Kit generated successfully!');
      setKit(generatedKit);  // Triggers useEffect → onStyleKitChange()
      
      setTimeout(() => {
        setShowAIDialog(false);
        setIsGenerating(false);
        setGenerationProgress('');
        setCurrentGeneratingStage(null);
      }, 1500);
    } else {
      throw new Error('No Style Kit data received from API');
    }

  } catch (error: any) {
    console.error('AI generation error:', error);
    setGenerationProgress(`❌ Error: ${error.message}`);
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentGeneratingStage(null);
    }, 3000);
  }
};
```

---

## API Route Architecture

The `/api/generate-stylekit/route.ts` handles the AI generation using **Vercel AI SDK**.

### Route Overview

```typescript:src/app/api/generate-stylekit/route.ts
import { generateText } from 'ai';  // Vercel AI SDK
import defaultTemplate from '@/lib/default-stylekit-template.json';

export const maxDuration = 60;  // Serverless function timeout

export async function POST(req: Request) {
  const { model, brandfetchData, stylePreferences, industry, stage } = await req.json();

  // Validate and map model
  let selectedModel: string;
  switch (model) {
    case 'claude-haiku-4.5':
      selectedModel = 'anthropic/claude-haiku-4-5-20251001';
      break;
    case 'gpt-5':
      selectedModel = 'openai/gpt-5';
      break;
    case 'gemini-2.5-flash':
      selectedModel = 'google/gemini-2.5-flash';
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid model' }), {
        status: 400,
      });
  }

  // Create ReadableStream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (stage: number, message: string) => {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ stage, message })}\n\n`
        ));
      };

      let styleKit = JSON.parse(JSON.stringify(defaultTemplate));
      const stagesToRun = stage ? [stage] : [1, 2, 3, 4];

      // Stage 1: Generate Colors
      if (stagesToRun.includes(1)) { /* ... */ }

      // Stage 2: Generate Fonts
      if (stagesToRun.includes(2)) { /* ... */ }

      // Stage 3: Generate Headings
      if (stagesToRun.includes(3)) { /* ... */ }

      // Stage 4: Generate Components
      if (stagesToRun.includes(4)) { /* ... */ }

      // Send final result
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ stage: 5, message: 'Complete!', styleKit })}\n\n`
      ));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Vercel AI SDK Integration

### How generateText() Works

```typescript
import { generateText } from 'ai';

const stage1Result = await generateText({
  model: selectedModel,  // 'anthropic/claude-haiku-4-5-20251001'
  prompt: STAGE1_COLORS_PROMPT + baseContext,
  temperature: 0.7,
  maxTokens: 1000,
});

// Parse AI response
const stage1Data = parseAIResponse(stage1Result.text);
// Returns: { system_colors: [...], custom_colors: [...] }

// Merge into style kit
styleKit = deepMerge(styleKit, stage1Data);
```

### Stage Prompts

Each stage has a carefully crafted prompt optimized for generating valid Elementor JSON:

#### **Stage 1: Colors**

```typescript
const STAGE1_COLORS_PROMPT = `Generate brand color palette. Return ONLY valid JSON.

GENERATE:
{
  "system_colors": [
    {"_id": "primary", "title": "Primary", "color": "#HEX"},
    {"_id": "secondary", "title": "Secondary", "color": "#HEX"},
    {"_id": "text", "title": "Text", "color": "#HEX"},
    {"_id": "accent", "title": "Accent", "color": "#HEX"}
  ],
  "custom_colors": [
    {"_id": "custom1", "title": "Custom Color Name", "color": "#HEX"}
  ]
}

RULES:
- Use provided brand colors for primary/secondary/accent
- Generate complementary colors if only 1-2 brand colors provided
- Text color must have WCAG AA contrast (4.5:1)
- Add 2-3 custom_colors for additional brand colors if available`;
```

#### **Stage 2: Fonts**

```typescript
const STAGE2_FONTS_PROMPT = `Generate typography font selections with COMPLETE nested structure. Return ONLY valid JSON.

YOU HAVE ACCESS TO:
- Brand colors: {{COLORS}}

GENERATE COMPLETE system_typography array (ALL 4 items with ALL nested properties):
{
  "primary_font": "Font Name for headings",
  "secondary_font": "Font Name for body text",
  "system_typography": [
    {
      "_id": "primary",
      "title": "Primary",
      "typography_typography": "custom",
      "typography_font_family": "Font Name",
      "typography_font_size": {"unit": "px", "size": 48, "sizes": []},
      "typography_font_size_tablet": {"unit": "px", "size": 40, "sizes": []},
      "typography_font_size_mobile": {"unit": "px", "size": 32, "sizes": []},
      "typography_font_weight": "700",
      "typography_line_height": {"unit": "em", "size": 1.3, "sizes": []},
      "typography_letter_spacing": {"unit": "px", "size": 0, "sizes": []},
      "typography_text_transform": "none",
      "typography_font_style": "normal",
      "typography_text_decoration": "none"
    },
    // ... 3 more typography items
  ]
}

RULES:
- **CRITICAL**: If user specifies brand fonts, YOU MUST use them EXACTLY
- Use Google Fonts or web-safe fonts only
- Primary font for headings, secondary for body
- MUST include ALL nested properties shown above`;
```

#### **Stage 3: Headings**

Generates `h1_typography` → `h6_typography`, `body_typography`, `body_color`, `link_normal_color` with complete nested structures including responsive sizes (desktop, tablet, mobile).

#### **Stage 4: Components**

Generates button styles, form field styles, container width, spacing, and viewport breakpoints.

### Deep Merge Strategy

```typescript
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Usage
styleKit = deepMerge(styleKit, stage1Data);  // Merge colors
styleKit = deepMerge(styleKit, stage2Data);  // Add fonts
styleKit = deepMerge(styleKit, stage3Data);  // Add headings
styleKit = deepMerge(styleKit, stage4Data);  // Add components
```

### Response Wrapping

```typescript
// Wrap all fields in page_settings for Elementor compatibility
const wrappedStyleKit = {
  title: styleKit.title || 'Generated Style Kit',
  description: styleKit.description || '',
  type: 'kit',
  version: '0.4',
  page_settings: {
    system_colors: styleKit.system_colors || [],
    custom_colors: styleKit.custom_colors || [],
    system_typography: styleKit.system_typography || [],
    // ... all other fields
  },
  content: [],
};
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  elementor-editor/page.tsx                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Tab Bar: [Chat | Docs | HTML | Library | Style]      │    │
│  │             👆 Click "Style" → opens dropdown           │    │
│  │             👆 Select "Advanced Editor"                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│                 window.dispatchEvent(                            │
│                   'open-advanced-editor'                         │
│                 )                                                │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                    WRAPPER COMPONENT LAYER                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  StyleGuideUnified.tsx                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  useEffect(() => {                                      │    │
│  │    window.addEventListener('open-advanced-editor', ...  │    │
│  │    setMode('advanced-editor');                          │    │
│  │  }, []);                                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  {mode === 'advanced-editor' && (                               │
│    <StyleKitEditorAdvanced                                      │
│      onStyleKitChange={(kit) => { ... }}                        │
│    />                                                            │
│  )}                                                              │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                   MAIN EDITOR COMPONENT LAYER                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  StyleKitEditorAdvanced.tsx                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  State:                                                 │    │
│  │  - kit: { title, type, version, page_settings, ... }   │    │
│  │  - activeTab: 'global-colors' | 'global-typography'... │    │
│  │  - isGenerating: boolean                               │    │
│  │  - currentGeneratingStage: 1 | 2 | 3 | 4 | null        │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Tab Bar: [Colors | Typography | Headings | ...]       │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Each Tab Section:                                      │    │
│  │  - Visual editors (color pickers, font selectors, etc) │    │
│  │  - "AI Generate [Section]" button                      │    │
│  │       ↓ onClick                                         │    │
│  │    openDialogForStage(stageNumber)                      │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                     AI DIALOG LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  StyleKitGeneratorDialog.tsx                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  User Inputs:                                           │    │
│  │  - Model selector (Claude | GPT | Gemini)              │    │
│  │  - Brand colors (optional)                             │    │
│  │  - Brand fonts (optional)                              │    │
│  │  - Style preferences (text)                            │    │
│  │  - Industry                                             │    │
│  │  - Mockup images (optional)                            │    │
│  │  - Stage selector (1-4 or "Full Generation")          │    │
│  │                                                         │    │
│  │  👆 Click "Generate"                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│              handleAIGenerate(config)                            │
│              {                                                   │
│                model: 'claude-haiku-4.5',                        │
│                brandfetchData: { colors, fonts, ... },           │
│                stylePreferences: '...',                          │
│                stage: 1  // If section-specific                  │
│              }                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                      API REQUEST LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  const response = await fetch('/api/generate-stylekit', {       │
│    method: 'POST',                                               │
│    body: JSON.stringify({ model, stage, ... })                  │
│  });                                                             │
│                          ↓                                       │
│  const reader = response.body?.getReader();                      │
│  while (true) {                                                  │
│    const { done, value } = await reader.read();                 │
│    // Parse SSE stream                                           │
│    if (line.startsWith('data: ')) {                             │
│      const data = JSON.parse(line.slice(6));                    │
│      if (data.stage && data.message) {                          │
│        setGenerationProgress(`Stage ${data.stage}/4: ...`);     │
│      }                                                           │
│      if (data.styleKit) {                                       │
│        setKit(data.styleKit);  // ✅ Update UI                  │
│      }                                                           │
│    }                                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                    API ROUTE LAYER                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/generate-stylekit/route.ts                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  export async function POST(req: Request) {             │    │
│  │    const { model, stage, ... } = await req.json();     │    │
│  │                                                         │    │
│  │    // Map model name to provider/model                 │    │
│  │    selectedModel = 'anthropic/claude-haiku-4-5-...'    │    │
│  │                                                         │    │
│  │    // Create SSE stream                                │    │
│  │    const stream = new ReadableStream({                 │    │
│  │      async start(controller) {                         │    │
│  │        let styleKit = { ...defaultTemplate };          │    │
│  │        const stagesToRun = stage ? [stage] : [1,2,3,4];│    │
│  │                                                         │    │
│  │        // STAGE 1: Generate Colors                     │    │
│  │        if (stagesToRun.includes(1)) {                  │    │
│  │          sendProgress(1, 'Generating colors...');      │    │
│  │          const result = await generateText({           │    │
│  │            model: selectedModel,                       │    │
│  │            prompt: STAGE1_COLORS_PROMPT,               │    │
│  │          });                                            │    │
│  │          const data = parseAIResponse(result.text);    │    │
│  │          styleKit = deepMerge(styleKit, data);         │    │
│  │        }                                                │    │
│  │                                                         │    │
│  │        // STAGE 2: Generate Fonts                      │    │
│  │        // STAGE 3: Generate Headings                   │    │
│  │        // STAGE 4: Generate Components                 │    │
│  │                                                         │    │
│  │        // Wrap in page_settings                        │    │
│  │        const wrapped = { type: 'kit', page_settings }; │    │
│  │                                                         │    │
│  │        // Send final result                            │    │
│  │        controller.enqueue(`data: { styleKit }\n\n`);   │    │
│  │      }                                                  │    │
│  │    });                                                  │    │
│  │    return new Response(stream, { ... });               │    │
│  │  }                                                      │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                  VERCEL AI SDK LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  import { generateText } from 'ai';                              │
│                                                                  │
│  await generateText({                                            │
│    model: 'anthropic/claude-haiku-4-5-20251001',                │
│    prompt: `Generate JSON for Elementor style kit colors...`,   │
│    temperature: 0.7,                                             │
│    maxTokens: 1000,                                              │
│  });                                                             │
│                          ↓                                       │
│  Returns: { text: '{"system_colors": [...], ...}' }             │
│                          ↓                                       │
│  parseAIResponse(text) → Clean JSON object                      │
│                          ↓                                       │
│  deepMerge(styleKit, parsedData) → Complete style kit           │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│                      RETURN TO UI                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  setKit(generatedStyleKit);                                      │
│  ↓                                                               │
│  useEffect(() => {                                               │
│    onStyleKitChange(kit);  // Notify parent                     │
│  }, [kit]);                                                      │
│  ↓                                                               │
│  StyleGuideUnified receives updated kit                          │
│  ↓                                                               │
│  Live preview updates with new colors/fonts/styles               │
│  ↓                                                               │
│  User can export as JSON or push to WordPress                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. StyleKitGeneratorDialog

Modal for configuring AI generation parameters.

**Location:** `src/components/elementor/StyleKitGeneratorDialog.tsx`

**Props:**
```typescript
interface StyleKitGeneratorDialogProps {
  onGenerate: (config: GenerationConfig) => void;
  onClose: () => void;
  preSelectedStage?: 1 | 2 | 3 | 4;  // For section-specific generation
}
```

### 2. Default Style Kit Template

**Location:** `src/lib/default-stylekit-template.json`

Provides the base structure with default Elementor values:

```json
{
  "title": "Default Style Kit",
  "description": "Elementor default theme style kit",
  "system_colors": [
    { "_id": "primary", "title": "Primary", "color": "#6EC1E4" },
    { "_id": "secondary", "title": "Secondary", "color": "#54595F" },
    { "_id": "text", "title": "Text", "color": "#7A7A7A" },
    { "_id": "accent", "title": "Accent", "color": "#61CE70" }
  ],
  "system_typography": [...],
  "h1_typography": {...},
  "button_typography": {...},
  // ... hundreds of Elementor fields
}
```

### 3. Helper Functions

```typescript
// Clean AI JSON response (remove markdown code blocks)
function parseAIResponse(text: string): any {
  let cleanedText = text.trim();
  cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  return JSON.parse(cleanedText);
}

// Deep merge objects (preserves nested structures)
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Get field status for UI indicators
function getFieldStatus(value: any, defaultValue: any): 'missing' | 'default' | 'has-data' {
  if (value === undefined || value === null) return 'missing';
  if (JSON.stringify(value) === JSON.stringify(defaultValue)) return 'default';
  return 'has-data';
}
```

---

## Usage Examples

### Example 1: Generate Only Colors

```typescript
// User clicks "AI Generate Colors" button in Global Colors tab
openDialogForStage(1);

// Dialog opens with stage 1 pre-selected
// User fills form and clicks "Generate"
handleAIGenerate({
  model: 'claude-haiku-4.5',
  brandfetchData: {
    colors: ['#FF5733', '#3357FF'],
    fonts: ['Roboto']
  },
  stylePreferences: 'Modern, vibrant, tech startup',
  stage: 1  // Only generate colors
});

// API generates:
{
  "system_colors": [
    { "_id": "primary", "title": "Primary", "color": "#FF5733" },
    { "_id": "secondary", "title": "Secondary", "color": "#3357FF" },
    { "_id": "text", "title": "Text", "color": "#333333" },
    { "_id": "accent", "title": "Accent", "color": "#FF8C00" }
  ],
  "custom_colors": [
    { "_id": "brand_orange", "title": "Brand Orange", "color": "#FF7043" }
  ]
}

// UI updates with new colors, rest of kit unchanged
```

### Example 2: Full Style Kit Generation

```typescript
// User clicks "Generate Complete Style Kit" in dialog
handleAIGenerate({
  model: 'gpt-5',
  brandfetchData: {
    colors: ['#0066CC', '#FF6B35'],
    fonts: ['Inter', 'Merriweather'],
    url: 'https://stripe.com'
  },
  stylePreferences: 'Professional, minimalist, fintech',
  industry: 'Financial Services',
  stage: undefined  // Generate all stages
});

// API runs all 4 stages sequentially:
// Stage 1: Colors → Stage 2: Fonts → Stage 3: Headings → Stage 4: Components

// Final output:
{
  "title": "Professional Fintech Style Kit",
  "type": "kit",
  "version": "0.4",
  "page_settings": {
    "system_colors": [...],      // 4 colors
    "custom_colors": [...],      // 3-5 additional colors
    "system_typography": [...],  // 4 typography presets
    "h1_typography": {...},      // Complete responsive typography
    "h2_typography": {...},
    // ... h3, h4, h5, h6
    "body_typography": {...},
    "button_typography": {...},
    "button_background_color": "#0066CC",
    "button_text_color": "#FFFFFF",
    "form_field_typography": {...},
    "container_width": { "unit": "px", "size": 1200 },
    // ... 50+ additional Elementor fields
  },
  "content": []
}
```

### Example 3: Progressive Refinement

```typescript
// 1. Generate base colors
await handleAIGenerate({ stage: 1, model: 'claude-haiku-4.5', ... });

// 2. Review colors in UI, make manual adjustments

// 3. Generate fonts based on updated colors
await handleAIGenerate({ stage: 2, model: 'gpt-5', ... });

// 4. Review fonts, make adjustments

// 5. Generate headings based on colors + fonts
await handleAIGenerate({ stage: 3, model: 'gemini-2.5-flash', ... });

// 6. Final review, export as JSON
handleExport();  // Downloads style-kit.json
```

---

## Conclusion

The Style tab's Advanced Editor provides a powerful, AI-driven workflow for creating production-ready Elementor style kits. By leveraging Vercel AI SDK with multiple LLM providers, it generates complete, valid Elementor JSON with proper nested structures, responsive values, and professional defaults.

**Key Benefits:**
- ✅ **No manual JSON editing** - Visual editors for all fields
- ✅ **Granular AI generation** - Generate only what you need (colors, fonts, etc.)
- ✅ **Multi-model support** - Choose best model for your use case
- ✅ **Live preview** - See changes in real-time
- ✅ **WordPress integration** - Push directly to Elementor
- ✅ **Cost-effective** - ~$0.01-0.02 per stage, ~$0.05-0.15 for full kit

**Future Enhancements:**
- Image analysis for brand extraction
- A/B testing of style variations
- Style kit library/marketplace
- Collaborative editing
- Version history & rollback

