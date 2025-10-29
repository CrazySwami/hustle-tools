"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { X, Download, ImagePlus, Trash2, RefreshCw, Eraser, ExternalLink, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import imageCompression from 'browser-image-compression';

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl?: string;
  isProcessing: boolean;
  compressedFile?: File;
  compressedUrl?: string;
  originalSize: number;
  compressedSize?: number;
  originalDimensions?: { width: number; height: number };
  compressedDimensions?: { width: number; height: number };
  blurredUrl?: string;
  bgRemovedUrl?: string;
}

export function ImageProcessingTab() {
  const router = useRouter();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [enableCompression, setEnableCompression] = useState(true);
  const [enableBlur, setEnableBlur] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  const [quality, setQuality] = useState(0.8);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  // Aspect ratio presets
  const aspectRatios = {
    '1:1': { width: 1080, height: 1080, label: '1:1 (Square)' },
    '16:9': { width: 1920, height: 1080, label: '16:9 (Landscape)' },
    '9:16': { width: 1080, height: 1920, label: '9:16 (Portrait)' },
    '4:3': { width: 1440, height: 1080, label: '4:3 (Standard)' },
    '3:4': { width: 1080, height: 1440, label: '3:4 (Portrait)' },
    '21:9': { width: 2560, height: 1080, label: '21:9 (Ultrawide)' },
    'custom': { width: customWidth, height: customHeight, label: 'Custom' },
  };

  const selectedDimensions = aspectRatios[aspectRatio as keyof typeof aspectRatios] || aspectRatios['16:9'];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeBgFromImage = async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, isProcessing: true } : img
    ));

    try {
      const sourceUrl = image.processedUrl || image.originalUrl;
      const bgRemovedUrl = await removeBackgroundClientSide(sourceUrl);

      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, bgRemovedUrl, processedUrl: bgRemovedUrl, isProcessing: false } : img
      ));
    } catch (error) {
      console.error('Failed to remove background:', error);
      alert('Failed to remove background. Make sure the image is loaded properly.');
      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, isProcessing: false } : img
      ));
    }
  };

  const openInEditor = (imageUrl: string) => {
    // Store image URL in sessionStorage so editor can access it
    sessionStorage.setItem('editorImageUrl', imageUrl);
    // Navigate to elementor editor
    router.push('/elementor-editor');
  };

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

  const removeBackgroundClientSide = async (imageUrl: string): Promise<string> => {
    // Use dynamic import for client-side only library
    const { removeBackground } = await import('@imgly/background-removal');

    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Remove background using client-side library
    const result = await removeBackground(blob);

    // Convert result blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(result);
    });
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

  const processImage = async (imageId: string, file: File) => {
    try {
      const originalDimensions = await getImageDimensions(file);

      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, originalDimensions, isProcessing: true } : img
      ));

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

      if (enableBlur) {
        const blurredUrl = await createBlurredBackground(
          file,
          selectedDimensions.width,
          selectedDimensions.height
        );
        setImages(prev => prev.map(img =>
          img.id === imageId ? { ...img, blurredUrl, processedUrl: blurredUrl } : img
        ));
      }

      // Background removal is now done via button on individual images, not during initial processing

      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, isProcessing: false } : img
      ));

    } catch (error) {
      console.error('Failed to process image:', error);
      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, isProcessing: false } : img
      ));
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages: ProcessedImage[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      isProcessing: false,
      originalSize: file.size,
    }));

    setImages(prev => [...prev, ...newImages]);
    newImages.forEach(img => processImage(img.id, img.originalFile));
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const reprocessAll = () => {
    images.forEach(img => processImage(img.id, img.originalFile));
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
  };

  const downloadImage = (image: ProcessedImage) => {
    const url = image.processedUrl || image.originalUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = `processed_${image.originalFile.name}`;
    link.click();
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const processedImages = images.filter(img => img.processedUrl);

    for (const image of processedImages) {
      const response = await fetch(image.processedUrl!);
      const blob = await response.blob();
      zip.file(`processed_${image.originalFile.name}`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'processed-images.zip';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 hover:border-primary/40 transition-all">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'bg-primary/10 scale-[1.02]'
              : 'bg-transparent'
          }`}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <ImagePlus className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upload Images</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Drag and drop your images here, or click the button below to browse
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="font-semibold"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-4">
            Supports JPG, PNG, WebP, and more
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Processing Options</h2>
        </div>

        {/* Compression */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-compression"
              checked={enableCompression}
              onCheckedChange={(checked) => setEnableCompression(!!checked)}
            />
            <Label htmlFor="enable-compression" className="font-medium">
              Enable Compression
            </Label>
          </div>

          {enableCompression && (
            <div className="pl-6 space-y-4">
              <div>
                <Label>Max Size (MB): {maxSizeMB}</Label>
                <Slider
                  value={[maxSizeMB]}
                  onValueChange={(vals) => setMaxSizeMB(vals[0])}
                  min={0.1}
                  max={5}
                  step={0.1}
                />
              </div>

              <div>
                <Label>Max Width/Height (px): {maxWidthOrHeight}</Label>
                <Slider
                  value={[maxWidthOrHeight]}
                  onValueChange={(vals) => setMaxWidthOrHeight(vals[0])}
                  min={200}
                  max={4000}
                  step={100}
                />
              </div>

              <div>
                <Label>Quality: {(quality * 100).toFixed(0)}%</Label>
                <Slider
                  value={[quality]}
                  onValueChange={(vals) => setQuality(vals[0])}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
          )}
        </div>

        {/* Blur Background with Aspect Ratio */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-blur"
              checked={enableBlur}
              onCheckedChange={(checked) => setEnableBlur(!!checked)}
            />
            <Label htmlFor="enable-blur" className="font-medium">
              Add Blurred Background Frame
            </Label>
          </div>

          {enableBlur && (
            <div className="pl-6 space-y-4">
              <div>
                <Label>Aspect Ratio</Label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background"
                >
                  {Object.entries(aspectRatios).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {aspectRatio === 'custom' && (
                <>
                  <div>
                    <Label>Custom Width (px): {customWidth}</Label>
                    <Slider
                      value={[customWidth]}
                      onValueChange={(vals) => setCustomWidth(vals[0])}
                      min={400}
                      max={4000}
                      step={10}
                    />
                  </div>
                  <div>
                    <Label>Custom Height (px): {customHeight}</Label>
                    <Slider
                      value={[customHeight]}
                      onValueChange={(vals) => setCustomHeight(vals[0])}
                      min={400}
                      max={4000}
                      step={10}
                    />
                  </div>
                </>
              )}

              <div className="text-sm text-muted-foreground">
                Output: {selectedDimensions.width} × {selectedDimensions.height}px
              </div>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={reprocessAll} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reprocess All
            </Button>
            <Button onClick={clearAll} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            {images.some(img => img.processedUrl) && (
              <Button onClick={downloadAll}>
                <Download className="h-4 w-4 mr-2" />
                Download All (ZIP)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <ImagePlus className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">
                Processed Images <span className="text-muted-foreground">({images.length})</span>
              </h2>
            </div>
            <div className="text-sm text-muted-foreground">
              {images.filter(img => img.processedUrl).length} completed
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {images.map(image => {
              const savingsPercent = image.compressedSize
                ? Math.round(((image.originalSize - image.compressedSize) / image.originalSize) * 100)
                : 0;

              return (
                <div
                  key={image.id}
                  className="rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 bg-card flex flex-col transition-all hover:shadow-lg"
                >
                  <div className="relative group">
                    <img
                      src={image.processedUrl || image.originalUrl}
                      alt={image.originalFile.name}
                      className="w-full h-48 object-cover"
                    />

                    {image.isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-sm">Processing...</div>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

                  <div className="p-4 space-y-3">
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

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                        onClick={() => removeBgFromImage(image.id)}
                        disabled={image.isProcessing}
                      >
                        <Eraser className="h-3.5 w-3.5 mr-1.5" />
                        Remove BG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                        onClick={() => openInEditor(image.processedUrl || image.originalUrl)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Editor
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
