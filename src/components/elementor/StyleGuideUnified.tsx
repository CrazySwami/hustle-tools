'use client';

import { useState, useEffect } from 'react';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import { analyzeCSSWithAI, type DesignSystemSummary } from '@/lib/css-analyzer';
import { PageExtractor } from '@/components/page-extractor/PageExtractor';
import { CSSClassExplorer } from './CSSClassExplorer';
import MonacoEditor from '@monaco-editor/react';
import {
  isSupabaseConfigured,
  brandAnalysisToStyleKit,
} from '@/lib/brand-to-stylekit';
import { generateCompleteStyleKit } from '@/lib/complete-stylekit-generator';
import defaultStyleKitTemplate from '@/lib/default-stylekit-template.json';

type Mode = 'stylekit' | 'brand' | 'page';
type StyleKitView = 'editor' | 'preview';
type PageExtractMode = 'css-only' | 'full-page';

interface BrandAnalysis {
  url: string;
  title?: string;
  logos: Array<{
    url: string;
    type: string;
    score: number;
  }>;
  colors: Array<{
    hex: string;
    rgb: string;
    frequency: number;
    category?: string;
  }>;
  fonts: Array<{
    family: string;
    frequency: number;
    source?: string;
    weights?: number[];
  }>;
  extractedAt: string;
}

interface StyleGuideUnifiedProps {
  chatVisible: boolean;
  setChatVisible: (visible: boolean) => void;
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

export function StyleGuideUnified({
  chatVisible,
  setChatVisible,
  tabBarVisible,
  setTabBarVisible,
}: StyleGuideUnifiedProps) {
  // Mode management
  const [mode, setMode] = useState<Mode>('stylekit');
  const [styleKitView, setStyleKitView] = useState<StyleKitView>('editor');
  const [pageExtractMode, setPageExtractMode] = useState<PageExtractMode>('css-only');

  // Global state
  const { globalCss, setGlobalCss, designSystemSummary, setDesignSystemSummary, pushToWordPress } = useGlobalStylesheet();

  // Style Kit Editor state
  const [styleKit, setStyleKit] = useState<any>({
    system_colors: [
      { _id: 'primary', title: 'Primary', color: '#6EC1E4' },
      { _id: 'secondary', title: 'Secondary', color: '#54595F' },
      { _id: 'text', title: 'Text', color: '#7A7A7A' },
      { _id: 'accent', title: 'Accent', color: '#61CE70' },
    ],
    custom_colors: [],
    system_typography: [],
    custom_typography: [],
  });
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Brand Analysis state
  const [brandUrl, setBrandUrl] = useState('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);

  // CSS Class Explorer state
  const [showClassExplorer, setShowClassExplorer] = useState(false);

  // Global CSS view state
  const [showGlobalCss, setShowGlobalCss] = useState(false);

  // Push to WordPress state
  const [pushingCss, setPushingCss] = useState(false);

  // AI Cleanup state
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupChanges, setCleanupChanges] = useState<string[]>([]);
  const [cleanupWarnings, setCleanupWarnings] = useState<string[]>([]);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);

  // File upload ref for JSON import
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  // Initialize JSON from styleKit
  useEffect(() => {
    setJsonValue(JSON.stringify(styleKit, null, 2));
  }, [styleKit]);

  // Load fonts for brand analysis
  useEffect(() => {
    if (!brandAnalysis?.fonts) return;

    document.querySelectorAll('link[data-brand-font]').forEach(el => el.remove());

    const googleFonts = brandAnalysis.fonts.filter(f => f.source === 'google-fonts' && f.url);
    googleFonts.forEach(font => {
      if (font.url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = font.url;
        link.setAttribute('data-brand-font', 'true');
        document.head.appendChild(link);
      }
    });

    return () => {
      document.querySelectorAll('link[data-brand-font]').forEach(el => el.remove());
    };
  }, [brandAnalysis]);

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

  // Handle color changes in visual editor
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

  // Handle JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setStyleKit(parsed);
        setJsonValue(JSON.stringify(parsed, null, 2));
        setSuccess('Style Kit imported from file!');
        setTimeout(() => setSuccess(null), 3000);
        setJsonError(null);
      } catch (err) {
        setJsonError('Invalid JSON file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
  };

  // Handle inline font family change in preview
  const handleFontFamilyChange = (typographyId: string, newFontFamily: string) => {
    const updated = { ...styleKit };
    if (!updated.system_typography) updated.system_typography = [];

    const typoIndex = updated.system_typography.findIndex((t: any) => t._id === typographyId);
    if (typoIndex >= 0) {
      updated.system_typography[typoIndex].typography_font_family = newFontFamily;
    }
    setStyleKit(updated);
    setJsonValue(JSON.stringify(updated, null, 2));
  };

  // Handle inline button color change in preview
  const handleButtonColorChange = (property: 'background' | 'text', newColor: string) => {
    const updated = { ...styleKit };
    if (property === 'background') {
      updated.button_background_color = newColor.toUpperCase();
    } else {
      updated.button_text_color = newColor.toUpperCase();
    }
    setStyleKit(updated);
    setJsonValue(JSON.stringify(updated, null, 2));
  };

  // Load Style Kit from Playground
  const handleLoadFromPlayground = async () => {
    setLoading(true);
    setSuccess(null);
    setJsonError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).getElementorStyleKit) {
        const kit = await (window as any).getElementorStyleKit();
        console.log('📥 Loaded Style Kit from Playground:', kit);
        setStyleKit(kit);
        setJsonValue(JSON.stringify(kit, null, 2));
        setSuccess('Style Kit loaded from Playground');
        setTimeout(() => setSuccess(null), 3000);
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
    setSuccess(null);
    setJsonError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).setElementorStyleKit) {
        await (window as any).setElementorStyleKit(styleKit);
        console.log('✅ Applied Style Kit to Playground');
        setSuccess('Style Kit applied to Playground!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Playground not ready');
      }
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Failed to apply Style Kit');
    } finally {
      setApplying(false);
    }
  };

  // Load default template
  const handleLoadDefaultTemplate = () => {
    const template = defaultStyleKitTemplate as any;
    // Remove the title and description metadata
    const { title, description, ...cleanTemplate } = template;
    setStyleKit(cleanTemplate);
    setJsonValue(JSON.stringify(cleanTemplate, null, 2));
    setSuccess('Default Style Kit template loaded!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Analyze brand
  const handleAnalyzeBrand = async () => {
    if (!brandUrl.trim()) {
      setBrandError('Please enter a URL');
      return;
    }

    setBrandLoading(true);
    setBrandError(null);
    setBrandAnalysis(null);

    try {
      const response = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brandUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze brand');
      }

      const data = await response.json();
      setBrandAnalysis(data);
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : 'Failed to analyze brand');
    } finally {
      setBrandLoading(false);
    }
  };

  // Apply brand to Style Kit (basic mapping)
  const handleApplyBrandToStyleKit = () => {
    if (!brandAnalysis) return;

    const brandStyleKit = brandAnalysisToStyleKit({
      colors: brandAnalysis.colors,
      fonts: brandAnalysis.fonts,
    });

    setStyleKit(brandStyleKit);
    setJsonValue(JSON.stringify(brandStyleKit, null, 2));
    setSuccess('Brand applied to Style Kit!');
    setMode('stylekit'); // Switch back to Style Kit Editor
    setTimeout(() => setSuccess(null), 3000);
  };

  // Generate COMPLETE Style Kit with ALL Elementor fields
  const handleGenerateCompleteStyleKit = () => {
    if (!brandAnalysis) return;

    const completeStyleKit = generateCompleteStyleKit({
      colors: brandAnalysis.colors,
      fonts: brandAnalysis.fonts,
    });

    setStyleKit(completeStyleKit);
    setJsonValue(JSON.stringify(completeStyleKit, null, 2));
    setSuccess('Complete Style Kit generated with ALL Elementor fields!');
    setMode('stylekit'); // Switch back to Style Kit Editor
    setTimeout(() => setSuccess(null), 3000);
  };

  // AI Cleanup with Claude Haiku 4.5
  const handleCleanupWithAI = async () => {
    setCleanupLoading(true);
    setCleanupChanges([]);
    setCleanupWarnings([]);

    try {
      const response = await fetch('/api/cleanup-stylekit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleKit,
          brandAnalysis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clean up Style Kit');
      }

      const result = await response.json();

      // Update state with cleaned Style Kit
      setStyleKit(result.cleanedStyleKit);
      setJsonValue(JSON.stringify(result.cleanedStyleKit, null, 2));
      setCleanupChanges(result.changes || []);
      setCleanupWarnings(result.warnings || []);
      setShowCleanupDialog(true);
      setSuccess('Style Kit cleaned and optimized with AI!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('AI cleanup error:', error);
      alert(`AI cleanup failed: ${error.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  // Handle CSS extraction
  const handleCssExtracted = async (extractedCss: string, sourceUrl?: string) => {
    const separator = "\n\n/* ========== Extracted CSS ========== */\n\n";
    const updatedCss = globalCss + separator + extractedCss;
    setGlobalCss(updatedCss);

    try {
      console.log('🔍 Analyzing CSS to create design system summary...');
      const summary = await analyzeCSSWithAI(extractedCss, sourceUrl);
      setDesignSystemSummary(summary);
      console.log('✅ Design system summary created:', summary);
      setSuccess('CSS extracted and analyzed!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Failed to analyze CSS:', error);
      setBrandError('Failed to analyze CSS');
    }
  };

  // Push CSS to WordPress
  const handlePushCssToWordPress = async () => {
    setPushingCss(true);
    try {
      await pushToWordPress();
      setSuccess('CSS pushed to WordPress global stylesheet!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Failed to push CSS:', error);
      alert(`Failed to push CSS: ${error.message}`);
    } finally {
      setPushingCss(false);
    }
  };

  // Apply extracted CSS to Style Kit
  const handleApplyCSSToStyleKit = () => {
    if (!designSystemSummary) return;

    // Convert design system to style kit format
    const cssStyleKit = {
      system_colors: designSystemSummary.classes.colors.slice(0, 4).map((c, i) => ({
        _id: ['primary', 'secondary', 'text', 'accent'][i],
        title: ['Primary', 'Secondary', 'Text', 'Accent'][i],
        color: c.rules.match(/#[0-9a-fA-F]{6}/)?.[0] || '#000000',
      })),
      custom_colors: designSystemSummary.classes.colors.slice(0, 8).map((c, i) => ({
        _id: `extracted_color_${i + 1}`,
        title: c.name || `Color ${i + 1}`,
        color: c.rules.match(/#[0-9a-fA-F]{6}/)?.[0] || '#000000',
      })),
      ...styleKit,
    };

    setStyleKit(cssStyleKit);
    setJsonValue(JSON.stringify(cssStyleKit, null, 2));
    setSuccess('Extracted CSS applied to Style Kit!');
    setMode('stylekit');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
    }}>
      {/* Mode Selector */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
          Style Guide - Design System Manager
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMode('stylekit')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: mode === 'stylekit' ? 'var(--primary)' : 'var(--muted)',
              color: mode === 'stylekit' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📊 Style Kit Editor
          </button>
          <button
            onClick={() => setMode('brand')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: mode === 'brand' ? 'var(--primary)' : 'var(--muted)',
              color: mode === 'brand' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            🎨 Brand Extract
          </button>
          <button
            onClick={() => setMode('page')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: mode === 'page' ? 'var(--primary)' : 'var(--muted)',
              color: mode === 'page' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📄 Page Extract
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(success || jsonError || brandError) && (
        <div style={{ padding: '0 24px' }}>
          {success && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
            }}>
              ✅ {success}
            </div>
          )}
          {(jsonError || brandError) && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              borderRadius: '6px',
              fontSize: '14px',
            }}>
              {jsonError || brandError}
            </div>
          )}
        </div>
      )}

      {/* MODE 1: Style Kit Editor */}
      {mode === 'stylekit' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left: Visual Controls */}
              <div style={{
                width: '40%',
                borderRight: '1px solid var(--border)',
                overflowY: 'auto',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={handleLoadFromPlayground}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: loading ? 'var(--muted)' : 'var(--primary)',
                      color: loading ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Loading...' : '📥 Load'}
                  </button>
                  <button
                    onClick={handleApplyToPlayground}
                    disabled={applying}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: applying ? 'var(--muted)' : 'var(--primary)',
                      color: applying ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: applying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {applying ? 'Applying...' : '🚀 Apply'}
                  </button>
                  <button
                    onClick={handleCleanupWithAI}
                    disabled={cleanupLoading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: cleanupLoading ? 'var(--muted)' : 'var(--accent)',
                      color: cleanupLoading ? 'var(--muted-foreground)' : 'var(--accent-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: cleanupLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {cleanupLoading ? '🤖 Cleaning...' : '🤖 Clean with AI'}
                  </button>
                  <button
                    onClick={handleLoadDefaultTemplate}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    📋 Load Default
                  </button>
                  <label style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: 'var(--muted)',
                    color: 'var(--muted-foreground)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-block',
                  }}>
                    📤 Upload JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* System Colors */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                    System Colors
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {styleKit.system_colors?.map((color: any, i: number) => (
                      <div key={color._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                      }}>
                        <input
                          type="color"
                          value={color.color}
                          onChange={(e) => handleColorChange('system', i, e.target.value)}
                          style={{
                            width: '40px',
                            height: '40px',
                            border: '2px solid var(--border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{color.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                            {color.color}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                {styleKit.custom_colors && styleKit.custom_colors.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                      Custom Colors ({styleKit.custom_colors.length})
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                    }}>
                      {styleKit.custom_colors.slice(0, 6).map((color: any, i: number) => (
                        <div key={color._id} style={{
                          padding: '8px',
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          textAlign: 'center',
                        }}>
                          <input
                            type="color"
                            value={color.color}
                            onChange={(e) => handleColorChange('custom', i, e.target.value)}
                            style={{
                              width: '100%',
                              height: '40px',
                              border: '2px solid var(--border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginBottom: '6px',
                            }}
                          />
                          <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            {color.color}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Fonts */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                    System Fonts
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {styleKit.system_typography?.map((typo: any, i: number) => (
                      <div key={typo._id} style={{
                        padding: '12px',
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--muted-foreground)' }}>
                          {typo.title}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--muted-foreground)' }}>Font Family</label>
                          <input
                            type="text"
                            value={typo.typography_font_family || ''}
                            onChange={(e) => {
                              const updated = { ...styleKit };
                              if (updated.system_typography) {
                                updated.system_typography[i].typography_font_family = e.target.value;
                                setStyleKit(updated);
                                setJsonValue(JSON.stringify(updated, null, 2));
                              }
                            }}
                            placeholder="e.g. Roboto, Inter, Arial"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              fontSize: '13px',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              backgroundColor: 'var(--background)',
                              color: 'var(--foreground)',
                              fontFamily: typo.typography_font_family || 'inherit',
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--muted-foreground)' }}>Weight</label>
                            <input
                              type="text"
                              value={typo.typography_font_weight || '400'}
                              onChange={(e) => {
                                const updated = { ...styleKit };
                                if (updated.system_typography) {
                                  updated.system_typography[i].typography_font_weight = e.target.value;
                                  setStyleKit(updated);
                                  setJsonValue(JSON.stringify(updated, null, 2));
                                }
                              }}
                              placeholder="400"
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '13px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--background)',
                                color: 'var(--foreground)',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--muted-foreground)' }}>Size (px)</label>
                            <input
                              type="number"
                              value={typo.typography_font_size?.size || 16}
                              onChange={(e) => {
                                const updated = { ...styleKit };
                                if (updated.system_typography) {
                                  if (!updated.system_typography[i].typography_font_size) {
                                    updated.system_typography[i].typography_font_size = { unit: 'px', size: 16, sizes: [] };
                                  }
                                  updated.system_typography[i].typography_font_size.size = parseFloat(e.target.value);
                                  setStyleKit(updated);
                                  setJsonValue(JSON.stringify(updated, null, 2));
                                }
                              }}
                              placeholder="16"
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '13px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--background)',
                                color: 'var(--foreground)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Fonts */}
                {styleKit.custom_typography && styleKit.custom_typography.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                      Custom Fonts ({styleKit.custom_typography.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {styleKit.custom_typography.map((typo: any, i: number) => (
                        <div key={typo._id} style={{
                          padding: '12px',
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--muted-foreground)' }}>
                            {typo.title}
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--muted-foreground)' }}>Font Family</label>
                            <input
                              type="text"
                              value={typo.typography_font_family || ''}
                              onChange={(e) => {
                                const updated = { ...styleKit };
                                if (updated.custom_typography) {
                                  updated.custom_typography[i].typography_font_family = e.target.value;
                                  setStyleKit(updated);
                                  setJsonValue(JSON.stringify(updated, null, 2));
                                }
                              }}
                              placeholder="e.g. Roboto, Inter, Arial"
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '13px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--background)',
                                color: 'var(--foreground)',
                                fontFamily: typo.typography_font_family || 'inherit',
                              }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--muted-foreground)' }}>Weight</label>
                              <input
                                type="text"
                                value={typo.typography_font_weight || '400'}
                                onChange={(e) => {
                                  const updated = { ...styleKit };
                                  if (updated.custom_typography) {
                                    updated.custom_typography[i].typography_font_weight = e.target.value;
                                    setStyleKit(updated);
                                    setJsonValue(JSON.stringify(updated, null, 2));
                                  }
                                }}
                                placeholder="400"
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  fontSize: '13px',
                                  border: '1px solid var(--border)',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--background)',
                                  color: 'var(--foreground)',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--muted-foreground)' }}>Size (px)</label>
                              <input
                                type="number"
                                value={typo.typography_font_size?.size || 16}
                                onChange={(e) => {
                                  const updated = { ...styleKit };
                                  if (updated.custom_typography) {
                                    if (!updated.custom_typography[i].typography_font_size) {
                                      updated.custom_typography[i].typography_font_size = { unit: 'px', size: 16, sizes: [] };
                                    }
                                    updated.custom_typography[i].typography_font_size.size = parseFloat(e.target.value);
                                    setStyleKit(updated);
                                    setJsonValue(JSON.stringify(updated, null, 2));
                                  }
                                }}
                                placeholder="16"
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  fontSize: '13px',
                                  border: '1px solid var(--border)',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--background)',
                                  color: 'var(--foreground)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Global CSS (Extracted from Pages) */}
                {globalCss && (
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={() => setShowGlobalCss(!showGlobalCss)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor: 'var(--muted)',
                        color: 'var(--muted-foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>📄 Global CSS ({globalCss.length} chars)</span>
                      <span style={{ fontSize: '18px' }}>{showGlobalCss ? '▼' : '▶'}</span>
                    </button>
                    {showGlobalCss && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}>
                        {globalCss}
                      </div>
                    )}
                    <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '8px', margin: '8px 0 0 0' }}>
                      This CSS is stored separately and applied globally. Use "Apply to WordPress" to deploy.
                    </p>
                  </div>
                )}
              </div>

              {/* Right: JSON Editor or Live Preview */}
              <div style={{
                width: '60%',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                    {styleKitView === 'editor' ? 'Style Kit JSON' : 'Live Preview'}
                  </h3>
                  <button
                    onClick={() => setStyleKitView(styleKitView === 'editor' ? 'preview' : 'editor')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {styleKitView === 'editor' ? '👁️ View Preview' : '✏️ Edit JSON'}
                  </button>
                </div>
                {styleKitView === 'editor' ? (
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
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

              <div style={{
                padding: '32px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}>
                {/* Typography Specimens with Inline Editing */}
                <div style={{ marginBottom: '16px', position: 'relative', padding: '8px', border: '1px dashed transparent', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                  <h1 style={{
                    fontFamily: styleKit.system_typography?.[0]?.typography_font_family || 'inherit',
                    fontWeight: styleKit.system_typography?.[0]?.typography_font_weight || 600,
                    color: styleKit.system_colors?.[0]?.color || '#000',
                    marginBottom: '4px',
                  }}>
                    Heading with Primary Typography
                  </h1>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>Font:</span>
                    <input
                      type="text"
                      value={styleKit.system_typography?.[0]?.typography_font_family || ''}
                      onChange={(e) => handleFontFamilyChange('primary', e.target.value)}
                      placeholder="e.g. Roboto, Inter"
                      style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        border: '1px solid var(--border)',
                        borderRadius: '3px',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        width: '150px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px', position: 'relative', padding: '8px', border: '1px dashed transparent', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                  <h2 style={{
                    fontFamily: styleKit.system_typography?.[1]?.typography_font_family || 'inherit',
                    fontWeight: styleKit.system_typography?.[1]?.typography_font_weight || 500,
                    color: styleKit.system_colors?.[1]?.color || '#000',
                    marginBottom: '4px',
                  }}>
                    Secondary Heading
                  </h2>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>Font:</span>
                    <input
                      type="text"
                      value={styleKit.system_typography?.[1]?.typography_font_family || ''}
                      onChange={(e) => handleFontFamilyChange('secondary', e.target.value)}
                      placeholder="e.g. Roboto, Inter"
                      style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        border: '1px solid var(--border)',
                        borderRadius: '3px',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        width: '150px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px', position: 'relative', padding: '8px', border: '1px dashed transparent', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                  <p style={{
                    fontFamily: styleKit.system_typography?.[2]?.typography_font_family || 'inherit',
                    color: styleKit.system_colors?.[2]?.color || '#000',
                    marginBottom: '4px',
                    lineHeight: 1.6,
                  }}>
                    Body text with text color. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>Font:</span>
                    <input
                      type="text"
                      value={styleKit.system_typography?.[2]?.typography_font_family || ''}
                      onChange={(e) => handleFontFamilyChange('text', e.target.value)}
                      placeholder="e.g. Roboto, Inter"
                      style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        border: '1px solid var(--border)',
                        borderRadius: '3px',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        width: '150px',
                      }}
                    />
                  </div>
                </div>

                {/* Buttons with Inline Color Pickers */}
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--muted-foreground)' }}>
                    Button Styles (click colors to edit)
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div>
                      <button style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: styleKit.button_background_color || styleKit.system_colors?.[0]?.color || '#000',
                        color: styleKit.button_text_color || '#fff',
                        border: 'none',
                        borderRadius: styleKit.button_border_radius?.top || 4,
                        cursor: 'pointer',
                      }}>
                        Primary Button
                      </button>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '11px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>BG:</span>
                          <input
                            type="color"
                            value={styleKit.button_background_color || styleKit.system_colors?.[0]?.color || '#000'}
                            onChange={(e) => handleButtonColorChange('background', e.target.value)}
                            style={{
                              width: '30px',
                              height: '24px',
                              border: '1px solid var(--border)',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                          />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Text:</span>
                          <input
                            type="color"
                            value={styleKit.button_text_color || '#fff'}
                            onChange={(e) => handleButtonColorChange('text', e.target.value)}
                            style={{
                              width: '30px',
                              height: '24px',
                              border: '1px solid var(--border)',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Color Palette</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {styleKit.system_colors?.map((color: any) => (
                      <div key={color._id} style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: color.color,
                        borderRadius: '4px',
                        border: '2px solid var(--border)',
                      }} />
                    ))}
                  </div>
                </div>
                  </div>
                </div>
                )}
              </div>
        </div>
      )}

      {/* MODE 2: Brand Analysis */}
      {mode === 'brand' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '24px',
          }}>
            <strong>Extract brand identity</strong> from any website and apply it to your Style Kit.
            Colors, fonts, and logos will be automatically detected.
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
                placeholder="https://stripe.com"
                disabled={brandLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeBrand()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              />
              <button
                onClick={handleAnalyzeBrand}
                disabled={brandLoading}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: brandLoading ? 'var(--muted)' : 'var(--primary)',
                  color: brandLoading ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: brandLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {brandLoading ? 'Analyzing...' : '🔍 Analyze Brand'}
              </button>
            </div>
          </div>

          {brandAnalysis && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>
                    {brandAnalysis.title || new URL(brandAnalysis.url).hostname}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    {brandAnalysis.colors.length} colors • {brandAnalysis.fonts.length} fonts • {brandAnalysis.logos.length} logos
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleApplyBrandToStyleKit}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    🎨 Apply Basic
                  </button>
                  <button
                    onClick={handleGenerateCompleteStyleKit}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    ✨ Generate Complete Style Kit →
                  </button>
                </div>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '24px',
                color: 'var(--muted-foreground)',
              }}>
                <strong>Complete Style Kit</strong> includes ALL Elementor default fields: System/Custom Typography (Primary Heading, Secondary Heading, Body Text, Caption, Small Text, Accent Text), H1-H6 headings, buttons, forms, images, links, and global settings.
              </div>

              {/* Colors */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                  Colors ({brandAnalysis.colors.length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '12px',
                }}>
                  {brandAnalysis.colors.slice(0, 12).map((color, i) => (
                    <div key={i} style={{
                      padding: '8px',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: '100%',
                        height: '50px',
                        backgroundColor: color.hex,
                        borderRadius: '4px',
                        marginBottom: '6px',
                      }} />
                      <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        {color.hex}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fonts */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                  Fonts ({brandAnalysis.fonts.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {brandAnalysis.fonts.slice(0, 6).map((font, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontFamily: `"${font.family}", -apple-system, sans-serif`,
                        marginBottom: '4px',
                      }}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        {font.family} • {font.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logos */}
              {brandAnalysis.logos.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                    Logos ({brandAnalysis.logos.length})
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '12px',
                  }}>
                    {brandAnalysis.logos.slice(0, 6).map((logo, i) => (
                      <div key={i} style={{
                        padding: '12px',
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        textAlign: 'center',
                      }}>
                        <div style={{
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px',
                        }}>
                          <img
                            src={logo.url}
                            alt={logo.type}
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
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                          {logo.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Page Extractor */}
      {mode === 'page' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
          }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button
                onClick={() => setPageExtractMode('css-only')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: pageExtractMode === 'css-only' ? 'var(--primary)' : 'var(--muted)',
                  color: pageExtractMode === 'css-only' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                📄 Extract CSS Only
              </button>
              <button
                onClick={() => setPageExtractMode('full-page')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: pageExtractMode === 'full-page' ? 'var(--primary)' : 'var(--muted)',
                  color: pageExtractMode === 'full-page' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                🌐 Extract Full Page
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
              {pageExtractMode === 'css-only'
                ? 'Extract CSS to match existing website styling and apply to Style Kit'
                : 'Extract complete HTML/CSS to replicate page layouts for Section Library'}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <PageExtractor
              onCssExtracted={handleCssExtracted}
              extractMode={pageExtractMode}
            />

            {pageExtractMode === 'css-only' && designSystemSummary && (
              <div style={{ marginTop: '24px' }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>
                    ✅ CSS Extracted & Analyzed
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    {designSystemSummary.totalClasses} CSS classes found from {designSystemSummary.extractedFrom}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowClassExplorer(true)}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    📚 Browse CSS Classes
                  </button>
                  <button
                    onClick={handlePushCssToWordPress}
                    disabled={pushingCss}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: pushingCss ? 'var(--muted)' : 'var(--accent)',
                      color: pushingCss ? 'var(--muted-foreground)' : 'var(--accent-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: pushingCss ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {pushingCss ? '⬆️ Pushing...' : '⬆️ Push to WordPress'}
                  </button>
                  <button
                    onClick={handleApplyCSSToStyleKit}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    🎨 Apply to Style Kit →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Class Explorer Modal */}
      {showClassExplorer && designSystemSummary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '90%',
            height: '90%',
            backgroundColor: 'var(--background)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <CSSClassExplorer
              designSystemSummary={designSystemSummary}
              onClose={() => setShowClassExplorer(false)}
            />
          </div>
        </div>
      )}

      {/* AI Cleanup Results Dialog */}
      {showCleanupDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
              🤖 AI Cleanup Complete
            </h2>

            {cleanupChanges.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                  ✅ Changes Applied ({cleanupChanges.length})
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                  {cleanupChanges.map((change, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{change}</li>
                  ))}
                </ul>
              </div>
            )}

            {cleanupWarnings.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--destructive)' }}>
                  ⚠️ Warnings ({cleanupWarnings.length})
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                  {cleanupWarnings.map((warning, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {cleanupChanges.length === 0 && cleanupWarnings.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
                No changes were necessary. Your Style Kit is already optimized!
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowCleanupDialog(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
