'use client';

import { useState } from 'react';
import { Scissors, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackgroundRemovalTabProps {
  selectedImage: string | null;
  setSelectedImage: (url: string) => void;
  addToHistory: (url: string, label: string) => void;
}

export function BackgroundRemovalTab({
  selectedImage,
  setSelectedImage,
  addToHistory,
}: BackgroundRemovalTabProps) {
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const handleRemoveBackground = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setIsRemovingBg(true);
    try {
      // Dynamically import @imgly/background-removal (client-side only)
      const { removeBackground } = await import('@imgly/background-removal');

      // Convert data URL to Blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Remove background using client-side ML model
      const resultBlob = await removeBackground(blob);

      // Convert result to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultUrl = reader.result as string;
        setSelectedImage(resultUrl);
        addToHistory(resultUrl, 'BG Removed');
      };
      reader.readAsDataURL(resultBlob);
    } catch (error: any) {
      alert(`Failed to remove background: ${error.message}`);
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded">
        <p className="text-sm text-foreground mb-3">
          Remove the background from your image to create transparent PNGs.
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
        onClick={handleRemoveBackground}
        disabled={isRemovingBg || !selectedImage}
        className="w-full flex items-center justify-center gap-2"
      >
        {isRemovingBg ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Removing Background...
          </>
        ) : (
          <>
            <Scissors className="w-4 h-4" />
            Remove Background
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
        <strong>Free Client-Side Processing:</strong>
        <p className="mt-2">
          Uses @imgly/background-removal library to remove backgrounds entirely in your browser.
          No API key required, 100% free, processes locally using machine learning.
        </p>
      </div>
    </div>
  );
}
