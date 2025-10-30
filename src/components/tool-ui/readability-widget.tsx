'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, BookOpen, TrendingUp, Award } from 'lucide-react';
import { useDocumentContent } from '@/hooks/useDocumentContent';

interface ReadabilityWidgetProps {
  data: {
    detailed?: boolean;
    status?: string;
  };
}

export function ReadabilityWidget({ data }: ReadabilityWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { getContent } = useDocumentContent();
  const [readability, setReadability] = useState<any>(null);

  useEffect(() => {
    const document = getContent();

    // Calculate readability metrics
    const words = document.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = document.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;

    // Count syllables (simple approximation)
    const countSyllables = (word: string): number => {
      word = word.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length <= 3) return 1;
      const vowels = word.match(/[aeiouy]+/g);
      let count = vowels ? vowels.length : 1;
      if (word.endsWith('e')) count--;
      return Math.max(count, 1);
    };

    const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);

    // Flesch Reading Ease: 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
    const fleschReadingEase =
      sentenceCount > 0 && wordCount > 0
        ? 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
        : 0;

    // Flesch-Kincaid Grade Level: 0.39 × (words/sentences) + 11.8 × (syllables/words) - 15.59
    const fleschKincaidGrade =
      sentenceCount > 0 && wordCount > 0
        ? 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59
        : 0;

    // Interpretation
    let interpretation = '';
    let color = '';
    if (fleschReadingEase >= 90) {
      interpretation = 'Very Easy';
      color = 'green';
    } else if (fleschReadingEase >= 80) {
      interpretation = 'Easy';
      color = 'green';
    } else if (fleschReadingEase >= 70) {
      interpretation = 'Fairly Easy';
      color = 'lime';
    } else if (fleschReadingEase >= 60) {
      interpretation = 'Standard';
      color = 'blue';
    } else if (fleschReadingEase >= 50) {
      interpretation = 'Fairly Difficult';
      color = 'orange';
    } else if (fleschReadingEase >= 30) {
      interpretation = 'Difficult';
      color = 'red';
    } else {
      interpretation = 'Very Difficult';
      color = 'red';
    }

    // Complex words (3+ syllables)
    const complexWords = words.filter(w => countSyllables(w) >= 3);

    // Long sentences (20+ words)
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length >= 20);

    setReadability({
      fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)).toFixed(1),
      fleschKincaidGrade: Math.max(0, fleschKincaidGrade).toFixed(1),
      interpretation,
      color,
      complexWords: complexWords.length,
      longSentences: longSentences.length,
      avgSyllablesPerWord: (syllableCount / wordCount).toFixed(2),
      avgWordsPerSentence: (wordCount / sentenceCount).toFixed(1),
    });
  }, [data.detailed, getContent]);

  if (!readability) {
    return <div className="text-sm text-muted-foreground">Analyzing readability...</div>;
  }

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10">
            <BookOpen className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Readability Analysis</h3>
            <p className="text-xs text-muted-foreground">
              {readability.interpretation} · Grade {readability.fleschKincaidGrade}
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
          {/* Main Scores */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <TrendingUp className={`h-5 w-5 text-${readability.color}-600 mt-0.5`} />
              <div>
                <p className="text-2xl font-bold">{readability.fleschReadingEase}</p>
                <p className="text-xs text-muted-foreground">Flesch Reading Ease</p>
                <p className="text-xs font-medium mt-1">{readability.interpretation}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Award className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-2xl font-bold">{readability.fleschKincaidGrade}</p>
                <p className="text-xs text-muted-foreground">Grade Level</p>
                <p className="text-xs font-medium mt-1">US Grade {readability.fleschKincaidGrade}</p>
              </div>
            </div>
          </div>

          {/* Interpretation Guide */}
          <div className="p-3 rounded-lg bg-muted/20 mb-4">
            <p className="text-xs font-medium mb-2">Flesch Reading Ease Scale:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">90-100:</span>
                <span>Very Easy (5th grade)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">80-89:</span>
                <span>Easy (6th grade)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">70-79:</span>
                <span>Fairly Easy (7th grade)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">60-69:</span>
                <span>Standard (8th-9th grade)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">50-59:</span>
                <span>Fairly Difficult (10th-12th grade)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">30-49:</span>
                <span>Difficult (College)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">0-29:</span>
                <span>Very Difficult (College graduate)</span>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          {data.detailed && (
            <div className="space-y-2 text-sm border-t border-border/50 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complex words (3+ syllables):</span>
                <span className="font-medium">{readability.complexWords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Long sentences (20+ words):</span>
                <span className="font-medium">{readability.longSentences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg syllables per word:</span>
                <span className="font-medium">{readability.avgSyllablesPerWord}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg words per sentence:</span>
                <span className="font-medium">{readability.avgWordsPerSentence}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
