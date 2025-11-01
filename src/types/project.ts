/**
 * ============================================================================
 * PROJECT HIERARCHY TYPE DEFINITIONS
 * ============================================================================
 *
 * Complete type system for project-based document organization.
 * Supports nested folders, document tagging, and AI-aware metadata.
 *
 * Storage: Currently localStorage, designed for easy migration to PostgreSQL
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;           // Hex color for visual organization
  icon?: string;            // Emoji or icon identifier
  createdAt: string;        // ISO date string
  updatedAt: string;
  userId?: string;          // For future multi-user support
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  defaultFolderId?: string;  // Where new docs go by default
  template?: ProjectTemplate;
  aiContextEnabled?: boolean; // Whether AI can see all docs in project
}

export type ProjectTemplate =
  | 'research'       // Research project with notes, sources, drafts
  | 'blog'           // Blog content with drafts, published, ideas
  | 'creative'       // Creative writing with chapters, characters, world-building
  | 'documentation'  // Technical docs with guides, API refs, tutorials
  | 'custom';        // User-defined structure

export interface Folder {
  id: string;
  name: string;
  projectId: string;        // Parent project ID
  parentFolderId?: string;  // For nested folders (null = root level)
  order: number;            // Manual sort order within parent
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;          // Full document content (Markdown/rich text)
  projectId: string;        // Parent project ID
  folderId?: string;        // Parent folder ID (null = project root)
  tags: string[];           // User-defined tags
  order: number;            // Manual sort order within folder/project
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;

  // Cached metadata for performance
  wordCount?: number;
  characterCount?: number;

  // AI-generated metadata
  summary?: string;         // AI-generated summary for context loading
  keywords?: string[];      // AI-extracted keywords
  relatedDocIds?: string[]; // AI-suggested related documents
}

// UI State (stored in localStorage separately)
export interface ProjectUIState {
  expandedFolders: string[];      // Array of folder IDs that are expanded
  expandedProjects: string[];     // Array of project IDs that are expanded
  selectedProjectId?: string;     // Currently active project
  selectedDocumentId?: string;    // Currently open document
  sidebarWidth: number;           // Resizable sidebar width in pixels
  viewMode: 'tree' | 'list' | 'grid';
  sortBy: 'name' | 'date' | 'custom';
}

// Hierarchy tree node (for rendering)
export interface ProjectTreeNode {
  type: 'project' | 'folder' | 'document';
  id: string;
  name: string;
  icon?: string;
  color?: string;
  children?: ProjectTreeNode[];
  isExpanded?: boolean;
  order: number;
  // Reference to original data
  data: Project | Folder | Document;
}

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'hustle_projects_v1',
  FOLDERS: 'hustle_folders_v1',
  DOCUMENTS: 'hustle_documents_v1',
  UI_STATE: 'hustle_ui_state_v1',
} as const;

// Default templates
export const PROJECT_TEMPLATES: Record<ProjectTemplate, {
  name: string;
  description: string;
  defaultFolders: string[];
  icon: string;
}> = {
  research: {
    name: 'Research Project',
    description: 'Organize research notes, sources, and drafts',
    defaultFolders: ['Notes', 'Sources', 'Drafts'],
    icon: '🔬',
  },
  blog: {
    name: 'Blog Content',
    description: 'Manage blog posts, ideas, and published content',
    defaultFolders: ['Ideas', 'Drafts', 'Published'],
    icon: '✍️',
  },
  creative: {
    name: 'Creative Writing',
    description: 'Write stories, novels, or creative content',
    defaultFolders: ['Chapters', 'Characters', 'World Building'],
    icon: '📖',
  },
  documentation: {
    name: 'Documentation',
    description: 'Technical documentation and guides',
    defaultFolders: ['Guides', 'API Reference', 'Tutorials'],
    icon: '📚',
  },
  custom: {
    name: 'Custom Project',
    description: 'Start with an empty project',
    defaultFolders: [],
    icon: '📁',
  },
};
