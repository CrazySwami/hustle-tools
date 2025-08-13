"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { X, Download, RefreshCw, ImagePlus, Trash2 } from 'lucide-react';
import JSZip from 'jszip';

interface ImageFile {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl?: string;
}

export default function ImageAlterationsPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1000);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

          if (!ctx) {
            return reject(new Error('Could not get canvas context'));
          }

          // Background (blurred and darkened)
          ctx.filter = 'blur(40px)';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          ctx.filter = 'none';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Foreground (contained)
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

    const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(image => image.id !== id));
  };

  const handleRegenerateImage = async (id: string) => {
    const imageToRegenerate = images.find(image => image.id === id);
    if (imageToRegenerate) {
      const processedUrl = await processImage(imageToRegenerate.file, width, height);
      setImages(prev => prev.map(i => i.id === id ? { ...i, processedUrl } : i));
    }
  };

  const handleDownloadImage = (image: ImageFile) => {
    if (!image.processedUrl) return;
    const link = document.createElement('a');
    link.href = image.processedUrl;
    link.download = `altered-${image.file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const imagePromises = images
      .filter(image => image.processedUrl)
      .map(async image => {
        const response = await fetch(image.processedUrl!);
        const blob = await response.blob();
        zip.file(`altered-${image.file.name}`, blob);
      });

    await Promise.all(imagePromises);

    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'altered-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

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

  return (
    <div className="h-screen w-full bg-background text-foreground pt-16 overflow-y-hidden">
      <div className="mx-auto max-w-5xl p-5 h-full overflow-y-auto">
        <h1 className="text-2xl font-semibold">Image Alterations</h1>
        <p className="mt-2 text-foreground/80">
          Resize and reformat images for your marketing content.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-8">
          <section>
            <div className="space-y-4 rounded-lg border border-foreground/15 p-4 h-full">
              <h2 className="font-medium">1. Controls</h2>
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
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      className="hidden"
                      multiple
                      accept="image/*"
                    />
                    <Button variant="outline" onClick={handleDownloadAll} disabled={images.length === 0} className="w-full sm:w-auto">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
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
            <div className="space-y-4 rounded-lg border border-foreground/15 p-4 h-full">
              <h2 className="font-medium">2. Preview</h2>
              {images.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[400px] text-foreground/50">
                  <p>Your altered images will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group aspect-square">
                      <img 
                        src={image.processedUrl || image.originalUrl} 
                        alt={`Preview ${index + 1}`} 
                        className="rounded-lg object-cover w-full h-full"
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleRemoveImage(image.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleDownloadImage(image)} disabled={!image.processedUrl}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-10 text-xs text-foreground/60">
          Note: All image processing is done in your browser. No data is sent to a server.
        </div>
      </div>
    </div>
  );
}
