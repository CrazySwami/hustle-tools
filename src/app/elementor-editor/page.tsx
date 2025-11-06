'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { useEditorContent } from '@/hooks/useEditorContent';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useFileGroups } from '@/hooks/useFileGroups';
import '../elementor-editor.css';

export const dynamic = 'force-dynamic';

// 🔍 DIAGNOSTIC: Global function to trace state updates
if (typeof window !== 'undefined') {
  // Comparison function - shows localStorage vs React state
  (window as any).__compareStates = () => {
    const localState = JSON.parse(localStorage.getItem('elementor-editor-groups') || '{}');
    const reactState = (window as any).__elementorReactState;

    console.clear(); // Clear console first
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan; font-weight: bold');
    console.log('%c🔍 STATE COMPARISON', 'color: cyan; font-weight: bold; font-size: 16px');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan; font-weight: bold');

    console.log('%c📦 LOCALSTORAGE:', 'color: orange; font-weight: bold');
    console.log('   activeGroupId:', localState.activeGroupId);
    console.log('   Active project:', localState.groups?.find((g: any) => g.id === localState.activeGroupId)?.name || 'none');

    console.log('%c⚛️  REACT STATE:', 'color: blue; font-weight: bold');
    console.log('   activeGroupId:', reactState?.activeGroupId);
    console.log('   currentProjectName:', reactState?.currentProjectName);

    console.log('%c🔴 SYNC STATUS:', 'color: red; font-weight: bold');
    const inSync = localState.activeGroupId === reactState?.activeGroupId;
    console.log('   In Sync?', inSync ? '✅ YES' : '❌ NO');

    if (!inSync) {
      console.log('%c⚠️  MISMATCH:', 'color: red; font-weight: bold; font-size: 14px');
      console.log('   localStorage:', localState.activeGroupId);
      console.log('   React:', reactState?.activeGroupId);
    }

    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan; font-weight: bold');
    return { localState, reactState, inSync };
  };
}
import { ElementorChat } from '@/components/elementor/ElementorChat';
import { JsonEditor } from '@/components/elementor/JsonEditor';
import { PlaygroundView } from '@/components/elementor/PlaygroundView';
import { HtmlGeneratorNew } from '@/components/elementor/HtmlGeneratorNew';
import { SiteContentManager } from '@/components/elementor/SiteContentManager';
import { StyleKitEditorNew } from '@/components/elementor/StyleKitEditorNew';
import { StyleGuideUnified } from '@/components/elementor/StyleGuideUnified';
import { HtmlSectionEditor } from '@/components/elementor/HtmlSectionEditor';
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
import { ResizableSplitPanel } from '@/components/layouts/ResizableSplitPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
  // REMOVED: currentSection state - now derived from fileGroups.activeGroup
  // This fixes the race condition where onSectionChange would overwrite project selection
  const [loadedSection, setLoadedSection] = useState<Section | null>(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [projectPanelOpen, setProjectPanelOpen] = useState(true);
  const [filesPanelOpen, setFilesPanelOpen] = useState(true);
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  const [topPanelTab, setTopPanelTab] = useState('json');
  const [bottomPanelTab, setBottomPanelTab] = useState('sections');
  const [splitRatio, setSplitRatio] = useState(50); // Percentage for top panel
  const [splitViewConfigOpen, setSplitViewConfigOpen] = useState(false);
  const toast = useToast();

  // Monaco editor refs for direct updates during streaming (bypasses React batching)
  const [editorRefs, setEditorRefs] = useState<{
    html: any | null;
    css: any | null;
    js: any | null;
    php: any | null;
    hubl: any | null;
  }>({
    html: null,
    css: null,
    js: null,
    php: null,
    hubl: null,
  });

  // Editor ready state tracking (for streaming synchronization)
  const [editorsReady, setEditorsReady] = useState({
    html: false,
    css: false,
    js: false,
    php: false,
    hubl: false,
    docs: false
  });

  // Function to check if editor is ready
  const isEditorReady = (fileType: string) => {
    return editorsReady[fileType as keyof typeof editorsReady] || false;
  };

  // File Groups - reload from localStorage when project changes
  const fileGroups = useFileGroups();

  // CRITICAL: Compute currentProject directly from primitives (activeGroupId + groups array)
  // This ensures we get fresh data on every render without reference issues
  const currentProject = fileGroups.activeGroupId
    ? fileGroups.groups.find(g => g.id === fileGroups.activeGroupId) || null
    : null;

  // Derive currentSection from currentProject (single source of truth)
  // Pass full currentProject object to preserve ALL metadata (isPlugin, widgetFiles, etc.)
  // CRITICAL: Don't cast to Section type - it strips away plugin metadata!
  // MUST be defined BEFORE useEffect that references it
  const currentSection = currentProject;

  const refreshRef = useRef(fileGroups.refresh);
  refreshRef.current = fileGroups.refresh;

  // DEBUG: Log when activeGroupId changes
  useEffect(() => {
    console.log('🔍 activeGroupId changed:', {
      activeGroupId: fileGroups.activeGroupId,
      currentProjectId: currentProject?.id,
      currentProjectName: currentProject?.name,
      timestamp: new Date().toISOString(),
    });

    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).__elementorReactState = {
        activeGroupId: fileGroups.activeGroupId,
        currentProjectId: currentProject?.id,
        currentProjectName: currentProject?.name,
        currentSectionId: currentSection?.id,
        currentSectionName: currentSection?.name,
        groupsCount: fileGroups.groups.length,
        groups: fileGroups.groups.map(g => ({
          id: g.id,
          name: g.name,
          type: g.type
        }))
      };
    }
  }, [fileGroups.activeGroupId, currentProject?.id, currentSection?.id, currentSection?.name, fileGroups.groups]);

  console.log('🔄 currentSection computed:', {
    activeGroupId: fileGroups.activeGroupId,
    projectId: currentProject?.id,
    projectName: currentProject?.name,
    sectionId: currentSection?.id,
    sectionName: currentSection?.name,
    htmlLength: currentSection?.html?.length || 0,
    timestamp: new Date().toISOString(),
  });

  // Chat panel width tracking for responsive NavigationBar
  const [chatPanelWidth, setChatPanelWidth] = useState<number>(0);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Measure chat panel width for responsive NavigationBar
  useEffect(() => {
    if (!chatPanelRef.current) return;

    const updatePanelWidth = () => {
      if (chatPanelRef.current) {
        const width = chatPanelRef.current.offsetWidth;
        setChatPanelWidth(width);
      }
    };

    // Initial measurement
    updatePanelWidth();

    // Set up ResizeObserver to track panel width changes
    const observer = new ResizeObserver(updatePanelWidth);
    observer.observe(chatPanelRef.current);

    return () => observer.disconnect();
  }, []);

  // Log when currentProject changes (for debugging)
  useEffect(() => {
    console.log('🔄 page.tsx: currentProject changed:', {
      id: currentProject?.id,
      name: currentProject?.name,
      type: currentProject?.type,
      timestamp: new Date().toISOString(),
    });
  }, [currentProject]);

  // Hot reload state
  const [hotReloadEnabled, setHotReloadEnabled] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hot-reload-enabled');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // File inclusions state (controls which files are sent to AI context)
  const [fileInclusions, setFileInclusions] = useState({
    html: true,
    css: true,
    js: true,
    php: true,
    hubl: true,
    pluginMainFile: true,
    readme: true,
  });

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
    // Initial body - DO NOT include currentSection here as it captures stale value at mount
    // currentSection MUST be passed in sendMessage options to get fresh value
    body: {
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

  // Clear AI SDK cache on mount to ensure correct endpoint is used
  // This fixes the issue where chat was hitting /api/chat instead of /api/chat-elementor
  useEffect(() => {
    const clearStaleMessages = () => {
      try {
        // Clear AI SDK cache
        sessionStorage.removeItem('ai-chat-messages');
        localStorage.removeItem('ai-chat-messages');

        // Clear any Vercel AI SDK internal cache
        const aiCacheKeys = Object.keys(localStorage).filter(key =>
          key.startsWith('ai-') || key.includes('chat')
        );
        aiCacheKeys.forEach(key => localStorage.removeItem(key));

        console.log('🧹 Cleared stale AI SDK cache to ensure /api/chat-elementor is used');
      } catch (err) {
        console.warn('Failed to clear cache:', err);
      }
    };

    clearStaleMessages();
  }, []); // Run only on mount

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
  const handleNavigationDropdownClick = async (tabId: string, item: string) => {
    // Skip separator items
    if (item === 'separator') return;

    // Options tab actions
    if (tabId === 'options') {
      if (item === 'Hide Chat' || item === 'Show Chat') {
        setChatVisible(!chatVisible);
        return;
      }

      if (item === 'Enable Split View' || item === 'Disable Split View') {
        setSplitViewEnabled(!splitViewEnabled);
        return;
      }

      if (item === 'Configure Split View') {
        setSplitViewConfigOpen(true);
        return;
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
        return;
      }

      // Hot reload toggle
      if (item.startsWith('⚡ Hot Reload')) {
        const newValue = !hotReloadEnabled;
        setHotReloadEnabled(newValue);
        localStorage.setItem('hot-reload-enabled', JSON.stringify(newValue));
        toast.success(`Hot Reload ${newValue ? 'enabled' : 'disabled'}`);
        return;
      }

      // Deploy New section headers (not clickable)
      if (item === '🚀 Deploy New' || item === '🔄 Update & View') {
        return;
      }

      // Deploy to Live Page
      if (item === 'Deploy to Live Page') {
        // Call playground function to deploy widget to live page
        if (typeof window !== 'undefined' && (window as any).deployAndPreviewWidget && currentProject) {
          try {
            const result = await (window as any).deployAndPreviewWidget(currentProject.php, currentProject.css, currentProject.js, 'live-page');

            // Save deployment metadata to FileGroup
            if (result.success && currentProject.id) {
              const { updateGroup } = await import('@/lib/file-group-manager');
              updateGroup(currentProject.id, {
                wordpressDeployment: {
                  isDeployed: true,
                  livePageId: parseInt(result.pageId),
                  livePageSlug: result.pageSlug,
                  pluginSlug: result.pluginSlug,
                  deployedAt: Date.now(),
                  lastDeploymentType: 'live-page',
                },
              });
              fileGroups.refresh(); // Refresh file groups state
            }

            toast.success(result.message || 'Deployed to live page!');
          } catch (error: any) {
            toast.error(`Deployment failed: ${error.message}`);
          }
        } else {
          toast.error('WordPress Playground not ready or no PHP project selected');
        }
        return;
      }

      // Deploy to Elementor
      if (item === 'Deploy to Elementor') {
        // Call playground function to deploy widget to Elementor editor
        if (typeof window !== 'undefined' && (window as any).deployAndPreviewWidget && currentProject) {
          try {
            const result = await (window as any).deployAndPreviewWidget(currentProject.php, currentProject.css, currentProject.js, 'elementor-editor');

            // Save deployment metadata to FileGroup
            if (result.success && currentProject.id) {
              const { updateGroup } = await import('@/lib/file-group-manager');
              updateGroup(currentProject.id, {
                wordpressDeployment: {
                  isDeployed: true,
                  elementorPageId: parseInt(result.pageId),
                  elementorPageSlug: result.pageSlug,
                  livePageId: parseInt(result.pageId), // Same page, just different view
                  livePageSlug: result.pageSlug,
                  pluginSlug: result.pluginSlug,
                  deployedAt: Date.now(),
                  lastDeploymentType: 'elementor-editor',
                },
              });
              fileGroups.refresh(); // Refresh file groups state
            }

            toast.success(result.message || 'Deployed to Elementor editor!');
          } catch (error: any) {
            toast.error(`Deployment failed: ${error.message}`);
          }
        } else {
          toast.error('WordPress Playground not ready or no PHP project selected');
        }
        return;
      }

      // Update & View Live Page
      if (item === 'Update & View Live Page') {
        // Call playground function to update and view live page
        if (typeof window !== 'undefined' && (window as any).updateWidgetAndRefresh && currentProject) {
          (window as any).updateWidgetAndRefresh(
            currentProject.php,
            currentProject.css,
            currentProject.js,
            currentProject.wordpressDeployment?.pluginSlug,
            currentProject.wordpressDeployment?.livePageSlug,
            'live-page'
          );
          toast.success('Updating live page...');
        } else {
          toast.error('WordPress Playground not ready or widget not deployed');
        }
        return;
      }

      // Update & View Elementor
      if (item === 'Update & View Elementor') {
        // Call playground function to update and view Elementor editor
        if (typeof window !== 'undefined' && (window as any).updateWidgetAndRefresh && currentProject) {
          (window as any).updateWidgetAndRefresh(
            currentProject.php,
            currentProject.css,
            currentProject.js,
            currentProject.wordpressDeployment?.pluginSlug,
            currentProject.wordpressDeployment?.elementorPageSlug,
            'elementor-editor'
          );
          toast.success('Updating Elementor editor...');
        } else {
          toast.error('WordPress Playground not ready or widget not deployed');
        }
        return;
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
      } else if (item === 'StyleKit JSON Converter') {
        // Open StyleKit JSON Converter (same as 'PHP Converter')
        window.dispatchEvent(new CustomEvent('open-php-converter'));
      } else if (item === 'Page Extract') {
        // Open page extract dialog
        window.dispatchEvent(new CustomEvent('open-page-extract'));
      } else if (item === 'PHP Converter') {
        // Open PHP to JSON converter
        window.dispatchEvent(new CustomEvent('open-php-converter'));
      } else if (item === 'Advanced Editor') {
        // Open advanced style kit editor
        window.dispatchEvent(new CustomEvent('open-advanced-editor'));
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

  // Available tabs for split view selection
  const availableTabs = [
    { id: 'json', label: 'Code' },
    { id: 'sections', label: 'Project' },
    { id: 'playground', label: 'WordPress' },
    { id: 'style-guide', label: 'Style' },
    { id: 'usage', label: 'Usage' },
  ];

  // Navigation tabs configuration - dynamic based on current project type
  const navigationTabs: any[] = [
    {
      id: 'options',
      label: 'Options',
      icon: null,
      dropdownItems: [
        chatVisible ? 'Hide Chat' : 'Show Chat',
        'separator',
        splitViewEnabled ? 'Disable Split View' : 'Enable Split View',
        ...(splitViewEnabled ? [
          'Configure Split View',
        ] : []),
      ],
    },
    {
      id: 'code-editor',
      label: 'Code',
      icon: null,
      dropdownItems: [
        'Generate Code',
        'Preview HTML',
        'Preview HubL',
        'Split HTML',
      ],
    },
    {
      id: 'project-library',
      label: 'Project',
      icon: null,
      dropdownItems: ['Grid View', 'List View'],
    },
    {
      id: 'wordpress-playground',
      label: 'WordPress',
      icon: null,
      dropdownItems: [
        'Launch Playground',
        'Refresh Playground',
        'separator',
        'Deploy to Live Page',
        'Deploy to Elementor',
        'separator',
        hotReloadEnabled ? '⚡ Hot Reload: ON' : '⚡ Hot Reload: OFF',
      ],
    },
    {
      id: 'style-guide',
      label: 'Style',
      icon: null,
      dropdownItems: ['Advanced Editor', 'Brandfetch Import', 'StyleKit JSON Converter'],
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
      // If web search is enabled, use Perplexity Sonar behind the scenes (UI keeps showing selected model)
      let modelToUse = selectedModel;
      if (settings?.webSearchEnabled) {
        console.log('Web search enabled - using Perplexity Sonar (UI keeps showing', selectedModel, ')');
        modelToUse = 'perplexity/sonar';
        // Don't update UI selector - keep showing the user's selected model
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
          fetch: async (url, options) => {
            console.log('🌐 sendMessage fetch override - forcing to /api/chat-elementor');
            return fetch('/api/chat-elementor', options);
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

  // Helper function to render tab content
  const renderTabPanel = (tabId: string) => {
    switch (tabId) {
      case 'json':
        return (
          <HtmlSectionEditor
            key={loadedSection?.id || 'default'}
            initialSection={loadedSection || undefined}
            streamedHtml={streamedCode.html}
            streamedCss={streamedCode.css}
            streamedJs={streamedCode.js}
            activeCodeTab={activeCodeTab}
            onCodeTabChange={setActiveCodeTab}
            isTabVisible={true}
            onSendChatMessage={(message) => {
              sendMessage(
                { content: message, role: 'user' },
                { body: { currentSection: currentSection || null, model: selectedModel } }
              );
            }}
            onSectionChange={(section) => {
              // NO-OP: Section changes are now handled by HtmlSectionEditor directly updating file groups
              // This prevents race conditions where onSectionChange overwrites project selection
            }}
            onSwitchToVisualEditor={() => setActiveTab('visual')}
            onSwitchToPlayground={() => setActiveTab('playground')}
            chatVisible={chatVisible}
            setChatVisible={setChatVisible}
            tabBarVisible={tabBarVisible}
            setTabBarVisible={setTabBarVisible}
            hotReloadEnabled={hotReloadEnabled}
            currentProject={currentProject}
            fileGroups={fileGroups}
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
            onEditorReady={(refs) => {
              console.log('📝 Monaco editor refs received:', {
                html: !!refs.html,
                css: !!refs.css,
                js: !!refs.js,
                php: !!refs.php,
                hubl: !!refs.hubl,
              });
              setEditorRefs(refs);
            }}
          />
        );

      case 'sections':
        return (
          <ProjectLibrary
            isTabVisible={true}
            chatVisible={chatVisible}
            setChatVisible={setChatVisible}
            tabBarVisible={tabBarVisible}
            setTabBarVisible={setTabBarVisible}
            onOpenProject={(projectId) => {
              setActiveTab('json');
              window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId } }));
              // fileGroups.refresh() will be called when 'project-selection-complete' event fires
            }}
          />
        );

      case 'playground':
        return (
          <PlaygroundView
            json={currentJson}
            isActive={true}
            isTabVisible={true}
            chatVisible={chatVisible}
            setChatVisible={setChatVisible}
            tabBarVisible={tabBarVisible}
            setTabBarVisible={setTabBarVisible}
            onJsonUpdate={(updatedJson) => {
              setCurrentJson(updatedJson);
            }}
            onPlaygroundReady={() => {
              setPlaygroundReady(true);
            }}
          />
        );

      case 'style-guide':
        return (
          <StyleGuideUnified
            isTabVisible={true}
            chatVisible={chatVisible}
            setChatVisible={setChatVisible}
            tabBarVisible={tabBarVisible}
            setTabBarVisible={setTabBarVisible}
          />
        );

      case 'usage':
        return (
          <UsageTrackingTab
            chatVisible={chatVisible}
            setChatVisible={setChatVisible}
            tabBarVisible={tabBarVisible}
            setTabBarVisible={setTabBarVisible}
          />
        );

      default:
        return null;
    }
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
            defaultSplitPercent={40}
            leftPanel={
              <div
                ref={chatPanelRef}
                style={{
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
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
                      activeTab={(() => {
                        // Map internal activeTab to navigation tab ID
                        const reverseMap: Record<string, string> = {
                          'json': 'code-editor',
                          'sections': 'project-library',
                          'playground': 'wordpress-playground',
                          'site-content': 'site-content',
                          'style-guide': 'style-guide',
                          'usage': 'usage',
                        };
                        return reverseMap[activeTab] || activeTab;
                      })()}
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
                      containerWidth={chatPanelWidth}
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
                    isEditorReady={isEditorReady}
                    onStreamUpdate={(type, content) => {
                      setStreamedCode(prev => ({ ...prev, [type]: content }));
                    }}
                    onSwitchToSectionEditor={() => setActiveTab('json')}
                    onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
                    onSwitchTab={(tab) => setActiveTab(tab)}
                    onUpdateSection={(updates) => {
                      // Update file group directly instead of local state
                      if (currentSection?.id) {
                        if (updates.html !== undefined) fileGroups.updateGroupFile(currentSection.id, 'html', updates.html);
                        if (updates.css !== undefined) fileGroups.updateGroupFile(currentSection.id, 'css', updates.css);
                        if (updates.js !== undefined) fileGroups.updateGroupFile(currentSection.id, 'js', updates.js);
                        if (updates.php !== undefined) fileGroups.updateGroupFile(currentSection.id, 'php', updates.php);
                      }
                    }}
                    onProjectMetadataUpdate={(projectId, metadata) => {
                      // Handle plugin metadata updates (pluginMainFile, widgetFiles, etc.)
                      console.log('🔧 Metadata update requested:', projectId, Object.keys(metadata));

                      // If updating widgetFiles, merge with existing widgets (don't replace all)
                      if (metadata.widgetFiles) {
                        const currentGroup = fileGroups.groups.find(g => g.id === projectId);
                        if (currentGroup?.widgetFiles) {
                          metadata.widgetFiles = { ...currentGroup.widgetFiles, ...metadata.widgetFiles };
                          console.log('🔀 Merging widget files:', Object.keys(metadata.widgetFiles));
                        }
                      }

                      // Update metadata in state
                      fileGroups.updateGroup(projectId, metadata);
                      console.log('✅ Metadata saved to state');

                      // If updating pluginMainFile and it's the active group, update Monaco editor
                      if (projectId === fileGroups.activeGroupId && metadata.pluginMainFile) {
                        if (editorRefs.php) {
                          const model = editorRefs.php.getModel();
                          if (model) {
                            model.pushEditOperations([], [{
                              range: model.getFullModelRange(),
                              text: metadata.pluginMainFile
                            }], () => null);
                            console.log('✨ Updated Monaco editor with pluginMainFile');
                          }
                        }
                      }
                    }}
                    onProjectCreate={(name, type, generationState = 'ready') => {
                      // Create new project with generation state and return its ID
                      let newGroup;

                      if (type === 'php') {
                        // For Elementor plugins, use createNewPlugin to get proper structure
                        // Pass generationState directly to createPlugin
                        newGroup = fileGroups.createNewPlugin(name, '', generationState);
                        console.log('🔌 Plugin created via generateProject tool:', name, 'ID:', newGroup.id, 'State:', generationState);
                      } else {
                        // HTML/HubSpot projects use regular group
                        newGroup = fileGroups.createNewGroup(name, type, 'empty', generationState);
                        console.log('📦 Project created via generateProject tool:', name, 'Type:', type, 'ID:', newGroup.id, 'State:', generationState);
                      }

                      fileGroups.selectGroup(newGroup.id);
                      // Switch to Code Editor tab and appropriate file tab
                      setActiveTab('json');
                      setActiveCodeTab(type === 'php' ? 'php' : 'html');
                      return newGroup.id;
                    }}
                    onProjectStateUpdate={(projectId, state, error) => {
                      // Update project generation state
                      fileGroups.updateProjectState(projectId, state, error);
                      console.log('🔄 Project state updated:', projectId, 'State:', state, error ? `Error: ${error}` : '');
                    }}
                    onProjectUpdate={(projectId, file, content) => {
                      // Update project file with streaming content
                      fileGroups.updateGroupFile(projectId, file, content);

                      console.log(`📝 Streaming ${file} to project ${projectId} (${content.length} chars)`, {
                        projectId,
                        activeGroupId: fileGroups.activeGroupId,
                        isActiveProject: projectId === fileGroups.activeGroupId,
                      });

                      // ALSO update Monaco editor directly if this is the active project
                      // This bypasses React batching for smooth real-time streaming
                      if (projectId === fileGroups.activeGroupId) {
                        const editorRef = editorRefs[file as keyof typeof editorRefs];

                        console.log(`🔍 Editor ref check:`, {
                          file,
                          hasRef: !!editorRef,
                          allRefs: {
                            html: !!editorRefs.html,
                            css: !!editorRefs.css,
                            js: !!editorRefs.js,
                            php: !!editorRefs.php,
                            hubl: !!editorRefs.hubl,
                          }
                        });

                        if (editorRef) {
                          // Use pushEditOperations for better streaming performance (preserves undo stack, no full re-highlight)
                          const model = editorRef.getModel();
                          if (model) {
                            // Replace all content with new streamed content
                            const fullRange = model.getFullModelRange();
                            model.pushEditOperations(
                              [],
                              [{
                                range: fullRange,
                                text: content
                              }],
                              () => null
                            );
                            console.log(`✨ Direct Monaco update (pushEditOperations): ${file} (${content.length} chars)`);
                          } else {
                            // Fallback to setValue if model not available
                            editorRef.setValue(content);
                            console.log(`✨ Direct Monaco update (setValue fallback): ${file} (${content.length} chars)`);
                          }
                        } else {
                          // Fallback to Zustand if editor ref not available yet
                          editorContent.updateContent(file, content);
                          console.log(`⚠️ Monaco ref not ready, using Zustand: ${file}`);
                        }
                      } else {
                        console.log(`⚠️ SKIPPING Monaco update - project ${projectId} is NOT active (active: ${fileGroups.activeGroupId})`);
                      }
                    }}
                    currentSection={currentSection}
                    containerWidth={chatPanelWidth}
                    fileInclusions={fileInclusions}
                    onOpenFileInclusions={() => {
                      // Trigger event to open file inclusions modal in HtmlSectionEditor
                      window.dispatchEvent(new CustomEvent('open-file-inclusions-modal'));
                    }}
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
              {/* Tab Content - Split View or Regular View */}
              <div className="tab-content" style={{ flex: '1', overflow: 'hidden' }}>
                {splitViewEnabled ? (
                  // Split View Mode
                  <ResizableSplitPanel
                    topPanel={renderTabPanel(topPanelTab)}
                    bottomPanel={renderTabPanel(bottomPanelTab)}
                    initialSplitRatio={splitRatio}
                    onSplitRatioChange={setSplitRatio}
                  />
                ) : (
                  // Regular View Mode - Keep all tabs mounted, just hide inactive ones
                  <>
                <div className={`tab-panel ${activeTab === 'json' ? 'active' : ''}`} id="jsonPanel" style={{ display: activeTab === 'json' ? 'flex' : 'none', height: '100%', width: '100%', overflow: 'hidden', position: activeTab === 'json' ? 'relative' : 'absolute', visibility: activeTab === 'json' ? 'visible' : 'hidden' }}>
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
                  sendMessage(
                    { content: message, role: 'user' },
                    { body: { currentSection: currentSection || null, model: selectedModel } }
                  );
                }}
                onSectionChange={(section) => {
                  // NO-OP: Section changes are now handled by HtmlSectionEditor directly updating file groups
                  // This prevents race conditions where onSectionChange overwrites project selection
                  console.log('📝 page.tsx: onSectionChange called (no-op):', {
                    id: section.id,
                    name: section.name,
                    htmlLength: section.html?.length || 0,
                    cssLength: section.css?.length || 0,
                    jsLength: section.js?.length || 0,
                    phpLength: section.php?.length || 0
                  });
                }}
                onSwitchToVisualEditor={() => setActiveTab('visual')}
                onSwitchToPlayground={() => setActiveTab('playground')}
                chatVisible={chatVisible}
                setChatVisible={setChatVisible}
                tabBarVisible={tabBarVisible}
                setTabBarVisible={setTabBarVisible}
                hotReloadEnabled={hotReloadEnabled}
                currentProject={currentProject}
                fileGroups={fileGroups}
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
                fileInclusions={fileInclusions}
                onFileInclusionsChange={setFileInclusions}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'playground' ? 'active' : ''}`} id="playgroundPanel" style={{ display: activeTab === 'playground' ? 'flex' : 'none', height: '100%', width: '100%', overflow: 'hidden', position: activeTab === 'playground' ? 'relative' : 'absolute', visibility: activeTab === 'playground' ? 'visible' : 'hidden', pointerEvents: activeTab === 'playground' ? 'auto' : 'none' }}>
                  <PlaygroundView
                    json={currentJson}
                    isActive={true} // Always active so playground initializes immediately on page load
                    isTabVisible={true} // Always visible so playground can initialize
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

                <div className={`tab-panel ${activeTab === 'sections' ? 'active' : ''}`} id="sectionsPanel" style={{ display: activeTab === 'sections' ? 'flex' : 'none', height: '100%', width: '100%', overflow: 'hidden', position: activeTab === 'sections' ? 'relative' : 'absolute', visibility: activeTab === 'sections' ? 'visible' : 'hidden' }}>
                  <ProjectLibrary
                    isTabVisible={activeTab === 'sections'}
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    tabBarVisible={tabBarVisible}
                    setTabBarVisible={setTabBarVisible}
                    onOpenProject={(projectId) => {
                      console.log('📝 page.tsx: Opening project in editor:', {
                        projectId,
                        currentActiveId: fileGroups.activeGroupId,
                        timestamp: new Date().toISOString(),
                      });
                      // Switch to Code Editor tab
                      setActiveTab('json');
                      // Trigger project selection via custom event
                      console.log('📡 page.tsx: Dispatching select-project event for:', projectId);
                      window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId } }));
                      console.log('✅ page.tsx: Event dispatched');
                      // fileGroups.refresh() will be called when 'project-selection-complete' event fires
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

                <div className={`tab-panel ${activeTab === 'style-guide' ? 'active' : ''}`} id="styleGuidePanel" style={{ display: activeTab === 'style-guide' ? 'flex' : 'none', height: '100%', width: '100%', overflow: 'hidden', position: activeTab === 'style-guide' ? 'relative' : 'absolute', visibility: activeTab === 'style-guide' ? 'visible' : 'hidden' }}>
                  <StyleGuideUnified
                    isTabVisible={activeTab === 'style-guide'}
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    tabBarVisible={tabBarVisible}
                    setTabBarVisible={setTabBarVisible}
                  />
                </div>

                <div className={`tab-panel ${activeTab === 'usage' ? 'active' : ''}`} id="usagePanel" style={{ display: activeTab === 'usage' ? 'flex' : 'none', height: '100%', width: '100%', overflow: 'hidden', position: activeTab === 'usage' ? 'relative' : 'absolute', visibility: activeTab === 'usage' ? 'visible' : 'hidden' }}>
                  <UsageTrackingTab
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    tabBarVisible={tabBarVisible}
                    setTabBarVisible={setTabBarVisible}
                  />
                </div>
                  </>
                )}
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
              activeTab={(() => {
                const reverseMap: Record<string, string> = {
                  'json': 'code-editor',
                  'sections': 'project-library',
                  'playground': 'wordpress-playground',
                  'site-content': 'site-content',
                  'style-guide': 'style-guide',
                  'usage': 'usage',
                };
                return reverseMap[activeTab] || activeTab;
              })()}
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
              {/* Tab panels - Split View or Regular View */}
              {splitViewEnabled ? (
                // Split View Mode
                <ResizableSplitPanel
                  topPanel={renderTabPanel(topPanelTab)}
                  bottomPanel={renderTabPanel(bottomPanelTab)}
                  initialSplitRatio={splitRatio}
                  onSplitRatioChange={setSplitRatio}
                />
              ) : (
                // Regular View Mode
                <>
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
                    sendMessage(
                      { content: message, role: 'user' },
                      { body: { currentSection: currentSection || null, model: selectedModel } }
                    );
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
                  hotReloadEnabled={hotReloadEnabled}
                  currentProject={currentProject}
                  fileGroups={fileGroups}
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

              <div className={`tab-panel ${activeTab === 'playground' ? 'active' : ''}`} id="playgroundPanel" style={{ display: activeTab === 'playground' ? 'flex' : 'none' }}>
                <PlaygroundView
                  json={currentJson}
                  isActive={true} // Always active so playground initializes immediately on page load
                  isTabVisible={true} // Always visible so playground can initialize
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
                    // fileGroups.refresh() will be called when 'project-selection-complete' event fires
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
                </>
              )}
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
                activeTab={(() => {
                  const reverseMap: Record<string, string> = {
                    'json': 'code-editor',
                    'sections': 'project-library',
                    'playground': 'wordpress-playground',
                    'site-content': 'site-content',
                    'style-guide': 'style-guide',
                    'usage': 'usage',
                  };
                  return reverseMap[activeTab] || activeTab;
                })()}
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
                dimmed={chatDrawerOpen}
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
                    onEditorReadyStateChange={setEditorsReady}
                    onSendChatMessage={(message) => {
                      sendMessage(
                        { content: message, role: 'user' },
                        { body: { currentSection: currentSection || null, model: selectedModel } }
                      );
                    }}
                    onSectionChange={(section) => {
                      // NO-OP: Section changes are now handled by HtmlSectionEditor directly updating file groups
                      // This prevents race conditions where onSectionChange overwrites project selection
                    }}
                    onSwitchToVisualEditor={() => setActiveTab('visual')}
                    onSwitchToPlayground={() => setActiveTab('playground')}
                    chatVisible={false}
                    setChatVisible={setChatVisible}
                    tabBarVisible={false}
                    setTabBarVisible={() => {}}
                    hotReloadEnabled={hotReloadEnabled}
                    currentProject={currentProject}
                    fileGroups={fileGroups}
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
                    isActive={true} // Always active so playground initializes immediately on page load
                    isTabVisible={true} // Always visible so playground can initialize
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
                      // fileGroups.refresh() will be called when 'project-selection-complete' event fires
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
                  zIndex: 9999, // Below chat drawer, above everything else
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
                zIndex: 10000, // Highest z-index on the page
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
                    isEditorReady={isEditorReady}
                    onStreamUpdate={(type, content) => {
                      setStreamedCode(prev => ({ ...prev, [type]: content }));
                    }}
                    onSwitchToSectionEditor={() => setActiveTab('json')}
                    onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
                    onSwitchTab={(tab) => setActiveTab(tab)}
                    onUpdateSection={(updates) => {
                      // Update file group directly instead of local state
                      if (currentSection?.id) {
                        if (updates.html !== undefined) fileGroups.updateGroupFile(currentSection.id, 'html', updates.html);
                        if (updates.css !== undefined) fileGroups.updateGroupFile(currentSection.id, 'css', updates.css);
                        if (updates.js !== undefined) fileGroups.updateGroupFile(currentSection.id, 'js', updates.js);
                        if (updates.php !== undefined) fileGroups.updateGroupFile(currentSection.id, 'php', updates.php);
                      }
                    }}
                    onProjectMetadataUpdate={(projectId, metadata) => {
                      // Handle plugin metadata updates (pluginMainFile, widgetFiles, etc.)
                      console.log('🔧 Metadata update requested (mobile):', projectId, Object.keys(metadata));

                      // If updating widgetFiles, merge with existing widgets (don't replace all)
                      if (metadata.widgetFiles) {
                        const currentGroup = fileGroups.groups.find(g => g.id === projectId);
                        if (currentGroup?.widgetFiles) {
                          metadata.widgetFiles = { ...currentGroup.widgetFiles, ...metadata.widgetFiles };
                          console.log('🔀 Merging widget files (mobile):', Object.keys(metadata.widgetFiles));
                        }
                      }

                      // Update metadata in state
                      fileGroups.updateGroup(projectId, metadata);
                      console.log('✅ Metadata saved to state (mobile)');

                      // If updating pluginMainFile and it's the active group, update Monaco editor
                      if (projectId === fileGroups.activeGroupId && metadata.pluginMainFile) {
                        if (editorRefs.php) {
                          const model = editorRefs.php.getModel();
                          if (model) {
                            model.pushEditOperations([], [{
                              range: model.getFullModelRange(),
                              text: metadata.pluginMainFile
                            }], () => null);
                            console.log('✨ Updated Monaco editor with pluginMainFile (mobile)');
                          }
                        }
                      }
                    }}
                    onProjectCreate={(name, type, generationState = 'ready') => {
                      // Create new project with generation state and return its ID
                      let newGroup;

                      if (type === 'php') {
                        // For Elementor plugins, use createNewPlugin to get proper structure
                        // Pass generationState directly to createPlugin
                        newGroup = fileGroups.createNewPlugin(name, '', generationState);
                        console.log('🔌 Plugin created via generateProject tool:', name, 'ID:', newGroup.id, 'State:', generationState);
                      } else {
                        // HTML/HubSpot projects use regular group
                        newGroup = fileGroups.createNewGroup(name, type, 'empty', generationState);
                        console.log('📦 Project created via generateProject tool:', name, 'Type:', type, 'ID:', newGroup.id, 'State:', generationState);
                      }

                      fileGroups.selectGroup(newGroup.id);
                      // Switch to Code Editor tab and appropriate file tab
                      setActiveTab('json');
                      setActiveCodeTab(type === 'php' ? 'php' : 'html');
                      return newGroup.id;
                    }}
                    onProjectStateUpdate={(projectId, state, error) => {
                      // Update project generation state
                      fileGroups.updateProjectState(projectId, state, error);
                      console.log('🔄 Project state updated:', projectId, 'State:', state, error ? `Error: ${error}` : '');
                    }}
                    onProjectUpdate={(projectId, file, content) => {
                      // Update project file with streaming content
                      fileGroups.updateGroupFile(projectId, file, content);

                      console.log(`📝 Streaming ${file} to project ${projectId} (${content.length} chars)`, {
                        projectId,
                        activeGroupId: fileGroups.activeGroupId,
                        isActiveProject: projectId === fileGroups.activeGroupId,
                      });

                      // ALSO update Monaco editor directly if this is the active project
                      // This bypasses React batching for smooth real-time streaming
                      if (projectId === fileGroups.activeGroupId) {
                        const editorRef = editorRefs[file as keyof typeof editorRefs];

                        console.log(`🔍 Editor ref check:`, {
                          file,
                          hasRef: !!editorRef,
                          allRefs: {
                            html: !!editorRefs.html,
                            css: !!editorRefs.css,
                            js: !!editorRefs.js,
                            php: !!editorRefs.php,
                            hubl: !!editorRefs.hubl,
                          }
                        });

                        if (editorRef) {
                          // Use pushEditOperations for better streaming performance (preserves undo stack, no full re-highlight)
                          const model = editorRef.getModel();
                          if (model) {
                            // Replace all content with new streamed content
                            const fullRange = model.getFullModelRange();
                            model.pushEditOperations(
                              [],
                              [{
                                range: fullRange,
                                text: content
                              }],
                              () => null
                            );
                            console.log(`✨ Direct Monaco update (pushEditOperations): ${file} (${content.length} chars)`);
                          } else {
                            // Fallback to setValue if model not available
                            editorRef.setValue(content);
                            console.log(`✨ Direct Monaco update (setValue fallback): ${file} (${content.length} chars)`);
                          }
                        } else {
                          // Fallback to Zustand if editor ref not available yet
                          editorContent.updateContent(file, content);
                          console.log(`⚠️ Monaco ref not ready, using Zustand: ${file}`);
                        }
                      } else {
                        console.log(`⚠️ SKIPPING Monaco update - project ${projectId} is NOT active (active: ${fileGroups.activeGroupId})`);
                      }
                    }}
                    currentSection={currentSection}
                    containerWidth={chatPanelWidth}
                    fileInclusions={fileInclusions}
                    onOpenFileInclusions={() => {
                      // Trigger event to open file inclusions modal in HtmlSectionEditor
                      window.dispatchEvent(new CustomEvent('open-file-inclusions-modal'));
                    }}
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
          // Legacy callback for after generation completes
          // Set streamed code to trigger display in editor
          setStreamedCode({
            html: code.html || '',
            css: code.css || '',
            js: code.js || '',
          });
          // Switch to code editor tab if project already exists
          if (currentSection?.id) {
            setActiveTab('json');
          }
          setGenerateDialogOpen(false);
        }}
        onProjectCreate={(name, type, generationState = 'ready') => {
          // Create new project with generation state and return its ID
          // Use same logic as chat tool for consistency
          let newGroup;

          if (type === 'php') {
            // For Elementor plugins, use createNewPlugin to get proper structure
            // Pass generationState directly to createPlugin
            newGroup = fileGroups.createNewPlugin(name, '', generationState);
            console.log('🔌 Plugin created via modal:', name, 'ID:', newGroup.id, 'State:', generationState);
          } else {
            // HTML/HubSpot projects use regular group
            newGroup = fileGroups.createNewGroup(name, type, 'empty', generationState);
            console.log('📦 Project created via modal:', name, 'Type:', type, 'ID:', newGroup.id, 'State:', generationState);
          }

          fileGroups.selectGroup(newGroup.id);
          // Switch to Code Editor tab and appropriate file tab
          setActiveTab('json');
          setActiveCodeTab(type === 'php' ? 'php' : 'html');
          return newGroup.id;
        }}
        onProjectMetadataUpdate={(projectId, metadata) => {
          // Handle plugin metadata updates (pluginMainFile, widgetFiles, etc.)
          console.log('🔧 Metadata update requested (modal):', projectId, Object.keys(metadata));

          // If updating widgetFiles, merge with existing widgets (don't replace all)
          if (metadata.widgetFiles) {
            const currentGroup = fileGroups.groups.find(g => g.id === projectId);
            if (currentGroup?.widgetFiles) {
              metadata.widgetFiles = { ...currentGroup.widgetFiles, ...metadata.widgetFiles };
              console.log('🔀 Merging widget files (modal):', Object.keys(metadata.widgetFiles));
            }
          }

          // Update metadata in state
          fileGroups.updateGroup(projectId, metadata);
          console.log('✅ Metadata saved to state (modal)');

          // If updating pluginMainFile and it's the active group, update Monaco editor
          if (projectId === fileGroups.activeGroupId && metadata.pluginMainFile) {
            if (editorRefs.php) {
              const model = editorRefs.php.getModel();
              if (model) {
                model.pushEditOperations([], [{
                  range: model.getFullModelRange(),
                  text: metadata.pluginMainFile
                }], () => null);
                console.log('✨ Updated Monaco editor with pluginMainFile (modal)');
              }
            }
          }
        }}
        onProjectStateUpdate={(projectId, state, error) => {
          // Update project generation state
          fileGroups.updateProjectState(projectId, state, error);
          console.log('🔄 Project state updated (modal):', projectId, 'State:', state, error ? `Error: ${error}` : '');
        }}
        onProjectUpdate={(projectId, file, content) => {
          // Update project file with streaming content (same logic as chat tool)
          fileGroups.updateGroupFile(projectId, file, content);

          // ALSO update Monaco editor directly if this is the active project
          // This bypasses React batching for smooth real-time streaming
          if (projectId === fileGroups.activeGroupId) {
            const editorRef = editorRefs[file as keyof typeof editorRefs];

            console.log(`🔍 Editor ref check (modal):`, {
              file,
              hasRef: !!editorRef,
              projectId,
              activeGroupId: fileGroups.activeGroupId,
              isActive: projectId === fileGroups.activeGroupId,
              allRefs: {
                html: !!editorRefs.html,
                css: !!editorRefs.css,
                js: !!editorRefs.js,
                php: !!editorRefs.php,
                hubl: !!editorRefs.hubl,
              }
            });

            if (editorRef) {
              // Direct Monaco update - instant, no batching
              editorRef.setValue(content);
              console.log(`✨ Direct Monaco update (modal): ${file} (${content.length} chars)`);
            } else {
              // Fallback to Zustand if editor ref not available yet
              editorContent.updateContent(file, content);
              console.log(`⚠️ Monaco ref not ready (modal), using Zustand: ${file}`);
            }
          }

          console.log(`📝 Streaming ${file} to project ${projectId} (${content.length} chars) [modal]`);
        }}
        onSwitchCodeTab={(tab) => setActiveCodeTab(tab)}
        onSwitchTab={(tab) => setActiveTab(tab)}
        isEditorReady={isEditorReady}
        defaultModel={selectedModel}
      />

      {/* Split View Configuration Modal */}
      <Dialog open={splitViewConfigOpen} onOpenChange={setSplitViewConfigOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Split View</DialogTitle>
            <DialogDescription>
              Select which panels to display in the top and bottom sections. Both panels cannot show the same content.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Top Panel Selection */}
            <div className="grid gap-3">
              <Label htmlFor="top-panel" className="text-base font-semibold">
                Top Panel
              </Label>
              <select
                id="top-panel"
                value={topPanelTab}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // If user selects what's currently in bottom panel, swap them
                  if (newValue === bottomPanelTab) {
                    setBottomPanelTab(topPanelTab);
                  }
                  setTopPanelTab(newValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {availableTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bottom Panel Selection */}
            <div className="grid gap-3">
              <Label htmlFor="bottom-panel" className="text-base font-semibold">
                Bottom Panel
              </Label>
              <select
                id="bottom-panel"
                value={bottomPanelTab}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // If user selects what's currently in top panel, swap them
                  if (newValue === topPanelTab) {
                    setTopPanelTab(bottomPanelTab);
                  }
                  setBottomPanelTab(newValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {availableTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSplitViewConfigOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSplitViewConfigOpen(false);
                toast.success('Split view configuration updated');
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
      </>
    </GlobalStylesheetProvider>
  );
}
