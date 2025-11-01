'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ProcessingTabProps {
  selectedImage: string | null;
  setSelectedImage: (url: string) => void;
  addToHistory: (url: string, label: string) => void;
}

export function ProcessingTab({ selectedImage, setSelectedImage, addToHistory }: ProcessingTabProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enableCompression, setEnableCompression] = useState(true);
  const [enableBlur, setEnableBlur] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  const [quality, setQuality] = useState(0.8);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatios = {
    '1:1': { width: 1080, height: 1080, label: '1:1 (Square)' },
    '16:9': { width: 1920, height: 1080, label: '16:9 (Landscape)' },
    '9:16': { width: 1080, height: 1920, label: '9:16 (Portrait)' },
    '4:3': { width: 1440, height: 1080, label: '4:3 (Standard)' },
    '3:4': { width: 1080, height: 1440, label: '3:4 (Portrait)' },
    '21:9': { width: 2560, height: 1080, label: '21:9 (Ultrawide)' },
  };

  const selectedDimensions = aspectRatios[aspectRatio as keyof typeof aspectRatios] || aspectRatios['16:9'];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSourceImage(result);
    };
    reader.readAsDataURL(file);
  };

  const createBlurredBackground = async (
    imageUrl: string,
    targetWidth: number,
    targetHeight: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
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

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const compressImage = async (imageUrl: string): Promise<string> => {
    const imageCompression = (await import('browser-image-compression')).default;

    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });

    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: quality,
    };

    const compressedFile = await imageCompression(file, options);
    return URL.createObjectURL(compressedFile);
  };

  const handleProcess = async () => {
    const imageToProcess = sourceImage || selectedImage;
    if (!imageToProcess) {
      alert('Please select or upload an image first');
      return;
    }

    setIsProcessing(true);
    try {
      let processedUrl = imageToProcess;

      if (enableCompression) {
        processedUrl = await compressImage(processedUrl);
      }

      if (enableBlur) {
        processedUrl = await createBlurredBackground(
          processedUrl,
          selectedDimensions.width,
          selectedDimensions.height
        );
      }

      setSelectedImage(processedUrl);
      addToHistory(processedUrl, 'Processed');
    } catch (error: any) {
      alert(`Failed to process image: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium mb-2">Source Image</Label>
        <div className="border-2 border-dashed border-border rounded p-4 text-center">
          {sourceImage ? (
            <div className="relative">
              <img
                src={sourceImage}
                alt="Source"
                className="max-w-full h-auto rounded"
              />
              <button
                onClick={() => setSourceImage(null)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : selectedImage ? (
            <>
              <img
                src={selectedImage}
                alt="Selected"
                className="max-w-full h-auto rounded mb-2"
              />
              <p className="text-xs text-muted-foreground">
                Using selected image from preview
              </p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload an image to process
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 bg-muted rounded">
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

            <div className="text-sm text-muted-foreground">
              Output: {selectedDimensions.width} × {selectedDimensions.height}px
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleProcess}
        disabled={isProcessing || (!sourceImage && !selectedImage)}
        className="w-full flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Process Image
          </>
        )}
      </Button>
    </div>
  );
}
