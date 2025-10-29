"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { X, Download, ImagePlus, Trash2, Link as LinkIcon, RefreshCw, Upload } from 'lucide-react';
import JSZip from 'jszip';
import { EventEditor } from '@/components/ui/event-editor';
import imageCompression from 'browser-image-compression';

interface TkxResult {
  url: string;
  imageUrl: string | null;
  processedImageUrl?: string;
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

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl?: string;
  isProcessing: boolean;

  // Compression data
  compressedFile?: File;
  compressedUrl?: string;
  originalSize: number;
  compressedSize?: number;
  originalDimensions?: { width: number; height: number };
  compressedDimensions?: { width: number; height: number };

  // Blur background data
  blurredUrl?: string;
}

const urlToFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

export default function ImageAlterationsPage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Processing options
  const [enableCompression, setEnableCompression] = useState(true);
  const [enableBlur, setEnableBlur] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  const [quality, setQuality] = useState(0.8);
  const [blurWidth, setBlurWidth] = useState(1920);
  const [blurHeight, setBlurHeight] = useState(1080);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // TKX Scraper state
  const [tkxUrlsText, setTkxUrlsText] = useState<string>("");
  const [tkxLoading, setTkxLoading] = useState<boolean>(false);
  const [tkxResults, setTkxResults] = useState<TkxResult[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());

  // Helper functions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const createBlurredBackground = async (
    file: File,
    targetWidth: number,
    targetHeight: number
  ): Promise<string> => {
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

          // Draw blurred background
          ctx.filter = 'blur(40px)';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          ctx.filter = 'none';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Draw centered image
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

  const processImage = async (imageId: string, file: File) => {
    try {
      const originalDimensions = await getImageDimensions(file);

      // Update with dimensions
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, originalDimensions, isProcessing: true }
          : img
      ));

      // Compress if enabled
      if (enableCompression) {
        const options = {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker: true,
          initialQuality: quality,
        };

        const compressedFile = await imageCompression(file, options);
        const compressedDimensions = await getImageDimensions(compressedFile);
        const compressedUrl = URL.createObjectURL(compressedFile);

        setImages(prev => prev.map(img =>
          img.id === imageId
            ? {
                ...img,
                compressedFile,
                compressedUrl,
                compressedSize: compressedFile.size,
                compressedDimensions,
                processedUrl: compressedUrl
              }
            : img
        ));
      }

      // Create blur background if enabled
      if (enableBlur) {
        const blurredUrl = await createBlurredBackground(file, blurWidth, blurHeight);

        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, blurredUrl, processedUrl: blurredUrl }
            : img
        ));
      }

      // Mark as done processing
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, isProcessing: false }
          : img
      ));

    } catch (error) {
      console.error('Failed to process image:', error);
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, isProcessing: false }
          : img
      ));
    }
  };

  const handleFiles = async (files: File[]) => {
    const newImages: ProcessedImage[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      isProcessing: true,
      originalSize: file.size,
    }));

    setImages(prev => [...prev, ...newImages]);

    // Process each image
    for (const image of newImages) {
      processImage(image.id, image.originalFile);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const reprocessImage = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      processImage(imageId, image.originalFile);
    }
  };

  const reprocessAll = () => {
    images.forEach(image => {
      processImage(image.id, image.originalFile);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
  };

  const downloadImage = (image: ProcessedImage) => {
    const url = image.processedUrl || image.compressedUrl || image.blurredUrl || image.originalUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = `processed_${image.originalFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    const zip = new JSZip();

    for (const img of images) {
      const url = img.processedUrl || img.compressedUrl || img.blurredUrl || img.originalUrl;
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(`processed_${img.originalFile.name}`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'processed_images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TKX Scraper functions
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
            const processedUrl = await createBlurredBackground(imageFile, blurWidth, blurHeight);

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
      .filter(r => r.processedImageUrl && r.title)
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
    <div className="h-screen w-full bg-background text-foreground overflow-hidden">
      <div className="h-full flex flex-col pt-16">

        {/* Header */}
        <div className="border-b border-foreground/10 bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <h1 className="text-2xl font-bold">Image Processing Studio</h1>
            <p className="text-sm text-foreground/60 mt-1">
              Compress, resize, and transform your images with advanced processing options
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6 space-y-8">

            {/* Main Image Processor */}
            <div className="space-y-6">

              {/* Controls Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Compression Settings */}
                <div className="rounded-xl border border-foreground/10 bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Compression</h3>
                    <Checkbox
                      checked={enableCompression}
                      onCheckedChange={(checked) => setEnableCompression(checked as boolean)}
                    />
                  </div>

                  <div className="space-y-4 opacity-100" style={{ opacity: enableCompression ? 1 : 0.4 }}>
                    <div>
                      <Label className="text-xs text-foreground/70">Max File Size: {maxSizeMB} MB</Label>
                      <Slider
                        disabled={!enableCompression}
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={[maxSizeMB]}
                        onValueChange={(value) => setMaxSizeMB(value[0])}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-foreground/70">Max Dimensions: {maxWidthOrHeight} px</Label>
                      <Slider
                        disabled={!enableCompression}
                        min={500}
                        max={4000}
                        step={100}
                        value={[maxWidthOrHeight]}
                        onValueChange={(value) => setMaxWidthOrHeight(value[0])}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-foreground/70">Quality: {Math.round(quality * 100)}%</Label>
                      <Slider
                        disabled={!enableCompression}
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={[quality]}
                        onValueChange={(value) => setQuality(value[0])}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!enableCompression}
                        onClick={() => { setMaxWidthOrHeight(1920); setQuality(0.8); setMaxSizeMB(1); }}
                      >
                        Web
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!enableCompression}
                        onClick={() => { setMaxWidthOrHeight(3840); setQuality(0.9); setMaxSizeMB(5); }}
                      >
                        High Quality
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Blur Background Settings */}
                <div className="rounded-xl border border-foreground/10 bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Blur Background</h3>
                    <Checkbox
                      checked={enableBlur}
                      onCheckedChange={(checked) => setEnableBlur(checked as boolean)}
                    />
                  </div>

                  <div className="space-y-4" style={{ opacity: enableBlur ? 1 : 0.4 }}>
                    <div>
                      <Label className="text-xs text-foreground/70">Canvas Width: {blurWidth} px</Label>
                      <Slider
                        disabled={!enableBlur}
                        min={500}
                        max={4000}
                        step={100}
                        value={[blurWidth]}
                        onValueChange={(value) => setBlurWidth(value[0])}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-foreground/70">Canvas Height: {blurHeight} px</Label>
                      <Slider
                        disabled={!enableBlur}
                        min={500}
                        max={4000}
                        step={100}
                        value={[blurHeight]}
                        onValueChange={(value) => setBlurHeight(value[0])}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!enableBlur}
                        onClick={() => { setBlurWidth(1080); setBlurHeight(1080); }}
                      >
                        1:1 Square
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!enableBlur}
                        onClick={() => { setBlurWidth(1920); setBlurHeight(1080); }}
                      >
                        16:9 Wide
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="rounded-xl border border-foreground/10 bg-card p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Actions</h3>

                  <div className="space-y-2">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      size="lg"
                    >
                      <ImagePlus className="h-5 w-5 mr-2" />
                      Select Images
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                      accept="image/*"
                    />

                    {images.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          onClick={reprocessAll}
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reprocess All ({images.length})
                        </Button>

                        <Button
                          variant="outline"
                          onClick={downloadAll}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download All
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={clearAll}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </>
                    )}
                  </div>

                  {!enableCompression && !enableBlur && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                      Enable at least one processing option above
                    </div>
                  )}
                </div>
              </div>

              {/* Drag & Drop Zone / Image Grid */}
              {images.length === 0 ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    min-h-[400px] rounded-xl border-2 border-dashed
                    flex items-center justify-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5'
                    }
                  `}
                >
                  <div className="text-center space-y-4 p-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-foreground/40" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Drop images here or click to browse</p>
                      <p className="text-sm text-foreground/60 mt-1">
                        Supports JPG, PNG, WEBP, and other image formats
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
                    min-h-[400px] p-6 rounded-xl border-2 border-dashed
                    transition-all duration-200
                    ${isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-foreground/10'
                    }
                  `}
                >
                  {images.map((image) => {
                    const savingsPercent = image.compressedSize
                      ? Math.round(((image.originalSize - image.compressedSize) / image.originalSize) * 100)
                      : 0;

                    return (
                      <div
                        key={image.id}
                        className="group relative rounded-xl border border-foreground/10 bg-card overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {/* Image Preview */}
                        <div className="aspect-square relative bg-foreground/5">
                          <img
                            src={image.processedUrl || image.originalUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />

                          {image.isProcessing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-white text-sm">Processing...</div>
                            </div>
                          )}

                          {/* Hover Actions */}
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 shadow-lg"
                              onClick={() => reprocessImage(image.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 shadow-lg"
                              onClick={() => downloadImage(image)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 shadow-lg"
                              onClick={() => removeImage(image.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Info Panel */}
                        <div className="p-4 space-y-2">
                          <p className="text-sm font-medium truncate">{image.originalFile.name}</p>

                          <div className="text-xs space-y-1 text-foreground/60">
                            {image.originalDimensions && (
                              <div className="flex justify-between">
                                <span>Original:</span>
                                <span>{image.originalDimensions.width} × {image.originalDimensions.height}</span>
                              </div>
                            )}

                            {image.compressedDimensions && (
                              <div className="flex justify-between">
                                <span>Processed:</span>
                                <span>{image.compressedDimensions.width} × {image.compressedDimensions.height}</span>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span>{formatFileSize(image.originalSize)}</span>
                            </div>

                            {image.compressedSize && (
                              <>
                                <div className="flex justify-between text-green-600">
                                  <span>Compressed:</span>
                                  <span>{formatFileSize(image.compressedSize)}</span>
                                </div>
                                <div className="flex justify-between text-green-600 font-medium">
                                  <span>Saved:</span>
                                  <span>{savingsPercent}%</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TKX Event Scraper */}
            <div className="rounded-xl border border-foreground/10 bg-card p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">TKX Event Scraper</h2>
                <p className="text-sm text-foreground/60 mt-1">
                  Extract event images from TKX.live and automatically apply blur background processing
                </p>
              </div>

              <textarea
                value={tkxUrlsText}
                onChange={(e) => setTkxUrlsText(e.target.value)}
                placeholder="https://tkx.live/events/sports/..."
                className="min-h-28 w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/50"
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
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mt-6">
                  {tkxResults.map((r) => {
                    const isCompleted = completedEvents.has(r.url);
                    return (
                      <div
                        key={r.url}
                        className={`rounded-xl overflow-hidden border border-foreground/10 bg-card flex flex-col transition-opacity ${isCompleted ? 'opacity-40' : 'opacity-100'}`}
                      >
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
                              className="w-full"
                              variant="outline"
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

          </div>
        </div>
      </div>
    </div>
  );
}
