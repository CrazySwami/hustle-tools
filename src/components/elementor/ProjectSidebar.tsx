/**
 * Project Sidebar Component
 *
 * Shows list of all file groups (projects) on the left side.
 * Allows creating, selecting, renaming, and deleting groups.
 */

'use client';

import { useState, useEffect } from 'react';
import { FileGroup } from '@/lib/file-group-manager';
import { AiFillHtml5 } from 'react-icons/ai';
import { FaWordpress } from 'react-icons/fa';
import { SiHubspot } from 'react-icons/si';

interface ProjectSidebarProps {
  groups: FileGroup[];
  activeGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onCreateGroup: () => void;
  onSplitHtml?: () => void; // NEW: Opens HTML Splitter dialog
  onClose?: () => void; // NEW: Close sidebar (for mobile)
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
  onClose,
  onRenameGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onSaveToLibrary,
}: ProjectSidebarProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [contextMenuGroupId, setContextMenuGroupId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);

  // Prevent hydration mismatch - only render actual content after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  // Close dropdown menu when clicking outside
  useEffect(() => {
    if (openMenuGroupId) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-menu-container]')) {
          setOpenMenuGroupId(null);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuGroupId]);

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      width: isMobile ? '100vw' : '220px',
      height: isMobile ? '100vh' : 'auto',
      position: isMobile ? 'fixed' : 'relative',
      top: isMobile ? 0 : 'auto',
      left: isMobile ? 0 : 'auto',
      zIndex: isMobile ? 9999 : 'auto',
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            {/* Close button (mobile only) */}
            {isMobile && onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#cccccc',
                  border: '1px solid #3e3e3e',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
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
        {!hasMounted ? (
          // Show placeholder during SSR to prevent hydration mismatch
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#888',
            fontSize: '13px'
          }}>
            Loading...
          </div>
        ) : groups.length === 0 ? (
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
              onClick={() => {
                console.log('🖱️ ProjectSidebar: User clicked project:', {
                  clickedId: group.id,
                  clickedName: group.name,
                  clickedType: group.type,
                  currentActiveId: activeGroupId,
                  idType: typeof group.id,
                  idMatch: group.id === activeGroupId,
                  timestamp: new Date().toISOString(),
                });
                onSelectGroup(group.id);
              }}
              onContextMenu={(e) => handleContextMenu(e, group.id)}
              onMouseEnter={() => setHoveredGroupId(group.id)}
              onMouseLeave={() => {
                // Don't hide hover state if menu is open
                if (openMenuGroupId !== group.id) {
                  setHoveredGroupId(null);
                }
              }}
              style={{
                padding: '10px 12px',
                background: activeGroupId === group.id ? '#2d2d2d' : (hoveredGroupId === group.id ? '#2a2d2e' : 'transparent'),
                borderLeft: activeGroupId === group.id ? '3px solid #007acc' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {/* Active Indicator */}
              {activeGroupId === group.id && (
                <span style={{ fontSize: '10px', color: '#007acc' }}>▶</span>
              )}

              {/* Icon */}
              <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                {group.type === 'html' ? <AiFillHtml5 color="#E34F26" /> : group.type === 'php' ? <FaWordpress color="#21759B" /> : <SiHubspot color="#FF7A59" />}
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

              {/* Three-dot Menu (shows on hover) */}
              {hoveredGroupId === group.id && renamingGroupId !== group.id && (
                <div style={{ position: 'relative' }} data-menu-container>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuGroupId(openMenuGroupId === group.id ? null : group.id);
                    }}
                    title="More options"
                    style={{
                      padding: '4px 6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#cccccc',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                      width: '24px',
                      height: '24px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3e3e3e';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      if (openMenuGroupId !== group.id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#cccccc';
                      }
                    }}
                  >
                    ⋯
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuGroupId === group.id && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: '28px',
                        background: '#2d2d2d',
                        border: '1px solid #3e3e3e',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        minWidth: '140px',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={() => {
                        // Keep menu open when hovering over it
                        setOpenMenuGroupId(group.id);
                        setHoveredGroupId(group.id); // Keep parent hovered
                      }}
                      onMouseLeave={() => {
                        // Close menu when mouse leaves
                        setOpenMenuGroupId(null);
                        setHoveredGroupId(null);
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(group);
                          setOpenMenuGroupId(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#cccccc',
                          textAlign: 'left',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2a2d2e';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span>✏️</span>
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(group);
                          setOpenMenuGroupId(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#f48771',
                          textAlign: 'left',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2a2d2e';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
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
