'use client'

import { FileText, Folder, Plus, ChevronRight } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useProjects, useFolders, useDocuments, useProjectUIState } from "@/hooks/useProjectHierarchy"
import { useState } from "react"
import { CreateProjectDialog } from "@/components/project-hierarchy/CreateProjectDialog"
import { CreateFolderDialog } from "@/components/project-hierarchy/CreateFolderDialog"
import { CreateDocumentDialog } from "@/components/project-hierarchy/CreateDocumentDialog"

interface AppSidebarProps {
  onDocumentSelect?: (documentId: string) => void
  selectedDocumentId?: string
}

export function AppSidebar({ onDocumentSelect, selectedDocumentId }: AppSidebarProps) {
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

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Documents</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateDocument(true)}
                className="p-1.5 rounded hover:bg-sidebar-accent transition-colors"
                title="New Document"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCreateProject(true)}
                className="p-1.5 rounded hover:bg-sidebar-accent transition-colors"
                title="New Project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => {
                  const isExpanded = uiState.expandedProjects.includes(project.id)
                  const projectFolders = getFoldersForProject(project.id)
                  const projectDocs = getDocumentsForProject(project.id)
                  const hasChildren = projectFolders.length > 0 || projectDocs.length > 0

                  return (
                    <div key={project.id}>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => hasChildren && toggleProject(project.id)}
                          className="w-full"
                        >
                          {hasChildren && (
                            <ChevronRight
                              className={`w-3 h-3 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          )}
                          <span className="text-sm">{project.icon || '📁'}</span>
                          <span className="flex-1 truncate">{project.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Render folders and documents when expanded */}
                      {isExpanded && (
                        <div className="ml-4">
                          {/* Folders */}
                          {projectFolders.map((folder) => {
                            const isFolderExpanded = uiState.expandedFolders.includes(folder.id)
                            const folderDocs = getDocumentsForFolder(folder.id)

                            return (
                              <div key={folder.id}>
                                <SidebarMenuItem>
                                  <SidebarMenuButton
                                    onClick={() => toggleFolder(folder.id)}
                                    className="w-full text-sm"
                                  >
                                    <ChevronRight
                                      className={`w-3 h-3 transition-transform ${
                                        isFolderExpanded ? 'rotate-90' : ''
                                      }`}
                                    />
                                    <Folder className="w-3 h-3" />
                                    <span className="flex-1 truncate">{folder.name}</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>

                                {/* Documents in folder */}
                                {isFolderExpanded && (
                                  <div className="ml-4">
                                    {folderDocs.map((doc) => (
                                      <SidebarMenuItem key={doc.id}>
                                        <SidebarMenuButton
                                          onClick={() => onDocumentSelect?.(doc.id)}
                                          isActive={selectedDocumentId === doc.id}
                                          className="w-full text-sm"
                                        >
                                          <FileText className="w-3 h-3" />
                                          <span className="flex-1 truncate">{doc.title}</span>
                                        </SidebarMenuButton>
                                      </SidebarMenuItem>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Root-level documents */}
                          {projectDocs.map((doc) => (
                            <SidebarMenuItem key={doc.id}>
                              <SidebarMenuButton
                                onClick={() => onDocumentSelect?.(doc.id)}
                                isActive={selectedDocumentId === doc.id}
                                className="w-full text-sm"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="flex-1 truncate">{doc.title}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

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
