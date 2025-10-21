# 🔧 Environment Variable Configuration

## ✅ **What Changed:**

The app now loads API credentials from the `.env` file by default. The settings modal is only needed when you want to override these defaults with different credentials.

---

## 📁 **.env File Structure:**

```env
OPENAI_API_KEY=sk-proj-...
ASSISTANT_ID=asst_...
VECTOR_STORE_ID=vs_...
```

### **What Each Does:**

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-5 | ✅ Yes (for AI mode) |
| `ASSISTANT_ID` | Your Assistant ID (for RAG/advanced features) | ❌ Optional |
| `VECTOR_STORE_ID` | Your Vector Store ID (for RAG/advanced features) | ❌ Optional |

---

## 🎯 **How It Works:**

### **1. On Page Load:**
```javascript
1. env-loader.js loads .env file
2. Parses KEY=VALUE pairs
3. Stores in window.ENV global object
4. Available throughout app
```

### **2. When Converting:**
```javascript
// Uses .env by default
const apiKey = getApiKey();
// Returns: window.ENV.OPENAI_API_KEY

// Unless overridden in settings modal
// Then returns: modal override value
```

### **3. Priority Order:**
```
1. Settings Modal Override (if provided)
   ↓
2. .env File Values (default)
   ↓
3. Empty string (if neither exists)
```

---

## ⚙️ **Settings Modal Behavior:**

### **Before (Old Way):**
- Had to enter API key every time
- No persistence
- Manual entry required

### **After (New Way):**
- Loads from .env automatically
- Only open modal to override
- Placeholders show what's loaded from .env
- Can test with different keys without changing .env

---

## 🎨 **Using the Modal:**

### **Open Settings:**
Click "⚙️ Configure API Settings" button (in AI mode)

### **You'll See:**
```
OpenAI API Key
[Using .env: ***CMI8R-T3]  ← Shows last 8 chars from .env

Assistant ID
[Using .env: asst_cNXLjNGQpF5dr3fIt57EfHIA]  ← Shows full ID from .env

Vector Store ID
[Using .env: vs_68e7e1eac024819185c1a822d78d19f4]  ← Shows full ID from .env
```

### **To Override:**
1. Type new value in field
2. Click "💾 Save Settings"
3. App uses your override instead of .env

### **To Clear Override:**
1. Delete text from field
2. Click "💾 Save Settings"
3. App reverts to .env defaults

---

## 💡 **Use Cases:**

### **Use Case 1: Personal Development**
```
.env file:
OPENAI_API_KEY=sk-proj-YOUR_PERSONAL_KEY
ASSISTANT_ID=asst_YOUR_ASSISTANT
VECTOR_STORE_ID=vs_YOUR_STORE

Settings modal: Empty (uses .env)
```

### **Use Case 2: Testing Different Assistants**
```
.env file:
OPENAI_API_KEY=sk-proj-YOUR_KEY
ASSISTANT_ID=asst_PRODUCTION  ← Default
VECTOR_STORE_ID=vs_PRODUCTION  ← Default

Settings modal:
ASSISTANT_ID=asst_TESTING  ← Override for testing
VECTOR_STORE_ID=vs_TESTING  ← Override for testing
```

### **Use Case 3: Multiple API Keys**
```
.env file:
OPENAI_API_KEY=sk-proj-PERSONAL  ← Default

Settings modal:
OPENAI_API_KEY=sk-proj-CLIENT  ← Client project key
```

---

## 🔒 **Security:**

### **.env File:**
```gitignore
# Add to .gitignore
.env
```

**Important:** Never commit .env file to git!

### **Best Practices:**
1. Keep .env file local only
2. Don't share your .env file
3. Use different keys for dev/prod
4. Rotate keys regularly

---

## 🔧 **Technical Implementation:**

### **env-loader.js:**
```javascript
// Loads .env file
fetch('.env')
→ Parses KEY=VALUE pairs
→ Stores in window.ENV object
→ Available globally
```

### **Helper Functions:**
```javascript
getApiKey()
→ Check modal override first
→ Fallback to window.ENV.OPENAI_API_KEY
→ Return value

getAssistantId()
→ Check modal override first
→ Fallback to window.ENV.ASSISTANT_ID
→ Return value

getVectorStoreId()
→ Check modal override first
→ Fallback to window.ENV.VECTOR_STORE_ID
→ Return value
```

### **Usage in Code:**
```javascript
// AI Conversion
const apiKey = getApiKey();
await window.aiConvert(html, css, js, apiKey);

// Screenshot Description
const apiKey = getApiKey();
fetch('https://api.openai.com/v1/chat/completions', {
    headers: { 'Authorization': 'Bearer ' + apiKey }
});
```

---

## 📋 **Setup Instructions:**

### **1. Create/Edit .env File:**
```bash
# In project root
nano .env
```

### **2. Add Your Credentials:**
```env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
ASSISTANT_ID=asst_YOUR_ASSISTANT_ID
VECTOR_STORE_ID=vs_YOUR_VECTOR_STORE_ID
```

### **3. Save and Close:**
```bash
Ctrl+O (save)
Enter
Ctrl+X (exit)
```

### **4. Refresh Browser:**
```
⌘ + R
```

### **5. Check Console:**
```
✅ Environment variables loaded
📋 API Key: ***CMI8R-T3
📋 Assistant ID: asst_cNXLjNGQpF5dr3fIt57EfHIA
📋 Vector Store ID: vs_68e7e1eac024819185c1a822d78d19f4
```

---

## 🐛 **Troubleshooting:**

### **.env Not Loading:**
**Check:**
1. File is named exactly `.env` (not `.env.txt`)
2. File is in project root (same directory as index.html)
3. Check browser console for errors
4. Hard refresh: `⌘ + Shift + R`

### **API Key Not Working:**
**Check:**
1. Key starts with `sk-`
2. No extra spaces in .env file
3. Key is valid on OpenAI platform
4. Check console: `console.log(window.ENV)`

### **Modal Shows Wrong Values:**
**Check:**
1. Hard refresh browser
2. Clear browser cache
3. Check .env file format (KEY=VALUE with no spaces)

---

## 🎓 **Best Practices:**

### **1. Development Workflow:**
```
1. Set up .env with personal keys
2. Work normally (keys auto-load)
3. No need to open settings
4. Keys persist across sessions
```

### **2. Testing Workflow:**
```
1. .env has production keys
2. Open settings modal
3. Enter test keys as override
4. Test features
5. Clear overrides when done
```

### **3. Team Workflow:**
```
1. Share .env.example (without real keys)
2. Each team member creates own .env
3. Adds their personal keys
4. Never commits .env to git
```

---

## 📝 **.env.example Template:**

Create this file for your team:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Optional: Advanced Features
ASSISTANT_ID=asst_YOUR_ASSISTANT_ID_HERE
VECTOR_STORE_ID=vs_YOUR_VECTOR_STORE_ID_HERE
```

---

## ✅ **Summary:**

### **What You Get:**
- ✅ API keys load from .env automatically
- ✅ No manual entry needed each time
- ✅ Settings modal only for overrides
- ✅ Placeholders show .env values
- ✅ Priority: Override → .env → Empty
- ✅ Secure (keep .env local only)

### **Files Modified:**
1. **`.env`** - Added proper labels (OPENAI_API_KEY, ASSISTANT_ID, VECTOR_STORE_ID)
2. **`env-loader.js`** - New file to load .env
3. **`index.html`** - Load env-loader.js before main.js
4. **`main.js`** - Helper functions (getApiKey, getAssistantId, getVectorStoreId)
5. **Settings Modal** - Shows .env values as placeholders

### **Workflow:**
```
.env file has defaults
    ↓
Auto-loads on page load
    ↓
Use normally (no settings needed)
    ↓
Override in modal only when needed
    ↓
Clear override to revert to .env
```

---

**Last Updated:** October 14, 2025  
**Status:** Fully operational ✅
