/**
 * Image-to-HTML Generator
 * Uses GPT-5 Vision to analyze screenshot and generate clean HTML/CSS/JS
 */

console.log('🖼️ Image-to-HTML Generator loading...');

/**
 * Generate HTML/CSS/JS from an image using GPT-5 Vision
 *
 * @param {string} imageDataUrl - Base64 image data URL
 * @param {string} apiKey - OpenAI API key
 * @param {object} options - Options
 * @param {function} options.onProgress - Progress callback
 * @param {boolean} options.autoConvert - Auto-convert to Elementor after generation
 * @returns {Promise<{html: string, css: string, js: string}>}
 */
window.generateHTMLFromImage = async function(imageDataUrl, apiKey, options = {}) {
    const { onProgress, autoConvert = false } = options;

    if (!apiKey || !apiKey.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key');
    }

    if (!imageDataUrl) {
        throw new Error('No image provided');
    }

    onProgress?.('analyzing', 'Analyzing image with GPT-5 Vision...');

    // Get selected model
    const selectedModel = typeof getSelectedModel === 'function'
        ? getSelectedModel()
        : 'gpt-5-2025-08-07';

    console.log('🖼️ Analyzing image with model:', selectedModel);

    const prompt = `You are an expert at converting images/screenshots of web designs into clean, semantic HTML/CSS/JavaScript code.

TASK: Analyze this image and generate production-ready HTML/CSS/JavaScript that recreates the design.

IMPORTANT INSTRUCTIONS:
1. **Analyze the visual hierarchy** - Identify headings, body text, buttons, images, sections
2. **Generate semantic HTML** - Use proper HTML5 tags (header, section, article, etc.)
3. **Extract exact styling** - Colors, fonts, spacing, borders, shadows from the image
4. **Make it responsive** - Use modern CSS (flexbox, grid) for mobile-friendly layout
5. **Keep it clean** - Well-formatted, commented, production-ready code
6. **No placeholders** - Use actual content from the image (or realistic alternatives)

RESPONSE FORMAT (return ONLY this JSON, no markdown):
{
  "html": "<!DOCTYPE html>\\n<html>\\n<head>...</head>\\n<body>...</body>\\n</html>",
  "css": "/* Extracted styles from image */\\nbody { ... }",
  "js": "// Interactive functionality if needed\\n// Leave empty if no JavaScript required"
}

DESIGN GUIDELINES:
- Extract exact colors from the image (use hex codes)
- Match font sizes and weights as closely as possible
- Preserve spacing and alignment from the design
- If there are gradients/shadows, include them
- If there are hover effects visible, implement them in CSS
- Use CSS custom properties for colors/fonts for easy theming

Return the JSON now.`;

    try {
        const response = await fetch('http://localhost:3001/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageDataUrl,
                                detail: 'high'
                            }
                        }
                    ]
                }],
                max_completion_tokens: 8000,
                stream: true  // Enable streaming for faster perceived response
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Vision API request failed');
        }

        onProgress?.('streaming', 'AI is generating code... (streaming)');

        // Stream the response
        let fullResponse = '';
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
                            fullResponse += content;
                            // Show progress with character count
                            onProgress?.('streaming', `Generating... (${fullResponse.length} chars)`);
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', data);
                    }
                }
            }
        }

        const content = fullResponse;

        if (!content) {
            throw new Error('No response from AI');
        }

        console.log('📄 AI response length:', content.length, 'characters');

        // Parse JSON from response
        const jsonMatch = content.match(/```json\s*(\{[\s\S]*\})\s*```/) ||
                         content.match(/(\{[\s\S]*\})/);

        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        const result = JSON.parse(jsonMatch[1]);

        // Validate result
        if (!result.html || !result.css) {
            throw new Error('Invalid response format: missing html or css');
        }

        // Ensure js exists (can be empty string)
        result.js = result.js || '';

        onProgress?.('success', 'HTML/CSS/JS generated successfully!');

        console.log('✅ Generated HTML length:', result.html.length);
        console.log('✅ Generated CSS length:', result.css.length);
        console.log('✅ Generated JS length:', result.js.length);

        // Auto-convert to Elementor if enabled
        if (autoConvert && typeof convertToElementor === 'function') {
            onProgress?.('converting', 'Auto-converting to Elementor JSON...');

            // Fill in the input fields
            document.getElementById('htmlInput').value = result.html;
            document.getElementById('cssInput').value = result.css;
            if (document.getElementById('jsInput')) {
                document.getElementById('jsInput').value = result.js;
            }

            // Trigger conversion after a short delay
            setTimeout(() => {
                convertToElementor();
            }, 500);
        }

        return result;

    } catch (error) {
        console.error('❌ Image-to-HTML generation error:', error);
        throw error;
    }
};

console.log('✅ Image-to-HTML Generator loaded');
