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
  updateProjectState,
  renameGroup,
  deleteGroup,
  setActiveGroup as setActiveGroupManager,
  duplicateGroup,
  getActiveGroup,
  migrateFromOldFormat,
  saveGroupToLibrary,
  loadGroupFromLibrary,
  createPlugin,
  addWidgetToPlugin,
  removeWidgetFromPlugin,
  updateWidgetInPlugin,
  getAllPlugins,
} from '@/lib/file-group-manager';

export interface UseFileGroupsReturn {
  // State
  groups: FileGroup[];
  activeGroup: FileGroup | null;
  activeGroupId: string | null;

  // Actions
  createNewGroup: (name: string, type: 'html' | 'php' | 'hubspot', template?: string, generationState?: 'generating' | 'ready' | 'error') => FileGroup;
  selectGroup: (id: string) => void;
  updateGroupFile: (id: string, file: 'html' | 'css' | 'js' | 'php' | 'hubl', content: string) => void;
  updateGroup: (id: string, updates: Partial<FileGroup>) => void;
  updateProjectState: (id: string, state: 'generating' | 'ready' | 'error', error?: string) => void;
  renameGroup: (id: string, name: string) => void;
  duplicateGroup: (id: string) => FileGroup | null;
  deleteGroup: (id: string) => void;
  saveToLibrary: (id: string) => void;
  loadFromLibrary: (libraryId: string) => FileGroup | null;

  // Plugin Management (NEW)
  createNewPlugin: (name: string, description?: string) => FileGroup;
  addWidgetToPlugin: (pluginId: string, widgetName: string, widgetCode: string) => void;
  removeWidgetFromPlugin: (pluginId: string, widgetId: string) => void;
  updateWidgetInPlugin: (pluginId: string, widgetId: string, newCode: string) => void;
  getAllPlugins: () => FileGroup[];

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
    template?: string,
    generationState?: 'generating' | 'ready' | 'error',
    subtype?: string  // NEW: Add subtype parameter for HubSpot email/page distinction
  ): FileGroup => {
    const group = createGroup(name, type, template as any, generationState, subtype);
    addGroup(group);
    const newState = loadEditorState();
    console.log('🔄 [CREATE_GROUP] setState() triggered:', {
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      generationState: generationState,
      subtype: subtype,
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

  // Update project generation state
  const updateProjectStateAction = useCallback((
    id: string,
    state: 'generating' | 'ready' | 'error',
    error?: string
  ) => {
    updateProjectState(id, state, error);
    const newState = loadEditorState();
    console.log('🔄 [UPDATE_PROJECT_STATE] setState() triggered:', {
      groupId: id,
      generationState: state,
      error: error,
      newActiveId: newState.activeGroupId,
      newActiveGroupName: newState.groups.find(g => g.id === newState.activeGroupId)?.name,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  // Update group (generic - for updating any properties like projectManifest)
  const updateGroupAction = useCallback((id: string, updates: Partial<FileGroup>) => {
    updateGroup(id, updates);
    const newState = loadEditorState();
    console.log('🔄 [UPDATE_GROUP] setState() triggered:', {
      groupId: id,
      updates: Object.keys(updates),
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

  // Plugin management actions (NEW)
  const createNewPlugin = useCallback((name: string, description?: string): FileGroup => {
    const plugin = createPlugin(name, description);
    addGroup(plugin);
    const newState = loadEditorState();
    console.log('🔄 [CREATE_PLUGIN] setState() triggered:', {
      pluginName: name,
      newActiveId: newState.activeGroupId,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
    return plugin;
  }, []);

  const addWidgetToPluginAction = useCallback((pluginId: string, widgetName: string, widgetCode: string) => {
    addWidgetToPlugin(pluginId, widgetName, widgetCode);
    const newState = loadEditorState();
    console.log('🔄 [ADD_WIDGET] setState() triggered:', {
      pluginId,
      widgetName,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  const removeWidgetFromPluginAction = useCallback((pluginId: string, widgetId: string) => {
    removeWidgetFromPlugin(pluginId, widgetId);
    const newState = loadEditorState();
    console.log('🔄 [REMOVE_WIDGET] setState() triggered:', {
      pluginId,
      widgetId,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  const updateWidgetInPluginAction = useCallback((pluginId: string, widgetId: string, newCode: string) => {
    updateWidgetInPlugin(pluginId, widgetId, newCode);
    const newState = loadEditorState();
    console.log('🔄 [UPDATE_WIDGET] setState() triggered:', {
      pluginId,
      widgetId,
      timestamp: new Date().toISOString(),
    });
    setState(newState);
  }, []);

  const getAllPluginsAction = useCallback(() => {
    return getAllPlugins();
  }, []);

  // Return object directly (no memoization to ensure fresh reference on state changes)
  // This ensures components re-render immediately when state changes
  return {
    groups: state.groups,
    activeGroup,
    activeGroupId: state.activeGroupId,
    createNewGroup,
    selectGroup,
    updateGroupFile,
    updateGroup: updateGroupAction,
    updateProjectState: updateProjectStateAction,
    renameGroup: renameGroupAction,
    duplicateGroup: duplicateGroupAction,
    deleteGroup: deleteGroupAction,
    saveToLibrary: saveToLibraryAction,
    loadFromLibrary: loadFromLibraryAction,
    createNewPlugin,
    addWidgetToPlugin: addWidgetToPluginAction,
    removeWidgetFromPlugin: removeWidgetFromPluginAction,
    updateWidgetInPlugin: updateWidgetInPluginAction,
    getAllPlugins: getAllPluginsAction,
    refresh,
  };
}
