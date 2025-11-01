"use client";

import { useState } from 'react';
import { Wand2, Edit3, Scissors, Search, ImageIcon, Settings, Copy as CopyIcon } from 'lucide-react';
import { GenerateTab } from '@/components/image-editor/GenerateTab';
import { EditTab } from '@/components/image-editor/EditTab';
import { BackgroundRemovalTab } from '@/components/image-editor/BackgroundRemovalTab';
import { ReverseSearchTab } from '@/components/image-editor/ReverseSearchTab';
import { StockPhotosTab } from '@/components/image-editor/StockPhotosTab';
import { ProcessingTab } from '@/components/image-editor/ProcessingTab';
import { DuplicationTab } from '@/components/image-editor/DuplicationTab';
import { ImagePreview } from '@/components/image-editor/ImagePreview';

export default function ImageEditorPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'background' | 'search' | 'stock' | 'processing' | 'duplicate'>('processing');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<Array<{ url: string; label: string }>>([]);

  const addToHistory = (url: string, label: string) => {
    setImageHistory(prev => [{ url, label }, ...prev.slice(0, 19)]); // Keep last 20
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Tools */}
      <div className="w-80 border-r border-border flex flex-col overflow-hidden bg-card">
        {/* Tab Navigation */}
        <div className="border-b border-border">
          <div className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab('processing')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'processing'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Settings className="w-4 h-4" />
              Process Image
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'generate'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              Generate Image
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'edit'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit with AI
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'background'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Scissors className="w-4 h-4" />
              Remove Background
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'search'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Search className="w-4 h-4" />
              Reverse Search
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'stock'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Stock Photos
            </button>
            <button
              onClick={() => setActiveTab('duplicate')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'duplicate'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <CopyIcon className="w-4 h-4" />
              Duplicate Image
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'processing' && (
            <ProcessingTab
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              addToHistory={addToHistory}
            />
          )}
          {activeTab === 'generate' && (
            <GenerateTab
              setSelectedImage={setSelectedImage}
              addToHistory={addToHistory}
            />
          )}
          {activeTab === 'edit' && (
            <EditTab
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              addToHistory={addToHistory}
            />
          )}
          {activeTab === 'background' && (
            <BackgroundRemovalTab
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              addToHistory={addToHistory}
            />
          )}
          {activeTab === 'search' && (
            <ReverseSearchTab
              selectedImage={selectedImage}
            />
          )}
          {activeTab === 'stock' && (
            <StockPhotosTab
              setSelectedImage={setSelectedImage}
              addToHistory={addToHistory}
            />
          )}
          {activeTab === 'duplicate' && (
            <DuplicationTab
              selectedImage={selectedImage}
            />
          )}
        </div>
      </div>

      {/* Center - Image Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ImagePreview
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          imageHistory={imageHistory}
          addToHistory={addToHistory}
        />
      </div>
    </div>
  );
}
