"use client";

import { useState, useEffect } from 'react';
import { Activity, DollarSign, Zap, TrendingUp, Download, Trash2, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNav } from '@/components/ui/BottomNav';

interface APILog {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  provider?: string;
  model?: string;
  responseStatus: number;
  responseTime: number;
  success: boolean;
  error?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
}

interface Stats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  byProvider: Record<string, { calls: number; tokens: number; cost: number }>;
  byModel: Record<string, { calls: number; tokens: number; cost: number }>;
  byEndpoint: Record<string, { calls: number; tokens: number; cost: number }>;
}

export default function APIMonitorPage() {
  const [logs, setLogs] = useState<APILog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterEndpoint, setFilterEndpoint] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'all'>('1h');

  const fetchData = async () => {
    try {
      // Calculate time range
      const now = Date.now();
      let startDate: number | undefined;
      if (timeRange === '1h') startDate = now - 3600000;
      else if (timeRange === '24h') startDate = now - 86400000;
      else if (timeRange === '7d') startDate = now - 604800000;

      // Fetch logs
      const logsParams = new URLSearchParams({
        action: 'logs',
        limit: '100',
        ...(filterEndpoint && { endpoint: filterEndpoint }),
        ...(filterProvider && { provider: filterProvider }),
        ...(filterModel && { model: filterModel }),
        ...(startDate && { startDate: startDate.toString() }),
      });

      const logsRes = await fetch(`/api/monitor?${logsParams}`);
      const logsData = await logsRes.json();

      if (logsData.success) {
        setLogs(logsData.logs);
      }

      // Fetch stats
      const statsParams = new URLSearchParams({
        action: 'stats',
        ...(startDate && { startDate: startDate.toString(), endDate: now.toString() }),
      });

      const statsRes = await fetch(`/api/monitor?${statsParams}`);
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterEndpoint, filterProvider, filterModel, timeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, filterEndpoint, filterProvider, filterModel, timeRange]);

  const handleExport = async () => {
    const response = await fetch('/api/monitor?action=export');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) return;

    await fetch('/api/monitor', { method: 'DELETE' });
    fetchData();
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:p-8 md:pt-20">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">API Monitor</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Real-time tracking of all API calls, token usage, and costs
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
              className="flex-1 md:flex-none"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
              <span className="sm:hidden">{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
            </Button>
            <Button variant="outline" onClick={handleExport} size="sm" className="flex-1 md:flex-none">
              <Download className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Export</span>
            </Button>
            <Button variant="destructive" onClick={handleClear} size="sm" className="flex-1 md:flex-none">
              <Trash2 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Clear</span>
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['1h', '24h', '7d', 'all'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
              size="sm"
              className="whitespace-nowrap"
            >
              {range === '1h' ? 'Last Hour' : range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'All Time'}
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalCalls)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.successfulCalls} successful, {stats.failedCalls} failed
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${stats.successRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalTokens)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all models and providers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCost(stats.totalCost)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total spend on API calls
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(stats.avgResponseTime)}ms</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average across all calls
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Breakdown by Provider */}
        {stats && Object.keys(stats.byProvider).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>By Provider</CardTitle>
              <CardDescription>API usage breakdown by provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byProvider).map(([provider, data]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{provider}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.calls} calls
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatNumber(data.tokens)} tokens</span>
                        <span>{formatCost(data.cost)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Breakdown by Model */}
        {stats && Object.keys(stats.byModel).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>By Model</CardTitle>
              <CardDescription>API usage breakdown by model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byModel)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{model}</span>
                          <span className="text-sm text-muted-foreground">
                            {data.calls} calls
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatNumber(data.tokens)} tokens</span>
                          <span className="font-semibold text-primary">{formatCost(data.cost)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent API Calls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recent API Calls</CardTitle>
                <CardDescription>Last 100 API requests</CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  type="text"
                  placeholder="Filter endpoint..."
                  value={filterEndpoint}
                  onChange={(e) => setFilterEndpoint(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-md bg-background w-full md:w-auto"
                />
                <input
                  type="text"
                  placeholder="Filter provider..."
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-md bg-background w-full md:w-auto"
                />
                <input
                  type="text"
                  placeholder="Filter model..."
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-md bg-background w-full md:w-auto"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 md:mx-0">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-2 pl-6 md:pl-0">Time</th>
                    <th className="pb-2">Endpoint</th>
                    <th className="pb-2 hidden md:table-cell">Provider</th>
                    <th className="pb-2 hidden md:table-cell">Model</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 hidden sm:table-cell">Time (ms)</th>
                    <th className="pb-2 hidden lg:table-cell">Tokens</th>
                    <th className="pb-2 pr-6 md:pr-0">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 text-xs md:text-sm pl-6 md:pl-0 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none">{log.endpoint}</td>
                      <td className="py-3 text-xs md:text-sm capitalize hidden md:table-cell">{log.provider || '-'}</td>
                      <td className="py-3 text-xs font-mono hidden md:table-cell truncate max-w-[120px]">{log.model || '-'}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            log.success
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {log.responseStatus}
                        </span>
                      </td>
                      <td className="py-3 text-xs md:text-sm hidden sm:table-cell whitespace-nowrap">{log.responseTime}ms</td>
                      <td className="py-3 text-xs md:text-sm hidden lg:table-cell">
                        {log.totalTokens ? formatNumber(log.totalTokens) : '-'}
                      </td>
                      <td className="py-3 text-xs md:text-sm font-semibold pr-6 md:pr-0 whitespace-nowrap">
                        {log.estimatedCost ? formatCost(log.estimatedCost) : '-'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                        No API calls recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
}
