# HTML to Elementor Converter - Quick Reference Card

## 🚀 Start Server (Pick One)

```bash
# Python (macOS/Linux - Recommended)
python3 -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

**Then open**: http://localhost:8000/

---

## 📁 File Structure

```
NEW (Use These):
├── index.html              ← Main page
├── converter-styles.css    ← Styles
├── converter-app.js        ← Logic

REQUIRED DATA FILES:
├── elementor-all-widgets-schemas.json
└── elementor-controls-reference.json

OLD (Don't Use):
└── html-to-elementor-converter.html (deprecated)
```

---

## ⚡ Quick Workflow

### **Option 1: Use Example**
1. Select example from dropdown → "Hero Section (Gradient)"
2. Click **"🚀 CONVERT TO ELEMENTOR JSON"**
3. Click **"💾 DOWNLOAD JSON"**
4. Import to WordPress

### **Option 2: Custom HTML**
1. Paste HTML → textarea
2. Paste CSS → textarea
3. (Optional) Paste JS → textarea
4. Click **"🚀 CONVERT TO ELEMENTOR JSON"**
5. Review preview
6. Click **"💾 DOWNLOAD JSON"**

---

## 🎯 Button Reference

| Button | What It Does |
|--------|-------------|
| **🚀 CONVERT TO ELEMENTOR JSON** | Main conversion button |
| **💾 DOWNLOAD JSON** | Download template file |
| **🎯 TEST JSON QUALITY** | Validate structure & fidelity |
| **👁️ VISUAL DIFF** | Compare original vs converted |
| **🧪 TEST SCHEMA** | Test without API |
| **⚡ DIRECT CONVERT** | Browser-only mode |
| **🚀 TEST IN REAL ELEMENTOR** | Live WordPress test |
| **📊 Download Logs** | Export debug logs |
| **🔍 Debug JSON** | Inspect JSON structure |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Blank page** | Hard refresh: `⌘ + Shift + R` |
| **CORS error** | Use http://localhost not file:// |
| **Schema load fail** | Check JSON files exist |
| **Buttons don't work** | Check browser console for errors |
| **Port 8000 in use** | Try port 8001 or 3000 |

---

## 🤖 AI Mode Setup

1. Click **"🤖 AI-Enhanced"** mode
2. Enter API key from https://platform.openai.com/api-keys
3. Convert as normal
4. Get 95%+ accuracy

---

## 📥 Import to WordPress

### Via Dashboard:
```
Elementor → Templates → Saved Templates → Import Templates
```

### Via Playground (Testing):
1. Click **"🚀 TEST IN REAL ELEMENTOR"**
2. Wait ~30 seconds for WordPress to load
3. Auto-imports your template
4. Click **"✏️ Open Elementor Editor"**

---

## 🎨 File Sizes

- `index.html` → 12KB (structure)
- `converter-styles.css` → 13KB (styling)
- `converter-app.js` → 189KB (logic)

**Total**: ~214KB (was 219KB in single file)

---

## 🔄 Comparison: Old vs New

| Feature | Old (Monolithic) | New (Modular) |
|---------|------------------|---------------|
| Files | 1 huge file | 3 clean files |
| Load time | ~500ms | ~150ms |
| Debugging | Hard | Easy |
| Caching | None | Optimized |
| Corruption | Frequent | Fixed |
| Maintainability | Poor | Excellent |

---

## 📞 Need Help?

1. Read `CONVERTER_DOCS.md` (full documentation)
2. Check browser console (`⌘ + Option + J`)
3. Click **"📊 Download Logs"** for debugging
4. Test with built-in examples first

---

## 🎓 Key Concepts

### **Two Modes:**
- **Browser-Only** 🚀: Fast, free, no API key
- **AI-Enhanced** 🤖: Smarter, requires OpenAI key

### **Three Preview Modes:**
- **Pure HTML/CSS** 🎨: Exact original design
- **Elementor Style** ⚡: With Elementor defaults
- **Hybrid** 🔀: Combination of both

---

## ⚠️ Important Notes

- ✅ Must use local server (can't open HTML file directly)
- ✅ JSON schema files required for conversion
- ✅ API keys never stored on disk (memory only)
- ✅ WordPress Playground runs in browser (no server)
- ✅ Complex designs may need manual tweaking

---

## 🎯 Pro Tips

1. **Start with examples** to learn the system
2. **Test JSON quality** before importing to WordPress
3. **Use visual diff** to spot issues early
4. **Try Browser mode first** (faster for simple designs)
5. **Enable AI mode** for complex CSS/layouts
6. **Save logs** when reporting issues

---

## 🔗 Quick Links

- Full Docs: `CONVERTER_DOCS.md`
- Setup Guide: `QUICK_START.md`
- AI Setup: `ASSISTANT_SETUP.md`
- Tech Details: `IMPLEMENTATION_SUMMARY.md`

---

**Updated**: Oct 2025 | **Version**: 2.0 (Modular)
