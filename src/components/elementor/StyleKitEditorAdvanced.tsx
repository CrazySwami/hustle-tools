'use client';

import { useState, useEffect, useRef } from 'react';
import { StyleKitGeneratorDialog } from './StyleKitGeneratorDialog';

type FieldStatus = 'missing' | 'default' | 'has-data';
type EditorTab = 'global-colors' | 'global-typography' | 'theme-typography' | 'buttons' | 'forms' | 'images';
type SubTab = 'system' | 'custom';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface StyleKitEditorAdvancedProps {
  onStyleKitChange?: (styleKit: any) => void;
}

export function StyleKitEditorAdvanced({ onStyleKitChange }: StyleKitEditorAdvancedProps) {
  const [kit, setKit] = useState<any>({
    title: 'My Style Kit',
    type: 'kit',
    version: '0.4',
    page_settings: {
      system_colors: [],
      custom_colors: [],
      system_typography: [],
      custom_typography: [],
    },
    content: [],
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('global-colors');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('system');
  const [activeHeading, setActiveHeading] = useState('h1');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview interaction states (must be at top level, not inside renderPreview)
  const [button1Hovered, setButton1Hovered] = useState(false);
  const [button2Hovered, setButton2Hovered] = useState(false);
  const [input1Focused, setInput1Focused] = useState(false);
  const [input2Focused, setInput2Focused] = useState(false);
  const [input3Focused, setInput3Focused] = useState(false);
  const [image1Hovered, setImage1Hovered] = useState(false);
  const [image2Hovered, setImage2Hovered] = useState(false);

  // AI Generation state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent when kit changes
  useEffect(() => {
    if (onStyleKitChange) {
      onStyleKitChange(kit.page_settings);
    }
  }, [kit, onStyleKitChange]);

  // Helper functions
  const getFieldStatus = (value: any, defaultValue: any): FieldStatus => {
    if (value === undefined || value === null) return 'missing';
    if (JSON.stringify(value) === JSON.stringify(defaultValue)) return 'default';
    return 'has-data';
  };

  const getStatusIcon = (status: FieldStatus): string => {
    if (status === 'has-data') return '●';
    if (status === 'default') return '●';
    return '●';
  };

  const getStatusBadge = (status: FieldStatus): string => {
    if (status === 'has-data') return 'HAS DATA';
    if (status === 'default') return 'DEFAULT';
    return 'MISSING';
  };

  const updateSetting = (key: string, value: any) => {
    setKit((prev: any) => ({
      ...prev,
      page_settings: {
        ...prev.page_settings,
        [key]: value,
      },
    }));
  };

  const updateSize = (key: string, field: string, value: any) => {
    const current = kit.page_settings[key] || { unit: 'px', size: 0 };
    updateSetting(key, { ...current, [field]: value });
  };

  const updateDimension = (key: string, field: string, value: any) => {
    const current = kit.page_settings[key] || { unit: 'px', top: 0, right: 0, bottom: 0, left: 0 };
    updateSetting(key, { ...current, [field]: value });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(kit, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kit.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setKit((prev: any) => ({
          ...prev,
          ...imported,
          page_settings: {
            ...prev.page_settings,
            ...(imported.page_settings || {}),
          },
        }));
        alert('Imported successfully!');
      } catch (e: any) {
        alert('❌ Failed to import: ' + e.message);
      }
    };
    reader.readAsText(file);
  };

  const handleAIGenerate = async (config: {
    model: 'gemini-2.5-flash' | 'claude-haiku-4.5' | 'gpt-5';
    brandfetchData?: {
      colors?: string[];
      fonts?: string[];
      logos?: string[];
      url?: string;
    };
    stylePreferences?: string;
    industry?: string;
    images?: Array<{ url: string; filename: string; description?: string }>;
  }) => {
    setIsGenerating(true);
    setGenerationProgress('Initializing AI generation...');

    try {
      const response = await fetch('/api/generate-stylekit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          brandfetchData: config.brandfetchData,
          stylePreferences: config.stylePreferences,
          industry: config.industry,
          images: config.images,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setGenerationProgress('Stage 1/4: Generating brand colors...');

      // Wait a moment to show progress (API is running all stages)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGenerationProgress('Stage 2/4: Generating typography...');

      await new Promise(resolve => setTimeout(resolve, 2000));
      setGenerationProgress('Stage 3/4: Generating heading styles...');

      await new Promise(resolve => setTimeout(resolve, 2000));
      setGenerationProgress('Stage 4/4: Generating component styles...');

      // API now returns a complete Style Kit JSON (non-streaming)
      const generatedKit = await response.json();

      setGenerationProgress('Merging all fields into Style Kit...');

      // Update the kit with the complete Style Kit
      setKit(generatedKit);

      setGenerationProgress('Style Kit generated successfully!');

      setTimeout(() => {
        setShowAIDialog(false);
        setIsGenerating(false);
        setGenerationProgress('');
      }, 1500);

    } catch (error: any) {
      console.error('AI generation error:', error);
      setGenerationProgress(`❌ Error: ${error.message}`);
      setIsGenerating(false);
    }
  };

  // Preview style generators
  const getHeadingStyle = (level: string) => {
    const s = kit.page_settings;
    const prefix = level;
    return {
      fontFamily: s[`${prefix}_typography_font_family`] || 'Inter',
      fontWeight: s[`${prefix}_typography_font_weight`] || '700',
      fontSize: `${s[`${prefix}_typography_font_size`]?.size || 48}${s[`${prefix}_typography_font_size`]?.unit || 'px'}`,
      lineHeight: s[`${prefix}_typography_line_height`]?.size || 1.2,
      letterSpacing: `${s[`${prefix}_typography_letter_spacing`]?.size || 0}${s[`${prefix}_typography_letter_spacing`]?.unit || 'px'}`,
      textTransform: s[`${prefix}_typography_text_transform`] || 'none',
      color: s[`${prefix}_color`] || '#000000',
    };
  };

  const getBodyStyle = () => {
    const s = kit.page_settings;
    return {
      fontFamily: s.body_typography_font_family || 'Inter',
      fontWeight: s.body_typography_font_weight || '400',
      fontSize: `${s.body_typography_font_size?.size || 16}${s.body_typography_font_size?.unit || 'px'}`,
      lineHeight: s.body_typography_line_height?.size || 1.7,
      letterSpacing: `${s.body_typography_letter_spacing?.size || 0}${s.body_typography_letter_spacing?.unit || 'px'}`,
      color: s.body_color || '#333333',
    };
  };

  const getLinkStyle = () => {
    const s = kit.page_settings;
    return {
      color: s.link_normal_color || '#0073aa',
      textDecoration: s.link_typography_text_decoration || 'none',
    };
  };

  const getButtonStyle = () => {
    const s = kit.page_settings;
    const shadow =
      s.button_box_shadow_box_shadow_type === 'yes' && s.button_box_shadow_box_shadow
        ? `${s.button_box_shadow_box_shadow.horizontal}px ${s.button_box_shadow_box_shadow.vertical}px ${s.button_box_shadow_box_shadow.blur}px ${s.button_box_shadow_box_shadow.spread}px ${s.button_box_shadow_box_shadow.color}`
        : 'none';

    return {
      fontFamily: s.button_typography_font_family || 'Inter',
      fontWeight: s.button_typography_font_weight || '600',
      fontSize: `${s.button_typography_font_size?.size || 16}${s.button_typography_font_size?.unit || 'px'}`,
      lineHeight: `${s.button_typography_line_height?.size || 24}${s.button_typography_line_height?.unit || 'px'}`,
      letterSpacing: `${s.button_typography_letter_spacing?.size || 0}${s.button_typography_letter_spacing?.unit || 'px'}`,
      textTransform: s.button_typography_text_transform || 'none',
      color: s.button_text_color || '#ffffff',
      backgroundColor: s.button_background_color || '#0073aa',
      borderColor: s.button_border_color || '#0073aa',
      borderWidth: `${s.button_border_width?.top || 2}px`,
      borderStyle: 'solid',
      borderRadius: `${s.button_border_radius?.top || 8}px`,
      padding: `${s.button_padding?.top || 14}px ${s.button_padding?.right || 28}px`,
      boxShadow: shadow,
      transition: `all ${s.button_hover_transition?.size || 200}ms ease`,
    };
  };

  const getButtonHoverStyle = () => {
    const s = kit.page_settings;
    return {
      color: s.button_hover_color || '#ffffff',
      backgroundColor: s.button_hover_background_color || '#005a87',
      borderColor: s.button_hover_border_color || '#005a87',
    };
  };

  const getFormLabelStyle = () => {
    const s = kit.page_settings;
    return {
      color: s.form_label_color || '#000000',
      fontWeight: s.form_label_typography_font_weight || '500',
      fontSize: `${s.form_label_typography_font_size?.size || 14}${s.form_label_typography_font_size?.unit || 'px'}`,
    };
  };

  const getFormInputStyle = () => {
    const s = kit.page_settings;
    return {
      color: s.form_field_text_color || '#333333',
      backgroundColor: s.form_field_background_color || '#ffffff',
      borderColor: s.form_field_border_color || '#cccccc',
      borderWidth: `${s.form_field_border_width?.top || 1}px`,
      borderStyle: 'solid',
      borderRadius: `${s.form_field_border_radius?.top || 6}px`,
      padding: `${s.form_field_padding?.top || 12}px ${s.form_field_padding?.right || 16}px`,
      transition: `all ${s.form_field_focus_transition_duration?.size || 150}ms ease`,
    };
  };

  const getFormInputFocusStyle = () => {
    const s = kit.page_settings;
    return {
      borderColor: s.form_field_focus_border_color || '#0073aa',
      outline: 'none',
    };
  };

  const getImageStyle = () => {
    const s = kit.page_settings;
    const filters = `blur(${s.image_css_filters_blur?.size || 0}px) brightness(${s.image_css_filters_brightness?.size || 100}%) contrast(${s.image_css_filters_contrast?.size || 100}%) saturate(${s.image_css_filters_saturation?.size || 100}%)`;

    return {
      borderRadius: `${s.image_border_radius?.top || 8}px`,
      filter: filters,
      opacity: s.image_opacity?.size || 1,
      transition: `all ${s.image_hover_transition_duration?.size || 300}ms ease`,
    };
  };

  const getImageHoverStyle = () => {
    const s = kit.page_settings;
    return {
      opacity: s.image_hover_opacity?.size || 0.9,
    };
  };

  // Render functions
  const renderGlobalColors = () => {
    const s = kit.page_settings;

    if (activeSubTab === 'system') {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Field Status Legend</h4>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
              <div><span style={{ marginRight: '6px', color: '#10b981' }}>●</span>Has Data</div>
              <div><span style={{ marginRight: '6px', color: '#f59e0b' }}>●</span>Default Value</div>
              <div><span style={{ marginRight: '6px', color: '#ef4444' }}>●</span>Missing from JSON</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
              System Colors (4 Required)
              <span style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '12px',
                backgroundColor: s.system_colors && s.system_colors.length === 4 ? '#4caf50' : '#f44336',
                color: 'white',
              }}>
                {s.system_colors && s.system_colors.length === 4 ? 'COMPLETE' : 'INCOMPLETE'}
              </span>
            </h3>
            {s.system_colors && s.system_colors.length > 0 ? (
              s.system_colors.map((color: any, idx: number) => (
                <div key={color._id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    <span>{getStatusIcon(getFieldStatus(color.color, null))}</span>
                    {color.title}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={color.color || '#000000'}
                      onChange={(e) => {
                        const newColors = [...s.system_colors];
                        newColors[idx].color = e.target.value;
                        updateSetting('system_colors', newColors);
                      }}
                      style={{ width: '50px', height: '38px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={color.color || '#000000'}
                      onChange={(e) => {
                        const newColors = [...s.system_colors];
                        newColors[idx].color = e.target.value;
                        updateSetting('system_colors', newColors);
                      }}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#dc3545', fontSize: '13px' }}>No system colors found in JSON. Please add 4 system colors.</p>
            )}
          </div>
        </div>
      );
    }

    if (activeSubTab === 'custom') {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Custom Colors
              <span style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '12px',
                backgroundColor: s.custom_colors && s.custom_colors.length > 0 ? '#4caf50' : '#ff9800',
                color: 'white',
              }}>
                {s.custom_colors && s.custom_colors.length > 0 ? `${s.custom_colors.length} COLORS` : 'NONE'}
              </span>
            </h3>
            {s.custom_colors && s.custom_colors.length > 0 ? (
              s.custom_colors.map((color: any, idx: number) => (
                <div key={color._id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    <span style={{ color: '#10b981' }}>●</span>
                    {color.title}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={color.color}
                      onChange={(e) => {
                        const newColors = [...s.custom_colors];
                        newColors[idx].color = e.target.value;
                        updateSetting('custom_colors', newColors);
                      }}
                      style={{ width: '50px', height: '38px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={color.color}
                      onChange={(e) => {
                        const newColors = [...s.custom_colors];
                        newColors[idx].color = e.target.value;
                        updateSetting('custom_colors', newColors);
                      }}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
                    />
                    <button
                      onClick={() => {
                        const newColors = s.custom_colors.filter((_: any, i: number) => i !== idx);
                        updateSetting('custom_colors', newColors);
                      }}
                      style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#856404', fontSize: '13px' }}>No custom colors in JSON.</p>
            )}
            <button
              onClick={() => {
                const newColor = {
                  _id: Math.random().toString(36).substr(2, 9),
                  title: 'New Color',
                  color: '#000000',
                };
                updateSetting('custom_colors', [...(s.custom_colors || []), newColor]);
              }}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '12px' }}
            >
              + Add Custom Color
            </button>
          </div>
        </div>
      );
    }
  };

  const renderGlobalTypography = () => {
    const s = kit.page_settings;

    if (activeSubTab === 'system') {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Field Status Legend</h4>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
              <div><span style={{ marginRight: '6px', color: '#10b981' }}>●</span>Has Data</div>
              <div><span style={{ marginRight: '6px', color: '#f59e0b' }}>●</span>Default Value</div>
              <div><span style={{ marginRight: '6px', color: '#ef4444' }}>●</span>Missing from JSON</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
              System Typography (4 Required)
              <span style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '12px',
                backgroundColor: s.system_typography && s.system_typography.length === 4 ? '#4caf50' : '#f44336',
                color: 'white',
              }}>
                {s.system_typography && s.system_typography.length === 4 ? 'COMPLETE' : 'INCOMPLETE'}
              </span>
            </h3>
            {s.system_typography && s.system_typography.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {s.system_typography.map((typo: any, idx: number) => (
                  <div key={typo._id} style={{ padding: '16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>
                      {getStatusIcon(getFieldStatus(typo.typography_font_family, null))} {typo.title}
                    </h4>
                    <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      {typo.typography_font_family || 'No font'} • {typo.typography_font_weight || 'No weight'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#dc3545', fontSize: '13px' }}>No system typography found in JSON.</p>
            )}
          </div>
        </div>
      );
    }

    if (activeSubTab === 'custom') {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Custom Typography
              <span style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '12px',
                backgroundColor: s.custom_typography && s.custom_typography.length > 0 ? '#4caf50' : '#ff9800',
                color: 'white',
              }}>
                {s.custom_typography && s.custom_typography.length > 0 ? `${s.custom_typography.length} PRESETS` : 'NONE'}
              </span>
            </h3>
            {s.custom_typography && s.custom_typography.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {s.custom_typography.map((typo: any, idx: number) => (
                  <div key={typo._id} style={{ padding: '16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>{typo.title}</h4>
                    <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      {typo.typography_font_family} • {typo.typography_font_weight}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#856404', fontSize: '13px' }}>No custom typography presets in JSON.</p>
            )}
            <button
              onClick={() => {
                alert('Custom typography preset editor coming soon!');
              }}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '12px' }}
            >
              + Add Custom Typography
            </button>
          </div>
        </div>
      );
    }
  };

  const renderThemeTypography = () => {
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const s = kit.page_settings;
    const prefix = activeHeading;

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Field Status Legend</h4>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
            <div><span style={{ marginRight: '6px', color: '#10b981' }}>●</span>Has Data</div>
            <div><span style={{ marginRight: '6px', color: '#f59e0b' }}>●</span>Default Value</div>
            <div><span style={{ marginRight: '6px', color: '#ef4444' }}>●</span>Missing from JSON</div>
          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {headings.map((h) => (
            <button
              key={h}
              onClick={() => setActiveHeading(h)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: activeHeading === h ? 'var(--primary)' : 'var(--muted)',
                color: activeHeading === h ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {h}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s[`${prefix}_typography_font_family`], null))} Font Family
          </h3>
          <input
            type="text"
            value={s[`${prefix}_typography_font_family`] || ''}
            onChange={(e) => updateSetting(`${prefix}_typography_font_family`, e.target.value)}
            placeholder="e.g., Inter, Roboto, Arial"
            style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s[`${prefix}_typography_font_weight`], null))} Font Weight
          </h3>
          <select
            value={s[`${prefix}_typography_font_weight`] || '400'}
            onChange={(e) => updateSetting(`${prefix}_typography_font_weight`, e.target.value)}
            style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          >
            <option value="100">100 - Thin</option>
            <option value="200">200 - Extra Light</option>
            <option value="300">300 - Light</option>
            <option value="400">400 - Normal</option>
            <option value="500">500 - Medium</option>
            <option value="600">600 - Semi Bold</option>
            <option value="700">700 - Bold</option>
            <option value="800">800 - Extra Bold</option>
            <option value="900">900 - Black</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s[`${prefix}_typography_font_size`], null))} Font Size
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              value={s[`${prefix}_typography_font_size`]?.size || ''}
              onChange={(e) => updateSize(`${prefix}_typography_font_size`, 'size', parseFloat(e.target.value))}
              placeholder="48"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
            <select
              value={s[`${prefix}_typography_font_size`]?.unit || 'px'}
              onChange={(e) => updateSize(`${prefix}_typography_font_size`, 'unit', e.target.value)}
              style={{ padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="px">px</option>
              <option value="em">em</option>
              <option value="rem">rem</option>
              <option value="%">%</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s[`${prefix}_color`], null))} Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s[`${prefix}_color`] || '#000000'}
              onChange={(e) => updateSetting(`${prefix}_color`, e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s[`${prefix}_color`] || ''}
              onChange={(e) => updateSetting(`${prefix}_color`, e.target.value)}
              placeholder="#000000"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderButtons = () => {
    const s = kit.page_settings;

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Button Configuration</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure default button styles for your theme
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.button_background_color, null))} Background Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.button_background_color || '#0073aa'}
              onChange={(e) => updateSetting('button_background_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.button_background_color || ''}
              onChange={(e) => updateSetting('button_background_color', e.target.value)}
              placeholder="#0073aa"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.button_text_color, null))} Text Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.button_text_color || '#ffffff'}
              onChange={(e) => updateSetting('button_text_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.button_text_color || ''}
              onChange={(e) => updateSetting('button_text_color', e.target.value)}
              placeholder="#ffffff"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.button_border_radius, null))} Border Radius
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <div key={side}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize', color: 'var(--muted-foreground)' }}>
                  {side}
                </label>
                <input
                  type="number"
                  value={s.button_border_radius?.[side] || ''}
                  onChange={(e) => updateDimension('button_border_radius', side, parseFloat(e.target.value))}
                  placeholder="8"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.button_padding, null))} Padding
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <div key={side}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize', color: 'var(--muted-foreground)' }}>
                  {side}
                </label>
                <input
                  type="number"
                  value={s.button_padding?.[side] || ''}
                  onChange={(e) => updateDimension('button_padding', side, parseFloat(e.target.value))}
                  placeholder="14"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.button_hover_background_color, null))} Hover Background Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.button_hover_background_color || '#005a87'}
              onChange={(e) => updateSetting('button_hover_background_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.button_hover_background_color || ''}
              onChange={(e) => updateSetting('button_hover_background_color', e.target.value)}
              placeholder="#005a87"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderForms = () => {
    const s = kit.page_settings;

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Form Field Configuration</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure default form field styles
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.form_field_background_color, null))} Field Background Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.form_field_background_color || '#ffffff'}
              onChange={(e) => updateSetting('form_field_background_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.form_field_background_color || ''}
              onChange={(e) => updateSetting('form_field_background_color', e.target.value)}
              placeholder="#ffffff"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.form_field_text_color, null))} Text Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.form_field_text_color || '#333333'}
              onChange={(e) => updateSetting('form_field_text_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.form_field_text_color || ''}
              onChange={(e) => updateSetting('form_field_text_color', e.target.value)}
              placeholder="#333333"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.form_field_border_color, null))} Border Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.form_field_border_color || '#cccccc'}
              onChange={(e) => updateSetting('form_field_border_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.form_field_border_color || ''}
              onChange={(e) => updateSetting('form_field_border_color', e.target.value)}
              placeholder="#cccccc"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.form_field_focus_border_color, null))} Focus Border Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.form_field_focus_border_color || '#0073aa'}
              onChange={(e) => updateSetting('form_field_focus_border_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.form_field_focus_border_color || ''}
              onChange={(e) => updateSetting('form_field_focus_border_color', e.target.value)}
              placeholder="#0073aa"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.form_field_border_radius, null))} Border Radius
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <div key={side}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize', color: 'var(--muted-foreground)' }}>
                  {side}
                </label>
                <input
                  type="number"
                  value={s.form_field_border_radius?.[side] || ''}
                  onChange={(e) => updateDimension('form_field_border_radius', side, parseFloat(e.target.value))}
                  placeholder="6"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.form_label_color, null))} Label Color
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={s.form_label_color || '#000000'}
              onChange={(e) => updateSetting('form_label_color', e.target.value)}
              style={{ width: '50px', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={s.form_label_color || ''}
              onChange={(e) => updateSetting('form_label_color', e.target.value)}
              placeholder="#000000"
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderImages = () => {
    const s = kit.page_settings;

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Image Configuration</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure default image styles and effects
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.image_border_radius, null))} Border Radius
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <div key={side}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize', color: 'var(--muted-foreground)' }}>
                  {side}
                </label>
                <input
                  type="number"
                  value={s.image_border_radius?.[side] || ''}
                  onChange={(e) => updateDimension('image_border_radius', side, parseFloat(e.target.value))}
                  placeholder="8"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.image_opacity, null))} Opacity
          </h3>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={s.image_opacity?.size || 1}
            onChange={(e) => updateSize('image_opacity', 'size', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {((s.image_opacity?.size || 1) * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s.image_hover_opacity, null))} Hover Opacity
          </h3>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={s.image_hover_opacity?.size || 0.9}
            onChange={(e) => updateSize('image_hover_opacity', 'size', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {((s.image_hover_opacity?.size || 0.9) * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>CSS Filters</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--muted-foreground)' }}>Blur</label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={s.image_css_filters_blur?.size || 0}
              onChange={(e) => updateSize('image_css_filters_blur', 'size', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {s.image_css_filters_blur?.size || 0}px
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--muted-foreground)' }}>Brightness</label>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={s.image_css_filters_brightness?.size || 100}
              onChange={(e) => updateSize('image_css_filters_brightness', 'size', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {s.image_css_filters_brightness?.size || 100}%
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--muted-foreground)' }}>Contrast</label>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={s.image_css_filters_contrast?.size || 100}
              onChange={(e) => updateSize('image_css_filters_contrast', 'size', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {s.image_css_filters_contrast?.size || 100}%
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--muted-foreground)' }}>Saturation</label>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={s.image_css_filters_saturation?.size || 100}
              onChange={(e) => updateSize('image_css_filters_saturation', 'size', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {s.image_css_filters_saturation?.size || 100}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
        {/* Device Mode Switcher */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: deviceMode === mode ? 'var(--primary)' : 'var(--muted)',
                color: deviceMode === mode ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Preview Container */}
        <div style={{
          maxWidth: deviceMode === 'desktop' ? '100%' : deviceMode === 'tablet' ? '768px' : '375px',
          margin: '0 auto',
          padding: '32px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          {/* Typography Hierarchy */}
          <section style={{ marginBottom: '48px' }}>
            <h1 style={getHeadingStyle('h1')}>Heading 1 - Main Page Title</h1>
            <p style={getBodyStyle()}>
              This is the largest heading, typically used once per page for the main title or hero section.
            </p>

            <h2 style={{ ...getHeadingStyle('h2'), marginTop: '32px' }}>Heading 2 - Section Title</h2>
            <p style={getBodyStyle()}>
              Used for major sections of content. Notice the font size, weight, and spacing defined in your style kit.
            </p>

            <h3 style={{ ...getHeadingStyle('h3'), marginTop: '24px' }}>Heading 3 - Subsection</h3>
            <p style={getBodyStyle()}>
              Perfect for subsections within a major section. The hierarchy helps establish visual order.
            </p>

            <h4 style={{ ...getHeadingStyle('h4'), marginTop: '24px' }}>Heading 4 - Minor Section</h4>
            <p style={getBodyStyle()}>
              Smaller heading for less important sections or when nesting content deeper.
            </p>

            <h5 style={{ ...getHeadingStyle('h5'), marginTop: '20px' }}>Heading 5 - Small Section</h5>
            <p style={getBodyStyle()}>Less commonly used, but available for deeply nested content.</p>

            <h6 style={{ ...getHeadingStyle('h6'), marginTop: '20px' }}>Heading 6 - Smallest Heading</h6>
            <p style={getBodyStyle()}>The smallest heading level, rarely used but part of the complete hierarchy.</p>
          </section>

          {/* Body Text & Paragraphs */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Body Text & Paragraphs</h3>
            <p style={getBodyStyle()}>
              This is a paragraph of body text using the configured typography from your style kit.
              It demonstrates the font family, size, weight, line height, and color you've selected.
              Good body text should be easy to read and comfortable for extended reading sessions.
            </p>
            <p style={getBodyStyle()}>
              Multiple paragraphs help show how spacing works between text blocks. The line height
              and letter spacing contribute to overall readability. Your style kit controls all of these aspects
              to ensure consistent typography across your entire website.
            </p>
            <p style={getBodyStyle()}>
              <strong>Bold text</strong> and <em>italic text</em> are also important for emphasis within paragraphs.
              They inherit the base typography but add visual weight or style.
            </p>
          </section>

          {/* Links */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Links & Navigation</h3>
            <p style={getBodyStyle()}>
              Links are crucial for navigation. Here are some examples:{' '}
              <a href="#" style={getLinkStyle()}>Primary Link</a>,{' '}
              <a href="#" style={getLinkStyle()}>Another Link</a>, and{' '}
              <a href="#" style={getLinkStyle()}>One More Link</a>.
            </p>
            <p style={getBodyStyle()}>
              Links can appear <a href="#" style={getLinkStyle()}>inline within text</a> or as standalone elements.
              Your style kit defines their color, hover state, and text decoration.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="#" style={getLinkStyle()}>Home</a>
              <a href="#" style={getLinkStyle()}>About</a>
              <a href="#" style={getLinkStyle()}>Services</a>
              <a href="#" style={getLinkStyle()}>Portfolio</a>
              <a href="#" style={getLinkStyle()}>Contact</a>
            </div>
          </section>

          {/* Buttons */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Buttons & Call-to-Actions</h3>
            <p style={getBodyStyle()}>
              Buttons are essential UI elements for calls-to-action. Your style kit defines their appearance:
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                style={button1Hovered ? { ...getButtonStyle(), ...getButtonHoverStyle() } : getButtonStyle()}
                onMouseEnter={() => setButton1Hovered(true)}
                onMouseLeave={() => setButton1Hovered(false)}
              >
                Primary Button
              </button>
              <button
                style={button2Hovered ? { ...getButtonStyle(), ...getButtonHoverStyle() } : getButtonStyle()}
                onMouseEnter={() => setButton2Hovered(true)}
                onMouseLeave={() => setButton2Hovered(false)}
              >
                Get Started
              </button>
              <button style={getButtonStyle()}>Learn More</button>
            </div>
            <p style={{ ...getBodyStyle(), marginTop: '16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Hover over buttons to see the hover state defined in your style kit.
            </p>
          </section>

          {/* Forms */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Form Elements</h3>
            <p style={getBodyStyle()}>
              Forms are critical for user input. Your style kit controls their appearance and focus states.
            </p>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Text Input */}
              <div>
                <label style={getFormLabelStyle()}>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  style={input1Focused ? { ...getFormInputStyle(), ...getFormInputFocusStyle() } : getFormInputStyle()}
                  onFocus={() => setInput1Focused(true)}
                  onBlur={() => setInput1Focused(false)}
                />
              </div>

              {/* Email Input */}
              <div>
                <label style={getFormLabelStyle()}>Email Address</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  style={input2Focused ? { ...getFormInputStyle(), ...getFormInputFocusStyle() } : getFormInputStyle()}
                  onFocus={() => setInput2Focused(true)}
                  onBlur={() => setInput2Focused(false)}
                />
              </div>

              {/* Textarea */}
              <div>
                <label style={getFormLabelStyle()}>Message</label>
                <textarea
                  placeholder="Enter your message here..."
                  rows={4}
                  style={input3Focused ? { ...getFormInputStyle(), ...getFormInputFocusStyle(), resize: 'vertical' } : { ...getFormInputStyle(), resize: 'vertical' }}
                  onFocus={() => setInput3Focused(true)}
                  onBlur={() => setInput3Focused(false)}
                />
              </div>

              {/* Select Dropdown */}
              <div>
                <label style={getFormLabelStyle()}>Category</label>
                <select style={getFormInputStyle()}>
                  <option>Select an option...</option>
                  <option>General Inquiry</option>
                  <option>Support Request</option>
                  <option>Feedback</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Checkbox & Radio */}
              <div>
                <label style={{ ...getFormLabelStyle(), display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 'auto', margin: 0 }} />
                  <span>I agree to the terms and conditions</span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={getFormLabelStyle()}>Preferred Contact Method</label>
                <label style={{ ...getFormLabelStyle(), display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="contact" style={{ width: 'auto', margin: 0 }} />
                  <span>Email</span>
                </label>
                <label style={{ ...getFormLabelStyle(), display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="contact" style={{ width: 'auto', margin: 0 }} />
                  <span>Phone</span>
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button style={getButtonStyle()}>Submit Form</button>
              </div>
            </div>

            <p style={{ ...getBodyStyle(), marginTop: '16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Click form fields to see focus states defined in your style kit.
            </p>
          </section>

          {/* Images */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Images & Visual Elements</h3>
            <p style={getBodyStyle()}>
              Images can have hover effects, filters, and borders defined in your style kit.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '250px',
                  height: '180px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  ...(image1Hovered ? { ...getImageStyle(), ...getImageHoverStyle() } : getImageStyle()),
                }}
                onMouseEnter={() => setImage1Hovered(true)}
                onMouseLeave={() => setImage1Hovered(false)}
              />
              <div
                style={{
                  width: '250px',
                  height: '180px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '8px',
                  ...(image2Hovered ? { ...getImageStyle(), ...getImageHoverStyle() } : getImageStyle()),
                }}
                onMouseEnter={() => setImage2Hovered(true)}
                onMouseLeave={() => setImage2Hovered(false)}
              />
            </div>
            <p style={{ ...getBodyStyle(), marginTop: '16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Hover over images to see effects like scale, brightness, saturation, and blur defined in your style kit.
            </p>
          </section>

          {/* Color Palette */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Color Palette</h3>
            <p style={getBodyStyle()}>
              These are the system colors defined in your style kit:
            </p>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {kit.page_settings.system_colors.map((color: any, index: number) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    width: '100%',
                    height: '80px',
                    backgroundColor: color.color,
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }} />
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{color.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                    {color.color}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography Specimens */}
          <section>
            <h3 style={getHeadingStyle('h3')}>Typography Specimens</h3>
            <p style={getBodyStyle()}>
              Complete overview of all heading styles and their responsive behavior:
            </p>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => {
                const style = getHeadingStyle(tag as any);
                return (
                  <div key={tag} style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      {tag.toUpperCase()}
                    </div>
                    <div style={style}>The quick brown fox jumps over the lazy dog</div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                      {style.fontFamily?.split(',')[0].replace(/'/g, '')} • {style.fontSize} • {style.fontWeight}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };

  // Refs for scroll-to functionality
  const colorsRef = useRef<HTMLDivElement>(null);
  const globalFontsRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const headingsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const formsRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Table of contents sections
  const tocSections = [
    { id: 'colors', label: 'Colors', ref: colorsRef },
    { id: 'global-fonts', label: 'Global Fonts', ref: globalFontsRef },
    { id: 'typography', label: 'Typography Presets', ref: typographyRef },
    { id: 'headings', label: 'Headings & Body', ref: headingsRef },
    { id: 'buttons', label: 'Buttons', ref: buttonsRef },
    { id: 'forms', label: 'Forms', ref: formsRef },
    { id: 'images', label: 'Images', ref: imagesRef },
    { id: 'layout', label: 'Layout Settings', ref: layoutRef },
  ];

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Style Kit Editor</h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowAIDialog(true)} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              AI Generate
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, backgroundColor: showPreview ? 'var(--accent)' : 'var(--background)', color: showPreview ? 'var(--accent-foreground)' : 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <label style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Import
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button onClick={handleExport} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Dropdown Navigation */}
      {isMobile && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)', flexShrink: 0 }}>
          <select
            onChange={(e) => {
              const section = tocSections.find(s => s.id === e.target.value);
              if (section) scrollToSection(section.ref);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <option value="">Jump to section...</option>
            {tocSections.map(section => (
              <option key={section.id} value={section.id}>{section.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Content Area: Sidebar TOC (Desktop) + Scrollable Content + Preview */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop: Sticky TOC Sidebar - 20% */}
        {!isMobile && (
          <div style={{
            width: '20%',
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <div style={{ padding: '16px 12px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contents
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tocSections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.ref)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Area - 80% (desktop) or 100% (mobile) */}
        <div style={{
          width: isMobile ? '100%' : '80%',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
        }}>
          {showPreview ? (
            /* Full-Width Preview Mode */
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '16px' }}>
              {renderPreview()}
            </div>
          ) : (
            /* Editor-Only Mode (No Preview) */
            <div style={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              padding: '16px',
            }}>
                {/* Colors Section */}
                <div ref={colorsRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Colors</h3>
                  {renderGlobalColors()}
                </div>

                {/* Global Fonts Section */}
                <div ref={globalFontsRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Global Fonts</h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Base font selections used throughout the site</p>
                  {/* TODO: Add global fonts editor */}
                  <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '4px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Global fonts editor coming soon. Use Typography Presets for now.
                  </div>
                </div>

                {/* Typography Presets Section */}
                <div ref={typographyRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Typography Presets</h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Global typography styles (Primary, Secondary, Text, Accent)</p>
                  {renderGlobalTypography()}
                </div>

                {/* Headings & Body Section */}
                <div ref={headingsRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Headings & Body</h3>
                  {renderThemeTypography()}
                </div>

                {/* Buttons Section */}
                <div ref={buttonsRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Buttons</h3>
                  {renderButtons()}
                </div>

                {/* Forms Section */}
                <div ref={formsRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Forms</h3>
                  {renderForms()}
                </div>

                {/* Images Section */}
                <div ref={imagesRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Images</h3>
                  {renderImages()}
                </div>

                {/* Layout Settings Section */}
                <div ref={layoutRef} style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Layout Settings</h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Container width, spacing, and responsive breakpoints</p>
                  {/* TODO: Add layout settings editor */}
                  <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '4px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Layout settings editor coming soon (container width, widget spacing, breakpoints).
                  </div>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Dialog */}
      {showAIDialog && (
        <StyleKitGeneratorDialog
          onGenerate={handleAIGenerate}
          onClose={() => setShowAIDialog(false)}
        />
      )}

      {/* Generation Progress Overlay */}
      {isGenerating && generationProgress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--muted)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 24px',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              {generationProgress}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              This may take 10-60 seconds...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
