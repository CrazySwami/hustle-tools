/**
 * Simplified project hierarchy - no templates, clean and minimal
 */

export interface Project {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  projectId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  projectId: string;
  folderId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// UI State
export interface ProjectUIState {
  expandedFolders: string[];
  expandedProjects: string[];
}

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'hustle_projects_v2',
  FOLDERS: 'hustle_folders_v2',
  DOCUMENTS: 'hustle_documents_v2',
  UI_STATE: 'hustle_ui_state_v2',
  DOCUMENT_STATES: 'hustle_document_states_v2', // New: store each document's content separately
} as const;
