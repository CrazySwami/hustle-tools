'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

interface PluginNamingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pluginName: string, description?: string) => void;
  defaultName?: string; // Pre-fill with project name or other default
}

export function PluginNamingDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultName = '',
}: PluginNamingDialogProps) {
  const [pluginName, setPluginName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Update plugin name when defaultName prop changes
  useEffect(() => {
    if (defaultName) {
      setPluginName(defaultName);
    }
  }, [defaultName]);

  const handleSubmit = () => {
    // Validation
    if (!pluginName.trim()) {
      setError('Plugin name is required');
      return;
    }

    if (pluginName.trim().length < 3) {
      setError('Plugin name must be at least 3 characters');
      return;
    }

    // Submit
    onSubmit(pluginName.trim(), description.trim() || undefined);

    // Reset and close
    setPluginName('');
    setDescription('');
    setError('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPluginName(defaultName || '');
    setDescription('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Name Your WordPress Plugin</DialogTitle>
          <DialogDescription>
            This will create a new WordPress plugin with Elementor widget support.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="plugin-name">Plugin Name *</Label>
            <Input
              id="plugin-name"
              placeholder="e.g., My Custom Widgets"
              value={pluginName}
              onChange={(e) => {
                setPluginName(e.target.value);
                setError(''); // Clear error on input
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              This will be the plugin name shown in WordPress admin.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plugin-description">Description (Optional)</Label>
            <Textarea
              id="plugin-description"
              placeholder="Custom Elementor widgets for my website"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              A short description of what this plugin does.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Plugin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
