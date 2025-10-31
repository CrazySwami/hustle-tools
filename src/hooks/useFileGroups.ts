/**
 * useFileGroups Hook
 *
 * React hook for managing file groups in the Code Editor.
 * Provides state management and actions for file groups.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FileGroup,
  EditorState,
  loadEditorState,
  saveEditorState,
  createGroup,
  addGroup,
  updateGroup,
  updateGroupContent,
  renameGroup,
  deleteGroup,
  setActiveGroup as setActiveGroupManager,
  duplicateGroup,
  getActiveGroup,
  migrateFromOldFormat,
  saveGroupToLibrary,
  loadGroupFromLibrary,
} from '@/lib/file-group-manager';

export interface UseFileGroupsReturn {
  // State
  groups: FileGroup[];
  activeGroup: FileGroup | null;
  activeGroupId: string | null;

  // Actions
  createNewGroup: (name: string, type: 'html' | 'php', template?: string) => FileGroup;
  selectGroup: (id: string) => void;
  updateGroupFile: (id: string, file: 'html' | 'css' | 'js' | 'php', content: string) => void;
  renameGroup: (id: string, name: string) => void;
  duplicateGroup: (id: string) => FileGroup | null;
  deleteGroup: (id: string) => void;
  saveToLibrary: (id: string) => void;
  loadFromLibrary: (libraryId: string) => FileGroup | null;

  // Utilities
  refresh: () => void;
}

/**
 * Custom hook for managing file groups
 */
export function useFileGroups(): UseFileGroupsReturn {
  const [state, setState] = useState<EditorState>(() => {
    // Try to migrate from old format on first load
    migrateFromOldFormat();
    return loadEditorState();
  });

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'elementor-editor-groups') {
        setState(loadEditorState());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Refresh state from localStorage
  const refresh = useCallback(() => {
    setState(loadEditorState());
  }, []);

  // Create new group
  const createNewGroup = useCallback((
    name: string,
    type: 'html' | 'php',
    template?: string
  ): FileGroup => {
    const group = createGroup(name, type, template as any);
    addGroup(group);
    setState(loadEditorState());
    return group;
  }, []);

  // Select active group
  const selectGroup = useCallback((id: string) => {
    setActiveGroupManager(id);
    setState(loadEditorState());
  }, []);

  // Update file content
  const updateGroupFile = useCallback((
    id: string,
    file: 'html' | 'css' | 'js' | 'php',
    content: string
  ) => {
    updateGroupContent(id, file, content);
    setState(loadEditorState());
  }, []);

  // Rename group
  const renameGroupAction = useCallback((id: string, name: string) => {
    renameGroup(id, name);
    setState(loadEditorState());
  }, []);

  // Duplicate group
  const duplicateGroupAction = useCallback((id: string): FileGroup | null => {
    const duplicate = duplicateGroup(id);
    if (duplicate) {
      setState(loadEditorState());
    }
    return duplicate;
  }, []);

  // Delete group
  const deleteGroupAction = useCallback((id: string) => {
    deleteGroup(id);
    setState(loadEditorState());
  }, []);

  // Save to library
  const saveToLibraryAction = useCallback((id: string) => {
    const group = state.groups.find(g => g.id === id);
    if (group) {
      saveGroupToLibrary(group);
    }
  }, [state.groups]);

  // Load from library
  const loadFromLibraryAction = useCallback((libraryId: string): FileGroup | null => {
    const group = loadGroupFromLibrary(libraryId);
    if (group) {
      setState(loadEditorState());
    }
    return group;
  }, []);

  // Get active group
  const activeGroup = state.activeGroupId
    ? state.groups.find(g => g.id === state.activeGroupId) || null
    : null;

  return {
    groups: state.groups,
    activeGroup,
    activeGroupId: state.activeGroupId,
    createNewGroup,
    selectGroup,
    updateGroupFile,
    renameGroup: renameGroupAction,
    duplicateGroup: duplicateGroupAction,
    deleteGroup: deleteGroupAction,
    saveToLibrary: saveToLibraryAction,
    loadFromLibrary: loadFromLibraryAction,
    refresh,
  };
}
