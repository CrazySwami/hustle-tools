/**
 * useEditorContent Hook
 *
 * Global state management for Monaco editor content (HTML/CSS/JS).
 * Provides centralized access to editor content for chat tools and AI operations.
 *
 * Features:
 * - Stores current HTML, CSS, and JavaScript content
 * - Provides getContent() for reading all or specific files
 * - Provides updateContent() for updating individual files
 * - Maintains undo/redo history stack
 * - Syncs with Monaco editor instances
 *
 * Usage:
 * ```tsx
 * const { html, css, js, getContent, updateContent } = useEditorContent();
 *
 * // Get specific file
 * const currentHTML = getContent(['html']);
 *
 * // Update CSS
 * updateContent('css', newCssCode);
 * ```
 */

import { create } from 'zustand';

export interface EditorContent {
  html: string;
  css: string;
  js: string;
}

interface EditorState extends EditorContent {
  // Content getters
  getContent: (files?: ('html' | 'css' | 'js')[]) => Partial<EditorContent>;

  // Content setters
  updateContent: (file: 'html' | 'css' | 'js', content: string) => void;
  setAllContent: (content: EditorContent) => void;

  // History management
  history: EditorContent[];
  historyIndex: number;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;
}

export const useEditorContent = create<EditorState>((set, get) => ({
  // Initial content
  html: '',
  css: '',
  js: '',

  // History state
  history: [],
  historyIndex: -1,

  /**
   * Get content for specific files or all files
   * @param files - Optional array of file types to retrieve
   * @returns Object containing requested file contents
   */
  getContent: (files) => {
    const state = get();

    if (!files || files.length === 0) {
      return {
        html: state.html,
        css: state.css,
        js: state.js
      };
    }

    const result: Partial<EditorContent> = {};
    files.forEach(file => {
      result[file] = state[file];
    });

    return result;
  },

  /**
   * Update content for a single file
   * @param file - File type to update
   * @param content - New content
   */
  updateContent: (file, content) => {
    set((state) => ({
      [file]: content
    }));
  },

  /**
   * Set all content at once (useful for loading sections)
   * @param content - Complete editor content
   */
  setAllContent: (content) => {
    set({
      html: content.html,
      css: content.css,
      js: content.js
    });
  },

  /**
   * Push current state to history stack
   */
  pushToHistory: () => {
    const state = get();
    const currentContent = {
      html: state.html,
      css: state.css,
      js: state.js
    };

    // Remove any redo history when new change is made
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentContent);

    // Limit history to 50 entries
    const limitedHistory = newHistory.slice(-50);

    set({
      history: limitedHistory,
      historyIndex: limitedHistory.length - 1
    });
  },

  /**
   * Check if undo is available
   */
  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  /**
   * Check if redo is available
   */
  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },

  /**
   * Undo to previous state
   */
  undo: () => {
    const state = get();
    if (!state.canUndo()) return;

    const previousState = state.history[state.historyIndex - 1];
    set({
      html: previousState.html,
      css: previousState.css,
      js: previousState.js,
      historyIndex: state.historyIndex - 1
    });
  },

  /**
   * Redo to next state
   */
  redo: () => {
    const state = get();
    if (!state.canRedo()) return;

    const nextState = state.history[state.historyIndex + 1];
    set({
      html: nextState.html,
      css: nextState.css,
      js: nextState.js,
      historyIndex: state.historyIndex + 1
    });
  }
}));
