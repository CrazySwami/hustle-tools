# System Prompt Viewer Feature ✅

## Overview
Added a new "Prompt" button next to the "Context" button in the Elementor chat interface that allows users to view the exact system prompt sent to the AI.

## What Was Added

### 1. **"Prompt" Button** ([ElementorChat.tsx:385-392](src/components/elementor/ElementorChat.tsx#L385-L392))
- Located in the prompt toolbar next to Context and Search buttons
- Icon: Eye icon (EyeIcon from lucide-react)
- Tooltip: "View the full system prompt sent to AI"
- Click handler: `handleViewSystemPrompt()`

### 2. **System Prompt Dialog** ([ElementorChat.tsx:419-454](src/components/elementor/ElementorChat.tsx#L419-L454))
- **Modal Features:**
  - Large dialog (max-width: 4xl)
  - Scrollable content area (60vh height)
  - Monospace font for code readability
  - Word wrap enabled for long lines

- **Header Information:**
  - Current model name
  - Context toggle status (✅ Enabled / ❌ Disabled)
  - Web search status (✅ Enabled / ❌ Disabled)

- **Statistics Grid** (displayed when available):
  - Total Characters (with comma formatting)
  - Estimated Tokens (~4 chars per token)
  - HTML Size (character count)
  - CSS Size (character count)
  - JS Size (character count)
  - PHP Size (character count)

- **Action Buttons:**
  - "Copy to Clipboard" - Copies full system prompt
  - "Close" - Dismisses the dialog

### 3. **API Endpoint** ([/api/get-system-prompt/route.ts](src/app/api/get-system-prompt/route.ts))
- **POST** `/api/get-system-prompt`
- **Request Body:**
  ```typescript
  {
    model: string;          // Selected model (e.g., "anthropic/claude-sonnet-4-5-20250929")
    webSearch: boolean;     // Web search enabled
    includeContext: boolean; // File context toggle
    currentSection: {       // Current editor content
      name?: string;
      html?: string;
      css?: string;
      js?: string;
      php?: string;
    }
  }
  ```

- **Response:**
  ```typescript
  {
    systemPrompt: string;   // Full system prompt text
    stats: {
      totalChars: number;    // Total character count
      estimatedTokens: number; // Rough token estimate
      htmlChars: number;     // HTML file size
      cssChars: number;      // CSS file size
      jsChars: number;       // JS file size
      phpChars: number;      // PHP file size
    };
    model: string;          // Echo back the model
    includeContext: boolean; // Echo back context toggle
    webSearch: boolean;     // Echo back search toggle
  }
  ```

## How It Works

### User Flow:
1. **User clicks "Prompt" button** in chat toolbar
2. **Frontend calls API** with current settings:
   - Selected AI model
   - Context toggle state (on/off)
   - Web search toggle state (on/off)
   - Current section content (HTML/CSS/JS/PHP)
3. **API generates system prompt** using same logic as `/api/chat-elementor`
4. **API calculates statistics** (character counts, token estimates)
5. **Dialog displays** full prompt with statistics
6. **User can:**
   - Read the exact prompt sent to AI
   - See file sizes and token estimates
   - Copy prompt to clipboard
   - Close dialog

### State Updates:
The system prompt is **generated fresh** on each button click. This ensures you always see the current state:
- If you type in Monaco editor and click "Prompt" → Shows latest code
- If you toggle Context and click "Prompt" → Shows updated prompt
- If you change models and click "Prompt" → Shows model-specific prompt

## Why This Is Useful

### 1. **Debugging AI Responses**
When the AI gives unexpected responses, you can now:
- See exactly what context it has
- Verify if code files are included
- Check if instructions are clear
- Understand which tools are available

### 2. **Understanding Context**
You asked: *"if i change a character on the html is the state updated immediately?"*
**Answer:** YES! State updates on every keystroke via Zustand store.

You can verify this by:
1. Type a character in HTML editor
2. Click "Prompt" button
3. See the updated HTML in the system prompt

### 3. **System Prompt Editing** (Future Feature)
Currently read-only, but the architecture supports:
- Editing the system prompt directly
- Testing different instructions
- A/B testing prompt variations
- Custom instructions per project

### 4. **Token Cost Awareness**
The stats show:
- Estimated tokens (~4 chars per token)
- File sizes contributing to context
- Total context size

This helps you understand:
- Why responses might be expensive
- When to disable context to save tokens
- Which files are large

## Answer to Your Questions

### Q: "if i change a character on the html is the state updated immediately?"
**A:** YES ✅

**How it works:**
1. **Monaco onChange** fires on every keystroke (no debouncing)
2. **Updates cascade immediately:**
   ```
   User types → Monaco onChange
       ↓
   updateSection() called
       ↓ (dual path)
   ├─ setSection() → React re-render (local state)
   └─ updateContent() → Zustand store (global state)
       ↓
   When you click "Prompt" button
       ↓
   API reads from: editorContent.html (fresh from Zustand)
   ```

3. **No delays or batching** - Every keystroke = immediate global state update

**Verification:**
- Type `<h1>Test</h1>` in HTML editor
- Immediately click "Prompt" button
- You'll see `<h1>Test</h1>` in the system prompt

### Q: "Can we add a button to see the full prompt thats being sent along with the prompt window"
**A:** DONE ✅

The "Prompt" button shows:
- Full system prompt text (exactly what AI receives)
- All settings (model, context, web search)
- File sizes and token estimates
- Copy to clipboard functionality

## Technical Implementation Details

### File Changes:

#### 1. [ElementorChat.tsx](src/components/elementor/ElementorChat.tsx)
```typescript
// Added imports
import { EyeIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Added state
const [systemPrompt, setSystemPrompt] = useState<string>('');
const [promptStats, setPromptStats] = useState<any>(null);
const [showPromptDialog, setShowPromptDialog] = useState(false);

// Added handler
const handleViewSystemPrompt = async () => {
  const response = await fetch('/api/get-system-prompt', {
    method: 'POST',
    body: JSON.stringify({
      model: selectedModel,
      webSearch,
      includeContext,
      currentSection,
    }),
  });
  const data = await response.json();
  setSystemPrompt(data.systemPrompt);
  setPromptStats(data.stats);
  setShowPromptDialog(true);
};

// Added button
<PromptInputButton
  variant="ghost"
  onClick={handleViewSystemPrompt}
  title="View the full system prompt sent to AI"
>
  <EyeIcon size={16} />
  <span>Prompt</span>
</PromptInputButton>

// Added dialog (see lines 419-454)
```

#### 2. [/api/get-system-prompt/route.ts](src/app/api/get-system-prompt/route.ts) (NEW FILE)
- Generates system prompt using same logic as `/api/chat-elementor/route.ts`
- Calculates statistics (character counts, token estimates)
- Returns JSON with prompt and stats

### Dependencies:
- ✅ `@/components/ui/dialog` - Already in project
- ✅ `@/components/ui/scroll-area` - Already in project
- ✅ `lucide-react` (EyeIcon) - Already in project
- ✅ No new packages needed

## Testing Instructions

### 1. Test Empty Editor
1. Open Elementor Editor: http://localhost:3002/elementor-editor
2. Clear all code (empty HTML/CSS/JS/PHP)
3. Click "Prompt" button
4. **Expected:**
   - System prompt shows ❌ NO - No section currently loaded
   - Stats show 0 chars for all files
   - Instructions mention using editCodeWithMorph on empty files

### 2. Test With Code
1. Generate a hero section (any code)
2. Click "Prompt" button
3. **Expected:**
   - System prompt shows ✅ YES - You have full access
   - HTML/CSS/JS code visible in prompt
   - Stats show actual file sizes
   - Estimated tokens: ~(total chars / 4)

### 3. Test Real-Time Updates
1. Type `<div>Test</div>` in HTML editor
2. **Immediately** click "Prompt" button (don't wait)
3. **Expected:**
   - You see `<div>Test</div>` in the system prompt
   - HTML size increases by 16 chars
   - Proves state updates instantly on keystroke

### 4. Test Context Toggle
1. Click "Context" button to disable (button goes ghost)
2. Click "Prompt" button
3. **Expected:**
   - System prompt shows ❌ NO - No section currently loaded
   - Context: ❌ Disabled
   - Stats show 0 for all files (context excluded)

4. Click "Context" button to re-enable
5. Click "Prompt" button again
6. **Expected:**
   - System prompt shows ✅ YES with all code
   - Context: ✅ Enabled

### 5. Test Copy to Clipboard
1. Click "Prompt" button
2. Click "Copy to Clipboard"
3. Paste into a text editor
4. **Expected:**
   - Full system prompt copied
   - Formatting preserved

### 6. Test Different Models
1. Change model to "GPT-5"
2. Click "Prompt" button
3. **Expected:** Model: `openai/gpt-5`

4. Change model to "Claude Sonnet 4.5"
5. Click "Prompt" button
6. **Expected:** Model: `anthropic/claude-sonnet-4-5-20250929`

## Statistics Example

For a typical section with moderate content:

```
Total Characters: 5,234
Est. Tokens: ~1,308
HTML Size: 1,847 chars
CSS Size: 2,103 chars
JS Size: 784 chars
PHP Size: 0 chars
```

**What this means:**
- System prompt uses ~1,308 tokens (base cost per message)
- HTML is 35% of context
- CSS is 40% of context
- JS is 15% of context
- No PHP code

**Cost impact (with Claude Sonnet 4.5):**
- Input: 1,308 tokens × $3.00 per 1M = $0.0039 per message
- Plus your actual message tokens
- Plus AI response tokens

## Future Enhancements

### 1. Editable System Prompt
Allow users to edit the system prompt before sending:
```typescript
<textarea
  value={systemPrompt}
  onChange={(e) => setSystemPrompt(e.target.value)}
  className="w-full h-60 font-mono text-xs"
/>
<Button onClick={() => sendWithCustomPrompt(systemPrompt)}>
  Send with Custom Prompt
</Button>
```

### 2. Prompt Templates
Save/load system prompt templates:
```typescript
const templates = {
  "Concise": "Be extremely concise. No explanations.",
  "Detailed": "Provide detailed explanations with examples.",
  "Code Only": "Output only code, no text explanations.",
};
```

### 3. Token Counter (Accurate)
Use tiktoken library for accurate token counting:
```bash
npm install tiktoken
```

### 4. Prompt History
Show previous prompts sent in the session:
```typescript
const [promptHistory, setPromptHistory] = useState<string[]>([]);
```

## Documentation Created

- ✅ This file: `SYSTEM_PROMPT_VIEWER_FEATURE.md`
- ✅ State flow docs: `ELEMENTOR_STATE_FLOW_ANALYSIS.md` (created by subagent)
- ✅ Quick reference: `ELEMENTOR_STATE_QUICK_REFERENCE.md` (created by subagent)

## Status: COMPLETE ✅

All requested features have been implemented:
- ✅ "Prompt" button added to chat interface
- ✅ Dialog shows full system prompt
- ✅ Statistics displayed (chars, tokens, file sizes)
- ✅ Copy to clipboard functionality
- ✅ Real-time state updates confirmed (every keystroke)
- ✅ API endpoint created
- ✅ Testing instructions provided

**Server Status:** Running on http://localhost:3002
**Feature Location:** Elementor Editor → Chat panel → "Prompt" button
