import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { tools } from '@/lib/tools';
import { Comment } from '@/components/editor/CommentExtension';
import { apiMonitor } from '@/lib/api-monitor';
import { validatePromptTokens, getTokenUsageRecommendation, estimateMessagesTokens, estimateTokenCount, getModelContextLimit } from '@/lib/token-validator';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Models that support reasoning with their specific configuration
const REASONING_MODELS = {
  // OpenAI models
  'openai/gpt-5': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/gpt-5-mini': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o1': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o3': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o4-mini': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  // Anthropic models
  'anthropic/claude-haiku-4.5-20251022': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  'anthropic/claude-sonnet-4.5-20250514': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  'anthropic/claude-3-7-sonnet-20250219': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  'anthropic/claude-sonnet-4-20250514': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  'anthropic/claude-opus-4-20250514': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  // Deepseek models
  'deepseek/deepseek-r1': {
    provider: 'deepseek',
    config: {} // Deepseek R1 has built-in reasoning support
  },
  'deepseek/deepseek-r1-distill-llama-70b': {
    provider: 'deepseek',
    config: {} // Deepseek R1 distill also has built-in reasoning support
  }
};

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log('--- Received POST /api/chat request ---');
    console.log('Checking environment variable AI_GATEWAY_API_KEY:', process.env.AI_GATEWAY_API_KEY ? 'Set' : 'Not Set');

    const {
      messages,
      model = 'anthropic/claude-haiku-4-5-20251001', // Default to Haiku if not provided
      webSearch,
      enableReasoning = false, // New parameter to toggle reasoning
      enableTools = true, // New parameter to toggle tool calling
      documentContent, // Document content for the getDocumentContent tool
      comments,
      currentSection, // For Elementor editor (if called from there)
    }: {
      messages: UIMessage[];
      model?: string; // Make optional since we provide default
      webSearch: boolean;
      enableReasoning?: boolean;
      enableTools?: boolean;
      documentContent?: string;
      comments?: Comment[];
      currentSection?: any;
    } = await req.json();

    // Detect if this is an Elementor editor request
    const isElementorRequest = !!currentSection;
    console.log('🎨 Elementor request detected:', isElementorRequest);

    console.log('Request body parsed:', { 
      model, 
      webSearch, 
      enableReasoning,
      enableTools,
      messageCount: messages?.length || 0,
      messagesStructure: messages?.map(m => ({ 
        id: m.id, 
        role: m.role, 
        hasContent: !!m.content,
        hasParts: !!m.parts,
        partsLength: m.parts?.length || 0
      })) || []
    });

    // Validate messages array
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return new Response(
        JSON.stringify({ error: 'Invalid messages format', details: 'Messages must be an array' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize messages - ensure they have the correct structure
    const normalizedMessages = messages.map((msg: any) => {
      // If message has both content and parts, or only content, normalize to parts structure
      if (msg.content && !msg.parts) {
        return {
          ...msg,
          parts: [{ type: 'text', text: msg.content }]
        };
      }
      // If message has parts but they're not properly formatted
      if (msg.parts && Array.isArray(msg.parts)) {
        return {
          ...msg,
          parts: msg.parts.map((part: any) => {
            // Ensure each part has proper type and text/content
            if (typeof part === 'string') {
              return { type: 'text', text: part };
            }
            if (part.type === 'text' && !part.text && part.content) {
              return { type: 'text', text: part.content };
            }
            return part;
          })
        };
      }
      return msg;
    });

    // Convert messages with error handling
    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(normalizedMessages);
      console.log('Converted messages:', JSON.stringify(convertedMessages, null, 2));
    } catch (error: any) {
      console.error('Error converting messages:', error);
      console.error('Original messages:', JSON.stringify(messages, null, 2));
      console.error('Normalized messages:', JSON.stringify(normalizedMessages, null, 2));
      return new Response(
        JSON.stringify({ error: 'Message conversion failed', details: error.message }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Configure the model based on selection and web search preference
    let selectedModel = model;
    let systemPrompt = 'You are a helpful assistant that can answer questions and help with tasks';
    
    // Enable web search for Perplexity models
    if (webSearch && model.startsWith('perplexity/')) {
      console.log('Web search enabled with Perplexity model:', model);
      // Perplexity models have built-in web search capabilities
      systemPrompt = 'You are a helpful assistant. ALWAYS USE SEARCH to provide accurate and up-to-date information with sources. Keep responses concise and focused.';
    } else if (webSearch) {
      console.log('Web search requested but not available for non-Perplexity model:', model);
      systemPrompt = 'You are a helpful assistant that can answer questions and help with tasks. Note: Web search was requested but is only available with Perplexity models.';
    }

    // Add tool calling instructions to system prompt if tools are enabled
    if (enableTools) {
      systemPrompt += `

**IMPORTANT TOOL CALLING INSTRUCTIONS:**

You have access to these tools:
- **googleSearch**: Use this tool whenever users ask you to search Google, find search results, check rankings, research keywords, or ask "what are the top results for X". ALWAYS use this tool for search queries instead of providing text-only answers.
- **getWeather**: Use for weather information
- **calculate**: Use for mathematical calculations
- **generateCode**: Use for code generation
- **manageTask**: Use for task management

**CRITICAL:** When a user says things like:
- "search Google for..."
- "find me search results for..."
- "what are the top results for..."
- "check Google rankings for..."
- "search for..."

You MUST call the googleSearch tool with the appropriate keyword. DO NOT just provide a text response. The tool will show a rich UI with organic results, knowledge graph, featured snippets, and more.

After using a tool, provide a brief text response that contextualizes the tool results for the user.`;
    }

    // Add Elementor-specific instructions if this is an Elementor request
    if (isElementorRequest) {
      systemPrompt += `\n\n**ELEMENTOR EDITOR MODE ACTIVE**

You are now assisting with the Elementor Section Builder.

**📁 CURRENT FILES IN EDITOR:**
${currentSection && (currentSection.html || currentSection.css || currentSection.js || currentSection.php) ? `
✅ **YES - You have full access to all code files below:**

**Section Name:** ${currentSection.name || 'Untitled'}

**📄 HTML FILE (${currentSection.html?.length || 0} characters):**
\`\`\`html
${currentSection.html?.substring(0, 5000) || '(empty file)'}
${currentSection.html?.length > 5000 ? '\n...(file continues - total ' + currentSection.html.length + ' chars)' : ''}
\`\`\`

**🎨 CSS FILE (${currentSection.css?.length || 0} characters):**
\`\`\`css
${currentSection.css?.substring(0, 5000) || '(empty file)'}
${currentSection.css?.length > 5000 ? '\n...(file continues - total ' + currentSection.css.length + ' chars)' : ''}
\`\`\`

**⚡ JS FILE (${currentSection.js?.length || 0} characters):**
\`\`\`javascript
${currentSection.js?.substring(0, 3000) || '(empty file)'}
${currentSection.js?.length > 3000 ? '\n...(file continues - total ' + currentSection.js.length + ' chars)' : ''}
\`\`\`

**🔧 PHP FILE (${currentSection.php?.length || 0} characters):**
\`\`\`php
${currentSection.php?.substring(0, 5000) || '(empty file)'}
${currentSection.php?.length > 5000 ? '\n...(file continues - total ' + currentSection.php.length + ' chars)' : ''}
\`\`\`

**Available Tools:**
- **editCodeWithMorph**: 🎯 THE ONLY CODE TOOL - Use this for ALL code writing/editing (works on both empty and existing files).

**CRITICAL INSTRUCTIONS:**
When user asks to write/edit/modify ANY code, you MUST use editCodeWithMorph tool.
` : `
❌ NO - No section currently loaded in the editor.

The editor is empty. You can write new code directly using the \`editCodeWithMorph\` tool.
`}`;
    }

    // Configure options based on model type
    const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;
    console.log('StreamText options:', options || 'none');

    // Configure provider options for reasoning if enabled and model supports it
    let providerOptions = undefined;

    if (enableReasoning && model in REASONING_MODELS) {
      const reasoningConfig = REASONING_MODELS[model as keyof typeof REASONING_MODELS];
      console.log(`Enabling reasoning for ${model} with provider ${reasoningConfig.provider}`);

      providerOptions = {
        [reasoningConfig.provider]: reasoningConfig.config
      };
      console.log('Provider options for reasoning:', JSON.stringify(providerOptions, null, 2));
    }

    console.log('Calling streamText with:', { 
      selectedModel, 
      systemPrompt, 
      options, 
      providerOptions,
      toolsEnabled: enableTools 
    });

    // Create tools with document content context
    // If this is an Elementor request, include Elementor-specific tools
    const baseTools = isElementorRequest ? {
      ...tools,
      // Elementor-specific tools (ONLY editCodeWithMorph)
      editCodeWithMorph: tools.editCodeWithMorph,
    } : tools;

    const toolsWithDocumentContent = enableTools ? {
      ...baseTools,
      getDocumentContent: {
        ...tools.getDocumentContent,
        execute: async ({ requestType = 'full' }) => {
          if (!documentContent) {
            return {
              requestType,
              content: 'No document content available',
              wordCount: 0,
              characterCount: 0,
              timestamp: new Date().toISOString(),
              message: 'No document content was provided'
            };
          }

          const wordCount = documentContent.split(/\s+/).filter(word => word.length > 0).length;
          const characterCount = documentContent.length;

          return {
            requestType,
            content: documentContent,
            wordCount,
            characterCount,
            comments: comments || [],
            timestamp: new Date().toISOString(),
            message: 'Document content and comments retrieved successfully'
          };
        }
      }
    } : undefined;

    console.log('🔧 Tools configured:', Object.keys(toolsWithDocumentContent || {}));

    // Check if the last user message mentions keywords that should force tool usage (for Elementor requests)
    let toolChoice: 'auto' | 'required' | { type: 'tool'; toolName: 'planSteps' } | undefined = undefined;

    // Extract user text for all keyword detection
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    // Safely extract text from message - handle both content string and parts array
    let userText = '';
    if (lastUserMessage) {
      if ('content' in lastUserMessage && typeof lastUserMessage.content === 'string') {
        userText = lastUserMessage.content;
      } else if ('parts' in lastUserMessage && Array.isArray(lastUserMessage.parts)) {
        const textPart = lastUserMessage.parts.find((p: any) =>
          p && typeof p === 'object' && 'type' in p && p.type === 'text' && 'text' in p
        );
        userText = (textPart as any)?.text || '';
      }
    }

    if (isElementorRequest && messages.length > 0) {
      const forceToolKeywords = [
        'test ping', 'ping test', 'ping',
        'change', 'edit', 'update', 'modify',
        'switch tab', 'open', 'navigate to', 'go to',
        'h1', 'h2', 'h3', 'heading', 'title',
        'div', 'section', 'container',
      ];

      const shouldForceTool = forceToolKeywords.some(keyword =>
        userText.toLowerCase().includes(keyword)
      );

      if (shouldForceTool) {
        toolChoice = 'required';
        console.log('🎯 Forcing tool usage for Elementor request with keywords:', userText.substring(0, 100));
      }
    }

    // 🎯 Multi-step planning detection for blog planner
    const isMultiStepRequest =
      userText.toLowerCase().includes(' and ') &&
      (userText.toLowerCase().includes('plan') || userText.toLowerCase().includes('write') ||
       userText.toLowerCase().includes('create') || userText.toLowerCase().includes('generate'));

    if (isMultiStepRequest && !currentSection) {
      console.log('🎯🎯🎯 MULTI-STEP DETECTED! Forcing planSteps tool');
      toolChoice = {
        type: 'tool',
        toolName: 'planSteps' as const
      };
    }

    // For Claude models, we'll just use the system prompt as-is
    // Cache control will be added via experimental_providerMetadata if needed in the future

    // Validate token count before sending to model (async image-aware counting)
    const messagesTokens = await estimateMessagesTokens(convertedMessages, selectedModel);
    const systemTokens = estimateTokenCount(systemPrompt);
    const totalInputTokens = systemTokens + messagesTokens;

    const contextLimit = getModelContextLimit(selectedModel);
    const effectiveLimit = contextLimit - 4000; // Reserve for output

    const percentUsed = (totalInputTokens / effectiveLimit) * 100;
    const exceeded = Math.max(0, totalInputTokens - effectiveLimit);

    let validation = {
      isValid: totalInputTokens <= effectiveLimit,
      tokenCount: totalInputTokens,
      limit: effectiveLimit,
      percentUsed,
      exceeded,
      warning: percentUsed > 75 ? `Prompt uses ${percentUsed.toFixed(1)}% of context window.` : undefined,
      error: totalInputTokens > effectiveLimit ? `Prompt exceeds model context limit by ${exceeded.toLocaleString()} tokens.` : undefined,
    };

    console.log('📊 Token validation (before management):', {
      model: selectedModel,
      tokenCount: validation.tokenCount.toLocaleString(),
      limit: validation.limit.toLocaleString(),
      percentUsed: validation.percentUsed.toFixed(1) + '%',
      isValid: validation.isValid,
    });

    // Auto-manage conversation window if needed
    let managedMessages = convertedMessages;
    let windowStrategy: 'full' | 'sliding-window' | 'summarized' | 'exceeded' = 'full';

    if (validation.percentUsed >= 70 || !validation.isValid) {
      const { manageConversationWindow } = await import('@/lib/token-validator');

      const conversationMessages = convertedMessages.map((msg: any) => ({
        role: msg.role,
        content: Array.isArray(msg.content)
          ? msg.content.map((c: any) => c.text || '').join('\n')
          : msg.content,
      }));

      const windowResult = manageConversationWindow(
        conversationMessages,
        systemPrompt,
        selectedModel
      );

      console.log('🔄 Conversation window management:', {
        strategy: windowResult.strategy,
        originalMessages: windowResult.originalMessageCount,
        keptMessages: windowResult.keptMessageCount,
        summarizedCount: windowResult.summarizedCount,
      });

      if (windowResult.strategy !== 'full') {
        managedMessages = windowResult.messages.map((msg: any) => ({
          role: msg.role,
          content: [{ type: 'text', text: msg.content }],
        }));

        windowStrategy = windowResult.strategy;

        // Re-validate with managed messages (async image-aware counting)
        const managedMessagesTokens = await estimateMessagesTokens(managedMessages, selectedModel);
        const managedTotalTokens = systemTokens + managedMessagesTokens;
        const managedPercentUsed = (managedTotalTokens / effectiveLimit) * 100;
        const managedExceeded = Math.max(0, managedTotalTokens - effectiveLimit);

        validation = {
          isValid: managedTotalTokens <= effectiveLimit,
          tokenCount: managedTotalTokens,
          limit: effectiveLimit,
          percentUsed: managedPercentUsed,
          exceeded: managedExceeded,
          warning: managedPercentUsed > 75 ? `Prompt uses ${managedPercentUsed.toFixed(1)}% of context window.` : undefined,
          error: managedTotalTokens > effectiveLimit ? `Prompt exceeds model context limit by ${managedExceeded.toLocaleString()} tokens.` : undefined,
        };

        console.log('📊 Token validation (after management):', {
          tokenCount: validation.tokenCount.toLocaleString(),
          percentUsed: validation.percentUsed.toFixed(1) + '%',
          isValid: validation.isValid,
        });
      }
    }

    if (!validation.isValid) {
      console.error('❌ Prompt exceeds token limit even after management');
      return Response.json({
        error: 'Conversation too large',
        details: 'Even after applying conversation management, the context exceeds model limits. Please start a new conversation.',
        tokenCount: validation.tokenCount,
        limit: validation.limit,
        exceeded: validation.exceeded,
        strategy: windowStrategy,
      }, { status: 400 });
    }

    const result = streamText({
      model: selectedModel,
      messages: managedMessages, // Use managed messages
      system: systemPrompt,
      providerOptions,
      // Only include tools if enabled
      ...(enableTools && {
        tools: toolsWithDocumentContent,
        maxSteps: 10, // Allow up to 10 tool calls for complex workflows
        ...(toolChoice && { toolChoice }),
      }),
      onFinish: async ({ usage, experimental_providerMetadata }) => {
        const responseTime = Date.now() - startTime;
        const [provider, modelName] = selectedModel.includes('/')
          ? selectedModel.split('/')
          : ['unknown', selectedModel];

        // Log Claude cache metrics if available
        const cacheMetrics = (experimental_providerMetadata as any)?.anthropic;
        if (cacheMetrics) {
          console.log('💰 Claude Cache Metrics:', {
            cacheCreationInputTokens: cacheMetrics.cacheCreationInputTokens || 0,
            cacheReadInputTokens: cacheMetrics.cacheReadInputTokens || 0,
            savings: cacheMetrics.cacheReadInputTokens
              ? `${((cacheMetrics.cacheReadInputTokens / (usage?.promptTokens || 1)) * 90).toFixed(0)}% saved`
              : 'No cache hit'
          });
        }

        apiMonitor.log({
          endpoint: '/api/chat',
          method: 'POST',
          provider,
          model: modelName || selectedModel,
          responseStatus: 200,
          responseTime,
          success: true,
          promptTokens: usage?.promptTokens || 0,
          completionTokens: usage?.completionTokens || 0,
          totalTokens: usage?.totalTokens || 0,
        });
      },
    });

    console.log('--- Sending stream response ---');

    // send sources, reasoning, and usage metadata to the client
    // CORRECT: Use messageMetadata callback to send usage data
    try {
      return result.toUIMessageStreamResponse({
        sendSources: true,
        sendReasoning: true,
        messageMetadata: ({ part }) => {
          // Guard against undefined part
          if (!part || !part.type) {
            return undefined;
          }

          // Send usage data when stream completes
          if (part.type === 'finish') {
            console.log('✅ Sending usage metadata - part:', JSON.stringify(part, null, 2));

            // Extract usage data from part
            const usage = part.totalUsage || {};

            // Calculate token usage recommendation
            const recommendation = getTokenUsageRecommendation(validation.percentUsed);

            return {
              promptTokens: usage.inputTokens || 0,
              completionTokens: usage.outputTokens || 0,
              totalTokens: usage.totalTokens || 0,
              cacheCreationTokens: 0, // Not available in totalUsage
              cacheReadTokens: usage.cachedInputTokens || 0,
              model,
              // Add context window info for frontend
              contextWindow: {
                tokenCount: validation.tokenCount,
                limit: validation.limit,
                percentUsed: validation.percentUsed,
                level: recommendation.level,
                message: recommendation.message,
                action: recommendation.action,
                model: selectedModel,
                strategy: windowStrategy, // 'full', 'sliding-window', 'summarized', or 'exceeded'
              },
            };
          }
        },
      });
    } catch (streamError: unknown) {
      console.error('[Stream Error]', streamError);
      // If streaming fails, return the error but don't crash
      const errorMessage = streamError instanceof Error ? streamError.message : 'Unknown stream error';
      return new Response(
        JSON.stringify({ error: 'Stream processing error', details: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;

    apiMonitor.log({
      endpoint: '/api/chat',
      method: 'POST',
      provider: 'unknown',
      model: 'unknown',
      responseStatus: 500,
      responseTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error('*** Unhandled error in /api/chat ***', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
