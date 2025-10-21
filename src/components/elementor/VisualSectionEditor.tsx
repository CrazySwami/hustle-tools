'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@grapesjs/react';
import type grapesjs from 'grapesjs';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import { Section } from '@/lib/section-schema';
import { DownloadIcon, CodeIcon, SaveIcon, EyeIcon } from 'lucide-react';

interface VisualSectionEditorProps {
  initialSection?: Section;
  onSectionChange?: (section: Section) => void;
  onSwitchToCodeEditor?: () => void;
}

export function VisualSectionEditor({
  initialSection,
  onSectionChange,
  onSwitchToCodeEditor,
}: VisualSectionEditorProps) {
  const editorRef = useRef<grapesjs.Editor | null>(null);
  const { globalCss } = useGlobalStylesheet();
  const [gjsLoaded, setGjsLoaded] = useState(false);

  // Dynamically import GrapeJS (client-side only)
  useEffect(() => {
    import('grapesjs').then((module) => {
      (window as any).grapesjs = module.default;
      setGjsLoaded(true);
    });
  }, []);

  // Convert global CSS to data URL for GrapeJS canvas
  const globalCssDataUrl = globalCss
    ? `data:text/css;base64,${btoa(globalCss)}`
    : undefined;

  const handleEditorInit = (editor: grapesjs.Editor) => {
    editorRef.current = editor;

    // Load initial section HTML/CSS if provided
    if (initialSection?.html) {
      editor.setComponents(initialSection.html);
      if (initialSection.css) {
        editor.setStyle(initialSection.css);
      }
    }

    // Listen for changes
    editor.on('update', () => {
      if (!onSectionChange) return;

      const html = editor.getHtml();
      const css = editor.getCss();

      onSectionChange({
        ...(initialSection || {
          id: `section-${Date.now()}`,
          name: 'New Section',
          createdAt: Date.now(),
        }),
        html,
        css,
        js: initialSection?.js || '',
        updatedAt: Date.now(),
      });
    });

    // Component selection event for cascade inspector
    editor.on('component:selected', (component) => {
      console.log('🎯 Component selected:', component);
      // TODO: Build CSS cascade inspector here
    });
  };

  const handleExportToCode = () => {
    if (!editorRef.current) return;

    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();

    console.log('📤 Exporting to code editor:', { html, css });

    if (onSectionChange) {
      onSectionChange({
        ...(initialSection || {
          id: `section-${Date.now()}`,
          name: 'New Section',
          createdAt: Date.now(),
        }),
        html,
        css,
        js: initialSection?.js || '',
        updatedAt: Date.now(),
      });
    }

    // Switch to code editor
    onSwitchToCodeEditor?.();
  };

  const handleExportHTML = () => {
    if (!editorRef.current) return;

    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Section Export</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${initialSection?.name || 'section'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!gjsLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Visual Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Visual Editor</h3>
          <span className="text-xs text-muted-foreground">
            {initialSection?.name || 'Untitled Section'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportToCode}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Switch to Code Editor"
          >
            <CodeIcon size={16} />
            Code View
          </button>
          <button
            onClick={handleExportHTML}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Export HTML"
          >
            <DownloadIcon size={16} />
            Export
          </button>
        </div>
      </div>

      {/* GrapeJS Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          grapesjs={(window as any).grapesjs}
          grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
          options={{
            height: '100%',
            width: '100%',
            storageManager: false,
            canvas: {
              styles: globalCssDataUrl ? [globalCssDataUrl] : [],
            },
            blockManager: {
              appendTo: '#blocks',
            },
            styleManager: {
              appendTo: '#styles',
              sectors: [
                {
                  name: 'Typography',
                  open: true,
                  properties: [
                    'font-family',
                    'font-size',
                    'font-weight',
                    'letter-spacing',
                    'color',
                    'line-height',
                    'text-align',
                    'text-decoration',
                    'text-shadow',
                  ],
                },
                {
                  name: 'Dimension',
                  open: false,
                  properties: [
                    'width',
                    'height',
                    'max-width',
                    'min-height',
                    'margin',
                    'padding',
                  ],
                },
                {
                  name: 'Background',
                  open: false,
                  properties: [
                    'background-color',
                    'background-image',
                    'background-repeat',
                    'background-position',
                    'background-attachment',
                    'background-size',
                  ],
                },
                {
                  name: 'Border',
                  open: false,
                  properties: [
                    'border-radius',
                    'border',
                    'box-shadow',
                  ],
                },
                {
                  name: 'Extra',
                  open: false,
                  properties: [
                    'opacity',
                    'transition',
                    'perspective',
                    'transform',
                  ],
                },
              ],
            },
            layerManager: {
              appendTo: '#layers',
            },
            traitManager: {
              appendTo: '#traits',
            },
            selectorManager: {
              appendTo: '#selectors',
            },
            panels: {
              defaults: [
                {
                  id: 'basic-actions',
                  el: '.panel__basic-actions',
                  buttons: [
                    {
                      id: 'visibility',
                      active: true,
                      className: 'btn-toggle-borders',
                      label: '<i class="fa fa-clone"></i>',
                      command: 'sw-visibility',
                    },
                  ],
                },
                {
                  id: 'panel-devices',
                  el: '.panel__devices',
                  buttons: [
                    {
                      id: 'device-desktop',
                      label: '<i class="fa fa-desktop"></i>',
                      command: 'set-device-desktop',
                      active: true,
                      togglable: false,
                    },
                    {
                      id: 'device-tablet',
                      label: '<i class="fa fa-tablet"></i>',
                      command: 'set-device-tablet',
                      togglable: false,
                    },
                    {
                      id: 'device-mobile',
                      label: '<i class="fa fa-mobile"></i>',
                      command: 'set-device-mobile',
                      togglable: false,
                    },
                  ],
                },
              ],
            },
            deviceManager: {
              devices: [
                {
                  name: 'Desktop',
                  width: '',
                },
                {
                  name: 'Tablet',
                  width: '768px',
                  widthMedia: '992px',
                },
                {
                  name: 'Mobile',
                  width: '320px',
                  widthMedia: '480px',
                },
              ],
            },
          }}
          onEditor={handleEditorInit}
        />
      </div>

      {/* Panels Container */}
      <div className="hidden">
        <div id="blocks"></div>
        <div id="styles"></div>
        <div id="layers"></div>
        <div id="traits"></div>
        <div id="selectors"></div>
      </div>
    </div>
  );
}
