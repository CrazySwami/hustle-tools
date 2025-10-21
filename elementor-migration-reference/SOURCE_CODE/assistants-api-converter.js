/**
 * Elementor Converter using OpenAI Assistants API with Vector Store
 *
 * This module uses the Assistants API to search through Elementor widget source files
 * for accurate property names and structures.
 *
 * Workflow:
 * 1. Create a thread (conversation)
 * 2. Add message with HTML/CSS/JS
 * 3. Run assistant with file_search tool
 * 4. AI searches vector store for exact widget properties
 * 5. Poll for completion and retrieve result
 */

console.log('🤖 Assistants API Converter loading...');

// Load assistant config
let ASSISTANT_CONFIG = null;

async function loadAssistantConfig() {
    if (ASSISTANT_CONFIG) return ASSISTANT_CONFIG;

    try {
        const response = await fetch('./assistant-config.json');
        ASSISTANT_CONFIG = await response.json();
        console.log('✅ Loaded assistant config:', ASSISTANT_CONFIG);
        return ASSISTANT_CONFIG;
    } catch (error) {
        console.error('❌ Failed to load assistant-config.json:', error);
        throw new Error('Assistant configuration not found. Run setup-assistant.js first.');
    }
}

/**
 * Convert HTML/CSS/JS to Elementor JSON using Assistants API + Vector Store
 *
 * @param {string} html - HTML code
 * @param {string} css - CSS code
 * @param {string} js - JavaScript code
 * @param {string} apiKey - OpenAI API key
 * @param {object} options - Options
 * @param {function} options.onProgress - Progress callback (step, message)
 * @param {string} options.screenshot - Base64 screenshot (optional)
 * @param {string} options.screenshotDescription - AI description of screenshot (optional)
 * @param {string} options.globalStylesheet - Global styles context (optional)
 * @returns {Promise<object>} - Elementor JSON structure
 */
window.aiConvertWithAssistant = async function(html, css, js, apiKey, options = {}) {
    const { onProgress, screenshot, screenshotDescription, globalStylesheet } = options;

    if (!apiKey || !apiKey.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key');
    }

    // Load assistant configuration
    onProgress?.('config', 'Loading assistant configuration...');
    const config = await loadAssistantConfig();

    // Build the conversion prompt
    let promptParts = [
        '# TASK: Convert HTML/CSS/JavaScript to Elementor JSON',
        '',
        '## INSTRUCTIONS',
        '1. Use file_search to find EXACT property names from Elementor widget source files',
        '2. For each widget type you identify, search the vector store for its controls',
        '3. Use the exact property names and structures from the PHP source files',
        '4. Pay special attention to activation flags (typography_typography, background_background, etc.)',
        '5. Return ONLY valid JSON in this format:',
        '',
        '```json',
        '{',
        '  "widgets": [',
        '    {',
        '      "widgetType": "heading",',
        '      "settings": {',
        '        "title": "Text here",',
        '        "title_color": "#000000",',
        '        "typography_typography": "custom",',
        '        "typography_font_size": {"size": 48, "unit": "px"}',
        '      }',
        '    }',
        '  ]',
        '}',
        '```',
        '',
        '## WIDGET SELECTION RULE',
        '⚠️ ONLY use specialized widgets if they match the design EXACTLY.',
        '- Use simple widgets (heading, text-editor, button) when possible',
        '- Only use complex widgets (testimonial, pricing-table, etc.) when they perfectly match',
        '',
    ];

    // Add global stylesheet context
    if (globalStylesheet) {
        promptParts.push('## GLOBAL STYLES', globalStylesheet, '');
    }

    // Add screenshot description
    if (screenshotDescription) {
        promptParts.push('## VISUAL DESCRIPTION', screenshotDescription, '');
    }

    // Add code
    promptParts.push(
        '## HTML',
        '```html',
        html,
        '```',
        '',
        '## CSS',
        '```css',
        css,
        '```'
    );

    if (js) {
        promptParts.push('', '## JavaScript', '```javascript', js, '```');
    }

    promptParts.push(
        '',
        '## SEARCH STRATEGY',
        'For each widget you identify:',
        '1. Search: "{widgetType} widget controls" (e.g., "heading widget controls")',
        '2. Extract exact property names from add_control() calls',
        '3. Note activation flags from group controls (typography, background, etc.)',
        '4. Use the exact structure shown in the PHP files',
        '',
        'Return the complete JSON now.'
    );

    const prompt = promptParts.join('\n');

    try {
        // Step 1: Create a thread
        onProgress?.('thread', 'Creating conversation thread...');
        const thread = await createThread(apiKey);
        console.log('✅ Thread created:', thread.id);

        // Step 2: Add message to thread
        onProgress?.('message', 'Sending HTML/CSS/JS to assistant...');

        // NOTE: Assistants API doesn't support base64 image data URLs
        // Only HTTP URLs are supported. We'll use the screenshot description text instead.
        // The screenshot parameter is ignored, and screenshotDescription is used.

        if (screenshot) {
            console.warn('⚠️ Assistants API does not support base64 screenshots.');
            console.log('ℹ️ Using screenshot description text instead of image.');
        }

        // Always send text-only (screenshot description is already in prompt)
        await addMessage(apiKey, thread.id, prompt);
        console.log('✅ Message added to thread');

        // Step 3: Run the assistant
        onProgress?.('run', 'Running assistant with vector store search...');
        const run = await runAssistant(apiKey, thread.id, config.assistant_id);
        console.log('✅ Run started:', run.id);

        // Step 4: Poll for completion with progress updates
        const result = await pollRunCompletion(apiKey, thread.id, run.id, (status, details) => {
            if (status === 'in_progress' && details?.tool_calls) {
                // Show which files are being searched
                const searches = details.tool_calls
                    .filter(tc => tc.type === 'file_search')
                    .map(tc => tc.file_search?.query || 'unknown');

                if (searches.length > 0) {
                    onProgress?.('searching', `Searching vector store: ${searches.join(', ')}`);
                }
            } else if (status === 'completed') {
                onProgress?.('completed', 'Conversion complete!');
            } else {
                onProgress?.('status', `Status: ${status}`);
            }
        });

        // Step 5: Retrieve messages
        onProgress?.('retrieve', 'Retrieving generated JSON...');
        const messages = await getMessages(apiKey, thread.id);

        // Find assistant's response (most recent message)
        const assistantMessage = messages.data
            .filter(m => m.role === 'assistant')
            .sort((a, b) => b.created_at - a.created_at)[0];

        if (!assistantMessage) {
            throw new Error('No response from assistant');
        }

        // Extract text content
        const textContent = assistantMessage.content
            .filter(c => c.type === 'text')
            .map(c => c.text.value)
            .join('\n');

        console.log('📄 Assistant response:', textContent);

        // Parse JSON from response
        const jsonMatch = textContent.match(/```json\s*(\{[\s\S]*\})\s*```/) ||
                         textContent.match(/(\{[\s\S]*\})/);

        if (!jsonMatch) {
            throw new Error('No JSON found in assistant response');
        }

        const aiResponse = JSON.parse(jsonMatch[1]);

        onProgress?.('success', 'JSON generated with accurate property names!');

        return aiResponse;

    } catch (error) {
        console.error('❌ Assistants API error:', error);
        throw error;
    }
};

/**
 * Create a new thread
 */
async function createThread(apiKey) {
    const response = await fetch('http://localhost:3001/api/openai-assistant', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            action: 'createThread'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create thread');
    }

    return response.json();
}

/**
 * Add a message to a thread
 */
async function addMessage(apiKey, threadId, content) {
    const response = await fetch('http://localhost:3001/api/openai-assistant', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            action: 'addMessage',
            threadId,
            content
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add message');
    }

    return response.json();
}

/**
 * Run the assistant on a thread
 */
async function runAssistant(apiKey, threadId, assistantId) {
    // Get selected model
    const selectedModel = typeof getSelectedModel === 'function'
        ? getSelectedModel()
        : 'gpt-5-2025-08-07';

    console.log('🤖 Assistants API using model:', selectedModel);

    const response = await fetch('http://localhost:3001/api/openai-assistant', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            action: 'runAssistant',
            threadId,
            assistantId,
            model: selectedModel,
            tools: [{ type: 'file_search' }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to run assistant');
    }

    return response.json();
}

/**
 * Poll for run completion
 */
async function pollRunCompletion(apiKey, threadId, runId, onStatusChange) {
    const maxAttempts = 60; // 60 attempts = 60 seconds max
    const pollInterval = 1000; // 1 second

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const response = await fetch('http://localhost:3001/api/openai-assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                action: 'getRunStatus',
                threadId,
                runId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to check run status');
        }

        const run = await response.json();
        console.log(`⏳ Run status: ${run.status} (attempt ${attempt + 1}/${maxAttempts})`);

        onStatusChange?.(run.status, run);

        if (run.status === 'completed') {
            return run;
        } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
            throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
        } else if (run.status === 'requires_action') {
            throw new Error('Run requires action (not supported yet)');
        }

        // Status is queued or in_progress, continue polling
    }

    throw new Error('Run timeout: Assistant did not complete within 60 seconds');
}

/**
 * Get messages from a thread
 */
async function getMessages(apiKey, threadId) {
    const response = await fetch('http://localhost:3001/api/openai-assistant', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            action: 'getMessages',
            threadId
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get messages');
    }

    return response.json();
}

console.log('✅ Assistants API Converter loaded');
