'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import { useDocumentContent } from '@/hooks/useDocumentContent';

interface FindStringWidgetProps {
  data: {
    searchTerm: string;
    caseSensitive?: boolean;
    wholeWord?: boolean;
    status?: string;
  };
}

interface Occurrence {
  line: number;
  position: number;
  context: string;
}

export function FindStringWidget({ data }: FindStringWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { content } = useDocumentContent();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const document = content;
    const lines = document.split('\n');
    const found: Occurrence[] = [];

    let searchPattern: RegExp;
    try {
      const flags = data.caseSensitive ? 'g' : 'gi';
      const pattern = data.wholeWord
        ? `\\b${data.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
        : data.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchPattern = new RegExp(pattern, flags);
    } catch (e) {
      searchPattern = new RegExp(data.searchTerm, data.caseSensitive ? 'g' : 'gi');
    }

    lines.forEach((line, lineIndex) => {
      const matches = line.matchAll(searchPattern);
      for (const match of matches) {
        const position = match.index || 0;
        const start = Math.max(0, position - 30);
        const end = Math.min(line.length, position + data.searchTerm.length + 30);
        const context = (start > 0 ? '...' : '') + line.substring(start, end) + (end < line.length ? '...' : '');

        found.push({
          line: lineIndex + 1,
          position: position + 1,
          context,
        });
      }
    });

    setOccurrences(found);
    setCount(found.length);
  }, [data.searchTerm, data.caseSensitive, data.wholeWord, content]);

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-border/50 px-4 py-3 ${
        count > 0 ? 'bg-green-500/5' : 'bg-muted/5'
      }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${
            count > 0 ? 'bg-green-500/10' : 'bg-muted/10'
          }`}>
            <Search className={`h-4 w-4 ${count > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Find: "{data.searchTerm}"</h3>
            <p className="text-xs text-muted-foreground">
              {count} occurrence{count !== 1 ? 's' : ''} found
              {data.caseSensitive && ' · Case-sensitive'}
              {data.wholeWord && ' · Whole word'}
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
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          {count === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No occurrences found
            </div>
          ) : (
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {occurrences.map((occ, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        Line {occ.line}, Col {occ.position}
                      </span>
                    </div>
                    <p className="text-sm font-mono break-words whitespace-pre-wrap">
                      {occ.context}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
