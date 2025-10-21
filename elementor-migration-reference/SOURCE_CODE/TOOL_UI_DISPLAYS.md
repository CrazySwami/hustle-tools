# Tool UI Displays - Visual Feedback for AI Operations

This document explains the visual UI displays shown when each AI tool is executed in the Chat Editor.

## Overview

The Chat Editor has **7 AI tools** available to the GPT-5 model. Each tool has visual feedback to show what's happening and what results were found.

**All tools show:**
1. **System message** before execution - Shows tool name, icon, and key arguments
2. **API status** during execution - Shows "Executing tool: [name]"
3. **API status** after completion - Shows "Tool [name] completed"

**Some tools also show enhanced visual displays** with color-coded results panels.

---

## Tool-by-Tool Breakdown

### 1. 🔧 `generate_json_patch`

**Purpose:** Generates RFC 6902 JSON Patch operations to modify the Elementor JSON

**Visual UI:**
- **Enhanced Patch Display** (Blue gradient panel)
  - Shows each patch operation with color coding:
    - **Blue** - REPLACE operations
    - **Green** - ADD operations
    - **Red** - REMOVE operations
  - Displays JSON path being modified
  - Shows new value being applied
  - Success/error indicator (✓/✗)

- **Approval Message**
  - Shows the patches in a code block
  - Displays "Approve" and "Reject" buttons
  - Allows user to review before applying changes

**Example Flow:**
```
User: "Change the button color to red"

→ System message: "🤖 Model: gpt-5 → 🔧 Generating JSON patch (1 patches)"
→ API status: "⚙️ Executing tool: generate_json_patch"
→ Enhanced patch display shows:
   ┌─────────────────────────────────────┐
   │ 🔧 JSON Patch Applied           ✓   │
   ├─────────────────────────────────────┤
   │ REPLACE                              │
   │ /content/0/settings/button_color     │
   │ "#ff0000"                            │
   └─────────────────────────────────────┘
→ Assistant message with explanation
→ Approval message with Approve/Reject buttons
→ API status: "✅ Tool generate_json_patch completed"
```

**Files:**
- Display logic: `modules/chat-ui.js` - `addJsonPatchDisplay()`
- Styling: `styles/chat-editor-styles.css` - `.json-patch-display`
- Tool handler: `chat-editor.html` - `handleToolCall()` line 1268

---

### 2. 🔍 `analyze_json_structure`

**Purpose:** Analyzes the user's current Elementor JSON template structure

**Visual UI:**
- **Enhanced Analysis Display** (Orange/yellow gradient panel)
  - Widget Type (e.g., "custom_html_section")
  - Widget Count (number of widgets in template)
  - Has Content indicator (✓/✗)
  - Structure details (JSON object with template info)

- **Assistant Message**
  - Plain text explanation of what was found
  - May include widget list, hierarchy, or specific findings

**Example Flow:**
```
User: "What widgets are in my template?"

→ System message: "🤖 Model: gpt-5 → 🔍 Analyzing JSON structure"
→ API status: "⚙️ Executing tool: analyze_json_structure"
→ Enhanced analysis display shows:
   ┌─────────────────────────────────────┐
   │ 🔍 JSON Structure Analysis          │
   ├─────────────────────────────────────┤
   │ Widget Type: custom_html_section    │
   │ Widgets: 3                          │
   │ Has Content: ✓                      │
   │ Structure: {"sections": 1, ...}     │
   └─────────────────────────────────────┘
→ Assistant message: "Your template contains 3 widgets: heading, button, and image..."
→ API status: "✅ Tool analyze_json_structure completed"
```

**Files:**
- Display logic: `modules/chat-ui.js` - `addJsonAnalysisDisplay()`
- Styling: `styles/chat-editor-styles.css` - `.json-analysis-display`
- Tool handler: `chat-editor.html` - `handleToolCall()` line 1277

---

### 3. 📚 `search_elementor_docs`

**Purpose:** Searches 48 Elementor widget PHP files in the OpenAI vector store

**Visual UI:**
- **Enhanced Vector Search Display** (Green gradient panel)
  - Search query shown
  - Number of files searched (48)
  - Top 3 most relevant results:
    - Filename (e.g., "button.php", "heading.php")
    - Snippet preview (first 200 chars)
    - Relevance score (0-100%)

- **Assistant Message**
  - Full documentation text retrieved
  - Widget type and query details
  - Formatted markdown with code examples

**Example Flow:**
```
User: "What properties does the button widget have?"

→ System message: "🤖 Model: gpt-5 → 📚 Searching Elementor documentation (button)"
→ API status: "⚙️ Executing tool: search_elementor_docs"
→ Enhanced vector search display shows:
   ┌─────────────────────────────────────────────┐
   │ 📚 Elementor Documentation Search   48 files│
   ├─────────────────────────────────────────────┤
   │ Query: button widget properties             │
   │                                             │
   │ 📄 button.php                               │
   │ "The button widget supports text, link,     │
   │  color, size, alignment..."                 │
   │ Relevance: 92.3%                            │
   │                                             │
   │ 📄 groups/button.php                        │
   │ "Button group includes hover effects..."    │
   │ Relevance: 85.1%                            │
   └─────────────────────────────────────────────┘
→ Assistant message: "## 📚 Elementor Documentation\n\nQuery: button widget properties\n\n[Full documentation...]"
→ API status: "✅ Tool search_elementor_docs completed"
```

**Files:**
- Display logic: `modules/chat-ui.js` - `addVectorSearchDisplay()`
- Styling: `styles/chat-editor-styles.css` - `.vector-search-display`
- Tool handler: `chat-editor.html` - `handleToolCall()` line 1300

---

### 4. 🚀 `open_template_in_playground`

**Purpose:** Opens/refreshes WordPress Playground with the current template

**Visual UI:**
- **System Message Only** (no enhanced display)
  - Shows "Opening in Playground"
  - May include template stats (widget count, etc.)

- **Playground Tab Opens**
  - Tab automatically switches to "Playground"
  - WordPress Playground loads in iframe
  - Elementor template is imported and rendered

**Example Flow:**
```
User: "Open this in Playground"

→ System message: "🤖 Model: gpt-5 → 🚀 Opening in Playground"
→ API status: "⚙️ Executing tool: open_template_in_playground"
→ Playground tab opens, WordPress loads
→ Assistant message: "Opening template in WordPress Playground..."
→ API status: "✅ Tool open_template_in_playground completed"
```

**Files:**
- Tool handler: `chat-editor.html` - `handlePlaygroundAction()` line 1329
- Playground logic: `modules/playground.js`

---

### 5. 📸 `capture_playground_screenshot`

**Purpose:** Captures a screenshot of the WordPress Playground preview

**Visual UI:**
- **System Message Only** (no enhanced display)
  - Shows "Capturing screenshot"

- **Screenshot Display**
  - Screenshot appears as embedded image in assistant message
  - Full viewport capture of playground iframe
  - Saved to message metadata for future reference

**Example Flow:**
```
User: "Take a screenshot"

→ System message: "🤖 Model: gpt-5 → 📸 Capturing screenshot"
→ API status: "⚙️ Executing tool: capture_playground_screenshot"
→ Assistant message: "Here's a screenshot of your template:"
→ [Image appears in chat]
→ API status: "✅ Tool capture_playground_screenshot completed"
```

**Files:**
- Tool handler: `chat-editor.html` - `handleScreenshotTool()` line 1333
- Screenshot logic: `modules/playground.js` - `captureScreenshot()`

---

### 6. 🎨 `convert_html_to_elementor_json`

**Purpose:** Converts HTML/CSS/JS into Elementor JSON format

**Visual UI:**
- **Interactive Flow Launch**
  - Shows wizard start message
  - Opens HTML Generator tab
  - Starts 5-step conversion process

- **Progress Tracker** (in HTML Generator tab)
  - Step 1: Gathering HTML/CSS/JS
  - Step 2: Analyzing structure
  - Step 3: Validating properties
  - Step 4: Generating widgets
  - Step 5: Finalizing JSON

- **Completion Message**
  - Shows conversion stats:
    - HTML character count
    - CSS character count
    - JS character count
    - Image description (if any)
  - JSON loaded into editor confirmation

**Example Flow:**
```
User: "Convert this HTML to Elementor: <button>Click me</button>"

→ System message: "🤖 Model: gpt-5 → 🎨 Converting HTML to Elementor JSON"
→ API status: "⚙️ Executing tool: convert_html_to_elementor_json"
→ Assistant message: "🎨 Starting HTML to Elementor Conversion Wizard..."
→ HTML Generator tab opens
→ Progress tracker shows 5 steps
→ Assistant message: "## 🎨 HTML to Elementor Conversion Complete!\n\nStats:\n- HTML: 25 characters..."
→ JSON Editor updates with result
→ API status: "✅ Tool convert_html_to_elementor_json completed"
```

**Files:**
- Tool handler: `chat-editor.html` - `handleToolCall()` line 1309
- Conversion flow: `chat-editor.html` - `startHtmlConversionFlow()`
- HTML Generator UI: `chat-editor.html` - HTML Generator tab

---

### 7. 📋 `list_available_tools`

**Purpose:** Lists all 7 available tools and their capabilities

**Visual UI:**
- **System Message Only** (no enhanced display)
  - Shows "Listing tools"

- **Assistant Message**
  - Formatted list of all tools
  - Each tool shows:
    - Icon and name
    - Description
    - Example use cases
    - Parameters

**Example Flow:**
```
User: "What can you do?"

→ System message: "🤖 Model: gpt-5 → 📋 Listing tools"
→ API status: "⚙️ Executing tool: list_available_tools"
→ Assistant message: "I have 7 tools available:\n\n1. 🔧 generate_json_patch - Modify JSON...\n2. 🔍 analyze_json_structure - Analyze template...\n..."
→ API status: "✅ Tool list_available_tools completed"
```

**Files:**
- Tool handler: `chat-editor.html` - `showToolsList()` line 1337
- Tool definitions: `modules/openai-client.js` - `tools` array

---

## Visual Design System

### Color Coding

Each enhanced tool display uses a consistent color scheme:

| Tool | Primary Color | Gradient | Border |
|------|--------------|----------|--------|
| JSON Patch | Blue `#3b82f6` | `#eff6ff → #dbeafe` | 4px solid blue |
| JSON Analysis | Orange `#f59e0b` | `#fffbeb → #fef3c7` | 4px solid orange |
| Vector Search | Green `#10b981` | `#f0fdf4 → #dcfce7` | 4px solid green |
| Reasoning | Purple `#8b5cf6` | `#faf5ff → #f3e8ff` | 4px solid purple |

### Animation

All enhanced displays use the `slideIn` animation:
```css
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

Duration: 0.3s ease-out

### Typography

- **Header:** 14px, font-weight 600
- **Icon:** 18px
- **Body text:** 13px
- **Code:** 12px, monospace
- **Metadata:** 11px

---

## API Status Messages

**All tools show standard API status messages:**

1. **Before execution:**
   ```
   📤 Sending message to gpt-5...
   ```

2. **During tool execution:**
   ```
   ⚙️ Executing tool: [tool_name]
   ```

3. **After completion:**
   ```
   ✅ Tool [tool_name] completed
   ```

4. **After response received:**
   ```
   📥 Response received: 1,234 tokens
   ```

**Styling:**
- Transparent background
- Gray text `#9ca3af`
- 11px font size
- Minimal padding (2px vertical)
- Inline display (no full-width block)

---

## System Messages

**System messages appear before tool execution:**

Format: `🤖 **Model: [model_name]** → [tool_icon] [tool_description] ([args_summary])`

Examples:
```
🤖 Model: gpt-5 → 🔧 Generating JSON patch (3 patches)
🤖 Model: gpt-5 → 📚 Searching Elementor documentation (button widget)
🤖 Model: gpt-5 → 🔍 Analyzing JSON structure
```

**Location:** `modules/chat-ui.js` - `addToolCallMessage()`

---

## Reasoning Tokens Display

**Separate from tools, but shown during AI responses:**

When GPT-5 uses extended reasoning (reasoning tokens > 0):

**Visual UI:**
- Purple gradient panel
- Brain icon 🧠
- "AI Reasoning" title
- Token count badge
- Explanation of reasoning process

**Styling:** Same gradient system as enhanced tool displays

**Location:** `modules/chat-ui.js` - `addReasoningDisplay()`

---

## Summary Table

| Tool | Icon | Enhanced Display | Approval Required | Tab Switch |
|------|------|-----------------|-------------------|------------|
| `generate_json_patch` | 🔧 | ✓ Blue patch display | ✓ Yes | No |
| `analyze_json_structure` | 🔍 | ✓ Orange analysis display | No | No |
| `search_elementor_docs` | 📚 | ✓ Green search results | No | No |
| `open_template_in_playground` | 🚀 | Basic messages only | No | ✓ To Playground |
| `capture_playground_screenshot` | 📸 | Basic messages + image | No | No |
| `convert_html_to_elementor_json` | 🎨 | Progress tracker | No | ✓ To HTML Gen |
| `list_available_tools` | 📋 | Basic messages only | No | No |

---

## Implementation Notes

### Adding a New Enhanced Display

To add a new enhanced display for a tool:

1. **Create UI method in `modules/chat-ui.js`:**
   ```javascript
   addYourToolDisplay(data) {
       const el = document.createElement('div');
       el.className = 'tool-result-display your-tool-display';
       el.innerHTML = `
           <div class="tool-result-header">
               <span class="tool-icon">🔧</span>
               <span class="tool-title">Your Tool Name</span>
           </div>
           <div class="tool-result-content">
               <!-- Your content here -->
           </div>
       `;
       this.container.appendChild(el);
       this.scrollToBottom();
   }
   ```

2. **Add CSS in `styles/chat-editor-styles.css`:**
   ```css
   .your-tool-display {
       border-left: 4px solid #yourcolor;
       background: linear-gradient(135deg, #light 0%, #lighter 100%);
   }

   .your-tool-display .tool-result-header {
       background: rgba(your-color, 0.1);
       border-bottom: 1px solid rgba(your-color, 0.2);
       color: #dark-version;
   }
   ```

3. **Call in tool handler (`chat-editor.html`):**
   ```javascript
   else if (toolCall.name === 'your_tool_name') {
       this.chatUI.addYourToolDisplay(toolCall.result);
       this.chatUI.addMessage('assistant', assistantMessage);
   }
   ```

### Best Practices

1. **Always show enhanced display BEFORE assistant message** - Gives visual context
2. **Use consistent color coding** - Helps users learn the system
3. **Keep displays concise** - Show top 3 results, not all
4. **Include metadata badges** - File count, token count, etc.
5. **Add success/error indicators** - ✓/✗ for quick status
6. **Use monospace for paths/code** - Improves readability
7. **Animate on entry** - slideIn animation for polish

---

## Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `modules/chat-ui.js` | UI display methods | 278-371 |
| `styles/chat-editor-styles.css` | Tool display styling | 289-474 |
| `chat-editor.html` | Tool handlers | 1259-1361 |
| `modules/openai-client.js` | Tool definitions | 18-176 |

---

## Future Enhancements

Potential improvements for tool UIs:

1. **Expandable details** - Click to see full documentation instead of top 3
2. **Interactive patch preview** - Diff view showing before/after
3. **Search result highlighting** - Highlight matching keywords
4. **Copy buttons** - Copy patch operations, search results, etc.
5. **Export results** - Download documentation as markdown
6. **History view** - See all tool calls in current session
7. **Performance metrics** - Show tool execution time

---

Generated: 2025-01-15
Version: 1.0
