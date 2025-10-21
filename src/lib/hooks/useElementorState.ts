import { useState, useEffect, useCallback } from 'react';

interface ElementorState {
  currentJson: any;
  setCurrentJson: (json: any) => void;
  history: any[];
  historyIndex: number;
  mockupImages: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  setMockupImages: (images: any) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  applyPatch: (patches: any[]) => void;
  addToHistory: (json: any) => void;
}

/**
 * useElementorState - State management for Elementor JSON Editor
 * Converted from original state-manager.js class to React hook
 */
export function useElementorState(): ElementorState {
  const [currentJson, setCurrentJsonState] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [mockupImages, setMockupImages] = useState<any>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('elementor-editor-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentJsonState(parsed.currentJson || {});
        setHistory(parsed.history || [parsed.currentJson || {}]);
        setHistoryIndex(parsed.historyIndex || 0);
        setMockupImages(parsed.mockupImages || {});
      } catch (e) {
        console.error('Failed to load Elementor state:', e);
        // Initialize with empty state
        setHistory([{}]);
      }
    } else {
      // Initialize with empty history
      setHistory([{}]);
    }
  }, []);

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('elementor-editor-state', JSON.stringify({
        currentJson,
        history,
        historyIndex,
        mockupImages,
      }));
    }
  }, [currentJson, history, historyIndex, mockupImages]);

  // Set current JSON and add to history
  const setCurrentJson = useCallback((json: any) => {
    setCurrentJsonState(json);
    addToHistory(json);
  }, []);

  // Add to history (for undo/redo)
  const addToHistory = useCallback((json: any) => {
    setHistory(prev => {
      // Remove any history after current index (when making new changes after undo)
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      newHistory.push(json);
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistoryIndex(newHistory.length - 1);
      } else {
        setHistoryIndex(newHistory.length - 1);
      }
      return newHistory;
    });
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentJsonState(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentJsonState(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Apply JSON Patch and add to history
  const applyPatch = useCallback(async (patches: any[]) => {
    try {
      // Dynamically import json-diff module
      const { JsonDiff } = await import('@/lib/elementor/json-diff');
      const differ = new (JsonDiff as any)();

      // Apply patches to current JSON
      const newJson = differ.applyPatch(currentJson, patches);

      // Update state and add to history
      setCurrentJsonState(newJson);
      addToHistory(newJson);

      return { success: true, json: newJson };
    } catch (error: any) {
      console.error('Failed to apply patch:', error);
      return { success: false, error: error.message };
    }
  }, [currentJson, addToHistory]);

  return {
    currentJson,
    setCurrentJson,
    history,
    historyIndex,
    mockupImages,
    setMockupImages,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    applyPatch,
    addToHistory,
  };
}
