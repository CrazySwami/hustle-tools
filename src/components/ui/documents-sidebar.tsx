"use client"

import * as React from "react"
import { File, Folder, MoreHorizontal, FolderOpen, FileText, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"

const { memo } = React

// Types
export type DocumentItem = {
  id: string
  name: string
  type: "document"
  folderId?: string
}

export type FolderItem = {
  id: string
  name: string
  type: "folder"
  isOpen?: boolean
  parentFolderId?: string
}

export type Item = DocumentItem | FolderItem

// Props
export interface DocumentsSidebarProps {
  items: Item[]
  selectedIds: string[]
  onCreateDocument?: () => void
  onCreateFolder?: () => void
  onSelect?: (id: string, isMultiSelect: boolean) => void
  onRename?: (id: string, newName: string) => void
  onDelete?: (id: string) => void
  onDeleteMultiple?: (ids: string[]) => void
  onMove?: (documentId: string, targetFolderId: string | null) => void
  onMoveFolder?: (folderId: string, targetFolderId: string | null) => void
  onToggleFolder?: (folderId: string) => void
}

export const DocumentsSidebar = memo(function DocumentsSidebar({
  items,
  selectedIds,
  onCreateDocument,
  onCreateFolder,
  onSelect,
  onRename,
  onDelete,
  onDeleteMultiple,
  onMove,
  onMoveFolder,
  onToggleFolder,
}: DocumentsSidebarProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState("")
  const [draggedId, setDraggedId] = React.useState<string | null>(null)
  const [draggedType, setDraggedType] = React.useState<"document" | "folder" | null>(null)

  const folders = items.filter((item): item is FolderItem => item.type === "folder")
  const documents = items.filter((item): item is DocumentItem => item.type === "document")

  const rootFolders = folders.filter((f) => !f.parentFolderId)

  const handleSelect = (id: string, event: React.MouseEvent) => {
    const isMultiSelect = event.metaKey || event.ctrlKey || event.shiftKey
    onSelect?.(id, isMultiSelect)
  }

  const handleRename = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim() && editingName !== items.find((i) => i.id === id)?.name) {
      onRename?.(id, editingName.trim())
    }
    setEditingId(null)
    setEditingName("")
  }

  const handleDragStart = (id: string, type: "document" | "folder") => {
    setDraggedId(id)
    setDraggedType(type)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetFolderId: string | null) => {
    if (draggedId && draggedType) {
      if (draggedType === "document") {
        onMove?.(draggedId, targetFolderId)
      } else if (draggedType === "folder") {
        if (draggedId !== targetFolderId) {
          onMoveFolder?.(draggedId, targetFolderId)
        }
      }
      setDraggedId(null)
      setDraggedType(null)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      onDeleteMultiple?.(selectedIds)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Documents</h2>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onCreateDocument}
            title="New Document"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onCreateFolder}
            title="New Folder"
          >
            <Folder className="h-4 w-4" />
          </Button>
          {selectedIds.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleDeleteSelected}
              title={`Delete ${selectedIds.length} item(s)`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-1">
          {/* Root level documents */}
          {documents
            .filter((doc) => !doc.folderId)
            .map((doc) => (
              <DocumentRow
                key={doc.id}
                item={doc}
                isSelected={selectedIds.includes(doc.id)}
                isEditing={editingId === doc.id}
                editingName={editingName}
                onSelect={handleSelect}
                onRename={handleRename}
                onRenameSubmit={handleRenameSubmit}
                onDelete={onDelete}
                onDragStart={handleDragStart}
                setEditingName={setEditingName}
              />
            ))}

          {rootFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              allFolders={folders}
              documents={documents}
              selectedIds={selectedIds}
              editingId={editingId}
              editingName={editingName}
              onSelect={handleSelect}
              onRename={handleRename}
              onRenameSubmit={handleRenameSubmit}
              onDelete={onDelete}
              onToggleFolder={onToggleFolder}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              setEditingName={setEditingName}
            />
          ))}
        </div>
      </div>

      {/* Multi-select hint bar at bottom */}
      <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        {selectedIds.length > 0 ? (
          <span>{selectedIds.length} item(s) selected</span>
        ) : (
          <span>⌘/Ctrl + Click to multi-select</span>
        )}
      </div>
    </div>
  )
})

// Document Row Component
interface DocumentRowProps {
  item: DocumentItem
  isSelected: boolean
  isEditing: boolean
  editingName: string
  onSelect: (id: string, event: React.MouseEvent) => void
  onRename: (id: string, name: string) => void
  onRenameSubmit: (id: string) => void
  onDelete?: (id: string) => void
  onDragStart: (id: string, type: "document" | "folder") => void
  setEditingName: (name: string) => void
  indent?: number
}

const DocumentRow = memo(function DocumentRow({
  item,
  isSelected,
  isEditing,
  editingName,
  onSelect,
  onRename,
  onRenameSubmit,
  onDelete,
  onDragStart,
  setEditingName,
  indent = 0,
}: DocumentRowProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        isSelected
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent",
        "cursor-pointer",
      )}
      style={{ paddingLeft: `${8 + indent * 16}px` }}
      onClick={(e) => !isEditing && onSelect(item.id, e)}
      draggable={!isEditing}
      onDragStart={() => onDragStart(item.id, "document")}
    >
      <File className="h-4 w-4 shrink-0" />
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={() => onRenameSubmit(item.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRenameSubmit(item.id)
            } else if (e.key === "Escape") {
              setEditingName(item.name)
              onRenameSubmit(item.id)
            }
          }}
          className="h-6 flex-1 bg-background px-2 text-sm text-foreground"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{item.name}</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
              isSelected && "text-sidebar-primary-foreground opacity-100",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRename(item.id, item.name)}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete?.(item.id)} className="text-destructive focus:text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

// Folder Row Component
interface FolderRowProps {
  folder: FolderItem
  allFolders: FolderItem[]
  documents: DocumentItem[]
  selectedIds: string[]
  editingId: string | null
  editingName: string
  onSelect: (id: string, event: React.MouseEvent) => void
  onRename: (id: string, name: string) => void
  onRenameSubmit: (id: string) => void
  onDelete?: (id: string) => void
  onToggleFolder?: (id: string) => void
  onDragStart: (id: string, type: "document" | "folder") => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (folderId: string | null) => void
  setEditingName: (name: string) => void
  indent?: number
}

const FolderRow = memo(function FolderRow({
  folder,
  allFolders,
  documents,
  selectedIds,
  editingId,
  editingName,
  onSelect,
  onRename,
  onRenameSubmit,
  onDelete,
  onToggleFolder,
  onDragStart,
  onDragOver,
  onDrop,
  setEditingName,
  indent = 0,
}: FolderRowProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isEditing = editingId === folder.id
  const isSelected = selectedIds.includes(folder.id)

  const childFolders = allFolders.filter((f) => f.parentFolderId === folder.id)
  const folderDocuments = documents.filter((doc) => doc.folderId === folder.id)

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <Collapsible open={folder.isOpen} onOpenChange={() => onToggleFolder?.(folder.id)}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "group relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            isSelected
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
          )}
          style={{ paddingLeft: `${8 + indent * 16}px` }}
          onDragOver={onDragOver}
          onDrop={(e) => {
            e.stopPropagation()
            onDrop(folder.id)
          }}
          draggable={!isEditing}
          onDragStart={(e) => {
            e.stopPropagation()
            onDragStart(folder.id, "folder")
          }}
        >
          {folder.isOpen ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => onRenameSubmit(folder.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onRenameSubmit(folder.id)
                } else if (e.key === "Escape") {
                  setEditingName(folder.name)
                  onRenameSubmit(folder.id)
                }
              }}
              className="h-6 flex-1 bg-background px-2 text-sm text-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 truncate"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(folder.id, e)
              }}
            >
              {folder.name}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                  isSelected && "text-sidebar-primary-foreground opacity-100",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRename(folder.id, folder.name)}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(folder.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1">
          {childFolders.map((childFolder) => (
            <FolderRow
              key={childFolder.id}
              folder={childFolder}
              allFolders={allFolders}
              documents={documents}
              selectedIds={selectedIds}
              editingId={editingId}
              editingName={editingName}
              onSelect={onSelect}
              onRename={onRename}
              onRenameSubmit={onRenameSubmit}
              onDelete={onDelete}
              onToggleFolder={onToggleFolder}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              setEditingName={setEditingName}
              indent={indent + 1}
            />
          ))}
          {folderDocuments.map((doc) => (
            <DocumentRow
              key={doc.id}
              item={doc}
              isSelected={selectedIds.includes(doc.id)}
              isEditing={editingId === doc.id}
              editingName={editingName}
              onSelect={(id, event) => onSelect(id, event)}
              onRename={onRename}
              onRenameSubmit={onRenameSubmit}
              onDelete={onDelete}
              onDragStart={onDragStart}
              setEditingName={setEditingName}
              indent={indent + 1}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})
