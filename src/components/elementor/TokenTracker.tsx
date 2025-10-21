'use client';

import { useState, useEffect } from 'react';
import { DollarIcon, SettingsIcon, XIcon } from '@/components/ui/icons';

interface TokenTrackerProps {
  onTrackUsage?: (data: UsageData) => void;
  compact?: boolean;
  onOpenDetails?: () => void;
}

interface UsageData {
  model: string;
  inputTokens: number;
  outputTokens: number;
  type: string;
}

interface SessionStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  calls: CallData[];
  startTime: number;
}

interface CallData {
  timestamp: number;
  model: string;
  type: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

const MODEL_PRICING: Record<string, { name: string; input: number; output: number }> = {
  'gpt-5': { name: 'GPT-5', input: 1.25, output: 10.00 },
  'gpt-5-mini': { name: 'GPT-5 Mini', input: 0.25, output: 2.00 },
  'gpt-5-nano': { name: 'GPT-5 Nano', input: 0.05, output: 0.40 },
  'gpt-5-pro': { name: 'GPT-5 Pro', input: 2.50, output: 20.00 },
};

export function TokenTracker({ onTrackUsage, compact = false, onOpenDetails }: TokenTrackerProps) {
  const [stats, setStats] = useState<SessionStats>({
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    calls: [],
    startTime: Date.now(),
  });
  const [showDetails, setShowDetails] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tokenTrackerSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.startTime < 24 * 60 * 60 * 1000) {
          setStats(parsed);
        }
      } catch (e) {
        console.warn('Failed to load session stats:', e);
      }
    }
  }, []);

  // Save to localStorage whenever stats change
  useEffect(() => {
    localStorage.setItem('tokenTrackerSession', JSON.stringify(stats));
  }, [stats]);

  // Expose tracking function to window
  useEffect(() => {
    (window as any).trackTokenUsage = (data: UsageData) => {
      const { model, inputTokens, outputTokens, type } = data;
      const modelKey = model.replace('openai/', '');
      const pricing = MODEL_PRICING[modelKey] || MODEL_PRICING['gpt-5'];
      const cost = (inputTokens / 1000000) * pricing.input + (outputTokens / 1000000) * pricing.output;

      setStats(prev => ({
        ...prev,
        totalCalls: prev.totalCalls + 1,
        totalInputTokens: prev.totalInputTokens + inputTokens,
        totalOutputTokens: prev.totalOutputTokens + outputTokens,
        totalCost: prev.totalCost + cost,
        calls: [...prev.calls, {
          timestamp: Date.now(),
          model: modelKey,
          type,
          inputTokens,
          outputTokens,
          cost,
        }].slice(-100), // Keep last 100
      }));

      console.log('💰 Token usage:', { type, inputTokens, outputTokens, cost: '$' + cost.toFixed(4) });
    };
  }, []);

  const reset = () => {
    if (confirm('Reset cost tracker for this session?')) {
      setStats({
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        calls: [],
        startTime: Date.now(),
      });
    }
  };

  const avgTokens = stats.totalCalls > 0
    ? Math.round((stats.totalInputTokens + stats.totalOutputTokens) / stats.totalCalls)
    : 0;

  const sessionMinutes = Math.round((Date.now() - stats.startTime) / 1000 / 60);

  // Compact mode - just show cost and gear icon
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: 'var(--foreground)',
        borderRadius: '6px',
        color: 'var(--background)',
        fontSize: '11px',
        fontWeight: 600,
      }}>
        <span>${stats.totalCost.toFixed(4)}</span>
        <button
          onClick={onOpenDetails}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'currentColor',
            padding: '3px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Settings & Details"
        >
          <SettingsIcon size={12} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DollarIcon size={14} />
          Session Cost
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
          ${stats.totalCost.toFixed(4)}
        </div>
        <div style={{ fontSize: '11px', opacity: 0.8, lineHeight: 1.4, marginBottom: '12px' }}>
          {stats.totalCalls} API calls • {sessionMinutes}m<br />
          {stats.totalInputTokens.toLocaleString()} in / {stats.totalOutputTokens.toLocaleString()} out<br />
          Avg: {avgTokens.toLocaleString()} tokens/call
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setShowDetails(true)}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Details
          </button>
        </div>
      </div>

      {showDetails && (
        <div
          onClick={() => setShowDetails(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#111827' }}>📊 Detailed Usage Stats</h2>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Cost</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                  ${stats.totalCost.toFixed(4)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Input Tokens</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                  {stats.totalInputTokens.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Output Tokens</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                  {stats.totalOutputTokens.toLocaleString()}
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Time</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Model</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Input</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Output</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.calls.slice(-20).reverse().map((call, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{call.type}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
                      {MODEL_PRICING[call.model]?.name || call.model}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                      {call.inputTokens.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                      {call.outputTokens.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600 }}>
                      ${call.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
              Showing last 20 calls • Session started {new Date(stats.startTime).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
