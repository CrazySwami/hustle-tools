"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Download, ImagePlus, Trash2, Link as LinkIcon } from 'lucide-react';
import JSZip from 'jszip';
import { EventEditor } from '@/components/ui/event-editor';

interface TkxResult {
  url: string;
  imageUrl: string | null;
  processedImageUrl?: string; // To store the new image
  month: string | null;
  day: string | null;
  week: string | null;
  venue: string | null;
  time: string | null;
  title: string | null;
  promoter: string | null;
  specialGuests: string[];
  error?: string;
}

interface ImageFile {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl?: string;
}

// Updated helper to use the new local image proxy
const urlToFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

export default function ImageAlterationsPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1000);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tkxUrlsText, setTkxUrlsText] = useState<string>("");
  const [tkxLoading, setTkxLoading] = useState<boolean>(false);
  const [tkxResults, setTkxResults] = useState<TkxResult[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());

  const processImage = async (file: File, targetWidth: number, targetHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Could not get canvas context'));
          ctx.filter = 'blur(40px)';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          ctx.filter = 'none';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;
          const x = (targetWidth - newWidth) / 2;
          const y = (targetHeight - newHeight) / 2;
          ctx.drawImage(img, x, y, newWidth, newHeight);
          resolve(canvas.toDataURL(file.type));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleScrapeTkx = async () => {
    const urls = tkxUrlsText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (urls.length === 0) return;

    setTkxLoading(true);
    setTkxResults([]);
    setCompletedEvents(new Set());

    try {
      const res = await fetch('/api/scrape-tkx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlsText: tkxUrlsText })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to scrape');
      
      const initialResults: TkxResult[] = data.results || [];
      setTkxResults(initialResults);

      // Automatically process all scraped images
      initialResults.forEach(async (result) => {
        if (result.imageUrl) {
          try {
            const filename = result.title?.replace(/[^a-zA-Z0-9\s]/g, '_') || 'image';
            const imageFile = await urlToFile(result.imageUrl, `${filename}.jpg`);
            const processedUrl = await processImage(imageFile, width, height);
            
            setTkxResults(prev => 
              prev.map(r => r.url === result.url ? { ...r, processedImageUrl: processedUrl } : r)
            );
          } catch (e) {
            console.error(`Failed to process image for ${result.title}:`, e);
          }
        }
      });

    } catch (e) {
      console.error(e);
    } finally {
      setTkxLoading(false);
    }
  };
  
  const downloadImageAs = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const extension = blob.type.split('/')[1] || 'jpg';
      link.download = `${filename.replace(/[^a-zA-Z0-9\s]/g, '') || 'image'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to download image:', error);
      window.open(url, '_blank');
    }
  };

  const downloadAllScrapedImages = async () => {
    const zip = new JSZip();
    const promises = tkxResults
      .filter(r => r.processedImageUrl && r.title) // Download processed images
      .map(async (result) => {
        try {
          const response = await fetch(result.processedImageUrl!);
          const blob = await response.blob();
          const extension = blob.type.split('/')[1] || 'jpg';
          const filename = `${result.title!.replace(/[^a-zA-Z0-9\s]/g, '')}.${extension}`;
          zip.file(filename, blob);
        } catch (e) {
          console.error(`Failed to fetch image for ${result.title}:`, e);
        }
      });
    
    await Promise.all(promises);

    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'tkx-event-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleRemoveImage = (id: string) => setImages(prev => prev.filter(image => image.id !== id));

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages: ImageFile[] = files.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      originalUrl: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages]);
    for (const image of newImages) {
      processImage(image.file, width, height).then(processedUrl => {
        setImages(prev => prev.map(i => i.id === image.id ? { ...i, processedUrl } : i));
      });
    }
  };

  const toggleCompleted = (url: string) => {
    setCompletedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  return (
    <div className="h-screen w-full bg-background text-foreground pt-16 overflow-y-hidden">
      <div className="mx-auto max-w-7xl p-5 h-full overflow-y-auto">
        <div className="mt-6 space-y-3 rounded-lg border border-foreground/15 p-4">
          <h2 className="font-medium">Scrape TKX Event Pages</h2>
          <p className="text-sm text-foreground/70">Paste TKX event URLs to extract images and event details.</p>
          <textarea
            value={tkxUrlsText}
            onChange={(e) => setTkxUrlsText(e.target.value)}
            placeholder="https://tkx.live/events/sports/..."
            className="min-h-28 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-foreground/30"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleScrapeTkx} disabled={tkxLoading}>
              {tkxLoading ? 'Scraping & Processing…' : 'Scrape TKX Events'}
            </Button>
            {tkxResults.length > 0 && (
              <Button variant="outline" onClick={downloadAllScrapedImages}>
                <Download className="h-4 w-4 mr-2" />
                Download All Images
              </Button>
            )}
          </div>

          {tkxResults.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mt-6">
              {tkxResults.map((r) => {
                const isCompleted = completedEvents.has(r.url);
                return (
                  <div key={r.url} className={`bg-zinc-900 rounded-lg overflow-hidden flex flex-col transition-opacity ${isCompleted ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="relative group">
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.processedImageUrl ? (
                          <img src={r.processedImageUrl} alt={r.title || 'event image'} className="w-full h-48 object-cover" />
                        ) : r.imageUrl ? (
                          <div className="w-full h-48 flex items-center justify-center bg-foreground/5 text-xs">Processing...</div>
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-foreground/5 text-xs">No image</div>
                        )}
                      </a>
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleCompleted(r.url)}
                          className="bg-black/50 border-white"
                        />
                      </div>
                      <div 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => downloadImageAs(r.processedImageUrl || r.imageUrl!, r.title || 'event')}
                      >
                        <Download className="h-6 w-6 text-white bg-black/50 rounded-full p-1" />
                      </div>
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <EventEditor result={r} />
                      <div className="pt-4">
                        <Button
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => navigator.clipboard.writeText(r.url)}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3 rounded-lg border border-foreground/15 p-4">
          <h2 className="font-medium">Legacy Image Alterations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-4">
            <section>
              <div className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">Dimensions & Presets</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input id="width" type="number" value={width} onChange={(e) => setWidth(parseInt(e.target.value, 10))} placeholder="Width" />
                      <Input id="height" type="number" value={height} onChange={(e) => setHeight(parseInt(e.target.value, 10))} placeholder="Height" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" onClick={() => { setWidth(1080); setHeight(1080); }}>1:1</Button>
                      <Button variant="outline" onClick={() => { setWidth(1920); setHeight(1080); }}>16:9</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Actions</label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Select Images
                      </Button>
                      <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" multiple accept="image/*" />
                      <Button variant="destructive" onClick={() => setImages([])} disabled={images.length === 0} className="w-full sm:w-auto">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section>
              <h2 className="font-medium">Preview</h2>
              {images.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-foreground/50">
                  <p>Your altered images will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image) => (
                    <div key={image.id} className="relative group aspect-square">
                      <img src={image.processedUrl || image.originalUrl} alt={`Preview`} className="rounded-lg object-cover w-full h-full" />
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleRemoveImage(image.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}