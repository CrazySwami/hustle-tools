'use client';

/**
 * ============================================================================
 * CREATE PROJECT DIALOG
 * ============================================================================
 *
 * Modal for creating new projects with template selection.
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useProjects } from '@/hooks/useProjectHierarchy';
import { ProjectTemplate, PROJECT_TEMPLATES } from '@/types/project';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const { createProject } = useProjects();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>('custom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const templateInfo = PROJECT_TEMPLATES[template];

    createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      template,
      icon: templateInfo.icon,
    });

    // Reset and close
    setName('');
    setDescription('');
    setTemplate('custom');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setTemplate('custom');
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
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Create New Project</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Project Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PROJECT_TEMPLATES) as ProjectTemplate[]).map((key) => {
                  const tmpl = PROJECT_TEMPLATES[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTemplate(key)}
                      className={cn(
                        "flex flex-col items-start p-3 border rounded-md transition-all text-left",
                        template === key
                          ? "border-primary bg-primary/5 ring-2 ring-primary/50"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="text-2xl mb-1">{tmpl.icon}</div>
                      <div className="text-sm font-medium">{tmpl.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {tmpl.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              {template !== 'custom' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Default folders: {PROJECT_TEMPLATES[template].defaultFolders.join(', ')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
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
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
