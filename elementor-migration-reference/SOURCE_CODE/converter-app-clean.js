// Global variables
let currentMode = 'browser';
let generatedJSON = null;
let WIDGET_SCHEMAS = null;

// Simple logger
const logger = {
    log: (type, msg, data) => console.log(`[${type}] ${msg}`, data || ''),
    downloadLogs: () => console.log('Download logs'),
    clear: () => console.clear()
};

// Load widget schemas
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

// Examples
const examples = {
    'hero-gradient': {
        name: 'Hero Section (Gradient)',
        html: `<div class="hero">
  <h1>Welcome to Our Site</h1>
  <p>Build amazing websites with custom sections</p>
  <button class="cta-button">Get Started</button>
</div>`,
        css: `.hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 80px 40px;
  text-align: center;
  border-radius: 12px;
}

.hero h1 {
  font-size: 48px;
  margin-bottom: 20px;
  font-weight: 700;
}

.hero p {
  font-size: 20px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.cta-button {
  background: #0f3460;
  color: white;
  padding: 16px 32px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}`,
        js: ''
    }
};

// Load example
function loadExample(exampleKey) {
    const example = examples[exampleKey];
    if (!example) return;
    
    document.getElementById('htmlInput').value = example.html;
    document.getElementById('cssInput').value = example.css;
    document.getElementById('jsInput').value = example.js || '';
    showStatus(`✅ Loaded example: ${example.name}`, 'success');
}

// Clear inputs
function clearInputs() {
    document.getElementById('htmlInput').value = '';
    document.getElementById('cssInput').value = '';
    document.getElementById('jsInput').value = '';
    document.getElementById('exampleSelector').value = '';
    document.getElementById('previewBox').innerHTML = '<p style="color: #9ca3af; text-align: center;">Preview will appear here...</p>';
    showStatus('🗑️ Cleared all inputs', 'info');
}

// Show status message
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');
    const colors = {
        success: '#d1fae5',
        error: '#fee2e2',
        info: '#dbeafe'
    };
    statusDiv.innerHTML = `<div class="alert alert-${type}" style="background: ${colors[type]}; padding: 12px; border-radius: 8px; margin-bottom: 15px;">${message}</div>`;
    setTimeout(() => statusDiv.innerHTML = '', 5000);
}

// Convert to Elementor
async function convertToElementor() {
    const html = document.getElementById('htmlInput').value;
    const css = document.getElementById('cssInput').value;
    const js = document.getElementById('jsInput').value;
    
    if (!html) {
        showStatus('❌ Please enter some HTML', 'error');
        return;
    }
    
    showStatus('🔄 Converting...', 'info');
    
    // Show preview
    const previewBox = document.getElementById('previewBox');
    previewBox.innerHTML = `<style>${css}</style>${html}`;
    
    // Generate simple JSON
    generatedJSON = {
        version: "0.4",
        title: "Converted Template",
        type: "page",
        content: [{
            id: "section_" + Date.now(),
            elType: "section",
            elements: [{
                id: "column_" + Date.now(),
                elType: "column",
                elements: [{
                    id: "widget_" + Date.now(),
                    elType: "widget",
                    widgetType: "html",
                    settings: {
                        html: `<style>${css}</style>\n${html}\n${js ? `<script>${js}</script>` : ''}`
                    }
                }]
            }]
        }]
    };
    
    document.getElementById('jsonOutput').textContent = JSON.stringify(generatedJSON, null, 2);
    document.getElementById('downloadBtn').disabled = false;
    showStatus('✅ Conversion complete!', 'success');
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

// Preview mode switching
function switchPreviewMode(mode) {
    console.log('Switching preview mode to:', mode);
    document.querySelectorAll('.preview-toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
}

// Stub functions for buttons
function testJSONQuality() {
    showStatus('🎯 Quality test feature coming soon!', 'info');
}

function showVisualDiff() {
    showStatus('👁️ Visual diff feature coming soon!', 'info');
}

function testSchemaSystem() {
    showStatus('🧪 Schema test feature coming soon!', 'info');
}

function directHTMLConvert() {
    convertToElementor();
}

function debugJSON() {
    console.log('Generated JSON:', generatedJSON);
    showStatus('🔍 Check browser console', 'info');
}

function testInPlayground() {
    showStatus('🚀 WordPress Playground feature coming soon!', 'info');
}

function closePlayground() {
    console.log('Playground closed');
}

function refreshPlaygroundTemplate() {
    console.log('Template refreshed');
}

function openElementorEditor() {
    console.log('Editor opened');
}

function viewPage() {
    console.log('Page view');
}

// Expose functions to window for onclick handlers
window.loadExample = loadExample;
window.clearInputs = clearInputs;
window.convertToElementor = convertToElementor;
window.switchPreviewMode = switchPreviewMode;
window.downloadJSON = downloadJSON;
window.testJSONQuality = testJSONQuality;
window.showVisualDiff = showVisualDiff;
window.testSchemaSystem = testSchemaSystem;
window.directHTMLConvert = directHTMLConvert;
window.debugJSON = debugJSON;
window.testInPlayground = testInPlayground;
window.closePlayground = closePlayground;
window.refreshPlaygroundTemplate = refreshPlaygroundTemplate;
window.openElementorEditor = openElementorEditor;
window.viewPage = viewPage;

// Initialize on load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Converter loading...');
    await loadWidgetSchemas();
    
    // Mode switching
    document.querySelectorAll('.mode-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.mode-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            document.getElementById('apiKeyGroup').style.display = currentMode === 'ai' ? 'block' : 'none';
            document.getElementById('assistantConfigGroup').style.display = currentMode === 'ai' ? 'block' : 'none';
        });
    });
    
    console.log('✅ Converter ready!');
});

console.log('✅ All functions exposed to window object');
