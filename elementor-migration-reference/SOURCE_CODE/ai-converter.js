// AI-Enhanced Conversion Module for Elementor
console.log('🤖 AI Converter module loading...');

// Helper function to clean JSON string
function cleanJSONString(jsonStr) {
    // Fix common issues in AI-generated JSON
    // Strategy: Only escape newlines INSIDE string values, not structural JSON
    
    let result = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        const prevChar = i > 0 ? jsonStr[i - 1] : '';
        
        // Track if we're inside a string
        if (char === '"' && prevChar !== '\\') {
            inString = !inString;
            result += char;
            continue;
        }
        
        // If we're inside a string, escape special characters
        if (inString) {
            if (char === '\n') {
                result += '\\n';
            } else if (char === '\r') {
                result += '\\r';
            } else if (char === '\t') {
                result += '\\t';
            } else {
                result += char;
            }
        } else {
            // Outside strings, keep everything as-is (including newlines for formatting)
            result += char;
        }
    }
    
    return result;
}

// Helper function to fix severely broken JSON
function fixBrokenJSON(jsonStr) {
    console.warn('⚠️ Attempting aggressive JSON repair...');
    
    // Remove trailing commas
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unescaped quotes in HTML content
    jsonStr = jsonStr.replace(/"html":\s*"([^"]*?)<([^>]*?)>([^"]*?)"/g, function(match) {
        // This is a simplified fix - may need more robust handling
        return match.replace(/(?<!\\)"/g, '\\"');
    });
    
    // Remove any markdown remnants
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    return jsonStr;
}

// AI-powered converter using OpenAI
window.aiConvert = async function(html, css, js, apiKey, options = {}) {
    const { onStream } = options;
    console.log('🚀 AI Conversion Started');
    
    if (!apiKey || !apiKey.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key. Must start with sk-');
    }
    
    // Get global stylesheet if enabled
    const enableGlobalStylesheet = document.getElementById('enableGlobalStylesheet');
    const globalStylesheet = document.getElementById('globalStylesheet');
    let globalStylesContext = '';
    
    if (enableGlobalStylesheet && enableGlobalStylesheet.checked && globalStylesheet && globalStylesheet.value) {
        globalStylesContext = `\n\nGLOBAL ENVIRONMENT STYLESHEET (use these defaults):\n${globalStylesheet.value}\n`;
    }
    
    const prompt = `You are an expert at converting HTML/CSS/JavaScript to Elementor JSON format.

TASK: Convert the following HTML/CSS/JavaScript into Elementor widget structure.
${globalStylesContext}
HTML:
${html}

CSS:
${css}
${js ? `\nJavaScript:\n${js}\n` : ''}
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
- For HTML content in strings, escape special characters (use \\n for newlines, not literal newlines)
- Ensure all JSON strings are properly escaped and on a single line

Respond with ONLY the JSON, no explanations.`;

    try {
        console.log('📤 Sending to OpenAI...');
        
        // Check if vision mode is enabled and screenshot exists
        const enableVision = document.getElementById('enableVision') && document.getElementById('enableVision').checked;
        const screenshot = enableVision && window.visionScreenshot ? window.visionScreenshot : null;
        const screenshotDescription = window.screenshotDescriptionText || '';
        
        // Build messages array according to OpenAI Vision API format
        // https://platform.openai.com/docs/guides/images-vision
        let messages;
        let finalPrompt = prompt;
        
        // Add screenshot description if it exists
        if (screenshotDescription) {
            finalPrompt += '\n\nVISUAL DESCRIPTION (from AI analysis of screenshot):\n' + screenshotDescription;
            console.log('✅ Including screenshot description in prompt');
        }
        
        if (screenshot) {
            // Vision mode: Send both text and image
            messages = [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: finalPrompt + '\n\nIMAGE: The screenshot below shows how the HTML/CSS renders visually in the browser. Use this along with the code to extract accurate colors, spacing, and visual hierarchy.'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: screenshot,
                            detail: 'high'  // 'high' for more detailed analysis
                        }
                    }
                ]
            }];
            console.log('📤 Sending with vision (text + screenshot)');
        } else {
            // Text-only mode: Just the prompt
            messages = [{
                role: 'user',
                content: finalPrompt
            }];
            console.log('📤 Sending text-only mode');
        }
        
        // Get selected model (from localStorage via getSelectedModel function in main.js)
        const selectedModel = typeof getSelectedModel === 'function'
            ? getSelectedModel()
            : 'gpt-5-2025-08-07';

        const requestBody = {
            model: selectedModel,
            messages: messages,
            max_completion_tokens: 8000,
            stream: !!onStream  // Enable streaming if callback provided
        };

        console.log('🤖 Using model:', selectedModel);

        // Use local CORS proxy
        const apiUrl = 'http://localhost:3001/api/openai';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API request failed');
        }
        
        let aiResponse = '';
        
        if (onStream && response.body) {
            // Streaming mode - parse SSE events
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
                                aiResponse += content;
                                onStream(content);
                            }
                        } catch (e) {
                            console.warn('Failed to parse SSE data:', data);
                        }
                    }
                }
            }
        } else {
            // Non-streaming mode
            const data = await response.json();
            aiResponse = data.choices[0].message.content;
        }
        
        console.log('✅ AI Response received');
        console.log('Raw response:', aiResponse);
        
        // Parse JSON from response (remove markdown if present)
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, aiResponse];
        let jsonString = jsonMatch[1].trim();
        
        // Clean up JSON string to fix common AI-generated issues
        jsonString = cleanJSONString(jsonString);
        
        console.log('Cleaned JSON string:', jsonString.substring(0, 500) + '...');
        
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('Failed JSON:', jsonString);
            
            // Try one more time with more aggressive cleaning
            jsonString = fixBrokenJSON(jsonString);
            parsedResponse = JSON.parse(jsonString);
        }
        
        console.log('✅ Parsed AI response:', parsedResponse);
        
        return parsedResponse;
        
    } catch (error) {
        console.error('❌ AI Conversion error:', error);
        throw error;
    }
}

// Build Elementor JSON from AI response
function buildElementorFromAI(aiResponse) {
    const widgets = aiResponse.widgets || [];
    
    const elements = widgets.map(function(widget, index) {
        return {
            id: 'widget_' + Date.now() + '_' + index,
            elType: 'widget',
            widgetType: widget.widgetType,
            settings: widget.settings || {}
        };
    });
    
    // Wrap in section and column
    return {
        version: '0.4',
        title: 'AI Generated Template',
        type: 'page',
        content: [{
            id: 'section_' + Date.now(),
            elType: 'section',
            elements: [{
                id: 'column_' + Date.now(),
                elType: 'column',
                elements: elements
            }]
        }]
    };
}

// Expose functions
window.aiConvert = aiConvert;
window.buildElementorFromAI = buildElementorFromAI;

console.log('✅ AI Converter module loaded');
