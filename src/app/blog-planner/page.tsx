'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Loader } from '@/components/ai-elements/loader';
import { ToolResultRenderer } from '@/components/tool-ui/tool-result-renderer';
import { Globe, RotateCcw, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlogTopic } from '@/lib/blog-planner-utils';

const modelGroups = [
  {
    provider: 'Claude',
    models: [
      { name: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4-5-20251001' },
      { name: 'Claude Sonnet 4.5', value: 'anthropic/claude-sonnet-4-5-20250929' },
      { name: 'Claude Opus 4.1', value: 'anthropic/claude-opus-4-1-20250805' },
      { name: 'Claude 3.7 Sonnet', value: 'anthropic/claude-3-7-sonnet-20250219' },
      { name: 'Claude 3.5 Haiku', value: 'anthropic/claude-3-5-haiku-20241022' },
    ]
  },
  {
    provider: 'OpenAI',
    models: [
      { name: 'GPT-5', value: 'openai/gpt-5' },
      { name: 'GPT-5 Mini', value: 'openai/gpt-5-mini' },
      { name: 'GPT-5 Nano', value: 'openai/gpt-5-nano' },
      { name: 'GPT-4o', value: 'openai/gpt-4o' },
      { name: 'o3', value: 'openai/o3' },
    ]
  },
  {
    provider: 'Google',
    models: [
      { name: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
      { name: 'Gemini 2.5 Flash', value: 'google/gemini-2.5-flash' },
      { name: 'Gemini 2.0 Flash Exp', value: 'google/gemini-2.0-flash-exp' },
    ]
  },
  {
    provider: 'Perplexity',
    models: [
      { name: 'Sonar', value: 'perplexity/sonar' },
      { name: 'Sonar Pro', value: 'perplexity/sonar-pro' },
      { name: 'Sonar Reasoning', value: 'perplexity/sonar-reasoning' },
      { name: 'Sonar Reasoning Pro', value: 'perplexity/sonar-reasoning-pro' },
    ]
  }
];

export default function BlogPlannerPage() {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4-5-20250929');
  const [webSearch, setWebSearch] = useState(false);
  const [blogPlan, setBlogPlan] = useState<BlogTopic[]>([]);

  const { messages, sendMessage, isLoading, status, reload } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel,
      webSearch,
    },
    onFinish: (message) => {
      console.log('✅ Message finished:', message);
    },
  });

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isLoading) return;

    // Auto-enable web search for Perplexity models
    let modelToUse = selectedModel;
    let enableWebSearch = webSearch;

    if (webSearch && !selectedModel.startsWith('perplexity/')) {
      modelToUse = 'perplexity/sonar-pro';
      console.log('🔄 Switching to Perplexity for web search');
    }

    sendMessage(text, {
      body: {
        model: modelToUse,
        webSearch: enableWebSearch,
      },
    });
  };

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden pt-16">
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

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <Conversation>
            <ConversationContent>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
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
              )}

              {messages.map((message, index) => (
                <Message key={message.id} from={message.role}>
                  {message.parts?.map((part, partIndex) => (
                    <MessageContent key={partIndex}>
                      {part.type === 'text' && <Response>{part.text}</Response>}

                      {part.type === 'tool-call' && (
                        <div className="text-sm text-muted-foreground mb-2">
                          🔧 Using tool: <span className="font-medium">{part.toolName}</span>
                        </div>
                      )}

                      {part.type === 'tool-result' && (
                        <ToolResultRenderer
                          toolResult={{
                            toolCallId: part.toolCallId,
                            toolName: part.toolName,
                            args: part.args,
                            result: part.result,
                          }}
                          model={selectedModel}
                          onPlanGenerated={(topics) => {
                            console.log('📅 Blog plan generated:', topics);
                            setBlogPlan(topics);
                          }}
                        />
                      )}
                    </MessageContent>
                  ))}

                  {message.role === 'assistant' && index === messages.length - 1 && isLoading && (
                    <Loader />
                  )}

                  {message.role === 'assistant' && !isLoading && (
                    <Actions>
                      <Action
                        onClick={() => navigator.clipboard.writeText(
                          message.parts?.find((p) => p.type === 'text')?.text || ''
                        )}
                      >
                        Copy
                      </Action>
                      <Action onClick={() => reload()}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retry
                      </Action>
                    </Actions>
                  )}
                </Message>
              ))}

              <ConversationScrollButton />
            </ConversationContent>
          </Conversation>
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <PromptInput onSubmit={({ text }) => handleSendMessage(text)}>
            <PromptInputTextarea
              placeholder="Ask me to plan blog topics or write a blog post..."
              rows={3}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputButton
                  variant={webSearch ? 'default' : 'ghost'}
                  onClick={() => setWebSearch(!webSearch)}
                  className={cn(
                    'transition-colors',
                    webSearch && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  {webSearch ? 'Search On' : 'Search Off'}
                </PromptInputButton>

                <PromptInputModelSelect
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue>
                      {modelGroups
                        .flatMap(g => g.models)
                        .find(m => m.value === selectedModel)?.name || 'Select Model'}
                    </PromptInputModelSelectValue>
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {modelGroups.map((group) => (
                      <div key={group.provider}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {group.provider}
                        </div>
                        {group.models.map((model) => (
                          <PromptInputModelSelectItem
                            key={model.value}
                            value={model.value}
                          >
                            {model.name}
                          </PromptInputModelSelectItem>
                        ))}
                      </div>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>

              <PromptInputSubmit disabled={isLoading} />
            </PromptInputToolbar>
          </PromptInput>
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
    </div>
  );
}
