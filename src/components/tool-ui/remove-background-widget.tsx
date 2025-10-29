'use client';

import { useState } from 'react';
import { Scissors, Loader2, Download, ExternalLink, ImageIcon } from 'lucide-react';

interface RemoveBackgroundResult {
  imageUrl: string;
  status: string;
  message: string;
}

export function RemoveBackgroundWidget({ data }: { data: RemoveBackgroundResult }) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveBackground = async () => {
    setIsRemoving(true);
    setError(null);

    try {
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: data.imageUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResultImageUrl(result.imageUrl);
        setMethod(result.method);
      } else {
        setError(result.error || 'Failed to remove background');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsRemoving(false);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `no-bg-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
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
          <h3 className="text-sm font-semibold mb-1">Remove Background</h3>
          <p className="text-xs text-muted-foreground">
            Create transparent PNGs
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Original Image */}
        <div>
          <p className="text-xs font-medium mb-2">Original Image:</p>
          <div className="border border-border rounded overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat">
            <img
              src={data.imageUrl}
              alt="Original"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
        </div>

        {/* Remove Button */}
        {!resultImageUrl && (
          <button
            onClick={handleRemoveBackground}
            disabled={isRemoving}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Removing Background...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                Remove Background
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

        {/* Result Image Display */}
        {resultImageUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Result (Transparent):</p>
              {method && (
                <span className="text-xs text-muted-foreground">
                  via {method}
                </span>
              )}
            </div>
            <div className="border border-border rounded overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat">
              <img
                src={resultImageUrl}
                alt="No background"
                className="w-full h-auto"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadImage(resultImageUrl)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <a
                href={resultImageUrl}
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
                setResultImageUrl(null);
                setMethod(null);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
              >
              Process Another
            </button>
          </div>
        )}

        {/* API Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
          <strong>Supported APIs:</strong> remove.bg, imgly
        </div>
      </div>
    </div>
  );
}
