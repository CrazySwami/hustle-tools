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
import { CopyIcon, RotateCcwIcon, GlobeIcon, SendIcon, FileCodeIcon, EyeIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ElementorChatProps {
  messages: any[];
  isLoading: boolean;
  status?: string;
  onSendMessage: (text: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean; includeContext?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReload?: () => void;
  onStreamUpdate?: (type: 'html' | 'css' | 'js', content: string) => void;
  onSwitchToSectionEditor?: () => void;
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js') => void;
  onSwitchTab?: (tab: string) => void;
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
  onSwitchTab,
  onUpdateSection,
  currentSection
}: ElementorChatProps) {
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [includeContext, setIncludeContext] = useState(true); // Toggle for file context
  const [systemPrompt, setSystemPrompt] = useState<string>(''); // Store system prompt
  const [promptStats, setPromptStats] = useState<any>(null); // Store prompt statistics
  const [showPromptDialog, setShowPromptDialog] = useState(false); // Dialog visibility
  const { designSystemSummary } = useGlobalStylesheet();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, undefined, {
        webSearchEnabled: webSearch,
        reasoningEffort: 'medium',
        detailedMode: false,
        includeContext, // Pass context toggle state
      });
      setInput('');
    }
  };

  const handleViewSystemPrompt = async () => {
    try {
      const response = await fetch('/api/get-system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          webSearch,
          includeContext,
          currentSection,
        }),
      });
      const data = await response.json();
      setSystemPrompt(data.systemPrompt || 'Error loading system prompt');
      setPromptStats(data.stats || null);
      setShowPromptDialog(true);
    } catch (error) {
      console.error('Error fetching system prompt:', error);
      setSystemPrompt('Error loading system prompt');
      setPromptStats(null);
      setShowPromptDialog(true);
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <Conversation className="flex-1" style={{ overflow: 'hidden' }}>
        <ConversationContent style={{ flex: 1, overflow: 'auto' }}>
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
                      message.parts.filter(part => part != null).map((part: any, i: number) => {
                        // console.log('🎨 Rendering message part:', { type: part.type, toolName: part.toolName, part });

                        switch (part.type) {
                          case 'text':
                            return <Response key={i}>{(part.text ?? part.value) as string}</Response>;

                          case 'step-start':
                            // Ignore step-start parts (just markers)
                            return null;

                          case 'tool-testPing':
                          case 'tool-switchTab':
                          case 'tool-updateSectionHtml':
                          case 'tool-updateSectionCss':
                          case 'tool-updateSectionJs':
                          case 'tool-updateSectionPhp':
                          case 'tool-editCodeWithMorph': {  // ⭐ Morph Fast Apply (PRIMARY tool for all code writing)
                            // Handle typed tool parts (AI SDK 5 pattern)
                            // Extract tool name from part type (e.g., 'tool-testPing' → 'testPing')
                            const toolName = part.type.replace('tool-', '');
                            // console.log(`🎯 ${toolName} tool detected!`, part);

                            // If it has output/result, render as tool-result
                            if (part.output || part.result) {
                              const result = part.output ?? part.result;
                              // console.log('✅ Tool has result, rendering widget:', result);
                              return (
                                <ToolResultRenderer
                                  key={i}
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
                                  designSystemSummary={designSystemSummary}
                                />
                              );
                            }

                            // Otherwise render as tool-call (input phase) - NO PARAMETERS UI for Morph!
                            // The Morph widget will show when result arrives, no need to show raw params
                            console.log('🔨 Morph tool call in progress (waiting for result, hiding params UI)');
                            return (
                              <div key={i} style={{
                                padding: '12px 16px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                color: 'white',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}>
                                <div className="animate-spin">🌀</div>
                                <span>Morph Fast Apply: Processing {(part.input ?? part.args)?.file?.toUpperCase()} changes...</span>
                              </div>
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

                            // Use custom renderer for section update tools (they show diff preview)
                            if (toolName === 'updateSectionHtml' || toolName === 'updateSectionCss' || toolName === 'updateSectionJs') {
                              console.log('📊 Rendering diff preview for:', toolName);
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
                                  onSwitchTab={onSwitchTab}
                                  model={selectedModel}
                                  designSystemSummary={designSystemSummary}
                                />
                              );
                            }

                            // REMOVED: generateHTML tool handler - tool no longer exists
                            // See: editCodeWithMorph tool (works on both empty and existing files)

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

      <PromptInput onSubmit={handleSubmit} style={{ flexShrink: 0, marginTop: '16px' }}>
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
              title={webSearch ? 'Web search enabled' : 'Web search disabled'}
            >
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>
            <PromptInputButton
              variant={includeContext ? 'default' : 'ghost'}
              onClick={() => setIncludeContext(!includeContext)}
              title={includeContext ? 'File context included (HTML/CSS/JS/PHP)' : 'File context excluded'}
            >
              <FileCodeIcon size={16} />
              <span>Context</span>
            </PromptInputButton>
            <PromptInputButton
              variant="ghost"
              onClick={handleViewSystemPrompt}
              title="View the full system prompt sent to AI"
            >
              <EyeIcon size={16} />
              <span>Prompt</span>
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
          <PromptInputSubmit disabled={isLoading || !input.trim()} status={status}>
            <SendIcon size={16} />
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>

      {/* System Prompt Viewer Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>System Prompt Viewer</DialogTitle>
            <DialogDescription>
              This is the exact system prompt sent to the AI with your chat messages.
            </DialogDescription>
            <div className="mt-2 text-xs text-muted-foreground">
              Model: <span className="font-mono">{selectedModel}</span> |
              Context: {includeContext ? '✅ Enabled' : '❌ Disabled'} |
              Web Search: {webSearch ? '✅ Enabled' : '❌ Disabled'}
            </div>
            {promptStats && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t pt-2">
                <div>
                  <span className="font-semibold">Total Characters:</span> {promptStats.totalChars.toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold">Est. Tokens:</span> ~{promptStats.estimatedTokens.toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold">HTML Size:</span> {promptStats.htmlChars.toLocaleString()} chars
                </div>
                <div>
                  <span className="font-semibold">CSS Size:</span> {promptStats.cssChars.toLocaleString()} chars
                </div>
                <div>
                  <span className="font-semibold">JS Size:</span> {promptStats.jsChars.toLocaleString()} chars
                </div>
                <div>
                  <span className="font-semibold">PHP Size:</span> {promptStats.phpChars.toLocaleString()} chars
                </div>
              </div>
            )}
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full rounded border bg-muted/50 p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {systemPrompt || 'Loading system prompt...'}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(systemPrompt);
              }}
            >
              <CopyIcon size={16} className="mr-2" />
              Copy to Clipboard
            </Button>
            <Button onClick={() => setShowPromptDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
