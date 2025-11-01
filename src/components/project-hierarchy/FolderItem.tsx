'use client';

/**
 * ============================================================================
 * FOLDER ITEM - Single Folder in Tree
 * ============================================================================
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { ProjectTreeNode, Folder as FolderType } from '@/types/project';
import { ProjectTree } from './ProjectTree';
import { useProjectUIState, useFolders } from '@/hooks/useProjectHierarchy';
import { cn } from '@/lib/utils';

interface FolderItemProps {
  node: ProjectTreeNode;
  onDocumentSelect?: (documentId: string) => void;
  selectedDocumentId?: string;
  depth: number;
}

export function FolderItem({
  node,
  onDocumentSelect,
  selectedDocumentId,
  depth,
}: FolderItemProps) {
  const { toggleFolder } = useProjectUIState();
  const { deleteFolder } = useFolders();
  const [showMenu, setShowMenu] = useState(false);
  const folder = node.data as FolderType;

  const handleToggle = () => {
    toggleFolder(node.id);
  };

  const handleDelete = () => {
    if (confirm(`Delete folder "${folder.name}" and all its contents?`)) {
      deleteFolder(folder.id);
    }
  };

  const paddingLeft = depth * 12;

  return (
    <div>
      {/* Folder Row - ClickUp Style */}
      <div
        className={cn(
          "group flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-accent/60 cursor-pointer transition-all",
          "text-sm"
        )}
        style={{ paddingLeft: `${paddingLeft + 4}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={handleToggle}
          className="p-0.5 hover:bg-accent/80 rounded transition-colors flex-shrink-0"
        >
          {node.isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* Icon */}
        {node.icon ? (
          <span className="text-sm flex-shrink-0 opacity-70">{node.icon}</span>
        ) : node.isExpanded ? (
          <FolderOpen className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
        )}

        {/* Name */}
        <span className="flex-1 truncate text-foreground/85" onClick={handleToggle}>
          {node.name}
        </span>

        {/* Actions (show on hover) - ClickUp Style */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-accent/80 rounded transition-colors"
            title="More options"
          >
            <MoreVertical className="w-3 h-3 text-muted-foreground" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-md shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // TODO: Implement rename
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Children (nested folders and documents) */}
      {node.isExpanded && node.children && node.children.length > 0 && (
        <ProjectTree
          nodes={node.children}
          onDocumentSelect={onDocumentSelect}
          selectedDocumentId={selectedDocumentId}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
