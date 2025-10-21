'use client';

import { useState, useEffect } from 'react';
import { PaletteIcon, TypeIcon } from 'lucide-react';

interface StyleKitEditorProps {
  json: any;
  onUpdate: (json: any) => void;
}

interface ColorItem {
  id: string;
  title: string;
  value: string;
}

interface TypographyItem {
  id: string;
  title: string;
  family: string;
  weight: string;
  size?: {
    unit: string;
    size: number;
  };
  lineHeight?: {
    unit: string;
    size: number;
  };
  letterSpacing?: {
    unit: string;
    size: number;
  };
}

export function StyleKitEditor({ json, onUpdate }: StyleKitEditorProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography'>('colors');
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [typography, setTypography] = useState<TypographyItem[]>([]);

  useEffect(() => {
    // Extract colors from page settings
    if (json?.page_settings?.system_colors) {
      setColors(json.page_settings.system_colors);
    }
    if (json?.page_settings?.custom_colors) {
      setColors((prev) => [...prev, ...json.page_settings.custom_colors]);
    }

    // Extract typography from page settings
    if (json?.page_settings?.system_typography) {
      setTypography(json.page_settings.system_typography);
    }
    if (json?.page_settings?.custom_typography) {
      setTypography((prev) => [...prev, ...json.page_settings.custom_typography]);
    }
  }, [json]);

  const updateColor = (id: string, value: string) => {
    setColors(colors.map((c) => (c.id === id ? { ...c, value } : c)));

    // Update the JSON
    const updatedJson = { ...json };
    if (!updatedJson.page_settings) {
      updatedJson.page_settings = {};
    }

    // Update in the appropriate array
    if (updatedJson.page_settings.system_colors) {
      updatedJson.page_settings.system_colors = updatedJson.page_settings.system_colors.map((c: ColorItem) =>
        c.id === id ? { ...c, value } : c
      );
    }
    if (updatedJson.page_settings.custom_colors) {
      updatedJson.page_settings.custom_colors = updatedJson.page_settings.custom_colors.map((c: ColorItem) =>
        c.id === id ? { ...c, value } : c
      );
    }

    onUpdate(updatedJson);
  };

  const updateTypography = (id: string, updates: Partial<TypographyItem>) => {
    setTypography(typography.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    // Update the JSON
    const updatedJson = { ...json };
    if (!updatedJson.page_settings) {
      updatedJson.page_settings = {};
    }

    if (updatedJson.page_settings.system_typography) {
      updatedJson.page_settings.system_typography = updatedJson.page_settings.system_typography.map((t: TypographyItem) =>
        t.id === id ? { ...t, ...updates } : t
      );
    }
    if (updatedJson.page_settings.custom_typography) {
      updatedJson.page_settings.custom_typography = updatedJson.page_settings.custom_typography.map((t: TypographyItem) =>
        t.id === id ? { ...t, ...updates } : t
      );
    }

    onUpdate(updatedJson);
  };

  const addColor = () => {
    const newColor: ColorItem = {
      id: `custom_${Date.now()}`,
      title: 'New Color',
      value: '#000000'
    };

    setColors([...colors, newColor]);

    const updatedJson = { ...json };
    if (!updatedJson.page_settings) {
      updatedJson.page_settings = {};
    }
    if (!updatedJson.page_settings.custom_colors) {
      updatedJson.page_settings.custom_colors = [];
    }
    updatedJson.page_settings.custom_colors.push(newColor);
    onUpdate(updatedJson);
  };

  const deleteColor = (id: string) => {
    setColors(colors.filter((c) => c.id !== id));

    const updatedJson = { ...json };
    if (updatedJson.page_settings?.custom_colors) {
      updatedJson.page_settings.custom_colors = updatedJson.page_settings.custom_colors.filter(
        (c: ColorItem) => c.id !== id
      );
    }
    onUpdate(updatedJson);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)'
      }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>
          🎨 Elementor Style Kit
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted-foreground)' }}>
          Manage global colors, typography, and design system settings
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)'
      }}>
        <button
          onClick={() => setActiveTab('colors')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'colors' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--muted)',
            color: activeTab === 'colors' ? 'white' : 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <PaletteIcon style={{ width: '16px', height: '16px' }} />
          Global Colors ({colors.length})
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'typography' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--muted)',
            color: activeTab === 'typography' ? 'white' : 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <TypeIcon style={{ width: '16px', height: '16px' }} />
          Typography ({typography.length})
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeTab === 'colors' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Color Palette</h3>
              <button
                onClick={addColor}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add Color
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              {colors.map((color) => (
                <div
                  key={color.id}
                  style={{
                    padding: '16px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="color"
                      value={color.value}
                      onChange={(e) => updateColor(color.id, e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{color.title}</div>
                      <input
                        type="text"
                        value={color.value}
                        onChange={(e) => updateColor(color.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          background: 'var(--background)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                    ID: {color.id}
                  </div>
                  {color.id.startsWith('custom_') && (
                    <button
                      onClick={() => deleteColor(color.id)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            {colors.length === 0 && (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                background: 'var(--card)',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                color: 'var(--muted-foreground)'
              }}>
                <PaletteIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '16px' }}>No colors found in the style kit</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Add a color to get started</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'typography' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Typography Styles</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {typography.map((typo) => (
                <div
                  key={typo.id}
                  style={{
                    padding: '20px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{typo.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>ID: {typo.id}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                        Font Family
                      </label>
                      <input
                        type="text"
                        value={typo.family}
                        onChange={(e) => updateTypography(typo.id, { family: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: 'var(--background)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                        Font Weight
                      </label>
                      <select
                        value={typo.weight}
                        onChange={(e) => updateTypography(typo.id, { weight: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: 'var(--background)',
                          color: 'var(--foreground)'
                        }}
                      >
                        <option value="300">Light (300)</option>
                        <option value="400">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi Bold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                        <option value="900">Black (900)</option>
                      </select>
                    </div>

                    {typo.size && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                          Font Size
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            value={typo.size.size}
                            onChange={(e) =>
                              updateTypography(typo.id, {
                                size: { ...typo.size!, size: parseFloat(e.target.value) }
                              })
                            }
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '14px',
                              background: 'var(--background)',
                              color: 'var(--foreground)'
                            }}
                          />
                          <select
                            value={typo.size.unit}
                            onChange={(e) =>
                              updateTypography(typo.id, {
                                size: { ...typo.size!, unit: e.target.value }
                              })
                            }
                            style={{
                              width: '80px',
                              padding: '8px 10px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '14px',
                              background: 'var(--background)',
                              color: 'var(--foreground)'
                            }}
                          >
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="rem">rem</option>
                            <option value="vw">vw</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {typo.lineHeight && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                          Line Height
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            value={typo.lineHeight.size}
                            onChange={(e) =>
                              updateTypography(typo.id, {
                                lineHeight: { ...typo.lineHeight!, size: parseFloat(e.target.value) }
                              })
                            }
                            step="0.1"
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '14px',
                              background: 'var(--background)',
                              color: 'var(--foreground)'
                            }}
                          />
                          <select
                            value={typo.lineHeight.unit}
                            onChange={(e) =>
                              updateTypography(typo.id, {
                                lineHeight: { ...typo.lineHeight!, unit: e.target.value }
                              })
                            }
                            style={{
                              width: '80px',
                              padding: '8px 10px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '14px',
                              background: 'var(--background)',
                              color: 'var(--foreground)'
                            }}
                          >
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="">default</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {typography.length === 0 && (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                background: 'var(--card)',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                color: 'var(--muted-foreground)'
              }}>
                <TypeIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '16px' }}>No typography styles found in the style kit</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Typography will appear here when available in the JSON</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
