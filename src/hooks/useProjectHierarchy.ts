/**
 * Simplified project hierarchy hooks - clean, minimal, and working
 */

import { useState, useEffect, useCallback } from 'react';
import { Project, Folder, Document, ProjectUIState } from '@/types/project';
import {
  projectStorage,
  folderStorage,
  documentStorage,
  uiStateStorage,
} from '@/lib/project-storage';

/**
 * Hook for managing all projects
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Initial load
    setProjects(projectStorage.getAll());

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_projects_v2') {
        setProjects(projectStorage.getAll());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createProject = useCallback((name: string) => {
    const project = projectStorage.create(name);
    setProjects(projectStorage.getAll());
    return project;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const updated = projectStorage.update(id, updates);
    if (updated) {
      setProjects(projectStorage.getAll());
    }
    return updated;
  }, []);

  const deleteProject = useCallback((id: string) => {
    const success = projectStorage.delete(id);
    if (success) {
      setProjects(projectStorage.getAll());
    }
    return success;
  }, []);

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
  };
}

/**
 * Hook for managing folders
 */
export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    // Initial load
    setFolders(folderStorage.getAll());

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_folders_v2') {
        setFolders(folderStorage.getAll());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createFolder = useCallback((name: string, projectId: string) => {
    const folder = folderStorage.create(name, projectId);
    setFolders(folderStorage.getAll());
    return folder;
  }, []);

  const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
    const updated = folderStorage.update(id, updates);
    if (updated) {
      setFolders(folderStorage.getAll());
    }
    return updated;
  }, []);

  const deleteFolder = useCallback((id: string) => {
    const success = folderStorage.delete(id);
    if (success) {
      setFolders(folderStorage.getAll());
    }
    return success;
  }, []);

  return {
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}

/**
 * Hook for managing documents
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // Initial load
    setDocuments(documentStorage.getAll());

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_documents_v2') {
        setDocuments(documentStorage.getAll());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createDocument = useCallback((title: string, projectId: string, folderId?: string) => {
    const document = documentStorage.create(title, projectId, folderId);
    setDocuments(documentStorage.getAll());
    return document;
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    const updated = documentStorage.update(id, updates);
    if (updated) {
      setDocuments(documentStorage.getAll());
    }
    return updated;
  }, []);

  const deleteDocument = useCallback((id: string) => {
    const success = documentStorage.delete(id);
    if (success) {
      setDocuments(documentStorage.getAll());
    }
    return success;
  }, []);

  return {
    documents,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}

/**
 * Hook for UI state (expanded folders, selected items, etc.)
 */
export function useProjectUIState() {
  const [uiState, setUIState] = useState<ProjectUIState>(uiStateStorage.get());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_ui_state_v2') {
        setUIState(uiStateStorage.get());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleFolder = useCallback((folderId: string) => {
    uiStateStorage.toggleFolder(folderId);
    setUIState(uiStateStorage.get());
  }, []);

  const toggleProject = useCallback((projectId: string) => {
    uiStateStorage.toggleProject(projectId);
    setUIState(uiStateStorage.get());
  }, []);

  const expandFolder = useCallback((folderId: string) => {
    uiStateStorage.expandFolder(folderId);
    setUIState(uiStateStorage.get());
  }, []);

  const expandProject = useCallback((projectId: string) => {
    uiStateStorage.expandProject(projectId);
    setUIState(uiStateStorage.get());
  }, []);

  return {
    uiState,
    toggleFolder,
    toggleProject,
    expandFolder,
    expandProject,
  };
}
