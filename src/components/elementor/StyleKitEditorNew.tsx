'use client';

import { useState, useEffect, useRef } from 'react';
import { PaletteIcon, TypeIcon, UploadIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react';

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
}

export function StyleKitEditorNew({ json, onUpdate }: StyleKitEditorProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography'>('colors');
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [typography, setTypography] = useState<TypographyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-pull from WordPress on mount
  useEffect(() => {
    pullFromWordPress();
  }, []);

  const pullFromWordPress = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).getElementorStyleKit) {
        const styleKit = await (window as any).getElementorStyleKit();
        applyStyleKit(styleKit);
      }
    } catch (error) {
      console.error('Failed to pull style kit:', error);
    } finally {
      setLoading(false);
    }
  };

  const pushToWordPress = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).setElementorStyleKit) {
        const styleKit = {
          system_colors: colors,
          system_typography: typography
        };
        await (window as any).setElementorStyleKit(styleKit);
        alert('✅ Style kit pushed to WordPress!');
      }
    } catch (error) {
      console.error('Failed to push style kit:', error);
      alert('❌ Failed to push style kit');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const styleKit = JSON.parse(e.target?.result as string);
        applyStyleKit(styleKit);
        alert('✅ Style kit uploaded successfully!');
      } catch (error) {
        alert('❌ Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const applyStyleKit = (styleKit: any) => {
    if (styleKit.system_colors) {
      setColors(styleKit.system_colors);
    }
    if (styleKit.custom_colors) {
      setColors((prev) => [...prev, ...styleKit.custom_colors]);
    }
    if (styleKit.system_typography) {
      setTypography(styleKit.system_typography);
    }
    if (styleKit.custom_typography) {
      setTypography((prev) => [...prev, ...styleKit.custom_typography]);
    }
  };

  const downloadStyleKit = () => {
    const styleKit = {
      system_colors: colors,
      system_typography: typography
    };
    const blob = new Blob([JSON.stringify(styleKit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elementor-style-kit-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tab-panel">
      {/* Header */}
      <div className="tab-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <PaletteIcon size={16} />
            Colors ({colors.length})
          </button>
          <button
            className={`tab ${activeTab === 'typography' ? 'active' : ''}`}
            onClick={() => setActiveTab('typography')}
          >
            <TypeIcon size={16} />
            Typography ({typography.length})
          </button>
        </div>

        <div className="tab-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px'
            }}
          >
            <UploadIcon size={14} />
            Upload JSON
          </button>
          <button
            className="btn-secondary"
            onClick={pullFromWordPress}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px'
            }}
          >
            <RefreshCwIcon size={14} />
            Pull from WP
          </button>
          <button
            className="btn-secondary"
            onClick={downloadStyleKit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px'
            }}
          >
            <DownloadIcon size={14} />
            Download
          </button>
          <button
            className="btn-primary"
            onClick={pushToWordPress}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px'
            }}
          >
            <UploadIcon size={14} />
            Push to WP
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--background)', padding: '32px 24px' }}>
        {activeTab === 'colors' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {colors.map((color) => (
                <div
                  key={color.id}
                  style={{
                    padding: '16px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={color.value}
                      onChange={(e) => {
                        const newColors = colors.map((c) =>
                          c.id === color.id ? { ...c, value: e.target.value } : c
                        );
                        setColors(newColors);
                      }}
                      style={{
                        width: '48px',
                        height: '48px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                        {color.title}
                      </div>
                      <input
                        type="text"
                        value={color.value}
                        onChange={(e) => {
                          const newColors = colors.map((c) =>
                            c.id === color.id ? { ...c, value: e.target.value } : c
                          );
                          setColors(newColors);
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
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
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                    {color.id}
                  </div>
                </div>
              ))}
            </div>

            {colors.length === 0 && (
              <div
                style={{
                  padding: '64px 24px',
                  textAlign: 'center',
                  background: 'var(--card)',
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  color: 'var(--muted-foreground)'
                }}
              >
                <PaletteIcon size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 500 }}>No colors found</p>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Upload a style kit JSON or pull from WordPress
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'typography' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              {typography.map((typo) => (
                <div
                  key={typo.id}
                  style={{
                    padding: '20px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        {typo.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                        {typo.id}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, marginBottom: '4px', color: 'var(--muted-foreground)' }}>
                        Font Family
                      </label>
                      <input
                        type="text"
                        value={typo.family}
                        onChange={(e) => {
                          const newTypography = typography.map((t) =>
                            t.id === typo.id ? { ...t, family: e.target.value } : t
                          );
                          setTypography(newTypography);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          background: 'var(--background)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, marginBottom: '4px', color: 'var(--muted-foreground)' }}>
                        Font Weight
                      </label>
                      <select
                        value={typo.weight}
                        onChange={(e) => {
                          const newTypography = typography.map((t) =>
                            t.id === typo.id ? { ...t, weight: e.target.value } : t
                          );
                          setTypography(newTypography);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '13px',
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
                  </div>
                </div>
              ))}
            </div>

            {typography.length === 0 && (
              <div
                style={{
                  padding: '64px 24px',
                  textAlign: 'center',
                  background: 'var(--card)',
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  color: 'var(--muted-foreground)'
                }}
              >
                <TypeIcon size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 500 }}>No typography styles found</p>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Upload a style kit JSON or pull from WordPress
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
