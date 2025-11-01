'use client';

import { useRef } from 'react';
import { Upload, Download, Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  selectedImage: string | null;
  setSelectedImage: (url: string | null) => void;
  imageHistory: Array<{ url: string; label: string }>;
  addToHistory: (url: string, label: string) => void;
}

export function ImagePreview({
  selectedImage,
  setSelectedImage,
  imageHistory,
  addToHistory,
}: ImagePreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      addToHistory(result, 'Uploaded');
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert('Failed to download image');
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Image URL copied to clipboard!');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main Preview Area */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="max-w-5xl mx-auto h-full">
          {selectedImage ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1 bg-background rounded-lg shadow-lg p-4 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Selected preview"
                  className="max-w-full max-h-full h-auto rounded object-contain"
                />
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button
                  onClick={() => downloadImage(selectedImage)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  onClick={() => copyImageUrl(selectedImage)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy URL
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload New
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Wand2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Image Selected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate an image or upload one to get started
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image History Gallery */}
      {imageHistory.length > 0 && (
        <div className="border-t border-border bg-background p-4 h-48 overflow-hidden">
          <h3 className="text-sm font-medium mb-3">Image History ({imageHistory.length})</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {imageHistory.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(img.url)}
                className={`cursor-pointer rounded overflow-hidden border-2 transition-all hover:scale-105 flex-shrink-0 ${
                  selectedImage === img.url
                    ? 'border-primary shadow-lg'
                    : 'border-border'
                }`}
                style={{ width: '120px' }}
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full h-24 object-cover"
                  title={img.label}
                />
                <div className="px-2 py-1 bg-muted">
                  <p className="text-xs text-muted-foreground truncate">
                    {img.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
