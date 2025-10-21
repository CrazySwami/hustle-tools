# 🚀 **Quick Start Guide**

## 📋 **Requirements:**

1. ✅ OpenAI API Key (GPT-5 access)
2. ✅ Modern web browser (Chrome, Firefox, Safari, Edge)
3. ✅ Python 3 (pre-installed on Mac)

---

## 🔧 **Setup (One Time):**

### **Step 1: Add Your API Key to .env**

Edit the `.env` file:
```
OPENAI_API_KEY=sk-your-actual-key-here
ASSISTANT_ID=asst_... (optional)
VECTOR_STORE_ID=vs_... (optional)
```

**Already done!** ✅ Your .env file is configured.

---

## 🚀 **How to Run:**

### **Option A: Use the Start Script (Easiest)** ⭐

**Double-click:**
```
start.sh
```

Or in Terminal:
```bash
./start.sh
```

**Then open in browser:**
```
http://localhost:8000
```

---

### **Option B: Manual Python Server**

**Terminal:**
```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
python3 -m http.server 8000
```

**Browser:**
```
http://localhost:8000
```

---

## ⚠️ **IMPORTANT: Do NOT Open index.html Directly**

**❌ This will NOT work:**
```
Double-clicking index.html
Opening with: file:///Users/.../index.html
```

**Why:** Browser security blocks .env file loading from file:// protocol.

**✅ Always use a web server (http://localhost:8000)**

---

## ✅ **Verify .env is Loaded:**

1. **Open http://localhost:8000**
2. **Press F12** (open console)
3. **Look for:**
   ```
   ✅ Environment variables loaded
   📋 API Key: ***R3ZLl1hB
   ```
4. **Click ⚙️ API Settings**
5. **Should show your API key pre-filled**

---

## 🎯 **Usage:**

1. **Start server** (./start.sh)
2. **Open** http://localhost:8000
3. **Paste HTML/CSS**
4. **Click** 🚀 CONVERT TO ELEMENTOR JSON
5. **Watch** JSON stream in real-time
6. **Download** or test in Elementor

---

## 🔑 **Features:**

- ✅ **AI-Powered Conversion** (GPT-5)
- ✅ **Vision Mode** (screenshot analysis)
- ✅ **Streaming Responses** (real-time)
- ✅ **Editable Prompts** (customize AI behavior)
- ✅ **JSON Refinement** (AI-powered edits)
- ✅ **WordPress Playground** (test live)
- ✅ **Global Stylesheet** (brand defaults)

---

## 🛑 **To Stop Server:**

Press `Ctrl + C` in Terminal

---

## 📝 **Quick Start (Copy-Paste):**

```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
./start.sh
```

**Then open:** http://localhost:8000

---

## 🆘 **Troubleshooting:**

### **"Permission Denied" when running start.sh**
```bash
chmod +x start.sh
./start.sh
```

### **".env not loading"**
- ✅ Must use http://localhost (not file://)
- ✅ Check console for "Environment variables loaded"
- ✅ Verify .env file exists in same folder

### **"API Key not working"**
- ✅ Check key starts with `sk-proj-` or `sk-`
- ✅ Verify key in .env file (no quotes)
- ✅ Restart server after editing .env

### **"Port 8000 already in use"**
```bash
# Use different port
python3 -m http.server 8001
# Then open: http://localhost:8001
```

---

## 📂 **Project Structure:**

```
hustle-elementor-webapp/
├── index.html          # Main app
├── main.js             # Core logic
├── ai-converter.js     # AI conversion
├── env-loader.js       # .env loader
├── .env                # Your API keys ✅
├── start.sh            # Start script ⭐
└── README_SETUP.md     # This file
```

---

## 🎊 **You're Ready!**

Run:
```bash
./start.sh
```

Open:
```
http://localhost:8000
```

**Start converting!** 🚀

---

**Need help? Check START_SERVER.md for detailed server options.**
