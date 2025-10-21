# Unified Chat Editor Implementation Plan

## Overview
Transform chat-editor.html into the main hub with integrated workflow:
**Image → HTML → JSON → Editor → Playground**

---

## New Tab Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Elementor JSON Editor                    [⚙️] [💰 $0.0523]   │
├─────────────────────────────────────────────────────────────────┤
│ LEFT: Chat                RIGHT: Tabs                            │
│ ┌──────────────┐         ┌──────────────────────────────────┐  │
│ │ [Messages]   │         │ [💬][🎨][⚡][📄][🌐]            │  │
│ │              │         │  Chat  HTML  JSON  Editor  Play   │  │
│ │              │         ├──────────────────────────────────┤  │
│ │              │         │                                  │  │
│ │ [Input]      │         │ [Active Tab Content]             │  │
│ └──────────────┘         └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tab Descriptions:

1. **💬 Chat** (Existing)
   - Main conversation interface
   - Edit JSON with AI
   - Voice input, image analysis
   - Shows in right panel: JSON Editor

2. **🎨 HTML Generator** (NEW)
   - Upload multiple images (desktop/tablet/mobile mockups)
   - Custom prompt input
   - Generate HTML/CSS/JS from images
   - Preview with responsive viewports
   - Refinement chat (mini-chat for HTML edits)
   - Model selector
   - → Button: "Send to JSON Converter"

3. **⚡ JSON Converter** (NEW)
   - Takes HTML/CSS/JS input
   - Shows code editors
   - Vision mode: multi-viewport screenshots
   - AI description generator
   - Conversion settings (Fast/Accurate, Model)
   - Global stylesheet support
   - → Button: "Send to JSON Editor" (auto-sends)

4. **📄 JSON Editor** (Existing)
   - Edit JSON manually
   - Undo/Redo
   - Download
   - → Button: "Test in Playground"

5. **🌐 WordPress Playground** (Existing)
   - Live WordPress with Elementor
   - Import JSON
   - Screenshot capability

---

## Component Breakdown

### 1. HTML Generator Tab (🎨)

```
┌────────────────────────────────────────────────────────────┐
│ 🎨 HTML Generator                      Model: [GPT-5 ▼]    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Upload Design Mockups (Multiple Images)                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│ │ 🖥️       │ │ 📱       │ │ ⚡       │                   │
│ │ Desktop  │ │ Tablet   │ │ Mobile   │                   │
│ │ [Upload] │ │ [Upload] │ │ [Upload] │                   │
│ └──────────┘ └──────────┘ └──────────┘                   │
│                                                             │
│ Custom Prompt (Optional)                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ "Make it responsive, use Tailwind classes..."       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│             [✨ Generate HTML/CSS/JS]                       │
│                                                             │
│ Generated Code:                                            │
│ ┌──────────┬──────────┬──────────┐                       │
│ │ HTML     │ CSS      │ JS       │                       │
│ │ [Editor] │ [Editor] │ [Editor] │                       │
│ └──────────┴──────────┴──────────┘                       │
│                                                             │
│ Preview (Responsive):                                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [🖥️ Desktop] [📱 Tablet] [📱 Mobile]               │   │
│ │                                                      │   │
│ │ [Live render of generated HTML]                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Refinement Chat:                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 💬 "Change button colors to blue"        [Send]     │   │
│ │                                                      │   │
│ │ 🤖 Updated! 3 buttons changed to #0066FF           │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [⚡ Send to JSON Converter →]                             │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Multiple image upload (desktop/tablet/mobile mockups)
- Custom prompt textarea
- Generated code in 3 tabs (HTML/CSS/JS)
- Responsive preview with viewport switcher
- Mini refinement chat below preview
- Access to original images in refinement
- Model selector at top
- Send to JSON Converter button

---

### 2. JSON Converter Tab (⚡)

```
┌────────────────────────────────────────────────────────────┐
│ ⚡ JSON Converter                        Model: [GPT-5 ▼]  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Source Code (from HTML Generator or manual input):         │
│ ┌──────────┬──────────┬──────────┐                       │
│ │ HTML     │ CSS      │ JS       │                       │
│ │ [Editor] │ [Editor] │ [Editor] │                       │
│ └──────────┴──────────┴──────────┘                       │
│                                                             │
│ Vision Mode:                                               │
│ ☑️ Enable AI Visual Analysis                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Screenshots (Auto-captured from preview):           │   │
│ │ [🖥️ Desktop] [📱 Tablet] [📱 Mobile]               │   │
│ │                                                      │   │
│ │ [🔍 Generate AI Description]                        │   │
│ │                                                      │   │
│ │ Description: [AI-generated detailed description]    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Conversion Settings:                                       │
│ Mode: [⚡ Fast] [🎯 Accurate]                             │
│ ☑️ Use Global Stylesheet                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ /* Global styles... */                               │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Custom Conversion Prompt (Optional):                       │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ "Focus on button widgets..."                        │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│          [🚀 CONVERT TO ELEMENTOR JSON]                    │
│                                                             │
│ ✅ Conversion Complete! Auto-sending to JSON Editor...     │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Code editors (pre-filled from HTML Generator or manual)
- Multi-viewport screenshot capture
- AI description generator with custom prompt
- Conversion mode selector (Fast/Accurate)
- Model selector
- Global stylesheet toggle
- Custom conversion prompt
- Auto-sends to JSON Editor after completion

---

### 3. Token Tracker (Top Right Corner)

```
┌─────────────────────┐
│ 💰 Session Cost     │
│    $0.0523          │
│                     │
│ Total: 15 calls     │
│ HTML Gen: 3 calls   │
│ JSON Conv: 2 calls  │
│ Chat: 10 calls      │
│                     │
│ [Reset] [Details]   │
└─────────────────────┘
```

**Tracks:**
- All API calls across all tabs
- Per-tab breakdown
- Real-time cost updates
- Model-specific pricing
- Session persistence

---

## Data Flow

```
Step 1: HTML Generator
┌────────────────┐
│ Upload Images  │
│ (Desktop/      │
│  Tablet/Mobile)│
└────────┬───────┘
         │
         ▼
    [AI Analysis]
         │
         ▼
   ┌──────────┐
   │ HTML/CSS │
   │ /JS Gen  │
   └────┬─────┘
        │
        ▼
   [Refinement Chat]
        │
        ▼
   [Send to JSON Converter] ──────────────┐
                                           │
Step 2: JSON Converter                    │
                                           │
   ┌───────────────────────────────────<──┘
   │
   ▼
┌─────────────────┐
│ HTML/CSS/JS     │
│ (Pre-filled)    │
└────────┬────────┘
         │
         ▼
  [Capture Multi-
   Viewport
   Screenshots]
         │
         ▼
  [Generate AI
   Description]
         │
         ▼
  [Configure
   Conversion]
         │
         ▼
  [Convert to JSON]
         │
         ▼
  [Auto-send to JSON Editor] ────────────┐
                                          │
Step 3: JSON Editor                      │
                                          │
   ┌──────────────────────────────────<──┘
   │
   ▼
┌─────────────────┐
│ JSON Editor     │
│ (Auto-loaded)   │
└────────┬────────┘
         │
         ▼
  [Edit with Chat
   or Manually]
         │
         ▼
  [Test in
   Playground]
         │
         ▼
  [Download or
   Export]
```

---

## Implementation Steps

### Phase 1: Add Token Tracker
1. Add token-tracker.js to chat-editor.html
2. Add cost widget UI to header
3. Wire up to existing OpenAI client
4. Test with chat

### Phase 2: Add HTML Generator Tab
1. Create tab UI structure
2. Add multi-image upload
3. Add custom prompt input
4. Integrate image-to-html-generator.js
5. Add code editors (HTML/CSS/JS)
6. Add responsive preview component
7. Add refinement chat below
8. Add "Send to JSON Converter" button

### Phase 3: Add JSON Converter Tab
1. Create tab UI structure
2. Add code editors (receive from HTML Gen)
3. Add multi-viewport screenshot capture
4. Add AI description generator
5. Add conversion settings UI
6. Add custom prompt input
7. Integrate conversion logic
8. Auto-send to JSON Editor

### Phase 4: Integration & Polish
1. Wire up data flow between tabs
2. Add model selectors to both tabs
3. Test complete workflow
4. Add loading states
5. Add error handling
6. Polish UI/UX

---

## File Structure

```
chat-editor.html (main hub)
├── modules/
│   ├── openai-client.js (existing)
│   ├── chat-ui.js (existing)
│   ├── state-manager.js (existing)
│   ├── json-editor.js (existing)
│   ├── html-generator.js (NEW)
│   ├── json-converter.js (NEW)
│   └── token-tracker.js (NEW)
├── styles/
│   ├── chat-editor-styles.css (existing)
│   └── tabs-styles.css (NEW)
└── token-tracker.js (standalone)
```

---

## UI Mockup: Complete Chat Editor

```
┌───────────────────────────────────────────────────────────────────┐
│ 🤖 Elementor JSON Editor    [💬][🎨][⚡][📄][🌐]     [💰 $0.0523] │
│ [⚙️ Settings] [🔑 API Key]                     Chat  HTML  JSON   │
├──────────────────────┬────────────────────────────────────────────┤
│ 💬 Chat Messages     │ 🎨 HTML Generator (Active Tab)             │
│                      │                                            │
│ 🤖 Hello! Load JSON  │ ┌──────────┬──────────┬──────────┐       │
│    or ask me...      │ │🖥️Desktop │📱Tablet  │📱Mobile  │       │
│                      │ │[Upload]  │[Upload]  │[Upload]  │       │
│ 👤 Change colors...  │ └──────────┴──────────┴──────────┘       │
│                      │                                            │
│ 🤖 Updated! Applied  │ Custom Prompt:                            │
│    changes...        │ ┌──────────────────────────────────────┐ │
│                      │ │ "Make it modern, use Tailwind..."    │ │
│ [Type message...]    │ └──────────────────────────────────────┘ │
│ [🎤] [🖼️] [Send]     │                                            │
│                      │ [✨ Generate HTML/CSS/JS]                  │
│                      │                                            │
│                      │ [Code Editors + Preview + Refine Chat]    │
│                      │                                            │
│                      │ [⚡ Send to JSON Converter →]             │
└──────────────────────┴────────────────────────────────────────────┘
```

---

## Success Metrics

- ✅ Complete workflow: Image → HTML → JSON → Editor → Playground
- ✅ No page reloads needed
- ✅ Cost tracking across all operations
- ✅ Model selection per operation
- ✅ Responsive preview at all stages
- ✅ Chat refinement at HTML and JSON stages
- ✅ Seamless data flow between tabs

---

## Next: Start Implementation

Ready to implement! Starting with:
1. Token tracker integration
2. HTML Generator tab
3. JSON Converter tab
4. Complete workflow testing
