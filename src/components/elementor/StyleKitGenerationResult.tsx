'use client';

import { XIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

interface StyleKitGenerationResultProps {
  requested: {
    colors?: string[];
    fonts?: string[];
    preferences?: string;
    industry?: string;
  };
  generated: {
    title: string;
    page_settings: {
      system_colors?: Array<{ _id: string; title: string; color: string }>;
      custom_colors?: Array<{ _id: string; title: string; color: string }>;
      system_typography?: Array<{ _id: string; title: string; typography_font_family?: string }>;
      h1_typography?: { typography_font_family?: string };
      button_typography?: { typography_font_family?: string };
      form_field_typography?: { typography_font_family?: string };
    };
  };
  onAccept: () => void;
  onRegenerate: (stage?: 1 | 2 | 3 | 4) => void;
  onClose: () => void;
}

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito',
  'Playfair Display', 'Merriweather', 'PT Sans', 'Ubuntu', 'Mukta', 'Oswald', 'Work Sans',
  'Rubik', 'Source Sans Pro', 'Noto Sans', 'Mulish', 'Quicksand', 'Karla', 'Outfit',
  'Space Grotesk', 'DM Sans', 'Plus Jakarta Sans', 'Manrope', 'Lexend', 'Urbanist'
];

function isGoogleFont(fontName: string): boolean {
  return GOOGLE_FONTS.some(gf => gf.toLowerCase() === fontName.toLowerCase());
}

function findSimilarFonts(fontName: string): string[] {
  // Simple similarity: same first letter + similar length
  const firstChar = fontName[0].toLowerCase();
  const targetLength = fontName.length;
  
  return GOOGLE_FONTS
    .filter(gf => {
      const matches = gf[0].toLowerCase() === firstChar;
      const lengthClose = Math.abs(gf.length - targetLength) <= 3;
      return matches || lengthClose;
    })
    .slice(0, 3);
}

export function StyleKitGenerationResult({
  requested,
  generated,
  onAccept,
  onRegenerate,
  onClose,
}: StyleKitGenerationResultProps) {
  // Extract requested values
  const requestedFonts = requested.fonts || [];
  const requestedColors = requested.colors || [];

  // Extract generated values
  const generatedFonts = {
    primary: generated.page_settings.system_typography?.[0]?.typography_font_family || 'Not set',
    secondary: generated.page_settings.system_typography?.[2]?.typography_font_family || 'Not set',
  };

  const generatedColors = {
    primary: generated.page_settings.system_colors?.[0]?.color || 'Not set',
    secondary: generated.page_settings.system_colors?.[1]?.color || 'Not set',
    text: generated.page_settings.system_colors?.[2]?.color || 'Not set',
    accent: generated.page_settings.system_colors?.[3]?.color || 'Not set',
  };

  // Check if fonts match
  const primaryFontMatch = requestedFonts.length === 0 || 
    requestedFonts.some(rf => generatedFonts.primary.toLowerCase().includes(rf.toLowerCase()));
  
  const secondaryFontMatch = requestedFonts.length === 0 || requestedFonts.length < 2 ||
    requestedFonts.some(rf => generatedFonts.secondary.toLowerCase().includes(rf.toLowerCase()));

  const allFontsMatch = primaryFontMatch && secondaryFontMatch;

  // Check if colors match
  const colorMatches = requestedColors.map(rc => {
    const normalized = rc.startsWith('#') ? rc.toUpperCase() : `#${rc.toUpperCase()}`;
    return Object.values(generatedColors).some(gc => 
      gc.toUpperCase() === normalized
    );
  });
  const allColorsMatch = requestedColors.length === 0 || colorMatches.every(m => m);

  // Font warnings
  const primaryFontWarning = !isGoogleFont(generatedFonts.primary) && generatedFonts.primary !== 'Not set';
  const secondaryFontWarning = !isGoogleFont(generatedFonts.secondary) && generatedFonts.secondary !== 'Not set';

  const fontSuggestions = primaryFontWarning ? findSimilarFonts(generatedFonts.primary) : [];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
              ✅ Style Kit Generated
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
              {generated.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Overall Status */}
          <div style={{
            padding: '16px',
            backgroundColor: allFontsMatch && allColorsMatch ? 'rgba(34, 197, 94, 0.1)' : 'rgba(249, 115, 22, 0.1)',
            border: `1px solid ${allFontsMatch && allColorsMatch ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {allFontsMatch && allColorsMatch ? (
                <>
                  <CheckCircleIcon size={24} color="#22c55e" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#22c55e' }}>
                    All Requirements Met
                  </span>
                </>
              ) : (
                <>
                  <AlertCircleIcon size={24} color="#f97316" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#f97316' }}>
                    Some Issues Found
                  </span>
                </>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
              {allFontsMatch && allColorsMatch
                ? 'AI successfully followed all your requirements. Ready to use!'
                : 'Some requirements may need adjustment. Review details below.'}
            </p>
          </div>

          {/* Fonts Section */}
          {requestedFonts.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔤 Typography
              </h4>

              <div style={{
                padding: '16px',
                backgroundColor: 'var(--muted)',
                borderRadius: '8px',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                      YOUR REQUEST
                    </div>
                    {requestedFonts.map((rf, i) => (
                      <div key={i} style={{ fontSize: '14px', fontWeight: 500 }}>
                        "{rf}"
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '20px' }}>→</div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                      GENERATED
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {primaryFontMatch ? (
                        <span style={{ color: '#22c55e' }}>✅</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>❌</span>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>
                        Primary: {generatedFonts.primary}
                      </span>
                    </div>
                    {requestedFonts.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        {secondaryFontMatch ? (
                          <span style={{ color: '#22c55e' }}>✅</span>
                        ) : (
                          <span style={{ color: '#ef4444' }}>❌</span>
                        )}
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>
                          Secondary: {generatedFonts.secondary}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Font Warnings */}
              {(primaryFontWarning || secondaryFontWarning) && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f97316', marginBottom: '6px' }}>
                    ⚠️ Font Availability Warning
                  </div>
                  {primaryFontWarning && (
                    <div style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '8px' }}>
                      <strong>{generatedFonts.primary}</strong> is not a Google Font. You'll need to upload it manually or use an alternative.
                    </div>
                  )}
                  {fontSuggestions.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                        Similar Google Fonts:
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {fontSuggestions.map(sf => (
                          <span key={sf} style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: sf,
                          }}>
                            {sf}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!allFontsMatch && (
                <button
                  onClick={() => onRegenerate(2)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <RefreshCwIcon size={16} />
                  Regenerate Fonts Only (Stage 2)
                </button>
              )}
            </div>
          )}

          {/* Colors Section */}
          {requestedColors.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎨 Colors
              </h4>

              <div style={{
                padding: '16px',
                backgroundColor: 'var(--muted)',
                borderRadius: '8px',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                      YOUR REQUEST
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {requestedColors.map((rc, i) => (
                        <div key={i} style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: rc.startsWith('#') ? rc : `#${rc}`,
                          borderRadius: '6px',
                          border: '2px solid var(--border)',
                        }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: '20px' }}>→</div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                      GENERATED
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {Object.entries(generatedColors).map(([key, color]) => {
                        const normalized = requestedColors.map(rc => 
                          rc.startsWith('#') ? rc.toUpperCase() : `#${rc.toUpperCase()}`
                        );
                        const isFromUser = normalized.includes(color.toUpperCase());
                        
                        return (
                          <div key={key} style={{ position: 'relative' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: color,
                              borderRadius: '6px',
                              border: '2px solid var(--border)',
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: isFromUser ? '#22c55e' : 'var(--muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}>
                              {isFromUser ? '✓' : '🤖'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                      ✓ = From your input  |  🤖 = AI generated
                    </div>
                  </div>
                </div>
              </div>

              {!allColorsMatch && (
                <button
                  onClick={() => onRegenerate(1)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <RefreshCwIcon size={16} />
                  Regenerate Colors Only (Stage 1)
                </button>
              )}
            </div>
          )}

          {/* No specific requests */}
          {requestedFonts.length === 0 && requestedColors.length === 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--muted)',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                ✨ AI generated a complete style kit based on your preferences
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                <strong>Generated:</strong> {generated.page_settings.system_colors?.length || 0} colors, 
                {generated.page_settings.system_typography?.length || 0} typography presets
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--muted)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Legend:</div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              <div><span style={{ color: '#22c55e' }}>✅</span> = From your input</div>
              <div><span>🤖</span> = AI generated</div>
              <div><span style={{ color: '#ef4444' }}>❌</span> = Not matching</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onAccept}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Accept & Continue Editing
            </button>
            <button
              onClick={() => onRegenerate()}
              style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCwIcon size={16} />
              Regenerate All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

