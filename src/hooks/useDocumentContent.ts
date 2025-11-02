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
import { marked } from 'marked';

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
  content: `<h1>Welcome to Document Editor</h1><p>Start typing or use the AI chat to generate content. Try these features:</p><ul><li><strong>AI Chat</strong> - Ask the AI to write, edit, or research content</li><li><strong>Markdown Support</strong> - Toggle between rich text and raw markdown</li><li><strong>Comments</strong> - Add comments to any text selection</li><li><strong>Formatting</strong> - Use the toolbar or bubble menu for formatting</li></ul><p>Select any text to see AI editing options, or start a conversation in the chat panel on the left.</p>`,

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
   * @param content - New document content (HTML format from editor)
   * @param skipEditorUpdate - If true, only update state without touching editor (for user typing)
   */
  updateContent: async (content, skipEditorUpdate = false) => {
    const { editor } = get();
    console.log('💾 [STORE] updateContent called (skipEditorUpdate:', skipEditorUpdate, ')');
    if (editor && !skipEditorUpdate) {
      console.log('🔧 [STORE] Calling editor.commands.setContent (THIS RESETS CURSOR!)');
      // Content is already HTML, just set it directly
      editor.commands.setContent(content);
    } else if (skipEditorUpdate) {
      console.log('✅ [STORE] Skipping editor update (as intended)');
    }
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

    // Find the FIRST position where content differs (start of change)
    let diffStart = 0;
    const minLength = Math.min(oldContent.length, content.length);

    while (diffStart < minLength && oldContent[diffStart] === content[diffStart]) {
      diffStart++;
    }

    // Find the LAST position where content differs (end of change)
    // Work backwards from the end to find where content matches again
    let oldEnd = oldContent.length;
    let newEnd = content.length;

    while (oldEnd > diffStart && newEnd > diffStart &&
           oldContent[oldEnd - 1] === content[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }

    // Extract the unchanged suffix (bottom part that stays the same)
    const unchangedSuffix = content.slice(newEnd);

    // Extract only the changed middle portion (what needs to animate)
    const changedText = content.slice(diffStart, newEnd);

    if (changedText.length === 0) {
      set({ content });
      return;
    }

    // Start streaming animation
    updateStreamingState(editor.view, {
      isStreaming: true,
      from: diffStart,
      to: newEnd,
      streamedText: changedText,
      cursorPos: 0,
    });

    // Animate character by character
    const charsPerFrame = 3; // Speed of animation
    let currentPos = 0;

    const animateNextChunk = async () => {
      currentPos = Math.min(currentPos + charsPerFrame, changedText.length);

      // Build partial content: [unchanged top] + [streaming middle] + [unchanged bottom]
      const partialContent = oldContent.slice(0, diffStart) +
                             changedText.slice(0, currentPos) +
                             unchangedSuffix;

      // Convert markdown to HTML before setting content
      const htmlContent = await marked.parse(partialContent);

      // Update editor with partial content (reveals text progressively)
      editor.commands.setContent(htmlContent);

      // Update cursor position for purple highlight
      updateStreamingState(editor.view, {
        cursorPos: currentPos,
      });

      if (currentPos < changedText.length) {
        requestAnimationFrame(animateNextChunk);
      } else {
        // Animation complete - set final content and clean up
        setTimeout(async () => {
          const finalHtml = await marked.parse(content);
          editor.commands.setContent(finalHtml);
          // Store HTML, not markdown
          set({ content: finalHtml });
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
