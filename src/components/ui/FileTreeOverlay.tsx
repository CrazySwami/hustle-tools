/**
 * FileTreeOverlay Component
 *
 * Visual file structure during multi-file generation.
 * Shows real-time file creation progress with status indicators.
 *
 * Features:
 * - Real-time file creation visualization
 * - Status indicators (pending, generating, complete, error)
 * - File size display
 * - Expandable tree view
 * - Click file to view in editor
 * - Mobile-optimized layout
 * - Smooth animations
 */

'use client';

import { useState } from 'react';
import { FileCode, FileText, Loader2, CheckCircle2, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FileStatus = 'pending' | 'generating' | 'complete' | 'error';

export interface FileNode {
  /** Unique file identifier */
  id: string;

  /** File name (e.g., "hero-widget.php") */
  name: string;

  /** Full file path (e.g., "widgets/hero-widget.php") */
  path: string;

  /** File type for icon selection */
  type: 'php' | 'html' | 'css' | 'js' | 'hubl' | 'md' | 'json' | 'folder';

  /** Current status */
  status: FileStatus;

  /** File size in bytes */
  size?: number;

  /** File content (optional) */
  content?: string;

  /** Child files (for folders) */
  children?: FileNode[];

  /** Whether this is a folder */
  isFolder?: boolean;
}

export interface FileTreeOverlayProps {
  /** List of files to display */
  files: FileNode[];

  /** Overlay title */
  title?: string;

  /** Whether overlay is visible */
  visible?: boolean;

  /** Callback when file is clicked */
  onFileClick?: (file: FileNode) => void;

  /** Callback when overlay is closed */
  onClose?: () => void;

  /** Position of overlay */
  position?: 'top-right' | 'bottom-right' | 'center';

  /** Whether overlay is dismissible */
  dismissible?: boolean;
}

export function FileTreeOverlay({
  files,
  title = 'Generated Files',
  visible = true,
  onFileClick,
  onClose,
  position = 'bottom-right',
  dismissible = true
}: FileTreeOverlayProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  if (!visible) return null;

  // Get status icon
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'pending':
        return <div className="w-3 h-3 rounded-full border-2 border-gray-300" />;
      case 'generating':
        return <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
  };

  // Get file type icon
  const getFileIcon = (type: FileNode['type'], isFolder?: boolean) => {
    if (isFolder) {
      return <div className="w-4 h-4 text-blue-500">📁</div>;
    }

    const iconMap = {
      php: <FileCode className="w-4 h-4 text-purple-500" />,
      html: <FileCode className="w-4 h-4 text-orange-500" />,
      css: <FileText className="w-4 h-4 text-blue-500" />,
      js: <FileCode className="w-4 h-4 text-yellow-500" />,
      hubl: <FileCode className="w-4 h-4 text-orange-600" />,
      md: <FileText className="w-4 h-4 text-gray-500" />,
      json: <FileCode className="w-4 h-4 text-green-500" />,
      folder: <div className="w-4 h-4 text-blue-500">📁</div>
    };

    return iconMap[type] || <FileText className="w-4 h-4 text-gray-500" />;
  };

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Render file tree recursively
  const renderFile = (file: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(file.id);
    const hasChildren = file.children && file.children.length > 0;

    return (
      <div key={file.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-md',
            'hover:bg-muted/50 transition-colors',
            file.isFolder ? 'cursor-pointer' : 'cursor-default',
            !file.isFolder && onFileClick && 'cursor-pointer'
          )}
          onClick={() => {
            if (file.isFolder) {
              toggleFolder(file.id);
            } else if (onFileClick) {
              onFileClick(file);
            }
          }}
        >
          {/* Expand/collapse icon for folders */}
          {file.isFolder && hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Status icon */}
          <div className="flex-shrink-0">
            {getStatusIcon(file.status)}
          </div>

          {/* File icon */}
          <div className="flex-shrink-0">
            {getFileIcon(file.type, file.isFolder)}
          </div>

          {/* File name */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {file.name}
            </div>
          </div>

          {/* File size */}
          {!file.isFolder && file.size !== undefined && (
            <div className="flex-shrink-0 text-xs text-muted-foreground">
              {formatSize(file.size)}
            </div>
          )}
        </div>

        {/* Render children if folder is expanded */}
        {file.isFolder && hasChildren && isExpanded && (
          <div className="mt-1">
            {file.children!.map(child => renderFile(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Position classes
  const positionClasses = {
    'top-right': 'top-20 right-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  // Count files by status
  const statusCounts = files.reduce((acc, file) => {
    acc[file.status] = (acc[file.status] || 0) + 1;
    return acc;
  }, {} as Record<FileStatus, number>);

  return (
    <div
      className={cn(
        'fixed z-40',
        'w-[360px] max-h-[500px]',
        'bg-background border-2 border-border rounded-lg shadow-2xl',
        'animate-in slide-in-from-right-5 duration-300',
        positionClasses[position],
        'md:w-[400px]' // Wider on desktop
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>

          {/* Status badges */}
          <div className="flex items-center gap-1">
            {statusCounts.complete > 0 && (
              <div className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                {statusCounts.complete}
              </div>
            )}
            {statusCounts.generating > 0 && (
              <div className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded animate-pulse">
                {statusCounts.generating}
              </div>
            )}
            {statusCounts.pending > 0 && (
              <div className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                {statusCounts.pending}
              </div>
            )}
            {statusCounts.error > 0 && (
              <div className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                {statusCounts.error}
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        {dismissible && onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label="Close file tree"
          >
            ✕
          </button>
        )}
      </div>

      {/* File tree */}
      <div className="overflow-y-auto max-h-[400px] p-2">
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No files to display
          </div>
        ) : (
          files.map(file => renderFile(file))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2 text-xs text-muted-foreground">
        {statusCounts.generating > 0 ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Generating files...</span>
          </div>
        ) : statusCounts.complete === files.length && files.length > 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            <span>All files generated successfully</span>
          </div>
        ) : (
          <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage file tree state
 *
 * Example usage:
 * ```tsx
 * const fileTree = useFileTree();
 *
 * // Add file
 * fileTree.addFile({
 *   id: 'main-plugin',
 *   name: 'main-plugin.php',
 *   path: 'main-plugin.php',
 *   type: 'php',
 *   status: 'pending'
 * });
 *
 * // Update file status
 * fileTree.updateFileStatus('main-plugin', 'generating');
 * fileTree.updateFileStatus('main-plugin', 'complete', 2400);
 *
 * // Render
 * <FileTreeOverlay {...fileTree.props} />
 * ```
 */
export function useFileTree() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [visible, setVisible] = useState(false);

  const addFile = (file: FileNode) => {
    setFiles(prev => [...prev, file]);
    setVisible(true);
  };

  const updateFileStatus = (fileId: string, status: FileStatus, size?: number) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === fileId
          ? { ...file, status, ...(size !== undefined && { size }) }
          : file
      )
    );
  };

  const updateFileContent = (fileId: string, content: string) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === fileId
          ? { ...file, content, size: new Blob([content]).size }
          : file
      )
    );
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const clear = () => {
    setFiles([]);
    setVisible(false);
  };

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return {
    files,
    visible,
    addFile,
    updateFileStatus,
    updateFileContent,
    removeFile,
    clear,
    show,
    hide,
    props: {
      files,
      visible,
      onClose: hide
    }
  };
}

/**
 * Helper: Generate file tree from flat file list
 */
export function generateFileTree(filePaths: string[]): FileNode[] {
  const tree: FileNode[] = [];
  const folderMap: Map<string, FileNode> = new Map();

  filePaths.forEach((path, index) => {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    const fileExtension = fileName.split('.').pop() || '';

    // Determine file type
    const typeMap: Record<string, FileNode['type']> = {
      php: 'php',
      html: 'html',
      css: 'css',
      js: 'js',
      hubl: 'hubl',
      md: 'md',
      json: 'json'
    };
    const type = typeMap[fileExtension] || 'md';

    const file: FileNode = {
      id: `file-${index}`,
      name: fileName,
      path: path,
      type: type,
      status: 'pending'
    };

    // If file is in a folder, create folder structure
    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');

      if (!folderMap.has(folderPath)) {
        const folder: FileNode = {
          id: `folder-${folderPath}`,
          name: parts[parts.length - 2],
          path: folderPath,
          type: 'folder',
          status: 'pending',
          isFolder: true,
          children: []
        };
        folderMap.set(folderPath, folder);
        tree.push(folder);
      }

      const folder = folderMap.get(folderPath);
      if (folder && folder.children) {
        folder.children.push(file);
      }
    } else {
      tree.push(file);
    }
  });

  return tree;
}
