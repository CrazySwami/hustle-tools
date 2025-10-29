import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Model pricing per 1M tokens (UPDATED 2025 - Real production pricing)
export const MODEL_PRICING = {
  // ═══════════════════════════════════════════════════════════════
  // Anthropic Claude Models
  // ═══════════════════════════════════════════════════════════════
  'anthropic/claude-sonnet-4.5': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'anthropic/claude-sonnet-4-5-20250929': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'anthropic/claude-haiku-4.5': {
    input: 1.00,
    output: 5.00,
    cacheWrite: 1.25,
    cacheRead: 0.10,
  },
  'anthropic/claude-haiku-4-5-20250929': {
    input: 1.00,
    output: 5.00,
    cacheWrite: 1.25,
    cacheRead: 0.10,
  },
  'anthropic/claude-sonnet-4': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'anthropic/claude-opus-4.1': {
    input: 15.00,
    output: 75.00,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },
  'anthropic/claude-opus-4-20250514': {
    input: 15.00,
    output: 75.00,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },
  'anthropic/claude-3.5-haiku': {
    input: 0.80,
    output: 4.00,
    cacheWrite: 1.00,
    cacheRead: 0.08,
  },
  'anthropic/claude-3.5-sonnet': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'anthropic/claude-3-haiku': {
    input: 0.25,
    output: 1.25,
    cacheWrite: 0.30,
    cacheRead: 0.03,
  },
  'anthropic/claude-3-opus': {
    input: 15.00,
    output: 75.00,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },

  // ═══════════════════════════════════════════════════════════════
  // OpenAI GPT-5 Series (Released August 2025)
  // ═══════════════════════════════════════════════════════════════
  'openai/gpt-5': {
    input: 1.25,
    output: 10.00,
    cacheWrite: 0,
    cacheRead: 0.125,  // 90% discount
  },
  'openai/gpt-5-mini': {
    input: 0.25,
    output: 2.00,
    cacheWrite: 0,
    cacheRead: 0.025,
  },
  'openai/gpt-5-nano': {
    input: 0.05,
    output: 0.40,
    cacheWrite: 0,
    cacheRead: 0.005,
  },
  'openai/gpt-5-pro': {
    input: 15.00,
    output: 120.00,
    cacheWrite: 0,
    cacheRead: 1.50,
  },
  'openai/gpt-5-codex': {
    input: 1.25,
    output: 10.00,
    cacheWrite: 0,
    cacheRead: 0.125,
  },

  // OpenAI GPT-4 Series (Legacy)
  'openai/gpt-4.1': {
    input: 2.00,
    output: 8.00,
    cacheWrite: 0,
    cacheRead: 0.20,
  },
  'openai/gpt-4.1-mini': {
    input: 0.40,
    output: 1.60,
    cacheWrite: 0,
    cacheRead: 0.04,
  },
  'openai/gpt-4.1-nano': {
    input: 0.10,
    output: 0.40,
    cacheWrite: 0,
    cacheRead: 0.01,
  },
  'openai/gpt-4o': {
    input: 2.50,
    output: 10.00,
    cacheWrite: 0,
    cacheRead: 1.25,
  },
  'openai/gpt-4o-mini': {
    input: 0.15,
    output: 0.60,
    cacheWrite: 0,
    cacheRead: 0.075,
  },
  'openai/gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
    cacheWrite: 0,
    cacheRead: 5.00,
  },

  // OpenAI o-series (Reasoning models)
  'openai/o3': {
    input: 2.00,
    output: 8.00,
    cacheWrite: 0,
    cacheRead: 0.20,
  },
  'openai/o3-mini': {
    input: 1.10,
    output: 4.40,
    cacheWrite: 0,
    cacheRead: 0.11,
  },
  'openai/o4-mini': {
    input: 1.10,
    output: 4.40,
    cacheWrite: 0,
    cacheRead: 0.11,
  },
  'openai/o1': {
    input: 15.00,
    output: 60.00,
    cacheWrite: 0,
    cacheRead: 7.50,
  },

  // OpenAI Legacy
  'openai/gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
    cacheWrite: 0,
    cacheRead: 0.25,
  },
  'openai/gpt-3.5-turbo-instruct': {
    input: 1.50,
    output: 2.00,
    cacheWrite: 0,
    cacheRead: 0.75,
  },

  // ═══════════════════════════════════════════════════════════════
  // Google Gemini Models
  // ═══════════════════════════════════════════════════════════════
  'google/gemini-2.5-flash': {
    input: 0.30,
    output: 2.50,
    cacheWrite: 0,
    cacheRead: 0.075,
  },
  'google/gemini-2.5-pro': {
    input: 2.50,
    output: 15.00,
    cacheWrite: 0,
    cacheRead: 0.625,
  },
  'google/gemini-2.5-flash-lite': {
    input: 0.10,
    output: 0.40,
    cacheWrite: 0,
    cacheRead: 0.025,
  },
  'google/gemini-2.0-flash': {
    input: 0.10,
    output: 0.40,
    cacheWrite: 0,
    cacheRead: 0.025,
  },
  'google/gemini-2.0-flash-lite': {
    input: 0.07,
    output: 0.30,
    cacheWrite: 0,
    cacheRead: 0.0175,
  },
  'google/gemini-2.0-flash-exp': {
    input: 0.00,  // Free during preview
    output: 0.00,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'google/gemini-1.5-pro': {
    input: 1.25,
    output: 5.00,
    cacheWrite: 0,
    cacheRead: 0.3125,
  },
  'google/gemini-1.5-flash': {
    input: 0.075,
    output: 0.30,
    cacheWrite: 0,
    cacheRead: 0.01875,
  },

  // ═══════════════════════════════════════════════════════════════
  // Perplexity Models
  // ═══════════════════════════════════════════════════════════════
  'perplexity/sonar-pro': {
    input: 3.00,
    output: 15.00,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'perplexity/sonar': {
    input: 1.00,
    output: 1.00,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'perplexity/sonar-reasoning-pro': {
    input: 2.00,
    output: 8.00,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'perplexity/sonar-reasoning': {
    input: 1.00,
    output: 5.00,
    cacheWrite: 0,
    cacheRead: 0,
  },

  // ═══════════════════════════════════════════════════════════════
  // Morph Fast Apply (via Vercel AI Gateway)
  // ═══════════════════════════════════════════════════════════════
  'morph/v3-fast': {
    input: 0.80,
    output: 1.20,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'morph/v3-large': {
    input: 0.90,
    output: 1.90,
    cacheWrite: 0,
    cacheRead: 0,
  },
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export interface ModelUsage {
  model: string;
  calls: number;
  tokens: TokenUsage;
  cost: number;
}

interface UsageTrackingStore {
  // Session data
  sessionStart: Date | null;
  totalCalls: number;
  modelUsage: Record<string, ModelUsage>;

  // Aggregated totals
  totalTokens: {
    input: number;
    output: number;
    cacheCreation: number;
    cacheRead: number;
  };
  totalCost: number;

  // Actions
  startSession: () => void;
  recordUsage: (model: string, usage: TokenUsage) => void;
  resetSession: () => void;
  getModelBreakdown: () => ModelUsage[];
  getCacheSavings: () => number;
}

export const useUsageTracking = create<UsageTrackingStore>()(
  persist(
    (set, get) => ({
      sessionStart: null,
      totalCalls: 0,
      modelUsage: {},
      totalTokens: {
        input: 0,
        output: 0,
        cacheCreation: 0,
        cacheRead: 0,
      },
      totalCost: 0,

  startSession: () => {
    console.log('[useUsageTracking] Starting new session');
    set({
      sessionStart: new Date(),
      totalCalls: 0,
      modelUsage: {},
      totalTokens: {
        input: 0,
        output: 0,
        cacheCreation: 0,
        cacheRead: 0,
      },
      totalCost: 0,
    });
  },

  recordUsage: (model: string, usage: TokenUsage) => {
    const state = get();

    console.log('[useUsageTracking] Recording usage:', { model, usage });

    // Get pricing for this model
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || {
      input: 0,
      output: 0,
      cacheWrite: 0,
      cacheRead: 0,
    };

    // Calculate cost for this call
    const callCost =
      (usage.inputTokens / 1_000_000) * pricing.input +
      (usage.outputTokens / 1_000_000) * pricing.output +
      (usage.cacheCreationTokens / 1_000_000) * pricing.cacheWrite +
      (usage.cacheReadTokens / 1_000_000) * pricing.cacheRead;

    // Update model-specific usage
    const existingModel = state.modelUsage[model] || {
      model,
      calls: 0,
      tokens: {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      },
      cost: 0,
    };

    const updatedModelUsage = {
      ...state.modelUsage,
      [model]: {
        model,
        calls: existingModel.calls + 1,
        tokens: {
          inputTokens: existingModel.tokens.inputTokens + usage.inputTokens,
          outputTokens: existingModel.tokens.outputTokens + usage.outputTokens,
          cacheCreationTokens: existingModel.tokens.cacheCreationTokens + usage.cacheCreationTokens,
          cacheReadTokens: existingModel.tokens.cacheReadTokens + usage.cacheReadTokens,
        },
        cost: existingModel.cost + callCost,
      },
    };

    // Update totals
    set({
      totalCalls: state.totalCalls + 1,
      modelUsage: updatedModelUsage,
      totalTokens: {
        input: state.totalTokens.input + usage.inputTokens,
        output: state.totalTokens.output + usage.outputTokens,
        cacheCreation: state.totalTokens.cacheCreation + usage.cacheCreationTokens,
        cacheRead: state.totalTokens.cacheRead + usage.cacheReadTokens,
      },
      totalCost: state.totalCost + callCost,
    });
  },

  resetSession: () => {
    console.log('[useUsageTracking] Resetting session');
    get().startSession();
  },

  getModelBreakdown: () => {
    const state = get();
    return Object.values(state.modelUsage).map((modelData) => {
      const pricing = MODEL_PRICING[modelData.model as keyof typeof MODEL_PRICING] || {
        input: 0,
        output: 0,
        cacheWrite: 0,
        cacheRead: 0,
      };
      return {
        ...modelData,
        pricing,
      };
    }).sort((a, b) => b.cost - a.cost);
  },

  getCacheSavings: () => {
    const state = get();
    let totalSavings = 0;

    Object.entries(state.modelUsage).forEach(([modelName, modelData]) => {
      const pricing = MODEL_PRICING[modelName as keyof typeof MODEL_PRICING];
      if (!pricing) return;

      // Calculate what would have been paid without caching
      const withoutCacheCost = (modelData.tokens.cacheReadTokens / 1_000_000) * pricing.input;

      // Calculate what was actually paid with caching
      const withCacheCost = (modelData.tokens.cacheReadTokens / 1_000_000) * pricing.cacheRead;

      // Savings = difference
      totalSavings += (withoutCacheCost - withCacheCost);
    });

    return totalSavings;
  },
}),
    {
      name: 'usage-tracking-storage', // localStorage key
      version: 1,
    }
  )
);
