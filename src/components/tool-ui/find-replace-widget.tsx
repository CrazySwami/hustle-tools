'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Replace, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentContent } from '@/hooks/useDocumentContent';

interface FindReplaceWidgetProps {
  data: {
    find: string;
    replace: string;
    caseSensitive?: boolean;
    wholeWord?: boolean;
    status?: string;
  };
}

export function FindReplaceWidget({ data }: FindReplaceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const { getContent, updateContent } = useDocumentContent();
  const [replacementCount, setReplacementCount] = useState(0);
  const [preview, setPreview] = useState<string[]>([]);

  useEffect(() => {
    const document = getContent();
    let searchPattern: RegExp;

    try {
      const flags = data.caseSensitive ? 'g' : 'gi';
      const pattern = data.wholeWord
        ? `\\b${data.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
        : data.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchPattern = new RegExp(pattern, flags);
    } catch (e) {
      searchPattern = new RegExp(data.find, data.caseSensitive ? 'g' : 'gi');
    }

    const matches = document.match(searchPattern);
    const count = matches ? matches.length : 0;
    setReplacementCount(count);

    // Create preview (first 5 matches)
    const lines = document.split('\n');
    const previewItems: string[] = [];
    let foundCount = 0;

    for (const line of lines) {
      if (searchPattern.test(line) && foundCount < 5) {
        const highlighted = line.replace(
          searchPattern,
          `→ ${data.replace} ←`
        );
        previewItems.push(highlighted);
        foundCount++;
      }
      if (foundCount >= 5) break;
    }

    setPreview(previewItems);
  }, [data.find, data.replace, data.caseSensitive, data.wholeWord, getContent]);

  const handleReplace = async () => {
    setStatus('loading');

    try {
      const document = getContent();
      let searchPattern: RegExp;

      try {
        const flags = data.caseSensitive ? 'g' : 'gi';
        const pattern = data.wholeWord
          ? `\\b${data.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
          : data.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPattern = new RegExp(pattern, flags);
      } catch (e) {
        searchPattern = new RegExp(data.find, data.caseSensitive ? 'g' : 'gi');
      }

      const updated = document.replace(searchPattern, data.replace);
      updateContent(updated);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Replace failed:', error);
      setStatus('idle');
    }
  };

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-border/50 px-4 py-3 ${
        status === 'success' ? 'bg-green-500/5' : ''
      }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${
            status === 'success' ? 'bg-green-500/10' : 'bg-orange-500/10'
          }`}>
            {status === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Replace className="h-4 w-4 text-orange-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Find and Replace</h3>
            <p className="text-xs text-muted-foreground">
              {replacementCount} occurrence{replacementCount !== 1 ? 's' : ''} will be replaced
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
        >
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200 p-4">
          {/* Find/Replace Details */}
          <div className="space-y-2 mb-4 p-3 rounded-lg bg-muted/30">
            <div className="flex items-start gap-2 text-sm">
              <span className="font-medium text-muted-foreground min-w-[60px]">Find:</span>
              <span className="flex-1 font-mono">{data.find}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="font-medium text-muted-foreground min-w-[60px]">Replace:</span>
              <span className="flex-1 font-mono">{data.replace}</span>
            </div>
            {(data.caseSensitive || data.wholeWord) && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                {data.caseSensitive && <span>• Case-sensitive</span>}
                {data.wholeWord && <span>• Whole word only</span>}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Preview (first 5):</p>
              <div className="space-y-1.5">
                {preview.map((line, i) => (
                  <div key={i} className="p-2 rounded bg-muted/50 text-xs font-mono">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleReplace}
              disabled={status === 'loading' || replacementCount === 0}
              size="sm"
              className="transition-all duration-200"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Replacing...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3 w-3" />
                  Replaced!
                </>
              ) : (
                `Replace All (${replacementCount})`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
