'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileCode, Package, Check } from 'lucide-react';
import JSZip from 'jszip';
import { FileGroup } from '@/lib/file-group-manager';

interface PluginDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plugin: FileGroup | null;
}

export function PluginDownloadModal({
  open,
  onOpenChange,
  plugin,
}: PluginDownloadModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null); // Track which file is being downloaded

  if (!plugin || !plugin.isPlugin) {
    return null;
  }

  // Download individual file
  const downloadFile = (filename: string, content: string) => {
    setDownloading(filename);

    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Show success feedback
      setTimeout(() => {
        setDownloading(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to download file:', error);
      setDownloading(null);
      alert('Failed to download file');
    }
  };

  // Download complete plugin as ZIP
  const downloadPluginZIP = async () => {
    setDownloading('zip');

    try {
      const zip = new JSZip();

      // Add main plugin file to root
      if (plugin.pluginMainFile) {
        zip.file(`${plugin.pluginSlug}.php`, plugin.pluginMainFile);
      }

      // Add widgets folder with all widget files
      const widgetsFolder = zip.folder('widgets');
      if (widgetsFolder && plugin.widgetFiles) {
        Object.values(plugin.widgetFiles).forEach((widget) => {
          widgetsFolder.file(`${widget.slug}.php`, widget.content);
        });
      }

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plugin.pluginSlug}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      // Show success feedback
      setTimeout(() => {
        setDownloading(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      setDownloading(null);
      alert('Failed to create plugin ZIP');
    }
  };

  const widgetCount = plugin.widgetFiles ? Object.keys(plugin.widgetFiles).length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Download Plugin Files</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {plugin.pluginName} • {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Column 1: Individual Files */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Individual Files
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {/* Main plugin file */}
              {plugin.pluginMainFile && (
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="h-4 w-4 flex-shrink-0 text-purple-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {plugin.pluginSlug}.php
                      </p>
                      <p className="text-xs text-muted-foreground">Main plugin file</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFile(`${plugin.pluginSlug}.php`, plugin.pluginMainFile!)}
                    disabled={downloading !== null}
                  >
                    {downloading === `${plugin.pluginSlug}.php` ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Widget files */}
              {plugin.widgetFiles &&
                Object.values(plugin.widgetFiles).map((widget) => (
                  <div
                    key={widget.slug}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="h-4 w-4 flex-shrink-0 text-blue-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{widget.slug}.php</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {widget.name} • {widget.className}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadFile(`${widget.slug}.php`, widget.content)}
                      disabled={downloading !== null}
                    >
                      {downloading === `${widget.slug}.php` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: Complete Plugin ZIP */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Complete Plugin
            </h3>

            <div className="border rounded-lg p-6 space-y-4 bg-muted/20">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Package className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h4 className="font-medium">{plugin.pluginSlug}.zip</h4>
                <p className="text-sm text-muted-foreground">
                  Includes main plugin file + all {widgetCount} widget
                  {widgetCount !== 1 ? 's' : ''} in /widgets/ folder
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={downloadPluginZIP}
                disabled={downloading !== null}
              >
                {downloading === 'zip' ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download Plugin ZIP
                  </>
                )}
              </Button>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Installation:</strong> Upload and activate in WordPress → Plugins → Add New
                  → Upload Plugin
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
