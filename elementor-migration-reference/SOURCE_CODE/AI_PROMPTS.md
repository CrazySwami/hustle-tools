# 🤖 AI Conversion Prompts - Complete Documentation

## 📍 Location

**File**: `ai-converter.js`  
**Function**: `aiConvert()` (lines 5-100)  
**Prompt**: Lines 12-57

---

## 📝 The Complete Prompt

```javascript
const prompt = `You are an expert at converting HTML/CSS to Elementor JSON format.

TASK: Convert the following HTML/CSS into Elementor widget structure.

HTML:
${html}

CSS:
${css}

INSTRUCTIONS:
1. Identify appropriate Elementor widgets (heading, text-editor, button, image, etc.)
2. Extract styles and map them to Elementor settings
3. Return ONLY valid JSON (no markdown)

RESPONSE FORMAT:
{
  "widgets": [
    {
      "widgetType": "heading",
      "settings": {
        "title": "Text here",
        "align": "center",
        "title_color": "#000000",
        "typography_typography": "custom",
        "typography_font_size": {"size": 48, "unit": "px"}
      }
    }
  ]
}

WIDGET TYPES AVAILABLE:
- heading: For h1-h6 tags
- text-editor: For paragraphs and text content
- button: For buttons and call-to-action links
- image: For img tags
- spacer: For spacing/dividers
- divider: For hr tags

IMPORTANT:
- Always set typography_typography: "custom" before typography properties
- Always set background_background: "classic" or "gradient" before background colors
- Use hex colors (#RRGGBB format)
- Font sizes as {"size": number, "unit": "px"}

Respond with ONLY the JSON, no explanations.`;
```

---

## 🎯 Prompt Breakdown

### **1. Role Definition**
```
You are an expert at converting HTML/CSS to Elementor JSON format.
```
**Purpose**: Establishes AI's expertise and context

### **2. Task Statement**
```
TASK: Convert the following HTML/CSS into Elementor widget structure.
```
**Purpose**: Clear objective

### **3. Input Data**
```javascript
HTML:
${html}

CSS:
${css}
```
**Purpose**: Injects your actual HTML and CSS code

### **4. Instructions (3 Steps)**
```
1. Identify appropriate Elementor widgets
2. Extract styles and map them to Elementor settings
3. Return ONLY valid JSON (no markdown)
```
**Purpose**: Processing steps for AI

### **5. Response Format Example**
Shows AI exactly how to structure the JSON response with a concrete example.

### **6. Widget Type Mapping**
```
- heading: For h1-h6 tags
- text-editor: For paragraphs and text content
- button: For buttons and call-to-action links
- image: For img tags
- spacer: For spacing/dividers
- divider: For hr tags
```
**Purpose**: Maps HTML elements to Elementor widget types

### **7. Critical Rules (IMPORTANT section)**
```
- Always set typography_typography: "custom" before typography properties
- Always set background_background: "classic" or "gradient" before background colors
- Use hex colors (#RRGGBB format)
- Font sizes as {"size": number, "unit": "px"}
```
**Purpose**: Ensures proper Elementor property activation and formatting

---

## 🔧 How to Customize the Prompt

### **Location to Edit**
```javascript
// In ai-converter.js, line 12:
const prompt = `Your custom prompt here...`;
```

### **Common Customizations**

#### **1. Add More Widget Types**
```javascript
WIDGET TYPES AVAILABLE:
- heading: For h1-h6 tags
- text-editor: For paragraphs and text content
- button: For buttons and call-to-action links
- image: For img tags
- video: For video embeds           // ADD THIS
- google_maps: For maps             // ADD THIS
- icon: For icon elements           // ADD THIS
- spacer: For spacing/dividers
- divider: For hr tags
```

#### **2. Add Custom Style Rules**
```javascript
IMPORTANT:
- Always set typography_typography: "custom" before typography properties
- Always set background_background: "classic" or "gradient" before background colors
- Use hex colors (#RRGGBB format)
- Font sizes as {"size": number, "unit": "px"}
- Extract padding/margin as {top, right, bottom, left}  // ADD THIS
- Convert all colors to uppercase hex                   // ADD THIS
```

#### **3. Request More Detail**
```javascript
RESPONSE FORMAT:
{
  "widgets": [
    {
      "widgetType": "heading",
      "settings": { ... },
      "analysis": "Why this widget was chosen",  // ADD THIS
      "confidence": 0.95                         // ADD THIS
    }
  ]
}
```

#### **4. Add Specific Brand Guidelines**
```javascript
BRAND GUIDELINES:
- Primary color: #667eea
- Secondary color: #764ba2
- Default font: "Inter", sans-serif
- Always use brand colors when detecting gradients
```

---

## 📊 API Request Details

### **Model Used**
```javascript
model: 'gpt-5-2025-08-07'
```

### **Parameters**
```javascript
{
    model: 'gpt-5-2025-08-07',
    messages: [{
        role: 'user',
        content: prompt  // The prompt above
    }],
    temperature: 0.3,    // Low = more focused/consistent
    max_tokens: 8000     // Maximum response length
}
```

### **Temperature Explained**
- **0.3** = Conservative, consistent, predictable
- **0.7** = Balanced creativity and accuracy
- **1.0** = Maximum creativity (not recommended for JSON)

---

## 🎨 How the AI Processes Your Code

### **Step 1: HTML Analysis**
```html
<h1 style="color: blue;">Welcome</h1>
```

AI identifies:
- Element type: `h1` → Widget: `heading`
- Text content: "Welcome"
- Inline style: `color: blue`

### **Step 2: CSS Extraction**
```css
h1 {
    font-size: 48px;
    text-align: center;
}
```

AI extracts:
- Font size → `typography_font_size: {size: 48, unit: "px"}`
- Alignment → `align: "center"`

### **Step 3: Property Mapping**
AI knows Elementor requires:
```javascript
{
  "widgetType": "heading",
  "settings": {
    "title": "Welcome",                        // From HTML content
    "align": "center",                         // From CSS text-align
    "title_color": "#0000ff",                  // From inline style (blue → hex)
    "typography_typography": "custom",         // Required activation flag!
    "typography_font_size": {size: 48, unit: "px"}
  }
}
```

### **Step 4: JSON Generation**
AI wraps in proper format:
```javascript
{
  "widgets": [
    { /* widget 1 */ },
    { /* widget 2 */ }
  ]
}
```

---

## 🧪 Example Conversions

### **Example 1: Simple Heading**

**Input:**
```html
<h1>Hello World</h1>
```
```css
h1 { color: #ff0000; font-size: 36px; }
```

**AI Output:**
```json
{
  "widgets": [{
    "widgetType": "heading",
    "settings": {
      "title": "Hello World",
      "title_color": "#ff0000",
      "typography_typography": "custom",
      "typography_font_size": {"size": 36, "unit": "px"}
    }
  }]
}
```

### **Example 2: Button**

**Input:**
```html
<button>Click Me</button>
```
```css
button {
  background: #667eea;
  color: white;
  padding: 16px 32px;
  border-radius: 8px;
}
```

**AI Output:**
```json
{
  "widgets": [{
    "widgetType": "button",
    "settings": {
      "text": "Click Me",
      "background_background": "classic",
      "background_color": "#667eea",
      "button_text_color": "#ffffff",
      "border_radius": {"size": 8, "unit": "px", "top": 8, "right": 8, "bottom": 8, "left": 8, "isLinked": true}
    }
  }]
}
```

### **Example 3: Gradient Container**

**Input:**
```html
<div class="hero">
  <h1>Welcome</h1>
  <p>Build amazing sites</p>
</div>
```
```css
.hero {
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 80px;
  text-align: center;
}
```

**AI Output:**
```json
{
  "widgets": [{
    "widgetType": "container",
    "settings": {
      "background_background": "gradient",
      "background_gradient_type": "linear",
      "background_gradient_angle": {"unit": "deg", "size": 135},
      "background_gradient_color": "#667eea",
      "background_gradient_color_b": "#764ba2",
      "padding": {"unit": "px", "top": 80, "right": 80, "bottom": 80, "left": 80, "isLinked": true}
    }
  }]
}
```

---

## ⚙️ Advanced Prompt Engineering

### **Make AI More Accurate**
Add this to the prompt:
```
ACCURACY REQUIREMENTS:
- Color precision: Must match EXACTLY
- Font size precision: Use computed values, not defaults
- Spacing precision: Extract exact pixel values
- Never guess - only extract what's explicitly defined
```

### **Make AI More Creative**
Add this:
```
ENHANCEMENT RULES:
- Suggest improved typography when fonts are basic
- Add subtle shadows for depth
- Recommend complementary colors
- Optimize spacing for better visual hierarchy
```

### **Add Validation**
```
VALIDATION:
- Verify all required Elementor properties are set
- Check that activation flags precede dependent properties
- Ensure all colors are valid hex codes
- Confirm all sizes have units
```

---

## 📈 Prompt Optimization Tips

### **1. Be Specific**
❌ "Convert this to Elementor"  
✅ "Convert this HTML/CSS into Elementor widget structure"

### **2. Use Examples**
Always include a concrete example of desired output

### **3. Set Constraints**
"Return ONLY valid JSON (no markdown)" prevents unwanted formatting

### **4. Use Clear Sections**
TASK, INSTRUCTIONS, FORMAT, IMPORTANT - makes prompt scannable

### **5. Prioritize Critical Rules**
Use IMPORTANT, CRITICAL, REQUIRED for key instructions

---

## 🔍 Debugging AI Responses

### **Check Console**
```javascript
console.log('Raw AI response:', aiResponse);
```

### **Validate JSON**
```javascript
try {
    const parsed = JSON.parse(jsonString);
    console.log('✅ Valid JSON:', parsed);
} catch (error) {
    console.error('❌ Invalid JSON:', error);
}
```

### **Common Issues**

**Problem**: AI returns markdown  
**Solution**: Emphasize "no markdown" in prompt

**Problem**: Missing activation flags  
**Solution**: Add more examples showing flags in IMPORTANT section

**Problem**: Wrong widget types  
**Solution**: Add more specific HTML → widget mapping rules

---

## 💡 Pro Tips

1. **Keep prompts under 2000 tokens** - More efficient, faster responses
2. **Use concrete examples** - AI learns better from examples than rules
3. **Test incrementally** - Start simple, add complexity gradually
4. **Version your prompts** - Save different versions for A/B testing
5. **Monitor costs** - Each conversion costs ~$0.02-0.05

---

## 🎓 Further Customization

To create domain-specific converters, modify the prompt for:
- **E-commerce**: Add product, cart, checkout widgets
- **Forms**: Add form field mapping
- **Galleries**: Add image gallery configurations
- **Landing pages**: Add CTA-specific optimizations

---

**The prompt is the brain of AI conversion - customize it to fit your exact needs!** 🚀
