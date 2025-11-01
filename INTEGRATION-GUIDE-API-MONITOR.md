# API Monitor Integration Guide

This guide shows you how to integrate the API monitoring system into your existing API routes to track token usage, costs, and performance.

## Quick Start

The API Monitor is now accessible at: **http://localhost:3000/api-monitor**

It will show:
- Total API calls, success rate, token usage, and costs
- Breakdown by provider (OpenAI, Gemini, Anthropic, etc.)
- Breakdown by model
- Breakdown by endpoint
- Real-time table of all API calls
- Auto-refresh every 5 seconds
- Export logs as JSON
- Filter by endpoint, provider, or model

## How to Integrate Monitoring into Your API Routes

### Method 1: Using the `apiMonitor.log()` Function Directly

This is the most flexible approach. Add monitoring to any API route:

```typescript
import { apiMonitor } from '@/lib/api-monitor';

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const { prompt, model } = await request.json();

    // Make your API call
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseTime = Date.now() - startTime;

    // Log the API call
    apiMonitor.log({
      endpoint: '/api/chat',
      method: 'POST',
      provider: 'openai',
      model: model,
      responseStatus: 200,
      responseTime,
      success: true,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
      // Cost will be calculated automatically based on model and tokens
    });

    return Response.json({ success: true, data: response });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // Log the error
    apiMonitor.log({
      endpoint: '/api/chat',
      method: 'POST',
      provider: 'openai',
      model: model || 'unknown',
      responseStatus: error.status || 500,
      responseTime,
      success: false,
      error: error.message,
    });

    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Method 2: Using the `monitorAPICall()` Wrapper

This is a cleaner approach that automatically handles timing and error logging:

```typescript
import { monitorAPICall } from '@/lib/api-monitor';

export async function POST(request: Request) {
  const { prompt, model } = await request.json();

  return monitorAPICall(
    '/api/chat',
    async () => {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
      });

      return Response.json({ success: true, data: response });
    },
    {
      provider: 'openai',
      model: model,
      method: 'POST',
    }
  );
}
```

## Examples for Different API Types

### OpenAI Chat Completion

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: messages,
});

apiMonitor.log({
  endpoint: '/api/chat',
  method: 'POST',
  provider: 'openai',
  model: 'gpt-4o',
  responseStatus: 200,
  responseTime: Date.now() - startTime,
  success: true,
  promptTokens: response.usage?.prompt_tokens || 0,
  completionTokens: response.usage?.completion_tokens || 0,
  totalTokens: response.usage?.total_tokens || 0,
});
```

### OpenAI Image Generation

```typescript
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: prompt,
  size: '1024x1024',
});

apiMonitor.log({
  endpoint: '/api/generate-image',
  method: 'POST',
  provider: 'openai',
  model: 'dall-e-3',
  responseStatus: 200,
  responseTime: Date.now() - startTime,
  success: true,
  // Cost will be calculated using image pricing
});
```

### Google Gemini via AI Gateway

```typescript
const result = await streamText({
  model: gemini('gemini-2.5-flash-exp'),
  messages: messages,
});

// After streaming completes
apiMonitor.log({
  endpoint: '/api/chat-elementor',
  method: 'POST',
  provider: 'gemini',
  model: 'gemini-2.5-flash-exp',
  responseStatus: 200,
  responseTime: Date.now() - startTime,
  success: true,
  promptTokens: result.usage?.promptTokens,
  completionTokens: result.usage?.completionTokens,
  totalTokens: result.usage?.totalTokens,
});
```

### Anthropic Claude

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4.5',
  messages: messages,
});

apiMonitor.log({
  endpoint: '/api/chat',
  method: 'POST',
  provider: 'anthropic',
  model: 'claude-sonnet-4.5',
  responseStatus: 200,
  responseTime: Date.now() - startTime,
  success: true,
  promptTokens: response.usage.input_tokens,
  completionTokens: response.usage.output_tokens,
  totalTokens: response.usage.input_tokens + response.usage.output_tokens,
});
```

## Adding Monitoring to Vercel AI SDK Streaming Responses

For streaming responses using `streamText()`:

```typescript
import { streamText } from 'ai';
import { apiMonitor } from '@/lib/api-monitor';

export async function POST(request: Request) {
  const startTime = Date.now();
  const { messages, model } = await request.json();

  try {
    const result = streamText({
      model: openai(model),
      messages: messages,
      onFinish: async ({ usage }) => {
        // Log after streaming completes
        apiMonitor.log({
          endpoint: '/api/chat',
          method: 'POST',
          provider: 'openai',
          model: model,
          responseStatus: 200,
          responseTime: Date.now() - startTime,
          success: true,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
        });
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    apiMonitor.log({
      endpoint: '/api/chat',
      method: 'POST',
      provider: 'openai',
      model: model,
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      success: false,
      error: error.message,
    });

    throw error;
  }
}
```

## Supported Models and Pricing

The monitor includes pricing for:

### OpenAI
- GPT-4.1, GPT-5 variants (gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro)
- GPT-4o, GPT-4o-mini
- GPT-3.5-turbo
- DALL-E 3
- GPT Image 1

### Google Gemini
- Gemini 2.5 Flash (free preview)
- Gemini 2.0 Flash (free preview)
- Gemini 1.5 Pro
- Gemini 1.5 Flash

### Anthropic Claude
- Claude Sonnet 4.5
- Claude 3.5 Sonnet
- Claude 3.5 Haiku
- Claude Opus 4

Pricing is automatically calculated based on token usage. You can add more models by editing `/src/lib/api-monitor.ts` in the `MODEL_PRICING` object.

## Viewing the Dashboard

1. Navigate to **http://localhost:3000/api-monitor**
2. View real-time stats for all API calls
3. Filter by endpoint, provider, or model
4. Select time range (1 hour, 24 hours, 7 days, all time)
5. Export logs as JSON
6. Clear all logs

## API Endpoints

The monitor exposes these endpoints:

- `GET /api/monitor?action=logs` - Get filtered logs
- `GET /api/monitor?action=stats` - Get aggregated statistics
- `GET /api/monitor?action=export` - Download logs as JSON
- `DELETE /api/monitor` - Clear all logs

## Storage

Currently, logs are stored in-memory (limited to last 1000 calls). For production:
1. Consider using a database (Supabase, PostgreSQL, etc.)
2. Update the `APIMonitor` class in `/src/lib/api-monitor.ts`
3. Add database storage in the `log()` method

## Next Steps

To ensure all API calls are tracked:

1. **Find all API routes** that make external API calls
2. **Add monitoring** using one of the methods above
3. **Test each route** and verify it appears in the dashboard
4. **Check token counts** match what the provider reports
5. **Verify costs** are being calculated correctly

The monitor will help you:
- Track your API spending in real-time
- Identify which features use the most tokens
- Optimize your prompts to reduce costs
- Monitor API performance and errors
- Ensure no API calls are untracked
