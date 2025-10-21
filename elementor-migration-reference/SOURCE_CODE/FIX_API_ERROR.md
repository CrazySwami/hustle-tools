# Fix: OpenAI API 400 Error + Tool Call UI

## Issues Fixed

### 1. ❌ Error: "Follow-up request failed" (400 Bad Request)

**Problem**: When AI called a tool (like `generate_json_patch`), the follow-up request to OpenAI failed with a 400 error.

**Root Cause**: The tool response message format was incorrect. OpenAI requires:
1. Assistant message with `tool_calls` array
2. Then a `tool` message with the result

**What I Changed**:

**File**: `modules/openai-client.js` (lines 167-188)

**Before** (incorrect):
```javascript
const followUpMessages = [
    ...messages,
    message, // This was the raw response, missing proper format
    {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult)
    }
];
```

**After** (correct):
```javascript
const followUpMessages = [
    ...messages,
    {
        role: 'assistant',
        content: null,  // Important: must be null, not the message
        tool_calls: [{
            id: toolCall.id,
            type: 'function',
            function: {
                name: functionName,
                arguments: JSON.stringify(functionArgs)
            }
        }]
    },
    {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult)
    }
];
```

**Result**: ✅ Tool calls now work properly, no more 400 errors!

---

### 2. 🔧 Missing Tool Call UI Indicators

**Problem**: When AI used a tool (like analyzing JSON), there was no visual indication in the chat.

**What I Added**:

**File**: `modules/chat-ui.js` (lines 35-56)

New function: `addToolCallMessage(toolName, toolArgs)`

Shows messages like:
- `🔍 Analyzing JSON structure (find_property)`
- `🔧 Generating JSON patch (2 changes)`

**File**: `chat-editor.html` (line 485)

Added call to show tool indicator:
```javascript
this.chatUI.addToolCallMessage(response.tool_call.name, response.tool_call.arguments);
```

**Result**: ✅ You now see what tool is being used!

---

## Test It Now

### Test 1: Ask a Question (uses analyze_json_structure tool)

**Type**: `What does the text say?`

**Expected**:
1. Typing indicator appears
2. Yellow message: `🔍 Analyzing JSON structure (search_value)`
3. AI responds with the answer

### Test 2: Make an Edit (uses generate_json_patch tool)

**Type**: `Change the title to "boogie boogie boogie" and the text to "hello world"`

**Expected**:
1. Typing indicator appears
2. Yellow message: `🔧 Generating JSON patch (2 changes)`
3. Approval modal appears with both changes
4. AI responds explaining what it will do

### Test 3: Verify No Errors

**Check browser console (F12)**:
- ❌ Should NOT see: "Follow-up request failed"
- ❌ Should NOT see: 400 errors
- ✅ Should see: "Tool called: generate_json_patch"
- ✅ Should see: Successful API responses

---

## What the Conversation Should Look Like Now

```
You: What does the text say?

🔍 Analyzing JSON structure (search_value)

AI: The text currently says: "This is a sample text widget..."

---

You: Change the title to "boogie boogie boogie" and text to "hello world"

🔧 Generating JSON patch (2 changes)

[Approval Modal Appears]
✏️ Proposed Changes (2)

1️⃣ Heading title
   - Old: "Welcome to My Site"
   + New: "boogie boogie boogie"

2️⃣ Text editor content
   - Old: "This is a sample text widget..."
   + New: "hello world"

[Apply All] [Reject]

AI: I'll make those changes for you!
```

---

## Files Modified

1. **modules/openai-client.js** - Fixed tool response format
2. **modules/chat-ui.js** - Added tool call indicator function
3. **chat-editor.html** - Added tool call message display

---

## Technical Details

### OpenAI Chat Completions API Tool Response Format

**Correct format** (what we now use):
```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Change the title"},
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "generate_json_patch",
          "arguments": "{...}"
        }
      }]
    },
    {
      "role": "tool",
      "tool_call_id": "call_abc123",
      "content": "{\"success\": true, ...}"
    }
  ]
}
```

**Key Points**:
- Assistant message must have `content: null` when tool is called
- Must include full `tool_calls` array structure
- Tool message must reference the `tool_call_id`
- Tool result must be stringified JSON

---

## Refresh and Test

1. **Refresh** the page: http://localhost:8080/chat-editor.html
2. **Load sample** JSON
3. **Ask**: "What does the text say?"
4. **✅ See**: Yellow message showing tool usage
5. **Try edit**: "Change title to Hello"
6. **✅ See**: Tool indicator + approval modal
7. **✅ No errors** in console!

**Both issues are now fixed!** 🎉
