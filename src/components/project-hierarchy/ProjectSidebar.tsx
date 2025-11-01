'use client';

/**
 * ============================================================================
 * PROJECT SIDEBAR - Main Container
 * ============================================================================
 *
 * VSCode-like file explorer sidebar for projects, folders, and documents.
 * Features:
 * - Collapsible tree view
 * - Create/rename/delete operations
 * - Drag and drop support (future)
 * - Resizable width
 * - Search/filter
 */

import { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, FolderPlus } from 'lucide-react';
import { ProjectTree } from './ProjectTree';
import { CreateProjectDialog } from './CreateProjectDialog';
import { CreateFolderDialog } from './CreateFolderDialog';
import { useProjects, useFolders, useDocuments, useProjectUIState, buildProjectTree } from '@/hooks/useProjectHierarchy';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  onDocumentSelect?: (documentId: string) => void;
  selectedDocumentId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ProjectSidebar({
  onDocumentSelect,
  selectedDocumentId,
  isCollapsed = false,
  onToggleCollapse,
}: ProjectSidebarProps) {
  const { projects } = useProjects();
  const { folders } = useFolders();
  const { documents } = useDocuments();
  const { uiState } = useProjectUIState();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [selectedProjectForFolder, setSelectedProjectForFolder] = useState<string | undefined>();

  // Build tree structure
  const tree = buildProjectTree(
    projects,
    folders,
    documents,
    uiState.expandedProjects,
    uiState.expandedFolders
  );

  // Filter tree by search query
  const filteredTree = searchQuery
    ? tree.filter(node => {
        // For projects: check name
        if (node.type === 'project') {
          return node.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      })
    : tree;

  const handleCreateFolder = (projectId: string) => {
    setSelectedProjectForFolder(projectId);
    setShowCreateFolder(true);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-card flex flex-col items-center py-2 gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowCreateProject(true)}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full border-r border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h2 className="text-sm font-semibold">Projects</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateProject(true)}
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
              title="New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
          {filteredTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground mb-3">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Create your first project
                </button>
              )}
            </div>
          ) : (
            <ProjectTree
              nodes={filteredTree}
              onDocumentSelect={onDocumentSelect}
              selectedDocumentId={selectedDocumentId}
              onCreateFolder={handleCreateFolder}
            />
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-2 border-t border-border text-xs text-muted-foreground">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'} • {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </div>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
      />

      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => {
          setShowCreateFolder(false);
          setSelectedProjectForFolder(undefined);
        }}
        projectId={selectedProjectForFolder}
      />
    </>
  );
}
