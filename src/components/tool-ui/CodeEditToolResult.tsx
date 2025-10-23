/**
 * CodeEditToolResult Component
 *
 * Renders in the chat interface when AI suggests code edits.
 * Shows a summary of proposed changes with options to:
 * - View full diff in editor
 * - Quick accept/reject from chat
 * - See change statistics
 *
 * This component appears as a tool result in the chat message stream.
 */

'use client';

import { useState } from 'react';
import { useEditorContent } from '@/hooks/useEditorContent';

interface CodeEditToolResultProps {
  file: 'html' | 'css' | 'js';
  instruction: string;
  targetSection?: string | null;
  status: 'pending_diff_generation' | 'generating' | 'ready' | 'error';
  error?: string;
}

export function CodeEditToolResult({
  file,
  instruction,
  targetSection,
  status,
  error,
}: CodeEditToolResultProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { getContent, setPendingDiff } = useEditorContent();

  const generateDiff = async () => {
    setIsGenerating(true);

    try {
      // Get current editor content
      const content = getContent();

      // Call /api/edit-code to generate diff
      const response = await fetch('/api/edit-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: content,
          instruction,
          file,
          targetSection,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate diff');
      }

      const diffData = await response.json();

      // Set pending diff in global state (this will trigger DiffPreviewPanel to show)
      setPendingDiff({
        file: diffData.file,
        original: diffData.original,
        modified: diffData.modified,
        unifiedDiff: diffData.unifiedDiff,
      });

      console.log('✅ Diff generated and ready for preview');
    } catch (err) {
      console.error('❌ Error generating diff:', err);
      alert(
        `Failed to generate code changes: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <div
        style={{
          padding: '16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginTop: '8px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
          ❌ Code Edit Error
        </div>
        <div style={{ fontSize: '13px', color: '#991b1b' }}>{error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        marginTop: '8px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '20px' }}>🔄</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
            Code Edit Proposal
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
            {file.toUpperCase()} File
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div
        style={{
          padding: '12px',
          background: 'var(--background)',
          borderRadius: '6px',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
          Instruction:
        </div>
        <div style={{ fontSize: '13px', color: 'var(--foreground)' }}>
          {instruction}
        </div>
        {targetSection && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--primary)',
              marginTop: '8px',
            }}
          >
            Target: {targetSection}
          </div>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={generateDiff}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: isGenerating ? 'var(--muted)' : '#10b981',
          color: isGenerating ? 'var(--muted-foreground)' : '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin">⏳</span>
            Generating diff...
          </>
        ) : (
          <>👁️ Generate & View Diff</>
        )}
      </button>

      {/* Help text */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          textAlign: 'center',
        }}
      >
        Click to generate a preview of the proposed changes. You'll be able to review and approve before
        applying.
      </div>
    </div>
  );
}
