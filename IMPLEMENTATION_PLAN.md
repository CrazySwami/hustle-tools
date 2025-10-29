# Code Editing System - Implementation Plan

**Date:** October 26, 2025
**Status:** Ready to Implement

---

## Current State Verification

✅ **What's Working:**
- `editCode` tool exists and works
- Shows git diff in chat
- Handles single file edits
- Widget has approval/reject flow

❌ **What's Missing:**
- Full multi-file context (HTML + CSS + JS + PHP)
- Prompt caching for cost optimization
- Handling empty files gracefully
- Multi-file atomic edits
- Single-file generation option

---

## Phase 1: Multi-File Context + Prompt Caching

### Goal
Give the AI full codebase context (all files) when editing any single file, with aggressive prompt caching to reduce costs by 60-90%.

### Current Problem
```typescript
// edit-code-stream/route.ts - Line 60
body: JSON.stringify({
  instruction: data.instruction,
  fileType: data.fileType,
  currentCode: originalCode,  // ❌ Only ONE file
  context: data.context || '',
})
```

**Missing:** HTML, CSS, JS, PHP context

### Implementation

#### 1.1 Update API Endpoint Input Schema

**File:** `/src/app/api/edit-code-stream/route.ts`

```typescript
export async function POST(req: Request) {
  const {
    instruction,
    fileType,
    currentCode,      // The file being edited
    context = '',

    // NEW: Full codebase context
    allFiles = {      // ⭐ NEW
      html: '',
      css: '',
      js: '',
      php: ''
    }
  }: {
    instruction: string;
    fileType: 'html' | 'css' | 'js' | 'php';
    currentCode: string;
    context?: string;
    allFiles?: {      // ⭐ NEW
      html: string;
      css: string;
      js: string;
      php?: string;
    };
  } = await req.json();
```

#### 1.2 Build Multi-File Context Prompt

**File:** `/src/app/api/edit-code-stream/route.ts` (after line 129)

Add new context builder:

```typescript
// Build context section based on available files
const buildContextSection = (allFiles: any, targetFile: string) => {
  const sections: string[] = [];

  // Always include all files for context (except the one being edited)
  if (allFiles.html && targetFile !== 'html') {
    sections.push(`**HTML Structure (for reference):**
\`\`\`html
${allFiles.html}
\`\`\``);
  }

  if (allFiles.css && targetFile !== 'css') {
    sections.push(`**CSS Styles (for reference):**
\`\`\`css
${allFiles.css}
\`\`\``);
  }

  if (allFiles.js && targetFile !== 'js') {
    sections.push(`**JavaScript (for reference):**
\`\`\`javascript
${allFiles.js}
\`\`\``);
  }

  if (allFiles.php && targetFile !== 'php') {
    sections.push(`**PHP Widget (for reference):**
\`\`\`php
${allFiles.php}
\`\`\``);
  }

  return sections.length > 0 ? '\n\n' + sections.join('\n\n') : '';
};

const contextSection = buildContextSection(allFiles, fileType);
```

#### 1.3 Implement Prompt Caching

**File:** `/src/app/api/edit-code-stream/route.ts` (lines 133-158)

**Replace current implementation with:**

```typescript
const result = streamText({
  model: gateway(modelSelection.model, {
    apiKey: process.env.AI_GATEWAY_API_KEY!,
  }),
  messages: [
    {
      role: 'user',
      content: [
        // PART 1: System instructions (CACHE - rarely changes)
        {
          type: 'text',
          text: prompts[fileType],
          experimental_providerMetadata: {
            anthropic: {
              cacheControl: { type: 'ephemeral' }
            }
          }
        },

        // PART 2: Context files (CACHE - changes per session)
        {
          type: 'text',
          text: contextSection,
          experimental_providerMetadata: {
            anthropic: {
              cacheControl: { type: 'ephemeral' }
            }
          }
        },

        // PART 3: Current code being edited (CACHE - changes per edit)
        {
          type: 'text',
          text: `\n\n**CURRENT ${fileType.toUpperCase()} CODE TO EDIT:**\n\`\`\`${fileType}\n${currentCode}\n\`\`\``,
          experimental_providerMetadata: {
            anthropic: {
              cacheControl: { type: 'ephemeral' }
            }
          }
        },

        // PART 4: Instruction (NOT CACHED - changes every request)
        {
          type: 'text',
          text: `\n\n**USER INSTRUCTION:** ${instruction}${context ? `\n**ADDITIONAL CONTEXT:** ${context}` : ''}`
        }
      ]
    }
  ],
  temperature: 0.3,
});
```

**Caching Strategy:**
- **Level 1 (System prompt):** 99% cache hit (almost never changes)
- **Level 2 (Context files):** 90% cache hit (changes when other files are edited)
- **Level 3 (Current code):** 80% cache hit (changes per edit iteration)
- **Level 4 (Instruction):** 0% cache (always unique)

**Result:** ~85% average cache hit rate = 70% cost reduction

#### 1.4 Update Frontend to Send All Files

**File:** `/src/components/tool-ui/edit-code-widget.tsx` (lines 41-46)

**Current:**
```typescript
useEffect(() => {
  const content = getContent([data.fileType]);
  const currentCode = content[data.fileType] || '';
  setOriginalCode(currentCode);
}, [data.fileType, getContent]);
```

**Updated:**
```typescript
const [allFilesContent, setAllFilesContent] = useState<{
  html: string;
  css: string;
  js: string;
  php?: string;
}>({ html: '', css: '', js: '' });

useEffect(() => {
  // Get ALL files for context
  const allContent = getContent(); // No filter = get all
  setAllFilesContent({
    html: allContent.html || '',
    css: allContent.css || '',
    js: allContent.js || '',
    php: allContent.php || ''
  });

  // Set the file being edited
  const currentCode = allContent[data.fileType] || '';
  setOriginalCode(currentCode);

  console.log(`📄 Loaded context:`, {
    editing: data.fileType,
    htmlChars: allContent.html?.length || 0,
    cssChars: allContent.css?.length || 0,
    jsChars: allContent.js?.length || 0,
    phpChars: allContent.php?.length || 0,
  });
}, [data.fileType, getContent]);
```

**File:** `/src/components/tool-ui/edit-code-widget.tsx` (lines 57-66)

**Update fetch call:**
```typescript
const response = await fetch('/api/edit-code-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instruction: data.instruction,
    fileType: data.fileType,
    currentCode: originalCode,
    context: data.context || '',
    allFiles: allFilesContent,  // ⭐ NEW - send all files
  }),
});
```

### Expected Outcomes

✅ **Better AI Decisions**
- Can see HTML structure when editing CSS
- Understands element relationships
- Makes contextually aware changes

✅ **Cost Reduction**
- Before: 6,500 tokens × $3/M = $0.0195 per edit
- After (with caching): 1,000 tokens × $3/M = $0.003 per edit
- **Savings: 85% reduction in cost**

✅ **Faster Response Times**
- Cached content loads instantly
- Only processes instruction + small delta

---

## Phase 2: Empty File Handling

### Goal
Make the `editCode` tool work seamlessly with empty files (0 characters).

### Current Problem
When a file is empty:
- Shows warning: "⚠️ No existing code - will generate from scratch"
- Button changes to "Generate Code"
- But still uses "edit" prompts which assume existing code

### Implementation

#### 2.1 Update Prompt Logic

**File:** `/src/app/api/edit-code-stream/route.ts` (line 39)

**Current:**
```typescript
const isEmptyFile = !currentCode || currentCode.trim().length === 0;
const actionVerb = isEmptyFile ? 'Generate' : 'Edit';
```

**Enhancement:** Add mode-specific instructions

```typescript
const isEmptyFile = !currentCode || currentCode.trim().length === 0;
const actionVerb = isEmptyFile ? 'Generate' : 'Edit';

// Add to each prompt (after line 48):
${isEmptyFile ? `
**GENERATION MODE ACTIVE:**
You are creating NEW code from scratch. Use the context files as reference to ensure compatibility:
- Match the design patterns and structure
- Use consistent naming conventions
- Ensure the new ${fileType} integrates seamlessly with existing files
` : `
**EDIT MODE ACTIVE:**
You are modifying EXISTING code. Make minimal, targeted changes:
- Preserve existing structure and only change what's necessary
- Maintain compatibility with existing code
- Keep the original style and patterns
`}
```

#### 2.2 Improve Widget UX for Empty Files

**File:** `/src/components/tool-ui/edit-code-widget.tsx` (lines 164-168)

**Current:**
```typescript
{!originalCode && (
  <p className="text-xs text-muted-foreground">
    ⚠️ No existing {data.fileType.toUpperCase()} code - will generate from scratch
  </p>
)}
```

**Enhanced:**
```typescript
{!originalCode && (
  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
    <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
      💡 Empty File Detected
    </p>
    <p className="text-blue-700 dark:text-blue-300">
      Will generate new {data.fileType.toUpperCase()} code using context from:
    </p>
    <ul className="mt-1 space-y-0.5 text-blue-600 dark:text-blue-400">
      {allFilesContent.html && <li>✓ HTML ({allFilesContent.html.length} chars)</li>}
      {allFilesContent.css && <li>✓ CSS ({allFilesContent.css.length} chars)</li>}
      {allFilesContent.js && <li>✓ JavaScript ({allFilesContent.js.length} chars)</li>}
    </ul>
  </div>
)}
```

### Expected Outcomes

✅ **Seamless Empty File Editing**
- No more confusion about "can't edit empty file"
- Clear indication of generation mode
- Uses context from other files

✅ **Better Generated Code**
- Matches existing HTML structure
- Uses consistent class names
- Integrates with existing JavaScript

---

## Phase 3: Single-File Generation Option

### Goal
Add ability to generate ONLY ONE file (e.g., just CSS) without generating all three.

### Current Problem
`generateHTML` tool always creates HTML + CSS + JS, even if user only needs CSS.

### Implementation

#### 3.1 Add New Tool: `generateSingleFile`

**File:** `/src/lib/tools.ts` (after line 221)

```typescript
// Single File Generator - generates only one file type
export const generateSingleFileTool = tool({
  description: 'Generate a single file (HTML, CSS, or JS) using existing files as context. Use this when user only needs ONE file type and wants to preserve others. Example: "generate CSS for my HTML" → only creates CSS.',
  inputSchema: z.object({
    fileType: z.enum(['html', 'css', 'js']).describe('Which file to generate'),
    description: z.string().describe('What to generate in this file'),
    images: z.array(z.object({
      url: z.string(),
      filename: z.string(),
    })).max(3).optional().describe('Optional reference images'),
  }),
  execute: async ({ fileType, description, images = [] }) => {
    return {
      fileType,
      description,
      imageCount: images.length,
      images,
      timestamp: new Date().toISOString(),
      status: 'ready_to_generate',
      message: `Single file generator activated. Will generate ${fileType.toUpperCase()} only.`
    };
  },
});
```

#### 3.2 Add to Tools Export

**File:** `/src/lib/tools.ts` (line 576)

```typescript
export const tools = {
  // ... existing tools
  generateHTML: htmlGeneratorTool,
  generateSingleFile: generateSingleFileTool,  // ⭐ NEW
  editCode: editCodeTool,
  // ... rest
};
```

#### 3.3 Create Widget Component

**File:** `/src/components/tool-ui/single-file-generator-widget.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon, Loader2Icon } from 'lucide-react';
import { useEditorContent } from '@/hooks/useEditorContent';

interface SingleFileGeneratorWidgetProps {
  data: {
    fileType: 'html' | 'css' | 'js';
    description: string;
    images: Array<{ url: string; filename: string }>;
  };
  model?: string;
}

export function SingleFileGeneratorWidget({ data, model }: SingleFileGeneratorWidgetProps) {
  const { getContent, updateContent } = useEditorContent();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Get all files for context
    const allContent = getContent();

    // Call edit-code-stream in generation mode
    const response = await fetch('/api/edit-code-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: data.description,
        fileType: data.fileType,
        currentCode: '', // Empty = generation mode
        allFiles: {
          html: allContent.html || '',
          css: allContent.css || '',
          js: allContent.js || '',
        },
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulated += chunk;
        setGeneratedCode(accumulated);
      }
    }

    // Auto-apply to editor
    updateContent(data.fileType, accumulated);
    setIsGenerating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          Generate {data.fileType.toUpperCase()} Only
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm">{data.description}</p>

          {!isGenerating && !generatedCode && (
            <Button onClick={handleGenerate}>
              Generate {data.fileType.toUpperCase()}
            </Button>
          )}

          {isGenerating && (
            <div className="flex items-center gap-2">
              <Loader2Icon className="animate-spin" size={16} />
              <span className="text-sm">Generating {data.fileType.toUpperCase()}...</span>
            </div>
          )}

          {generatedCode && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Generated {generatedCode.length} characters
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3.4 Register in Tool Result Renderer

**File:** `/src/components/tool-ui/tool-result-renderer.tsx` (after line 139)

```typescript
case 'generateSingleFile':
  return (
    <SingleFileGeneratorWidget
      data={result}
      model={model}
    />
  );
```

#### 3.5 Add to Chat Endpoint

**File:** `/src/app/api/chat-elementor/route.ts` (line 178)

```typescript
const toolsConfig = {
  // ... existing tools
  generateHTML: tools.generateHTML,
  generateSingleFile: tools.generateSingleFile,  // ⭐ NEW
  editCode: tools.editCode,
  // ... rest
};
```

### Expected Outcomes

✅ **Selective Generation**
- User: "generate CSS for my HTML" → Only CSS generated
- Existing HTML and JS preserved
- No accidental overwrites

✅ **Context-Aware Generation**
- CSS matches HTML structure
- Uses existing class names
- Integrates with existing code

---

## Phase 4: Add `editCode` to Chat Endpoint

### Goal
Make the `editCode` tool available in the chat interface.

### Implementation

#### 4.1 Add Tool to Config

**File:** `/src/app/api/chat-elementor/route.ts` (lines 173-184)

**Current:**
```typescript
const toolsConfig = {
  getWeather: tools.getWeather,
  calculate: tools.calculate,
  generateCode: tools.generateCode,
  manageTask: tools.manageTask,
  generateHTML: tools.generateHTML,
  updateSectionHtml: tools.updateSectionHtml,  // Legacy
  updateSectionCss: tools.updateSectionCss,    // Legacy
  updateSectionJs: tools.updateSectionJs,      // Legacy
  testPing: tools.testPing,
  switchTab: tools.switchTab,
};
```

**Updated:**
```typescript
const toolsConfig = {
  getWeather: tools.getWeather,
  calculate: tools.calculate,
  generateCode: tools.generateCode,
  manageTask: tools.manageTask,
  generateHTML: tools.generateHTML,
  generateSingleFile: tools.generateSingleFile,  // ⭐ NEW
  editCode: tools.editCode,                      // ⭐ NEW (replaces legacy tools)
  viewEditorCode: tools.viewEditorCode,
  testPing: tools.testPing,
  switchTab: tools.switchTab,
  planSteps: tools.planSteps,
  updateStepProgress: tools.updateStepProgress,
};
```

#### 4.2 Update System Prompt

**File:** `/src/app/api/chat-elementor/route.ts` (lines 82-85)

**Replace:**
```typescript
**For EDITING existing sections:**
When a user asks to "modify", "change", "update", "edit", or "fix" the CURRENT section:
- \`updateSectionHtml\` - To modify the HTML markup
- \`updateSectionCss\` - To modify the styling/colors/layout
- \`updateSectionJs\` - To modify interactivity/functionality
```

**With:**
```typescript
**For EDITING existing sections:**
When a user asks to "modify", "change", "update", "edit", or "fix" the CURRENT section, use the \`editCode\` tool:
- Specify which file to edit (html, css, js, or php)
- Provide clear instruction of what to change
- The tool will show a diff preview for user approval
- Can handle both editing existing code AND generating new code for empty files
```

### Expected Outcomes

✅ **Diff-Based Editing in Chat**
- User can request edits via chat
- See side-by-side diff preview
- Approve/reject changes before applying

✅ **Consistent UX**
- Same editing experience across all interfaces
- No more legacy full-file replacement tools

---

## Testing Plan

### Test Case 1: Multi-File Context
**Setup:**
- HTML file: Hero section with button
- CSS file: Basic styles
- JS file: Empty

**Test:**
1. Ask: "Add a click handler to the button"
2. Verify AI knows which button (from HTML context)
3. Check JS generates correct selector (from HTML)

**Expected:**
```javascript
document.querySelector('.hero-button').addEventListener('click', () => {
  // ... AI knows .hero-button exists in HTML
});
```

### Test Case 2: Empty File Generation
**Setup:**
- HTML file: Contact form
- CSS file: Empty
- JS file: Empty

**Test:**
1. Ask: "Generate CSS for the contact form"
2. Verify AI uses HTML structure as reference
3. Check CSS matches form element classes

**Expected:**
- CSS includes `.contact-form`, `.form-input`, etc.
- Styles match HTML structure

### Test Case 3: Single File Generation
**Setup:**
- HTML file: Pricing table
- CSS file: Layout styles
- JS file: Empty

**Test:**
1. Ask: "Generate JavaScript for the pricing toggle"
2. Use `generateSingleFile` tool
3. Verify only JS is generated (HTML/CSS untouched)

**Expected:**
- JS file populated
- HTML and CSS unchanged

### Test Case 4: Prompt Caching Cost Savings
**Setup:**
- HTML: 2000 chars
- CSS: 1500 chars
- JS: 1000 chars

**Test:**
1. Edit CSS: "Change button color to red"
2. Edit CSS again: "Change button color to blue"
3. Check API logs for cache hits

**Expected:**
- First request: ~5000 tokens input
- Second request: ~500 tokens input (90% cached)
- Cost reduction: 85%

---

## Rollout Strategy

### Step 1: Phase 1 (Multi-File Context + Caching)
**Estimated Time:** 2-3 hours
**Files Changed:** 2
- `/src/app/api/edit-code-stream/route.ts`
- `/src/components/tool-ui/edit-code-widget.tsx`

**Deploy & Test:**
- Deploy to development branch
- Test with real editing scenarios
- Monitor cache hit rates in logs
- Verify cost reduction

### Step 2: Phase 2 (Empty File Handling)
**Estimated Time:** 1 hour
**Files Changed:** 2
- `/src/app/api/edit-code-stream/route.ts`
- `/src/components/tool-ui/edit-code-widget.tsx`

**Deploy & Test:**
- Test editing empty files
- Verify generation mode works
- Check integration with existing files

### Step 3: Phase 3 (Single File Generation)
**Estimated Time:** 2 hours
**Files Changed:** 4
- `/src/lib/tools.ts`
- `/src/components/tool-ui/single-file-generator-widget.tsx` (new)
- `/src/components/tool-ui/tool-result-renderer.tsx`
- `/src/app/api/chat-elementor/route.ts`

**Deploy & Test:**
- Test selective generation
- Verify no overwrites occur
- Check context awareness

### Step 4: Phase 4 (Chat Integration)
**Estimated Time:** 30 minutes
**Files Changed:** 1
- `/src/app/api/chat-elementor/route.ts`

**Deploy & Test:**
- Test editCode tool from chat
- Verify diff preview works
- Check multi-file edit flows

---

## Success Metrics

**Before Implementation:**
- Cost per edit: $0.0195 (6,500 tokens)
- Empty file editing: Not supported
- Single file generation: Not available
- Context awareness: Single file only

**After Implementation:**
- Cost per edit: $0.003 (85% reduction)
- Empty file editing: ✅ Seamless
- Single file generation: ✅ Available
- Context awareness: ✅ Full codebase

---

## Ready to Implement?

All phases are documented and ready to code. We can start with Phase 1 (biggest impact) or implement all phases together.

**Recommendation:** Start with Phase 1 + Phase 4 (multi-file context + chat integration), then add Phase 2 + Phase 3 incrementally.
