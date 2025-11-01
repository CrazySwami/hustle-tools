'use client';

/**
 * ============================================================================
 * PROJECT ITEM - Single Project in Tree
 * ============================================================================
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, MoreVertical, FolderPlus, FileText, Trash2, Edit2 } from 'lucide-react';
import { ProjectTreeNode, Project } from '@/types/project';
import { ProjectTree } from './ProjectTree';
import { useProjectUIState, useProjects } from '@/hooks/useProjectHierarchy';
import { cn } from '@/lib/utils';

interface ProjectItemProps {
  node: ProjectTreeNode;
  onDocumentSelect?: (documentId: string) => void;
  selectedDocumentId?: string;
  onCreateFolder?: (projectId: string) => void;
  depth: number;
}

export function ProjectItem({
  node,
  onDocumentSelect,
  selectedDocumentId,
  onCreateFolder,
  depth,
}: ProjectItemProps) {
  const { toggleProject } = useProjectUIState();
  const { deleteProject } = useProjects();
  const [showMenu, setShowMenu] = useState(false);
  const project = node.data as Project;

  const handleToggle = () => {
    toggleProject(node.id);
  };

  const handleDelete = () => {
    if (confirm(`Delete project "${project.name}" and all its contents?`)) {
      deleteProject(project.id);
    }
  };

  const paddingLeft = depth * 12;

  return (
    <div>
      {/* Project Row - ClickUp Style */}
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
        <span className="text-sm flex-shrink-0 opacity-70">
          {node.icon || '📁'}
        </span>

        {/* Name */}
        <span className="flex-1 truncate font-medium text-foreground/90" onClick={handleToggle}>
          {node.name}
        </span>

        {/* Actions (show on hover) - ClickUp Style */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder?.(project.id);
            }}
            className="p-1 hover:bg-accent/80 rounded transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3 h-3 text-muted-foreground" />
          </button>

          <div className="relative">
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
      </div>

      {/* Children (folders and documents) */}
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
