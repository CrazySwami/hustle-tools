# AI Chat Integration Guide

> **Note**: For the most up-to-date documentation on the Vercel AI SDK and AI Elements, always refer to the official documentation at [ai-sdk.dev](https://ai-sdk.dev/docs) using the Context7 search tool. The information in this guide may become outdated as the SDK evolves.

This document provides a comprehensive overview of the AI chat implementation in the Hustle Tools application, including the frontend components, backend API, and their integration with the Vercel AI SDK and AI Elements.

## Architecture Overview

The AI chat feature uses a modern streaming architecture with the following components:

1. **Frontend**: React components using Vercel AI Elements for UI and the `useChat` hook for state management
2. **Backend**: Next.js API route that processes requests and streams AI responses
3. **AI Gateway**: Vercel AI Gateway for unified access to multiple AI models
4. **Models**: Support for various AI providers (OpenAI, Anthropic, Google, Perplexity, etc.)

## Key Files

- **Frontend**: `/src/app/chat/page.tsx` - Main chat UI implementation
- **Backend**: `/src/app/api/chat/route.ts` - API route handling chat requests
- **Custom Components**: `/src/components/ai-elements/markdown-with-citations.tsx` - Custom component for rendering markdown with interactive citations

## Backend Implementation (`/src/app/api/chat/route.ts`)

The backend API route handles incoming chat requests, processes them, and streams responses back to the frontend.

### Key Features

- **Message Format Conversion**: Uses `convertToModelMessages` to properly convert UI messages to model messages
- **Model Selection**: Supports dynamic model selection based on user preference
- **Web Search Integration**: Special handling for Perplexity models with web search capability
- **Streaming Responses**: Uses `streamText` and `toUIMessageStreamResponse` for efficient streaming
- **Sources and Reasoning**: Configured to include source citations and reasoning in responses

### Critical Implementation Details

```typescript
// Import necessary functions from the AI SDK
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export async function POST(req: Request) {
  // Parse request body
  const { messages, model, webSearch } = await req.json();
  
  // Configure model and system prompt based on selection and web search preference
  let selectedModel = model;
  let systemPrompt = 'You are a helpful assistant...';
  
  // Special handling for web search with Perplexity models
  const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;

  // Stream text response using the AI SDK
  const result = streamText({
    model: selectedModel,
    messages: convertToModelMessages(messages), // CRITICAL: Must use this conversion function
    system: systemPrompt,
    options
  });

  // Return streaming response with sources and reasoning
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
```

### Important Notes

- **CRITICAL**: Always use `convertToModelMessages(messages)` instead of manual mapping to ensure proper message format conversion
- The API expects `messages` (array of UIMessages), `model` (string), and `webSearch` (boolean) in the request body
- Set `AI_GATEWAY_API_KEY` in your environment variables for authentication with the Vercel AI Gateway

## Frontend Implementation (`/src/app/chat/page.tsx`)

The frontend uses Vercel AI Elements components and the `useChat` hook to create a rich chat interface with streaming responses.

### Key Components

- **Conversation Container**: Wraps the entire chat interface
- **Message Components**: Renders user and assistant messages
- **PromptInput**: Handles user input and submission
- **Model Selection**: Dropdown for selecting AI models, grouped by provider
- **Web Search Toggle**: Option to enable web search (automatically uses Perplexity models)
- **Sources and Citations**: Displays source citations for responses with web search

### Critical Implementation Details

```typescript
// Import necessary components and hooks
import { useChat } from '@ai-sdk/react';
import { Conversation, Message, Response, Sources } from '@/components/ai-elements/...';

// Initialize chat state with useChat hook
const { messages, sendMessage, status } = useChat();

// Handle message submission
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (input.trim()) {
    // If web search is enabled but not using a Perplexity model, switch to Perplexity
    let selectedModel = model;
    if (webSearch && !model.startsWith('perplexity/')) {
      selectedModel = 'perplexity/sonar';
    }

    // Send message using the useChat hook
    sendMessage(
      { text: input },  // CRITICAL: Use this format for the message
      {
        body: {
          model: selectedModel,
          webSearch,
        },
      },
    );
    setInput('');
  }
};
```

### Message Rendering

```tsx
{messages.map((message) => (
  <div key={message.id}>
    {message.role === 'assistant' && (
      <Sources>
        {message.parts.some(part => part.type === 'source-url') && (
          <SourcesTrigger
            count={
              message.parts.filter(
                (part) => part.type === 'source-url',
              ).length
            }
          />
        )}
        <SourcesContent>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'source-url':
                return (
                  <Source
                    key={`${message.id}-${i}`}
                    href={part.url}
                    title={part.url}
                  />
                );
              default:
                return null;
            }
          })}
        </SourcesContent>
      </Sources>
    )}
    <Message from={message.role} key={message.id}>
      <MessageContent>
        {message.parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              return (
                <MarkdownWithCitations
                  key={`${message.id}-${i}`}
                  content={part.text}
                  sources={message.sources}
                />
              );
            case 'reasoning':
              return (
                <Reasoning
                  key={`${message.id}-${i}`}
                  className="w-full"
                  isStreaming={status === 'streaming'}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );
            default:
              return null;
          }
        })}
      </MessageContent>
    </Message>
  </div>
))}
```

### Important Notes

- **CRITICAL**: Always use `sendMessage({ text: input }, { body: { model, webSearch } })` format
- The `useChat` hook manages messages, streaming state, and handles communication with the backend
- Message parts can be of different types: 'text', 'reasoning', 'source-url', etc.
- Custom `MarkdownWithCitations` component handles rendering markdown with interactive citation hovers

## Custom Components

### MarkdownWithCitations

This custom component enhances markdown rendering with interactive citation references:

- Renders markdown content using ReactMarkdown
- Processes citation markers in the format `[1]`, `[2]`, etc.
- Creates interactive hover cards for citations that display source information
- Supports code syntax highlighting and other markdown features

## Model Selection and Grouping

Models are organized by provider for better usability:

```typescript
const modelGroups = [
  {
    provider: 'OpenAI',
    isOpen: true, // Default open
    models: [
      { name: 'GPT-4o', value: 'openai/gpt-4o' },
      // ... other OpenAI models
    ]
  },
  {
    provider: 'Anthropic',
    models: [
      { name: 'Claude 3 Opus', value: 'anthropic/claude-3-opus' },
      // ... other Anthropic models
    ]
  },
  // ... other provider groups
];
```

The dropdown UI allows toggling provider sections open/closed for better navigation with many models.

## Web Search Integration

The application supports web search capabilities with Perplexity models:

1. Frontend provides a toggle for enabling web search
2. When enabled with a non-Perplexity model, it automatically switches to 'perplexity/sonar'
3. Backend configures the appropriate options for web search
4. Responses include source citations that are displayed in the UI

## Troubleshooting Common Issues

### Message Format Errors

If you encounter `AI_InvalidPromptError` or similar errors:

- Ensure the backend is using `convertToModelMessages(messages)` instead of manual mapping
- Verify the frontend is using `sendMessage({ text: input }, ...)` format

### Missing Sources or Citations

If sources or citations aren't appearing:

- Verify that `sendSources: true` is set in `toUIMessageStreamResponse`
- Ensure you're using a model that supports web search (Perplexity models)
- Check that the web search toggle is enabled

### Streaming Issues

If streaming isn't working properly:

- Verify the `maxDuration` is set appropriately in the API route
- Check that the frontend is correctly handling streaming status
- Ensure the AI Gateway API key is properly configured

## Environment Setup

Required environment variables:

```
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

## References

- [Vercel AI SDK Documentation](https://ai-sdk.dev/)
- [AI Elements Components](https://ai-sdk.dev/elements/components)
- [Vercel AI Gateway Documentation](https://vercel.com/docs/ai/gateway)
