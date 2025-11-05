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
  createNewGroup: (name: string, type: 'html' | 'php' | 'hubspot', template?: string) => FileGroup;
  selectGroup: (id: string) => void;
  updateGroupFile: (id: string, file: 'html' | 'css' | 'js' | 'php' | 'hubl', content: string) => void;
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
    const initialState = loadEditorState();
    console.log('🏗️ useFileGroups: Initial state loaded:', {
      activeGroupId: initialState.activeGroupId,
      groupCount: initialState.groups.length,
    });
    return initialState;
  });

  // Log every time state changes
  console.log('🔄 useFileGroups: State render:', {
    activeGroupId: state.activeGroupId,
    activeGroupName: state.groups.find(g => g.id === state.activeGroupId)?.name,
    timestamp: new Date().toISOString(),
  });

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'elementor-editor-groups') {
        const newState = loadEditorState();
        console.log('🔄 [STORAGE_EVENT] setState() triggered:', {
          newActiveId: newState.activeGroupId,
          newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
          timestamp: new Date().toISOString(),
        });
        setState(newState);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Refresh state from localStorage
  const refresh = useCallback(() => {
    const newState = loadEditorState();
    console.log('🔄 [REFRESH] setState() triggered:', {
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  // Create new group
  const createNewGroup = useCallback((
    name: string,
    type: 'html' | 'php' | 'hubspot',
    template?: string
  ): FileGroup => {
    const group = createGroup(name, type, template as any);
    addGroup(group);
    const newState = loadEditorState();
    console.log('🔄 [CREATE_GROUP] setState() triggered:', {
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
    return group;
  }, []);

  // Select active group
  const selectGroup = useCallback((id: string) => {
    console.log('🎯 useFileGroups.selectGroup() called:', {
      requestedId: id,
      timestamp: new Date().toISOString(),
    });
    setActiveGroupManager(id);
    const newState = loadEditorState();
    console.log('📊 useFileGroups.selectGroup() after setActiveGroupManager:', {
      newActiveId: newState.activeGroupId,
      wasSuccessful: newState.activeGroupId === id,
    });

    // Update state IMMEDIATELY - this triggers re-render in all components using this hook
    console.log('🔄 [SELECT_GROUP] setState() triggered:', {
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  // Update file content
  const updateGroupFile = useCallback((
    id: string,
    file: 'html' | 'css' | 'js' | 'php' | 'hubl',
    content: string
  ) => {
    updateGroupContent(id, file, content);
    const newState = loadEditorState();
    console.log('🔄 [UPDATE_FILE] setState() triggered:', {
      groupId: id,
      fileType: file,
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  // Rename group
  const renameGroupAction = useCallback((id: string, name: string) => {
    renameGroup(id, name);
    const newState = loadEditorState();
    console.log('🔄 [RENAME_GROUP] setState() triggered:', {
      groupId: id,
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  // Duplicate group
  const duplicateGroupAction = useCallback((id: string): FileGroup | null => {
    const duplicate = duplicateGroup(id);
    if (duplicate) {
      const newState = loadEditorState();
      console.log('🔄 [DUPLICATE_GROUP] setState() triggered:', {
        groupId: id,
        newActiveId: newState.activeGroupId,
        newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
        timestamp: new Date().toISOString(),
      });
      setState(newState);
    }
    return duplicate;
  }, []);

  // Delete group
  const deleteGroupAction = useCallback((id: string) => {
    deleteGroup(id);
    const newState = loadEditorState();
    console.log('🔄 [DELETE_GROUP] setState() triggered:', {
      deletedGroupId: id,
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
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
      const newState = loadEditorState();
      console.log('🔄 [LOAD_FROM_LIBRARY] setState() triggered:', {
        libraryId,
        newActiveId: newState.activeGroupId,
        newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
        timestamp: new Date().toISOString(),
      });
      setState(newState);
    }
    return group;
  }, []);

  // Get active group - compute directly (no memoization to prevent stale references)
  const activeGroup = state.activeGroupId
    ? state.groups.find(g => g.id === state.activeGroupId) || null
    : null;

  // Return object directly (no memoization to ensure fresh reference on state changes)
  // This ensures components re-render immediately when state changes
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
