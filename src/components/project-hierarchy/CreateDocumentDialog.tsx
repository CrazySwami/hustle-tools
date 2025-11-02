'use client';

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
  const { createDocument } = useDocuments();
  const { projects } = useProjects();
  const { folders } = useFolders();
  const [title, setTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [selectedFolderId, setSelectedFolderId] = useState(initialFolderId || '');

  useEffect(() => {
    if (open) {
      setTitle('');
      setSelectedProjectId(initialProjectId || projects[0]?.id || '');
      setSelectedFolderId(initialFolderId || '');
    }
  }, [open, initialProjectId, initialFolderId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProjectId) return;

    createDocument(title.trim(), selectedProjectId, selectedFolderId || undefined);
    setTitle('');
    onClose();
  };

  if (!open) return null;

  // Get folders for selected project
  const projectFolders = folders.filter(f => f.projectId === selectedProjectId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-b border-border/50">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold flex-1">New Document</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted/80 rounded-md transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Document"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedFolderId(''); // Reset folder when project changes
                }}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProjectId && projectFolders.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Folder (Optional)
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value="">No folder (root level)</option>
                  {projectFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !selectedProjectId}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Create Document
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
