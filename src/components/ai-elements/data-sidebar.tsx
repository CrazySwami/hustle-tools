"use client"

import React, { useState, useMemo } from "react"
import { ChevronRight, ChevronDown, ChevronLeft, Plus, Search, File, Folder, Bot, CheckSquare, MoreVertical, FileText, FileSpreadsheet, FileImage, FileCode, FileVideo, FileAudio, FileArchive, Trash2, X, Edit2, GripVertical } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddContextModal } from "@/components/ai-elements/add-context-modal"
import { cn } from "@/lib/utils"
import { getIconForFile } from 'vscode-icons-js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilePreviewModal } from "@/components/ai-elements/file-preview-modal"
import { CreateDocOrFolderModal } from "@/components/modals/CreateDocOrFolderModal"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DataItem {
  id: string
  name: string
  type: "folder" | "file" | "integration" | "ditto" | "active-folder"
  icon?: string
  children?: DataItem[]
  metadata?: {
    company?: string
    logo?: string
    isUserDitto?: boolean
  }
  isActive?: boolean
  isTagged?: boolean
}

// Helper function to get file icon based on extension - exported for use in tags
export const getFileIcon = (fileName: string, className: string = "h-4 w-4 shrink-0") => {
  const iconName = getIconForFile(fileName);
  
  return (
    <img 
      src={`https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/${iconName}`}
      alt={fileName}
      style={{ width: '16px', height: '16px', display: 'inline-block' }}
    />
  );
};

const initialData: DataItem[] = [
  {
    id: "bob-ditto",
    name: "Bob's Ditto",
    type: "ditto",
    metadata: {
      isUserDitto: true,
    },
    children: [
      { id: "bob-rules", name: "Bob's Rules.pdf", type: "file" },
      { id: "bob-context", name: "Context Examples.txt", type: "file" },
      { id: "bob-workflows", name: "Workflows.docx", type: "file" },
      { id: "bob-references", name: "Reference Materials.pdf", type: "file" },
      { id: "bob-communication", name: "Communication Style.txt", type: "file" },
      { id: "bob-projects", name: "Past Projects.docx", type: "file" },
    ],
  },
  {
    id: "active-files",
    name: "Active Files",
    type: "active-folder",
    isActive: true,
    children: [
      { id: "active-1", name: "Current Project Brief.pdf", type: "file" },
      { id: "active-2", name: "Active Requirements.txt", type: "file" },
    ],
  },
  {
    id: "files",
    name: "Files",
    type: "folder",
    children: [
      { id: "file-1", name: "Example Output.docx", type: "file" },
      { id: "file-2", name: "Voice & Tone Guide.pdf", type: "file" },
      { id: "file-3", name: "Workflow Preferences.txt", type: "file" },
      { id: "file-4", name: "Terminology Glossary.docx", type: "file" },
    ],
  },
  {
    id: "kyle-ditto",
    name: "Kyle's Ditto",
    type: "ditto",
    children: [
      { id: "kyle-rules", name: "Kyle's Rules.pdf", type: "file" },
      { id: "kyle-style", name: "Style Guide.txt", type: "file" },
      { id: "kyle-examples", name: "Example Outputs.docx", type: "file" },
    ],
  },
  {
    id: "alfonso-ditto",
    name: "Alfonso's Ditto",
    type: "ditto",
    children: [
      { id: "alfonso-rules", name: "Alfonso's Rules.pdf", type: "file" },
      { id: "alfonso-style", name: "Style Guide.txt", type: "file" },
      { id: "alfonso-templates", name: "Templates.docx", type: "file" },
      { id: "alfonso-brand", name: "Brand Standards.pdf", type: "file" },
      { id: "alfonso-writing", name: "Writing Samples.docx", type: "file" },
      { id: "alfonso-feedback", name: "Feedback Examples.txt", type: "file" },
    ],
  },
]

interface DataSidebarProps {
  onToggle?: () => void;
  onDocumentTag?: (doc: DataItem) => void;
  documents?: Array<{ id: string; title: string }>;
  activeDocumentId?: string;
  onDocumentSelect?: (id: string) => void;
  onCreateDocument?: (title: string) => void;
  onCreateFolder?: (name: string) => void;
  onDeleteDocuments?: (ids: string[]) => void;
  onRenameDocument?: (id: string, newName: string) => void;
}

export function DataSidebar({
  onToggle,
  onDocumentTag,
  documents = [],
  activeDocumentId,
  onDocumentSelect,
  onCreateDocument,
  onCreateFolder,
  onDeleteDocuments,
  onRenameDocument,
}: DataSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["active-files", "active-docs", "bob-ditto", "files", "kyle-ditto", "alfonso-ditto"]),
  )
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [data, setData] = useState<DataItem[]>(initialData)
  const [draggedItem, setDraggedItem] = useState<DataItem | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [previewFile, setPreviewFile] = useState<DataItem | null>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [lastClickedId, setLastClickedId] = useState<string>('')

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Create Active Docs folder with documents from props
  const dataWithActiveDocs = useMemo(() => {
    const activeDocsFolder: DataItem = {
      id: "active-docs",
      name: "Active Docs",
      type: "active-folder",
      isActive: true,
      children: documents.map(doc => ({
        id: doc.id,
        name: doc.title,
        type: "file" as const,
        isActive: doc.id === activeDocumentId,
      })),
    };

    // Insert Active Docs at the beginning
    return [activeDocsFolder, ...data];
  }, [documents, activeDocumentId, data]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleConnect = (platformId: string, platformName: string, platformLogo: string, dataSources: any[]) => {
    if (platformId === "google-drive") {
      const googleDriveFolder: DataItem = {
        id: `google-drive-${Date.now()}`,
        name: "Google Drive",
        type: "integration",
        metadata: {
          company: "Google Drive",
          logo: platformLogo,
        },
        children: [
          {
            id: "gd-campaigns",
            name: "Marketing Campaigns",
            type: "folder",
            children: [
              { id: "gd-q1-campaign", name: "Q1 2025 Launch Strategy.doc", type: "file" },
              { id: "gd-social-calendar", name: "Social Media Calendar.sheet", type: "file" },
              { id: "gd-email-templates", name: "Email Templates.doc", type: "file" },
            ],
          },
          {
            id: "gd-client-assets",
            name: "Client Assets",
            type: "folder",
            children: [
              { id: "gd-brand-guidelines", name: "Brand Guidelines.pdf", type: "file" },
              { id: "gd-logos", name: "Logo Pack.zip", type: "file" },
              { id: "gd-photography", name: "Product Photography", type: "folder" },
            ],
          },
          {
            id: "gd-analytics",
            name: "Analytics & Reports",
            type: "folder",
            children: [
              { id: "gd-monthly-report", name: "Monthly Performance Report.sheet", type: "file" },
              { id: "gd-roi-analysis", name: "ROI Analysis Q4.sheet", type: "file" },
              { id: "gd-competitor", name: "Competitor Analysis.doc", type: "file" },
            ],
          },
          {
            id: "gd-content",
            name: "Content Library",
            type: "folder",
            children: [
              { id: "gd-blog-posts", name: "Blog Posts Draft", type: "folder" },
              { id: "gd-ad-copy", name: "Ad Copy Templates.doc", type: "file" },
              { id: "gd-video-scripts", name: "Video Scripts.doc", type: "file" },
            ],
          },
          {
            id: "gd-presentations",
            name: "Client Presentations",
            type: "folder",
            children: [
              { id: "gd-pitch-deck", name: "Agency Pitch Deck.slide", type: "file" },
              { id: "gd-results", name: "Campaign Results.slide", type: "file" },
            ],
          },
        ],
      }

      setData((prevData) => [...prevData, googleDriveFolder])
      setExpandedIds((prev) => new Set([...prev, googleDriveFolder.id]))
    }
  }

  const handleAddFiles = async (files: File[], targetFolder: string = "files") => {
    const targetItem = data.find((item) => item.id === targetFolder)
    if (targetItem) {
      // Read file contents and store them
      const newFilesPromises = files.map(async (file) => {
        const fileId = `file-${Date.now()}-${Math.random()}`;
        
        // Read file content
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          
          // For images, store as data URL
          if (file.type.startsWith('image/')) {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          } 
          // For text files, store as text
          else if (file.type.startsWith('text/') || 
                   file.name.endsWith('.txt') || 
                   file.name.endsWith('.md') ||
                   file.name.endsWith('.json') ||
                   file.name.endsWith('.csv')) {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          }
          // For other files, store as data URL
          else {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          }
        });

        // Store file content in localStorage
        try {
          localStorage.setItem(`file-content-${fileId}`, content);
          localStorage.setItem(`file-type-${fileId}`, file.type);
        } catch (e) {
          console.warn('Failed to store file in localStorage:', e);
        }

        return {
          id: fileId,
          name: file.name,
          type: "file" as const,
        };
      });

      const newFiles = await Promise.all(newFilesPromises);

      const updatedData = data.map((item) => {
        if (item.id === targetFolder) {
          return {
            ...item,
            children: [...(item.children || []), ...newFiles],
          }
        }
        return item
      })
      setData(updatedData)
      setExpandedIds((prev) => new Set([...prev, targetFolder]))
      
      // Save updated data structure to localStorage
      try {
        localStorage.setItem('sidebar-data', JSON.stringify(updatedData));
      } catch (e) {
        console.warn('Failed to save sidebar data:', e);
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, item: DataItem) => {
    // Allow dragging files, folders, and dittos
    if (item.type === 'file' || item.type === 'folder' || item.type === 'ditto') {
      setDraggedItem(item)
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent, targetItem: DataItem) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedItem && targetItem.id === 'active-files') {
      // Add to active files if not already there
      const activeFolder = data.find(d => d.id === 'active-files')
      const alreadyActive = activeFolder?.children?.some(c => c.id === draggedItem.id)
      
      if (!alreadyActive) {
        const updatedData = data.map(item => {
          if (item.id === 'active-files') {
            return {
              ...item,
              children: [...(item.children || []), { ...draggedItem, isActive: true }]
            }
          }
          return item
        })
        setData(updatedData)
      }
    }
    setDraggedItem(null)
  }

  const handleDocumentClick = (item: DataItem, e: React.MouseEvent, parentId?: string) => {
    // Multi-select mode
    if (isMultiSelectMode && item.type === 'file') {
      e.stopPropagation();
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
      return;
    }

    if (item.type === 'file') {
      // Double-click detection (within 300ms)
      const now = Date.now();
      if (lastClickedId === item.id && now - lastClickTime < 300) {
        // Double-click detected - open preview
        setPreviewFile(item);
        setLastClickTime(0);
        setLastClickedId('');
        return;
      }
      
      // Update last click info
      setLastClickTime(now);
      setLastClickedId(item.id);

      // If it's a document from Active Docs, select it
      if (parentId === 'active-docs' && onDocumentSelect) {
        onDocumentSelect(item.id);
      }
      // Cmd+Click to tag document
      else if (e.metaKey && onDocumentTag) {
        onDocumentTag(item);
      }
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.size > 0 && onDeleteDocuments) {
      onDeleteDocuments(Array.from(selectedItems));
      setSelectedItems(new Set());
      setIsMultiSelectMode(false);
    }
  }

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedItems(new Set());
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const allItems = dataWithActiveDocs;
      const draggedItem = allItems.find((item) => item.id === active.id);
      const targetItem = allItems.find((item) => item.id === over.id);

      // RULE 1: Active Docs can never be moved
      if (active.id === 'active-docs' || over.id === 'active-docs') {
        console.log('❌ Cannot drag Active Docs or drag items into Active Docs');
        return;
      }

      // RULE 2: Respect the divider - items can't cross between ACTIVE DIRECTORY and RELEVANT
      const activeDirItems = ['active-docs', 'bob-ditto', 'active-files'];
      const isActiveInActiveDir = draggedItem && activeDirItems.includes(draggedItem.id);
      const isTargetInActiveDir = targetItem && activeDirItems.includes(targetItem.id);

      if (isActiveInActiveDir !== isTargetInActiveDir) {
        console.log('❌ Cannot drag items across ACTIVE DIRECTORY / RELEVANT divider');
        return;
      }

      // RULE 3: Can't drag files that belong to Active Docs
      // (Documents in Active Docs are managed by the system, not draggable)

      const oldIndex = allItems.findIndex((item) => item.id === active.id);
      const newIndex = allItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(allItems, oldIndex, newIndex);

        // Filter out Active Docs and Active Files (which are dynamically generated)
        const updatedData = reordered.filter(item =>
          item.id !== 'active-docs' && item.id !== 'active-files'
        );
        setData(updatedData);
      }
    }
  };

  const SortableItem = ({ item, level, parentId }: { item: DataItem; level: number; parentId?: string }) => {
    // Disable dragging for Active Docs, documents inside Active Docs, and Active Files
    const isDraggable = item.id !== 'active-docs' &&
                        item.id !== 'active-files' &&
                        parentId !== 'active-docs'; // Don't allow dragging documents out of Active Docs

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: item.id,
      disabled: !isDraggable,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        {renderItem(item, level, parentId, attributes, isDraggable ? listeners : undefined)}
      </div>
    );
  };

  const renderItem = (item: DataItem, level = 0, parentId?: string, dragAttributes?: any, dragListeners?: any) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedIds.has(item.id)
    const isActiveFolder = item.type === 'active-folder'
    const isUserDitto = item.metadata?.isUserDitto

    return (
      <div key={item.id}>
        <div
          className={cn(
            "group flex items-center gap-2 py-1.5 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors",
            "text-sm text-sidebar-foreground",
            item.isTagged && "bg-blue-50 dark:bg-blue-950",
            item.isActive && "bg-mint-50 dark:bg-mint-950 font-semibold",
            isUserDitto && "font-bold"
          )}
          style={{ paddingLeft: `${level * 24 + 12}px`, paddingRight: '12px' }}
          onClick={(e) => {
            if (hasChildren) {
              toggleExpand(item.id)
            } else {
              handleDocumentClick(item, e, parentId)
            }
          }}
          draggable={item.type === 'file' || item.type === 'folder' || item.type === 'ditto'}
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={isActiveFolder ? handleDragOver : undefined}
          onDrop={isActiveFolder ? (e) => handleDrop(e, item) : undefined}
          title={isActiveFolder ? "All files in this folder are active context for the project and chat" : undefined}
        >
          {/* Drag handle */}
          {!isMultiSelectMode && dragListeners && (
            <button
              {...dragListeners}
              {...dragAttributes}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing -ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3 w-3 text-gray-400" />
            </button>
          )}

          {/* Multi-select checkbox with larger clickable area */}
          {isMultiSelectMode && item.type === 'file' ? (
            <div 
              className="shrink-0 flex items-center justify-center w-6 h-6 -ml-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleDocumentClick(item, e, parentId);
              }}
            >
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => {}}
                className="w-4 h-4 pointer-events-none"
              />
            </div>
          ) : isMultiSelectMode && hasChildren ? (
            <div className="shrink-0 flex items-center gap-1">
              <button
                className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // Select all files in this folder
                  if (item.children) {
                    const fileIds = item.children
                      .filter(child => child.type === 'file')
                      .map(child => child.id);
                    setSelectedItems(prev => {
                      const newSet = new Set(prev);
                      fileIds.forEach(id => newSet.add(id));
                      return newSet;
                    });
                  }
                }}
              >
                Select All
              </button>
              <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          ) : hasChildren || item.id === 'active-docs' ? (
            <button className="shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : !dragListeners ? (
            <div className="w-4" />
          ) : null}


          {item.type === "ditto" ? (
            <Image
              src="/Ditto.png"
              alt="Ditto"
              width={16}
              height={16}
              className="shrink-0"
            />
          ) : item.type === "integration" ? (
            item.metadata?.company === "Google Drive" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.3 78" className="h-5 w-5 shrink-0">
                <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z"/>
                <path fill="#00ac47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z"/>
                <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z"/>
                <path fill="#00832d" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"/>
                <path fill="#2684fc" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/>
                <path fill="#ffba00" d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z"/>
              </svg>
            ) : item.metadata?.logo ? (
              <img
                src={item.metadata.logo}
                alt={item.metadata.company}
                className="h-5 w-5 shrink-0 rounded object-contain"
              />
            ) : null
          ) : item.type === "active-folder" ? (
            <Folder className="h-4 w-4 shrink-0" style={{ fill: '#6ee7b7', color: '#6ee7b7' }} />
          ) : item.type === "folder" ? (
            <Folder className="h-4 w-4 shrink-0" style={{ color: '#6ee7b7' }} />
          ) : (
            getFileIcon(item.name, cn(
              "h-4 w-4 shrink-0",
              item.isActive && "font-bold"
            ))
          )}

          <span className="truncate">{item.name}</span>
          
          {/* User's personal ditto indicator */}
          {item.type === 'ditto' && item.metadata?.isUserDitto && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded" style={{ backgroundColor: '#6ee7b7', color: '#065f46' }}>
              You
            </span>
          )}

          {/* Add button for Active Docs folder - ALWAYS visible on hover */}
          {item.id === 'active-docs' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateModalOpen(true);
              }}
              className="shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1"
              style={{ backgroundColor: '#6ee7b7' }}
              title="Add document or folder"
            >
              <Plus className="h-3 w-3 text-white" />
            </button>
          )}

          {/* Three-dot menu for files - shows options */}
          {item.type === 'file' && !isMultiSelectMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Options"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    const newName = window.prompt('Rename file:', item.name);
                    if (newName && newName !== item.name && onRenameDocument) {
                      onRenameDocument(item.id, newName);
                    }
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMultiSelectMode();
                    setSelectedItems(new Set([item.id]));
                  }}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children?.map((child) => (
              <SortableItem key={child.id} item={child} level={level + 1} parentId={item.id} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <aside className="w-full h-full flex flex-col bg-[#fafafa] dark:bg-[#1a1a1a]">
        <div className="border-b flex-shrink-0 flex items-center justify-between bg-[#EBEBEB] dark:bg-[#2C2C2C] border-b-[rgba(0,0,0,0.08)] dark:border-b-[rgba(255,255,255,0.08)]" style={{ 
          height: '55px',
          padding: '0 16px',
          fontSize: '0.875rem'
        }}>
          {isMultiSelectMode ? (
            // Multi-select mode - replace entire header
            <>
              <h2 className="text-sm text-foreground">
                {selectedItems.size} selected
              </h2>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedItems.size === 0}
                  className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                  title={`Delete ${selectedItems.size} item(s)`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={toggleMultiSelectMode}
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            // Normal mode
            <>
              <h2 className="text-sm text-foreground">Context Library</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  title="Add context"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0 bg-[#fafafa] dark:bg-[#1a1a1a]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={dataWithActiveDocs.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {/* Active Directory Section */}
              <div className="text-xs font-semibold text-gray-500 px-3 py-1 mb-1">
                ACTIVE DIRECTORY
              </div>
              
              {dataWithActiveDocs.slice(0, 3).map((item, index) => (
                <React.Fragment key={item.id}>
                  <SortableItem item={item} level={0} />
                  {/* Divider after Active Files */}
                  {item.id === 'active-files' && (
                    <div className="my-3 border-t border-gray-300" />
                  )}
                </React.Fragment>
              ))}

              {/* Relevant Section */}
              {dataWithActiveDocs.length > 3 && (
                <>
                  <div className="text-xs font-semibold text-gray-500 px-3 py-1 mb-1 mt-2">
                    RELEVANT
                  </div>
                  {dataWithActiveDocs.slice(3).map((item) => (
                    <SortableItem key={item.id} item={item} level={0} />
                  ))}
                </>
              )}
            </SortableContext>
          </DndContext>
        </div>
      </aside>

      <AddContextModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConnect={handleConnect}
        onAddItems={handleAddFiles}
      />

      <FilePreviewModal
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        fileName={previewFile?.name || ''}
        fileUrl={previewFile ? localStorage.getItem(`file-content-${previewFile.id}`) || undefined : undefined}
        fileContent={previewFile ? localStorage.getItem(`file-content-${previewFile.id}`) || undefined : undefined}
        fileType={previewFile ? localStorage.getItem(`file-type-${previewFile.id}`) || previewFile.type : undefined}
      />

      <CreateDocOrFolderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateDocument={(title) => {
          onCreateDocument?.(title);
        }}
        onCreateFolder={(name) => {
          onCreateFolder?.(name);
        }}
      />
    </>
  )
}
