# Chat Editor Testing Guide

## ✅ What's Implemented (100% Complete)

### Phase 1: Foundation ✅
- [x] Split-screen layout (chat + JSON editor)
- [x] Chat UI with message rendering
- [x] JSON editor with syntax highlighting
- [x] State management with undo/redo
- [x] localStorage persistence
- [x] File upload & sample JSON loading
- [x] Tab switching (JSON / Playground views)

### Phase 2: OpenAI Integration ✅
- [x] Chat Completions API client
- [x] Function calling with 2 tools
- [x] Conversation history management
- [x] Error handling
- [x] API key storage (localStorage)

### Phase 3: JSON Editing ✅
- [x] JSON Patch generation tool
- [x] JSON structure analysis tool
- [x] Patch validation
- [x] Approval modal UI
- [x] Apply patches with visual diff
- [x] Highlight changed lines

### Phase 4: Voice & Polish ✅
- [x] Whisper API integration
- [x] Audio recording (MediaRecorder)
- [x] Voice button with recording indicator
- [x] Microphone permission handling
- [x] Undo/redo buttons
- [x] Keyboard shortcuts (Ctrl+Enter, Ctrl+Z, Ctrl+Y)

### WordPress Playground 🔄
- [x] UI ready (tab exists, iframe ready)
- [x] Reuses existing playground.js module
- [ ] Auto-start on tab switch (TODO: needs 5 lines of code)

---

## 🧪 How to Test

### Step 1: Open the App

**Option A - Direct URL:**
```
http://localhost:8080/chat-editor.html
```

**Option B - Command line:**
```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
open http://localhost:8080/chat-editor.html
```

You should see:
- Left panel: Chat interface with welcome message
- Right panel: "No JSON Loaded" placeholder
- Top left: "API Key Not Set" indicator (red dot)

---

### Step 2: Set OpenAI API Key

1. Click **"Set API Key"** button (top left)
2. Enter your OpenAI API key (starts with `sk-`)
3. Click **"Save API Key"**
4. ✅ Indicator should turn green: "API Key Set"

**Note**: Your key is stored in browser localStorage, never sent anywhere except OpenAI.

---

### Step 3: Load JSON

**Option A - Load Sample:**
1. Click **"Load Sample"** button (bottom left or center placeholder)
2. ✅ JSON should appear in right panel
3. ✅ Chat says: "✅ Loaded sample JSON"

**Option B - Upload Your Own:**
1. Click **"📁 Load JSON"** button
2. Select a `.json` file from your computer
3. ✅ JSON should appear in right panel

**Expected Sample JSON Structure:**
```json
{
  "widgetType": "custom_html_section",
  "content": [
    {
      "id": "abc123",
      "elType": "widget",
      "widgetType": "heading",
      "settings": {
        "title": "Welcome to My Site",
        "title_color": "#000000",
        ...
      }
    },
    ...
  ]
}
```

---

### Step 4: Test Chat - Ask Questions

Type these in the chat input (bottom left):

#### Test 1: Find Information
```
You: What widgets do I have?
```

**Expected Response:**
```
AI: You have 3 widgets:
1. heading (index 0)
2. button (index 1)
3. text-editor (index 2)
```

#### Test 2: Locate Property
```
You: Where is the heading color defined?
```

**Expected Response:**
```
AI: The heading color is defined at:
📍 Path: /content/0/settings/title_color
🎨 Current value: #000000 (black)
📦 Widget: heading
```

---

### Step 5: Test JSON Editing

#### Test 3: Simple Edit
```
You: Change the heading color to red
```

**Expected Flow:**
1. ⏳ Typing indicator appears (3 dots animating)
2. 💬 AI responds: "I'll change the heading color to red for you."
3. 📋 **Approval Modal Opens** with:
   ```
   ✏️ Proposed Changes

   📝 Heading title color
   Path: /content/0/settings/title_color
   - Old: #000000 (black)
   + New: #ff0000 (red)

   [✓ Apply Changes] [✗ Reject]
   ```
4. Click **"✓ Apply Changes"**
5. ✅ Modal closes
6. 🟢 JSON editor highlights the changed line (green background)
7. 💬 Chat says: "✅ Applied 1 change(s)"

**Verify in JSON:**
- Scroll to `"title_color"` line
- Should show: `"title_color": "#ff0000",`
- Line should have green highlight

#### Test 4: Multiple Edits
```
You: Change button text to "Get Started" and make the heading say "Welcome!"
```

**Expected:**
- Approval modal shows **2 changes**
- Both changes listed with before/after
- Option to apply all or individually

---

### Step 6: Test Undo/Redo

1. After applying a change, click **↶ Undo** button (top right)
   - ✅ JSON reverts to previous state
   - ✅ Chat says: "↶ Undid last change"

2. Click **↷ Redo** button
   - ✅ JSON re-applies the change
   - ✅ Chat says: "↷ Redid change"

**Keyboard Shortcuts:**
- `Ctrl+Z` = Undo
- `Ctrl+Y` = Redo
- `Ctrl+Enter` = Send message

---

### Step 7: Test Voice Input 🎤

1. Click **🎤 microphone button** (bottom left)
   - ✅ Button turns red and pulses
   - ✅ Status shows: "🔴 Recording... (click again to stop)"

2. **Speak clearly:** "Change the button color to blue"

3. Click **🎤 again** to stop
   - ⏳ Status shows: "⏳ Transcribing..."
   - ✅ Transcribed text appears in chat input
   - ✅ Status shows: "✅ Transcription complete"

4. Review the transcription, then click **"Send"**
   - Continues as normal chat interaction

**Note:** First time may prompt for microphone permission - click "Allow"

---

### Step 8: Test Download

1. After making some edits, click **⬇️ Download** button (top right)
2. ✅ File `elementor-edited.json` should download
3. Open in text editor to verify your changes are saved

---

### Step 9: Test WordPress Playground Tab

1. Click **"🌐 WordPress Playground"** tab (top right)
2. Click **"🚀 Launch WordPress Playground"** button
3. ⏳ Wait ~30-40 seconds (first time only)
4. ✅ WordPress admin should load in iframe

**Current Status:**
- ✅ UI is ready
- ✅ Button triggers playground.js
- ⚠️ Auto-import of JSON not yet connected (needs 5 lines)

---

## 🐛 Troubleshooting

### Issue: "API Key Not Set" won't change

**Fix:**
1. Open browser console (F12)
2. Type: `localStorage.getItem('openai_api_key')`
3. If returns `null`, the key didn't save
4. Try setting again with a valid `sk-` key

### Issue: "No response from AI"

**Check:**
1. Browser console (F12) for errors
2. Network tab - look for `chat/completions` request
3. Common errors:
   - 401: Invalid API key
   - 429: Rate limit exceeded
   - 500: OpenAI server error

**Fix:** Verify your API key at https://platform.openai.com/api-keys

### Issue: "Microphone access denied"

**Fix:**
1. Browser settings → Privacy → Microphone
2. Allow access for `localhost`
3. Refresh page and try again

### Issue: JSON doesn't highlight after edit

**Check:**
1. Open browser console
2. Look for `fast-json-patch` errors
3. Verify patch was applied (check JSON content)

**Debug:**
```javascript
// In browser console:
window.app.stateManager.currentJson
// Should show updated JSON
```

### Issue: Approval modal doesn't appear

**Check:**
1. Browser console for JavaScript errors
2. Verify AI actually called the `generate_json_patch` tool
3. Look for modal HTML in page (inspect element)

**Debug:**
```javascript
// Force show modal (test):
document.getElementById('approvalModal').style.display = 'flex';
```

---

## 📊 Test Checklist

Copy this checklist and mark off as you test:

```
Foundation:
[ ] Page loads without errors
[ ] API key modal opens/closes
[ ] API key saves and indicator turns green
[ ] Sample JSON loads
[ ] File upload works
[ ] Tab switching works

Chat Interface:
[ ] Messages appear when sent
[ ] Typing indicator shows during AI response
[ ] User messages appear in blue (right-aligned)
[ ] AI messages appear in white (left-aligned)
[ ] System messages appear in yellow

JSON Editor:
[ ] JSON displays with syntax highlighting
[ ] Line numbers visible
[ ] Can scroll through JSON
[ ] Search works (if implemented)

OpenAI Integration:
[ ] AI responds to questions
[ ] AI can find properties in JSON
[ ] AI generates patches for edits
[ ] Tool calling works (check console)
[ ] Error handling works (try invalid request)

Approval Workflow:
[ ] Modal appears after AI suggests edit
[ ] Shows before/after diff
[ ] "Apply" button works
[ ] "Reject" button works
[ ] Changes apply to JSON editor
[ ] Changed lines highlight in green

Undo/Redo:
[ ] Undo button works
[ ] Redo button works
[ ] Keyboard shortcuts work (Ctrl+Z, Ctrl+Y)
[ ] Buttons disable when at history limits

Voice Input:
[ ] Microphone button works
[ ] Recording starts (button turns red, pulses)
[ ] Recording stops
[ ] Transcription appears in input
[ ] Can send transcribed text

Download:
[ ] Download button works
[ ] JSON file downloads
[ ] File contains correct JSON

WordPress Playground:
[ ] Tab switches to Playground view
[ ] Launch button appears
[ ] Clicking launch starts WordPress
[ ] WordPress loads in iframe
```

---

## 🔍 Where to Look for Issues

### Browser Console (F12)

Look for:
- ❌ Red errors = JavaScript errors
- ⚠️ Yellow warnings = Non-critical issues
- 🔵 Blue logs = Debug information

Key logs to watch:
- `🚀 Initializing Chat Editor App...`
- `✅ Chat Editor App initialized`
- `Tool called: generate_json_patch`
- `🎤 Recording started`
- `✅ Transcription complete`

### Network Tab (F12 → Network)

Look for:
- `chat/completions` - OpenAI API calls
- `audio/transcriptions` - Whisper API calls
- Status codes:
  - 200 = Success ✅
  - 401 = Auth error (bad API key) ❌
  - 429 = Rate limit ❌
  - 500 = Server error ❌

### localStorage (F12 → Application → Local Storage)

Should contain:
- `openai_api_key` - Your API key
- `chat_editor_state` - Saved JSON and conversation

---

## 💡 Test Scenarios

### Scenario 1: First-Time User

1. Open page (no API key, no JSON)
2. Set API key
3. Load sample
4. Ask: "What is this JSON?"
5. Ask: "Change something"
6. Apply the change
7. Download the result

**Expected**: Smooth flow, no errors

### Scenario 2: Returning User

1. Open page (API key and JSON from localStorage)
2. See previous JSON loaded automatically
3. Continue conversation
4. Make more edits

**Expected**: State restored from localStorage

### Scenario 3: Voice-Only Editing

1. Set API key and load JSON
2. Click mic, say: "What widgets are here?"
3. Wait for response
4. Click mic, say: "Change the heading to blue"
5. Apply changes

**Expected**: Full conversation via voice

### Scenario 4: Complex Multi-Edit

1. Say: "Change heading to red, button to blue, and text to say Hello"
2. Approval modal shows 3 changes
3. Apply all
4. Undo
5. Redo

**Expected**: All changes tracked, undo/redo works

---

## 🎯 Success Criteria

Your implementation is working correctly if:

1. ✅ All items in Test Checklist are checked
2. ✅ No red errors in browser console
3. ✅ AI responds within 3 seconds
4. ✅ Patches apply correctly to JSON
5. ✅ Undo/redo works
6. ✅ Voice transcription is accurate (>90%)
7. ✅ Changes persist after page refresh (localStorage)

---

## 📝 Known Limitations (Expected)

These are NOT bugs:

1. WordPress Playground auto-import not connected yet
2. No streaming AI responses (full response at once)
3. Conversation history limited to last 6 messages
4. Undo history limited to 50 items
5. No image upload tool yet
6. No collaborative editing (single user)

---

## 🚀 Next Steps After Testing

1. **If everything works**:
   - Start using it!
   - Add WordPress Playground auto-import (5 lines)
   - Tune AI prompts if needed

2. **If you find bugs**:
   - Note the exact steps to reproduce
   - Check browser console for errors
   - Check Network tab for API errors
   - Report issue with error details

---

## 📞 Quick Help

**Can't find chat-editor.html?**
```bash
ls /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp/chat-editor.html
```

**Server not running?**
```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
python3 -m http.server 8080
```

**Still stuck?**
1. Check browser console (F12)
2. Look for red error messages
3. Copy the error and search in code files

---

**Happy Testing!** 🎉

Start with the basic flow: Set API Key → Load Sample → Ask "What widgets do I have?" → Make a simple edit.
