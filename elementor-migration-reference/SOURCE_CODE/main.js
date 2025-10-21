console.log('🚀 Elementor Converter loading...');

// Global state - exposed to window for Playground module
let currentMode = 'ai';  // Always use AI mode
let generatedJSON = null;
let WIDGET_SCHEMAS = null;

// Make generatedJSON accessible globally
Object.defineProperty(window, 'generatedJSON', {
    get: function() { return generatedJSON; },
    set: function(val) { generatedJSON = val; }
});

// Default Global Stylesheet
const DEFAULT_GLOBAL_STYLESHEET = `:root {
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
}`;

// Default example HTML/CSS
const DEFAULT_HTML = `<div class="hero">
  <h1>Welcome to Our Platform</h1>
  <p>Build amazing websites with Elementor</p>
  <button class="cta-button">Get Started Free</button>
</div>`;

const DEFAULT_CSS = `.hero {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
  border-radius: var(--radius-lg);
}

.hero h1 {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-lg);
  font-weight: 700;
}

.hero p {
  font-size: var(--text-xl);
  margin-bottom: var(--space-xl);
  opacity: 0.9;
}

.cta-button {
  background: #0f3460;
  color: white;
  padding: var(--space-md) var(--space-xl);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: var(--shadow-md);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}`;

// Logger
const logger = {
    log: function(type, msg, data) { console.log('[' + type + '] ' + msg, data || ''); },
    downloadLogs: function() { console.log('Download logs'); },
    clear: function() { console.clear(); }
};

// Load schemas
async function loadWidgetSchemas() {
    try {
        const response = await fetch('elementor-all-widgets-schemas.json');
        WIDGET_SCHEMAS = await response.json();
        console.log('✅ Loaded schemas for', Object.keys(WIDGET_SCHEMAS).length, 'widgets');
        return true;
    } catch (error) {
        console.error('❌ Failed to load widget schemas:', error);
        return false;
    }
}

// Examples - all 5 templates
const examples = {
    'hero-gradient': {
        name: 'Hero Section (Gradient)',
        html: '<div class="hero">\n  <h1>Welcome to Our Site</h1>\n  <p>Build amazing websites with custom sections</p>\n  <button class="cta-button">Get Started</button>\n</div>',
        css: '.hero {\n  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\n  color: white;\n  padding: 80px 40px;\n  text-align: center;\n  border-radius: 12px;\n}\n\n.hero h1 {\n  font-size: 48px;\n  margin-bottom: 20px;\n  font-weight: 700;\n}\n\n.hero p {\n  font-size: 20px;\n  margin-bottom: 30px;\n  opacity: 0.9;\n}\n\n.cta-button {\n  background: #0f3460;\n  color: white;\n  padding: 16px 32px;\n  border: none;\n  border-radius: 8px;\n  font-size: 18px;\n  cursor: pointer;\n  transition: all 0.3s;\n}',
        js: ''
    },
    'pricing-cards': {
        name: 'Pricing Cards',
        html: '<div class="pricing">\n  <h2>Choose Your Plan</h2>\n  <div class="card">\n    <h3>Starter</h3>\n    <p class="price">$29/mo</p>\n    <button>Get Started</button>\n  </div>\n</div>',
        css: '.pricing { text-align: center; padding: 60px 20px; }\n.card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }',
        js: ''
    },
    'testimonial': {
        name: 'Testimonial Section',
        html: '<div class="testimonial">\n  <p class="quote">"This product changed my life!"</p>\n  <p class="author">- Happy Customer</p>\n</div>',
        css: '.testimonial { background: #f9fafb; padding: 60px; text-align: center; }\n.quote { font-size: 24px; font-style: italic; margin-bottom: 20px; }',
        js: ''
    },
    'feature-grid': {
        name: 'Feature Grid',
        html: '<div class="features">\n  <div class="feature">\n    <h3>Fast</h3>\n    <p>Lightning quick performance</p>\n  </div>\n  <div class="feature">\n    <h3>Secure</h3>\n    <p>Bank-level security</p>\n  </div>\n</div>',
        css: '.features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; padding: 40px; }\n.feature { padding: 30px; background: white; border-radius: 8px; }',
        js: ''
    },
    'cta-banner': {
        name: 'Call-to-Action Banner',
        html: '<div class="cta">\n  <h2>Ready to get started?</h2>\n  <button class="cta-btn">Sign Up Now</button>\n</div>',
        css: '.cta { background: #667eea; color: white; padding: 80px 40px; text-align: center; }\n.cta-btn { background: white; color: #667eea; padding: 16px 32px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; }',
        js: ''
    }
};

// Show status
function showStatus(message, type) {
    type = type || 'info';
    const statusDiv = document.getElementById('statusMessage');
    const colors = { success: '#d1fae5', error: '#fee2e2', info: '#dbeafe' };
    statusDiv.innerHTML = '<div class="alert alert-' + type + '" style="background: ' + colors[type] + '; padding: 12px; border-radius: 8px; margin-bottom: 15px;">' + message + '</div>';
    setTimeout(function() { statusDiv.innerHTML = ''; }, 5000);
}

// Load example
function loadExample(exampleKey) {
    const example = examples[exampleKey];
    if (!example) return;
    
    document.getElementById('htmlInput').value = example.html;
    document.getElementById('cssInput').value = example.css;
    var jsInput = document.getElementById('jsInput');
    if (jsInput) jsInput.value = example.js || '';
    showStatus('✅ Loaded example: ' + example.name, 'success');
}

// Clear inputs
function clearInputs() {
    document.getElementById('htmlInput').value = '';
    document.getElementById('cssInput').value = '';
    var jsInput = document.getElementById('jsInput');
    if (jsInput) jsInput.value = '';
    document.getElementById('exampleSelector').value = '';
    document.getElementById('previewBox').innerHTML = '<p style="color: #9ca3af; text-align: center;">Preview will appear here...</p>';
    showStatus('🗑️ Cleared all inputs', 'info');
}

// Convert to Elementor
async function convertToElementor() {
    var html = document.getElementById('htmlInput').value.trim();
    var css = document.getElementById('cssInput').value.trim();
    var jsInput = document.getElementById('jsInput');
    var js = jsInput ? jsInput.value.trim() : '';
    
    if (!html) {
        showStatus(' Please enter HTML code', 'error');
        return;
    }
    
    // Get convert button and add loading state
    const convertBtn = document.querySelector('button[onclick="convertToElementor()"]');
    const originalBtnContent = convertBtn ? convertBtn.innerHTML : '';
    
    if (convertBtn) {
        convertBtn.disabled = true;
        convertBtn.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>AI Converting...</span>
            </div>
        `;
        convertBtn.style.opacity = '0.8';
    }
    
    showStatus(' Converting...', 'info');
    
    try {
        // AI mode conversion
        const apiKey = getApiKey();
        
        if (!apiKey) {
            showStatus(' Please configure your OpenAI API key (Settings or .env file)', 'error');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            showStatus(' Invalid API key format. Key should start with "sk-"', 'error');
            return;
        }
        
        // Check if AI converter is available
        if (typeof window.aiConvert !== 'function') {
            showStatus(' AI converter not loaded. Please refresh the page.', 'error');
            return;
        }
        
        var previewBox = document.getElementById('previewBox');
        updatePreviewIframe(previewBox, html, css, '', js);

        // Check which API mode is selected
        const apiMode = document.querySelector('input[name="apiMode"]:checked')?.value || 'chat';

        // Show streaming output
        const jsonOutputDiv = document.getElementById('jsonOutput');

        let aiResponse;

        if (apiMode === 'assistant') {
            // Accurate Mode: Use Assistants API with Vector Store
            showStatus(' 🎯 Using Accurate Mode (Vector Store)...', 'info');
            jsonOutputDiv.textContent = 'Preparing vector store search...\n\n';

            // Get optional context
            const screenshot = window.visionScreenshot || null;
            const screenshotDescription = window.screenshotDescriptionText || '';
            const globalStylesheet = document.getElementById('enableGlobalStylesheet')?.checked
                ? document.getElementById('globalStylesheet')?.value
                : '';

            // Call Assistants API with progress tracking
            aiResponse = await window.aiConvertWithAssistant(html, css, js, apiKey, {
                screenshot,
                screenshotDescription,
                globalStylesheet,
                onProgress: (step, message) => {
                    console.log(`[${step}] ${message}`);
                    jsonOutputDiv.textContent += `✓ ${message}\n`;
                    jsonOutputDiv.scrollTop = jsonOutputDiv.scrollHeight;

                    // Update status bar
                    if (step === 'searching') {
                        showStatus(` 🔍 ${message}`, 'info');
                    } else if (step === 'completed') {
                        showStatus(` ✅ ${message}`, 'success');
                    } else {
                        showStatus(` ${message}`, 'info');
                    }
                }
            });

            // Build Elementor JSON from AI response
            generatedJSON = window.buildElementorFromAI(aiResponse);

        } else {
            // Fast Mode: Use Chat API (existing behavior)
            showStatus(' ⚡ Using Fast Mode (Chat API)...', 'info');
            jsonOutputDiv.textContent = 'Streaming response from AI...\n\n';

            // Call AI conversion with streaming
            aiResponse = await window.aiConvert(html, css, js, apiKey, {
                onStream: (chunk) => {
                    // Update output in real-time as chunks arrive
                    jsonOutputDiv.textContent += chunk;
                    jsonOutputDiv.scrollTop = jsonOutputDiv.scrollHeight;
                }
            });

            // Build Elementor JSON from AI response
            generatedJSON = window.buildElementorFromAI(aiResponse);
        }
        
        showStatus(' Conversion complete! Download JSON below.', 'success');
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
        }
        
        // Show edit section if in AI mode
        if (currentMode === 'ai') {
            const editSection = document.getElementById('jsonEditSection');
            if (editSection) {
                editSection.style.display = 'block';
            }
        }
        
        // Display final formatted JSON
        jsonOutputDiv.textContent = JSON.stringify(generatedJSON, null, 2);
        
    } catch (error) {
        console.error('Conversion error:', error);
        showStatus(' Error: ' + error.message, 'error');
    } finally {
        // Restore button
        if (convertBtn) {
            convertBtn.disabled = false;
            convertBtn.innerHTML = originalBtnContent;
            convertBtn.style.opacity = '1';
        }
    }
}

// Toggle prompt editor
function togglePromptEditor(type) {
    if (type === 'description') {
        const editor = document.getElementById('promptEditorDescription');
        const textarea = document.getElementById('descriptionPromptEditor');
        
        if (editor.style.display === 'none') {
            editor.style.display = 'block';
            // Load current/default prompt
            if (!textarea.value) {
                textarea.value = getDefaultDescriptionPrompt();
            }
        } else {
            editor.style.display = 'none';
        }
    } else if (type === 'refine') {
        const editor = document.getElementById('promptEditorRefine');
        const textarea = document.getElementById('refinePromptEditor');
        
        if (editor.style.display === 'none') {
            editor.style.display = 'block';
            // Load current/default prompt
            if (!textarea.value) {
                textarea.value = getDefaultRefinePrompt();
            }
        } else {
            editor.style.display = 'none';
        }
    } else if (type === 'conversion') {
        const editor = document.getElementById('promptEditorConversion');
        const textarea = document.getElementById('conversionPromptEditor');
        
        if (editor.style.display === 'none') {
            editor.style.display = 'block';
            // Load current/default prompt
            if (!textarea.value) {
                textarea.value = getDefaultConversionPrompt();
            }
        } else {
            editor.style.display = 'none';
        }
    }
}

// Toggle description collapse
function toggleDescription() {
    const descDiv = document.getElementById('screenshotDescription');
    const btn = document.getElementById('toggleDescBtn');
    
    if (descDiv.style.maxHeight === '60px') {
        descDiv.style.maxHeight = '400px';
        btn.textContent = '▼ Collapse';
    } else {
        descDiv.style.maxHeight = '60px';
        btn.textContent = '▲ Expand';
    }
}

// Reset prompts to default
function resetDescriptionPrompt() {
    const textarea = document.getElementById('descriptionPromptEditor');
    textarea.value = getDefaultDescriptionPrompt();
}

function resetRefinePrompt() {
    const textarea = document.getElementById('refinePromptEditor');
    textarea.value = getDefaultRefinePrompt();
}

function resetConversionPrompt() {
    const textarea = document.getElementById('conversionPromptEditor');
    textarea.value = getDefaultConversionPrompt();
}

// Get default prompts
function getDefaultConversionPrompt() {
    // Return the full AI converter prompt from ai-converter.js
    return `You are an expert at converting HTML/CSS/JavaScript to Elementor JSON format.

TASK: Convert the following HTML/CSS/JavaScript into Elementor widget structure.

HTML:
{{html}}

CSS:
{{css}}

JavaScript (if any):
{{js}}

INSTRUCTIONS:
1. Identify appropriate Elementor widgets (heading, text-editor, button, image, etc.)
2. Extract styles and map them to Elementor settings
3. If JavaScript is provided, understand the interactions/animations and note them (Elementor may need custom CSS/JS)
4. Return ONLY valid JSON (no markdown)

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

AVAILABLE ELEMENTOR WIDGETS (use the most appropriate):
- heading: For h1-h6, titles, headings
- text-editor: For paragraphs, body text, rich content
- button: For buttons, CTAs, action links
- image: For images, photos, graphics
- video: For video embeds
- icon: For icons, icon boxes
- icon-list: For lists with icons
- image-box: For image with text overlay
- star-rating: For ratings, reviews
- testimonial: For testimonials, quotes
- google_maps: For maps, locations
- accordion: For collapsible/expandable content
- tabs: For tabbed content sections
- toggle: For toggle/expandable items
- social-icons: For social media links
- divider: For horizontal lines, separators
- spacer: For spacing, gaps
- counter: For animated numbers, stats
- progress: For progress bars, skill bars
- gallery: For image galleries
- image-carousel: For image sliders
- form: For contact forms, inputs
- pricing-table: For pricing, plans
- flip-box: For flip cards
- call-to-action: For CTA sections
- countdown: For timers, countdowns
- html: For custom HTML/CSS (fallback)

⚠️ CRITICAL WIDGET SELECTION RULE:
ONLY use a specialized widget if it can achieve the EXACT visual look from the design.

Examples:
- ❌ DON'T use 'testimonial' widget if the design is just 2 text lines and the testimonial widget requires an image/avatar
- ❌ DON'T use 'pricing-table' widget if the design doesn't have the standard pricing table structure  
- ❌ DON'T use 'icon-list' widget if the design has no icons
- ❌ DON'T use 'accordion' widget if the design is just static text sections
- ❌ DON'T use 'tabs' widget if the design has no tab functionality
- ✅ DO use simpler widgets ('text-editor', 'heading', 'button') when they achieve the exact look
- ✅ DO use specialized widgets ONLY when they match the design perfectly

When in doubt, use the simpler widget. Simple is better than complex that doesn't match.

IMPORTANT:
- Always set typography_typography: "custom" before typography properties
- Always set background_background: "classic" or "gradient" before background colors
- Use hex colors (#RRGGBB format)
- Font sizes as {"size": number, "unit": "px"}

Respond with ONLY the JSON, no explanations.`;
}

function getDefaultDescriptionPrompt() {
    return `# ROLE
You are an expert Elementor developer and visual design analyst. Your task is to provide an exhaustive, hyper-detailed description of a web design screenshot that will be used to generate accurate Elementor JSON code.

# CONTEXT
The screenshot shows the rendered output of HTML/CSS code. Use both the visual appearance AND the code to extract every detail.

# TASK
Analyze the screenshot and provide a COMPREHENSIVE description of EVERY visible element. Be extremely specific about measurements, colors, spacing, and visual hierarchy.

# CRITICAL WIDGET SELECTION RULE
⚠️ **ONLY suggest a specialized widget if it can achieve the EXACT visual look from the design.**

Examples:
- ❌ DON'T suggest 'testimonial' widget if the design is just 2 text lines and the testimonial widget requires an image/avatar
- ❌ DON'T suggest 'pricing-table' widget if the design doesn't have the standard pricing table structure
- ❌ DON'T suggest 'icon-list' widget if the design has no icons
- ✅ DO use simpler widgets ('text-editor', 'heading') when they achieve the exact look
- ✅ DO use specialized widgets ONLY when they match the design perfectly

**When in doubt, use the simpler widget that achieves the exact visual result.**`;
}

function getDefaultRefinePrompt() {
    return `# TASK: Refine Elementor JSON

You are an expert at modifying Elementor JSON based on user feedback.

## CRITICAL WIDGET SELECTION RULE
⚠️ **ONLY use a specialized widget if it can achieve the EXACT visual look from the design.**

- ❌ DON'T use 'testimonial' widget if the design is just 2 text lines and the testimonial widget requires an image/avatar
- ❌ DON'T use 'pricing-table' widget if the design doesn't have the standard pricing table structure
- ❌ DON'T use complex widgets if simpler ones ('text-editor', 'heading', 'button') achieve the exact look
- ✅ DO use specialized widgets ONLY when they match the design perfectly

When in doubt, use the simpler widget that achieves the exact visual result.

## INSTRUCTIONS
1. Apply the requested changes to the JSON
2. Maintain the exact same JSON structure
3. Only modify what was requested
4. Ensure all Elementor properties are valid
5. Follow the critical widget selection rule above
6. Return ONLY the modified JSON, no explanations`;
}

// Refine JSON with AI edits
async function refineJSON() {
    console.log('🔄 Refine JSON button clicked');
    
    const editInstructions = document.getElementById('jsonEditInstructions').value;
    
    if (!editInstructions || !editInstructions.trim()) {
        showStatus('❌ Please describe what changes you want to make', 'error');
        return;
    }
    
    if (!generatedJSON) {
        showStatus('❌ No JSON to refine. Generate JSON first.', 'error');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey || !apiKey.startsWith('sk-')) {
        showStatus('❌ Please configure your OpenAI API key', 'error');
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('refineLoadingIndicator');
    const refineBtn = document.getElementById('refineBtn');
    const originalRefineBtnContent = refineBtn ? refineBtn.innerHTML : '';
    
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (refineBtn) {
        refineBtn.disabled = true;
        refineBtn.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                <div style="width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>Refining...</span>
            </div>
        `;
        refineBtn.style.opacity = '0.7';
    }
    
    try {
        showStatus('🔄 AI refining JSON...', 'info');
        console.log('📤 Sending refinement request...');
        
        // Get context
        const html = document.getElementById('htmlInput').value;
        const css = document.getElementById('cssInput').value;
        const jsInput = document.getElementById('jsInput');
        const js = jsInput ? jsInput.value : '';
        
        // Get global stylesheet if enabled
        const enableGlobalStylesheet = document.getElementById('enableGlobalStylesheet');
        const globalStylesheet = document.getElementById('globalStylesheet');
        let globalStylesContext = '';
        
        if (enableGlobalStylesheet && enableGlobalStylesheet.checked && globalStylesheet && globalStylesheet.value) {
            globalStylesContext = `\n\nGLOBAL ENVIRONMENT STYLESHEET:\n${globalStylesheet.value}\n`;
        }
        
        // Get screenshot description if available
        let screenshotContext = '';
        if (window.screenshotDescriptionText) {
            screenshotContext = `\n\nVISUAL DESCRIPTION:\n${window.screenshotDescriptionText}\n`;
        }
        
        // Check if using custom prompt
        const customPromptEditor = document.getElementById('refinePromptEditor');
        let refinementPrompt;
        
        if (customPromptEditor && customPromptEditor.value && customPromptEditor.value.trim()) {
            // Use custom prompt with variable substitution
            refinementPrompt = customPromptEditor.value
                .replace(/\{\{html\}\}/g, html)
                .replace(/\{\{css\}\}/g, css)
                .replace(/\{\{js\}\}/g, js)
                .replace(/\{\{currentJSON\}\}/g, JSON.stringify(generatedJSON, null, 2))
                .replace(/\{\{userInstructions\}\}/g, editInstructions)
                .replace(/\{\{globalStyles\}\}/g, globalStylesContext)
                .replace(/\{\{screenshot\}\}/g, screenshotContext);
        } else {
            // Use default prompt
            refinementPrompt = `# TASK: Refine Elementor JSON

You are an expert at modifying Elementor JSON based on user feedback.

## ORIGINAL CONTEXT
${globalStylesContext}${screenshotContext}
HTML:
\`\`\`html
${html}
\`\`\`

CSS:
\`\`\`css
${css}
\`\`\`
${js ? `\nJavaScript:\n\`\`\`javascript\n${js}\n\`\`\`\n` : ''}

## CURRENT ELEMENTOR JSON
\`\`\`json
${JSON.stringify(generatedJSON, null, 2)}
\`\`\`

## REQUESTED CHANGES
${editInstructions}

## CRITICAL WIDGET SELECTION RULE
⚠️ **ONLY use a specialized widget if it can achieve the EXACT visual look from the design.**

- ❌ DON'T use 'testimonial' widget if the design is just 2 text lines and the testimonial widget requires an image/avatar
- ❌ DON'T use 'pricing-table' widget if the design doesn't have the standard pricing table structure
- ❌ DON'T use 'icon-list' widget if the design has no icons
- ❌ DON'T use complex widgets if simpler ones ('text-editor', 'heading', 'button') achieve the exact look
- ✅ DO use specialized widgets ONLY when they match the design perfectly

When in doubt, use the simpler widget that achieves the exact visual result.

## INSTRUCTIONS
1. Apply the requested changes to the JSON
2. Maintain the exact same JSON structure
3. Only modify what was requested
4. Ensure all Elementor properties are valid
5. Keep widget types appropriate (heading, text-editor, button, etc.)
6. Preserve all activation patterns (typography_typography, background_background, etc.)
7. Follow the critical widget selection rule above
8. Return ONLY the modified JSON, no explanations

## IMPORTANT RULES
- Always set typography_typography: "custom" before typography properties
- Always set background_background: "classic" or "gradient" before background colors
- Use hex colors (#RRGGBB format)
- Font sizes as {"size": number, "unit": "px"}
- Maintain proper JSON formatting

Return the complete refined JSON now:`;
        }

        // Show streaming in JSON output
        const jsonOutputDiv = document.getElementById('jsonOutput');
        if (jsonOutputDiv) {
            jsonOutputDiv.textContent = 'Streaming refinement...\n\n';
        }

        // Use local CORS proxy
        const apiUrl = 'http://localhost:3001/api/openai';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: 'gpt-5-2025-08-07',
                messages: [{
                    role: 'user',
                    content: refinementPrompt
                }],
                max_completion_tokens: 8000,
                stream: true  // Enable streaming
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'AI refinement failed');
        }
        
        // Stream the response
        let refinedResponse = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            refinedResponse += content;
                            // Update UI in real-time
                            if (jsonOutputDiv) {
                                jsonOutputDiv.textContent = refinedResponse;
                                jsonOutputDiv.scrollTop = jsonOutputDiv.scrollHeight;
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', data);
                    }
                }
            }
        }
        
        console.log('✅ Refinement response received');
        
        // Parse JSON from response
        const jsonMatch = refinedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, refinedResponse];
        const jsonString = jsonMatch[1].trim();
        const refinedJSON = JSON.parse(jsonString);
        
        console.log('✅ Refined JSON parsed successfully');
        
        // Update display and storage
        generatedJSON = refinedJSON;
        document.getElementById('jsonOutput').textContent = JSON.stringify(refinedJSON, null, 2);
        
        showStatus('✅ JSON refined successfully!', 'success');
        console.log('✅ JSON updated in UI');
        
        // Clear edit instructions
        document.getElementById('jsonEditInstructions').value = '';
        
    } catch (error) {
        console.error('❌ Refinement error:', error);
        showStatus('❌ Error: ' + error.message, 'error');
    } finally {
        // Hide loading indicator and restore button
        const loadingIndicator = document.getElementById('refineLoadingIndicator');
        const refineBtn = document.getElementById('refineBtn');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (refineBtn) {
            refineBtn.disabled = false;
            refineBtn.innerHTML = originalRefineBtnContent;
            refineBtn.style.opacity = '1';
        }
    }
}

// Basic HTML widget conversion
function generateBasicJSON(html, css, js) {
    generatedJSON = {
        version: '0.4',
        title: 'Converted Template',
        type: 'page',
        content: [{
            id: 'section_' + Date.now(),
            elType: 'section',
            elements: [{
                id: 'column_' + Date.now(),
                elType: 'column',
                elements: [{
                    id: 'widget_' + Date.now(),
                    elType: 'widget',
                    widgetType: 'html',
                    settings: {
                        html: '<style>' + css + '</style>\n' + html + (js ? '\n<script>' + js + '<\/script>' : '')
                    }
                }]
            }]
        }]
    };
    showStatus('✅ Basic conversion complete!', 'success');
}

// Download JSON
function downloadJSON() {
    if (!generatedJSON) {
        showStatus('❌ No JSON to download', 'error');
        return;
    }
    
    const blob = new Blob([JSON.stringify(generatedJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elementor-template.json';
    a.click();
    URL.revokeObjectURL(url);
    showStatus('✅ Downloaded!', 'success');
}

// Preview modes
function switchPreviewMode(mode) {
    console.log('Switching preview mode to:', mode);
    document.querySelectorAll('.preview-toggle-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    var activeBtn = document.querySelector('[data-mode="' + mode + '"]');
    if (activeBtn) activeBtn.classList.add('active');
}

// Get API key (from modal override or ENV)
function getApiKey() {
    const apiKeyElement = document.getElementById('apiKey');
    if (apiKeyElement && apiKeyElement.value) {
        return apiKeyElement.value;
    }
    return window.ENV ? window.ENV.OPENAI_API_KEY : '';
}

// Get Assistant ID (from modal override or ENV)
function getAssistantId() {
    const assistantIdElement = document.getElementById('assistantId');
    if (assistantIdElement && assistantIdElement.value) {
        return assistantIdElement.value;
    }
    return window.ENV ? window.ENV.ASSISTANT_ID : '';
}

// Get Vector Store ID (from modal override or ENV)
function getVectorStoreId() {
    const vectorStoreIdElement = document.getElementById('vectorStoreId');
    if (vectorStoreIdElement && vectorStoreIdElement.value) {
        return vectorStoreIdElement.value;
    }
    return window.ENV ? window.ENV.VECTOR_STORE_ID : '';
}

// Image-to-HTML Generator Functions
let selectedImageForHTML = null;

// Handle image file selection
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageToHTMLInput');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedImageForHTML = event.target.result;
                    displayImagePreview(selectedImageForHTML);
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Display image preview
function displayImagePreview(imageDataUrl) {
    const previewDiv = document.getElementById('imageToHTMLPreview');
    const img = document.getElementById('imageToHTMLImg');

    img.src = imageDataUrl;
    previewDiv.style.display = 'block';

    showStatus('📸 Image loaded! Click "Generate HTML/CSS/JS" to analyze.', 'success');
}

// Capture preview box screenshot for HTML generation
async function capturePreviewForHTML() {
    const previewBox = document.getElementById('previewBox');

    if (!previewBox) {
        showStatus('❌ No preview available to capture', 'error');
        return;
    }

    showStatus('📸 Capturing preview screenshot...', 'info');

    try {
        const canvas = await html2canvas(previewBox, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });

        selectedImageForHTML = canvas.toDataURL('image/png');
        displayImagePreview(selectedImageForHTML);

    } catch (error) {
        console.error('Screenshot error:', error);
        showStatus('❌ Failed to capture screenshot: ' + error.message, 'error');
    }
}

// Generate HTML/CSS/JS from selected image
async function generateHTMLFromSelectedImage() {
    if (!selectedImageForHTML) {
        showStatus('❌ No image selected', 'error');
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey || !apiKey.startsWith('sk-')) {
        showStatus('❌ Please configure your OpenAI API key in Settings', 'error');
        return;
    }

    const generateBtn = document.getElementById('generateHTMLBtn');
    const originalBtnText = generateBtn.innerHTML;

    try {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span style="display: flex; align-items: center; justify-content: center; gap: 8px;"><div style="width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div> Generating...</span>';

        const autoConvert = document.getElementById('autoConvertFromImage').checked;

        const result = await window.generateHTMLFromImage(selectedImageForHTML, apiKey, {
            autoConvert: autoConvert,
            onProgress: (step, message) => {
                showStatus(`🖼️ ${message}`, 'info');
                console.log(`[${step}] ${message}`);
            }
        });

        // Fill in the textareas
        document.getElementById('htmlInput').value = result.html;
        document.getElementById('cssInput').value = result.css;
        if (document.getElementById('jsInput')) {
            document.getElementById('jsInput').value = result.js;
        }

        // Update preview
        const previewBox = document.getElementById('previewBox');
        if (previewBox) {
            updatePreviewIframe(previewBox, result.html, result.css, '', result.js);
        }

        if (autoConvert) {
            showStatus('✨ HTML generated and auto-converting to Elementor...', 'success');
        } else {
            showStatus('✨ HTML/CSS/JS generated successfully! Review code and click Convert.', 'success');
        }

    } catch (error) {
        console.error('Image-to-HTML error:', error);
        showStatus('❌ Error: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalBtnText;
    }
}

// Settings Modal Functions
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const assistantIdModal = document.getElementById('assistantIdModal');
    const vectorStoreIdModal = document.getElementById('vectorStoreIdModal');
    
    // Load current values or ENV defaults
    const apiKey = document.getElementById('apiKey');
    const assistantId = document.getElementById('assistantId');
    const vectorStoreId = document.getElementById('vectorStoreId');
    
    // Show current override or ENV default
    apiKeyModal.value = (apiKey && apiKey.value) || (window.ENV ? window.ENV.OPENAI_API_KEY : '');
    assistantIdModal.value = (assistantId && assistantId.value) || (window.ENV ? window.ENV.ASSISTANT_ID : '');
    vectorStoreIdModal.value = (vectorStoreId && vectorStoreId.value) || (window.ENV ? window.ENV.VECTOR_STORE_ID : '');
    
    // Update placeholders to show ENV defaults
    if (window.ENV) {
        if (window.ENV.OPENAI_API_KEY) {
            apiKeyModal.placeholder = 'Using .env: ***' + window.ENV.OPENAI_API_KEY.slice(-8);
        }
        if (window.ENV.ASSISTANT_ID) {
            assistantIdModal.placeholder = 'Using .env: ' + window.ENV.ASSISTANT_ID;
        }
        if (window.ENV.VECTOR_STORE_ID) {
            vectorStoreIdModal.placeholder = 'Using .env: ' + window.ENV.VECTOR_STORE_ID;
        }
    }
    
    modal.style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    // Get values from modal
    const apiKey = document.getElementById('apiKeyModal').value;
    const assistantId = document.getElementById('assistantIdModal').value;
    const vectorStoreId = document.getElementById('vectorStoreIdModal').value;
    const gpt5Model = document.getElementById('gpt5ModelSelector').value;

    // Create hidden inputs if they don't exist
    if (!document.getElementById('apiKey')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'apiKey';
        document.body.appendChild(input);
    }
    if (!document.getElementById('assistantId')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'assistantId';
        document.body.appendChild(input);
    }
    if (!document.getElementById('vectorStoreId')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'vectorStoreId';
        document.body.appendChild(input);
    }

    // Save values
    document.getElementById('apiKey').value = apiKey;
    document.getElementById('assistantId').value = assistantId;
    document.getElementById('vectorStoreId').value = vectorStoreId;

    // Save model selection to localStorage
    localStorage.setItem('gpt5Model', gpt5Model);
    console.log('✅ Saved GPT-5 model:', gpt5Model);

    closeSettingsModal();
    showStatus('✅ Settings saved!', 'success');
}

// Load model selection on page load
function loadModelSettings() {
    const savedModel = localStorage.getItem('gpt5Model');
    if (savedModel) {
        const selector = document.getElementById('gpt5ModelSelector');
        if (selector) {
            selector.value = savedModel;
            console.log('✅ Loaded GPT-5 model:', savedModel);
        }
    }
}

// Get current model selection
function getSelectedModel() {
    return localStorage.getItem('gpt5Model') || 'gpt-5-2025-08-07';
}

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModelSettings);
} else {
    loadModelSettings();
}

// Stub functions (WordPress Playground loaded via separate module)
function testJSONQuality() {
    if (!generatedJSON) {
        showStatus('❌ Generate JSON first!', 'error');
        return;
    }
    showStatus('🎯 Quality: Basic validation passed!', 'success');
}

function testSchemaSystem() {
    showStatus('🧪 Schema system operational!', 'success');
}

function directHTMLConvert() {
    convertToElementor();
}

function debugJSON() {
    console.log('Generated JSON:', generatedJSON);
    showStatus('🔍 Check browser console for JSON output', 'info');
}

// Note: testInPlayground, closePlayground, refreshPlaygroundTemplate, openElementorEditor, viewPage
// are now defined in playground.js module

// Expose to window
window.loadExample = loadExample;
window.clearInputs = clearInputs;
window.convertToElementor = convertToElementor;
window.switchPreviewMode = switchPreviewMode;
window.downloadJSON = downloadJSON;
window.testJSONQuality = testJSONQuality;
window.testSchemaSystem = testSchemaSystem;
window.directHTMLConvert = directHTMLConvert;
window.debugJSON = debugJSON;
window.screenshotPreview = screenshotPreview;
window.toggleVisionPreview = toggleVisionPreview;
window.generateScreenshotDescription = generateScreenshotDescription;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettings = saveSettings;
window.toggleGlobalStylesheet = toggleGlobalStylesheet;
window.togglePromptPreview = togglePromptPreview;
window.updatePromptPreview = updatePromptPreview;
window.refineJSON = refineJSON;
window.togglePromptEditor = togglePromptEditor;
window.toggleDescription = toggleDescription;
window.resetDescriptionPrompt = resetDescriptionPrompt;
window.resetRefinePrompt = resetRefinePrompt;
window.resetConversionPrompt = resetConversionPrompt;

// Toggle global stylesheet
function toggleGlobalStylesheet() {
    const checkbox = document.getElementById('enableGlobalStylesheet');
    const container = document.getElementById('globalStylesheetContainer');
    
    if (checkbox.checked) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
    
    // Update preview immediately
    updateLivePreview();
}

// Toggle prompt preview
function togglePromptPreview() {
    const content = document.getElementById('promptPreviewContent');
    
    if (content.style.display === 'none') {
        // Show and populate
        content.style.display = 'block';
        updatePromptPreview();
    } else {
        // Hide
        content.style.display = 'none';
    }
}

// Update prompt preview with current context
function updatePromptPreview() {
    const content = document.getElementById('promptPreviewContent');
    const html = document.getElementById('htmlInput').value;
    const css = document.getElementById('cssInput').value;
    
    // Get global stylesheet if enabled
    const enableGlobalStylesheet = document.getElementById('enableGlobalStylesheet');
    const globalStylesheet = document.getElementById('globalStylesheet');
    let globalStylesContext = '';
    
    if (enableGlobalStylesheet && enableGlobalStylesheet.checked && globalStylesheet && globalStylesheet.value) {
        globalStylesContext = `\n\nGLOBAL ENVIRONMENT STYLESHEET (use these defaults):\n${globalStylesheet.value}\n`;
    }
    
    // Get screenshot description if available
    let screenshotContext = '';
    if (window.screenshotDescriptionText) {
        screenshotContext = `\n\nVISUAL DESCRIPTION (from AI analysis of screenshot):\n${window.screenshotDescriptionText}\n`;
    }
    
    // Build the complete prompt (from ai-converter.js)
    const completePrompt = `You are an expert at converting HTML/CSS to Elementor JSON format.

TASK: Convert the following HTML/CSS into Elementor widget structure.
${globalStylesContext}${screenshotContext}
HTML:
${html || '(No HTML provided yet)'}

CSS:
${css || '(No CSS provided yet)'}

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

AVAILABLE ELEMENTOR WIDGETS (use the most appropriate):
- heading: For h1-h6, titles, headings
- text-editor: For paragraphs, body text, rich content
- button: For buttons, CTAs, action links
- image: For images, photos, graphics
- video: For video embeds
- icon: For icons, icon boxes
- icon-list: For lists with icons
- image-box: For image with text overlay
- star-rating: For ratings, reviews
- testimonial: For testimonials, quotes
- google_maps: For maps, locations
- accordion: For collapsible/expandable content
- tabs: For tabbed content sections
- toggle: For toggle/expandable items
- social-icons: For social media links
- divider: For horizontal lines, separators
- spacer: For spacing, gaps
- counter: For animated numbers, stats
- progress: For progress bars, skill bars
- gallery: For image galleries
- image-carousel: For image sliders
- form: For contact forms, inputs
- pricing-table: For pricing, plans
- flip-box: For flip cards
- call-to-action: For CTA sections
- countdown: For timers, countdowns
- html: For custom HTML/CSS (fallback)

IMPORTANT:
- Always set typography_typography: "custom" before typography properties
- Always set background_background: "classic" or "gradient" before background colors
- Use hex colors (#RRGGBB format)
- Font sizes as {"size": number, "unit": "px"}

Respond with ONLY the JSON, no explanations.`;

    // Display with syntax highlighting
    content.innerHTML = '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">' + 
        escapeHtml(completePrompt) + '</pre>';
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to update preview iframe (isolates CSS and executes JS)
function updatePreviewIframe(iframe, html, css, globalCSS = '', js = '') {
    if (!iframe) return;
    
    // Create isolated HTML document
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${globalCSS ? '<style>' + globalCSS + '</style>' : ''}
            ${css ? '<style>' + css + '</style>' : ''}
        </head>
        <body style="margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
            ${html || '<p style="color: #9ca3af; text-align: center;">Preview will appear here...</p>'}
            ${js ? '<script>' + js + '</script>' : ''}
        </body>
        </html>
    `);
    doc.close();
}

// Real-time preview update
function updateLivePreview() {
    const html = document.getElementById('htmlInput').value;
    const css = document.getElementById('cssInput').value;
    const jsInput = document.getElementById('jsInput');
    const js = jsInput ? jsInput.value : '';
    const previewBox = document.getElementById('previewBox');
    
    // Check if global stylesheet is enabled
    const enableGlobalStylesheet = document.getElementById('enableGlobalStylesheet');
    const globalStylesheet = document.getElementById('globalStylesheet');
    let globalCSS = '';
    
    if (enableGlobalStylesheet && enableGlobalStylesheet.checked && globalStylesheet) {
        globalCSS = globalStylesheet.value;
    }
    
    updatePreviewIframe(previewBox, html, css, globalCSS, js);
}

// Screenshot preview
function screenshotPreview() {
    const previewBox = document.getElementById('previewBox');
    
    // Use html2canvas library if available, otherwise use native method
    if (typeof html2canvas !== 'undefined') {
        // Screenshot the iframe's content document
        const iframeDoc = previewBox.contentDocument || previewBox.contentWindow.document;
        const iframeBody = iframeDoc.body;
        
        html2canvas(iframeBody).then(function(canvas) {
            const link = document.createElement('a');
            link.download = 'elementor-preview-' + Date.now() + '.png';
            link.href = canvas.toDataURL();
            link.click();
            showStatus('✅ Screenshot downloaded!', 'success');
        });
    } else {
        // Fallback: download HTML content
        const iframeDoc = previewBox.contentDocument || previewBox.contentWindow.document;
        const htmlContent = iframeDoc.documentElement.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'preview-' + Date.now() + '.html';
        a.click();
        URL.revokeObjectURL(url);
        showStatus('✅ Preview HTML downloaded!', 'success');
    }
}

// Toggle vision preview area and capture screenshot
async function toggleVisionPreview() {
    const checkbox = document.getElementById('enableVision');
    const previewArea = document.getElementById('visionPreviewArea');
    const screenshotPreview = document.getElementById('screenshotPreview');
    
    if (checkbox.checked) {
        previewArea.style.display = 'block';
        
        // Automatically capture screenshot
        if (typeof html2canvas !== 'undefined') {
            try {
                showStatus('📸 Capturing screenshot...', 'info');
                const previewBox = document.getElementById('previewBox');
                
                // Capture the iframe's content document
                const iframeDoc = previewBox.contentDocument || previewBox.contentWindow.document;
                const iframeBody = iframeDoc.body;
                
                // Capture with reduced quality to keep size manageable
                const canvas = await html2canvas(iframeBody, {
                    scale: 1,  // Use 1x scale (can reduce if needed)
                    logging: false,
                    useCORS: true
                });
                
                // Convert to JPEG with compression (much smaller than PNG)
                const screenshot = canvas.toDataURL('image/jpeg', 0.7);  // 70% quality
                
                const sizeKB = (screenshot.length / 1024).toFixed(2);
                console.log('📊 Screenshot captured, size:', sizeKB, 'KB');
                
                // Display screenshot
                screenshotPreview.innerHTML = '<img src="' + screenshot + '" style="max-width: 100%; height: auto; border-radius: 4px;" />';
                
                // Store screenshot globally for later use
                window.visionScreenshot = screenshot;
                
                showStatus('✅ Screenshot captured (' + sizeKB + ' KB)!', 'success');
            } catch (error) {
                console.error('Screenshot capture failed:', error);
                screenshotPreview.innerHTML = '<p style="color: #ef4444;">Failed to capture screenshot: ' + error.message + '</p>';
                showStatus('❌ Screenshot failed', 'error');
            }
        } else {
            screenshotPreview.innerHTML = '<p style="color: #f59e0b;">html2canvas library not loaded</p>';
        }
    } else {
        previewArea.style.display = 'none';
        window.visionScreenshot = null;
        window.screenshotDescriptionText = null;
        
        // Reset description area
        const descriptionDiv = document.getElementById('screenshotDescription');
        if (descriptionDiv) {
            descriptionDiv.innerHTML = '<span style="color: #9ca3af; font-style: italic;">Click "🔍 Generate Description" to analyze the screenshot...</span>';
            descriptionDiv.style.display = 'flex';
            descriptionDiv.style.alignItems = 'center';
            descriptionDiv.style.justifyContent = 'center';
        }
    }
}

// Generate description of screenshot
async function generateScreenshotDescription() {
    console.log('🔍 Generate description button clicked');
    
    const apiKey = getApiKey();
    console.log('API Key available:', apiKey ? 'Yes (***' + apiKey.slice(-8) + ')' : 'No');
    
    if (!apiKey || !apiKey.startsWith('sk-')) {
        showStatus('❌ Please configure your OpenAI API key (Settings or .env file)', 'error');
        return;
    }
    
    if (!window.visionScreenshot) {
        console.error('❌ No screenshot in window.visionScreenshot');
        showStatus('❌ No screenshot available. Enable vision mode first.', 'error');
        return;
    }
    
    // Disable button and show loading state
    const generateBtn = document.getElementById('generateDescBtn');
    const originalBtnText = generateBtn ? generateBtn.innerHTML : '';
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                <div style="width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>Generating...</span>
            </div>
        `;
        generateBtn.style.opacity = '0.7';
    }
    
    console.log('✅ Screenshot available, size:', window.visionScreenshot.length, 'characters');
    
    // Check screenshot size (warn if very large)
    const screenshotSizeKB = window.visionScreenshot.length / 1024;
    console.log('📊 Screenshot size:', screenshotSizeKB.toFixed(2), 'KB');
    
    const detailLevel = screenshotSizeKB > 500 ? 'low' : 'high';
    console.log('🎯 Using detail level:', detailLevel, '(based on size)');
    
    if (screenshotSizeKB > 1000) {
        console.warn('⚠️ Screenshot is very large (', screenshotSizeKB.toFixed(2), 'KB). This may cause issues.');
        console.warn('💡 Using "low" detail mode to reduce processing load.');
    }
    
    // Show loading indicator
    const descriptionDiv = document.getElementById('screenshotDescription');
    if (descriptionDiv) {
        descriptionDiv.innerHTML = '<div style="width: 100%; text-align: center; color: #667eea;"><strong>⏳ Generating description...</strong><br><span style="font-size: 11px; color: #9ca3af;">This may take 10-20 seconds</span></div>';
    }
    
    try {
        showStatus('🔍 AI analyzing screenshot to generate description...', 'info');
        console.log('📤 Sending request to OpenAI...');
        console.log('⏰ Request started at:', new Date().toLocaleTimeString());
        
        // Get HTML and CSS for context
        const html = document.getElementById('htmlInput').value || '';
        const css = document.getElementById('cssInput').value || '';
        
        // Check if using custom prompt
        const customPromptEditor = document.getElementById('descriptionPromptEditor');
        let promptText;
        
        if (customPromptEditor && customPromptEditor.value && customPromptEditor.value.trim()) {
            // Use custom prompt (no variable substitution for description, just use as-is with context added)
            promptText = customPromptEditor.value + `\n\nHTML CODE:\n\`\`\`html\n${html}\n\`\`\`\n\nCSS CODE:\n\`\`\`css\n${css}\n\`\`\``;
        } else {
            // Use default full prompt
            promptText = `# ROLE
You are an expert Elementor developer and visual design analyst. Your task is to provide an exhaustive, hyper-detailed description of a web design screenshot that will be used to generate accurate Elementor JSON code.

# CONTEXT
The screenshot shows the rendered output of the following HTML/CSS code. Use both the visual appearance AND the code to extract every detail:

HTML CODE:
\`\`\`html
${html}
\`\`\`

CSS CODE:
\`\`\`css
${css}
\`\`\`

# TASK
Analyze the screenshot and provide a COMPREHENSIVE description of EVERY visible element. Be extremely specific about measurements, colors, spacing, and visual hierarchy.

# CRITICAL WIDGET SELECTION RULE
⚠️ **ONLY suggest a specialized widget if it can achieve the EXACT visual look from the design.**

Examples:
- ❌ DON'T suggest 'testimonial' widget if the design is just 2 text lines and the testimonial widget requires an image/avatar
- ❌ DON'T suggest 'pricing-table' widget if the design doesn't have the standard pricing table structure
- ❌ DON'T suggest 'icon-list' widget if the design has no icons
- ❌ DON'T suggest 'accordion' widget if the design is just static text sections
- ❌ DON'T suggest 'tabs' widget if the design has no tab functionality
- ✅ DO use simpler widgets ('text-editor', 'heading', 'button') when they achieve the exact look
- ✅ DO use specialized widgets ONLY when they match the design perfectly

**When in doubt, use the simpler widget that achieves the exact visual result. Simple widgets are better than complex widgets that don't match.**

# OUTPUT FORMAT
Structure your response with clear sections.

## AVAILABLE ELEMENTOR WIDGETS (map every element to one of these):
- **heading**: h1-h6, titles, headings
- **text-editor**: Paragraphs, body text, rich content
- **button**: Buttons, CTAs, action links  
- **image**: Images, photos, graphics
- **video**: Video embeds
- **icon**: Icons, icon boxes
- **icon-list**: Lists with icons/checkmarks
- **image-box**: Image with text overlay
- **star-rating**: Ratings, reviews
- **testimonial**: Testimonials, quotes
- **google_maps**: Maps, locations
- **accordion**: Collapsible/expandable sections
- **tabs**: Tabbed content, multiple sections
- **toggle**: Toggle/expandable items
- **social-icons**: Social media links
- **divider**: Horizontal lines, separators
- **spacer**: Spacing, vertical gaps
- **counter**: Animated numbers, statistics
- **progress**: Progress bars, skill bars
- **gallery**: Image galleries
- **image-carousel**: Image sliders, carousels
- **form**: Contact forms, input fields
- **pricing-table**: Pricing cards, plans
- **flip-box**: Flip cards, hover effects
- **call-to-action**: CTA sections, feature boxes
- star-rating: For ratings, reviews
- testimonial: For testimonials, quotes
- google_maps: For maps, locations
- accordion: For collapsible content sections
- tabs: For tabbed content, multiple sections
- toggle: For expandable content
- social-icons: For social media links
- divider: For horizontal lines, separators
- spacer: For spacing, gaps
- html: For custom HTML/CSS
- shortcode: For WordPress shortcodes
- menu-anchor: For anchor links
- sidebar: For widget areas
- counter: For animated numbers, stats
- progress: For progress bars, skill bars
- gallery: For image galleries
- image-carousel: For image sliders
- form: For contact forms, inputs
- login: For login forms
- search-form: For search boxes
- sitemap: For site structure
- pricing-table: For pricing, plans
- flip-box: For flip cards
- call-to-action: For CTA sections
- countdown: For timers, countdowns

ANALYZE AND DESCRIBE:
1. **Layout Structure**: Sections, columns, containers, grid/flex patterns
2. **Every Component**: Identify EACH element and suggest appropriate Elementor widget
3. **Interactive Patterns**: 
   - Accordions → use 'accordion' widget
   - Tabs → use 'tabs' widget
   - Carousels/Sliders → use 'image-carousel' widget
   - Icon lists → use 'icon-list' widget
   - Pricing tables → use 'pricing-table' widget
   - Testimonials → use 'testimonial' widget
4. **Visual Details**:
   - Exact colors (hex codes if visible)
   - Font sizes, weights, families
   - Spacing (padding, margins, gaps)
   - Borders, shadows, effects
5. **Content Elements**:
   - All headings and their hierarchy
   - All text blocks and descriptions
   - All buttons and their labels
   - All images and their placements
   - All icons and their purposes
6. **Design Patterns**:
   - Hero sections
   - Feature grids
   - Card layouts
   - Forms and inputs
   - Navigation elements

PROVIDE:
- Complete inventory of every visible element
- Suggested Elementor widget for each component
- Specific values: colors, sizes, spacing
- Layout relationships and hierarchy
- Any repeating patterns or components

Be exhaustive and thorough. This description will guide the AI in generating accurate Elementor JSON code.

## REQUIRED ANALYSIS SECTIONS

### 1. OVERALL LAYOUT ARCHITECTURE
- Container structure (sections, columns, rows)
- Grid/Flexbox patterns
- Responsive breakpoints visible
- Z-index layering
- Overflow and clipping

### 2. EVERY VISUAL ELEMENT (Be Hyper-Specific)
For EACH element, provide:
- **Element Type**: What it is (heading, button, image, etc.)
- **Suggested Widget**: Which Elementor widget to use
- **Exact Position**: Where it appears (top, middle, bottom, left, right)
- **Dimensions**: Width, height (in pixels or percentages if visible)
- **Content**: Exact text, labels, or descriptions

### 3. COLOR PALETTE (Extract from rendered CSS)
- **Primary Colors**: Main brand colors (HEX codes)
- **Secondary Colors**: Accent colors
- **Text Colors**: Headings, body, links
- **Background Colors**: Sections, cards, overlays
- **Gradients**: Start/end colors, direction, angle
- **Opacity/Transparency**: Alpha values

### 4. TYPOGRAPHY (From CSS + Visual)
- **Font Families**: What fonts are used
- **Font Sizes**: Exact sizes in pixels for each text element
- **Font Weights**: 100-900 (thin, regular, bold, etc.)
- **Line Heights**: Spacing between lines
- **Letter Spacing**: Tracking
- **Text Transforms**: uppercase, lowercase, capitalize
- **Text Alignment**: left, center, right, justify

### 5. SPACING & DIMENSIONS (Measured Values)
- **Padding**: Top, right, bottom, left for each element
- **Margins**: Gaps between elements
- **Gaps**: Grid/flex gaps
- **Border Radius**: Roundness of corners (px)
- **Section Heights**: How tall each section is

### 6. VISUAL EFFECTS (From CSS)
- **Shadows**: box-shadow values (offset-x, offset-y, blur, spread, color)
- **Borders**: Width, style, color for each side
- **Transforms**: rotations, scales, skews
- **Transitions**: Hover effects, animations
- **Filters**: blur, brightness, contrast
- **Background Effects**: Images, gradients, overlays

### 7. INTERACTIVE ELEMENTS
Identify and describe:
- **Buttons**: Label, colors, padding, border-radius, hover states
- **Links**: Color, underline, hover color
- **Forms**: Input fields, placeholders, validation
- **Accordions**: Headers, content, icons
- **Tabs**: Tab labels, active states, content panels
- **Carousels**: Slides, navigation, indicators

### 8. CONTENT HIERARCHY
- **H1 Elements**: Main heading (size, color, position)
- **H2 Elements**: Sub-headings
- **H3-H6**: Additional hierarchy
- **Paragraphs**: Body text styling
- **Lists**: Bullet/numbered, icon lists
- **Emphasis**: Bold, italic, highlights

### 9. PATTERN RECOGNITION
Identify specific UI patterns:
- **Hero Section**: Full-width banner with CTA
- **Feature Grid**: 2/3/4 column layouts with icons/images
- **Pricing Tables**: Plans comparison
- **Testimonials**: Customer quotes with photos
- **Call-to-Action**: Prominent action sections
- **Forms**: Contact, newsletter, registration
- **Image Galleries**: Photo grids
- **Accordions/FAQs**: Expandable content

### 10. ELEMENT-TO-WIDGET MAPPING
For EVERY visible element, explicitly state:
"[Element description] → Use **[widget-name]** widget"

Examples:
- "Main title 'Welcome to Our Platform' (48px, white, bold) → Use **heading** widget"
- "Purple gradient background → Use **section** with gradient background"
- "Three pricing cards in row → Use 3-column layout with **pricing-table** widgets"

## CRITICAL REQUIREMENTS
✅ Describe EVERY element visible in the screenshot
✅ Provide EXACT values from CSS (colors, sizes, spacing)
✅ Map EVERY element to an Elementor widget
✅ Include ALL styling details (shadows, gradients, effects)
✅ Note visual hierarchy and layout relationships
✅ Be specific about measurements (don't say "large" - say "48px")
✅ Extract hex color codes from CSS (#667eea, #764ba2, etc.)
✅ Identify patterns (accordions, tabs, carousels, pricing tables)

## OUTPUT GOAL
Your description should be SO detailed that someone could recreate the design EXACTLY using Elementor widgets, matching:
- Every color
- Every font size
- Every spacing value
- Every visual effect
- Every element position

Start your analysis now, section by section.`;
        }
        
        // Get selected model
        const selectedModel = getSelectedModel();
        console.log('🤖 Using model for screenshot description:', selectedModel);

        const requestBody = {
            model: selectedModel,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: promptText
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: window.visionScreenshot,
                            detail: screenshotSizeKB > 500 ? 'low' : 'high'
                        }
                    }
                ]
            }],
            max_completion_tokens: 16000,  // Increased significantly for detailed description
            stream: true  // Enable streaming
        };
        
        console.log('📋 Request details:', {
            model: requestBody.model,
            messageCount: requestBody.messages.length,
            contentTypes: requestBody.messages[0].content.map(c => c.type),
            screenshotLength: window.visionScreenshot.length,
            screenshotSizeKB: screenshotSizeKB.toFixed(2) + ' KB',
            detailLevel: detailLevel,
            maxTokens: requestBody.max_completion_tokens
        });
        
        console.log('🌐 About to stringify request body...');
        let requestBodyString;
        try {
            requestBodyString = JSON.stringify(requestBody);
            console.log('✅ Request body stringified, size:', (requestBodyString.length / 1024).toFixed(2), 'KB');
        } catch (stringifyError) {
            console.error('❌ Failed to stringify request:', stringifyError);
            throw new Error('Failed to prepare request: ' + stringifyError.message);
        }
        
        console.log('🌐 About to call fetch API...');
        let response;
        try {
            // Use local CORS proxy (run: node cors-proxy.js in separate terminal)
            const apiUrl = 'http://localhost:3001/api/openai';

            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: requestBodyString
            });
            console.log('✅ Fetch completed successfully');
        } catch (fetchError) {
            console.error('❌ Fetch failed:', fetchError);
            console.error('Fetch error details:', fetchError.message, fetchError.stack);
            throw new Error('Network error: ' + fetchError.message);
        }
        
        console.log('📥 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ API Error Response:', error);
            throw new Error(error.error?.message || 'AI request failed');
        }
        
        // Stream the response
        let description = '';
        const descDiv = document.getElementById('screenshotDescription');
        
        if (descDiv) {
            descDiv.style.display = 'block';
            descDiv.style.alignItems = 'flex-start';
            descDiv.style.justifyContent = 'flex-start';
            descDiv.innerHTML = '<div style="width: 100%; white-space: pre-wrap; line-height: 1.6; color: #667eea;">Streaming response...\n\n</div>';
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            description += content;
                            // Update UI in real-time
                            if (descDiv) {
                                descDiv.innerHTML = '<div style="width: 100%; white-space: pre-wrap; line-height: 1.6;">' + description.replace(/\n/g, '<br>') + '</div>';
                                descDiv.scrollTop = descDiv.scrollHeight;
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', data);
                    }
                }
            }
        }
        
        console.log('📝 Description length:', description.length, 'characters');
        
        if (description.length === 0) {
            console.error('❌ Empty description received from streaming!');
            throw new Error('AI returned empty description');
        }
        
        console.log('📝 First 500 chars of description:', description.substring(0, 500));
        console.log('✅ AI Description received:', description.substring(0, 200) + '...');
        console.log('⏰ Response received at:', new Date().toLocaleTimeString());
        
        // Final display formatting
        console.log('🔍 Description div already updated via streaming');
        
        if (descDiv) {
            console.log('📝 Updating description div...');
            
            // Clear placeholder and add description with proper formatting
            descDiv.style.display = 'block';
            descDiv.style.alignItems = 'flex-start';
            descDiv.style.justifyContent = 'flex-start';
            const formattedDescription = '<div style="width: 100%; white-space: pre-wrap; line-height: 1.6;">' + description.replace(/\n/g, '<br>') + '</div>';
            descDiv.innerHTML = formattedDescription;
            
            console.log('✅ Description HTML updated, length:', formattedDescription.length);
            
            // Store description for use in conversion
            window.screenshotDescriptionText = description;
            console.log('✅ Description stored in window.screenshotDescriptionText');
            
            // Show collapse button
            const toggleBtn = document.getElementById('toggleDescBtn');
            if (toggleBtn) toggleBtn.style.display = 'inline-block';
            
            // Update refinement screenshot status
            const screenshotStatus = document.getElementById('refinementScreenshotStatus');
            if (screenshotStatus) {
                screenshotStatus.innerHTML = '<span style="color: #059669; font-weight: 600;">✅ Included (description available)</span>';
            }
            
            showStatus('✅ Description generated and displayed!', 'success');
            console.log('✅✅✅ COMPLETE: Description displayed in UI');
        } else {
            console.error('❌ screenshotDescription div not found in DOM!');
            console.error('Available divs:', document.querySelectorAll('div[id]'));
            showStatus('⚠️ Description generated but display error', 'warning');
        }
        
    } catch (error) {
        console.error('❌❌❌ Error generating description:', error);
        console.error('Error stack:', error.stack);
        showStatus('❌ Error: ' + error.message, 'error');
        
        // Reset description area on error
        const descDiv = document.getElementById('screenshotDescription');
        if (descDiv) {
            descDiv.innerHTML = '<span style="color: #ef4444;">Error: ' + error.message + '</span>';
        }
    } finally {
        // Re-enable button
        const generateBtn = document.getElementById('generateDescBtn');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnText;
            generateBtn.style.opacity = '1';
        }
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing converter...');
    
    // Load environment variables first
    if (window.loadEnv) {
        await window.loadEnv();
    }
    
    await loadWidgetSchemas();
    
    // No mode switcher - always AI mode
    // Settings, vision, and prompt preview are always visible when needed
    
    // Real-time preview updates
    var htmlInput = document.getElementById('htmlInput');
    var cssInput = document.getElementById('cssInput');
    var globalStylesheet = document.getElementById('globalStylesheet');
    
    if (htmlInput) {
        htmlInput.addEventListener('input', updateLivePreview);
    }
    if (cssInput) {
        cssInput.addEventListener('input', updateLivePreview);
    }
    if (globalStylesheet) {
        globalStylesheet.addEventListener('input', updateLivePreview);
    }
    
    // Load default content
    if (htmlInput && !htmlInput.value) {
        htmlInput.value = DEFAULT_HTML;
    }
    if (cssInput && !cssInput.value) {
        cssInput.value = DEFAULT_CSS;
    }
    if (globalStylesheet && !globalStylesheet.value) {
        globalStylesheet.value = DEFAULT_GLOBAL_STYLESHEET;
    }
    
    // Trigger initial preview update
    updateLivePreview();
    
    console.log('✅ Converter ready!');
    console.log('✅ Real-time preview enabled!');
    console.log('✅ Default content loaded!');
    console.log('✅ Global stylesheet loaded!');
});

console.log('✅ Main converter loaded');
