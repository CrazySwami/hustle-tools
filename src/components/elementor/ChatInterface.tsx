'use client';

import { Response } from '@/components/ai-elements/response';
import { ElementorToolRenderer } from '@/components/elementor-ui/ElementorToolRenderer';
import { Loader } from '@/components/ai-elements/loader';
import { SlashCommandMenu } from '@/components/elementor/SlashCommandMenu';
import { TokenTracker } from '@/components/elementor/TokenTracker';
import { SettingsModal } from '@/components/elementor/SettingsModal';
import { CitationDisplay } from '@/components/elementor/CitationDisplay';
import { GlobeIcon, FileIcon, PaletteIcon, ImageIcon, BrainIcon } from '@/components/ui/icons';
import { useEffect, useRef, useState } from 'react';
import { FileCode, SendIcon } from 'lucide-react';
import { ConversationTokenIndicator, ConversationTokenData } from '@/components/ui/ConversationTokenIndicator';
import { MODEL_CONTEXT_LIMITS } from '@/lib/token-validator';
import { PromptTokenCounter } from '@/components/ui/PromptTokenCounter';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { MobilePromptActions, type PromptAction } from '@/components/ai-elements/MobilePromptActions';

// Model configurations with token limits
const MODEL_CONFIGS = {
  'anthropic/claude-haiku-4.5-20251022': { name: 'Claude Haiku 4.5', inputLimit: 200000, outputLimit: 8192 },
  'anthropic/claude-sonnet-4.5-20250514': { name: 'Claude Sonnet 4.5', inputLimit: 200000, outputLimit: 8192 },
  'anthropic/claude-opus-4-20250514': { name: 'Claude Opus 4', inputLimit: 200000, outputLimit: 8192 },
  'openai/gpt-5': { name: 'GPT-5', inputLimit: 272000, outputLimit: 128000 },
  'openai/gpt-5-mini': { name: 'GPT-5 Mini', inputLimit: 272000, outputLimit: 128000 },
  'google/gemini-2.5-pro': { name: 'Gemini 2.5 Pro', inputLimit: 1000000, outputLimit: 8192 },
};

// Estimate tokens (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Estimate image tokens (based on GPT-4V pricing: low detail = 85, high detail = 170 per 512px tile + 85 base)
function estimateImageTokens(imageUrl: string, callback: (tokens: number) => void): void {
  const img = new Image();
  img.onload = () => {
    const width = img.width;
    const height = img.height;

    // Calculate number of 512px tiles
    const tilesWidth = Math.ceil(width / 512);
    const tilesHeight = Math.ceil(height / 512);
    const totalTiles = tilesWidth * tilesHeight;

    // High detail: 170 tokens per tile + 85 base tokens
    const tokens = (totalTiles * 170) + 85;
    console.log(`📐 Image size: ${width}x${height} = ${totalTiles} tiles = ${tokens} tokens`);
    callback(tokens);
  };
  img.onerror = () => {
    // Fallback to conservative estimate if image can't be loaded
    console.warn('⚠️ Could not load image, using default 680 tokens');
    callback(680);
  };
  img.src = imageUrl;
}

// Helper function to get extension color
const getExtensionColor = (extension: string): string => {
  const colors: Record<string, string> = {
    HTML: "text-orange-400",
    CSS: "text-blue-400",
    JS: "text-amber-400",
    PHP: "text-purple-400",
    DOC: "text-cyan-400",
  };
  return colors[extension] || "text-gray-400";
};

// Project Context Badge Component
function ProjectContextBadge({ currentSection }: { currentSection: any }) {
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

  // Get project tags based on what files exist
  const tags: string[] = [];
  if (currentSection?.html) tags.push('HTML');
  if (currentSection?.css) tags.push('CSS');
  if (currentSection?.js) tags.push('JS');
  if (currentSection?.php) tags.push('PHP');

  const projectTitle = currentSection?.name || 'Untitled Project';

  return (
    <div className="flex justify-center items-center gap-3 mb-4">
      <div
        className={`group relative inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium tracking-tight shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden rounded-full cursor-default
          ${animationStage === 0 ? "opacity-0 translate-y-4" : ""}
          ${animationStage === 1 ? "opacity-100 translate-y-4" : ""}
          ${animationStage >= 2 ? "opacity-100 translate-y-0" : ""}
        `}
      >
        {/* Green dot with flash animation */}
        <div
          className={`h-2 w-2 rounded-full bg-green-500 transition-all duration-300
            ${animationStage >= 5 ? "animate-pulse" : "opacity-0"}
            ${animationStage >= 3 ? "opacity-100" : ""}
          `}
        />

        {/* Content that appears after slide up */}
        {animationStage >= 3 && (
          <>
            <span className="text-xs opacity-70 animate-in fade-in slide-in-from-left-2 duration-300">
              Currently Project
            </span>
            <span className="text-xs opacity-50 animate-in fade-in duration-300" style={{ animationDelay: "100ms" }}>
              •
            </span>
            <FileCode
              className="h-4 w-4 text-orange-400 transition-transform duration-500 group-hover:rotate-12 animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: "200ms" }}
            />
            <span
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: "300ms" }}
            >
              {projectTitle}
            </span>

            {/* File type tags */}
            <div className="flex items-center gap-1.5 ml-1">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getExtensionColor(tag)} animate-in fade-in slide-in-from-right-2 duration-300`}
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
}

interface ChatInterfaceProps {
  messages: any[];
  isLoading: boolean;
  onSendMessage: (content: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean; includeCss?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onApprovePatch?: (approvalId: string, patches: any[]) => void;
  onDeclinePatch?: (approvalId: string) => void;
  currentJson?: any; // Legacy - for backward compatibility
  currentSection?: any; // HTML/CSS/JS/PHP files
  globalCss?: string; // Global CSS from Style Kit
  containerWidth?: number; // Container width for responsive prompt actions
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  selectedModel,
  onModelChange,
  onApprovePatch,
  onDeclinePatch,
  currentJson = {},
  currentSection = null,
  globalCss = '',
  containerWidth,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; filename: string } | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [reasoningEffort, setReasoningEffort] = useState<'minimal' | 'low' | 'medium' | 'high'>('medium');
  const [currentInputTokens, setCurrentInputTokens] = useState(0);
  const [contextTokens, setContextTokens] = useState(0);
  const [cachedTokens, setCachedTokens] = useState(0);
  const [detailedMode, setDetailedMode] = useState(false);
  const [includeCss, setIncludeCss] = useState(false);
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [contextPreview, setContextPreview] = useState<any>(null);
  const [conversationTokenData, setConversationTokenData] = useState<ConversationTokenData | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Get current model config
  const modelConfig = MODEL_CONFIGS[selectedModel as keyof typeof MODEL_CONFIGS] || MODEL_CONFIGS['anthropic/claude-haiku-4.5-20251022'];
  const contextLimit = MODEL_CONTEXT_LIMITS[selectedModel] || 128000;

  // Calculate context tokens (system prompt + currentSection files + conversation history)
  useEffect(() => {
    // Estimate system prompt tokens (~5000 for the full system prompt with instructions)
    const systemPromptTokens = 5000;

    // Estimate currentSection tokens (HTML/CSS/JS/PHP files)
    const sectionTokens = currentSection ?
      estimateTokens(currentSection.html || '') +
      estimateTokens(currentSection.css || '') +
      estimateTokens(currentSection.js || '') +
      estimateTokens(currentSection.php || '')
      : 0;

    // Estimate conversation history tokens
    const historyTokens = messages.slice(-4).reduce((total, msg) => {
      return total + estimateTokens(msg.content || '');
    }, 0);

    const total = systemPromptTokens + sectionTokens + historyTokens;
    setContextTokens(total);
    console.log(`📊 Context tokens: System(~5K) + Files(${sectionTokens.toLocaleString()}) + History(${historyTokens}) = ${total.toLocaleString()}`);
  }, [currentSection, messages]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Calculate token count
    let textTokens = estimateTokens(value);
    if (imagePreview) {
      estimateImageTokens(imagePreview.url, (imageTokens) => {
        setCurrentInputTokens(textTokens + imageTokens);
      });
    } else {
      setCurrentInputTokens(textTokens);
    }

    // Detect slash command
    if (value.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashFilter(value.slice(1));
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }
  };

  // Update token count when image changes
  useEffect(() => {
    if (textareaRef.current) {
      const textTokens = estimateTokens(textareaRef.current.value);
      if (imagePreview) {
        estimateImageTokens(imagePreview.url, (imageTokens) => {
          setCurrentInputTokens(textTokens + imageTokens);
        });
      } else {
        setCurrentInputTokens(textTokens);
      }
    }
  }, [imagePreview]);

  const handleSlashCommandSelect = (command: any) => {
    if (textareaRef.current) {
      textareaRef.current.value = command.command + ' ';
      textareaRef.current.focus();
    }
    setShowSlashMenu(false);
    setSlashFilter('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    const content = textarea.value.trim();

    // Check if over token limit (including context)
    const totalTokens = currentInputTokens + contextTokens;
    if (totalTokens > modelConfig.inputLimit) {
      alert(`⚠️ Token limit exceeded!\n\nTotal tokens: ${totalTokens.toLocaleString()}\n- Your message: ${currentInputTokens.toLocaleString()}\n- Context (JSON + history): ${contextTokens.toLocaleString()}\n\nLimit: ${modelConfig.inputLimit.toLocaleString()} tokens\n\nPlease shorten your message, remove the image, or simplify your JSON.`);
      return;
    }

    if (content) {
      onSendMessage(content, imagePreview || undefined, { webSearchEnabled, reasoningEffort, detailedMode, includeCss });
      textarea.value = '';
      setInputValue('');
      setImagePreview(null);
      setShowSlashMenu(false);
      setSlashFilter('');
      setCurrentInputTokens(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setSlashFilter('');
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImagePreview({ url, filename: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Chat Header with Token Tracker */}
      <div className="chat-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--muted)',
      }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
          Chat
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <optgroup label="Claude">
              <option value="anthropic/claude-haiku-4.5-20251022">Claude Haiku 4.5 (200K)</option>
              <option value="anthropic/claude-sonnet-4.5-20250514">Claude Sonnet 4.5 (200K)</option>
              <option value="anthropic/claude-opus-4-20250514">Claude Opus 4 (200K)</option>
            </optgroup>
            <optgroup label="OpenAI">
              <option value="openai/gpt-5">GPT-5 (272K)</option>
              <option value="openai/gpt-5-mini">GPT-5 Mini (272K)</option>
            </optgroup>
            <optgroup label="Google">
              <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (1M)</option>
            </optgroup>
          </select>
          <TokenTracker onOpenDetails={() => setShowSettings(true)} compact={true} />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages" id="chatMessages" style={{ position: 'relative' }}>
        {/* Conversation Token Indicator - Fixed top-right */}
        <ConversationTokenIndicator
          data={conversationTokenData}
          position="top-right"
        />

        {messages.length === 0 && (
          <div className="welcome-message" style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--muted-foreground)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>
              Elementor JSON Editor
            </h2>
            <p style={{ marginBottom: '20px' }}>Start editing your Elementor templates with AI assistance</p>
            <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
              <p>• Ask to modify colors, text, layouts</p>
              <p>• Convert HTML to Elementor JSON</p>
              <p>• Search Elementor documentation</p>
              <p>• Preview in WordPress Playground</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {/* Image attachment if present */}
            {message.imageData && (
              <div style={{ marginBottom: '12px' }}>
                <img
                  src={message.imageData.url}
                  alt={message.imageData.filename}
                  className="message-image"
                  style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.3)' }}
                />
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                  {message.imageData.filename}
                </div>
              </div>
            )}
            {/* Message content */}
            {message.content && message.content.trim() && (() => {
              // Extract context optimization logs if present
              const contextOptPattern = /\*\*🔍 Smart Context Optimization\*\*\n\n([\s\S]*?)\n\n---\n\n/;
              const match = message.content.match(contextOptPattern);

              if (match) {
                const optimizationLogs = match[1];
                const remainingContent = message.content.replace(match[0], '');

                return (
                  <>
                    {/* Context Optimization Thinking Block */}
                    <details
                      open
                      style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <summary style={{
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{ fontSize: '16px' }}>🧠</span>
                        <span>Smart Context Optimization</span>
                        <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.8 }}>
                          Click to collapse
                        </span>
                      </summary>
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#1f2937',
                      }}>
                        <Response>{optimizationLogs}</Response>
                      </div>
                    </details>

                    {/* Remaining content */}
                    {remainingContent && remainingContent.trim() && (
                      <div className="message-content">
                        <Response>{remainingContent}</Response>
                      </div>
                    )}

                    {/* Citations from web search */}
                    {message.citations && message.citations.length > 0 && (
                      <CitationDisplay citations={message.citations} />
                    )}
                  </>
                );
              }

              // No optimization logs, render normally
              return (
                <>
                  <div className="message-content">
                    <Response>{message.content}</Response>
                  </div>
                  {/* Citations from web search */}
                  {message.citations && message.citations.length > 0 && (
                    <CitationDisplay citations={message.citations} />
                  )}
                </>
              );
            })()}

            {/* Patch approval UI */}
            {message.pendingPatch && onApprovePatch && onDeclinePatch && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                background: '#fffbeb',
                border: '2px solid #f59e0b',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    onClick={() => onApprovePatch(message.pendingPatch.approvalId, message.pendingPatch.patches)}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => onDeclinePatch(message.pendingPatch.approvalId)}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ❌ Decline
                  </button>
                </div>
              </div>
            )}

            {/* Show placeholder if no content but has tool calls */}
            {(!message.content || !message.content.trim()) && message.tool_calls && message.tool_calls.length > 0 && (
              <div className="message-content" style={{ fontStyle: 'italic', color: '#6b7280', fontSize: '14px' }}>
                Calling function...
              </div>
            )}

            {/* OpenAI-style tool calls */}
            {message.tool_calls?.map((toolCall: any, toolIndex: number) => {
              const toolName = toolCall.function?.name || toolCall.name;
              return (
                <div key={toolIndex} className="tool-call-display" style={{
                  margin: '12px 0',
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                }}>
                  <div className="tool-call-header" style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}>
                    {toolName === 'generate_json_patch' && '🔧 Generating JSON Patch'}
                    {toolName === 'analyze_json_structure' && '🔍 Analyzing JSON Structure'}
                    {toolName === 'search_elementor_docs' && '📚 Searching Elementor Docs'}
                    {toolName === 'convert_html_to_elementor_json' && '🎨 Converting HTML to Elementor'}
                    {toolName === 'open_template_in_playground' && '🚀 Opening in Playground'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {toolCall.function?.arguments && (
                      <details>
                        <summary style={{ cursor: 'pointer', userSelect: 'none' }}>View details</summary>
                        <pre style={{ marginTop: '8px', fontSize: '12px', overflow: 'auto' }}>
                          {JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Legacy format: Tool calls and results from message.parts */}
            {message.parts?.filter(part => part != null).map((part: any, partIndex: number) => {
              // Skip generic tool-call if we have message.tool_calls (prevents duplicate rendering)
              // AI SDK 5 creates BOTH tool_calls AND parts with type='tool-call' for same tool invocation
              if (part.type === 'tool-call' && message.tool_calls && message.tool_calls.length > 0) {
                console.log('⏭️ Skipping generic tool-call part, message.tool_calls exists:', part.toolName);
                return null;
              }

              if (part.type === 'tool-call') {
                return (
                  <div key={partIndex} className="tool-call-display">
                    <div className="tool-call-header">
                      {part.toolName === 'generateJsonPatch' && '🔧 Generating JSON Patch'}
                      {part.toolName === 'analyzeJsonStructure' && '🔍 Analyzing JSON Structure'}
                      {part.toolName === 'searchElementorDocs' && '📚 Searching Documentation'}
                      {part.toolName === 'openTemplateInPlayground' && '🚀 Opening Playground'}
                      {part.toolName === 'capturePlaygroundScreenshot' && '📸 Capturing Screenshot'}
                      {part.toolName === 'convertHtmlToElementorJson' && '🎨 Converting HTML'}
                      {part.toolName === 'listAvailableTools' && '📋 Listing Tools'}
                    </div>
                  </div>
                );
              }

              if (part.type === 'tool-result') {
                return (
                  <div key={partIndex} className="tool-result-container">
                    <ElementorToolRenderer result={part.result} />
                  </div>
                );
              }

              return null;
            })}
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <Loader />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Project Context Badge */}
      {currentSection && (
        <ProjectContextBadge currentSection={currentSection} />
      )}

      {/* Chat Input */}
      <div className="chat-input-container">
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleImageFileSelect}
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="image-preview-area" id="imagePreviewArea">
            <div className="image-preview-container">
              <img src={imagePreview.url} className="image-preview" alt="Preview" />
              <button
                className="remove-image-btn"
                title="Remove image"
                onClick={() => setImagePreview(null)}
              >
                ✕
              </button>
              <span className="image-file-name">{imagePreview.filename}</span>
            </div>
          </div>
        )}

        <PromptInput
          onSubmit={handleSubmit}
          style={{ flexShrink: 0, margin: '0 0 10px 0' }}
        >
          {/* Slash Command Menu */}
          <SlashCommandMenu
            show={showSlashMenu}
            filter={slashFilter}
            onSelect={handleSlashCommandSelect}
          />

          <PromptInputTextarea
            ref={textareaRef}
            value={inputValue}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Ask me to edit your code... (or type / for commands)"
            rows={2}
          />
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setImagePreview({
                    url: event.target?.result as string,
                    filename: file.name,
                  });
                };
                reader.readAsDataURL(file);
              }
            }}
            className="hidden"
          />
          <PromptInputToolbar>
            <MobilePromptActions
              breakpoint={450}
              containerWidth={containerWidth}
              actions={[
                {
                  id: 'web-search',
                  label: 'Web Search',
                  icon: <GlobeIcon size={16} />,
                  isActive: webSearchEnabled,
                  onClick: () => setWebSearchEnabled(!webSearchEnabled),
                  title: webSearchEnabled ? 'Web search enabled' : 'Web search disabled',
                },
                {
                  id: 'image',
                  label: 'Attach Image',
                  icon: <ImageIcon size={16} />,
                  isActive: !!imagePreview,
                  onClick: () => imageFileInputRef.current?.click(),
                  title: 'Attach image (PNG/JPEG, max 5MB)',
                },
                {
                  id: 'context',
                  label: 'Context Mode',
                  icon: <FileIcon size={16} />,
                  isActive: detailedMode,
                  onClick: () => setDetailedMode(!detailedMode),
                  title: detailedMode ? 'Detailed mode: Full JSON context' : 'Smart mode: Optimized context',
                },
                {
                  id: 'css',
                  label: 'CSS Context',
                  icon: <span className="text-sm font-medium">CSS</span>,
                  isActive: includeCss,
                  onClick: () => setIncludeCss(!includeCss),
                  title: includeCss ? 'CSS context enabled' : 'CSS context disabled',
                },
                {
                  id: 'preview',
                  label: 'Preview Context',
                  icon: <>👁️</>,
                  isActive: false,
                  onClick: async () => {
                    setShowContextPreview(true);
                    const preview = {
                      detailedMode,
                      currentJson,
                      jsonSize: JSON.stringify(currentJson).length,
                      estimatedTokens: Math.ceil(JSON.stringify(currentJson).length / 4),
                      message: inputValue,
                    };
                    setContextPreview(preview);
                  },
                  title: 'Preview context that will be sent',
                },
              ]}
            />
            <PromptInputSubmit disabled={isLoading || (currentInputTokens + contextTokens) > modelConfig.inputLimit}>
              <SendIcon size={16} />
            </PromptInputSubmit>
          </PromptInputToolbar>
        </PromptInput>
      </div>

      {/* Context Preview Modal */}
      {showContextPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowContextPreview(false)}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Context Preview</h2>
              <button onClick={() => setShowContextPreview(false)} style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                cursor: 'pointer',
              }}>✕</button>
            </div>

            {contextPreview && (
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--muted)', borderRadius: '8px' }}>
                  <div><strong>Mode:</strong> {contextPreview.detailedMode ? '🔴 Detailed (Full JSON)' : '🟢 Smart (Optimized)'}</div>
                  <div><strong>Message:</strong> "{contextPreview.message}"</div>
                  <div><strong>JSON Size:</strong> {contextPreview.jsonSize.toLocaleString()} characters</div>
                  <div><strong>Estimated Tokens:</strong> {contextPreview.estimatedTokens.toLocaleString()}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <strong>Full JSON Structure:</strong>
                </div>
                <pre style={{
                  background: 'var(--background)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  border: '1px solid var(--border)',
                }}>
                  {JSON.stringify(contextPreview.currentJson, null, 2)}
                </pre>

                {!contextPreview.detailedMode && (
                  <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                    ⚡ <strong>Smart mode enabled:</strong> The system will analyze your message and send only the relevant parts of this JSON to reduce costs by 80-95%.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        webSearchEnabled={webSearchEnabled}
        onWebSearchChange={setWebSearchEnabled}
        reasoningEffort={reasoningEffort}
        onReasoningEffortChange={setReasoningEffort}
      />
    </>
  );
}
