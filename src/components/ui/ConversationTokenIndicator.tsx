'use client';

import { useState, useEffect } from 'react';
import { Brain, AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export interface ConversationTokenData {
  totalTokens: number;
  limit: number;
  percentUsed: number;
  level: 'safe' | 'warning' | 'critical' | 'exceeded';
  message: string;
  action: string;
  model: string;
  messageCount?: number;
  strategy?: 'full' | 'sliding-window' | 'summarized';
}

interface ConversationTokenIndicatorProps {
  data: ConversationTokenData | null;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Persistent conversation-level token indicator (like Claude Code)
 * Shows total conversation progress with percentage and auto-summarization status
 * Positioned in corner of chat interface for constant visibility
 */
export function ConversationTokenIndicator({
  data,
  className = '',
  position = 'top-right',
}: ConversationTokenIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Debug: Log data to console
  useEffect(() => {
    console.log('🔍 ConversationTokenIndicator received data:', data);
  }, [data]);

  // Pulse animation when crossing thresholds
  useEffect(() => {
    if (data && (data.level === 'warning' || data.level === 'critical')) {
      setShouldPulse(true);
      setTimeout(() => setShouldPulse(false), 2000);
    }
  }, [data?.level]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Show placeholder when no data (for visibility during development)
  if (!data) {
    console.log('⚠️ ConversationTokenIndicator: No data, showing placeholder');
    return (
      <div
        className={`absolute ${getPositionClasses()} z-50 ${className}`}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-muted bg-muted/30 backdrop-blur-sm shadow-lg opacity-50">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            0%
          </span>
        </div>
      </div>
    );
  }

  const getColorClasses = () => {
    switch (data.level) {
      case 'safe':
        return {
          bg: 'bg-green-500/10 hover:bg-green-500/20',
          border: 'border-green-500/30',
          text: 'text-green-600 dark:text-green-400',
          progress: 'bg-green-500',
          icon: CheckCircle,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10 hover:bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-600 dark:text-yellow-400',
          progress: 'bg-yellow-500',
          icon: AlertTriangle,
        };
      case 'critical':
        return {
          bg: 'bg-orange-500/10 hover:bg-orange-500/20',
          border: 'border-orange-500/30',
          text: 'text-orange-600 dark:text-orange-400',
          progress: 'bg-orange-500',
          icon: AlertCircle,
        };
      case 'exceeded':
        return {
          bg: 'bg-red-500/10 hover:bg-red-500/20',
          border: 'border-red-500/30',
          text: 'text-red-600 dark:text-red-400',
          progress: 'bg-red-500',
          icon: AlertCircle,
        };
    }
  };

  const colors = getColorClasses();
  const Icon = colors.icon;
  const percentClamped = Math.min(Math.max(data.percentUsed, 0), 100);

  const getStrategyBadge = () => {
    if (!data.strategy) return null;

    switch (data.strategy) {
      case 'full':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Full History
          </span>
        );
      case 'sliding-window':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            Sliding Window
          </span>
        );
      case 'summarized':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            Auto-Summarized
          </span>
        );
    }
  };

  return (
    <div
      className={`absolute ${getPositionClasses()} z-50 transition-all duration-300 ${
        shouldPulse ? 'animate-pulse' : ''
      } ${className}`}
    >
      {/* Compact View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full border ${colors.border} ${colors.bg} backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105`}
        >
          <Brain className={`h-4 w-4 ${colors.text}`} />
          <span className={`text-sm font-semibold ${colors.text} tabular-nums`}>
            {percentClamped.toFixed(0)}%
          </span>
          <ChevronDown className={`h-3.5 w-3.5 ${colors.text} opacity-50`} />
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div
          className={`flex flex-col gap-3 p-4 rounded-lg border ${colors.border} ${colors.bg} backdrop-blur-sm shadow-xl min-w-[280px]`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className={`h-4 w-4 ${colors.text}`} />
              <span className={`text-xs font-semibold ${colors.text}`}>
                Conversation Window
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
            >
              <ChevronUp className={`h-3.5 w-3.5 ${colors.text} opacity-50`} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Token Usage</span>
              <span className={`font-semibold tabular-nums ${colors.text}`}>
                {percentClamped.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.progress} transition-all duration-500 rounded-full`}
                style={{ width: `${percentClamped}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Used</span>
              <span className="font-mono font-medium">
                {data.totalTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Limit</span>
              <span className="font-mono font-medium">
                {data.limit.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-mono font-medium">
                {(data.limit - data.totalTokens).toLocaleString()}
              </span>
            </div>
            {data.messageCount && (
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-mono font-medium">{data.messageCount}</span>
              </div>
            )}
          </div>

          {/* Strategy Badge */}
          {data.strategy && (
            <div className="flex items-center justify-center pt-2 border-t border-border/50">
              {getStrategyBadge()}
            </div>
          )}

          {/* Status Message */}
          <div
            className={`flex items-start gap-2 p-2 rounded-md ${colors.bg} border ${colors.border}`}
          >
            <Icon className={`h-4 w-4 ${colors.text} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 space-y-0.5">
              <p className={`text-xs font-medium ${colors.text}`}>{data.message}</p>
              <p className="text-[11px] text-muted-foreground">{data.action}</p>
            </div>
          </div>

          {/* Model Info */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground text-center font-mono">
              {data.model}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge version for inline display
 */
export function ConversationTokenBadge({ data }: { data: ConversationTokenData | null }) {
  if (!data) return null;

  const getColorClasses = () => {
    switch (data.level) {
      case 'safe':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'critical':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'exceeded':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
  };

  const percentClamped = Math.min(Math.max(data.percentUsed, 0), 100);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${getColorClasses()}`}
    >
      <Brain className="h-3 w-3" />
      <span className="tabular-nums">{percentClamped.toFixed(0)}%</span>
    </div>
  );
}
