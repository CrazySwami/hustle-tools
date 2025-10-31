'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useDocumentContent } from '@/hooks/useDocumentContent';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { Comment } from '@/components/editor/CommentExtension';
import { DocumentToolsPanel } from '@/components/editor/DocumentToolsPanel';
import { DocumentChat } from '@/components/editor/DocumentChat';


const ChatBotDemo = () => {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [isMobile, setIsMobile] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  // Document content management - synced with TiptapEditor
  const documentContentStore = useDocumentContent();

  const { messages, sendMessage, isLoading, reload, status } = useChat({
    api: '/api/chat-doc', // 🎯 Specialized endpoint for document editing
  });

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync document content from TiptapEditor to global store
  useEffect(() => {
    if (documentContent) {
      documentContentStore.updateContent(documentContent);
    }
  }, [documentContent]);

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

    console.log('📄 Sending document chat request:', {
      model: selectedModel,
      documentLength: latestDocContent.length,
      webSearch: settings?.webSearchEnabled,
    });

    sendMessage(
      { text },
      {
        body: {
          model: selectedModel,
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

  // Handle AI edit from bubble menu
  const handleAIEdit = (selectedText: string, instruction: string) => {
    const message = `🎯 TARGETED EDIT REQUEST

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

    handleSendMessage(message, { webSearchEnabled: false });
  };

  return (
    <div className={`flex h-screen w-full pt-16 ${isMobile ? 'px-2 pb-2' : 'px-4 pb-4'} gap-4`}>
      {/* Desktop: Side-by-side layout */}
      {!isMobile && (
        <>
          <div className="flex flex-col h-full flex-1">
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
            />
          </div>
          {isEditorVisible && (
            <div className="flex-1 h-full border-l relative">
              <DocumentToolsPanel />
              <TiptapEditor
                initialContent={documentContent}
                onContentChange={setDocumentContent}
                onCommentsChange={setComments}
                onAIEdit={handleAIEdit}
                selectedModel={selectedModel}
              />
            </div>
          )}
        </>
      )}

      {/* Mobile: Full-screen editor with bottom chat drawer */}
      {isMobile && (
        <>
          {/* Full-screen document editor */}
          <div className="flex-1 h-full relative">
            <DocumentToolsPanel />
            <TiptapEditor
              initialContent={documentContent}
              onContentChange={setDocumentContent}
              onCommentsChange={setComments}
              onAIEdit={handleAIEdit}
              selectedModel={selectedModel}
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
                  onReload={reload}
                  isEditorVisible={isEditorVisible}
                  onToggleEditor={handleToggleEditor}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBotDemo;
