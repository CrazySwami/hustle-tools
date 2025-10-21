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

interface ChatInterfaceProps {
  messages: any[];
  isLoading: boolean;
  onSendMessage: (content: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onApprovePatch?: (approvalId: string, patches: any[]) => void;
  onDeclinePatch?: (approvalId: string) => void;
  currentJson?: any;
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
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [contextPreview, setContextPreview] = useState<any>(null);

  // Get current model config
  const modelConfig = MODEL_CONFIGS[selectedModel as keyof typeof MODEL_CONFIGS] || MODEL_CONFIGS['anthropic/claude-haiku-4.5-20251022'];

  // Calculate context tokens (system prompt + JSON + conversation history)
  useEffect(() => {
    // Estimate system prompt tokens (~5000 for the full system prompt with instructions)
    const systemPromptTokens = 5000;

    // Estimate JSON tokens
    const jsonString = JSON.stringify(currentJson);
    const jsonTokens = estimateTokens(jsonString);

    // Estimate conversation history tokens
    const historyTokens = messages.slice(-4).reduce((total, msg) => {
      return total + estimateTokens(msg.content || '');
    }, 0);

    const total = systemPromptTokens + jsonTokens + historyTokens;
    setContextTokens(total);
    console.log(`📊 Context tokens: System(~5K) + JSON(${jsonTokens.toLocaleString()}) + History(${historyTokens}) = ${total.toLocaleString()}`);
  }, [currentJson, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

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
      onSendMessage(content, imagePreview || undefined, { webSearchEnabled, reasoningEffort, detailedMode });
      textarea.value = '';
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
      <div className="chat-messages" id="chatMessages">
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
            {message.parts?.map((part: any, partIndex: number) => {
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

        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          {/* Slash Command Menu */}
          <SlashCommandMenu
            show={showSlashMenu}
            filter={slashFilter}
            onSelect={handleSlashCommandSelect}
          />

          <div className="input-row" style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              id="chatInput"
              className="chat-input"
              placeholder="Ask me to edit your JSON... (or type / for commands)"
              rows={2}
              onKeyDown={handleKeyDown}
              onChange={handleInputChange}
              disabled={isLoading}
              style={{ paddingRight: '120px' }}
            />
            <div style={{ position: 'absolute', right: '8px', bottom: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: imagePreview ? 'var(--primary)' : 'var(--card)',
                  color: imagePreview ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Upload image"
              >
                <ImageIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: webSearchEnabled ? '#3b82f6' : 'var(--card)',
                  color: webSearchEnabled ? '#fff' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={webSearchEnabled ? 'Web search enabled' : 'Web search disabled'}
              >
                <GlobeIcon size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (textareaRef.current) {
                    textareaRef.current.value = "What's the weather in ";
                    textareaRef.current.focus();
                  }
                }}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Ask about weather (test tool)"
              >
                🌤️
              </button>

              <button
                type="button"
                onClick={() => setDetailedMode(!detailedMode)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: detailedMode ? '#8b5cf6' : 'var(--card)',
                  color: detailedMode ? '#fff' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={detailedMode ? 'Detailed mode: Full JSON context' : 'Smart mode: Optimized context'}
              >
                <FileIcon size={16} />
              </button>

              {/* Token Counter */}
              <div style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: (currentInputTokens + contextTokens) > modelConfig.inputLimit ? '#fef2f2' : 'var(--muted)',
                border: `1px solid ${(currentInputTokens + contextTokens) > modelConfig.inputLimit ? '#ef4444' : 'var(--border)'}`,
                fontSize: '11px',
                fontWeight: 600,
                color: (currentInputTokens + contextTokens) > modelConfig.inputLimit ? '#ef4444' : 'var(--muted-foreground)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
              title={`Your message: ${currentInputTokens.toLocaleString()}\nContext (JSON + history): ${contextTokens.toLocaleString()}${cachedTokens > 0 ? `\nCached tokens: ${cachedTokens.toLocaleString()} (90% discount)` : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{(currentInputTokens + contextTokens).toLocaleString()}</span>
                  <span style={{ opacity: 0.6 }}>/</span>
                  <span style={{ opacity: 0.6 }}>{(modelConfig.inputLimit / 1000).toFixed(0)}K</span>
                </div>
                <div style={{ fontSize: '9px', opacity: 0.7, display: 'flex', gap: '4px' }}>
                  <span>({currentInputTokens.toLocaleString()} msg + {contextTokens.toLocaleString()} ctx)</span>
                  {cachedTokens > 0 && (
                    <span style={{ color: '#10b981' }}>💰 {cachedTokens.toLocaleString()} cached</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setShowContextPreview(true);
                  // Preview the context that will be sent
                  const preview = {
                    detailedMode,
                    currentJson,
                    jsonSize: JSON.stringify(currentJson).length,
                    estimatedTokens: Math.ceil(JSON.stringify(currentJson).length / 4),
                    message: textareaRef.current?.value || '',
                  };
                  setContextPreview(preview);
                }}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Preview context that will be sent"
              >
                👁️
              </button>

              <button
                type="submit"
                disabled={isLoading || (currentInputTokens + contextTokens) > modelConfig.inputLimit}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: (isLoading || (currentInputTokens + contextTokens) > modelConfig.inputLimit) ? 'var(--muted)' : 'var(--primary)',
                  color: (isLoading || (currentInputTokens + contextTokens) > modelConfig.inputLimit) ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                  cursor: (isLoading || (currentInputTokens + contextTokens) > modelConfig.inputLimit) ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
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
