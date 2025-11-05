'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (widgetName: string, shouldGenerate: boolean) => void;
  pluginName?: string; // Display the plugin name for context
}

export function AddWidgetDialog({
  open,
  onOpenChange,
  onSubmit,
  pluginName,
}: AddWidgetDialogProps) {
  const [widgetName, setWidgetName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (shouldGenerate: boolean) => {
    // Validation
    if (!widgetName.trim()) {
      setError('Widget name is required');
      return;
    }

    if (widgetName.trim().length < 3) {
      setError('Widget name must be at least 3 characters');
      return;
    }

    // Submit
    onSubmit(widgetName.trim(), shouldGenerate);

    // Reset and close
    setWidgetName('');
    setError('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setWidgetName('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Widget to Plugin</DialogTitle>
          <DialogDescription>
            {pluginName ? (
              <>
                Create a new widget for <strong>{pluginName}</strong> plugin.
              </>
            ) : (
              <>Create a new Elementor widget in this plugin.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="widget-name">Widget Name</Label>
            <Input
              id="widget-name"
              placeholder="e.g., Hero Section"
              value={widgetName}
              onChange={(e) => {
                setWidgetName(e.target.value);
                setError(''); // Clear error on input
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(false); // Default to blank on Enter
                }
              }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              This will create a new PHP widget file and register it in the plugin.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-initial"
            >
              Create Blank
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-initial"
            >
              Generate with AI
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
