'use client';

import { useState } from 'react';
import { Wand2, Loader2, Download, ExternalLink, ImageIcon } from 'lucide-react';

interface GenerateImageResult {
  prompt: string;
  provider: 'openai' | 'gemini';
  size?: string;
  quality?: string;
  style?: string;
  aspectRatio?: string;
  status: string;
  message: string;
}

export function GenerateImageWidget({ data }: { data: GenerateImageResult }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const endpoint = data.provider === 'openai'
        ? '/api/generate-image-openai'
        : '/api/generate-image-gemini';

      const body = data.provider === 'openai'
        ? {
            prompt: data.prompt,
            size: data.size,
            quality: data.quality,
            style: data.style,
          }
        : {
            prompt: data.prompt,
            aspectRatio: data.aspectRatio,
            numberOfImages: 1,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setImageUrl(result.imageUrl);
        setRevisedPrompt(result.revisedPrompt || null);
      } else {
        setError(result.error || 'Failed to generate image');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download image');
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1">Generate Image</h3>
          <p className="text-xs text-muted-foreground">
            Using {data.provider === 'openai' ? 'DALL-E 3' : 'Gemini Imagen 3'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Prompt */}
        <div className="p-3 bg-muted rounded text-sm">
          <strong>Prompt:</strong> {data.prompt}
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {data.provider === 'openai' && (
            <>
              <div className="p-2 bg-muted/50 rounded">
                <strong>Size:</strong> {data.size}
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <strong>Quality:</strong> {data.quality}
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <strong>Style:</strong> {data.style}
              </div>
            </>
          )}
          {data.provider === 'gemini' && (
            <div className="p-2 bg-muted/50 rounded">
              <strong>Aspect Ratio:</strong> {data.aspectRatio}
            </div>
          )}
        </div>

        {/* Generate Button */}
        {!imageUrl && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Image Display */}
        {imageUrl && (
          <div className="space-y-3">
            <div className="border border-border rounded overflow-hidden">
              <img
                src={imageUrl}
                alt={data.prompt}
                className="w-full h-auto"
              />
            </div>

            {revisedPrompt && (
              <div className="p-3 bg-muted rounded text-xs">
                <strong>Revised Prompt:</strong> {revisedPrompt}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={downloadImage}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </div>

            <button
              onClick={() => {
                setImageUrl(null);
                setRevisedPrompt(null);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
            >
              Generate Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
