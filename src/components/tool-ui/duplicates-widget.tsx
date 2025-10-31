'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Copy as CopyIcon, AlertTriangle } from 'lucide-react';
import { useDocumentContent } from '@/hooks/useDocumentContent';

interface DuplicatesWidgetProps {
  data: {
    sensitivity?: 'exact' | 'high' | 'medium' | 'low';
    minLength?: number;
    status?: string;
  };
}

interface Duplicate {
  text: string;
  occurrences: Array<{ paragraph: number; sentence: number; similarity: number }>;
}

export function DuplicatesWidget({ data }: DuplicatesWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { content } = useDocumentContent();
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);

  useEffect(() => {
    const document = content;
    const paragraphs = document.split(/\n\n+/).filter(p => p.trim().length > 0);
    const found: Duplicate[] = [];
    const minWords = data.minLength || 10;

    // Get similarity threshold based on sensitivity
    const threshold = {
      exact: 100,
      high: 95,
      medium: 85,
      low: 75,
    }[data.sensitivity || 'high'];

    // Simple similarity function (Levenshtein distance approximation)
    const similarity = (s1: string, s2: string): number => {
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      if (longer.length === 0) return 100;

      const editDistance = (s1: string, s2: string): number => {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        const costs: number[] = [];
        for (let i = 0; i <= s1.length; i++) {
          let lastValue = i;
          for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
              costs[j] = j;
            } else if (j > 0) {
              let newValue = costs[j - 1];
              if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              }
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
          if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
      };

      const distance = editDistance(longer, shorter);
      return ((longer.length - distance) / longer.length) * 100;
    };

    // Find duplicates
    const sentencesByParagraph: string[][] = paragraphs.map(p =>
      p.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length >= minWords)
    );

    const checked = new Set<string>();

    sentencesByParagraph.forEach((sentences, parIndex) => {
      sentences.forEach((sentence, sentIndex) => {
        const normalized = sentence.trim().toLowerCase();
        if (checked.has(normalized)) return;

        const matches: Array<{ paragraph: number; sentence: number; similarity: number }> = [
          { paragraph: parIndex + 1, sentence: sentIndex + 1, similarity: 100 },
        ];

        // Compare with all other sentences
        sentencesByParagraph.forEach((otherSentences, otherParIndex) => {
          otherSentences.forEach((otherSentence, otherSentIndex) => {
            if (parIndex === otherParIndex && sentIndex === otherSentIndex) return;

            const sim = similarity(sentence.trim(), otherSentence.trim());
            if (sim >= threshold) {
              matches.push({
                paragraph: otherParIndex + 1,
                sentence: otherSentIndex + 1,
                similarity: Math.round(sim),
              });
            }
          });
        });

        if (matches.length > 1) {
          found.push({
            text: sentence.trim(),
            occurrences: matches,
          });
          checked.add(normalized);
        }
      });
    });

    setDuplicates(found);
  }, [data.sensitivity, data.minLength, getContent]);

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-border/50 px-4 py-3 ${
        duplicates.length > 0 ? 'bg-orange-500/5' : ''
      }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${
            duplicates.length > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'
          }`}>
            {duplicates.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            ) : (
              <CopyIcon className="h-4 w-4 text-green-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Duplicate Content Detection</h3>
            <p className="text-xs text-muted-foreground">
              {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''} found
              · {data.sensitivity || 'high'} sensitivity
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
          {duplicates.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                ✓ No duplicates detected
              </p>
              <p className="text-xs text-muted-foreground">
                Your document has no redundant content
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {duplicates.map((dup, i) => (
                <div key={i} className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-500/5">
                  <p className="text-sm font-medium mb-2 text-orange-700 dark:text-orange-300">
                    Duplicate #{i + 1}
                  </p>
                  <p className="text-sm mb-3 p-2 rounded bg-muted/50 font-mono">
                    {dup.text.substring(0, 200)}
                    {dup.text.length > 200 && '...'}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Found in {dup.occurrences.length} location{dup.occurrences.length !== 1 ? 's' : ''}:
                    </p>
                    {dup.occurrences.map((occ, j) => (
                      <div key={j} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Paragraph {occ.paragraph}, Sentence {occ.sentence}
                        </span>
                        <span className="font-mono text-orange-600 dark:text-orange-400">
                          {occ.similarity}% match
                        </span>
                      </div>
                    ))}
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
