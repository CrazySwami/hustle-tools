'use client';

import { X, FileText, FileCode, Palette, Code2, Package } from 'lucide-react';

export interface FileAttachment {
  type: 'file';
  mediaType: string;
  url: string; // data URL
  name: string;
  tag: 'html' | 'css' | 'js' | 'php' | 'all';
  size: number;
}

interface FileTagChipProps {
  file: FileAttachment;
  onRemove?: () => void;
  showSize?: boolean;
  compact?: boolean;
}

const getFileIcon = (tag: string) => {
  switch (tag) {
    case 'html':
      return <FileCode className="h-3.5 w-3.5" />;
    case 'css':
      return <Palette className="h-3.5 w-3.5" />;
    case 'js':
      return <Code2 className="h-3.5 w-3.5" />;
    case 'php':
      return <FileText className="h-3.5 w-3.5" />;
    case 'all':
      return <Package className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
};

const getFileColor = (tag: string) => {
  switch (tag) {
    case 'html':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
    case 'css':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    case 'js':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
    case 'php':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    case 'all':
      return 'bg-gradient-to-r from-orange-100 via-blue-100 to-purple-100 dark:from-orange-900/30 dark:via-blue-900/30 dark:to-purple-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    default:
      return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export function FileTagChip({ file, onRemove, showSize = true, compact = false }: FileTagChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-200 hover:scale-105 ${getFileColor(
        file.tag
      )} ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <div className="animate-in fade-in zoom-in duration-300">{getFileIcon(file.tag)}</div>
      <span className="font-mono font-medium">@{file.tag}</span>
      {showSize && (
        <span className="text-[10px] opacity-70 font-mono">{formatFileSize(file.size)}</span>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label="Remove attachment"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

interface FileTagListProps {
  files: FileAttachment[];
  onRemove?: (index: number) => void;
  showSize?: boolean;
  compact?: boolean;
}

export function FileTagList({ files, onRemove, showSize = true, compact = false }: FileTagListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {files.map((file, index) => (
        <FileTagChip
          key={`${file.tag}-${index}`}
          file={file}
          onRemove={onRemove ? () => onRemove(index) : undefined}
          showSize={showSize}
          compact={compact}
        />
      ))}
    </div>
  );
}

// Helper function to create file attachment from code content
export function createCodeFileAttachment(
  tag: 'html' | 'css' | 'js' | 'php',
  content: string,
  name?: string
): FileAttachment {
  const mediaTypeMap = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    php: 'application/x-httpd-php',
  };

  const nameMap = {
    html: 'index.html',
    css: 'styles.css',
    js: 'script.js',
    php: 'functions.php',
  };

  const mediaType = mediaTypeMap[tag];
  const fileName = name || nameMap[tag];
  const dataUrl = `data:${mediaType};base64,${btoa(content)}`;

  return {
    type: 'file',
    mediaType,
    url: dataUrl,
    name: fileName,
    tag,
    size: new Blob([content]).size,
  };
}

// Helper to create "all files" attachment bundle
export function createAllFilesAttachment(files: {
  html?: string;
  css?: string;
  js?: string;
  php?: string;
}): FileAttachment {
  const combined = JSON.stringify(files, null, 2);
  const dataUrl = `data:application/json;base64,${btoa(combined)}`;

  return {
    type: 'file',
    mediaType: 'application/json',
    url: dataUrl,
    name: 'all-files.json',
    tag: 'all',
    size: new Blob([combined]).size,
  };
}
