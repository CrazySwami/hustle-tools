"use client";

import { useState } from 'react';
import { Wrench, Search, Image as ImageIcon } from 'lucide-react';
import { ImageProcessingTab } from '@/components/image-alterations/ImageProcessingTab';
import { ReverseImageSearchTab } from '@/components/image-alterations/ReverseImageSearchTab';
import { StockPhotosTab } from '@/components/image-alterations/StockPhotosTab';

export default function ImageAlterationsPage() {
  const [activeTab, setActiveTab] = useState<'processing' | 'search' | 'stock'>('processing');

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Image Tools</h1>
          <p className="text-foreground/60">Compress, process, search, and find stock images</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('processing')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'processing'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Image Processing
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'search'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="w-4 h-4" />
            Reverse Image Search
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'stock'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Stock Photos
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'processing' && <ImageProcessingTab />}
          {activeTab === 'search' && <ReverseImageSearchTab />}
          {activeTab === 'stock' && <StockPhotosTab />}
        </div>
      </div>
    </div>
  );
}
