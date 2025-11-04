'use client';

import { BlogBuilderTool } from '@/components/ai-elements/blog-builder-tool';
import { Sparkles } from 'lucide-react';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

export default function BlogBuilderPage() {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gray-50">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 justify-center">
          <Sparkles className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blog Builder</h1>
        </div>
        <p className="mt-4 text-center text-gray-600">
          AI-powered content order form generation and blog post planning
        </p>
      </div>

      <BlogBuilderTool />
    </div>
  );
}
