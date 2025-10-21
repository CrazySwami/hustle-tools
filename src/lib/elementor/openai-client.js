/**
 * OpenAIClient - Chat Completions API with function calling for JSON editing
 */
export class OpenAIClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1';
        this.model = 'gpt-5'; // GPT-5: Flagship model with 256K context, native multimodal, better reasoning
        // Alternative options: 'gpt-5-mini' (cheaper), 'gpt-4o' (fallback), 'gpt-4.1' (workhorse)
        this.tools = this.defineTools();
    }

    /**
     * Define OpenAI function tools
     */
    defineTools() {
        return [
            {
                type: 'function',
                function: {
                    name: 'generate_json_patch',
                    description: 'Generates RFC 6902 JSON Patch operations to apply specific changes to the Elementor JSON. Each operation specifies an exact path and new value. Use this when the user wants to modify the JSON.',
                    parameters: {
                        type: 'object',
                        properties: {
                            patches: {
                                type: 'array',
                                description: 'Array of JSON Patch operations to apply',
                                items: {
                                    type: 'object',
                                    properties: {
                                        op: {
                                            type: 'string',
                                            enum: ['replace', 'add', 'remove'],
                                            description: 'The operation to perform'
                                        },
                                        path: {
                                            type: 'string',
                                            description: 'JSON Pointer path to target property (e.g., /content/0/settings/title_color)'
                                        },
                                        value: {
                                            description: 'The new value to apply (not required for remove operation)'
                                        }
                                    },
                                    required: ['op', 'path']
                                }
                            },
                            summary: {
                                type: 'string',
                                description: 'Human-readable description of what these patches accomplish'
                            }
                        },
                        required: ['patches', 'summary']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'analyze_json_structure',
                    description: 'Analyzes the user\'s CURRENT loaded JSON template. Use ONLY when user asks about THEIR SPECIFIC template: "what widgets do I have in this template?", "where is the button in my JSON?", "list my widgets". DO NOT use for general Elementor documentation questions.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query_type: {
                                type: 'string',
                                enum: ['find_property', 'list_widgets', 'get_widget_info', 'search_value'],
                                description: 'Type of analysis to perform'
                            },
                            target: {
                                type: 'string',
                                description: 'Property name, widget type, or value to search for'
                            }
                        },
                        required: ['query_type']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'open_template_in_playground',
                    description: 'Opens or refreshes the Elementor template in WordPress Playground. Use this when the user asks to view, preview, test, or open the template in WordPress/Playground. Also use after making changes if user wants to see the result.',
                    parameters: {
                        type: 'object',
                        properties: {
                            action: {
                                type: 'string',
                                enum: ['launch', 'refresh', 'open_editor'],
                                description: 'Action to perform: launch (start playground), refresh (update existing template), open_editor (open Elementor editor)'
                            },
                            message: {
                                type: 'string',
                                description: 'Optional message to show user about what is being opened/refreshed'
                            }
                        },
                        required: ['action']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'capture_playground_screenshot',
                    description: 'Captures a screenshot of the WordPress Playground to show the current template preview. Use when user wants to see how the template looks, analyze the design, or asks "show me how it looks", "take a screenshot", "capture the preview".',
                    parameters: {
                        type: 'object',
                        properties: {
                            reason: {
                                type: 'string',
                                description: 'Why the screenshot is being taken (e.g., "to analyze layout", "to show current design")'
                            }
                        },
                        required: []
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'search_elementor_docs',
                    description: 'Searches the Elementor widget documentation from the vector store. Use when user asks about ELEMENTOR DOCUMENTATION: widget properties, available settings, how widgets work. Examples: "what properties does button widget have?", "button widget documentation", "heading widget settings". DO NOT use for questions about the user\'s current JSON - use analyze_json_structure for that.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'The search query for Elementor documentation (e.g., "button widget settings", "heading widget properties", "image widget options")'
                            },
                            widget_type: {
                                type: 'string',
                                description: 'Optional specific widget type to search for (e.g., "button", "heading", "image")'
                            }
                        },
                        required: ['query']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'convert_html_to_elementor_json',
                    description: 'Converts HTML/CSS/JavaScript code into Elementor JSON format. Use when user wants to: "convert HTML to Elementor", "generate Elementor from HTML", "import HTML design", "create template from HTML". Optionally accepts an image for visual reference. Validates all widgets against vector store for accurate properties.',
                    parameters: {
                        type: 'object',
                        properties: {
                            image_description: {
                                type: 'string',
                                description: 'Optional visual description from uploaded image to guide the conversion'
                            },
                            html_code: {
                                type: 'string',
                                description: 'The HTML code to convert'
                            },
                            css_code: {
                                type: 'string',
                                description: 'The CSS code (can be empty)'
                            },
                            js_code: {
                                type: 'string',
                                description: 'The JavaScript code (can be empty)'
                            }
                        },
                        required: ['html_code']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'list_available_tools',
                    description: 'Lists all available tools and capabilities. Use when user asks "what can you do?", "help", "what tools do you have?", "show capabilities", or wants to know available features.',
                    parameters: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                }
            }
        ];
    }

    /**
     * Get system prompt with JSON context
     */
    getSystemPrompt(currentJson, webSearchEnabled = false) {
        const webSearchNote = webSearchEnabled ? `
- Web search is ENABLED: You can access real-time information from the internet to help answer questions, find examples, or research best practices
- Use web search when you need current information, documentation, or examples that aren't in your training data` : '';

        return `You are an expert Elementor JSON editor assistant. You help users edit Elementor JSON templates through natural conversation. [v2.4 - Added multi-step operations support]

You have VISION CAPABILITY - you can see and analyze images that users upload. When users share images:
- FIRST analyze what you see in the image
- Describe design elements, layouts, colors, typography, backgrounds, visual effects
- Answer questions about what's visible in the image
- Provide suggestions based on visual analysis
- Help recreate designs from screenshots or mockups
- If they ask about something in the image, DO NOT search the JSON - just describe what you see visually

IMPORTANT INSTRUCTIONS:
- When users want to MODIFY the JSON, use the generate_json_patch tool to create surgical edits
- When users ask about THEIR CURRENT JSON (e.g., "what widgets do I have?", "where is X?"), use analyze_json_structure tool
- When users ask about ELEMENTOR WIDGET DOCUMENTATION (e.g., "what properties does button have?", "how does heading widget work?"), use search_elementor_docs tool
- When users want to CONVERT HTML TO ELEMENTOR (e.g., "convert this HTML", "create from HTML", "import HTML design"), use convert_html_to_elementor_json tool
  * If they mention an image, FIRST analyze it to create image_description, THEN ask for HTML/CSS/JS
  * Guide them: "I'll convert your HTML to Elementor JSON. Please provide: 1) HTML code, 2) CSS (optional), 3) JavaScript (optional)"
  * The tool will automatically validate ALL widgets against the vector store for accurate properties
- When users want to VIEW/PREVIEW/OPEN the template, use the open_template_in_playground tool
- When users upload IMAGES, analyze them and provide detailed descriptions and suggestions
- NEVER regenerate the entire JSON - only use JSON Patch operations
- Always provide clear, human-readable descriptions of changes
- Validate that paths exist before suggesting patches

**MULTI-STEP OPERATIONS:**
You can execute MULTIPLE tools in sequence when the request requires it:
- "Find button widgets and change their color to red" → FIRST analyze_json_structure to find buttons, THEN generate_json_patch to change colors
- "List all headings then update the first one" → FIRST analyze_json_structure (list_widgets), THEN generate_json_patch
- "Search for image widget properties then add one to my JSON" → FIRST search_elementor_docs, THEN generate_json_patch
- "Show me the current widgets and change the heading color" → FIRST analyze_json_structure, THEN generate_json_patch

When doing multi-step operations:
1. Complete the first tool and get the result
2. The system will call you AGAIN with the result
3. Use that result to inform your next tool call
4. Continue until the full request is satisfied${webSearchNote}

AVAILABLE TOOLS:
1. **generate_json_patch** - Create surgical JSON edits (requires approval)
2. **analyze_json_structure** - Answer questions about YOUR current JSON structure
3. **search_elementor_docs** - Search Elementor widget documentation (properties, settings, usage)
4. **convert_html_to_elementor_json** - Convert HTML/CSS/JS to Elementor JSON (with vector store validation)
5. **open_template_in_playground** - Launch/refresh WordPress Playground preview
6. **capture_playground_screenshot** - Take screenshot of playground to analyze design
7. **list_available_tools** - Show all capabilities when user asks "what can you do?" or "help"
${webSearchEnabled ? '8. **web_search** - Search the web for current information, documentation, or examples\n' : ''}
Available actions:
- "show me the template" / "open in playground" / "preview this" → use open_template_in_playground with action: 'refresh' or 'open_editor'
- "launch playground" / "start wordpress" → use open_template_in_playground with action: 'launch'
- User wants to edit → use generate_json_patch with proper JSON Pointer paths
- User asks questions → use analyze_json_structure or answer directly${webSearchEnabled ? '\n- Need current info or examples → use web search' : ''}

Current JSON structure:
\`\`\`json
${JSON.stringify(currentJson, null, 2)}
\`\`\`

Common Elementor widget properties:
- Heading: title, title_color, typography_font_size, align
- Button: text, button_color, button_text_color, button_size, link
- Text Editor: editor (HTML content)
- Image: image (url), image_size, align

When generating patches:
1. Use exact JSON Pointer paths (e.g., /content/0/settings/title_color)
2. Ensure array indices are correct (check content array length)
3. Provide descriptive summaries
4. Use "replace" for changing existing values
5. Use "add" for new properties
6. Use "remove" for deleting properties`;
    }

    /**
     * Send message to OpenAI with function calling (and optional image)
     */
    async sendMessage(userMessage, currentJson, conversationHistory = [], imageBase64 = null, webSearchEnabled = false) {
        try {
            const tools = this.tools.map(tool => {
                if (tool.type === 'function' && tool.function) {
                    // Flatten: move function properties to top level
                    return {
                        type: 'function',
                        name: tool.function.name,
                        description: tool.function.description,
                        parameters: tool.function.parameters
                    };
                }
                return tool;
            });
            
            // Add web search if enabled (Responses API supports it!)
            if (webSearchEnabled) {
                tools.push({ type: 'web_search' });
            }

            // Build system prompt with context
            const systemPrompt = this.getSystemPrompt(currentJson, webSearchEnabled);
            
            // For Responses API, include conversation history in the input
            let fullInput = systemPrompt + '\n\n';
            if (conversationHistory.length > 0) {
                fullInput += 'Recent conversation:\n';
                conversationHistory.slice(-4).forEach(msg => {
                    fullInput += `${msg.role}: ${typeof msg.content === 'string' ? msg.content : '[content]'}\n`;
                });
                fullInput += '\n';
            }
            fullInput += `User request: ${userMessage}`;

            // Build input content (with image if provided)
            let inputContent = fullInput;
            if (imageBase64) {
                // Responses API uses input_text and input_image types
                inputContent = [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'input_text',
                                text: fullInput
                            },
                            {
                                type: 'input_image',
                                image_url: imageBase64
                            }
                        ]
                    }
                ];
            }

            // Debug log for image messages
            if (imageBase64) {
                console.log('📸 Sending message with image to OpenAI Responses API');
            }

            // Debug log for web search
            if (webSearchEnabled) {
                console.log('🌐 Web search enabled in Responses API');
            }

            // Call OpenAI Responses API (NOT Chat Completions!)
            // Prepare request payload
            const requestPayload = {
                model: this.model,
                input: inputContent,
                tools: tools,
                tool_choice: 'auto', // Let AI decide when to use tools
                max_output_tokens: 128000 // GPT-5 max (includes reasoning tokens)
            };
            
            // Only add text config for non-image requests
            // (images use multimodal format which doesn't support text config)
            if (!imageBase64) {
                requestPayload.text = {
                    verbosity: 'medium' // GPT-5 uses verbosity instead of temperature
                };
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📤 SENDING REQUEST TO OPENAI');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎯 Model:', this.model);
            console.log('💬 Input:', fullInput.substring(0, 200) + '...');
            console.log('🔧 Tools:', tools.map(t => t.name).join(', '));
            console.log('📦 Full Request Payload:', JSON.stringify(requestPayload, null, 2));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Add streaming
            requestPayload.stream = true;

            const response = await fetch(`${this.baseUrl}/responses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API error: ${response.status}`);
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullOutput = [];
            let outputText = '';
            let usageData = null;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📥 STREAMING RESPONSE FROM OPENAI');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Read stream
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                // Decode chunk
                const chunk = decoder.decode(value, {stream: true});
                buffer += chunk;

                console.log('📦 Raw chunk received:', chunk.substring(0, 200));

                // Process complete lines (SSE format: "data: {...}\n\n")
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (!line.trim() || line.startsWith(':')) continue;

                    console.log('📄 Processing line:', line.substring(0, 200));

                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') {
                            console.log('✅ Stream done marker received');
                            continue;
                        }

                        try {
                            const chunkData = JSON.parse(jsonStr);
                            console.log('🔍 Parsed chunk type:', chunkData.type);

                            // Handle different SSE event types
                            if (chunkData.type === 'response.content_part.delta') {
                                // Streaming text chunk
                                if (chunkData.delta && chunkData.delta.text) {
                                    console.log('✍️ Text delta:', chunkData.delta.text);
                                    outputText += chunkData.delta.text;
                                    // Call streaming callback if provided
                                    if (this.onStreamChunk) {
                                        this.onStreamChunk(chunkData.delta.text);
                                    }
                                }
                            } else if (chunkData.type === 'response.output_text.delta') {
                                // Alternative streaming text chunk format (GPT-5 uses this)
                                if (chunkData.delta) {
                                    console.log('✍️ Text delta (output_text):', chunkData.delta);
                                    outputText += chunkData.delta;
                                    // Call streaming callback if provided
                                    if (this.onStreamChunk) {
                                        console.log('🎯 Calling onStreamChunk callback with:', chunkData.delta);
                                        this.onStreamChunk(chunkData.delta);
                                    } else {
                                        console.warn('⚠️ onStreamChunk callback not set!');
                                    }
                                }
                            } else if (chunkData.type === 'response.output_item.done') {
                                // Full item received
                                fullOutput.push(chunkData.item);
                                console.log('📝 Output item done:', chunkData.item);
                            } else if (chunkData.type === 'response.function_call_arguments.delta') {
                                // Function call streaming
                                console.log('🔧 Function call delta');
                            } else if (chunkData.type === 'response.completed') {
                                // Response complete - capture usage data
                                console.log('✅ Response completed', chunkData);
                                // Usage can be in chunkData.usage OR chunkData.response.usage
                                const usage = chunkData.usage || chunkData.response?.usage;
                                if (usage) {
                                    usageData = {
                                        input_tokens: usage.input_tokens || 0,
                                        output_tokens: usage.output_tokens || 0,
                                        output_tokens_details: usage.output_tokens_details || {}
                                    };
                                    console.log('💰 Usage data captured:', usageData);
                                } else {
                                    console.warn('⚠️ No usage data found in response.completed event')
                                }
                            } else {
                                console.log('📦 Other event type:', chunkData.type);
                            }
                        } catch (e) {
                            console.warn('Failed to parse chunk:', jsonStr.substring(0, 100), e);
                        }
                    }
                }
            }
            
            console.log('✅ Stream complete');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Responses API structure varies - check multiple possible formats
            const output = fullOutput;
            
            // Extract tool calls and any remaining text from output items
            const toolCallItems = [];
            
            for (const item of output) {
                console.log('📄 Final output item:', item);
                
                // If text wasn't streamed, extract it from the final item
                if (item.type === 'message' && item.content && !outputText) {
                    for (const content of item.content) {
                        // Some Responses API variants use type: 'text', others 'output_text'
                        if ((content.type === 'text' || content.type === 'output_text') && content.text) {
                            console.log('📝 Extracting text from final item:', content.text);
                            outputText += content.text;
                        }
                    }
                }
                
                // Handle tool calls
                if (item.type === 'function_call') {
                    toolCallItems.push(item);
                } else if (item.type === 'web_search_call') {
                    toolCallItems.push(item);
                }
            }
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔍 PARSING RESPONSE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💬 Extracted text:', outputText);
            console.log('🔧 Tool call items found:', toolCallItems.length);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Check if AI called a custom tool (not web_search)
            const functionCalls = toolCallItems.filter(item => item.type === 'function_call');
            
            if (functionCalls.length > 0) {
                const toolCall = functionCalls[0];
                const functionName = toolCall.name;
                // Parse arguments if it's a string
                let functionArgs = toolCall.arguments || {};
                if (typeof functionArgs === 'string') {
                    try {
                        functionArgs = JSON.parse(functionArgs);
                    } catch (e) {
                        console.error('Failed to parse arguments:', functionArgs);
                        functionArgs = {};
                    }
                }

                // Execute the tool (only for our custom tools, not web_search)
                const toolResult = await this.executeTool(functionName, functionArgs, currentJson);

                return {
                    message: outputText || 'Tool executed successfully',
                    tool_call: {
                        name: functionName,
                        arguments: functionArgs,
                        result: toolResult
                    },
                    usage: usageData
                };
            }

            // Check if web search was used
            const webSearchCalls = toolCallItems.filter(item => item.type === 'web_search_call');
            if (webSearchCalls.length > 0) {
                console.log('🌐 Web search was used:', webSearchCalls);
            }

            // Return the message
            if (!outputText) {
                console.warn('⚠️ No output text found in response');
            }
            
            return {
                message: outputText || 'No response received',
                tool_call: null,
                usage: usageData
            };

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }

    /**
     * Execute a tool function
     */
    async executeTool(functionName, args, currentJson) {
        console.log('🔧 Executing tool:', functionName);
        console.log('📝 Tool arguments:', args);
        
        switch (functionName) {
            case 'generate_json_patch':
                return this.handleGeneratePatch(args, currentJson);

            case 'analyze_json_structure':
                return this.handleAnalyzeStructure(args, currentJson);
            
            case 'search_elementor_docs':
                return await this.searchElementorDocs(args);
            
            case 'convert_html_to_elementor_json':
                return await this.convertHtmlToElementor(args);

            default:
                return { error: `Unknown function: ${functionName}` };
        }
    }

    /**
     * Handle generate_json_patch tool
     */
    handleGeneratePatch(args, currentJson) {
        const { patches, summary } = args;

        // Check if patches is provided
        if (!patches) {
            console.error('No patches provided in args:', args);
            return {
                success: false,
                error: 'No patches provided. The AI must provide a "patches" array with JSON Patch operations.',
                patches: [],
                summary: summary || 'Error: Missing patches'
            };
        }

        // Check if patches is an array
        if (!Array.isArray(patches)) {
            console.error('Patches is not an array:', patches);
            return {
                success: false,
                error: 'Patches must be an array of JSON Patch operations.',
                patches: [],
                summary: summary
            };
        }

        // Validate patches
        const validation = this.validatePatches(patches, currentJson);

        if (!validation.valid) {
            return {
                success: false,
                error: validation.errors.join(', '),
                patches: patches,
                summary: summary
            };
        }

        return {
            success: true,
            patches: patches,
            summary: summary,
            validation: validation
        };
    }

    /**
     * Handle analyze_json_structure tool
     */
    handleAnalyzeStructure(args, currentJson) {
        const { query_type, target } = args;

        switch (query_type) {
            case 'find_property':
                return this.findProperty(currentJson, target);

            case 'list_widgets':
                return this.listWidgets(currentJson);

            case 'get_widget_info':
                return this.getWidgetInfo(currentJson, target);

            case 'search_value':
                return this.searchValue(currentJson, target);

            default:
                return { error: 'Unknown query type' };
        }
    }

    /**
     * Validate patches against current JSON
     */
    validatePatches(patches, currentJson) {
        const errors = [];

        // Safety check
        if (!patches || !Array.isArray(patches)) {
            errors.push('Patches must be a valid array');
            return {
                valid: false,
                errors: errors
            };
        }

        patches.forEach((patch, index) => {
            // Check if path exists for replace/remove operations
            if (patch.op === 'replace' || patch.op === 'remove') {
                const pathExists = this.checkPath(currentJson, patch.path);
                if (!pathExists) {
                    errors.push(`Patch ${index}: Path ${patch.path} does not exist`);
                }
            }

            // Check if value is provided for replace/add
            if ((patch.op === 'replace' || patch.op === 'add') && patch.value === undefined) {
                errors.push(`Patch ${index}: Value is required for ${patch.op} operation`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check if path exists in JSON
     */
    checkPath(json, path) {
        const parts = path.split('/').filter(p => p);
        let current = json;

        for (const part of parts) {
            if (current === undefined || current === null) return false;
            const index = parseInt(part);
            if (!isNaN(index) && Array.isArray(current)) {
                current = current[index];
            } else {
                current = current[part];
            }
        }

        return current !== undefined;
    }

    /**
     * Search Elementor documentation using vector store
     */
    async searchElementorDocs(args) {
        const { query, widget_type } = args;
        
        console.log('🔍 Searching Elementor docs:', query);
        
        try {
            // Check if we have assistant config
            const assistantId = window.assistantConfig?.assistant_id;
            const vectorStoreId = window.assistantConfig?.vector_store_id;
            
            if (!assistantId || !vectorStoreId) {
                console.error('❌ Vector store not configured!');
                console.log('📋 Current config:', { 
                    assistantId: assistantId || 'NOT SET', 
                    vectorStoreId: vectorStoreId || 'NOT SET',
                    windowAssistantConfig: window.assistantConfig
                });
                return {
                    success: false,
                    message: `Vector store not configured. Please ensure assistant-config.json exists with:\n- assistant_id: ${assistantId || 'MISSING'}\n- vector_store_id: ${vectorStoreId || 'MISSING'}\n\nThe file should be in the same directory as index.html.`
                };
            }
            
            // Create a thread for this search
            const threadResponse = await fetch(`${this.baseUrl}/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                    tool_resources: {
                        file_search: {
                            vector_store_ids: [vectorStoreId]
                        }
                    }
                })
            });
            
            const thread = await threadResponse.json();
            
            // Add message to thread
            await fetch(`${this.baseUrl}/threads/${thread.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                    role: 'user',
                    content: widget_type 
                        ? `Search for information about the "${widget_type}" widget: ${query}`
                        : query
                })
            });
            
            // Run the assistant
            const runResponse = await fetch(`${this.baseUrl}/threads/${thread.id}/runs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                    assistant_id: assistantId
                })
            });
            
            const run = await runResponse.json();
            
            // Poll for completion
            let runStatus = run;
            while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const statusResponse = await fetch(`${this.baseUrl}/threads/${thread.id}/runs/${run.id}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'OpenAI-Beta': 'assistants=v2'
                    }
                });
                runStatus = await statusResponse.json();
            }
            
            // Get messages
            const messagesResponse = await fetch(`${this.baseUrl}/threads/${thread.id}/messages`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            });
            
            const messages = await messagesResponse.json();
            const assistantMessage = messages.data.find(m => m.role === 'assistant');
            
            if (assistantMessage) {
                const content = assistantMessage.content[0].text.value;
                return {
                    success: true,
                    documentation: content,
                    query: query,
                    widget_type: widget_type
                };
            }
            
            return {
                success: false,
                message: 'No documentation found'
            };
            
        } catch (error) {
            console.error('Error searching Elementor docs:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Convert HTML/CSS/JS to Elementor JSON using full 5-step pipeline
     * This triggers the interactive UI flow in chat
     */
    async convertHtmlToElementor(args) {
        // This is a placeholder that returns a signal to start the interactive flow
        // The actual conversion happens in the chat UI with the HTMLToElementorConverter
        return {
            success: true,
            needs_interactive_flow: true,
            args: args
        };
    }

    /**
     * Find property in JSON
     */
    findProperty(json, propertyName) {
        const results = [];

        const traverse = (obj, path) => {
            if (typeof obj !== 'object' || obj === null) return;

            for (const key in obj) {
                const currentPath = path ? `${path}/${key}` : `/${key}`;

                if (key === propertyName) {
                    results.push({
                        path: currentPath,
                        value: obj[key]
                    });
                }

                if (typeof obj[key] === 'object') {
                    traverse(obj[key], currentPath);
                }
            }
        };

        traverse(json, '');
        return { found: results.length > 0, results };
    }

    /**
     * List all widgets (recursively finds all elements)
     */
    listWidgets(json) {
        if (!json.content || !Array.isArray(json.content)) {
            return { widgets: [], count: 0 };
        }

        const widgets = [];
        
        // Recursive function to traverse all elements
        const traverse = (elements, path) => {
            if (!Array.isArray(elements)) return;
            
            elements.forEach((element, index) => {
                const currentPath = `${path}/${index}`;
                
                widgets.push({
                    index: widgets.length,
                    id: element.id,
                    elType: element.elType,
                    widgetType: element.widgetType || element.elType,
                    path: currentPath
                });
                
                // Recursively traverse nested elements (for sections and columns)
                if (element.elements && Array.isArray(element.elements)) {
                    traverse(element.elements, `${currentPath}/elements`);
                }
            });
        };
        
        // Start traversal from content array
        traverse(json.content, '/content');

        return { 
            widgets, 
            count: widgets.length,
            summary: `Found ${widgets.length} total elements: ${widgets.filter(w => w.elType === 'section').length} sections, ${widgets.filter(w => w.elType === 'column').length} columns, ${widgets.filter(w => w.elType === 'widget').length} widgets`
        };
    }

    /**
     * Get widget info (recursively searches all elements)
     */
    getWidgetInfo(json, widgetType) {
        if (!json.content || !Array.isArray(json.content)) {
            return { found: false };
        }

        const matching = [];
        
        // Recursive function to find matching widgets
        const traverse = (elements, path) => {
            if (!Array.isArray(elements)) return;
            
            elements.forEach((element, index) => {
                const currentPath = `${path}/${index}`;
                
                // Check if this widget matches the type
                if (element.widgetType === widgetType || element.elType === widgetType) {
                    matching.push({
                        path: currentPath,
                        id: element.id,
                        elType: element.elType,
                        widgetType: element.widgetType,
                        settings: element.settings
                    });
                }
                
                // Recursively search nested elements
                if (element.elements && Array.isArray(element.elements)) {
                    traverse(element.elements, `${currentPath}/elements`);
                }
            });
        };
        
        traverse(json.content, '/content');

        return {
            found: matching.length > 0,
            count: matching.length,
            widgets: matching
        };
    }

    /**
     * Search for value in JSON
     */
    searchValue(json, searchTerm) {
        const results = [];

        const traverse = (obj, path) => {
            if (obj === null || obj === undefined) return;

            if (typeof obj === 'string' && obj.includes(searchTerm)) {
                results.push({ path, value: obj });
            } else if (typeof obj === 'object') {
                for (const key in obj) {
                    const currentPath = Array.isArray(obj)
                        ? `${path}/${key}`
                        : path ? `${path}/${key}` : `/${key}`;
                    traverse(obj[key], currentPath);
                }
            }
        };

        traverse(json, '');
        return { found: results.length > 0, results };
    }

    /**
     * Update model (for switching between gpt-4o and gpt-4o-mini)
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * Get current model
     */
    getModel() {
        return this.model;
    }
}
