'use client';

import { useEffect, useState } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const categorizedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Filter shortcuts by search query
  const filteredCategories = Object.entries(categorizedShortcuts).reduce((acc, [category, shortcuts]) => {
    const filtered = shortcuts.filter(s =>
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
    const parts: string[] = [];

    if (shortcut.modifiers) {
      shortcut.modifiers.forEach(mod => {
        if (mod === 'ctrl') {
          parts.push(isMac ? '⌘' : 'Ctrl');
        } else if (mod === 'shift') {
          parts.push(isMac ? '⇧' : 'Shift');
        } else if (mod === 'alt') {
          parts.push(isMac ? '⌥' : 'Alt');
        } else if (mod === 'meta') {
          parts.push(isMac ? '⌘' : 'Win');
        }
      });
    }

    parts.push(shortcut.key.toUpperCase());
    return parts.join(isMac ? '' : '+');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10001,
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: '#111827'
            }}>
              ⌨️ Keyboard Shortcuts
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Master your workflow with keyboard shortcuts
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Shortcuts List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px'
        }}>
          {Object.entries(filteredCategories).map(([category, shortcuts]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {category}
              </h3>

              <div style={{
                display: 'grid',
                gap: '8px'
              }}>
                {shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#f9fafb',
                      borderRadius: '6px'
                    }}
                  >
                    <span style={{
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {shortcut.description}
                    </span>

                    <kbd style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#111827',
                      fontFamily: 'monospace',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredCategories).length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ margin: 0, fontSize: '14px' }}>
                No shortcuts found for "{searchQuery}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#6b7280'
          }}>
            Press <kbd style={{
              padding: '2px 6px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              fontSize: '11px',
              fontFamily: 'monospace'
            }}>ESC</kbd> to close
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Got it!
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translate(-50%, -45%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
