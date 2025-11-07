'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2Icon, UploadIcon, XIcon, CheckCircleIcon, SparklesIcon, GlobeIcon } from 'lucide-react';
import { SystemPromptViewer } from '@/components/ui/SystemPromptViewer';
import { PromptTokenCounter } from '@/components/ui/PromptTokenCounter';
import { PieChartIcon } from '@/components/ui/PieChartIcon';
import { estimateTokenCount } from '@/lib/token-validator';

interface StyleKitGeneratorDialogProps {
  onGenerate: (config: {
    model: 'claude-haiku-4.5' | 'gpt-5' | 'gemini-2.5-flash';
    brandfetchData?: {
      colors?: string[];
      fonts?: string[];
      logos?: string[];
      url?: string;
    };
    stylePreferences?: string;
    industry?: string;
    images?: Array<{ url: string; filename: string; description?: string }>;
    stage?: 1 | 2 | 3 | 4 | 5 | 6; // Optional: generate only specific stage
  }) => Promise<void>;
  onClose: () => void;
  preSelectedStage?: 1 | 2 | 3 | 4 | 5 | 6; // NEW: Pre-select a stage when opening dialog
}

const SYSTEM_PROMPT = `You are an expert Elementor Style Kit customizer. Generate brand-specific customizations that will be merged into a complete template.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no explanations, no code blocks
2. Generate ONLY the customizations listed below (not a full Style Kit)
3. Use design best practices (hierarchy, spacing, accessibility)
4. Ensure consistent brand alignment across all elements

CUSTOMIZATIONS TO GENERATE:
{
  "title": "Brand Name Style Kit",
  "system_colors": [
    {"_id": "primary", "title": "Primary", "color": "#HEX"},
    {"_id": "secondary", "title": "Secondary", "color": "#HEX"},
    {"_id": "text", "title": "Text", "color": "#HEX"},
    {"_id": "accent", "title": "Accent", "color": "#HEX"}
  ],
  "primary_font": "Font Name",
  "secondary_font": "Font Name (can be same as primary)",
  "heading_color": "#HEX",
  "body_color": "#HEX",
  "link_color": "#HEX",
  "button_background": "#HEX",
  "button_text": "#HEX",
  "button_hover_background": "#HEX"
}

These customizations will be automatically merged into a complete ~180-field Style Kit template.

DESIGN RULES:
- H1 must be largest (48-64px), H6 smallest (14-16px)
- Line height should increase as font size decreases
- Use brand colors for primary/accent, neutral colors for text
- Button hover states should be 10-20% darker/lighter than base
- Form focus states should use accent/primary color
- Maintain consistent spacing patterns (multiples of 4 or 8)
- Ensure sufficient color contrast for accessibility (WCAG AA minimum)`;

export function StyleKitGeneratorDialog({
  onGenerate,
  onClose,
  preSelectedStage,
}: StyleKitGeneratorDialogProps) {
  const [model, setModel] = useState<'claude-haiku-4.5' | 'gpt-5' | 'gemini-2.5-flash'>('gpt-5');
  const [brandfetchUrl, setBrandfetchUrl] = useState('');
  const [isFetchingBrand, setIsFetchingBrand] = useState(false);
  const [brandfetchData, setBrandfetchData] = useState<any>(null);
  const [stylePreferences, setStylePreferences] = useState('');
  const [industry, setIndustry] = useState('');
  const [images, setImages] = useState<Array<{ url: string; filename: string; description?: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  // Token counting
  const [systemTokens, setSystemTokens] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [imageTokens, setImageTokens] = useState(0);

  // Removed auto-trigger - dialog now stays open for user to add context before generating

  // Calculate tokens
  useEffect(() => {
    setSystemTokens(estimateTokenCount(SYSTEM_PROMPT));
  }, []);

  useEffect(() => {
    const contextText = [
      brandfetchData ? `Colors: ${brandfetchData.colors?.map((c: any) => c.hex).join(', ')}` : '',
      brandfetchData ? `Fonts: ${brandfetchData.fonts?.map((f: any) => f.name).join(', ')}` : '',
      stylePreferences ? `Style: ${stylePreferences}` : '',
      industry ? `Industry: ${industry}` : '',
    ].filter(Boolean).join('\n');

    setInputTokens(estimateTokenCount(contextText));
  }, [brandfetchData, stylePreferences, industry]);

  useEffect(() => {
    // Each image is approximately 765 tokens for Claude
    setImageTokens(images.length * 765);
  }, [images]);

  const totalTokens = systemTokens + inputTokens + imageTokens;
  const contextLimit = model === 'gpt-5' ? 128000 : model === 'claude-haiku-4.5' ? 200000 : model === 'gemini-2.5-flash' ? 1000000 : 128000;

  const handleBrandfetchFetch = async () => {
    if (!brandfetchUrl.trim()) {
      alert('Please enter a URL or domain');
      return;
    }

    // Clean domain: remove protocol, www, trailing slashes, and paths
    const cleanDomain = brandfetchUrl
      .trim()
      .replace(/^https?:\/\//i, '') // Remove http:// or https://
      .replace(/^www\./i, '') // Remove www.
      .replace(/\/.*$/, ''); // Remove everything after first /

    setIsFetchingBrand(true);
    try {
      const response = await fetch('/api/brandfetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch brand data');
      }

      const data = await response.json();
      console.log('✅ Brandfetch data received:', data);
      setBrandfetchData(data);
    } catch (error: any) {
      console.error('Brandfetch error:', error);
      alert(`Failed to fetch brand data: ${error.message}`);
    } finally {
      setIsFetchingBrand(false);
    }
  };

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

  const handleGenerate = async (stage?: 1 | 2 | 3 | 4 | 5 | 6) => {
    console.log('📝 handleGenerate called with:', {
      stage,
      preSelectedStage,
      stylePreferences: stylePreferences.trim(),
      hasBrandfetchData: !!brandfetchData,
      imageCount: images.length
    });

    // Skip validation if this is an auto-triggered stage generation from inline button
    // Validate that user provided some context
    if (!stylePreferences.trim() && !brandfetchData && images.length === 0) {
      console.log('❌ Validation failed: no data provided');
      alert('Please provide style preferences, Brandfetch data, or upload images');
      return;
    }

    console.log('✅ Validation passed, starting generation...');
    setIsGenerating(true);
    try {
      // Transform brandfetchData to simple arrays (API expects strings, not objects)
      const transformedBrandfetchData = brandfetchData ? {
        colors: brandfetchData.colors?.map((c: any) => c.hex || c) || [],
        fonts: brandfetchData.fonts?.map((f: any) => f.name || f) || [],
        logos: brandfetchData.logos?.flatMap((logo: any) =>
          logo.formats ? logo.formats.map((fmt: any) => fmt.src) : [logo]
        ) || [],
      } : undefined;

      console.log('📤 Calling onGenerate with:', {
        model,
        hasBrandfetchData: !!transformedBrandfetchData,
        hasStylePreferences: !!stylePreferences,
        hasIndustry: !!industry,
        imageCount: images.length,
        stage
      });

      await onGenerate({
        model,
        brandfetchData: transformedBrandfetchData,
        stylePreferences: stylePreferences || undefined,
        industry: industry || undefined,
        images: images.length > 0 ? images : undefined,
        stage, // Pass the optional stage parameter
      });

      console.log('✅ onGenerate completed successfully');
    } catch (error) {
      console.error('❌ Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const fullPrompt = [
    brandfetchData ? `BRANDFETCH DATA:\nColors: ${brandfetchData.colors?.map((c: any) => c.hex).join(', ')}\nFonts: ${brandfetchData.fonts?.map((f: any) => f.name).join(', ')}` : '',
    stylePreferences ? `STYLE PREFERENCES:\n${stylePreferences}` : '',
    industry ? `INDUSTRY: ${industry}` : '',
    images.length > 0 ? `IMAGES: ${images.length} reference images provided` : '',
  ].filter(Boolean).join('\n\n');

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
          maxWidth: '700px',
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
            <SparklesIcon size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              AI-Powered Style Kit Generator
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Token Counter with System Prompt Viewer */}
            <SystemPromptViewer
              input={fullPrompt}
              systemPrompt={SYSTEM_PROMPT}
              selectedModel={model}
              contextLimit={contextLimit}
              systemTokens={systemTokens}
              inputTokens={inputTokens}
              conversationTokens={0}
              totalTokens={totalTokens}
              attachedImages={images.map(img => ({ url: img.url, filename: img.filename }))}
              trigger={
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: totalTokens > contextLimit * 0.9 ? 'rgba(239, 68, 68, 0.1)' : 'var(--muted)',
                    color: totalTokens > contextLimit * 0.9 ? '#ef4444' : 'var(--muted-foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <PieChartIcon size={14} />
                  <span>{totalTokens.toLocaleString()} tokens</span>
                </button>
              }
            />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XIcon size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Model Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              AI Model
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: `2px solid ${model === 'claude-haiku-4.5' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: model === 'claude-haiku-4.5' ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="radio"
                  name="model"
                  value="claude-haiku-4.5"
                  checked={model === 'claude-haiku-4.5'}
                  onChange={() => setModel('claude-haiku-4.5')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>Claude Haiku 4.5</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Balanced quality
                  </div>
                </div>
              </label>
              <label
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: `2px solid ${model === 'gpt-5' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: model === 'gpt-5' ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="radio"
                  name="model"
                  value="gpt-5"
                  checked={model === 'gpt-5'}
                  onChange={() => setModel('gpt-5')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>GPT-5</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Highest quality
                  </div>
                </div>
              </label>
              <label
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: `2px solid ${model === 'gemini-2.5-flash' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: model === 'gemini-2.5-flash' ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="radio"
                  name="model"
                  value="gemini-2.5-flash"
                  checked={model === 'gemini-2.5-flash'}
                  onChange={() => setModel('gemini-2.5-flash')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>Gemini 2.5 Flash</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Fast & affordable
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Brandfetch URL Input */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Brandfetch URL (Optional)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={brandfetchUrl}
                onChange={(e) => setBrandfetchUrl(e.target.value)}
                placeholder="example.com (without http:// or https://)"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                disabled={isFetchingBrand || isGenerating}
              />
              <Button
                onClick={handleBrandfetchFetch}
                disabled={!brandfetchUrl.trim() || isFetchingBrand || isGenerating}
                style={{ minWidth: '100px' }}
              >
                {isFetchingBrand ? (
                  <>
                    <Loader2Icon size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                    Fetching...
                  </>
                ) : (
                  <>
                    <GlobeIcon size={16} style={{ marginRight: '8px' }} />
                    Fetch
                  </>
                )}
              </Button>
            </div>
            {brandfetchData && (
              <div style={{ marginTop: '12px', padding: '16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircleIcon size={18} style={{ color: '#10b981' }} />
                  <span>Brand Data Retrieved</span>
                </div>

                {/* Brand Info */}
                {brandfetchData.name && (
                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{brandfetchData.name}</div>
                    {brandfetchData.description && (
                      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{brandfetchData.description}</div>
                    )}
                  </div>
                )}

                {/* Colors */}
                {brandfetchData.colors && brandfetchData.colors.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                      Colors ({brandfetchData.colors.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                      {brandfetchData.colors.slice(0, 8).map((color: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div
                            style={{
                              width: '100%',
                              height: '48px',
                              borderRadius: '6px',
                              backgroundColor: typeof color === 'string' ? color : color.hex,
                              border: '1px solid var(--border)',
                            }}
                          />
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', textAlign: 'center' }}>
                            {typeof color === 'string' ? color : color.hex}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fonts */}
                {brandfetchData.fonts && brandfetchData.fonts.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                      Fonts ({brandfetchData.fonts.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {brandfetchData.fonts.slice(0, 4).map((font: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--muted)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: typeof font === 'string' ? font : font.name,
                          }}
                        >
                          {typeof font === 'string' ? font : font.name}
                          {typeof font !== 'string' && font.weights && (
                            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: '8px' }}>
                              • Weights: {font.weights.join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logos */}
                {brandfetchData.logos && brandfetchData.logos.length > 0 && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                      Logos ({brandfetchData.logos.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {brandfetchData.logos.slice(0, 4).map((logo: any, idx: number) => {
                        // Handle both string URLs and logo objects
                        const logoSrc = typeof logo === 'string' ? logo : logo.formats?.[0]?.src || logo.src;
                        const logoTheme = typeof logo === 'string' ? 'light' : logo.theme;

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              backgroundColor: logoTheme === 'dark' ? '#1a1a1a' : '#f9fafb',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '60px',
                            }}
                          >
                            <img
                              src={logoSrc}
                              alt={`Logo ${idx + 1}`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '48px',
                                objectFit: 'contain',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Style Preferences */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Style Preferences
            </label>
            <Textarea
              value={stylePreferences}
              onChange={(e) => setStylePreferences(e.target.value)}
              placeholder="Describe your desired style... (e.g., 'Modern, minimalist design with bold typography and vibrant accent colors')"
              rows={4}
              style={{
                width: '100%',
                resize: 'vertical',
              }}
              disabled={isGenerating}
            />
          </div>

          {/* Industry */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Industry (Optional)
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Tech, Healthcare, E-commerce"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
              }}
              disabled={isGenerating}
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
                    disabled={isAnalyzing || isGenerating}
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

          {/* Generate Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Individual Stage Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              padding: '12px',
              backgroundColor: 'var(--muted)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ gridColumn: '1 / -1', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  Generate Individual Stages
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Test independently or regenerate specific sections
                </p>
              </div>
              <button
                onClick={() => handleGenerate(1)}
                disabled={(!stylePreferences.trim() && !brandfetchData && images.length === 0) || isGenerating || isAnalyzing}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: preSelectedStage === 1 ? 'var(--primary)' : (isGenerating ? 'var(--muted)' : 'var(--background)'),
                  color: preSelectedStage === 1 ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: preSelectedStage === 1 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {preSelectedStage === 1 && '✨ '} 🎨 Stage 1: Colors
              </button>
              <button
                onClick={() => handleGenerate(2)}
                disabled={(!stylePreferences.trim() && !brandfetchData && images.length === 0) || isGenerating || isAnalyzing}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: preSelectedStage === 2 ? 'var(--primary)' : (isGenerating ? 'var(--muted)' : 'var(--background)'),
                  color: preSelectedStage === 2 ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: preSelectedStage === 2 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {preSelectedStage === 2 && '✨ '}🔤 Stage 2: Fonts
              </button>
              <button
                onClick={() => handleGenerate(3)}
                disabled={(!stylePreferences.trim() && !brandfetchData && images.length === 0) || isGenerating || isAnalyzing}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: preSelectedStage === 3 ? 'var(--primary)' : (isGenerating ? 'var(--muted)' : 'var(--background)'),
                  color: preSelectedStage === 3 ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: preSelectedStage === 3 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {preSelectedStage === 3 && '✨ '}📐 Stage 3: Headings
              </button>
              <button
                onClick={() => handleGenerate(4)}
                disabled={(!stylePreferences.trim() && !brandfetchData && images.length === 0) || isGenerating || isAnalyzing}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: preSelectedStage === 4 ? 'var(--primary)' : (isGenerating ? 'var(--muted)' : 'var(--background)'),
                  color: preSelectedStage === 4 ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: preSelectedStage === 4 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {preSelectedStage === 4 && '✨ '}🎛️ Stage 4: Components
              </button>
              <button
                onClick={() => handleGenerate(5)}
                disabled={(!stylePreferences.trim() && !brandfetchData && images.length === 0) || isGenerating || isAnalyzing}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: preSelectedStage === 5 ? 'var(--primary)' : (isGenerating ? 'var(--muted)' : 'var(--background)'),
                  color: preSelectedStage === 5 ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: preSelectedStage === 5 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {preSelectedStage === 5 && '✨ '}🖼️ Stage 5: Images & Layout
              </button>
              <button
                onClick={() => handleGenerate(6)}
                disabled={(!stylePreferences.trim() && !brandfetchData && images.length === 0) || isGenerating || isAnalyzing}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: preSelectedStage === 6 ? 'var(--primary)' : (isGenerating ? 'var(--muted)' : 'var(--background)'),
                  color: preSelectedStage === 6 ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: preSelectedStage === 6 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {preSelectedStage === 6 && '✨ '}🎯 Stage 6: Interactive States
              </button>
            </div>

            {/* Full Generation Button */}
            <Button
              onClick={() => handleGenerate(preSelectedStage)}
              disabled={(!stylePreferences.trim() && !brandfetchData && images.length === 0) || isGenerating || isAnalyzing || images.some(img => !img.description)}
              style={{ width: '100%', height: '44px', fontSize: '15px', fontWeight: 600 }}
            >
              {isGenerating ? (
                <>
                  <Loader2Icon size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon size={18} style={{ marginRight: '8px' }} />
                  {preSelectedStage ? `Generate Stage ${preSelectedStage}` : 'Generate Complete Style Kit (All 6 Stages)'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
