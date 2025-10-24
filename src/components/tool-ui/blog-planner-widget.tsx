'use client';

import { useState } from 'react';
import { Download, FileText, Table, Code } from 'lucide-react';
import {
  BlogTopic,
  enrichTopics,
  exportAsMarkdown,
  exportAsCSV,
  exportAsJSON,
  downloadFile,
} from '@/lib/blog-planner-utils';

interface BlogPlannerWidgetProps {
  data: {
    month: string;
    postsPerMonth: number;
    niche: string;
    targetAudience: string;
    brandVoice: string;
    existingTopics: string[];
    status: string;
    timestamp: string;
    message: string;
  };
  model?: string;
  onPlanGenerated?: (topics: BlogTopic[]) => void;
}

export function BlogPlannerWidget({ data, model, onPlanGenerated }: BlogPlannerWidgetProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [topics, setTopics] = useState<BlogTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    month: data.month,
    postsPerMonth: data.postsPerMonth,
    niche: data.niche,
    targetAudience: data.targetAudience,
    brandVoice: data.brandVoice,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setShowForm(false); // Hide form once generation starts

    try {
      const response = await fetch('/api/generate-blog-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData, // Use form data instead of initial data
          model: model || 'anthropic/claude-sonnet-4-5-20250929',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulated = '';
      const partialTopics: Partial<BlogTopic>[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulated += chunk;

        // Try to parse accumulated JSON
        try {
          // Look for complete topic objects in the stream
          const matches = accumulated.match(/\{[^}]+\}/g);
          if (matches) {
            matches.forEach((match) => {
              try {
                const topic = JSON.parse(match);
                if (topic.title && !partialTopics.find(t => t.title === topic.title)) {
                  partialTopics.push(topic);
                }
              } catch (e) {
                // Incomplete JSON, will try again next chunk
              }
            });

            // Enrich and update UI
            if (partialTopics.length > 0) {
              const enriched = enrichTopics(
                partialTopics,
                data.month,
                '/blog',
                'Download our free guide'
              );
              setTopics(enriched);
            }
          }
        } catch (e) {
          // Still accumulating
        }
      }

      // Final parse
      if (partialTopics.length > 0) {
        const finalTopics = enrichTopics(
          partialTopics,
          data.month,
          '/blog',
          'Download our free guide'
        );
        setTopics(finalTopics);
        onPlanGenerated?.(finalTopics);
      }
    } catch (err) {
      console.error('Error generating blog plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate blog plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    const markdown = exportAsMarkdown(topics, data.month, data.niche);
    const filename = `blog-plan-${data.month.replace(/\s/g, '-').toLowerCase()}.md`;
    downloadFile(markdown, filename, 'text/markdown');
  };

  const handleExportCSV = () => {
    const csv = exportAsCSV(topics);
    const filename = `blog-plan-${data.month.replace(/\s/g, '-').toLowerCase()}.csv`;
    downloadFile(csv, filename, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportAsJSON(topics);
    const filename = `blog-plan-${data.month.replace(/\s/g, '-').toLowerCase()}.json`;
    downloadFile(json, filename, 'application/json');
  };

  return (
    <div className="w-full space-y-4 p-4 border rounded-lg bg-card">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">📅 Generate Blog Content Calendar</h3>

        {showForm ? (
          /* Inline Form */
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Month</label>
                <input
                  type="text"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  placeholder="January 2025"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Posts Per Month</label>
                <input
                  type="number"
                  value={formData.postsPerMonth}
                  onChange={(e) => setFormData({ ...formData, postsPerMonth: parseInt(e.target.value) || 8 })}
                  min="1"
                  max="30"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Niche</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                placeholder="WordPress development"
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Target Audience</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="Small business owners"
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Brand Voice</label>
              <select
                value={formData.brandVoice}
                onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="technical">Technical</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
          </div>
        ) : (
          /* Summary after form is hidden */
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Month:</span> {formData.month}
            </div>
            <div>
              <span className="font-medium">Posts:</span> {formData.postsPerMonth}
            </div>
            <div>
              <span className="font-medium">Niche:</span> {formData.niche}
            </div>
            <div>
              <span className="font-medium">Audience:</span> {formData.targetAudience}
            </div>
            {formData.brandVoice && (
              <div className="col-span-2">
                <span className="font-medium">Voice:</span> {formData.brandVoice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm font-medium">
              Generating topics... ({topics.length}/{data.postsPerMonth})
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(topics.length / data.postsPerMonth) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Topics Preview */}
      {topics.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Generated Topics ({topics.length})
          </h4>
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="p-3 border rounded-lg space-y-1 bg-background hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="font-medium text-sm">
                    {index + 1}. {topic.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Keyword:</span> {topic.focusKeyword}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {topic.metaDescription}
                  </div>
                </div>
                <div className="text-xs text-right space-y-1 flex-shrink-0">
                  <div className="font-medium">{topic.publishDate}</div>
                  <div className="text-muted-foreground">
                    Week {topic.weekNumber}
                  </div>
                  <div className="text-muted-foreground">
                    ~{topic.estimatedWordCount.toLocaleString()} words
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {topics.length === 0 ? (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Blog Plan'}
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setShowForm(true);
                setTopics([]);
              }}
              disabled={isGenerating}
              className="px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              Edit & Regenerate
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExportMarkdown}
              className="px-4 py-2 border rounded-lg hover:bg-muted font-medium text-sm transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export Markdown
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border rounded-lg hover:bg-muted font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Table className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 border rounded-lg hover:bg-muted font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Export JSON
            </button>
          </>
        )}
      </div>

      {/* Statistics */}
      {topics.length > 0 && (
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Statistics</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold">{topics.length}</div>
              <div className="text-muted-foreground">Topics</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {topics.reduce((sum, t) => sum + t.estimatedWordCount, 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground">Total Words</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.ceil(topics.length / 4)}
              </div>
              <div className="text-muted-foreground">Weeks</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
