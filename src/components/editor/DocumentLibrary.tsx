'use client'

/**
 * Document Library Component
 *
 * Manages document library with folders, documents, and tags
 * Similar to ProjectLibrary but for documents
 */

import { useState } from 'react'
import { useDocuments } from '@/hooks/useDocuments'
import {
  Folder as FolderIcon,
  File,
  Plus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Grid3x3,
  List as ListIcon,
  Search,
  Tag as TagIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list' | 'tree'

interface DocumentLibraryProps {
  onDocumentSelect?: (documentId: string, content: string) => void
  onClose?: () => void
}

export function DocumentLibrary({ onDocumentSelect, onClose }: DocumentLibraryProps) {
  const documents = useDocuments()
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: 'document' | 'folder'
    id: string
  } | null>(null)

  // Filter documents
  const filteredDocuments = documents.documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => doc.tags?.includes(tag))
    return matchesSearch && matchesTags
  })

  // Handle document click
  const handleDocumentClick = (docId: string) => {
    const doc = documents.documents.find(d => d.id === docId)
    if (doc && onDocumentSelect) {
      onDocumentSelect(doc.id, doc.content)
    }
    documents.selectDocument(docId)
  }

  // Handle new document
  const handleNewDocument = () => {
    const name = prompt('Document name:')
    if (name) {
      documents.createDocument(name, '')
    }
  }

  // Handle new folder
  const handleNewFolder = (parentId: string | null = null) => {
    const name = prompt('Folder name:')
    if (name) {
      documents.createFolder(name, parentId)
    }
  }

  // Context menu
  const handleContextMenu = (e: React.MouseEvent, type: 'document' | 'folder', id: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type, id })
  }

  // Close context menu on click outside
  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  return (
    <div className="flex flex-col h-full bg-background" onClick={handleCloseContextMenu}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Document Library</h2>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border rounded">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                'p-2 rounded-l',
                viewMode === 'tree' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              title="Tree View"
            >
              <FolderIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              title="Grid View"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-r',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>

          {/* New buttons */}
          <button
            onClick={handleNewDocument}
            className="p-2 bg-primary text-primary-foreground rounded hover:opacity-90"
            title="New Document"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="p-4 border-b space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Tags filter */}
        {documents.getAllTags().length > 0 && (
          <div className="flex flex-wrap gap-2">
            {documents.getAllTags().map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded-full border flex items-center gap-1',
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                )}
              >
                <TagIcon className="h-3 w-3" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'tree' ? (
          <TreeView
            documents={filteredDocuments}
            folders={documents.folders}
            expandedFolders={documents.expandedFolders}
            activeDocumentId={documents.activeDocumentId}
            onDocumentClick={handleDocumentClick}
            onFolderToggle={documents.toggleFolderExpansion}
            onContextMenu={handleContextMenu}
            onNewFolder={handleNewFolder}
          />
        ) : viewMode === 'grid' ? (
          <GridView
            documents={filteredDocuments}
            activeDocumentId={documents.activeDocumentId}
            onDocumentClick={handleDocumentClick}
            onContextMenu={handleContextMenu}
          />
        ) : (
          <ListView
            documents={filteredDocuments}
            activeDocumentId={documents.activeDocumentId}
            onDocumentClick={handleDocumentClick}
            onContextMenu={handleContextMenu}
          />
        )}

        {filteredDocuments.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No documents found
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'document' ? (
            <>
              <button
                onClick={() => {
                  handleDocumentClick(contextMenu.id)
                  handleCloseContextMenu()
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
              >
                Open
              </button>
              <button
                onClick={() => {
                  const name = prompt('Rename document:')
                  if (name) {
                    documents.updateDocument(contextMenu.id, { name })
                  }
                  handleCloseContextMenu()
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  documents.duplicateDocument(contextMenu.id)
                  handleCloseContextMenu()
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
              >
                Duplicate
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this document?')) {
                    documents.deleteDocument(contextMenu.id)
                  }
                  handleCloseContextMenu()
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted text-sm text-destructive"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handleNewFolder(contextMenu.id)
                  handleCloseContextMenu()
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
              >
                New Subfolder
              </button>
              <button
                onClick={() => {
                  const name = prompt('Rename folder:')
                  if (name) {
                    documents.updateFolder(contextMenu.id, { name })
                  }
                  handleCloseContextMenu()
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this folder? Documents will be moved to parent.')) {
                    documents.deleteFolder(contextMenu.id)
                  }
                  handleCloseContextMenu()
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted text-sm text-destructive"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Tree View Component
function TreeView({
  documents,
  folders,
  expandedFolders,
  activeDocumentId,
  onDocumentClick,
  onFolderToggle,
  onContextMenu,
  onNewFolder,
}: any) {
  const useDocsHook = useDocuments()

  const renderFolder = (folder: any, level: number = 0) => {
    const isExpanded = expandedFolders.includes(folder.id)
    const subfolders = useDocsHook.getSubfolders(folder.id)
    const docs = useDocsHook.getDocumentsInFolder(folder.id)

    return (
      <div key={folder.id}>
        {/* Folder */}
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted',
            'text-sm'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onFolderToggle(folder.id)}
          onContextMenu={(e) => onContextMenu(e, 'folder', folder.id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          <FolderIcon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground">
            {docs.length}
          </span>
        </div>

        {/* Subfolders and documents */}
        {isExpanded && (
          <div>
            {subfolders.map((subfolder: any) => renderFolder(subfolder, level + 1))}
            {docs.map((doc: any) => (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted',
                  'text-sm',
                  activeDocumentId === doc.id && 'bg-muted border-l-2 border-primary'
                )}
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                onClick={() => onDocumentClick(doc.id)}
                onContextMenu={(e) => onContextMenu(e, 'document', doc.id)}
              >
                <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{doc.name}</span>
                <span className="text-xs text-muted-foreground">
                  {doc.wordCount || 0}w
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Root folders
  const rootFolders = useDocsHook.getSubfolders(null)
  const rootDocs = useDocsHook.getDocumentsInFolder(null)

  return (
    <div className="space-y-1">
      {/* Root folders */}
      {rootFolders.map((folder: any) => renderFolder(folder, 0))}

      {/* Root documents */}
      {rootDocs.map((doc: any) => (
        <div
          key={doc.id}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted',
            'text-sm',
            activeDocumentId === doc.id && 'bg-muted border-l-2 border-primary'
          )}
          onClick={() => onDocumentClick(doc.id)}
          onContextMenu={(e) => onContextMenu(e, 'document', doc.id)}
        >
          <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{doc.name}</span>
          <span className="text-xs text-muted-foreground">
            {doc.wordCount || 0}w
          </span>
        </div>
      ))}

      {/* New folder button */}
      <button
        onClick={() => onNewFolder(null)}
        className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted w-full"
      >
        <Plus className="h-4 w-4" />
        New Folder
      </button>
    </div>
  )
}

// Grid View Component
function GridView({ documents, activeDocumentId, onDocumentClick, onContextMenu }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc: any) => (
        <div
          key={doc.id}
          className={cn(
            'p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors',
            activeDocumentId === doc.id && 'border-primary bg-muted'
          )}
          onClick={() => onDocumentClick(doc.id)}
          onContextMenu={(e) => onContextMenu(e, 'document', doc.id)}
        >
          <div className="flex items-start justify-between mb-2">
            <File className="h-5 w-5 text-muted-foreground" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onContextMenu(e, 'document', doc.id)
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <h3 className="font-medium truncate mb-1">{doc.name}</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>{doc.wordCount || 0} words · {doc.characterCount || 0} chars</div>
            <div>{new Date(doc.updatedAt).toLocaleDateString()}</div>
          </div>
          {doc.tags && doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {doc.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// List View Component
function ListView({ documents, activeDocumentId, onDocumentClick, onContextMenu }: any) {
  return (
    <div className="space-y-2">
      {documents.map((doc: any) => (
        <div
          key={doc.id}
          className={cn(
            'flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors',
            activeDocumentId === doc.id && 'border-primary bg-muted'
          )}
          onClick={() => onDocumentClick(doc.id)}
          onContextMenu={(e) => onContextMenu(e, 'document', doc.id)}
        >
          <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{doc.name}</h3>
            <div className="text-xs text-muted-foreground">
              {doc.wordCount || 0} words · {new Date(doc.updatedAt).toLocaleDateString()}
            </div>
          </div>
          {doc.tags && doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doc.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onContextMenu(e, 'document', doc.id)
            }}
            className="p-1 hover:bg-muted rounded flex-shrink-0"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
