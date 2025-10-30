'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, FileText, Clock, Type, Hash } from 'lucide-react';
import { useDocumentContent } from '@/hooks/useDocumentContent';

interface TextStatsWidgetProps {
  data: {
    includeSpaces?: boolean;
    status?: string;
  };
}

export function TextStatsWidget({ data }: TextStatsWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { getContent } = useDocumentContent();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const document = getContent();

    // Calculate stats
    const words = document.trim().split(/\s+/).filter(w => w.length > 0).length;
    const charactersWithSpaces = document.length;
    const charactersWithoutSpaces = document.replace(/\s/g, '').length;
    const sentences = document.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = document.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const lines = document.split('\n').length;

    // Calculate reading time (avg 238 words per minute)
    const readingMinutes = Math.ceil(words / 238);

    setStats({
      words,
      charactersWithSpaces,
      charactersWithoutSpaces,
      sentences,
      paragraphs,
      lines,
      readingTime: readingMinutes,
      avgSentenceLength: sentences > 0 ? Math.round(words / sentences) : 0,
      avgWordLength: words > 0 ? Math.round(charactersWithoutSpaces / words) : 0,
    });
  }, [getContent]);

  if (!stats) {
    return <div className="text-sm text-muted-foreground">Calculating statistics...</div>;
  }

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Document Statistics</h3>
            <p className="text-xs text-muted-foreground">
              {stats.words.toLocaleString()} words · {stats.readingTime} min read
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
          <div className="grid grid-cols-2 gap-4">
            {/* Words */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Type className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-2xl font-bold">{stats.words.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
            </div>

            {/* Characters */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Hash className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-2xl font-bold">
                  {data.includeSpaces
                    ? stats.charactersWithSpaces.toLocaleString()
                    : stats.charactersWithoutSpaces.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Characters {data.includeSpaces ? '(with spaces)' : '(no spaces)'}
                </p>
              </div>
            </div>

            {/* Sentences */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-2xl font-bold">{stats.sentences.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Sentences</p>
              </div>
            </div>

            {/* Reading Time */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-2xl font-bold">{stats.readingTime}</p>
                <p className="text-xs text-muted-foreground">Minutes to read</p>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paragraphs:</span>
              <span className="font-medium">{stats.paragraphs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lines:</span>
              <span className="font-medium">{stats.lines.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg sentence length:</span>
              <span className="font-medium">{stats.avgSentenceLength} words</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg word length:</span>
              <span className="font-medium">{stats.avgWordLength} characters</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
