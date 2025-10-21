# 🛠️ Complete Guide to OpenAI Tool Calling (Function Calling)

## What is Tool Calling?

**Tool calling** (formerly "function calling") is OpenAI's way of letting AI models interact with external functions/tools. Instead of just generating text, the AI can **call specific functions** with structured JSON parameters.

### How It Works (Simple Explanation)

1. **You define tools** as JSON schemas describing what they do
2. **Send message to OpenAI** along with your tool definitions
3. **AI decides** if it needs to use a tool based on the user's request
4. **AI returns** either:
   - Regular text response, OR
   - A "tool call" with function name + JSON arguments
5. **Your code executes** the tool with those arguments
6. **Send tool result back** to AI for final response

### Think of it like this:
```
User: "Change the heading to red"

OpenAI thinks: "I need to modify JSON, I have a tool for that!"

OpenAI returns: {
    tool_name: "generate_json_patch",
    arguments: {
        patches: [{ op: "replace", path: "/content/0/settings/title_color", value: "#ff0000" }],
        summary: "Change heading color to red"
    }
}

Your code: Executes the JSON patch operation

Result: Heading color updated! ✅
```

---

## Current Tools in Chat Editor

### 1. **`generate_json_patch`** 🔧
**Purpose**: Generate surgical JSON edits using RFC 6902 JSON Patch standard

**When AI uses it**: User wants to modify the JSON

**Parameters**:
```json
{
    "patches": [
        {
            "op": "replace",      // or "add", "remove"
            "path": "/content/0/settings/title_color",
            "value": "#ff0000"
        }
    ],
    "summary": "Human-readable description of changes"
}
```

**Example Request**: "Change the heading color to blue"

**What happens**:
1. AI generates patch operations
2. Shows approval UI in chat
3. User clicks "Apply Changes"
4. JSON updated with precise changes

---

### 2. **`analyze_json_structure`** 🔍
**Purpose**: Answer questions about the JSON without modifying it

**When AI uses it**: User asks "what", "where", "how many", etc.

**Parameters**:
```json
{
    "query_type": "find_property",  // or "list_widgets", "get_widget_info", "search_value"
    "target": "title_color"
}
```

**Example Requests**:
- "What widgets do I have?"
- "Where is the button color defined?"
- "How many heading elements are there?"

**What happens**:
1. AI analyzes the JSON structure
2. Returns information directly in chat
3. No modifications made

---

### 3. **`open_template_in_playground`** 🌐
**Purpose**: Launch or refresh WordPress Playground with current template

**When AI uses it**: User wants to preview/view the template

**Parameters**:
```json
{
    "action": "launch",        // or "refresh", "open_editor"
    "message": "Optional message to user"
}
```

**Example Requests**:
- "Show me the template"
- "Open this in playground"
- "Refresh the preview"

**What happens**:
1. Switches to Playground tab
2. Launches/refreshes WordPress
3. Imports current JSON template
4. Opens Elementor editor

---

## Tool Definition Structure

Every tool is defined as a **JSON schema** following OpenAI's format:

```javascript
{
    type: 'function',
    function: {
        name: 'tool_name',                    // Unique identifier
        description: 'What this tool does',   // AI uses this to decide when to use it
        parameters: {                         // JSON Schema for arguments
            type: 'object',
            properties: {
                param_name: {
                    type: 'string',           // string, number, array, object, boolean
                    description: 'What this parameter is for',
                    enum: ['option1', 'option2']  // Optional: restrict to specific values
                }
            },
            required: ['param_name']          // Which parameters are mandatory
        }
    }
}
```

---

## How to Add a New Tool

### Step 1: Define the Tool in `openai-client.js`

```javascript
// In modules/openai-client.js, defineTools() method:

{
    type: 'function',
    function: {
        name: 'your_new_tool',
        description: 'Clear description of when to use this tool',
        parameters: {
            type: 'object',
            properties: {
                your_param: {
                    type: 'string',
                    description: 'What this parameter does'
                }
            },
            required: ['your_param']
        }
    }
}
```

### Step 2: Handle the Tool Call in `chat-editor.html`

```javascript
// In handleToolCall() method:

if (toolCall.name === 'your_new_tool') {
    this.chatUI.addMessage('assistant', assistantMessage);
    await this.handleYourNewTool(toolCall.arguments);
}
```

### Step 3: Implement the Tool Logic

```javascript
// Add method to ChatEditorApp class:

async handleYourNewTool(args) {
    try {
        const param = args.your_param;
        // Your tool logic here
        this.chatUI.addSystemMessage('✅ Tool executed successfully!');
    } catch (error) {
        this.chatUI.addSystemMessage(`❌ Error: ${error.message}`);
    }
}
```

### Step 4: Update System Prompt (Optional)

```javascript
// In openai-client.js, getSystemPrompt():

Available actions:
- "your use case" → use your_new_tool with action: 'value'
```

---

## Example: Adding a "Save Template" Tool

### 1. Define Tool
```javascript
{
    type: 'function',
    function: {
        name: 'save_template',
        description: 'Save the current JSON template with a custom name',
        parameters: {
            type: 'object',
            properties: {
                filename: {
                    type: 'string',
                    description: 'Name for the template file (without .json extension)'
                },
                description: {
                    type: 'string',
                    description: 'Optional description of what this template is for'
                }
            },
            required: ['filename']
        }
    }
}
```

### 2. Handle Tool Call
```javascript
if (toolCall.name === 'save_template') {
    this.chatUI.addMessage('assistant', assistantMessage);
    await this.handleSaveTemplate(toolCall.arguments);
}
```

### 3. Implement Logic
```javascript
async handleSaveTemplate(args) {
    const filename = args.filename + '.json';
    const blob = new Blob(
        [JSON.stringify(this.stateManager.currentJson, null, 2)], 
        { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    this.chatUI.addSystemMessage(`✅ Saved as ${filename}`);
}
```

### 4. User Can Now Say:
- "Save this template as hero-section"
- "Save this with the name footer-v2"

---

## Tool Ideas You Could Add

### 🎨 **Design Tools**
- `apply_color_scheme` - Apply a color palette across all widgets
- `set_responsive_breakpoints` - Configure mobile/tablet/desktop settings
- `duplicate_widget` - Clone a widget with modifications

### 📊 **Analysis Tools**
- `validate_accessibility` - Check WCAG compliance
- `analyze_performance` - Estimate page load impact
- `count_elements` - Count specific widget types

### 🔄 **Import/Export Tools**
- `import_from_url` - Load template from URL
- `export_to_format` - Convert to other formats (HTML, PDF)
- `create_backup` - Save version history

### 🖼️ **Media Tools**
- `optimize_images` - Compress images in template
- `find_broken_links` - Check for dead URLs
- `update_image_urls` - Bulk update image sources

### 🤖 **AI Enhancement Tools**
- `generate_alt_text` - AI-generated image descriptions
- `improve_copy` - Rewrite widget text for better UX
- `suggest_layout` - AI layout recommendations

---

## Best Practices

### ✅ DO:
- Write clear, specific tool descriptions
- Use descriptive parameter names
- Validate tool inputs
- Handle errors gracefully
- Provide user feedback
- Keep tools focused on one task

### ❌ DON'T:
- Make tools that do too many things
- Use vague descriptions
- Forget error handling
- Make required params that should be optional
- Hardcode values that should be parameters

---

## Debugging Tools

### Check if AI is calling tools:
```javascript
console.log('Tool called:', toolCall);
console.log('Function name:', toolCall.name);
console.log('Arguments:', toolCall.arguments);
```

### Test tool manually:
```javascript
// In browser console:
const args = { patches: [...], summary: "Test" };
window.app.handleToolCall({ name: 'generate_json_patch', arguments: args }, "Test message");
```

---

## Tool Call Flow Diagram

```
┌─────────────────────────────────────────┐
│  User: "Change heading to red"         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  OpenAI Chat Completions API            │
│  - Receives message + tool definitions  │
│  - Analyzes intent                      │
│  - Decides to use generate_json_patch   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Returns: tool_call object              │
│  {                                      │
│    name: "generate_json_patch",         │
│    arguments: {                         │
│      patches: [...],                    │
│      summary: "..."                     │
│    }                                    │
│  }                                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  handleToolCall() in chat-editor.html   │
│  - Routes to correct handler            │
│  - Executes tool logic                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Shows approval UI in chat              │
│  User clicks "Apply Changes"            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  applyPatch() executes JSON changes     │
│  ✅ Success message shown               │
└─────────────────────────────────────────┘
```

---

## Current Tool Registry

| Tool Name | Type | When Used | Approval Required |
|-----------|------|-----------|-------------------|
| `generate_json_patch` | Modification | User wants to edit JSON | ✅ Yes (shows diff) |
| `analyze_json_structure` | Query | User asks questions | ❌ No |
| `open_template_in_playground` | Action | User wants to preview | ❌ No |

---

## Cost Considerations

**Tool calls don't cost extra** - you only pay for:
- Input tokens (message + tool definitions + conversation history)
- Output tokens (AI response + tool call JSON)

**Tip**: Keep tool descriptions concise to save tokens!

---

## Resources

- [OpenAI Function Calling Docs](https://platform.openai.com/docs/guides/function-calling)
- [JSON Patch RFC 6902](https://jsonpatch.com/)
- [OpenAI Cookbook - Function Calling](https://cookbook.openai.com/examples/how_to_call_functions_with_chat_models)

---

**Status**: ✅ Complete guide
**Last Updated**: January 14, 2025
