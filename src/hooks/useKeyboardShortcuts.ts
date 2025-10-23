'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutHandler {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[], enabled = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in input fields
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' ||
                         target.tagName === 'TEXTAREA' ||
                         target.contentEditable === 'true';

    for (const shortcut of shortcuts) {
      // Check if the key matches
      const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
      if (!keyMatches) continue;

      // Check modifiers
      const ctrlRequired = shortcut.modifiers?.includes('ctrl') || shortcut.modifiers?.includes('meta');
      const shiftRequired = shortcut.modifiers?.includes('shift');
      const altRequired = shortcut.modifiers?.includes('alt');

      // Use metaKey for Mac Command key, ctrlKey for Windows/Linux Ctrl
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const ctrlPressed = isMac ? e.metaKey : e.ctrlKey;

      const ctrlMatch = ctrlRequired ? ctrlPressed : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shiftRequired ? e.shiftKey : !e.shiftKey;
      const altMatch = altRequired ? e.altKey : !e.altKey;

      if (ctrlMatch && shiftMatch && altMatch) {
        // Special handling for certain shortcuts that should work in input fields
        const allowInInput = shortcut.key === '?' || shortcut.key === 'k' && ctrlRequired;

        if (!isInputField || allowInInput) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          break;
        }
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Helper to check if user is on Mac
export function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toLowerCase().includes('mac');
}

// Helper to format shortcut for display
export function formatShortcut(key: string, modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]): string {
  const isMac = isMacOS();
  const parts: string[] = [];

  if (modifiers) {
    modifiers.forEach(mod => {
      if (mod === 'ctrl' || mod === 'meta') {
        parts.push(isMac ? '⌘' : 'Ctrl');
      } else if (mod === 'shift') {
        parts.push(isMac ? '⇧' : 'Shift');
      } else if (mod === 'alt') {
        parts.push(isMac ? '⌥' : 'Alt');
      }
    });
  }

  parts.push(key.toUpperCase());
  return parts.join(isMac ? '' : '+');
}
