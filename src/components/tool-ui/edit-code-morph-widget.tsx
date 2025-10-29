'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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

export function EditCodeMorphWidget({ data }: EditCodeMorphWidgetProps) {
  console.log('🌀 EditCodeMorphWidget rendered with data:', data);

  const { getContent, updateContent } = useEditorContent();
  const { recordUsage } = useUsageTracking();

  const [state, setState] = useState<WidgetState>('idle');
  const [originalCode, setOriginalCode] = useState<string>('');
  const [mergedCode, setMergedCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  // Load current code on mount
  useEffect(() => {
    const allContent = getContent();
    const currentCode = allContent[data.file] || '';
    setOriginalCode(currentCode);

    console.log(`📄 Loaded ${data.file} content:`, {
      length: currentCode.length,
      lazyEditLength: data.lazyEdit.length,
      efficiency: `${Math.round((data.lazyEdit.length / (currentCode.length || 1)) * 100)}%`,
    });
  }, [data.file, getContent]);

  const handleApplyChanges = async () => {
    try {
      setState('loading');
      setErrorMessage('');

      console.log(`🚀 Calling Morph API for ${data.file}...`);

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

      console.log('✅ Morph merge successful:', {
        originalLength: result.stats.originalLength,
        mergedLength: result.stats.mergedLength,
        tokensUsed: result.usage.totalTokens,
        cost: `$${result.usage.cost.toFixed(6)}`,
        durationMs: result.stats.durationMs,
      });

      // Update editor with merged code
      setMergedCode(result.mergedCode);
      updateContent(data.file, result.mergedCode);

      // Record usage for tracking
      recordUsage('morph/v3-fast', {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      });

      // Save stats for display
      setStats(result.stats);
      setUsage(result.usage);

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
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Zap className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'loading':
        return 'border-blue-500';
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      default:
        return 'border-purple-500';
    }
  };

  return (
    <Card className={`morph-widget border-2 ${getStateColor()} shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getStateIcon()}
          <span>🌀 Morph Fast Apply</span>
          <span className="ml-auto px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:bg-purple-300 text-xs font-mono rounded">
            {data.file.toUpperCase()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instruction */}
        <div className="text-sm">
          <div className="font-semibold text-muted-foreground mb-1">Instruction:</div>
          <div className="p-2 bg-muted rounded text-sm">{data.instruction}</div>
        </div>

        {/* Lazy Edit Preview */}
        <div className="text-sm">
          <div className="font-semibold text-muted-foreground mb-1">
            Changes ({data.lazyEdit.length} chars):
          </div>
          <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto border">
            {data.lazyEdit}
          </pre>
        </div>

        {/* Stats (After Success) */}
        {state === 'success' && stats && usage && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <div className="text-sm space-y-1">
              <div className="font-semibold text-green-700 dark:text-green-300 mb-2">
                ✅ Merge Successful!
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Original:</span>{' '}
                  <span className="font-mono">{stats.originalLength} chars</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Merged:</span>{' '}
                  <span className="font-mono">{stats.mergedLength} chars</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tokens:</span>{' '}
                  <span className="font-mono">{usage.totalTokens}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{' '}
                  <span className="font-mono">${usage.cost.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <span className="font-mono">{stats.durationMs}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Efficiency:</span>{' '}
                  <span className="font-mono">{stats.efficiency}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {state === 'error' && errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <div className="font-semibold mb-1">Merge Failed</div>
                <div className="text-xs">{errorMessage}</div>
                <div className="text-xs mt-2 text-muted-foreground">
                  Try again or use direct file replacement instead.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {state === 'idle' && (
          <Button
            onClick={handleApplyChanges}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            {originalCode ? 'Apply Changes' : 'Write New Code'}
          </Button>
        )}

        {state === 'loading' && (
          <Button disabled className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Merging with Morph...
          </Button>
        )}

        {state === 'success' && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setState('idle');
                setMergedCode('');
                setStats(null);
                setUsage(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Reset
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Applied
            </Button>
          </div>
        )}

        {state === 'error' && (
          <Button
            onClick={handleApplyChanges}
            variant="destructive"
            className="w-full"
          >
            Retry
          </Button>
        )}

        {/* Info Box */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          <div className="flex items-start gap-1">
            <Zap className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Morph Fast Apply:</strong> 10,500 tok/sec, 98% accuracy. Changes merge
              into your code in ~100ms. Tracked in usage stats.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
