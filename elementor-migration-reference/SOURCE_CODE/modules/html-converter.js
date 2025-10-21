/**
 * HTML to Elementor Converter Module
 * Replicates the full 5-step pipeline from html-to-elementor-converter.html
 */

export class HTMLToElementorConverter {
    constructor(apiKey, assistantId, vectorStoreId) {
        this.apiKey = apiKey;
        this.assistantId = assistantId;
        this.vectorStoreId = vectorStoreId;
        this.baseUrl = 'https://api.openai.com/v1';
    }

    /**
     * STEP 1: Extract computed styles from HTML/CSS using iframe
     */
    extractComputedStyles(html, css, js) {
        console.log('🎨 STEP 1: Extracting Computed Styles');
        console.log('   → Creating hidden iframe');
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '1200px';
        iframe.style.height = '800px';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css || ''}</style>
                ${js ? `<script>${js}</script>` : ''}
            </head>
            <body>${html}</body>
            </html>
        `);
        iframeDoc.close();

        const styleData = {};

        console.log('   → Extracting getComputedStyle() for all elements');
        // Extract computed styles for all elements
        iframeDoc.body.querySelectorAll('*').forEach((element, index) => {
            const computed = window.getComputedStyle(element);
            const id = element.tagName.toLowerCase() + '_' + index;

            styleData[id] = {
                tag: element.tagName.toLowerCase(),
                text: element.textContent?.trim(),
                className: element.className,
                id: element.id,
                styles: {
                    fontSize: computed.fontSize,
                    fontFamily: computed.fontFamily,
                    fontWeight: computed.fontWeight,
                    color: computed.color,
                    backgroundColor: computed.backgroundColor,
                    backgroundImage: computed.backgroundImage,
                    padding: computed.padding,
                    paddingTop: computed.paddingTop,
                    paddingRight: computed.paddingRight,
                    paddingBottom: computed.paddingBottom,
                    paddingLeft: computed.paddingLeft,
                    margin: computed.margin,
                    marginTop: computed.marginTop,
                    marginRight: computed.marginRight,
                    marginBottom: computed.marginBottom,
                    marginLeft: computed.marginLeft,
                    border: computed.border,
                    borderWidth: computed.borderWidth,
                    borderColor: computed.borderColor,
                    borderStyle: computed.borderStyle,
                    borderRadius: computed.borderRadius,
                    textAlign: computed.textAlign,
                    display: computed.display,
                    flexDirection: computed.flexDirection,
                    justifyContent: computed.justifyContent,
                    alignItems: computed.alignItems,
                    gap: computed.gap,
                    width: computed.width,
                    height: computed.height,
                    lineHeight: computed.lineHeight,
                    letterSpacing: computed.letterSpacing,
                    textDecoration: computed.textDecoration,
                    textTransform: computed.textTransform
                }
            };
        });

        document.body.removeChild(iframe);
        console.log('   ✅ Extracted computed styles for', Object.keys(styleData).length, 'elements');
        
        return styleData;
    }

    /**
     * STEP 2: Convert HTML to Elementor JSON using AI + Vector Store
     */
    async convertWithAI(html, css, js, computedStyles, imageDescription = null) {
        console.log('🤖 STEP 2: AI Conversion with Vector Store');
        console.log('   → Preparing AI prompt with computed styles');
        
        const prompt = `Convert this HTML/CSS/JavaScript to Elementor JSON format.

${imageDescription ? `VISUAL REFERENCE:\n${imageDescription}\n\n` : ''}ORIGINAL HTML:
\`\`\`html
${html}
\`\`\`

${css ? `ORIGINAL CSS:\n\`\`\`css\n${css}\n\`\`\`` : ''}

${js ? `ORIGINAL JAVASCRIPT:\n\`\`\`js\n${js}\n\`\`\`` : ''}

COMPUTED STYLES DATA:
You are provided with getComputedStyle() values from the rendered DOM. Use these EXACT values:
- fontSize → typography_font_size: {size: parseInt(value), unit: "px"}
- fontWeight → typography_font_weight
- color (rgb) → Convert to hex for title_color/text_color/button_text_color
- backgroundColor (rgb) → Convert to hex for background_color
- backgroundImage → Extract gradient for background_gradient
- padding/margin → Apply to container spacing
- borderRadius → Apply to border_radius
- textAlign → Apply to align

\`\`\`json
${JSON.stringify(computedStyles, null, 2)}
\`\`\`

CRITICAL REQUIREMENTS:
1. MANDATORY: Use search_elementor_docs tool for EVERY widget to validate properties
2. Generate proper structure:
   - Containers: {elType: "container", NO widgetType, elements: []}
   - Widgets: {elType: "widget", widgetType: "heading|text-editor|button|image"}
3. Convert ALL rgb() colors to hex format
4. Include activation flags:
   - typography_typography: "custom" (when setting fonts)
   - background_background: "classic" or "gradient"
5. Use exact property names from vector store documentation
6. Apply computed styles to Elementor settings
7. Return complete Elementor JSON with version: "0.4"

Generate the Elementor JSON now.`;

        console.log('   → Sending to OpenAI with vector store access');
        
        const response = await fetch(`${this.baseUrl}/threads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                tool_resources: {
                    file_search: {
                        vector_store_ids: [this.vectorStoreId]
                    }
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to create thread: ${errorData.error?.message || response.statusText}`);
        }

        const thread = await response.json();
        const threadId = thread.id;

        // Add message to thread
        const messageResponse = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                role: 'user',
                content: prompt
            })
        });

        if (!messageResponse.ok) {
            const errorData = await messageResponse.json().catch(() => ({}));
            throw new Error(`Failed to add message: ${errorData.error?.message || messageResponse.statusText}`);
        }

        // Run the assistant
        const runResponse = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                assistant_id: this.assistantId
            })
        });

        if (!runResponse.ok) {
            const errorData = await runResponse.json().catch(() => ({}));
            throw new Error(`Failed to run assistant: ${errorData.error?.message || runResponse.statusText}`);
        }

        const run = await runResponse.json();
        const runId = run.id;

        // Poll for completion
        console.log('   → Waiting for AI to search vector store and generate JSON...');
        let runStatus = await this.pollRunStatus(threadId, runId);

        // Get messages
        const messagesResponse = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        const messages = await messagesResponse.json();
        const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
        
        if (!assistantMessage) {
            throw new Error('No response from assistant');
        }

        const textContent = assistantMessage.content.find(c => c.type === 'text');
        if (!textContent) {
            throw new Error('No text content in response');
        }

        console.log('   ✅ AI conversion complete');
        
        // Extract JSON from response
        const responseText = textContent.text.value;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        
        let elementorJson;
        if (jsonMatch) {
            elementorJson = JSON.parse(jsonMatch[1]);
        } else {
            // Try to parse as JSON directly
            elementorJson = JSON.parse(responseText);
        }

        return elementorJson;
    }

    /**
     * Poll run status until complete
     */
    async pollRunStatus(threadId, runId) {
        while (true) {
            const statusResponse = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            const status = await statusResponse.json();
            
            if (status.status === 'completed') {
                return status;
            } else if (status.status === 'failed' || status.status === 'cancelled' || status.status === 'expired') {
                throw new Error(`Run ${status.status}: ${status.last_error?.message || 'Unknown error'}`);
            }

            // Wait 1 second before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    /**
     * STEP 3: Post-Processing - Enforce structure and properties
     */
    postProcess(json, computedStyles) {
        console.log('✅ STEP 3: Post-Processing');
        console.log('   → Enforcing activation flags');
        console.log('   → Removing widgetType from containers');
        console.log('   → Adding required properties');
        
        // Traverse all elements
        const processElement = (element) => {
            // Ensure required properties
            if (!element.id) {
                element.id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            if (!element.settings) {
                element.settings = {};
            }
            
            if (!element.elements) {
                element.elements = [];
            }

            // Container-specific
            if (element.elType === 'container') {
                // Remove widgetType if AI added it incorrectly
                if (element.widgetType) {
                    console.log(`   ⚠️ Removing widgetType from container ${element.id}`);
                    delete element.widgetType;
                }
                element.isInner = element.isInner !== undefined ? element.isInner : false;
            }

            // Widget-specific
            if (element.elType === 'widget') {
                if (!element.widgetType) {
                    console.warn(`   ⚠️ Widget ${element.id} missing widgetType!`);
                    element.widgetType = 'text-editor'; // Default fallback
                }
            }

            // Enforce typography activation
            const typographyProps = ['typography_font_size', 'typography_font_weight', 'typography_font_family'];
            const hasTypography = typographyProps.some(prop => element.settings[prop]);
            if (hasTypography && !element.settings.typography_typography) {
                element.settings.typography_typography = 'custom';
            }

            // Enforce background activation
            const backgroundProps = ['background_color', 'background_image'];
            const gradientProps = ['background_gradient_type', 'background_gradient_color', 'background_gradient_color_b'];
            const hasBackground = backgroundProps.some(prop => element.settings[prop]);
            const hasGradient = gradientProps.some(prop => element.settings[prop]);
            
            if (hasGradient && !element.settings.background_background) {
                element.settings.background_background = 'gradient';
            } else if (hasBackground && !element.settings.background_background) {
                element.settings.background_background = 'classic';
            }

            // Process children recursively
            if (element.elements && Array.isArray(element.elements)) {
                element.elements.forEach(child => processElement(child));
            }
        };

        if (json.content && Array.isArray(json.content)) {
            json.content.forEach(element => processElement(element));
        }

        console.log('   ✅ Post-processing complete');
        return json;
    }

    /**
     * STEP 4: Validate JSON structure
     */
    validate(json) {
        console.log('🔍 STEP 4: Validating JSON Structure');
        const errors = [];
        const warnings = [];

        const validateElement = (element, path = '') => {
            const currentPath = path ? `${path}/${element.id}` : element.id;

            // Check required properties
            if (!element.id) errors.push(`${currentPath}: Missing 'id'`);
            if (!element.elType) errors.push(`${currentPath}: Missing 'elType'`);
            if (!element.settings) errors.push(`${currentPath}: Missing 'settings'`);
            if (!element.elements) errors.push(`${currentPath}: Missing 'elements' array`);

            // Validate container
            if (element.elType === 'container') {
                if (element.widgetType) {
                    errors.push(`${currentPath}: Container should NOT have widgetType`);
                }
                if (element.isInner === undefined) {
                    warnings.push(`${currentPath}: Container missing 'isInner' property`);
                }
            }

            // Validate widget
            if (element.elType === 'widget') {
                if (!element.widgetType) {
                    errors.push(`${currentPath}: Widget missing widgetType`);
                }
            }

            // Validate children
            if (element.elements && Array.isArray(element.elements)) {
                element.elements.forEach(child => validateElement(child, currentPath));
            }
        };

        if (json.content && Array.isArray(json.content)) {
            json.content.forEach(element => validateElement(element));
        }

        console.log(`   → Found ${errors.length} errors, ${warnings.length} warnings`);
        
        if (errors.length > 0) {
            console.error('   ❌ Validation errors:', errors);
        }
        
        if (warnings.length > 0) {
            console.warn('   ⚠️ Warnings:', warnings);
        }

        if (errors.length === 0) {
            console.log('   ✅ Validation passed');
        }

        return { valid: errors.length === 0, errors, warnings };
    }

    /**
     * Helper: Convert RGB to Hex
     */
    rgbToHex(color) {
        if (!color) return null;
        if (color.startsWith('#')) return color.toUpperCase();
        if (color === 'transparent') return null;
        const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/i);
        if (!m) return null;
        const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
        const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
        const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    /**
     * Full conversion pipeline
     */
    async convert(html, css, js, imageDescription = null, onProgress = null) {
        try {
            // Step 1: Extract computed styles
            if (onProgress) onProgress('step1', 'Extracting computed styles from rendered HTML...');
            const computedStyles = this.extractComputedStyles(html, css, js);

            // Step 2: AI conversion with vector store
            if (onProgress) onProgress('step2', 'Converting to Elementor JSON with AI + Vector Store...');
            let elementorJson = await this.convertWithAI(html, css, js, computedStyles, imageDescription);

            // Step 3: Post-processing
            if (onProgress) onProgress('step3', 'Post-processing: enforcing structure and properties...');
            elementorJson = this.postProcess(elementorJson, computedStyles);

            // Step 4: Validation
            if (onProgress) onProgress('step4', 'Validating JSON structure...');
            const validation = this.validate(elementorJson);

            // Step 5: Done
            if (onProgress) onProgress('step5', 'Conversion complete!');

            return {
                success: true,
                json: elementorJson,
                validation,
                stats: {
                    html_length: html.length,
                    css_length: css.length,
                    js_length: js.length,
                    elements_with_computed_styles: Object.keys(computedStyles).length,
                    had_image_description: !!imageDescription
                }
            };

        } catch (error) {
            console.error('❌ Conversion failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
