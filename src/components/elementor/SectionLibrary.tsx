'use client';

import { useState, useEffect } from 'react';
import { Section, createSection, StyleKit, createStyleKit } from '@/lib/section-schema';
import { HtmlSectionEditor } from './HtmlSectionEditor';
import { PageSplitter } from './PageSplitter';
import { StyleKitViewer } from './StyleKitViewer';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import { sectionsToElementorTemplate, generateSectionsPreviewHTML } from '@/lib/section-to-elementor';

interface SectionLibraryProps {
  onExportToPlayground?: (sections: Section[]) => void;
  onLoadInEditor?: (section: Section) => void;
}

export function SectionLibrary({ onExportToPlayground, onLoadInEditor }: SectionLibraryProps) {
  const { globalCss } = useGlobalStylesheet();
  const [sections, setSections] = useState<Section[]>([]);
  const [styleKits, setStyleKits] = useState<StyleKit[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedStyleKitId, setSelectedStyleKitId] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // percentage
  const [viewMode, setViewMode] = useState<'library' | 'split-page'>('library');
  const [libraryTab, setLibraryTab] = useState<'sections' | 'style-kits'>('sections');

  // Load sections from localStorage on mount
  useEffect(() => {
    const loadSections = () => {
      const saved = localStorage.getItem('html-sections');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSections(parsed);
        } catch (err) {
          console.error('Failed to load sections:', err);
        }
      }
    };

    loadSections();

    // Listen for storage events (from PageSplitter or other tabs)
    const handleStorageChange = () => {
      loadSections();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load style kits from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('style-kits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStyleKits(parsed);
      } catch (err) {
        console.error('Failed to load style kits:', err);
      }
    }
  }, []);

  // Initialize default WordPress style kit on mount
  useEffect(() => {
    if (globalCss && styleKits.length === 0) {
      const defaultKit = createStyleKit({
        name: 'WordPress Default',
        css: globalCss,
        isDefault: true,
        isActive: true
      });
      setStyleKits([defaultKit]);
    }
  }, [globalCss, styleKits.length]);

  // Save sections to localStorage whenever they change
  useEffect(() => {
    if (sections.length > 0) {
      localStorage.setItem('html-sections', JSON.stringify(sections));
    }
  }, [sections]);

  // Save style kits to localStorage whenever they change
  useEffect(() => {
    if (styleKits.length > 0) {
      localStorage.setItem('style-kits', JSON.stringify(styleKits));
    }
  }, [styleKits]);

  // Get selected section and style kit
  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedStyleKit = styleKits.find(sk => sk.id === selectedStyleKitId);
  const activeStyleKit = styleKits.find(sk => sk.isActive);

  // CRUD Operations
  const createNewSection = () => {
    const newSection = createSection({
      name: `Section ${sections.length + 1}`
    });
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, ...updates, updatedAt: Date.now() } : s))
    );
  };

  const duplicateSection = (sectionId: string) => {
    const original = sections.find(s => s.id === sectionId);
    if (!original) return;

    const duplicate = createSection({
      ...original,
      id: undefined, // Will generate new ID
      name: `${original.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined
    });

    setSections(prev => [...prev, duplicate]);
    setSelectedSectionId(duplicate.id);
  };

  const deleteSection = (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    setSections(prev => prev.filter(s => s.id !== sectionId));

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);
    setSections(newSections);
  };

  // Export/Import
  const exportSections = () => {
    const dataStr = JSON.stringify(sections, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sections-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSections = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            setSections(imported);
            alert(`✅ Imported ${imported.length} sections`);
          }
        } catch (err) {
          alert('❌ Failed to import sections: Invalid JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const previewAllInPlayground = () => {
    if (sections.length === 0) {
      alert('No sections to preview');
      return;
    }

    // Generate Elementor-compatible HTML
    const elementorJson = sectionsToElementorTemplate(sections);
    const previewHtml = generateSectionsPreviewHTML(sections);

    // Copy both JSON and HTML to clipboard for easy paste into WordPress
    const exportData = {
      elementorJson,
      previewHtml,
      sections
    };

    // Copy HTML preview to clipboard
    navigator.clipboard.writeText(previewHtml).then(() => {
      // Download Elementor JSON
      const jsonBlob = new Blob([JSON.stringify(elementorJson, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `elementor-template-${Date.now()}.json`;
      jsonLink.click();
      URL.revokeObjectURL(jsonUrl);

      alert(`✅ Exported ${sections.length} sections!\n\n📋 HTML copied to clipboard\n💾 Elementor JSON downloaded\n\nYou can now:\n1. Paste HTML directly into Elementor HTML widget\n2. Or import the JSON into Elementor`);
    }).catch(() => {
      alert('❌ Failed to copy to clipboard');
    });

    // Also pass to parent component if callback exists
    onExportToPlayground?.(sections);
  };

  // Add sections from PageSplitter
  const addSectionsFromSplitter = (newSections: Section[]) => {
    setSections(prev => [...prev, ...newSections]);
    setViewMode('library');
    alert(`✅ Added ${newSections.length} sections to library!`);
  };

  // Style Kit CRUD Operations
  const createNewStyleKit = () => {
    const newKit = createStyleKit({
      name: `Style Kit ${styleKits.length + 1}`
    });
    setStyleKits(prev => [...prev, newKit]);
    setSelectedStyleKitId(newKit.id);
  };

  const updateStyleKit = (kitId: string, updates: Partial<StyleKit>) => {
    setStyleKits(prev =>
      prev.map(sk => (sk.id === kitId ? { ...sk, ...updates, updatedAt: Date.now() } : sk))
    );
  };

  const deleteStyleKit = (kitId: string) => {
    const kit = styleKits.find(sk => sk.id === kitId);
    if (kit?.isDefault) {
      alert('Cannot delete the default WordPress style kit');
      return;
    }

    if (!confirm('Are you sure you want to delete this style kit?')) return;

    setStyleKits(prev => prev.filter(sk => sk.id !== kitId));

    if (selectedStyleKitId === kitId) {
      setSelectedStyleKitId(null);
    }
  };

  const setActiveStyleKit = (kitId: string) => {
    setStyleKits(prev =>
      prev.map(sk => ({
        ...sk,
        isActive: sk.id === kitId
      }))
    );
  };

  const importStyleKit = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.css';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const css = event.target?.result as string;
        const newKit = createStyleKit({
          name: file.name.replace('.css', ''),
          css
        });
        setStyleKits(prev => [...prev, newKit]);
        alert(`✅ Imported style kit: ${newKit.name}`);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // If in split-page mode, show PageSplitter
  if (viewMode === 'split-page') {
    return (
      <PageSplitter
        onSaveToLibrary={addSectionsFromSplitter}
        onBack={() => setViewMode('library')}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar: Section List */}
      <div style={{
        width: `${leftPanelWidth}%`,
        minWidth: '250px',
        maxWidth: '400px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f9fafb',
        borderRight: '1px solid #e5e7eb'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setLibraryTab('sections')}
              style={{
                padding: '8px 16px',
                background: libraryTab === 'sections' ? '#ffffff' : 'transparent',
                color: libraryTab === 'sections' ? '#3b82f6' : '#6b7280',
                border: 'none',
                borderBottom: libraryTab === 'sections' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              📄 Sections ({sections.length})
            </button>
            <button
              onClick={() => setLibraryTab('style-kits')}
              style={{
                padding: '8px 16px',
                background: libraryTab === 'style-kits' ? '#ffffff' : 'transparent',
                color: libraryTab === 'style-kits' ? '#3b82f6' : '#6b7280',
                border: 'none',
                borderBottom: libraryTab === 'style-kits' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              🎨 Style Kits ({styleKits.length})
            </button>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827'
            }}>
              {libraryTab === 'sections' ? `Sections (${sections.length})` : `Style Kits (${styleKits.length})`}
            </h2>

            <div style={{ display: 'flex', gap: '6px' }}>
              {libraryTab === 'sections' ? (
                <>
                  <button
                    onClick={createNewSection}
                    style={{
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    + New
                  </button>

                  <button
                    onClick={() => setViewMode('split-page')}
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
                    ✂️ Split
                  </button>
                </>
              ) : (
                <button
                  onClick={createNewStyleKit}
                  style={{
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  + New Kit
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {libraryTab === 'sections' ? (
            <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
              <button
                onClick={previewAllInPlayground}
                disabled={sections.length === 0}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: sections.length > 0 ? '#10b981' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: sections.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                📋 Preview
              </button>

              <button
                onClick={exportSections}
                disabled={sections.length === 0}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: sections.length > 0 ? '#6366f1' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: sections.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                ⬇️ Export
              </button>

              <button
                onClick={importSections}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                ⬆️ Import
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
              <button
                onClick={importStyleKit}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                ⬆️ Import CSS
              </button>
            </div>
          )}
        </div>

        {/* List (Sections or Style Kits) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {libraryTab === 'sections' ? (
            sections.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                <p>No sections yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  Click "+ New" to create your first section
                </p>
              </div>
            ) : (
              sections.map((section, index) => (
              <div
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                style={{
                  marginBottom: '8px',
                  padding: '12px',
                  background: selectedSectionId === section.id ? '#ffffff' : '#ffffff',
                  border: selectedSectionId === section.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedSectionId === section.id ? '0 2px 4px rgba(59, 130, 246, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedSectionId !== section.id) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSectionId !== section.id) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                {/* Section Preview Thumbnail - Live Render with iframe */}
                <div style={{
                  width: '100%',
                  height: '120px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff'
                }}>
                  {section.html ? (
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body {
                              margin: 0;
                              padding: 0;
                              transform: scale(0.25);
                              transform-origin: 0 0;
                              width: 400%;
                              height: 400%;
                              overflow: hidden;
                            }
                            ${section.css || ''}
                          </style>
                        </head>
                        <body>
                          ${section.html}
                          ${section.js ? `<script>${section.js}</script>` : ''}
                        </body>
                        </html>
                      `}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        pointerEvents: 'none'
                      }}
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#9ca3af',
                      fontSize: '11px'
                    }}>
                      No HTML
                    </div>
                  )}
                </div>

                {/* Section Info */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {section.name}
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  Updated {new Date(section.updatedAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '4px'
                }}>
                  {onLoadInEditor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadInEditor(section);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      📝 Load in Editor
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSectionId(section.id);
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    ✏️ Edit Here
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSection(section.id);
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    📋 Copy
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSection(section.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    🗑️
                  </button>
                </div>

                {/* Order Controls */}
                {sections.length > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '6px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index > 0) moveSection(index, index - 1);
                      }}
                      disabled={index === 0}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: index > 0 ? '#e5e7eb' : '#f3f4f6',
                        color: index > 0 ? '#374151' : '#9ca3af',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: index > 0 ? 'pointer' : 'not-allowed',
                        fontWeight: 500
                      }}
                    >
                      ↑ Up
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index < sections.length - 1) moveSection(index, index + 1);
                      }}
                      disabled={index === sections.length - 1}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: index < sections.length - 1 ? '#e5e7eb' : '#f3f4f6',
                        color: index < sections.length - 1 ? '#374151' : '#9ca3af',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: index < sections.length - 1 ? 'pointer' : 'not-allowed',
                        fontWeight: 500
                      }}
                    >
                      ↓ Down
                    </button>
                  </div>
                )}
              </div>
            ))
            )
          ) : (
            styleKits.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                <p>No style kits yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  Click "+ New Kit" to create one or import a CSS file
                </p>
              </div>
            ) : (
              styleKits.map((kit) => (
                <div
                  key={kit.id}
                  onClick={() => setSelectedStyleKitId(kit.id)}
                  style={{
                    marginBottom: '8px',
                    padding: '12px',
                    background: selectedStyleKitId === kit.id ? '#ffffff' : '#ffffff',
                    border: selectedStyleKitId === kit.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selectedStyleKitId === kit.id ? '0 2px 4px rgba(59, 130, 246, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStyleKitId !== kit.id) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStyleKitId !== kit.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  {/* Style Kit Info */}
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {kit.name}
                    {kit.isDefault && <span style={{ fontSize: '11px', color: '#6366f1' }}>⭐</span>}
                    {kit.isActive && <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Active</span>}
                  </div>

                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginBottom: '8px'
                  }}>
                    Updated {new Date(kit.updatedAt).toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStyleKit(kit.id);
                      }}
                      disabled={kit.isActive}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        background: kit.isActive ? '#10b981' : '#f3f4f6',
                        color: kit.isActive ? '#ffffff' : '#374151',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: kit.isActive ? 'default' : 'pointer',
                        fontWeight: 500
                      }}
                    >
                      {kit.isActive ? '✓ Active' : 'Set Active'}
                    </button>

                    {!kit.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStyleKit(kit.id);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Right Panel: Section Editor or Style Kit Viewer */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff'
      }}>
        {libraryTab === 'sections' ? (
          selectedSection ? (
            <HtmlSectionEditor
              key={selectedSection.id}
              initialSection={selectedSection}
              activeStyleKitCss={activeStyleKit?.css || ''}
              onSectionChange={(updatedSection) => {
                updateSection(selectedSection.id, updatedSection);
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#9ca3af',
              fontSize: '14px',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '48px' }}>📄</div>
              <div>Select a section to edit</div>
              <div style={{ fontSize: '12px' }}>or create a new one</div>
            </div>
          )
        ) : (
          selectedStyleKit ? (
            <StyleKitViewer
              key={selectedStyleKit.id}
              styleKit={selectedStyleKit}
              onUpdate={(updates) => {
                updateStyleKit(selectedStyleKit.id, updates);
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#9ca3af',
              fontSize: '14px',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '48px' }}>🎨</div>
              <div>Select a style kit to view</div>
              <div style={{ fontSize: '12px' }}>or create a new one</div>
              {activeStyleKit && (
                <div style={{ fontSize: '12px', marginTop: '8px', color: '#6b7280' }}>
                  Active: {activeStyleKit.name}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
