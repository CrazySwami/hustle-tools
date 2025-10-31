/**
 * Project Sidebar Component
 *
 * Shows list of all file groups (projects) on the left side.
 * Allows creating, selecting, renaming, and deleting groups.
 */

'use client';

import { useState } from 'react';
import { FileGroup } from '@/lib/file-group-manager';

interface ProjectSidebarProps {
  groups: FileGroup[];
  activeGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onCreateGroup: () => void;
  onSplitHtml?: () => void; // NEW: Opens HTML Splitter dialog
  onRenameGroup: (id: string, name: string) => void;
  onDuplicateGroup: (id: string) => void;
  onDeleteGroup: (id: string) => void;
  onSaveToLibrary: (id: string) => void;
}

export function ProjectSidebar({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onSplitHtml,
  onRenameGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onSaveToLibrary,
}: ProjectSidebarProps) {
  const [contextMenuGroupId, setContextMenuGroupId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Handle right-click on group
  const handleContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    setContextMenuGroupId(groupId);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenuGroupId(null);
    setContextMenuPosition(null);
  };

  // Start renaming
  const startRename = (group: FileGroup) => {
    setRenamingGroupId(group.id);
    setRenameValue(group.name);
    closeContextMenu();
  };

  // Save rename
  const saveRename = () => {
    if (renamingGroupId && renameValue.trim()) {
      onRenameGroup(renamingGroupId, renameValue.trim());
    }
    setRenamingGroupId(null);
  };

  // Handle delete with confirmation
  const handleDelete = (group: FileGroup) => {
    if (confirm(`Delete "${group.name}"?\n\nThis action cannot be undone.`)) {
      onDeleteGroup(group.id);
    }
    closeContextMenu();
  };

  // Handle duplicate
  const handleDuplicate = (groupId: string) => {
    onDuplicateGroup(groupId);
    closeContextMenu();
  };

  // Handle save to library
  const handleSaveToLibrary = (groupId: string) => {
    onSaveToLibrary(groupId);
    alert('✅ Saved to Section Library!');
    closeContextMenu();
  };

  // Close context menu when clicking outside
  if (contextMenuPosition) {
    const handleClickOutside = () => closeContextMenu();
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, { once: true });
    }, 0);
  }

  return (
    <div style={{
      width: '220px',
      background: '#252526',
      borderRight: '1px solid #3e3e3e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px',
        background: '#2d2d2d',
        borderBottom: '1px solid #3e3e3e'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#888',
            textTransform: 'uppercase'
          }}>
            Projects
          </span>
          <button
            onClick={onCreateGroup}
            style={{
              padding: '4px 10px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600
            }}
            title="Create new project"
          >
            + New
          </button>
        </div>

        {/* Split HTML Button */}
        {onSplitHtml && (
          <button
            onClick={onSplitHtml}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'transparent',
              color: '#007acc',
              border: '1px solid #007acc',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            title="Split full HTML page into sections"
          >
            <span>✂️</span>
            <span>Split HTML Page</span>
          </button>
        )}
      </div>

      {/* Group List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {groups.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#888',
            fontSize: '13px'
          }}>
            No projects yet.
            <br />
            Click "+ New" to create one.
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              onContextMenu={(e) => handleContextMenu(e, group.id)}
              style={{
                padding: '10px 12px',
                background: activeGroupId === group.id ? '#2d2d2d' : 'transparent',
                borderLeft: activeGroupId === group.id ? '3px solid #007acc' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeGroupId !== group.id) {
                  e.currentTarget.style.background = '#2a2d2e';
                }
              }}
              onMouseLeave={(e) => {
                if (activeGroupId !== group.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Active Indicator */}
              {activeGroupId === group.id && (
                <span style={{ fontSize: '10px', color: '#007acc' }}>▶</span>
              )}

              {/* Icon */}
              <span style={{ fontSize: '16px' }}>
                {group.type === 'html' ? '📦' : '🔧'}
              </span>

              {/* Name (editable) */}
              {renamingGroupId === group.id ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') setRenamingGroupId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    padding: '2px 4px',
                    background: '#1e1e1e',
                    border: '1px solid #007acc',
                    borderRadius: '2px',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              ) : (
                <span style={{
                  flex: 1,
                  fontSize: '13px',
                  fontWeight: activeGroupId === group.id ? 500 : 400,
                  color: activeGroupId === group.id ? '#ffffff' : '#cccccc',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {group.name}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenuPosition && contextMenuGroupId && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            background: '#2d2d2d',
            border: '1px solid #3e3e3e',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 10000,
            minWidth: '180px',
            overflow: 'hidden'
          }}
        >
          {[
            { label: 'Rename', onClick: () => startRename(groups.find(g => g.id === contextMenuGroupId)!) },
            { label: 'Duplicate', onClick: () => handleDuplicate(contextMenuGroupId) },
            { label: 'Save to Library', onClick: () => handleSaveToLibrary(contextMenuGroupId) },
            { label: 'divider' },
            { label: 'Delete', onClick: () => handleDelete(groups.find(g => g.id === contextMenuGroupId)!), danger: true },
          ].map((item, index) =>
            item.label === 'divider' ? (
              <div
                key={index}
                style={{
                  height: '1px',
                  background: '#3e3e3e',
                  margin: '4px 0'
                }}
              />
            ) : (
              <button
                key={index}
                onClick={item.onClick}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: item.danger ? '#f48771' : '#cccccc',
                  textAlign: 'left',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2d2e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}

      {/* Storage Info (at bottom) */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #3e3e3e',
        fontSize: '11px',
        color: '#888'
      }}>
        {groups.length} {groups.length === 1 ? 'project' : 'projects'}
      </div>
    </div>
  );
}
