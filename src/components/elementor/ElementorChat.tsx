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
import { CopyIcon, RotateCcwIcon, GlobeIcon, SendIcon, FileCodeIcon, EyeIcon, FileCode, Paperclip, XIcon, ImageIcon } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import { getModelContextLimit, estimateTokenCount } from '@/lib/token-validator';
import { PieChartIcon } from '@/components/ui/PieChartIcon';
import { SystemPromptViewer } from '@/components/ui/SystemPromptViewer';
import { generateElementorSystemPrompt } from '@/lib/generate-elementor-system-prompt';
import { MobilePromptActions } from '@/components/ai-elements/MobilePromptActions';
import { ProjectContextBadge } from '@/components/ai-elements/project-context-badge';
import { MODEL_PRICING } from '@/hooks/useUsageTracking';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ElementorChatProps {
  messages: any[];
  isLoading: boolean;
  status?: string;
  onSendMessage: (text: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean; includeContext?: boolean; includeCss?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReload?: () => void;
  onStreamUpdate?: (type: 'html' | 'css' | 'js', content: string) => void;
  onSwitchToSectionEditor?: () => void;
  onSwitchCodeTab?: (tab: string) => void;
  onSwitchTab?: (tab: string) => void;
  onUpdateSection?: (updates: { html?: string; css?: string; js?: string }) => void;
  currentSection?: any;
  globalCss?: string;
  navigationBar?: React.ReactNode;
  containerWidth?: number; // Container width for responsive prompt actions
  onProjectCreate?: (name: string, type: 'html' | 'php' | 'hubspot', generationState?: 'generating' | 'ready' | 'error') => string; // Returns new project ID
  onProjectUpdate?: (projectId: string, file: string, content: string) => void;
  onProjectMetadataUpdate?: (projectId: string, metadata: Partial<{ isPlugin: boolean; pluginMainFile: string; pluginName: string; pluginSlug: string }>) => void; // Update plugin metadata
  onProjectStateUpdate?: (projectId: string, state: 'generating' | 'ready' | 'error', error?: string) => void; // Update generation state
  isEditorReady?: (fileType: string) => boolean; // Check if editor is mounted and ready
  fileInclusions?: {
    html: boolean;
    css: boolean;
    js: boolean;
    php: boolean;
    hubl: boolean;
    pluginMainFile: boolean;
    readme: boolean;
  };
  onOpenFileInclusions?: () => void;
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
  currentSection,
  globalCss = '',
  navigationBar,
  containerWidth,
  onProjectCreate,
  onProjectUpdate,
  onProjectMetadataUpdate,
  onProjectStateUpdate,
  isEditorReady,
  fileInclusions,
  onOpenFileInclusions
}: ElementorChatProps) {
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [includeContext, setIncludeContext] = useState(true); // Toggle for file context
  const [includeCss, setIncludeCss] = useState(false); // Toggle for CSS context
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [autoCloseChat, setAutoCloseChat] = useState(() => {
    // Read from localStorage, default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elementor-auto-close-chat');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { designSystemSummary, globalCss: globalCssFromContext } = useGlobalStylesheet();

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
      localStorage.setItem('elementor-auto-close-chat', autoCloseChat.toString());
    }
  }, [autoCloseChat]);

  // Use globalCss from context if prop is not provided
  const effectiveGlobalCss = globalCss || globalCssFromContext;

  // Debug CSS availability
  useEffect(() => {
    console.log('🎨 CSS Debug:', {
      includeCss,
      globalCssLength: effectiveGlobalCss?.length || 0,
      hasGlobalCss: !!effectiveGlobalCss,
      globalCssPreview: effectiveGlobalCss?.substring(0, 100),
      willBeIncludedInPrompt: includeCss && !!effectiveGlobalCss
    });

    if (includeCss && !effectiveGlobalCss) {
      console.warn('⚠️ CSS toggle is ON but no global CSS available!');
    }
  }, [includeCss, effectiveGlobalCss]);

  // Debug currentSection to see what files are available
  useEffect(() => {
    console.log('📦 Current Section Debug:', {
      hasSection: !!currentSection,
      htmlLength: currentSection?.html?.length || 0,
      cssLength: currentSection?.css?.length || 0,
      jsLength: currentSection?.js?.length || 0,
      phpLength: currentSection?.php?.length || 0,
      pluginMainFileLength: currentSection?.pluginMainFile?.length || 0,
      widgetFilesCount: currentSection?.widgetFiles ? Object.keys(currentSection.widgetFiles).length : 0,
      widgetFileNames: currentSection?.widgetFiles ? Object.values(currentSection.widgetFiles).map((w: any) => w.name) : [],
      isPlugin: currentSection?.isPlugin || false
    });
  }, [currentSection]);

  // Generate system prompt client-side (matches API logic)
  // CRITICAL: Use useMemo to prevent infinite re-generation on every render
  const systemPrompt = useMemo(() => {
    const prompt = generateElementorSystemPrompt({
      includeContext,
      includeCss,
      webSearch,
      currentSection,
      globalCss: effectiveGlobalCss,
      fileInclusions,
    });
    console.log('📝 System prompt generated:', {
      includeCss,
      promptLength: prompt.length,
      hasStyleKitSection: prompt.includes('ELEMENTOR STYLE KIT CSS'),
      hasPluginMainFile: prompt.includes('PLUGIN MAIN FILE'),
      hasWidgetFiles: prompt.includes('WIDGET FILE:'),
      widgetFileMatches: (prompt.match(/WIDGET FILE:/g) || []).length
    });
    return prompt;
  }, [includeContext, includeCss, webSearch, currentSection, effectiveGlobalCss, fileInclusions]);

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

  const handleRemoveImage = () => {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.preview);
      setAttachedImage(null);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (attachedImage) {
        URL.revokeObjectURL(attachedImage.preview);
      }
    };
  }, [attachedImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // If image is attached, convert to data URL and include in message
      if (attachedImage) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageDataUrl = reader.result as string;
          onSendMessage(input, { url: imageDataUrl, filename: attachedImage.file.name }, {
            webSearchEnabled: webSearch,
            reasoningEffort: 'medium',
            detailedMode: false,
            includeContext,
            includeCss,
          });
          setInput('');
          handleRemoveImage();
        };
        reader.readAsDataURL(attachedImage.file);
      } else {
        onSendMessage(input, undefined, {
          webSearchEnabled: webSearch,
          reasoningEffort: 'medium',
          detailedMode: false,
          includeContext,
          includeCss,
        });
        setInput('');
      }
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

  // Calculate file stats for current project
  const projectFiles = currentSection ? [
    currentSection.html && 'HTML',
    currentSection.css && 'CSS',
    currentSection.js && 'JS',
    currentSection.php && 'PHP',
    currentSection.hubl && 'HubL'
  ].filter(Boolean) : [];

  const totalChars = currentSection ?
    (currentSection.html?.length || 0) +
    (currentSection.css?.length || 0) +
    (currentSection.js?.length || 0) +
    (currentSection.php?.length || 0) +
    (currentSection.hubl?.length || 0) : 0;

  // Token counter calculations
  // CRITICAL: Memoize token calculations to prevent recalculating on every render
  const contextLimit = useMemo(() => getModelContextLimit(selectedModel), [selectedModel]);
  const systemTokens = useMemo(() => estimateTokenCount(systemPrompt), [systemPrompt]);
  const inputTokens = useMemo(() => estimateTokenCount(input), [input]);
  const conversationTokens = useMemo(() => {
    return messages.reduce((total, msg) => {
      if (typeof msg.content === 'string') {
        return total + estimateTokenCount(msg.content);
      }
      return total;
    }, 0);
  }, [messages]);
  const totalTokens = systemTokens + conversationTokens + inputTokens;

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
                          case 'tool-editCodeWithMorph': // ⭐ Morph Fast Apply (PRIMARY tool for all code writing)
                          case 'tool-generateProject': {  // ⭐ Project generation tool
                            // Handle typed tool parts (AI SDK 5 pattern)
                            // Extract tool name from part type (e.g., 'tool-testPing' → 'testPing')
                            const toolName = part.type.replace('tool-', '');
                            console.log(`🎯 ${toolName} tool detected!`, part);

                            // If it has output/result, render as tool-result
                            if (part.output || part.result) {
                              const result = part.output ?? part.result;
                              console.log('✅ Tool has result, rendering widget:', result);
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
                                  globalCSS={effectiveGlobalCss}
                                  onProjectCreate={onProjectCreate}
                                  onProjectUpdate={onProjectUpdate}
                                  onProjectMetadataUpdate={onProjectMetadataUpdate}
                                  onProjectStateUpdate={onProjectStateUpdate}
                                  isEditorReady={isEditorReady}
                                />
                              );
                            }

                            // Otherwise render as tool-call (input phase) - NO PARAMETERS UI for Morph!
                            // The Morph widget will show when result arrives, no need to show raw params
                            console.log('🔨 Morph tool call in progress (waiting for result, hiding params UI)');
                            return (
                              <div key={i} className="my-3 rounded-lg border border-blue-500/20 bg-white p-4">
                                <div className="flex items-center gap-2">
                                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="text-sm font-medium text-foreground">Morph Fast Apply: Processing {(part.input ?? part.args)?.file?.toUpperCase()} changes...</span>
                                </div>
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
                                  globalCSS={effectiveGlobalCss}
                                  onProjectCreate={onProjectCreate}
                                  onProjectUpdate={onProjectUpdate}
                                  onProjectMetadataUpdate={onProjectMetadataUpdate}
                                  onProjectStateUpdate={onProjectStateUpdate}
                                  isEditorReady={isEditorReady}
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
                          case 'file':
                          case 'image':
                            // Don't render images inline - they're shown above as attachments
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

      {/* Project Context Badge */}
      {currentSection && (() => {
        // Detect dark mode
        const isDarkMode = typeof window !== 'undefined' &&
          document.documentElement.classList.contains('dark');

        return (
          <ProjectContextBadge
            key={currentSection.id}
            currentSection={currentSection}
            includeContext={includeContext}
            isDark={isDarkMode}
            onClick={onOpenFileInclusions}
          />
        );
      })()}

      <PromptInput
        onSubmit={handleSubmit}
        style={{ flexShrink: 0, margin: '0 auto 10px auto', width: '97%' }}
      >
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me to modify the Elementor JSON..."
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
                  id: 'attach-image',
                  label: 'Attach Image',
                  icon: <ImageIcon size={18} />,
                  isActive: !!attachedImage,
                  onClick: () => fileInputRef.current?.click(),
                  title: 'Attach image (PNG/JPEG, max 5MB)',
                },
                {
                  id: 'project-files',
                  label: 'Project Files',
                  icon: <FileCodeIcon size={18} />,
                  isActive: includeContext,
                  onClick: () => setIncludeContext(!includeContext),
                  title: includeContext ? 'Project files included' : 'Project files excluded',
                },
                {
                  id: 'style-kit-css',
                  label: 'Style Kit CSS',
                  icon: <span className="text-sm font-medium">CSS</span>,
                  isActive: includeCss,
                  onClick: () => setIncludeCss(!includeCss),
                  title: includeCss ? 'CSS context enabled' : 'CSS context disabled',
                },
                // Only show auto-close on actual mobile devices (not just narrow panels)
                ...(isMobile ? [{
                  id: 'auto-close-chat',
                  label: 'Auto-close Chat on Edit',
                  icon: <span className="text-sm font-medium">⚡</span>,
                  isActive: autoCloseChat,
                  onClick: () => setAutoCloseChat(!autoCloseChat),
                  title: autoCloseChat ? 'Auto-close enabled' : 'Auto-close disabled',
                }] : []),
              ]}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImageSelect}
              className="hidden"
            />
            {/* Debug: Log attached image state */}
            {console.log('ElementorChat - attachedImage:', attachedImage)}
            {console.log('ElementorChat - passing to SystemPromptViewer:', attachedImage ? [{ url: attachedImage.preview, filename: attachedImage.file.name }] : undefined)}
            <SystemPromptViewer
              input={input}
              systemPrompt={systemPrompt}
              selectedModel={selectedModel}
              contextLimit={contextLimit}
              systemTokens={systemTokens}
              inputTokens={inputTokens}
              conversationTokens={conversationTokens}
              totalTokens={totalTokens}
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PromptInputButton
                      variant="ghost"
                      className="gap-2"
                    >
                      <PieChartIcon
                        percentage={(totalTokens / contextLimit) * 100}
                        size={16}
                      />
                      <span className="text-xs font-mono tabular-nums">
                        {totalTokens.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">|</span>
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {((totalTokens / contextLimit) * 100).toFixed(1)}%
                      </span>
                    </PromptInputButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    Token Usage: {totalTokens.toLocaleString()} / {contextLimit.toLocaleString()} ({((totalTokens / contextLimit) * 100).toFixed(1)}%)
                  </TooltipContent>
                </Tooltip>
              }
              metadata={{
                fileStats: {
                  html: currentSection?.html?.length || 0,
                  css: currentSection?.css?.length || 0,
                  js: currentSection?.js?.length || 0,
                  php: currentSection?.php?.length || 0,
                  hubl: currentSection?.hubl?.length || 0,
                  readme: currentSection?.projectManifest?.length || 0,
                  globalCss: includeCss ? effectiveGlobalCss?.length || 0 : 0,
                  pluginMainFile: currentSection?.pluginMainFile?.length || 0,
                  widgetFiles: currentSection?.widgetFiles
                    ? Object.values(currentSection.widgetFiles).reduce((total: number, widget: any) => total + (widget.content?.length || 0), 0)
                    : 0,
                  widgetCount: currentSection?.widgetFiles ? Object.keys(currentSection.widgetFiles).length : 0,
                },
              }}
              contextToggles={{
                includeContext,
                includeCss,
                webSearch,
              }}
              fileContents={{
                html: currentSection?.html,
                css: currentSection?.css,
                js: currentSection?.js,
                php: currentSection?.php,
                hubl: currentSection?.hubl,
                readme: currentSection?.projectManifest,
              }}
              attachedImages={attachedImage ? [{ url: attachedImage.preview, filename: attachedImage.file.name }] : undefined}
              modelPricing={MODEL_PRICING[selectedModel as keyof typeof MODEL_PRICING]}
            />
            <PromptInputModelSelect onValueChange={onModelChange} value={selectedModel}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Select AI model
                </TooltipContent>
              </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <PromptInputSubmit
                disabled={isLoading || !input.trim()}
                status={status as any}
              >
                <SendIcon size={16} />
              </PromptInputSubmit>
            </TooltipTrigger>
            <TooltipContent>
              {status === 'streaming' ? 'Stop generation' :
               isLoading ? 'Sending...' :
               !input.trim() ? 'Type a message first' :
               'Send message (Enter)'}
            </TooltipContent>
          </Tooltip>
        </PromptInputToolbar>
      </PromptInput>

    </div>
  );
}
