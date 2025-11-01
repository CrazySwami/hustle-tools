'use client';

import { useState } from 'react';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResults {
  bestGuess?: string;
  fullMatchingImages?: Array<{ url: string }>;
  partialMatchingImages?: Array<{ url: string }>;
  pagesWithMatchingImages?: Array<{ url: string; title?: string }>;
  visuallySimilarImages?: Array<{ url: string; title?: string }>;
  labels?: Array<{ description: string; score: number }>;
  googleLensUrl?: string;
  message?: string;
  totalResults?: number;
}

interface ReverseSearchTabProps {
  selectedImage: string | null;
}

export function ReverseSearchTab({ selectedImage }: ReverseSearchTabProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);

  const handleReverseSearch = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/reverse-image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: selectedImage }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Failed to search: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded">
        <p className="text-sm text-foreground mb-3">
          Find similar images or identify objects in your image.
        </p>
        {selectedImage ? (
          <div className="mb-3">
            <img
              src={selectedImage}
              alt="Selected"
              className="max-w-full h-auto rounded border border-border"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">
            No image selected. Generate or upload an image first.
          </p>
        )}
      </div>

      <Button
        onClick={handleReverseSearch}
        disabled={isSearching || !selectedImage}
        className="w-full flex items-center justify-center gap-2"
      >
        {isSearching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Reverse Image Search
          </>
        )}
      </Button>

      {searchResults && (
        <div className="mt-4 space-y-3">
          {searchResults.bestGuess && (
            <div className="p-3 bg-primary/10 rounded">
              <p className="text-sm font-medium">Best Guess:</p>
              <p className="text-sm text-foreground mt-1">{searchResults.bestGuess}</p>
            </div>
          )}

          {searchResults.labels && searchResults.labels.length > 0 && (
            <div className="p-3 bg-muted rounded">
              <p className="text-sm font-medium mb-2">Labels:</p>
              <div className="flex flex-wrap gap-2">
                {searchResults.labels.map((label, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-primary/20 text-xs rounded"
                  >
                    {label.description} ({Math.round(label.score * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {searchResults.visuallySimilarImages && searchResults.visuallySimilarImages.length > 0 && (
            <div className="p-3 bg-muted rounded">
              <p className="text-sm font-medium mb-2">
                Similar Images ({searchResults.visuallySimilarImages.length}):
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {searchResults.visuallySimilarImages.map((img: any, i: number) => (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                  >
                    <img
                      src={img.url}
                      alt={img.title || 'Similar image'}
                      className="w-full h-24 object-cover rounded border border-border group-hover:border-primary transition-colors"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {img.title && (
                      <p className="text-xs mt-1 truncate text-muted-foreground">
                        {img.title}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {searchResults.totalResults !== undefined && (
            <div className="p-3 bg-primary/10 rounded">
              <p className="text-sm text-foreground">
                <strong>Total Results:</strong> {searchResults.totalResults}
              </p>
            </div>
          )}

          {searchResults.googleLensUrl && (
            <a
              href={searchResults.googleLensUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Google Lens
            </a>
          )}

          {searchResults.message && (
            <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
              {searchResults.message}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
        <strong>Reverse Image Search:</strong>
        <p className="mt-2">
          Uses <strong>SerpAPI</strong> for Google reverse image search.
          Returns similar images, visual matches, and related pages.
        </p>
        <p className="mt-2">
          Set <code className="bg-muted-foreground/10 px-1 rounded">SERPAPI_API_KEY</code> in .env.local
        </p>
        <p className="mt-2 text-xs">
          Fallback: Opens Google Lens for manual search if SerpAPI is not configured.
        </p>
      </div>
    </div>
  );
}
