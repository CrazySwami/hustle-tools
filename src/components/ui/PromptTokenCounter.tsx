'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Ban } from 'lucide-react';
import { estimateTokenCount } from '@/lib/token-validator';

export interface PromptTokenCounterProps {
  /** Current prompt text to count */
  prompt: string;
  /** System prompt (if any) */
  systemPrompt?: string;
  /** Current model's context limit */
  contextLimit: number;
  /** Reserved tokens for output (default: 4000) */
  reserveForOutput?: number;
  /** Conversation history token count (optional) */
  conversationTokens?: number;
  /** Callback when send should be disabled */
  onSendDisabled?: (disabled: boolean) => void;
  /** Show detailed breakdown */
  showDetails?: boolean;
  className?: string;
}

/**
 * Real-time prompt token counter (shows BEFORE sending)
 * Positioned near input field to show immediate feedback
 * Similar to character counters in Twitter/social media
 */
export function PromptTokenCounter({
  prompt,
  systemPrompt = '',
  contextLimit,
  reserveForOutput = 4000,
  conversationTokens = 0,
  onSendDisabled,
  showDetails = false,
  className = '',
}: PromptTokenCounterProps) {
  const [promptTokens, setPromptTokens] = useState(0);
  const [systemTokens, setSystemTokens] = useState(0);

  // Count tokens whenever prompt changes (debounced for performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPromptTokens(estimateTokenCount(prompt));
    }, 100);

    return () => clearTimeout(timer);
  }, [prompt]);

  // Count system prompt tokens (once on mount or when it changes)
  useEffect(() => {
    if (systemPrompt) {
      setSystemTokens(estimateTokenCount(systemPrompt));
    }
  }, [systemPrompt]);

  // Calculate totals
  const totalInputTokens = systemTokens + conversationTokens + promptTokens;
  const effectiveLimit = contextLimit - reserveForOutput;
  const percentUsed = (totalInputTokens / effectiveLimit) * 100;
  const percentClamped = Math.min(Math.max(percentUsed, 0), 100);
  const remaining = effectiveLimit - totalInputTokens;
  const isOverLimit = remaining < 0;
  const isNearLimit = percentUsed > 90 && !isOverLimit;

  // Notify parent about send disabled state
  useEffect(() => {
    onSendDisabled?.(isOverLimit);
  }, [isOverLimit, onSendDisabled]);

  // Debug: Log when rendered
  useEffect(() => {
    if (prompt.trim()) {
      console.log('🔍 PromptTokenCounter: Showing counter', {
        promptTokens,
        percentUsed,
        isOverLimit,
        isNearLimit,
      });
    }
  }, [prompt, promptTokens, percentUsed, isOverLimit, isNearLimit]);

  // Don't show if prompt is empty
  if (!prompt.trim()) {
    return null;
  }

  const getColorClasses = () => {
    if (isOverLimit) {
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-600 dark:text-red-400',
        progress: 'bg-red-500',
      };
    }
    if (isNearLimit) {
      return {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-600 dark:text-orange-400',
        progress: 'bg-orange-500',
      };
    }
    if (percentUsed > 70) {
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-600 dark:text-yellow-400',
        progress: 'bg-yellow-500',
      };
    }
    return {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      progress: 'bg-blue-500',
    };
  };

  const colors = getColorClasses();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon + Token Count */}
      <div className="flex items-center gap-2">
        {isOverLimit ? (
          <Ban className={`h-4 w-4 ${colors.text}`} />
        ) : isNearLimit ? (
          <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
        ) : (
          <MessageSquare className={`h-4 w-4 ${colors.text}`} />
        )}
        <span className={`text-xs font-medium tabular-nums ${colors.text}`}>
          {promptTokens.toLocaleString()} tokens
        </span>
      </div>

      {/* Progress Bar (when showing details or near limit) */}
      {(showDetails || isNearLimit || isOverLimit) && (
        <div className="flex-1 max-w-[200px]">
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.progress} transition-all duration-300 rounded-full`}
              style={{ width: `${percentClamped}%` }}
            />
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className={`flex items-center gap-2 px-2 py-1 rounded border ${colors.border} ${colors.bg}`}>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex flex-col">
              <span className="text-muted-foreground">This prompt</span>
              <span className={`font-mono font-medium ${colors.text}`}>
                {promptTokens.toLocaleString()}
              </span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Total input</span>
              <span className={`font-mono font-medium ${colors.text}`}>
                {totalInputTokens.toLocaleString()}
              </span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-mono font-medium ${colors.text}`}>
                {Math.max(0, remaining).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warning Message */}
      {isOverLimit && (
        <span className={`text-xs font-medium ${colors.text} animate-pulse`}>
          Prompt too large!
        </span>
      )}
      {isNearLimit && !isOverLimit && (
        <span className={`text-xs ${colors.text}`}>
          Near limit
        </span>
      )}
    </div>
  );
}

/**
 * Compact badge version for minimal display
 */
export function PromptTokenBadge({
  promptTokens,
  className = '',
}: {
  promptTokens: number;
  className?: string;
}) {
  if (promptTokens === 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 ${className}`}
    >
      <MessageSquare className="h-3 w-3" />
      <span className="text-xs font-medium tabular-nums">
        {promptTokens.toLocaleString()}
      </span>
    </div>
  );
}
