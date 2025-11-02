'use client'

import { FileText, Folder, FolderOpen, X, GripVertical, FolderPlus, ChevronRight, ChevronDown, MoreVertical, Trash2, Edit2 } from "lucide-react"
import { useProjects, useFolders, useDocuments, useProjectUIState } from "@/hooks/useProjectHierarchy"
import { useState, useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { CreateProjectDialog } from "@/components/project-hierarchy/CreateProjectDialog"
import { CreateFolderDialog } from "@/components/project-hierarchy/CreateFolderDialog"
import { CreateDocumentDialog } from "@/components/project-hierarchy/CreateDocumentDialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface AppSidebarProps {
  onDocumentSelect?: (documentId: string) => void
  selectedDocumentId?: string
}

// Draggable wrapper component
function DraggableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="w-3 h-3 text-sidebar-foreground/30" />
      </div>
      <div className="pl-4">
        {children}
      </div>
    </div>
  )
}

// Droppable folder wrapper component
function DroppableFolder({ id, isOver, children }: { id: string; isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `folder-${id}` })

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'bg-sidebar-accent/50 rounded' : ''}
    >
      {children}
    </div>
  )
}

export function AppSidebar({ onDocumentSelect, selectedDocumentId }: AppSidebarProps) {
  const { open, setOpen } = useSidebar()
  const { projects, updateProject, deleteProject } = useProjects()
  const { folders, updateFolder, deleteFolder } = useFolders()
  const { documents, updateDocument, deleteDocument } = useDocuments()
  const { uiState, toggleProject, toggleFolder, expandProject, expandFolder } = useProjectUIState()

  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateDocument, setShowCreateDocument] = useState(false)
  const [selectedProjectForFolder, setSelectedProjectForFolder] = useState<string | undefined>()
  const [activeDropFolder, setActiveDropFolder] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{type: 'folder' | 'document', id: string, x: number, y: number} | null>(null)
  const [renameDialog, setRenameDialog] = useState<{type: 'folder' | 'document', id: string, name: string} | null>(null)
  const [renameName, setRenameName] = useState('')

  // Auto-expand folders/projects to show selected document
  useEffect(() => {
    if (!selectedDocumentId) return;

    const selectedDoc = documents.find(d => d.id === selectedDocumentId);
    if (!selectedDoc) return;

    // Expand the project containing this document
    expandProject(selectedDoc.projectId);

    // If document is in a folder, expand that folder too
    if (selectedDoc.folderId) {
      expandFolder(selectedDoc.folderId);
    }
  }, [selectedDocumentId, documents, expandProject, expandFolder]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // Handlers for context menu actions
  const handleDelete = (type: 'folder' | 'document', id: string) => {
    if (type === 'folder') {
      if (confirm('Delete this folder? Documents inside will not be deleted.')) {
        deleteFolder(id)
      }
    } else {
      if (confirm('Delete this document? This cannot be undone.')) {
        deleteDocument(id)
      }
    }
    setContextMenu(null)
  }

  const handleRename = (type: 'folder' | 'document', id: string) => {
    const item = type === 'folder'
      ? folders.find(f => f.id === id)
      : documents.find(d => d.id === id)

    if (item) {
      setRenameDialog({
        type,
        id,
        name: type === 'folder' ? (item as any).name : (item as any).title
      })
      setRenameName(type === 'folder' ? (item as any).name : (item as any).title)
    }
    setContextMenu(null)
  }

  const handleRenameSubmit = () => {
    if (!renameDialog || !renameName.trim()) return

    if (renameDialog.type === 'folder') {
      updateFolder(renameDialog.id, { name: renameName.trim() })
    } else {
      updateDocument(renameDialog.id, { title: renameName.trim() })
    }

    setRenameDialog(null)
    setRenameName('')
  }

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Build tree structure
  const getDocumentsForFolder = (folderId: string) => {
    return documents.filter(doc => doc.folderId === folderId).sort((a, b) => a.order - b.order)
  }

  const getDocumentsForProject = (projectId: string) => {
    return documents.filter(doc => doc.projectId === projectId && !doc.folderId).sort((a, b) => a.order - b.order)
  }

  const getFoldersForProject = (projectId: string) => {
    return folders.filter(folder => folder.projectId === projectId).sort((a, b) => a.order - b.order)
  }

  // Sorted projects
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order)

  // Handle drag end for projects
  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedProjects.findIndex(p => p.id === active.id)
    const newIndex = sortedProjects.findIndex(p => p.id === over.id)

    const newOrder = arrayMove(sortedProjects, oldIndex, newIndex)
    newOrder.forEach((project, index) => {
      updateProject(project.id, { order: index })
    })
  }

  // Handle drag end for folders within a project
  const handleFolderDragEnd = (projectId: string) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const projectFolders = getFoldersForProject(projectId)
    const oldIndex = projectFolders.findIndex(f => f.id === active.id)
    const newIndex = projectFolders.findIndex(f => f.id === over.id)

    const newOrder = arrayMove(projectFolders, oldIndex, newIndex)
    newOrder.forEach((folder, index) => {
      updateFolder(folder.id, { order: index })
    })
  }

  // Handle drag end for ALL documents within a project (allows cross-folder dragging)
  const handleProjectDocumentsDragEnd = (projectId: string) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dropping onto a folder droppable zone
    if (overId.startsWith('folder-')) {
      const targetFolderId = overId.replace('folder-', '')
      const doc = documents.find(d => d.id === activeId)
      if (doc) {
        // Move document to this folder
        updateDocument(activeId, { folderId: targetFolderId })
        return
      }
    }

    // Regular reordering within same container
    if (active.id === over.id) return

    const activeDoc = documents.find(d => d.id === activeId)
    const overDoc = documents.find(d => d.id === overId)

    if (!activeDoc || !overDoc) return

    // If both documents are in the same folder/location, reorder them
    if (activeDoc.folderId === overDoc.folderId) {
      const docs = activeDoc.folderId
        ? getDocumentsForFolder(activeDoc.folderId)
        : getDocumentsForProject(projectId)

      const oldIndex = docs.findIndex(d => d.id === activeId)
      const newIndex = docs.findIndex(d => d.id === overId)

      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = arrayMove(docs, oldIndex, newIndex)
      newOrder.forEach((doc, index) => {
        updateDocument(doc.id, { order: index })
      })
    } else {
      // Move to different folder - place it at the position of the over document
      updateDocument(activeId, {
        folderId: overDoc.folderId,
        order: overDoc.order
      })
    }
  }

  // Handle drag over to highlight drop zones
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over && typeof over.id === 'string' && over.id.startsWith('folder-')) {
      setActiveDropFolder(over.id.replace('folder-', ''))
    } else {
      setActiveDropFolder(null)
    }
  }

  return (
    <>
      <div
        className={`h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out ${
          open ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
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
                <FolderPlus className="w-4 h-4 text-sidebar-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleProjectDragEnd}
          >
            <SortableContext
              items={sortedProjects.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {sortedProjects.map((project) => {
                  const isExpanded = uiState.expandedProjects.includes(project.id)
                  const projectFolders = getFoldersForProject(project.id)
                  const projectDocs = getDocumentsForProject(project.id)

                  return (
                    <DraggableItem key={project.id} id={project.id}>
                      <div>
                        {/* Project */}
                        <button
                          onClick={() => toggleProject(project.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground text-sm"
                        >
                          <Folder className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 truncate text-left">{project.name}</span>
                        </button>

                        {/* Render folders and documents when expanded */}
                        {isExpanded && (
                          <div className="ml-5 space-y-1 mt-1">
                            {/* Unified DndContext for ALL documents and folders in this project */}
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => {
                                // Check if dragging a folder
                                const activeId = event.active.id as string
                                if (projectFolders.find(f => f.id === activeId)) {
                                  handleFolderDragEnd(project.id)(event)
                                } else {
                                  // Dragging a document
                                  handleProjectDocumentsDragEnd(project.id)(event)
                                }
                              }}
                              onDragOver={handleDragOver}
                            >
                              {/* Folders - draggable */}
                              <SortableContext
                                items={projectFolders.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {projectFolders.map((folder) => {
                                  const isFolderExpanded = uiState.expandedFolders.includes(folder.id)
                                  const folderDocs = getDocumentsForFolder(folder.id)
                                  const isDropTarget = activeDropFolder === folder.id

                                  return (
                                    <DraggableItem key={folder.id} id={folder.id}>
                                      <div>
                                        <DroppableFolder id={folder.id} isOver={isDropTarget}>
                                          <div className="relative group">
                                            {/* Folder */}
                                            <button
                                              onClick={() => toggleFolder(folder.id)}
                                              className={`w-full flex items-center gap-1 px-2 py-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground text-sm ${isDropTarget ? 'bg-sidebar-accent' : ''}`}
                                            >
                                              {isFolderExpanded ? (
                                                <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                              ) : (
                                                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                              )}
                                              {isFolderExpanded ? (
                                                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                                              ) : (
                                                <Folder className="w-4 h-4 flex-shrink-0" />
                                              )}
                                              <span className="flex-1 truncate text-left">{folder.name}</span>
                                            </button>
                                            {/* Three dots menu */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const rect = e.currentTarget.getBoundingClientRect()
                                                setContextMenu({type: 'folder', id: folder.id, x: rect.left, y: rect.bottom})
                                              }}
                                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                              <MoreVertical className="w-3 h-3 text-sidebar-foreground" />
                                            </button>
                                          </div>
                                        </DroppableFolder>

                                        {/* Documents in folder - draggable */}
                                          {isFolderExpanded && (
                                            <div className="ml-5 space-y-1 mt-1">
                                              <SortableContext
                                                items={folderDocs.map(d => d.id)}
                                                strategy={verticalListSortingStrategy}
                                              >
                                                {folderDocs.length > 0 ?
                                                  folderDocs.map((doc) => (
                                                      <DraggableItem key={doc.id} id={doc.id}>
                                                        <div className="relative group">
                                                          <button
                                                            onClick={() => onDocumentSelect?.(doc.id)}
                                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                                                              selectedDocumentId === doc.id
                                                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                                                : 'hover:bg-sidebar-accent text-sidebar-foreground'
                                                            }`}
                                                          >
                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                            <span className="flex-1 truncate text-left">{doc.title}</span>
                                                          </button>
                                                          {/* Three dots menu */}
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation()
                                                              const rect = e.currentTarget.getBoundingClientRect()
                                                              setContextMenu({type: 'document', id: doc.id, x: rect.left, y: rect.bottom})
                                                            }}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                          >
                                                            <MoreVertical className="w-3 h-3" />
                                                          </button>
                                                        </div>
                                                      </DraggableItem>
                                                    ))
                                                  :
                                                    <div className="px-2 py-1.5 text-xs text-sidebar-foreground/50 italic">
                                                      Empty folder
                                                    </div>
                                                  }
                                              </SortableContext>
                                            </div>
                                          )}
                                      </div>
                                    </DraggableItem>
                                  );
                                })}
                              </SortableContext>

                            {/* Root-level documents - draggable */}
                            <SortableContext
                              items={projectDocs.map(d => d.id)}
                              strategy={verticalListSortingStrategy}
                            >
                                {projectDocs.map((doc) => (
                                  <DraggableItem key={doc.id} id={doc.id}>
                                    <div className="relative group">
                                      <button
                                        onClick={() => onDocumentSelect?.(doc.id)}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                                          selectedDocumentId === doc.id
                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                            : 'hover:bg-sidebar-accent text-sidebar-foreground'
                                        }`}
                                      >
                                        <FileText className="w-4 h-4 flex-shrink-0 ml-5" />
                                        <span className="flex-1 truncate text-left">{doc.title}</span>
                                      </button>
                                      {/* Three dots menu */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const rect = e.currentTarget.getBoundingClientRect()
                                          setContextMenu({type: 'document', id: doc.id, x: rect.left, y: rect.bottom})
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </DraggableItem>
                                ))}
                            </SortableContext>

                            {/* Empty state */}
                            {projectFolders.length === 0 && projectDocs.length === 0 && (
                              <div className="px-2 py-1.5 text-xs text-sidebar-foreground/50 italic">
                                Empty project
                              </div>
                            )}
                          </DndContext>
                          </div>
                        )}
                      </div>
                    </DraggableItem>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border border-border rounded-md shadow-lg py-1 z-[9999]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRename(contextMenu.type, contextMenu.id)}
            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
          >
            <Edit2 className="w-3 h-3" />
            Rename
          </button>
          <button
            onClick={() => handleDelete(contextMenu.type, contextMenu.id)}
            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}

      {/* Rename Dialog */}
      {renameDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={() => setRenameDialog(null)}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              Rename {renameDialog.type === 'folder' ? 'Folder' : 'Document'}
            </h2>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit()
                } else if (e.key === 'Escape') {
                  setRenameDialog(null)
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md mb-4 bg-background text-foreground"
              placeholder="Enter new name..."
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRenameDialog(null)}
                className="px-4 py-2 rounded-md hover:bg-muted text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm"
                disabled={!renameName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateProjectDialog
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
      />
      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        projectId={selectedProjectForFolder}
      />
      <CreateDocumentDialog
        open={showCreateDocument}
        onClose={() => setShowCreateDocument(false)}
      />
    </>
  )
}
