# 🎨 Global Stylesheet Feature

## ✅ **What It Does:**

The Global Stylesheet feature allows you to define reusable environment defaults (brand colors, fonts, spacing, etc.) that:
- ✅ Apply to all your designs in the live preview
- ✅ Are sent to AI for context when converting
- ✅ Can be edited in real-time
- ✅ Can be toggled on/off
- ✅ Use CSS variables for consistency

---

## 🎯 **Use Cases:**

### **1. Brand Consistency**
Define your brand colors once, use everywhere:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

Then in your CSS:
```css
.button {
  background: var(--primary-color);
}
```

### **2. Design System**
Create a complete design system:
```css
:root {
  /* Typography Scale */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  
  /* Spacing System */
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

### **3. AI Context**
When AI generates code, it knows your environment:
```
AI sees:
- Your brand colors
- Your font preferences
- Your spacing system
- Your design tokens

AI generates code that matches YOUR environment!
```

---

## 📐 **Default Global Stylesheet:**

### **Loaded on startup:**

```css
:root {
  /* Brand Colors */
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #f59e0b;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --background: #ffffff;
  --background-alt: #f9fafb;
  
  /* Typography */
  --font-primary: 'Inter', -apple-system, sans-serif;
  --font-heading: 'Inter', -apple-system, sans-serif;
  --font-mono: 'Monaco', 'Menlo', monospace;
  
  /* Font Sizes */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;
  --text-5xl: 48px;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-primary);
  color: var(--text-color);
  line-height: 1.6;
}
```

---

## 🎨 **How to Use:**

### **1. Toggle On/Off**
☑ Check "🎨 Use Global Stylesheet (Environment Defaults)"

### **2. Edit Styles**
Click in the textarea and edit:
- Change colors
- Update fonts
- Modify spacing
- Add new variables

### **3. See Live Preview**
Preview updates in real-time as you type!

### **4. Convert with Context**
When you convert, AI knows your environment:
```
"Generate a button using my brand colors"
→ AI uses --primary-color from your global stylesheet
```

---

## 💡 **Example Workflow:**

### **Step 1: Define Your Brand**
```css
:root {
  --brand-primary: #FF6B6B;
  --brand-secondary: #4ECDC4;
  --brand-dark: #2C3E50;
}
```

### **Step 2: Write HTML**
```html
<div class="card">
  <h2>Our Services</h2>
  <button>Learn More</button>
</div>
```

### **Step 3: Write CSS Using Variables**
```css
.card {
  background: var(--brand-primary);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
}

button {
  background: var(--brand-secondary);
  color: white;
  padding: var(--space-md) var(--space-xl);
}
```

### **Step 4: Preview**
See it render with your brand colors!

### **Step 5: Convert**
AI knows your brand and generates matching Elementor JSON!

---

## 🔧 **Technical Details:**

### **How It Works:**

1. **In Preview:**
```javascript
// Global stylesheet prepended to preview
previewBox.innerHTML = 
  '<style>' + globalStylesheet + '</style>' +
  '<style>' + userCSS + '</style>' +
  userHTML;
```

2. **In AI Conversion:**
```javascript
// Global stylesheet sent as context
prompt = `
GLOBAL ENVIRONMENT STYLESHEET (use these defaults):
${globalStylesheet}

HTML: ${html}
CSS: ${css}
...
`;
```

3. **Real-Time Updates:**
```javascript
// Listens to changes
globalStylesheet.addEventListener('input', updateLivePreview);
```

---

## 📋 **Features:**

| Feature | Status | Details |
|---------|--------|---------|
| **Toggle On/Off** | ✅ | Checkbox to enable/disable |
| **Editable** | ✅ | Full textarea editor |
| **Real-Time Preview** | ✅ | Updates as you type |
| **AI Context** | ✅ | Sent to AI on conversion |
| **CSS Variables** | ✅ | Full CSS custom properties support |
| **Persists** | ✅ | Stays loaded during session |
| **Default Loaded** | ✅ | Pre-filled with design system |

---

## 🎓 **Best Practices:**

### **1. Use CSS Variables**
```css
/* Good */
--primary: #667eea;
.button { background: var(--primary); }

/* Avoid */
.button { background: #667eea; }
```

### **2. Create a System**
```css
/* Sizes follow a scale */
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;

/* Spacing follows multiples of 4 */
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
```

### **3. Semantic Naming**
```css
/* Good */
--primary-color
--text-color
--heading-font

/* Avoid */
--blue
--big-text
--font1
```

### **4. Document Your System**
```css
:root {
  /* Primary brand color - used for CTAs and links */
  --primary-color: #667eea;
  
  /* Secondary brand color - used for accents */
  --secondary-color: #764ba2;
}
```

---

## 🔄 **Real-Time Workflow:**

```
1. Edit global stylesheet
   ↓
2. Preview updates instantly
   ↓
3. Edit HTML/CSS using variables
   ↓
4. Preview updates with global styles applied
   ↓
5. Convert with AI
   ↓
6. AI receives global stylesheet as context
   ↓
7. AI generates code matching your environment
```

---

## 💰 **Benefits:**

### **1. Consistency**
- All designs use same colors
- Spacing is consistent
- Typography follows system

### **2. Speed**
- Don't redefine colors every time
- Use variables instead of values
- Copy/paste system across projects

### **3. AI Alignment**
- AI generates code using YOUR colors
- AI follows YOUR spacing system
- AI uses YOUR fonts

### **4. Maintainability**
- Change one variable, update everywhere
- Easy to rebrand
- Single source of truth

---

## 📊 **Example: Before vs After**

### **Without Global Stylesheet:**
```css
/* Repeat colors everywhere */
.hero { background: #667eea; }
.button { background: #667eea; }
.link { color: #667eea; }

/* Inconsistent spacing */
.card { padding: 20px; }
.section { padding: 25px; }
```

### **With Global Stylesheet:**
```css
/* Global */
:root {
  --primary: #667eea;
  --space-lg: 24px;
}

/* Usage */
.hero { background: var(--primary); }
.button { background: var(--primary); }
.link { color: var(--primary); }
.card { padding: var(--space-lg); }
.section { padding: var(--space-lg); }
```

---

## ✅ **Summary:**

**What you got:**
- ✅ Editable global stylesheet
- ✅ Toggle on/off
- ✅ Real-time preview updates
- ✅ AI receives as context
- ✅ Pre-loaded with design system
- ✅ Full CSS variable support
- ✅ Updates all features automatically

**Location:**
- Above HTML/CSS inputs
- Always visible
- Fully editable
- Can be toggled off if not needed

---

**Last Updated:** October 14, 2025  
**Status:** Fully operational ✅
