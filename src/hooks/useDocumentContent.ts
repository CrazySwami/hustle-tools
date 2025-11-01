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
import type { Editor } from '@tiptap/core';

interface DocumentState {
  // Content
  content: string;

  // Editor instance (for streaming animations)
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;

  // Content getters/setters
  getContent: () => string;
  updateContent: (content: string) => void;
  updateContentWithAnimation: (content: string, oldContent: string) => Promise<void>;

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

  // Editor instance
  editor: null,

  // History state
  history: [],
  historyIndex: -1,

  /**
   * Set editor instance for streaming animations
   * @param editor - Tiptap editor instance
   */
  setEditor: (editor) => {
    set({ editor });
  },

  /**
   * Get current document content
   * @returns Current document text
   */
  getContent: () => {
    return get().content;
  },

  /**
   * Update document content (instant, no animation)
   * @param content - New document content
   */
  updateContent: (content) => {
    set({ content });
  },

  /**
   * Update document content with streaming animation
   * @param content - New document content
   * @param oldContent - Old document content (for diff calculation)
   */
  updateContentWithAnimation: async (content, oldContent) => {
    const { editor } = get();
    if (!editor) {
      // Fallback to instant update if no editor
      set({ content });
      return;
    }

    // Import streaming utilities dynamically
    const { updateStreamingState } = await import('@/components/editor/StreamingExtension');

    // Find the position where content differs
    let diffStart = 0;
    const minLength = Math.min(oldContent.length, content.length);

    while (diffStart < minLength && oldContent[diffStart] === content[diffStart]) {
      diffStart++;
    }

    const changedText = content.slice(diffStart);

    if (changedText.length === 0) {
      set({ content });
      return;
    }

    // Start streaming animation
    updateStreamingState(editor.view, {
      isStreaming: true,
      from: diffStart,
      to: content.length,
      streamedText: changedText,
      cursorPos: 0,
    });

    // Animate character by character
    const charsPerFrame = 3; // Speed of animation
    let currentPos = 0;

    const animateNextChunk = () => {
      currentPos = Math.min(currentPos + charsPerFrame, changedText.length);

      // Build partial content: old content up to diffStart + streamed portion
      const partialContent = oldContent.slice(0, diffStart) + changedText.slice(0, currentPos);

      // Update editor with partial content (reveals text progressively)
      editor.commands.setContent(partialContent);

      // Update cursor position for purple highlight
      updateStreamingState(editor.view, {
        cursorPos: currentPos,
      });

      if (currentPos < changedText.length) {
        requestAnimationFrame(animateNextChunk);
      } else {
        // Animation complete - set final content and clean up
        setTimeout(() => {
          editor.commands.setContent(content);
          set({ content });
          updateStreamingState(editor.view, {
            isStreaming: false,
            from: 0,
            to: 0,
            streamedText: '',
            cursorPos: 0,
          });
        }, 150);
      }
    };

    // Start animation (content will be revealed progressively)
    requestAnimationFrame(animateNextChunk);
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
