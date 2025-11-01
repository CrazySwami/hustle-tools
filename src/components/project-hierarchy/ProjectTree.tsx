'use client';

/**
 * ============================================================================
 * PROJECT TREE - Hierarchical Tree View
 * ============================================================================
 *
 * Renders the project/folder/document tree structure.
 * Handles expansion, selection, and interactions.
 */

import { ProjectTreeNode } from '@/types/project';
import { ProjectItem } from './ProjectItem';
import { FolderItem } from './FolderItem';
import { DocumentItem } from './DocumentItem';

interface ProjectTreeProps {
  nodes: ProjectTreeNode[];
  onDocumentSelect?: (documentId: string) => void;
  selectedDocumentId?: string;
  onCreateFolder?: (projectId: string) => void;
  depth?: number;
}

export function ProjectTree({
  nodes,
  onDocumentSelect,
  selectedDocumentId,
  onCreateFolder,
  depth = 0,
}: ProjectTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => {
        if (node.type === 'project') {
          return (
            <ProjectItem
              key={node.id}
              node={node}
              onDocumentSelect={onDocumentSelect}
              selectedDocumentId={selectedDocumentId}
              onCreateFolder={onCreateFolder}
              depth={depth}
            />
          );
        }

        if (node.type === 'folder') {
          return (
            <FolderItem
              key={node.id}
              node={node}
              onDocumentSelect={onDocumentSelect}
              selectedDocumentId={selectedDocumentId}
              depth={depth}
            />
          );
        }

        if (node.type === 'document') {
          return (
            <DocumentItem
              key={node.id}
              node={node}
              onSelect={onDocumentSelect}
              isSelected={selectedDocumentId === node.id}
              depth={depth}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
