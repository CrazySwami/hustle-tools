'use client';

import { useState, useEffect, useRef } from 'react';
import { StyleKitGeneratorDialog } from './StyleKitGeneratorDialog';
import defaultStyleKitTemplate from '@/lib/default-stylekit-template.json';
import { Monitor, Tablet, Smartphone, Menu, RefreshCw, FileDown, FileUp, Download, Upload, Eye, EyeOff, Code, RotateCcw, PanelLeft, ChevronLeft, ChevronRight, Palette, Type as TypeIcon, Layers, Image as ImageIcon, Zap, Copy } from 'lucide-react';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import { stylekitToCSS } from '@/lib/stylekit-to-css';

type FieldStatus = 'missing' | 'default' | 'has-data';
type EditorTab = 'global-colors' | 'global-typography' | 'theme-typography' | 'buttons' | 'forms' | 'images';
type SubTab = 'system' | 'custom';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface StyleKitEditorAdvancedProps {
  onStyleKitChange?: (styleKit: any) => void;
}

export function StyleKitEditorAdvanced({ onStyleKitChange }: StyleKitEditorAdvancedProps) {
  // Remove title and description from template, use rest as page_settings
  const { title: templateTitle, description: templateDesc, ...defaultSettings } = defaultStyleKitTemplate as any;

  const [kit, setKit] = useState<any>({
    title: 'My Style Kit',
    type: 'kit',
    version: '0.4',
    page_settings: defaultSettings,
    content: [],
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('global-colors');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('system');
  const [activeHeading, setActiveHeading] = useState('h1');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalCss, setGlobalCss, pushToWordPress } = useGlobalStylesheet();
  const [isPushingCss, setIsPushingCss] = useState(false);
  const [isPushingStyleKit, setIsPushingStyleKit] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'full'>('split');
  const [secondaryPanel, setSecondaryPanel] = useState<'preview' | 'css'>('preview');
  const [isCssAppliedToPreview, setIsCssAppliedToPreview] = useState(true);

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
  const [preSelectedStage, setPreSelectedStage] = useState<1 | 2 | 3 | 4 | 5 | 6 | undefined>(undefined);
  const [currentGeneratingStage, setCurrentGeneratingStage] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Record<number, boolean>>({1: false, 2: false, 4: false, 5: false, 6: false});
  const toggleStage = (s: number) => setCollapsedStages(prev => ({...prev, [s]: !prev[s]}));

  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [debugSectionName, setDebugSectionName] = useState('');

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!showPreview && previewMode !== 'split') {
      setPreviewMode('split');
    }
  }, [showPreview, previewMode]);

  // Notify parent when kit changes
  useEffect(() => {
    if (onStyleKitChange) {
      console.log('📢 Notifying parent of kit change:', kit);
      onStyleKitChange(kit); // Pass the full kit object, not just page_settings
    }
  }, [kit, onStyleKitChange]);

  useEffect(() => {
    try {
      const baseStyleKit = {
        ...(kit.page_settings || {}),
        title: kit.title,
        description: kit.description,
      };
      const generatedCss = stylekitToCSS(baseStyleKit);
      if (generatedCss && generatedCss.trim().length > 0 && generatedCss !== globalCss) {
        setGlobalCss(generatedCss);
      }
    } catch (error) {
      console.error('Failed to generate CSS from style kit:', error);
    }
  }, [kit, globalCss, setGlobalCss]);

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

  // Helper to update nested typography fields (h1-h6)
  const updateTypographyField = (prefix: string, field: string, value: any) => {
    const typoKey = `${prefix}_typography`;
    const currentTypo = kit.page_settings[typoKey] || {};
    const nestedField = field.replace(`${prefix}_typography_`, 'typography_');
    updateSetting(typoKey, { ...currentTypo, [nestedField]: value });
    // Also keep flat for backwards compatibility
    updateSetting(field, value);
  };

  // Helper to update nested typography size fields
  const updateTypographySize = (prefix: string, field: string, sizeField: string, value: any) => {
    const typoKey = `${prefix}_typography`;
    const currentTypo = kit.page_settings[typoKey] || {};
    const currentSize = currentTypo[`typography_${field}`] || { unit: 'px', size: 0 };
    const nestedField = `typography_${field}`;
    updateSetting(typoKey, { ...currentTypo, [nestedField]: { ...currentSize, [sizeField]: value } });
    // Also keep flat for backwards compatibility
    const flatKey = `${prefix}_typography_${field}`;
    const flatCurrent = kit.page_settings[flatKey] || { unit: 'px', size: 0 };
    updateSetting(flatKey, { ...flatCurrent, [sizeField]: value });
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

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all values to defaults? This cannot be undone.')) {
      const { title: templateTitle, description: templateDesc, ...defaultSettings } = defaultStyleKitTemplate as any;
      setKit({
        title: 'My Style Kit',
        type: 'kit',
        version: '0.4',
        page_settings: defaultSettings,
        content: [],
      });
      alert('✓ Reset to default values successfully!');
    }
  };

  const handleViewCSS = (mode: 'split' | 'full' = 'full') => {
    if (!showPreview) {
      setShowPreview(true);
    }
    setSecondaryPanel('css');
    setPreviewMode(mode);
    setShowToolsMenu(false);
  };

  const handleViewPreview = () => {
    if (!showPreview) {
      setShowPreview(true);
    }
    setSecondaryPanel('preview');
    setPreviewMode('split');
    setShowToolsMenu(false);
  };

  const handleCopyCss = async () => {
    try {
      const css = globalCss && globalCss.trim().length > 0
        ? globalCss
        : '/* No global CSS available. Generate or import CSS to preview it here. */';
      await navigator.clipboard.writeText(css);
      alert('CSS copied to clipboard');
    } catch (error) {
      console.error('Failed to copy CSS:', error);
      alert('Failed to copy CSS');
    }
  };

  const pushStyleKitToPlayground = async (styleKitData: any) => {
    if (typeof window === 'undefined') {
      throw new Error('Window object unavailable. Unable to access Elementor Playground.');
    }

    if ((window as any).setElementorStyleKit) {
      await (window as any).setElementorStyleKit(styleKitData);
      return;
    }

    // Fall back to custom event so legacy listeners (e.g. UnifiedStyleKitSidebar) can handle the push
    console.warn('Elementor Playground API missing. Falling back to stylekit-push event.');
    window.dispatchEvent(new CustomEvent('stylekit-push', { detail: styleKitData }));
  };

  const handlePushStyleKit = async () => {
    try {
      setIsPushingStyleKit(true);

      const styleKitPayload = {
        ...(kit.page_settings || {}),
        title: kit.title,
        description: kit.description,
        content: kit.content || [],
        type: kit.type || 'kit',
        version: kit.version || '0.4',
      };

      await pushStyleKitToPlayground(styleKitPayload);
      alert('Style Kit pushed to Elementor Playground');
    } catch (error: any) {
      console.error('Failed to push style kit:', error);
      alert(error?.message || 'Failed to push style kit');
    } finally {
      setIsPushingStyleKit(false);
      setShowToolsMenu(false);
    }
  };

  const handlePushCss = async () => {
    try {
      setIsPushingCss(true);

      const css = globalCss && globalCss.trim().length > 0
        ? globalCss
        : stylekitToCSS({
            ...(kit.page_settings || {}),
            title: kit.title,
            description: kit.description,
          });

      if (css !== globalCss) {
        setGlobalCss(css);
      }

      await pushToWordPress(css);
      alert('CSS pushed to site (Appearance → Additional CSS) successfully');
    } catch (error: any) {
      console.error('Failed to push CSS:', error);
      alert(`Failed to push CSS: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsPushingCss(false);
      setShowToolsMenu(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('elementor-open-additional-css', {
          detail: {
            source: 'stylekit-editor',
            timestamp: Date.now(),
          },
        }));
      }
    }
  };

  const togglePreviewMode = () => {
    if (!showPreview) return;
    setPreviewMode(prev => prev === 'split' ? 'full' : 'split');
    setShowToolsMenu(false);
  };

  const openDialogForStage = (stage: 1 | 2 | 3 | 4 | 5 | 6) => {
    console.log('🎯 openDialogForStage called with stage:', stage);
    setPreSelectedStage(stage);
    setShowAIDialog(true);
    console.log('📊 Dialog state updated:', { preSelectedStage: stage, showAIDialog: true });
  };

  const getStageName = (stage: 1 | 2 | 3 | 4 | 5 | 6) => {
    const names: Record<number, string> = {
      1: 'Colors',
      2: 'Typography',
      3: 'Typography',
      4: 'Components',
      5: 'Images & Layout',
      6: 'Interactive States',
    };
    return names[stage] || 'Unknown';
  };

  // Helper to check if a stage has non-default content
  const hasStageContent = (stage: 1 | 2 | 3 | 4 | 5 | 6): boolean => {
    const s = kit.page_settings || {};
    switch (stage) {
      case 1:
        return !!(s.system_colors && s.system_colors.length > 0 && s.system_colors.some((c: any) => c.color));
      case 2:
        return !!(s.system_typography && s.system_typography.length > 0 && s.system_typography.some((t: any) => t.typography_font_family));
      case 4:
        return !!(s.button_background_color || s.form_field_background_color);
      case 5:
        return !!(s.image_styles || s.container_width);
      case 6:
        return !!(s.button_hover_background_color || s.form_field_focus_border_color);
      default:
        return false;
    }
  };

  // Helper to render generate button with dynamic states
  const renderGenerateButton = (stage: 1 | 2 | 3 | 4 | 5 | 6, label: string) => {
    const hasContent = hasStageContent(stage);
    const isGeneratingThis = currentGeneratingStage === stage;
    const isGeneratingOther = isGenerating && currentGeneratingStage !== stage;

    let buttonText = '';
    let backgroundColor = '';
    let color = '';
    
    if (isGeneratingThis) {
      buttonText = 'Generating...';
      backgroundColor = 'var(--primary)';
      color = 'var(--primary-foreground)';
    } else if (hasContent) {
      buttonText = `Regenerate ${label}`;
      backgroundColor = '#10b981'; // Green
      color = '#ffffff';
          } else {
      buttonText = `Generate ${label}`;
      backgroundColor = '#1a1a1a'; // Black
      color = '#ffffff';
    }

    return (
      <button
        onClick={() => openDialogForStage(stage)}
        disabled={isGenerating}
        style={{
          padding: '8px 20px',
          fontSize: '13px',
          fontWeight: 600,
          backgroundColor,
          color,
          border: 'none',
          borderRadius: '6px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          opacity: isGeneratingOther ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {isGeneratingThis && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
        {buttonText}
      </button>
    );
  };

  const viewSectionData = (
    section: 'colors' | 'fonts' | 'headings' | 'components' | 'images-layout' | 'interactive'
  ) => {
    const s = kit.page_settings || {};
    let data: any = {};
    let sectionName = '';

    switch (section) {
      case 'colors':
        sectionName = 'Colors';
        data = {
          system_colors: s.system_colors || [],
          custom_colors: s.custom_colors || []
        };
        break;
      case 'fonts':
        sectionName = 'Fonts';
        data = {
          system_typography: s.system_typography || [],
          custom_typography: s.custom_typography || []
        };
        break;
      case 'headings':
        sectionName = 'Headings & Body';
        data = {
          h1_typography: s.h1_typography || {},
          h2_typography: s.h2_typography || {},
          h3_typography: s.h3_typography || {},
          h4_typography: s.h4_typography || {},
          h5_typography: s.h5_typography || {},
          h6_typography: s.h6_typography || {},
          body_typography: s.body_typography || {},
          body_color: s.body_color || '',
          link_normal_color: s.link_normal_color || ''
        };
        break;
      case 'components':
        sectionName = 'Components (Buttons & Forms)';
        data = {
          button_typography: s.button_typography || {},
          button_text_color: s.button_text_color || '',
          button_background_color: s.button_background_color || '',
          button_border_radius: s.button_border_radius || {},
          button_border_width: s.button_border_width || {},
          form_field_typography: s.form_field_typography || {},
          form_field_text_color: s.form_field_text_color || '',
          form_field_background_color: s.form_field_background_color || '',
          form_field_border_color: s.form_field_border_color || '',
          form_field_border_radius: s.form_field_border_radius || {},
          form_field_border_width: s.form_field_border_width || {},
        };
        break;
      case 'images-layout':
        sectionName = 'Images & Layout';
        data = {
          image_styles: s.image_styles || {},
          image_border_radius: s.image_border_radius || {},
          image_opacity: s.image_opacity || {},
          image_hover_opacity: s.image_hover_opacity || {},
          image_css_filters_blur: s.image_css_filters_blur || {},
          image_css_filters_brightness: s.image_css_filters_brightness || {},
          image_css_filters_contrast: s.image_css_filters_contrast || {},
          image_css_filters_saturation: s.image_css_filters_saturation || {},
          container_width: s.container_width || {},
          space_between_widgets: s.space_between_widgets || {},
          viewport_md: s.viewport_md || 768,
          viewport_lg: s.viewport_lg || 1025
        };
        break;
      case 'interactive':
        sectionName = 'Interactive States';
        data = {
          button_padding: s.button_padding || {},
          button_hover_background_color: s.button_hover_background_color || '',
          button_hover_text_color: s.button_hover_text_color || '',
          button_hover_border_color: s.button_hover_border_color || '',
          button_focus_outline_color: s.button_focus_outline_color || '',
          button_focus_outline_width: s.button_focus_outline_width || {},
          form_field_padding: s.form_field_padding || {},
          form_field_focus_border_color: s.form_field_focus_border_color || '',
          form_field_focus_shadow_color: s.form_field_focus_shadow_color || '',
        };
        break;
    }

    setDebugData(data);
    setDebugSectionName(sectionName);
    setShowDebugModal(true);
  };

  const copyDebugData = () => {
    const formatted = JSON.stringify(debugData, null, 2);
    navigator.clipboard.writeText(formatted);
    alert('✅ Data copied to clipboard!');
  };

  const downloadDebugData = () => {
    const formatted = JSON.stringify(debugData, null, 2);
    const dataBlob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stylekit-${debugSectionName.toLowerCase().replace(/\s+/g, '-')}-debug.json`;
    link.click();
    URL.revokeObjectURL(url);
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
    stage?: 1 | 2 | 3 | 4 | 5 | 6;
  }) => {
    console.log('🎯 handleAIGenerate called with config:', {
      model: config.model,
      hasBrandfetchData: !!config.brandfetchData,
      hasStylePreferences: !!config.stylePreferences,
      hasIndustry: !!config.industry,
      imageCount: config.images?.length || 0,
      stage: config.stage
    });

    setIsGenerating(true);
    setCurrentGeneratingStage(config.stage || null);
    setGenerationProgress(config.stage ? `Generating Stage ${config.stage}...` : 'Initializing AI generation...');

    console.log('📊 Generation state updated:', {
      isGenerating: true,
      currentGeneratingStage: config.stage || null,
      generationProgress: config.stage ? `Generating Stage ${config.stage}...` : 'Initializing AI generation...'
    });

    // Auto-close dialog when generation starts (if opened via section button)
    if (config.stage) {
      console.log('🚪 Auto-closing dialog (stage generation)');
      setShowAIDialog(false);
      setPreSelectedStage(undefined);
    }

    try {
      console.log('📡 Fetching /api/generate-stylekit with payload:', {
        model: config.model,
        hasBrandfetchData: !!config.brandfetchData,
        hasStylePreferences: !!config.stylePreferences,
        hasIndustry: !!config.industry,
        imageCount: config.images?.length || 0,
        stage: config.stage
      });

      const response = await fetch('/api/generate-stylekit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          brandfetchData: config.brandfetchData,
          stylePreferences: config.stylePreferences,
          industry: config.industry,
          images: config.images,
          stage: config.stage,
        }),
      });

      console.log('📡 API response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedKit: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.stage && data.message) {
                  // Update progress based on stage
                  console.log(`📊 Stage ${data.stage}: ${data.message}`);
                  setGenerationProgress(`Stage ${data.stage}/6: ${data.message}`);
                }

                if (data.styleKit) {
                  // Final result received
                  console.log('✅ StyleKit data received from API:', data.styleKit);
                  console.log('📋 StyleKit structure:', {
                    hasType: !!data.styleKit.type,
                    hasVersion: !!data.styleKit.version,
                    hasPageSettings: !!data.styleKit.page_settings,
                    systemColorsCount: data.styleKit.page_settings?.system_colors?.length || 0,
                    systemTypographyCount: data.styleKit.page_settings?.system_typography?.length || 0,
                  });
                  generatedKit = data.styleKit;
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }

      if (generatedKit) {
        console.log('🎯 About to call setKit with:', generatedKit);
        setGenerationProgress('Style Kit generated successfully!');
        setKit(generatedKit);
        console.log('✨ setKit called successfully');

        setTimeout(() => {
          setShowAIDialog(false);
          setIsGenerating(false);
          setGenerationProgress('');
          setCurrentGeneratingStage(null);
        }, 1500);
      } else {
        throw new Error('No Style Kit data received from API');
      }

    } catch (error: any) {
      console.error('AI generation error:', error);
      setGenerationProgress(`❌ Error: ${error.message}`);
      setTimeout(() => {
        setIsGenerating(false);
        setCurrentGeneratingStage(null);
      }, 3000);
    }
  };

  // Preview style generators
  const getHeadingStyle = (level: string) => {
    const s = kit.page_settings || {};
    const prefix = level;
    const typo = s[`${prefix}_typography`] || {};
    
    // Get responsive font size based on device mode
    let fontSizeObj;
    if (deviceMode === 'tablet') {
      fontSizeObj = typo.typography_font_size_tablet || s[`${prefix}_typography_font_size_tablet`];
    } else if (deviceMode === 'mobile') {
      fontSizeObj = typo.typography_font_size_mobile || s[`${prefix}_typography_font_size_mobile`];
    } else {
      fontSizeObj = typo.typography_font_size || s[`${prefix}_typography_font_size`];
    }
    
    // Fallback to desktop size if responsive size not set
    if (!fontSizeObj || !fontSizeObj.size) {
      fontSizeObj = typo.typography_font_size || s[`${prefix}_typography_font_size`] || { size: 48, unit: 'px' };
    }
    
    return {
      fontFamily: typo.typography_font_family || (s[`${prefix}_typography`]?.typography_font_family || s[`${prefix}_typography_font_family`]) || 'Inter',
      fontWeight: typo.typography_font_weight || (s[`${prefix}_typography`]?.typography_font_weight || s[`${prefix}_typography_font_weight`]) || '700',
      fontSize: `${fontSizeObj.size || 48}${fontSizeObj.unit || 'px'}`,
      lineHeight: typo.typography_line_height?.size || (s[`${prefix}_typography`]?.typography_line_height || s[`${prefix}_typography_line_height`])?.size || 1.2,
      letterSpacing: `${typo.typography_letter_spacing?.size || (s[`${prefix}_typography`]?.typography_letter_spacing || s[`${prefix}_typography_letter_spacing`])?.size || 0}${typo.typography_letter_spacing?.unit || (s[`${prefix}_typography`]?.typography_letter_spacing || s[`${prefix}_typography_letter_spacing`])?.unit || 'px'}`,
      textTransform: typo.typography_text_transform || (s[`${prefix}_typography`]?.typography_text_transform || s[`${prefix}_typography_text_transform`]) || 'none',
      color: typo.typography_text_color || (s[`${prefix}_typography`]?.typography_text_color || s[`${prefix}_color`]) || '#000000',
    };
  };

  const getBodyStyle = () => {
    const s = kit.page_settings || {};
    const bodyTypo = s.body_typography || {};
    
    // Get responsive font size based on device mode
    let fontSizeObj;
    if (deviceMode === 'tablet') {
      fontSizeObj = bodyTypo.typography_font_size_tablet || s.body_typography_font_size_tablet;
    } else if (deviceMode === 'mobile') {
      fontSizeObj = bodyTypo.typography_font_size_mobile || s.body_typography_font_size_mobile;
    } else {
      fontSizeObj = bodyTypo.typography_font_size || s.body_typography_font_size;
    }
    
    // Fallback to desktop size if responsive size not set
    if (!fontSizeObj || !fontSizeObj.size) {
      fontSizeObj = bodyTypo.typography_font_size || s.body_typography_font_size || { size: 16, unit: 'px' };
    }
    
    return {
      fontFamily: bodyTypo.typography_font_family || s.body_typography_font_family || 'Inter',
      fontWeight: bodyTypo.typography_font_weight || s.body_typography_font_weight || '400',
      fontSize: `${fontSizeObj.size || 16}${fontSizeObj.unit || 'px'}`,
      lineHeight: bodyTypo.typography_line_height?.size || s.body_typography_line_height?.size || 1.7,
      letterSpacing: `${bodyTypo.typography_letter_spacing?.size || s.body_typography_letter_spacing?.size || 0}${bodyTypo.typography_letter_spacing?.unit || s.body_typography_letter_spacing?.unit || 'px'}`,
      color: s.body_color || '#333333',
    };
  };

  const getLinkStyle = () => {
    const s = kit.page_settings || {};
    return {
      color: s.link_normal_color || '#0073aa',
      textDecoration: s.link_typography_text_decoration || 'none',
    };
  };

  const getButtonStyle = () => {
    const s = kit.page_settings || {};
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
    const s = kit.page_settings || {};
    return {
      color: s.button_hover_color || '#ffffff',
      backgroundColor: s.button_hover_background_color || '#005a87',
      borderColor: s.button_hover_border_color || '#005a87',
    };
  };

  const getFormLabelStyle = () => {
    const s = kit.page_settings || {};
    return {
      color: s.form_label_color || '#000000',
      fontWeight: s.form_label_typography_font_weight || '500',
      fontSize: `${s.form_label_typography_font_size?.size || 14}${s.form_label_typography_font_size?.unit || 'px'}`,
    };
  };

  const getFormInputStyle = () => {
    const s = kit.page_settings || {};
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
    const s = kit.page_settings || {};
    return {
      borderColor: s.form_field_focus_border_color || '#0073aa',
      outline: 'none',
    };
  };

  const getImageStyle = () => {
    const s = kit.page_settings || {};
    const filters = `blur(${s.image_css_filters_blur?.size || 0}px) brightness(${s.image_css_filters_brightness?.size || 100}%) contrast(${s.image_css_filters_contrast?.size || 100}%) saturate(${s.image_css_filters_saturation?.size || 100}%)`;

    return {
      borderRadius: `${s.image_border_radius?.top || 8}px`,
      filter: filters,
      opacity: s.image_opacity?.size || 1,
      transition: `all ${s.image_hover_transition_duration?.size || 300}ms ease`,
    };
  };

  const getImageHoverStyle = () => {
    const s = kit.page_settings || {};
    return {
      opacity: s.image_hover_opacity?.size || 0.9,
    };
  };

  // Render functions
  const renderGlobalColors = () => {
    const s = kit.page_settings || {};

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
    const s = kit.page_settings || {};

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
    const s = kit.page_settings || {};

    // Helper to render settings for a single heading
    const renderHeadingSection = (prefix: string) => {
      const headingStyle = getHeadingStyle(prefix as any);

      return (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px'
        }}>
          {/* Preview */}
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              {prefix.toUpperCase()} PREVIEW
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDeviceMode(mode)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: deviceMode === mode ? 600 : 400,
                      backgroundColor: deviceMode === mode ? 'var(--primary)' : 'var(--muted)',
                      color: deviceMode === mode ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div style={headingStyle}>
              The quick brown fox jumps over the lazy dog
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
              {headingStyle.fontFamily?.split(',')[0].replace(/'/g, '')} • {headingStyle.fontSize} ({deviceMode}) • {headingStyle.fontWeight}
            </div>
          </div>

          {/* Font Family */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_font_family || s[`${prefix}_typography_font_family`]), null))} Font Family
            </label>
            <input
              type="text"
              value={(s[`${prefix}_typography`]?.typography_font_family || s[`${prefix}_typography_font_family`]) || ''}
              onChange={(e) => updateTypographyField(prefix, `${prefix}_typography_font_family`, e.target.value)}
              placeholder="e.g., Roboto, Inter, Arial"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {/* Font Weight */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_font_weight || s[`${prefix}_typography_font_weight`]), null))} Weight
              </label>
              <select
                value={(s[`${prefix}_typography`]?.typography_font_weight || s[`${prefix}_typography_font_weight`]) || '400'}
                onChange={(e) => updateTypographyField(prefix, `${prefix}_typography_font_weight`, e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
                <option value="900">900 - Black</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_font_size || s[`${prefix}_typography_font_size`]), null))} Size
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  value={(s[`${prefix}_typography`]?.typography_font_size || s[`${prefix}_typography_font_size`])?.size || ''}
                  onChange={(e) => updateTypographySize(prefix, "font_size", "size", parseFloat(e.target.value))}
                  placeholder="16"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={(s[`${prefix}_typography`]?.typography_font_size || s[`${prefix}_typography_font_size`])?.unit || 'px'}
                  onChange={(e) => updateTypographySize(prefix, "font_size", "unit", e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="px">px</option>
                  <option value="em">em</option>
                  <option value="rem">rem</option>
                </select>
              </div>
            </div>
          </div>

          {/* Responsive Font Sizes */}
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--muted)/30', borderRadius: '8px', border: '1px dashed var(--border)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>📱 Responsive Sizes</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Tablet Size */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_font_size_tablet || s[`${prefix}_typography_font_size_tablet`]), null))} Tablet Size
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    value={(s[`${prefix}_typography`]?.typography_font_size_tablet?.size || s[`${prefix}_typography_font_size_tablet`]?.size) || ''}
                    onChange={(e) => updateTypographySize(prefix, "font_size_tablet", "size", parseFloat(e.target.value))}
                    placeholder="40"
                    style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  <select
                    value={(s[`${prefix}_typography`]?.typography_font_size_tablet?.unit || s[`${prefix}_typography_font_size_tablet`]?.unit) || 'px'}
                    onChange={(e) => updateTypographySize(prefix, "font_size_tablet", "unit", e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    <option value="px">px</option>
                    <option value="em">em</option>
                    <option value="rem">rem</option>
                  </select>
                </div>
              </div>

              {/* Mobile Size */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_font_size_mobile || s[`${prefix}_typography_font_size_mobile`]), null))} Mobile Size
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    value={(s[`${prefix}_typography`]?.typography_font_size_mobile?.size || s[`${prefix}_typography_font_size_mobile`]?.size) || ''}
                    onChange={(e) => updateTypographySize(prefix, "font_size_mobile", "size", parseFloat(e.target.value))}
                    placeholder="32"
                    style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  <select
                    value={(s[`${prefix}_typography`]?.typography_font_size_mobile?.unit || s[`${prefix}_typography_font_size_mobile`]?.unit) || 'px'}
                    onChange={(e) => updateTypographySize(prefix, "font_size_mobile", "unit", e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    <option value="px">px</option>
                    <option value="em">em</option>
                    <option value="rem">rem</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Line Height */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_line_height || s[`${prefix}_typography_line_height`]), null))} Line Height
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                step="0.1"
                value={(s[`${prefix}_typography`]?.typography_line_height || s[`${prefix}_typography_line_height`])?.size || ''}
                onChange={(e) => updateTypographySize(prefix, "line_height", "size", parseFloat(e.target.value))}
                placeholder="1.5"
                style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
              <select
                value={(s[`${prefix}_typography`]?.typography_line_height || s[`${prefix}_typography_line_height`])?.unit || 'em'}
                onChange={(e) => updateTypographySize(prefix, "line_height", "unit", e.target.value)}
                style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="em">em</option>
                <option value="px">px</option>
                <option value="">default</option>
              </select>
            </div>
          </div>

          {/* Letter Spacing */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_letter_spacing || s[`${prefix}_typography_letter_spacing`]), null))} Letter Spacing
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                step="0.1"
                value={(s[`${prefix}_typography`]?.typography_letter_spacing || s[`${prefix}_typography_letter_spacing`])?.size || ''}
                onChange={(e) => updateTypographySize(prefix, "letter_spacing", "size", parseFloat(e.target.value))}
                placeholder="0"
                style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
              <select
                value={(s[`${prefix}_typography`]?.typography_letter_spacing || s[`${prefix}_typography_letter_spacing`])?.unit || 'px'}
                onChange={(e) => updateTypographySize(prefix, "letter_spacing", "unit", e.target.value)}
                style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="px">px</option>
                <option value="em">em</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Text Transform */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_text_transform || s[`${prefix}_typography_text_transform`]), null))} Text Transform
              </label>
              <select
                value={(s[`${prefix}_typography`]?.typography_text_transform || s[`${prefix}_typography_text_transform`]) || ''}
                onChange={(e) => updateTypographyField(prefix, `${prefix}_typography_text_transform`, e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="">Default</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>

            {/* Text Color */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus((s[`${prefix}_typography`]?.typography_text_color || s[`${prefix}_color`]), null))} Text Color
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="color"
                  value={(s[`${prefix}_typography`]?.typography_text_color || s[`${prefix}_color`]) || '#000000'}
                  onChange={(e) => updateTypographyField(prefix, `${prefix}_color`, e.target.value)}
                  style={{ width: '40px', height: '36px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={(s[`${prefix}_typography`]?.typography_text_color || s[`${prefix}_color`]) || ''}
                  onChange={(e) => updateTypographyField(prefix, `${prefix}_color`, e.target.value)}
                  placeholder="#000000"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>Theme Typography</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure H1-H6 heading styles with live previews
          </p>
        </div>

        {/* Body Typography */}
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px'
        }}>
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
              BODY TEXT PREVIEW
            </div>
            <div style={getBodyStyle()}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is how body text will appear throughout your website.
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus(s.body_typography?.typography_font_family, null))} Font Family
            </label>
            <input
              type="text"
              value={s.body_typography?.typography_font_family || ''}
              onChange={(e) => updateSetting('body_typography', { ...s.body_typography, typography_font_family: e.target.value })}
              placeholder="e.g., Roboto, Inter, Arial"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Weight</label>
              <select
                value={s.body_typography?.typography_font_weight || '400'}
                onChange={(e) => updateSetting('body_typography', { ...s.body_typography, typography_font_weight: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Size</label>
              <input
                type="number"
                value={s.body_typography?.typography_font_size?.size || ''}
                onChange={(e) => updateSetting('body_typography', {
                  ...s.body_typography,
                  typography_font_size: { unit: 'px', size: parseFloat(e.target.value), sizes: [] }
                })}
                placeholder="16"
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Color</label>
              <input
                type="color"
                value={s.body_color || '#202020'}
                onChange={(e) => updateSetting('body_color', e.target.value)}
                style={{ width: '100%', height: '32px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.body_typography?.typography_line_height, null))} Line Height
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={s.body_typography?.typography_line_height?.size || ''}
                  onChange={(e) => updateSetting('body_typography', {
                    ...s.body_typography,
                    typography_line_height: { size: parseFloat(e.target.value), unit: s.body_typography?.typography_line_height?.unit || 'em' }
                  })}
                  placeholder="1.5"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.body_typography?.typography_line_height?.unit || 'em'}
                  onChange={(e) => updateSetting('body_typography', {
                    ...s.body_typography,
                    typography_line_height: { ...s.body_typography?.typography_line_height, unit: e.target.value }
                  })}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="em">em</option>
                  <option value="px">px</option>
                  <option value="">default</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.body_typography?.typography_letter_spacing, null))} Letter Spacing
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={s.body_typography?.typography_letter_spacing?.size || ''}
                  onChange={(e) => updateSetting('body_typography', {
                    ...s.body_typography,
                    typography_letter_spacing: { size: parseFloat(e.target.value), unit: s.body_typography?.typography_letter_spacing?.unit || 'px' }
                  })}
                  placeholder="0"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.body_typography?.typography_letter_spacing?.unit || 'px'}
                  onChange={(e) => updateSetting('body_typography', {
                    ...s.body_typography,
                    typography_letter_spacing: { ...s.body_typography?.typography_letter_spacing, unit: e.target.value }
                  })}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="px">px</option>
                  <option value="em">em</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus(s.body_typography?.typography_text_transform, null))} Text Transform
            </label>
            <select
              value={s.body_typography?.typography_text_transform || ''}
              onChange={(e) => updateSetting('body_typography', {
                ...s.body_typography,
                typography_text_transform: e.target.value
              })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="">Default</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>
        </div>

        {/* All Headings */}
        {headings.map((heading) => (
          <div key={heading}>
            {renderHeadingSection(heading)}
          </div>
        ))}
      </div>
    );
  };

  const renderButtons = () => {
    const s = kit.page_settings || {};

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Button Configuration</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure default button styles for your theme
          </p>
        </div>

        {/* INLINE PREVIEW */}
        <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: 'var(--card)', border: '2px solid var(--primary)', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--primary)' }}>
            Live Preview
          </h4>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <button style={getButtonStyle()}>
                Normal State
              </button>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Normal</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <button style={{ ...getButtonStyle(), ...getButtonHoverStyle() }}>
                Hover State
              </button>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Hover</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <button style={{
                ...getButtonStyle(),
                outline: `${s.button_focus_outline_width?.size || 2}${s.button_focus_outline_width?.unit || 'px'} solid ${s.button_focus_outline_color || '#0066CC'}`,
                outlineOffset: '2px'
              }}>
                Focus State
              </button>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Focus</span>
            </div>
          </div>
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

        {/* Button Typography Section */}
        <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'var(--muted)/20', border: '2px dashed var(--border)', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Button Typography</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus(s.button_typography_font_family, null))} Font Family
            </label>
            <input
              type="text"
              value={s.button_typography_font_family || ''}
              onChange={(e) => updateSetting('button_typography_font_family', e.target.value)}
              placeholder="e.g., Inter, Roboto, Arial"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.button_typography_font_weight, null))} Font Weight
              </label>
              <select
                value={s.button_typography_font_weight || '600'}
                onChange={(e) => updateSetting('button_typography_font_weight', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.button_typography_font_size, null))} Font Size
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  value={s.button_typography_font_size?.size || ''}
                  onChange={(e) => updateSize('button_typography_font_size', 'size', parseFloat(e.target.value))}
                  placeholder="16"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.button_typography_font_size?.unit || 'px'}
                  onChange={(e) => updateSize('button_typography_font_size', 'unit', e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="px">px</option>
                  <option value="em">em</option>
                  <option value="rem">rem</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.button_typography_line_height, null))} Line Height
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={s.button_typography_line_height?.size || ''}
                  onChange={(e) => updateSize('button_typography_line_height', 'size', parseFloat(e.target.value))}
                  placeholder="1.5"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.button_typography_line_height?.unit || 'px'}
                  onChange={(e) => updateSize('button_typography_line_height', 'unit', e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="px">px</option>
                  <option value="em">em</option>
                  <option value="">default</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.button_typography_letter_spacing, null))} Letter Spacing
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={s.button_typography_letter_spacing?.size || ''}
                  onChange={(e) => updateSize('button_typography_letter_spacing', 'size', parseFloat(e.target.value))}
                  placeholder="0"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.button_typography_letter_spacing?.unit || 'px'}
                  onChange={(e) => updateSize('button_typography_letter_spacing', 'unit', e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="px">px</option>
                  <option value="em">em</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus(s.button_typography_text_transform, null))} Text Transform
            </label>
            <select
              value={s.button_typography_text_transform || 'none'}
              onChange={(e) => updateSetting('button_typography_text_transform', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="none">None</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderForms = () => {
    const s = kit.page_settings || {};

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Form Field Configuration</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure default form field styles
          </p>
        </div>

        {/* INLINE PREVIEW */}
        <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: 'var(--card)', border: '2px solid var(--primary)', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--primary)' }}>
            Live Preview
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ ...getFormLabelStyle(), display: 'block', marginBottom: '8px' }}>Normal State</label>
              <input
                type="text"
                placeholder="Normal input field..."
                style={getFormInputStyle()}
              />
            </div>
            <div>
              <label style={{ ...getFormLabelStyle(), display: 'block', marginBottom: '8px' }}>Focus State</label>
              <input
                type="text"
                placeholder="Focused input field..."
                style={{
                  ...getFormInputStyle(),
                  ...getFormInputFocusStyle(),
                  borderColor: s.form_field_focus_border_color || '#0066CC',
                  boxShadow: `0 0 0 3px ${s.form_field_focus_shadow_color || 'rgba(0, 102, 204, 0.1)'}`,
                }}
              />
            </div>
            <div>
              <label style={{ ...getFormLabelStyle(), display: 'block', marginBottom: '8px' }}>Textarea</label>
              <textarea
                placeholder="Enter your message..."
                rows={3}
                style={{ ...getFormInputStyle(), resize: 'vertical' }}
              />
            </div>
          </div>
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

        {/* Form Label Typography Section */}
        <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'var(--muted)/20', border: '2px dashed var(--border)', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Form Label Typography</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus(s.form_label_typography_font_family, null))} Font Family
            </label>
            <input
              type="text"
              value={s.form_label_typography_font_family || ''}
              onChange={(e) => updateSetting('form_label_typography_font_family', e.target.value)}
              placeholder="e.g., Inter, Roboto, Arial"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.form_label_typography_font_weight, null))} Font Weight
              </label>
              <select
                value={s.form_label_typography_font_weight || '500'}
                onChange={(e) => updateSetting('form_label_typography_font_weight', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.form_label_typography_font_size, null))} Font Size
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  value={s.form_label_typography_font_size?.size || ''}
                  onChange={(e) => updateSize('form_label_typography_font_size', 'size', parseFloat(e.target.value))}
                  placeholder="14"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.form_label_typography_font_size?.unit || 'px'}
                  onChange={(e) => updateSize('form_label_typography_font_size', 'unit', e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="px">px</option>
                  <option value="em">em</option>
                  <option value="rem">rem</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.form_label_typography_line_height, null))} Line Height
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={s.form_label_typography_line_height?.size || ''}
                  onChange={(e) => updateSize('form_label_typography_line_height', 'size', parseFloat(e.target.value))}
                  placeholder="1.5"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.form_label_typography_line_height?.unit || 'em'}
                  onChange={(e) => updateSize('form_label_typography_line_height', 'unit', e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="em">em</option>
                  <option value="px">px</option>
                  <option value="">default</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                {getStatusIcon(getFieldStatus(s.form_label_typography_letter_spacing, null))} Letter Spacing
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={s.form_label_typography_letter_spacing?.size || ''}
                  onChange={(e) => updateSize('form_label_typography_letter_spacing', 'size', parseFloat(e.target.value))}
                  placeholder="0"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <select
                  value={s.form_label_typography_letter_spacing?.unit || 'px'}
                  onChange={(e) => updateSize('form_label_typography_letter_spacing', 'unit', e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="px">px</option>
                  <option value="em">em</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
              {getStatusIcon(getFieldStatus(s.form_label_typography_text_transform, null))} Text Transform
            </label>
            <select
              value={s.form_label_typography_text_transform || ''}
              onChange={(e) => updateSetting('form_label_typography_text_transform', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="">Default</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderImages = () => {
    const s = kit.page_settings || {};

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Image Configuration</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure default image styles and effects
          </p>
        </div>

        {/* COMPREHENSIVE PREVIEW */}
        <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: 'var(--card)', border: '2px solid var(--primary)', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>
            👁️ Live Preview - All Border Radius & Image Effects
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {/* Images */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>🖼️ Images</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Square</div>
                  <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', ...getImageStyle(), borderRadius: '0px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Rounded</div>
                  <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', ...getImageStyle() }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Circle</div>
                  <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', ...getImageStyle(), borderRadius: '50%', margin: '0 auto' }} />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>🔘 Buttons</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Sharp</div>
                  <button style={{ ...getButtonStyle(), borderRadius: '0px', width: '100%' }}>Sharp Button</button>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Rounded</div>
                  <button style={{ ...getButtonStyle(), width: '100%' }}>Rounded Button</button>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Pill</div>
                  <button style={{ ...getButtonStyle(), borderRadius: '999px', width: '100%' }}>Pill Button</button>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>📦 Cards</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: `${s.image_border_radius?.top || 8}px`, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Card Title</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Card with border radius</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Rounded Card</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>More rounded corners</div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>📝 Form Fields</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Input</div>
                  <input type="text" placeholder="Enter text..." style={getFormInputStyle()} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Rounded Input</div>
                  <input type="text" placeholder="Rounded..." style={{ ...getFormInputStyle(), borderRadius: '12px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Textarea</div>
                  <textarea placeholder="Multi-line..." rows={3} style={{ ...getFormInputStyle(), resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* CSS Filters */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>🎨 CSS Filters</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Normal</div>
                  <div style={{ width: '100%', height: '80px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', ...getImageStyle(), filter: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>With Filters</div>
                  <div style={{ width: '100%', height: '80px', background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', ...getImageStyle() }} />
                </div>
              </div>
            </div>
          </div>
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

  const renderLayout = () => {
    const s = kit.page_settings || {};
    
    return (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Layout Configuration</h3>
        
        {/* Container Width */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Container Width</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={s.container_width?.size || 1200}
              onChange={(e) => updateSize('container_width', 'size', parseFloat(e.target.value) || 0)}
              style={{ flex: 1, padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
            <select
              value={s.container_width?.unit || 'px'}
              onChange={(e) => updateSize('container_width', 'unit', e.target.value)}
              style={{ padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="px">px</option>
              <option value="%">%</option>
              <option value="rem">rem</option>
              <option value="em">em</option>
            </select>
          </div>
        </div>

        {/* Space Between Widgets */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Space Between Widgets</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={s.space_between_widgets?.size || 20}
              onChange={(e) => updateSize('space_between_widgets', 'size', parseFloat(e.target.value) || 0)}
              style={{ flex: 1, padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
            <select
              value={s.space_between_widgets?.unit || 'px'}
              onChange={(e) => updateSize('space_between_widgets', 'unit', e.target.value)}
              style={{ padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="px">px</option>
              <option value="rem">rem</option>
              <option value="em">em</option>
            </select>
          </div>
        </div>

        {/* Viewport Breakpoints */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Tablet Breakpoint (viewport_md)</label>
          <input
            type="number"
            value={s.viewport_md || 768}
            onChange={(e) => updateSetting('viewport_md', parseFloat(e.target.value) || 768)}
            style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Desktop Breakpoint (viewport_lg)</label>
          <input
            type="number"
            value={s.viewport_lg || 1025}
            onChange={(e) => updateSetting('viewport_lg', parseFloat(e.target.value) || 1025)}
            style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>
      </div>
    );
  };

  const renderInteractiveStates = () => {
    const s = kit.page_settings || {};
    
    return (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Button Interactive States</h3>
        
        {/* Button Padding */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Button Padding</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <div key={side}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize', color: 'var(--muted-foreground)' }}>
                  {side}
                </label>
                <input
                  type="number"
                  value={s.button_padding?.[side] || ''}
                  onChange={(e) => updateDimension('button_padding', side, parseFloat(e.target.value) || 0)}
                  placeholder="12"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Button Hover Colors */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Button Hover Background Color</label>
          <input
            type="color"
            value={s.button_hover_background_color || '#000000'}
            onChange={(e) => updateSetting('button_hover_background_color', e.target.value)}
            style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={s.button_hover_background_color || ''}
            onChange={(e) => updateSetting('button_hover_background_color', e.target.value)}
            placeholder="#000000"
            style={{ width: '100%', marginTop: '8px', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Button Hover Text Color</label>
          <input
            type="color"
            value={s.button_hover_text_color || '#ffffff'}
            onChange={(e) => updateSetting('button_hover_text_color', e.target.value)}
            style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={s.button_hover_text_color || ''}
            onChange={(e) => updateSetting('button_hover_text_color', e.target.value)}
            placeholder="#ffffff"
            style={{ width: '100%', marginTop: '8px', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Button Focus Outline Color</label>
          <input
            type="color"
            value={s.button_focus_outline_color || '#000000'}
            onChange={(e) => updateSetting('button_focus_outline_color', e.target.value)}
            style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={s.button_focus_outline_color || ''}
            onChange={(e) => updateSetting('button_focus_outline_color', e.target.value)}
            placeholder="#000000"
            style={{ width: '100%', marginTop: '8px', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>

        <h3 style={{ margin: '32px 0 16px', fontSize: '16px', fontWeight: 600 }}>Form Interactive States</h3>
        
        {/* Form Field Padding */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Form Field Padding</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <div key={side}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize', color: 'var(--muted-foreground)' }}>
                  {side}
                </label>
                <input
                  type="number"
                  value={s.form_field_padding?.[side] || ''}
                  onChange={(e) => updateDimension('form_field_padding', side, parseFloat(e.target.value) || 0)}
                  placeholder="12"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Form Field Focus Border Color</label>
          <input
            type="color"
            value={s.form_field_focus_border_color || '#000000'}
            onChange={(e) => updateSetting('form_field_focus_border_color', e.target.value)}
            style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={s.form_field_focus_border_color || ''}
            onChange={(e) => updateSetting('form_field_focus_border_color', e.target.value)}
            placeholder="#000000"
            style={{ width: '100%', marginTop: '8px', padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
        {isCssAppliedToPreview && globalCss && globalCss.trim().length > 0 && (
          <style>{globalCss}</style>
        )}
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
              Images can have hover effects, filters, borders, and captions defined in your style kit.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ width: '250px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: kit.page_settings?.image_styles?.image_box_shadow || '0 4px 12px rgba(0,0,0,0.08)',
                    objectFit: kit.page_settings?.image_styles?.image_object_fit || 'cover',
                    ...(image1Hovered ? { ...getImageStyle(), ...getImageHoverStyle() } : getImageStyle()),
                  }}
                  onMouseEnter={() => setImage1Hovered(true)}
                  onMouseLeave={() => setImage1Hovered(false)}
                />
                {kit.page_settings?.image_styles?.image_caption_typography && (
                  <div style={{
                    marginTop: '8px',
                    fontFamily: kit.page_settings.image_styles.image_caption_typography.typography_font_family || 'inherit',
                    fontSize: kit.page_settings.image_styles.image_caption_typography.typography_font_size?.size + (kit.page_settings.image_styles.image_caption_typography.typography_font_size?.unit || 'px'),
                    fontWeight: kit.page_settings.image_styles.image_caption_typography.typography_font_weight || 400,
                    lineHeight: kit.page_settings.image_styles.image_caption_typography.typography_line_height?.size || 1.4,
                    color: kit.page_settings.image_styles.image_caption_color || '#333',
                    textAlign: 'center',
                  }}>
                    Beautiful gradient image with caption styling
                  </div>
                )}
              </div>
              <div style={{ width: '250px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    boxShadow: kit.page_settings?.image_styles?.image_box_shadow || '0 4px 12px rgba(0,0,0,0.08)',
                    objectFit: kit.page_settings?.image_styles?.image_object_fit || 'cover',
                    ...(image2Hovered ? { ...getImageStyle(), ...getImageHoverStyle() } : getImageStyle()),
                  }}
                  onMouseEnter={() => setImage2Hovered(true)}
                  onMouseLeave={() => setImage2Hovered(false)}
                />
                {kit.page_settings?.image_styles?.image_caption_typography && (
                  <div style={{
                    marginTop: '8px',
                    fontFamily: kit.page_settings.image_styles.image_caption_typography.typography_font_family || 'inherit',
                    fontSize: kit.page_settings.image_styles.image_caption_typography.typography_font_size?.size + (kit.page_settings.image_styles.image_caption_typography.typography_font_size?.unit || 'px'),
                    fontWeight: kit.page_settings.image_styles.image_caption_typography.typography_font_weight || 400,
                    lineHeight: kit.page_settings.image_styles.image_caption_typography.typography_line_height?.size || 1.4,
                    color: kit.page_settings.image_styles.image_caption_color || '#333',
                    textAlign: 'center',
                  }}>
                    Another image with consistent caption style
                  </div>
                )}
              </div>
            </div>
            <p style={{ ...getBodyStyle(), marginTop: '16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Hover over images to see effects. Captions use the image_caption_typography settings.
            </p>
          </section>

          {/* Button States (Hover & Focus) */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Button States - Hover & Focus</h3>
            <p style={getBodyStyle()}>
              Buttons have normal, hover, and focus states all styled by your style kit:
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <button style={{
                  ...getButtonStyle(),
                  padding: kit.page_settings?.button_padding ?
                    `${kit.page_settings.button_padding.top}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.right}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.bottom}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.left}${kit.page_settings.button_padding.unit || 'px'}`
                    : '12px 24px',
                }}>
                  Normal State
                </button>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Normal</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <button style={{
                  ...getButtonStyle(),
                  ...getButtonHoverStyle(),
                  padding: kit.page_settings?.button_padding ?
                    `${kit.page_settings.button_padding.top}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.right}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.bottom}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.left}${kit.page_settings.button_padding.unit || 'px'}`
                    : '12px 24px',
                }}>
                  Hover State
                </button>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Hover</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <button style={{
                  ...getButtonStyle(),
                  outline: `${kit.page_settings?.button_focus_outline_width?.size || 2}${kit.page_settings?.button_focus_outline_width?.unit || 'px'} solid ${kit.page_settings?.button_focus_outline_color || '#0066CC'}`,
                  outlineOffset: '2px',
                  padding: kit.page_settings?.button_padding ?
                    `${kit.page_settings.button_padding.top}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.right}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.bottom}${kit.page_settings.button_padding.unit || 'px'} ${kit.page_settings.button_padding.left}${kit.page_settings.button_padding.unit || 'px'}`
                    : '12px 24px',
                }}>
                  Focus State
                </button>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Focus</span>
              </div>
            </div>
            <p style={{ ...getBodyStyle(), marginTop: '16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              All three states use colors and dimensions from your style kit (button_hover_background_color, button_focus_outline_color, etc.)
            </p>
          </section>

          {/* Form Field States */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Form Field States - Normal & Focus</h3>
            <p style={getBodyStyle()}>
              Form fields have normal and focus states with borders and shadows:
            </p>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ ...getFormLabelStyle(), display: 'block', marginBottom: '8px' }}>Normal State</label>
                <input
                  type="text"
                  placeholder="Normal input field..."
                  style={{
                    ...getFormInputStyle(),
                    padding: kit.page_settings?.form_field_padding ?
                      `${kit.page_settings.form_field_padding.top}${kit.page_settings.form_field_padding.unit || 'px'} ${kit.page_settings.form_field_padding.right}${kit.page_settings.form_field_padding.unit || 'px'}`
                      : '10px 12px',
                  }}
                />
              </div>
              <div>
                <label style={{ ...getFormLabelStyle(), display: 'block', marginBottom: '8px' }}>Focus State</label>
                <input
                  type="text"
                  placeholder="Focused input field..."
                  style={{
                    ...getFormInputStyle(),
                    ...getFormInputFocusStyle(),
                    borderColor: kit.page_settings?.form_field_focus_border_color || '#0066CC',
                    boxShadow: `0 0 0 3px ${kit.page_settings?.form_field_focus_shadow_color || 'rgba(0, 102, 204, 0.1)'}`,
                    padding: kit.page_settings?.form_field_padding ?
                      `${kit.page_settings.form_field_padding.top}${kit.page_settings.form_field_padding.unit || 'px'} ${kit.page_settings.form_field_padding.right}${kit.page_settings.form_field_padding.unit || 'px'}`
                      : '10px 12px',
                  }}
                />
              </div>
            </div>
            <p style={{ ...getBodyStyle(), marginTop: '16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Focus state uses form_field_focus_border_color and form_field_focus_shadow_color from your style kit
            </p>
          </section>

          {/* Layout Settings */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>Layout & Spacing Settings</h3>
            <p style={getBodyStyle()}>
              Global layout settings that control container widths and widget spacing:
            </p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                  CONTAINER WIDTH
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)' }}>
                  {kit.page_settings?.container_width?.size || 1200}{kit.page_settings?.container_width?.unit || 'px'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                  Maximum width for centered content containers
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                  WIDGET SPACING
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Column Gap</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {kit.page_settings?.space_between_widgets?.column || 20}{kit.page_settings?.space_between_widgets?.unit || 'px'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Row Gap</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {kit.page_settings?.space_between_widgets?.row || 20}{kit.page_settings?.space_between_widgets?.unit || 'px'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                  RESPONSIVE BREAKPOINTS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Tablet Breakpoint</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {kit.page_settings?.viewport_md || 768}px
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Desktop Breakpoint</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {kit.page_settings?.viewport_lg || 1025}px
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* System Color Palette */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>System Color Palette</h3>
            <p style={getBodyStyle()}>
              These are the 4 system colors defined in your style kit:
            </p>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {(kit.page_settings?.system_colors || []).map((color: any, index: number) => (
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

          {/* Custom Colors */}
          {kit.page_settings?.custom_colors && kit.page_settings.custom_colors.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h3 style={getHeadingStyle('h3')}>Custom Colors</h3>
              <p style={getBodyStyle()}>
                Additional custom colors from your brand palette ({kit.page_settings.custom_colors.length} colors):
              </p>
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                {kit.page_settings.custom_colors.map((color: any, index: number) => (
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
          )}

          {/* System Typography Presets */}
          <section style={{ marginBottom: '48px' }}>
            <h3 style={getHeadingStyle('h3')}>System Typography Presets</h3>
            <p style={getBodyStyle()}>
              The 4 system typography presets (Primary, Secondary, Text, Accent) that can be applied to any element:
            </p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(kit.page_settings?.system_typography || []).map((typo: any, index: number) => {
                const style = {
                  fontFamily: typo.typography_font_family || 'inherit',
                  fontSize: typo.typography_font_size?.size + (typo.typography_font_size?.unit || 'px'),
                  fontWeight: typo.typography_font_weight || 400,
                  lineHeight: typo.typography_line_height?.size || 1.5,
                  letterSpacing: typo.typography_letter_spacing?.size ? `${typo.typography_letter_spacing.size}${typo.typography_letter_spacing.unit || 'px'}` : 'normal',
                  textTransform: typo.typography_text_transform || 'none',
                  fontStyle: typo.typography_font_style || 'normal',
                  textDecoration: typo.typography_text_decoration || 'none',
                };

                return (
                  <div key={index} style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      {typo.title}
                    </div>
                    <div style={style as any}>
                      The quick brown fox jumps over the lazy dog - TYPOGRAPHY PREVIEW
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                      {typo.typography_font_family} • {typo.typography_font_size?.size}{typo.typography_font_size?.unit} • {typo.typography_font_weight}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Custom Typography Presets */}
          {kit.page_settings?.custom_typography && kit.page_settings.custom_typography.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h3 style={getHeadingStyle('h3')}>Custom Typography Presets</h3>
              <p style={getBodyStyle()}>
                Custom typography styles you can apply throughout your site ({kit.page_settings.custom_typography.length} presets):
              </p>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {kit.page_settings.custom_typography.map((typo: any, index: number) => {
                  const style = {
                    fontFamily: typo.typography_font_family || 'inherit',
                    fontSize: typo.typography_font_size?.size + (typo.typography_font_size?.unit || 'px'),
                    fontWeight: typo.typography_font_weight || 400,
                    lineHeight: typo.typography_line_height?.size || 1.5,
                    letterSpacing: typo.typography_letter_spacing?.size ? `${typo.typography_letter_spacing.size}${typo.typography_letter_spacing.unit || 'px'}` : 'normal',
                    textTransform: typo.typography_text_transform || 'none',
                  };

                  return (
                    <div key={index} style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        {typo.title}
                      </div>
                      <div style={style as any}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                        {typo.typography_font_family} • {typo.typography_font_size?.size}{typo.typography_font_size?.unit} • {typo.typography_font_weight}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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

  const renderCssPanel = () => {
    const cssContent = globalCss && globalCss.trim().length > 0
      ? globalCss
      : '/* No global CSS available. Modify the style kit or import CSS to see it here. */';

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Global CSS</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Generated directly from your style kit configuration
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsCssAppliedToPreview(prev => !prev)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: isCssAppliedToPreview ? 'var(--primary)' : 'var(--muted)',
                color: isCssAppliedToPreview ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: isCssAppliedToPreview ? 'none' : '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
              }}
            >
              {isCssAppliedToPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {isCssAppliedToPreview ? 'Hide in Preview' : 'Apply to Preview'}
            </button>
            <button
              onClick={handleCopyCss}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--muted)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
              }}
            >
              <Copy size={14} />
              Copy CSS
            </button>
            <button
              onClick={handlePushCss}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
              }}
            >
              {isPushingCss && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              <Upload size={14} />
              {isPushingCss ? 'Pushing CSS...' : 'Push CSS and View'}
            </button>
          </div>
        </div>
        <textarea
          value={cssContent}
          readOnly
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: 'var(--muted)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: 1.6,
            resize: 'vertical',
            minHeight: '260px',
          }}
        />
      </div>
    );
  };

  const renderSecondaryPanel = () => {
    if (secondaryPanel === 'css') {
      return renderCssPanel();
    }
    return renderPreview();
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

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', color: 'var(--foreground)', position: 'relative' }}>
      {/* Header with Menus and Breakpoint Switcher */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          {/* Left: Title */}
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Style Kit Editor</h2>

          {/* Center: Breakpoint Switcher Icons */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => setDeviceMode('desktop')}
              style={{
                padding: '6px 10px',
                backgroundColor: deviceMode === 'desktop' ? 'var(--primary)' : 'transparent',
                color: deviceMode === 'desktop' ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Desktop"
            >
              <Monitor size={18} />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              style={{
                padding: '6px 10px',
                backgroundColor: deviceMode === 'tablet' ? 'var(--primary)' : 'transparent',
                color: deviceMode === 'tablet' ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Tablet"
            >
              <Tablet size={18} />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              style={{
                padding: '6px 10px',
                backgroundColor: deviceMode === 'mobile' ? 'var(--primary)' : 'transparent',
                color: deviceMode === 'mobile' ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Mobile"
            >
              <Smartphone size={18} />
            </button>
          </div>

          {/* Right: Menus */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* AI Generate Menu */}
            <button
              onClick={() => setShowAIDialog(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Menu size={14} />
              AI Generate
            </button>
            
            {/* File Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: showFileMenu ? 'var(--accent)' : 'transparent',
                  color: showFileMenu ? 'var(--accent-foreground)' : 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileDown size={14} />
                File
              </button>
              {showFileMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '160px',
                    padding: '4px',
                  }}
                  onMouseLeave={() => setShowFileMenu(false)}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileUp size={14} />
                    Import JSON
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
                  <button
                    onClick={handleExport}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Download size={14} />
              Download JSON
            </button>
                </div>
              )}
            </div>
            
            {/* Tools Menu */}
            <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: showToolsMenu ? 'var(--accent)' : 'transparent',
                  color: showToolsMenu ? 'var(--accent-foreground)' : 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Menu size={14} />
                Tools
            </button>
              {showToolsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '180px',
                    padding: '4px',
                  }}
                  onMouseLeave={() => setShowToolsMenu(false)}
                >
            <button
              onClick={() => {
                if (showPreview) {
                  setShowPreview(false);
                  setSecondaryPanel('preview');
                  setShowToolsMenu(false);
                } else {
                  handleViewPreview();
                }
              }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Eye size={14} />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
                    onClick={() => {
                      if (!showPreview) return;
                      togglePreviewMode();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: showPreview ? 'pointer' : 'not-allowed',
                      borderRadius: '4px',
                      textAlign: 'left',
                      opacity: showPreview ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => {
                      if (showPreview) e.currentTarget.style.backgroundColor = 'var(--muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Monitor size={14} />
                    {previewMode === 'split'
                      ? (secondaryPanel === 'css' ? 'Full Width CSS' : 'Full Width Preview')
                      : (secondaryPanel === 'css' ? 'Show Editor & CSS' : 'Show Editor & Preview')}
                  </button>
                  <button
                    onClick={() => handleViewCSS()}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Code size={14} />
                    View CSS
                  </button>
                  <button
                    onClick={handlePushStyleKit}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {isPushingStyleKit && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              <Upload size={14} />
                    {isPushingStyleKit ? 'Pushing Style Kit...' : 'Push Style Kit'}
            </button>
            <button
                    onClick={handlePushCss}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {isPushingCss && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    <Upload size={14} />
                    {isPushingCss ? 'Pushing CSS...' : 'Push CSS and View'}
            </button>
                  <button
                    onClick={handleResetToDefaults}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'left',
                      color: 'var(--destructive)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <RotateCcw size={14} />
              Reset to Defaults
            </button>
                </div>
              )}
            </div>
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
        {/* Desktop: Collapsible TOC Sidebar */}
        {!isMobile && (
          <>
            {sidebarVisible && (
          <div style={{
            width: '20%',
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            overflowY: 'auto',
            flexShrink: 0,
                transition: 'width 0.2s ease',
          }}>
            <div style={{ padding: '16px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contents
              </h3>
                    <button
                      onClick={() => setSidebarVisible(false)}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--muted-foreground)',
                      }}
                      title="Hide Sidebar"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>
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
            {!sidebarVisible && (
              <button
                onClick={() => setSidebarVisible(true)}
                style={{
                  width: '32px',
                  borderRight: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted-foreground)',
                  flexShrink: 0,
                }}
                title="Show Sidebar"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </>
        )}

        {/* Scrollable Content Area - Adjusts based on sidebar visibility */}
        <div style={{
          width: isMobile ? '100%' : sidebarVisible ? '80%' : '100%',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}>
          {showPreview ? (
            previewMode === 'split' ? (
              /* Split View: Left Panel (Editable Fields) + Right Panel (Preview) */
              <>
              <div style={{
                width: '50%',
                height: '100%',
                overflowY: 'auto',
                padding: '12px',
                borderRight: '1px solid var(--border)',
              }}>
                {/* ===== STAGE 1: COLORS ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(1)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Palette size={18} />
                        <span>Stage 1: Colors</span>
                        <span>{collapsedStages[1] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        System colors and custom color palette
                      </p>
            </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                        onClick={() => viewSectionData('colors')}
                    style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                          borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                    }}
                  >
                        🔍 View Data
                  </button>
                      {renderGenerateButton(1, 'Colors')}
                    </div>
                  </div>
                  {!collapsedStages[1] && (
                    <div ref={colorsRef}>
                      {renderGlobalColors()}
                    </div>
                  )}
                </div>

                {/* ===== STAGES 2 & 3: TYPOGRAPHY ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(2)}>
                  <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TypeIcon size={18} />
                        <span>Stages 2 & 3: Typography System</span>
                        <span>{collapsedStages[2] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Global fonts, typography presets, and all heading styles
                    </p>
                  </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('fonts')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(2, 'Typography')}
                    </div>
                  </div>
                  {!collapsedStages[2] && (
                    <div>
                      {renderGlobalTypography()}
                      {renderThemeTypography()}
                    </div>
                  )}
                </div>

                {/* ===== STAGE 4: COMPONENTS ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(4)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Layers size={18} />
                        <span>Stage 4: Components</span>
                        <span>{collapsedStages[4] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Buttons, forms, and interactive elements
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('components')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                      fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(4, 'Components')}
                    </div>
                  </div>
                  {!collapsedStages[4] && (
                    <div>
                      {renderButtons()}
                      {renderForms()}
                  </div>
                  )}
                  </div>

                {/* ===== STAGE 5: IMAGES & LAYOUT ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #d0d0d0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(5)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ImageIcon size={18} />
                        <span>Stage 5: Images & Layout</span>
                        <span>{collapsedStages[5] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Image styles and layout configuration settings
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('images-layout')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(5, 'Images & Layout')}
                    </div>
                  </div>
                  {!collapsedStages[5] && (
                    <div>
                      <div ref={imagesRef} style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>🖼️ Images</h3>
                        {renderImages()}
                      </div>
                      <div ref={layoutRef}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>📐 Layout Settings</h3>
                        {renderLayout()}
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== STAGE 6: INTERACTIVE STATES ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(6)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={18} />
                        <span>Stage 6: Interactive States</span>
                        <span>{collapsedStages[6] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Button hover/focus and form focus states
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('interactive')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(6, 'Interactive States')}
                  </div>
                  </div>
                  {!collapsedStages[6] && (
                    <div>
                      {renderInteractiveStates()}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                width: '50%',
                height: '100%',
                overflowY: 'auto',
                padding: '16px',
              }}>
                {renderSecondaryPanel()}
              </div>
              </>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  overflowY: 'auto',
                  padding: '16px',
                }}
              >
                {renderSecondaryPanel()}
              </div>
            )
          ) : (
            /* Editor-Only Mode (No Preview) */
            <div style={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              padding: '16px',
            }}>
                {/* ===== STAGE 1: COLORS ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(1)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Palette size={18} />
                        <span>Stage 1: Colors</span>
                        <span>{collapsedStages[1] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        System colors and custom color palette
                      </p>
                </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('colors')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(1, 'Colors')}
                    </div>
                  </div>

                  {!collapsedStages[1] && (
                  <div ref={colorsRef}>
                  {renderGlobalColors()}
                  </div>
                  )}
                </div>

                {/* ===== STAGES 2 & 3: TYPOGRAPHY ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(2)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TypeIcon size={18} />
                        <span>Stages 2 & 3: Typography System</span>
                        <span>{collapsedStages[2] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Global fonts, typography presets, and all heading styles
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => viewSectionData('fonts')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(2, 'Typography')}
                    </div>
                  </div>

                  {!collapsedStages[2] && (
                  <div>
                  {/* Global Fonts Subsection */}
                  <div ref={globalFontsRef} style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>📚 Global Font Families</h3>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Base font selections (Primary & Secondary) used throughout the site</p>
                    <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '6px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      Global fonts editor coming soon. These are set during Stage 2 AI generation.
                    </div>
                  </div>

                  {/* Typography Presets Subsection */}
                  <div ref={typographyRef} style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>🎨 Typography Presets</h3>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Global typography styles (Primary, Secondary, Text, Accent)</p>
                    {renderGlobalTypography()}
                  </div>

                  {/* Headings & Body Subsection */}
                  <div ref={headingsRef}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>📝 Stage 3: Headings & Body Text</h3>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>H1-H6 heading styles and body typography (generated with Stage 2)</p>
                  {renderThemeTypography()}
                  </div>
                  </div>
                  )}
                </div>

                {/* ===== STAGE 4: COMPONENTS ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(4)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Layers size={18} />
                        <span>Stage 4: Components</span>
                        <span>{collapsedStages[4] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Buttons, forms, and interactive elements
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('components')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(4, 'Components')}
                    </div>
                  </div>

                  {!collapsedStages[4] && (
                  <div>
                  {/* Buttons Subsection */}
                  <div ref={buttonsRef} style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>🔘 Buttons</h3>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Default button styles, typography, colors, and hover states</p>
                  {renderButtons()}
                </div>

                  {/* Forms Subsection */}
                  <div ref={formsRef}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>📝 Form Fields</h3>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Form field styles, labels, borders, and focus states</p>
                    {renderForms()}
                    </div>
                  </div>
                  )}
                </div>

                {/* ===== STAGE 5: IMAGES & LAYOUT ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #d0d0d0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(5)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ImageIcon size={18} />
                        <span>Stage 5: Images & Layout</span>
                        <span>{collapsedStages[5] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Image styles and layout configuration settings
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('images-layout')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(5, 'Images & Layout')}
                    </div>
                  </div>
                  {!collapsedStages[5] && (
                    <div>
                      <div ref={imagesRef} style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>🖼️ Images</h3>
                  {renderImages()}
                      </div>
                      <div ref={layoutRef}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>📐 Layout Settings</h3>
                        {renderLayout()}
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== STAGE 6: INTERACTIVE STATES ===== */}
                <div style={{ marginBottom: '48px', padding: '16px', backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleStage(6)}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={18} />
                        <span>Stage 6: Interactive States</span>
                        <span>{collapsedStages[6] ? "▶" : "▼"}</span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Button hover/focus and form focus states
                      </p>
                  </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => viewSectionData('interactive')}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        🔍 View Data
                      </button>
                      {renderGenerateButton(6, 'Interactive States')}
                    </div>
                  </div>
                  {!collapsedStages[6] && (
                    <div>
                      {renderInteractiveStates()}
                    </div>
                  )}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Dialog */}
      {showAIDialog && (
        <StyleKitGeneratorDialog
          onGenerate={handleAIGenerate}
          onClose={() => {
            setShowAIDialog(false);
            setPreSelectedStage(undefined);
          }}
          preSelectedStage={preSelectedStage}
        />
      )}

      {/* Debug Data Modal */}
      {showDebugModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {debugSectionName} - Generated Data
              </h3>
              <button
                onClick={() => setShowDebugModal(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* JSON Data Display */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: 'var(--muted)',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {JSON.stringify(debugData, null, 2)}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={copyDebugData}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: 'var(--muted)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={downloadDebugData}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                💾 Download JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Progress Indicator */}
      {isGenerating && generationProgress && (
        currentGeneratingStage ? (
          // In-page progress bar for individual stage generation (scoped to StyleKit panel)
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            zIndex: 100,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--primary-foreground)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {generationProgress}
            </span>
          </div>
        ) : (
          // Full overlay for complete generation
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
        )
      )}
    </div>
  );
}
