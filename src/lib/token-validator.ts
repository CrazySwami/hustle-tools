import { Tiktoken, encodingForModel } from 'js-tiktoken';

/**
 * Model context window limits (in tokens)
 * Source: docs/models.md
 */
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Anthropic Claude models
  'anthropic/claude-4-sonnet': 200000,
  'anthropic/claude-sonnet-4-5-20250929': 200000,
  'anthropic/claude-3.7-sonnet': 200000,
  'anthropic/claude-3.5-sonnet': 200000,
  'anthropic/claude-3.5-haiku': 200000,
  'anthropic/claude-4-opus': 200000,
  'anthropic/claude-4.1-opus': 200000,
  'anthropic/claude-3-opus': 200000,
  'anthropic/claude-3-haiku': 200000,
  'anthropic/claude-haiku-4-5-20251001': 200000,

  // OpenAI GPT-5 models
  'openai/gpt-5': 400000,
  'openai/gpt-5-mini': 400000,
  'openai/gpt-5-nano': 400000,
  'openai/gpt-5-pro': 400000,

  // OpenAI GPT-4.1 models
  'openai/gpt-4.1': 1000000,
  'openai/gpt-4.1-mini': 1000000,
  'openai/gpt-4.1-nano': 1000000,

  // OpenAI GPT-4 models
  'openai/gpt-4o': 128000,
  'openai/gpt-4o-mini': 128000,
  'openai/gpt-4-turbo': 128000,
  'openai/gpt-3.5-turbo': 16000,

  // OpenAI o-series (reasoning models)
  'openai/o3': 200000,
  'openai/o3-mini': 200000,
  'openai/o4-mini': 200000,
  'openai/o1': 200000,

  // Google Gemini models - Conservative limits (70% of true limit for safety)
  // True limits: 1M for Flash models, but tiktoken estimation may be off by 10-20%
  'google/gemini-2.5-flash': 700000,        // True: 1M, using 70% for safety buffer
  'google/gemini-2.5-flash-lite': 700000,   // True: 1M, using 70% for safety buffer
  'google/gemini-2.5-pro': 180000,          // True: 1M, but 90% of 200K to avoid price tier jump
  'google/gemini-2.0-flash': 700000,        // True: 1M, using 70% for safety buffer
  'google/gemini-2.0-flash-lite': 700000,   // True: 1M, using 70% for safety buffer

  // xAI Grok models
  'xai/grok-4': 256000,
  'xai/grok-3-beta': 131000,
  'xai/grok-3-mini-beta': 131000,
  'xai/grok-3-fast-beta': 131000,
  'xai/grok-2': 131000,
  'xai/grok-2-vision': 33000,

  // Perplexity models
  'perplexity/sonar': 127000,
  'perplexity/sonar-pro': 200000,
  'perplexity/sonar-reasoning': 127000,
  'perplexity/sonar-reasoning-pro': 127000,

  // Meta Llama models
  'meta/llama-3.3-70b': 128000,
  'meta/llama-3.1-70b': 128000,
  'meta/llama-3.1-8b': 128000,
  'meta/llama-4-scout': 128000,
  'meta/llama-4-maverick-17b': 1000000,

  // DeepSeek models
  'deepseek/deepseek-r1': 160000,
  'deepseek/deepseek-v3': 164000,

  // Alibaba Qwen models
  'alibaba/qwen-3-coder': 131000,
  'alibaba/qwen-3-32b': 128000,

  // Default fallback
  'default': 128000,
};

/**
 * Estimate token count for a string using tiktoken
 * Uses cl100k_base encoding (GPT-4/Claude compatible)
 */
export function estimateTokenCount(text: string): number {
  try {
    // Use cl100k_base encoding (used by GPT-4, Claude, and most modern models)
    const encoding = encodingForModel('gpt-4');
    const tokens = encoding.encode(text);
    // Note: encoding.free() doesn't exist in js-tiktoken, memory is auto-managed
    return tokens.length;
  } catch (error) {
    // Fallback: rough estimate (1 token ≈ 4 characters for English text)
    console.warn('Token counting failed, using fallback estimation:', error);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Get context window limit for a model
 */
export function getModelContextLimit(model: string): number {
  return MODEL_CONTEXT_LIMITS[model] || MODEL_CONTEXT_LIMITS['default'];
}

/**
 * Validate if a prompt fits within model's context window
 */
export interface TokenValidationResult {
  isValid: boolean;
  tokenCount: number;
  limit: number;
  percentUsed: number;
  exceeded: number;
  warning?: string;
  error?: string;
}

export function validatePromptTokens(
  systemPrompt: string,
  userMessages: string,
  model: string,
  reserveForOutput: number = 4000 // Reserve tokens for model output
): TokenValidationResult {
  const systemTokens = estimateTokenCount(systemPrompt);
  const messageTokens = estimateTokenCount(userMessages);
  const totalInputTokens = systemTokens + messageTokens;

  const contextLimit = getModelContextLimit(model);
  const effectiveLimit = contextLimit - reserveForOutput;

  const percentUsed = (totalInputTokens / effectiveLimit) * 100;
  const exceeded = Math.max(0, totalInputTokens - effectiveLimit);

  let warning: string | undefined;
  let error: string | undefined;

  if (totalInputTokens > effectiveLimit) {
    error = `Prompt exceeds model context limit by ${exceeded.toLocaleString()} tokens. Please reduce input size.`;
  } else if (percentUsed > 90) {
    warning = `Prompt uses ${percentUsed.toFixed(1)}% of context window. Consider reducing input size.`;
  } else if (percentUsed > 75) {
    warning = `Prompt uses ${percentUsed.toFixed(1)}% of context window.`;
  }

  return {
    isValid: totalInputTokens <= effectiveLimit,
    tokenCount: totalInputTokens,
    limit: effectiveLimit,
    percentUsed,
    exceeded,
    warning,
    error,
  };
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  suffix: string = '\n\n[... truncated ...]'
): string {
  const currentTokens = estimateTokenCount(text);

  if (currentTokens <= maxTokens) {
    return text;
  }

  // Binary search to find the right length
  const suffixTokens = estimateTokenCount(suffix);
  const targetTokens = maxTokens - suffixTokens;

  let left = 0;
  let right = text.length;
  let bestLength = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const truncated = text.substring(0, mid);
    const tokens = estimateTokenCount(truncated);

    if (tokens <= targetTokens) {
      bestLength = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return text.substring(0, bestLength) + suffix;
}

/**
 * Smart truncation for file content in system prompts
 * Preserves beginning and end, truncates middle
 */
export function smartTruncateFile(
  content: string,
  fileName: string,
  maxTokens: number
): string {
  const currentTokens = estimateTokenCount(content);

  if (currentTokens <= maxTokens) {
    return content;
  }

  // Keep first 30% and last 30%, truncate middle 40%
  const lines = content.split('\n');
  const keepStart = Math.floor(lines.length * 0.3);
  const keepEnd = Math.floor(lines.length * 0.3);

  const startLines = lines.slice(0, keepStart).join('\n');
  const endLines = lines.slice(-keepEnd).join('\n');

  const truncationMessage = `\n\n[... ${fileName} truncated: ${currentTokens.toLocaleString()} tokens exceeded limit of ${maxTokens.toLocaleString()} ...]\n\n`;

  const truncated = startLines + truncationMessage + endLines;

  // If still too large, use simple truncation
  if (estimateTokenCount(truncated) > maxTokens) {
    return truncateToTokenLimit(content, maxTokens);
  }

  return truncated;
}

/**
 * Conversation context window management strategies
 * Based on 2025 best practices: sliding window + summarization
 */

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ConversationWindowResult {
  messages: ConversationMessage[];
  totalTokens: number;
  originalMessageCount: number;
  keptMessageCount: number;
  summarizedCount: number;
  strategy: 'full' | 'sliding-window' | 'summarized';
}

/**
 * Manage conversation context using sliding window approach
 * Keeps recent messages, summarizes older ones
 *
 * Best practice thresholds (2025):
 * - 0-70%: Keep all messages (full history)
 * - 70-80%: Use sliding window (keep recent N messages, target 60% usage)
 * - 80-90%: Summarize older messages
 * - >90%: Hard limit - refuse or require user action
 *
 * Note: Reduced from 85% to 80% threshold because tiktoken estimation
 * can be 10-15% lower than actual model tokenization, causing rejections.
 */
export function manageConversationWindow(
  messages: ConversationMessage[],
  systemPrompt: string,
  model: string,
  options: {
    /** Reserve tokens for model output (default: 4000) */
    reserveForOutput?: number;
    /** Keep at least this many recent messages (default: 10) */
    keepRecentMessages?: number;
    /** Soft warning threshold percentage (default: 70) */
    softThreshold?: number;
    /** Hard limit threshold percentage (default: 80) - Reduced from 85 to be more conservative */
    hardThreshold?: number;
  } = {}
): ConversationWindowResult {
  const {
    reserveForOutput = 4000,
    keepRecentMessages = 10,
    softThreshold = 70,
    hardThreshold = 80, // Reduced from 85 to 80 for more aggressive management
  } = options;

  const contextLimit = getModelContextLimit(model);
  const effectiveLimit = contextLimit - reserveForOutput;
  const systemTokens = estimateTokenCount(systemPrompt);

  // Calculate total tokens with all messages
  const messagesText = JSON.stringify(messages);
  const allMessagesTokens = estimateTokenCount(messagesText);
  const totalTokens = systemTokens + allMessagesTokens;
  const percentUsed = (totalTokens / effectiveLimit) * 100;

  // Strategy 1: Full history (< 70% usage)
  if (percentUsed < softThreshold) {
    return {
      messages,
      totalTokens,
      originalMessageCount: messages.length,
      keptMessageCount: messages.length,
      summarizedCount: 0,
      strategy: 'full',
    };
  }

  // Strategy 2: Sliding window (70-80% usage)
  // Target: Reduce to ~60% usage for safety buffer
  if (percentUsed < hardThreshold) {
    // Start with requested number of recent messages, then reduce if still too large
    let messageCount = keepRecentMessages;
    let recentMessages = messages.slice(-messageCount);
    let recentTokens = estimateTokenCount(JSON.stringify(recentMessages));
    let newTotal = systemTokens + recentTokens;
    let newPercent = (newTotal / effectiveLimit) * 100;

    // Iteratively reduce message count until we hit 60% or run out of messages
    const targetPercent = 60; // Conservative target
    while (newPercent > targetPercent && messageCount > 1) {
      messageCount--;
      recentMessages = messages.slice(-messageCount);
      recentTokens = estimateTokenCount(JSON.stringify(recentMessages));
      newTotal = systemTokens + recentTokens;
      newPercent = (newTotal / effectiveLimit) * 100;
    }

    console.log(`📉 Sliding window reduced from ${messages.length} to ${messageCount} messages (${newPercent.toFixed(1)}% usage)`);

    return {
      messages: recentMessages,
      totalTokens: newTotal,
      originalMessageCount: messages.length,
      keptMessageCount: recentMessages.length,
      summarizedCount: messages.length - recentMessages.length,
      strategy: 'sliding-window',
    };
  }

  // Strategy 3: Summarization (80-90% usage)
  // Keep very recent messages + create summary of older ones
  // Target: Reduce to ~50% usage for safety buffer
  const veryRecentCount = Math.max(3, Math.floor(keepRecentMessages / 3)); // Reduced from /2 to /3
  const veryRecentMessages = messages.slice(-veryRecentCount);
  const olderMessages = messages.slice(0, -veryRecentCount);

  // Create simple summary of older messages
  const summary: ConversationMessage = {
    role: 'system',
    content: `[Earlier conversation summary: ${olderMessages.length} messages exchanged. User requested various tasks and assistant responded with tool calls and explanations. Recent context continues below.]`,
    timestamp: Date.now(),
  };

  const summarizedMessages = [summary, ...veryRecentMessages];
  const summarizedTokens = estimateTokenCount(JSON.stringify(summarizedMessages));
  const newTotal = systemTokens + summarizedTokens;
  const newPercent = (newTotal / effectiveLimit) * 100;

  console.log(`📄 Summarization reduced from ${messages.length} to ${veryRecentCount} messages + summary (${newPercent.toFixed(1)}% usage)`);

  return {
    messages: summarizedMessages,
    totalTokens: newTotal,
    originalMessageCount: messages.length,
    keptMessageCount: veryRecentMessages.length,
    summarizedCount: olderMessages.length,
    strategy: 'summarized',
  };
}

/**
 * AI-Powered Conversation Summarization
 * Uses Gemini 2.5 Flash to create intelligent summaries
 *
 * Cost: ~$0.008 per summary (100K input + 1K output)
 * - Input: $0.30 / 1M tokens
 * - Output: $2.50 / 1M tokens
 */
export async function summarizeConversationWithAI(
  messages: ConversationMessage[]
): Promise<string> {
  try {
    const response = await fetch('/api/summarize-conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Summarization API error: ${response.status}`);
    }

    // Read streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let summary = '';

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // Parse Vercel AI SDK stream format
      const lines = chunk.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.startsWith('0:')) {
          // Text chunk
          const text = line.slice(3, -1); // Remove '0:"' and '"'
          summary += text;
        }
      }
    }

    return summary || '[AI summarization failed - using fallback]';
  } catch (error) {
    console.error('❌ AI summarization failed:', error);
    // Fallback to simple summary
    return `[Earlier conversation summary: ${messages.length} messages exchanged. AI summarization unavailable.]`;
  }
}

/**
 * Async version of manageConversationWindow with AI-powered summarization
 * Use this version when you want intelligent summaries (recommended)
 */
export async function manageConversationWindowWithAI(
  messages: ConversationMessage[],
  systemPrompt: string,
  model: string,
  options: {
    reserveForOutput?: number;
    keepRecentMessages?: number;
    softThreshold?: number;
    hardThreshold?: number;
    /** Use AI summarization when true (default: true) */
    useAI?: boolean;
  } = {}
): Promise<ConversationWindowResult> {
  const {
    reserveForOutput = 4000,
    keepRecentMessages = 10,
    softThreshold = 70,
    hardThreshold = 80, // Reduced from 85 to 80
    useAI = true,
  } = options;

  const contextLimit = getModelContextLimit(model);
  const effectiveLimit = contextLimit - reserveForOutput;
  const systemTokens = estimateTokenCount(systemPrompt);

  // Calculate total tokens with all messages
  const messagesText = JSON.stringify(messages);
  const allMessagesTokens = estimateTokenCount(messagesText);
  const totalTokens = systemTokens + allMessagesTokens;
  const percentUsed = (totalTokens / effectiveLimit) * 100;

  // Strategy 1: Full history (< 70% usage)
  if (percentUsed < softThreshold) {
    return {
      messages,
      totalTokens,
      originalMessageCount: messages.length,
      keptMessageCount: messages.length,
      summarizedCount: 0,
      strategy: 'full',
    };
  }

  // Strategy 2: Sliding window (70-80% usage)
  // Target: Reduce to ~60% usage for safety buffer
  if (percentUsed < hardThreshold) {
    // Start with requested number of recent messages, then reduce if still too large
    let messageCount = keepRecentMessages;
    let recentMessages = messages.slice(-messageCount);
    let recentTokens = estimateTokenCount(JSON.stringify(recentMessages));
    let newTotal = systemTokens + recentTokens;
    let newPercent = (newTotal / effectiveLimit) * 100;

    // Iteratively reduce message count until we hit 60% or run out of messages
    const targetPercent = 60; // Conservative target
    while (newPercent > targetPercent && messageCount > 1) {
      messageCount--;
      recentMessages = messages.slice(-messageCount);
      recentTokens = estimateTokenCount(JSON.stringify(recentMessages));
      newTotal = systemTokens + recentTokens;
      newPercent = (newTotal / effectiveLimit) * 100;
    }

    console.log(`📉 Sliding window reduced from ${messages.length} to ${messageCount} messages (${newPercent.toFixed(1)}% usage)`);

    return {
      messages: recentMessages,
      totalTokens: newTotal,
      originalMessageCount: messages.length,
      keptMessageCount: recentMessages.length,
      summarizedCount: messages.length - recentMessages.length,
      strategy: 'sliding-window',
    };
  }

  // Strategy 3: AI-Powered Summarization (80-90% usage)
  // Target: Reduce to ~50% usage for safety buffer
  const veryRecentCount = Math.max(3, Math.floor(keepRecentMessages / 3)); // Reduced from /2 to /3
  const veryRecentMessages = messages.slice(-veryRecentCount);
  const olderMessages = messages.slice(0, -veryRecentCount);

  let summaryContent: string;

  if (useAI && process.env.AI_GATEWAY_API_KEY) {
    // Use AI for intelligent summarization
    console.log('🤖 Using AI to summarize', olderMessages.length, 'messages');
    summaryContent = await summarizeConversationWithAI(olderMessages);
  } else {
    // Fallback to simple summary
    summaryContent = `[Earlier conversation summary: ${olderMessages.length} messages exchanged. User requested various tasks and assistant responded with tool calls and explanations. Recent context continues below.]`;
  }

  const summary: ConversationMessage = {
    role: 'system',
    content: summaryContent,
    timestamp: Date.now(),
  };

  const summarizedMessages = [summary, ...veryRecentMessages];
  const summarizedTokens = estimateTokenCount(JSON.stringify(summarizedMessages));
  const newTotal = systemTokens + summarizedTokens;
  const newPercent = (newTotal / effectiveLimit) * 100;

  console.log(`📄 AI Summarization reduced from ${messages.length} to ${veryRecentCount} messages + summary (${newPercent.toFixed(1)}% usage)`);

  return {
    messages: summarizedMessages,
    totalTokens: newTotal,
    originalMessageCount: messages.length,
    keptMessageCount: veryRecentMessages.length,
    summarizedCount: olderMessages.length,
    strategy: 'summarized',
  };
}

/**
 * Get recommended action based on token usage percentage
 */
export function getTokenUsageRecommendation(percentUsed: number): {
  level: 'safe' | 'warning' | 'critical' | 'exceeded';
  message: string;
  action: string;
} {
  if (percentUsed < 50) {
    return {
      level: 'safe',
      message: 'Token usage is healthy',
      action: 'Continue normally',
    };
  }

  if (percentUsed < 70) {
    return {
      level: 'safe',
      message: 'Token usage is moderate',
      action: 'Monitor usage',
    };
  }

  if (percentUsed < 80) {
    return {
      level: 'warning',
      message: 'Approaching context limit',
      action: 'Sliding window will be applied automatically',
    };
  }

  if (percentUsed < 90) {
    return {
      level: 'critical',
      message: 'Very close to context limit',
      action: 'Messages will be auto-summarized',
    };
  }

  return {
    level: 'exceeded',
    message: 'Context limit exceeded',
    action: 'Must start a new conversation',
  };
}
