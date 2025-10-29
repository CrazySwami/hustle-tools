'use client';

import { useState } from 'react';
import { Edit3, Loader2, Download, ExternalLink, ImageIcon } from 'lucide-react';

interface EditImageResult {
  prompt: string;
  referenceImageUrl: string;
  editType: string;
  status: string;
  message: string;
}

export function EditImageWidget({ data }: { data: EditImageResult }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch('/api/edit-image-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.prompt,
          referenceImageUrl: data.referenceImageUrl,
          editType: data.editType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEditedImageUrl(result.imageUrl);
      } else {
        setError(result.error || 'Failed to edit image');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsEditing(false);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `edited-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert('Failed to download image');
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1">Edit Image</h3>
          <p className="text-xs text-muted-foreground">
            Using Google Gemini Flash (Imagen 3)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Original Image */}
        <div>
          <p className="text-xs font-medium mb-2">Original Image:</p>
          <div className="border border-border rounded overflow-hidden">
            <img
              src={data.referenceImageUrl}
              alt="Original"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
        </div>

        {/* Edit Instructions */}
        <div className="p-3 bg-muted rounded text-sm">
          <strong>Instructions:</strong> {data.prompt}
        </div>

        {/* Edit Type */}
        <div className="p-2 bg-muted/50 rounded text-xs">
          <strong>Edit Type:</strong> {data.editType}
        </div>

        {/* Edit Button */}
        {!editedImageUrl && (
          <button
            onClick={handleEdit}
            disabled={isEditing}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isEditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Editing...
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Edit Image
              </>
            )}
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Edited Image Display */}
        {editedImageUrl && (
          <div className="space-y-3">
            <p className="text-xs font-medium">Edited Result:</p>
            <div className="border border-border rounded overflow-hidden">
              <img
                src={editedImageUrl}
                alt="Edited"
                className="w-full h-auto"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadImage(editedImageUrl)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <a
                href={editedImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </div>

            <button
              onClick={() => {
                setEditedImageUrl(null);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
            >
              Edit Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
