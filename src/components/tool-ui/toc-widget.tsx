'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, BookMarked, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentContent } from '@/hooks/useDocumentContent';

interface TOCWidgetProps {
  data: {
    numbered?: boolean;
    maxLevel?: number;
    style?: 'markdown' | 'html' | 'plain';
    status?: string;
  };
}

interface Heading {
  level: number;
  text: string;
  line: number;
}

export function TOCWidget({ data }: TOCWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const { content } = useDocumentContent();
  const [toc, setToc] = useState('');

  useEffect(() => {
    const document = content;
    const lines = document.split('\n');
    const headings: Heading[] = [];

    lines.forEach((line, lineIndex) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        if (level <= (data.maxLevel || 3)) {
          headings.push({
            level,
            text: match[2].trim(),
            line: lineIndex + 1,
          });
        }
      }
    });

    // Generate TOC
    let generated = '';
    const numbering: number[] = [0, 0, 0, 0, 0, 0];

    if (data.style === 'markdown') {
      generated = '## Table of Contents\n\n';
      headings.forEach(heading => {
        const indent = '  '.repeat(heading.level - 1);
        const anchor = heading.text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        if (data.numbered) {
          // Update numbering
          numbering[heading.level - 1]++;
          for (let i = heading.level; i < numbering.length; i++) {
            numbering[i] = 0;
          }
          const number = numbering.slice(0, heading.level).filter(n => n > 0).join('.');
          generated += `${indent}${number}. [${heading.text}](#${anchor})\n`;
        } else {
          generated += `${indent}- [${heading.text}](#${anchor})\n`;
        }
      });
    } else if (data.style === 'html') {
      generated = '<nav class="table-of-contents">\n  <h2>Table of Contents</h2>\n  <ol>\n';
      headings.forEach(heading => {
        const indent = '  '.repeat(heading.level);
        const anchor = heading.text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        generated += `${indent}<li><a href="#${anchor}">${heading.text}</a></li>\n`;
      });
      generated += '  </ol>\n</nav>';
    } else {
      // Plain text
      generated = 'TABLE OF CONTENTS\n\n';
      headings.forEach(heading => {
        const indent = '  '.repeat(heading.level - 1);
        if (data.numbered) {
          numbering[heading.level - 1]++;
          for (let i = heading.level; i < numbering.length; i++) {
            numbering[i] = 0;
          }
          const number = numbering.slice(0, heading.level).filter(n => n > 0).join('.');
          generated += `${indent}${number}. ${heading.text}\n`;
        } else {
          generated += `${indent}• ${heading.text}\n`;
        }
      });
    }

    setToc(generated);
  }, [data.numbered, data.maxLevel, data.style, getContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(toc);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500/10">
            <BookMarked className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Table of Contents</h3>
            <p className="text-xs text-muted-foreground">
              {data.style || 'markdown'} format
              {data.numbered && ' · numbered'}
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
          {toc ? (
            <>
              <div className="p-3 rounded-lg bg-muted/30 font-mono text-xs whitespace-pre-wrap overflow-x-auto mb-3 max-h-96 overflow-y-auto">
                {toc}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCopy}
                  size="sm"
                  variant="outline"
                  className="transition-all duration-200"
                >
                  {copyStatus === 'copied' ? (
                    <>
                      <CheckCircle2 className="mr-1.5 h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3 w-3" />
                      Copy TOC
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              No headings found to generate table of contents
            </div>
          )}
        </div>
      )}
    </div>
  );
}
