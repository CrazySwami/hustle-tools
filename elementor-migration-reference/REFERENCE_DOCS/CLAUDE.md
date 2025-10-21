# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive AI-powered Elementor JSON editor with multiple tools:

1. **Chat Editor** ([hustle-elementor-webapp/chat-editor.html](hustle-elementor-webapp/chat-editor.html)) - Full-featured AI chat interface for editing Elementor JSON (2,800+ lines)
2. **HTML Generator** - Image-to-HTML conversion using Vision AI
3. **JSON Converter** - HTML/CSS/JS to Elementor JSON conversion
4. **WordPress Playground** - Live preview in browser-based WordPress
5. **Standalone Converter** ([html-to-elementor-converter.html](hustle-elementor-webapp/html-to-elementor-converter.html)) - Single-file web app (4,246 lines)
6. **WordPress Plugin** ([hustle-elementor-plugin/](hustle-elementor-plugin/)) - Universal Elementor widget

## Quick Reference

**Complete Feature Documentation:** See [COMPLETE_FEATURES_GUIDE.md](hustle-elementor-webapp/COMPLETE_FEATURES_GUIDE.md) for:
- All features and tools
- Technical implementation details
- Migration guide to Next.js
- API integration patterns
- Architecture explanations

## Architecture

### Core Innovation: Placeholder System

Instead of creating unique widget classes for each HTML section, the system uses:
- **Placeholders**: `{{text_0}}`, `{{color_1}}`, `{{image_2}}` in HTML/CSS/JS
- **Metadata**: JSON describing what each placeholder represents
- **Universal Widget**: Single PHP widget that dynamically generates Elementor controls
- **Runtime Replacement**: Placeholders replaced with user values during render

### Data Flow

```
HTML/CSS/JS Input
  ↓
Web Converter (Browser or AI Mode)
  ↓
Elementor JSON with placeholders
  ↓
WordPress Import
  ↓
Universal Widget renders with dynamic controls
```

## Directory Structure

```
HT-Elementor-Apps/
├── hustle-elementor-webapp/          # Main application
│   ├── chat-editor.html              # AI Chat Editor (2,800+ lines)
│   ├── modules/                      # JavaScript modules
│   │   ├── chat-ui.js               # Message rendering & streaming
│   │   ├── json-editor.js           # JSON syntax highlighting
│   │   ├── json-diff.js             # JSON Patch operations
│   │   ├── openai-client.js         # OpenAI API wrapper
│   │   ├── openai-audio.js          # Whisper voice input
│   │   ├── state-manager.js         # State & history
│   │   └── html-converter.js        # HTML to Elementor conversion
│   ├── styles/
│   │   └── chat-editor-styles.css   # All UI styles
│   ├── token-tracker.js             # Cost tracking widget
│   ├── playground.js                # WordPress Playground integration
│   ├── html-to-elementor-converter.html  # Standalone converter (4,246 lines)
│   ├── setup-assistant.js           # OpenAI Assistant setup
│   ├── COMPLETE_FEATURES_GUIDE.md   # Full documentation
│   └── *.md                         # Other documentation
│
├── hustle-elementor-plugin/          # WordPress plugin
│   ├── custom-html-sections.php     # Main plugin file
│   └── widgets/
│       └── custom-html-section-widget.php # Universal widget
│
└── elementor-source/
    └── elementor-widgets/            # 48 PHP files for AI reference
```

## Chat Editor ([chat-editor.html](hustle-elementor-webapp/chat-editor.html))

### Main Application Features

**🤖 AI Chat Interface**
- Natural language JSON editing with GPT-5
- Function calling for precise operations (JSON Patch)
- Streaming responses character-by-character
- Voice input via Whisper API
- Slash commands for quick tool access (`/search`, `/convert`, etc.)
- Multiple model support (GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-4o)

**🎨 HTML Generator**
- Upload design mockups (desktop/tablet/mobile)
- Vision AI converts images to HTML/CSS/JS
- Live preview with viewport switching
- Iterative refinement via chat
- Desktop preview zoomed out (scale 0.65) for accurate representation
- Send directly to JSON Converter

**⚡ JSON Converter**
- Two modes: Fast (browser-only) and Accurate (AI-powered)
- Extracts computed styles from DOM
- Maps to native Elementor widgets
- Custom prompts for conversion preferences
- Progress tracking with status updates

**📝 JSON Editor**
- Syntax highlighting (color-coded)
- Real-time validation
- Change highlighting after patches
- Undo/redo with Ctrl+Z/Ctrl+Y
- Search functionality
- Auto-save to localStorage (7 days)

**🌐 WordPress Playground**
- Live preview in browser-based WordPress
- WebAssembly-powered (no server needed)
- One-click template import
- Update & reload functionality
- Direct Elementor editor access

**🔍 Debug Panel**
- Collapsible panel (toggle with "🔍 Debug" button)
- Console log interception (auto-captures all logs)
- Session cost tracking
- Token usage details
- Color-coded log levels (info/success/warning/error)

**💰 Token Tracking**
- Real-time cost calculation
- Per-model pricing
- Session statistics
- Detailed usage breakdown
- 24-hour persistence

### Important Technical Notes

**Error Handling:**
- All errors use `safeErrorMessage()` helper to avoid "Cannot convert object to primitive value"
- Global error handlers catch unhandled errors and promise rejections
- Error messages safely extracted even from circular references

**Streaming Implementation:**
- Uses `response.output_text.delta` events from OpenAI
- Typing indicator shown briefly, then hidden before streaming starts
- Character-by-character display for real-time feedback
- Copy button on all messages (appears on hover)

**Model Management:**
- Separate selectors for Chat, HTML Generator, and JSON Converter
- Model changes apply immediately to `openaiClient.model`
- Initial model set from selector value when API key loaded

**State Persistence:**
- Auto-saves to localStorage every change
- Restores state on page load if < 7 days old
- Undo/redo stack managed by StateManager
- History includes all JSON versions

**Key Methods to Know:**
- `handleSendMessage()` - Main chat message handler
- `handleToolCall()` - Executes AI function calls
- `generateHtmlFromImages()` - Vision AI HTML generation
- `convertToElementor()` - HTML to Elementor JSON conversion
- `startPlayground()` - Launch WordPress Playground
- `setupConsoleInterception()` - Debug panel log capture

### Recent Fixes (January 2025)

1. ✅ Fixed duplicate messages after streaming (removed redundant `addMessage()`)
2. ✅ Made API status messages smaller and inline (no background)
3. ✅ Added copy button to all messages (hover to reveal)
4. ✅ Created collapsible debug panel with logs and cost tracking
5. ✅ Removed broken Vision Mode from JSON Converter
6. ✅ Fixed desktop preview zoom (now scales to 65% for accurate view)
7. ✅ Fixed `jsonEditor.set()` → `jsonEditor.setJson()` calls
8. ✅ Fixed `aiDescription` null reference after Vision Mode removal
9. ✅ Added safe error message extraction for all error handlers
10. ✅ Fixed incomplete `generateAiDescription()` function (syntax error)

## Web Converter ([html-to-elementor-converter.html](hustle-elementor-webapp/html-to-elementor-converter.html))

### Key Characteristics
- **Single HTML file**: ~4246 lines, no external dependencies
- **100% client-side**: No build step, runs entirely in browser
- **Two conversion modes**: Browser-only (instant) and AI-enhanced (accurate)
- **Vanilla JavaScript**: No frameworks, pure DOM manipulation

### Conversion Modes

**Browser-Only Mode:**
- Uses regex and DOM parsing
- 100% visual fidelity (wraps everything in custom HTML widget)
- No API calls, completely offline
- Instant conversion (<200ms)

**AI-Enhanced Mode:**
- Converts to native Elementor widgets (heading, button, container, etc.)
- Two backends:
  - **Standard**: GPT-5 with inline property reference (~90% accuracy)
  - **Advanced**: Assistants API with file search of Elementor source (~95% accuracy)
- Extracts computed styles from DOM
- Validates properties against Elementor schema
- Shows animated progress tracker

### Key Functions to Know

When modifying the converter, look for these JavaScript functions:

- `browserConvert()` - Browser-only conversion logic
- `aiConvert()` - Standard AI conversion (GPT-5)
- `aiConvertWithAssistant()` - Advanced AI conversion (Assistants API)
- `extractComputedStyles()` - Gets actual rendered styles from DOM
- `validateElementorJSON()` - Validates output structure
- `generateElementorJSON()` - Builds final JSON structure
- `updateProgressTracker()` - Updates animated progress UI

### Working with the Converter

To test changes:
```bash
# Just open in browser - no build step
open hustle-elementor-webapp/html-to-elementor-converter.html
```

To modify detection logic:
- Browser mode: Search for `browserConvert()` function
- AI mode: Search for `aiConvert()` or `aiConvertWithAssistant()`
- Style extraction: Modify `extractComputedStyles()`

## WordPress Plugin

### Plugin Structure

**Main File**: [hustle-elementor-plugin/custom-html-sections.php](hustle-elementor-plugin/custom-html-sections.php)
- Bootstrap plugin
- Check dependencies (Elementor >= 3.0.0, PHP >= 7.4)
- Register widget with Elementor

**Widget File**: [hustle-elementor-plugin/widgets/custom-html-section-widget.php](hustle-elementor-plugin/widgets/custom-html-section-widget.php)
- Widget name: `custom_html_section`
- Dynamically generates controls from JSON metadata
- Replaces placeholders during render
- Scopes CSS/JS to prevent conflicts

### Key Widget Methods

- `register_controls()` - Creates hidden storage fields + dynamic controls
- `register_dynamic_controls()` - Reads `editable_fields` JSON and generates UI controls
- `render()` - Replaces placeholders and outputs HTML/CSS/JS
- `map_control_type()` - Maps field types to Elementor control types

### Expected JSON Structure

The plugin expects this format from the converter:

```json
{
  "widgetType": "custom_html_section",
  "settings": {
    "html_content": "<h1>{{text_0}}</h1>",
    "css_content": "h1 { color: {{color_0}}; }",
    "js_content": "console.log('Hello');",
    "editable_fields": "{\"text_0\":{\"type\":\"text\",\"label\":\"Heading\",\"default\":\"Welcome\"}}",
    "text_0": "Welcome",
    "color_0": "#000000"
  }
}
```

### Testing the Plugin

Install in WordPress:
```bash
# Copy to WordPress plugins directory
cp -r hustle-elementor-plugin /path/to/wordpress/wp-content/plugins/custom-html-sections/

# Activate via WordPress admin or WP-CLI
wp plugin activate custom-html-sections
```

Debug mode:
```php
// Add to wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// Watch logs
tail -f wp-content/debug.log
```

## OpenAI Assistant Setup

### One-Time Setup for Advanced AI Mode

**Setup Script**: [hustle-elementor-webapp/setup-assistant.js](hustle-elementor-webapp/setup-assistant.js)

Run once to upload Elementor source files:
```bash
export OPENAI_API_KEY=sk-your-key-here
cd hustle-elementor-webapp
node setup-assistant.js
```

This creates:
1. **Vector Store**: Stores 48 Elementor PHP files as embeddings
2. **Assistant**: GPT-4 with file_search tool enabled
3. **Config File**: `assistant-config.json` with IDs

**Important Files**:
- `.env` - Store API key (not committed to git)
- `assistant-config.json` - Generated after setup, contains Assistant ID and Vector Store ID
- `elementor-controls-reference.json` - Manual property mapping for standard mode

### Managing the Assistant

View on OpenAI dashboard:
- Vector Stores: https://platform.openai.com/storage/vector_stores
- Assistants: https://platform.openai.com/assistants

Cost: ~$3/month for vector store storage + ~$0.01-0.03 per conversion

## Development Workflow

### Working on the Web Converter

1. **Make changes** to `html-to-elementor-converter.html`
2. **Test immediately** - just refresh browser (no build step)
3. **Check console** (F12) for errors
4. **Test both modes** - Browser and AI

Key areas to modify:
- **UI/Styling**: Search for `<style>` tag at top
- **HTML Structure**: Search for specific element IDs
- **Conversion Logic**: Search for function names listed above
- **AI Prompts**: Search for `messages:` arrays in AI functions

### Working on the WordPress Plugin

1. **Modify PHP files** in `hustle-elementor-plugin/`
2. **Copy to WordPress** plugins directory
3. **Test in Elementor** editor
4. **Check debug.log** for errors

Common modifications:
- **Add control types**: Modify `map_control_type()` in widget file
- **Change rendering**: Modify `render()` method
- **Add validation**: Modify `register_controls()` or add new methods

### Testing End-to-End

1. **Create HTML** in your code editor
2. **Convert** using web app (browser or AI mode)
3. **Download JSON** file
4. **Import** in WordPress Elementor (Templates → Import)
5. **Edit** in Elementor editor to verify controls work
6. **View** frontend to verify rendering

## Common Tasks

### Add New Control Type to Plugin

Edit `widgets/custom-html-section-widget.php`:

```php
private function map_control_type($type) {
    $map = [
        'text' => \Elementor\Controls_Manager::TEXT,
        'textarea' => \Elementor\Controls_Manager::TEXTAREA,
        'color' => \Elementor\Controls_Manager::COLOR,
        'image' => \Elementor\Controls_Manager::MEDIA,
        'your_new_type' => \Elementor\Controls_Manager::YOUR_CONTROL, // Add here
    ];
    return $map[$type] ?? \Elementor\Controls_Manager::TEXT;
}
```

### Modify AI Conversion Prompt

Edit `html-to-elementor-converter.html`, search for the AI mode function and modify the `messages` array:

```javascript
messages: [{
    role: 'system',
    content: 'Your modified system prompt here...'
}, {
    role: 'user',
    content: `Your modified user prompt with ${html} and ${css}`
}]
```

### Add New Detection in Browser Mode

Edit `html-to-elementor-converter.html`, find `browserConvert()` function:

```javascript
// Add new detection type
doc.querySelectorAll('your-selector').forEach(element => {
    const fieldId = `yourtype_${counter++}`;
    editableFields[fieldId] = {
        type: 'yourtype',
        label: 'Your Label',
        default: element.someValue
    };
    element.someValue = `{{${fieldId}}}`;
});
```

### Update Elementor Property Reference

Edit `elementor-controls-reference.json` to add/update property mappings:

```json
{
  "widget-name": {
    "css-property": {
      "control": "elementor_control_name",
      "selector": "{{WRAPPER}} .element"
    }
  }
}
```

### Re-upload Elementor Files to OpenAI

If Elementor updates or you need to refresh:

```bash
cd hustle-elementor-webapp
export OPENAI_API_KEY=sk-your-key
node setup-assistant.js  # Creates new Assistant + Vector Store
```

Then update the IDs in the converter UI.

## Known Limitations

### Plugin Limitations
- **Not truly native Elementor**: Can't drag/drop elements inside section
- **No per-device responsive controls**: Single set of values for all devices
- **Complex JavaScript may break**: DOM selectors might not match Elementor's containers
- **Images need absolute URLs**: Local paths won't work
- **No PHP/dynamic content**: Pure static HTML/CSS/JS only

### Converter Limitations
- **AI mode requires API key**: Costs money per conversion
- **Browser mode uses custom widget**: Not native Elementor widgets
- **JavaScript not executed in preview**: Security/performance reasons
- **Large files may be slow**: 1000+ lines of HTML takes 20-30s in AI mode

## Security Considerations

### Web Converter
- ⚠️ **XSS risk in preview**: Raw HTML injected into DOM
- ✅ **API keys not stored**: Only in memory during session
- ✅ **No backend**: Can't be exploited server-side

### WordPress Plugin
- ⚠️ **Arbitrary HTML/CSS/JS**: Users can inject any code
- ⚠️ **No sanitization on import**: Trust content creator
- ✅ **Elementor permissions**: Only admins can import templates
- ✅ **No direct DB queries**: Uses Elementor APIs

**Recommendations for Production:**
- Add role restrictions (`manage_options` capability)
- Sanitize HTML on import with HTML Purifier
- Add Content Security Policy headers
- Validate JSON structure before processing

## Debugging

### Web Converter Debug Mode

Open browser console (F12) and look for:
- `[Converter]` logs for conversion steps
- `[AI]` logs for API calls
- `[Validation]` logs for property checking

Enable verbose logging by setting in console:
```javascript
window.DEBUG = true;
```

### WordPress Plugin Debug

Enable WordPress debug mode:
```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Check widget registration:
```php
$widgets = \Elementor\Plugin::instance()->widgets_manager->get_widget_types();
var_dump($widgets['custom_html_section']); // Should exist
```

View widget settings in template:
```php
// In widget render() method
error_log(print_r($this->get_settings_for_display(), true));
```

## Documentation Files

- **[README.md](hustle-elementor-webapp/README.md)** - Overview and features
- **[QUICK_START.md](hustle-elementor-webapp/QUICK_START.md)** - 2-minute setup guide
- **[ASSISTANT_SETUP.md](hustle-elementor-webapp/ASSISTANT_SETUP.md)** - Advanced AI setup
- **[VIEWING_FILES_ON_OPENAI.md](VIEWING_FILES_ON_OPENAI.md)** - Manage OpenAI files
- **[claude_md_webapp.md](hustle-elementor-webapp/claude_md_webapp.md)** - Detailed webapp architecture
- **[claude_md_plugin.md](hustle-elementor-plugin/claude_md_plugin.md)** - Detailed plugin architecture

## Performance Notes

**Conversion Times:**
- Browser mode: 10-200ms (instant)
- AI standard mode: 5-10 seconds
- AI advanced mode: 10-20 seconds (file search adds latency)

**File Sizes:**
- Converter HTML: 4246 lines (~150KB)
- Plugin: ~200 lines total
- Elementor source: 48 files (~2.5MB)

**Memory:**
- Converter: Runs in browser, no backend memory
- Plugin: +2MB per widget instance on page

## Important Constants

### Plugin
```php
CHS_VERSION      // Plugin version
CHS_PLUGIN_DIR   // Plugin directory path
CHS_PLUGIN_URL   // Plugin URL
```

### Widget Name
```
custom_html_section  // Must match in JSON widgetType
```

### Placeholder Format
```
{{field_id}}  // Double curly braces, no spaces
```

### API Endpoints
```
https://api.openai.com/v1/chat/completions          // Standard mode
https://api.openai.com/v1/assistants/{id}/...       // Advanced mode
```

## Best Practices

1. **Always test end-to-end** after changes (converter → JSON → WordPress → render)
2. **Use browser mode for rapid iteration** before committing to AI mode changes
3. **Keep assistant-config.json backup** (contains your OpenAI IDs)
4. **Monitor API costs** in OpenAI dashboard
5. **Update both documentation files** when making architecture changes (claude_md_*.md)
6. **Test with simple HTML first** before complex layouts
7. **Check validation warnings** - they help improve accuracy
8. **Use meaningful field IDs** - helps with debugging

## Git Workflow

**Not committed:**
- `.env` (API keys)
- `assistant-config.json` (optional, user-specific)
- `node_modules/` (if added)
- WordPress files (plugin is standalone)

**Should be committed:**
- Web converter HTML file
- Setup scripts
- Reference JSON files
- Documentation
- Plugin PHP files

## Support Resources

- **Elementor Developer Docs**: https://developers.elementor.com/
- **OpenAI API Docs**: https://platform.openai.com/docs
- **OpenAI Assistants Guide**: https://platform.openai.com/docs/assistants
- **WordPress Plugin Handbook**: https://developer.wordpress.org/plugins/
