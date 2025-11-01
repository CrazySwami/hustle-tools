'use client';

/**
 * ============================================================================
 * CREATE FOLDER DIALOG
 * ============================================================================
 *
 * Modal for creating new folders within a project.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFolders } from '@/hooks/useProjectHierarchy';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  parentFolderId?: string;
}

export function CreateFolderDialog({
  open,
  onClose,
  projectId,
  parentFolderId,
}: CreateFolderDialogProps) {
  const { createFolder } = useFolders();
  const [name, setName] = useState('');

  // Reset when dialog opens with new projectId
  useEffect(() => {
    if (open) {
      setName('');
    }
  }, [open, projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    createFolder({
      name: name.trim(),
      projectId,
      parentFolderId,
    });

    // Reset and close
    setName('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm">
        <div className="bg-card border border-border rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Create New Folder</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Folder Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Folder Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New Folder"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
