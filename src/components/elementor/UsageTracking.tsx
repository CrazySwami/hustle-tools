'use client';

import { useUsageTracking } from '@/hooks/useUsageTracking';
import { BarChart3, DollarSign, Zap, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UsageTracking() {
  const {
    sessionStart,
    totalCalls,
    totalTokens,
    totalCost,
    modelUsage,
    startSession,
    resetSession,
    getModelBreakdown,
    getCacheSavings,
  } = useUsageTracking();

  const modelBreakdown = getModelBreakdown();
  const cacheSavings = getCacheSavings();

  // Start session if not started
  if (!sessionStart) {
    startSession();
  }

  const totalAllTokens =
    totalTokens.input +
    totalTokens.output +
    totalTokens.cacheCreation +
    totalTokens.cacheRead;

  const sessionDuration = sessionStart
    ? Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000 / 60)
    : 0;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Usage Tracking</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Session started {sessionDuration} minute{sessionDuration !== 1 ? 's' : ''} ago
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSession}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Cost */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Total Cost</span>
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${totalCost.toFixed(4)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalCalls} API call{totalCalls !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Total Tokens */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Total Tokens</span>
          </div>
          <div className="text-3xl font-bold">
            {totalAllTokens.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Input + Output + Cache
          </p>
        </div>

        {/* Cache Savings */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">Cache Savings</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            ${cacheSavings.toFixed(4)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalTokens.cacheRead > 0
              ? `${((cacheSavings / (totalCost + cacheSavings)) * 100).toFixed(1)}% saved`
              : 'No cached reads yet'
            }
          </p>
        </div>

        {/* Avg Cost per Call */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Avg per Call</span>
          </div>
          <div className="text-3xl font-bold">
            ${totalCalls > 0 ? (totalCost / totalCalls).toFixed(4) : '0.0000'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average API cost
          </p>
        </div>
      </div>

      {/* Token Breakdown */}
      <div className="border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-semibold mb-4">Token Breakdown</h3>
        <div className="space-y-3">
          {/* Input Tokens */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Input Tokens</span>
              <span className="font-medium">{totalTokens.input.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${totalAllTokens > 0 ? (totalTokens.input / totalAllTokens) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Output Tokens */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Output Tokens</span>
              <span className="font-medium">{totalTokens.output.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${totalAllTokens > 0 ? (totalTokens.output / totalAllTokens) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Cache Creation */}
          {totalTokens.cacheCreation > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Cache Creation</span>
                <span className="font-medium">{totalTokens.cacheCreation.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{
                    width: `${totalAllTokens > 0 ? (totalTokens.cacheCreation / totalAllTokens) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Cache Read */}
          {totalTokens.cacheRead > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Cache Read (90% off!)</span>
                <span className="font-medium">{totalTokens.cacheRead.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${totalAllTokens > 0 ? (totalTokens.cacheRead / totalAllTokens) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-semibold mb-4">Cost by Model</h3>
        {modelBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No usage data yet. Start chatting to see stats!
          </p>
        ) : (
          <div className="space-y-4">
            {modelBreakdown.map((model) => {
              const modelTotal =
                model.tokens.inputTokens +
                model.tokens.outputTokens +
                model.tokens.cacheCreationTokens +
                model.tokens.cacheReadTokens;

              return (
                <div key={model.model} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {model.model.split('/')[1] || model.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {model.calls} call{model.calls !== 1 ? 's' : ''} • {modelTotal.toLocaleString()} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${model.cost.toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((model.cost / totalCost) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Token breakdown for this model */}
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Input:</span>
                      <span>{model.tokens.inputTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Output:</span>
                      <span>{model.tokens.outputTokens.toLocaleString()}</span>
                    </div>
                    {model.tokens.cacheCreationTokens > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cache Write:</span>
                        <span>{model.tokens.cacheCreationTokens.toLocaleString()}</span>
                      </div>
                    )}
                    {model.tokens.cacheReadTokens > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cache Read:</span>
                        <span className="text-purple-600">{model.tokens.cacheReadTokens.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing info */}
                  <div className="mt-3 pt-3 border-t text-xs space-y-1">
                    <div className="font-medium text-muted-foreground mb-1">Pricing (per 1M tokens):</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <div>Input: ${model.pricing.input.toFixed(2)}</div>
                      <div>Output: ${model.pricing.output.toFixed(2)}</div>
                      {model.pricing.cacheWrite > 0 && (
                        <div>Cache Write: ${model.pricing.cacheWrite.toFixed(2)}</div>
                      )}
                      {model.pricing.cacheRead > 0 && (
                        <div>Cache Read: ${model.pricing.cacheRead.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Prompt Caching</strong> reduces costs by up to 90% on repeated content.
          Cache reads (purple) are 10x cheaper than normal input tokens.
        </p>
      </div>
    </div>
  );
}
