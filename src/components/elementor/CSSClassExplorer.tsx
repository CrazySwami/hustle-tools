'use client';

import { useState } from 'react';
import { CSSClass, DesignSystemSummary } from '@/lib/global-stylesheet-context';

interface CSSClassExplorerProps {
  designSystemSummary: DesignSystemSummary;
  onClose: () => void;
}

export function CSSClassExplorer({ designSystemSummary, onClose }: CSSClassExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'typography' | 'layout' | 'components' | 'colors' | 'utilities'>('all');
  const [selectedClass, setSelectedClass] = useState<CSSClass | null>(null);
  const [copiedClass, setCopiedClass] = useState<string | null>(null);

  // Get all classes from selected category
  const getClasses = (): CSSClass[] => {
    if (selectedCategory === 'all') {
      return [
        ...designSystemSummary.classes.typography,
        ...designSystemSummary.classes.layout,
        ...designSystemSummary.classes.components,
        ...designSystemSummary.classes.colors,
        ...designSystemSummary.classes.utilities,
      ];
    }
    return designSystemSummary.classes[selectedCategory] || [];
  };

  // Filter classes by search query
  const filteredClasses = getClasses().filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.rules.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Copy class name to clipboard
  const copyClassName = (className: string) => {
    navigator.clipboard.writeText(className);
    setCopiedClass(className);
    setTimeout(() => setCopiedClass(null), 2000);
  };

  // Category counts
  const categoryCounts = {
    all: designSystemSummary.totalClasses,
    typography: designSystemSummary.classes.typography.length,
    layout: designSystemSummary.classes.layout.length,
    components: designSystemSummary.classes.components.length,
    colors: designSystemSummary.classes.colors.length,
    utilities: designSystemSummary.classes.utilities.length,
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--background)',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '1400px',
          height: '90%',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar - Categories & Search */}
        <div
          style={{
            width: '280px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--muted)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              CSS Class Explorer
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
              {designSystemSummary.totalClasses} classes from{' '}
              {designSystemSummary.extractedFrom ? new URL(designSystemSummary.extractedFrom).hostname : 'extracted CSS'}
            </p>
          </div>

          {/* Search */}
          <div style={{ padding: '16px' }}>
            <input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Categories */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>
              CATEGORIES
            </div>
            {(['all', 'typography', 'layout', 'components', 'colors', 'utilities'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  border: 'none',
                  borderRadius: '6px',
                  background: selectedCategory === category ? 'var(--primary)' : 'transparent',
                  color: selectedCategory === category ? 'var(--primary-foreground)' : 'var(--foreground)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{category}</span>
                <span style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  background: selectedCategory === category ? 'rgba(255,255,255,0.2)' : 'var(--muted)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}>
                  {categoryCounts[category]}
                </span>
              </button>
            ))}
          </div>

          {/* Close Button */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--background)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Middle - Class List */}
        <div
          style={{
            width: '400px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              {selectedCategory === 'all' ? 'All Classes' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'}
            </p>
          </div>

          {/* Class List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredClasses.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                No classes found
              </div>
            ) : (
              filteredClasses.map((cls, index) => (
                <div
                  key={`${cls.name}-${index}`}
                  onClick={() => setSelectedClass(cls)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedClass === cls ? 'var(--muted)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedClass !== cls) {
                      e.currentTarget.style.background = 'var(--muted)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedClass !== cls) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <code style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                      {cls.name}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyClassName(cls.name);
                      }}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        background: copiedClass === cls.name ? 'var(--primary)' : 'var(--background)',
                        color: copiedClass === cls.name ? 'var(--primary-foreground)' : 'var(--foreground)',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {copiedClass === cls.name ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  {cls.description && (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      {cls.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - Class Details & Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedClass ? (
            <>
              {/* Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <code style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary)' }}>
                      {selectedClass.name}
                    </code>
                    {selectedClass.category && (
                      <div style={{
                        display: 'inline-block',
                        marginLeft: '12px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: 'var(--muted)',
                        fontSize: '12px',
                        textTransform: 'capitalize',
                      }}>
                        {selectedClass.category}
                      </div>
                    )}
                    {selectedClass.description && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--muted-foreground)' }}>
                        {selectedClass.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => copyClassName(selectedClass.name)}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: copiedClass === selectedClass.name ? 'var(--primary)' : 'var(--background)',
                      color: copiedClass === selectedClass.name ? 'var(--primary-foreground)' : 'var(--foreground)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {copiedClass === selectedClass.name ? '✓ Copied' : 'Copy Class Name'}
                  </button>
                </div>
              </div>

              {/* CSS Rules */}
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  CSS RULES
                </h5>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  background: 'var(--muted)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                }}>
                  <code>{selectedClass.name} {`{\n  ${selectedClass.rules.replace(/;\s*/g, ';\n  ')}\n}`}</code>
                </pre>
              </div>

              {/* Visual Preview */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  VISUAL PREVIEW
                </h5>

                {/* Preview on different elements */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Text preview */}
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      Applied to text:
                    </p>
                    <div style={{
                      padding: '16px',
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}>
                      <style dangerouslySetInnerHTML={{
                        __html: `.preview-text-${selectedClass.name.replace(/[^a-zA-Z0-9]/g, '')} { ${selectedClass.rules} }`
                      }} />
                      <p className={`preview-text-${selectedClass.name.replace(/[^a-zA-Z0-9]/g, '')}`}>
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                  </div>

                  {/* Button preview */}
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      Applied to button:
                    </p>
                    <div style={{
                      padding: '16px',
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}>
                      <style dangerouslySetInnerHTML={{
                        __html: `.preview-btn-${selectedClass.name.replace(/[^a-zA-Z0-9]/g, '')} { ${selectedClass.rules} }`
                      }} />
                      <button className={`preview-btn-${selectedClass.name.replace(/[^a-zA-Z0-9]/g, '')}`}>
                        Click Me
                      </button>
                    </div>
                  </div>

                  {/* Div preview */}
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      Applied to div:
                    </p>
                    <div style={{
                      padding: '16px',
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}>
                      <style dangerouslySetInnerHTML={{
                        __html: `.preview-div-${selectedClass.name.replace(/[^a-zA-Z0-9]/g, '')} { ${selectedClass.rules} }`
                      }} />
                      <div className={`preview-div-${selectedClass.name.replace(/[^a-zA-Z0-9]/g, '')}`}>
                        Sample content in a div element
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted-foreground)',
              fontSize: '14px',
            }}>
              Select a class to view details and preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
