'use client';

import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputTokenCounterSection,
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
import { CopyIcon, RotateCcwIcon, GlobeIcon, SendIcon, PanelRightOpen, FileText, FileIcon, EyeIcon, File } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ConversationTokenIndicator, ConversationTokenData } from '@/components/ui/ConversationTokenIndicator';
import { MODEL_CONTEXT_LIMITS } from '@/lib/token-validator';

interface DocumentChatProps {
  messages: any[];
  isLoading: boolean;
  status?: string;
  onSendMessage: (text: string, settings?: { webSearchEnabled: boolean; includeContext?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReload?: () => void;
  isEditorVisible: boolean;
  onToggleEditor: () => void;
  webSearchEnabled?: boolean;
  onWebSearchChange?: (enabled: boolean) => void;
  // Context badge props
  currentDocument?: { title: string; id: string } | null;
  currentProject?: { name: string; id: string } | null;
  wordCount?: number;
  // System prompt viewer props
  systemPrompt?: string;
  documentContent?: string;
}

// Document Context Badge Component
function DocumentContextBadge({
  currentDocument,
  currentProject,
  wordCount,
  includeContext = true,
}: {
  currentDocument?: { title: string; id: string } | null;
  currentProject?: { name: string; id: string } | null;
  wordCount?: number;
  includeContext?: boolean;
}) {
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    const stages = [
      { delay: 0, stage: 1 },
      { delay: 300, stage: 2 },
      { delay: 600, stage: 3 },
      { delay: 900, stage: 4 },
      { delay: 1500, stage: 5 },
    ];

    stages.forEach(({ delay, stage }) => {
      setTimeout(() => setAnimationStage(stage), delay);
    });
  }, []);

  const documentTitle = currentDocument?.title || 'Untitled Document';
  const projectName = currentProject?.name || 'My Documents';

  return (
    <div className="flex justify-center items-center gap-3 mb-4" style={{ background: 'transparent' }}>
      <div
        className={`group relative inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium tracking-tight shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden rounded-full cursor-default
          ${animationStage === 0 ? "opacity-0 translate-y-4" : ""}
          ${animationStage === 1 ? "opacity-100 translate-y-4" : ""}
          ${animationStage >= 2 ? "opacity-100 translate-y-0" : ""}
        `}
      >
        {/* Green/Red dot with flash animation - red when context disabled */}
        <div
          className={`h-2 w-2 rounded-full ${includeContext ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300
            ${animationStage >= 5 ? "animate-pulse" : "opacity-0"}
            ${animationStage >= 3 ? "opacity-100" : ""}
          `}
        />

        {/* Content that appears after slide up */}
        {animationStage >= 3 && (
          <>
            <span className="text-xs opacity-70 animate-in fade-in slide-in-from-left-2 duration-300">
              Current Document
            </span>
            <span className="text-xs opacity-50 animate-in fade-in duration-300" style={{ animationDelay: "100ms" }}>
              •
            </span>
            <File
              className="h-4 w-4 text-cyan-400 transition-transform duration-500 group-hover:rotate-12 animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: "200ms" }}
            />
            <span
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: "300ms" }}
            >
              {documentTitle}
            </span>

            {/* Word count badge */}
            {wordCount !== undefined && (
              <div
                className="flex items-center gap-2 ml-1 animate-in fade-in slide-in-from-right-2 duration-300"
                style={{ animationDelay: "400ms" }}
              >
                <div className="h-4 w-px bg-white/30" />
                <span className="text-xs opacity-70">{wordCount.toLocaleString()} words</span>
              </div>
            )}
          </>
        )}

        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
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

export function DocumentChat({
  messages,
  isLoading,
  status,
  onSendMessage,
  selectedModel,
  onModelChange,
  onReload,
  isEditorVisible,
  onToggleEditor,
  webSearchEnabled = false,
  onWebSearchChange,
  currentDocument,
  currentProject,
  wordCount = 0,
  systemPrompt = '',
  documentContent = '',
}: DocumentChatProps) {
  const [input, setInput] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [conversationTokenData, setConversationTokenData] = useState<ConversationTokenData | null>(null);
  const [sendDisabled, setSendDisabled] = useState(false);

  // Use controlled webSearch if provided, otherwise use local state
  const webSearch = webSearchEnabled;
  const setWebSearch = (value: boolean) => {
    if (onWebSearchChange) {
      onWebSearchChange(value);
    }
  };

  // Calculate stats for system prompt viewer
  const totalChars = systemPrompt.length + documentContent.length;
  const estimatedTokens = Math.ceil(totalChars / 4);

  // Get context limit for selected model
  const contextLimit = MODEL_CONTEXT_LIMITS[selectedModel] || 128000;

  // Extract conversation token data from message metadata
  useEffect(() => {
    // Find the last message with metadata containing contextWindow
    const lastMessageWithMetadata = messages
      .slice()
      .reverse()
      .find((msg: any) => msg.metadata?.contextWindow);

    if (lastMessageWithMetadata?.metadata?.contextWindow) {
      const cw = lastMessageWithMetadata.metadata.contextWindow;
      setConversationTokenData({
        totalTokens: cw.tokenCount || 0,
        limit: cw.limit || contextLimit,
        percentUsed: cw.percentUsed || 0,
        level: cw.level || 'safe',
        message: cw.message || 'Token usage is healthy',
        action: cw.action || 'Continue normally',
        model: cw.model || selectedModel,
        messageCount: messages.length,
        strategy: cw.strategy,
      });
    }
  }, [messages, selectedModel, contextLimit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !sendDisabled) {
      onSendMessage(input, {
        webSearchEnabled: webSearch,
        includeContext,
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      padding: '0 24px 24px 24px',
      position: 'relative',
    }}>
      {/* Conversation Token Indicator - Fixed top-right */}
      <ConversationTokenIndicator
        data={conversationTokenData}
        position="top-right"
      />

      <Conversation className="flex-1 scrollbar-hide" style={{ overflow: 'hidden' }}>
        <ConversationContent className="scrollbar-hide" style={{ flex: 1, overflow: 'auto' }}>
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
                        switch (part.type) {
                          case 'text':
                            return <Response key={i}>{(part.text ?? part.value) as string}</Response>;

                          case 'step-start':
                            // Ignore step-start parts (just markers)
                            return null;

                          // Document-specific tools
                          case 'tool-editDocumentWithMorph':
                          case 'tool-getTextStats':
                          case 'tool-findString':
                          case 'tool-analyzeReadability':
                          case 'tool-extractHeadings':
                          case 'tool-findAndReplace':
                          case 'tool-generateTOC':
                          case 'tool-findDuplicates': {
                            // Handle typed tool parts (AI SDK 5 pattern)
                            const toolName = part.type.replace('tool-', '');

                            // If it has output/result, render with custom widget
                            if (part.output || part.result) {
                              const result = part.output ?? part.result;
                              return (
                                <ToolResultRenderer
                                  key={i}
                                  toolResult={{
                                    toolCallId: part.toolCallId ?? '',
                                    toolName,
                                    args: part.input ?? part.args ?? {},
                                    result: result.type === 'json' ? result.value : result,
                                  }}
                                />
                              );
                            }

                            // Otherwise render as tool-call (input phase)
                            return (
                              <Tool key={i} defaultOpen>
                                <ToolHeader type={toolName} state="input-available" />
                                <ToolContent>
                                  <ToolInput input={part.input ?? part.args ?? {}} />
                                </ToolContent>
                              </Tool>
                            );
                          }

                          case 'tool-call':
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

                            // Use custom renderer for document tools
                            if (toolName === 'editDocumentWithMorph' || toolName === 'getTextStats' ||
                                toolName === 'findString' || toolName === 'analyzeReadability' ||
                                toolName === 'extractHeadings' || toolName === 'findAndReplace' ||
                                toolName === 'generateTOC' || toolName === 'findDuplicates') {
                              return (
                                <ToolResultRenderer
                                  key={i}
                                  toolResult={{
                                    toolCallId: part.toolCallId ?? '',
                                    toolName,
                                    args,
                                    result: result.type === 'json' ? result.value : result,
                                  }}
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

      {/* Document Context Badge */}
      {currentDocument && (
        <DocumentContextBadge
          currentDocument={currentDocument}
          currentProject={currentProject}
          wordCount={wordCount}
          includeContext={includeContext}
        />
      )}

      <PromptInput
        onSubmit={handleSubmit}
        style={{ flexShrink: 0, margin: '8px 0 10px 0' }}
        promptValue={input}
        systemPrompt={systemPrompt}
        contextLimit={contextLimit}
        conversationTokens={conversationTokenData?.totalTokens || 0}
        onSendDisabled={setSendDisabled}
        showTokenCounter={true}
      >
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me to write or edit your document..."
        />
        <PromptInputTokenCounterSection
          promptValue={input}
          systemPrompt={systemPrompt}
          contextLimit={contextLimit}
          conversationTokens={conversationTokenData?.totalTokens || 0}
          onSendDisabled={setSendDisabled}
          showDetails={false}
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
              title={includeContext ? 'Document context included' : 'Document context excluded'}
            >
              <FileIcon size={16} />
              <span>Context</span>
            </PromptInputButton>
            <PromptInputButton
              variant="ghost"
              onClick={() => setShowSystemPrompt(true)}
              title="View system prompt"
            >
              <EyeIcon size={16} />
              <span>Prompt</span>
            </PromptInputButton>
            <PromptInputButton
              variant={isEditorVisible ? 'default' : 'ghost'}
              onClick={onToggleEditor}
              title="Toggle document editor"
            >
              <PanelRightOpen size={16} />
              <span>Editor</span>
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
          <PromptInputSubmit disabled={isLoading || !input.trim() || sendDisabled} status={status}>
            <SendIcon size={16} />
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>

      {/* System Prompt Viewer Modal */}
      {showSystemPrompt && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowSystemPrompt(false)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl max-h-[80vh] overflow-hidden w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">System Prompt Viewer</h2>
              <button
                onClick={() => setShowSystemPrompt(false)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(80vh-80px)]">
              {/* Stats */}
              <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Model:</span> {selectedModel}
                </div>
                {currentDocument && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium">Document:</span> {currentDocument.title}
                    </div>
                    {currentProject && (
                      <div className="text-sm">
                        <span className="font-medium">Project:</span> {currentProject.name}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="font-medium">Word Count:</span> {wordCount.toLocaleString()}
                    </div>
                  </>
                )}
                <div className="text-sm">
                  <span className="font-medium">Total Characters:</span> {totalChars.toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Est. Tokens:</span> ~{estimatedTokens.toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Context:</span>{' '}
                  <span className={includeContext ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {includeContext ? '✓ Enabled' : '✗ Disabled'}
                  </span> | Web Search:{' '}
                  <span className={webSearch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {webSearch ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
              </div>

              {/* System Prompt */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">System Prompt:</h3>
                <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap">
                  {systemPrompt}
                </pre>
              </div>

              {/* Document Content */}
              {documentContent && (
                <div>
                  <h3 className="font-medium mb-2">Document Content ({documentContent.length.toLocaleString()} chars):</h3>
                  <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap">
                    {documentContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
