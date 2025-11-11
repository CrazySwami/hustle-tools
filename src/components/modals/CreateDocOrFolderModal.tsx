'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Folder, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateDocOrFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDocument: (title: string) => void;
  onCreateFolder: (name: string) => void;
}

export function CreateDocOrFolderModal({
  open,
  onOpenChange,
  onCreateDocument,
  onCreateFolder,
}: CreateDocOrFolderModalProps) {
  const [step, setStep] = useState<'choose' | 'document' | 'folder'>('choose');
  const [name, setName] = useState('');

  const handleClose = () => {
    setStep('choose');
    setName('');
    onOpenChange(false);
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    if (step === 'document') {
      onCreateDocument(name);
    } else if (step === 'folder') {
      onCreateFolder(name);
    }

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {step === 'choose' && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>What would you like to create?</DialogTitle>
                <button
                  onClick={handleClose}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 py-8">
              {/* Document Option */}
              <button
                onClick={() => setStep('document')}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-gray-200 hover:border-[#6ee7b7] hover:bg-gray-50 transition-all group"
              >
                <div className="w-20 h-20 rounded-full bg-[#6ee7b7] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-[#065f46]" />
                </div>
                <span className="text-sm font-medium">Document</span>
              </button>

              {/* Folder Option */}
              <button
                onClick={() => setStep('folder')}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-gray-200 hover:border-[#6ee7b7] hover:bg-gray-50 transition-all group"
              >
                <div className="w-20 h-20 rounded-full bg-[#6ee7b7] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Folder className="h-10 w-10 text-[#065f46]" />
                </div>
                <span className="text-sm font-medium">Folder</span>
              </button>
            </div>
          </>
        )}

        {step === 'document' && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Create New Document</DialogTitle>
                <button
                  onClick={handleClose}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  placeholder="Enter document name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      handleCreate();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep('choose')}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                style={{ backgroundColor: '#6ee7b7', color: '#065f46' }}
                className="hover:opacity-90"
              >
                Create Document
              </Button>
            </div>
          </>
        )}

        {step === 'folder' && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Create New Folder</DialogTitle>
                <button
                  onClick={handleClose}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="Enter folder name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      handleCreate();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep('choose')}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                style={{ backgroundColor: '#6ee7b7', color: '#065f46' }}
                className="hover:opacity-90"
              >
                Create Folder
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
