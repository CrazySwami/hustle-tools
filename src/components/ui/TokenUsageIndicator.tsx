'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TokenUsageData {
  tokenCount: number;
  limit: number;
  percentUsed: number;
  level: 'safe' | 'warning' | 'critical' | 'exceeded';
  message: string;
  action: string;
  model: string;
}

interface TokenUsageIndicatorProps {
  usage: TokenUsageData | null;
  className?: string;
  showDetails?: boolean;
}

export function TokenUsageIndicator({
  usage,
  className,
  showDetails = false,
}: TokenUsageIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!usage) return null;

  const getColorClasses = () => {
    switch (usage.level) {
      case 'safe':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          text: 'text-green-600 dark:text-green-400',
          icon: 'text-green-500',
          bar: 'bg-green-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          text: 'text-yellow-600 dark:text-yellow-400',
          icon: 'text-yellow-500',
          bar: 'bg-yellow-500',
        };
      case 'critical':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          text: 'text-orange-600 dark:text-orange-400',
          icon: 'text-orange-500',
          bar: 'bg-orange-500',
        };
      case 'exceeded':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          text: 'text-red-600 dark:text-red-400',
          icon: 'text-red-500',
          bar: 'bg-red-500',
        };
    }
  };

  const getIcon = () => {
    const colors = getColorClasses();
    switch (usage.level) {
      case 'safe':
        return <CheckCircle2 className={cn('h-4 w-4', colors.icon)} />;
      case 'warning':
        return <AlertTriangle className={cn('h-4 w-4', colors.icon)} />;
      case 'critical':
      case 'exceeded':
        return <AlertCircle className={cn('h-4 w-4', colors.icon)} />;
    }
  };

  const colors = getColorClasses();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Compact indicator */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
          colors.bg,
          colors.border,
          'hover:shadow-md cursor-pointer'
        )}
      >
        <Activity className={cn('h-4 w-4', colors.icon)} />

        <div className="flex-1 text-left">
          <div className="flex items-center justify-between mb-1">
            <span className={cn('text-xs font-medium', colors.text)}>
              Context Window
            </span>
            <span className={cn('text-xs font-mono', colors.text)}>
              {usage.percentUsed.toFixed(1)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={cn('h-1.5 rounded-full transition-all duration-300', colors.bar)}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {getIcon()}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div
          className={cn(
            'p-4 rounded-lg border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200',
            colors.bg,
            colors.border
          )}
        >
          {/* Status message */}
          <div className="flex items-start gap-2">
            {getIcon()}
            <div className="flex-1">
              <div className={cn('text-sm font-medium', colors.text)}>
                {usage.message}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {usage.action}
              </div>
            </div>
          </div>

          {/* Token stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Used</div>
              <div className={cn('font-mono font-medium', colors.text)}>
                {usage.tokenCount.toLocaleString()}
              </div>
            </div>
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Limit</div>
              <div className="font-mono font-medium">
                {usage.limit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Model info */}
          <div className="text-xs text-muted-foreground border-t pt-2">
            Model: <span className="font-mono">{usage.model}</span>
          </div>

          {/* Recommendations */}
          {usage.level !== 'safe' && (
            <div className="text-xs p-2 bg-background/50 rounded">
              <div className="font-medium mb-1">Recommendations:</div>
              <ul className="space-y-1 text-muted-foreground">
                {usage.level === 'warning' && (
                  <>
                    <li>• Recent messages will be prioritized</li>
                    <li>• Older messages may be summarized</li>
                  </>
                )}
                {usage.level === 'critical' && (
                  <>
                    <li>• Conversation will be auto-summarized</li>
                    <li>• Consider starting a new chat</li>
                  </>
                )}
                {usage.level === 'exceeded' && (
                  <>
                    <li>• Cannot send new messages</li>
                    <li>• Start a new conversation to continue</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge version for minimal UI space
 */
export function TokenUsageBadge({ usage }: { usage: TokenUsageData | null }) {
  if (!usage) return null;

  const colors = (() => {
    switch (usage.level) {
      case 'safe':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'critical':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'exceeded':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
  })();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium',
        colors
      )}
      title={`${usage.message} - ${usage.action}`}
    >
      <Activity className="h-3 w-3" />
      <span className="font-mono">{usage.percentUsed.toFixed(1)}%</span>
    </div>
  );
}
