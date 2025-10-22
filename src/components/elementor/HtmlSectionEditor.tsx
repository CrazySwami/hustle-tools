'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Section,
  createSection,
  sectionSettingsToCSS,
  getAnimationCSS,
  getAnimationClassName,
  validateSection
} from '@/lib/section-schema';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';

interface HtmlSectionEditorProps {
  initialSection?: Section;
  onSectionChange?: (section: Section) => void;
  activeStyleKitCss?: string;
  streamedHtml?: string;
  streamedCss?: string;
  streamedJs?: string;
  activeCodeTab?: 'html' | 'css' | 'js';
  onCodeTabChange?: (tab: 'html' | 'css' | 'js') => void;
  onSwitchToVisualEditor?: () => void;
}

export function HtmlSectionEditor({
  initialSection,
  onSectionChange,
  activeStyleKitCss = '',
  streamedHtml,
  streamedCss,
  streamedJs,
  activeCodeTab: externalActiveCodeTab,
  onCodeTabChange,
  onSwitchToVisualEditor
}: HtmlSectionEditorProps) {
  const [section, setSection] = useState<Section>(initialSection || createSection());
  const [internalActiveCodeTab, setInternalActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { globalCss } = useGlobalStylesheet();

  // Track if this is a loaded section (has initial content)
  const hasInitialContent = !!(initialSection?.html || initialSection?.css || initialSection?.js);

  // Debug: Log when component mounts/remounts
  useEffect(() => {
    console.log('🔄 HtmlSectionEditor mounted with initialSection:', {
      name: initialSection?.name || 'New Section',
      id: initialSection?.id || 'default',
      htmlLength: initialSection?.html?.length || 0,
      cssLength: initialSection?.css?.length || 0,
      jsLength: initialSection?.js?.length || 0
    });
    console.log('🔄 Section state after mount:', {
      name: section.name,
      id: section.id,
      htmlLength: section.html?.length || 0,
      cssLength: section.css?.length || 0,
      jsLength: section.js?.length || 0
    });
  }, []);

  // Use external activeCodeTab if provided, otherwise use internal
  const activeCodeTab = externalActiveCodeTab ?? internalActiveCodeTab;

  const handleCodeTabChange = (tab: 'html' | 'css' | 'js') => {
    if (onCodeTabChange) {
      onCodeTabChange(tab);
    } else {
      setInternalActiveCodeTab(tab);
    }
  };

  // Update section and notify parent
  const updateSection = (updates: Partial<Section>) => {
    const updatedSection = {
      ...section,
      ...updates,
      updatedAt: Date.now()
    };
    setSection(updatedSection);
    onSectionChange?.(updatedSection);
  };

  // Update section when streamed content changes
  useEffect(() => {
    // Don't apply streaming if we loaded a section from library (has initial content)
    if (hasInitialContent) {
      console.log('⏭️ Skipping streamed updates - section loaded from library');
      return;
    }

    // Only apply streamed updates if there's actual content (not just empty strings)
    const updates: Partial<Section> = {};
    if (streamedHtml && streamedHtml.length > 0) updates.html = streamedHtml;
    if (streamedCss && streamedCss.length > 0) updates.css = streamedCss;
    if (streamedJs && streamedJs.length > 0) updates.js = streamedJs;

    // Only update if we have actual content to apply
    if (Object.keys(updates).length > 0) {
      console.log('📥 Applying streamed updates:', Object.keys(updates));
      setSection(prev => ({
        ...prev,
        ...updates,
        updatedAt: Date.now()
      }));
    }
  }, [streamedHtml, streamedCss, streamedJs, hasInitialContent]);

  // Generate preview HTML with all styles and scripts
  const generatePreviewHTML = (): string => {
    const inlineStyles = sectionSettingsToCSS(section.settings);
    const animationClass = getAnimationClassName(section.settings.animation);
    const customClasses = section.settings.advanced.customClasses.join(' ');
    const allClasses = [animationClass, customClasses].filter(Boolean).join(' ');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Active Style Kit CSS */
    ${activeStyleKitCss || globalCss}

    /* Section-specific CSS */
    ${section.css}

    /* Animation CSS */
    ${getAnimationCSS(section.settings.animation)}

    /* Reset */
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; }
  </style>
</head>
<body>
  <div class="section-wrapper ${allClasses}" style="${inlineStyles}">
    ${section.html}
  </div>

  <script>
    ${section.js}
  </script>
</body>
</html>
`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Top Bar */}
      <div style={{
        padding: '12px 16px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={section.name}
          onChange={(e) => updateSection({ name: e.target.value })}
          style={{
            fontSize: '16px',
            fontWeight: 600,
            border: '1px solid transparent',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'transparent',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.border = '1px solid #3b82f6';
            e.target.style.background = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.border = '1px solid transparent';
            e.target.style.background = 'transparent';
          }}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{
              padding: '6px 12px',
              background: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            💾 Save to Library
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '6px 12px',
              background: showSettings ? '#3b82f6' : '#e5e7eb',
              color: showSettings ? '#ffffff' : '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {showSettings ? '✓' : ''} Settings
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '6px 12px',
              background: showPreview ? '#3b82f6' : '#e5e7eb',
              color: showPreview ? '#ffffff' : '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {showPreview ? '✓' : ''} Preview
          </button>

          {onSwitchToVisualEditor && (
            <button
              onClick={() => {
                // Save current changes before switching
                if (onSectionChange) {
                  onSectionChange(section);
                }
                onSwitchToVisualEditor();
              }}
              style={{
                padding: '6px 12px',
                background: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              👁️ Visual Editor
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Code Editor Panel */}
        <div style={{
          width: showPreview ? '50%' : '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: showPreview ? '1px solid #e5e7eb' : 'none',
          transition: 'width 0.3s ease'
        }}>
          {/* Settings Panel (Collapsible) */}
          {showSettings && (
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '16px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                Section Settings
              </h3>

              {/* Layout Settings */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Layout
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  {/* Padding */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Padding</label>
                    <input
                      type="number"
                      placeholder="All sides"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateSection({
                          settings: {
                            ...section.settings,
                            layout: {
                              ...section.settings.layout,
                              padding: {
                                top: val,
                                right: val,
                                bottom: val,
                                left: val,
                                unit: 'px'
                              }
                            }
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>

                  {/* Margin */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Margin</label>
                    <input
                      type="number"
                      placeholder="All sides"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateSection({
                          settings: {
                            ...section.settings,
                            layout: {
                              ...section.settings.layout,
                              margin: {
                                top: val,
                                right: val,
                                bottom: val,
                                left: val,
                                unit: 'px'
                              }
                            }
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Background Settings */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Background
                </h4>

                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <select
                    value={section.settings.background.type}
                    onChange={(e) => {
                      updateSection({
                        settings: {
                          ...section.settings,
                          background: {
                            ...section.settings.background,
                            type: e.target.value as any
                          }
                        }
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="none">None</option>
                    <option value="color">Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image</option>
                  </select>

                  {section.settings.background.type === 'color' && (
                    <input
                      type="color"
                      value={section.settings.background.color || '#ffffff'}
                      onChange={(e) => {
                        updateSection({
                          settings: {
                            ...section.settings,
                            background: {
                              ...section.settings.background,
                              color: e.target.value
                            }
                          }
                        });
                      }}
                      style={{
                        width: '40px',
                        height: '28px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Border Settings */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Border
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Width</label>
                    <input
                      type="number"
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateSection({
                          settings: {
                            ...section.settings,
                            border: {
                              ...section.settings.border,
                              width: {
                                top: val,
                                right: val,
                                bottom: val,
                                left: val,
                                unit: 'px'
                              }
                            }
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Color</label>
                    <input
                      type="color"
                      value={section.settings.border.color}
                      onChange={(e) => {
                        updateSection({
                          settings: {
                            ...section.settings,
                            border: {
                              ...section.settings.border,
                              color: e.target.value
                            }
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        height: '28px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Radius</label>
                    <input
                      type="number"
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateSection({
                          settings: {
                            ...section.settings,
                            border: {
                              ...section.settings.border,
                              radius: {
                                topLeft: val,
                                topRight: val,
                                bottomRight: val,
                                bottomLeft: val,
                                unit: 'px'
                              }
                            }
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Animation Settings */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Animation
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <select
                    value={section.settings.animation.type}
                    onChange={(e) => {
                      updateSection({
                        settings: {
                          ...section.settings,
                          animation: {
                            ...section.settings.animation,
                            type: e.target.value as any
                          }
                        }
                      });
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="none">None</option>
                    <option value="fadeIn">Fade In</option>
                    <option value="fadeInUp">Fade In Up</option>
                    <option value="fadeInDown">Fade In Down</option>
                    <option value="slideInLeft">Slide In Left</option>
                    <option value="slideInRight">Slide In Right</option>
                    <option value="zoomIn">Zoom In</option>
                    <option value="bounce">Bounce</option>
                  </select>

                  <select
                    value={section.settings.animation.duration}
                    onChange={(e) => {
                      updateSection({
                        settings: {
                          ...section.settings,
                          animation: {
                            ...section.settings.animation,
                            duration: e.target.value as any
                          }
                        }
                      });
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="fast">Fast</option>
                    <option value="normal">Normal</option>
                    <option value="slow">Slow</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Code Editor Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '8px 12px',
            background: '#2d2d2d',
            borderBottom: '1px solid #3e3e3e'
          }}>
            {(['html', 'css', 'js'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleCodeTabChange(tab)}
                style={{
                  padding: '6px 16px',
                  background: activeCodeTab === tab ? '#1e1e1e' : 'transparent',
                  color: activeCodeTab === tab ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: activeCodeTab === tab ? 500 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Code Editor */}
          <div style={{ flex: 1, overflow: 'hidden', background: '#1e1e1e' }}>
            {/* Debug: Log editor value */}
            {console.log(`📝 Editor rendering - ${activeCodeTab}:`, section[activeCodeTab]?.substring(0, 100) || '(empty)')}
            <Editor
              height="100%"
              language={activeCodeTab === 'js' ? 'javascript' : activeCodeTab}
              theme="vs-dark"
              value={section[activeCodeTab]}
              onChange={(value) => updateSection({ [activeCodeTab]: value || '' })}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff'
          }}>
            <div style={{
              padding: '8px 12px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Live Preview
            </div>

            <iframe
              srcDoc={generatePreviewHTML()}
              style={{
                flex: 1,
                border: 'none',
                width: '100%'
              }}
              sandbox="allow-scripts"
              title="Section Preview"
            />
          </div>
        )}
      </div>

      {/* Save to Library Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Save Section
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Section Name
              </label>
              <input
                type="text"
                value={section.name}
                onChange={(e) => updateSection({ name: e.target.value })}
                placeholder="e.g., Pricing Table, Hero Section"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: 500 }}>
                Choose where to save this section:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={async () => {
                    try {
                      if (!section.name.trim()) {
                        alert('Please enter a section name');
                        return;
                      }

                      // Check if playground is running
                      if (!(window as any).playgroundClient) {
                        alert('WordPress Playground is not running. Please launch it first from the WordPress Playground tab.');
                        return;
                      }

                      const saveToLibrary = (window as any).saveHtmlSectionToLibrary;
                      if (!saveToLibrary) {
                        alert('WordPress Playground functions not loaded yet. Please wait a moment and try again.');
                        return;
                      }

                      const result = await saveToLibrary({
                        name: section.name,
                        html: section.html,
                        css: section.css,
                        js: section.js,
                        globalCss: globalCss
                      });

                      if (result.success) {
                        const debug = result.debug || {};
                        const debugInfo = `\n\nDebug Info:\n- HTML: ${debug.html_length || 0} chars\n- CSS: ${debug.css_length || 0} chars\n- JS: ${debug.js_length || 0} chars\n- Combined: ${debug.combined_length || 0} chars\n- Has <style>: ${debug.has_style_tag ? 'Yes' : 'No'}\n- Has <script>: ${debug.has_script_tag ? 'Yes' : 'No'}`;
                        alert(`✅ Section "${section.name}" saved to Elementor template library!\n\nTemplate ID: ${result.templateId}\n\nYou can now access it in WordPress > Templates > Saved Templates.${debugInfo}`);
                        setShowSaveDialog(false);
                      }
                    } catch (error: any) {
                      alert(`❌ Failed to save to template library:\n\n${error.message}`);
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    background: '#8b5cf6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    textAlign: 'left'
                  }}
                >
                  📚 Save to Elementor Template Library
                </button>

                <button
                  onClick={async () => {
                    try {
                      if (!section.name.trim()) {
                        alert('Please enter a section name');
                        return;
                      }

                      // Check if playground is running
                      if (!(window as any).playgroundClient) {
                        alert('WordPress Playground is not running. Please launch it first from the WordPress Playground tab.');
                        return;
                      }

                      const importToPage = (window as any).importHtmlSectionToPage;
                      if (!importToPage) {
                        alert('WordPress Playground functions not loaded yet. Please wait a moment and try again.');
                        return;
                      }

                      const result = await importToPage({
                        name: section.name,
                        html: section.html,
                        css: section.css,
                        js: section.js,
                        globalCss: globalCss
                      });

                      if (result.success) {
                        alert(`✅ Section "${section.name}" imported to preview page!\n\nPage ID: ${result.pageId}\n\nThe page is now open in WordPress Playground.`);
                        setShowSaveDialog(false);
                      }
                    } catch (error: any) {
                      alert(`❌ Failed to import to page:\n\n${error.message}`);
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    textAlign: 'left'
                  }}
                >
                  🌐 Import to WordPress Page Preview
                </button>

                <button
                  onClick={() => {
                    try {
                      if (!section.name.trim()) {
                        alert('Please enter a section name');
                        return;
                      }

                      // Load existing sections from localStorage
                      const saved = localStorage.getItem('html-sections');
                      const sections = saved ? JSON.parse(saved) : [];

                      // Add current section
                      sections.push({
                        ...section,
                        id: `section-${Date.now()}`,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                      });

                      // Save to localStorage
                      localStorage.setItem('html-sections', JSON.stringify(sections));

                      // Dispatch storage event for other components
                      window.dispatchEvent(new Event('storage'));

                      alert(`✅ Section "${section.name}" saved to local library!\n\nYou can access it in the Section Library tab.`);
                      setShowSaveDialog(false);
                    } catch (error: any) {
                      alert(`❌ Failed to save to local library:\n\n${error.message}`);
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    textAlign: 'left'
                  }}
                >
                  💾 Save to Local Section Library
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
