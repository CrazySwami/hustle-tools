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
      <div className="flex flex-col h-full bg-background">
        {/* Header - ClickUp Style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">Documents</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateProject(true)}
              className="p-1.5 hover:bg-accent rounded transition-colors"
              title="New Project"
            >
              <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 hover:bg-accent rounded transition-colors"
                title="Close sidebar"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Search - Minimal Style */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-accent/50 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-accent placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Tree View - Clean scrolling */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-1">
          {filteredTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <p className="text-sm text-muted-foreground mb-2">
                {searchQuery ? 'No documents found' : 'No projects yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="text-xs text-primary hover:underline font-medium"
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

        {/* Footer Stats - Minimal */}
        <div className="px-4 py-2 border-t border-border/50 text-xs text-muted-foreground/70">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'} · {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
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
