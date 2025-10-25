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
import { CopyIcon, RotateCcwIcon, GlobeIcon, SendIcon } from 'lucide-react';
import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface UniversalChatProps {
  messages: any[];
  isLoading: boolean;
  status?: string;
  onSendMessage: (text: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReload?: () => void;

  // Tool registration - pass the tool names your feature uses
  toolNames: string[];

  // Optional callbacks for feature-specific behavior
  onStreamUpdate?: (type: string, content: string) => void;
  onSwitchToSectionEditor?: () => void;
  onSwitchCodeTab?: (tab: string) => void;
  onSwitchTab?: (tab: string) => void;
  onUpdateSection?: (updates: any) => void;
  currentSection?: any;

  // Customization props
  emptyState?: ReactNode;
  placeholder?: string;
  showWebSearch?: boolean;
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

export function UniversalChat({
  messages,
  isLoading,
  status,
  onSendMessage,
  selectedModel,
  onModelChange,
  onReload,
  toolNames,
  onStreamUpdate,
  onSwitchToSectionEditor,
  onSwitchCodeTab,
  onSwitchTab,
  onUpdateSection,
  currentSection,
  emptyState,
  placeholder = 'Ask me anything...',
  showWebSearch = true,
}: UniversalChatProps) {
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

  // Generate switch cases dynamically from toolNames
  const isRegisteredTool = (partType: string): boolean => {
    if (!partType.startsWith('tool-')) return false;
    const toolName = partType.replace('tool-', '');
    return toolNames.includes(toolName);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <Conversation className="flex-1" style={{ overflow: 'hidden' }}>
        <ConversationContent style={{ flex: 1, overflow: 'auto' }}>
          {messages.length === 0 && emptyState}

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

              {/* Render tool results OUTSIDE message bubble */}
              {message.role === 'assistant' && message.parts && message.parts.map((part: any, i: number) => {
                // Check if this is a registered tool with results
                if (isRegisteredTool(part.type) && (part.output || part.result)) {
                  const toolName = part.type.replace('tool-', '');
                  const result = part.output ?? part.result;
                  return (
                    <ToolResultRenderer
                      key={`${message.id}-tool-${i}`}
                      toolResult={{
                        toolCallId: part.toolCallId ?? '',
                        toolName,
                        args: part.input ?? part.args ?? {},
                        result: result.type === 'json' ? result.value : result,
                      }}
                      onStreamUpdate={onStreamUpdate}
                      onSwitchToSectionEditor={onSwitchToSectionEditor}
                      onSwitchCodeTab={onSwitchCodeTab}
                      onSwitchTab={onSwitchTab}
                      model={selectedModel}
                    />
                  );
                }

                // Handle tool-result type
                if (part.type === 'tool-result') {
                  const toolName = part.toolName ?? part.toolResult?.toolName;
                  const args = part.args ?? part.toolResult?.args;
                  const result = part.result ?? part.toolResult?.result ?? part.output;

                  if (toolNames.includes(toolName)) {
                    return (
                      <ToolResultRenderer
                        key={`${message.id}-tool-result-${i}`}
                        toolResult={{
                          toolCallId: part.toolCallId ?? '',
                          toolName,
                          args,
                          result: result.type === 'json' ? result.value : result,
                        }}
                        onStreamUpdate={onStreamUpdate}
                        onSwitchToSectionEditor={onSwitchToSectionEditor}
                        onSwitchCodeTab={onSwitchCodeTab}
                        onSwitchTab={onSwitchTab}
                        model={selectedModel}
                      />
                    );
                  }
                }
                return null;
              })}

              <Message from={message.role} key={message.id} className="py-2">
                <div className={cn('flex flex-col gap-1', message.role === 'user' ? 'items-end' : 'items-start')}>
                  <MessageContent>
                    {message.parts ? (
                      message.parts.filter(part => part != null).map((part: any, i: number) => {
                        console.log('🎨 Rendering message part:', { type: part.type, toolName: part.toolName, part });

                        switch (part.type) {
                          case 'text':
                            return <Response key={i}>{(part.text ?? part.value) as string}</Response>;

                          case 'step-start': {
                            // Render step divider to show AI's reasoning process
                            const stepNumber = part.stepNumber ?? 1;
                            const stepType = part.stepType ?? 'unknown';

                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 py-2 px-3 my-2 bg-muted/50 border border-border rounded-lg text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                                    {stepNumber}
                                  </div>
                                  <div className="font-medium">
                                    Step {stepNumber}
                                  </div>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {stepType === 'tool-call' ? '🔧 Using tools' : '💭 Thinking'}
                                </div>
                              </div>
                            );
                          }

                          case 'tool-call': {
                            // Skip generic tool-call if we have a typed tool part in this message
                            // This prevents duplicate rendering when AI SDK creates both types
                            const toolName = part.toolName ?? part.toolCall?.toolName;
                            const hasTypedPart = message.parts.some((p: any) =>
                              p.type === `tool-${toolName}` && p !== part
                            );

                            if (hasTypedPart) {
                              console.log('⏭️ Skipping generic tool-call, typed part exists:', toolName);
                              return null;
                            }

                            // Only render if no typed part exists
                            console.log('🔨 Tool call detected (no typed part):', toolName);
                            return (
                              <Tool key={i} defaultOpen>
                                <ToolHeader type={toolName} state="input-available" />
                                <ToolContent>
                                  <ToolInput input={part.args ?? part.toolCall?.args} />
                                </ToolContent>
                              </Tool>
                            );
                          }

                          default: {
                            // Check if this is a registered tool part
                            if (isRegisteredTool(part.type)) {
                              const toolName = part.type.replace('tool-', '');
                              console.log(`🎯 ${toolName} tool detected!`, part);

                              // If it has output/result, skip - it's rendered outside the bubble
                              if (part.output || part.result) {
                                console.log('✅ Tool has result, skipping (rendered outside bubble)');
                                return null;
                              }

                              // Otherwise render as tool-call (input phase)
                              console.log('🔨 Tool call in progress (no result yet)');
                              return (
                                <Tool key={i} defaultOpen>
                                  <ToolHeader type={toolName} state="input-available" />
                                  <ToolContent>
                                    <ToolInput input={part.input ?? part.args ?? {}} />
                                  </ToolContent>
                                </Tool>
                              );
                            }

                            // Handle tool-result type (tool-call is handled above in switch)
                            if (part.type === 'tool-result') {
                              const toolName = part.toolName ?? part.toolResult?.toolName;
                              const args = part.args ?? part.toolResult?.args;
                              const result = part.result ?? part.toolResult?.result ?? part.output;

                              console.log('✅ Tool result received, skipping (rendered outside bubble)');

                              // If tool is in registered list, skip - it's rendered outside the bubble
                              if (toolNames.includes(toolName)) {
                                return null;
                              }

                              // Default tool rendering for unregistered tools
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

                            if (part.type === 'source-url') {
                              // Don't render source-url parts inline
                              return null;
                            }

                            return null;
                          }
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

      <PromptInput onSubmit={handleSubmit} style={{ flexShrink: 0, marginTop: '16px' }}>
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder={placeholder}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {showWebSearch && (
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
            )}
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
          <PromptInputSubmit disabled={isLoading || !input.trim()} status={status}>
            <SendIcon size={16} />
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
