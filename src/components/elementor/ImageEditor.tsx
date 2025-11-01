'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Wand2, Edit3, Scissors, Search, Download, Copy, Loader2, CheckCircle, XCircle, ExternalLink, Image as ImageIcon, Video } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';

type ImageProvider = 'openai' | 'gemini';
type OpenAIModel = 'dall-e-3' | 'gpt-image-1';
type GeminiModel = 'gemini-2.0-flash-exp' | 'gemini-2.5-flash-exp';
type ImageSize = '1024x1024' | '1536x1536' | '1792x1024' | '1024x1792';
type ImageQuality = 'low' | 'standard' | 'hd';
type ImageStyle = 'vivid' | 'natural';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
type StockProvider = 'pexels' | 'unsplash';
type PexelsMediaType = 'photos' | 'videos';
type PexelsOrientation = 'landscape' | 'portrait' | 'square';
type UnsplashOrientation = 'landscape' | 'portrait' | 'squarish';

interface GeneratedImage {
  url: string;
  prompt: string;
  provider: ImageProvider;
  timestamp: number;
  revisedPrompt?: string;
}

interface ReverseSearchResult {
  bestGuess?: string;
  fullMatchingImages?: Array<{ url: string }>;
  partialMatchingImages?: Array<{ url: string }>;
  pagesWithMatchingImages?: Array<{ url: string; title: string }>;
  visuallySimilarImages?: Array<{ url: string }>;
  labels?: Array<{ description: string; score: number }>;
  googleLensUrl?: string;
  message?: string;
}

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    landscape: string;
    portrait: string;
  };
  photographer: string;
  photographerUrl: string;
  url: string;
  alt: string;
}

interface PexelsVideo {
  id: number;
  image: string;
  duration: number;
  videoFiles: Array<{
    quality: string;
    link: string;
    width: number;
    height: number;
  }>;
  photographer: string;
  photographerUrl: string;
  url: string;
}

interface ImageEditorProps {
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
}

export function ImageEditor({ chatVisible, setChatVisible, tabBarVisible, setTabBarVisible }: ImageEditorProps = {}) {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generation state
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'background' | 'search' | 'stock'>('generate');
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<ImageProvider>('openai');
  const [openaiModel, setOpenaiModel] = useState<OpenAIModel>('gpt-image-1');
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-2.5-flash-image-preview');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [style, setStyle] = useState<ImageStyle>('vivid');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Edit state
  const [editPrompt, setEditPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Background removal state
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovedImage, setBgRemovedImage] = useState<string | null>(null);

  // Reverse search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ReverseSearchResult | null>(null);

  // Stock media search state
  const [stockProvider, setStockProvider] = useState<StockProvider>('pexels');
  const [stockQuery, setStockQuery] = useState('');
  const [pexelsMediaType, setPexelsMediaType] = useState<PexelsMediaType>('photos');
  const [pexelsOrientation, setPexelsOrientation] = useState<PexelsOrientation>('landscape');
  const [unsplashOrientation, setUnsplashOrientation] = useState<UnsplashOrientation>('landscape');
  const [isStockSearching, setIsStockSearching] = useState(false);
  const [pexelsPhotos, setPexelsPhotos] = useState<PexelsPhoto[]>([]);
  const [pexelsVideos, setPexelsVideos] = useState<PexelsVideo[]>([]);
  const [unsplashPhotos, setUnsplashPhotos] = useState<any[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalResults, setStockTotalResults] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Load image from sessionStorage if coming from image-alterations page
  useEffect(() => {
    const storedImageUrl = sessionStorage.getItem('editorImageUrl');
    if (storedImageUrl) {
      setSelectedImage(storedImageUrl);
      setActiveTab('edit'); // Switch to edit tab
      sessionStorage.removeItem('editorImageUrl'); // Clear after loading
    }
  }, []);

  // Handle image generation
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
        const newImage: GeneratedImage = {
          url: data.imageUrl,
          prompt,
          provider,
          timestamp: Date.now(),
          revisedPrompt: data.revisedPrompt,
        };
        setGeneratedImages([newImage, ...generatedImages]);
        setSelectedImage(data.imageUrl);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Failed to generate image: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image editing
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
        const editedImage: GeneratedImage = {
          url: data.imageUrl,
          prompt: editPrompt,
          provider: 'gemini',
          timestamp: Date.now(),
        };
        setGeneratedImages([editedImage, ...generatedImages]);
        setSelectedImage(data.imageUrl);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Failed to edit image: ${error.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  // Handle background removal (client-side, no API needed)
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
        setBgRemovedImage(resultUrl);
        setSelectedImage(resultUrl);

        const bgRemovedImg: GeneratedImage = {
          url: resultUrl,
          prompt: 'Background removed',
          provider: 'openai', // Placeholder
          timestamp: Date.now(),
        };
        setGeneratedImages([bgRemovedImg, ...generatedImages]);
      };
      reader.readAsDataURL(resultBlob);
    } catch (error: any) {
      alert(`Failed to remove background: ${error.message}`);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Handle reverse image search
  const handleReverseSearch = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/reverse-image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: selectedImage }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        setActiveTab('search');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Failed to search: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle stock media search (Pexels or Unsplash)
  const handleStockSearch = async (page: number = 1) => {
    if (!stockQuery.trim()) return;

    setIsStockSearching(true);
    try {
      if (stockProvider === 'pexels') {
        const response = await fetch('/api/search-pexels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: stockQuery,
            type: pexelsMediaType,
            page,
            perPage: 20,
            orientation: pexelsOrientation,
          }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.type === 'photos') {
            if (page === 1) {
              setPexelsPhotos(data.results);
            } else {
              setPexelsPhotos([...pexelsPhotos, ...data.results]);
            }
          } else {
            if (page === 1) {
              setPexelsVideos(data.results);
            } else {
              setPexelsVideos([...pexelsVideos, ...data.results]);
            }
          }
          setStockPage(page);
          setStockTotalResults(data.totalResults);
        } else {
          alert(`Error: ${data.error}`);
        }
      } else {
        // Unsplash
        const response = await fetch('/api/search-unsplash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: stockQuery,
            page,
            perPage: 20,
            orientation: unsplashOrientation,
          }),
        });

        const data = await response.json();

        if (data.success) {
          if (page === 1) {
            setUnsplashPhotos(data.results);
          } else {
            setUnsplashPhotos([...unsplashPhotos, ...data.results]);
          }
          setStockPage(page);
          setStockTotalResults(data.totalResults);
        } else {
          alert(`Error: ${data.error}`);
        }
      }
    } catch (error: any) {
      alert(`Failed to search ${stockProvider}: ${error.message}`);
    } finally {
      setIsStockSearching(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (isEdit) {
        setReferenceImage(result);
      } else {
        setSelectedImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Download image
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

  // Copy image URL
  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Image URL copied to clipboard!');
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-background relative">
      {/* Left Panel - Tools */}
      <div className="w-full md:w-80 border-r border-border flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-border p-2 md:p-0">
          {isMobile ? (
            /* Mobile: Dropdown */
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full px-4 py-3 text-sm font-medium border-2 border-border rounded-lg bg-background text-foreground cursor-pointer outline-none shadow-sm"
            >
              <option value="generate">🪄 Generate Image</option>
              <option value="edit">✏️ Edit Image</option>
              <option value="background">✂️ Remove Background</option>
              <option value="search">🔍 Reverse Search</option>
              <option value="stock">📸 Stock Photos</option>
            </select>
          ) : (
            /* Desktop: Buttons */
            <div className="flex">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'generate'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <Wand2 className="inline-block w-4 h-4 mr-2" />
                Generate
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <Edit3 className="inline-block w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setActiveTab('background')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'background'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <Scissors className="inline-block w-4 h-4 mr-2" />
                BG Remove
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <Search className="inline-block w-4 h-4 mr-2" />
                Search
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'stock'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <ImageIcon className="inline-block w-4 h-4 mr-2" />
                Stock
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
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
                    Gemini (AI Gateway)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prompt</label>
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
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <select
                      value={openaiModel}
                      onChange={(e) => setOpenaiModel(e.target.value as OpenAIModel)}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                    >
                      <option value="gpt-image-1">GPT Image 1 (Newest, ~$0.02-0.19/img)</option>
                      <option value="dall-e-3">DALL-E 3 (Classic, ~$0.04-0.08/img)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Size</label>
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
                    <label className="block text-sm font-medium mb-2">Quality</label>
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
                      <label className="block text-sm font-medium mb-2">Style</label>
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
                    <label className="block text-sm font-medium mb-2">Model</label>
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
                    <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
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

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </button>
            </div>
          )}

          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reference Image</label>
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
                      <button
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
                      >
                        Choose File
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                      {selectedImage && (
                        <button
                          onClick={() => setReferenceImage(selectedImage)}
                          className="ml-2 px-4 py-2 bg-muted text-foreground text-sm rounded hover:bg-muted/80"
                        >
                          Use Selected
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Edit Instructions</label>
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

              <button
                onClick={handleEdit}
                disabled={isEditing || !editPrompt.trim() || !referenceImage}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Note:</strong> Image editing uses Google Gemini Flash (Imagen 3) via AI Gateway for AI-powered image-to-image modifications.
              </div>
            </div>
          )}

          {/* Background Removal Tab */}
          {activeTab === 'background' && (
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

              <button
                onClick={handleRemoveBackground}
                disabled={isRemovingBg || !selectedImage}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </button>

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Free Client-Side Processing:</strong>
                <p className="mt-2">
                  Uses @imgly/background-removal library to remove backgrounds entirely in your browser.
                  No API key required, 100% free, processes locally using machine learning.
                </p>
              </div>
            </div>
          )}

          {/* Reverse Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-foreground mb-3">
                  Find similar images or identify objects in your image.
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

              <button
                onClick={handleReverseSearch}
                disabled={isSearching || !selectedImage}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Reverse Image Search
                  </>
                )}
              </button>

              {searchResults && (
                <div className="mt-4 space-y-3">
                  {searchResults.bestGuess && (
                    <div className="p-3 bg-primary/10 rounded">
                      <p className="text-sm font-medium">Best Guess:</p>
                      <p className="text-sm text-foreground mt-1">{searchResults.bestGuess}</p>
                    </div>
                  )}

                  {searchResults.labels && searchResults.labels.length > 0 && (
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium mb-2">Labels:</p>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.labels.map((label, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-primary/20 text-xs rounded"
                          >
                            {label.description} ({Math.round(label.score * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.visuallySimilarImages && searchResults.visuallySimilarImages.length > 0 && (
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium mb-2">
                        Similar Images ({searchResults.visuallySimilarImages.length}):
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {searchResults.visuallySimilarImages.map((img: any, i: number) => (
                          <a
                            key={i}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative"
                          >
                            <img
                              src={img.url}
                              alt={img.title || 'Similar image'}
                              className="w-full h-24 object-cover rounded border border-border group-hover:border-primary transition-colors"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {img.title && (
                              <p className="text-xs mt-1 truncate text-muted-foreground">
                                {img.title}
                              </p>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.totalResults !== undefined && (
                    <div className="p-3 bg-primary/10 rounded">
                      <p className="text-sm text-foreground">
                        <strong>Total Results:</strong> {searchResults.totalResults}
                      </p>
                    </div>
                  )}

                  {searchResults.googleLensUrl && (
                    <a
                      href={searchResults.googleLensUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Google Lens
                    </a>
                  )}

                  {searchResults.message && (
                    <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                      {searchResults.message}
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Reverse Image Search:</strong>
                <p className="mt-2">
                  Uses <strong>SerpAPI</strong> for Google reverse image search.
                  Returns similar images, visual matches, and related pages.
                </p>
                <p className="mt-2">
                  Set <code className="bg-muted-foreground/10 px-1 rounded">SERPAPI_API_KEY</code> in .env.local
                </p>
                <p className="mt-2 text-xs">
                  Fallback: Opens Google Lens for manual search if SerpAPI is not configured.
                </p>
              </div>
            </div>
          )}

          {/* Stock Media Tab */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stock Provider</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setStockProvider('pexels'); setPexelsPhotos([]); setPexelsVideos([]); setUnsplashPhotos([]); }}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                      stockProvider === 'pexels'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    Pexels
                  </button>
                  <button
                    onClick={() => { setStockProvider('unsplash'); setPexelsPhotos([]); setPexelsVideos([]); setUnsplashPhotos([]); }}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                      stockProvider === 'unsplash'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    Unsplash
                  </button>
                </div>
              </div>

              {stockProvider === 'pexels' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Media Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPexelsMediaType('photos'); setPexelsPhotos([]); setPexelsVideos([]); }}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                        pexelsMediaType === 'photos'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <ImageIcon className="inline-block w-4 h-4 mr-2" />
                      Photos
                    </button>
                    <button
                      onClick={() => { setPexelsMediaType('videos'); setPexelsPhotos([]); setPexelsVideos([]); }}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                        pexelsMediaType === 'videos'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Video className="inline-block w-4 h-4 mr-2" />
                      Videos
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Search Query</label>
                <textarea
                  value={stockQuery}
                  onChange={(e) => setStockQuery(e.target.value)}
                  placeholder={`Search ${stockProvider === 'pexels' ? `Pexels for ${pexelsMediaType}` : 'Unsplash for photos'}...`}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-foreground min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleStockSearch(1);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Press Cmd/Ctrl + Enter to search
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Orientation</label>
                {stockProvider === 'pexels' ? (
                  <select
                    value={pexelsOrientation}
                    onChange={(e) => setPexelsOrientation(e.target.value as PexelsOrientation)}
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                    <option value="square">Square</option>
                  </select>
                ) : (
                  <select
                    value={unsplashOrientation}
                    onChange={(e) => setUnsplashOrientation(e.target.value as UnsplashOrientation)}
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                    <option value="squarish">Squarish</option>
                  </select>
                )}
              </div>

              <button
                onClick={() => handleStockSearch(1)}
                disabled={isStockSearching || !stockQuery.trim()}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isStockSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search {stockProvider === 'pexels' ? 'Pexels' : 'Unsplash'}
                  </>
                )}
              </button>

              {(stockProvider === 'pexels' && (pexelsPhotos.length > 0 || pexelsVideos.length > 0)) && (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 rounded">
                    <p className="text-sm">
                      <strong>Results:</strong> {stockTotalResults} {pexelsMediaType} found
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {pexelsMediaType === 'photos' && pexelsPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative cursor-pointer"
                        onClick={() => setSelectedImage(photo.src.large)}
                      >
                        <img
                          src={photo.src.medium}
                          alt={photo.alt}
                          className="w-full h-32 object-cover rounded border border-border group-hover:border-primary transition-colors"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b">
                          <p className="text-xs text-white truncate">
                            by {photo.photographer}
                          </p>
                        </div>
                      </div>
                    ))}

                    {pexelsMediaType === 'videos' && pexelsVideos.map((video) => (
                      <div
                        key={video.id}
                        className="group relative cursor-pointer"
                        onClick={() => {
                          const hdVideo = video.videoFiles.find(v => v.quality === 'hd') || video.videoFiles[0];
                          window.open(hdVideo.link, '_blank');
                        }}
                      >
                        <img
                          src={video.image}
                          alt={`Video by ${video.photographer}`}
                          className="w-full h-32 object-cover rounded border border-border group-hover:border-primary transition-colors"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b">
                          <p className="text-xs text-white truncate">
                            by {video.photographer} • {video.duration}s
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {stockPage * 20 < stockTotalResults && (
                    <button
                      onClick={() => handleStockSearch(stockPage + 1)}
                      disabled={isStockSearching}
                      className="w-full px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50"
                    >
                      Load More
                    </button>
                  )}
                </div>
              )}

              {stockProvider === 'unsplash' && unsplashPhotos.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 rounded">
                    <p className="text-sm">
                      <strong>Results:</strong> {stockTotalResults} photos found
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {unsplashPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative cursor-pointer"
                        onClick={() => setSelectedImage(photo.urls.regular)}
                      >
                        <img
                          src={photo.urls.small}
                          alt={photo.description || 'Unsplash photo'}
                          className="w-full h-32 object-cover rounded border border-border group-hover:border-primary transition-colors"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b">
                          <p className="text-xs text-white truncate">
                            by {photo.photographer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {stockPage * 20 < stockTotalResults && (
                    <button
                      onClick={() => handleStockSearch(stockPage + 1)}
                      disabled={isStockSearching}
                      className="w-full px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50"
                    >
                      Load More
                    </button>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Stock Media Search:</strong>
                {stockProvider === 'pexels' ? (
                  <>
                    <p className="mt-2">
                      Uses <strong>Pexels API</strong> to search millions of free stock photos and videos.
                      All Pexels content is free to use for personal and commercial projects.
                    </p>
                    <p className="mt-2">
                      Set <code className="bg-muted-foreground/10 px-1 rounded">PEXELS_API_KEY</code> in .env.local
                    </p>
                    <p className="mt-2 text-xs">
                      Rate Limit: 200 requests/hour, 20,000 requests/month (free tier)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2">
                      Uses <strong>Unsplash API</strong> to search millions of beautiful, free photos.
                      All Unsplash photos are free to use for personal and commercial projects.
                    </p>
                    <p className="mt-2">
                      Set <code className="bg-muted-foreground/10 px-1 rounded">UNSPLASH_ACCESS_KEY</code> in .env.local
                    </p>
                    <p className="mt-2 text-xs">
                      Rate Limit: 50 requests/hour (Demo), 5000 requests/hour (Production)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview & Gallery */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="max-w-4xl mx-auto">
            {selectedImage ? (
              <div className="space-y-4">
                <div className="bg-background rounded-lg shadow-lg p-4">
                  <img
                    src={selectedImage}
                    alt="Selected preview"
                    className="max-w-full h-auto mx-auto rounded"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => downloadImage(selectedImage)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => copyImageUrl(selectedImage)}
                    className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload New
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        {generatedImages.length > 0 && (
          <div className="border-t border-border bg-background p-4 h-48 overflow-y-auto">
            <h3 className="text-sm font-medium mb-3">Generated Images ({generatedImages.length})</h3>
            <div className="grid grid-cols-6 gap-3">
              {generatedImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`cursor-pointer rounded overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedImage === img.url
                      ? 'border-primary shadow-lg'
                      : 'border-border'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-24 object-cover"
                    title={img.prompt}
                  />
                  <div className="px-2 py-1 bg-muted">
                    <p className="text-xs text-muted-foreground truncate">
                      {img.provider === 'openai' ? 'OpenAI' : 'Gemini'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation with Chat/TabBar Toggle Button */}
      {(setChatVisible || setTabBarVisible) && (
        <BottomNav
          pageActions={
            <button
              onClick={() => {
                if (setChatVisible) setChatVisible(!chatVisible);
                if (setTabBarVisible) setTabBarVisible(!tabBarVisible);
              }}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-background"
              title={chatVisible ? 'Hide Chat & Tabs' : 'Show Chat & Tabs'}
            >
              {chatVisible ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          }
        />
      )}
    </div>
  );
}
