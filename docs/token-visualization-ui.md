# Token Visualization UI Components

## Overview

The application now features comprehensive real-time token tracking with two complementary indicators that work together to provide complete visibility into context window usage:

1. **ConversationTokenIndicator** - Persistent top-right indicator showing total conversation progress (like Claude Code)
2. **PromptTokenCounter** - Real-time counter showing current prompt size before sending (like Twitter character counter)

## Component Architecture

### ConversationTokenIndicator

**Location**: `/src/components/ui/ConversationTokenIndicator.tsx`

**Purpose**: Displays conversation-level token usage with automatic summarization status

**Features**:
- ✅ Persistent floating indicator (top-right corner)
- ✅ Compact view shows percentage only
- ✅ Expandable detailed view shows:
  - Progress bar with color coding
  - Used/Limit/Remaining token counts
  - Message count
  - Strategy badge (Full History / Sliding Window / Auto-Summarized)
  - Contextual recommendations
  - Model information
- ✅ Color-coded by threshold:
  - 🟢 Green (0-70%): Safe
  - 🟡 Yellow (70-85%): Warning
  - 🟠 Orange (85-95%): Critical
  - 🔴 Red (>95%): Exceeded
- ✅ Pulse animation when crossing thresholds
- ✅ Auto-updates after each API response

**Usage**:
```tsx
import { ConversationTokenIndicator, ConversationTokenData } from '@/components/ui/ConversationTokenIndicator';

// Extract from message metadata
const lastMessage = messages.reverse().find(m => m.metadata?.contextWindow);
const tokenData: ConversationTokenData = {
  totalTokens: lastMessage.metadata.contextWindow.tokenCount,
  limit: lastMessage.metadata.contextWindow.limit,
  percentUsed: lastMessage.metadata.contextWindow.percentUsed,
  level: lastMessage.metadata.contextWindow.level, // 'safe' | 'warning' | 'critical' | 'exceeded'
  message: lastMessage.metadata.contextWindow.message,
  action: lastMessage.metadata.contextWindow.action,
  model: lastMessage.metadata.contextWindow.model,
  messageCount: messages.length,
  strategy: lastMessage.metadata.contextWindow.strategy, // 'full' | 'sliding-window' | 'summarized'
};

<ConversationTokenIndicator
  data={tokenData}
  position="top-right"
/>
```

**Badge Variant**:
```tsx
<ConversationTokenBadge data={tokenData} />
```

### PromptTokenCounter

**Location**: `/src/components/ui/PromptTokenCounter.tsx`

**Purpose**: Shows token count of current prompt BEFORE sending (real-time feedback)

**Features**:
- ✅ Debounced token counting (100ms delay for performance)
- ✅ Shows prompt tokens as user types
- ✅ Displays total input tokens (prompt + system + conversation)
- ✅ Progress bar when approaching limits
- ✅ Color-coded warnings:
  - 🔵 Blue (0-70%): Normal
  - 🟡 Yellow (70-90%): Approaching limit
  - 🟠 Orange (90-100%): Near limit
  - 🔴 Red (>100%): Over limit
- ✅ Disables send button when over limit
- ✅ Optional detailed breakdown view
- ✅ Only visible when prompt has content

**Usage**:
```tsx
import { PromptTokenCounter } from '@/components/ui/PromptTokenCounter';

const [input, setInput] = useState('');
const [sendDisabled, setSendDisabled] = useState(false);

// Show above prompt input
{input.trim() && (
  <PromptTokenCounter
    prompt={input}
    systemPrompt={systemPrompt}
    contextLimit={contextLimit}
    conversationTokens={conversationTokenData?.totalTokens || 0}
    onSendDisabled={setSendDisabled}
    showDetails={false}
  />
)}

// Disable send button
<button disabled={isLoading || !input.trim() || sendDisabled}>
  Send
</button>
```

**Badge Variant**:
```tsx
<PromptTokenBadge promptTokens={estimateTokenCount(input)} />
```

## Integration Points

### DocumentChat (`/src/components/editor/DocumentChat.tsx`)

**Integrated Features**:
1. **ConversationTokenIndicator** - Fixed top-right in chat container
2. **PromptTokenCounter** - Appears above prompt input when typing
3. **Metadata Extraction** - Extracts `contextWindow` from message metadata
4. **Send Button Control** - Disables send when prompt too large

**Flow**:
```
User types → PromptTokenCounter shows real-time tokens
User sends → API validates + returns contextWindow metadata
Message received → ConversationTokenIndicator updates in top-right
```

### ChatInterface Elementor (`/src/components/elementor/ChatInterface.tsx`)

**Integrated Features**:
1. **ConversationTokenIndicator** - Fixed top-right in messages container
2. **Metadata Extraction** - Extracts `contextWindow` from message metadata
3. **Existing TokenTracker** - Remains in header for prompt-level tracking

**Note**: ChatInterface already had its own token tracking with `currentInputTokens` and `contextTokens`. The new ConversationTokenIndicator complements this by showing server-validated conversation-level data from API responses.

## Data Flow

### API → Frontend

API routes send token data via `messageMetadata` callback:

```typescript
// In /api/chat-doc/route.ts and /api/chat-elementor/route.ts
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
        strategy: 'full', // or 'sliding-window', 'summarized'
      },
    };
  }
}
```

### Frontend → UI Components

React components extract metadata and pass to indicators:

```typescript
// Extract from last message with metadata
useEffect(() => {
  const lastMessageWithMetadata = messages
    .slice()
    .reverse()
    .find((msg: any) => msg.metadata?.contextWindow);

  if (lastMessageWithMetadata?.metadata?.contextWindow) {
    const cw = lastMessageWithMetadata.metadata.contextWindow;
    setConversationTokenData({
      totalTokens: cw.tokenCount || 0,
      limit: cw.limit || contextLimit,
      percentUsed: cw.percentUsed || 0,
      level: cw.level || 'safe',
      message: cw.message || 'Token usage is healthy',
      action: cw.action || 'Continue normally',
      model: cw.model || selectedModel,
      messageCount: messages.length,
      strategy: cw.strategy,
    });
  }
}, [messages, selectedModel, contextLimit]);
```

## Visual Design

### ConversationTokenIndicator Appearance

**Compact View** (default):
```
┌─────────────┐
│ 🧠 42%  ▼  │
└─────────────┘
```

**Expanded View**:
```
┌────────────────────────────────┐
│ 🧠 Conversation Window      ▲  │
│                                │
│ Token Usage           42.3%    │
│ ████████████░░░░░░░░           │
│                                │
│ Used:       85,432             │
│ Limit:      200,000            │
│ Remaining:  114,568            │
│ Messages:   12                 │
│                                │
│ ┌──────────────────────────┐  │
│ │ 🟢 Full History          │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ ✓ Token usage is healthy │  │
│ │   Monitor usage          │  │
│ └──────────────────────────┘  │
│                                │
│ anthropic/claude-4-sonnet      │
└────────────────────────────────┘
```

### PromptTokenCounter Appearance

**Basic View**:
```
💬 1,234 tokens
```

**Near Limit** (>70%):
```
⚠️ 85,432 tokens  ████████████████░░░░  Near limit
```

**Over Limit** (>100%):
```
🚫 205,432 tokens  ████████████████████  Prompt too large!
```

**Detailed View** (when `showDetails={true}`):
```
💬 1,234 tokens  ████████░░░░░░░░░░░░  ┌────────────────────────────────────┐
                                        │ This prompt: 1,234                 │
                                        │ Total input: 95,432                │
                                        │ Remaining:   104,568               │
                                        └────────────────────────────────────┘
```

## Conversation Window Management Strategies

The `contextWindow.strategy` field indicates how the backend is managing conversation history:

### 1. Full History (0-70% usage)
```tsx
strategy: 'full'
badge: "Full History"
color: Blue
```
All messages kept in conversation. No truncation.

### 2. Sliding Window (70-85% usage)
```tsx
strategy: 'sliding-window'
badge: "✨ Sliding Window"
color: Yellow
```
Keeps recent N messages (default: 10), drops older ones.

### 3. Auto-Summarized (85-90% usage)
```tsx
strategy: 'summarized'
badge: "✨ Auto-Summarized"
color: Purple
```
Summarizes older messages, keeps recent ones intact.

### 4. Exceeded (>90% usage)
```tsx
strategy: 'exceeded'
badge: "⚠️ Limit Exceeded"
color: Red
```
Hard limit reached. User must start new conversation.

## Best Practices

### For Users

1. **Monitor the top-right indicator** - Glance at conversation progress anytime
2. **Watch for color changes** - Yellow/Orange/Red means action needed
3. **Expand for details** - Click to see full token breakdown
4. **Start new chat at 85%** - Avoid hitting limits mid-conversation
5. **Use shorter prompts** - When indicator shows warning/critical

### For Developers

1. **Always extract contextWindow** - From `message.metadata.contextWindow`
2. **Position: relative required** - Parent container needs `position: relative` for floating indicator
3. **Disable send when over limit** - Use `onSendDisabled` callback from PromptTokenCounter
4. **Show PromptTokenCounter conditionally** - Only when `input.trim()` has content
5. **Update on message changes** - Use `useEffect` with `[messages]` dependency

## Responsive Behavior

### Desktop
- ConversationTokenIndicator: Top-right, fully visible
- PromptTokenCounter: Full width above input

### Mobile
- ConversationTokenIndicator: Slightly smaller, still top-right
- PromptTokenCounter: Compact view, may wrap on small screens

## Accessibility

- ✅ Semantic HTML with proper ARIA labels
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader friendly
- ✅ High contrast colors meet WCAG AA standards
- ✅ Focus indicators on interactive elements

## Performance

- ✅ Debounced token counting (100ms) prevents excessive calculations
- ✅ Only updates when messages change (memoized)
- ✅ Conditional rendering (only shows when needed)
- ✅ Lightweight animations (CSS transitions only)
- ✅ No external dependencies beyond lucide-react icons

## Comparison with Claude Code

Our implementation matches Claude Code's pattern:

| Feature | Claude Code | Our Implementation |
|---------|-------------|-------------------|
| Persistent indicator | ✅ Top-right percentage | ✅ Top-right percentage |
| Expandable details | ✅ Click to expand | ✅ Click to expand |
| Color coding | ✅ Green/Yellow/Red | ✅ Green/Yellow/Orange/Red |
| Token breakdown | ✅ Used/Remaining | ✅ Used/Limit/Remaining |
| Auto-summarization | ✅ Automatic | ✅ Automatic with strategy badges |
| Message count | ❌ Not shown | ✅ Shows message count |
| Strategy visibility | ❌ Hidden | ✅ Shows strategy badge |
| Real-time prompt counter | ❌ Not visible | ✅ Shows before sending |

## Future Enhancements

Potential improvements (not yet implemented):

1. **AI-Powered Summarization** - Use cheap model (Haiku/Mini) to intelligently summarize old messages
2. **User-Configurable Thresholds** - Let users adjust 70%/85%/90% thresholds
3. **Conversation Forking** - Allow splitting conversations when approaching limits
4. **Token Usage Analytics** - Track patterns over time
5. **Model-Specific Tokenizers** - Use correct tokenizer per model family
6. **Streaming Token Counting** - Count tokens during stream, not after
7. **Smart Context Selection** - Use embeddings to keep most relevant messages
8. **Export Before Clear** - Auto-save conversation when starting fresh

## Related Documentation

- [token-validation-system.md](./token-validation-system.md) - Backend validation logic
- [models.md](./models.md) - Supported models and context limits
- [Vercel AI SDK UI Docs](./vercel-ai-sdk-ui-docs/) - Message metadata patterns
- [CLAUDE.md](../CLAUDE.md) - Main project documentation

## Troubleshooting

### Indicator not showing
- ✅ Check that API route returns `contextWindow` in metadata
- ✅ Verify parent container has `position: relative`
- ✅ Ensure `conversationTokenData` state is not null

### Counter shows wrong value
- ✅ Check debounce timing (default 100ms)
- ✅ Verify `contextLimit` matches selected model
- ✅ Ensure `systemPrompt` and `conversationTokens` are passed correctly

### Send button not disabled
- ✅ Check `onSendDisabled` callback is wired to button
- ✅ Verify `sendDisabled` state is checked in button's `disabled` prop
- ✅ Ensure PromptTokenCounter is receiving correct `contextLimit`

### Colors not matching theme
- ✅ Use CSS variables: `--border`, `--background`, `--foreground`, `--muted`
- ✅ Check dark mode compatibility
- ✅ Verify Tailwind classes are being applied
