'use client';

import { useEffect, useRef, useState } from 'react';
import { UndoIcon, RedoIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { FileIcon, PaletteIcon, SaveIcon, DownloadIcon, PlayIcon } from '@/components/ui/icons';

interface JsonEditorProps {
  json: any;
  onChange: (json: any) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onSaveAndLoad?: () => void;
  onLoadJson?: (file: File) => void;
  onLoadSample?: () => void;
  currentFileName?: string;
  pendingPatches?: { patches: any[]; approvalId: string };
  onApprovePatch?: (patches: any[], approvalId: string) => void;
  onDeclinePatch?: (approvalId: string) => void;
}

export function JsonEditor({
  json,
  onChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onDownload,
  onSaveAndLoad,
  onLoadJson,
  onLoadSample,
  currentFileName,
  pendingPatches,
  onApprovePatch,
  onDeclinePatch,
}: JsonEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [JSONEditor, setJSONEditor] = useState<any>(null);
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    error: string | null;
    warnings: string[];
  }>({ isValid: true, error: null, warnings: [] });

  // Load JSONEditor dynamically (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('jsoneditor').then((module) => {
        setJSONEditor(() => module.default);
      });
    }
  }, []);

  // Initialize JSONEditor
  useEffect(() => {
    if (!JSONEditor || !editorContainerRef.current || editorInstanceRef.current) {
      return;
    }

    // Import CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/jsoneditor@9.10.4/dist/jsoneditor.min.css';
    document.head.appendChild(link);

    // Validation function
    const validateElementorJson = (jsonData: any): { isValid: boolean; error: string | null; warnings: string[] } => {
      const warnings: string[] = [];

      // Check if it's an object
      if (!jsonData || typeof jsonData !== 'object') {
        return { isValid: false, error: 'JSON must be an object', warnings };
      }

      // Check for required Elementor structure
      if (!jsonData.widgetType && !jsonData.elType) {
        warnings.push('Missing widgetType or elType property');
      }

      // Check for content array
      if (!Array.isArray(jsonData.content) && !Array.isArray(jsonData.elements)) {
        warnings.push('Missing content or elements array');
      }

      // Check if content/elements is empty
      if (Array.isArray(jsonData.content) && jsonData.content.length === 0) {
        warnings.push('Content array is empty');
      }

      return { isValid: true, error: null, warnings };
    };

    // Create editor
    const editor = new JSONEditor(editorContainerRef.current, {
      mode: 'code',
      modes: ['code', 'tree', 'view'],
      indentation: 2,
      onChange: () => {
        try {
          const updatedJson = editor.get();
          const validation = validateElementorJson(updatedJson);
          setValidationStatus(validation);
          onChange(updatedJson);
        } catch (e: any) {
          // Invalid JSON syntax
          setValidationStatus({
            isValid: false,
            error: `Syntax error: ${e.message}`,
            warnings: []
          });
          console.error('Invalid JSON:', e);
        }
      },
    });

    editor.set(json);
    editorInstanceRef.current = editor;

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [JSONEditor]);

  // Update editor when JSON changes externally
  useEffect(() => {
    if (editorInstanceRef.current) {
      try {
        const currentJson = editorInstanceRef.current.get();
        if (JSON.stringify(currentJson) !== JSON.stringify(json)) {
          editorInstanceRef.current.set(json);
        }
      } catch (e) {
        // Ignore errors when comparing
      }
    }
  }, [json]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleJsonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLoadJson) {
      onLoadJson(file);
    }
  };

  return (
    <div className="json-editor-container">
      {/* Validation Status Bar */}
      {!validationStatus.isValid && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          borderBottom: '2px solid #ef4444',
          color: '#991b1b',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>❌</span>
          <span><strong>Invalid JSON:</strong> {validationStatus.error}</span>
        </div>
      )}

      {validationStatus.isValid && validationStatus.warnings.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: '#fef3c7',
          borderBottom: '2px solid #f59e0b',
          color: '#92400e',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>Warnings:</span>
          </div>
          {validationStatus.warnings.map((warning, i) => (
            <div key={i} style={{ paddingLeft: '28px', fontSize: '12px' }}>
              • {warning}
            </div>
          ))}
        </div>
      )}

      {validationStatus.isValid && validationStatus.warnings.length === 0 && (
        <div style={{
          padding: '8px 16px',
          background: '#f0fdf4',
          borderBottom: '2px solid #22c55e',
          color: '#166534',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>✅</span>
          <span>Valid Elementor JSON</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            ref={jsonFileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleJsonFileSelect}
          />
          {onLoadJson && (
            <button
              onClick={() => jsonFileInputRef.current?.click()}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
              title="Load JSON file"
            >
              <FileIcon size={14} />
              <span>Load JSON</span>
            </button>
          )}
          {onLoadSample && (
            <button
              onClick={onLoadSample}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
              title="Load sample JSON"
            >
              <PaletteIcon size={14} />
              <span>Load Sample</span>
            </button>
          )}
          {currentFileName && (
            <span style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontWeight: 500 }}>
              {currentFileName}
            </span>
          )}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: canUndo ? 'var(--background)' : 'var(--muted)',
              color: canUndo ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: canRedo ? 'var(--background)' : 'var(--muted)',
              color: canRedo ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Redo (Ctrl+Y)"
          >
            <RedoIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontWeight: 500 }}>
            {Object.keys(json).length > 0 ? 'Loaded' : 'Empty'}
          </span>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: copied ? '#059669' : 'var(--foreground)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
            title="Copy JSON"
          >
            {copied ? (
              <>
                <CheckIcon style={{ width: '16px', height: '16px', color: '#059669' }} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon style={{ width: '16px', height: '16px' }} />
                <span>Copy</span>
              </>
            )}
          </button>
          {onSave && (
            <button
              onClick={onSave}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
              title="Save JSON to editor state"
            >
              <SaveIcon size={14} />
              <span>Save</span>
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
              title="Download JSON file"
            >
              <DownloadIcon size={14} />
              <span>Download</span>
            </button>
          )}
          {onSaveAndLoad && (
            <button
              onClick={() => {
                if (!validationStatus.isValid) {
                  alert(`Cannot preview invalid JSON:\n\n${validationStatus.error}\n\nPlease fix the errors first.`);
                  return;
                }
                onSaveAndLoad();
              }}
              disabled={!validationStatus.isValid}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: validationStatus.isValid ? 'var(--primary)' : 'var(--muted)',
                color: validationStatus.isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                cursor: validationStatus.isValid ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                opacity: validationStatus.isValid ? 1 : 0.5,
              }}
              title={validationStatus.isValid ? "Save and preview in WordPress Playground" : "Fix JSON errors before previewing"}
            >
              <PlayIcon size={14} />
              <span>Save & Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div ref={editorContainerRef} style={{ flex: 1, minHeight: 0 }} />

      {/* Diff Overlay for Pending Patches */}
      {pendingPatches && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              color: 'white',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
                🔧 Patch Approval Required
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Review the changes below before applying
              </div>
            </div>

            {/* Diff Content */}
            <div style={{
              padding: '24px',
              overflow: 'auto',
              flex: 1,
              background: 'var(--background)',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                {pendingPatches.patches.map((patch, i) => {
                  const pathParts = patch.path.split('/').filter((x: string) => x);
                  let oldValue: any = json;

                  // Navigate to the path to get old value
                  try {
                    for (const part of pathParts) {
                      oldValue = oldValue[part];
                    }
                  } catch (e) {
                    oldValue = undefined;
                  }

                  return (
                    <div key={i} style={{
                      marginBottom: '20px',
                      padding: '16px',
                      background: 'var(--card)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{
                          background: patch.op === 'replace' ? '#3b82f6' : patch.op === 'add' ? '#22c55e' : '#ef4444',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                        }}>
                          {patch.op}
                        </span>
                        <code style={{ color: 'var(--muted-foreground)' }}>{patch.path}</code>
                      </div>

                      {patch.op === 'replace' && oldValue !== undefined && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            color: '#991b1b',
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>− OLD VALUE:</div>
                            <code>{JSON.stringify(oldValue, null, 2)}</code>
                          </div>
                        </div>
                      )}

                      {patch.value !== undefined && (
                        <div>
                          <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            color: '#166534',
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                              + NEW VALUE:
                            </div>
                            <code>{JSON.stringify(patch.value, null, 2)}</code>
                          </div>
                        </div>
                      )}

                      {patch.op === 'remove' && oldValue !== undefined && (
                        <div>
                          <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            color: '#991b1b',
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                              − REMOVING:
                            </div>
                            <code>{JSON.stringify(oldValue, null, 2)}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              background: 'var(--card)',
            }}>
              <button
                onClick={() => onDeclinePatch?.(pendingPatches.approvalId)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                ❌ Decline
              </button>
              <button
                onClick={() => onApprovePatch?.(pendingPatches.patches, pendingPatches.approvalId)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(to right, #22c55e, #16a34a)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                ✅ Approve & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
