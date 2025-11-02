'use client'

import { FileText, Folder, Plus, ChevronRight, X } from "lucide-react"
import { useProjects, useFolders, useDocuments, useProjectUIState } from "@/hooks/useProjectHierarchy"
import { useState } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { CreateProjectDialog } from "@/components/project-hierarchy/CreateProjectDialog"
import { CreateFolderDialog } from "@/components/project-hierarchy/CreateFolderDialog"
import { CreateDocumentDialog } from "@/components/project-hierarchy/CreateDocumentDialog"

interface AppSidebarProps {
  onDocumentSelect?: (documentId: string) => void
  selectedDocumentId?: string
}

export function AppSidebar({ onDocumentSelect, selectedDocumentId }: AppSidebarProps) {
  const { open, setOpen } = useSidebar()
  const { projects } = useProjects()
  const { folders } = useFolders()
  const { documents } = useDocuments()
  const { uiState, toggleProject, toggleFolder } = useProjectUIState()

  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateDocument, setShowCreateDocument] = useState(false)
  const [selectedProjectForFolder, setSelectedProjectForFolder] = useState<string | undefined>()

  // Build tree structure
  const getDocumentsForFolder = (folderId: string) => {
    return documents.filter(doc => doc.folderId === folderId)
  }

  const getDocumentsForProject = (projectId: string) => {
    return documents.filter(doc => doc.projectId === projectId && !doc.folderId)
  }

  const getFoldersForProject = (projectId: string) => {
    return folders.filter(folder => folder.projectId === projectId && !folder.parentFolderId)
  }

  if (!open) return null

  return (
    <>
      <div className="h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sidebar-foreground">Documents</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateDocument(true)}
                className="p-1.5 rounded hover:bg-sidebar-accent transition-colors"
                title="New Document"
              >
                <FileText className="w-4 h-4 text-sidebar-foreground" />
              </button>
              <button
                onClick={() => setShowCreateProject(true)}
                className="p-1.5 rounded hover:bg-sidebar-accent transition-colors"
                title="New Project"
              >
                <Plus className="w-4 h-4 text-sidebar-foreground" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-sidebar-accent transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-sidebar-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
                {projects.map((project) => {
                  const isExpanded = uiState.expandedProjects.includes(project.id)
                  const projectFolders = getFoldersForProject(project.id)
                  const projectDocs = getDocumentsForProject(project.id)
                  const hasChildren = projectFolders.length > 0 || projectDocs.length > 0

                  return (
                    <div key={project.id}>
                      <button
                        onClick={() => hasChildren && toggleProject(project.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground text-sm"
                      >
                        {hasChildren && (
                          <ChevronRight
                            className={`w-3 h-3 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        )}
                        <span className="text-sm">{project.icon || '📁'}</span>
                        <span className="flex-1 truncate text-left">{project.name}</span>
                      </button>

                      {/* Render folders and documents when expanded */}
                      {isExpanded && (
                        <div className="ml-4">
                          {/* Folders */}
                          {projectFolders.map((folder) => {
                            const isFolderExpanded = uiState.expandedFolders.includes(folder.id)
                            const folderDocs = getDocumentsForFolder(folder.id)

                            return (
                              <div key={folder.id}>
                                <button
                                  onClick={() => toggleFolder(folder.id)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground text-sm"
                                >
                                  <ChevronRight
                                    className={`w-3 h-3 transition-transform ${
                                      isFolderExpanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                  <Folder className="w-3 h-3" />
                                  <span className="flex-1 truncate text-left">{folder.name}</span>
                                </button>

                                {/* Documents in folder */}
                                {isFolderExpanded && (
                                  <div className="ml-4">
                                    {folderDocs.map((doc) => (
                                      <button
                                        key={doc.id}
                                        onClick={() => onDocumentSelect?.(doc.id)}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                                          selectedDocumentId === doc.id
                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                            : 'hover:bg-sidebar-accent text-sidebar-foreground'
                                        }`}
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span className="flex-1 truncate text-left">{doc.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Root-level documents */}
                          {projectDocs.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => onDocumentSelect?.(doc.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                                selectedDocumentId === doc.id
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                  : 'hover:bg-sidebar-accent text-sidebar-foreground'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span className="flex-1 truncate text-left">{doc.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
      />
      <CreateFolderDialog
        isOpen={showCreateFolder}
        onClose={() => {
          setShowCreateFolder(false)
          setSelectedProjectForFolder(undefined)
        }}
        projectId={selectedProjectForFolder}
      />
      <CreateDocumentDialog
        isOpen={showCreateDocument}
        onClose={() => setShowCreateDocument(false)}
      />
    </>
  )
}
