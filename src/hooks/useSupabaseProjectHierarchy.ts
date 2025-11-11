/**
 * Supabase-backed project hierarchy hooks
 * Drop-in replacement for localStorage-based hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Document {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  folder_id?: string | null;
  project_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  owner_id: string;
  parent_folder_id?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  owner_id: string;
  createdAt: string;
}

/**
 * Hook for managing documents with Supabase
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        // Map Supabase fields to expected format
        const mappedDocs = data.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content || '',
          owner_id: doc.owner_id,
          folder_id: doc.folder_id,
          project_id: doc.folder_id, // For compatibility
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
        }));
        setDocuments(mappedDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();

    // Set up realtime subscription
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDocuments, supabase]);

  const createDocument = useCallback(
    async (title: string, projectId: string, folderId?: string) => {
      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            folder_id: folderId || null,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const mapped = {
            id: data.id,
            title: data.title,
            content: data.content || '',
            owner_id: data.owner_id,
            folder_id: data.folder_id,
            project_id: data.folder_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setDocuments(prev => [...prev, mapped]);
          return mapped;
        }
      } catch (error) {
        console.error('Error creating document:', error);
      }
      return null;
    },
    []
  );

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Document>) => {
      try {
        const response = await fetch(`/api/documents/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const data = await response.json();
          const mapped = {
            id: data.id,
            title: data.title,
            content: data.content || '',
            owner_id: data.owner_id,
            folder_id: data.folder_id,
            project_id: data.folder_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setDocuments(prev =>
            prev.map(doc => (doc.id === id ? mapped : doc))
          );
          return mapped;
        }
      } catch (error) {
        console.error('Error updating document:', error);
      }
      return null;
    },
    []
  );

  const deleteDocument = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        return true;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
    return false;
  }, []);

  return {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}

/**
 * Hook for managing folders with Supabase
 */
export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          owner_id: folder.owner_id,
          parent_folder_id: folder.parent_folder_id,
          createdAt: folder.created_at,
          updatedAt: folder.updated_at,
        }));
        setFolders(mapped);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();

    // Set up realtime subscription
    const channel = supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folders' },
        () => {
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFolders, supabase]);

  const createFolder = useCallback(
    async (name: string, projectId: string) => {
      try {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, parent_folder_id: null }),
        });

        if (response.ok) {
          const data = await response.json();
          const mapped = {
            id: data.id,
            name: data.name,
            owner_id: data.owner_id,
            parent_folder_id: data.parent_folder_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setFolders(prev => [...prev, mapped]);
          return mapped;
        }
      } catch (error) {
        console.error('Error creating folder:', error);
      }
      return null;
    },
    []
  );

  const updateFolder = useCallback(
    async (id: string, updates: Partial<Folder>) => {
      try {
        const response = await fetch(`/api/folders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const data = await response.json();
          const mapped = {
            id: data.id,
            name: data.name,
            owner_id: data.owner_id,
            parent_folder_id: data.parent_folder_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setFolders(prev =>
            prev.map(folder => (folder.id === id ? mapped : folder))
          );
          return mapped;
        }
      } catch (error) {
        console.error('Error updating folder:', error);
      }
      return null;
    },
    []
  );

  const deleteFolder = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFolders(prev => prev.filter(folder => folder.id !== id));
        return true;
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
    return false;
  }, []);

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchFolders,
  };
}

/**
 * Hook for managing projects (using folders as projects)
 * Note: In Supabase version, we're treating top-level folders as "projects"
 */
export function useProjects() {
  const { folders, loading, createFolder, updateFolder, deleteFolder } = useFolders();

  // Filter for top-level folders (no parent) = projects
  const projects = folders.filter(f => !f.parent_folder_id);

  const createProject = useCallback(
    (name: string) => {
      return createFolder(name, ''); // Empty project ID for top-level
    },
    [createFolder]
  );

  return {
    projects: projects.map(f => ({
      id: f.id,
      name: f.name,
      owner_id: f.owner_id,
      createdAt: f.createdAt,
    })) as Project[],
    loading,
    createProject,
    updateProject: updateFolder,
    deleteProject: deleteFolder,
  };
}

/**
 * Hook for UI state (stays in localStorage for client-side UI preferences)
 */
export interface ProjectUIState {
  expandedProjects: Set<string>;
  expandedFolders: Set<string>;
  selectedDocument?: string;
}

export function useProjectUIState() {
  const [uiState, setUIState] = useState<ProjectUIState>({
    expandedProjects: new Set(),
    expandedFolders: new Set(),
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hustle_ui_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUIState({
          expandedProjects: new Set(parsed.expandedProjects || []),
          expandedFolders: new Set(parsed.expandedFolders || []),
          selectedDocument: parsed.selectedDocument,
        });
      } catch (e) {
        console.error('Error loading UI state:', e);
      }
    }
  }, []);

  // Save to localStorage
  const saveUIState = useCallback((newState: ProjectUIState) => {
    localStorage.setItem(
      'hustle_ui_state_v2',
      JSON.stringify({
        expandedProjects: Array.from(newState.expandedProjects),
        expandedFolders: Array.from(newState.expandedFolders),
        selectedDocument: newState.selectedDocument,
      })
    );
    setUIState(newState);
  }, []);

  const toggleFolder = useCallback(
    (folderId: string) => {
      const newExpanded = new Set(uiState.expandedFolders);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      saveUIState({ ...uiState, expandedFolders: newExpanded });
    },
    [uiState, saveUIState]
  );

  const toggleProject = useCallback(
    (projectId: string) => {
      const newExpanded = new Set(uiState.expandedProjects);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      saveUIState({ ...uiState, expandedProjects: newExpanded });
    },
    [uiState, saveUIState]
  );

  const expandFolder = useCallback(
    (folderId: string) => {
      const newExpanded = new Set(uiState.expandedFolders);
      newExpanded.add(folderId);
      saveUIState({ ...uiState, expandedFolders: newExpanded });
    },
    [uiState, saveUIState]
  );

  const expandProject = useCallback(
    (projectId: string) => {
      const newExpanded = new Set(uiState.expandedProjects);
      newExpanded.add(projectId);
      saveUIState({ ...uiState, expandedProjects: newExpanded });
    },
    [uiState, saveUIState]
  );

  return {
    uiState,
    toggleFolder,
    toggleProject,
    expandFolder,
    expandProject,
  };
}
