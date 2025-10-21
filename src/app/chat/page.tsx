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
import { Actions, Action } from '@/components/ai-elements/actions';
import { CopyIcon, RotateCcwIcon } from 'lucide-react';
import { MarkdownWithCitations } from '@/components/ai-elements/markdown-with-citations';
import { GlobeIcon, BrainIcon, PanelRightOpen } from 'lucide-react';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { Comment } from '@/components/editor/CommentExtension';
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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { ToolResultRenderer } from '@/components/tool-ui/tool-result-renderer';
import { cn } from '@/lib/utils';

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
      // { name: 'GPT-5', value: 'openai/gpt-5' },
      // { name: 'GPT-5 mini', value: 'openai/gpt-5-mini' },
      // { name: 'GPT-5 nano', value: 'openai/gpt-5-nano' },
      { name: 'GPT-4.1', value: 'openai/gpt-4.1' },
      { name: 'GPT-4.1 mini', value: 'openai/gpt-4.1-mini' },
      { name: 'GPT-4.1 nano', value: 'openai/gpt-4.1-nano' },
      { name: 'GPT-4o', value: 'openai/gpt-4o' },
      { name: 'GPT-4o mini', value: 'openai/gpt-4o-mini' },
      { name: 'GPT-4 Turbo', value: 'openai/gpt-4-turbo' },
      { name: 'GPT-3.5 Turbo', value: 'openai/gpt-3.5-turbo' },
      { name: 'o1-preview', value: 'openai/o1-preview' },
      { name: 'o1-mini', value: 'openai/o1-mini' },
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
      { name: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5-20251022' },
      { name: 'Claude Sonnet 4.5', value: 'anthropic/claude-sonnet-4.5-20250514' },
      { name: 'Claude Opus 4', value: 'anthropic/claude-opus-4-20250514' },
      { name: 'Claude 3.7 Sonnet', value: 'anthropic/claude-3-7-sonnet-20250219' },
      { name: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3-5-sonnet-20241022' },
      { name: 'Claude 3.5 Haiku', value: 'anthropic/claude-3-5-haiku-20241022' },
      { name: 'Claude 3 Opus', value: 'anthropic/claude-3-opus-20240229' },
      { name: 'Claude 3 Haiku', value: 'anthropic/claude-3-haiku-20240307' },
    ]
  },
  {
    provider: 'Google',
    models: [
      { name: 'Gemini 2.0 Flash Exp', value: 'google/gemini-2.0-flash-exp' },
      { name: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
      { name: 'Gemini 2.5 Flash', value: 'google/gemini-2.5-flash' },
      { name: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash' },
      { name: 'Gemini 2.0 Flash Lite', value: 'google/gemini-2.0-flash-lite' },
      { name: 'Gemini 1.5 Pro', value: 'google/gemini-1.5-pro' },
      { name: 'Gemini 1.5 Flash', value: 'google/gemini-1.5-flash' },
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
      { name: 'Grok 3', value: 'xai/grok-3' },
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
  const [enableReasoning, setEnableReasoning] = useState(false);
  const { messages, sendMessage, reload, status, stop, setMessages } = useChat();
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  // Track which provider groups are open
  const [openProviders, setOpenProviders] = useState<Record<string, boolean>>({
    // Only OpenAI open by default
    OpenAI: true
  });

  // List of models that support reasoning
  const reasoningModels = [
    // OpenAI models
    'openai/gpt-5',
    'openai/gpt-5-mini',
    'openai/o1-preview',
    'openai/o1-mini',
    'openai/o3',
    'openai/o3-mini',
    'openai/o4-mini',
    // Anthropic models
    'anthropic/claude-opus-4-20250514',
    'anthropic/claude-sonnet-4-20250514',
    'anthropic/claude-3-7-sonnet-20250219',
    // Google models
    'google/gemini-2.0-flash-exp',
    // DeepSeek models
    'deepseek/deepseek-r1',
    'deepseek/deepseek-r1-distill-llama-70b',
    'deepseek/deepseek-v3-0324',
    // Perplexity reasoning models
    'perplexity/sonar-reasoning',
    'perplexity/sonar-reasoning-pro'
  ];

  // Check if current model supports reasoning using a more flexible approach
  const modelSupportsReasoning = reasoningModels.some(supportedModel => {
    // Extract the base model name without version numbers
    const baseModelName = supportedModel.split('-20')[0]; // Remove date/version suffix
    return model.includes(baseModelName);
  });
  
  // Log for debugging
  console.log('Current model:', model);
  console.log('Supports reasoning:', modelSupportsReasoning);
  console.log('Reasoning models:', reasoningModels);

  // Helper to format tool output for display
  const formatToolOutput = (output: any): React.ReactNode => {
    if (
      output &&
      typeof output === 'object' &&
      'type' in output &&
      output.type === 'json' &&
      'value' in output
    ) {
      const pretty = JSON.stringify((output as any).value, null, 2);
      return <Response>{`\n\n\u0060\u0060\u0060json\n${pretty}\n\u0060\u0060\u0060`}</Response>;
    }

    // Fallback: prettify whatever we got
    const pretty = typeof output === 'object'
      ? JSON.stringify(output, null, 2)
      : String(output);
    return <Response>{pretty}</Response>;
  };

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
            enableReasoning: enableReasoning && modelSupportsReasoning,
            documentContent,
            comments,
          },
        },
      );
      setInput('');
    }
  };

  return (
    <div className="flex h-screen w-full pt-16 px-4 pb-4 gap-4">
      <div className="flex flex-col h-full flex-1">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message, index) => (
              <div key={message.id} className="flex flex-col gap-4">
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
                  {/* wrapper ensures bubble and actions stack vertically */}
                  <div
                    className={cn(
                      'flex flex-col gap-1',
                      message.role === 'user' ? 'items-end' : 'items-start',
                    )}
                  >
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <Response key={i}>{(part.text ?? part.value) as string}</Response>
                            );
                          case 'tool-call': {
                            const toolName = part.toolName ?? part.toolCall?.toolName;
                            const args = part.args ?? part.toolCall?.args;
                            return (
                              <Tool key={i} defaultOpen>
                                <ToolHeader type={toolName} state="input-available" />
                                <ToolContent>
                                  <ToolInput input={args} />
                                </ToolContent>
                              </Tool>
                            );
                          }
                          case 'tool-result': {
                            const toolName = part.toolName ?? part.toolResult?.toolName;
                            const args = part.args ?? part.toolResult?.args;
                            const output = part.result ?? part.toolResult?.result ?? part.output;
                            return (
                              <Tool key={i} defaultOpen>
                                <ToolHeader type={toolName} state="output-available" />
                                <ToolContent>
                                  <ToolInput input={args} />
                                  <ToolOutput output={formatToolOutput(output)} />
                                </ToolContent>
                              </Tool>
                            );
                          }
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                    <Actions>
                      {message.role === 'assistant' &&
                        index === messages.length - 1 &&
                        reload && (
                        <Action tooltip="Regenerate" onClick={() => reload()}>
                          <RotateCcwIcon />
                        </Action>
                      )}
                      <Action
                        tooltip="Copy"
                        onClick={() => {
                          const plain = message.parts
                            .filter((p: any) => p.type === 'text')
                            .map((p: any) => p.text ?? p.value ?? '')
                            .join('\n');
                          navigator.clipboard.writeText(plain);
                        }}
                      >
                        <CopyIcon />
                      </Action>
                    </Actions>
                  </div>
                </Message>
              </div>
            ))}
            {status === 'streaming' && <Loader />}
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
              <PromptInputButton
                variant={enableReasoning && modelSupportsReasoning ? 'default' : 'ghost'}
                onClick={() => setEnableReasoning(!enableReasoning)}
                disabled={!modelSupportsReasoning}
                title={!modelSupportsReasoning ? "Current model doesn't support reasoning" : "Toggle AI reasoning"}
              >
                <BrainIcon size={16} />
                <span>Reasoning</span>
              </PromptInputButton>
              <PromptInputButton
                variant={isEditorVisible ? 'default' : 'ghost'}
                onClick={() => setIsEditorVisible(!isEditorVisible)}
              >
                <PanelRightOpen size={16} />
                <span>Editor</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                  // Log when model changes
                  console.log('Model changed to:', value);
                  console.log('Supports reasoning:', reasoningModels.includes(value));
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
      {isEditorVisible && (
        <div className="flex-1 h-full border-l">
          <TiptapEditor 
                onContentChange={setDocumentContent} 
                onCommentsChange={setComments} 
              />
        </div>
      )}
    </div>
  );
};

export default ChatBotDemo;