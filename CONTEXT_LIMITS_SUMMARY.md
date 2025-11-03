# Context Limits & Token Management Summary

## Quick Answer to Your Questions

### 1. When Does Hard Limit (>90%) Get Reached?

**Answer**: When management cannot reduce tokens below the limit. This happens in 3 scenarios:

#### Scenario A: Single Huge Message (Your Bug!)
```
User at 57% usage → sends 140K token message
Management applies → reduces to 1 message (the huge one)
Result: Still at 84.9% usage
Model rejects: "too long" (tiktoken variance)
```

#### Scenario B: System Prompt Too Large
```
System prompt: 100K tokens
Single user message: 100K tokens
Total: 200K tokens (100% of 200K limit)
Management can't help: System prompt can't be reduced
Result: Hard limit exceeded
```

#### Scenario C: Even 3 Messages Are Too Large
```
3 recent messages: 30K + 30K + 30K = 90K
Summary: 5K tokens
System prompt: 50K tokens
Total: 145K tokens (72% of 200K)
BUT: User sends new 100K message
New total: 245K (122% of limit)
Result: Hard limit exceeded
```

---

### 2. Summarization Model & Limits

**Model Used**: `google/gemini-2.5-flash`

**Configuration**:
- **True Context Limit**: 1,000,000 tokens
- **Our Conservative Limit**: 700,000 tokens (70% for safety)
- **Max Summary Output**: 1,000 tokens
- **Target Summary Length**: <500 tokens (per prompt)
- **Temperature**: 0.3 (consistent summaries)
- **Cost**: ~$0.03 per summary (100K input + 1K output)

**Why Gemini 2.5 Flash?**
- Cheapest: $0.30/1M input, $2.50/1M output
- Massive context: 1M tokens (can summarize any conversation)
- Fast: "Flash" = optimized for speed
- High quality: Reasoning model with thinking budgets

---

### 3. All Chat Models & Their Context Limits

## Anthropic Claude Models (All 200K)

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `anthropic/claude-4-sonnet` | 200,000 | Latest Sonnet |
| `anthropic/claude-sonnet-4-5-20250929` | 200,000 | Sonnet 4.5 |
| `anthropic/claude-3.7-sonnet` | 200,000 | Claude 3.7 |
| `anthropic/claude-3.5-sonnet` | 200,000 | Claude 3.5 |
| `anthropic/claude-3.5-haiku` | 200,000 | Fast model |
| `anthropic/claude-4-opus` | 200,000 | Most capable |
| `anthropic/claude-4.1-opus` | 200,000 | Opus 4.1 |
| `anthropic/claude-3-opus` | 200,000 | Claude 3 |
| `anthropic/claude-3-haiku` | 200,000 | Claude 3 fast |
| `anthropic/claude-haiku-4-5-20251001` | 200,000 | **Default model** |

## OpenAI GPT-5 Models (All 400K)

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `openai/gpt-5` | 400,000 | Standard |
| `openai/gpt-5-mini` | 400,000 | Smaller |
| `openai/gpt-5-nano` | 400,000 | Fastest |
| `openai/gpt-5-pro` | 400,000 | Most capable |

## OpenAI GPT-4.1 Models (All 1M!)

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `openai/gpt-4.1` | **1,000,000** | Huge context! |
| `openai/gpt-4.1-mini` | **1,000,000** | Huge context! |
| `openai/gpt-4.1-nano` | **1,000,000** | Huge context! |

## OpenAI GPT-4 Models (128K)

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `openai/gpt-4o` | 128,000 | GPT-4 Optimized |
| `openai/gpt-4o-mini` | 128,000 | Smaller variant |
| `openai/gpt-4-turbo` | 128,000 | Turbo variant |
| `openai/gpt-3.5-turbo` | 16,000 | ⚠️ Small context |

## OpenAI o-series (Reasoning Models - 200K)

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `openai/o3` | 200,000 | Reasoning model |
| `openai/o3-mini` | 200,000 | Smaller reasoning |
| `openai/o4-mini` | 200,000 | Latest reasoning |
| `openai/o1` | 200,000 | Original o-series |

## Google Gemini Models (Conservative Limits)

| Model | Our Limit | True Limit | Notes |
|-------|-----------|------------|-------|
| `google/gemini-2.5-flash` | **700,000** | 1M | **Summarization model** |
| `google/gemini-2.5-flash-lite` | **700,000** | 1M | Cheaper variant |
| `google/gemini-2.5-pro` | **180,000** | 1M | ⚠️ Price tier limit |
| `google/gemini-2.0-flash` | **700,000** | 1M | Previous gen |
| `google/gemini-2.0-flash-lite` | **700,000** | 1M | Previous gen lite |

**Why Conservative Limits?**
- True limit: 1M tokens
- Our limit: 700K tokens (70%)
- Reason: tiktoken estimation can be 10-20% off for Gemini models
- Prevents rejections from tokenization variance

**Why Gemini Pro at 180K?**
- True limit: 1M tokens
- Pricing tiers:
  - ≤200K: $1.25/M input, $10/M output
  - >200K: $2.50/M input, $15/M output (2x jump!)
- Our limit: 180K (keeps costs predictable)

## xAI Grok Models

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `xai/grok-4` | 256,000 | Latest Grok |
| `xai/grok-3-beta` | 131,000 | Beta variant |
| `xai/grok-3-mini-beta` | 131,000 | Smaller beta |
| `xai/grok-3-fast-beta` | 131,000 | Fast beta |
| `xai/grok-2` | 131,000 | Previous gen |
| `xai/grok-2-vision` | 33,000 | ⚠️ Vision model (small) |

## Perplexity Models

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `perplexity/sonar` | 127,000 | Standard |
| `perplexity/sonar-pro` | 200,000 | Pro variant |
| `perplexity/sonar-reasoning` | 127,000 | Reasoning |
| `perplexity/sonar-reasoning-pro` | 127,000 | Reasoning pro |

## Meta Llama Models

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `meta/llama-3.3-70b` | 128,000 | Llama 3.3 |
| `meta/llama-3.1-70b` | 128,000 | Llama 3.1 |
| `meta/llama-3.1-8b` | 128,000 | Smaller variant |
| `meta/llama-4-scout` | 128,000 | Llama 4 |
| `meta/llama-4-maverick-17b` | **1,000,000** | Huge context! |

## DeepSeek Models

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `deepseek/deepseek-r1` | 160,000 | Reasoning v1 |
| `deepseek/deepseek-v3` | 164,000 | Latest version |

## Alibaba Qwen Models

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `alibaba/qwen-3-coder` | 131,000 | Code-focused |
| `alibaba/qwen-3-32b` | 128,000 | General model |

## Default Fallback

| Model | Context Limit | Notes |
|-------|--------------|-------|
| `default` | 128,000 | Used for unknown models |

---

## Token Management Thresholds

### Current Configuration (v2 - Aggressive)

| Usage % | Strategy | Action | Target % |
|---------|----------|--------|----------|
| 0-70% | Full History | Keep all messages | N/A |
| 70-80% | Sliding Window | Iteratively reduce messages | ~60% |
| 80-90% | Summarization | Keep 3 recent + summary | ~50% |
| >90% | Hard Limit | Reject with error | N/A |

### Reserve Tokens

- **Output Reserve**: 4,000 tokens (for model response)
- **Effective Limit**: Context Limit - 4,000

### Example: Claude Haiku (200K)

```
True limit: 200,000 tokens
Reserve: -4,000 tokens
Effective: 196,000 tokens

Thresholds:
- 70%: 137,200 tokens → Sliding window (reduce to ~117,600)
- 80%: 156,800 tokens → Summarization (reduce to ~98,000)
- 90%: 176,400 tokens → Hard limit error
```

### Example: Gemini 2.5 Flash (700K)

```
True limit: 1,000,000 tokens (conservative: 700,000)
Reserve: -4,000 tokens
Effective: 696,000 tokens

Thresholds:
- 70%: 487,200 tokens → Sliding window (reduce to ~417,600)
- 80%: 556,800 tokens → Summarization (reduce to ~348,000)
- 90%: 626,400 tokens → Hard limit error
```

---

## Summary of Changes (v2)

### What Changed?
1. **Threshold reduced**: 85% → 80% (more aggressive)
2. **Target-based reduction**: Instead of "keep 10 messages", reduce to target %
3. **Sliding window targets 60%**: Safer buffer for tokenization variance
4. **Summarization targets 50%**: Keeps only 3 messages (was 5)

### Why More Aggressive?
- tiktoken estimation can be 10-15% lower than actual tokenization
- At 85% estimated, actual might be 95-100% → model rejection
- By targeting 60% after management, actual ~70% → safe buffer

---

## Cost Analysis

### Summarization Costs

**Per Summary**: ~$0.03 (100K input + 1K output)
- Input: 100K × $0.30/1M = $0.030
- Output: 1K × $2.50/1M = $0.0025
- Total: ~$0.0325

**Monthly Estimates**:
- Average user: 1-2 summaries/month = $0.03-0.06
- Power user: 10 summaries/month = $0.30
- Enterprise (1K users, 5 summaries/user): $150/month

---

## When to Use Which Model?

### For Long Conversations:
1. **GPT-4.1** (1M context) - Rarely hits limits
2. **Llama 4 Maverick** (1M context) - Open source option
3. **Gemini 2.5 Flash** (700K conservative) - Cheap + huge context

### For Budget-Conscious:
1. **Gemini 2.5 Flash Lite** - Cheapest option
2. **Claude Haiku** - Fast + affordable
3. **GPT-5 Nano** - OpenAI budget option

### For Quality:
1. **Claude Opus** - Most capable
2. **GPT-5 Pro** - High quality
3. **Gemini 2.5 Pro** - Best Gemini (watch price tier!)

---

## Testing Recommendations

Based on your questions, you should test:

1. ✅ **Scenario 5** (Single huge message) - Your actual bug
2. ✅ **Scenario 4** (Hard limit) - When management can't help
3. ✅ **Summarization quality** - Does it preserve context?
4. ✅ **Progressive usage** - Real conversation flow

Run: `node test-token-management.js --live`
