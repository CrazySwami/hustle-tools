'use client';

import { useState } from 'react';
import { Section, createSection } from '@/lib/section-schema';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';

interface DetectedSection {
  id: string;
  html: string;
  name: string;
  type: string;
  selected: boolean;
  order: number;
}

interface StyleKit {
  id: string;
  name: string;
  css: string;
  source: 'extracted' | 'wordpress' | 'saved';
}

export function PageSplitter({
  onSaveToLibrary,
  onBack,
  onCssExtracted
}: {
  onSaveToLibrary?: (sections: Section[]) => void;
  onBack?: () => void;
  onCssExtracted?: (css: string) => void;
}) {
  const [fullHtml, setFullHtml] = useState('');
  const [detectedSections, setDetectedSections] = useState<DetectedSection[]>([]);
  const [extractedStyleKit, setExtractedStyleKit] = useState<StyleKit | null>(null);
  const [selectedStyleKit, setSelectedStyleKit] = useState<string>('none');
  const [viewMode, setViewMode] = useState<'sections' | 'styleguide'>('sections');
  const [isDetecting, setIsDetecting] = useState(false);
  const { globalCss } = useGlobalStylesheet();

  // Smart section detection algorithm
  const detectSections = () => {
    if (!fullHtml.trim()) {
      alert('Please paste HTML first');
      return;
    }

    setIsDetecting(true);

    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, 'text/html');

      // Extract style tags from head and body
      const styleTags = doc.querySelectorAll('style');
      let extractedCss = '';
      styleTags.forEach(style => {
        extractedCss += style.textContent + '\n\n';
      });

      // Create style kit if CSS was found
      if (extractedCss.trim()) {
        const styleKit: StyleKit = {
          id: `extracted-${Date.now()}`,
          name: 'Extracted from Page',
          css: extractedCss.trim(),
          source: 'extracted'
        };
        setExtractedStyleKit(styleKit);
        setSelectedStyleKit(styleKit.id);

        // Call the callback if provided
        if (onCssExtracted) {
          onCssExtracted(extractedCss.trim());
        }
      }

      const sections: DetectedSection[] = [];
      let sectionCounter = 0;

      // Strategy 1: Look for semantic section tags
      const semanticSections = doc.querySelectorAll('section, article, main, aside, nav, header, footer');

      if (semanticSections.length > 0) {
        semanticSections.forEach((element) => {
          const type = classifySectionType(element);
          sections.push({
            id: `detected-${++sectionCounter}`,
            html: element.outerHTML,
            name: `${type} ${sectionCounter}`,
            type,
            selected: true,
            order: sectionCounter
          });
        });
      } else {
        // Strategy 2: Look for divs with common section class names
        const commonSectionSelectors = [
          '[class*="section"]',
          '[class*="container"]',
          '[class*="block"]',
          '[class*="hero"]',
          '[class*="feature"]',
          '[class*="content"]',
          '[id*="section"]'
        ];

        const potentialSections = new Set<Element>();

        commonSectionSelectors.forEach(selector => {
          doc.querySelectorAll(selector).forEach(el => {
            // Only add direct children of body or main container
            if (el.parentElement?.tagName === 'BODY' ||
                el.parentElement?.tagName === 'MAIN' ||
                el.parentElement?.id === 'root' ||
                el.parentElement?.className.includes('page')) {
              potentialSections.add(el);
            }
          });
        });

        if (potentialSections.size > 0) {
          Array.from(potentialSections).forEach((element) => {
            const type = classifySectionType(element);
            sections.push({
              id: `detected-${++sectionCounter}`,
              html: element.outerHTML,
              name: `${type} ${sectionCounter}`,
              type,
              selected: true,
              order: sectionCounter
            });
          });
        } else {
          // Strategy 3: Split by top-level direct children of body
          const bodyChildren = Array.from(doc.body.children);

          bodyChildren.forEach((element) => {
            // Skip script, style, and meta tags
            if (['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE'].includes(element.tagName)) {
              return;
            }

            const type = classifySectionType(element);
            sections.push({
              id: `detected-${++sectionCounter}`,
              html: element.outerHTML,
              name: `${type} ${sectionCounter}`,
              type,
              selected: true,
              order: sectionCounter
            });
          });
        }
      }

      if (sections.length === 0) {
        alert('No sections detected. The HTML might be too simple or improperly formatted.');
      } else {
        setDetectedSections(sections);
        alert(`✅ Detected ${sections.length} sections`);
      }
    } catch (error) {
      console.error('Section detection error:', error);
      alert('Failed to parse HTML. Please check the format.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Classify section type based on content and structure
  const classifySectionType = (element: Element): string => {
    const html = element.outerHTML.toLowerCase();
    const text = element.textContent?.toLowerCase() || '';
    const classes = element.className.toLowerCase();
    const id = element.id.toLowerCase();

    // Navigation
    if (element.tagName === 'NAV' || classes.includes('nav') || id.includes('nav') ||
        html.includes('<nav') || classes.includes('menu')) {
      return 'Navigation';
    }

    // Header
    if (element.tagName === 'HEADER' || classes.includes('header') || id.includes('header')) {
      return 'Header';
    }

    // Footer
    if (element.tagName === 'FOOTER' || classes.includes('footer') || id.includes('footer')) {
      return 'Footer';
    }

    // Hero/Banner
    if (classes.includes('hero') || classes.includes('banner') || id.includes('hero') ||
        classes.includes('jumbotron') || (element.querySelector('h1') && element.querySelectorAll('*').length < 20)) {
      return 'Hero';
    }

    // Features/Services
    if (classes.includes('feature') || classes.includes('service') || id.includes('feature') ||
        text.includes('feature') || element.querySelectorAll('.feature, .service').length >= 2) {
      return 'Features';
    }

    // Testimonials/Reviews
    if (classes.includes('testimonial') || classes.includes('review') || id.includes('testimonial') ||
        text.includes('testimonial') || text.includes('review') || text.includes('"')) {
      return 'Testimonials';
    }

    // Call-to-Action
    if (classes.includes('cta') || classes.includes('call-to-action') || id.includes('cta') ||
        (element.querySelector('button') && element.querySelectorAll('*').length < 10)) {
      return 'CTA';
    }

    // Gallery/Media
    if (classes.includes('gallery') || classes.includes('portfolio') || id.includes('gallery') ||
        element.querySelectorAll('img').length >= 3) {
      return 'Gallery';
    }

    // Form
    if (element.querySelector('form') || classes.includes('form') || id.includes('form')) {
      return 'Form';
    }

    // Default
    return 'Content';
  };

  // Toggle section selection
  const toggleSection = (id: string) => {
    setDetectedSections(prev =>
      prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    );
  };

  // Update section name
  const updateSectionName = (id: string, name: string) => {
    setDetectedSections(prev =>
      prev.map(s => s.id === id ? { ...s, name } : s)
    );
  };

  // Merge adjacent sections
  const mergeSections = (id1: string, id2: string) => {
    setDetectedSections(prev => {
      const idx1 = prev.findIndex(s => s.id === id1);
      const idx2 = prev.findIndex(s => s.id === id2);

      if (idx1 === -1 || idx2 === -1 || Math.abs(idx1 - idx2) !== 1) {
        alert('Can only merge adjacent sections');
        return prev;
      }

      const [first, second] = idx1 < idx2 ? [prev[idx1], prev[idx2]] : [prev[idx2], prev[idx1]];
      const merged: DetectedSection = {
        id: `merged-${Date.now()}`,
        html: first.html + '\n' + second.html,
        name: `${first.name} + ${second.name}`,
        type: first.type,
        selected: true,
        order: first.order
      };

      return prev
        .filter(s => s.id !== id1 && s.id !== id2)
        .concat(merged)
        .sort((a, b) => a.order - b.order);
    });
  };

  // Move section up/down
  const moveSection = (id: string, direction: 'up' | 'down') => {
    setDetectedSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;

      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      const newSections = [...prev];
      [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];

      return newSections.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  // Save all selected sections to library
  const saveAllToLibrary = () => {
    const selected = detectedSections.filter(s => s.selected);

    if (selected.length === 0) {
      alert('No sections selected');
      return;
    }

    const sections: Section[] = selected.map((detected) => {
      // Extract styles and scripts from HTML
      const { html, css, js } = extractStylesAndScripts(detected.html);

      return createSection({
        name: detected.name,
        html,
        css,
        js
      });
    });

    onSaveToLibrary?.(sections);
    alert(`✅ Saved ${sections.length} sections to library!`);
  };

  // Extract inline styles and scripts from HTML
  const extractStylesAndScripts = (html: string): { html: string; css: string; js: string } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let css = '';
    let js = '';

    // Extract <style> tags
    const styleTags = doc.querySelectorAll('style');
    styleTags.forEach(style => {
      css += style.textContent + '\n';
      style.remove();
    });

    // Extract <script> tags
    const scriptTags = doc.querySelectorAll('script');
    scriptTags.forEach(script => {
      js += script.textContent + '\n';
      script.remove();
    });

    // Get cleaned HTML
    const cleanedHtml = doc.body.innerHTML;

    return {
      html: cleanedHtml,
      css: css.trim(),
      js: js.trim()
    };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
            Split Full HTML Page into Sections
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Paste a complete HTML page below and we'll automatically detect and separate it into individual sections
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '6px 12px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ← Back
          </button>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left: HTML Input */}
        <div style={{
          width: detectedSections.length > 0 ? '40%' : '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: detectedSections.length > 0 ? '1px solid #e5e7eb' : 'none',
          transition: 'width 0.3s ease'
        }}>
          <div style={{
            padding: '12px 16px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Full Page HTML
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setFullHtml('');
                  setDetectedSections([]);
                }}
                style={{
                  padding: '6px 12px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Clear
              </button>

              <button
                onClick={detectSections}
                disabled={!fullHtml.trim() || isDetecting}
                style={{
                  padding: '6px 12px',
                  background: fullHtml.trim() ? '#3b82f6' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: fullHtml.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                {isDetecting ? '🔍 Detecting...' : '🔍 Detect Sections'}
              </button>
            </div>
          </div>

          <textarea
            value={fullHtml}
            onChange={(e) => setFullHtml(e.target.value)}
            placeholder="Paste your full HTML page here..."
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              resize: 'none',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.5'
            }}
          />
        </div>

        {/* Right: Detected Sections Preview */}
        {detectedSections.length > 0 && (
          <div style={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff'
          }}>
            {/* Preview Header */}
            <div style={{
              padding: '12px 16px',
              background: '#ffffff',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {/* View Mode Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '12px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '8px'
              }}>
                <button
                  onClick={() => setViewMode('sections')}
                  style={{
                    padding: '6px 12px',
                    background: viewMode === 'sections' ? '#3b82f6' : 'transparent',
                    color: viewMode === 'sections' ? '#ffffff' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Sections ({detectedSections.filter(s => s.selected).length}/{detectedSections.length})
                </button>

                <button
                  onClick={() => setViewMode('styleguide')}
                  style={{
                    padding: '6px 12px',
                    background: viewMode === 'styleguide' ? '#3b82f6' : 'transparent',
                    color: viewMode === 'styleguide' ? '#ffffff' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  🎨 Style Kit
                </button>
              </div>

              {/* Style Kit Selector */}
              {viewMode === 'styleguide' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                    Select Style Kit:
                  </label>
                  <select
                    value={selectedStyleKit}
                    onChange={(e) => setSelectedStyleKit(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="none">None</option>
                    {extractedStyleKit && (
                      <option value={extractedStyleKit.id}>{extractedStyleKit.name}</option>
                    )}
                    <option value="wordpress">WordPress Global Stylesheet</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={saveAllToLibrary}
                  disabled={detectedSections.filter(s => s.selected).length === 0}
                  style={{
                    flex: 1,
                    padding: '6px 16px',
                    background: detectedSections.filter(s => s.selected).length > 0 ? '#10b981' : '#d1d5db',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: detectedSections.filter(s => s.selected).length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 500
                  }}
                >
                  💾 Save All to Library
                </button>
              </div>
            </div>

            {/* Content Area - Sections or Style Guide */}
            {viewMode === 'sections' ? (
              /* Section Grid */
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
                alignContent: 'start'
              }}>
              {detectedSections.map((section, index) => (
                <div
                  key={section.id}
                  style={{
                    border: section.selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    background: section.selected ? '#eff6ff' : '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Section Preview */}
                  <div style={{
                    width: '100%',
                    height: '140px',
                    background: '#f9fafb',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    position: 'relative'
                  }}>
                    <iframe
                      srcDoc={section.html}
                      style={{
                        width: '200%',
                        height: '200%',
                        border: 'none',
                        transform: 'scale(0.5)',
                        transformOrigin: '0 0',
                        pointerEvents: 'none'
                      }}
                      sandbox=""
                    />
                  </div>

                  {/* Section Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={section.selected}
                      onChange={() => toggleSection(section.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSectionName(section.id, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    />
                  </div>

                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginBottom: '8px'
                  }}>
                    Type: {section.type} • Position: #{section.order}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: index > 0 ? '#f3f4f6' : '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: index > 0 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      ↑
                    </button>

                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === detectedSections.length - 1}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: index < detectedSections.length - 1 ? '#f3f4f6' : '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: index < detectedSections.length - 1 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      ↓
                    </button>

                    {index < detectedSections.length - 1 && (
                      <button
                        onClick={() => mergeSections(section.id, detectedSections[index + 1].id)}
                        style={{
                          flex: 2,
                          padding: '4px',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Merge ↓
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </div>
            ) : (
              /* Style Guide View */
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px'
              }}>
                {(() => {
                  const activeStyleKit = selectedStyleKit === 'wordpress' ? globalCss :
                    selectedStyleKit === extractedStyleKit?.id ? extractedStyleKit.css :
                    '';

                  if (!activeStyleKit) {
                    return (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#9ca3af',
                        gap: '12px'
                      }}>
                        <div style={{ fontSize: '48px' }}>🎨</div>
                        <div>Select a style kit to preview</div>
                      </div>
                    );
                  }

                  return (
                    <>
                      <style>{activeStyleKit}</style>
                      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1 style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 700 }}>Style Guide Preview</h1>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
                          Preview of the {selectedStyleKit === 'wordpress' ? 'WordPress Global' : 'Extracted'} stylesheet
                        </p>

                        {/* Typography */}
                        <section style={{ marginBottom: '48px' }}>
                          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Typography</h2>
                          <h1>Heading 1</h1>
                          <h2>Heading 2</h2>
                          <h3>Heading 3</h3>
                          <h4>Heading 4</h4>
                          <h5>Heading 5</h5>
                          <h6>Heading 6</h6>
                          <p style={{ marginTop: '16px' }}>
                            This is body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            <a href="#" style={{ marginLeft: '4px' }}>This is a link</a>.
                          </p>
                        </section>

                        {/* Buttons */}
                        <section style={{ marginBottom: '48px' }}>
                          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Buttons</h2>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button className="btn-primary">Primary Button</button>
                            <button className="btn-secondary">Secondary Button</button>
                            <button className="btn">Default Button</button>
                          </div>
                        </section>

                        {/* Forms */}
                        <section style={{ marginBottom: '48px' }}>
                          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Form Elements</h2>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                            <input type="text" placeholder="Text input" />
                            <textarea placeholder="Textarea" rows={3} />
                            <select><option>Select option</option></select>
                            <div><input type="checkbox" id="cb1" /> <label htmlFor="cb1">Checkbox</label></div>
                          </div>
                        </section>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
