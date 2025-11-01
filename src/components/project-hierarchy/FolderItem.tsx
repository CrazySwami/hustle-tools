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
      {/* Folder Row */}
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
          "text-sm"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={handleToggle}
          className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
        >
          {node.isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Icon */}
        {node.icon ? (
          <span className="text-base flex-shrink-0">{node.icon}</span>
        ) : node.isExpanded ? (
          <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}

        {/* Name */}
        <span className="flex-1 truncate" onClick={handleToggle}>
          {node.name}
        </span>

        {/* Actions (show on hover) */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="More options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
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
