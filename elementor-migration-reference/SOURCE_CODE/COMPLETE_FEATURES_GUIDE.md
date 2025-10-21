# Complete Features Guide - Elementor JSON Editor

> **Comprehensive documentation of all features, tools, and architecture for migration to Next.js or other frameworks**

Last Updated: 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Chat Interface & AI Tools](#chat-interface--ai-tools)
4. [HTML Generator](#html-generator)
5. [JSON Converter](#json-converter)
6. [JSON Editor](#json-editor)
7. [WordPress Playground Integration](#wordpress-playground-integration)
8. [Model Selection & API Configuration](#model-selection--api-configuration)
9. [Debug Panel & Logging](#debug-panel--logging)
10. [Token Tracking & Cost Management](#token-tracking--cost-management)
11. [Technical Implementation Details](#technical-implementation-details)
12. [Migration Guide to Next.js](#migration-guide-to-nextjs)

---

## Overview

The Elementor JSON Editor is a comprehensive AI-powered tool for creating, editing, and converting web designs into Elementor-compatible JSON templates. It combines multiple powerful features:

- **AI Chat Interface** - Natural language editing with GPT-5
- **HTML Generator** - Image-to-HTML conversion using Vision AI
- **JSON Converter** - HTML/CSS/JS to Elementor JSON conversion
- **Live Preview** - WordPress Playground integration for instant testing
- **Advanced Tools** - Vector store search, web search, cost tracking

### Key Technologies
- Pure JavaScript (no framework dependencies)
- OpenAI GPT-5 API with function calling
- OpenAI Assistants API with file search
- WordPress Playground (WebAssembly WordPress)
- JSON Patch (RFC 6902) for precise editing

### Related Documentation
- **[TOOL_UI_DISPLAYS.md](TOOL_UI_DISPLAYS.md)** - Comprehensive guide to all 7 AI tool visual displays and UX patterns

---

## Architecture

### Module Structure

```
hustle-elementor-webapp/
├── chat-editor.html           # Main application (2,800+ lines)
├── modules/
│   ├── chat-ui.js            # Message rendering, streaming, UI
│   ├── json-editor.js        # JSON syntax highlighting & editing
│   ├── json-diff.js          # JSON Patch generation & application
│   ├── openai-client.js      # OpenAI API wrapper with tools
│   ├── openai-audio.js       # Voice transcription (Whisper API)
│   ├── state-manager.js      # State management & history
│   └── html-converter.js     # HTML to Elementor conversion
├── styles/
│   └── chat-editor-styles.css # All UI styles
├── token-tracker.js           # Cost tracking widget
├── playground.js              # WordPress Playground integration
└── setup-assistant.js         # OpenAI Assistant setup (Node.js)
```

### Data Flow

```
User Input (Chat/Upload/Generate)
    ↓
ChatEditorApp (Main Controller)
    ↓
OpenAI API (Function Calling)
    ↓
Tool Execution (JSON Patch/Convert/Search)
    ↓
State Manager (History + Persistence)
    ↓
JSON Editor (Display)
    ↓
WordPress Playground (Preview)
```

### State Management

```javascript
// Central state object
{
    currentJson: {...},           // Active Elementor JSON
    messages: [...],              // Chat history
    history: [...],               // Undo/redo stack
    historyIndex: 0,              // Current position
    mockupImages: {...},          // Uploaded design images
    sessionStats: {...}           // Token usage tracking
}
```

---

## Chat Interface & AI Tools

### Overview
The chat interface uses OpenAI's function calling to execute precise operations on JSON templates through natural language.

### Available Tools

#### 1. `generate_json_patch`
**Purpose:** Make surgical edits to JSON
**Use Cases:**
- Change colors, text, URLs
- Modify widget properties
- Add/remove/replace values

**Example Request:**
```
"Change the button color to blue and update the text to 'Click Here'"
```

**How It Works:**
```javascript
// AI generates JSON Patch operations
{
    "patches": [
        {
            "op": "replace",
            "path": "/content/0/settings/button_background_color",
            "value": "#0000ff"
        },
        {
            "op": "replace",
            "path": "/content/0/settings/button_text",
            "value": "Click Here"
        }
    ],
    "summary": "Updated button color and text"
}
```

**Implementation:**
- Uses RFC 6902 JSON Patch standard
- Atomic operations (all or nothing)
- Undo/redo support via history stack
- Real-time preview updates

#### 2. `analyze_json_structure`
**Purpose:** Understand the current template structure
**Use Cases:**
- "What widgets are in this template?"
- "Show me all button widgets"
- "What colors are being used?"

**Returns:**
- Widget inventory
- Property summaries
- Structure analysis

#### 3. `search_elementor_docs`
**Purpose:** Query Elementor documentation via vector store
**Use Cases:**
- "How do I add a background image to a container?"
- "What properties does the heading widget support?"
- "Show me button widget documentation"

**How It Works:**
```javascript
// Uses OpenAI Assistants API with file search
// Vector store contains 48 Elementor PHP files
const result = await assistant.runWithFileSearch(query);
// Returns relevant documentation excerpts
```

**Setup Required:**
```bash
cd hustle-elementor-webapp
export OPENAI_API_KEY=sk-your-key
node setup-assistant.js
# Creates vector store + assistant
# IDs stored in assistant-config.json
```

#### 4. `convert_html_to_elementor_json`
**Purpose:** Convert HTML/CSS/JS to Elementor JSON
**Use Cases:**
- "Convert this HTML to Elementor"
- "Take my design and make it an Elementor template"

**Process:**
1. Extract computed styles from DOM
2. AI analyzes structure
3. Map to Elementor widgets
4. Generate JSON with settings

#### 5. `wordpress_playground_action`
**Purpose:** Control WordPress Playground preview
**Actions:**
- `launch` - Start playground instance
- `refresh` - Update template and reload
- `open_editor` - Open Elementor editor view

**Use Cases:**
- "Show me this in WordPress"
- "Preview the changes"
- "Open the Elementor editor"

#### 6. `web_search` (Optional)
**Purpose:** Search web for current information
**Use Cases:**
- "What are current design trends?"
- "Find examples of pricing tables"

**Activation:** Toggle "🌐 Web Search" in header

### Slash Commands

Quick access to tools via `/` prefix:

```
/search <query>     - Search Elementor docs
/convert <html>     - Convert HTML to Elementor
/patch <request>    - Generate JSON patches
/analyze            - Analyze current JSON
/playground launch  - Start WordPress preview
/playground refresh - Update preview
```

**Implementation:**
```javascript
// Auto-complete menu appears on typing /
handleSlashInput(e) {
    if (input.startsWith('/')) {
        const filtered = this.slashCommands.filter(cmd =>
            cmd.command.includes(query)
        );
        this.showSlashMenu(filtered);
    }
}
```

### Streaming Responses

All AI responses stream character-by-character for real-time feedback:

```javascript
// Set up streaming callback
this.openaiClient.onStreamChunk = (chunk) => {
    this.chatUI.appendToStreamingMessage(messageId, chunk);
};

// OpenAI sends delta events
if (event.type === 'response.output_text.delta') {
    callback(event.delta); // Stream to UI
}
```

### Voice Input

Uses OpenAI Whisper API for voice-to-text:

```javascript
// Record audio
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream);

// Transcribe with Whisper
const audioBlob = new Blob(chunks, { type: 'audio/webm' });
const text = await openaiAudio.transcribe(audioBlob);
```

---

## HTML Generator

### Purpose
Convert design mockups (images) to HTML/CSS/JS code using GPT-5 Vision API.

### Features
- **Multi-device support** - Upload desktop, tablet, mobile mockups
- **Vision AI** - Analyzes design elements, colors, layout
- **Live preview** - See generated code instantly
- **Refinement chat** - Iteratively improve output
- **Export to JSON Converter** - Send directly to Elementor conversion

### Workflow

#### 1. Upload Mockups
```javascript
// Accept image files
<input type="file" accept="image/*" onchange="handleMockupUpload(e, 'desktop')">

// Store as base64
this.mockupImages = {
    desktop: "data:image/png;base64,...",
    tablet: "data:image/png;base64,...",
    mobile: "data:image/png;base64,..."
};
```

#### 2. Generate Code
```javascript
// Build prompt for Vision API
const prompt = `
Generate clean HTML, CSS, and JavaScript based on this design.
Requirements:
- Responsive HTML5
- Modern CSS (Flexbox/Grid)
- Hover effects
- Mobile-friendly
${customInstructions}

Return JSON: { "html": "...", "css": "...", "js": "..." }
`;

// Call Vision API
const response = await openaiClient.sendMessage(
    prompt,
    null,
    [],
    mockupImages.desktop, // Image as base64
    false
);
```

#### 3. Preview & Refine
```javascript
// Live preview in iframe
const iframe = document.getElementById('htmlPreviewIframe');
iframe.contentDocument.write(`
    <!DOCTYPE html>
    <html>
    <head><style>${css}</style></head>
    <body>${html}<script>${js}</script></body>
    </html>
`);

// Viewport switching
switchViewport(viewport) {
    iframe.className = `html-preview-iframe ${viewport}`;
}
```

**Desktop Preview Zoom:**
```css
.html-preview-iframe.desktop {
    width: 1440px;
    transform: scale(0.65);
    transform-origin: top left;
}
```

#### 4. Refinement Chat
```javascript
// Iterative improvements
refineBtn.onclick = async () => {
    const refinementRequest = document.getElementById('refinementInput').value;

    const prompt = `
Current code:
HTML: ${currentHtml}
CSS: ${currentCss}

Modify based on: ${refinementRequest}

Return updated JSON.
`;

    // Update code editors with result
};
```

#### 5. Send to JSON Converter
```javascript
sendToJsonConverter() {
    // Populate JSON Converter tab with generated code
    document.getElementById('sourceHtml').value = generatedHtml;
    document.getElementById('sourceCss').value = generatedCss;
    document.getElementById('sourceJs').value = generatedJs;

    this.switchTab('jsonconverter');
}
```

### Model Selection

Three cost/quality tiers:
- **GPT-5 Standard** ($1.25/1M in) - Best quality
- **GPT-5 Mini** ($0.25/1M in) - Balanced
- **GPT-5 Nano** ($0.05/1M in) - Fast & cheap

---

## JSON Converter

### Purpose
Convert HTML/CSS/JS code into Elementor-compatible JSON templates.

### Two Conversion Modes

#### 1. Fast Mode (Browser-Only)
- **Speed:** < 200ms
- **Method:** Regex + DOM parsing
- **Output:** Custom HTML widget (100% fidelity)
- **Use Case:** Quick prototyping

#### 2. Accurate Mode (AI-Powered)
- **Speed:** 10-20 seconds
- **Method:** AI analysis with vector store
- **Output:** Native Elementor widgets
- **Use Case:** Production templates

### Conversion Process (Accurate Mode)

#### Step 1: Extract Computed Styles
```javascript
// Parse HTML into DOM
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');

// Get actual rendered styles
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
iframe.contentDocument.write(html);

const elements = iframe.contentDocument.querySelectorAll('*');
elements.forEach(el => {
    const computed = window.getComputedStyle(el);
    el.dataset.computedStyles = JSON.stringify({
        color: computed.color,
        fontSize: computed.fontSize,
        // ... all relevant properties
    });
});

// Serialize with styles attached
const htmlWithStyles = iframe.contentDocument.documentElement.outerHTML;
```

#### Step 2: AI Conversion
```javascript
// Send to AI with Elementor documentation context
const prompt = `
Convert this HTML to Elementor JSON.

HTML with computed styles:
${htmlWithStyles}

CSS:
${css}

Use native Elementor widgets:
- heading, button, text-editor, image, container, etc.

Reference Elementor property mappings from vector store.

Return valid Elementor JSON structure.
`;

const result = await openaiClient.sendMessage(prompt, ...);
```

#### Step 3: Post-Processing
```javascript
// Validate & enforce structure
validateElementorJSON(json) {
    // Check required properties
    if (!json.widgetType) throw new Error('Missing widgetType');
    if (!json.content) throw new Error('Missing content array');

    // Validate each widget
    json.content.forEach(widget => {
        if (!widget.elType) throw new Error('Missing elType');
        if (!widget.settings) widget.settings = {};
    });

    return json;
}
```

#### Step 4: Load into Editor
```javascript
// Update state and display
this.stateManager.setJson(result.json);
this.jsonEditor.setJson(result.json);
window.generatedJSON = result.json;

// Show success message
this.chatUI.addMessage('assistant', `
## 🎉 Conversion Complete!

**Pipeline Executed:**
✅ Extracted computed styles (${stats.elementsProcessed} elements)
✅ AI conversion with vector store
✅ Post-processing & validation

**What's Next:**
1. Review the JSON in the editor
2. Make any edits
3. Click "Update & Open" to test in Playground
`);

// Switch to JSON editor after 2 seconds
setTimeout(() => this.switchTab('json'), 2000);
```

### Conversion Settings

```html
<label>
    <input type="radio" name="conversionMode" value="fast" checked>
    Fast (Browser-only, Custom HTML)
</label>
<label>
    <input type="radio" name="conversionMode" value="accurate">
    Accurate (AI-powered, Native Widgets)
</label>

<label>
    <input type="checkbox" id="useGlobalStylesheet">
    Include Global Stylesheet
</label>
<textarea id="globalStylesheet" placeholder="/* Global CSS... */">
```

### Custom Prompt
```html
<textarea id="conversionPrompt" placeholder="e.g., Focus on button widgets, preserve exact colors...">
```

**Example:**
```
Focus on creating container widgets with proper nesting.
Use only heading, button, and text-editor widgets.
Preserve all colors exactly as they appear.
Add mobile responsive settings.
```

---

## JSON Editor

### Purpose
Syntax-highlighted JSON editor with validation and diff visualization.

### Features

#### Syntax Highlighting
```javascript
class JsonEditor {
    syntaxHighlight(json) {
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    cls = /:$/.test(match) ? 'json-key' : 'json-string';
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    }
}
```

**Color Scheme:**
- Keys: `#8be9fd` (cyan)
- Strings: `#f1fa8c` (yellow)
- Numbers: `#bd93f9` (purple)
- Booleans: `#ff79c6` (pink)
- Null: `#6272a4` (gray)

#### Change Highlighting
```javascript
// Highlight modified lines after patch
highlightChanges(patches) {
    const lineNumbers = this.patchesToLineNumbers(patches);

    lines.forEach((line, index) => {
        const highlighted = lineNumbers.has(index) ? 'highlighted' : '';
        html += `<div class="json-line ${highlighted}">${line}</div>`;
    });

    // Scroll to first change
    firstLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

#### Validation
```javascript
validateJson() {
    const errors = [];
    const warnings = [];

    // Check Elementor structure
    if (!json.widgetType) errors.push('Missing widgetType');
    if (!json.content) errors.push('Missing content array');

    // Validate widgets
    json.content.forEach((widget, idx) => {
        if (!widget.elType) errors.push(`Widget ${idx}: Missing elType`);
        if (!widget.widgetType) warnings.push(`Widget ${idx}: Missing widgetType`);
        if (!widget.settings) warnings.push(`Widget ${idx}: Missing settings`);
    });

    return { valid: errors.length === 0, errors, warnings };
}
```

#### Search
```javascript
search(searchText) {
    const results = [];
    const jsonString = JSON.stringify(this.currentJson, null, 2);
    const lines = jsonString.split('\n');

    lines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchText.toLowerCase())) {
            results.push({ lineNumber: index, content: line.trim() });
        }
    });

    return results;
}
```

### Undo/Redo System

```javascript
class StateManager {
    setJson(json) {
        // Add to history
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.parse(JSON.stringify(json)));
        this.historyIndex = this.history.length - 1;

        this.currentJson = json;
        this.saveToLocalStorage();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.history[this.historyIndex];
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            return this.history[this.historyIndex];
        }
    }
}
```

**Keyboard Shortcuts:**
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Y` - Redo

### Persistence

```javascript
// Auto-save to localStorage
saveToLocalStorage() {
    localStorage.setItem('elementor_json_state', JSON.stringify({
        currentJson: this.currentJson,
        history: this.history,
        historyIndex: this.historyIndex,
        timestamp: Date.now()
    }));
}

// Auto-restore on load
loadFromLocalStorage() {
    const saved = localStorage.getItem('elementor_json_state');
    if (saved) {
        const state = JSON.parse(saved);
        // Restore if less than 7 days old
        if (Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000) {
            return state;
        }
    }
}
```

---

## WordPress Playground Integration

### Purpose
Live preview of Elementor templates in actual WordPress environment (no server required).

### Architecture

**WordPress Playground** runs a complete WordPress + PHP stack in the browser using WebAssembly.

```javascript
// Initialize playground
import { login, startPlaygroundWeb } from '@wp-playground/client';

const client = await startPlaygroundWeb({
    iframe: document.getElementById('playgroundIframe'),
    remoteUrl: `https://playground.wordpress.net/remote.html`,
    blueprint: {
        preferredVersions: {
            php: '8.0',
            wp: '6.4'
        },
        steps: [
            { step: 'login', username: 'admin', password: 'password' },
            { step: 'installPlugin', pluginZipFile: elementorZip },
            { step: 'activatePlugin', pluginPath: 'elementor' }
        ]
    }
});
```

### Workflow

#### 1. Launch Playground
```javascript
async startPlayground() {
    // Check if already running
    if (window.playgroundClient) {
        console.log('Playground already running');
        return;
    }

    // Import playground module (loaded separately)
    if (!window.startPlaygroundWeb) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Start playground
    const client = await window.startPlaygroundWeb({
        iframe: document.getElementById('playgroundIframe')
    });

    window.playgroundClient = client;

    // Import template if available
    if (window.generatedJSON) {
        await this.importTemplateToPlayground();
    }
}
```

#### 2. Import Template
```javascript
async importTemplateToPlayground() {
    const json = window.generatedJSON;

    // Create page in WordPress
    const pageResponse = await client.run({
        code: `<?php
            require '/wordpress/wp-load.php';
            $page_id = wp_insert_post([
                'post_title' => 'Elementor Test Preview',
                'post_status' => 'publish',
                'post_type' => 'page'
            ]);
            echo $page_id;
        ?>`
    });

    const pageId = pageResponse.text;
    window.currentPageId = pageId;

    // Save Elementor data
    await client.run({
        code: `<?php
            require '/wordpress/wp-load.php';
            update_post_meta(${pageId}, '_elementor_data', '${JSON.stringify(json)}');
            update_post_meta(${pageId}, '_elementor_edit_mode', 'builder');
        ?>`
    });

    // Navigate to Elementor editor
    await client.goTo(`/wp-admin/post.php?post=${pageId}&action=elementor`);
}
```

#### 3. Update Template
```javascript
async updatePlayground() {
    if (!window.currentPageId) return;

    const json = window.generatedJSON;

    // Update post meta
    await window.playgroundClient.run({
        code: `<?php
            require '/wordpress/wp-load.php';
            update_post_meta(${window.currentPageId}, '_elementor_data', '${JSON.stringify(json)}');
        ?>`
    });

    // Reload editor
    await window.playgroundClient.goTo(`/wp-admin/post.php?post=${window.currentPageId}&action=elementor&timestamp=${Date.now()}`);
}
```

#### 4. View Live Page
```javascript
async viewLivePage() {
    const slug = 'elementor-test-preview';
    await window.playgroundClient.goTo(`/${slug}/?v=${Date.now()}`);
}
```

### Playground Controls

```html
<button id="startPlaygroundBtn">🚀 Launch Playground</button>
<button id="updatePlaygroundBtn" disabled>🔄 Update & Open</button>
<button id="viewPageBtn" disabled>👁️ View Live</button>
<div id="playgroundStatus">
    <span id="playgroundStatusText"></span>
</div>
```

**State Management:**
- Buttons disabled until playground ready
- Status text shows current state
- Auto-enable after successful launch

### AI Tool Integration

```javascript
// Via chat: "Show me this in WordPress"
async handlePlaygroundAction(action) {
    switch (action) {
        case 'launch':
            await this.startPlayground();
            break;
        case 'refresh':
            await this.updatePlayground();
            break;
        case 'open_editor':
            await this.openElementorEditor();
            break;
    }
}
```

---

## Model Selection & API Configuration

### Available Models

```javascript
const models = [
    {
        id: 'gpt-5-2025-08-07',
        name: 'GPT-5 Standard',
        input: 1.25,  // $ per 1M tokens
        output: 10.00
    },
    {
        id: 'gpt-5-mini-2025-08-07',
        name: 'GPT-5 Mini',
        input: 0.25,
        output: 2.00
    },
    {
        id: 'gpt-5-nano-2025-08-07',
        name: 'GPT-5 Nano',
        input: 0.05,
        output: 0.40
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        input: 2.50,
        output: 10.00
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        input: 0.15,
        output: 0.60
    }
];
```

### Model Selectors

```html
<!-- Chat Interface -->
<select id="chatModelSelector">
    <option value="gpt-5-2025-08-07">GPT-5 Standard</option>
    <option value="gpt-5-mini-2025-08-07">GPT-5 Mini</option>
    <option value="gpt-5-nano-2025-08-07">GPT-5 Nano</option>
</select>

<!-- HTML Generator -->
<select id="htmlGenModelSelector">
    <option value="gpt-5-2025-08-07">GPT-5 Standard ($1.25/1M)</option>
    <option value="gpt-5-mini-2025-08-07">GPT-5 Mini ($0.25/1M)</option>
    <option value="gpt-5-nano-2025-08-07">GPT-5 Nano ($0.05/1M)</option>
</select>

<!-- JSON Converter -->
<select id="jsonConvModelSelector">
    <!-- Same options -->
</select>
```

**Implementation:**
```javascript
// Listen for model changes
document.getElementById('chatModelSelector').addEventListener('change', (e) => {
    if (this.openaiClient) {
        this.openaiClient.model = e.target.value;
        console.log('✅ Model changed to:', e.target.value);
    }
});

// Set initial model on API key load
checkApiKey() {
    const apiKey = localStorage.getItem('openai_api_key');
    if (apiKey) {
        this.openaiClient = new OpenAIClient(apiKey);

        // Set from selector
        const modelSelector = document.getElementById('chatModelSelector');
        if (modelSelector) {
            this.openaiClient.model = modelSelector.value;
        }
    }
}
```

### API Key Management

```javascript
// Modal for entering API key
showApiKeyModal() {
    document.getElementById('apiKeyModal').style.display = 'flex';
    const currentKey = localStorage.getItem('openai_api_key') || '';
    document.getElementById('apiKeyInput').value = currentKey;
}

saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();

    if (!apiKey.startsWith('sk-')) {
        alert('Invalid API key format');
        return;
    }

    // Save to localStorage
    localStorage.setItem('openai_api_key', apiKey);

    // Initialize clients
    this.openaiClient = new OpenAIClient(apiKey);
    this.openaiAudio = new OpenAIAudio(apiKey);

    // Update UI
    document.getElementById('apiKeyIndicator').className = 'status-dot active';
    document.getElementById('apiKeyText').textContent = 'API Key Set';

    this.hideApiKeyModal();
}
```

**Security Note:** API keys stored in localStorage (client-side only). For production, use environment variables or server-side proxy.

---

## Debug Panel & Logging

### Purpose
Collapsible panel for monitoring API calls, viewing logs, and tracking session costs.

### Features

#### Console Log Interception
```javascript
setupConsoleInterception() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLogEntry = (type, args) => {
        const timestamp = new Date().toLocaleTimeString();
        const message = Array.from(args).map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        this.debugLogs.push({ type, message, timestamp });

        // Keep only last 100 logs
        if (this.debugLogs.length > 100) {
            this.debugLogs.shift();
        }

        // Update UI if panel is open
        if (document.getElementById('debugPanel').style.display !== 'none') {
            this.renderDebugLogs();
        }
    };

    console.log = (...args) => {
        originalLog.apply(console, args);
        addLogEntry('info', args);
    };

    // Same for warn and error
}
```

#### Debug Panel UI
```html
<button id="toggleDebugPanel" class="btn-small">🔍 Debug</button>

<div id="debugPanel" class="debug-panel" style="display: none;">
    <div class="debug-panel-content">
        <!-- Session Costs Section -->
        <div class="debug-section">
            <h3>💰 Session Costs</h3>
            <div id="costTracker" class="token-tracker-widget"></div>
            <button id="sessionStatsBtn">📊 Detailed Stats</button>
            <button id="restartSessionBtn">🔄 Restart</button>
        </div>

        <!-- Console Logs Section -->
        <div class="debug-section">
            <h3>📋 Console Logs</h3>
            <div id="debugLogs" class="debug-logs"></div>
            <button id="clearLogsBtn">🗑️ Clear Logs</button>
        </div>
    </div>
</div>
```

**Styling:**
```css
.debug-panel {
    background: #1e293b;
    border-bottom: 2px solid #334155;
    max-height: 400px;
    overflow: hidden;
}

.debug-logs {
    background: #000;
    color: #d4d4d4;
    font-family: 'Monaco', monospace;
    font-size: 11px;
    max-height: 200px;
    overflow-y: auto;
}

.log-entry.info { color: #60a5fa; }
.log-entry.success { color: #4ade80; }
.log-entry.warning { color: #fbbf24; }
.log-entry.error { color: #f87171; }
```

#### Toggle Functionality
```javascript
toggleDebugPanel() {
    const panel = document.getElementById('debugPanel');
    const button = document.getElementById('toggleDebugPanel');

    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        button.textContent = '🔍 Close Debug';
        this.renderDebugLogs();
    } else {
        panel.style.display = 'none';
        button.textContent = '🔍 Debug';
    }
}
```

---

## Token Tracking & Cost Management

### Purpose
Real-time tracking of API usage and costs per session.

### Implementation (token-tracker.js)

#### Pricing Configuration
```javascript
const MODEL_PRICING = {
    'gpt-5-2025-08-07': {
        name: 'GPT-5 Standard',
        input: 1.25,   // $ per 1M tokens
        output: 10.00
    },
    'gpt-5-mini-2025-08-07': {
        name: 'GPT-5 Mini',
        input: 0.25,
        output: 2.00
    },
    'gpt-5-nano-2025-08-07': {
        name: 'GPT-5 Nano',
        input: 0.05,
        output: 0.40
    }
};
```

#### Session Tracking
```javascript
let sessionStats = {
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    calls: [],  // Last 100 calls
    startTime: Date.now()
};

// Save to localStorage (persists 24h)
function saveSessionStats() {
    localStorage.setItem('tokenTrackerSession', JSON.stringify(sessionStats));
}

// Auto-restore on page load
function loadSessionStats() {
    const saved = localStorage.getItem('tokenTrackerSession');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if < 24 hours old
        if (Date.now() - parsed.startTime < 24 * 60 * 60 * 1000) {
            sessionStats = parsed;
        }
    }
}
```

#### Track Usage
```javascript
window.trackTokenUsage = function(callData) {
    const { model, inputTokens, outputTokens, type, success } = callData;

    // Calculate cost
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-5-2025-08-07'];
    const cost = (inputTokens / 1000000) * pricing.input +
                 (outputTokens / 1000000) * pricing.output;

    // Record call
    const call = {
        timestamp: Date.now(),
        model,
        type,  // 'chat', 'conversion', 'image-to-html', etc.
        inputTokens,
        outputTokens,
        cost,
        success
    };

    // Update totals
    sessionStats.totalCalls++;
    sessionStats.totalInputTokens += inputTokens;
    sessionStats.totalOutputTokens += outputTokens;
    sessionStats.totalCost += cost;
    sessionStats.calls.push(call);

    // Keep last 100
    if (sessionStats.calls.length > 100) {
        sessionStats.calls.shift();
    }

    saveSessionStats();
    updateCostDisplay();

    console.log('💰 Token usage tracked:', {
        type,
        model: pricing.name,
        inputTokens,
        outputTokens,
        cost: '$' + cost.toFixed(4)
    });
};
```

#### Cost Display Widget
```javascript
function updateCostDisplay() {
    const widget = document.getElementById('costTracker');
    const avgTokensPerCall = sessionStats.totalCalls > 0
        ? Math.round((sessionStats.totalInputTokens + sessionStats.totalOutputTokens) / sessionStats.totalCalls)
        : 0;
    const sessionDuration = Math.round((Date.now() - sessionStats.startTime) / 60000);

    widget.innerHTML = `
        <div>💰 Session Cost</div>
        <div style="font-size: 24px; font-weight: 700;">
            $${sessionStats.totalCost.toFixed(4)}
        </div>
        <div style="font-size: 11px;">
            ${sessionStats.totalCalls} API calls • ${sessionDuration}m<br>
            ${sessionStats.totalInputTokens.toLocaleString()} in / ${sessionStats.totalOutputTokens.toLocaleString()} out<br>
            Avg: ${avgTokensPerCall.toLocaleString()} tokens/call
        </div>
        <button onclick="resetCostTracker()">Reset</button>
        <button onclick="showDetailedStats()">Details</button>
    `;
}
```

#### Detailed Stats Modal
```javascript
window.showDetailedStats = function() {
    // Show last 20 calls in table
    const recentCalls = sessionStats.calls.slice(-20).reverse();

    recentCalls.forEach(call => {
        const row = `
            <tr>
                <td>${new Date(call.timestamp).toLocaleTimeString()}</td>
                <td>${call.type}</td>
                <td>${MODEL_PRICING[call.model]?.name || call.model}</td>
                <td>${call.inputTokens.toLocaleString()}</td>
                <td>${call.outputTokens.toLocaleString()}</td>
                <td>$${call.cost.toFixed(4)}</td>
            </tr>
        `;
        // Append to table
    });

    // Show modal
    document.getElementById('statsModal').style.display = 'flex';
};
```

### Integration with API Calls

Every API call tracks usage:
```javascript
// After API response
if (response.usage && window.trackTokenUsage) {
    window.trackTokenUsage({
        model: this.openaiClient.model,
        inputTokens: response.usage.input_tokens || 0,
        outputTokens: response.usage.output_tokens || 0,
        type: 'chat',  // or 'conversion', 'image-to-html', etc.
        success: true
    });
}
```

---

## Technical Implementation Details

### Error Handling

All errors are safely handled with proper message extraction:

```javascript
// Safe error message extraction
function safeErrorMessage(error) {
    try {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.toString && typeof error.toString === 'function') {
            const str = error.toString();
            if (str !== '[object Object]') return str;
        }
        return JSON.stringify(error, null, 2);
    } catch (e) {
        return 'Error (cannot convert to string)';
    }
}

// Global error handlers
window.addEventListener('error', (event) => {
    const errorMsg = safeErrorMessage(event.error || event.message);
    if (window.app?.chatUI) {
        window.app.chatUI.addSystemMessage(`⚠️ Error: ${errorMsg}`);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = safeErrorMessage(event.reason);
    if (window.app?.chatUI) {
        window.app.chatUI.addSystemMessage(`⚠️ Promise Error: ${errorMsg}`);
    }
});
```

### Message Rendering

```javascript
class ChatUI {
    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;

        // Parse markdown
        const html = this.parseMessageContent(message.content);
        messageEl.innerHTML = html;

        // Add copy button (except for api-status)
        if (message.role !== 'api-status') {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-message-btn';
            copyBtn.innerHTML = '📋';
            copyBtn.onclick = () => this.copyMessageToClipboard(message.content, copyBtn);
            messageEl.appendChild(copyBtn);
        }

        return messageEl;
    }

    copyMessageToClipboard(content, button) {
        navigator.clipboard.writeText(content).then(() => {
            button.innerHTML = '✅';
            button.style.background = '#10b981';
            setTimeout(() => {
                button.innerHTML = '📋';
                button.style.background = '';
            }, 1500);
        });
    }
}
```

### Streaming Implementation

```javascript
// Streaming message container
addStreamingMessage(messageId) {
    const message = {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
    };
    this.messages.push(message);

    const messageEl = this.renderMessage(message);
    messageEl.innerHTML += '<span class="streaming-cursor">▊</span>';
    this.container.appendChild(messageEl);
}

// Append chunks as they arrive
appendToStreamingMessage(messageId, chunk) {
    const messageEl = document.getElementById(messageId);
    const cursor = messageEl.querySelector('.streaming-cursor');

    // Insert before cursor
    const textNode = document.createTextNode(chunk);
    cursor.parentNode.insertBefore(textNode, cursor);

    this.scrollToBottom();
}

// Finalize when complete
finalizeStreamingMessage(messageId) {
    const messageEl = document.getElementById(messageId);
    const cursor = messageEl.querySelector('.streaming-cursor');
    if (cursor) cursor.remove();
}
```

### API Status Messages

Small, inline status messages without background:

```javascript
addApiStatus(status, details) {
    const statusIcons = {
        'sending': '📤',
        'processing': '⚙️',
        'receiving': '📥',
        'complete': '✅',
        'error': '❌'
    };

    const icon = statusIcons[status] || '📌';
    const text = details ? `${icon} ${details}` : `${icon} ${status}`;

    const statusMsg = {
        role: 'api-status',
        content: text,
        id: 'msg-' + Date.now()
    };

    this.messages.push(statusMsg);
    this.container.appendChild(this.renderMessage(statusMsg));
}
```

**CSS:**
```css
.message.api-status {
    background: transparent;
    color: #9ca3af;
    font-size: 11px;
    padding: 2px 0;
    margin: -4px 0 4px 0;
    opacity: 0.8;
}
```

---

## Migration Guide to Next.js

### Why Migrate?

Current HTML setup issues:
- ❌ Browser caching requires hard refresh
- ❌ Module loading race conditions
- ❌ No TypeScript
- ❌ 2,800+ line single file
- ❌ Manual cache-busting

Next.js benefits:
- ✅ Hot Module Replacement
- ✅ API routes (secure OpenAI calls)
- ✅ React state management
- ✅ TypeScript support
- ✅ Component architecture
- ✅ Built-in routing

### Migration Steps

#### 1. Initialize Next.js Project

```bash
npx create-next-app@latest elementor-json-editor
cd elementor-json-editor

# Install dependencies
npm install @tanstack/react-query
npm install zustand  # State management
npm install monaco-editor-react  # Better JSON editor
npm install @wp-playground/client
```

#### 2. Project Structure

```
elementor-json-editor/
├── app/
│   ├── page.tsx                 # Main chat interface
│   ├── layout.tsx               # Root layout
│   └── api/
│       ├── chat/route.ts        # OpenAI chat endpoint
│       ├── convert/route.ts     # HTML conversion endpoint
│       └── assistant/route.ts   # Assistant API endpoint
├── components/
│   ├── ChatInterface.tsx
│   ├── JsonEditor.tsx
│   ├── HtmlGenerator.tsx
│   ├── JsonConverter.tsx
│   ├── PlaygroundPreview.tsx
│   ├── DebugPanel.tsx
│   └── TokenTracker.tsx
├── lib/
│   ├── openai.ts                # OpenAI client
│   ├── json-patch.ts            # JSON Patch utilities
│   ├── elementor-validator.ts   # JSON validation
│   └── stores/
│       ├── useAppStore.ts       # Global state
│       └── useChatStore.ts      # Chat state
└── public/
    └── playground-worker.js
```

#### 3. Convert Modules to React Components

**ChatInterface.tsx:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useChatStore } from '@/lib/stores/useChatStore';

export function ChatInterface() {
    const { currentJson, setJson } = useAppStore();
    const { messages, addMessage, streamMessage } = useChatStore();
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    async function handleSend() {
        if (!input.trim()) return;

        addMessage({ role: 'user', content: input });
        setInput('');
        setIsStreaming(true);

        // Server-side API call
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                currentJson,
                messages
            })
        });

        // Handle streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let messageId = 'msg-' + Date.now();

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            streamMessage(messageId, chunk);
        }

        setIsStreaming(false);
    }

    return (
        <div className="chat-container">
            <MessageList messages={messages} />
            <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={isStreaming}
            />
        </div>
    );
}
```

**app/api/chat/route.ts:**
```typescript
import { OpenAI } from 'openai';
import { StreamingTextResponse, OpenAIStream } from 'ai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    const { message, currentJson, messages } = await req.json();

    const response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
            { role: 'system', content: 'You are an Elementor JSON editor...' },
            ...messages,
            { role: 'user', content: message }
        ],
        tools: [
            {
                type: 'function',
                function: {
                    name: 'generate_json_patch',
                    description: 'Generate JSON Patch operations',
                    parameters: {
                        type: 'object',
                        properties: {
                            patches: { type: 'array' },
                            summary: { type: 'string' }
                        }
                    }
                }
            }
            // ... other tools
        ],
        stream: true
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
}
```

#### 4. State Management with Zustand

**lib/stores/useAppStore.ts:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    currentJson: any;
    history: any[];
    historyIndex: number;

    setJson: (json: any) => void;
    undo: () => void;
    redo: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            currentJson: null,
            history: [],
            historyIndex: -1,

            setJson: (json) => set((state) => {
                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(json);
                return {
                    currentJson: json,
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                };
            }),

            undo: () => set((state) => {
                if (state.historyIndex > 0) {
                    return {
                        historyIndex: state.historyIndex - 1,
                        currentJson: state.history[state.historyIndex - 1]
                    };
                }
                return state;
            }),

            redo: () => set((state) => {
                if (state.historyIndex < state.history.length - 1) {
                    return {
                        historyIndex: state.historyIndex + 1,
                        currentJson: state.history[state.historyIndex + 1]
                    };
                }
                return state;
            })
        }),
        { name: 'elementor-json-state' }
    )
);
```

#### 5. Monaco Editor for JSON

```typescript
import Editor from '@monaco-editor/react';

export function JsonEditor({ value, onChange }: JsonEditorProps) {
    return (
        <Editor
            height="600px"
            defaultLanguage="json"
            theme="vs-dark"
            value={JSON.stringify(value, null, 2)}
            onChange={(value) => {
                try {
                    const json = JSON.parse(value || '{}');
                    onChange(json);
                } catch (e) {
                    // Invalid JSON
                }
            }}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                formatOnPaste: true,
                formatOnType: true
            }}
        />
    );
}
```

#### 6. Environment Variables

**.env.local:**
```
OPENAI_API_KEY=sk-your-key-here
OPENAI_ASSISTANT_ID=asst_your-assistant-id
OPENAI_VECTOR_STORE_ID=vs_your-vector-store-id
```

**Access in API routes:**
```typescript
const apiKey = process.env.OPENAI_API_KEY;
const assistantId = process.env.OPENAI_ASSISTANT_ID;
```

#### 7. Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel

# Or export static
npm run build
npm run export
```

### Migration Checklist

- [ ] Initialize Next.js project
- [ ] Convert modules to React components
- [ ] Set up API routes for OpenAI calls
- [ ] Implement state management (Zustand)
- [ ] Integrate Monaco Editor
- [ ] Add WordPress Playground component
- [ ] Implement token tracking
- [ ] Set up environment variables
- [ ] Test all features
- [ ] Deploy to Vercel

### Benefits After Migration

1. **No more caching issues** - HMR shows changes instantly
2. **Secure API calls** - Keys stay server-side
3. **Better state management** - React hooks + Zustand
4. **TypeScript** - Catch errors before runtime
5. **Component reusability** - Modular architecture
6. **Better debugging** - React DevTools
7. **SEO-friendly** - Server-side rendering
8. **Easy deployment** - Vercel one-click deploy

---

## Conclusion

This guide covers every feature and implementation detail of the Elementor JSON Editor. Use it as:

1. **Reference** - Look up how specific features work
2. **Migration guide** - Convert to Next.js or other frameworks
3. **Documentation** - Onboard new developers
4. **Architecture guide** - Understand system design

For questions or issues, check:
- [README.md](README.md) - Quick start
- [CLAUDE.md](CLAUDE.md) - AI assistant guidance
- [ASSISTANT_SETUP.md](ASSISTANT_SETUP.md) - Vector store setup

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Author:** Alfonso (with Claude AI)
