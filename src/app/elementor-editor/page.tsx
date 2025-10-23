'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import '../elementor-editor.css';

export const dynamic = 'force-dynamic';
import { ElementorChat } from '@/components/elementor/ElementorChat';
import { JsonEditor } from '@/components/elementor/JsonEditor';
import { PlaygroundView } from '@/components/elementor/PlaygroundView';
import { HtmlGeneratorNew } from '@/components/elementor/HtmlGeneratorNew';
import { SiteContentManager } from '@/components/elementor/SiteContentManager';
import { StyleKitEditorNew } from '@/components/elementor/StyleKitEditorNew';
import { StyleGuide } from '@/components/elementor/StyleGuide';
import { HtmlSectionEditor } from '@/components/elementor/HtmlSectionEditor';
import { VisualSectionEditor } from '@/components/elementor/VisualSectionEditor';
import { SectionLibrary } from '@/components/elementor/SectionLibrary';
import { PageSplitter } from '@/components/elementor/PageSplitter';
import { useElementorState } from '@/lib/hooks/useElementorState';
import { Section } from '@/lib/section-schema';
import { FileIcon, PaletteIcon, ArrowRightIcon, GlobeIcon, LayoutIcon, XIcon, CodeIcon, EyeIcon } from '@/components/ui/icons';
import Script from 'next/script';
import { GlobalStylesheetProvider } from '@/lib/global-stylesheet-context';
import { ToastContainer } from '@/components/ui/Toast';
import { useToastListener } from '@/hooks/useToast';
import type { Toast } from '@/components/ui/Toast';
import { KeyboardShortcutsModal, type KeyboardShortcut } from '@/components/ui/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/useToast';

const SAMPLE_JSON = {
  widgetType: "custom_html_section",
  content: [
    {
      id: "abc123",
      elType: "widget",
      widgetType: "heading",
      settings: {
        title: "Welcome to My Site",
        title_color: "#000000",
        typography_font_size: {
          size: 32,
          unit: "px"
        },
        align: "center"
      }
    },
    {
      id: "def456",
      elType: "widget",
      widgetType: "button",
      settings: {
        text: "Click Me",
        button_color: "#0066cc",
        button_text_color: "#ffffff",
        button_size: "md"
      }
    },
    {
      id: "ghi789",
      elType: "widget",
      widgetType: "text-editor",
      settings: {
        editor: "This is a sample text widget with some content. You can edit this text using the chat interface!"
      }
    }
  ]
};

export default function ElementorEditorPage() {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [activeTab, setActiveTab] = useState('json');
  const [playgroundReady, setPlaygroundReady] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [converterSourceCode, setConverterSourceCode] = useState({ html: '', css: '', js: '' });
  const [converterMockups, setConverterMockups] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const [streamedCode, setStreamedCode] = useState<{ html: string; css: string; js: string }>({ html: '', css: '', js: '' });
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [loadedSection, setLoadedSection] = useState<Section | null>(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const toast = useToast();

  // Toast listener
  useEffect(() => {
    return useToastListener((toast) => {
      setToasts(prev => [...prev, toast]);
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State management
  const {
    currentJson,
    setCurrentJson,
    undo,
    redo,
    canUndo,
    canRedo,
    applyPatch,
  } = useElementorState();

  // Use AI SDK chat hook - same pattern as main chat page
  const { messages, sendMessage, isLoading, setMessages, reload, status } = useChat({
    api: '/api/chat-elementor',
  });

  // Resize handler
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const containerWidth = window.innerWidth;
    const newWidth = (e.clientX / containerWidth) * 100;

    // Constrain between 25% and 60%
    if (newWidth >= 25 && newWidth <= 60) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add/remove event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);

      // Prevent text selection while resizing
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);

      // Re-enable text selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  // Define all keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = [
    // Help & Navigation
    { key: '?', description: 'Show keyboard shortcuts', category: 'Help & Navigation' },
    { key: 'k', modifiers: ['ctrl'], description: 'Show keyboard shortcuts', category: 'Help & Navigation' },
    { key: 'b', modifiers: ['ctrl'], description: 'Toggle chat panel', category: 'Help & Navigation' },
    { key: '1', modifiers: ['ctrl'], description: 'Go to Code Editor', category: 'Help & Navigation' },
    // { key: '2', modifiers: ['ctrl'], description: 'Go to Visual Editor', category: 'Help & Navigation' },
    { key: '3', modifiers: ['ctrl'], description: 'Go to Section Library', category: 'Help & Navigation' },
    { key: '4', modifiers: ['ctrl'], description: 'Go to WordPress Playground', category: 'Help & Navigation' },
    { key: '5', modifiers: ['ctrl'], description: 'Go to Site Content', category: 'Help & Navigation' },
    { key: '6', modifiers: ['ctrl'], description: 'Go to Style Guide', category: 'Help & Navigation' },

    // Editing
    { key: 's', modifiers: ['ctrl'], description: 'Save current section', category: 'Editing' },
    { key: 'z', modifiers: ['ctrl'], description: 'Undo', category: 'Editing' },
    { key: 'y', modifiers: ['ctrl'], description: 'Redo', category: 'Editing' },
    { key: 'z', modifiers: ['ctrl', 'shift'], description: 'Redo (alternative)', category: 'Editing' },

    // Preview & WordPress
    { key: 'p', modifiers: ['ctrl'], description: 'Preview in WordPress', category: 'Preview & WordPress' },
    { key: 'u', modifiers: ['ctrl'], description: 'Update Playground preview', category: 'Preview & WordPress' },

    // Mobile
    { key: 'm', modifiers: ['ctrl'], description: 'Toggle mobile chat drawer', category: 'Mobile' },
  ];

  // Keyboard shortcuts handlers
  useKeyboardShortcuts([
    {
      key: '?',
      handler: () => setShortcutsModalOpen(true)
    },
    {
      key: 'k',
      modifiers: ['ctrl'],
      handler: () => setShortcutsModalOpen(true)
    },
    {
      key: 'b',
      modifiers: ['ctrl'],
      handler: () => {
        if (!isMobile) {
          setChatVisible(prev => !prev);
          toast.info(chatVisible ? 'Chat panel hidden' : 'Chat panel shown');
        }
      }
    },
    {
      key: '1',
      modifiers: ['ctrl'],
      handler: () => {
        setActiveTab('json');
        toast.info('Switched to Code Editor');
      }
    },
    // Visual Editor disabled
    // {
    //   key: '2',
    //   modifiers: ['ctrl'],
    //   handler: () => {
    //     setActiveTab('visual');
    //     toast.info('Switched to Visual Editor');
    //   }
    // },
    {
      key: '3',
      modifiers: ['ctrl'],
      handler: () => {
        setActiveTab('sections');
        toast.info('Switched to Section Library');
      }
    },
    {
      key: '4',
      modifiers: ['ctrl'],
      handler: () => {
        setActiveTab('playground');
        toast.info('Switched to WordPress Playground');
      }
    },
    {
      key: '5',
      modifiers: ['ctrl'],
      handler: () => {
        setActiveTab('site-content');
        toast.info('Switched to Site Content');
      }
    },
    {
      key: '6',
      modifiers: ['ctrl'],
      handler: () => {
        setActiveTab('style-guide');
        toast.info('Switched to Style Guide');
      }
    },
    {
      key: 'z',
      modifiers: ['ctrl'],
      handler: () => {
        if (canUndo) {
          undo();
          toast.success('Undo');
        }
      }
    },
    {
      key: 'y',
      modifiers: ['ctrl'],
      handler: () => {
        if (canRedo) {
          redo();
          toast.success('Redo');
        }
      }
    },
    {
      key: 'm',
      modifiers: ['ctrl'],
      handler: () => {
        if (isMobile) {
          setChatDrawerOpen(prev => !prev);
        }
      }
    }
  ]);

  const handleSendMessage = async (content: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }) => {
    if (!content.trim() || isLoading) return;

    try {
      // If web search is enabled but not using a Perplexity model, switch to Perplexity Sonar (same as main chat)
      let modelToUse = selectedModel;
      if (settings?.webSearchEnabled && !selectedModel.startsWith('perplexity/')) {
        console.log('Switching to Perplexity model for web search');
        modelToUse = 'perplexity/sonar';
      }

      // Use AI SDK's sendMessage - same pattern as main chat page
      sendMessage(
        { text: content },
        {
          body: {
            model: modelToUse,
            currentJson,
            currentSection,
            webSearch: settings?.webSearchEnabled ?? false,
            reasoningEffort: settings?.reasoningEffort ?? 'medium',
            detailedMode: settings?.detailedMode ?? false,
          },
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  // Old manual streaming handler - replaced with useChat hook
  const handleSendMessage_OLD = async (content: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }) => {
    // This is kept for reference only - not used
    return;

    // Add user message with proper UIMessage format (including image if provided)
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: imageData
        ? `${content}\n\n![${imageData.filename}](${imageData.url})`
        : content,
      imageData,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Add "thinking" message
      const thinkingId = `msg-${Date.now()}-thinking`;
      setMessages(prev => [...prev, {
        id: thinkingId,
        role: 'assistant' as const,
        content: '🤔 Thinking...'
      }]);

      let requestBody;
      try {
        requestBody = {
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
            // Include image data if available
            ...(msg.imageData && { imageData: msg.imageData })
          })),
          model: selectedModel,
          currentJson,
          currentSection, // Pass current section context
          // Pass image separately for easier API handling
          imageData,
          // Pass web search and reasoning settings
          webSearchEnabled: settings?.webSearchEnabled ?? false,
          reasoningEffort: settings?.reasoningEffort ?? 'medium',
          detailedMode: settings?.detailedMode ?? false,
        };
        console.log('📤 Request body:', {
          messageCount: requestBody.messages.length,
          model: requestBody.model,
          webSearchEnabled: requestBody.webSearchEnabled,
          detailedMode: requestBody.detailedMode,
          hasImageData: !!requestBody.imageData
        });
      } catch (err) {
        console.error('❌ Error building request body:', err);
        throw new Error('Failed to build request body');
      }

      const response = await fetch('/api/chat-elementor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingId));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      const assistantId = `msg-${Date.now()}-assistant`;
      let fullContent = '';
      let toolCalls: any[] = [];
      let currentToolCall: any = null;
      let inputTokens = 0;
      let outputTokens = 0;
      let citations: { url: string; title?: string; index: number }[] = [];

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant' as const,
        content: '',
        tool_calls: [],
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch (parseError) {
              // Skip incomplete JSON chunks from streaming
              console.warn('Skipping incomplete JSON chunk');
              continue;
            }

            try {
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                fullContent += delta.content;
                // Update message content in real-time
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantId
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }

              // Handle tool calls
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.index !== undefined) {
                    if (!toolCalls[tc.index]) {
                      toolCalls[tc.index] = {
                        id: tc.id || '',
                        type: 'function',
                        function: { name: '', arguments: '' }
                      };
                    }
                    if (tc.function?.name) {
                      toolCalls[tc.index].function.name += tc.function.name;
                    }
                    if (tc.function?.arguments) {
                      toolCalls[tc.index].function.arguments += tc.function.arguments;
                    }
                  }
                }
              }

              // Extract web search citations from annotations
              if (parsed.choices?.[0]?.message?.annotations) {
                const annotations = parsed.choices[0].message.annotations;
                for (let i = 0; i < annotations.length; i++) {
                  const ann = annotations[i];
                  if (ann.url) {
                    citations.push({
                      url: ann.url,
                      title: ann.title || ann.url,
                      index: i + 1,
                    });
                  }
                }
              }

              // Track usage data (comes in final chunk)
              if (parsed.usage) {
                inputTokens = parsed.usage.prompt_tokens || 0;
                outputTokens = parsed.usage.completion_tokens || 0;

                // Track cached tokens if available
                const cachedTokens = parsed.usage.input_tokens_details?.cached_tokens || 0;
                if (cachedTokens > 0) {
                  console.log('💰 Cached tokens:', cachedTokens, '(90% discount!)');
                  // Store for display in UI
                  if (typeof window !== 'undefined') {
                    (window as any).__lastCachedTokens = cachedTokens;
                  }
                }

                console.log('📊 Usage data received:', { inputTokens, outputTokens, cachedTokens });
              }

              // Also check for usage in choices (alternative format)
              if (parsed.choices?.[0]?.usage) {
                inputTokens = parsed.choices[0].usage.prompt_tokens || 0;
                outputTokens = parsed.choices[0].usage.completion_tokens || 0;
                console.log('📊 Usage data from choices:', { inputTokens, outputTokens });
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Track token usage
      console.log('💰 About to track usage:', { inputTokens, outputTokens, model: selectedModel });
      if (typeof window !== 'undefined' && (window as any).trackTokenUsage) {
        (window as any).trackTokenUsage({
          model: selectedModel,
          inputTokens,
          outputTokens,
          type: 'chat',
        });
      } else {
        console.warn('⚠️ trackTokenUsage function not available on window');
      }

      // Update final message with tool calls and citations
      // If there's no content but there are tool calls, add a default message
      const finalContent = fullContent || (toolCalls.length > 0 ? '🔧 Using tools to help with your request...' : '');

      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? {
              ...msg,
              content: finalContent,
              tool_calls: toolCalls,
              citations: citations.length > 0 ? citations : undefined
            }
          : msg
      ));

      const data = { tool_calls: toolCalls };

      // Handle tool calls (execute them client-side for real-time progress)
      if (data.tool_calls && data.tool_calls.length > 0) {
        for (const toolCall of data.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const toolName = toolCall.function.name;

          // Add verbose progress message IMMEDIATELY
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-tool-progress`,
            role: 'assistant' as const,
            content: `🔧 **Executing Tool: ${toolName}**\n\`\`\`json\n${JSON.stringify(args, null, 2)}\n\`\`\``
          }]);

          // Small delay to let UI update
          await new Promise(resolve => setTimeout(resolve, 50));

          if (toolName === 'generate_json_patch') {
            handlePatchApproval(args.patches);
          } else if (toolName === 'open_template_in_playground') {
            handlePlaygroundAction(args.action);
          } else if (toolName === 'search_elementor_docs') {
            // Show searching message IMMEDIATELY
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-searching`,
              role: 'assistant' as const,
              content: `🔍 **Searching Vector Store**\nQuery: "${args.query}"\n\n⏳ Creating thread...`
            }]);

            // Small delay to let UI update
            await new Promise(resolve => setTimeout(resolve, 50));

            try {
              // Execute vector store search on client side with progress updates
              const searchStartTime = Date.now();

              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: `🔍 **Searching Vector Store**\nQuery: "${args.query}"\n\n⏳ Searching documentation database...`
                };
                return newMessages;
              });

              const searchResponse = await fetch('/api/search-elementor-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: args.query }),
              });

              const searchTime = ((Date.now() - searchStartTime) / 1000).toFixed(1);

              if (searchResponse.ok) {
                const searchData = await searchResponse.json();

                setMessages(prev => [...prev, {
                  id: `msg-${Date.now()}-search-result`,
                  role: 'assistant' as const,
                  content: `✅ **Search Complete** (${searchTime}s)\n\n${searchData.results}`
                }]);
              } else {
                setMessages(prev => [...prev, {
                  id: `msg-${Date.now()}-search-error`,
                  role: 'assistant' as const,
                  content: `❌ **Search Failed**\n\nCould not retrieve results from vector store.`
                }]);
              }
            } catch (error) {
              console.error('Vector search error:', error);
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-search-error`,
                role: 'assistant' as const,
                content: `❌ **Search Error**\n\n${error instanceof Error ? error.message : 'Unknown error'}`
              }]);
            }
          } else if (toolName === 'convert_html_to_elementor_json') {
            // Redirect to section editor tab
            console.log('Convert HTML:', args);
            setActiveTab('json');
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-info`,
              role: 'assistant' as const,
              content: `🔄 **Redirecting to JSON Converter**\n\nI've switched you to the JSON Converter tab. Please paste your HTML, CSS, and JavaScript code there, then click "Convert to Elementor JSON".`
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant' as const,
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setCurrentJson(json);
        setCurrentFileName(file.name);
      } catch (error) {
        alert('Invalid JSON file');
        console.error('Failed to parse JSON:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setCurrentJson(SAMPLE_JSON);
    setCurrentFileName('sample.json');
  };

  // Simple JSON Patch implementation (RFC 6902)
  const applyJsonPatch = (obj: any, patches: any[]) => {
    const cloned = JSON.parse(JSON.stringify(obj));

    for (const patch of patches) {
      const { op, path, value } = patch;
      const pathParts = path.split('/').filter((p: string) => p);

      try {
        if (op === 'replace' || op === 'add') {
          let current = cloned;
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!(part in current)) {
              current[part] = {};
            }
            current = current[part];
          }
          const lastPart = pathParts[pathParts.length - 1];
          current[lastPart] = value;
        } else if (op === 'remove') {
          let current = cloned;
          for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
          }
          const lastPart = pathParts[pathParts.length - 1];
          if (Array.isArray(current)) {
            current.splice(parseInt(lastPart), 1);
          } else {
            delete current[lastPart];
          }
        }
      } catch (error) {
        throw new Error(`Failed to apply patch ${op} ${path}: ${error}`);
      }
    }

    return cloned;
  };

  const handlePatchApproval = async (patches: any[]) => {
    // Add patch approval UI message to chat
    const approvalId = `msg-${Date.now()}-patch-approval`;

    // Create diff display
    const diffText = patches.map(p => {
      const pathParts = p.path.split('/').filter((x: string) => x);
      let oldValue = currentJson;

      // Navigate to the path to get old value
      try {
        for (const part of pathParts) {
          oldValue = oldValue[part];
        }
      } catch (e) {
        oldValue = undefined;
      }

      return `**${p.op.toUpperCase()}** \`${p.path}\`\n` +
        `${oldValue !== undefined ? `- Old: \`${JSON.stringify(oldValue)}\`\n` : ''}` +
        `${p.value !== undefined ? `+ New: \`${JSON.stringify(p.value)}\`` : ''}`;
    }).join('\n\n');

    setMessages(prev => [...prev, {
      id: approvalId,
      role: 'assistant' as const,
      content: `## 🔧 Patch Approval Required\n\n${patches.length} operation${patches.length > 1 ? 's' : ''} requested:\n\n${diffText}`,
      pendingPatch: { patches, approvalId }
    }]);
  };

  const approvePatch = async (approvalId: string, patches: any[]) => {
    try {
      const newJson = applyJsonPatch(currentJson, patches);
      setCurrentJson(newJson);

      // Remove approval message and add success
      setMessages(prev => prev.filter(m => m.id !== approvalId));
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-success`,
        role: 'assistant' as const,
        content: `✅ Successfully applied ${patches.length} patch operation${patches.length > 1 ? 's' : ''}!`
      }]);
    } catch (error: any) {
      console.error('Failed to apply patch:', error);

      // Remove approval message and add error
      setMessages(prev => prev.filter(m => m.id !== approvalId));
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant' as const,
        content: `❌ Failed to apply patch: ${error.message}`
      }]);
    }
  };

  const declinePatch = (approvalId: string) => {
    // Remove approval message and add decline message
    setMessages(prev => prev.filter(m => m.id !== approvalId));
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-declined`,
      role: 'assistant' as const,
      content: `❌ Patch operations declined by user.`
    }]);
  };

  const handlePlaygroundAction = (action: string) => {
    // Auto-switch to playground tab
    if (action === 'launch' || action === 'refresh') {
      setActiveTab('playground');
    }
  };

  const handleSaveJson = () => {
    // Save is now just confirming the current state is saved
    // The JSON is already live in currentJson state
    console.log('💾 JSON saved to editor state');
    alert('✅ JSON saved successfully!');
  };

  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(currentJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'elementor-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('📥 JSON downloaded');
  };

  const handleSaveAndLoadInWordPress = async () => {
    // Save the current JSON state
    console.log('💾 Saving JSON and preview in WordPress Playground...');

    // Switch to playground tab
    setActiveTab('playground');

    // Give the tab a moment to switch, then trigger button clicks
    setTimeout(() => {
      // Trigger "Update & Open" button
      const updateBtn = document.getElementById('updatePlaygroundBtn');
      if (updateBtn) {
        console.log('🔄 Triggering Update & Open button...');
        updateBtn.click();

        // After 1 second, trigger "View Live" button
        setTimeout(() => {
          const viewBtn = document.getElementById('viewPageBtn');
          if (viewBtn) {
            console.log('👁️ Triggering View Live button...');
            viewBtn.click();
          }
        }, 1000);
      }
    }, 500);
  };

  return (
    <GlobalStylesheetProvider>
      <>
        {/* Load playground script */}
        <Script
          src="/playground.js"
          strategy="afterInteractive"
          onLoad={() => console.log('✅ playground.js script loaded')}
          onError={(e) => console.error('Failed to load playground.js:', e)}
        />
        <Script
          src="/playground-tests.js"
          strategy="afterInteractive"
        />

      {/* Main container - using exact class names from original CSS */}
      <div className="chat-editor-container" style={{
        marginTop: '48px', // Unified thinner navbar (h-12)
        height: 'calc(100vh - 48px)',
        paddingBottom: isMobile ? '48px' : '0' // Smaller chat drawer on mobile
      }}>
        {/* Desktop: Left Panel Chat */}
        {!isMobile && chatVisible && (
          <div className="left-panel" style={{ width: `${leftPanelWidth}%` }}>
            <ElementorChat
              messages={messages}
              isLoading={isLoading}
              status={status}
              onSendMessage={(text) => handleSendMessage(text)}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onReload={reload}
              onStreamUpdate={(type, content) => {
                setStreamedCode(prev => ({ ...prev, [type]: content }));
              }}
              onSwitchToSectionEditor={() => setActiveTab('json')}
              onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
              onUpdateSection={(updates) => {
                if (currentSection) {
                  setCurrentSection({ ...currentSection, ...updates });
                }
              }}
              currentSection={currentSection}
            />
          </div>
        )}

        {/* Desktop: Resizer */}
        {!isMobile && chatVisible && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: 'var(--border)',
              position: 'relative',
              transition: isResizing ? 'none' : 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isResizing) e.currentTarget.style.background = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              if (!isResizing) e.currentTarget.style.background = 'var(--border)';
            }}
          />
        )}

        {/* Right Panel: Tabs + Content */}
        <div className="right-panel" style={{ width: !isMobile && chatVisible ? `${100 - leftPanelWidth}%` : '100%' }}>
          {/* Tab Bar */}
          {tabBarVisible && (
            <div className="tab-bar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile ? '8px 12px' : '6px 20px',
            minHeight: isMobile ? '48px' : '40px',
            gap: '8px'
          }}>
            {/* Mobile: Dropdown Select */}
            {isMobile ? (
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='14' height='8' viewBox='0 0 14 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1L7 7L13 1' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '14px',
                  paddingRight: '40px'
                }}
              >
                <option value="json">Code Editor</option>
                <option value="sections">Section Library</option>
                <option value="playground">WordPress Playground</option>
                <option value="site-content">Site Content</option>
                <option value="style-guide">Style Guide</option>
              </select>
            ) : (
              /* Desktop: Horizontal Tabs */
              <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                <div
                  className={`tab ${activeTab === 'json' ? 'active' : ''}`}
                  onClick={() => setActiveTab('json')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <CodeIcon size={16} /> Code Editor
                </div>
                <div
                  className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sections')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <FileIcon size={16} /> Section Library
                </div>
                <div
                  className={`tab ${activeTab === 'playground' ? 'active' : ''}`}
                  onClick={() => setActiveTab('playground')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <GlobeIcon size={16} /> WordPress Playground
                </div>
                <div
                  className={`tab ${activeTab === 'site-content' ? 'active' : ''}`}
                  onClick={() => setActiveTab('site-content')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <LayoutIcon size={16} /> Site Content
                </div>
                <div
                  className={`tab ${activeTab === 'style-guide' ? 'active' : ''}`}
                  onClick={() => setActiveTab('style-guide')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <PaletteIcon size={16} /> Style Guide
                </div>
              </div>
            )}
            </div>
          )}

          {/* Tab Content - Keep all tabs mounted, just hide inactive ones */}
          <div className="tab-content">
            <div className={`tab-panel ${activeTab === 'json' ? 'active' : ''}`} id="jsonPanel" style={{ display: activeTab === 'json' ? 'flex' : 'none' }}>
              <HtmlSectionEditor
                key={loadedSection?.id || 'default'} // Force remount when loading new section
                initialSection={loadedSection || undefined}
                streamedHtml={streamedCode.html}
                streamedCss={streamedCode.css}
                streamedJs={streamedCode.js}
                activeCodeTab={activeCodeTab}
                onCodeTabChange={setActiveCodeTab}
                onSectionChange={(section) => {
                  console.log('📝 Section updated:', {
                    name: section.name,
                    htmlLength: section.html?.length || 0,
                    cssLength: section.css?.length || 0,
                    jsLength: section.js?.length || 0
                  });
                  setCurrentSection(section);
                }}
                onSwitchToVisualEditor={() => setActiveTab('visual')}
                chatVisible={chatVisible}
                setChatVisible={setChatVisible}
                tabBarVisible={tabBarVisible}
                setTabBarVisible={setTabBarVisible}
              />
            </div>

            <div className={`tab-panel ${activeTab === 'visual' ? 'active' : ''}`} id="visualPanel" style={{ display: activeTab === 'visual' ? 'flex' : 'none' }}>
              <VisualSectionEditor
                initialSection={currentSection || undefined}
                onSectionChange={(section) => {
                  console.log('🎨 Visual editor section updated:', {
                    name: section.name,
                    htmlLength: section.html?.length || 0,
                    cssLength: section.css?.length || 0,
                  });
                  setCurrentSection(section);
                }}
                onSwitchToCodeEditor={() => setActiveTab('json')}
              />
            </div>

            <div className={`tab-panel ${activeTab === 'playground' ? 'active' : ''}`} id="playgroundPanel" style={{ display: activeTab === 'playground' ? 'flex' : 'none' }}>
              <PlaygroundView
                json={currentJson}
                isActive={activeTab === 'playground'}
                chatVisible={chatVisible}
                setChatVisible={setChatVisible}
                tabBarVisible={tabBarVisible}
                setTabBarVisible={setTabBarVisible}
                onJsonUpdate={(updatedJson) => {
                  console.log('📥 JSON updated from playground:', updatedJson);
                  setCurrentJson(updatedJson);
                }}
                onPlaygroundReady={() => {
                  console.log('🎉 WordPress Playground is fully ready!');
                  setPlaygroundReady(true);
                }}
              />
            </div>

            <div className={`tab-panel ${activeTab === 'sections' ? 'active' : ''}`} id="sectionsPanel" style={{ display: activeTab === 'sections' ? 'flex' : 'none' }}>
              <SectionLibrary
                chatVisible={chatVisible}
                setChatVisible={setChatVisible}
                tabBarVisible={tabBarVisible}
                setTabBarVisible={setTabBarVisible}
                onExportToPlayground={(sections) => {
                  console.log('📋 Exporting sections to playground:', sections.length);
                  alert(`✨ Coming soon: Export ${sections.length} sections to WordPress Playground`);
                }}
                onLoadInEditor={(section) => {
                  console.log('📝 Loading section in editor:', {
                    name: section.name,
                    id: section.id,
                    htmlLength: section.html?.length || 0,
                    cssLength: section.css?.length || 0,
                    jsLength: section.js?.length || 0
                  });
                  // Clear streamed code to prevent conflicts
                  setStreamedCode({ html: '', css: '', js: '' });
                  setLoadedSection(section);
                  setCurrentSection(section); // Also update currentSection so chat can see it
                  setActiveTab('json'); // Switch to Section Editor tab
                }}
              />
            </div>

            <div className={`tab-panel ${activeTab === 'site-content' ? 'active' : ''}`} id="siteContentPanel" style={{ display: activeTab === 'site-content' ? 'flex' : 'none' }}>
              <SiteContentManager
                playgroundReady={playgroundReady}
                chatVisible={chatVisible}
                setChatVisible={setChatVisible}
                tabBarVisible={tabBarVisible}
                setTabBarVisible={setTabBarVisible}
                onPush={(config) => {
                  console.log('⚙️ Pushing to WordPress:', config);
                  if (typeof window !== 'undefined' && (window as any).applySiteConfig) {
                    (window as any).applySiteConfig(config);
                  } else {
                    alert('Please launch WordPress Playground first');
                  }
                }}
                onPull={async () => {
                  console.log('⚙️ Pulling from WordPress');
                  if (typeof window !== 'undefined' && (window as any).getWordPressSettings && (window as any).getWordPressPages) {
                    const settings = await (window as any).getWordPressSettings();
                    const pages = await (window as any).getWordPressPages();
                    return { settings, pages };
                  }
                  throw new Error('Playground not running');
                }}
              />
            </div>

            <div className={`tab-panel ${activeTab === 'style-guide' ? 'active' : ''}`} id="styleGuidePanel" style={{ display: activeTab === 'style-guide' ? 'flex' : 'none' }}>
              <StyleGuide
                chatVisible={chatVisible}
                setChatVisible={setChatVisible}
                tabBarVisible={tabBarVisible}
                setTabBarVisible={setTabBarVisible}
              />
            </div>
          </div>
        </div>


        {/* Mobile: Chat Drawer */}
        {isMobile && (
          <>
            {/* Chat Drawer Overlay */}
            {chatDrawerOpen && (
              <div
                onClick={() => setChatDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 1999,
                  transition: 'opacity 0.3s ease'
                }}
              />
            )}

            {/* Chat Drawer */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: chatDrawerOpen ? '95vh' : '48px', // Smaller handle
                background: 'var(--background)',
                borderTop: '1px solid var(--border)',
                zIndex: 3200, // Above options button (3000)
                transition: 'height 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {/* Drawer Handle */}
              <div
                onClick={() => setChatDrawerOpen(!chatDrawerOpen)}
                style={{
                  height: '48px', // Smaller handle
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  background: 'var(--card)',
                  borderBottom: chatDrawerOpen ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '4px',
                  background: 'var(--muted)',
                  borderRadius: '2px'
                }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  {chatDrawerOpen ? '▼ Close Chat' : '▲ Open Chat'}
                </span>
              </div>

              {/* Chat Content */}
              {chatDrawerOpen && (
                <div style={{
                  flex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'calc(95vh - 48px)' // Full drawer height minus smaller handle
                }}>
                  <ElementorChat
                    messages={messages}
                    isLoading={isLoading}
                    status={status}
                    onSendMessage={(text) => handleSendMessage(text)}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    onReload={reload}
                    onStreamUpdate={(type, content) => {
                      setStreamedCode(prev => ({ ...prev, [type]: content }));
                    }}
                    onSwitchToSectionEditor={() => setActiveTab('json')}
                    onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
                    onUpdateSection={(updates) => {
                      if (currentSection) {
                        setCurrentSection({ ...currentSection, ...updates });
                      }
                    }}
                    currentSection={currentSection}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Keyboard Shortcuts Modal - Desktop Only */}
      {!isMobile && (
        <KeyboardShortcutsModal
          isOpen={shortcutsModalOpen}
          onClose={() => setShortcutsModalOpen(false)}
          shortcuts={keyboardShortcuts}
        />
      )}
      </>
    </GlobalStylesheetProvider>
  );
}
