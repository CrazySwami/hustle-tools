'use client';

import { useState } from 'react';
import { Search, Loader2, ExternalLink, ImageIcon } from 'lucide-react';

interface ReverseImageSearchResult {
  imageUrl: string;
  status: string;
  message: string;
}

interface SearchResults {
  bestGuess?: string;
  fullMatchingImages?: Array<{ url: string }>;
  partialMatchingImages?: Array<{ url: string }>;
  pagesWithMatchingImages?: Array<{ url: string; title?: string }>;
  visuallySimilarImages?: Array<{ url: string }>;
  labels?: Array<{ description: string; score: number }>;
  googleLensUrl?: string;
  message?: string;
}

export function ReverseImageSearchWidget({ data }: { data: ReverseImageSearchResult }) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/reverse-image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: data.imageUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.results);
        setMethod(result.method);
      } else {
        setError(result.error || 'Failed to search');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1">Reverse Image Search</h3>
          <p className="text-xs text-muted-foreground">
            Find similar images and identify objects
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Original Image */}
        <div>
          <p className="text-xs font-medium mb-2">Image to Search:</p>
          <div className="border border-border rounded overflow-hidden">
            <img
              src={data.imageUrl}
              alt="Search query"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
        </div>

        {/* Search Button */}
        {!searchResults && (
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
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

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Results:</p>
              {method && (
                <span className="text-xs text-muted-foreground">
                  via {method}
                </span>
              )}
            </div>

            {/* Best Guess */}
            {searchResults.bestGuess && (
              <div className="p-3 bg-primary/10 rounded">
                <p className="text-xs font-medium mb-1">Best Guess:</p>
                <p className="text-sm">{searchResults.bestGuess}</p>
              </div>
            )}

            {/* Labels */}
            {searchResults.labels && searchResults.labels.length > 0 && (
              <div className="p-3 bg-muted rounded">
                <p className="text-xs font-medium mb-2">Labels:</p>
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

            {/* Matching Images */}
            {searchResults.fullMatchingImages && searchResults.fullMatchingImages.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">
                  Full Matches ({searchResults.fullMatchingImages.length}):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {searchResults.fullMatchingImages.slice(0, 6).map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-border rounded overflow-hidden hover:border-primary transition-colors"
                    >
                      <img
                        src={img.url}
                        alt={`Match ${i + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Pages with Matches */}
            {searchResults.pagesWithMatchingImages && searchResults.pagesWithMatchingImages.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">
                  Pages ({searchResults.pagesWithMatchingImages.length}):
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.pagesWithMatchingImages.slice(0, 5).map((page, i) => (
                    <a
                      key={i}
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs truncate">
                          {page.title || page.url}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Google Lens URL */}
            {searchResults.googleLensUrl && (
              <a
                href={searchResults.googleLensUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Lens
              </a>
            )}

            {/* Message */}
            {searchResults.message && (
              <div className="p-3 bg-muted rounded text-xs text-muted-foreground">
                {searchResults.message}
              </div>
            )}

            <button
              onClick={() => {
                setSearchResults(null);
                setMethod(null);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
            >
              Search Another
            </button>
          </div>
        )}

        {/* API Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
          <strong>Supported APIs:</strong> Google Vision, SerpAPI, TinEye, Google Lens
        </div>
      </div>
    </div>
  );
}
