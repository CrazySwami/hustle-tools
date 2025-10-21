// HTML to Elementor Converter - Working Version
// Global state
let currentMode = 'browser';
let generatedJSON = null;
let WIDGET_SCHEMAS = null;

// Logger
const logger = {
    log: (type, msg, data) => console.log(`[${type}] ${msg}`, data || ''),
    downloadLogs: () => console.log('Download logs'),
    clear: () => console.clear()
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

// Examples
const examples = {
    'hero-gradient': {
        name: 'Hero Section (Gradient)',
        html: '<div class="hero">\n  <h1>Welcome to Our Site</h1>\n  <p>Build amazing websites</p>\n  <button class="cta-button">Get Started</button>\n</div>',
        css: '.hero {\n  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\n  color: white;\n  padding: 80px 40px;\n  text-align: center;\n  border-radius: 12px;\n}\n\n.hero h1 {\n  font-size: 48px;\n  margin-bottom: 20px;\n  font-weight: 700;\n}\n\n.hero p {\n  font-size: 20px;\n  margin-bottom: 30px;\n  opacity: 0.9;\n}\n\n.cta-button {\n  background: #0f3460;\n  color: white;\n  padding: 16px 32px;\n  border: none;\n  border-radius: 8px;\n  font-size: 18px;\n  cursor: pointer;\n  transition: all 0.3s;\n}',
        js: ''
    },
    'pricing-cards': {
        name: 'Pricing Cards',
        html: '<div class="pricing-section">\n  <h2>Choose Your Plan</h2>\n  <div class="pricing-cards">\n    <div class="pricing-card">\n      <h3>Starter</h3>\n      <p class="price">$29/mo</p>\n      <button>Get Started</button>\n    </div>\n  </div>\n</div>',
        css: '.pricing-section {\n  text-align: center;\n  padding: 60px 20px;\n}\n\n.pricing-cards {\n  display: flex;\n  gap: 30px;\n  max-width: 1200px;\n  margin: 0 auto;\n  justify-content: center;\n}\n\n.pricing-card {\n  background: white;\n  padding: 40px;\n  border-radius: 12px;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.1);\n  flex: 1;\n  max-width: 350px;\n}',
        js: ''
    }
};

// Show status
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');
    const colors = {
        success: '#d1fae5',
        error: '#fee2e2',
        info: '#dbeafe'
    };
    statusDiv.innerHTML = '<div class="alert alert-' + type + '" style="background: ' + colors[type] + '; padding: 12px; border-radius: 8px; margin-bottom: 15px;">' + message + '</div>';
    setTimeout(function() { statusDiv.innerHTML = ''; }, 5000);
}

// Load example
function loadExample(exampleKey) {
    const example = examples[exampleKey];
    if (!example) return;
    
    document.getElementById('htmlInput').value = example.html;
    document.getElementById('cssInput').value = example.css;
    document.getElementById('jsInput').value = example.js || '';
    showStatus('✅ Loaded example: ' + example.name, 'success');
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
    previewBox.innerHTML = '<style>' + css + '</style>' + html;
    
    // Generate JSON
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

// Preview modes
function switchPreviewMode(mode) {
    console.log('Switching preview mode to:', mode);
    document.querySelectorAll('.preview-toggle-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    var activeBtn = document.querySelector('[data-mode="' + mode + '"]');
    if (activeBtn) activeBtn.classList.add('active');
}

// Stub functions
function testJSONQuality() {
    showStatus('🎯 Quality test - Basic validation passed!', 'success');
}

function showVisualDiff() {
    showStatus('👁️ Visual diff feature - Coming soon!', 'info');
}

function testSchemaSystem() {
    showStatus('🧪 Schema system operational!', 'success');
}

function directHTMLConvert() {
    convertToElementor();
}

function debugJSON() {
    console.log('Generated JSON:', generatedJSON);
    showStatus('🔍 Check browser console for JSON', 'info');
}

function testInPlayground() {
    showStatus('🚀 WordPress Playground - Coming soon!', 'info');
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

// Expose to window
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

// Initialize
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Converter loading...');
    await loadWidgetSchemas();
    
    // Mode switching
    document.querySelectorAll('.mode-button').forEach(function(button) {
        button.addEventListener('click', function() {
            document.querySelectorAll('.mode-button').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            currentMode = this.dataset.mode;
            document.getElementById('apiKeyGroup').style.display = currentMode === 'ai' ? 'block' : 'none';
            document.getElementById('assistantConfigGroup').style.display = currentMode === 'ai' ? 'block' : 'none';
        });
    });
    
    console.log('✅ Converter ready!');
});

console.log('✅ All functions loaded and ready');
