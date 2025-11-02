'use client';

import { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { useFolders, useProjects } from '@/hooks/useProjectHierarchy';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}

export function CreateFolderDialog({ open, onClose, projectId: initialProjectId }: CreateFolderDialogProps) {
  const { createFolder } = useFolders();
  const { projects } = useProjects();
  const [name, setName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');

  useEffect(() => {
    if (open) {
      setSelectedProjectId(initialProjectId || projects[0]?.id || '');
      setName('');
    }
  }, [open, initialProjectId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedProjectId) return;

    createFolder(name.trim(), selectedProjectId);
    setName('');
    onClose();
  };

  if (!open) return null;

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
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/50">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Folder className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold flex-1">New Folder</h2>
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
                Folder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Folder"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
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
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
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
                disabled={!name.trim() || !selectedProjectId}
                className="px-5 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md dark:bg-amber-500 dark:hover:bg-amber-600"
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
