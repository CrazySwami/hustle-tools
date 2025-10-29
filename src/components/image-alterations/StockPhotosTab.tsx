'use client';

import { useState } from 'react';
import { Search, Loader2, Image as ImageIcon, Video, Download } from 'lucide-react';

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

export function StockPhotosTab() {
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

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Search Stock Photos & Videos</h2>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Stock Provider</label>
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

          {/* Media Type (Pexels only) */}
          {stockProvider === 'pexels' && (
            <div>
              <label className="block text-sm font-medium mb-2">Media Type</label>
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

          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium mb-2">Search Query</label>
            <input
              type="text"
              value={stockQuery}
              onChange={(e) => setStockQuery(e.target.value)}
              placeholder={`Search ${stockProvider === 'pexels' ? `Pexels for ${pexelsMediaType}` : 'Unsplash for photos'}...`}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStockSearch(1);
                }
              }}
            />
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-sm font-medium mb-2">Orientation</label>
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

          {/* Search Button */}
          <button
            onClick={() => handleStockSearch(1)}
            disabled={isStockSearching || !stockQuery.trim()}
            className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </button>
        </div>

        {/* API Info */}
        <div className="mt-4 text-xs text-muted-foreground p-3 bg-muted rounded">
          {stockProvider === 'pexels' ? (
            <>
              <strong>Pexels API:</strong> 200 requests/hour, 20,000 requests/month (free).
              Set <code className="bg-muted-foreground/10 px-1 rounded">PEXELS_API_KEY</code> in .env.local
            </>
          ) : (
            <>
              <strong>Unsplash API:</strong> 50 requests/hour (Demo), 5000 requests/hour (Production).
              Set <code className="bg-muted-foreground/10 px-1 rounded">UNSPLASH_ACCESS_KEY</code> in .env.local
            </>
          )}
        </div>
      </div>

      {/* Pexels Results */}
      {stockProvider === 'pexels' && (pexelsPhotos.length > 0 || pexelsVideos.length > 0) && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">
            Results: {stockTotalResults} {pexelsMediaType} found
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pexelsMediaType === 'photos' && pexelsPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={photo.src.medium}
                  alt={photo.alt}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => downloadImage(photo.src.large, `pexels-${photo.id}.jpg`)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white hover:underline"
                  >
                    by {photo.photographer}
                  </a>
                </div>
              </div>
            ))}

            {pexelsMediaType === 'videos' && pexelsVideos.map((video) => (
              <div
                key={video.id}
                className="group relative overflow-hidden rounded-lg border border-border cursor-pointer"
                onClick={() => {
                  const hdVideo = video.videoFiles.find(v => v.quality === 'hd') || video.videoFiles[0];
                  window.open(hdVideo.link, '_blank');
                }}
              >
                <img
                  src={video.image}
                  alt={`Video by ${video.photographer}`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-white truncate">
                    by {video.photographer} • {video.duration}s
                  </p>
                </div>
              </div>
            ))}
          </div>

          {stockPage * 20 < stockTotalResults && (
            <button
              onClick={() => handleStockSearch(stockPage + 1)}
              disabled={isStockSearching}
              className="w-full mt-4 px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {/* Unsplash Results */}
      {stockProvider === 'unsplash' && unsplashPhotos.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">
            Results: {stockTotalResults} photos found
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {unsplashPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={photo.urls.small}
                  alt={photo.description || 'Unsplash photo'}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => downloadImage(photo.urls.regular, `unsplash-${photo.id}.jpg`)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <a
                    href={photo.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white hover:underline"
                  >
                    by {photo.photographer}
                  </a>
                </div>
              </div>
            ))}
          </div>

          {stockPage * 20 < stockTotalResults && (
            <button
              onClick={() => handleStockSearch(stockPage + 1)}
              disabled={isStockSearching}
              className="w-full mt-4 px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
