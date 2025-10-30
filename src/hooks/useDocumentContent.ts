/**
 * useDocumentContent Hook
 *
 * Global state management for document editor content (TiptapEditor).
 * Provides centralized access to document content for chat tools and AI operations.
 *
 * Features:
 * - Stores current document text content
 * - Provides getContent() for reading document
 * - Provides updateContent() for updating document
 * - Maintains undo/redo history stack
 * - Syncs with TiptapEditor instance
 *
 * Usage:
 * ```tsx
 * const { content, getContent, updateContent } = useDocumentContent();
 *
 * // Get document content
 * const documentText = getContent();
 *
 * // Update document
 * updateContent(newDocumentText);
 * ```
 */

import { create } from 'zustand';

interface DocumentState {
  // Content
  content: string;

  // Content getters/setters
  getContent: () => string;
  updateContent: (content: string) => void;

  // History management
  history: string[];
  historyIndex: number;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;
}

export const useDocumentContent = create<DocumentState>((set, get) => ({
  // Initial content
  content: '',

  // History state
  history: [],
  historyIndex: -1,

  /**
   * Get current document content
   * @returns Current document text
   */
  getContent: () => {
    return get().content;
  },

  /**
   * Update document content
   * @param content - New document content
   */
  updateContent: (content) => {
    set({ content });
  },

  /**
   * Push current state to history stack
   */
  pushToHistory: () => {
    const state = get();
    const currentContent = state.content;

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
      content: previousState,
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
      content: nextState,
      historyIndex: state.historyIndex + 1
    });
  }
}));
