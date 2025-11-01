'use client';

import { useState, useRef } from 'react';
import { Edit3, Loader2, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface EditTabProps {
  selectedImage: string | null;
  setSelectedImage: (url: string) => void;
  addToHistory: (url: string, label: string) => void;
}

export function EditTab({ selectedImage, setSelectedImage, addToHistory }: EditTabProps) {
  const [editPrompt, setEditPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setReferenceImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !referenceImage) return;

    setIsEditing(true);
    try {
      const response = await fetch('/api/edit-image-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt,
          referenceImageUrl: referenceImage,
          editType: 'general',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedImage(data.imageUrl);
        addToHistory(data.imageUrl, 'Edited');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Failed to edit image: ${error.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium mb-2">Reference Image</Label>
        <div className="border-2 border-dashed border-border rounded p-4 text-center">
          {referenceImage ? (
            <div className="relative">
              <img
                src={referenceImage}
                alt="Reference"
                className="max-w-full h-auto rounded"
              />
              <button
                onClick={() => setReferenceImage(null)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload an image to edit
              </p>
              <Button
                onClick={() => editFileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Choose File
              </Button>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {selectedImage && (
                <Button
                  onClick={() => setReferenceImage(selectedImage)}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  Use Selected
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Edit Instructions</Label>
        <textarea
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="Describe how you want to edit the image..."
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground min-h-[120px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleEdit();
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Press Cmd/Ctrl + Enter to edit
        </p>
      </div>

      <Button
        onClick={handleEdit}
        disabled={isEditing || !editPrompt.trim() || !referenceImage}
        className="w-full flex items-center justify-center gap-2"
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
      </Button>

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
        <strong>Note:</strong> Image editing uses Google Gemini Flash (Imagen 3) via AI Gateway for AI-powered image-to-image modifications.
      </div>
    </div>
  );
}
