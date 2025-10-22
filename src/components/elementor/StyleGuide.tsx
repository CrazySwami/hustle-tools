'use client';

import { useState, useRef, useEffect } from 'react';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
import Editor from '@monaco-editor/react';

export function StyleGuide() {
  const {
    globalCss,
    setGlobalCss,
    pullFromWordPress,
    pushToWordPress,
    isLoading,
    error,
    themeName,
    themeVersion,
    cssVariables
  } = useGlobalStylesheet();

  const [leftPanelWidth, setLeftPanelWidth] = useState(60); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedCss, setLastSavedCss] = useState(globalCss);

  // Resize handlers
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;

      // Constrain between 40% and 70%
      if (newWidth >= 40 && newWidth <= 70) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(globalCss !== lastSavedCss);
  }, [globalCss, lastSavedCss]);

  // Handlers
  const handlePullFromWordPress = async () => {
    try {
      await pullFromWordPress();
      setLastSavedCss(globalCss);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Pull error:', err);
      alert(`Failed to pull stylesheet: ${err.message}`);
    }
  };

  const handlePushToWordPress = async () => {
    try {
      await pushToWordPress();
      setLastSavedCss(globalCss);
      setHasUnsavedChanges(false);
      alert('✅ Stylesheet pushed to WordPress successfully!');
    } catch (err: any) {
      console.error('Push error:', err);
      alert(`Failed to push stylesheet: ${err.message}`);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('Reset to WordPress theme default? This will discard all custom changes.')) {
      return;
    }

    try {
      await pullFromWordPress();
      setLastSavedCss(globalCss);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Reset error:', err);
      alert(`Failed to reset: ${err.message}`);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Left Panel: Style Guide Preview */}
      <div style={{
        width: `${leftPanelWidth}%`,
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb'
      }}>
        {/* Apply global CSS */}
        <style>{globalCss}</style>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 700 }}>Style Guide</h1>

          {themeName && (
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
              Theme: <strong>{themeName}</strong> {themeVersion && `(v${themeVersion})`}
            </p>
          )}

          {/* Typography Section */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
              Typography
            </h2>

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

            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              This is small text with muted color.
            </p>
          </section>

          {/* CSS Variables Section */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
              CSS Variables
            </h2>

            {cssVariables.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {cssVariables.map((variable, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    gap: '12px',
                    padding: '8px 12px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}>
                    <div style={{ fontWeight: 600, color: '#059669' }}>
                      {variable.name}
                    </div>
                    <div style={{ color: '#6b7280', wordBreak: 'break-all' }}>
                      {variable.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                No CSS variables found. Add some to your stylesheet using <code>:root {'{ --primary-color: #0066cc; }'}</code>
              </p>
            )}
          </section>

          {/* Colors Section */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
              Color Swatches
            </h2>

            {cssVariables.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {cssVariables
                  .filter(v => v.name.includes('color') || v.name.includes('bg') || v.name.includes('text'))
                  .map((variable, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{
                        width: '100%',
                        height: '60px',
                        background: variable.value,
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px'
                      }} />
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{variable.name}</div>
                        <div style={{ color: '#6b7280' }}>{variable.value}</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                No CSS color variables found.
              </p>
            )}
          </section>

          {/* Buttons Section */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
              Buttons
            </h2>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-outline">Outline Button</button>
              <button className="btn-ghost">Ghost Button</button>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button className="btn-primary btn-sm">Small</button>
              <button className="btn-primary btn-md">Medium</button>
              <button className="btn-primary btn-lg">Large</button>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-primary" disabled>Disabled</button>
            </div>
          </section>

          {/* Forms Section */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
              Form Elements
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Textarea
                </label>
                <textarea
                  placeholder="Enter text..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Select
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" id="checkbox1" />
                <label htmlFor="checkbox1" style={{ fontSize: '14px' }}>Checkbox</label>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="radio" id="radio1" name="radio" />
                <label htmlFor="radio1" style={{ fontSize: '14px' }}>Radio Button</label>
              </div>
            </div>
          </section>

          {/* Spacing Section */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
              Spacing Scale
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[4, 8, 12, 16, 24, 32, 48, 64].map(size => (
                <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '60px', fontSize: '14px', color: '#6b7280' }}>{size}px</div>
                  <div style={{ width: `${size}px`, height: '24px', background: '#3b82f6', borderRadius: '2px' }} />
                </div>
              ))}
            </div>
          </section>

          {/* Borders & Shadows Section */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
              Borders & Shadows
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{
                padding: '24px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                Border Radius: 4px
              </div>

              <div style={{
                padding: '24px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                Border Radius: 8px
              </div>

              <div style={{
                padding: '24px',
                border: '1px solid #d1d5db',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                Shadow: sm
              </div>

              <div style={{
                padding: '24px',
                border: '1px solid #d1d5db',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                Shadow: md
              </div>

              <div style={{
                padding: '24px',
                border: '1px solid #d1d5db',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                Shadow: lg
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '4px',
          height: '100%',
          background: isResizing ? '#3b82f6' : '#e5e7eb',
          cursor: 'col-resize',
          transition: 'background 0.15s',
          position: 'relative',
          zIndex: 10
        }}
      />

      {/* Right Panel: CSS Editor */}
      <div style={{
        width: `${100 - leftPanelWidth}%`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1e1e'
      }}>
        {/* Editor Header */}
        <div style={{
          padding: '12px 16px',
          background: '#2d2d2d',
          borderBottom: '1px solid #3e3e3e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 500 }}>
              Global Stylesheet
            </span>
            {hasUnsavedChanges && (
              <span style={{ color: '#f59e0b', fontSize: '12px' }}>● Unsaved</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePullFromWordPress}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? '⏳' : '⬇️'} Pull from WordPress
            </button>

            <button
              onClick={handlePushToWordPress}
              disabled={isLoading || !hasUnsavedChanges}
              style={{
                padding: '6px 12px',
                background: hasUnsavedChanges ? '#10b981' : '#4b5563',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: isLoading || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
                opacity: isLoading || !hasUnsavedChanges ? 0.6 : 1
              }}
            >
              {isLoading ? '⏳' : '⬆️'} Push to WordPress
            </button>

            <button
              onClick={handleResetToDefault}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: '14px',
            borderBottom: '1px solid #fca5a5'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Monaco Editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Editor
            height="100%"
            defaultLanguage="css"
            theme="vs-dark"
            value={globalCss}
            onChange={(value) => setGlobalCss(value || '')}
            onMount={(editor, monaco) => {
              // Register CSS variable autocomplete
              monaco.languages.registerCompletionItemProvider('css', {
                provideCompletionItems: (model, position) => {
                  const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                  });

                  // Trigger on "var(" or "--"
                  const shouldTrigger = textUntilPosition.includes('var(') || textUntilPosition.match(/--[\w-]*$/);
                  if (!shouldTrigger) return { suggestions: [] };

                  const suggestions = cssVariables.map(variable => ({
                    label: variable.name,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: textUntilPosition.includes('var(')
                      ? variable.name + ')'
                      : variable.name,
                    detail: variable.value,
                    documentation: `CSS Variable: ${variable.name} = ${variable.value}`
                  }));

                  return { suggestions };
                }
              });
            }}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true
            }}
          />
        </div>
      </div>
    </div>
  );
}
