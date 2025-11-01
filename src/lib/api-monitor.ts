// API Monitoring System
// Tracks all API calls, token usage, costs, and performance

export interface APICallLog {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  provider?: string; // 'openai', 'gemini', 'anthropic', etc.
  model?: string;
  requestBody?: any;
  responseStatus: number;
  responseTime: number; // in ms
  success: boolean;
  error?: string;

  // Token tracking
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;

  // Cost tracking (in USD)
  estimatedCost?: number;

  // Additional metadata
  userId?: string;
  userAgent?: string;
  ip?: string;
}

// Model pricing (per 1M tokens, in USD)
export const MODEL_PRICING = {
  // OpenAI
  'gpt-4.1': { input: 2.50, output: 10.00 },
  'gpt-5': { input: 5.00, output: 15.00 },
  'gpt-5-mini': { input: 1.00, output: 4.00 },
  'gpt-5-nano': { input: 0.50, output: 2.00 },
  'gpt-5-pro': { input: 10.00, output: 30.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'dall-e-3': { input: 0, output: 0, imagePrice: { '1024x1024': 0.040, '1024x1792': 0.080, '1792x1024': 0.080 } },
  'gpt-image-1': { input: 0, output: 0, imagePrice: { '1024x1024': 0.020, '1536x1536': 0.050, '1024x1792': 0.030, '1792x1024': 0.030 } },

  // Google Gemini
  'gemini-2.5-flash-exp': { input: 0, output: 0 }, // Free during preview
  'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free during preview
  'gemini-2.5-flash-image-preview': { input: 0, output: 0, imagePrice: { perImage: 0.01 } },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },

  // Anthropic
  'claude-sonnet-4.5': { input: 3.00, output: 15.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-opus-4-20250514': { input: 15.00, output: 75.00 },
} as const;

export function calculateCost(
  model: string,
  promptTokens: number = 0,
  completionTokens: number = 0,
  imageSize?: string,
  imageCount: number = 1
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  if (!pricing) return 0;

  let cost = 0;

  // Token-based pricing
  if (pricing.input && pricing.output) {
    cost += (promptTokens / 1_000_000) * pricing.input;
    cost += (completionTokens / 1_000_000) * pricing.output;
  }

  // Image-based pricing
  if (pricing.imagePrice) {
    if ('perImage' in pricing.imagePrice) {
      cost += pricing.imagePrice.perImage * imageCount;
    } else if (imageSize && imageSize in pricing.imagePrice) {
      cost += (pricing.imagePrice as any)[imageSize] * imageCount;
    }
  }

  return cost;
}

// In-memory storage (for development)
// In production, you'd want to store this in a database
class APIMonitor {
  private logs: APICallLog[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(logEntry: Omit<APICallLog, 'id' | 'timestamp'>): APICallLog {
    const entry: APICallLog = {
      ...logEntry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Calculate cost if we have model and token info
    if (entry.model && entry.totalTokens) {
      entry.estimatedCost = calculateCost(
        entry.model,
        entry.promptTokens || 0,
        entry.completionTokens || 0
      );
    }

    this.logs.unshift(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for debugging
    console.log('[API Monitor]', {
      endpoint: entry.endpoint,
      model: entry.model,
      tokens: entry.totalTokens,
      cost: entry.estimatedCost,
      time: `${entry.responseTime}ms`,
    });

    return entry;
  }

  getLogs(filters?: {
    endpoint?: string;
    provider?: string;
    model?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): APICallLog[] {
    let filtered = [...this.logs];

    if (filters?.endpoint) {
      filtered = filtered.filter(log => log.endpoint.includes(filters.endpoint!));
    }
    if (filters?.provider) {
      filtered = filtered.filter(log => log.provider === filters.provider);
    }
    if (filters?.model) {
      filtered = filtered.filter(log => log.model === filters.model);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  getStats(timeRange?: { start: number; end: number }) {
    let logs = this.logs;

    if (timeRange) {
      logs = logs.filter(
        log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
      );
    }

    const totalCalls = logs.length;
    const successfulCalls = logs.filter(log => log.success).length;
    const failedCalls = totalCalls - successfulCalls;

    const totalTokens = logs.reduce((sum, log) => sum + (log.totalTokens || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);

    const avgResponseTime = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
      : 0;

    // Group by provider
    const byProvider: Record<string, { calls: number; tokens: number; cost: number }> = {};
    logs.forEach(log => {
      const provider = log.provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = { calls: 0, tokens: 0, cost: 0 };
      }
      byProvider[provider].calls++;
      byProvider[provider].tokens += log.totalTokens || 0;
      byProvider[provider].cost += log.estimatedCost || 0;
    });

    // Group by model
    const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};
    logs.forEach(log => {
      if (log.model) {
        if (!byModel[log.model]) {
          byModel[log.model] = { calls: 0, tokens: 0, cost: 0 };
        }
        byModel[log.model].calls++;
        byModel[log.model].tokens += log.totalTokens || 0;
        byModel[log.model].cost += log.estimatedCost || 0;
      }
    });

    // Group by endpoint
    const byEndpoint: Record<string, { calls: number; tokens: number; cost: number }> = {};
    logs.forEach(log => {
      if (!byEndpoint[log.endpoint]) {
        byEndpoint[log.endpoint] = { calls: 0, tokens: 0, cost: 0 };
      }
      byEndpoint[log.endpoint].calls++;
      byEndpoint[log.endpoint].tokens += log.totalTokens || 0;
      byEndpoint[log.endpoint].cost += log.estimatedCost || 0;
    });

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      totalTokens,
      totalCost,
      avgResponseTime,
      byProvider,
      byModel,
      byEndpoint,
    };
  }

  clear() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const apiMonitor = new APIMonitor();

// Helper function to wrap API calls with monitoring
export async function monitorAPICall<T>(
  endpoint: string,
  fn: () => Promise<T>,
  metadata?: {
    provider?: string;
    model?: string;
    method?: string;
  }
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const responseTime = Date.now() - startTime;

    apiMonitor.log({
      endpoint,
      method: metadata?.method || 'POST',
      provider: metadata?.provider,
      model: metadata?.model,
      responseStatus: 200,
      responseTime,
      success: true,
    });

    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    apiMonitor.log({
      endpoint,
      method: metadata?.method || 'POST',
      provider: metadata?.provider,
      model: metadata?.model,
      responseStatus: error.status || 500,
      responseTime,
      success: false,
      error: error.message || String(error),
    });

    throw error;
  }
}
