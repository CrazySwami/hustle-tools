'use client'

import { useState, useEffect, useMemo, memo } from "react"
import { useProjects, useFolders, useDocuments, useProjectUIState } from "@/hooks/useProjectHierarchy"
import { DocumentsSidebar, type Item, type DocumentItem, type FolderItem } from "@/components/ui/documents-sidebar"

interface AppSidebarProps {
  onDocumentSelect?: (documentId: string) => void
  selectedDocumentId?: string
}

export const AppSidebar = memo(function AppSidebar({ onDocumentSelect, selectedDocumentId }: AppSidebarProps) {
  const { projects, updateProject, deleteProject } = useProjects()
  const { folders, updateFolder, deleteFolder, createFolder } = useFolders()
  const { documents, updateDocument, deleteDocument, createDocument } = useDocuments()
  const { uiState, toggleFolder, expandFolder } = useProjectUIState()

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Auto-expand folders to show selected document
  useEffect(() => {
    if (!selectedDocumentId) return;

    const selectedDoc = documents.find(d => d.id === selectedDocumentId);
    if (!selectedDoc) return;

    // If document is in a folder, expand that folder
    if (selectedDoc.folderId) {
      expandFolder(selectedDoc.folderId);
    }
  }, [selectedDocumentId, documents, expandFolder]);

  // Build items array compatible with DocumentsSidebar
  // Optimized: Only rebuild if IDs or relevant properties change
  const items: Item[] = useMemo(() => {
    const result: Item[] = []

    // Add all folders (transformed to match FolderItem type)
    folders.forEach(folder => {
      result.push({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        isOpen: uiState.expandedFolders.includes(folder.id),
        parentFolderId: undefined, // We don't support nested folders yet, but the structure supports it
      })
    })

    // Add all documents (transformed to match DocumentItem type)
    documents.forEach(doc => {
      result.push({
        id: doc.id,
        name: doc.title,
        type: 'document' as const,
        folderId: doc.folderId || undefined,
      })
    })

    return result
  }, [
    // Only rebuild when these specific values change (not the whole objects)
    folders.map(f => `${f.id}:${f.name}`).join(','),
    documents.map(d => `${d.id}:${d.title}:${d.folderId || ''}`).join(','),
    uiState.expandedFolders.join(','),
  ])

  // Handle selection
  const handleSelect = (id: string, isMultiSelect: boolean) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    if (isMultiSelect) {
      // Multi-select mode
      setSelectedIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(selectedId => selectedId !== id)
        } else {
          return [...prev, id]
        }
      })
    } else {
      // Single select
      if (item.type === 'document') {
        setSelectedIds([id])
        onDocumentSelect?.(id)
      } else {
        // Folder - toggle selection only
        setSelectedIds(prev => {
          if (prev.includes(id)) {
            return prev.filter(selectedId => selectedId !== id)
          } else {
            return [id]
          }
        })
      }
    }
  }

  // Handle rename
  const handleRename = (id: string, newName: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    if (item.type === 'folder') {
      updateFolder(id, { name: newName })
    } else {
      updateDocument(id, { title: newName })
    }
  }

  // Handle delete
  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    if (item.type === 'folder') {
      if (confirm('Delete this folder? Documents inside will not be deleted.')) {
        deleteFolder(id)
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      }
    } else {
      if (confirm('Delete this document? This cannot be undone.')) {
        deleteDocument(id)
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      }
    }
  }

  // Handle bulk delete
  const handleDeleteMultiple = (ids: string[]) => {
    const folderIds = ids.filter(id => items.find(i => i.id === id)?.type === 'folder')
    const documentIds = ids.filter(id => items.find(i => i.id === id)?.type === 'document')

    const message = `Delete ${folderIds.length} folder(s) and ${documentIds.length} document(s)? This cannot be undone.`

    if (confirm(message)) {
      folderIds.forEach(id => deleteFolder(id))
      documentIds.forEach(id => deleteDocument(id))
      setSelectedIds([])
    }
  }

  // Handle move document to folder
  const handleMove = (documentId: string, targetFolderId: string | null) => {
    updateDocument(documentId, { folderId: targetFolderId || undefined })
  }

  // Handle move folder (not implemented yet - would need nested folder support)
  const handleMoveFolder = (folderId: string, targetFolderId: string | null) => {
    // Not implemented - would need to update folder schema to support parentFolderId
    console.log('Move folder not yet implemented', { folderId, targetFolderId })
  }

  // Handle toggle folder
  const handleToggleFolder = (folderId: string) => {
    toggleFolder(folderId)
  }

  // Handle create document
  const handleCreateDocument = () => {
    // Get the first project, or create one if none exists
    let projectId = projects[0]?.id
    if (!projectId) {
      console.log('No projects found, this should not happen')
      return
    }

    // Create new document in the first project
    const newDoc = createDocument('Untitled', projectId)
    setSelectedIds([newDoc.id])
    onDocumentSelect?.(newDoc.id)
  }

  // Handle create folder
  const handleCreateFolder = () => {
    // Get the first project, or create one if none exists
    let projectId = projects[0]?.id
    if (!projectId) {
      console.log('No projects found, this should not happen')
      return
    }

    // Create new folder in the first project
    const newFolder = createFolder('New Folder', projectId)
    setSelectedIds([newFolder.id])
  }

  return (
    <DocumentsSidebar
      items={items}
      selectedIds={selectedIds}
      onCreateDocument={handleCreateDocument}
      onCreateFolder={handleCreateFolder}
      onSelect={handleSelect}
      onRename={handleRename}
      onDelete={handleDelete}
      onDeleteMultiple={handleDeleteMultiple}
      onMove={handleMove}
      onMoveFolder={handleMoveFolder}
      onToggleFolder={handleToggleFolder}
    />
  )
})
