'use client';

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
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Loader } from '@/components/ai-elements/loader';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import { ToolResultRenderer } from '@/components/tool-ui/tool-result-renderer';
import { CopyIcon, RotateCcwIcon, GlobeIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ElementorChatProps {
  messages: any[];
  isLoading: boolean;
  status?: string;
  onSendMessage: (text: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReload?: () => void;
  onStreamUpdate?: (type: 'html' | 'css' | 'js', content: string) => void;
  onSwitchToSectionEditor?: () => void;
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js') => void;
  onUpdateSection?: (updates: { html?: string; css?: string; js?: string }) => void;
  currentSection?: any;
}

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

export function ElementorChat({
  messages,
  isLoading,
  status,
  onSendMessage,
  selectedModel,
  onModelChange,
  onReload,
  onStreamUpdate,
  onSwitchToSectionEditor,
  onSwitchCodeTab,
  onUpdateSection,
  currentSection
}: ElementorChatProps) {
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, undefined, {
        webSearchEnabled: webSearch,
        reasoningEffort: 'medium',
        detailedMode: false,
      });
      setInput('');
    }
  };

  const formatToolOutput = (output: any): React.ReactNode => {
    if (output && typeof output === 'object' && 'type' in output && output.type === 'json' && 'value' in output) {
      const pretty = JSON.stringify((output as any).value, null, 2);
      return <Response>{`\n\n\`\`\`json\n${pretty}\n\`\`\``}</Response>;
    }
    const pretty = typeof output === 'object' ? JSON.stringify(output, null, 2) : String(output);
    return <Response>{pretty}</Response>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Bar - Match tab-bar styling exactly */}
      <div style={{
        padding: '8px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 style={{
          margin: 0,
          padding: '6px 0',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--foreground)'
        }}>
          Chat
        </h2>
      </div>

      <Conversation className="flex-1 !overflow-hidden" style={{ minHeight: 0 }}>
        <ConversationContent className="!overflow-y-auto !h-full">
          {messages.map((message, index) => (
            <div key={message.id}>
              {/* Show sources for assistant messages - OUTSIDE Message component */}
              {message.role === 'assistant' && message.parts && (
                <Sources>
                  {message.parts.some((part: any) => part.type === 'source-url') && (
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part: any) => part.type === 'source-url',
                        ).length
                      }
                    />
                  )}
                  <SourcesContent>
                    {message.parts.map((part: any, i: number) => {
                      if (part.type === 'source-url') {
                        return (
                          <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        );
                      }
                      return null;
                    })}
                  </SourcesContent>
                </Sources>
              )}
              <Message from={message.role} key={message.id} className="py-2">
                <div className={cn('flex flex-col gap-1', message.role === 'user' ? 'items-end' : 'items-start')}>
                  <MessageContent>
                    {message.parts ? (
                      message.parts.map((part: any, i: number) => {
                        console.log('🎨 Rendering message part:', { type: part.type, toolName: part.toolName, part });

                        switch (part.type) {
                          case 'text':
                            return <Response key={i}>{(part.text ?? part.value) as string}</Response>;

                          case 'step-start':
                            // Ignore step-start parts (just markers)
                            return null;

                          case 'tool-generateHTML': {
                            // Handle the custom tool type for generateHTML
                            console.log('🎯 generateHTML tool detected!', part);

                            // If it has output/result, render as tool-result
                            if (part.output || part.result) {
                              const result = part.output ?? part.result;
                              console.log('✅ Tool has result, rendering widget:', result);
                              return (
                                <ToolResultRenderer
                                  key={i}
                                  toolResult={{
                                    toolCallId: part.toolCallId ?? '',
                                    toolName: 'generateHTML',
                                    args: part.input ?? part.args ?? {},
                                    result: result.type === 'json' ? result.value : result,
                                  }}
                                  onStreamUpdate={onStreamUpdate}
                                  onSwitchToSectionEditor={onSwitchToSectionEditor}
                                  onSwitchCodeTab={onSwitchCodeTab}
                                  model={selectedModel}
                                />
                              );
                            }

                            // Otherwise render as tool-call (input phase)
                            console.log('🔨 Tool call in progress (no result yet)');
                            return (
                              <Tool key={i} defaultOpen>
                                <ToolHeader type="generateHTML" state="input-available" />
                                <ToolContent>
                                  <ToolInput input={part.input ?? part.args ?? {}} />
                                </ToolContent>
                              </Tool>
                            );
                          }

                          case 'tool-call':
                            console.log('🔨 Tool call detected:', part.toolName ?? part.toolCall?.toolName);
                            return (
                              <Tool key={i} defaultOpen>
                                <ToolHeader type={part.toolName ?? part.toolCall?.toolName} state="input-available" />
                                <ToolContent>
                                  <ToolInput input={part.args ?? part.toolCall?.args} />
                                </ToolContent>
                              </Tool>
                            );
                          case 'tool-result': {
                            const toolName = part.toolName ?? part.toolResult?.toolName;
                            const args = part.args ?? part.toolResult?.args;
                            const result = part.result ?? part.toolResult?.result ?? part.output;

                            console.log('✅ Tool result received:', { toolName, args, result });

                            // Handle section update tools - apply changes immediately
                            if (toolName === 'updateSectionHtml' && result.html && onUpdateSection) {
                              console.log('🔧 Applying HTML update to section');
                              onUpdateSection({ html: result.html });
                              onSwitchToSectionEditor?.();
                              onSwitchCodeTab?.('html');
                            } else if (toolName === 'updateSectionCss' && result.css && onUpdateSection) {
                              console.log('🔧 Applying CSS update to section');
                              onUpdateSection({ css: result.css });
                              onSwitchToSectionEditor?.();
                              onSwitchCodeTab?.('css');
                            } else if (toolName === 'updateSectionJs' && result.js && onUpdateSection) {
                              console.log('🔧 Applying JS update to section');
                              onUpdateSection({ js: result.js });
                              onSwitchToSectionEditor?.();
                              onSwitchCodeTab?.('js');
                            }

                            // Use custom renderer for generateHTML tool
                            if (toolName === 'generateHTML') {
                              console.log('🎯 Rendering generateHTML widget with result:', result);
                              return (
                                <ToolResultRenderer
                                  key={i}
                                  toolResult={{
                                    toolCallId: part.toolCallId ?? '',
                                    toolName,
                                    args,
                                    result: result.type === 'json' ? result.value : result,
                                  }}
                                  onStreamUpdate={onStreamUpdate}
                                  onSwitchToSectionEditor={onSwitchToSectionEditor}
                                  onSwitchCodeTab={onSwitchCodeTab}
                                  model={selectedModel}
                                />
                              );
                            }

                            // Default tool rendering for other tools
                            return (
                              <Tool key={i} defaultOpen>
                                <ToolHeader type={toolName} state="output-available" />
                                <ToolContent>
                                  <ToolInput input={args} />
                                  <ToolOutput output={formatToolOutput(result)} />
                                </ToolContent>
                              </Tool>
                            );
                          }
                          case 'source-url':
                            // Don't render source-url parts inline
                            return null;
                          default:
                            return null;
                        }
                      })
                    ) : (
                      <Response>{message.content || message.text || ''}</Response>
                    )}
                  </MessageContent>
                  {/* Only show Actions for assistant messages */}
                  {message.role === 'assistant' && (
                    <Actions>
                      {index === messages.length - 1 && onReload && (
                        <Action tooltip="Regenerate" onClick={onReload}>
                          <RotateCcwIcon />
                        </Action>
                      )}
                      <Action
                        tooltip="Copy"
                        onClick={() => {
                          const plain = message.parts
                            ? message.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text ?? p.value ?? '').join('\n')
                            : message.content || message.text || '';
                          navigator.clipboard.writeText(plain);
                        }}
                      >
                        <CopyIcon />
                      </Action>
                    </Actions>
                  )}
                </div>
              </Message>
            </div>
          ))}
          {status === 'streaming' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="mt-4" style={{ flexShrink: 0 }}>
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me to modify the Elementor JSON..."
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
            <PromptInputModelSelect onValueChange={onModelChange} value={selectedModel}>
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {modelGroups.map((group) => (
                  <div key={group.provider}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.provider}
                    </div>
                    {group.models.map((model) => (
                      <PromptInputModelSelectItem key={model.value} value={model.value}>
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </div>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit disabled={isLoading || !input.trim()} status={status} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
