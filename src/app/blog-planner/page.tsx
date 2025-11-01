'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Calendar, FileText } from 'lucide-react';
import { UniversalChat } from '@/components/chat/UniversalChat';
import { BlogTopic } from '@/lib/blog-planner-utils';
import { BottomNav } from '@/components/ui/BottomNav';

export default function BlogPlannerPage() {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4-5-20250929');
  const [blogPlan, setBlogPlan] = useState<BlogTopic[]>([]);

  const { messages, sendMessage, isLoading, status, reload } = useChat({
    api: '/api/chat-blog-planner',
    body: {
      model: selectedModel,
    },
  });

  const handleSendMessage = (
    text: string,
    imageData?: { url: string; filename: string },
    settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }
  ) => {
    if (!text.trim() || isLoading) return;

    // Auto-enable web search for Perplexity models
    let modelToUse = selectedModel;

    if (settings?.webSearchEnabled && !selectedModel.startsWith('perplexity/')) {
      modelToUse = 'perplexity/sonar-pro';
      console.log('🔄 Switching to Perplexity for web search');
    }

    // sendMessage expects { text: string } not just a string (like elementor-editor)
    sendMessage(
      { text },
      {
        body: {
          model: modelToUse,
          webSearch: settings?.webSearchEnabled ?? false,
          reasoningEffort: settings?.reasoningEffort ?? 'medium',
          detailedMode: settings?.detailedMode ?? false,
        },
      }
    );
  };

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      {/* Left Panel: Chat */}
      <div className="flex-[60%] flex flex-col border-r">
        {/* Header */}
        <div className="border-b p-4 bg-card">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Blog Planner & Writer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan monthly content calendars and write SEO-optimized blog posts
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <UniversalChat
            messages={messages}
            isLoading={isLoading}
            status={status}
            onSendMessage={handleSendMessage}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onReload={reload}
            // 🎯 Tool Registration - UniversalChat automatically handles all tools!
            toolNames={['planSteps', 'updateStepProgress', 'planBlogTopics', 'writeBlogPost', 'googleSearch']}
            // 🎨 Customization
            placeholder="Ask me to plan blog topics or write a blog post..."
            emptyState={
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Start Planning Your Content</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Ask me to plan blog topics for any month, or write a complete blog post. I can research topics using Perplexity for up-to-date information.
                </p>
                <div className="space-y-2 text-left w-full max-w-md">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Example Prompts:</div>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• "Plan 8 blog posts for January 2025 about WordPress development for beginners"</li>
                      <li>• "Write a 1500-word how-to guide about setting up a blog with research"</li>
                      <li>• "Create a content calendar for February targeting small business owners"</li>
                    </ul>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Right Panel: Blog Plan Summary */}
      <div className="flex-[40%] flex flex-col bg-muted/30">
        <div className="border-b p-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Plan
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {blogPlan.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                No blog plan yet. Ask me to plan blog topics for a specific month.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 border rounded-lg bg-card">
                <div className="text-sm font-semibold mb-2">Summary</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-2xl font-bold">{blogPlan.length}</div>
                    <div className="text-muted-foreground">Topics</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {blogPlan.reduce((sum, t) => sum + t.estimatedWordCount, 0).toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">Total Words</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {blogPlan.map((topic, i) => (
                  <div key={topic.id} className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="text-sm font-medium mb-1">
                      {i + 1}. {topic.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {topic.publishDate} • Week {topic.weekNumber} • {topic.estimatedWordCount.toLocaleString()} words
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
}
