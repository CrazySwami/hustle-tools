'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { useDocumentContent } from '@/hooks/useDocumentContent';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { Comment } from '@/components/editor/CommentExtension';
import { DocumentChat } from '@/components/editor/DocumentChat';
import { BottomNav } from '@/components/ui/BottomNav';
import { useDocuments, useProjects, useFolders } from '@/hooks/useProjectHierarchy';
import TurndownService from 'turndown';
import { generateDocSystemPrompt } from '@/lib/generate-doc-system-prompt';
import { AppSidebar } from '@/components/app-sidebar';
import { TwoPanelChatLayout } from '@/components/layouts/TwoPanelChatLayout';
import { NavigationBar } from '@/components/ai-elements/inner-navigation-bar';
import { CreateItemModal } from '@/components/modals/CreateItemModal';


const ChatBotDemo = () => {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [isMobile, setIsMobile] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(true); // Open by default on desktop
  const [comments, setComments] = useState<Comment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Project sidebar visibility (overlay on editor)

  // Modal state for creating documents/folders
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'document' | 'folder'>('document');

  // Track comments/tools panel state (for dynamic dropdown items)
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'comments' | 'tools'>('comments');

  // Document content management - SINGLE source of truth
  const documentContentStore = useDocumentContent();
  const documentContent = documentContentStore.content; // Read directly from store

  // Get documents, projects, and folders hooks
  const { documents, updateDocument, createDocument } = useDocuments();
  const { projects, createProject } = useProjects();
  const { createFolder } = useFolders();

  const { messages, sendMessage, isLoading, reload, status, error } = useChat({
    api: '/api/chat-doc', // 🎯 Specialized endpoint for document editing
  });

  // Detect mobile on mount and close editor on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close editor on mobile (mobile uses full-screen editor with drawer)
      if (mobile) {
        setIsEditorVisible(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close chat drawer on mobile when assistant responds (applies edits)
  useEffect(() => {
    if (isMobile && chatDrawerOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Close drawer when assistant sends a new message
      if (lastMessage.role === 'assistant') {
        const autoClose = localStorage.getItem('doc-auto-close-chat');
        if (autoClose === null || autoClose === 'true') {
          setChatDrawerOpen(false);
        }
      }
    }
  }, [messages, isMobile, chatDrawerOpen]);

  // Listen for document edit acceptance and auto-close chat on mobile
  useEffect(() => {
    const handleDocEditAccepted = () => {
      if (isMobile && chatDrawerOpen) {
        const autoClose = localStorage.getItem('doc-auto-close-chat');
        if (autoClose === null || autoClose === 'true') {
          setChatDrawerOpen(false);
        }
      }
    };

    window.addEventListener('doc-edit-accepted', handleDocEditAccepted);
    return () => window.removeEventListener('doc-edit-accepted', handleDocEditAccepted);
  }, [isMobile, chatDrawerOpen]);

  // Listen for panel state changes from TiptapEditor
  useEffect(() => {
    const handlePanelStateChange = (event: CustomEvent) => {
      const { open, tab } = event.detail;
      setIsPanelOpen(open);
      if (tab) {
        setPanelTab(tab);
      }
    };

    window.addEventListener('doc-panel-state', handlePanelStateChange as EventListener);
    return () => window.removeEventListener('doc-panel-state', handlePanelStateChange as EventListener);
  }, []);

  // Check for exported content from Blog Builder on mount
  useEffect(() => {
    const newDocContent = localStorage.getItem('newDocContent');
    const newDocTitle = localStorage.getItem('newDocTitle');

    if (newDocContent && newDocTitle) {
      console.log('📥 [IMPORT] Found exported content from Blog Builder');

      // Create or get "Blog Posts" project
      const blogProject = projects.find(p => p.name === 'Blog Posts') || createProject('Blog Posts');

      // Create new document with the exported content
      const newDoc = createDocument(newDocTitle, blogProject.id);

      // Set the content immediately
      updateDocument(newDoc.id, { content: newDocContent });

      // Select the new document
      setSelectedDocumentId(newDoc.id);

      // Clear localStorage
      localStorage.removeItem('newDocContent');
      localStorage.removeItem('newDocTitle');

      console.log('✅ [IMPORT] Created new document:', newDocTitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Ensure there's always a document and auto-select one on mount
  useEffect(() => {
    // If no documents exist, create a default project and document
    if (documents.length === 0) {
      console.log('📝 [INIT] No documents found, creating default project and document');
      const defaultProject = createProject('My Documents');
      const defaultDoc = createDocument('Untitled', defaultProject.id);
      setSelectedDocumentId(defaultDoc.id);
      return;
    }

    // If documents exist but none selected, auto-select the most recently updated
    if (!selectedDocumentId && documents.length > 0) {
      console.log('📝 [INIT] Auto-selecting most recently updated document');
      const sortedDocs = [...documents].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setSelectedDocumentId(sortedDocs[0].id);
    }
  }, [documents, selectedDocumentId, createProject, createDocument]);

  // Load selected document into editor when switching documents
  useEffect(() => {
    if (!selectedDocumentId) return;

    const doc = documents.find(d => d.id === selectedDocumentId);
    if (!doc) return;

    console.log('📂 [LOAD] Loading document:', doc.title);
    // Load the document content into the editor
    documentContentStore.updateContent(doc.content, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocumentId]); // Only trigger when selectedDocumentId changes

  // Auto-save to selected document when content changes
  useEffect(() => {
    if (!selectedDocumentId || !documentContent) return;

    const doc = documents.find(d => d.id === selectedDocumentId);
    if (!doc) return;

    // Only save if content actually changed
    if (doc.content === documentContent) return;

    console.log('💾 [AUTO-SAVE] Debouncing save...');
    const timeoutId = setTimeout(() => {
      console.log('💾 [AUTO-SAVE] Saving to document');
      updateDocument(selectedDocumentId, { content: documentContent });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [documentContent, selectedDocumentId, documents, updateDocument]);

  // Handle message sending from DocumentChat
  const handleSendMessage = async (text: string, settings?: { webSearchEnabled: boolean; includeContext?: boolean; imageFile?: File }) => {
    // Get latest document content from store (HTML format)
    const htmlContent = documentContentStore.getContent();

    // Convert HTML to markdown for AI context
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    const latestDocContent = turndownService.turndown(htmlContent);

    // If web search is enabled but not using a Perplexity model, switch to Perplexity Sonar
    let modelToUse = selectedModel;
    if (settings?.webSearchEnabled && !selectedModel.startsWith('perplexity/')) {
      console.log('Switching to Perplexity model for web search');
      modelToUse = 'perplexity/sonar';
      setSelectedModel(modelToUse); // Update the UI model selector
    }

    // Convert image to data URL if present
    let imagePart = null;
    if (settings?.imageFile) {
      const reader = new FileReader();
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(settings.imageFile!);
      });

      imagePart = {
        type: 'file' as const,
        mediaType: settings.imageFile.type,
        url: imageDataUrl,
      };
    }

    console.log('📄 Sending document chat request:', {
      model: modelToUse,
      documentLength: latestDocContent.length,
      webSearch: settings?.webSearchEnabled,
      includeContext: settings?.includeContext !== false, // Default to true
      hasImage: !!imagePart,
      documentTitle: currentDocument?.title,
      projectName: currentProject?.name,
    });

    // Send message with parts (text + optional image)
    const parts: any[] = [{ type: 'text', text }];
    if (imagePart) {
      parts.push(imagePart);
    }

    sendMessage(
      { role: 'user', parts },
      {
        body: {
          model: modelToUse,
          webSearch: settings?.webSearchEnabled || false,
          includeContext: settings?.includeContext !== false, // Default to true
          documentContent: latestDocContent, // 📦 Pass document to API
          comments,
          documentTitle: currentDocument?.title || '',
          projectName: currentProject?.name || '',
        },
      },
    );
  };

  const handleToggleEditor = () => {
    setIsEditorVisible(!isEditorVisible);
  };

  // Handle AI edit from bubble menu
  const handleAIEdit = (selectedText: string, instruction: string, enableWebSearch?: boolean) => {
    let message = '';

    // Parse action type from instruction
    if (instruction.startsWith('[ACTION:RESEARCH]')) {
      const context = instruction.replace('[ACTION:RESEARCH]', '').split('\n\n')[0].trim();
      message = context
        ? `${context}\n\nPlease research this text: "${selectedText}"`
        : `Please research the following text and provide accurate, up-to-date information:\n\n"${selectedText}"`;

      // Enable web search for research action (uses current model with web search capabilities)
      setWebSearchEnabled(true);
    } else if (instruction.startsWith('[ACTION:EDIT]')) {
      const context = instruction.replace('[ACTION:EDIT]', '').split('\n\n')[0].trim();
      message = `🎯 TARGETED EDIT REQUEST

**Selected text to edit:**
"${selectedText}"

**Instruction:** ${context || 'Edit the selected text'}

**CRITICAL REQUIREMENTS:**
1. Use editDocumentWithMorph tool
2. In the lazyEdit, ONLY include the selected text portion with your changes
3. Use "... existing text ..." markers for everything BEFORE and AFTER the selected portion
4. Do NOT include any unchanged parts of the document in your edit
5. The edit should replace ONLY the selected text, nothing else

**Example format:**
If the document is "Intro paragraph. [SELECTED TEXT]. Closing paragraph."
Your lazyEdit should be: "... existing text ...\n[YOUR EDITED VERSION OF SELECTED TEXT]\n... existing text ..."`;
    } else if (instruction.startsWith('[ACTION:QUESTION]')) {
      const context = instruction.replace('[ACTION:QUESTION]', '').split('\n\n')[0].trim();
      message = context
        ? `${context}\n\nRegarding this text: "${selectedText}"`
        : `I have a question about this text: "${selectedText}"`;
    } else {
      // Fallback to original format for backwards compatibility
      message = `🎯 TARGETED EDIT REQUEST

**Selected text to edit:**
"${selectedText}"

**Instruction:** ${instruction}

**CRITICAL REQUIREMENTS:**
1. Use editDocumentWithMorph tool
2. In the lazyEdit, ONLY include the selected text portion with your changes
3. Use "... existing text ..." markers for everything BEFORE and AFTER the selected portion
4. Do NOT include any unchanged parts of the document in your edit
5. The edit should replace ONLY the selected text, nothing else

**Example format:**
If the document is "Intro paragraph. [SELECTED TEXT]. Closing paragraph."
Your lazyEdit should be: "... existing text ...\n[YOUR EDITED VERSION OF SELECTED TEXT]\n... existing text ..."`;
    }

    handleSendMessage(message, { webSearchEnabled: enableWebSearch || false });
  };

  // Get current document info for context badge
  const currentDocument = selectedDocumentId
    ? documents.find(d => d.id === selectedDocumentId)
    : null;

  const currentProject = currentDocument
    ? projects.find(p => p.id === currentDocument.projectId)
    : null;

  // Calculate word count for current document
  const wordCount = documentContent
    ? documentContent.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length
    : 0;

  // Track context inclusion state (default: true)
  const [includeContext, setIncludeContext] = useState(true);

  // Convert HTML to markdown for system prompt
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  const markdownContent = documentContent ? turndownService.turndown(documentContent) : '';

  // Debug: Log document content state
  useEffect(() => {
    console.log('📊 Document State:', {
      documentContentLength: documentContent?.length || 0,
      documentContentPreview: documentContent?.substring(0, 200) || '(empty)',
      wordCount,
      markdownLength: markdownContent?.length || 0,
      markdownPreview: markdownContent?.substring(0, 200) || '(empty)',
    });
  }, [documentContent, wordCount, markdownContent]);

  // Generate actual system prompt (same as API uses) for accurate token counting
  const actualSystemPrompt = generateDocSystemPrompt({
    includeContext,
    documentContent: markdownContent,
    documentTitle: currentDocument?.title || '',
    projectName: currentProject?.name || '',
  });

  // Navigation dropdown handler
  const handleNavigationDropdownClick = (tabId: string, item: string) => {
    // Options tab actions
    if (tabId === 'options') {
      if (item === 'Hide Chat' || item === 'Show Chat') {
        setIsEditorVisible(!isEditorVisible);
      }
      // Future: Add more general options here
      return;
    }

    // Documents tab actions
    if (tabId === 'documents') {
      // Handle Open/Close
      if (item === 'Open' || item === 'Close') {
        if (isMobile) {
          // On mobile, control the overlay sidebar directly
          setIsSidebarVisible(item === 'Open');
        } else {
          // On desktop, programmatically click TiptapEditor's sidebar toggle button
          const sidebarToggle = document.querySelector('[data-sidebar-toggle]') as HTMLButtonElement;
          if (sidebarToggle) {
            sidebarToggle.click();
          }
        }
        return;
      }

      // For document/folder creation, open modal AND ensure sidebar visibility
      if (item === 'New Document') {
        setCreateModalType('document');
        setCreateModalOpen(true);
        // On mobile, ensure sidebar is visible
        if (isMobile && !isSidebarVisible) {
          setIsSidebarVisible(true);
        }
      } else if (item === 'New Folder') {
        setCreateModalType('folder');
        setCreateModalOpen(true);
        // On mobile, ensure sidebar is visible
        if (isMobile && !isSidebarVisible) {
          setIsSidebarVisible(true);
        }
      }
      return;
    }

    // Comments tab actions
    if (tabId === 'comments') {
      // Handle Open/Close
      if (item === 'Open') {
        window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'comments', open: true } }));
        return;
      } else if (item === 'Close') {
        window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'comments', open: false } }));
        return;
      }

      // Ensure panel is open for filter actions
      window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'comments', open: true } }));

      // Handle the filter action
      if (item === 'Show All') {
        window.dispatchEvent(new CustomEvent('doc-comments-filter', { detail: 'all' }));
      } else if (item === 'Show Active') {
        window.dispatchEvent(new CustomEvent('doc-comments-filter', { detail: 'active' }));
      } else if (item === 'Show Resolved') {
        window.dispatchEvent(new CustomEvent('doc-comments-filter', { detail: 'resolved' }));
      }
      return;
    }

    // Tools tab actions
    if (tabId === 'tools') {
      // Handle Open/Close
      if (item === 'Open') {
        window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'tools', open: true } }));
        return;
      } else if (item === 'Close') {
        window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'tools', open: false } }));
        return;
      }

      // Ensure panel is open for tool actions
      window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'tools', open: true } }));

      // Map display names to tool IDs
      const toolMap: Record<string, string> = {
        'Text Statistics': 'stats',
        'Find Text': 'find',
        'Readability': 'readability',
        'Document Outline': 'headings',
        'Find & Replace': 'replace',
        'Table of Contents': 'toc',
        'Find Duplicates': 'duplicates',
      };

      const toolId = toolMap[item];
      if (toolId) {
        window.dispatchEvent(new CustomEvent('doc-open-tool', { detail: toolId }));
      }
      return;
    }
  };

  // Handle tab change - toggle panels for Comments and Tools
  const handleTabChange = (tabId: string) => {
    if (tabId === 'documents') {
      // Toggle documents sidebar
      setIsSidebarVisible(!isSidebarVisible);
    } else if (tabId === 'comments') {
      // Open comments panel (or close if already open)
      window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'comments', open: true } }));
    } else if (tabId === 'tools') {
      // Open tools panel (or close if already open)
      window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'tools', open: true } }));
    }
  };

  // Handle modal confirmation for creating documents/folders
  const handleCreateItemConfirm = (name: string) => {
    // Get the first project, or create one if none exists
    let projectId = projects[0]?.id;
    if (!projectId) {
      const defaultProject = createProject('My Documents');
      projectId = defaultProject.id;
    }

    if (createModalType === 'document') {
      const newDoc = createDocument(name, projectId);
      setSelectedDocumentId(newDoc.id);
    } else if (createModalType === 'folder') {
      createFolder(name, projectId);
    }

    // Ensure sidebar is open after creating document/folder
    if (isMobile) {
      setIsSidebarVisible(true);
    } else {
      // On desktop, programmatically click the sidebar toggle if it's closed
      const sidebarToggle = document.querySelector('[data-sidebar-toggle]') as HTMLButtonElement;
      if (sidebarToggle && !sidebarToggle.getAttribute('aria-pressed')) {
        sidebarToggle.click();
      }
    }
  };

  // Navigation tabs configuration - Options, Documents, Comments, Tools as separate tabs
  const navigationTabs: any[] = [
    {
      id: 'options',
      label: 'Options',
      icon: null,
      dropdownItems: [isEditorVisible ? 'Hide Chat' : 'Show Chat'],
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: null,
      dropdownItems: [
        isSidebarVisible ? 'Close' : 'Open',
        'New Document',
        'New Folder'
      ],
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: null,
      dropdownItems: [
        (isPanelOpen && panelTab === 'comments') ? 'Close' : 'Open',
        'Show All',
        'Show Active',
        'Show Resolved'
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: null,
      dropdownItems: [
        (isPanelOpen && panelTab === 'tools') ? 'Close' : 'Open',
        'Text Statistics',
        'Find Text',
        'Readability',
        'Document Outline',
        'Find & Replace',
        'Table of Contents',
        'Find Duplicates'
      ],
    }
  ];

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-x-hidden" style={{
      paddingTop: isMobile ? '52px' : '0', // Space for fixed nav on mobile
    }}>
      {/* Mobile: Fixed navigation bar at top */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 4000,
          background: 'var(--background)'
        }}>
          <NavigationBar
            tabs={navigationTabs}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleNavigationDropdownClick}
            showOnDesktop={false}
            showOnMobile={true}
            hideLogoOnDesktop={true}
          />
        </div>
      )}

      {/* Main content wrapper */}
      <div className={`flex flex-1 h-full w-full ${isMobile ? 'px-2' : ''} gap-0 overflow-hidden`}>
        {/* Desktop: Two-panel layout using TwoPanelChatLayout */}
        {!isMobile && isEditorVisible && (
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
                      onTabChange={handleTabChange}
                      onDropdownItemClick={handleNavigationDropdownClick}
                      logoMenuItems={['Toggle Theme']}
                      onLogoMenuItemClick={(item) => {
                        // Theme toggle is handled automatically by inner-navigation-bar
                      }}
                      showOnDesktop={true}
                      showOnMobile={true}
                      hideLogoOnDesktop={false}
                    />
                  </div>
                  <DocumentChat
                    messages={messages}
                    isLoading={isLoading}
                    status={status}
                    error={error}
                    onSendMessage={handleSendMessage}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    onReload={reload}
                    isEditorVisible={isEditorVisible}
                    onToggleEditor={handleToggleEditor}
                    webSearchEnabled={webSearchEnabled}
                    onWebSearchChange={setWebSearchEnabled}
                    currentDocument={currentDocument}
                    currentProject={currentProject}
                    wordCount={wordCount}
                    systemPrompt={actualSystemPrompt}
                    documentContent={documentContent}
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
                  <TiptapEditor
                    initialContent={documentContent}
                    onContentChange={(html) => {
                      console.log('📝 [EDITOR] Content changed, updating store (skipEditorUpdate=true)');
                      documentContentStore.updateContent(html, true); // true = skip editor update
                    }}
                    onCommentsChange={setComments}
                    onAIEdit={handleAIEdit}
                    selectedModel={selectedModel}
                    selectedDocumentId={selectedDocumentId}
                    onDocumentSelect={setSelectedDocumentId}
                  />
                </div>
              </div>
            }
          />
        )}

        {/* Desktop: Chat-only view when editor hidden */}
        {!isMobile && !isEditorVisible && (
          <div className="flex flex-col h-full w-full">
            <DocumentChat
              messages={messages}
              isLoading={isLoading}
              status={status}
              error={error}
              onSendMessage={handleSendMessage}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onReload={reload}
              isEditorVisible={isEditorVisible}
              onToggleEditor={handleToggleEditor}
              webSearchEnabled={webSearchEnabled}
              onWebSearchChange={setWebSearchEnabled}
              currentDocument={currentDocument}
              currentProject={currentProject}
              wordCount={wordCount}
              systemPrompt={actualSystemPrompt}
              documentContent={documentContent}
            />
          </div>
        )}

      {/* Mobile: Full-screen editor with bottom chat drawer */}
      {isMobile && (
        <>
          {/* Full-screen document editor with sidebar overlay */}
          <div className="flex-1 h-full relative w-full min-w-0 overflow-hidden">
            {/* Backdrop - only show when sidebar visible */}
            {isSidebarVisible && (
              <div
                className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-200"
                onClick={() => setIsSidebarVisible(false)}
              />
            )}

            {/* Sidebar Panel - 80% width slide-over from left (mobile) */}
            <div
              className="fixed left-0 top-0 bottom-0 w-[80%] max-w-sm bg-background border-r border-border z-[9999] shadow-2xl transition-transform duration-300 ease-out"
              style={{
                transform: isSidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
              }}
            >
              <AppSidebar
                onDocumentSelect={(id) => {
                  setSelectedDocumentId(id);
                  setIsSidebarVisible(false); // Auto-close on mobile after selecting
                }}
                selectedDocumentId={selectedDocumentId}
              />
            </div>

            <TiptapEditor
              initialContent={documentContent}
              onContentChange={(html) => {
                console.log('📝 [EDITOR] Content changed, updating store (skipEditorUpdate=true)');
                documentContentStore.updateContent(html, true); // true = skip editor update
              }}
              onCommentsChange={setComments}
              onAIEdit={handleAIEdit}
              selectedModel={selectedModel}
              onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
              isSidebarVisible={isSidebarVisible}
            />
          </div>

          {/* Overlay backdrop when drawer is open - covers everything including top nav */}
          {chatDrawerOpen && (
            <div
              onClick={() => setChatDrawerOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 4500, // Above nav bar (4000) but below chat drawer (5000)
              }}
            />
          )}

          {/* Bottom chat drawer */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: chatDrawerOpen ? '95vh' : '48px',
              background: 'var(--background)',
              borderTop: '1px solid var(--border)',
              borderRadius: chatDrawerOpen ? '0' : '12px 12px 0 0',
              zIndex: 5000, // Above overlay (4500)
              transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            {/* Drawer handle */}
            <div
              onClick={() => setChatDrawerOpen(!chatDrawerOpen)}
              style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderBottom: chatDrawerOpen ? '1px solid var(--border)' : 'none',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--muted-foreground)',
                  marginRight: '8px',
                }}
              />
              <span className="text-sm font-medium">
                {chatDrawerOpen ? '▼ Close Chat' : '▲ Open Chat'}
              </span>
            </div>

            {/* Chat content */}
            {chatDrawerOpen && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  height: 'calc(95vh - 48px)',
                }}
              >
                <DocumentChat
                  messages={messages}
                  isLoading={isLoading}
                  status={status}
                  error={error}
                  onSendMessage={handleSendMessage}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  webSearchEnabled={webSearchEnabled}
                  onWebSearchChange={setWebSearchEnabled}
                  onReload={reload}
                  isEditorVisible={isEditorVisible}
                  onToggleEditor={handleToggleEditor}
                  currentDocument={currentDocument}
                  currentProject={currentProject}
                  wordCount={wordCount}
                  systemPrompt={actualSystemPrompt}
                  documentContent={documentContent}
                />
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNav />}

      {/* Create Document/Folder Modal */}
      <CreateItemModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        type={createModalType}
        onConfirm={handleCreateItemConfirm}
      />
    </div>
  );
};

export default ChatBotDemo;
