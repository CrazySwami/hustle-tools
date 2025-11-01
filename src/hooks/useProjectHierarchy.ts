/**
 * ============================================================================
 * PROJECT HIERARCHY HOOKS
 * ============================================================================
 *
 * React hooks for managing projects, folders, and documents.
 * Provides reactive state management with localStorage sync.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Project,
  Folder,
  Document,
  ProjectUIState,
  ProjectTemplate,
  ProjectTreeNode,
} from '@/types/project';
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
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = () => {
      const data = projectStorage.getAll();
      setProjects(data);
      setLoading(false);
    };

    loadProjects();

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_projects_v1') {
        loadProjects();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createProject = useCallback((data: {
    name: string;
    description?: string;
    template?: ProjectTemplate;
    color?: string;
    icon?: string;
  }) => {
    const project = projectStorage.create(data);
    setProjects(prev => [...prev, project]);
    return project;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const updated = projectStorage.update(id, updates);
    if (updated) {
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  }, []);

  const deleteProject = useCallback((id: string) => {
    const success = projectStorage.delete(id);
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
    return success;
  }, []);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
  };
}

/**
 * Hook for managing folders in a project
 */
export function useFolders(projectId?: string) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFolders = () => {
      const data = projectId
        ? folderStorage.getByProject(projectId)
        : folderStorage.getAll();
      setFolders(data);
      setLoading(false);
    };

    loadFolders();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_folders_v1') {
        loadFolders();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [projectId]);

  const createFolder = useCallback((data: {
    name: string;
    projectId: string;
    parentFolderId?: string;
    color?: string;
    icon?: string;
  }) => {
    const folder = folderStorage.create(data);
    setFolders(prev => [...prev, folder]);
    return folder;
  }, []);

  const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
    const updated = folderStorage.update(id, updates);
    if (updated) {
      setFolders(prev => prev.map(f => f.id === id ? updated : f));
    }
    return updated;
  }, []);

  const deleteFolder = useCallback((id: string) => {
    const success = folderStorage.delete(id);
    if (success) {
      setFolders(prev => prev.filter(f => f.id !== id));
    }
    return success;
  }, []);

  const moveFolder = useCallback((id: string, parentFolderId?: string, projectId?: string) => {
    const updated = folderStorage.move(id, parentFolderId, projectId);
    if (updated) {
      setFolders(prev => prev.map(f => f.id === id ? updated : f));
    }
    return updated;
  }, []);

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
  };
}

/**
 * Hook for managing documents
 */
export function useDocuments(projectId?: string, folderId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = () => {
      let data: Document[];
      if (folderId) {
        data = documentStorage.getByFolder(folderId);
      } else if (projectId) {
        data = documentStorage.getByProject(projectId);
      } else {
        data = documentStorage.getAll();
      }
      setDocuments(data);
      setLoading(false);
    };

    loadDocuments();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_documents_v1') {
        loadDocuments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [projectId, folderId]);

  const createDocument = useCallback((data: {
    title: string;
    content?: string;
    projectId: string;
    folderId?: string;
    tags?: string[];
  }) => {
    const document = documentStorage.create(data);
    setDocuments(prev => [...prev, document]);
    return document;
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    const updated = documentStorage.update(id, updates);
    if (updated) {
      setDocuments(prev => prev.map(d => d.id === id ? updated : d));
    }
    return updated;
  }, []);

  const deleteDocument = useCallback((id: string) => {
    const success = documentStorage.delete(id);
    if (success) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
    return success;
  }, []);

  const moveDocument = useCallback((id: string, folderId?: string, projectId?: string) => {
    const updated = documentStorage.move(id, folderId, projectId);
    if (updated) {
      setDocuments(prev => prev.map(d => d.id === id ? updated : d));
    }
    return updated;
  }, []);

  return {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    moveDocument,
  };
}

/**
 * Hook for UI state (expanded folders, selected items, etc.)
 */
export function useProjectUIState() {
  const [uiState, setUIState] = useState<ProjectUIState>(uiStateStorage.get());

  useEffect(() => {
    const loadState = () => {
      setUIState(uiStateStorage.get());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hustle_ui_state_v1') {
        loadState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateUIState = useCallback((updates: Partial<ProjectUIState>) => {
    uiStateStorage.update(updates);
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleFolder = useCallback((folderId: string) => {
    uiStateStorage.toggleFolder(folderId);
    setUIState(uiStateStorage.get());
  }, []);

  const toggleProject = useCallback((projectId: string) => {
    uiStateStorage.toggleProject(projectId);
    setUIState(uiStateStorage.get());
  }, []);

  const selectDocument = useCallback((documentId: string) => {
    updateUIState({ selectedDocumentId: documentId });
  }, [updateUIState]);

  const selectProject = useCallback((projectId: string) => {
    updateUIState({ selectedProjectId: projectId });
  }, [updateUIState]);

  return {
    uiState,
    updateUIState,
    toggleFolder,
    toggleProject,
    selectDocument,
    selectProject,
  };
}

/**
 * Build hierarchical tree structure for rendering
 */
export function buildProjectTree(
  projects: Project[],
  folders: Folder[],
  documents: Document[],
  expandedProjects: string[],
  expandedFolders: string[]
): ProjectTreeNode[] {
  const projectNodes: ProjectTreeNode[] = [];

  // Sort projects by order (or alphabetically)
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));

  for (const project of sortedProjects) {
    const isExpanded = expandedProjects.includes(project.id);

    const projectNode: ProjectTreeNode = {
      type: 'project',
      id: project.id,
      name: project.name,
      icon: project.icon,
      color: project.color,
      isExpanded,
      order: 0,
      data: project,
      children: [],
    };

    if (isExpanded) {
      // Get root-level folders (no parent)
      const rootFolders = folders
        .filter(f => f.projectId === project.id && !f.parentFolderId)
        .sort((a, b) => a.order - b.order);

      // Recursive function to build folder tree
      const buildFolderNode = (folder: Folder): ProjectTreeNode => {
        const isFolderExpanded = expandedFolders.includes(folder.id);

        const folderNode: ProjectTreeNode = {
          type: 'folder',
          id: folder.id,
          name: folder.name,
          icon: folder.icon,
          color: folder.color,
          isExpanded: isFolderExpanded,
          order: folder.order,
          data: folder,
          children: [],
        };

        if (isFolderExpanded) {
          // Get child folders
          const childFolders = folders
            .filter(f => f.parentFolderId === folder.id)
            .sort((a, b) => a.order - b.order)
            .map(buildFolderNode);

          // Get documents in this folder
          const docs = documents
            .filter(d => d.folderId === folder.id)
            .sort((a, b) => a.order - b.order)
            .map(doc => ({
              type: 'document' as const,
              id: doc.id,
              name: doc.title,
              order: doc.order,
              data: doc,
            }));

          folderNode.children = [...childFolders, ...docs];
        }

        return folderNode;
      };

      // Build folder tree
      const folderNodes = rootFolders.map(buildFolderNode);

      // Get root-level documents (not in any folder)
      const rootDocs = documents
        .filter(d => d.projectId === project.id && !d.folderId)
        .sort((a, b) => a.order - b.order)
        .map(doc => ({
          type: 'document' as const,
          id: doc.id,
          name: doc.title,
          order: doc.order,
          data: doc,
        }));

      projectNode.children = [...folderNodes, ...rootDocs];
    }

    projectNodes.push(projectNode);
  }

  return projectNodes;
}
