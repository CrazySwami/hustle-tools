'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { MarkdownWithCitations } from '@/components/ai-elements/markdown-with-citations';
import { GlobeIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';

// Define interfaces for model and model groups
interface Model {
  name: string;
  value: string;
}

interface ModelGroup {
  provider: string;
  models: Model[];
  isOpen?: boolean; // Track if the group is expanded
}

// Group models by provider
const modelGroups: ModelGroup[] = [
  {
    provider: 'OpenAI',
    isOpen: true, // Default open
    models: [
      { name: 'GPT-5', value: 'openai/gpt-5' },
      { name: 'GPT-5 mini', value: 'openai/gpt-5-mini' },
      { name: 'GPT-5 nano', value: 'openai/gpt-5-nano' },
      { name: 'GPT-4.1', value: 'openai/gpt-4.1' },
      { name: 'GPT-4.1 mini', value: 'openai/gpt-4.1-mini' },
      { name: 'GPT-4.1 nano', value: 'openai/gpt-4.1-nano' },
      { name: 'GPT-4o', value: 'openai/gpt-4o' },
      { name: 'GPT-4o mini', value: 'openai/gpt-4o-mini' },
      { name: 'GPT-4 Turbo', value: 'openai/gpt-4-turbo' },
      { name: 'GPT-3.5 Turbo', value: 'openai/gpt-3.5-turbo' },
      { name: 'o3', value: 'openai/o3' },
      { name: 'o3-mini', value: 'openai/o3-mini' },
      { name: 'o4-mini', value: 'openai/o4-mini' },
      { name: 'text-embedding-3-small', value: 'openai/text-embedding-3-small' },
      { name: 'gpt-oss-20b', value: 'openai/gpt-oss-20b' },
    ]
  },
  {
    provider: 'Anthropic',
    models: [
      { name: 'Claude 4.1 Opus', value: 'anthropic/claude-4.1-opus' },
      { name: 'Claude 4 Opus', value: 'anthropic/claude-4-opus' },
      { name: 'Claude 4 Sonnet', value: 'anthropic/claude-4-sonnet' },
      { name: 'Claude 3.7 Sonnet', value: 'anthropic/claude-3.7-sonnet' },
      { name: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
      { name: 'Claude 3.5 Haiku', value: 'anthropic/claude-3.5-haiku' },
    ]
  },
  {
    provider: 'Google',
    models: [
      { name: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
      { name: 'Gemini 2.5 Flash', value: 'google/gemini-2.5-flash' },
      { name: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash' },
      { name: 'Gemini 2.0 Flash Lite', value: 'google/gemini-2.0-flash-lite' },
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
  },
  {
    provider: 'xAI',
    models: [
      { name: 'Grok 4', value: 'xai/grok-4' },
      { name: 'Grok 3 Beta', value: 'xai/grok-3-beta' },
      { name: 'Grok 3 Mini Beta', value: 'xai/grok-3-mini-beta' },
      { name: 'Grok 2', value: 'xai/grok-2' },
      { name: 'Grok 2 Vision', value: 'xai/grok-2-vision' },
    ]
  },
  {
    provider: 'Z.ai',
    models: [
      { name: 'GLM 4.5', value: 'zai/glm-4.5' },
      { name: 'GLM 4.5 Air', value: 'zai/glm-4.5-air' },
    ]
  },
  {
    provider: 'Moonshot AI',
    models: [
      { name: 'Kimi K2', value: 'moonshotai/kimi-k2' },
    ]
  },
  {
    provider: 'DeepSeek',
    models: [
      { name: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
      { name: 'DeepSeek R1 Distill Llama 70B', value: 'deepseek/deepseek-r1-distill-llama-70b' },
      { name: 'DeepSeek V3 0324', value: 'deepseek/deepseek-v3-0324' },
    ]
  },
  {
    provider: 'Alibaba Cloud',
    models: [
      { name: 'Qwen3 Coder', value: 'alibaba/qwen3-coder' },
      { name: 'Qwen3 235B A22B Instruct 2507', value: 'alibaba/qwen3-235b-a22b-instruct-2507' },
      { name: 'Qwen 3.32B', value: 'alibaba/qwen-3.32b' },
    ]
  },
  {
    provider: 'Meta',
    models: [
      { name: 'Llama 3.3 70B', value: 'meta/llama-3.3-70b' },
    ]
  },
  {
    provider: 'Cohere',
    models: [
      { name: 'Command A', value: 'cohere/command-a' },
    ]
  },
  {
    provider: 'Amazon Bedrock',
    models: [
      { name: 'Nova Pro', value: 'amazon/nova-pro' },
    ]
  },
  {
    provider: 'Vercel',
    models: [
      { name: 'v0-1.5-md', value: 'vercel/v0-1.5-md' },
    ]
  },
  {
    provider: 'Other',
    models: [
      { name: 'GPT-OSS-120B', value: 'baseten/gpt-oss-120b' },
    ]
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(modelGroups[0].models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status } = useChat();
  
  // Track which provider groups are open
  const [openProviders, setOpenProviders] = useState<Record<string, boolean>>({
    // Only OpenAI open by default
    OpenAI: true
  });

  // Toggle provider group open/closed
  const toggleProvider = (provider: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent dropdown from closing
    e.stopPropagation(); // Prevent event bubbling
    setOpenProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // If web search is enabled but not using a Perplexity model, switch to Perplexity Sonar
      let selectedModel = model;
      if (webSearch && !model.startsWith('perplexity/')) {
        console.log('Switching to Perplexity model for web search');
        selectedModel = 'perplexity/sonar';
      }

      sendMessage(
        { text: input },
        {
          body: {
            model: selectedModel,
            webSearch,
          },
        },
      );
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pt-16 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && (
                  <Sources>
                    {/* Only render SourcesTrigger once per message */}
                    {message.parts.some(part => part.type === 'source-url') && (
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === 'source-url',
                          ).length
                        }
                      />
                    )}
                    <SourcesContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'source-url':
                            return (
                              <Source
                                key={`${message.id}-${i}`}
                                href={part.url}
                                title={part.url}
                              />
                            );
                          default:
                            return null;
                        }
                      })}
                    </SourcesContent>
                  </Sources>
                )}
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <MarkdownWithCitations
                              key={`${message.id}-${i}`}
                              content={part.text}
                              sources={message.sources}
                            />
                          );
                        case 'reasoning':
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={status === 'streaming'}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent className="max-h-[300px] overflow-y-auto w-[250px]">
                  {modelGroups.map((group) => (
                    <div key={group.provider}>
                      <button
                        className="flex justify-between w-full p-2 text-left"
                        onClick={(e) => toggleProvider(group.provider, e)}
                      >
                        <h3>{group.provider}</h3>
                        <span className="text-gray-500">
                          {openProviders[group.provider] ? '-' : '+'}
                        </span>
                      </button>
                      {openProviders[group.provider] && (
                        <div className="pl-4">
                          {group.models.map((model) => (
                            <PromptInputModelSelectItem key={model.value} value={model.value}>
                              {model.name}
                            </PromptInputModelSelectItem>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;