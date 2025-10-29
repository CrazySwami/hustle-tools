'use client';

import { useState, useRef } from 'react';
import { Search, Loader2, ExternalLink, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function ReverseImageSearchTab() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setSearchResults(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/reverse-image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: selectedImage }),
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
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-xl border border-foreground/10 bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Image to Search</h2>

        {selectedImage ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Search query"
                className="max-w-full h-auto max-h-96 rounded border border-border mx-auto"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setSearchResults(null);
                  setError(null);
                }}
                className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search for Similar Images
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image to find similar images or identify objects
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {searchResults && (
        <div className="rounded-xl border border-foreground/10 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Search Results</h2>
            {method && (
              <span className="text-xs text-muted-foreground">
                via {method}
              </span>
            )}
          </div>

          {/* Best Guess */}
          {searchResults.bestGuess && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium mb-1">Best Guess:</p>
              <p className="text-lg">{searchResults.bestGuess}</p>
            </div>
          )}

          {/* Labels */}
          {searchResults.labels && searchResults.labels.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-3">Labels:</p>
              <div className="flex flex-wrap gap-2">
                {searchResults.labels.map((label, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-primary/20 text-sm rounded-full"
                  >
                    {label.description} ({Math.round(label.score * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Matching Images */}
          {searchResults.fullMatchingImages && searchResults.fullMatchingImages.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">
                Full Matches ({searchResults.fullMatchingImages.length}):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {searchResults.fullMatchingImages.slice(0, 8).map((img, i) => (
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
                      className="w-full h-32 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Pages with Matches */}
          {searchResults.pagesWithMatchingImages && searchResults.pagesWithMatchingImages.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">
                Pages with Matching Images ({searchResults.pagesWithMatchingImages.length}):
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.pagesWithMatchingImages.slice(0, 10).map((page, i) => (
                  <a
                    key={i}
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">
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
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Google Lens
            </a>
          )}

          {/* Message */}
          {searchResults.message && (
            <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
              {searchResults.message}
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="rounded-xl border border-foreground/10 bg-card p-6">
        <h3 className="text-sm font-semibold mb-2">Supported APIs:</h3>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
          <li>Google Cloud Vision (1000 free calls/month)</li>
          <li>SerpAPI (100 free searches/month)</li>
          <li>TinEye (paid)</li>
          <li>Google Lens (manual fallback)</li>
        </ul>
      </div>
    </div>
  );
}
