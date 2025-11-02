# AI-Powered Conversation Summarization Configuration

## Overview

The application uses **Gemini 2.5 Flash** for intelligent conversation summarization when context windows approach limits. This provides superior summarization quality at minimal cost compared to simple truncation.

## Model Configuration

### Conservative Token Limits

To prevent overflow errors (especially with Gemini models where tiktoken estimation may be less accurate), we use conservative soft limits:

```typescript
// src/lib/token-validator.ts
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Gemini 2.5 Flash models - 70% of true limit for safety
  'google/gemini-2.5-flash': 700000,        // True: 1M (30% safety buffer)
  'google/gemini-2.5-flash-lite': 700000,   // True: 1M (30% safety buffer)

  // Gemini 2.5 Pro - 90% of 200K to avoid price tier jump
  'google/gemini-2.5-pro': 180000,          // True: 1M, limited to stay under $2.50/M tier

  // Other Gemini models
  'google/gemini-2.0-flash': 700000,        // True: 1M (30% safety buffer)
  'google/gemini-2.0-flash-lite': 700000,   // True: 1M (30% safety buffer)
};
```

**Why 70% for Flash models?**
- tiktoken uses `cl100k_base` encoding (GPT-4 compatible)
- Gemini uses different tokenization (may differ by 10-20%)
- 300K token safety buffer prevents unexpected overflows
- Users still get 700K context (massive for most use cases)

**Why 180K for Pro models?**
- Gemini 2.5 Pro pricing has tiers:
  - ≤200K tokens: $1.25 input / $10 output
  - >200K tokens: $2.50 input / $15 output (2x price jump!)
- Limiting to 180K keeps costs predictable
- Avoids sudden 2x cost increase mid-conversation

## Auto-Management Strategies

### Threshold Breakdown

```
0-70% usage:   Full History         (keep all messages)
70-85% usage:  Sliding Window       (keep recent 10 messages)
85-90% usage:  AI Summarization     (Gemini 2.5 Flash)
>90% usage:    Hard Limit Exceeded  (error, must start new chat)
```

### Example: Gemini 2.5 Flash

```
Context limit: 700,000 tokens
Reserve for output: 4,000 tokens
Effective limit: 696,000 tokens

Thresholds:
- 70%: 487,200 tokens → Trigger sliding window
- 85%: 591,600 tokens → Trigger AI summarization
- 90%: 626,400 tokens → Hard limit warning
```

## AI Summarization Details

### Summarization Model

**Always uses**: `google/gemini-2.5-flash`

**Why Gemini 2.5 Flash?**
- ✅ Cheapest option: $0.30/1M input + $2.50/1M output
- ✅ 1M context window (can handle any conversation size)
- ✅ Fast inference (Flash = optimized for speed)
- ✅ High quality summaries (reasoning model with thinking budgets)

**Cost Per Summary**:
```
Typical scenario:
- Input: 100,000 tokens (old conversation)
- Output: 1,000 tokens (comprehensive summary)

Cost calculation:
  Input:  100K × $0.30/1M  = $0.030
  Output: 1K × $2.50/1M    = $0.0025
  Total:  ~$0.0325 per summary (3.25 cents)
```

**Comparison with Gemini 2.5 Flash Lite**:
```
Flash Lite pricing:
- Input: $0.10/1M (cheaper!)
- Output: $0.40/1M (also cheaper!)

Why NOT use Flash Lite?
- Lower quality summaries
- Standard Flash is still VERY cheap ($0.03 per summary)
- Better context retention with reasoning capabilities
```

### Summarization Prompt

The AI receives:
```
You are a conversation summarization assistant. Your task is to create a concise but comprehensive summary of the following conversation.

IMPORTANT GUIDELINES:
1. Capture the main topics discussed
2. Preserve important context and decisions made
3. Include key facts, data, and technical details
4. Note any action items or next steps
5. Keep the summary under 500 tokens but include all critical information
6. Use bullet points for clarity
7. Focus on information that would be useful for continuing the conversation

CONVERSATION TO SUMMARIZE:
[Full conversation text here]

SUMMARY:
```

**Output Format**:
- Bullet-pointed summary
- Preserves technical details
- Includes context for continuing conversation
- Typically 300-800 tokens

## Implementation

### Synchronous (Simple Fallback)

```typescript
import { manageConversationWindow } from '@/lib/token-validator';

// Uses simple text-based summary (no AI call)
const result = manageConversationWindow(
  messages,
  systemPrompt,
  model
);

// At 85% usage, returns:
// "[Earlier conversation summary: 20 messages exchanged...]"
```

### Asynchronous (AI-Powered) ✅ RECOMMENDED

```typescript
import { manageConversationWindowWithAI } from '@/lib/token-validator';

// Uses Gemini 2.5 Flash for intelligent summaries
const result = await manageConversationWindowWithAI(
  messages,
  systemPrompt,
  model,
  { useAI: true } // Default is true
);

// At 85% usage, calls /api/summarize-conversation
// Returns comprehensive AI-generated summary
```

### API Route

**Endpoint**: `/api/summarize-conversation`

**Method**: `POST`

**Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response**: Streaming text (Vercel AI SDK format)

**Cost**: ~$0.03 per call (100K input + 1K output)

## Usage in Chat Routes

### Current Implementation (Synchronous)

Currently, `/api/chat`, `/api/chat-doc`, and `/api/chat-elementor` use synchronous `manageConversationWindow()` with simple fallback summaries.

### Future Enhancement (AI-Powered)

To enable AI summarization in chat routes:

```typescript
// api/chat-doc/route.ts (example)
import { manageConversationWindowWithAI } from '@/lib/token-validator';

// In auto-management section (lines 435-480):
if (validation.percentUsed >= 70 || !validation.isValid) {
  // CHANGE THIS:
  // const windowResult = manageConversationWindow(...)

  // TO THIS:
  const windowResult = await manageConversationWindowWithAI(
    conversationMessages,
    systemPrompt,
    model,
    { useAI: true } // Enable AI summarization
  );

  // Rest of code remains the same...
}
```

**Why not enabled by default?**
- Adds 1-2 second latency for AI summarization call
- Simple fallback works fine for most cases
- Easy to enable when needed (just change function call)

## Cost Analysis

### Per-User Cost Projections

**Average user** (casual usage):
- Hits 85% threshold: 1-2 times per month
- Cost per month: $0.03 - $0.06

**Power user** (heavy usage):
- Hits 85% threshold: 10 times per month
- Cost per month: $0.30

**Enterprise** (1,000 users):
- Average 5 summaries/user/month
- Cost per month: $150 (5,000 summaries × $0.03)

### Comparison with Alternatives

| Solution | Cost | Quality | Latency |
|----------|------|---------|---------|
| **Gemini 2.5 Flash (chosen)** | $0.03/summary | ⭐⭐⭐⭐⭐ Excellent | 1-2s |
| Gemini 2.5 Flash Lite | $0.01/summary | ⭐⭐⭐ Good | 0.5-1s |
| Claude Haiku 4.5 | $0.08/summary | ⭐⭐⭐⭐ Very Good | 1-2s |
| GPT-4o-mini | $0.10/summary | ⭐⭐⭐⭐ Very Good | 1-2s |
| Simple truncation (current) | $0 | ⭐⭐ Poor | 0s |

**Winner**: Gemini 2.5 Flash offers best quality-to-cost ratio.

## Configuration Summary

### Final Configuration

```typescript
{
  // Conservative limits (70% of true limits)
  gemini-2.5-flash: 700K,        // True: 1M
  gemini-2.5-flash-lite: 700K,   // True: 1M
  gemini-2.5-pro: 180K,          // True: 1M (avoid price tier)

  // Thresholds
  softThreshold: 70%,            // Start management
  hardThreshold: 85%,            // Use AI summarization
  hardLimit: 90%,                // Reject new messages

  // Strategies
  0-70%:   Full history
  70-85%:  Sliding window (keep 10 recent)
  85-90%:  AI summarization (Gemini 2.5 Flash)
  >90%:    Error (must start new chat)

  // Costs
  summarizationCost: $0.03/summary,
  estimatedMonthly: $0.03 - $0.30/user
}
```

## Testing

### Manual Testing

1. Start conversation with Gemini 2.5 Flash
2. Send many long messages until 85% threshold
3. Check console logs for: `🤖 Using AI to summarize X messages`
4. Verify summary quality in next message metadata

### Automated Testing

```bash
npm run test-summarization
```

(Test script to be added in future PR)

## Monitoring

### Metrics to Track

1. **Summarization Frequency**
   - How often are summaries triggered?
   - Which models hit limits most?

2. **Costs**
   - Total summarization API costs per month
   - Cost per user per month

3. **Quality**
   - User feedback on summary quality
   - Compare AI vs simple fallback retention rates

4. **Performance**
   - Average latency for summarization calls
   - 95th percentile latency

## Future Enhancements

### User Preferences

Allow users to choose:
- AI summarization vs simple fallback
- Summarization model (Flash vs Flash Lite vs Pro)
- Custom soft limits (50-90%)

### Smart Context Selection

Instead of summarizing chronologically:
- Use embeddings to find most relevant messages
- Keep semantically important messages
- Summarize only low-relevance messages

### Cost Transparency

Show users:
- "Summarization cost: $0.03"
- "Total conversation cost so far: $0.15"
- "Estimated monthly cost: $0.50"

## Troubleshooting

### Issue: Summaries are low quality

**Solution**: Consider switching to Gemini 2.5 Pro for critical conversations

```typescript
const result = await manageConversationWindowWithAI(
  messages,
  systemPrompt,
  'google/gemini-2.5-pro', // Use Pro for better quality
  { useAI: true }
);
```

Cost increase: $0.03 → $0.15 per summary (5x more)

### Issue: Summarization takes too long

**Solution**: Switch to Gemini 2.5 Flash Lite

```typescript
// In /api/summarize-conversation/route.ts
model: gateway('google/gemini-2.5-flash-lite', ...)
```

Latency reduction: 1-2s → 0.5-1s
Cost reduction: $0.03 → $0.01 (3x cheaper)

### Issue: API errors during summarization

**Fallback**: Simple summary is used automatically

```typescript
// Automatic fallback in summarizeConversationWithAI()
catch (error) {
  console.error('❌ AI summarization failed:', error);
  return `[Earlier conversation summary: ${messages.length} messages exchanged.]`;
}
```

## Related Documentation

- [token-validation-system.md](./token-validation-system.md) - Backend validation logic
- [token-visualization-ui.md](./token-visualization-ui.md) - Frontend UI components
- [models.md](./models.md) - All supported models and limits
