'use client';

import { useState } from 'react';
import { Search, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type StockProvider = 'pexels' | 'unsplash';
type PexelsMediaType = 'photos' | 'videos';
type PexelsOrientation = 'landscape' | 'portrait' | 'square';
type UnsplashOrientation = 'landscape' | 'portrait' | 'squarish';

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    landscape: string;
    portrait: string;
  };
  photographer: string;
  photographerUrl: string;
  url: string;
  alt: string;
}

interface PexelsVideo {
  id: number;
  image: string;
  duration: number;
  videoFiles: Array<{
    quality: string;
    link: string;
    width: number;
    height: number;
  }>;
  photographer: string;
  photographerUrl: string;
  url: string;
}

interface StockPhotosTabProps {
  setSelectedImage: (url: string) => void;
  addToHistory: (url: string, label: string) => void;
}

export function StockPhotosTab({ setSelectedImage, addToHistory }: StockPhotosTabProps) {
  const [stockProvider, setStockProvider] = useState<StockProvider>('pexels');
  const [stockQuery, setStockQuery] = useState('');
  const [pexelsMediaType, setPexelsMediaType] = useState<PexelsMediaType>('photos');
  const [pexelsOrientation, setPexelsOrientation] = useState<PexelsOrientation>('landscape');
  const [unsplashOrientation, setUnsplashOrientation] = useState<UnsplashOrientation>('landscape');
  const [isStockSearching, setIsStockSearching] = useState(false);
  const [pexelsPhotos, setPexelsPhotos] = useState<PexelsPhoto[]>([]);
  const [pexelsVideos, setPexelsVideos] = useState<PexelsVideo[]>([]);
  const [unsplashPhotos, setUnsplashPhotos] = useState<any[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalResults, setStockTotalResults] = useState(0);

  const handleStockSearch = async (page: number = 1) => {
    if (!stockQuery.trim()) return;

    setIsStockSearching(true);
    try {
      if (stockProvider === 'pexels') {
        const response = await fetch('/api/search-pexels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: stockQuery,
            type: pexelsMediaType,
            page,
            perPage: 20,
            orientation: pexelsOrientation,
          }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.type === 'photos') {
            if (page === 1) {
              setPexelsPhotos(data.results);
            } else {
              setPexelsPhotos([...pexelsPhotos, ...data.results]);
            }
          } else {
            if (page === 1) {
              setPexelsVideos(data.results);
            } else {
              setPexelsVideos([...pexelsVideos, ...data.results]);
            }
          }
          setStockPage(page);
          setStockTotalResults(data.totalResults);
        } else {
          alert(`Error: ${data.error}`);
        }
      } else {
        // Unsplash
        const response = await fetch('/api/search-unsplash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: stockQuery,
            page,
            perPage: 20,
            orientation: unsplashOrientation,
          }),
        });

        const data = await response.json();

        if (data.success) {
          if (page === 1) {
            setUnsplashPhotos(data.results);
          } else {
            setUnsplashPhotos([...unsplashPhotos, ...data.results]);
          }
          setStockPage(page);
          setStockTotalResults(data.totalResults);
        } else {
          alert(`Error: ${data.error}`);
        }
      }
    } catch (error: any) {
      alert(`Failed to search ${stockProvider}: ${error.message}`);
    } finally {
      setIsStockSearching(false);
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    addToHistory(url, 'Stock Photo');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium mb-2">Stock Provider</Label>
        <div className="flex gap-2">
          <button
            onClick={() => { setStockProvider('pexels'); setPexelsPhotos([]); setPexelsVideos([]); setUnsplashPhotos([]); }}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              stockProvider === 'pexels'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Pexels
          </button>
          <button
            onClick={() => { setStockProvider('unsplash'); setPexelsPhotos([]); setPexelsVideos([]); setUnsplashPhotos([]); }}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              stockProvider === 'unsplash'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Unsplash
          </button>
        </div>
      </div>

      {stockProvider === 'pexels' && (
        <div>
          <Label className="block text-sm font-medium mb-2">Media Type</Label>
          <div className="flex gap-2">
            <button
              onClick={() => { setPexelsMediaType('photos'); setPexelsPhotos([]); setPexelsVideos([]); }}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                pexelsMediaType === 'photos'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <ImageIcon className="inline-block w-4 h-4 mr-2" />
              Photos
            </button>
            <button
              onClick={() => { setPexelsMediaType('videos'); setPexelsPhotos([]); setPexelsVideos([]); }}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                pexelsMediaType === 'videos'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <Video className="inline-block w-4 h-4 mr-2" />
              Videos
            </button>
          </div>
        </div>
      )}

      <div>
        <Label className="block text-sm font-medium mb-2">Search Query</Label>
        <textarea
          value={stockQuery}
          onChange={(e) => setStockQuery(e.target.value)}
          placeholder={`Search ${stockProvider === 'pexels' ? `Pexels for ${pexelsMediaType}` : 'Unsplash for photos'}...`}
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleStockSearch(1);
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Press Cmd/Ctrl + Enter to search
        </p>
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Orientation</Label>
        {stockProvider === 'pexels' ? (
          <select
            value={pexelsOrientation}
            onChange={(e) => setPexelsOrientation(e.target.value as PexelsOrientation)}
            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
            <option value="square">Square</option>
          </select>
        ) : (
          <select
            value={unsplashOrientation}
            onChange={(e) => setUnsplashOrientation(e.target.value as UnsplashOrientation)}
            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
            <option value="squarish">Squarish</option>
          </select>
        )}
      </div>

      <Button
        onClick={() => handleStockSearch(1)}
        disabled={isStockSearching || !stockQuery.trim()}
        className="w-full flex items-center justify-center gap-2"
      >
        {isStockSearching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Search {stockProvider === 'pexels' ? 'Pexels' : 'Unsplash'}
          </>
        )}
      </Button>

      {(stockProvider === 'pexels' && (pexelsPhotos.length > 0 || pexelsVideos.length > 0)) && (
        <div className="space-y-3">
          <div className="p-3 bg-primary/10 rounded">
            <p className="text-sm">
              <strong>Results:</strong> {stockTotalResults} {pexelsMediaType} found
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {pexelsMediaType === 'photos' && pexelsPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative cursor-pointer"
                onClick={() => handleImageClick(photo.src.large)}
              >
                <img
                  src={photo.src.medium}
                  alt={photo.alt}
                  className="w-full h-32 object-cover rounded border border-border group-hover:border-primary transition-colors"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b">
                  <p className="text-xs text-white truncate">
                    by {photo.photographer}
                  </p>
                </div>
              </div>
            ))}

            {pexelsMediaType === 'videos' && pexelsVideos.map((video) => (
              <div
                key={video.id}
                className="group relative cursor-pointer"
                onClick={() => {
                  const hdVideo = video.videoFiles.find(v => v.quality === 'hd') || video.videoFiles[0];
                  window.open(hdVideo.link, '_blank');
                }}
              >
                <img
                  src={video.image}
                  alt={`Video by ${video.photographer}`}
                  className="w-full h-32 object-cover rounded border border-border group-hover:border-primary transition-colors"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b">
                  <p className="text-xs text-white truncate">
                    by {video.photographer} • {video.duration}s
                  </p>
                </div>
              </div>
            ))}
          </div>

          {stockPage * 20 < stockTotalResults && (
            <Button
              onClick={() => handleStockSearch(stockPage + 1)}
              disabled={isStockSearching}
              variant="outline"
              className="w-full"
            >
              Load More
            </Button>
          )}
        </div>
      )}

      {stockProvider === 'unsplash' && unsplashPhotos.length > 0 && (
        <div className="space-y-3">
          <div className="p-3 bg-primary/10 rounded">
            <p className="text-sm">
              <strong>Results:</strong> {stockTotalResults} photos found
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {unsplashPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative cursor-pointer"
                onClick={() => handleImageClick(photo.urls.regular)}
              >
                <img
                  src={photo.urls.small}
                  alt={photo.description || 'Unsplash photo'}
                  className="w-full h-32 object-cover rounded border border-border group-hover:border-primary transition-colors"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b">
                  <p className="text-xs text-white truncate">
                    by {photo.photographer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {stockPage * 20 < stockTotalResults && (
            <Button
              onClick={() => handleStockSearch(stockPage + 1)}
              disabled={isStockSearching}
              variant="outline"
              className="w-full"
            >
              Load More
            </Button>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
        <strong>Stock Media Search:</strong>
        {stockProvider === 'pexels' ? (
          <>
            <p className="mt-2">
              Uses <strong>Pexels API</strong> to search millions of free stock photos and videos.
              All Pexels content is free to use for personal and commercial projects.
            </p>
            <p className="mt-2">
              Set <code className="bg-muted-foreground/10 px-1 rounded">PEXELS_API_KEY</code> in .env.local
            </p>
            <p className="mt-2 text-xs">
              Rate Limit: 200 requests/hour, 20,000 requests/month (free tier)
            </p>
          </>
        ) : (
          <>
            <p className="mt-2">
              Uses <strong>Unsplash API</strong> to search millions of beautiful, free photos.
              All Unsplash photos are free to use for personal and commercial projects.
            </p>
            <p className="mt-2">
              Set <code className="bg-muted-foreground/10 px-1 rounded">UNSPLASH_ACCESS_KEY</code> in .env.local
            </p>
            <p className="mt-2 text-xs">
              Rate Limit: 50 requests/hour (Demo), 5000 requests/hour (Production)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
