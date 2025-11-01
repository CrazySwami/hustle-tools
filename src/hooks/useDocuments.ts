/**
 * useDocuments Hook
 *
 * State management hook for document library
 * Similar to useFileGroups but for documents
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Document,
  Folder,
  DocumentLibraryState,
  loadDocumentLibraryState,
  saveDocumentLibraryState,
  createFolder as createFolderUtil,
  updateFolder as updateFolderUtil,
  deleteFolder as deleteFolderUtil,
  createDocument as createDocumentUtil,
  updateDocument as updateDocumentUtil,
  deleteDocument as deleteDocumentUtil,
  duplicateDocument as duplicateDocumentUtil,
  selectDocument as selectDocumentUtil,
  toggleFolderExpansion as toggleFolderExpansionUtil,
  getAllTags as getAllTagsUtil,
  getDocumentsInFolder as getDocumentsInFolderUtil,
  getSubfolders as getSubfoldersUtil,
} from '@/lib/document-manager';

export const useDocuments = () => {
  const [state, setState] = useState<DocumentLibraryState>(loadDocumentLibraryState);

  // Refresh state from localStorage
  const refresh = useCallback(() => {
    setState(loadDocumentLibraryState());
  }, []);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'document-library-state') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  // Poll for updates every 2 seconds (for same-tab updates)
  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Folder operations
  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    setState(prevState => createFolderUtil(prevState, name, parentId));
  }, []);

  const updateFolder = useCallback((folderId: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => {
    setState(prevState => updateFolderUtil(prevState, folderId, updates));
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setState(prevState => deleteFolderUtil(prevState, folderId));
  }, []);

  const toggleFolderExpansion = useCallback((folderId: string) => {
    setState(prevState => toggleFolderExpansionUtil(prevState, folderId));
  }, []);

  // Document operations
  const createDocument = useCallback((name: string, content: string = '', folderId?: string) => {
    setState(prevState => createDocumentUtil(prevState, name, content, folderId));
  }, []);

  const updateDocument = useCallback((documentId: string, updates: Partial<Omit<Document, 'id' | 'createdAt'>>) => {
    setState(prevState => updateDocumentUtil(prevState, documentId, updates));
  }, []);

  const deleteDocument = useCallback((documentId: string) => {
    setState(prevState => deleteDocumentUtil(prevState, documentId));
  }, []);

  const duplicateDocument = useCallback((documentId: string) => {
    setState(prevState => duplicateDocumentUtil(prevState, documentId));
  }, []);

  const selectDocument = useCallback((documentId: string | null) => {
    setState(prevState => selectDocumentUtil(prevState, documentId));
  }, []);

  // Helper functions
  const getAllTags = useCallback(() => {
    return getAllTagsUtil(state);
  }, [state]);

  const getDocumentsInFolder = useCallback((folderId: string | null) => {
    return getDocumentsInFolderUtil(state, folderId);
  }, [state]);

  const getSubfolders = useCallback((parentId: string | null) => {
    return getSubfoldersUtil(state, parentId);
  }, [state]);

  const getActiveDocument = useCallback(() => {
    if (!state.activeDocumentId) return null;
    return state.documents.find(doc => doc.id === state.activeDocumentId) || null;
  }, [state]);

  return {
    // State
    documents: state.documents,
    folders: state.folders,
    activeDocumentId: state.activeDocumentId,
    activeDocument: getActiveDocument(),
    expandedFolders: state.expandedFolders,

    // Folder operations
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolderExpansion,

    // Document operations
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    selectDocument,

    // Helpers
    getAllTags,
    getDocumentsInFolder,
    getSubfolders,
    refresh,
  };
};
