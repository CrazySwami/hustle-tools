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
import { CopyIcon, RotateCcwIcon, GlobeIcon, SendIcon, PanelRightOpen, FileText, FileIcon, EyeIcon, File, ImageIcon, XIcon } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ConversationTokenData } from '@/components/ui/ConversationTokenIndicator';
import { MODEL_CONTEXT_LIMITS } from '@/lib/token-validator';
import { generateDocSystemPrompt } from '@/lib/generate-doc-system-prompt';
import { encodingForModel } from 'js-tiktoken';
import TurndownService from 'turndown';
import { PieChartIcon } from '@/components/ui/PieChartIcon';
import { SystemPromptViewer } from '@/components/ui/SystemPromptViewer';
import Image from 'next/image';
import { MobilePromptActions } from '@/components/ai-elements/MobilePromptActions';
import { ProjectContextBadge } from '@/components/ai-elements/project-context-badge';
import { ClientSelectorButton } from '@/components/client/ClientSelectorButton';
import { ClientModal } from '@/components/client/ClientModal';
import { Client } from '@/components/client/ClientTypes';

interface DocumentChatProps {
  messages: any[];
  isLoading: boolean;
  status?: string;
  error?: Error | null;
  onSendMessage: (text: string, settings?: { webSearchEnabled: boolean; includeContext?: boolean; imageFile?: File }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReload?: () => void;
  isEditorVisible: boolean;
  onToggleEditor: () => void;
  webSearchEnabled?: boolean;
  onWebSearchChange?: (enabled: boolean) => void;
  // Context badge props
  currentDocument?: { title: string; id: string} | null;
  currentProject?: { name: string; id: string } | null;
  wordCount?: number;
  // System prompt viewer props
  systemPrompt?: string;
  documentContent?: string;
  navigationBar?: React.ReactNode;
  // Responsive UI
  containerWidth?: number;
  // Client context props
  selectedClient?: Client | null;
  clientContextEnabled?: boolean;
  onClientChange?: (clientId: string) => void;
  onClientContextToggle?: () => void;
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
        className={`group relative inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium tracking-tight shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden rounded-full cursor-default
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
  }
];

export function DocumentChat({
  messages,
  isLoading,
  status,
  error,
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
  navigationBar,
  containerWidth = 0,
  selectedClient = null,
  clientContextEnabled = false,
  onClientChange,
  onClientContextToggle,
}: DocumentChatProps) {
  const [input, setInput] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [conversationTokenData, setConversationTokenData] = useState<ConversationTokenData | null>(null);
  const [sendDisabled, setSendDisabled] = useState(false);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [autoCloseChat, setAutoCloseChat] = useState(() => {
    // Read from localStorage, default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('doc-auto-close-chat');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save autoCloseChat to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('doc-auto-close-chat', autoCloseChat.toString());
    }
  }, [autoCloseChat]);

  // Use controlled webSearch if provided, otherwise use local state
  const webSearch = webSearchEnabled;
  const setWebSearch = (value: boolean) => {
    if (onWebSearchChange) {
      onWebSearchChange(value);
    }
  };

  // Get context limit for selected model
  const contextLimit = MODEL_CONTEXT_LIMITS[selectedModel] || 128000;

  // Memoize TurndownService instance (expensive to create)
  const turndownService = useMemo(() => new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  }), []);

  // Memoize markdown conversion (expensive operation)
  const markdownContent = useMemo(() =>
    documentContent ? turndownService.turndown(documentContent) : '',
    [documentContent, turndownService]
  );

  // Calculate document character count (from HTML content)
  const documentCharacterCount = documentContent ? documentContent.length : 0;

  // Memoize system prompt generation
  const actualSystemPrompt = useMemo(() => generateDocSystemPrompt({
    includeContext,
    documentContent: markdownContent,
    documentTitle: currentDocument?.title || '',
    projectName: currentProject?.name || '',
    clientData: clientContextEnabled && selectedClient ? selectedClient : null,
  }), [includeContext, markdownContent, currentDocument?.title, currentProject?.name, clientContextEnabled, selectedClient]);

  // Memoize tiktoken encoding instance (expensive to create)
  const encoding = useMemo(() => encodingForModel('gpt-4o'), []);

  // Memoize token calculations (expensive encoding operations)
  const systemTokensForModal = useMemo(() =>
    encoding.encode(actualSystemPrompt).length,
    [encoding, actualSystemPrompt]
  );
  const inputTokensForModal = useMemo(() =>
    input ? encoding.encode(input).length : 0,
    [encoding, input]
  );

  // Get conversation tokens from the PromptTokenCounter state
  // (this will be extracted in the useEffect below)
  const conversationTokensForModal = conversationTokenData?.totalTokens || 0;

  // Total tokens = system + conversation + input (matches PromptTokenCounter exactly)
  const totalTokensForModal = systemTokensForModal + conversationTokensForModal + inputTokensForModal;
  const totalCharsForModal = actualSystemPrompt.length + input.length;

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

  // Show warning when approaching 70% token usage
  useEffect(() => {
    if (conversationTokenData && conversationTokenData.percentUsed >= 70) {
      setShowTokenWarning(true);
      // Auto-hide warning after 10 seconds
      const timer = setTimeout(() => setShowTokenWarning(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [conversationTokenData?.percentUsed]);

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Only PNG and JPEG images are supported');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAttachedImage({ file, preview: previewUrl });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attached image
  const handleRemoveImage = () => {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.preview);
      setAttachedImage(null);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (attachedImage) {
        URL.revokeObjectURL(attachedImage.preview);
      }
    };
  }, [attachedImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !sendDisabled) {
      onSendMessage(input, {
        webSearchEnabled: webSearch,
        includeContext,
        imageFile: attachedImage?.file,
      });
      setInput('');
      handleRemoveImage(); // Clear image after sending
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
    <div className="chat-background" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Conversation className="flex-1 scrollbar-hide" style={{ overflow: 'hidden' }}>
        <ConversationContent className="scrollbar-hide px-3" style={{ flex: 1, overflow: 'auto' }}>
          {/* API Error Display */}
          {error && (
            <div className="mx-4 my-2 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                    Request Failed
                  </h3>
                  <p className="text-sm text-red-600/90 dark:text-red-400/90">
                    {error.message || 'An error occurred while processing your request'}
                  </p>
                  {error.message?.includes('token') && (
                    <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-2">
                      💡 Try starting a new conversation or shortening your message
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Token Usage Warning */}
          {showTokenWarning && conversationTokenData && (
            <div className={cn(
              "mx-4 my-2 p-4 rounded-lg border",
              conversationTokenData.level === 'warning' && "border-yellow-500/30 bg-yellow-500/10",
              conversationTokenData.level === 'critical' && "border-orange-500/30 bg-orange-500/10",
              conversationTokenData.level === 'exceeded' && "border-red-500/30 bg-red-500/10"
            )}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className={cn(
                    "h-5 w-5",
                    conversationTokenData.level === 'warning' && "text-yellow-600 dark:text-yellow-400",
                    conversationTokenData.level === 'critical' && "text-orange-600 dark:text-orange-400",
                    conversationTokenData.level === 'exceeded' && "text-red-600 dark:text-red-400"
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "text-sm font-semibold mb-1",
                    conversationTokenData.level === 'warning' && "text-yellow-600 dark:text-yellow-400",
                    conversationTokenData.level === 'critical' && "text-orange-600 dark:text-orange-400",
                    conversationTokenData.level === 'exceeded' && "text-red-600 dark:text-red-400"
                  )}>
                    {conversationTokenData.message}
                  </h3>
                  <p className={cn(
                    "text-sm mb-2",
                    conversationTokenData.level === 'warning' && "text-yellow-600/90 dark:text-yellow-400/90",
                    conversationTokenData.level === 'critical' && "text-orange-600/90 dark:text-orange-400/90",
                    conversationTokenData.level === 'exceeded' && "text-red-600/90 dark:text-red-400/90"
                  )}>
                    {conversationTokenData.action}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "font-mono",
                      conversationTokenData.level === 'warning' && "text-yellow-600/70 dark:text-yellow-400/70",
                      conversationTokenData.level === 'critical' && "text-orange-600/70 dark:text-orange-400/70",
                      conversationTokenData.level === 'exceeded' && "text-red-600/70 dark:text-red-400/70"
                    )}>
                      {conversationTokenData.totalTokens.toLocaleString()} / {conversationTokenData.limit.toLocaleString()} tokens ({conversationTokenData.percentUsed.toFixed(1)}%)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowTokenWarning(false)}
                    className="text-xs underline mt-2 opacity-70 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  {/* Image attachments - show above message as small rounded thumbnails */}
                  {message.role === 'user' && message.parts && message.parts.some((p: any) =>
                    (p.type === 'file' || p.type === 'image') &&
                    p.url &&
                    (p.mediaType?.startsWith('image/') || p.mimeType?.startsWith('image/'))
                  ) && (
                    <div className="flex gap-2 mb-1">
                      {message.parts.filter((p: any) =>
                        (p.type === 'file' || p.type === 'image') &&
                        p.url &&
                        (p.mediaType?.startsWith('image/') || p.mimeType?.startsWith('image/'))
                      ).map((part: any, i: number) => (
                        <div key={i} className="relative">
                          <Image
                            src={part.url}
                            alt="Attachment"
                            width={80}
                            height={80}
                            className="rounded-lg object-cover border border-border"
                            style={{ width: '80px', height: '80px' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <MessageContent>
                    {message.parts ? (
                      message.parts.filter(part => part != null).map((part: any, i: number) => {
                        switch (part.type) {
                          case 'text':
                            return <Response key={i}>{(part.text ?? part.value) as string}</Response>;

                          case 'file':
                          case 'image':
                            // Don't render images inline - they're shown above as attachments
                            return null;

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

                            // Otherwise render loading state (input phase) - similar to DocumentMorphWidget
                            const toolLabels: Record<string, { icon: string; label: string; description: string }> = {
                              editDocumentWithMorph: { icon: '✨', label: 'AI Document Edit', description: 'Analyzing and applying changes...' },
                              getTextStats: { icon: '📊', label: 'Text Statistics', description: 'Analyzing document...' },
                              findString: { icon: '🔍', label: 'Find Text', description: 'Searching document...' },
                              analyzeReadability: { icon: '📖', label: 'Readability Analysis', description: 'Analyzing readability...' },
                              extractHeadings: { icon: '📑', label: 'Extract Headings', description: 'Extracting structure...' },
                              findAndReplace: { icon: '🔄', label: 'Find & Replace', description: 'Processing replacements...' },
                              generateTOC: { icon: '📋', label: 'Generate TOC', description: 'Creating table of contents...' },
                              findDuplicates: { icon: '👯', label: 'Find Duplicates', description: 'Scanning for duplicates...' },
                            };

                            const toolConfig = toolLabels[toolName] || { icon: '⚡', label: toolName, description: 'Processing...' };

                            return (
                              <div key={i} className="my-3 rounded-lg border border-purple-500/20 transition-all duration-200">
                                <div className="p-4 space-y-3">
                                  {/* Header with loading animation */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                                    </div>
                                    <span className="text-sm font-semibold">{toolConfig.icon} {toolConfig.label}</span>
                                  </div>

                                  {/* Description */}
                                  <div className="text-sm text-muted-foreground">
                                    {toolConfig.description}
                                  </div>

                                  {/* Loading indicator */}
                                  <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                                    </div>
                                    <span>Processing...</span>
                                  </div>
                                </div>
                              </div>
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

      {/* Project Context Badge - using same component as Elementor editor */}
      {currentDocument && (() => {
        console.log('📄 DocumentChat passing to ProjectContextBadge:', {
          documentTitle: currentDocument.title,
          hasDocumentContent: !!documentContent,
          documentContentLength: documentContent?.length || 0,
          hasMarkdownContent: !!markdownContent,
          markdownContentLength: markdownContent?.length || 0,
          markdownPreview: markdownContent?.substring(0, 100)
        });
        return (
          <ProjectContextBadge
            currentSection={{
              name: currentDocument.title,
              type: 'document',
              content: markdownContent, // Pass document content for metrics calculation
              // Document doesn't have code files, so leave these undefined
              html: undefined,
              css: undefined,
              js: undefined,
              php: undefined,
              hubl: undefined,
            }}
            includeContext={includeContext}
          />
        );
      })()}

      <PromptInput
        onSubmit={handleSubmit}
        style={{ flexShrink: 0, margin: '0 auto 10px auto', width: '97%' }}
        promptValue={input}
        systemPrompt={actualSystemPrompt}
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
        {/* Image Preview */}
        {attachedImage && (
          <div className="px-3 py-2 border-t border-border">
            <div className="relative inline-block">
              <Image
                src={attachedImage.preview}
                alt="Attached image"
                width={120}
                height={120}
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                title="Remove image"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>
        )}
        <PromptInputToolbar>
          <PromptInputTools>
            {/* Responsive: Dropdown on narrow, buttons on wide */}
            <MobilePromptActions
              breakpoint={600}
              containerWidth={containerWidth}
              actions={[
                {
                  id: 'web-search',
                  label: 'Web Search',
                  icon: <GlobeIcon size={18} />,
                  isActive: webSearch,
                  onClick: () => setWebSearch(!webSearch),
                  title: webSearch ? 'Web search enabled' : 'Web search disabled',
                },
                {
                  id: 'document-context',
                  label: 'Document Context',
                  icon: <FileIcon size={18} />,
                  isActive: includeContext,
                  onClick: () => setIncludeContext(!includeContext),
                  title: includeContext ? 'Document context included' : 'Document context excluded',
                },
                {
                  id: 'attach-image',
                  label: 'Attach Image',
                  icon: <ImageIcon size={18} />,
                  isActive: attachedImage !== null,
                  onClick: () => fileInputRef.current?.click(),
                  title: 'Attach image (PNG/JPEG, max 5MB)',
                },
              ]}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImageSelect}
              className="hidden"
            />
            <ClientSelectorButton
              selectedClient={selectedClient}
              clientContextEnabled={clientContextEnabled}
              onToggleContext={() => onClientContextToggle?.()}
              onSelectClient={() => setClientModalOpen(true)}
            />
            <SystemPromptViewer
              input={input}
              systemPrompt={actualSystemPrompt}
              selectedModel={selectedModel}
              contextLimit={contextLimit}
              systemTokens={systemTokensForModal}
              inputTokens={inputTokensForModal}
              conversationTokens={conversationTokensForModal}
              totalTokens={totalTokensForModal}
              trigger={
                <PromptInputButton
                  variant="ghost"
                  title={`Token Usage: ${totalTokensForModal.toLocaleString()} / ${contextLimit.toLocaleString()} (${((totalTokensForModal / contextLimit) * 100).toFixed(1)}%)`}
                  className="gap-2"
                >
                  <PieChartIcon
                    percentage={(totalTokensForModal / contextLimit) * 100}
                    size={16}
                  />
                  <span className="text-xs font-mono tabular-nums">
                    {totalTokensForModal.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">|</span>
                  <span className="text-xs font-mono tabular-nums text-muted-foreground">
                    {((totalTokensForModal / contextLimit) * 100).toFixed(1)}%
                  </span>
                </PromptInputButton>
              }
              metadata={{
                documentTitle: currentDocument?.title,
                projectName: currentProject?.name,
                wordCount,
                characterCount: documentCharacterCount,
              }}
              contextToggles={{
                includeContext,
                webSearch: webSearchEnabled,
              }}
              fileContents={{
                documentContent,
              }}
              clientData={selectedClient || undefined}
              clientContextEnabled={clientContextEnabled}
            />
            <PromptInputModelSelect onValueChange={onModelChange} value={selectedModel}>
              <PromptInputModelSelectTrigger title="Select AI model">
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
          <PromptInputSubmit
            disabled={isLoading || !input.trim() || sendDisabled}
            status={status}
            title={
              status === 'streaming' ? 'Stop generation' :
              isLoading ? 'Sending...' :
              sendDisabled ? 'Token limit exceeded' :
              !input.trim() ? 'Type a message first' :
              'Send message (Enter)'
            }
          >
            <SendIcon size={16} />
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>

      {/* Client Modal */}
      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        selectedClientId={selectedClient?.id || null}
        onSelectClient={(clientId) => {
          onClientChange?.(clientId);
        }}
      />
    </div>
  );
}
