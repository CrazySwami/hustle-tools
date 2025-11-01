/**
 * Document Manager
 *
 * Manages document library state, persistence, and CRUD operations
 * Similar to file-group-manager.ts but for documents
 */

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null = root folder
  color?: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  folderId?: string; // Link to parent folder
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  wordCount?: number;
  characterCount?: number;
}

export interface DocumentLibraryState {
  documents: Document[];
  folders: Folder[];
  activeDocumentId: string | null;
  expandedFolders: string[]; // Track which folders are open in tree view
  version: number;
}

const STORAGE_KEY = 'document-library-state';
const CURRENT_VERSION = 1;

// Default state
const getDefaultState = (): DocumentLibraryState => ({
  documents: [],
  folders: [],
  activeDocumentId: null,
  expandedFolders: [],
  version: CURRENT_VERSION,
});

// Load state from localStorage
export const loadDocumentLibraryState = (): DocumentLibraryState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultState();

    const state = JSON.parse(stored) as DocumentLibraryState;

    // Handle version migrations if needed
    if (state.version !== CURRENT_VERSION) {
      console.log('Migrating document library state from version', state.version, 'to', CURRENT_VERSION);
      // Add migration logic here if needed in the future
    }

    return state;
  } catch (error) {
    console.error('Failed to load document library state:', error);
    return getDefaultState();
  }
};

// Save state to localStorage
export const saveDocumentLibraryState = (state: DocumentLibraryState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save document library state:', error);
  }
};

// Create new folder
export const createFolder = (
  state: DocumentLibraryState,
  name: string,
  parentId: string | null = null
): DocumentLibraryState => {
  const newFolder: Folder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    parentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const newState = {
    ...state,
    folders: [...state.folders, newFolder],
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Update folder
export const updateFolder = (
  state: DocumentLibraryState,
  folderId: string,
  updates: Partial<Omit<Folder, 'id' | 'createdAt'>>
): DocumentLibraryState => {
  const newState = {
    ...state,
    folders: state.folders.map(folder =>
      folder.id === folderId
        ? { ...folder, ...updates, updatedAt: Date.now() }
        : folder
    ),
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Delete folder (and move documents to parent or root)
export const deleteFolder = (
  state: DocumentLibraryState,
  folderId: string
): DocumentLibraryState => {
  const folder = state.folders.find(f => f.id === folderId);
  if (!folder) return state;

  // Move documents to parent folder
  const newState = {
    ...state,
    folders: state.folders.filter(f => f.id !== folderId && f.parentId !== folderId),
    documents: state.documents.map(doc =>
      doc.folderId === folderId
        ? { ...doc, folderId: folder.parentId || undefined }
        : doc
    ),
    expandedFolders: state.expandedFolders.filter(id => id !== folderId),
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Create new document
export const createDocument = (
  state: DocumentLibraryState,
  name: string,
  content: string = '',
  folderId?: string
): DocumentLibraryState => {
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const characterCount = content.length;

  const newDocument: Document = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    content,
    folderId,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wordCount,
    characterCount,
  };

  const newState = {
    ...state,
    documents: [...state.documents, newDocument],
    activeDocumentId: newDocument.id,
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Update document
export const updateDocument = (
  state: DocumentLibraryState,
  documentId: string,
  updates: Partial<Omit<Document, 'id' | 'createdAt'>>
): DocumentLibraryState => {
  const newState = {
    ...state,
    documents: state.documents.map(doc => {
      if (doc.id === documentId) {
        const updatedDoc = { ...doc, ...updates, updatedAt: Date.now() };

        // Recalculate word count if content changed
        if (updates.content !== undefined) {
          updatedDoc.wordCount = updates.content.trim().split(/\s+/).filter(w => w.length > 0).length;
          updatedDoc.characterCount = updates.content.length;
        }

        return updatedDoc;
      }
      return doc;
    }),
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Delete document
export const deleteDocument = (
  state: DocumentLibraryState,
  documentId: string
): DocumentLibraryState => {
  const newState = {
    ...state,
    documents: state.documents.filter(doc => doc.id !== documentId),
    activeDocumentId: state.activeDocumentId === documentId ? null : state.activeDocumentId,
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Duplicate document
export const duplicateDocument = (
  state: DocumentLibraryState,
  documentId: string
): DocumentLibraryState => {
  const original = state.documents.find(doc => doc.id === documentId);
  if (!original) return state;

  const duplicate: Document = {
    ...original,
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${original.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const newState = {
    ...state,
    documents: [...state.documents, duplicate],
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Select document
export const selectDocument = (
  state: DocumentLibraryState,
  documentId: string | null
): DocumentLibraryState => {
  const newState = {
    ...state,
    activeDocumentId: documentId,
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Toggle folder expansion
export const toggleFolderExpansion = (
  state: DocumentLibraryState,
  folderId: string
): DocumentLibraryState => {
  const newState = {
    ...state,
    expandedFolders: state.expandedFolders.includes(folderId)
      ? state.expandedFolders.filter(id => id !== folderId)
      : [...state.expandedFolders, folderId],
  };

  saveDocumentLibraryState(newState);
  return newState;
};

// Get all unique tags from documents
export const getAllTags = (state: DocumentLibraryState): string[] => {
  const tagsSet = new Set<string>();
  state.documents.forEach(doc => {
    doc.tags?.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
};

// Get documents in folder
export const getDocumentsInFolder = (
  state: DocumentLibraryState,
  folderId: string | null
): Document[] => {
  return state.documents.filter(doc =>
    folderId === null
      ? !doc.folderId
      : doc.folderId === folderId
  );
};

// Get subfolders
export const getSubfolders = (
  state: DocumentLibraryState,
  parentId: string | null
): Folder[] => {
  return state.folders.filter(folder => folder.parentId === parentId);
};
