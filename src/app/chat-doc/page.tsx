'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useDocumentContent } from '@/hooks/useDocumentContent';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { Comment } from '@/components/editor/CommentExtension';
import { DocumentChat } from '@/components/editor/DocumentChat';
import { BottomNav } from '@/components/ui/BottomNav';
import { ProjectSidebar } from '@/components/project-hierarchy/ProjectSidebar';
import { useDocuments } from '@/hooks/useProjectHierarchy';


const ChatBotDemo = () => {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [isMobile, setIsMobile] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(true); // Open by default on desktop
  const [documentContent, setDocumentContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Project sidebar visibility (overlay on editor)

  // Resizable divider state - now just for chat/editor split
  const [chatPanelWidth, setChatPanelWidth] = useState(40); // 40% for chat
  const [isResizing, setIsResizing] = useState(false);

  // Document content management - synced with TiptapEditor
  const documentContentStore = useDocumentContent();

  // Get documents hook to load selected document
  const { documents, updateDocument } = useDocuments();

  const { messages, sendMessage, isLoading, reload, status } = useChat({
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

  // Load selected document into editor
  useEffect(() => {
    if (selectedDocumentId) {
      const doc = documents.find(d => d.id === selectedDocumentId);
      if (doc) {
        setDocumentContent(doc.content);
      }
    }
  }, [selectedDocumentId, documents]);

  // Sync document content from TiptapEditor to global store AND save to selected document
  useEffect(() => {
    // Always sync to global store
    documentContentStore.updateContent(documentContent);

    // Auto-save to selected document if one is selected
    if (selectedDocumentId && documentContent) {
      const doc = documents.find(d => d.id === selectedDocumentId);
      if (doc && doc.content !== documentContent) {
        // Debounce auto-save (only save if content actually changed)
        const timeoutId = setTimeout(() => {
          updateDocument(selectedDocumentId, { content: documentContent });
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
      }
    }
  }, [documentContent, selectedDocumentId, documents, updateDocument]);

  // Sync document content from global store to local state
  // (useful when Morph widget updates the document)
  useEffect(() => {
    const storeContent = documentContentStore.getContent();
    if (storeContent && storeContent !== documentContent) {
      setDocumentContent(storeContent);
    }
  }, [documentContentStore.content]);

  // Handle message sending from DocumentChat
  const handleSendMessage = (text: string, settings?: { webSearchEnabled: boolean }) => {
    // Get latest document content from store
    const latestDocContent = documentContentStore.getContent();

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
    });

    sendMessage(
      { text },
      {
        body: {
          model: modelToUse,
          webSearch: settings?.webSearchEnabled || false,
          documentContent: latestDocContent, // 📦 Pass document to API
          comments,
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

  return (
    <div className={`flex h-screen w-full max-w-full overflow-x-hidden ${isMobile ? 'px-2 py-2' : 'px-4 py-4'} gap-0`}>
      {/* Desktop: Two-panel layout (Chat | Editor) with sidebar overlay on editor */}
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
              onSendMessage={handleSendMessage}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onReload={reload}
              isEditorVisible={isEditorVisible}
              onToggleEditor={handleToggleEditor}
              webSearchEnabled={webSearchEnabled}
              onWebSearchChange={setWebSearchEnabled}
            />
          </div>

          {/* Divider (between chat and editor) */}
          {isEditorVisible && (
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

          {/* Right Panel: Tiptap Editor with Sidebar Overlay */}
          {isEditorVisible && (
            <div
              className="h-full relative"
              style={{ width: `${100 - chatPanelWidth}%` }}
            >
              {/* Sidebar Overlay */}
              {isSidebarVisible && (
                <>
                  {/* Backdrop */}
                  <div
                    className="absolute inset-0 bg-black/20 z-40 transition-opacity"
                    onClick={() => setIsSidebarVisible(false)}
                  />
                  {/* Sidebar Panel */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-80 bg-background border-r border-border z-50 shadow-lg transition-transform duration-200 ease-out"
                    style={{
                      transform: isSidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                    }}
                  >
                    <ProjectSidebar
                      onDocumentSelect={setSelectedDocumentId}
                      selectedDocumentId={selectedDocumentId}
                      onToggleCollapse={() => setIsSidebarVisible(false)}
                    />
                  </div>
                </>
              )}

              {/* Editor */}
              <TiptapEditor
                initialContent={documentContent}
                onContentChange={setDocumentContent}
                onCommentsChange={setComments}
                onAIEdit={handleAIEdit}
                selectedModel={selectedModel}
                onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                isSidebarVisible={isSidebarVisible}
              />
            </div>
          )}
        </>
      )}

      {/* Mobile: Full-screen editor with bottom chat drawer */}
      {isMobile && (
        <>
          {/* Full-screen document editor with sidebar overlay */}
          <div className="flex-1 h-full relative w-full min-w-0">
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarVisible && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/50 z-[9998]"
                  onClick={() => setIsSidebarVisible(false)}
                />
                {/* Sidebar Panel - Full width slide-in from left */}
                <div
                  className="fixed left-0 top-0 bottom-0 w-full bg-background z-[9999] transition-transform duration-300 ease-out"
                  style={{
                    transform: isSidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                  }}
                >
                  <ProjectSidebar
                    onDocumentSelect={(id) => {
                      setSelectedDocumentId(id);
                      setIsSidebarVisible(false); // Auto-close on mobile after selecting
                    }}
                    selectedDocumentId={selectedDocumentId}
                    onToggleCollapse={() => setIsSidebarVisible(false)}
                  />
                </div>
              </>
            )}

            <TiptapEditor
              initialContent={documentContent}
              onContentChange={setDocumentContent}
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
                  onSendMessage={handleSendMessage}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  webSearchEnabled={webSearchEnabled}
                  onWebSearchChange={setWebSearchEnabled}
                  onReload={reload}
                  isEditorVisible={isEditorVisible}
                  onToggleEditor={handleToggleEditor}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default ChatBotDemo;
