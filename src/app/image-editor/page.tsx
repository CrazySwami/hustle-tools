"use client";

import { useState } from 'react';
import { Wand2, Edit3, Scissors, Search, ImageIcon, Settings, Copy as CopyIcon, Menu, X } from 'lucide-react';
import { GenerateTab } from '@/components/image-editor/GenerateTab';
import { EditTab } from '@/components/image-editor/EditTab';
import { BackgroundRemovalTab } from '@/components/image-editor/BackgroundRemovalTab';
import { ReverseSearchTab } from '@/components/image-editor/ReverseSearchTab';
import { StockPhotosTab } from '@/components/image-editor/StockPhotosTab';
import { ProcessingTab } from '@/components/image-editor/ProcessingTab';
import { DuplicationTab } from '@/components/image-editor/DuplicationTab';
import { ImagePreview } from '@/components/image-editor/ImagePreview';
import { BottomNav } from '@/components/ui/BottomNav';

export default function ImageEditorPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'background' | 'search' | 'stock' | 'processing' | 'duplicate'>('processing');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<Array<{ url: string; label: string }>>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const addToHistory = (url: string, label: string) => {
    setImageHistory(prev => [{ url, label }, ...prev.slice(0, 19)]); // Keep last 20
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background md:pt-20 md:pl-4">
      {/* Mobile Header with Menu Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Image Editor</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar - Tools */}
      <div className={`
        ${mobileMenuOpen ? 'flex' : 'hidden'} md:flex
        fixed md:relative inset-0 md:inset-auto
        z-50 md:z-auto
        w-full md:w-80
        border-r border-border
        flex-col overflow-hidden
        bg-card md:bg-card
        ${mobileMenuOpen ? 'mt-[73px]' : ''}
      `}>
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 -z-10"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleTabChange('processing')}
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
              onClick={() => handleTabChange('generate')}
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
              onClick={() => handleTabChange('edit')}
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
              onClick={() => handleTabChange('background')}
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
              onClick={() => handleTabChange('search')}
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
              onClick={() => handleTabChange('stock')}
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
              onClick={() => handleTabChange('duplicate')}
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

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
}
