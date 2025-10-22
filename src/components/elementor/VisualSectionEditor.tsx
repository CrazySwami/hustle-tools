'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@grapesjs/react';
import type grapesjs from 'grapesjs';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import { Section } from '@/lib/section-schema';
import { DownloadIcon, CodeIcon, SaveIcon, EyeIcon, XIcon, PaletteIcon } from 'lucide-react';
import { CSSCascadeInspector } from './CSSCascadeInspector';

interface VisualSectionEditorProps {
  initialSection?: Section;
  onSectionChange?: (section: Section) => void;
  onSwitchToCodeEditor?: () => void;
}

// Debounce helper
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function VisualSectionEditor({
  initialSection,
  onSectionChange,
  onSwitchToCodeEditor,
}: VisualSectionEditorProps) {
  const editorRef = useRef<grapesjs.Editor | null>(null);
  const { globalCss } = useGlobalStylesheet();
  const [gjsLoaded, setGjsLoaded] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<grapesjs.Component | null>(null);
  const [inspectorVisible, setInspectorVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamically import GrapeJS and plugins (client-side only)
  useEffect(() => {
    Promise.all([
      import('grapesjs'),
      import('grapesjs-blocks-basic')
    ]).then(([gjsModule, blocksModule]) => {
      (window as any).grapesjs = gjsModule.default;
      (window as any).grapejsBlocksBasic = blocksModule.default;
      setGjsLoaded(true);
    });
  }, []);

  // Convert global CSS to data URL for GrapeJS canvas
  const globalCssDataUrl = globalCss
    ? `data:text/css;base64,${btoa(globalCss)}`
    : undefined;

  // Reload content when initialSection changes (e.g., switching from Code Editor)
  useEffect(() => {
    if (!editorRef.current || !initialSection) return;

    console.log('📥 Loading section into Visual Editor:', {
      name: initialSection.name,
      htmlLength: initialSection.html?.length || 0,
      cssLength: initialSection.css?.length || 0,
    });

    if (initialSection.html) {
      editorRef.current.setComponents(initialSection.html);
    }
    if (initialSection.css) {
      editorRef.current.setStyle(initialSection.css);
    }
  }, [initialSection?.id, initialSection?.updatedAt]);

  const handleEditorInit = useCallback((editor: grapesjs.Editor) => {
    editorRef.current = editor;

    // Load initial section HTML/CSS if provided
    if (initialSection?.html) {
      editor.setComponents(initialSection.html);
      if (initialSection.css) {
        editor.setStyle(initialSection.css);
      }
    }

    // Debounced update handler to prevent jittery re-renders
    const debouncedUpdate = debounce(() => {
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
    }, 1000); // Only update 1 second after user stops making changes

    // Listen for changes with debouncing
    editor.on('component:add component:remove component:update', debouncedUpdate);

    // Component selection event for cascade inspector + force style manager refresh
    editor.on('component:selected', (component) => {
      console.log('🎯 Component selected:', component);
      setSelectedComponent(component);
      setInspectorVisible(true); // Auto-show inspector when component selected

      // Force style manager refresh to show component's current styles
      const styleManager = editor.StyleManager;
      if (styleManager) {
        styleManager.render();
      }
    });

    editor.on('component:deselected', () => {
      console.log('❌ Component deselected');
      setSelectedComponent(null);
    });

    // Force style manager update when component is toggled (selection changed)
    editor.on('component:toggled', () => {
      const styleManager = editor.StyleManager;
      if (styleManager) {
        styleManager.render();
      }
    });

    // Ensure style manager updates when styles change
    editor.on('style:property:update', debounce((property) => {
      // Trigger component update to sync with code editor
      debouncedUpdate();
    }, 300));
  }, [initialSection, onSectionChange]);

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
          {selectedComponent && (
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
              {`<${selectedComponent.getName()}>`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: Blocks Button */}
          {isMobile && (
            <button
              onClick={() => setBlocksOpen(!blocksOpen)}
              className={`btn-secondary flex items-center gap-2 text-sm ${blocksOpen ? 'bg-primary/10' : ''}`}
              title="Add Elements"
            >
              <span className="text-lg">+</span>
              {blocksOpen ? 'Close' : 'Add'}
            </button>
          )}

          {/* Mobile: Styles Button */}
          {isMobile && selectedComponent && (
            <button
              onClick={() => setStylesOpen(!stylesOpen)}
              className={`btn-secondary flex items-center gap-2 text-sm ${stylesOpen ? 'bg-primary/10' : ''}`}
              title="Edit Styles"
            >
              <PaletteIcon size={16} />
              Styles
            </button>
          )}

          {/* Desktop: Inspector Toggle */}
          {!isMobile && (
            <button
              onClick={() => setInspectorVisible(!inspectorVisible)}
              className={`btn-secondary flex items-center gap-2 text-sm ${
                inspectorVisible ? 'bg-primary/10' : ''
              }`}
              title={inspectorVisible ? 'Hide Inspector' : 'Show Inspector'}
            >
              <EyeIcon size={16} />
              Inspector
            </button>
          )}

          <button
            onClick={handleExportToCode}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Switch to Code Editor"
          >
            <CodeIcon size={16} />
            {isMobile ? 'Code' : 'Code View'}
          </button>
          <button
            onClick={handleExportHTML}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Export HTML"
          >
            <DownloadIcon size={16} />
            {isMobile ? '' : 'Export'}
          </button>
        </div>
      </div>

      {/* Main Content: Responsive Layout */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Mobile: Blocks Dropdown */}
        {isMobile && blocksOpen && (
          <div className="border-b bg-background" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <h4 className="text-sm font-semibold">Add Elements</h4>
              <button onClick={() => setBlocksOpen(false)} className="text-sm">Close</button>
            </div>
            <div id="blocks-mobile" className="p-2"></div>
          </div>
        )}

        {/* Desktop: Left Sidebar - Blocks */}
        {!isMobile && (
          <div className="w-64 border-r bg-background overflow-hidden flex flex-col">
            <div className="p-3 border-b bg-muted/30">
              <h4 className="text-sm font-semibold">Blocks</h4>
            </div>
            <div id="blocks" className="flex-1 overflow-y-auto p-2"></div>
          </div>
        )}

        {/* Center - GrapeJS Canvas (Full width on mobile) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Editor
            grapesjs={(window as any).grapesjs}
            grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
            options={{
              height: '100%',
              width: '100%',
              storageManager: false,
              plugins: [(window as any).grapejsBlocksBasic],
              pluginsOpts: {
                'grapesjs-blocks-basic': {
                  flexGrid: true,
                  stylePrefix: 'gjs-',
                }
              },
              canvas: {
                styles: globalCssDataUrl ? [globalCssDataUrl] : [],
              },
              blockManager: {
                appendTo: isMobile ? '#blocks-mobile' : '#blocks',
              },
              styleManager: {
                appendTo: isMobile ? '#styles-container-mobile' : '#styles-container',
                sectors: [
                  {
                    name: 'Typography',
                    open: true,
                    buildProps: [
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
                    buildProps: [
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
                    buildProps: [
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
                    buildProps: [
                      'border-radius',
                      'border',
                      'box-shadow',
                    ],
                  },
                  {
                    name: 'Extra',
                    open: false,
                    buildProps: [
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
                appendTo: isMobile ? '#selectors-mobile' : '#selectors',
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

        {/* Desktop: Right Sidebar */}
        {!isMobile && (
          <div className="w-80 border-l bg-background overflow-hidden flex flex-col">
            {/* Tabs for Styles/Layers/Traits */}
            <div className="border-b">
              <div className="flex p-2 gap-1">
                <button className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded">
                  Styles
                </button>
                <button className="text-xs px-3 py-1.5 hover:bg-muted rounded">
                  Layers
                </button>
                <button className="text-xs px-3 py-1.5 hover:bg-muted rounded">
                  Traits
                </button>
              </div>
            </div>

            {/* Styles Panel */}
            <div className="flex-1 overflow-y-auto">
              <div id="selectors" className="p-2"></div>
              <div id="styles-container" className="p-2"></div>
              <div id="traits" className="p-2 hidden"></div>
              <div id="layers" className="p-2 hidden"></div>
            </div>

            {/* CSS Cascade Inspector */}
            {inspectorVisible && selectedComponent && (
              <div className="border-t">
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                  <h4 className="text-sm font-semibold">CSS Cascade</h4>
                  <button
                    onClick={() => setInspectorVisible(false)}
                    className="btn-secondary p-1"
                    title="Close Inspector"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <div className="h-64 overflow-y-auto">
                  <CSSCascadeInspector
                    editor={editorRef.current}
                    selectedComponent={selectedComponent}
                    globalCss={globalCss || ''}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile: Bottom Sheet for Styles */}
        {isMobile && stylesOpen && selectedComponent && (
          <>
            {/* Overlay */}
            <div
              onClick={() => setStylesOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1999,
              }}
            />
            {/* Styles Bottom Sheet */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60vh',
                background: 'var(--background)',
                borderTop: '1px solid var(--border)',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <h4 className="text-sm font-semibold">Edit Styles</h4>
                <button onClick={() => setStylesOpen(false)} className="text-sm">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div id="selectors-mobile" className="p-2"></div>
                <div id="styles-container-mobile" className="p-2"></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
