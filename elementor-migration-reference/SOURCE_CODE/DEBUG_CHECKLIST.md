# Debug Checklist

## Test Each Feature One by One

### 1. Slash Commands Test
1. Open chat-editor.html in browser
2. Click in chat input
3. Type `/`
4. **Expected:** Menu appears above input with 6 commands
5. **Check console for:** Any JavaScript errors
6. **If not working:** Check if `handleSlashInput` is being called

**Debug steps:**
- Open browser console (F12)
- Type: `window.app.handleSlashInput({ target: { value: '/' } })`
- Should show the menu

### 2. Streaming Test
1. Send a simple message like "hi"
2. **Expected:** Text appears character by character
3. **Check console for:**
   - "✍️ Text delta (output_text): Yes"
   - "🎯 Calling onStreamChunk callback with: Yes"
   - If you see delta logs but NO callback logs = callback not set
   - If you see NO delta logs = wrong event type

**Debug steps:**
- Before sending message, type: `console.log('Callback set?', !!window.app.openaiClient.onStreamChunk)`
- Should be `false` before send, `true` during send

### 3. Token Tracking Test
1. Send message
2. Wait for response
3. **Expected:** Token tracker widget updates with cost
4. **Check console for:**
   - "💰 Usage data captured: {input_tokens: X, output_tokens: Y}"
   - "💰 Token usage tracked:"

**Debug steps:**
- After response, type: `console.log(window.trackTokenUsage)`
- Should be a function
- Type: `window.trackTokenUsage({ model: 'gpt-5-2025-08-07', inputTokens: 100, outputTokens: 50, type: 'test', success: true })`
- Should update the widget

### 4. Tab Switching Test
1. Click "🎨 HTML Generator" tab
2. **Expected:** Tab content loads, no errors
3. **Check console for:**
   - "Tab button #htmlgenTab not found" = HTML has wrong ID
   - "Tab view #htmlgenView not found" = HTML has wrong ID

**Debug steps:**
- Type: `console.log(document.querySelector('#htmlGenTab'), document.querySelector('#htmlgenView'))`
- Should return two elements, not null

---

## Most Likely Issues

### Issue 1: Streaming Not Working
**Cause:** Callback is being set AFTER the API call starts
**Solution:** The callback needs to be set BEFORE calling sendMessage

### Issue 2: Token Tracking Showing Zero
**Cause:** usage.response.usage location is wrong
**Solution:** Log the full chunkData in response.completed event to see exact structure

### Issue 3: Slash Menu Not Appearing
**Cause:** Missing `position: relative` on parent (FIXED) or Z-index issue
**Solution:** Check computed styles on `.slash-command-menu`

### Issue 4: Tabs Not Switching
**Cause:** Tab IDs don't match selectors
**Solution:** Verify `htmlGenTab` vs `htmlgenTab` casing

---

## Quick Verification Commands

Paste these in browser console:

```javascript
// 1. Check if slash commands are defined
console.log('Slash commands:', window.app.slashCommands.length);

// 2. Check if callback handler exists
console.log('Slash input handler:', typeof window.app.handleSlashInput);

// 3. Check if streaming callback is set
console.log('Stream callback:', typeof window.app.openaiClient?.onStreamChunk);

// 4. Check if token tracker is loaded
console.log('Token tracker:', typeof window.trackTokenUsage);

// 5. Check if tabs exist
console.log('HTML Gen tab:', !!document.querySelector('#htmlGenTab'));
console.log('HTML Gen view:', !!document.querySelector('#htmlgenView'));
```

---

## Next.js Migration?

Given these persistent issues with the HTML setup:
- Module loading order
- Callback timing
- Event handler registration
- File caching

**Recommendation:** Migrate to Next.js where:
- Components mount predictably
- State management is clearer
- No cache issues with hot reload
- TypeScript catches these bugs

Would take 4-6 hours but solve all these problems permanently.
