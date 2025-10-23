/**
 * DiffPreviewPanel Component
 *
 * Displays a Monaco DiffEditor showing the differences between original and modified code.
 * Includes Accept/Reject/Edit buttons for user approval flow.
 *
 * Features:
 * - Inline diff view (not side-by-side)
 * - Syntax highlighting for HTML/CSS/JS
 * - 70% opacity to indicate provisional status
 * - Green/red highlighting for additions/deletions
 * - Accept/Reject/Edit Manually buttons
 * - Keyboard shortcuts (Cmd+Enter to accept, Esc to reject)
 * - Diff navigation (next/previous change)
 *
 * Props:
 * - file: 'html' | 'css' | 'js'
 * - original: string
 * - modified: string
 * - unifiedDiff: string
 * - summary: { linesAdded, linesRemoved, hunks, instruction }
 * - onAccept: () => void
 * - onReject: () => void
 * - onManualEdit: () => void
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import type { editor } from 'monaco-editor';

interface DiffPreviewPanelProps {
  file: 'html' | 'css' | 'js';
  original: string;
  modified: string;
  unifiedDiff: string;
  summary: {
    linesAdded: number;
    linesRemoved: number;
    hunks: number;
    instruction: string;
    targetSection?: string | null;
  };
  onAccept: () => void;
  onReject: () => void;
  onManualEdit?: () => void;
}

export function DiffPreviewPanel({
  file,
  original,
  modified,
  unifiedDiff,
  summary,
  onAccept,
  onReject,
  onManualEdit,
}: DiffPreviewPanelProps) {
  const { theme } = useTheme();
  const [diffEditorInstance, setDiffEditorInstance] = useState<editor.IStandAloneDiffEditor | null>(null);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [totalChanges, setTotalChanges] = useState(summary.hunks);

  // Get file language for Monaco
  const language = file === 'js' ? 'javascript' : file;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+Enter or Ctrl+Enter to accept
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onAccept();
      }
      // Escape to reject
      if (e.key === 'Escape') {
        e.preventDefault();
        onReject();
      }
      // N or down arrow for next change
      if (e.key === 'n' || e.key === 'ArrowDown') {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          navigateToChange('next');
        }
      }
      // P or up arrow for previous change
      if (e.key === 'p' || e.key === 'ArrowUp') {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          navigateToChange('previous');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onAccept, onReject, currentChangeIndex]);

  // Navigate between diff changes
  const navigateToChange = (direction: 'next' | 'previous') => {
    if (!diffEditorInstance) return;

    if (direction === 'next') {
      setCurrentChangeIndex((prev) => Math.min(prev + 1, totalChanges - 1));
    } else {
      setCurrentChangeIndex((prev) => Math.max(prev - 1, 0));
    }

    // Use Monaco's diff navigator
    // Note: This is a simplified version. Full implementation would use
    // monaco.editor.createDiffNavigator(diffEditorInstance)
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--background)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        opacity: 0.95, // Slightly transparent to indicate provisional status
      }}
    >
      {/* Header with summary */}
      <div
        style={{
          padding: '16px',
          background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
            🔄 Proposed Changes ({file.toUpperCase()})
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
            Pending Approval
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
          {summary.instruction}
          {summary.targetSection && (
            <span style={{ color: 'var(--primary)', marginLeft: '8px' }}>
              → {summary.targetSection}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <span style={{ color: '#10b981' }}>
            +{summary.linesAdded} added
          </span>
          <span style={{ color: '#ef4444' }}>
            -{summary.linesRemoved} removed
          </span>
          <span style={{ color: 'var(--muted-foreground)' }}>
            {summary.hunks} {summary.hunks === 1 ? 'change' : 'changes'}
          </span>
        </div>
      </div>

      {/* Monaco Diff Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <DiffEditor
          original={original}
          modified={modified}
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            renderSideBySide: false, // Inline diff view
            enableSplitViewResizing: false,
            renderOverviewRuler: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderWhitespace: 'selection',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
          onMount={(editor) => {
            setDiffEditorInstance(editor);
            console.log('✅ Diff editor mounted');
          }}
        />
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: '16px',
          background: 'var(--muted)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <div style={{ marginRight: 'auto', fontSize: '12px', color: 'var(--muted-foreground)' }}>
          <kbd style={{ padding: '2px 6px', background: 'var(--background)', borderRadius: '4px', marginRight: '4px' }}>
            ⌘↵
          </kbd>
          Accept
          <kbd style={{ padding: '2px 6px', background: 'var(--background)', borderRadius: '4px', margin: '0 4px 0 16px' }}>
            Esc
          </kbd>
          Reject
        </div>

        {onManualEdit && (
          <button
            onClick={onManualEdit}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✏️ Edit Manually
          </button>
        )}

        <button
          onClick={onReject}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            color: '#ef4444',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef444410';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ✗ Reject
        </button>

        <button
          onClick={onAccept}
          style={{
            padding: '8px 20px',
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#10b981';
          }}
        >
          ✓ Accept
        </button>
      </div>

      {/* Diff navigation (if multiple changes) */}
      {totalChanges > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '8px',
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--muted-foreground)',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => navigateToChange('previous')}
            disabled={currentChangeIndex === 0}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: currentChangeIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentChangeIndex === 0 ? 0.5 : 1,
            }}
          >
            ↑
          </button>
          <span>
            {currentChangeIndex + 1} / {totalChanges}
          </span>
          <button
            onClick={() => navigateToChange('next')}
            disabled={currentChangeIndex === totalChanges - 1}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: currentChangeIndex === totalChanges - 1 ? 'not-allowed' : 'pointer',
              opacity: currentChangeIndex === totalChanges - 1 ? 0.5 : 1,
            }}
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}
