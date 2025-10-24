'use client';

import { useState } from 'react';
import { Download, Copy, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { Response } from '@/components/ai-elements/response';
import { Sources, Source } from '@/components/ai-elements/source';
import { countWords, detectCurrentSection, downloadFile } from '@/lib/blog-planner-utils';

interface BlogWriterWidgetProps {
  data: {
    title: string;
    focusKeyword: string;
    metaDescription?: string;
    contentType: 'how-to' | 'listicle' | 'guide' | 'tutorial' | 'comparison';
    estimatedWordCount: number;
    enableResearch: boolean;
    brandVoice: string;
    additionalInstructions?: string;
    internalLinkPage: string;
    callToAction: string;
    status: string;
    timestamp: string;
    message: string;
  };
  model?: string;
}

interface ResearchSource {
  url: string;
  title: string;
  snippet?: string;
}

export function BlogWriterWidget({ data, model }: BlogWriterWidgetProps) {
  const [isResearching, setIsResearching] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([]);
  const [researchSummary, setResearchSummary] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'markdown' | 'rendered'>('rendered');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);

    try {
      // PHASE 1: Research (if enabled)
      if (data.enableResearch) {
        setIsResearching(true);
        setCurrentSection('Researching topic...');

        const researchResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'perplexity/sonar-pro',
            messages: [
              {
                role: 'user',
                content: `Research the topic: "${data.title}". Focus keyword: "${data.focusKeyword}". Find latest information, statistics, best practices, and expert insights for ${new Date().getFullYear()}.`,
              },
            ],
          }),
        });

        if (!researchResponse.ok) {
          throw new Error('Research failed');
        }

        const researchData = await researchResponse.json();

        // Extract sources and content from Perplexity response
        if (researchData.citations) {
          setResearchSources(researchData.citations.map((c: any) => ({
            url: c.url,
            title: c.title || c.url,
            snippet: c.snippet,
          })));
        }

        if (researchData.content) {
          setResearchSummary(researchData.content);
        }

        setIsResearching(false);
      }

      // PHASE 2: Write blog post
      setIsWriting(true);
      setCurrentSection('Writing introduction...');

      const writeResponse = await fetch('/api/generate-blog-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          focusKeyword: data.focusKeyword,
          metaDescription: data.metaDescription,
          contentType: data.contentType,
          estimatedWordCount: data.estimatedWordCount,
          brandVoice: data.brandVoice,
          additionalInstructions: data.additionalInstructions,
          internalLinkPage: data.internalLinkPage,
          callToAction: data.callToAction,
          researchSummary,
          researchSources,
          model: model || 'anthropic/claude-sonnet-4-5-20250929',
        }),
      });

      if (!writeResponse.ok) {
        throw new Error(`Writing failed: ${writeResponse.status}`);
      }

      const reader = writeResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulated += chunk;

        setBlogContent(accumulated);

        // Update current section
        const section = detectCurrentSection(accumulated);
        setCurrentSection(section);
      }

      setIsWriting(false);
      setCurrentSection(null);
    } catch (err) {
      console.error('Error writing blog post:', err);
      setError(err instanceof Error ? err.message : 'Failed to write blog post');
      setIsWriting(false);
      setIsResearching(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(blogContent);
  };

  const handleDownload = () => {
    const filename = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    downloadFile(blogContent, `${filename}.md`, 'text/markdown');
  };

  const wordCount = countWords(blogContent);
  const progress = Math.min(100, (wordCount / data.estimatedWordCount) * 100);

  return (
    <div className="w-full space-y-4 p-4 border rounded-lg bg-card">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">✍️ Write Blog Post</h3>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Title:</span> {data.title}
          </div>
          <div>
            <span className="font-medium">Focus Keyword:</span> {data.focusKeyword}
          </div>
          <div>
            <span className="font-medium">Type:</span> {data.contentType}
          </div>
          <div>
            <span className="font-medium">Target Length:</span> ~
            {data.estimatedWordCount.toLocaleString()} words
          </div>
        </div>
      </div>

      {/* Research Phase */}
      {isResearching && (
        <div className="space-y-2 p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              Researching with Perplexity Sonar Pro...
            </span>
          </div>
        </div>
      )}

      {/* Research Sources */}
      {researchSources.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Research Sources ({researchSources.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-muted rounded-lg">
            {researchSources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 hover:bg-background rounded text-sm border"
              >
                <div className="font-medium text-primary">{source.title}</div>
                {source.snippet && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {source.snippet}
                  </div>
                )}
                <div className="text-xs text-muted-foreground truncate">
                  {source.url}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Writing Phase */}
      {isWriting && (
        <div className="space-y-2 p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                Writing: {currentSection}
              </span>
            </div>
            <span className="text-sm font-medium">
              {wordCount.toLocaleString()} / {data.estimatedWordCount.toLocaleString()} words
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
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

      {/* Blog Content Preview */}
      {blogContent && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Preview</h4>
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewMode('rendered')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  previewMode === 'rendered'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-muted'
                }`}
              >
                Rendered
              </button>
              <button
                onClick={() => setPreviewMode('markdown')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  previewMode === 'markdown'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-muted'
                }`}
              >
                Markdown
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {previewMode === 'markdown' ? (
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                {blogContent}
              </pre>
            ) : (
              <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
                <Response>{blogContent}</Response>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {!blogContent ? (
          <button
            onClick={handleGenerate}
            disabled={isResearching || isWriting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            {data.enableResearch ? 'Research & Write' : 'Write Blog Post'}
          </button>
        ) : (
          <>
            <button
              onClick={handleGenerate}
              disabled={isResearching || isWriting}
              className="px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              Regenerate
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCopy}
              className="px-4 py-2 border rounded-lg hover:bg-muted font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 border rounded-lg hover:bg-muted font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download .md
            </button>
          </>
        )}
      </div>

      {/* Statistics */}
      {blogContent && (
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Statistics</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold">{wordCount.toLocaleString()}</div>
              <div className="text-muted-foreground">Words</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-muted-foreground">Target Met</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.ceil(wordCount / 200)}
              </div>
              <div className="text-muted-foreground">Min Read</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
