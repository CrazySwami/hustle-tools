'use client';

import dynamic from 'next/dynamic';

// Dynamically import with SSR disabled for browser-only code
const BlogBuilderTool = dynamic(
  () => import('@/components/ai-elements/blog-builder-tool').then(mod => ({ default: mod.BlogBuilderTool })),
  { ssr: false }
);

export default function BlogBuilderPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#FAFAFA] dark:bg-[#1a1a1a]">
      <BlogBuilderTool />
    </div>
  );
}
