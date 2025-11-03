'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useEditorContent } from '@/hooks/useEditorContent';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import '../elementor-editor.css';

export const dynamic = 'force-dynamic';
import { ElementorChat } from '@/components/elementor/ElementorChat';
import { JsonEditor } from '@/components/elementor/JsonEditor';
import { PlaygroundView } from '@/components/elementor/PlaygroundView';
import { HtmlGeneratorNew } from '@/components/elementor/HtmlGeneratorNew';
import { SiteContentManager } from '@/components/elementor/SiteContentManager';
import { StyleKitEditorNew } from '@/components/elementor/StyleKitEditorNew';
import { StyleGuideUnified } from '@/components/elementor/StyleGuideUnified';
import { HtmlSectionEditor } from '@/components/elementor/HtmlSectionEditor';
import { VisualSectionEditor } from '@/components/elementor/VisualSectionEditor';
import { ProjectLibrary } from '@/components/elementor/ProjectLibrary';
import { PageSplitter } from '@/components/elementor/PageSplitter';
import { UsageTrackingTab } from '@/components/elementor/UsageTrackingTab';
import { useElementorState } from '@/lib/hooks/useElementorState';
import { Section, createSection } from '@/lib/section-schema';
import { FileIcon, PaletteIcon, ArrowRightIcon, GlobeIcon, LayoutIcon, XIcon, CodeIcon, EyeIcon, ImageIcon, BarChart3Icon } from '@/components/ui/icons';
import Script from 'next/script';
import { GlobalStylesheetProvider } from '@/lib/global-stylesheet-context';
import { ToastContainer } from '@/components/ui/Toast';
import { useToastListener } from '@/hooks/useToast';
import type { Toast } from '@/components/ui/Toast';
import { KeyboardShortcutsModal, type KeyboardShortcut } from '@/components/ui/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/useToast';
import { BottomNav } from '@/components/ui/BottomNav';
import { NavigationBar } from '@/components/ai-elements/inner-navigation-bar';
import { TwoPanelChatLayout } from '@/components/layouts/TwoPanelChatLayout';
import { GenerateProjectModal } from '@/components/elementor/GenerateProjectModal';

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
  const [chatVisible, setChatVisible] = useState(true);
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const [streamedCode, setStreamedCode] = useState<{ html: string; css: string; js: string }>({ html: '', css: '', js: '' });
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [currentSection, setCurrentSection] = useState<Section | null>(createSection());
  const [loadedSection, setLoadedSection] = useState<Section | null>(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [projectPanelOpen, setProjectPanelOpen] = useState(true);
  const [filesPanelOpen, setFilesPanelOpen] = useState(true);
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

  // Get editor content from global state for chat context
  const editorContent = useEditorContent();

  // Usage tracking
  const { recordUsage } = useUsageTracking();

  // Use AI SDK chat hook - Elementor-specific API endpoint
  console.log('🔧 ELEMENTOR PAGE: useChat configured with api:', '/api/chat-elementor');
  const { messages, sendMessage, isLoading, setMessages, reload, status } = useChat({
    api: '/api/chat-elementor',
    // Initial body - will be merged with additional data in sendMessage calls
    body: {
      currentSection: currentSection || null,
      model: selectedModel,
    },
    // Override fetch to force the correct endpoint
    fetch: async (url, options) => {
      console.log('🌐 FETCH CALLED - Original URL:', url);
      console.log('🌐 FETCH - Forcing to /api/chat-elementor');
      return fetch('/api/chat-elementor', options);
    },
    // Track usage when message finishes
    onFinish: (message, options) => {
      console.log('🔍 onFinish called');
      console.log('  Message:', message);
      console.log('  Message.metadata:', message.metadata);
      console.log('  Options:', options);
      console.log('  Full message JSON:', JSON.stringify(message, null, 2));

      // Check multiple possible locations for usage data
      let usageData = null;

      // Try message.metadata first (standard location)
      if (message.metadata && 'promptTokens' in message.metadata) {
        console.log('✅ Found usage in message.metadata');
        usageData = message.metadata;
      }
      // Try options.usage (alternative location)
      else if (options?.usage) {
        console.log('✅ Found usage in options.usage');
        usageData = options.usage;
      }
      // Try experimental fields
      else if ((message as any).experimental_metadata) {
        console.log('✅ Found usage in experimental_metadata');
        usageData = (message as any).experimental_metadata;
      }

      if (usageData) {
        const metadata = usageData as any;
        recordUsage(metadata.model || selectedModel, {
          inputTokens: metadata.promptTokens || metadata.inputTokens || 0,
          outputTokens: metadata.completionTokens || metadata.outputTokens || 0,
          cacheCreationTokens: metadata.cacheCreationTokens || 0,
          cacheReadTokens: metadata.cacheReadTokens || metadata.cachedInputTokens || 0,
        });
        console.log('✅ Usage recorded for model:', metadata.model || selectedModel);
      } else {
        console.log('❌ No usage metadata found in message or options');
      }
    }
  });

  // ALTERNATIVE: Watch messages array for metadata updates
  // This works around potential onFinish callback issues
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Only process assistant messages
    if (lastMessage.role !== 'assistant') return;

    // Check if this message has metadata
    const messageWithMetadata = lastMessage as any;
    console.log('📬 New assistant message received');
    console.log('   Message ID:', lastMessage.id);
    console.log('   Has metadata:', !!messageWithMetadata.metadata);

    if (messageWithMetadata.metadata) {
      console.log('   Metadata:', messageWithMetadata.metadata);

      const meta = messageWithMetadata.metadata;
      if (meta.promptTokens !== undefined || meta.totalTokens !== undefined) {
        console.log('✅ Usage metadata found via messages array!');
        recordUsage(meta.model || selectedModel, {
          inputTokens: meta.promptTokens || meta.inputTokens || 0,
          outputTokens: meta.completionTokens || meta.outputTokens || 0,
          cacheCreationTokens: meta.cacheCreationTokens || 0,
          cacheReadTokens: meta.cacheReadTokens || meta.cachedInputTokens || 0,
        });
        console.log('✅ Usage tracked via useEffect watcher');
      }
    }
  }, [messages, selectedModel, recordUsage]);

  // Navigation dropdown handler
  const handleNavigationDropdownClick = (tabId: string, item: string) => {
    // Skip separator items
    if (item === '---') return;

    // Options tab actions
    if (tabId === 'options') {
      if (item === 'Hide Chat' || item === 'Show Chat') {
        setChatVisible(!chatVisible);
      }
      return;
    }

    // Code Editor tab actions
    if (tabId === 'code-editor') {
      setActiveTab('json'); // Always switch to code editor tab

      if (item === 'Generate Code') {
        setGenerateDialogOpen(true);
        return;
      } else if (item === 'Preview HTML') {
        // Trigger HTML preview
        window.dispatchEvent(new CustomEvent('trigger-preview-html'));
        return;
      } else if (item === 'Preview HubL') {
        // Trigger HubL preview
        window.dispatchEvent(new CustomEvent('trigger-preview-hubl'));
        return;
      } else if (item === 'Deploy to WordPress') {
        // Trigger deploy to WordPress
        if (typeof window !== 'undefined' && (window as any).importHtmlSectionToPage && currentSection) {
          (window as any).importHtmlSectionToPage(currentSection.html, currentSection.css, currentSection.js);
          toast.success('Deployed to WordPress!');
        } else {
          toast.error('WordPress Playground not ready');
        }
        return;
      } else if (item === 'Split HTML') {
        // Trigger split HTML dialog
        window.dispatchEvent(new CustomEvent('split-html'));
        return;
      }
      return;
    }

    // Project Library tab actions
    if (tabId === 'project-library') {
      setActiveTab('sections');
      if (item === 'Grid View') {
        window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'grid' }));
      } else if (item === 'List View') {
        window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'list' }));
      }
      return;
    }

    // WordPress Playground tab actions
    if (tabId === 'wordpress-playground') {
      setActiveTab('playground');
      if (item === 'Launch Playground' || item === 'Refresh Playground') {
        // Playground component will handle the launch/refresh internally
      } else if (item === 'Import to Template Library') {
        // Trigger import to template library action
        if (typeof window !== 'undefined' && (window as any).saveSectionToTemplateLibrary && currentSection) {
          (window as any).saveSectionToTemplateLibrary(currentSection.html, currentSection.css, currentSection.js, currentSection.name);
          toast.success('Imported to Template Library!');
        } else {
          toast.error('WordPress Playground not ready');
        }
      }
      return;
    }

    // Style Guide tab actions
    if (tabId === 'style-guide') {
      setActiveTab('style-guide');
      if (item === 'Style Kit Editor') {
        // Open style kit editor (default view)
        window.dispatchEvent(new CustomEvent('open-style-kit-editor'));
      } else if (item === 'Brandfetch Import') {
        // Open Brandfetch import dialog
        window.dispatchEvent(new CustomEvent('open-brandfetch-import'));
      } else if (item === 'Page Extract') {
        // Open page extract dialog
        window.dispatchEvent(new CustomEvent('open-page-extract'));
      }
      return;
    }

    // Usage tab actions
    if (tabId === 'usage') {
      setActiveTab('usage');
      if (item === 'Export Data') {
        // Trigger export data
        window.dispatchEvent(new CustomEvent('export-usage-data'));
      } else if (item === 'Clear History') {
        // Trigger clear history
        window.dispatchEvent(new CustomEvent('clear-usage-history'));
      }
      return;
    }
  };

  // Define all keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = [
    // Help & Navigation
    { key: '?', description: 'Show keyboard shortcuts', category: 'Help & Navigation' },
    { key: 'k', modifiers: ['ctrl'], description: 'Show keyboard shortcuts', category: 'Help & Navigation' },
    { key: 'b', modifiers: ['ctrl'], description: 'Toggle chat panel', category: 'Help & Navigation' },
    { key: '1', modifiers: ['ctrl'], description: 'Go to Code Editor', category: 'Help & Navigation' },
    // { key: '2', modifiers: ['ctrl'], description: 'Go to Visual Editor', category: 'Help & Navigation' },
    { key: '3', modifiers: ['ctrl'], description: 'Go to Project Library', category: 'Help & Navigation' },
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
        toast.info('Switched to Project Library');
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

  // Navigation tabs configuration
  const navigationTabs: any[] = [
    {
      id: 'options',
      label: 'Options',
      icon: null,
      dropdownItems: [chatVisible ? 'Hide Chat' : 'Show Chat'],
    },
    {
      id: 'code-editor',
      label: 'Code Editor',
      icon: null,
      dropdownItems: [
        'Generate Code',
        'Preview HTML',
        'Preview HubL',
        'Deploy to WordPress',
        'Split HTML',
      ],
    },
    {
      id: 'project-library',
      label: 'Project Library',
      icon: null,
      dropdownItems: ['Grid View', 'List View'],
    },
    {
      id: 'wordpress-playground',
      label: 'WordPress',
      icon: null,
      dropdownItems: ['Launch Playground', 'Refresh Playground', 'Import to Template Library'],
    },
    {
      id: 'style-guide',
      label: 'Style Kit',
      icon: null,
      dropdownItems: ['Style Kit Editor', 'Brandfetch Import', 'Page Extract'],
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: null,
      dropdownItems: ['Export Data', 'Clear History'],
    },
  ];

  const handleSendMessage = async (content: string, imageData?: { url: string; filename: string }, settings?: { webSearchEnabled: boolean; reasoningEffort: string; detailedMode?: boolean }) => {
    if (!content.trim() || isLoading) return;

    try {
      // If web search is enabled but not using a Perplexity model, switch to Perplexity Sonar (same as main chat)
      let modelToUse = selectedModel;
      if (settings?.webSearchEnabled && !selectedModel.startsWith('perplexity/')) {
        console.log('Switching to Perplexity model for web search');
        modelToUse = 'perplexity/sonar';
      }

      // Use AI SDK's sendMessage with currentSection
      // NOTE: We send currentSection directly, not editorContent, to ensure
      // the AI always sees the full selected project from the library
      console.log('📤 Sending message with currentSection:', {
        name: currentSection?.name,
        id: currentSection?.id,
        htmlLength: currentSection?.html?.length || 0,
        cssLength: currentSection?.css?.length || 0,
        jsLength: currentSection?.js?.length || 0,
        phpLength: currentSection?.php?.length || 0,
        hasImage: !!imageData,
      });

      // Build message parts - include image if provided (matching chat-doc format)
      const parts: any[] = [{ type: 'text', text: content }];
      if (imageData) {
        // Detect image MIME type from data URL
        const mimeMatch = imageData.url.match(/^data:([^;]+);/);
        const mediaType = mimeMatch ? mimeMatch[1] : 'image/png';

        parts.push({
          type: 'file' as const,
          mediaType,
          url: imageData.url,
        });
      }

      sendMessage(
        { role: 'user', parts },
        {
          body: {
            model: modelToUse,
            currentJson,
            currentSection: settings?.includeContext !== false ? currentSection : null,
            webSearch: settings?.webSearchEnabled ?? false,
            reasoningEffort: settings?.reasoningEffort ?? 'medium',
            detailedMode: settings?.detailedMode ?? false,
            includeContext: settings?.includeContext ?? true,
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
        height: '100vh',
        paddingBottom: isMobile ? '48px' : '0'
      }}>
        {/* Desktop: Two-panel layout with TwoPanelChatLayout */}
        {!isMobile && chatVisible && (
          <TwoPanelChatLayout
            leftPanel={
              <div style={{
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <div className="rounded-lg bg-background" style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  width: '100%',
                  maxWidth: '100%'
                }}>
                  <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <NavigationBar
                      tabs={navigationTabs}
                      onTabChange={(tabId) => {
                        const tabMap: Record<string, string> = {
                          'code-editor': 'json',
                          'project-library': 'sections',
                          'wordpress-playground': 'playground',
                          'site-content': 'site-content',
                          'style-guide': 'style-guide',
                          'usage': 'usage',
                        };
                        setActiveTab(tabMap[tabId] || tabId);
                      }}
                      onDropdownItemClick={handleNavigationDropdownClick}
                      showOnDesktop={true}
                      showOnMobile={false}
                    />
                  </div>
                  <ElementorChat
                    messages={messages}
                    isLoading={isLoading}
                    status={status}
                    onSendMessage={handleSendMessage}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    onReload={reload}
                    onStreamUpdate={(type, content) => {
                      setStreamedCode(prev => ({ ...prev, [type]: content }));
                    }}
                    onSwitchToSectionEditor={() => setActiveTab('json')}
                    onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
                    onSwitchTab={(tab) => setActiveTab(tab)}
                    onUpdateSection={(updates) => {
                      if (currentSection) {
                        setCurrentSection({ ...currentSection, ...updates });
                      }
                    }}
                    currentSection={currentSection}
                  />
                </div>
              </div>
            }
            rightPanel={
              <div
                style={{
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <div className="rounded-lg bg-background shadow-sm" style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
              {/* Tab Content - Keep all tabs mounted, just hide inactive ones */}
              <div className="tab-content" style={{ flex: '1', overflow: 'hidden' }}>
                <div className={`tab-panel ${activeTab === 'json' ? 'active' : ''}`} id="jsonPanel" style={{ display: activeTab === 'json' ? 'flex' : 'none' }}>
                  <HtmlSectionEditor
                key={loadedSection?.id || 'default'} // Force remount when loading new section
                initialSection={loadedSection || undefined}
                streamedHtml={streamedCode.html}
                streamedCss={streamedCode.css}
                streamedJs={streamedCode.js}
                activeCodeTab={activeCodeTab}
                onCodeTabChange={setActiveCodeTab}
                isTabVisible={activeTab === 'json'}
                onSendChatMessage={(message) => {
                  // Send message to chat from validation modal
                  sendMessage({ content: message, role: 'user' });
                }}
                onSectionChange={(section) => {
                  console.log('📝 HtmlSectionEditor: Section changed:', {
                    id: section.id,
                    name: section.name,
                    htmlLength: section.html?.length || 0,
                    cssLength: section.css?.length || 0,
                    jsLength: section.js?.length || 0,
                    phpLength: section.php?.length || 0
                  });
                  setCurrentSection(section);
                  console.log('✅ Parent: currentSection state updated');
                }}
                onSwitchToVisualEditor={() => setActiveTab('visual')}
                onSwitchToPlayground={() => setActiveTab('playground')}
                chatVisible={chatVisible}
                setChatVisible={setChatVisible}
                tabBarVisible={tabBarVisible}
                setTabBarVisible={setTabBarVisible}
                onEditElementInChat={(elementData) => {
                  // Show chat if hidden
                  if (!chatVisible && !isMobile) {
                    setChatVisible(true);
                  }
                  // Open chat drawer on mobile
                  if (isMobile) {
                    setChatDrawerOpen(true);
                  }

                  // Send pre-filled message to chat
                  const message = `Edit this element:\n\nSelector: ${elementData.selector}\nClasses: ${elementData.classList.join(', ')}\n\nHTML:\n\`\`\`html\n${elementData.html}\n\`\`\`\n\nContext:\n\`\`\`html\n${elementData.context.substring(0, 500)}${elementData.context.length > 500 ? '...' : ''}\n\`\`\``;

                  handleSendMessage(message);
                }}
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
                    isTabVisible={activeTab === 'playground'}
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
                  <ProjectLibrary
                    isTabVisible={activeTab === 'sections'}
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    tabBarVisible={tabBarVisible}
                    setTabBarVisible={setTabBarVisible}
                    onOpenProject={(projectId) => {
                      console.log('📝 Opening project in editor:', projectId);
                      // Switch to Code Editor tab
                      setActiveTab('json');
                      // Trigger project selection via custom event
                      window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId } }));
                    }}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'site-content' ? 'active' : ''}`} id="siteContentPanel" style={{ display: activeTab === 'site-content' ? 'flex' : 'none' }}>
                  <SiteContentManager
                    playgroundReady={playgroundReady}
                    isTabVisible={activeTab === 'site-content'}
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
                  <StyleGuideUnified
                    isTabVisible={activeTab === 'style-guide'}
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    tabBarVisible={tabBarVisible}
                    setTabBarVisible={setTabBarVisible}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'usage' ? 'active' : ''}`} id="usagePanel" style={{ display: activeTab === 'usage' ? 'flex' : 'none' }}>
                  <UsageTrackingTab
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    tabBarVisible={tabBarVisible}
                    setTabBarVisible={setTabBarVisible}
                  />
                </div>
              </div>
                </div>
              </div>
            }
          />
        )}

        {/* Desktop: Chat hidden view */}
        {!isMobile && !chatVisible && (
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <NavigationBar
              tabs={navigationTabs}
              onTabChange={(tabId) => {
                const tabMap: Record<string, string> = {
                  'code-editor': 'json',
                  'project-library': 'sections',
                  'wordpress-playground': 'playground',
                  'site-content': 'site-content',
                  'style-guide': 'style-guide',
                  'usage': 'usage',
                };
                setActiveTab(tabMap[tabId] || tabId);
              }}
              onDropdownItemClick={handleNavigationDropdownClick}
              showOnDesktop={true}
              showOnMobile={false}
            />
            <div className="tab-content" style={{ flex: '1', overflow: 'hidden' }}>
              {/* Tab panels - same as before */}
              <div className={`tab-panel ${activeTab === 'json' ? 'active' : ''}`} id="jsonPanel" style={{ display: activeTab === 'json' ? 'flex' : 'none' }}>
                <HtmlSectionEditor
                  key={loadedSection?.id || 'default'}
                  initialSection={loadedSection || undefined}
                  streamedHtml={streamedCode.html}
                  streamedCss={streamedCode.css}
                  streamedJs={streamedCode.js}
                  activeCodeTab={activeCodeTab}
                  onCodeTabChange={setActiveCodeTab}
                  isTabVisible={activeTab === 'json'}
                  onSendChatMessage={(message) => {
                    sendMessage({ content: message, role: 'user' });
                  }}
                  onSectionChange={(section) => {
                    console.log('📝 HtmlSectionEditor: Section changed:', {
                      id: section.id,
                      name: section.name,
                      htmlLength: section.html?.length || 0,
                      cssLength: section.css?.length || 0,
                      jsLength: section.js?.length || 0,
                      phpLength: section.php?.length || 0
                    });
                    setCurrentSection(section);
                    console.log('✅ Parent: currentSection state updated');
                  }}
                  onSwitchToVisualEditor={() => setActiveTab('visual')}
                  onSwitchToPlayground={() => setActiveTab('playground')}
                  chatVisible={chatVisible}
                  setChatVisible={setChatVisible}
                  tabBarVisible={true}
                  setTabBarVisible={() => {}}
                  onEditElementInChat={(elementData) => {
                    if (!chatVisible && !isMobile) {
                      setChatVisible(true);
                    }
                    if (isMobile) {
                      setChatDrawerOpen(true);
                    }
                    const message = `Edit this element:\n\nSelector: ${elementData.selector}\nClasses: ${elementData.classList.join(', ')}\n\nHTML:\n\`\`\`html\n${elementData.html}\n\`\`\`\n\nContext:\n\`\`\`html\n${elementData.context.substring(0, 500)}${elementData.context.length > 500 ? '...' : ''}\n\`\`\``;
                    handleSendMessage(message);
                  }}
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
                  isTabVisible={activeTab === 'playground'}
                  chatVisible={chatVisible}
                  setChatVisible={setChatVisible}
                  tabBarVisible={true}
                  setTabBarVisible={() => {}}
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
                <ProjectLibrary
                  isTabVisible={activeTab === 'sections'}
                  chatVisible={chatVisible}
                  setChatVisible={setChatVisible}
                  tabBarVisible={true}
                  setTabBarVisible={() => {}}
                  onOpenProject={(projectId) => {
                    console.log('📝 Opening project in editor:', projectId);
                    setActiveTab('json');
                    window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId } }));
                  }}
                />
              </div>

              <div className={`tab-panel ${activeTab === 'site-content' ? 'active' : ''}`} id="siteContentPanel" style={{ display: activeTab === 'site-content' ? 'flex' : 'none' }}>
                <SiteContentManager
                  playgroundReady={playgroundReady}
                  isTabVisible={activeTab === 'site-content'}
                  chatVisible={chatVisible}
                  setChatVisible={setChatVisible}
                  tabBarVisible={true}
                  setTabBarVisible={() => {}}
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
                <StyleGuideUnified
                  isTabVisible={activeTab === 'style-guide'}
                  chatVisible={chatVisible}
                  setChatVisible={setChatVisible}
                  tabBarVisible={true}
                  setTabBarVisible={() => {}}
                />
              </div>

              <div className={`tab-panel ${activeTab === 'usage' ? 'active' : ''}`} id="usagePanel" style={{ display: activeTab === 'usage' ? 'flex' : 'none' }}>
                <UsageTrackingTab
                  chatVisible={chatVisible}
                  setChatVisible={setChatVisible}
                  tabBarVisible={true}
                  setTabBarVisible={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile: Main content with NavigationBar + Tab panels */}
        {isMobile && (
          <>
            {/* Fixed NavigationBar at top */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 4000,
              background: 'var(--background)',
              borderBottom: '1px solid var(--border)'
            }}>
              <NavigationBar
                tabs={navigationTabs}
                onTabChange={(tabId) => {
                  const tabMap: Record<string, string> = {
                    'code-editor': 'json',
                    'project-library': 'sections',
                    'wordpress-playground': 'playground',
                    'site-content': 'site-content',
                    'style-guide': 'style-guide',
                    'usage': 'usage',
                  };
                  setActiveTab(tabMap[tabId] || tabId);
                }}
                onDropdownItemClick={handleNavigationDropdownClick}
                showOnDesktop={false}
                showOnMobile={true}
              />
            </div>

            {/* Tab Content - positioned below navbar */}
            <div style={{
              paddingTop: '52px',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div className="tab-content" style={{ flex: '1', overflow: 'hidden' }}>
                <div className={`tab-panel ${activeTab === 'json' ? 'active' : ''}`} style={{ display: activeTab === 'json' ? 'flex' : 'none' }}>
                  <HtmlSectionEditor
                    key={loadedSection?.id || 'default'}
                    initialSection={loadedSection || undefined}
                    streamedHtml={streamedCode.html}
                    streamedCss={streamedCode.css}
                    streamedJs={streamedCode.js}
                    activeCodeTab={activeCodeTab}
                    onCodeTabChange={setActiveCodeTab}
                    isTabVisible={activeTab === 'json'}
                    onSendChatMessage={(message) => {
                      sendMessage({ content: message, role: 'user' });
                    }}
                    onSectionChange={(section) => {
                      setCurrentSection(section);
                    }}
                    onSwitchToVisualEditor={() => setActiveTab('visual')}
                    onSwitchToPlayground={() => setActiveTab('playground')}
                    chatVisible={false}
                    setChatVisible={setChatVisible}
                    tabBarVisible={false}
                    setTabBarVisible={() => {}}
                    onEditElementInChat={(elementData) => {
                      setChatDrawerOpen(true);
                      const message = `Edit this element:\n\nSelector: ${elementData.selector}\nClasses: ${elementData.classList.join(', ')}\n\nHTML:\n\`\`\`html\n${elementData.html}\n\`\`\`\n\nContext:\n\`\`\`html\n${elementData.context.substring(0, 500)}${elementData.context.length > 500 ? '...' : ''}\n\`\`\``;
                      handleSendMessage(message);
                    }}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'playground' ? 'active' : ''}`} style={{ display: activeTab === 'playground' ? 'flex' : 'none' }}>
                  <PlaygroundView
                    json={currentJson}
                    isActive={activeTab === 'playground'}
                    isTabVisible={activeTab === 'playground'}
                    chatVisible={false}
                    setChatVisible={setChatVisible}
                    tabBarVisible={false}
                    setTabBarVisible={() => {}}
                    onJsonUpdate={(updatedJson) => {
                      setCurrentJson(updatedJson);
                    }}
                    onPlaygroundReady={() => {
                      setPlaygroundReady(true);
                    }}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'sections' ? 'active' : ''}`} style={{ display: activeTab === 'sections' ? 'flex' : 'none' }}>
                  <ProjectLibrary
                    isTabVisible={activeTab === 'sections'}
                    chatVisible={false}
                    setChatVisible={setChatVisible}
                    tabBarVisible={false}
                    setTabBarVisible={() => {}}
                    onOpenProject={(projectId) => {
                      setActiveTab('json');
                      window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId } }));
                    }}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'site-content' ? 'active' : ''}`} style={{ display: activeTab === 'site-content' ? 'flex' : 'none' }}>
                  <SiteContentManager
                    playgroundReady={playgroundReady}
                    isTabVisible={activeTab === 'site-content'}
                    chatVisible={false}
                    setChatVisible={setChatVisible}
                    tabBarVisible={false}
                    setTabBarVisible={() => {}}
                    onPush={(config) => {
                      if (typeof window !== 'undefined' && (window as any).applySiteConfig) {
                        (window as any).applySiteConfig(config);
                      } else {
                        alert('Please launch WordPress Playground first');
                      }
                    }}
                    onPull={async () => {
                      if (typeof window !== 'undefined' && (window as any).getWordPressSettings && (window as any).getWordPressPages) {
                        const settings = await (window as any).getWordPressSettings();
                        const pages = await (window as any).getWordPressPages();
                        return { settings, pages };
                      }
                      throw new Error('Playground not running');
                    }}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'style-guide' ? 'active' : ''}`} style={{ display: activeTab === 'style-guide' ? 'flex' : 'none' }}>
                  <StyleGuideUnified
                    isTabVisible={activeTab === 'style-guide'}
                    chatVisible={false}
                    setChatVisible={setChatVisible}
                    tabBarVisible={false}
                    setTabBarVisible={() => {}}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'usage' ? 'active' : ''}`} style={{ display: activeTab === 'usage' ? 'flex' : 'none' }}>
                  <UsageTrackingTab
                    chatVisible={false}
                    setChatVisible={setChatVisible}
                    tabBarVisible={false}
                    setTabBarVisible={() => {}}
                  />
                </div>
              </div>
            </div>
          </>
        )}

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
                bottom: '10px',
                left: '10px',
                right: '10px',
                height: chatDrawerOpen ? 'calc(95vh - 10px)' : '48px', // Smaller handle with margin
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                zIndex: 3200, // Above options button (3000)
                transition: 'height 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden'
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
                  borderRadius: chatDrawerOpen ? '12px 12px 0 0' : '12px',
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
                    onSendMessage={handleSendMessage}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    onReload={reload}
                    onStreamUpdate={(type, content) => {
                      setStreamedCode(prev => ({ ...prev, [type]: content }));
                    }}
                    onSwitchToSectionEditor={() => setActiveTab('json')}
                    onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
                    onSwitchTab={(tab) => setActiveTab(tab)}
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

      {/* Generate Project Modal */}
      <GenerateProjectModal
        isOpen={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={(code) => {
          // Update the current section with generated code
          if (currentSection) {
            setCurrentSection({
              ...currentSection,
              html: code.html || '',
              css: code.css || '',
              js: code.js || '',
              php: code.php || '',
            });
          }
          // Set streamed code to trigger display in editor
          setStreamedCode({
            html: code.html || '',
            css: code.css || '',
            js: code.js || '',
          });
          // Switch to code editor tab
          setActiveTab('json');
          setGenerateDialogOpen(false);
        }}
        defaultModel={selectedModel}
      />

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
      </>
    </GlobalStylesheetProvider>
  );
}
