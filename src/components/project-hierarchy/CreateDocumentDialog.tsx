'use client';

/**
 * ============================================================================
 * CREATE DOCUMENT DIALOG
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { useDocuments, useProjects, useFolders } from '@/hooks/useProjectHierarchy';

interface CreateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  folderId?: string;
}

export function CreateDocumentDialog({
  open,
  onClose,
  projectId: initialProjectId,
  folderId: initialFolderId,
}: CreateDocumentDialogProps) {
  const { projects } = useProjects();
  const { folders } = useFolders();
  const { createDocument } = useDocuments();

  const [title, setTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [selectedFolderId, setSelectedFolderId] = useState(initialFolderId || '');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setSelectedProjectId(initialProjectId || (projects[0]?.id || ''));
      setSelectedFolderId(initialFolderId || '');
    }
  }, [open, initialProjectId, initialFolderId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !selectedProjectId) {
      return;
    }

    createDocument({
      title: title.trim(),
      content: '',
      projectId: selectedProjectId,
      folderId: selectedFolderId || undefined,
      tags: [],
    });

    onClose();
  };

  if (!open) return null;

  // Get folders for selected project
  const projectFolders = folders.filter(f => f.projectId === selectedProjectId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg shadow-lg z-[101]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">New Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Document Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Document"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              required
            />
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedFolderId(''); // Reset folder when project changes
              }}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.icon || '📁'} {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Folder Selection (optional) */}
          {selectedProjectId && projectFolders.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Folder (Optional)
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">No folder (root level)</option>
                {projectFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.icon || '📂'} {folder.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !selectedProjectId}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Document
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
