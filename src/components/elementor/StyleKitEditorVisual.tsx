'use client';

import { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface ElementorStyleKit {
  system_colors?: Array<{ _id: string; title: string; color: string }>;
  custom_colors?: Array<{ _id: string; title: string; color: string }>;
  system_typography?: any[];
  custom_typography?: any[];
  button_background_color?: string;
  button_text_color?: string;
  button_typography?: any;
  [key: string]: any;
}

export function StyleKitEditorVisual() {
  const [styleKit, setStyleKit] = useState<ElementorStyleKit>({
    system_colors: [
      { _id: 'primary', title: 'Primary', color: '#6EC1E4' },
      { _id: 'secondary', title: 'Secondary', color: '#54595F' },
      { _id: 'text', title: 'Text', color: '#7A7A7A' },
      { _id: 'accent', title: 'Accent', color: '#61CE70' },
    ],
    system_typography: [
      {
        _id: 'primary',
        title: 'Primary',
        typography_typography: 'custom',
        typography_font_family: 'Roboto',
        typography_font_weight: '600',
      },
    ],
    custom_colors: [],
    custom_typography: [],
    // Note: When loaded from Playground, this will contain ALL Elementor kit settings
    // including properties we don't have visual controls for (page_title_selector,
    // activeBreakpoints, viewport settings, spacing, etc.)
  });

  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize JSON from styleKit
  useEffect(() => {
    setJsonValue(JSON.stringify(styleKit, null, 2));
  }, []);

  // Handle JSON editor changes
  const handleJsonChange = (value: string | undefined) => {
    if (!value) return;

    setJsonValue(value);
    setJsonError(null);

    try {
      const parsed = JSON.parse(value);
      setStyleKit(parsed);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  // Handle visual editor changes
  const handleColorChange = (type: 'system' | 'custom', index: number, newColor: string) => {
    const updated = { ...styleKit };

    if (type === 'system' && updated.system_colors) {
      updated.system_colors[index].color = newColor.toUpperCase();
    } else if (type === 'custom' && updated.custom_colors) {
      updated.custom_colors[index].color = newColor.toUpperCase();
    }

    setStyleKit(updated);
    setJsonValue(JSON.stringify(updated, null, 2));
  };

  // Load current Style Kit from Playground
  const handleLoadFromPlayground = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).getElementorStyleKit) {
        const kit = await (window as any).getElementorStyleKit();
        console.log('📥 Loaded Style Kit from Playground:', kit);
        setStyleKit(kit);
        setJsonValue(JSON.stringify(kit, null, 2));
      } else {
        throw new Error('Playground not ready');
      }
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Failed to load Style Kit');
    } finally {
      setLoading(false);
    }
  };

  // Apply Style Kit to Playground
  const handleApplyToPlayground = async () => {
    setApplying(true);
    setSuccess(false);
    setJsonError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).setElementorStyleKit) {
        await (window as any).setElementorStyleKit(styleKit);
        console.log('✅ Applied Style Kit to Playground');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('Playground not ready');
      }
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Failed to apply Style Kit');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
    }}>
      {/* Left: Visual Editor */}
      <div style={{
        width: '40%',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        padding: '24px',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button
              onClick={handleLoadFromPlayground}
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: loading ? 'var(--muted)' : 'var(--primary)',
                color: loading ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Loading...' : '📥 Load from Playground'}
            </button>
            <button
              onClick={handleApplyToPlayground}
              disabled={applying}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: applying ? 'var(--muted)' : 'var(--primary)',
                color: applying ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                cursor: applying ? 'not-allowed' : 'pointer',
              }}
            >
              {applying ? 'Applying...' : '🚀 Apply to Playground'}
            </button>
          </div>
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--muted-foreground)',
            lineHeight: '1.5',
          }}>
            <strong>Complete Kit Support:</strong> Load pulls the <strong>full</strong> Elementor Style Kit (all settings, not just colors/fonts).
            Edit any property in JSON - even ones without visual controls. Apply merges changes back without losing any existing settings.
          </div>
        </div>

        {success && (
          <div style={{
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            ✅ Style Kit applied successfully!
          </div>
        )}

        {/* System Colors */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            System Colors
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {styleKit.system_colors?.map((color, i) => (
              <div key={color._id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}>
                <input
                  type="color"
                  value={color.color}
                  onChange={(e) => handleColorChange('system', i, e.target.value)}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: '2px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{color.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                    {color.color}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        {styleKit.custom_colors && styleKit.custom_colors.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              Custom Colors
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}>
              {styleKit.custom_colors.map((color, i) => (
                <div key={color._id} style={{
                  padding: '12px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}>
                  <input
                    type="color"
                    value={color.color}
                    onChange={(e) => handleColorChange('custom', i, e.target.value)}
                    style={{
                      width: '100%',
                      height: '60px',
                      border: '2px solid var(--border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '8px',
                    }}
                  />
                  <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                    {color.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                    {color.color}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Typography Preview */}
        {styleKit.system_typography && styleKit.system_typography.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              Typography
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {styleKit.system_typography.map((typo) => (
                <div key={typo._id} style={{
                  padding: '16px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontFamily: typo.typography_font_family || 'inherit',
                    fontWeight: typo.typography_font_weight || 400,
                    marginBottom: '8px',
                  }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    {typo.title} • {typo.typography_font_family} • {typo.typography_font_weight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Button Preview */}
        {styleKit.button_background_color && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              Button Style
            </h3>
            <div style={{
              padding: '24px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <button style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
                backgroundColor: styleKit.button_background_color,
                color: styleKit.button_text_color || '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}>
                Sample Button
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: JSON Editor */}
      <div style={{
        width: '60%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Style Kit JSON
          </h3>
          {jsonError && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              borderRadius: '4px',
              fontSize: '13px',
            }}>
              {jsonError}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <MonacoEditor
            height="100%"
            language="json"
            theme="vs-dark"
            value={jsonValue}
            onChange={handleJsonChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              wrappingIndent: 'indent',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
