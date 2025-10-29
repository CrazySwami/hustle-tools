'use client';

import { useState } from 'react';

interface BrandfetchLogoWidgetProps {
  result: {
    success: boolean;
    domain: string;
    name?: string;
    logos?: Array<{
      type: string;
      src: string;
      background?: string;
      width?: number;
      height?: number;
    }>;
    theme?: string;
    error?: string;
  };
}

export function BrandfetchLogoWidget({ result }: BrandfetchLogoWidgetProps) {
  const [selectedLogo, setSelectedLogo] = useState(0);
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
        <strong>⚠️ Error fetching logo</strong>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>{result.error}</p>
      </div>
    );
  }

  const logos = result.logos || [];
  const currentLogo = logos[selectedLogo];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      maxWidth: '600px',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: currentLogo?.background || '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {currentLogo && (
            <img
              src={currentLogo.src}
              alt={result.name}
              style={{
                maxWidth: '32px',
                maxHeight: '32px',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {result.name || result.domain}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            {result.domain}
          </p>
        </div>
        <div style={{
          padding: '4px 10px',
          background: '#10b981',
          color: '#fff',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {logos.length} {logos.length === 1 ? 'format' : 'formats'}
        </div>
      </div>

      {/* Logo Preview */}
      <div style={{
        padding: '32px',
        background: currentLogo?.background || '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
      }}>
        {currentLogo && (
          <img
            src={currentLogo.src}
            alt={`${result.name} logo`}
            style={{
              maxWidth: '100%',
              maxHeight: '160px',
              objectFit: 'contain',
            }}
          />
        )}
      </div>

      {/* Format Selector */}
      {logos.length > 1 && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
          }}>
            Available Formats
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {logos.map((logo, index) => (
              <button
                key={index}
                onClick={() => setSelectedLogo(index)}
                style={{
                  padding: '6px 12px',
                  background: selectedLogo === index ? '#3b82f6' : '#f3f4f6',
                  color: selectedLogo === index ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {logo.type}
                {logo.width && ` ${logo.width}×${logo.height}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logo Details */}
      {currentLogo && (
        <div style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* URL Copy */}
          <div>
            <p style={{
              margin: '0 0 4px 0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b7280',
            }}>
              Image URL
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
            }}>
              <input
                type="text"
                value={currentLogo.src}
                readOnly
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#f9fafb',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#374151',
                }}
              />
              <button
                onClick={() => copyToClipboard(currentLogo.src)}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Copy URL
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
          }}>
            {currentLogo.width && (
              <div>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                }}>
                  Dimensions
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111827',
                }}>
                  {currentLogo.width} × {currentLogo.height}
                </p>
              </div>
            )}
            <div>
              <p style={{
                margin: '0 0 4px 0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
              }}>
                Format
              </p>
              <p style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                textTransform: 'uppercase',
              }}>
                {currentLogo.type}
              </p>
            </div>
            {currentLogo.background && (
              <div>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                }}>
                  Background
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: currentLogo.background,
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                  }} />
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#374151',
                  }}>
                    {currentLogo.background}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
