/**
 * ============================================================================
 * PROJECT STORAGE ABSTRACTION LAYER
 * ============================================================================
 *
 * Storage interface for projects, folders, and documents.
 * Currently uses localStorage, but designed for easy migration to:
 * - Supabase/PostgreSQL
 * - IndexedDB
 * - MongoDB
 *
 * Just swap implementation, keep same API!
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  Folder,
  Document,
  ProjectUIState,
  STORAGE_KEYS,
  PROJECT_TEMPLATES,
  ProjectTemplate,
} from '@/types/project';

// ============================================================================
// PROJECTS
// ============================================================================

export const projectStorage = {
  /**
   * Get all projects
   */
  getAll(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get single project by ID
   */
  getById(id: string): Project | null {
    const projects = this.getAll();
    return projects.find(p => p.id === id) || null;
  },

  /**
   * Create new project
   */
  create(data: {
    name: string;
    description?: string;
    template?: ProjectTemplate;
    color?: string;
    icon?: string;
  }): Project {
    const now = new Date().toISOString();
    const template = data.template || 'custom';
    const templateInfo = PROJECT_TEMPLATES[template];

    const project: Project = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      color: data.color || '#6366f1', // Default indigo
      icon: data.icon || templateInfo.icon,
      createdAt: now,
      updatedAt: now,
      settings: {
        template,
        aiContextEnabled: true,
      },
    };

    const projects = this.getAll();
    projects.push(project);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    // Create default folders if template specified
    if (templateInfo.defaultFolders.length > 0) {
      templateInfo.defaultFolders.forEach((folderName, index) => {
        folderStorage.create({
          name: folderName,
          projectId: project.id,
          order: index,
        });
      });
    }

    return project;
  },

  /**
   * Update project
   */
  update(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | null {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) return null;

    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return projects[index];
  },

  /**
   * Delete project (and all its folders and documents!)
   */
  delete(id: string): boolean {
    // Delete all documents in project
    const docs = documentStorage.getByProject(id);
    docs.forEach(doc => documentStorage.delete(doc.id));

    // Delete all folders in project
    const folders = folderStorage.getByProject(id);
    folders.forEach(folder => folderStorage.delete(folder.id));

    // Delete project
    const projects = this.getAll();
    const filtered = projects.filter(p => p.id !== id);

    if (filtered.length === projects.length) return false;

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    return true;
  },
};

// ============================================================================
// FOLDERS
// ============================================================================

export const folderStorage = {
  /**
   * Get all folders
   */
  getAll(): Folder[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get folder by ID
   */
  getById(id: string): Folder | null {
    const folders = this.getAll();
    return folders.find(f => f.id === id) || null;
  },

  /**
   * Get all folders in a project
   */
  getByProject(projectId: string): Folder[] {
    return this.getAll().filter(f => f.projectId === projectId);
  },

  /**
   * Get child folders of a parent folder
   */
  getChildren(parentFolderId: string): Folder[] {
    return this.getAll().filter(f => f.parentFolderId === parentFolderId);
  },

  /**
   * Create new folder
   */
  create(data: {
    name: string;
    projectId: string;
    parentFolderId?: string;
    color?: string;
    icon?: string;
    order?: number;
  }): Folder {
    const now = new Date().toISOString();

    // Calculate order if not provided
    let order = data.order ?? 0;
    if (data.order === undefined) {
      const siblings = data.parentFolderId
        ? this.getChildren(data.parentFolderId)
        : this.getByProject(data.projectId).filter(f => !f.parentFolderId);
      order = siblings.length;
    }

    const folder: Folder = {
      id: uuidv4(),
      name: data.name,
      projectId: data.projectId,
      parentFolderId: data.parentFolderId,
      order,
      color: data.color,
      icon: data.icon,
      createdAt: now,
      updatedAt: now,
    };

    const folders = this.getAll();
    folders.push(folder);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));

    return folder;
  },

  /**
   * Update folder
   */
  update(id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>): Folder | null {
    const folders = this.getAll();
    const index = folders.findIndex(f => f.id === id);

    if (index === -1) return null;

    folders[index] = {
      ...folders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    return folders[index];
  },

  /**
   * Delete folder (and all documents inside!)
   */
  delete(id: string): boolean {
    // Delete all documents in folder
    const docs = documentStorage.getByFolder(id);
    docs.forEach(doc => documentStorage.delete(doc.id));

    // Delete all child folders recursively
    const childFolders = this.getChildren(id);
    childFolders.forEach(child => this.delete(child.id));

    // Delete folder
    const folders = this.getAll();
    const filtered = folders.filter(f => f.id !== id);

    if (filtered.length === folders.length) return false;

    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(filtered));
    return true;
  },

  /**
   * Move folder to new parent
   */
  move(id: string, newParentFolderId?: string, newProjectId?: string): Folder | null {
    return this.update(id, {
      parentFolderId: newParentFolderId,
      projectId: newProjectId || undefined,
    });
  },
};

// ============================================================================
// DOCUMENTS
// ============================================================================

export const documentStorage = {
  /**
   * Get all documents
   */
  getAll(): Document[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get document by ID
   */
  getById(id: string): Document | null {
    const docs = this.getAll();
    return docs.find(d => d.id === id) || null;
  },

  /**
   * Get all documents in a project
   */
  getByProject(projectId: string): Document[] {
    return this.getAll().filter(d => d.projectId === projectId);
  },

  /**
   * Get all documents in a folder
   */
  getByFolder(folderId: string): Document[] {
    return this.getAll().filter(d => d.folderId === folderId);
  },

  /**
   * Get documents by tag
   */
  getByTag(tag: string): Document[] {
    return this.getAll().filter(d => d.tags.includes(tag));
  },

  /**
   * Search documents by content
   */
  search(query: string): Document[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(d =>
      d.title.toLowerCase().includes(lowerQuery) ||
      d.content.toLowerCase().includes(lowerQuery) ||
      d.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * Create new document
   */
  create(data: {
    title: string;
    content?: string;
    projectId: string;
    folderId?: string;
    tags?: string[];
    order?: number;
  }): Document {
    const now = new Date().toISOString();
    const content = data.content || '';

    // Calculate word count and character count
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = content.length;

    // Calculate order if not provided
    let order = data.order ?? 0;
    if (data.order === undefined) {
      const siblings = data.folderId
        ? this.getByFolder(data.folderId)
        : this.getByProject(data.projectId).filter(d => !d.folderId);
      order = siblings.length;
    }

    const document: Document = {
      id: uuidv4(),
      title: data.title,
      content,
      projectId: data.projectId,
      folderId: data.folderId,
      tags: data.tags || [],
      order,
      createdAt: now,
      updatedAt: now,
      lastEditedAt: now,
      wordCount,
      characterCount,
    };

    const docs = this.getAll();
    docs.push(document);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));

    return document;
  },

  /**
   * Update document
   */
  update(id: string, updates: Partial<Omit<Document, 'id' | 'createdAt'>>): Document | null {
    const docs = this.getAll();
    const index = docs.findIndex(d => d.id === id);

    if (index === -1) return null;

    const now = new Date().toISOString();

    // Recalculate counts if content changed
    let wordCount = docs[index].wordCount;
    let characterCount = docs[index].characterCount;

    if (updates.content !== undefined) {
      const content = updates.content;
      wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
      characterCount = content.length;
    }

    docs[index] = {
      ...docs[index],
      ...updates,
      wordCount,
      characterCount,
      updatedAt: now,
      lastEditedAt: now,
    };

    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    return docs[index];
  },

  /**
   * Delete document
   */
  delete(id: string): boolean {
    const docs = this.getAll();
    const filtered = docs.filter(d => d.id !== id);

    if (filtered.length === docs.length) return false;

    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filtered));
    return true;
  },

  /**
   * Move document to different folder/project
   */
  move(id: string, folderId?: string, projectId?: string): Document | null {
    return this.update(id, {
      folderId,
      projectId: projectId || undefined,
    });
  },
};

// ============================================================================
// UI STATE
// ============================================================================

export const uiStateStorage = {
  /**
   * Get UI state
   */
  get(): ProjectUIState {
    if (typeof window === 'undefined') {
      return {
        expandedFolders: [],
        expandedProjects: [],
        sidebarWidth: 280,
        viewMode: 'tree',
        sortBy: 'custom',
      };
    }

    const data = localStorage.getItem(STORAGE_KEYS.UI_STATE);
    return data ? JSON.parse(data) : {
      expandedFolders: [],
      expandedProjects: [],
      sidebarWidth: 280,
      viewMode: 'tree',
      sortBy: 'custom',
    };
  },

  /**
   * Update UI state
   */
  update(updates: Partial<ProjectUIState>): void {
    const current = this.get();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(updated));
  },

  /**
   * Toggle folder expanded state
   */
  toggleFolder(folderId: string): void {
    const state = this.get();
    const expanded = new Set(state.expandedFolders);

    if (expanded.has(folderId)) {
      expanded.delete(folderId);
    } else {
      expanded.add(folderId);
    }

    this.update({ expandedFolders: Array.from(expanded) });
  },

  /**
   * Toggle project expanded state
   */
  toggleProject(projectId: string): void {
    const state = this.get();
    const expanded = new Set(state.expandedProjects);

    if (expanded.has(projectId)) {
      expanded.delete(projectId);
    } else {
      expanded.add(projectId);
    }

    this.update({ expandedProjects: Array.from(expanded) });
  },
};
