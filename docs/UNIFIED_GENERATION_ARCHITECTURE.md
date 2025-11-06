# Unified Generation Architecture

**Date:** January 2025
**Status:** 🚧 Phase 1 & 2 COMPLETE ✅ | Phase 3-5 IN PROGRESS

This document describes the unified generation system that eliminates code duplication across HTML, Elementor, and HubSpot project generation.

---

## Implementation Checklist

### Phase 1: Shared Configuration & Utilities ✅ COMPLETE
- [x] 1.1 Create `/src/lib/project-generation/types.ts` - TypeScript interfaces (368 lines)
- [x] 1.2 Create `/src/lib/project-generation/config.ts` - PROJECT_CONFIGS with all prompts (538 lines)
- [x] 1.3 Create `/src/lib/project-generation/parser.ts` - Code parsing functions (380 lines)
- [x] 1.4 Create `/src/lib/project-generation/streaming.ts` - Unified fetch/stream logic (421 lines)
- [ ] 1.5 Test utilities in isolation

**Phase 1 Summary:**
- ✅ Created 4 core files totaling 1,707 lines
- ✅ All TypeScript interfaces defined (ProjectConfig, ParsedFiles, GenerateParams, etc.)
- ✅ All system prompts centralized (HTML, Elementor, HubSpot Email, HubSpot Page)
- ✅ All parsers unified (parseHTMLProject, parseElementorProject, parseHubSpotProject)
- ✅ Streaming logic abstracted (streamProjectGeneration, streamWithLegacyCallbacks)
- ✅ Model configurations centralized (18 models: Claude, GPT, Gemini)

### Phase 2: React Hook ✅ COMPLETE
- [x] 2.1 Create `/src/lib/hooks/useProjectGeneration.ts` - Main generation hook (280 lines)
- [x] 2.2 Add loading states, progress tracking, error handling
- [x] 2.3 Test hook with mock data

**Phase 2 Summary:**
- ✅ Created useProjectGeneration hook with full state management
- ✅ Progress tracking with 5 phases (analyzing, planning, generating, parsing, complete)
- ✅ Error handling with AbortController for cancellation
- ✅ Auto-reset capability
- ✅ Helper hooks: useGenerationProgress, useFilePreview
- ✅ Legacy adapter: streamWithLegacyCallbacks for backward compatibility

### Phase 3: Refactor Components
- [ ] 3.1 Update `GenerateProjectWidget.tsx` to use hook
- [ ] 3.2 Update `GenerateProjectModal.tsx` to use hook
- [ ] 3.3 Remove duplicate streaming logic
- [ ] 3.4 Remove duplicate prompt building

### Phase 4: Simplify API Route
- [ ] 4.1 Update `/api/generate-project/route.ts` to use PROJECT_CONFIGS
- [ ] 4.2 Remove duplicate prompt code
- [ ] 4.3 Test all project types (HTML, Elementor, HubSpot)

### Phase 5: Testing & Documentation
- [ ] 5.1 Test HTML generation (widget + modal)
- [ ] 5.2 Test Elementor generation (widget + modal)
- [ ] 5.3 Test HubSpot generation (widget + modal)
- [ ] 5.4 Update this documentation with examples
- [ ] 5.5 Create migration guide for adding new project types

---

## Architecture Overview

### Before (Current State)
```
3,105 lines of duplicated code across:
- GenerateProjectWidget.tsx (820 lines)
- GenerateProjectModal.tsx (1,660 lines)
- /api/generate-project/route.ts (625 lines)

Issues:
❌ Prompts duplicated in modal + API
❌ Streaming logic duplicated in 2 components
❌ Code parsers scattered everywhere
❌ Adding new type = copy-paste 200+ lines
```

### After (Unified System)
```
~1,200 lines total (-60% reduction):
- config.ts (400 lines) - Single source of truth
- parser.ts (150 lines) - All parsers
- streaming.ts (100 lines) - One stream function
- useProjectGeneration.ts (200 lines) - Reusable hook
- GenerateProjectWidget.tsx (150 lines) - Just UI
- GenerateProjectModal.tsx (200 lines) - Just UI

Benefits:
✅ Prompts in ONE place
✅ Streaming logic in ONE place
✅ Bug fixes in ONE place
✅ Add new type in ~50 lines
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  UNIFIED GENERATION SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📁 config.ts (Single Source of Truth)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PROJECT_CONFIGS = {                                   │  │
│  │   html: {                                             │  │
│  │     name: 'HTML Section',                            │  │
│  │     fileTypes: ['html', 'css', 'js'],               │  │
│  │     systemPrompt: '...',                            │  │
│  │     parseResponse: (code) => parseHtmlCode(code)    │  │
│  │   },                                                  │  │
│  │   elementor: {                                        │  │
│  │     name: 'Elementor Plugin',                        │  │
│  │     fileTypes: ['php'],                              │  │
│  │     systemPrompt: '...',                            │  │
│  │     parseResponse: (code) => parseElementorCode()   │  │
│  │   },                                                  │  │
│  │   hubspot: { ... }                                   │  │
│  │ }                                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ Imported by                      │
│                           ▼                                  │
│  ⚙️ useProjectGeneration() Hook                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ const { generate, isGenerating, progress } =         │  │
│  │   useProjectGeneration({                             │  │
│  │     projectType: 'elementor',                        │  │
│  │     onFilesParsed: (files) => {...}                 │  │
│  │   });                                                │  │
│  │                                                       │  │
│  │ Provides:                                            │  │
│  │ - generate(params) - Start generation               │  │
│  │ - isGenerating - Loading state                      │  │
│  │ - progress - Current progress message               │  │
│  │ - currentPhase - Current generation phase           │  │
│  │ - error - Error message if failed                   │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                                    │
│         │ Used by                                            │
│         ▼                                                    │
│  🎨 UI Components (Just UI, No Logic)                       │
│  ┌─────────────────────┐  ┌──────────────────────────┐    │
│  │ GenerateProject     │  │ GenerateProject          │    │
│  │ Widget.tsx          │  │ Modal.tsx                │    │
│  │ (150 lines)         │  │ (200 lines)              │    │
│  │                     │  │                          │    │
│  │ - Form inputs       │  │ - Multi-step wizard      │    │
│  │ - Image upload      │  │ - Type selection         │    │
│  │ - Progress display  │  │ - Progress display       │    │
│  └─────────────────────┘  └──────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

### New Files Created
```
src/lib/
  └─ project-generation/
     ├─ types.ts              ✨ TypeScript interfaces
     ├─ config.ts             ✨ PROJECT_CONFIGS, prompts, models
     ├─ parser.ts             ✨ Code parsing logic
     └─ streaming.ts          ✨ Fetch + stream utilities

src/lib/hooks/
  └─ useProjectGeneration.ts  ✨ React hook for generation
```

### Modified Files
```
src/components/tool-ui/
  └─ GenerateProjectWidget.tsx    🔧 Refactored to use hook

src/components/elementor/
  └─ GenerateProjectModal.tsx     🔧 Refactored to use hook

src/app/api/generate-project/
  └─ route.ts                      🔧 Uses PROJECT_CONFIGS
```

---

## Core Concepts

### 1. Project Configuration

Every project type is defined in `PROJECT_CONFIGS`:

```typescript
interface ProjectConfig {
  name: string;                    // Display name
  icon: string;                    // Icon component name
  fileTypes: string[];             // Expected file types
  defaultTab: string;              // Initial tab to show
  tabSwitchThresholds: Record<string, number>; // When to auto-switch tabs
  systemPrompt: string;            // AI system prompt
  buildUserPrompt: (params) => string; // User prompt builder
  parseResponse: (code: string) => ParsedFiles; // Response parser
  subtypes?: Record<string, SubtypeConfig>; // Optional (for HubSpot email/page)
}
```

### 2. Code Parsing

Parsers extract code blocks from AI responses:

```typescript
// Input: AI response with code blocks
const response = `
Here's your HTML section:

\`\`\`html
<div>Hello</div>
\`\`\`

\`\`\`css
div { color: red; }
\`\`\`
`;

// Output: Structured files
parseHtmlCode(response) // => { html: '<div>Hello</div>', css: 'div { color: red; }', js: '' }
```

### 3. Streaming Generation

Unified streaming handles all project types:

```typescript
await streamProjectGeneration({
  projectId: 'abc123',
  projectType: 'elementor',
  description: 'pricing table widget',
  onChunk: (chunk) => console.log(chunk),
  onParsedFiles: (files) => updateEditor(files),
  onProgress: (msg) => setProgress(msg),
  onPhaseChange: (phase) => setPhase(phase)
});
```

---

## TypeScript Interfaces

### ParsedFiles

```typescript
interface ParsedFiles {
  // HTML projects
  html?: string;
  css?: string;
  js?: string;

  // Elementor projects
  mainPlugin?: string;
  widget?: string;

  // HubSpot projects
  hubl?: string;
}
```

### GenerateParams

```typescript
interface GenerateParams {
  projectId: string;
  projectName: string;
  description: string;
  images?: Array<{ url: string; filename: string }>;
  model?: string;
  globalCSS?: string;
  subtype?: string; // For HubSpot: 'email' | 'page'
}
```

### GenerationState

```typescript
interface GenerationState {
  isGenerating: boolean;
  progress: string;
  currentPhase: string | null;
  error: string | null;
  tokenCount: number;
  estimatedCost: number;
}
```

---

## Hook API

### useProjectGeneration

```typescript
const {
  // Core function
  generate,           // (params: GenerateParams) => Promise<ParsedFiles>

  // State
  isGenerating,       // boolean - Is generation in progress?
  progress,           // string - Current progress message
  currentPhase,       // string | null - Current phase (e.g., "Generating HTML...")
  error,              // string | null - Error message if failed

  // Metadata
  tokenCount,         // number - Tokens used so far
  estimatedCost,      // number - Estimated cost in USD
} = useProjectGeneration({
  projectType: 'html' | 'elementor' | 'hubspot',
  subtype?: 'email' | 'page', // For HubSpot
  onFilesParsed?: (files: ParsedFiles) => void,
  onStateChange?: (state: GenerationState) => void,
});
```

### Usage Example

```typescript
function MyComponent() {
  const { generate, isGenerating, progress } = useProjectGeneration({
    projectType: 'elementor',
    onFilesParsed: (files) => {
      // Stream files to editor in real-time
      if (files.mainPlugin) {
        updateMainPluginFile(files.mainPlugin);
      }
      if (files.widget) {
        updateWidgetFile(files.widget);
      }
    }
  });

  const handleGenerate = async () => {
    await generate({
      projectId: 'project_123',
      projectName: 'pricing_table',
      description: 'A pricing table with 3 tiers',
      model: 'anthropic/claude-sonnet-4-5-20250929'
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? progress : 'Generate'}
      </button>
    </div>
  );
}
```

---

## Adding New Project Types

To add a new project type (e.g., Shopify Liquid), follow these steps:

### Step 1: Add Configuration

**File:** `src/lib/project-generation/config.ts`

```typescript
export const PROJECT_CONFIGS = {
  // ... existing configs

  shopify: {
    name: 'Shopify Section',
    icon: 'SiShopify',
    fileTypes: ['liquid', 'css', 'js'],
    defaultTab: 'liquid',
    tabSwitchThresholds: { liquid: 500, css: 1500 },

    systemPrompt: `You are an expert Shopify Liquid developer.
    Create clean, modern Shopify sections using Liquid templating.

    Return THREE code blocks:
    - \`\`\`liquid - Section Liquid code
    - \`\`\`css - Section styles
    - \`\`\`javascript - Optional interactivity`,

    buildUserPrompt: (description, name) =>
      `Create a Shopify section for: ${description}`,

    parseResponse: (code) => parseShopifyCode(code),
  },
};
```

### Step 2: Add Parser

**File:** `src/lib/project-generation/parser.ts`

```typescript
export function parseShopifyCode(code: string): ParsedFiles {
  const liquidMatch = code.match(/```liquid\n([\s\S]*?)(?:```|$)/);
  const cssMatch = code.match(/```css\n([\s\S]*?)(?:```|$)/);
  const jsMatch = code.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

  return {
    liquid: liquidMatch?.[1]?.trim() || '',
    css: cssMatch?.[1]?.trim() || '',
    js: jsMatch?.[1]?.trim() || '',
  };
}
```

### Step 3: Add to Parser Router

```typescript
export function parseCode(code: string, projectType: string): ParsedFiles {
  const config = PROJECT_CONFIGS[projectType];
  if (!config) throw new Error(`Unknown project type: ${projectType}`);

  return config.parseResponse(code);
}
```

### Step 4: Use It!

```typescript
const { generate } = useProjectGeneration({
  projectType: 'shopify', // That's it! Hook handles everything else
  onFilesParsed: (files) => {
    updateFile('liquid', files.liquid);
    updateFile('css', files.css);
    updateFile('js', files.js);
  }
});
```

**Total lines of code:** ~50 (config + parser)

**No component changes needed!** The hook and UI automatically support the new type.

---

## Configuration Examples

### HTML Project

```typescript
html: {
  name: 'HTML Section',
  icon: 'AiFillHtml5',
  fileTypes: ['html', 'css', 'js'],
  defaultTab: 'html',
  tabSwitchThresholds: { html: 500, css: 1500, js: Infinity },

  systemPrompt: `You are an expert frontend developer.
  Create clean, modern, responsive HTML/CSS/JS code.

  Return THREE code blocks:
  - \`\`\`html - Section HTML (NO DOCTYPE/head/body)
  - \`\`\`css - Scoped styles
  - \`\`\`javascript - Optional interactivity`,

  buildUserPrompt: (description, name, globalCSS) => {
    let prompt = `Create an HTML section for: ${description}`;
    if (globalCSS) prompt += `\n\nAvailable global CSS:\n${globalCSS}`;
    return prompt;
  },

  parseResponse: (code) => parseHtmlCode(code),
}
```

### Elementor Plugin

```typescript
elementor: {
  name: 'Elementor Widget',
  icon: 'FaWordpress',
  fileTypes: ['php'],
  defaultTab: 'php',
  tabSwitchThresholds: { php: Infinity }, // Never auto-switch for single file

  systemPrompt: `You are an expert Elementor widget developer.
  Generate a complete WordPress plugin with TWO PHP FILES:

  1. Main Plugin File (main-plugin.php):
     - WordPress plugin headers
     - Register widget with Elementor

  2. Widget Class (widget.php):
     - Extend \Elementor\Widget_Base
     - Implement controls and render method

  Return TWO \`\`\`php code blocks.`,

  buildUserPrompt: (description, name) =>
    `Create an Elementor widget for: ${description}`,

  parseResponse: (code) => parseElementorCode(code),
}
```

### HubSpot Module (with subtypes)

```typescript
hubspot: {
  name: 'HubSpot Module',
  icon: 'SiHubspot',
  fileTypes: ['html', 'hubl'],
  defaultTab: 'html',
  tabSwitchThresholds: { html: 500, hubl: Infinity },

  subtypes: {
    email: {
      name: 'Email Module',
      systemPrompt: `You are a HubSpot email template developer.
      Create email-safe HTML with HubL tokens.`,
    },
    page: {
      name: 'Page Module',
      systemPrompt: `You are a HubSpot page module developer.
      Create responsive page sections with HubL.`,
    }
  },

  systemPrompt: (subtype) =>
    PROJECT_CONFIGS.hubspot.subtypes[subtype].systemPrompt,

  buildUserPrompt: (description, name, globalCSS, subtype) =>
    `Create a HubSpot ${subtype} module for: ${description}`,

  parseResponse: (code) => parseHubSpotCode(code),
}
```

---

## Parsing Strategies

### Simple Pattern Matching (HTML, Shopify)

```typescript
function parseHtmlCode(code: string): ParsedFiles {
  return {
    html: code.match(/```html\n([\s\S]*?)```/)?.[1]?.trim() || '',
    css: code.match(/```css\n([\s\S]*?)```/)?.[1]?.trim() || '',
    js: code.match(/```(?:javascript|js)\n([\s\S]*?)```/)?.[1]?.trim() || '',
  };
}
```

### Content-Based Detection (Elementor)

```typescript
function parseElementorCode(code: string): ParsedFiles {
  const phpBlocks = code.match(/```php\n([\s\S]*?)```/g) || [];

  let mainPlugin = '';
  let widget = '';

  phpBlocks.forEach(block => {
    const content = block.replace(/```php\n/, '').replace(/```/, '').trim();

    // Detect by content, not order
    if (content.includes('Plugin Name:') && content.includes('add_action')) {
      mainPlugin = content;
    } else if (content.includes('extends') && content.includes('Widget_Base')) {
      widget = content;
    }
  });

  return { mainPlugin, widget };
}
```

### Fallback Generation (HubSpot)

```typescript
function parseHubSpotCode(code: string): ParsedFiles {
  const html = code.match(/```html\n([\s\S]*?)```/)?.[1]?.trim() || '';
  let hubl = code.match(/```hubl\n([\s\S]*?)```/)?.[1]?.trim() || '';

  // If no HubL block, generate from HTML
  if (!hubl && html) {
    hubl = convertHtmlToHubl(html);
  }

  return { html, hubl };
}
```

---

## Progress Phases

Phases auto-update based on code length:

```typescript
const PHASE_THRESHOLDS = {
  html: [
    { threshold: 0, phase: 'Generating HTML...' },
    { threshold: 500, phase: 'Adding CSS...' },
    { threshold: 1500, phase: 'Adding JavaScript...' },
  ],
  elementor: [
    { threshold: 0, phase: 'Creating plugin structure...' },
    { threshold: 1000, phase: 'Generating widget class...' },
    { threshold: 2000, phase: 'Adding controls...' },
  ],
  hubspot: [
    { threshold: 0, phase: 'Generating HTML template...' },
    { threshold: 500, phase: 'Creating HubL fields...' },
  ],
};
```

---

## Model Configuration

```typescript
export const MODEL_CONFIGS = {
  'anthropic/claude-sonnet-4-5-20250929': {
    name: 'Claude Sonnet 4.5',
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    recommended: true,
  },
  'anthropic/claude-haiku-4-5-20251001': {
    name: 'Claude Haiku 4.5',
    contextWindow: 196000,
    costPer1kTokens: { input: 0.0008, output: 0.004 },
    fast: true,
  },
  // ... all 15 models
};
```

---

## Error Handling

```typescript
try {
  await generate({...});
} catch (error) {
  if (error.code === 'STREAM_TIMEOUT') {
    // Handle timeout
  } else if (error.code === 'PARSE_ERROR') {
    // Handle parsing failure
  } else if (error.code === 'API_ERROR') {
    // Handle API failure
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('parseHtmlCode', () => {
  it('extracts HTML, CSS, JS blocks', () => {
    const code = `\`\`\`html\n<div>Test</div>\n\`\`\`\n\`\`\`css\ndiv{}\n\`\`\``;
    const result = parseHtmlCode(code);
    expect(result.html).toBe('<div>Test</div>');
    expect(result.css).toBe('div{}');
  });
});

describe('useProjectGeneration', () => {
  it('transitions state correctly', async () => {
    const { result } = renderHook(() => useProjectGeneration({ projectType: 'html' }));

    expect(result.current.isGenerating).toBe(false);

    act(() => result.current.generate({...}));

    expect(result.current.isGenerating).toBe(true);
    // ... more assertions
  });
});
```

### Integration Tests

```typescript
describe('Full generation flow', () => {
  it('generates HTML project end-to-end', async () => {
    // Test actual API call + parsing + callbacks
  });

  it('generates Elementor project end-to-end', async () => {
    // Test actual API call + parsing + callbacks
  });
});
```

---

## Performance Optimizations

1. **Incremental Parsing**: Parse on each chunk, not at the end
2. **Debounced Updates**: Batch editor updates (max 10/sec)
3. **Web Workers**: Move parsing to worker thread for large responses
4. **Memoization**: Cache parsed results for identical code

---

## Migration Guide

### Before (GenerateProjectWidget.tsx)

```typescript
// 200+ lines of streaming logic
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  // ... parsing logic
  // ... state updates
}
```

### After (GenerateProjectWidget.tsx)

```typescript
// Just 3 lines!
const { generate, isGenerating, progress } = useProjectGeneration({
  projectType: 'html',
  onFilesParsed: (files) => updateEditor(files)
});
```

**Lines saved:** 197 lines → 3 lines (98% reduction)

---

## Success Metrics

### Code Reduction
- **Before:** 3,105 lines
- **After:** ~1,200 lines
- **Reduction:** 60%

### Duplication Eliminated
- Prompts: 2 places → 1 place
- Streaming: 2 places → 1 place
- Parsers: 3+ places → 1 place

### Extensibility
- **Before:** 200+ lines to add new type
- **After:** ~50 lines to add new type

### Maintainability
- **Before:** Bug fix = change 3+ files
- **After:** Bug fix = change 1 file

---

## Future Enhancements

1. **Streaming Previews**: Show live preview as code generates
2. **Smart Retry**: Auto-retry on parse failure with refined prompts
3. **Multi-file Projects**: Support projects with 5+ files
4. **Template Library**: Pre-built configs for common patterns
5. **AI Model Router**: Auto-select best model based on project complexity

---

## Troubleshooting

### Generation Fails to Parse

**Symptom:** `onFilesParsed` never called, or receives empty files

**Cause:** Regex doesn't match AI response format

**Fix:** Check `parser.ts` regex patterns match actual response

### Progress Stuck

**Symptom:** Progress message doesn't update

**Cause:** Phase thresholds not configured

**Fix:** Add thresholds to `PROJECT_CONFIGS[type].tabSwitchThresholds`

### Wrong Files Saved

**Symptom:** Files saved to wrong fields (e.g., widget saved as mainPlugin)

**Cause:** Parser detection logic incorrect

**Fix:** Update parser content detection in `parser.ts`

---

## Notes

- All prompts are now in ONE place (`config.ts`)
- All parsers are in ONE place (`parser.ts`)
- All streaming logic is in ONE place (`streaming.ts`)
- Components are just UI - no business logic
- Hook is reusable across any UI (modal, widget, CLI, etc.)
- Adding new types is trivial - just config + parser

---

**Last Updated:** [TIMESTAMP]
**Status:** 🚧 Phase 1 In Progress
