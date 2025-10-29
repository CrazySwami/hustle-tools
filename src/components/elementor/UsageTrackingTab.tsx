'use client';

import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';

interface UsageTrackingTabProps {
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
}

export function UsageTrackingTab({
  chatVisible,
  setChatVisible,
  tabBarVisible,
  setTabBarVisible,
}: UsageTrackingTabProps) {
  const { usageRecords, getTotalCost, getTotalTokens, clearHistory, exportToCSV } = useUsageTracking();

  const [sortBy, setSortBy] = useState<'time' | 'cost'>('time');
  const [filterModel, setFilterModel] = useState<string>('all');

  // Get unique models for filter
  const uniqueModels = useMemo(() => {
    const models = new Set(usageRecords.map(r => r.modelId));
    return ['all', ...Array.from(models)];
  }, [usageRecords]);

  // Sort and filter records
  const sortedRecords = useMemo(() => {
    let filtered = usageRecords;

    if (filterModel !== 'all') {
      filtered = filtered.filter(r => r.modelId === filterModel);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'time') {
        return b.timestamp - a.timestamp;
      } else {
        return (b.totalCost || 0) - (a.totalCost || 0);
      }
    });
  }, [usageRecords, sortBy, filterModel]);

  // Calculate totals
  const totalCost = getTotalCost();
  const totalTokens = getTotalTokens();
  const totalInputTokens = usageRecords.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
  const totalOutputTokens = usageRecords.reduce((sum, r) => sum + (r.outputTokens || 0), 0);
  const totalCachedTokens = usageRecords.reduce((sum, r) => sum + (r.cacheReadTokens || 0), 0);

  // Calculate savings from caching
  const cacheSavings = useMemo(() => {
    return usageRecords.reduce((sum, r) => {
      if (r.cacheReadTokens && r.cacheReadTokens > 0) {
        // Savings = (cache read tokens / 1M) * (full input price - cached price)
        const model = r.modelId;
        // Rough estimate: cached tokens are 90% cheaper
        const fullCost = (r.cacheReadTokens / 1_000_000) * 3.0; // Assume $3/M full price
        const cachedCost = (r.cacheReadTokens / 1_000_000) * 0.3; // 90% discount
        return sum + (fullCost - cachedCost);
      }
      return sum;
    }, 0);
  }, [usageRecords]);

  // Group by model
  const modelStats = useMemo(() => {
    const stats: Record<string, { count: number; cost: number; tokens: number }> = {};

    usageRecords.forEach(r => {
      if (!stats[r.modelId]) {
        stats[r.modelId] = { count: 0, cost: 0, tokens: 0 };
      }
      stats[r.modelId].count++;
      stats[r.modelId].cost += r.totalCost || 0;
      stats[r.modelId].tokens += r.inputTokens + r.outputTokens;
    });

    return Object.entries(stats).sort((a, b) => b[1].cost - a[1].cost);
  }, [usageRecords]);

  const handleExport = () => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('⚠️ Are you sure you want to clear all usage history? This cannot be undone.')) {
      clearHistory();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--background)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>
              Usage Tracking
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
              Monitor your AI usage, costs, and token consumption across all models
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={usageRecords.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={16} />
              Export CSV
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={usageRecords.length === 0}
              style={{ color: 'var(--destructive)' }}
            >
              Clear History
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <Card style={{ padding: '16px', background: 'var(--background)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '8px', color: 'white' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>Total Cost</p>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>${totalCost.toFixed(4)}</p>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '16px', background: 'var(--background)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#10b981', borderRadius: '8px', color: 'white' }}>
                <Zap size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>Total Tokens</p>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '16px', background: 'var(--background)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#6366f1', borderRadius: '8px', color: 'white' }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>Requests</p>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{usageRecords.length}</p>
              </div>
            </div>
          </Card>

          {cacheSavings > 0 && (
            <Card style={{ padding: '16px', background: 'var(--background)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#f59e0b', borderRadius: '8px', color: 'white' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>Cache Savings</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>${cacheSavings.toFixed(4)}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {usageRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BarChart3 size={64} style={{ margin: '0 auto 16px', color: 'var(--muted-foreground)', opacity: 0.5 }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Usage Data Yet</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              Start using AI tools and your usage will be tracked here
            </p>
          </div>
        ) : (
          <>
            {/* Model Statistics */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Usage by Model</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                {modelStats.map(([model, stats]) => (
                  <Card key={model} style={{ padding: '16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{model}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{stats.count} requests</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Cost:</span>
                      <span style={{ fontWeight: 600 }}>${stats.cost.toFixed(4)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Tokens:</span>
                      <span style={{ fontWeight: 600 }}>{stats.tokens.toLocaleString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, marginRight: '8px' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'time' | 'cost')}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--background)',
                    fontSize: '13px',
                  }}
                >
                  <option value="time">Time (newest first)</option>
                  <option value="cost">Cost (highest first)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, marginRight: '8px' }}>Model:</label>
                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--background)',
                    fontSize: '13px',
                  }}
                >
                  {uniqueModels.map(model => (
                    <option key={model} value={model}>{model === 'all' ? 'All Models' : model}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Usage History Table */}
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>Timestamp</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>Model</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>Input Tokens</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>Output Tokens</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>Cached</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((record, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          {new Date(record.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--primary)' }}>
                          {record.modelId}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>
                          {record.inputTokens.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>
                          {record.outputTokens.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>
                          {record.cacheReadTokens ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                              {record.cacheReadTokens.toLocaleString()}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                          ${(record.totalCost || 0).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
