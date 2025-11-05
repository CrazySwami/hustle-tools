/**
 * Project Manifest Editor Component
 *
 * Displays and edits the project documentation manifest.
 * Features:
 * - Markdown editor with live preview
 * - "Update Project Docs" button to regenerate with AI
 * - Manual editing capability
 * - Displays current manifest for all project types
 */

'use client';

import { useState } from 'react';
import { FileText, RefreshCw, Eye, Edit3 } from 'lucide-react';
import type { FileGroup } from '@/lib/file-group-manager';

interface ProjectManifestEditorProps {
  currentProject: FileGroup;
  onUpdate: (manifest: string) => void;
}

export function ProjectManifestEditor({ currentProject, onUpdate }: ProjectManifestEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editedManifest, setEditedManifest] = useState(currentProject.projectManifest || '');
  const [showPreview, setShowPreview] = useState(true);

  // Handle regeneration with AI (streaming)
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setEditedManifest(''); // Clear existing content
    setIsEditing(false); // Show preview mode to see streaming

    try {
      const response = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          projectName: currentProject.name,
          projectType: currentProject.type,
          isPlugin: currentProject.isPlugin,
          files: {
            html: currentProject.html,
            css: currentProject.css,
            js: currentProject.js,
            php: currentProject.php,
            hubl: currentProject.hubl,
            pluginMainFile: currentProject.pluginMainFile,
            widgetFiles: currentProject.widgetFiles,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate manifest');
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullManifest = '';

      if (reader) {
        console.log('📖 Starting to read manifest stream...');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ Manifest streaming complete:', fullManifest.length, 'characters');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          fullManifest += chunk;

          // Update manifest in real-time
          setEditedManifest(fullManifest);
          onUpdate(fullManifest); // Update parent state in real-time
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to regenerate manifest:', error);
      alert(`Failed to regenerate project docs: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle save
  const handleSave = () => {
    onUpdate(editedManifest);
    setIsEditing(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setEditedManifest(currentProject.projectManifest || '');
    setIsEditing(false);
  };

  const manifest = currentProject.projectManifest || '';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e1e',
      color: '#cccccc'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #3e3e3e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={18} color="#4CAF50" />
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff'
          }}>
            Project Documentation
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Preview/Raw Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: showPreview ? '#2a2d2e' : '#1e1e1e',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#cccccc',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {showPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            {showPreview ? 'Raw' : 'Preview'}
          </button>

          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#1e1e1e',
                border: '1px solid #3e3e3e',
                borderRadius: '4px',
                color: '#cccccc',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Edit3 size={14} />
              Edit
            </button>
          )}

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: isRegenerating ? '#2a2d2e' : '#007acc',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '12px',
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
              opacity: isRegenerating ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRegenerating ? 'spin 1s linear infinite' : 'none'
              }}
            />
            {isRegenerating ? 'Analyzing...' : 'Update Project Docs'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      }}>
        {isEditing ? (
          /* Edit Mode */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            height: '100%'
          }}>
            <textarea
              value={editedManifest}
              onChange={(e) => setEditedManifest(e.target.value)}
              placeholder="Enter project documentation in Markdown format..."
              style={{
                flex: 1,
                padding: '16px',
                background: '#2a2d2e',
                border: '1px solid #3e3e3e',
                borderRadius: '6px',
                color: '#cccccc',
                fontSize: '13px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none'
              }}
            />

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #3e3e3e',
                  borderRadius: '4px',
                  color: '#cccccc',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  background: '#007acc',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : showPreview ? (
          /* Preview Mode (Rendered Markdown) */
          <div
            className="markdown-preview"
            style={{
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#cccccc',
              maxWidth: '900px'
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(manifest) }}
          />
        ) : (
          /* Raw Mode */
          <pre style={{
            margin: 0,
            padding: '16px',
            background: '#2a2d2e',
            border: '1px solid #3e3e3e',
            borderRadius: '6px',
            color: '#cccccc',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'auto'
          }}>
            {manifest}
          </pre>
        )}
      </div>

      {/* Loading Indicator */}
      {isRegenerating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{
            background: '#2a2d2e',
            padding: '24px 32px',
            borderRadius: '8px',
            border: '1px solid #3e3e3e',
            textAlign: 'center'
          }}>
            <RefreshCw
              size={32}
              color="#007acc"
              style={{
                animation: 'spin 1s linear infinite',
                marginBottom: '12px'
              }}
            />
            <div style={{ fontSize: '14px', color: '#cccccc' }}>
              Analyzing project files with Gemini Flash...
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              This may take 10-30 seconds
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .markdown-preview h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 1px solid #3e3e3e;
          color: #ffffff;
        }

        .markdown-preview h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 32px 0 16px 0;
          color: #ffffff;
        }

        .markdown-preview h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 24px 0 12px 0;
          color: #e0e0e0;
        }

        .markdown-preview p {
          margin: 12px 0;
          line-height: 1.8;
        }

        .markdown-preview ul, .markdown-preview ol {
          margin: 12px 0;
          padding-left: 24px;
        }

        .markdown-preview li {
          margin: 6px 0;
        }

        .markdown-preview code {
          background: #2a2d2e;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          color: #4CAF50;
        }

        .markdown-preview pre {
          background: #2a2d2e;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 16px 0;
          border: 1px solid #3e3e3e;
        }

        .markdown-preview pre code {
          background: transparent;
          padding: 0;
          color: #cccccc;
        }

        .markdown-preview hr {
          border: none;
          border-top: 1px solid #3e3e3e;
          margin: 24px 0;
        }

        .markdown-preview blockquote {
          border-left: 3px solid #007acc;
          padding-left: 16px;
          margin: 16px 0;
          color: #aaaaaa;
          font-style: italic;
        }

        .markdown-preview a {
          color: #007acc;
          text-decoration: none;
        }

        .markdown-preview a:hover {
          text-decoration: underline;
        }

        .markdown-preview strong {
          font-weight: 600;
          color: #ffffff;
        }

        .markdown-preview em {
          font-style: italic;
          color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}

/**
 * Enhanced Markdown renderer
 * Handles common markdown syntax with proper escaping
 */
function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML first to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (must be before inline code)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code (must be before bold/italic to avoid conflicts)
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Bold (must be before italic)
  html = html.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>');

  // Headers (process in order: h3, h2, h1 to avoid conflicts)
  html = html.replace(/^### (.+)$/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gim, '<h1>$1</h1>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Horizontal rules
  html = html.replace(/^---+$/gim, '<hr>');

  // Unordered lists (handle multi-line)
  const lines = html.split('\n');
  let inList = false;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = /^[\-\*] (.+)$/.test(line);

    if (isListItem) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(line.replace(/^[\-\*] (.+)$/, '<li>$1</li>'));
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Paragraphs (split by double newlines, but preserve code blocks and lists)
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map(block => {
      block = block.trim();
      // Don't wrap if it's already a block element
      if (
        block.startsWith('<h') ||
        block.startsWith('<ul') ||
        block.startsWith('<pre') ||
        block.startsWith('<hr') ||
        block.startsWith('<li') ||
        block === ''
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}
