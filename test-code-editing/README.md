# Code Editing System Tests

This directory contains test scripts and sample files for testing the code editing system.

## Test Files

### Sample Files
- `sample-html.html` - Sample HTML with pricing cards (2 cards)
- `sample-css.css` - Sample CSS styles for the pricing cards

### Test Scripts
- `test-chat-elementor.js` - Tests the full chat flow with tool calling
- `test-edit-code-stream.js` - Tests the diff generation API directly

## Running Tests

### Prerequisites
1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Server should be running on `http://localhost:3000`

### Test 1: Chat Elementor Flow (Full Integration)

Tests the complete flow with AI tool calling:
```bash
cd test-code-editing
node test-chat-elementor.js
```

**What it tests:**
- AI receives: "Remove the last card from the HTML"
- AI calls: `getEditorContent` tool
- AI calls: `editCodeWithDiff` tool
- System returns tool results

**Expected output:**
```
🧪 Testing /api/chat-elementor endpoint...

📨 Request payload:
- Model: anthropic/claude-haiku-4-5-20251001
- Message: Remove the last card (Premium card) from the HTML
- Current section: { name: 'Pricing Cards', htmlLength: 1234, cssLength: 567 }

📥 Response status: 200

✅ Response received (streaming):

I'll first check the current HTML content...

🔧 Tool call: getEditorContent
   Args: { files: ['html'] }

✅ Tool result: getEditorContent
   Result: { files: ['html'], content: {...}, status: 'content_retrieved' }

Let me remove the last card...

🔧 Tool call: editCodeWithDiff
   Args: { file: 'html', instruction: 'Remove the Premium card...' }

✅ Tool result: editCodeWithDiff
   Result: { file: 'html', instruction: '...', status: 'pending_diff_generation' }

✅ Test completed successfully!
```

### Test 2: Edit Code Stream (Direct API)

Tests the diff generation directly:
```bash
cd test-code-editing
node test-edit-code-stream.js
```

**What it tests:**
- Direct call to `/api/edit-code-stream`
- Sends current HTML + instruction
- Receives unified diff patch

**Expected output:**
```
🧪 Testing /api/edit-code-stream endpoint...

📨 Request payload:
- Instruction: Remove the Premium card...
- File type: html
- Current code length: 1234

📥 Response status: 200

✅ Streaming unified diff:

────────────────────────────────────────────────────────────
@@ -20,15 +20,6 @@
       </div>
     </div>
   </div>
-  <div class="w-card color-green">
-    <div class="card-header">
-      <div class="w-title">Premium</div>
-    </div>
-    <div class="w-price">$19.99</div>
-    ...
-  </div>
 </div>
────────────────────────────────────────────────────────────

📊 Diff Statistics:
- Total characters: 345
- Lines added: 0
- Lines removed: 12
- Hunks: 1

💾 Diff saved to: /test-code-editing/output-diff.patch

✅ Test completed successfully!
```

## Debugging

### Check API Logs
Watch the terminal where `npm run dev` is running to see:
- Tool calls being registered
- System prompts being sent
- AI model responses
- Diff generation process

### Common Issues

**Issue: Connection refused**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Fix:** Make sure dev server is running with `npm run dev`

**Issue: Tools not being called**
```
AI responds with text instead of calling tools
```
**Fix:** Check the system prompt in `/src/app/api/chat-elementor/route.ts` includes tool descriptions

**Issue: Empty diff returned**
```
Diff is empty or shows entire file
```
**Fix:** Check the AI model is following the unified diff format instructions

## Expected Flow

```
User Message
    ↓
Chat API (/api/chat-elementor)
    ↓
AI analyzes request
    ↓
[Tool Call: getEditorContent]
    ← Returns current HTML/CSS/JS
    ↓
[Tool Call: editCodeWithDiff]
    ← Returns { file, instruction, status: 'pending' }
    ↓
Frontend Widget (EditCodeWidget)
    ↓
Calls /api/edit-code-stream
    ↓
Streams unified diff
    ↓
Monaco DiffEditor displays
    ↓
User accepts/rejects
    ↓
Code updated in editor
```

## Next Steps

After tests pass:
1. Test in actual UI (Elementor Editor page)
2. Test with different file types (CSS, JS, PHP)
3. Test with empty files (generation mode)
4. Test with very large files (performance)
5. Test Accept/Reject button functionality
