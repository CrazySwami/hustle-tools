'use client';

import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ImageProvider = 'openai' | 'gemini';
type OpenAIModel = 'dall-e-3' | 'gpt-image-1';
type GeminiModel = 'gemini-2.0-flash-exp' | 'gemini-2.5-flash-image-preview';
type ImageSize = '1024x1024' | '1536x1536' | '1792x1024' | '1024x1792';
type ImageQuality = 'low' | 'standard' | 'hd';
type ImageStyle = 'vivid' | 'natural';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface GenerateTabProps {
  setSelectedImage: (url: string) => void;
  addToHistory: (url: string, label: string) => void;
}

export function GenerateTab({ setSelectedImage, addToHistory }: GenerateTabProps) {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<ImageProvider>('openai');
  const [openaiModel, setOpenaiModel] = useState<OpenAIModel>('gpt-image-1');
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-2.5-flash-image-preview');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [style, setStyle] = useState<ImageStyle>('vivid');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const endpoint = provider === 'openai'
        ? '/api/generate-image-openai'
        : '/api/generate-image-gemini';

      const body = provider === 'openai'
        ? { prompt, model: openaiModel, size, quality, style }
        : { prompt, model: geminiModel, aspectRatio, numberOfImages: 1 };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedImage(data.imageUrl);
        addToHistory(data.imageUrl, 'Generated');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Failed to generate image: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium mb-2">Provider</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider('openai')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              provider === 'openai'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            OpenAI
          </button>
          <button
            onClick={() => setProvider('gemini')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              provider === 'gemini'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Gemini
          </button>
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Prompt</Label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground min-h-[120px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleGenerate();
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Press Cmd/Ctrl + Enter to generate
        </p>
      </div>

      {provider === 'openai' && (
        <>
          <div>
            <Label className="block text-sm font-medium mb-2">Model</Label>
            <select
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value as OpenAIModel)}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
            >
              <option value="gpt-image-1">GPT Image 1 (Newest)</option>
              <option value="dall-e-3">DALL-E 3 (Classic)</option>
            </select>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Size</Label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as ImageSize)}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
            >
              <option value="1024x1024">Square (1024×1024)</option>
              {openaiModel === 'gpt-image-1' && (
                <option value="1536x1536">Large Square (1536×1536)</option>
              )}
              <option value="1792x1024">Landscape (1792×1024)</option>
              <option value="1024x1792">Portrait (1024×1792)</option>
            </select>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Quality</Label>
            <div className="grid grid-cols-3 gap-2">
              {openaiModel === 'gpt-image-1' && (
                <button
                  onClick={() => setQuality('low')}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    quality === 'low'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Low
                </button>
              )}
              <button
                onClick={() => setQuality('standard')}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  quality === 'standard'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {openaiModel === 'gpt-image-1' ? 'Medium' : 'Standard'}
              </button>
              <button
                onClick={() => setQuality('hd')}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  quality === 'hd'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {openaiModel === 'gpt-image-1' ? 'High' : 'HD'}
              </button>
            </div>
          </div>

          {openaiModel === 'dall-e-3' && (
            <div>
              <Label className="block text-sm font-medium mb-2">Style</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setStyle('vivid')}
                  className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
                    style === 'vivid'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Vivid
                </button>
                <button
                  onClick={() => setStyle('natural')}
                  className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
                    style === 'natural'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Natural
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {provider === 'gemini' && (
        <>
          <div>
            <Label className="block text-sm font-medium mb-2">Model</Label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
            >
              <option value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash Image (Recommended)</option>
              <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental</option>
            </select>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Aspect Ratio</Label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
            >
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="4:3">Classic Landscape (4:3)</option>
              <option value="3:4">Classic Portrait (3:4)</option>
            </select>
          </div>
        </>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Image
          </>
        )}
      </Button>
    </div>
  );
}
