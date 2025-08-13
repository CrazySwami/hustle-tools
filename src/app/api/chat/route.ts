import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { gateway } from '@ai-sdk/gateway';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('--- Received POST /api/chat request ---');
  console.log('Checking environment variable AI_GATEWAY_API_KEY:', process.env.AI_GATEWAY_API_KEY ? 'Set' : 'Not Set');

  const {
    messages,
    model,
    webSearch,
  }: { messages: UIMessage[]; model: string; webSearch: boolean } =
    await req.json();

  console.log('Request body parsed:', { model, webSearch, messageCount: messages.length });

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

  // Configure options based on model type
  const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;

  const result = streamText({
    model: selectedModel,
    messages: convertToModelMessages(messages),
    system: systemPrompt,
    options
  });

  console.log('--- Sending stream response ---');

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
