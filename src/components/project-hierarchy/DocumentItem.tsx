'use client';

/**
 * ============================================================================
 * DOCUMENT ITEM - Single Document in Tree
 * ============================================================================
 */

import { useState } from 'react';
import { FileText, MoreVertical, Trash2, Edit2, Tags } from 'lucide-react';
import { ProjectTreeNode, Document } from '@/types/project';
import { useDocuments } from '@/hooks/useProjectHierarchy';
import { cn } from '@/lib/utils';

interface DocumentItemProps {
  node: ProjectTreeNode;
  onSelect?: (documentId: string) => void;
  isSelected?: boolean;
  depth: number;
}

export function DocumentItem({
  node,
  onSelect,
  isSelected,
  depth,
}: DocumentItemProps) {
  const { deleteDocument } = useDocuments();
  const [showMenu, setShowMenu] = useState(false);
  const document = node.data as Document;

  const handleDelete = () => {
    if (confirm(`Delete document "${document.title}"?`)) {
      deleteDocument(document.id);
    }
  };

  const paddingLeft = depth * 12 + 24; // Extra padding for documents (no chevron)

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-all text-sm",
        isSelected
          ? "bg-primary/15 text-primary font-medium"
          : "hover:bg-accent/60 text-foreground/85"
      )}
      style={{ paddingLeft: `${paddingLeft}px` }}
      onClick={() => onSelect?.(document.id)}
    >
      {/* Icon */}
      <FileText className={cn(
        "w-3 h-3 flex-shrink-0",
        isSelected ? "text-primary" : "text-muted-foreground/70"
      )} />

      {/* Name */}
      <span className="flex-1 truncate">
        {node.name}
      </span>

      {/* Tags indicator */}
      {document.tags && document.tags.length > 0 && (
        <Tags className="w-2.5 h-2.5 text-muted-foreground/60 flex-shrink-0" />
      )}

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
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />

            {/* Menu */}
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-md shadow-lg z-20 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  // TODO: Implement rename
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
  );
}
