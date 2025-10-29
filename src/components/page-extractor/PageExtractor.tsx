'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DownloadIcon, FileCodeIcon, AlertCircleIcon, CheckCircleIcon, Loader2Icon, EyeIcon, InfoIcon } from 'lucide-react';
import JSZip from 'jszip';

interface ExtractionResult {
  success: boolean;
  url?: string;
  files: {
    html: string;
    fullHtml: string;
    fullHtmlWithLinks?: string;
    css: string;
    js: string;
    markdown: string;
  };
  metadata: {
    title: string;
    description: string;
    sourceUrl: string;
    extractedAt: string;
    stats: {
      htmlLength: number;
      cssLength: number;
      jsLength: number;
      inlineStylesCount: number;
      externalStylesCount: number;
      inlineScriptsCount: number;
      externalScriptsCount: number;
      imagesCount: number;
      fontsCount: number;
    };
  };
  fonts?: { name: string; url: string; base64?: string }[];
  images?: { src: string; base64?: string; alt?: string }[];
  error?: string;
}

interface BatchResult {
  success: boolean;
  results: ExtractionResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

interface PageExtractorProps {
  onCssExtracted?: (css: string, sourceUrl?: string) => void;
  extractMode?: 'css-only' | 'full-page';
}

export function PageExtractor({ onCssExtracted, extractMode = 'full-page' }: PageExtractorProps = {}) {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Options - set defaults based on extractMode
  const [includeImages, setIncludeImages] = useState(extractMode === 'full-page');
  const [includeFonts, setIncludeFonts] = useState(true); // Always true for both modes
  const [includeFullStylesheet, setIncludeFullStylesheet] = useState(true); // Always true for both modes

  const extractPage = async () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urlList.length) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setBatchResults(null);

    try {
      const response = await fetch('/api/extract-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: urlList.length === 1 ? urlList[0] : urlList,
          includeImages,
          includeFonts,
          includeFullStylesheet,
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.results) {
          // Batch results
          setBatchResults(data);
        } else {
          // Single result
          setResult(data);

          // Call the callback if provided and CSS was extracted
          if (onCssExtracted && data.files?.css) {
            onCssExtracted(data.files.css, data.metadata?.sourceUrl);
          }
        }
      } else {
        setError(data.error || 'Failed to extract page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSeparateFiles = (data: ExtractionResult) => {
    const title = data.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(data.files.html, `${title}_index.html`);
    downloadFile(data.files.css, `${title}_styles.css`);
    downloadFile(data.files.js, `${title}_scripts.js`);
    if (data.files.markdown) {
      downloadFile(data.files.markdown, `${title}_content.md`);
    }
  };

  const downloadSingleFile = (data: ExtractionResult) => {
    const title = data.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Use fullHtml if available, otherwise build from parts
    if (data.files.fullHtml && data.files.fullHtml.trim().length > 0) {
      downloadFile(data.files.fullHtml, `${title}_complete.html`);
    } else {
      const singleFile = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.metadata.title}</title>
  <style>
${data.files.css}
  </style>
</head>
<body>
${data.files.html}
  <script>
${data.files.js}
  </script>
</body>
</html>`;
      downloadFile(singleFile, `${title}_complete.html`);
    }
  };

  const downloadFullStylesheet = (data: ExtractionResult) => {
    const title = data.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(data.files.css, `${title}_full_stylesheet.css`);
  };

  const downloadAsZip = async (data: ExtractionResult) => {
    const zip = new JSZip();
    const title = data.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Add main files
    // Use fullHtmlWithLinks for index.html (has <link> to styles.css and <script> to scripts.js)
    // Use fullHtml for complete.html (has inline styles for single-file use)
    zip.file('index.html', data.files.fullHtmlWithLinks || data.files.fullHtml || data.files.html);
    zip.file('complete.html', data.files.fullHtml || data.files.html);
    zip.file('body-only.html', data.files.html);
    zip.file('styles.css', data.files.css);
    zip.file('scripts.js', data.files.js);
    zip.file('content.md', data.files.markdown);
    zip.file('README.txt', `Extracted from: ${data.metadata.sourceUrl}\nTitle: ${data.metadata.title}\nExtracted: ${data.metadata.extractedAt}\n\nFiles:\n- index.html: HTML with external CSS/JS links (opens styles.css and scripts.js)\n- complete.html: Self-contained HTML with inline styles (single file)\n- body-only.html: Just the body content\n- styles.css: All CSS styles extracted\n- scripts.js: All JavaScript extracted\n- content.md: Markdown version\n\nPowered by Firecrawl`);

    // Add fonts if included
    if (data.fonts && data.fonts.length > 0) {
      const fontsFolder = zip.folder('fonts');
      for (const font of data.fonts) {
        if (font.base64 && fontsFolder) {
          const base64Data = font.base64.split(',')[1];
          fontsFolder.file(font.name, base64Data, { base64: true });
        }
      }
    }

    // Add images if included
    if (data.images && data.images.length > 0) {
      const imagesFolder = zip.folder('images');
      let imageIndex = 0;
      for (const image of data.images) {
        if (image.base64 && imagesFolder) {
          const base64Data = image.base64.split(',')[1];
          const ext = image.base64.match(/data:image\/([a-z]+);/)?.[1] || 'png';
          imagesFolder.file(`image_${imageIndex++}.${ext}`, base64Data, { base64: true });
        }
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_complete.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBatchAsZip = async (batch: BatchResult) => {
    const zip = new JSZip();

    for (const result of batch.results) {
      if (!result.success) continue;

      const title = result.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const folder = zip.folder(title);

      if (folder) {
        folder.file('index.html', result.files.fullHtmlWithLinks || result.files.fullHtml || result.files.html);
        folder.file('complete.html', result.files.fullHtml || result.files.html);
        folder.file('body-only.html', result.files.html);
        folder.file('styles.css', result.files.css);
        folder.file('scripts.js', result.files.js);
        folder.file('content.md', result.files.markdown);

        // Add fonts
        if (result.fonts && result.fonts.length > 0) {
          const fontsFolder = folder.folder('fonts');
          for (const font of result.fonts) {
            if (font.base64 && fontsFolder) {
              const base64Data = font.base64.split(',')[1];
              fontsFolder.file(font.name, base64Data, { base64: true });
            }
          }
        }

        // Add images
        if (result.images && result.images.length > 0) {
          const imagesFolder = folder.folder('images');
          let imageIndex = 0;
          for (const image of result.images) {
            if (image.base64 && imagesFolder) {
              const base64Data = image.base64.split(',')[1];
              const ext = image.base64.match(/data:image\/([a-z]+);/)?.[1] || 'png';
              imagesFolder.file(`image_${imageIndex++}.${ext}`, base64Data, { base64: true });
            }
          }
        }
      }
    }

    zip.file('README.txt', `Batch Extraction Results\n\nTotal: ${batch.summary.total}\nSuccessful: ${batch.summary.successful}\nFailed: ${batch.summary.failed}\n\nExtracted: ${new Date().toISOString()}\n\nNote: This tool extracts static HTML/CSS/JS. JavaScript-rendered content may be incomplete.`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_extraction.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Page Extractor Limitations</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li><strong>JavaScript-rendered content:</strong> Sites built with React, Vue, or Next.js may have missing or minimal content because this tool only captures initial HTML (no JavaScript execution).</li>
              <li><strong>Bot protection:</strong> Some hosting providers (SiteGround, Cloudflare, etc.) may block automated requests, causing extraction to fail.</li>
              <li><strong>Best results:</strong> Traditional server-rendered websites with static HTML/CSS work best.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="urls">Website URL(s)</Label>
            <Textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="https://example.com&#10;https://another-site.com&#10;(one URL per line for batch processing)"
              className="mt-2 min-h-[100px] font-mono text-sm"
            />
          </div>

          {/* Options */}
          {extractMode === 'css-only' ? (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <InfoIcon className="w-4 h-4" />
                <span>CSS-only mode: Extracts stylesheet and fonts for styling purposes</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold text-sm">Extraction Options</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeImages"
                    checked={includeImages}
                    onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                  />
                  <label htmlFor="includeImages" className="text-sm cursor-pointer">
                    Download & inline images as base64
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFonts"
                    checked={includeFonts}
                    onCheckedChange={(checked) => setIncludeFonts(checked as boolean)}
                  />
                  <label htmlFor="includeFonts" className="text-sm cursor-pointer">
                    Extract & download fonts
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFullStylesheet"
                    checked={includeFullStylesheet}
                    onCheckedChange={(checked) => setIncludeFullStylesheet(checked as boolean)}
                  />
                  <label htmlFor="includeFullStylesheet" className="text-sm cursor-pointer">
                    Include full stylesheet
                  </label>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={extractPage}
            disabled={loading || !urls.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Extracting{extractMode === 'css-only' ? ' CSS & Fonts' : ' Full Page'}...
              </>
            ) : (
              <>
                <FileCodeIcon className="w-4 h-4 mr-2" />
                {extractMode === 'css-only' ? 'Extract CSS & Fonts' : `Extract Full Page${urls.split('\n').filter(Boolean).length > 1 ? 's' : ''}`}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ⚡ Powered by Firecrawl - Bypasses Cloudflare, SiteGround, and most bot protections
          </p>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Extraction Failed</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Batch Results Summary */}
      {batchResults && (
        <Card className="p-6 border-green-500 bg-green-50 dark:bg-green-950">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Batch Extraction Complete
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Successfully extracted {batchResults.summary.successful} of {batchResults.summary.total} pages
              </p>
            </div>
          </div>

          <Button onClick={() => downloadBatchAsZip(batchResults)} className="w-full mb-4">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download All as ZIP ({batchResults.summary.successful} pages)
          </Button>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {batchResults.results.map((res, idx) => (
              <div
                key={idx}
                className={`p-3 rounded text-sm ${
                  res.success
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-red-50 dark:bg-red-950 border border-red-200'
                }`}
              >
                <div className="font-mono truncate">{res.url || res.metadata?.sourceUrl}</div>
                {res.success ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    {res.metadata.title} • {formatBytes(res.metadata.stats.htmlLength + res.metadata.stats.cssLength)}
                  </div>
                ) : (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">{res.error}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Single Result */}
      {result && !batchResults && (
        <div className="space-y-4">
          {/* Success Message */}
          <Card className="p-4 border-green-500 bg-green-50 dark:bg-green-950">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Successfully Extracted: {result.metadata.title}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  From: {result.metadata.sourceUrl}
                </p>
              </div>
            </div>
          </Card>

          {/* Preview Button */}
          <Card className="p-4">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="w-full"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Live Preview'}
            </Button>
            {showPreview && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={result.files.fullHtml}
                  className="w-full h-[500px] bg-white"
                  title="Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </Card>

          {/* Download Options */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Download Options</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button onClick={() => downloadSeparateFiles(result)} variant="default">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Separate Files
              </Button>
              <Button onClick={() => downloadSingleFile(result)} variant="outline">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Single HTML
              </Button>
              <Button onClick={() => downloadAsZip(result)} variant="outline">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Complete ZIP
              </Button>
              <Button onClick={() => downloadFullStylesheet(result)} variant="outline">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Full Stylesheet Only
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Separate: HTML, CSS, JS, MD files | Single: Complete HTML | ZIP: All files + fonts + images | Stylesheet: CSS only
            </p>
          </Card>

          {/* Statistics */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Extraction Statistics</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">HTML</p>
                <p className="text-2xl font-bold">{formatBytes(result.metadata.stats.htmlLength)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">CSS</p>
                <p className="text-2xl font-bold">{formatBytes(result.metadata.stats.cssLength)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">JavaScript</p>
                <p className="text-2xl font-bold">{formatBytes(result.metadata.stats.jsLength)}</p>
              </div>
              {result.metadata.stats.imagesCount > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Images</p>
                  <p className="text-2xl font-bold">{result.metadata.stats.imagesCount}</p>
                </div>
              )}
              {result.metadata.stats.fontsCount > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fonts</p>
                  <p className="text-2xl font-bold">{result.metadata.stats.fontsCount}</p>
                </div>
              )}
            </div>
          </Card>

          {/* File Previews */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">File Previews</h3>
            <div className="space-y-3">
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">
                  HTML ({result.metadata.stats.htmlLength.toLocaleString()} characters)
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  <code>{result.files.html.substring(0, 2000)}{result.files.html.length > 2000 ? '...' : ''}</code>
                </pre>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">
                  CSS ({result.metadata.stats.cssLength.toLocaleString()} characters)
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  <code>{result.files.css.substring(0, 2000)}{result.files.css.length > 2000 ? '...' : ''}</code>
                </pre>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">
                  JavaScript ({result.metadata.stats.jsLength.toLocaleString()} characters)
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  <code>{result.files.js.substring(0, 2000)}{result.files.js.length > 2000 ? '...' : ''}</code>
                </pre>
              </details>
              {result.files.markdown && (
                <details className="group">
                  <summary className="cursor-pointer font-medium hover:text-primary">
                    Markdown Content
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    <code>{result.files.markdown.substring(0, 2000)}{result.files.markdown.length > 2000 ? '...' : ''}</code>
                  </pre>
                </details>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
