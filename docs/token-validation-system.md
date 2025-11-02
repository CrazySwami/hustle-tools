# Token Validation & Context Window Management

## Overview

This document describes the token validation system that prevents API requests from exceeding model context limits and manages conversation history growth through intelligent truncation strategies.

## Architecture

The system has three main components:

1. **Token Validator** (`/src/lib/token-validator.ts`) - Core validation logic
2. **API Route Integration** - Validates prompts before sending to AI Gateway
3. **Frontend Indicators** - UI components showing token usage

## Token Counting

### Implementation

Uses `js-tiktoken` library with `cl100k_base` encoding (compatible with GPT-4, Claude, and modern models):

```typescript
import { encodingForModel } from 'js-tiktoken';

export function estimateTokenCount(text: string): number {
  const encoding = encodingForModel('gpt-4');
  const tokens = encoding.encode(text);
  encoding.free(); // Important: free memory
  return tokens.length;
}
```

### Fallback Strategy

If tiktoken fails, falls back to character-based estimation:
- **1 token ≈ 4 characters** (conservative estimate)
- Used only when tiktoken initialization fails

## Model Context Limits

Comprehensive mapping of 50+ models with their token limits:

| Provider | Model | Context Limit |
|----------|-------|---------------|
| Anthropic | Claude 4 Sonnet | 200,000 |
| Anthropic | Claude Opus 3.7 | 200,000 |
| OpenAI | GPT-5 | 400,000 |
| OpenAI | GPT-4.5 | 400,000 |
| Google | Gemini 2.5 Flash | 1,000,000 |
| Google | Gemini 2.5 Pro | 1,000,000 |
| xAI | Grok Beta | 131,072 |

Full list in [token-validator.ts:12-63](../src/lib/token-validator.ts#L12-L63)

### Unknown Models

Default fallback: **128,000 tokens** (conservative estimate for modern LLMs)

## Validation Process

### API Route Integration

Both `/api/chat-doc` and `/api/chat-elementor` validate before calling `streamText()`:

```typescript
import { validatePromptTokens, getTokenUsageRecommendation } from '@/lib/token-validator';

// 1. Convert messages to text
const messagesText = JSON.stringify(convertedMessages);

// 2. Validate against model limits
const validation = validatePromptTokens(systemPrompt, messagesText, model);

// 3. Log validation results
console.log('📊 Token validation:', {
  model,
  tokenCount: validation.tokenCount.toLocaleString(),
  limit: validation.limit.toLocaleString(),
  percentUsed: validation.percentUsed.toFixed(1) + '%',
  isValid: validation.isValid,
});

// 4. Return error if exceeded
if (!validation.isValid) {
  return Response.json({
    error: 'Prompt too large',
    details: validation.error,
    tokenCount: validation.tokenCount,
    limit: validation.limit,
    exceeded: validation.exceeded,
  }, { status: 400 });
}
```

### Reserved Tokens

Always reserves **4,000 tokens** for model output by default. Configurable via `reserveForOutput` parameter.

### Response Metadata

Context window data sent to frontend via `messageMetadata` callback:

```typescript
messageMetadata: ({ part }) => {
  if (part.type === 'finish') {
    const recommendation = getTokenUsageRecommendation(validation.percentUsed);
    return {
      promptTokens: usage.inputTokens || 0,
      completionTokens: usage.outputTokens || 0,
      totalTokens: usage.totalTokens || 0,
      model,
      contextWindow: {
        tokenCount: validation.tokenCount,
        limit: validation.limit,
        percentUsed: validation.percentUsed,
        level: recommendation.level,
        message: recommendation.message,
        action: recommendation.action,
        model,
      },
    };
  }
}
```

## Conversation Window Management

### Strategy Tiers (2025 Best Practices)

The system uses **percentage-based thresholds** to manage growing conversations:

| Usage Range | Level | Strategy | Behavior |
|-------------|-------|----------|----------|
| 0-70% | Safe | Full History | Keep all messages |
| 70-85% | Warning | Sliding Window | Keep recent 10 messages |
| 85-90% | Critical | Summarization | Keep 5 recent + summary of older |
| >90% | Exceeded | Hard Limit | Refuse request |

### Sliding Window (70-85% usage)

Keeps the **most recent N messages** (default: 10) and drops older ones:

```typescript
if (percentUsed >= 70 && percentUsed < 85) {
  const keepCount = options.slidingWindowSize || 10;
  const keptMessages = messages.slice(-keepCount);

  return {
    strategy: 'sliding_window',
    messages: keptMessages,
    droppedCount: messages.length - keepCount,
    tokenCount: newTokenCount,
    percentUsed: newPercentUsed,
  };
}
```

**Rationale**: Prioritizes quality over quantity. Recent context is more relevant than old messages.

### Summarization (85-90% usage)

Summarizes older messages and keeps recent ones intact:

```typescript
if (percentUsed >= 85 && percentUsed < 90) {
  const keepRecent = options.recentMessagesCount || 5;
  const recentMessages = messages.slice(-keepRecent);
  const oldMessages = messages.slice(0, -keepRecent);

  const summary = {
    role: 'system',
    content: `[Summary of ${oldMessages.length} earlier messages: ${oldMessages.map(m => m.content.substring(0, 100)).join('; ')}...]`,
  };

  const summarizedMessages = [summary, ...recentMessages];

  return {
    strategy: 'summarization',
    messages: summarizedMessages,
    summarizedCount: oldMessages.length,
    tokenCount: newTokenCount,
    percentUsed: newPercentUsed,
  };
}
```

**Rationale**: Preserves context from older conversation while prioritizing recent messages for continuity.

### Hard Limit (>90% usage)

Refuses to proceed and requires user intervention:

```typescript
if (percentUsed >= 90) {
  return {
    strategy: 'exceeded',
    messages: [],
    error: 'Token limit exceeded. Please start a new conversation or clear history.',
    tokenCount,
    percentUsed,
  };
}
```

**Rationale**: Prevents hitting API limits mid-stream which causes failed responses.

## Frontend Components

### TokenUsageIndicator

Full-featured component with expandable details:

```typescript
import { TokenUsageIndicator } from '@/components/ui/TokenUsageIndicator';

<TokenUsageIndicator
  usage={contextWindowData}
  showDetails={true}
/>
```

**Features**:
- Color-coded progress bar (green → yellow → orange → red)
- Expandable details panel
- Token statistics (used/limit/percent)
- Contextual recommendations
- Model information

**Color Coding**:
- 🟢 Green (0-70%): Safe
- 🟡 Yellow (70-85%): Warning
- 🟠 Orange (85-95%): Critical
- 🔴 Red (>95%): Exceeded

### TokenUsageBadge

Compact badge version for minimal UI space:

```typescript
import { TokenUsageBadge } from '@/components/ui/TokenUsageIndicator';

<TokenUsageBadge usage={contextWindowData} />
```

## Recommendations by Usage Level

### Safe (0-70%)

- **Message**: "Token usage is within safe limits"
- **Action**: "Continue conversation normally"
- **Color**: Green

### Warning (70-85%)

- **Message**: "Approaching token limit"
- **Action**: "Consider starting a new conversation soon"
- **Color**: Yellow

### Critical (85-95%)

- **Message**: "Near token limit"
- **Action**: "Start a new conversation or clear history"
- **Color**: Orange

### Exceeded (>95%)

- **Message**: "Token limit exceeded"
- **Action**: "Start a new conversation immediately"
- **Color**: Red

## Error Handling

### API Responses

When prompt exceeds limit:

```json
{
  "error": "Prompt too large",
  "details": "Prompt exceeds model context limit by 15,234 tokens",
  "tokenCount": 215234,
  "limit": 200000,
  "exceeded": 15234
}
```

HTTP Status: **400 Bad Request**

### Logging

Token validation logs include:

```
📊 Token validation: {
  model: 'anthropic/claude-4-sonnet',
  tokenCount: '85,432',
  limit: '200,000',
  percentUsed: '42.7%',
  isValid: true
}
```

## Configuration Options

### manageConversationWindow Options

```typescript
interface ConversationWindowOptions {
  slidingWindowSize?: number;      // Default: 10 messages
  recentMessagesCount?: number;    // Default: 5 messages
  reserveForOutput?: number;       // Default: 4000 tokens
}
```

### Customization Examples

**Aggressive truncation** (keep fewer messages):

```typescript
manageConversationWindow(messages, systemPrompt, model, {
  slidingWindowSize: 5,
  recentMessagesCount: 3,
});
```

**Conservative truncation** (keep more messages):

```typescript
manageConversationWindow(messages, systemPrompt, model, {
  slidingWindowSize: 20,
  recentMessagesCount: 10,
});
```

## Testing

### Manual Testing

1. **Test with small prompts** (should pass):
   ```typescript
   validatePromptTokens("You are helpful", "Hello", "openai/gpt-5");
   // Expected: isValid: true, percentUsed: <1%
   ```

2. **Test with large prompts** (should fail):
   ```typescript
   const largePrompt = "a".repeat(1000000);
   validatePromptTokens("System", largePrompt, "openai/gpt-5");
   // Expected: isValid: false, exceeded: > 0
   ```

3. **Test conversation growth**:
   - Start chat with short messages
   - Continue adding messages
   - Observe sliding window activation at 70%
   - Observe summarization at 85%

### Browser Console Testing

In browser console with active chat:

```javascript
// Check current token usage
console.log(contextWindowData);

// Simulate large conversation
const testMessages = Array(100).fill({ role: 'user', content: 'Test message'.repeat(100) });
```

## Best Practices

### For API Routes

1. ✅ Always validate BEFORE calling `streamText()`
2. ✅ Log validation results for debugging
3. ✅ Return 400 with clear error messages
4. ✅ Include contextWindow in response metadata
5. ✅ Reserve tokens for output (default: 4000)

### For Frontend

1. ✅ Display TokenUsageIndicator prominently
2. ✅ Update indicator after each message
3. ✅ Show warnings at 70% threshold
4. ✅ Disable send button at 90%+ threshold
5. ✅ Provide "Start New Chat" button when critical

### For Conversation Management

1. ✅ Use sliding window for long chats
2. ✅ Preserve recent messages (most relevant)
3. ✅ Summarize old messages (maintain context)
4. ✅ Never exceed 90% of context limit
5. ✅ Quality > Quantity (better to drop old than truncate mid-sentence)

## Known Limitations

1. **Token counting is approximate**: Uses GPT-4 tokenizer as proxy for all models
2. **Summarization is simple**: Just truncates old messages, doesn't use AI
3. **No persistent state**: Conversation window managed per-request only
4. **Model limits hardcoded**: Requires code update when models change limits

## Future Enhancements

1. **AI-powered summarization**: Use cheap model (Haiku/Mini) to summarize old messages
2. **User-configurable thresholds**: Let users adjust 70%/85%/90% thresholds
3. **Conversation forking**: Allow splitting conversations when limits approached
4. **Token usage analytics**: Track usage patterns over time
5. **Model-specific tokenizers**: Use correct tokenizer per model family
6. **Streaming token counting**: Count tokens during stream, not after

## Related Documentation

- [models.md](./models.md) - Full list of supported models and limits
- [Vercel AI SDK UI Docs](./vercel-ai-sdk-ui-docs/) - Metadata and streaming patterns
- [CLAUDE.md](../CLAUDE.md) - Main project documentation

## References

- [Anthropic Context Window Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/context-windows)
- [OpenAI Token Management](https://platform.openai.com/docs/guides/prompt-engineering#manage-context-windows)
- [tiktoken on npm](https://www.npmjs.com/package/js-tiktoken)
- [2025 LLM Context Window Trends](https://www.anthropic.com/research)
