# 🚀 **HOW TO LOAD .ENV FILE**

## ❌ **Problem:**

When you open `index.html` directly in the browser (double-click), the **.env file cannot be loaded** due to browser security (CORS policy).

**File protocol blocks fetch:**
```
file:///Users/.../index.html → ❌ Cannot fetch .env
```

---

## ✅ **Solution: Run a Local Web Server**

You need to serve the files through HTTP (not file://) for .env to load.

---

### **Option 1: Python Server (Easiest)** 🐍

**Open Terminal in the project folder and run:**

```bash
# Navigate to project
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp

# Start Python server (Python 3)
python3 -m http.server 8000
```

**Then open in browser:**
```
http://localhost:8000
```

✅ **Your .env will now load!**

---

### **Option 2: Node.js http-server** 📦

**If you have Node.js:**

```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to project
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp

# Start server
http-server -p 8000
```

**Then open:**
```
http://localhost:8000
```

---

### **Option 3: VS Code Live Server** 💻

**If using VS Code:**

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"
4. Automatically opens at `http://127.0.0.1:5500`

✅ **.env will load automatically!**

---

### **Option 4: PHP Server** 🐘

**If you have PHP:**

```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
php -S localhost:8000
```

**Open:**
```
http://localhost:8000
```

---

## 🔍 **How to Verify .env is Loaded:**

1. **Open browser console** (F12 or ⌘+Option+I)
2. **Look for:**
   ```
   ✅ Environment variables loaded
   📋 API Key: ***R3ZLl1hB (last 8 chars shown)
   📋 Assistant ID: asst_cNXLjNGQpF5dr3fIt57EfHIA
   📋 Vector Store ID: vs_68e7e1eac024819185c1a822d78d19f4
   ```

3. **Open API Settings modal**
4. **Should show:**
   - Input pre-filled with your API key (hidden as `sk-...`)
   - Assistant ID and Vector Store ID filled

---

## 🎯 **Recommended: Python Server**

**Easiest and always available on Mac:**

```bash
# Step 1: Open Terminal
⌘ + Space → type "Terminal" → Enter

# Step 2: Navigate to project
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp

# Step 3: Start server
python3 -m http.server 8000

# Step 4: Open browser
# Go to: http://localhost:8000
```

**Keep Terminal open while using the app!**

---

## 🛑 **To Stop Server:**

Press `Ctrl + C` in the Terminal

---

## 💡 **Why This is Needed:**

**Browser Security (CORS):**
- ❌ `file://` protocol → Cannot fetch local files
- ✅ `http://` protocol → Can fetch files from same origin

**Your .env file needs HTTP to be fetched by JavaScript!**

---

## 🔒 **Security Note:**

The .env file is only accessible when:
- ✅ Running on localhost
- ✅ On your local machine
- ❌ NOT accessible from internet
- ❌ NOT included in production builds

**Safe for local development!**

---

## 📋 **Quick Start (Copy-Paste):**

```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp && python3 -m http.server 8000
```

**Then open:** http://localhost:8000

**Done!** 🎊

---

## ✅ **After Starting Server:**

1. **.env loads automatically**
2. **API Settings shows your key**
3. **Can convert HTML to JSON**
4. **All features work**

---

**Start the server and your .env will load!** 🚀
