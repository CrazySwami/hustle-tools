'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { useDocumentContent } from '@/hooks/useDocumentContent';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { Comment } from '@/components/editor/CommentExtension';
import { DocumentChat } from '@/components/editor/DocumentChat';
import { BottomNav } from '@/components/ui/BottomNav';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useDocuments, useProjects } from '@/hooks/useProjectHierarchy';
import TurndownService from 'turndown';


const ChatBotDemo = () => {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [isMobile, setIsMobile] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(true); // Open by default on desktop
  const [comments, setComments] = useState<Comment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Project sidebar visibility (overlay on editor)

  // Resizable divider state - now just for chat/editor split
  const [chatPanelWidth, setChatPanelWidth] = useState(40); // 40% for chat
  const [isResizing, setIsResizing] = useState(false);

  // Document content management - SINGLE source of truth
  const documentContentStore = useDocumentContent();
  const documentContent = documentContentStore.content; // Read directly from store

  // Get documents and projects hooks
  const { documents, updateDocument, createDocument } = useDocuments();
  const { projects, createProject } = useProjects();

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
  const handleSendMessage = (text: string, settings?: { webSearchEnabled: boolean; includeContext?: boolean }) => {
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

    console.log('📄 Sending document chat request:', {
      model: modelToUse,
      documentLength: latestDocContent.length,
      webSearch: settings?.webSearchEnabled,
      includeContext: settings?.includeContext !== false, // Default to true
      documentTitle: currentDocument?.title,
      projectName: currentProject?.name,
    });

    sendMessage(
      { text },
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

  // Resizable divider handlers for chat/editor split
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const containerWidth = window.innerWidth;
    const newWidth = (e.clientX / containerWidth) * 100;

    // Constrain between 25% and 60%
    if (newWidth >= 25 && newWidth <= 60) {
      setChatPanelWidth(newWidth);
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

  return (
    <SidebarProvider
      defaultOpen={true}
      className="h-screen w-full"
    >
      <div className={`flex h-full w-full max-w-full overflow-x-hidden ${isMobile ? 'px-2 py-2' : 'px-4 py-4'} gap-0`}>
        {/* Desktop: Two-panel layout (Chat | Editor) with shadcn Sidebar */}
        {!isMobile && (
        <>
          {/* Left Panel: Chat */}
          <div
            className="flex flex-col h-full"
            style={{ width: isEditorVisible ? `${chatPanelWidth}%` : '100%' }}
          >
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
              systemPrompt={`You are a helpful writing assistant. You help users write and edit documents.

**Current document:** ${currentDocument?.title || 'Untitled'}
${currentProject ? `**Project:** ${currentProject.name}` : ''}
**Word count:** ${wordCount.toLocaleString()} words

Use the tools available to edit the document, analyze text, and help with writing tasks.`}
              documentContent={documentContent}
            />
          </div>

          {/* Divider (between chat and editor) - invisible but functional */}
          {isEditorVisible && (
            <div
              onMouseDown={handleMouseDown}
              style={{
                width: '4px',
                cursor: 'col-resize',
                background: 'transparent',
                position: 'relative',
                transition: isResizing ? 'none' : 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isResizing) e.currentTarget.style.background = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                if (!isResizing) e.currentTarget.style.background = 'transparent';
              }}
            />
          )}

          {/* Right Panel: Tiptap Editor with shadcn Sidebar */}
          {isEditorVisible && (
            <div
              className="h-full overflow-hidden flex"
              style={{ width: `${100 - chatPanelWidth}%` }}
            >
              {/* shadcn Sidebar - auto-handles collapsible state */}
              <AppSidebar
                onDocumentSelect={setSelectedDocumentId}
                selectedDocumentId={selectedDocumentId}
              />

              {/* Editor - automatically adjusts when sidebar opens/closes */}
              <div className="flex-1 h-full overflow-hidden p-2">
                <TiptapEditor
                  initialContent={documentContent}
                  onContentChange={(html) => {
                    console.log('📝 [EDITOR] Content changed, updating store (skipEditorUpdate=true)');
                    documentContentStore.updateContent(html, true); // true = skip editor update
                  }}
                  onCommentsChange={setComments}
                  onAIEdit={handleAIEdit}
                  selectedModel={selectedModel}
                />
              </div>
            </div>
          )}
        </>
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

          {/* Overlay backdrop when drawer is open */}
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
                zIndex: 1999,
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
              zIndex: 2000,
              transition: 'height 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
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
                  systemPrompt={`You are a helpful writing assistant. You help users write and edit documents.

**Current document:** ${currentDocument?.title || 'Untitled'}
${currentProject ? `**Project:** ${currentProject.name}` : ''}
**Word count:** ${wordCount.toLocaleString()} words

Use the tools available to edit the document, analyze text, and help with writing tasks.`}
                  documentContent={documentContent}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNav />}
      </div>
    </SidebarProvider>
  );
};

export default ChatBotDemo;
