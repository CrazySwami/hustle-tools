'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2, XCircle, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { useEditorContent } from '@/hooks/useEditorContent';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface EditCodeMorphWidgetProps {
  data: {
    file: 'html' | 'css' | 'js' | 'php';
    instruction: string;
    lazyEdit: string;
    status?: string;
    message?: string;
  };
}

type WidgetState = 'idle' | 'loading' | 'success' | 'error';

// Animated loading dots component
function LoadingDots() {
  return (
    <div className="flex gap-1">
      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce"></span>
    </div>
  );
}

export function EditCodeMorphWidget({ data }: EditCodeMorphWidgetProps) {
  const { getContent, updateContent } = useEditorContent();
  const { recordUsage } = useUsageTracking();

  const [state, setState] = useState<WidgetState>('idle');
  const [isExpanded, setIsExpanded] = useState(true);
  const [originalCode, setOriginalCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  // Load current code on mount
  useEffect(() => {
    const allContent = getContent();
    const currentCode = allContent[data.file] || '';
    setOriginalCode(currentCode);
  }, [data.file, getContent]);

  // Auto-collapse after successful application
  useEffect(() => {
    if (state === 'success') {
      setTimeout(() => setIsExpanded(false), 1500);
    }
  }, [state]);

  const handleApplyChanges = async () => {
    try {
      setState('loading');
      setErrorMessage('');

      const response = await fetch('/api/morph-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: data.instruction,
          originalCode,
          lazyEdit: data.lazyEdit,
          fileType: data.file,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Morph API failed: ${response.statusText}`);
      }

      // Update editor with merged code
      updateContent(data.file, result.mergedCode);

      // Record usage for tracking
      recordUsage('morph/v3-fast', {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      });

      setStats(result.stats);
      setState('success');
    } catch (error: any) {
      console.error('❌ Morph merge failed:', error);
      setErrorMessage(error.message || 'Unknown error occurred');
      setState('error');
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'loading':
        return <LoadingDots />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStateBg = () => {
    switch (state) {
      case 'loading':
        return 'bg-blue-500/5 border-blue-500/20';
      case 'success':
        return 'bg-green-500/5 border-green-500/20';
      case 'error':
        return 'bg-red-500/5 border-red-500/20';
      default:
        return 'bg-blue-500/5 border-blue-500/20';
    }
  };

  const getFileLabel = () => {
    const labels: Record<string, string> = {
      html: 'HTML',
      css: 'CSS',
      js: 'JavaScript',
      php: 'PHP',
    };
    return labels[data.file] || data.file.toUpperCase();
  };

  const getFileColor = () => {
    const colors: Record<string, string> = {
      html: 'text-orange-600',
      css: 'text-blue-600',
      js: 'text-yellow-600',
      php: 'text-purple-600',
    };
    return colors[data.file] || 'text-gray-600';
  };

  return (
    <div className={`my-3 rounded-lg border ${getStateBg()} transition-all duration-200`}>
      {/* Collapsed 1-line view */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            {getStateIcon()}
            <FileCode className={`h-4 w-4 ${getFileColor()}`} />
            <span className="text-sm font-medium">AI Code Edit</span>
            <span className={`text-xs font-mono ${getFileColor()}`}>
              {getFileLabel()}
            </span>
          </div>
          <span className="text-xs text-muted-foreground flex-1 text-left truncate">
            {data.instruction}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStateIcon()}
              <FileCode className={`h-4 w-4 ${getFileColor()}`} />
              <span className="text-sm font-semibold">AI Code Edit</span>
              <span className={`text-xs font-mono ${getFileColor()} bg-muted/50 px-1.5 py-0.5 rounded`}>
                {getFileLabel()}
              </span>
              {state === 'success' && stats && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✓ Applied in {stats.durationMs}ms
                </span>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-muted/50 rounded transition-colors"
            >
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Instruction */}
          <div className="text-sm bg-muted/30 rounded px-3 py-2">
            <span className="text-muted-foreground text-xs">Instruction:</span>
            <p className="mt-0.5">{data.instruction}</p>
          </div>

          {/* Error Message */}
          {state === 'error' && errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Failed to apply changes</div>
                  <div className="text-xs mt-1 opacity-80">{errorMessage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {state === 'idle' && (
              <Button
                onClick={handleApplyChanges}
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Apply Changes
              </Button>
            )}

            {state === 'loading' && (
              <Button disabled className="flex-1 h-9">
                <LoadingDots />
                <span className="ml-2">Applying...</span>
              </Button>
            )}

            {state === 'success' && (
              <Button disabled className="flex-1 bg-green-600 h-9">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Applied
              </Button>
            )}

            {state === 'error' && (
              <Button
                onClick={handleApplyChanges}
                variant="destructive"
                className="flex-1 h-9"
              >
                Retry
              </Button>
            )}
          </div>

          {/* Stats footer (only when idle) */}
          {state === 'idle' && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Fast Apply • 98% accuracy • ~100ms merge</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
