'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, List, Hash } from 'lucide-react';
import { useDocumentContent } from '@/hooks/useDocumentContent';

interface HeadingsWidgetProps {
  data: {
    maxLevel?: number;
    status?: string;
  };
}

interface Heading {
  level: number;
  text: string;
  line: number;
}

export function HeadingsWidget({ data }: HeadingsWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { content } = useDocumentContent();
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const document = content;
    const lines = document.split('\n');
    const found: Heading[] = [];

    lines.forEach((line, lineIndex) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        if (level <= (data.maxLevel || 6)) {
          found.push({
            level,
            text: match[2].trim(),
            line: lineIndex + 1,
          });
        }
      }
    });

    setHeadings(found);
  }, [data.maxLevel, getContent]);

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10">
            <List className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Document Outline</h3>
            <p className="text-xs text-muted-foreground">
              {headings.length} heading{headings.length !== 1 ? 's' : ''} found
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
          {headings.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No headings found in document
            </div>
          ) : (
            <div className="p-4 space-y-1.5">
              {headings.map((heading, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-2 px-3 rounded hover:bg-muted/50 transition-colors"
                  style={{ paddingLeft: `${(heading.level - 1) * 16 + 12}px` }}
                >
                  <Hash className={`h-3 w-3 flex-shrink-0 mt-0.5 ${
                    heading.level === 1 ? 'text-blue-600' :
                    heading.level === 2 ? 'text-purple-600' :
                    heading.level === 3 ? 'text-green-600' :
                    'text-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      heading.level === 1 ? 'font-bold' :
                      heading.level === 2 ? 'font-semibold' :
                      heading.level === 3 ? 'font-medium' :
                      'font-normal'
                    } truncate`}>
                      {heading.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      H{heading.level} · Line {heading.line}
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
