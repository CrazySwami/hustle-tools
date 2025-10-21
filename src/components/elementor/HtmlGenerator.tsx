'use client';

import { useState, useRef, useEffect } from 'react';

interface HtmlGeneratorProps {
  onSendToConverter?: (html: string, css: string, js: string) => void;
}

export function HtmlGenerator({ onSendToConverter }: HtmlGeneratorProps) {
  const [selectedModel, setSelectedModel] = useState('openai/gpt-5');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [generatedCss, setGeneratedCss] = useState('');
  const [generatedJs, setGeneratedJs] = useState('');
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const desktopMockupRef = useRef<HTMLInputElement>(null);
  const tabletMockupRef = useRef<HTMLInputElement>(null);
  const mobileMockupRef = useRef<HTMLInputElement>(null);

  const [desktopMockup, setDesktopMockup] = useState<string | null>(null);
  const [tabletMockup, setTabletMockup] = useState<string | null>(null);
  const [mobileMockup, setMobileMockup] = useState<string | null>(null);

  const handleMockupUpload = (type: 'desktop' | 'tablet' | 'mobile', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (type === 'desktop') setDesktopMockup(url);
      if (type === 'tablet') setTabletMockup(url);
      if (type === 'mobile') setMobileMockup(url);
    };
    reader.readAsDataURL(file);
  };

  const removeMockup = (type: 'desktop' | 'tablet' | 'mobile') => {
    if (type === 'desktop') setDesktopMockup(null);
    if (type === 'tablet') setTabletMockup(null);
    if (type === 'mobile') setMobileMockup(null);
  };

  // Parse streamed JSON when generation completes
  useEffect(() => {
    if (!isGenerating && streamedText) {
      try {
        let cleanedText = streamedText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const result = JSON.parse(cleanedText);
        setGeneratedHtml(result.html || '');
        setGeneratedCss(result.css || '');
        setGeneratedJs(result.js || '');
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        setGeneratedHtml(streamedText);
      }
    }
  }, [isGenerating, streamedText]);

  const handleGenerate = async () => {
    if (!customPrompt.trim() && !desktopMockup) {
      alert('Please provide either a custom prompt or upload a mockup');
      return;
    }

    setIsGenerating(true);
    setShowGenerated(true);
    setStreamedText('');
    setGeneratedHtml('');
    setGeneratedCss('');
    setGeneratedJs('');

    try {
      const response = await fetch('/api/generate-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          desktopMockup,
          tabletMockup,
          mobileMockup,
          model: selectedModel,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to generate code');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('0:')) continue;

          try {
            const jsonStr = line.slice(2);
            const chunk = JSON.parse(jsonStr);

            if (chunk && typeof chunk === 'string') {
              setStreamedText(prev => prev + chunk);
              setGeneratedHtml(prev => prev + chunk);
            }
          } catch (e) {
            // Skip invalid chunks
          }
        }
      }

    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToConverter = () => {
    if (onSendToConverter) {
      onSendToConverter(generatedHtml, generatedCss, generatedJs);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            🎨 HTML Generator
          </h3>
          <select
            className="model-selector"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
              color: '#111827',
              background: '#fff'
            }}
          >
            <option value="openai/gpt-5">GPT-5</option>
            <option value="openai/gpt-5-mini">GPT-5 Mini</option>
            <option value="openai/gpt-5-nano">GPT-5 Nano</option>
            <option value="openai/gpt-5-pro">GPT-5 Pro</option>
          </select>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {/* Image Uploads Section */}
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            Design Mockups (Optional)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* Desktop */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '8px' }}>
                🖥️ Desktop
              </label>
              <input
                type="file"
                ref={desktopMockupRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMockupUpload('desktop', file);
                }}
              />
              {!desktopMockup ? (
                <button
                  onClick={() => desktopMockupRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '40px 16px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '6px',
                    background: '#f9fafb',
                    color: '#6b7280',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                >
                  📤 Click to upload
                </button>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img
                    src={desktopMockup}
                    alt="Desktop"
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <button
                    onClick={() => removeMockup('desktop')}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Tablet */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '8px' }}>
                📱 Tablet
              </label>
              <input
                type="file"
                ref={tabletMockupRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMockupUpload('tablet', file);
                }}
              />
              {!tabletMockup ? (
                <button
                  onClick={() => tabletMockupRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '40px 16px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '6px',
                    background: '#f9fafb',
                    color: '#6b7280',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  📤 Click to upload
                </button>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img
                    src={tabletMockup}
                    alt="Tablet"
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <button
                    onClick={() => removeMockup('tablet')}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '8px' }}>
                📱 Mobile
              </label>
              <input
                type="file"
                ref={mobileMockupRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMockupUpload('mobile', file);
                }}
              />
              {!mobileMockup ? (
                <button
                  onClick={() => mobileMockupRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '40px 16px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '6px',
                    background: '#f9fafb',
                    color: '#6b7280',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  📤 Click to upload
                </button>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img
                    src={mobileMockup}
                    alt="Mobile"
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <button
                    onClick={() => removeMockup('mobile')}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompt Section */}
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
            Prompt (Optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe your design requirements (e.g., 'Modern landing page with hero section and pricing table')"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              color: '#111827',
              background: '#fff'
            }}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: isGenerating ? '#9ca3af' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            marginBottom: '16px'
          }}
          onMouseEnter={(e) => {
            if (!isGenerating) e.currentTarget.style.background = '#2563eb';
          }}
          onMouseLeave={(e) => {
            if (!isGenerating) e.currentTarget.style.background = '#3b82f6';
          }}
        >
          {isGenerating ? '⏳ Generating...' : '✨ Generate HTML/CSS/JS'}
        </button>

        {/* Generated Code */}
        {showGenerated && (
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['html', 'css', 'js'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab as any)}
                    style={{
                      padding: '6px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      background: activeCodeTab === tab ? '#3b82f6' : 'transparent',
                      color: activeCodeTab === tab ? '#fff' : '#6b7280',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
              {!isGenerating && (
                <button
                  onClick={handleSendToConverter}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#111827',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ➡️ Send to Converter
                </button>
              )}
            </div>
            <textarea
              value={
                activeCodeTab === 'html' ? generatedHtml :
                activeCodeTab === 'css' ? generatedCss :
                generatedJs
              }
              onChange={(e) => {
                if (activeCodeTab === 'html') setGeneratedHtml(e.target.value);
                else if (activeCodeTab === 'css') setGeneratedCss(e.target.value);
                else setGeneratedJs(e.target.value);
              }}
              style={{
                width: '100%',
                height: '400px',
                padding: '16px',
                border: 'none',
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '12px',
                resize: 'none',
                color: '#111827',
                background: '#1e293b',
                color: '#e2e8f0'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
