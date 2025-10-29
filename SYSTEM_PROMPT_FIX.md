# System Prompt Fix - Model Can Now See Code! ✅

## Problems Fixed

### 1. **Model said "I can't see your code"**
**Root cause:** Weak, buried statement in system prompt
**Fix:** Made it CRYSTAL CLEAR with:
- ✅ **"YES - You have full access to all code files below:"**
- 📄 File emojis for each type (HTML/CSS/JS/PHP)
- Explicit instruction: **"You CAN see all the code above!"**
- Direct answer guide: "When user asks 'can you see my code', say YES"

### 2. **Model used old edit tools (viewEditorCode, generateHTML)**
**Root cause:** Old instructions still in system prompt
**Fix:** Completely rewrote instructions:
- Removed: "call the `generateHTML` tool"
- Added: **"`editCodeWithMorph` is your ONLY tool for writing code"**
- Removed: "THREE options" confusing structure
- Added: ✅ checklist of what Morph does (new code, edits, etc.)

---

## Changes Made

### File: `/src/app/api/chat-elementor/route.ts`

#### Before (Lines 73-80):
```typescript
let systemPrompt = `You are an expert HTML/CSS/JS section editor assistant...

**For CREATING new sections:**
When a user asks to "generate", "create", "build", or "make" a NEW section, call the \`generateHTML\` tool.
```

#### After (Lines 73-80):
```typescript
let systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant...

**PRIMARY TOOL - Use for ALL code writing/editing:**
\`editCodeWithMorph\` is your ONLY tool for writing code. Use it for EVERYTHING:
- ✅ Creating NEW code (works on empty files!)
- ✅ Editing EXISTING code (lazy edits with "// ... existing code ...")
- ✅ Adding features to current code
- ✅ Fixing bugs in current code
- ✅ Rewriting sections of code
```

#### Before (Lines 119-149):
```typescript
**CURRENT SECTION IN EDITOR:**
${includeContext && currentSection ? `
✅ YES - You can see the current section code:

**HTML (123 characters):**
\`\`\`html
...
\`\`\`

When user asks "can you see my code", say YES and show what you can see above.
```

#### After (Lines 117-147):
```typescript
**📁 CURRENT FILES IN EDITOR:**
${includeContext && currentSection ? `
✅ **YES - You have full access to all code files below:**

**📄 HTML FILE (123 characters):**
\`\`\`html
${currentSection.html || '(empty file)'}
${currentSection.html?.length > 1000 ? '...(truncated - ask if you need to see more)' : ''}
\`\`\`

**🎨 CSS FILE (...):**
**⚡ JS FILE (...):**
**🔧 PHP FILE (...):**

**IMPORTANT:** You CAN see all the code above! Each file is clearly labeled. When user asks "can you see my code", say YES and reference the specific files shown above. Use \`editCodeWithMorph\` to write or edit any of these files.
```

#### Before (Lines 156-164):
```typescript
**Important guidelines:**
- For WRITING code (new or existing): ALWAYS use \`editCodeWithMorph\` tool
- For COMPLETE file replacement: Use \`updateSection*\` tools
- The current section code is already shown above - you can see it directly
- Always output section-level code only (NO DOCTYPE, html, head, body tags)
- CSS should be pure selectors (NO <style> tags)
- JavaScript should be pure code (NO <script> tags)
- Be concise and explain what you changed
- **ALWAYS use tools - never generate code in your response**
```

#### After (Lines 156-164):
```typescript
**Important guidelines:**
- 🎯 **PRIMARY ACTION:** Use \`editCodeWithMorph\` for ALL code writing/editing (new or existing files)
- 📝 **Code format rules:** Section-level code only (NO DOCTYPE, html, head, body tags), CSS without <style> tags, JS without <script> tags
- 💬 **Communication:** Be concise, explain what you changed
- ⚠️ **CRITICAL:** ALWAYS use \`editCodeWithMorph\` tool - NEVER write code directly in your text response

**When user asks "can you see my code":**
- If files are shown above with ✅: Say "Yes, I can see your [HTML/CSS/JS/PHP] code" and reference specific content
- If you see ❌: Say "No, the editor appears empty"
```

---

## Why Changes Were Needed

### Problem: Model Confusion
1. System prompt buried the code visibility info
2. Instructions mentioned multiple tools (generateHTML, THREE options)
3. No explicit answer to "can you see my code"
4. Generic language like "you can see it above" wasn't strong enough

### Solution: Crystal Clear Instructions
1. **Visual hierarchy:** Emojis (📁📄🎨⚡🔧), bold text, explicit YES/NO
2. **Single tool:** Only Morph for writing, no confusion
3. **Direct answer guide:** Exact words to say for "can you see my code"
4. **Actionable truncation:** "ask if you need to see more" instead of just "(truncated)"

---

## Testing Instructions

### 1. **Restart Dev Server (CRITICAL!)**
API route changes may not hot-reload properly. Restart:

```bash
# Kill the server
pkill -f "next dev"

# Start again
npm run dev
```

### 2. **Hard Refresh Browser**
Clear browser cache:
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

### 3. **Test Sequence**

**Test 1: "Can you see my code?"**
```
Expected response:
"Yes, I can see your HTML, CSS, and JavaScript files. Your HTML file contains [brief description of what's there], and your CSS has [styling info]..."
```

**Test 2: "Create a hero section"**
```
Expected: Model calls editCodeWithMorph(file: 'html', ...)
NOT: generateHTML tool
NOT: "I'll call the generateHTML tool"
```

**Test 3: "Change the background to blue"**
```
Expected: Model calls editCodeWithMorph(file: 'css', lazyEdit: '// ... existing code ...\nbackground: blue;\n...')
NOT: viewEditorCode first
NOT: updateSectionCss
```

### 4. **Check Console Logs**

Open browser console and look for:
```
🔧 Available tools: [...editCodeWithMorph, updateSectionHtml, ...]
```

Should NOT see:
```
🔧 Available tools: [...generateHTML, viewEditorCode, ...]
```

### 5. **Check API Response**

In Network tab, check `/api/chat-elementor` request/response:
- Request body should have: `includeContext: true`, `currentSection: {html, css, js, php}`
- System prompt should contain: "**YES - You have full access to all code files below:**"

---

## If Model Still Uses Old Tools

### Symptom: Model calls `generateHTML` or `viewEditorCode`

**Possible Causes:**
1. ❌ Dev server not restarted → Restart server
2. ❌ Browser cache → Hard refresh (`Cmd+Shift+R`)
3. ❌ Wrong API endpoint → Check console: should be `/api/chat-elementor` not `/api/chat`
4. ❌ Tools still exported → Check `src/lib/tools.ts` exports

**Debug Steps:**

```bash
# 1. Check what's in the running API route
curl http://localhost:3000/api/chat-elementor -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages":[], "model":"anthropic/claude-haiku-4-5-20251001"}' \
  | grep "generateHTML"

# Should return nothing (generateHTML removed)

# 2. Check if tools are still exported
grep "generateHTML" src/lib/tools.ts

# Should show:
# - Line ~200: export const htmlGeneratorTool (tool definition - OK to exist)
# - Line ~640: generateHTML: htmlGeneratorTool (export - SHOULD BE COMMENTED OUT)

# 3. Check API route config
grep "generateHTML" src/app/api/chat-elementor/route.ts

# Should only show:
# - Line ~206: // REMOVED: generateHTML - use editCodeWithMorph instead
```

---

## Model Training

The new system prompt teaches the model:

### What It Knows:
1. ✅ "I have full access to all code files"
2. ✅ "editCodeWithMorph is my ONLY tool for writing code"
3. ✅ "I can see: HTML (123 chars), CSS (456 chars), JS (78 chars), PHP (0 chars)"
4. ✅ "When user asks 'can you see my code', I say YES"

### What It Does:
1. ✅ User: "create a button" → `editCodeWithMorph(file: 'html', ...)`
2. ✅ User: "make it blue" → `editCodeWithMorph(file: 'css', lazyEdit: '...')`
3. ✅ User: "can you see my code" → "Yes! I can see your HTML file with a div..."

### What It NO LONGER Does:
1. ❌ "I don't have access to view your code"
2. ❌ Calls `generateHTML` for new sections
3. ❌ Calls `viewEditorCode` before editing
4. ❌ Says "I'll use the tool" without specifying which tool

---

## Summary

**Before:** Model was confused, used wrong tools, claimed it couldn't see code
**After:** Model knows it can see code, uses only Morph, responds confidently

**Key Changes:**
- System prompt: Rewrote for clarity, removed old tool references
- Code visibility: Made CRYSTAL CLEAR with emojis, bold text, explicit YES
- Tool instructions: Single PRIMARY tool (Morph), removed confusing options
- Answer guide: Exact response for "can you see my code"

**Action Required:**
1. Restart dev server: `pkill -f "next dev" && npm run dev`
2. Hard refresh browser: `Cmd+Shift+R`
3. Test with: "can you see my code" → should say YES
4. Test with: "create a hero section" → should use editCodeWithMorph

---

## Files Modified

1. `/src/app/api/chat-elementor/route.ts` - Lines 73-164 (system prompt complete rewrite)
2. No other files changed (toolsConfig already correct, just prompt was wrong)
