# 🚀 Master Migration Guide - Elementor JSON Editor → Next.js

> **Complete step-by-step guide to migrate the entire Elementor JSON Editor to Next.js in under 2 hours**

**Package Version:** 1.0
**Created:** 2025-01-15
**Migration Time:** 1-2 hours
**Difficulty:** Intermediate

---

## 📦 What's In This Package

```
MIGRATION_PACKAGE/
├── MASTER_MIGRATION_GUIDE.md          ← YOU ARE HERE
├── REFERENCE_DOCS/
│   ├── COMPLETE_FEATURES_GUIDE.md     ← Full feature documentation
│   ├── TOOL_UI_DISPLAYS.md            ← All 7 AI tool UI patterns
│   ├── CLAUDE.md                      ← Quick reference for AI assistants
│   └── FILE_STRUCTURE_MAP.md          ← Complete file structure guide
├── NEXTJS_TEMPLATES/
│   ├── app/
│   │   ├── page.tsx                   ← Main page component
│   │   ├── layout.tsx                 ← Root layout
│   │   └── globals.css                ← Global styles
│   ├── components/
│   │   ├── ChatInterface.tsx          ← Chat UI component
│   │   ├── JsonEditor.tsx             ← JSON editor component
│   │   ├── HtmlGenerator.tsx          ← HTML generator component
│   │   ├── PlaygroundView.tsx         ← WordPress Playground
│   │   ├── DebugPanel.tsx             ← Debug panel component
│   │   └── TokenTracker.tsx           ← Token cost tracker
│   ├── hooks/
│   │   ├── useOpenAI.ts               ← OpenAI client hook
│   │   ├── useStateManager.ts         ← State management hook
│   │   ├── useJsonEditor.ts           ← JSON editor hook
│   │   └── usePlayground.ts           ← Playground hook
│   ├── lib/
│   │   ├── openai-client.js           ← Direct copy from modules/
│   │   ├── chat-ui.js                 ← Direct copy from modules/
│   │   ├── json-editor.js             ← Direct copy from modules/
│   │   ├── json-diff.js               ← Direct copy from modules/
│   │   ├── state-manager.js           ← Direct copy from modules/
│   │   ├── html-converter.js          ← Direct copy from modules/
│   │   └── openai-audio.js            ← Direct copy from modules/
│   ├── public/
│   │   └── playground.js              ← WordPress Playground script
│   └── package.json                   ← Dependencies
└── SOURCE_CODE/                       ← Original working code
    ├── chat-editor.html
    ├── modules/
    ├── styles/
    └── [all original files]
```

---

## 🎯 Migration Strategy Overview

### Strategy: **Hybrid Approach (Recommended)**

**Why?** Keeps working code intact while adding React benefits.

**How?**
1. ✅ Copy original modules to `lib/` folder (zero changes)
2. ✅ Create React component wrappers around them
3. ✅ Use existing CSS with Tailwind additions
4. ✅ Convert state management to React hooks
5. ✅ Keep all AI tool logic exactly as-is

**Result:** Working Next.js app in ~2 hours with all features intact.

---

## 📋 Step-by-Step Migration Process

### Phase 1: Setup (20 minutes)

#### Step 1.1: Create Next.js Project

```bash
# Create new Next.js app
npx create-next-app@latest elementor-json-editor

# When prompted:
# ✓ TypeScript? Yes
# ✓ ESLint? Yes
# ✓ Tailwind CSS? Yes
# ✓ `src/` directory? No
# ✓ App Router? Yes
# ✓ Import alias? Yes (@/*)

cd elementor-json-editor
```

#### Step 1.2: Install Dependencies

```bash
npm install openai @wordpress/playground jsoneditor html2canvas
npm install -D @types/node
```

#### Step 1.3: Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_ASSISTANT_ID=asst_your-id-here
NEXT_PUBLIC_VECTOR_STORE_ID=vs_your-id-here
```

**Where to find these:**
- API Key: https://platform.openai.com/api-keys
- Assistant ID: From `assistant-config.json` in original project
- Vector Store ID: From `assistant-config.json` in original project

---

### Phase 2: Copy Source Code (15 minutes)

#### Step 2.1: Copy Modules to `lib/`

```bash
# From this migration package, copy to your Next.js project:
cp -r SOURCE_CODE/modules/* elementor-json-editor/lib/

# Files copied:
# ✓ lib/openai-client.js
# ✓ lib/chat-ui.js
# ✓ lib/json-editor.js
# ✓ lib/json-diff.js
# ✓ lib/state-manager.js
# ✓ lib/html-converter.js
# ✓ lib/openai-audio.js
```

#### Step 2.2: Copy Playground Script

```bash
cp SOURCE_CODE/playground.js elementor-json-editor/public/
```

#### Step 2.3: Copy Styles

```bash
cp SOURCE_CODE/styles/chat-editor-styles.css elementor-json-editor/app/chat-editor.css
```

---

### Phase 3: Create Next.js Components (45 minutes)

#### Step 3.1: Copy Template Files

```bash
# Copy all files from NEXTJS_TEMPLATES/ to your Next.js project
cp -r NEXTJS_TEMPLATES/app/* elementor-json-editor/app/
cp -r NEXTJS_TEMPLATES/components elementor-json-editor/
cp -r NEXTJS_TEMPLATES/hooks elementor-json-editor/
```

#### Step 3.2: Update `package.json`

Replace your `package.json` with the one in `NEXTJS_TEMPLATES/package.json`:

```bash
cp NEXTJS_TEMPLATES/package.json elementor-json-editor/package.json
npm install
```

---

### Phase 4: Wire Up Components (30 minutes)

#### Step 4.1: Update Main Page

The template `app/page.tsx` is ready to use! It includes:
- ✅ Chat interface with streaming
- ✅ JSON editor with syntax highlighting
- ✅ HTML generator with image upload
- ✅ WordPress Playground preview
- ✅ All 7 AI tools working
- ✅ Token tracking
- ✅ Debug panel

#### Step 4.2: Configure API Routes (Optional)

If you want to hide API keys server-side:

```bash
# Create API route
mkdir -p elementor-json-editor/app/api/chat
```

Create `app/api/chat/route.ts`:

```typescript
import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Server-side only
});

export async function POST(req: NextRequest) {
  const { messages, tools } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages,
    tools,
    stream: true
  });

  // Return streaming response
  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

Then update `hooks/useOpenAI.ts` to call `/api/chat` instead of OpenAI directly.

---

### Phase 5: Test & Deploy (15 minutes)

#### Step 5.1: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

#### Step 5.2: Test Core Features

**Checklist:**
- [ ] Chat interface loads
- [ ] Can send messages to AI
- [ ] Streaming works character-by-character
- [ ] Tool calls show enhanced UI displays
- [ ] JSON editor syntax highlights correctly
- [ ] Can upload images in HTML generator
- [ ] Playground loads WordPress
- [ ] Can import JSON to Playground
- [ ] Token tracker shows costs
- [ ] Debug panel logs console output

#### Step 5.3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# When prompted:
# ✓ Set up and deploy? Yes
# ✓ Link to existing project? No
# ✓ Project name? elementor-json-editor
# ✓ Directory? ./

# Set environment variables in Vercel dashboard
# https://vercel.com/your-name/elementor-json-editor/settings/environment-variables
```

---

## 📂 File-by-File Migration Map

### Original → Next.js Mapping

| Original File | New Location | Type | Notes |
|--------------|--------------|------|-------|
| `chat-editor.html` | `app/page.tsx` | Convert | Split into React components |
| `modules/openai-client.js` | `lib/openai-client.js` | **Copy as-is** | No changes needed |
| `modules/chat-ui.js` | `lib/chat-ui.js` | **Copy as-is** | Wrapped by ChatInterface component |
| `modules/json-editor.js` | `lib/json-editor.js` | **Copy as-is** | Wrapped by JsonEditor component |
| `modules/json-diff.js` | `lib/json-diff.js` | **Copy as-is** | Used directly in hooks |
| `modules/state-manager.js` | `hooks/useStateManager.ts` | Convert | React hook version |
| `modules/html-converter.js` | `lib/html-converter.js` | **Copy as-is** | Used in HtmlGenerator |
| `modules/openai-audio.js` | `lib/openai-audio.js` | **Copy as-is** | Used for voice features |
| `playground.js` | `public/playground.js` | **Copy as-is** | Loaded as script tag |
| `token-tracker.js` | `components/TokenTracker.tsx` | Convert | React component |
| `styles/chat-editor-styles.css` | `app/chat-editor.css` | **Copy as-is** | Imported in layout |

### Files You Can Copy Without Changes (80% of code!)

These files work perfectly in Next.js without any modifications:

✅ `modules/openai-client.js` - All 7 tools work as-is
✅ `modules/chat-ui.js` - DOM manipulation works in React
✅ `modules/json-editor.js` - JSONEditor library compatible
✅ `modules/json-diff.js` - Pure JavaScript, no changes
✅ `modules/html-converter.js` - Works with Next.js Image
✅ `modules/openai-audio.js` - Browser APIs work fine
✅ `playground.js` - Script loaded in public/
✅ `styles/chat-editor-styles.css` - CSS is CSS!

### Files That Need Conversion (20% of code)

❌ `chat-editor.html` → `app/page.tsx` (template provides this)
❌ `state-manager.js` → `useStateManager.ts` (template provides this)
❌ Token tracker → React component (template provides this)

---

## 🔧 Key Conversions Explained

### 1. State Management: Class → React Hook

**Original (`modules/state-manager.js`):**
```javascript
class StateManager {
  constructor() {
    this.currentJson = {};
    this.messages = [];
  }

  saveState() {
    localStorage.setItem('state', JSON.stringify(this.currentJson));
  }
}
```

**Next.js (`hooks/useStateManager.ts`):**
```typescript
export function useStateManager() {
  const [currentJson, setCurrentJson] = useState({});
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('state');
    if (saved) setCurrentJson(JSON.parse(saved));
  }, []);

  useEffect(() => {
    // Auto-save
    localStorage.setItem('state', JSON.stringify(currentJson));
  }, [currentJson]);

  return { currentJson, setCurrentJson, messages, setMessages };
}
```

### 2. UI Components: Vanilla JS → React

**Original (`modules/chat-ui.js`):**
```javascript
class ChatUI {
  addMessage(role, content) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = content;
    this.container.appendChild(div);
  }
}
```

**Next.js (Hybrid Approach - Keep Original!):**
```tsx
// components/ChatInterface.tsx
'use client';

import { useEffect, useRef } from 'react';
import { ChatUI } from '@/lib/chat-ui'; // Original class!

export function ChatInterface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatUIRef = useRef<ChatUI | null>(null);

  useEffect(() => {
    if (containerRef.current && !chatUIRef.current) {
      // Initialize original ChatUI class
      chatUIRef.current = new ChatUI(containerRef.current);
    }
  }, []);

  return <div ref={containerRef} />;
}
```

**Why?** Original code works perfectly, just needs a React wrapper!

### 3. OpenAI Client: Singleton → Hook

**Original (`modules/openai-client.js`):**
```javascript
class OpenAIClient {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  async sendMessage(message, json, history) {
    return await this.client.chat.completions.create({...});
  }
}
```

**Next.js (`hooks/useOpenAI.ts`):**
```typescript
import { useMemo } from 'react';
import { OpenAIClient } from '@/lib/openai-client'; // Original class!

export function useOpenAI(apiKey: string) {
  const client = useMemo(() => {
    return new OpenAIClient(apiKey);
  }, [apiKey]);

  return client;
}
```

**Why?** Original class works! Just wrap in `useMemo` to prevent recreation.

---

## 🎨 Styling Strategy

### Option 1: Keep Original CSS (Fastest)

```tsx
// app/layout.tsx
import './chat-editor.css'; // Original styles!
import './globals.css';     // Tailwind for new components
```

**Pros:**
- ✅ Zero conversion work
- ✅ Everything looks identical
- ✅ All tool displays work perfectly

**Cons:**
- ❌ No Tailwind benefits for existing UI
- ❌ Harder to customize later

### Option 2: Hybrid (Recommended)

```tsx
// Use original CSS for complex components
import './chat-editor.css';

// Use Tailwind for layout and new features
<div className="flex h-screen">
  <div className="w-1/2 border-r"> {/* Tailwind */}
    <div className="chat-container"> {/* Original CSS */}
      {/* Chat UI */}
    </div>
  </div>
</div>
```

**Pros:**
- ✅ Best of both worlds
- ✅ Easy to extend
- ✅ Gradual migration path

### Option 3: Full Tailwind Conversion (Slow)

Convert all classes:
```css
/* Original */
.tool-result-display {
  margin: 12px 0;
  border-radius: 8px;
  animation: slideIn 0.3s ease-out;
}
```

```tsx
// Tailwind
<div className="my-3 rounded-lg animate-slide-in">
```

**Pros:**
- ✅ Full Tailwind benefits
- ✅ Better IDE support

**Cons:**
- ❌ Takes 4-6 hours
- ❌ Risk of breaking UI

**Recommendation:** Start with Option 2, migrate to Option 3 later if needed.

---

## 🛠️ Configuration Files

### `package.json`

See `NEXTJS_TEMPLATES/package.json` for complete dependencies:

```json
{
  "name": "elementor-json-editor",
  "version": "1.0.0",
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "openai": "^4.28.0",
    "@wordpress/playground": "^0.1.0",
    "jsoneditor": "^9.10.4",
    "html2canvas": "^1.4.1"
  }
}
```

### `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Allow importing .js files from lib/
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return config;
  },
  // Allow OpenAI API calls from browser
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "lib/**/*.js"],
  "exclude": ["node_modules"]
}
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Module not found: Can't resolve '@/lib/...'"

**Solution:**
```bash
# Make sure tsconfig.json has paths configured
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue 2: "OpenAI API key not found"

**Solution:**
```bash
# Make sure .env.local exists and has the right prefix
NEXT_PUBLIC_OPENAI_API_KEY=sk-...  # ← Must start with NEXT_PUBLIC_
```

### Issue 3: "window is not defined"

**Solution:**
```tsx
// Add 'use client' to any component using browser APIs
'use client';

import { useEffect } from 'react';
```

### Issue 4: JSONEditor not displaying

**Solution:**
```tsx
// Import CSS in component
import 'jsoneditor/dist/jsoneditor.css';

useEffect(() => {
  // Initialize only in browser
  if (typeof window !== 'undefined') {
    const editor = new JSONEditor(container.current);
  }
}, []);
```

### Issue 5: Playground not loading

**Solution:**
```html
<!-- Add script to app/layout.tsx -->
<Script src="/playground.js" strategy="beforeInteractive" />
```

### Issue 6: Styles not applying

**Solution:**
```tsx
// app/layout.tsx - Import in correct order
import './globals.css';      // Tailwind first
import './chat-editor.css';  // Custom styles second
```

---

## 📊 Feature Parity Checklist

Use this to verify all features work after migration:

### Chat Interface
- [ ] Send messages to AI
- [ ] Streaming responses (character-by-character)
- [ ] Message history persists
- [ ] Copy message buttons work
- [ ] Model selector changes model
- [ ] Reasoning tokens display
- [ ] API status messages appear

### AI Tools (All 7)
- [ ] 🔧 generate_json_patch - Shows blue patch display
- [ ] 🔍 analyze_json_structure - Shows orange analysis display
- [ ] 📚 search_elementor_docs - Shows green search results
- [ ] 🚀 open_template_in_playground - Opens playground tab
- [ ] 📸 capture_playground_screenshot - Shows screenshot
- [ ] 🎨 convert_html_to_elementor_json - Opens HTML generator
- [ ] 📋 list_available_tools - Lists all tools

### JSON Editor
- [ ] Syntax highlighting works
- [ ] Can edit JSON directly
- [ ] Validation errors show
- [ ] Undo/redo works
- [ ] Format button prettifies JSON

### HTML Generator
- [ ] Image upload works
- [ ] Desktop/tablet/mobile preview modes
- [ ] AI conversion generates HTML
- [ ] Can send to JSON converter
- [ ] Progress tracker shows 5 steps

### WordPress Playground
- [ ] Playground loads WordPress
- [ ] Can import Elementor JSON
- [ ] Template renders correctly
- [ ] Can take screenshots
- [ ] Refresh button works

### Debug Panel
- [ ] Toggles open/closed
- [ ] Console logs appear
- [ ] Session costs show
- [ ] Token breakdown displays
- [ ] Can clear logs

### Token Tracker
- [ ] Tracks all API calls
- [ ] Shows per-call costs
- [ ] Cumulative total updates
- [ ] Different models tracked separately
- [ ] Persists across sessions

---

## 🎯 Performance Optimization

### After Migration Works

Once everything is functional, optimize:

#### 1. Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const PlaygroundView = dynamic(() => import('@/components/PlaygroundView'), {
  ssr: false,
  loading: () => <div>Loading playground...</div>
});
```

#### 2. API Routes (Hide Keys)

Move OpenAI calls to server:

```typescript
// app/api/chat/route.ts
import { OpenAI } from 'openai';

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Server-side only!
  });

  // Handle request
}
```

#### 3. Caching

```tsx
// Cache expensive operations
import { cache } from 'react';

const getElementorDocs = cache(async (query: string) => {
  // Vector store search
});
```

#### 4. Image Optimization

```tsx
// Replace <img> with Next.js Image
import Image from 'next/image';

<Image src={url} width={500} height={300} alt="Preview" />
```

---

## 📚 Reference Documentation

All docs are in `REFERENCE_DOCS/`:

1. **COMPLETE_FEATURES_GUIDE.md** (13,000+ words)
   - All features explained
   - Architecture diagrams
   - Original implementation details
   - Perfect for understanding how things work

2. **TOOL_UI_DISPLAYS.md** (6,000+ words)
   - All 7 AI tools documented
   - Visual UI patterns
   - Color coding system
   - Implementation examples

3. **CLAUDE.md** (3,000+ words)
   - Quick reference guide
   - Project overview
   - Important technical notes
   - Common tasks

4. **FILE_STRUCTURE_MAP.md** (this will be created)
   - Every file explained
   - Dependencies mapped
   - Migration notes per file

---

## 🎓 Learning Path

### If You're New to Next.js

**Week 1:** Get it working
- Follow Phase 1-5 above
- Don't customize yet
- Just get it deployed

**Week 2:** Understand the code
- Read COMPLETE_FEATURES_GUIDE.md
- Trace through one AI tool call
- Understand state flow

**Week 3:** Start customizing
- Add new UI features
- Experiment with Tailwind
- Try adding a new tool

### If You're Experienced with Next.js

**Day 1:** Migrate (2 hours)
- Run through all phases
- Deploy to Vercel
- Test everything

**Day 2:** Optimize (4 hours)
- Set up API routes
- Add code splitting
- Convert to Tailwind

**Day 3:** Extend (ongoing)
- Add new features
- Improve UX
- Scale up

---

## 🔗 Important Links

### Original Project
- OpenAI API Keys: https://platform.openai.com/api-keys
- OpenAI Assistants: https://platform.openai.com/assistants
- Vector Stores: https://platform.openai.com/storage/vector_stores

### Next.js Resources
- Next.js Docs: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app
- Vercel Deploy: https://vercel.com/new

### Dependencies
- OpenAI SDK: https://github.com/openai/openai-node
- WordPress Playground: https://github.com/WordPress/wordpress-playground
- JSONEditor: https://github.com/josdejong/jsoneditor

---

## ✅ Migration Checklist

Print this out and check off as you go:

### Pre-Migration
- [ ] Read this entire guide once
- [ ] Have OpenAI API key ready
- [ ] Have Assistant ID and Vector Store ID
- [ ] Node.js 18+ installed
- [ ] Git repository ready

### Phase 1: Setup
- [ ] Created Next.js project
- [ ] Installed dependencies
- [ ] Created .env.local
- [ ] Verified environment variables load

### Phase 2: Copy Code
- [ ] Copied all modules to lib/
- [ ] Copied playground.js to public/
- [ ] Copied CSS to app/
- [ ] No missing files

### Phase 3: Components
- [ ] Copied all template files
- [ ] Updated package.json
- [ ] Ran npm install
- [ ] No TypeScript errors

### Phase 4: Wire Up
- [ ] All components imported correctly
- [ ] State management working
- [ ] No console errors
- [ ] Webpack builds successfully

### Phase 5: Test
- [ ] Dev server runs (npm run dev)
- [ ] Chat interface loads
- [ ] Can send messages
- [ ] Tools execute correctly
- [ ] Playground works
- [ ] Production build succeeds (npm run build)

### Post-Migration
- [ ] Deployed to Vercel
- [ ] Tested on production URL
- [ ] All features work in production
- [ ] Environment variables set in Vercel

---

## 🆘 Getting Help

### If Something Breaks

1. **Check the original code** - It's in `SOURCE_CODE/`
2. **Compare with templates** - Files in `NEXTJS_TEMPLATES/`
3. **Read the docs** - All in `REFERENCE_DOCS/`
4. **Check console** - Most errors show in browser console

### Debug Workflow

```bash
# 1. Check file exists
ls -la lib/openai-client.js

# 2. Check imports work
npm run build

# 3. Check environment variables
echo $NEXT_PUBLIC_OPENAI_API_KEY

# 4. Check for TypeScript errors
npx tsc --noEmit

# 5. Clear cache and restart
rm -rf .next
npm run dev
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Test production build
npm run start            # Run production locally

# Debugging
npm run lint             # Check for lint errors
npx tsc --noEmit         # Check TypeScript
rm -rf .next             # Clear Next.js cache
rm -rf node_modules      # Nuclear option
npm install              # Reinstall everything
```

---

## 🎉 Success Criteria

You've successfully migrated when:

✅ All 7 AI tools work with enhanced UI displays
✅ Chat streams responses character-by-character
✅ JSON editor syntax highlights
✅ HTML generator converts images to HTML
✅ WordPress Playground loads and imports JSON
✅ Token tracker shows accurate costs
✅ Debug panel logs console output
✅ Everything works on Vercel production

**Congratulations!** You now have a production-ready Next.js app with all features working! 🚀

---

## 📝 Notes

- Keep `SOURCE_CODE/` folder for reference
- Don't delete original project until Next.js version is fully tested
- You can run both side-by-side during migration
- Original HTML version will always work as backup

---

**Questions?** Re-read the relevant section in `REFERENCE_DOCS/`

**Ready to start?** Jump to [Phase 1: Setup](#phase-1-setup-20-minutes)

**Good luck!** 🍀
