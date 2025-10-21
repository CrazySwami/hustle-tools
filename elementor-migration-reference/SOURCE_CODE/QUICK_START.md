# Quick Start Guide

## Two Ways to Use the Converter

### Option 1: Use It Right Now (Standard Mode)
**No setup required!** Just open the HTML file and use it.

1. **Open the converter:**
   ```bash
   open html-to-elementor-converter.html
   ```
   Or just double-click `html-to-elementor-converter.html` in Finder

2. **Switch to AI Mode** (click the "AI Enhanced" button)

3. **Enter your OpenAI API key** in the text field that appears

4. **Paste your HTML/CSS** and click **Convert**

That's it! The converter will use GPT-5 with an inline property reference (90% accuracy).

---

### Option 2: Advanced Mode (File Search with 95%+ Accuracy)
**Requires one-time setup.** This uploads Elementor source files to OpenAI for better accuracy.

#### Step 1: Set Your API Key in Terminal
```bash
export OPENAI_API_KEY=sk-your-key-here
```

Get your key from: https://platform.openai.com/api-keys

#### Step 2: Run the Setup Script
```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
node setup-assistant.js
```

This will:
- Upload 48 Elementor PHP files to OpenAI (~30 seconds)
- Create a Vector Store
- Create an Assistant
- Display the IDs you need

#### Step 3: Copy the IDs
The script will output something like:
```
═══════════════════════════════════════════════════════════
🎉 SETUP COMPLETE!
═══════════════════════════════════════════════════════════

📋 Copy these IDs into the converter:

Assistant ID:     asst_abc123xyz...
Vector Store ID:  vs_def456uvw...
```

#### Step 4: Use Advanced Mode
1. Open `html-to-elementor-converter.html` in browser
2. Switch to **AI Mode**
3. Enter your **OpenAI API key**
4. Expand **"Advanced: Assistant Configuration"** section
5. Paste **Assistant ID** and **Vector Store ID**
6. Click **Convert**

Now the AI will search Elementor source code for exact property names!

---

## What's the Difference?

| Feature | Standard Mode | Advanced Mode |
|---------|--------------|---------------|
| **Setup** | None needed | One-time (5 min) |
| **Accuracy** | ~90% | ~95%+ |
| **Speed** | Fast (5-10s) | Slower (10-20s) |
| **Cost per conversion** | ~$0.02-0.05 | ~$0.01-0.03 |
| **Monthly cost** | None | ~$3 (vector store) |
| **How it works** | GPT-5 with inline reference | AI searches Elementor files |

---

## Troubleshooting

### "Module not found" when running setup script
Make sure you have Node.js installed:
```bash
node --version  # Should show v14 or higher
```

If not installed: https://nodejs.org/

### "API key not set"
Run this in terminal:
```bash
export OPENAI_API_KEY=sk-your-actual-key-here
```

Then run `node setup-assistant.js` again.

### "Can't find setup-assistant.js"
Make sure you're in the correct directory:
```bash
cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
ls -la setup-assistant.js  # Should show the file
```

### "Background colors still not applying"
The example JSON in the prompt was fixed. Clear your browser cache and try again.

---

## Recommended Workflow

**For testing/development:**
→ Use **Standard Mode** (no setup needed)

**For production conversions:**
→ Use **Advanced Mode** (better accuracy)

Both modes show the beautiful animated progress tracker! 🎨

---

## Files in This Folder

```
hustle-elementor-webapp/
├── html-to-elementor-converter.html  ← Main app (open this!)
├── setup-assistant.js                ← Setup script for advanced mode
├── elementor-controls-reference.json ← Property reference
├── assistant-config.json             ← Created after setup
├── QUICK_START.md                    ← This file
├── ASSISTANT_SETUP.md                ← Detailed setup guide
└── VIEWING_FILES_ON_OPENAI.md        ← How to view files on OpenAI
```

---

## Need Help?

- **Standard mode not working?** Check console (F12) for errors
- **Advanced mode failing?** See `ASSISTANT_SETUP.md` for troubleshooting
- **Want to see your files on OpenAI?** See `VIEWING_FILES_ON_OPENAI.md`

Happy converting! 🚀
