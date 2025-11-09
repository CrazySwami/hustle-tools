'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { useDocumentContent } from '@/hooks/useDocumentContent';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { Comment } from '@/components/editor/CommentExtension';
import CommentsPanel from '@/components/editor/CommentsPanel';
import { DocumentChat } from '@/components/editor/DocumentChat';
import { BottomNav } from '@/components/ui/BottomNav';
import { useDocuments, useProjects, useFolders } from '@/hooks/useProjectHierarchy';
import TurndownService from 'turndown';
import { generateDocSystemPrompt } from '@/lib/generate-doc-system-prompt';
import { AppSidebar } from '@/components/app-sidebar';
import { TwoPanelChatLayout } from '@/components/layouts/TwoPanelChatLayout';
import { NavigationBar } from '@/components/ai-elements/inner-navigation-bar';
import { CreateItemModal } from '@/components/modals/CreateItemModal';
import { useSelectedClient } from '@/components/client/ClientStorage';
import { DataSidebar } from '@/components/ai-elements/data-sidebar';
import { CreateDittoButton } from '@/components/ai-elements/create-ditto-button';
import { ChevronRight, Download } from 'lucide-react';
import Image from 'next/image';


const ChatBotDemo = () => {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [isMobile, setIsMobile] = useState(false);

  // Client context state
  const {
    selectedClient,
    setSelectedClientId,
    clientContextEnabled,
    setClientContextEnabled,
  } = useSelectedClient();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(true); // Open by default on desktop
  const [isChatVisible, setIsChatVisible] = useState(true); // Chat panel visibility on desktop
  const [comments, setComments] = useState<Comment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Project sidebar visibility (overlay on editor)
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true); // Context library visibility
  const [tokenData, setTokenData] = useState<{ totalTokens: number; contextLimit: number; percentUsed: number } | null>(null);
  const [taggedDocuments, setTaggedDocuments] = useState<Array<{ id: string; name: string; type?: 'file' | 'folder' | 'ditto' }>>([]);

  // Modal state for creating documents/folders
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'document' | 'folder'>('document');
  
  // Save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Track comments/tools panel state (for dynamic dropdown items)
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'comments' | 'tools'>('comments');

  // Chat panel width tracking for responsive NavigationBar
  const [chatPanelWidth, setChatPanelWidth] = useState<number>(0);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Document content management - SINGLE source of truth
  const documentContentStore = useDocumentContent();
  const documentContent = documentContentStore.content; // Read directly from store
  
  // Extract headings from document for TOC
  const documentHeadings = useMemo(() => {
    if (!documentContent || typeof window === 'undefined') return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentContent, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(headings).map((heading, index) => {
      // Add ID to heading if it doesn't have one
      const headingId = `heading-${index}`;
      heading.setAttribute('id', headingId);
      return {
        id: headingId,
        level: parseInt(heading.tagName.substring(1)),
        text: heading.textContent || '',
        tag: heading.tagName.toLowerCase()
      };
    });
  }, [documentContent]);

  // Handle TOC item click - scroll to heading
  const handleTOCClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate TOC content in different formats
  const generateTOCContent = (format: 'html' | 'markdown' | 'richtext') => {
    if (documentHeadings.length === 0) return '';
    
    if (format === 'html') {
      let html = '<h2>Table of Contents</h2>\n<ul>\n';
      documentHeadings.forEach(heading => {
        const indent = '  '.repeat(heading.level - 1);
        html += `${indent}<li><a href="#${heading.id}">${heading.text}</a></li>\n`;
      });
      html += '</ul>';
      return html;
    } else if (format === 'markdown') {
      let md = '## Table of Contents\n\n';
      documentHeadings.forEach(heading => {
        const indent = '  '.repeat(heading.level - 1);
        md += `${indent}- [${heading.text}](#${heading.id})\n`;
      });
      return md;
    } else {
      // Rich text format (similar to HTML)
      return generateTOCContent('html');
    }
  };

  // Export TOC
  const handleExportTOC = (format: 'html' | 'markdown' | 'richtext') => {
    const content = generateTOCContent(format);
    if (!content) return;
    
    const filename = format === 'html' ? 'toc.html' : format === 'markdown' ? 'toc.md' : 'toc.rtf';
    const mimeType = format === 'html' ? 'text/html' : format === 'markdown' ? 'text/markdown' : 'application/rtf';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Insert TOC at top of document
  const handleInsertTOC = () => {
    if (!documentContent || documentHeadings.length === 0) return;
    
    // Generate TOC HTML
    const tocHTML = generateTOCContent('html');
    
    // Insert at the beginning of the document
    const newContent = tocHTML + '\n' + documentContent;
    
    // Update document content
    documentContentStore.updateContent(newContent);
  };

  // Copy TOC
  const handleCopyTOC = () => {
    const tocHTML = generateTOCContent('html');
    if (!tocHTML) return;
    
    navigator.clipboard.writeText(tocHTML).then(() => {
      console.log('TOC copied to clipboard');
    });
  };

  // Get documents, projects, and folders hooks
  const { documents, updateDocument, createDocument, deleteDocument } = useDocuments();
  const { projects, createProject } = useProjects();
  const { createFolder } = useFolders();

  // Handle creating new document from sidebar
  const handleCreateDocument = () => {
    setCreateModalType('document');
    setCreateModalOpen(true);
  };

  // Save document
  const handleSaveDocument = useCallback(async () => {
    if (!selectedDocumentId || !documentContent) return;
    
    setSaveStatus('saving');
    try {
      updateDocument(selectedDocumentId, {
        content: documentContent,
      });
      setSaveStatus('saved');
      setLastSaved(new Date());
      console.log('✅ Document saved successfully');
      
      // Auto-hide saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus('saved'); // Keep it as 'saved' but button will be hidden
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to save document:', error);
      setSaveStatus('unsaved');
    }
  }, [selectedDocumentId, documentContent, updateDocument]);

  // Mark as unsaved when content changes
  useEffect(() => {
    if (documentContent && selectedDocumentId) {
      setSaveStatus('unsaved');
    }
  }, [documentContent]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedDocumentId) return;
    
    const interval = setInterval(() => {
      if (saveStatus === 'unsaved') {
        handleSaveDocument();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedDocumentId, saveStatus, handleSaveDocument]);

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDocument();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveDocument]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Handle deleting multiple documents
  const handleDeleteDocuments = (ids: string[]) => {
    if (window.confirm(`Delete ${ids.length} document(s)? This cannot be undone.`)) {
      ids.forEach(id => deleteDocument(id));
    }
  };

  // Handle renaming a document
  const handleRenameDocument = (id: string, newName: string) => {
    updateDocument(id, { title: newName });
  };

  const { messages, sendMessage, isLoading, reload, status, error } = useChat({
    api: '/api/chat-doc', // 🎯 Specialized endpoint for document editing
    experimental_throttle: 50, // Batch UI updates every 50ms for smoother rendering
  });

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

    // Update on resize
    const resizeObserver = new ResizeObserver(updatePanelWidth);
    resizeObserver.observe(chatPanelRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Detect mobile on mount and manage editor visibility
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close editor on mobile, open on desktop
      if (mobile) {
        setIsEditorVisible(false);
      } else {
        setIsEditorVisible(true); // Always show editor on desktop
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

  // Handle document tagging from sidebar (max 2 items)
  const handleDocumentTag = (doc: any) => {
    setTaggedDocuments((prev) => {
      // Don't add duplicates
      if (prev.some(d => d.id === doc.id)) {
        return prev;
      }
      // Limit to 2 tagged items
      if (prev.length >= 2) {
        alert('Maximum 2 items can be tagged at once. Please remove an item first.');
        return prev;
      }
      // Only include supported types
      const type = doc.type === 'file' || doc.type === 'folder' || doc.type === 'ditto' ? doc.type : undefined;
      return [...prev, { id: doc.id, name: doc.name, type }];
    });
  };

  const handleRemoveTaggedDocument = (id: string) => {
    setTaggedDocuments((prev) => prev.filter(d => d.id !== id));
  };

  // Handle creating a new Ditto or Mirror
  const handleCreateDitto = (ditto: {
    name: string
    description: string
    type: 'mirror' | 'ditto'
    files?: File[]
    linkedinProfile?: string
    personalWebsite?: string
    companyWebsite?: string
    additionalContext?: string
    socialLinks?: Array<{ platform: string; url: string; icon: string }>
    websiteLinks?: string[]
  }) => {
    console.log('Creating new Ditto/Mirror:', ditto);
    
    // TODO: Implement actual Ditto creation logic
    // This would typically:
    // 1. Create a new folder in the sidebar with type 'ditto'
    // 2. Upload the files to that folder
    // 3. Store all metadata (LinkedIn, websites, social links, etc.)
    // 4. For Mirrors: scrape and ingest website content
    // 5. Add to the data structure
    
    const details = ditto.type === 'ditto' 
      ? `\nLinkedIn: ${ditto.linkedinProfile || 'N/A'}\nWebsites: ${[ditto.personalWebsite, ditto.companyWebsite].filter(Boolean).join(', ') || 'N/A'}\nSocial Links: ${ditto.socialLinks?.length || 0}\nFiles: ${ditto.files?.length || 0}`
      : `\nWebsite Links: ${ditto.websiteLinks?.length || 0}\nFiles: ${ditto.files?.length || 0}`;
    
    alert(`${ditto.type === 'ditto' ? 'Ditto' : 'Mirror'} "${ditto.name}" created successfully!${details}`);
  };

  // Listen for addTag events from @ mentions
  useEffect(() => {
    const handleAddTag = (e: Event) => {
      const customEvent = e as CustomEvent;
      const doc = customEvent.detail;
      handleDocumentTag(doc);
    };
    
    window.addEventListener('addTag', handleAddTag);
    return () => window.removeEventListener('addTag', handleAddTag);
  }, []);

  // Prepare available documents for @ mentions (flatten all documents from sidebar)
  const availableDocuments = useMemo(() => {
    const docs: Array<{ id: string; name: string; type: 'file' | 'folder' | 'ditto' }> = [];
    
    // Add all documents from the documents list
    documents.forEach(doc => {
      docs.push({ id: doc.id, name: doc.title, type: 'file' });
    });
    
    // Add folders and projects
    projects.forEach(project => {
      docs.push({ id: project.id, name: project.name, type: 'folder' });
    });
    
    // Add some example Ditto items (you can expand this based on your data structure)
    docs.push(
      { id: 'kyle-ditto', name: "Kyle's Ditto", type: 'ditto' },
      { id: 'alfonso-ditto', name: "Alfonso's Ditto", type: 'ditto' },
      { id: 'bobby-ditto', name: "Bobby's Ditto", type: 'ditto' }
    );
    
    return docs;
  }, [documents, projects]);

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

    // If web search is enabled, use Perplexity Sonar behind the scenes (UI keeps showing selected model)
    let modelToUse = selectedModel;
    if (settings?.webSearchEnabled) {
      console.log('Web search enabled - using Perplexity Sonar (UI keeps showing', selectedModel, ')');
      modelToUse = 'perplexity/sonar';
      // Don't update UI selector - keep showing the user's selected model
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
          // Client context
          clientData: clientContextEnabled && selectedClient ? selectedClient : null,
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
  const actualSystemPrompt = useMemo(() => {
    let basePrompt = generateDocSystemPrompt({
      includeContext,
      documentContent: markdownContent,
      documentTitle: currentDocument?.title || '',
      projectName: currentProject?.name || '',
      clientData: clientContextEnabled && selectedClient ? selectedClient : null,
    });

    // Add tagged documents context
    if (taggedDocuments.length > 0) {
      const taggedContext = taggedDocuments.map(doc => {
        return `\n\n## Tagged Context: ${doc.name}\nType: ${doc.type || 'file'}\n[Content would be loaded here]`;
      }).join('\n');
      
      basePrompt += `\n\n# Additional Tagged Context\nThe user has tagged the following items for context:${taggedContext}`;
    }

    return basePrompt;
  }, [includeContext, markdownContent, currentDocument?.title, currentProject?.name, clientContextEnabled, selectedClient, taggedDocuments]);

  // Navigation dropdown handler
  const handleNavigationDropdownClick = (tabId: string, item: string) => {
    console.log('🎯 [DROPDOWN] tabId:', tabId, 'item:', item, 'isMobile:', isMobile, 'isSidebarVisible:', isSidebarVisible);

    // Options tab actions
    if (tabId === 'options') {
      if (item === 'Hide Chat' || item === 'Show Chat') {
        setIsChatVisible(!isChatVisible);
      }
      // Future: Add more general options here
      return;
    }

    // Documents tab actions
    if (tabId === 'documents') {
      console.log('📂 [DOCUMENTS] Handling documents action:', item);

      // Handle Open/Close
      if (item === 'Open' || item === 'Close') {
        console.log('🔄 [DOCUMENTS] Toggle action detected');

        if (isMobile) {
          console.log('📱 [MOBILE] Setting isSidebarVisible to:', item === 'Open');
          // On mobile, control the overlay sidebar directly
          setIsSidebarVisible(item === 'Open');
        } else {
          console.log('🖥️ [DESKTOP] Dispatching toggle-documents-panel event');
          // On desktop, dispatch custom event that TipTap editor listens for
          window.dispatchEvent(new CustomEvent('toggle-documents-panel'));
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

      // Map display names to tool IDs (removed TOC - now a main tab)
      const toolMap: Record<string, string> = {
        'Text Statistics': 'stats',
        'Find Text': 'find',
        'Readability': 'readability',
        'Document Outline': 'headings',
        'Find & Replace': 'replace',
        'Find Duplicates': 'duplicates',
      };

      const toolId = toolMap[item];
      if (toolId) {
        window.dispatchEvent(new CustomEvent('doc-open-tool', { detail: toolId }));
      }
      return;
    }

    // TOC tab actions
    if (tabId === 'toc') {
      // Handle Open/Close
      if (item === 'Open') {
        window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'toc', open: true } }));
        return;
      } else if (item === 'Close') {
        window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'toc', open: false } }));
        return;
      }
    }
  };

  // Handle tab change - toggle panels for Comments, Tools, and TOC
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
    } else if (tabId === 'toc') {
      // Open TOC panel (or close if already open)
      window.dispatchEvent(new CustomEvent('doc-set-panel', { detail: { tab: 'toc', open: true } }));
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

  // Navigation tabs configuration - Options, Documents, Comments, Tools, TOC
  const navigationTabs: any[] = [
    {
      id: 'options',
      label: 'Options',
      icon: null,
      dropdownItems: [isChatVisible ? 'Hide Chat' : 'Show Chat'],
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
        'Find Duplicates'
      ],
    },
    {
      id: 'toc',
      label: 'TOC',
      icon: null,
      dropdownItems: [
        (isPanelOpen && panelTab === 'toc') ? 'Close' : 'Open',
      ],
    }
  ];

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-x-hidden bg-[#F0F0F0] dark:bg-[#121212]" style={{
      paddingTop: isMobile ? '52px' : '0' // Space for fixed nav on mobile
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
            dimmed={chatDrawerOpen}
          />
        </div>
      )}

      {/* Main content wrapper */}
      <div className={`flex flex-1 h-full w-full ${isMobile ? 'px-2' : ''} gap-0 overflow-hidden relative`}>
        {/* Desktop: Three-panel layout with chat on left and right, editor in center */}
        {!isMobile && isEditorVisible && isChatVisible && (
          <TwoPanelChatLayout
            leftPanel={isLeftPanelVisible ? {
              content: (
                <div
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
                    maxWidth: '100%',
                    fontSize: '0.875rem'
                  }}>
                    <DataSidebar 
                      onToggle={() => setIsLeftPanelVisible(false)}
                      onDocumentTag={handleDocumentTag}
                      documents={documents}
                      activeDocumentId={selectedDocumentId}
                      onDocumentSelect={setSelectedDocumentId}
                      onCreateDocument={handleCreateDocument}
                      onDeleteDocuments={handleDeleteDocuments}
                      onRenameDocument={handleRenameDocument}
                    />
                  </div>
                </div>
              ),
              defaultWidth: 17,
              minWidth: 10,
              maxWidth: 40,
            } : undefined}
            centerPanel={{
              content: (
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
                      showContextToggle={!isLeftPanelVisible}
                      onToggleContext={() => setIsLeftPanelVisible(true)}
                      onToggleCommentsPanel={() => setIsPanelOpen(!isPanelOpen)}
                      onSetPanelTab={(tab) => {
                        setPanelTab(tab);
                        setIsPanelOpen(true);
                      }}
                      onSave={handleSaveDocument}
                      saveStatus={saveStatus}
                      lastSaved={lastSaved}
                    />
                  </div>
                </div>
              ),
              defaultWidth: isLeftPanelVisible ? 58 : 75,
              minWidth: 30,
              maxWidth: 80,
            }}
            rightPanel={{
              content: (
                <div
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
                  <div className="rounded-lg bg-white dark:bg-[#1a1a1a]" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: '100%'
                  }}>
                    <div className="bg-[#EBEBEB] dark:bg-[#2C2C2C] border-b border-b-[rgba(0,0,0,0.08)] dark:border-b-[rgba(255,255,255,0.08)]" style={{ 
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Image
                          src="/MF-Workstation-Logo-Light.png"
                          alt="MF Workstation"
                          width={150}
                          height={32}
                          style={{ objectFit: 'contain' }}
                          className="dark:block hidden"
                        />
                        <Image
                          src="/MF-Workstation-Logo.png"
                          alt="MF Workstation"
                          width={150}
                          height={32}
                          style={{ objectFit: 'contain' }}
                          className="dark:hidden block"
                        />
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        fontFamily: 'ui-monospace, monospace',
                        color: '#666'
                      }}>
                        <span>
                          {tokenData ? tokenData.totalTokens.toLocaleString() : '0'} / {tokenData ? tokenData.contextLimit.toLocaleString() : '200,000'}
                        </span>
                        <span style={{
                          fontWeight: '600',
                          color: tokenData && tokenData.percentUsed > 70 ? '#ef4444' : tokenData && tokenData.percentUsed > 50 ? '#f59e0b' : '#6ee7b7'
                        }}>
                          {tokenData ? tokenData.percentUsed.toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Conditional panel rendering based on isPanelOpen and panelTab */}
                    {isPanelOpen && panelTab === 'comments' ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                        <CommentsPanel
                          comments={comments}
                          activeCommentId={null}
                          onCommentClick={() => {}}
                          onCommentResolve={(id) => {
                            setComments(prev => prev.map(c => c.id === id ? {...c, resolved: !c.resolved} : c));
                          }}
                          onCommentDelete={(id) => {
                            setComments(prev => prev.filter(c => c.id !== id));
                          }}
                          onAddComment={() => {}}
                          isOpen={true}
                          onToggle={() => setIsPanelOpen(false)}
                        />
                      </div>
                    ) : isPanelOpen && panelTab === 'tools' ? (
                      <div style={{ padding: '16px', height: '100%', overflow: 'auto', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Table of Contents</h2>
                          <button 
                            onClick={() => setIsPanelOpen(false)}
                            style={{ padding: '4px 8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Insert and Export buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          <button
                            onClick={handleInsertTOC}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              backgroundColor: '#8b5cf6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Insert TOC
                          </button>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => {
                                const dropdown = document.getElementById('export-dropdown');
                                if (dropdown) {
                                  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                fontWeight: '500',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Export
                            </button>
                            <div
                              id="export-dropdown"
                              style={{
                                display: 'none',
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '4px',
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                minWidth: '150px'
                              }}
                            >
                              <button
                                onClick={() => {
                                  handleExportTOC('html');
                                  const dropdown = document.getElementById('export-dropdown');
                                  if (dropdown) dropdown.style.display = 'none';
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                HTML
                              </button>
                              <button
                                onClick={() => {
                                  handleExportTOC('markdown');
                                  const dropdown = document.getElementById('export-dropdown');
                                  if (dropdown) dropdown.style.display = 'none';
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                Markdown
                              </button>
                              <button
                                onClick={() => {
                                  handleExportTOC('richtext');
                                  const dropdown = document.getElementById('export-dropdown');
                                  if (dropdown) dropdown.style.display = 'none';
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  borderTop: '1px solid #e5e7eb'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                Rich Text
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handleCopyTOC}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Copy
                          </button>
                        </div>
                        
                        {documentHeadings.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
                            {documentHeadings.map((heading) => (
                              <div
                                key={heading.id}
                                onClick={() => handleTOCClick(heading.id)}
                                style={{
                                  cursor: 'pointer',
                                  paddingTop: '6px',
                                  paddingBottom: '6px',
                                  paddingLeft: `${8 + (heading.level - 1) * 16}px`,
                                  paddingRight: '8px',
                                  borderRadius: '4px',
                                  fontSize: heading.level === 1 ? '16px' : heading.level === 2 ? '14px' : '13px',
                                  fontWeight: heading.level <= 2 ? '600' : '400',
                                  color: '#333',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {heading.text}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#666', fontSize: '14px' }}>No headings found in document</p>
                        )}
                      </div>
                    ) : (
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
                      containerWidth={chatPanelWidth}
                      selectedClient={selectedClient}
                      clientContextEnabled={clientContextEnabled}
                      onClientChange={setSelectedClientId}
                      onClientContextToggle={() => setClientContextEnabled(!clientContextEnabled)}
                      onTokenDataChange={setTokenData}
                      taggedDocuments={taggedDocuments}
                      onRemoveTaggedDocument={handleRemoveTaggedDocument}
                      availableDocuments={availableDocuments}
                    />
                    )}
                  </div>
                </div>
              ),
              defaultWidth: 25,
              minWidth: 15,
              maxWidth: 50,
            }}
          />
        )}

        {/* Desktop: Editor-only view when chat is hidden */}
        {!isMobile && isEditorVisible && !isChatVisible && (
          <div
            style={{
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%'
            }}
          >
            <div className="rounded-lg bg-background shadow-sm" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <NavigationBar
                  tabs={navigationTabs}
                  onTabChange={handleTabChange}
                  onDropdownItemClick={handleNavigationDropdownClick}
                  showOnDesktop={true}
                  showOnMobile={false}
                  hideLogoOnDesktop={false}
                  containerWidth={typeof window !== 'undefined' ? window.innerWidth : 0}
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
                selectedDocumentId={selectedDocumentId}
                onDocumentSelect={setSelectedDocumentId}
                onToggleCommentsPanel={() => setIsPanelOpen(!isPanelOpen)}
                onSetPanelTab={(tab) => {
                  setPanelTab(tab);
                  setIsPanelOpen(true);
                }}
                onSave={handleSaveDocument}
                saveStatus={saveStatus}
                lastSaved={lastSaved}
              />
            </div>
          </div>
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
              containerWidth={typeof window !== 'undefined' ? window.innerWidth : 0}
              selectedClient={selectedClient}
              clientContextEnabled={clientContextEnabled}
              onClientChange={setSelectedClientId}
              onClientContextToggle={() => setClientContextEnabled(!clientContextEnabled)}
              taggedDocuments={taggedDocuments}
              onRemoveTaggedDocument={handleRemoveTaggedDocument}
              availableDocuments={availableDocuments}
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
                className="absolute inset-0 bg-black/50 z-[10] transition-opacity duration-200"
                onClick={() => setIsSidebarVisible(false)}
              />
            )}

            {/* Documents panel now handled internally by TiptapEditor */}

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
              onToggleCommentsPanel={() => setIsPanelOpen(!isPanelOpen)}
              onSetPanelTab={(tab) => {
                setPanelTab(tab);
                setIsPanelOpen(true);
              }}
              onSave={handleSaveDocument}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
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
                  containerWidth={typeof window !== 'undefined' ? window.innerWidth : 0}
                  selectedClient={selectedClient}
                  clientContextEnabled={clientContextEnabled}
                  onClientChange={setSelectedClientId}
                  onClientContextToggle={() => setClientContextEnabled(!clientContextEnabled)}
                  taggedDocuments={taggedDocuments}
                  onRemoveTaggedDocument={handleRemoveTaggedDocument}
                  availableDocuments={availableDocuments}
                />
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNav />}

      {/* Create Ditto/Mirror Floating Button */}
      <CreateDittoButton onCreateDitto={handleCreateDitto} />

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
