'use client';

import { useState, useEffect } from 'react';
import { brandAnalysisToStyleKit, getStyleKitSummary } from '@/lib/brand-to-stylekit';

interface Logo {
  url: string;
  type: 'favicon' | 'apple-touch-icon' | 'og:image' | 'twitter:image' | 'nav-logo' | 'fallback';
  score: number;
  dimensions?: { width: number; height: number };
  alt?: string;
}

interface ColorInfo {
  hex: string;
  rgb: string;
  frequency: number;
  category?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background';
}

interface FontInfo {
  family: string;
  frequency: number;
  source?: 'google-fonts' | 'adobe-fonts' | 'system' | 'custom';
  weights?: number[];
  url?: string;
}

interface BrandAnalysis {
  url: string;
  title?: string;
  logos: Logo[];
  colors: ColorInfo[];
  fonts: FontInfo[];
  extractedAt: string;
}

export function BrandAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingStyleKit, setApplyingStyleKit] = useState(false);
  const [styleKitSuccess, setStyleKitSuccess] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze brand');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze brand');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToStyleKit = async () => {
    if (!analysis) return;

    setApplyingStyleKit(true);
    setStyleKitSuccess(false);
    setError(null);

    try {
      // Convert brand analysis to Elementor Style Kit format
      const styleKit = brandAnalysisToStyleKit({
        colors: analysis.colors,
        fonts: analysis.fonts,
      });

      console.log('📦 Applying style kit:', styleKit);

      // Call the global setElementorStyleKit function from playground.js
      if (typeof window !== 'undefined' && (window as any).setElementorStyleKit) {
        await (window as any).setElementorStyleKit(styleKit);
        setStyleKitSuccess(true);
        console.log('✅ Style Kit applied successfully');

        // Auto-hide success message after 3 seconds
        setTimeout(() => setStyleKitSuccess(false), 3000);
      } else {
        throw new Error('WordPress Playground not ready. Please make sure it has loaded.');
      }
    } catch (err) {
      console.error('❌ Failed to apply style kit:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply style kit');
    } finally {
      setApplyingStyleKit(false);
    }
  };

  // Load Google Fonts dynamically when analysis changes
  useEffect(() => {
    if (!analysis?.fonts) return;

    // Remove any previously injected font links
    document.querySelectorAll('link[data-brand-font]').forEach(el => el.remove());

    // Inject Google Fonts
    const googleFonts = analysis.fonts.filter(f => f.source === 'google-fonts' && f.url);

    googleFonts.forEach(font => {
      if (font.url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = font.url;
        link.setAttribute('data-brand-font', 'true');
        document.head.appendChild(link);
      }
    });

    // For custom fonts that aren't Google Fonts but we have a family name,
    // we can try to load them from Google Fonts if available
    const customFonts = analysis.fonts.filter(
      f => f.source === 'custom' &&
      !f.family.includes('-apple-system') &&
      !f.family.includes('BlinkMacSystemFont') &&
      !f.family.includes('system-ui')
    );

    customFonts.forEach(font => {
      // Try loading from Google Fonts API
      const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@400;500;600;700&display=swap`;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = googleFontUrl;
      link.setAttribute('data-brand-font', 'true');
      // Add error handler to silently fail if font isn't on Google Fonts
      link.onerror = () => {
        console.log(`Font ${font.family} not available on Google Fonts`);
        link.remove();
      };
      document.head.appendChild(link);
    });

    // Cleanup on unmount
    return () => {
      document.querySelectorAll('link[data-brand-font]').forEach(el => el.remove());
    };
  }, [analysis]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Brand Analysis
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--muted-foreground)' }}>
          Extract logos, colors, and fonts from any website
        </p>
      </div>

      {/* URL Input */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: loading ? 'var(--muted)' : 'var(--primary)',
              color: loading ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Brand'}
          </button>
        </div>
        {error && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'var(--destructive)',
            color: 'var(--destructive-foreground)',
            borderRadius: '6px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {analysis && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          {/* Site Info & Actions */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
                  {analysis.title || new URL(analysis.url).hostname}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted-foreground)' }}>
                  Analyzed on {new Date(analysis.extractedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleApplyToStyleKit}
                disabled={applyingStyleKit}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: applyingStyleKit ? 'var(--muted)' : 'var(--primary)',
                  color: applyingStyleKit ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: applyingStyleKit ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {applyingStyleKit ? 'Applying...' : '🎨 Apply to Style Kit'}
              </button>
            </div>

            {/* Success Message */}
            {styleKitSuccess && (
              <div style={{
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '6px',
                fontSize: '14px',
                marginTop: '12px',
              }}>
                ✅ Style Kit updated! Colors and fonts have been applied to Elementor globals.
              </div>
            )}
          </div>

          {/* Logos */}
          {analysis.logos.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
                Logos ({analysis.logos.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '16px',
              }}>
                {analysis.logos.map((logo, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--card)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      backgroundColor: 'var(--muted)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={logo.url}
                        alt={logo.alt || logo.type}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      marginBottom: '4px',
                    }}>
                      {logo.type}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                      fontWeight: 500,
                    }}>
                      Score: {Math.round(logo.score * 100)}%
                    </div>
                    {logo.dimensions && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                        marginTop: '4px',
                      }}>
                        {logo.dimensions.width}×{logo.dimensions.height}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {analysis.colors.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
                Color Palette ({analysis.colors.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '12px',
              }}>
                {analysis.colors.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--card)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '60px',
                        backgroundColor: color.hex,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <div style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 500,
                        marginBottom: '2px',
                      }}>
                        {color.hex}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                      }}>
                        {color.frequency}× used
                      </div>
                      {color.category && (
                        <div style={{
                          fontSize: '10px',
                          marginTop: '4px',
                          padding: '2px 6px',
                          backgroundColor: 'var(--muted)',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}>
                          {color.category}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fonts */}
          {analysis.fonts.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
                Typography ({analysis.fonts.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysis.fonts.map((font, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--card)',
                    }}
                  >
                    <div style={{
                      fontSize: '18px',
                      fontFamily: `"${font.family}", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`,
                      fontWeight: 500,
                      marginBottom: '8px',
                    }}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: 'var(--muted-foreground)',
                    }}>
                      <span style={{ fontWeight: 600 }}>{font.family}</span>
                      <span>•</span>
                      <span>{font.frequency}× used</span>
                      {font.source && (
                        <>
                          <span>•</span>
                          <span>{font.source}</span>
                        </>
                      )}
                      {font.weights && font.weights.length > 0 && (
                        <>
                          <span>•</span>
                          <span>Weights: {font.weights.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {analysis.logos.length === 0 && analysis.colors.length === 0 && analysis.fonts.length === 0 && (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--muted-foreground)',
            }}>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>No brand assets found</p>
              <p style={{ fontSize: '14px' }}>
                Try analyzing a different website or check if the URL is accessible.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted-foreground)',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Extract Brand Assets
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Enter any website URL to automatically extract logos, color palettes, and typography.
              Perfect for design inspiration or competitive analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
