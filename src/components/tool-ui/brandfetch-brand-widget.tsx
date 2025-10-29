'use client';

import { useState } from 'react';

interface BrandfetchBrandWidgetProps {
  result: {
    success: boolean;
    domain: string;
    name?: string;
    description?: string;
    logos?: Array<{
      theme: string;
      formats: Array<{
        type: string;
        src: string;
        background?: string;
        width?: number;
        height?: number;
      }>;
    }>;
    colors?: Array<{
      hex: string;
      type: string;
      brightness?: number;
    }>;
    fonts?: Array<{
      name: string;
      type: string;
      origin?: string;
    }>;
    images?: Array<{
      type: string;
      formats: Array<{
        src: string;
        background?: string;
        format?: string;
        width?: number;
        height?: number;
      }>;
    }>;
    links?: any[];
    error?: string;
  };
}

export function BrandfetchBrandWidget({ result }: BrandfetchBrandWidgetProps) {
  const [activeTab, setActiveTab] = useState<'logos' | 'colors' | 'fonts' | 'images'>('logos');
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  if (!result.success || result.error) {
    return (
      <div style={{
        padding: '16px',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c33',
      }}>
        <strong>⚠️ Error fetching brand data</strong>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>{result.error}</p>
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#999' }}>
          Note: This tool is limited to 100 requests/month. Use sparingly!
        </p>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  const logos = result.logos || [];
  const colors = result.colors || [];
  const fonts = result.fonts || [];
  const images = result.images || [];

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      maxWidth: '800px',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {logos[0]?.formats[0] && (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={logos[0].formats[0].src}
                alt={result.name}
                style={{
                  maxWidth: '40px',
                  maxHeight: '40px',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
              {result.name || result.domain}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {result.domain}
            </p>
          </div>
          <div style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
          }}>
            🎨 Full Brand Data
          </div>
        </div>
        {result.description && (
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, lineHeight: 1.5 }}>
            {result.description}
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--muted)',
      }}>
        {[
          { key: 'logos', label: 'Logos', count: logos.reduce((sum, l) => sum + l.formats.length, 0) },
          { key: 'colors', label: 'Colors', count: colors.length },
          { key: 'fonts', label: 'Fonts', count: fonts.length },
          { key: 'images', label: 'Images', count: images.reduce((sum, i) => sum + i.formats.length, 0) },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === tab.key ? 'var(--background)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 600 : 500,
              color: activeTab === tab.key ? 'var(--foreground)' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label} <span style={{ color: '#9ca3af' }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px' }}>
        {/* Logos Tab */}
        {activeTab === 'logos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {logos.map((logoGroup, idx) => (
              <div key={idx}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  textTransform: 'capitalize',
                }}>
                  {logoGroup.theme} Theme
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '12px',
                }}>
                  {logoGroup.formats.map((format, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        padding: '16px',
                        background: format.background || '#f9fafb',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => copyToClipboard(format.src)}
                    >
                      <img
                        src={format.src}
                        alt={`Logo ${format.type}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '60px',
                          objectFit: 'contain',
                        }}
                      />
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                      }}>
                        {format.type}
                      </span>
                      {format.width && (
                        <span style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                        }}>
                          {format.width}×{format.height}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '16px',
          }}>
            {colors.map((color, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => copyToClipboard(color.hex)}
              >
                <div style={{
                  width: '100%',
                  height: '80px',
                  background: color.hex,
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }} />
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: '#111827',
                  }}>
                    {color.hex}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '11px',
                    color: '#6b7280',
                    textTransform: 'capitalize',
                  }}>
                    {color.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fonts Tab */}
        {activeTab === 'fonts' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {fonts.map((font, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                  }}>
                    {font.name}
                  </p>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '13px',
                    color: '#6b7280',
                    textTransform: 'capitalize',
                  }}>
                    {font.type}
                  </p>
                </div>
                {font.origin && (
                  <span style={{
                    padding: '4px 10px',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#6b7280',
                  }}>
                    {font.origin}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {images.map((imageGroup, idx) => (
              <div key={idx}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  textTransform: 'capitalize',
                }}>
                  {imageGroup.type}
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '12px',
                }}>
                  {imageGroup.formats.map((format, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        position: 'relative',
                        paddingBottom: '75%',
                        background: format.background || '#f9fafb',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                      onClick={() => copyToClipboard(format.src)}
                    >
                      <img
                        src={format.src}
                        alt={imageGroup.type}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div style={{
        padding: '12px 20px',
        background: '#fef3c7',
        borderTop: '1px solid #fde68a',
        fontSize: '12px',
        color: '#92400e',
      }}>
        ⚠️ Limited to 100 requests/month. Click any item to copy URL.
      </div>

      {/* Copy Notification */}
      {showCopyNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#10b981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 9999,
        }}>
          ✓ Copied to clipboard!
        </div>
      )}
    </div>
  );
}
