'use client';

import { useState, useEffect } from 'react';
import { SettingsIcon, GlobeIcon, BrainIcon, XIcon, DollarIcon, WrenchIcon } from '@/components/ui/icons';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  webSearchEnabled: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high';
  onReasoningEffortChange: (effort: 'minimal' | 'low' | 'medium' | 'high') => void;
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

export function SettingsModal({
  show,
  onClose,
  webSearchEnabled,
  onWebSearchChange,
  reasoningEffort,
  onReasoningEffortChange,
}: SettingsModalProps) {
  const [stats, setStats] = useState<SessionStats>({
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    calls: [],
    startTime: Date.now(),
  });

  // Load token stats
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
  }, [show]);

  const resetStats = () => {
    if (confirm('Reset cost tracker for this session?')) {
      const newStats = {
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        calls: [],
        startTime: Date.now(),
      };
      setStats(newStats);
      localStorage.setItem('tokenTrackerSession', JSON.stringify(newStats));
    }
  };

  if (!show) return null;

  return (
    <div
      onClick={onClose}
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
          background: 'var(--card)',
          color: 'var(--card-foreground)',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '24px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SettingsIcon size={24} style={{ color: 'var(--primary)' }} />
            Settings & Usage Stats
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Settings Section */}
        <div style={{
          marginBottom: '32px',
          padding: '20px',
          background: 'var(--muted)',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--foreground)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WrenchIcon size={16} style={{ color: 'var(--primary)' }} />
            Model Settings
          </h3>

          {/* Web Search Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              <input
                type="checkbox"
                checked={webSearchEnabled}
                onChange={(e) => onWebSearchChange(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                }}
              />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GlobeIcon size={16} style={{ color: 'var(--primary)' }} />
                  Enable Web Search
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginLeft: '24px' }}>
                  Allow AI to search the web for real-time information with citations
                </div>
              </div>
            </label>
          </div>

          {/* Reasoning Effort Selector */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              <BrainIcon size={16} style={{ color: 'var(--primary)' }} />
              Reasoning Effort (GPT-5 models)
            </label>
            <select
              value={reasoningEffort}
              onChange={(e) => onReasoningEffortChange(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                cursor: 'pointer',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            >
              <option value="minimal">Minimal - Fastest, least thinking</option>
              <option value="low">Low - Quick reasoning</option>
              <option value="medium">Medium - Balanced (default)</option>
              <option value="high">High - Maximum reasoning depth</option>
            </select>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Higher reasoning uses more tokens but produces more thoughtful responses
            </div>
          </div>
        </div>

        {/* Token Usage Stats */}
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--foreground)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarIcon size={16} style={{ color: 'var(--primary)' }} />
            Token Usage Stats
          </h3>

          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'var(--muted)',
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Total Cost</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                ${stats.totalCost.toFixed(4)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Input Tokens</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                {stats.totalInputTokens.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Output Tokens</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                {stats.totalOutputTokens.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--muted-foreground)' }}>Recent API Calls</h4>
            <button
              onClick={resetStats}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset Stats
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--foreground)' }}>Time</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--foreground)' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--foreground)' }}>Model</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border)', color: 'var(--foreground)' }}>Input</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border)', color: 'var(--foreground)' }}>Output</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border)', color: 'var(--foreground)' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.calls.slice(-20).reverse().map((call, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>{call.type}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--foreground)' }}>
                      {MODEL_PRICING[call.model]?.name || call.model}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--foreground)' }}>
                      {call.inputTokens.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--foreground)' }}>
                      {call.outputTokens.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 600, color: 'var(--foreground)' }}>
                      ${call.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            Showing last 20 calls • Session started {new Date(stats.startTime).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
