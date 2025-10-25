'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2Icon, UploadIcon, XIcon, CheckCircleIcon, FileCodeIcon } from 'lucide-react';

interface HTMLGeneratorDialogProps {
  initialDescription?: string;
  initialImages?: Array<{ url: string; filename: string }>;
  onGenerate: (description: string, images: Array<{ url: string; filename: string; description?: string }>, mode?: 'section' | 'widget') => Promise<void>;
  onClose: () => void;
}

export function HTMLGeneratorDialog({
  initialDescription = '',
  initialImages = [],
  onGenerate,
  onClose,
}: HTMLGeneratorDialogProps) {
  const [description, setDescription] = useState(initialDescription);
  const [images, setImages] = useState<Array<{ url: string; filename: string; description?: string }>>(initialImages);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'section' | 'widget'>('section');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setIsAnalyzing(true);

    try {
      for (const file of filesToProcess) {
        // Convert to base64
        const reader = new FileReader();
        const imageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Add image with pending analysis
        const newImage = {
          url: imageUrl,
          filename: file.name,
          description: undefined,
        };
        setImages(prev => [...prev, newImage]);

        // Analyze image
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });

        const { description: imageDescription } = await response.json();

        // Update image with description
        setImages(prev =>
          prev.map(img =>
            img.url === imageUrl
              ? { ...img, description: imageDescription }
              : img
          )
        );
      }
    } catch (error) {
      console.error('Image analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    try {
      await onGenerate(description, images, mode);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileCodeIcon size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              {mode === 'section' ? 'Generate HTML Section' : 'Generate Elementor Widget'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon size={20} />
          </Button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Mode Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Generation Mode
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: `2px solid ${mode === 'section' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: mode === 'section' ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="radio"
                  name="mode"
                  value="section"
                  checked={mode === 'section'}
                  onChange={() => setMode('section')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>HTML Section</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Generate standalone HTML/CSS/JS
                  </div>
                </div>
              </label>
              <label
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: `2px solid ${mode === 'widget' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: mode === 'widget' ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="radio"
                  name="mode"
                  value="widget"
                  checked={mode === 'widget'}
                  onChange={() => setMode('widget')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>Elementor Widget</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Generate PHP widget class
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Description Input */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                mode === 'section'
                  ? "Describe what you want to build... (e.g., 'A hero section with a gradient background, centered heading, subtitle, and two CTA buttons')"
                  : "Describe the widget you want to create... (e.g., 'A pricing table widget with customizable columns, pricing tiers, feature lists, and CTA buttons')"
              }
              rows={4}
              style={{
                width: '100%',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Reference Images (Optional, max 3)
            </label>

            {/* Image Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid var(--border)',
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.filename}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {!image.description && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Loader2Icon size={24} className="animate-spin" style={{ color: 'white' }} />
                    </div>
                  )}
                  {image.description && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                      }}
                    >
                      <CheckCircleIcon size={20} style={{ color: '#10b981' }} />
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: 'rgba(0, 0, 0, 0.7)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <XIcon size={16} style={{ color: 'white' }} />
                  </button>
                </div>
              ))}

              {/* Upload Slot */}
              {images.length < 3 && (
                <label
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    border: '2px dashed var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: 'var(--muted)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--muted)';
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={isAnalyzing}
                  />
                  {isAnalyzing ? (
                    <Loader2Icon size={24} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                  ) : (
                    <>
                      <UploadIcon size={24} style={{ color: 'var(--muted-foreground)', marginBottom: '8px' }} />
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        Upload
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            {isAnalyzing && (
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                Analyzing images with Claude Haiku 4.5...
              </p>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating || isAnalyzing || images.some(img => !img.description)}
            style={{ width: '100%' }}
          >
            {isGenerating ? (
              <>
                <Loader2Icon size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                Generating...
              </>
            ) : mode === 'section' ? (
              'Generate HTML/CSS/JS'
            ) : (
              'Generate Elementor Widget'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
