import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { tools } from '@/lib/tools';
import { Comment } from '@/components/editor/CommentExtension';

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
  try {
    console.log('--- Received POST /api/chat request ---');
    console.log('Checking environment variable AI_GATEWAY_API_KEY:', process.env.AI_GATEWAY_API_KEY ? 'Set' : 'Not Set');

    const {
      messages,
      model,
      webSearch,
      enableReasoning = false, // New parameter to toggle reasoning
      enableTools = true, // New parameter to toggle tool calling
      documentContent, // Document content for the getDocumentContent tool
      comments,
      currentSection, // For Elementor editor (if called from there)
    }: {
      messages: UIMessage[];
      model: string;
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

    // Convert messages with error handling
    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(messages);
      console.log('Converted messages:', JSON.stringify(convertedMessages, null, 2));
    } catch (error: any) {
      console.error('Error converting messages:', error);
      console.error('Original messages:', JSON.stringify(messages, null, 2));
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
      systemPrompt += ' You have access to various tools including weather information, calculations, code generation, and task management. When users ask for weather information, calculations, code generation, or task management, you should use the appropriate tool to provide accurate and interactive results. After using a tool, always provide a helpful text response that explains or contextualizes the tool results for the user.';
    }

    // Add Elementor-specific instructions if this is an Elementor request
    if (isElementorRequest) {
      systemPrompt += `\n\n**ELEMENTOR EDITOR MODE ACTIVE**

You are now assisting with the Elementor Section Builder. You have access to special tools:

**Available Tools:**
- **testPing**: DIAGNOSTIC TOOL - Use this IMMEDIATELY when user says "test ping". Verifies tool calling is working.
- **switchTab**: Use when user asks to navigate to different tabs (Code Editor, Visual Editor, Section Library, WordPress Playground, Site Content, Style Guide).
- **updateSectionHtml**: Use to modify HTML markup - generates complete new HTML and applies it.
- **updateSectionCss**: Use to modify styling/colors/layout - generates complete new CSS and applies it.
- **updateSectionJs**: Use to modify interactivity/functionality - generates complete new JS and applies it.
- **viewEditorCode**: Use to view current code when you need to read it before making changes.
- **generateHTML**: Use when user asks to generate/create a NEW section from scratch.

**CRITICAL INSTRUCTIONS:**
1. When user says "test ping", you MUST call the testPing tool.
2. When user asks to switch tabs or navigate, you MUST use the switchTab tool.
3. When user asks to modify/change/edit existing code (e.g., "change h1 color to red"), you MUST use updateSectionCss/Html/Js.
4. When user asks to create/generate NEW content, you MUST use generateHTML.
5. DO NOT just say you're calling a tool - actually call it!

Current section: ${currentSection?.name || 'No section loaded'}`;
    }

    // Configure options based on model type
    const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;
    console.log('StreamText options:', options || 'none');

    // Configure provider options for reasoning if enabled and model supports it
    let providerOptions = undefined;
    
    if (enableReasoning && REASONING_MODELS[model]) {
      const reasoningConfig = REASONING_MODELS[model];
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
      // Elementor-specific tools
      updateSectionHtml: tools.updateSectionHtml,
      updateSectionCss: tools.updateSectionCss,
      updateSectionJs: tools.updateSectionJs,
      viewEditorCode: tools.viewEditorCode,
      testPing: tools.testPing,
      switchTab: tools.switchTab,
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
    let toolChoice = undefined;
    if (isElementorRequest && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      const userText = typeof lastUserMessage.content === 'string'
        ? lastUserMessage.content
        : lastUserMessage.parts?.[0]?.text || '';

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

    const result = streamText({
      model: selectedModel,
      messages: convertedMessages,
      system: systemPrompt,
      providerOptions,
      // Only include tools if enabled
      ...(enableTools && {
        tools: toolsWithDocumentContent,
        stopWhen: stepCountIs(5), // Use stopWhen instead of maxSteps
        ...(toolChoice && { toolChoice }),
      }),
    });

    console.log('--- Sending stream response ---');

    // send sources, reasoning, and tool results back to the client
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      sendToolResults: true, // Enable tool result parts in the response
    });
  } catch (error) {
    console.error('*** Unhandled error in /api/chat ***', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
