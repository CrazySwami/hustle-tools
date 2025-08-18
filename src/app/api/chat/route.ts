import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { tools } from '@/lib/tools';

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
    }: { 
      messages: UIMessage[]; 
      model: string; 
      webSearch: boolean;
      enableReasoning?: boolean;
      enableTools?: boolean;
    } = await req.json();

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
    } catch (error) {
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

    const result = streamText({
      model: selectedModel,
      messages: convertedMessages,
      system: systemPrompt,
      options,
      providerOptions,
      // Only include tools if enabled
      ...(enableTools && { 
        tools,
        stopWhen: stepCountIs(5), // Use stopWhen instead of maxSteps
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
