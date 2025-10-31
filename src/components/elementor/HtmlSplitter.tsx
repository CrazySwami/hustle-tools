/**
 * HTML Page Splitter Component
 *
 * Automatically splits a full HTML page into individual sections.
 * Extracts <section>, <header>, <footer>, <article>, and other top-level elements.
 *
 * Usage:
 * 1. User pastes full HTML page
 * 2. System detects sectioning elements
 * 3. Shows preview of each section
 * 4. User selects which sections to import
 * 5. Creates file groups for selected sections
 */

'use client';

import { useState } from 'react';

interface ExtractedSection {
  id: string;
  type: string; // 'section', 'header', 'footer', 'article', 'div'
  html: string;
  preview: string; // First 100 chars for preview
  classes: string[]; // CSS classes
}

interface HtmlSplitterProps {
  onClose: () => void;
  onImport: (sections: ExtractedSection[]) => void;
}

export function HtmlSplitter({ onClose, onImport }: HtmlSplitterProps) {
  const [htmlInput, setHtmlInput] = useState('');
  const [sections, setSections] = useState<ExtractedSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  /**
   * Parse HTML and extract sections
   */
  const handleAnalyze = () => {
    try {
      if (!htmlInput.trim()) {
        setError('Please paste HTML content');
        return;
      }

      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, 'text/html');

      // Extract sectioning elements
      const sectioningTags = ['section', 'header', 'footer', 'article', 'aside', 'nav', 'main'];
      const extracted: ExtractedSection[] = [];

      // First, try to find sectioning elements
      sectioningTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach((el, index) => {
          const html = el.outerHTML;
          const preview = el.textContent?.trim().substring(0, 100) || '(no text content)';
          const classes = Array.from(el.classList);

          extracted.push({
            id: `${tag}_${index}_${Date.now()}`,
            type: tag,
            html,
            preview,
            classes
          });
        });
      });

      // If no sectioning elements found, try to split by top-level divs with classes
      if (extracted.length === 0) {
        const topLevelDivs = Array.from(doc.body.children).filter(el => {
          return el.tagName === 'DIV' && el.classList.length > 0;
        });

        topLevelDivs.forEach((el, index) => {
          const html = el.outerHTML;
          const preview = el.textContent?.trim().substring(0, 100) || '(no text content)';
          const classes = Array.from(el.classList);

          extracted.push({
            id: `div_${index}_${Date.now()}`,
            type: 'div',
            html,
            preview,
            classes
          });
        });
      }

      if (extracted.length === 0) {
        setError('No sections found. Make sure your HTML contains <section>, <header>, <footer>, or <div> elements with classes.');
        return;
      }

      setSections(extracted);
      setSelectedSections(new Set(extracted.map(s => s.id))); // Select all by default
      setError('');
    } catch (err) {
      setError(`Failed to parse HTML: ${err}`);
    }
  };

  /**
   * Toggle section selection
   */
  const toggleSection = (id: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSections(newSelected);
  };

  /**
   * Import selected sections
   */
  const handleImport = () => {
    const selected = sections.filter(s => selectedSections.has(s.id));
    if (selected.length === 0) {
      setError('Please select at least one section');
      return;
    }
    onImport(selected);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#2d2d2d',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          width: '90%',
          maxWidth: '900px',
          maxHeight: '80vh',
          border: '1px solid #3e3e3e',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #3e3e3e'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#ffffff'
          }}>
            HTML Page Splitter
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            color: '#888'
          }}>
            Paste a full HTML page and extract individual sections automatically
          </p>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflow: 'auto'
        }}>
          {sections.length === 0 ? (
            // Input Step
            <>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cccccc'
              }}>
                HTML Content
              </label>
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste full HTML page here..."
                style={{
                  width: '100%',
                  height: '300px',
                  padding: '12px',
                  background: '#1e1e1e',
                  border: '1px solid #3e3e3e',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />

              {error && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#3d1f1f',
                  border: '1px solid #5a2929',
                  borderRadius: '6px',
                  color: '#ff6b6b',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!htmlInput.trim()}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  background: htmlInput.trim() ? '#007acc' : '#3e3e3e',
                  border: 'none',
                  borderRadius: '6px',
                  color: htmlInput.trim() ? '#ffffff' : '#888',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: htmlInput.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Analyze & Extract Sections
              </button>
            </>
          ) : (
            // Results Step
            <>
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#2a2d2e',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#cccccc'
              }}>
                Found <strong style={{ color: '#ffffff' }}>{sections.length}</strong> section{sections.length === 1 ? '' : 's'}. Select which ones to import:
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {sections.map((section) => (
                  <label
                    key={section.id}
                    style={{
                      display: 'flex',
                      padding: '16px',
                      background: selectedSections.has(section.id) ? '#2a2d2e' : '#1e1e1e',
                      border: selectedSections.has(section.id) ? '2px solid #007acc' : '2px solid #3e3e3e',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.has(section.id)}
                      onChange={() => toggleSection(section.id)}
                      style={{
                        marginRight: '12px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: '#3e3e3e',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#888',
                          textTransform: 'uppercase'
                        }}>
                          {section.type}
                        </span>
                        {section.classes.length > 0 && (
                          <span style={{
                            fontSize: '12px',
                            color: '#888'
                          }}>
                            .{section.classes.join('.')}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#cccccc',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {section.preview}
                      </div>
                      <div style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#666'
                      }}>
                        {section.html.length} characters
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={() => {
                  setSections([]);
                  setSelectedSections(new Set());
                  setError('');
                }}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #3e3e3e',
                  borderRadius: '6px',
                  color: '#cccccc',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Start Over
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #3e3e3e',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #3e3e3e',
              borderRadius: '6px',
              color: '#cccccc',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          {sections.length > 0 && (
            <button
              onClick={handleImport}
              disabled={selectedSections.size === 0}
              style={{
                padding: '10px 20px',
                background: selectedSections.size > 0 ? '#007acc' : '#3e3e3e',
                border: 'none',
                borderRadius: '6px',
                color: selectedSections.size > 0 ? '#ffffff' : '#888',
                fontSize: '14px',
                fontWeight: 600,
                cursor: selectedSections.size > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Import {selectedSections.size} Section{selectedSections.size === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
