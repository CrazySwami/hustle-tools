'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2, XCircle, ChevronDown, ChevronUp, GitCompare } from 'lucide-react';
import { useDocumentContent } from '@/hooks/useDocumentContent';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface DocumentMorphWidgetProps {
  data: {
    instruction: string;
    lazyEdit: string;
    status?: string;
    message?: string;
  };
}

type WidgetState = 'idle' | 'loading' | 'previewing' | 'success' | 'error';

// Animated loading dots component
function LoadingDots() {
  return (
    <div className="flex gap-1">
      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce"></span>
    </div>
  );
}

export function DocumentMorphWidget({ data }: DocumentMorphWidgetProps) {
  const { content, updateContent, updateContentWithAnimation } = useDocumentContent();
  const { recordUsage } = useUsageTracking();
  const { theme } = useTheme();

  const [state, setState] = useState<WidgetState>('idle');
  const [isExpanded, setIsExpanded] = useState(true);
  const [originalDoc, setOriginalDoc] = useState<string>('');
  const [mergedDoc, setMergedDoc] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  // Load current document and auto-trigger preview on mount
  useEffect(() => {
    // Set original doc on first load
    if (!originalDoc && content) {
      console.log('📄 [Morph Widget] Setting original doc:', { length: content.length });
      setOriginalDoc(content);
    }

    // Auto-trigger preview when we have content and haven't triggered yet
    if (content && state === 'idle' && !hasAutoTriggered && originalDoc) {
      console.log('🚀 [Morph Widget] Auto-triggering preview...');
      setHasAutoTriggered(true);
      // Small delay to ensure state is properly set
      setTimeout(() => {
        handlePreviewChanges();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, originalDoc, state, hasAutoTriggered])

  // Auto-collapse after successful application
  useEffect(() => {
    if (state === 'success') {
      setTimeout(() => setIsExpanded(false), 1500);
    }
  }, [state]);

  const handlePreviewChanges = async () => {
    try {
      console.log('🔀 [Morph Widget] Starting preview...', {
        instruction: data.instruction?.substring(0, 50),
        originalLength: originalDoc.length,
        lazyEditLength: data.lazyEdit?.length,
      });

      setState('loading');
      setErrorMessage('');

      const response = await fetch('/api/morph-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: data.instruction,
          originalCode: originalDoc,
          lazyEdit: data.lazyEdit,
          fileType: 'document',
        }),
      });

      console.log('📡 [Morph Widget] API response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      const result = await response.json();
      console.log('📊 [Morph Widget] API result:', {
        success: result.success,
        hasMergedCode: !!result.mergedCode,
        errorMessage: result.error
      });

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Morph API failed: ${response.statusText}`);
      }

      // Store merged content and stats for preview
      setMergedDoc(result.mergedCode);
      setStats(result.stats);
      setState('previewing');
      console.log('✅ [Morph Widget] Preview ready');
    } catch (error: any) {
      console.error('❌ [Morph Widget] Morph merge failed:', error);
      setErrorMessage(error.message || 'Unknown error occurred');
      setState('error');
    }
  };

  const handleAcceptChanges = async () => {
    // Update document with merged content with streaming animation
    await updateContentWithAnimation(mergedDoc, originalDoc);

    // Record usage for tracking
    if (stats?.usage) {
      recordUsage('morph/v3-fast', {
        inputTokens: stats.usage.inputTokens,
        outputTokens: stats.usage.outputTokens,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      });
    }

    // Dispatch custom event for auto-close chat on mobile
    window.dispatchEvent(new CustomEvent('doc-edit-accepted'));

    setState('success');
  };

  const handleDeclineChanges = () => {
    // Reset to idle state
    setMergedDoc('');
    setState('idle');
  };

  const getStateIcon = () => {
    switch (state) {
      case 'loading':
        return <LoadingDots />;
      case 'previewing':
        return <GitCompare className="h-4 w-4 text-purple-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Zap className="h-4 w-4 text-purple-500" />;
    }
  };

  const getBorderColor = () => {
    switch (state) {
      case 'loading':
        return 'border-blue-500/20';
      case 'previewing':
        return 'border-purple-500/20';
      case 'success':
        return 'border-green-500/20';
      case 'error':
        return 'border-red-500/20';
      default:
        return 'border-purple-500/20';
    }
  };

  const getTruncatedInstruction = (instruction: string, maxWords: number = 5) => {
    const words = instruction.split(' ');
    if (words.length <= maxWords) return instruction;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  return (
    <div className={`my-3 rounded-lg border ${getBorderColor()} transition-all duration-200`}>
      {/* Collapsed 1-line view */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            {getStateIcon()}
            <span className="text-sm font-medium">AI Document Edit</span>
          </div>
          <span className="text-xs text-muted-foreground flex-1 text-left truncate">
            {getTruncatedInstruction(data.instruction)}
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
              <span className="text-sm font-semibold">AI Document Edit</span>
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
          <div className="text-sm px-3 py-2">
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

          {/* Diff Preview (when previewing) */}
          {state === 'previewing' && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <GitCompare className="h-3 w-3" />
                <span>Review changes before applying</span>
                {stats && (
                  <span className="ml-auto">
                    Generated in {stats.durationMs}ms
                  </span>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <DiffEditor
                  original={originalDoc}
                  modified={mergedDoc}
                  language="markdown"
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    renderSideBySide: true,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {state === 'idle' && (
              <Button
                onClick={handlePreviewChanges}
                className="flex-1 bg-purple-600 hover:bg-purple-700 h-9"
              >
                <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                Preview Changes
              </Button>
            )}

            {state === 'loading' && (
              <Button disabled className="flex-1 h-9">
                <LoadingDots />
                <span className="ml-2">Loading...</span>
              </Button>
            )}

            {state === 'previewing' && (
              <>
                <Button
                  onClick={handleAcceptChanges}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-9"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Accept
                </Button>
                <Button
                  onClick={handleDeclineChanges}
                  variant="outline"
                  className="flex-1 h-9"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Decline
                </Button>
              </>
            )}

            {state === 'success' && (
              <Button disabled className="flex-1 bg-green-600 h-9">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Applied
              </Button>
            )}

            {state === 'error' && (
              <Button
                onClick={handlePreviewChanges}
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
