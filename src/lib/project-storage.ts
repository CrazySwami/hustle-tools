/**
 * Simplified storage layer - clean and minimal
 */

import { v4 as uuidv4 } from 'uuid';
import { Project, Folder, Document, ProjectUIState, STORAGE_KEYS } from '@/types/project';

// Helper to trigger storage event for same-tab updates
function triggerStorageEvent(key: string) {
  window.dispatchEvent(new StorageEvent('storage', {
    key,
    newValue: localStorage.getItem(key),
    oldValue: null,
    storageArea: localStorage,
    url: window.location.href,
  }));
}

// Helper to safely set localStorage with quota handling
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.error('❌ LocalStorage quota exceeded!');
      alert('Storage limit reached! Please delete some documents or export your data. The app will now clear old data to free up space.');

      // Try to free up space by removing oldest documents
      try {
        const docs = documentStorage.getAll();
        if (docs.length > 100) {
          // Keep only the 50 most recent documents
          const sorted = docs.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          const toKeep = sorted.slice(0, 50);
          localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(toKeep));
          console.log(`🧹 Cleaned up ${docs.length - 50} old documents`);

          // Try again
          localStorage.setItem(key, value);
          return true;
        }
      } catch (cleanupError) {
        console.error('Failed to clean up storage:', cleanupError);
      }

      return false;
    }
    throw error;
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

export const projectStorage = {
  getAll(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  create(name: string): Project {
    const now = new Date().toISOString();
    const projects = this.getAll();

    const project: Project = {
      id: uuidv4(),
      name,
      order: projects.length,
      createdAt: now,
      updatedAt: now,
    };

    projects.push(project);
    if (!safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))) {
      throw new Error('Failed to save project due to storage quota');
    }
    triggerStorageEvent(STORAGE_KEYS.PROJECTS);

    return project;
  },

  update(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | null {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    triggerStorageEvent(STORAGE_KEYS.PROJECTS);
    return projects[index];
  },

  delete(id: string): boolean {
    // Delete all documents in project
    const docs = documentStorage.getAll().filter(d => d.projectId === id);
    docs.forEach(doc => documentStorage.delete(doc.id));

    // Delete all folders in project
    const folders = folderStorage.getAll().filter(f => f.projectId === id);
    folders.forEach(folder => folderStorage.delete(folder.id));

    // Delete project
    const projects = this.getAll();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length === projects.length) return false;

    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    triggerStorageEvent(STORAGE_KEYS.PROJECTS);
    return true;
  },
};

// ============================================================================
// FOLDERS
// ============================================================================

export const folderStorage = {
  getAll(): Folder[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  },

  create(name: string, projectId: string): Folder {
    const now = new Date().toISOString();
    const folders = this.getAll();
    const projectFolders = folders.filter(f => f.projectId === projectId);

    const folder: Folder = {
      id: uuidv4(),
      name,
      projectId,
      order: projectFolders.length,
      createdAt: now,
      updatedAt: now,
    };

    folders.push(folder);
    if (!safeSetItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders))) {
      throw new Error('Failed to save folder due to storage quota');
    }
    triggerStorageEvent(STORAGE_KEYS.FOLDERS);

    return folder;
  },

  update(id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>): Folder | null {
    const folders = this.getAll();
    const index = folders.findIndex(f => f.id === id);
    if (index === -1) return null;

    folders[index] = {
      ...folders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    safeSetItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    triggerStorageEvent(STORAGE_KEYS.FOLDERS);
    return folders[index];
  },

  delete(id: string): boolean {
    // Delete all documents in folder
    const docs = documentStorage.getAll().filter(d => d.folderId === id);
    docs.forEach(doc => documentStorage.delete(doc.id));

    // Delete folder
    const folders = this.getAll();
    const filtered = folders.filter(f => f.id !== id);
    if (filtered.length === folders.length) return false;

    safeSetItem(STORAGE_KEYS.FOLDERS, JSON.stringify(filtered));
    triggerStorageEvent(STORAGE_KEYS.FOLDERS);
    return true;
  },
};

// ============================================================================
// DOCUMENTS
// ============================================================================

export const documentStorage = {
  getAll(): Document[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  },

  create(title: string, projectId: string, folderId?: string): Document {
    const now = new Date().toISOString();
    const documents = this.getAll();
    const siblings = folderId
      ? documents.filter(d => d.folderId === folderId)
      : documents.filter(d => d.projectId === projectId && !d.folderId);

    const document: Document = {
      id: uuidv4(),
      title,
      content: '<p></p>',
      projectId,
      folderId,
      order: siblings.length,
      createdAt: now,
      updatedAt: now,
    };

    documents.push(document);
    if (!safeSetItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents))) {
      throw new Error('Failed to save document due to storage quota');
    }
    triggerStorageEvent(STORAGE_KEYS.DOCUMENTS);

    return document;
  },

  update(id: string, updates: Partial<Omit<Document, 'id' | 'createdAt'>>): Document | null {
    const documents = this.getAll();
    const index = documents.findIndex(d => d.id === id);
    if (index === -1) return null;

    documents[index] = {
      ...documents[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (!safeSetItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents))) {
      console.error('Failed to save document update');
      return null;
    }
    triggerStorageEvent(STORAGE_KEYS.DOCUMENTS);
    return documents[index];
  },

  delete(id: string): boolean {
    const documents = this.getAll();
    const filtered = documents.filter(d => d.id !== id);
    if (filtered.length === documents.length) return false;

    safeSetItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filtered));
    triggerStorageEvent(STORAGE_KEYS.DOCUMENTS);
    return true;
  },
};

// ============================================================================
// UI STATE
// ============================================================================

export const uiStateStorage = {
  get(): ProjectUIState {
    if (typeof window === 'undefined') {
      return { expandedFolders: [], expandedProjects: [] };
    }

    const data = localStorage.getItem(STORAGE_KEYS.UI_STATE);
    return data ? JSON.parse(data) : { expandedFolders: [], expandedProjects: [] };
  },

  update(updates: Partial<ProjectUIState>): void {
    const current = this.get();
    const updated = { ...current, ...updates };
    safeSetItem(STORAGE_KEYS.UI_STATE, JSON.stringify(updated));
    triggerStorageEvent(STORAGE_KEYS.UI_STATE);
  },

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

  expandFolder(folderId: string): void {
    const state = this.get();
    const expanded = new Set(state.expandedFolders);
    expanded.add(folderId);
    this.update({ expandedFolders: Array.from(expanded) });
  },

  expandProject(projectId: string): void {
    const state = this.get();
    const expanded = new Set(state.expandedProjects);
    expanded.add(projectId);
    this.update({ expandedProjects: Array.from(expanded) });
  },
};
