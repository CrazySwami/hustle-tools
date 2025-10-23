'use client';

import { useState, useRef } from 'react';
import { CodeIcon, MonitorIcon, TabletIcon, SmartphoneIcon, UploadIcon, ArrowRightIcon, PaletteIcon, WrenchIcon, ImageIcon, CopyIcon, CheckIcon } from '@/components/ui/icons';

interface HtmlGeneratorProps {
  onSendToConverter?: (html: string, css: string, js: string) => void;
  onSendMockups?: (mockups: [string | null, string | null, string | null]) => void;
}

export function HtmlGeneratorNew({ onSendToConverter, onSendMockups }: HtmlGeneratorProps) {
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-haiku-4.5-20251022'); // Default to Claude Haiku 4.5
  const [reasoningEffort, setReasoningEffort] = useState<'minimal' | 'low' | 'medium' | 'high'>('medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [generatedCss, setGeneratedCss] = useState('');
  const [generatedJs, setGeneratedJs] = useState('');
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js' | 'preview'>('html');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMockupIndex, setActiveMockupIndex] = useState(0);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [copiedCode, setCopiedCode] = useState<'html' | 'css' | 'js' | null>(null);

  const mockupInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [mockups, setMockups] = useState<(string | null)[]>([null, null, null]);
  const mockupLabels = ['Desktop', 'Tablet', 'Mobile'];
  const mockupIcons = [MonitorIcon, TabletIcon, SmartphoneIcon];

  const handleMockupUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setMockups(prev => {
        const newMockups = [...prev];
        newMockups[index] = url;
        return newMockups;
      });
    };
    reader.readAsDataURL(file);
  };

  const removeMockup = (index: number) => {
    setMockups(prev => {
      const newMockups = [...prev];
      newMockups[index] = null;
      return newMockups;
    });
  };

  const handleGenerate = async () => {
    if (!customPrompt.trim() && !mockups.some(m => m !== null)) {
      alert('Please provide either a prompt or upload a mockup');
      return;
    }

    console.log('🚀 Starting HTML generation...');
    setIsGenerating(true);
    setGeneratedHtml('');
    setGeneratedCss('');
    setGeneratedJs('');

    try {
      const response = await fetch('/api/generate-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          desktopMockup: mockups[0],
          tabletMockup: mockups[1],
          mobileMockup: mockups[2],
          model: selectedModel,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to generate code');
      }

      // Stream parsing with incremental JSON extraction
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        // AI Gateway toTextStreamResponse() returns plain text chunks, not SSE format
        fullContent += chunk;

        // Try to incrementally extract and display code as it streams
        try {
          // Look for "html": " pattern and extract what we have so far
          const htmlMatch = fullContent.match(/"html":\s*"((?:[^"\\]|\\.)*)"/);
          const cssMatch = fullContent.match(/"css":\s*"((?:[^"\\]|\\.)*)"/);
          const jsMatch = fullContent.match(/"js":\s*"((?:[^"\\]|\\.)*)"/);

          if (htmlMatch) {
            // Unescape JSON string
            const unescapedHtml = htmlMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            setGeneratedHtml(unescapedHtml);
            console.log('📝 HTML streaming update:', unescapedHtml.length, 'chars');
          }
          if (cssMatch) {
            const unescapedCss = cssMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            setGeneratedCss(unescapedCss);
            console.log('🎨 CSS streaming update:', unescapedCss.length, 'chars');
          }
          if (jsMatch) {
            const unescapedJs = jsMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            setGeneratedJs(unescapedJs);
            console.log('⚡ JS streaming update:', unescapedJs.length, 'chars');
          }
        } catch (streamParseError) {
          // Ignore errors during streaming - we'll parse properly at the end
        }
      }

      console.log('✅ Stream complete. Full content length:', fullContent.length);

      // Track token usage
      if (typeof window !== 'undefined' && (window as any).trackTokenUsage) {
        (window as any).trackTokenUsage({
          model: `openai/${selectedModel}`,
          inputTokens,
          outputTokens,
          type: 'html-generation',
        });
      }

      // Parse final JSON
      try {
        let cleanedText = fullContent.trim();

        if (!cleanedText) {
          throw new Error('No content received from AI');
        }

        // Remove markdown code blocks
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        console.log('🔍 Parsing JSON. First 200 chars:', cleanedText.substring(0, 200));
        const result = JSON.parse(cleanedText);

        // Handle various response formats
        let html = result.html || result[''] || '';
        let css = result.css || '';
        let js = result.js || result.javascript || '';

        // If html contains the full document, try to extract CSS and JS
        if (html && !css && html.includes('<style>')) {
          const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          if (styleMatch) {
            css = styleMatch[1].trim();
          }
        }

        if (html && !js && html.includes('<script>')) {
          const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
          if (scriptMatch) {
            js = scriptMatch[1].trim();
          }
        }

        setGeneratedHtml(html);
        setGeneratedCss(css);
        setGeneratedJs(js);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        console.log('Raw content:', fullContent);

        // Fallback: try to extract HTML, CSS, JS from the text
        let html = fullContent;
        let css = '';
        let js = '';

        // Extract CSS from <style> tags
        const styleMatch = fullContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
          css = styleMatch[1].trim();
          html = html.replace(styleMatch[0], '');
        }

        // Extract JS from <script> tags
        const scriptMatch = fullContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (scriptMatch) {
          js = scriptMatch[1].trim();
          html = html.replace(scriptMatch[0], '');
        }

        setGeneratedHtml(html);
        setGeneratedCss(css);
        setGeneratedJs(js);
      }

    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToConverter = () => {
    console.log('📤 Sending to converter:', {
      htmlLength: generatedHtml.length,
      cssLength: generatedCss.length,
      jsLength: generatedJs.length,
      hasCallback: !!onSendToConverter
    });
    if (onSendToConverter) {
      onSendToConverter(generatedHtml, generatedCss, generatedJs);
      console.log('✅ Sent to converter successfully');
    } else {
      console.error('❌ No onSendToConverter callback provided');
    }
  };

  const captureScreenshot = async (action: 'download' | 'send' = 'download') => {
    if (!previewIframeRef.current) return;

    try {
      const { default: html2canvas } = await import('html2canvas');

      if (action === 'send') {
        // Capture all 3 viewports and send to converter
        const screenshots: [string | null, string | null, string | null] = [null, null, null];
        const viewports = ['desktop', 'tablet', 'mobile'] as const;
        const widths = { desktop: 1200, tablet: 768, mobile: 375 };

        for (let i = 0; i < viewports.length; i++) {
          const viewport = viewports[i];

          // Temporarily create an iframe for each viewport
          const tempIframe = document.createElement('iframe');
          tempIframe.style.position = 'absolute';
          tempIframe.style.left = '-9999px';
          tempIframe.style.width = `${widths[viewport]}px`;
          tempIframe.style.height = '800px';
          tempIframe.style.border = 'none';
          document.body.appendChild(tempIframe);

          tempIframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>${generatedCss}</style>
            </head>
            <body>
              ${generatedHtml}
              <script>${generatedJs}</script>
            </body>
            </html>
          `;

          // Wait for iframe to load
          await new Promise((resolve) => {
            tempIframe.onload = resolve;
            setTimeout(resolve, 500); // Fallback timeout
          });

          const iframeDocument = tempIframe.contentDocument || tempIframe.contentWindow?.document;
          if (iframeDocument && iframeDocument.body) {
            const canvas = await html2canvas(iframeDocument.body, {
              width: widths[viewport],
              height: 800,
              windowWidth: widths[viewport],
              windowHeight: 800,
            });

            screenshots[i] = canvas.toDataURL('image/png');
          }

          document.body.removeChild(tempIframe);
        }

        // Send all 3 screenshots to converter
        if (onSendMockups) {
          onSendMockups(screenshots);
        }
      } else {
        // Download current viewport only
        const iframe = previewIframeRef.current;
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDocument || !iframeDocument.body) {
          alert('Unable to access preview content');
          return;
        }

        const canvas = await html2canvas(iframeDocument.body, {
          width: iframe.offsetWidth,
          height: iframe.offsetHeight,
          windowWidth: iframe.offsetWidth,
          windowHeight: iframe.offsetHeight,
        });

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `preview-${previewViewport}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        });
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      alert('Failed to capture screenshot. This feature requires the preview to be from the same origin.');
    }
  };

  const handleCopyCode = async (type: 'html' | 'css' | 'js') => {
    const code = type === 'html' ? generatedHtml : type === 'css' ? generatedCss : generatedJs;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--background)',
      gap: '16px',
      padding: '16px',
    }}>
      {/* Top Section - Split Screen: Code + Live Preview */}
      <div style={{
        flex: '1 1 60%',
        display: 'grid',
        gridTemplateColumns: generatedHtml ? '1fr 1fr' : '1fr',
        gap: '16px',
      }}>
        {/* Left: Code Editor */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'var(--card)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <CodeIcon size={16} style={{ color: 'var(--muted-foreground)' }} />
              <button
                onClick={() => setActiveCodeTab('html')}
                style={{
                  padding: '6px 12px',
                  background: activeCodeTab === 'html' ? 'var(--primary)' : 'transparent',
                  color: activeCodeTab === 'html' ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                HTML
              </button>
              <button
                onClick={() => setActiveCodeTab('css')}
                style={{
                  padding: '6px 12px',
                  background: activeCodeTab === 'css' ? 'var(--primary)' : 'transparent',
                  color: activeCodeTab === 'css' ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                CSS
              </button>
              <button
                onClick={() => setActiveCodeTab('js')}
                style={{
                  padding: '6px 12px',
                  background: activeCodeTab === 'js' ? 'var(--primary)' : 'transparent',
                  color: activeCodeTab === 'js' ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                JS
              </button>
            </div>
            {generatedHtml && (
              <button
                onClick={handleSendToConverter}
                style={{
                  padding: '6px 12px',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowRightIcon size={14} />
                Send to Converter
              </button>
            )}
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex' }} className="code-container">
            <textarea
              value={activeCodeTab === 'html' ? generatedHtml : activeCodeTab === 'css' ? generatedCss : generatedJs}
              onChange={(e) => {
                if (activeCodeTab === 'html') setGeneratedHtml(e.target.value);
                else if (activeCodeTab === 'css') setGeneratedCss(e.target.value);
                else setGeneratedJs(e.target.value);
              }}
              placeholder={isGenerating ? 'Generating...' : 'Generated code will appear here'}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: '13px',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
            {(generatedHtml || generatedCss || generatedJs) && (
              <button
                onClick={() => handleCopyCode(activeCodeTab as 'html' | 'css' | 'js')}
                className="copy-button"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: copiedCode === activeCodeTab ? '#10b981' : 'var(--foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                title="Copy code"
              >
                {copiedCode === activeCodeTab ? (
                  <>
                    <CheckIcon size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon size={14} />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview (always visible when code exists) */}
        {generatedHtml && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'var(--card)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--muted)',
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <MonitorIcon size={16} style={{ color: 'var(--muted-foreground)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginRight: '8px' }}>Live Preview</span>
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  style={{
                    padding: '6px 8px',
                    background: previewViewport === 'desktop' ? 'var(--primary)' : 'transparent',
                    color: previewViewport === 'desktop' ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Desktop View"
                >
                  <MonitorIcon size={16} />
                </button>
                <button
                  onClick={() => setPreviewViewport('tablet')}
                  style={{
                    padding: '6px 8px',
                    background: previewViewport === 'tablet' ? 'var(--primary)' : 'transparent',
                    color: previewViewport === 'tablet' ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Tablet View"
                >
                  <TabletIcon size={16} />
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  style={{
                    padding: '6px 8px',
                    background: previewViewport === 'mobile' ? 'var(--primary)' : 'transparent',
                    color: previewViewport === 'mobile' ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Mobile View"
                >
                  <SmartphoneIcon size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => captureScreenshot('download')}
                  style={{
                    padding: '6px 12px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Download screenshot of current viewport"
                >
                  <ImageIcon size={14} />
                  Download
                </button>
                {onSendMockups && (
                  <button
                    onClick={() => captureScreenshot('send')}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    title="Capture all viewports and send to JSON Converter"
                  >
                    <ArrowRightIcon size={14} />
                    Send to Converter
                  </button>
                )}
              </div>
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
              padding: '16px',
              overflow: 'auto',
            }}>
              <iframe
                ref={previewIframeRef}
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>
                      /* Global CSS */
                      ${globalCss}

                      /* Section CSS */
                      ${generatedCss}
                    </style>
                  </head>
                  <body>
                    ${generatedHtml}
                    <script>${generatedJs}</script>
                  </body>
                  </html>
                `}
                style={{
                  width: previewViewport === 'desktop' ? '100%' : previewViewport === 'tablet' ? '768px' : '375px',
                  height: '100%',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  background: '#fff',
                  maxWidth: '100%',
                }}
                title="Preview"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section - Split */}
      <div style={{
        flex: '1 1 40%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        {/* Left - Prompt */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'var(--card)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <WrenchIcon size={14} style={{ color: 'var(--muted-foreground)' }} />
            Prompt & Settings
          </div>
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want to build..."
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                resize: 'none',
                fontSize: '14px',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              >
                <optgroup label="🤖 Claude (Anthropic)">
                  <option value="anthropic/claude-haiku-4.5-20251022">Claude Haiku 4.5 (Default)</option>
                  <option value="anthropic/claude-sonnet-4.5-20250514">Claude Sonnet 4.5</option>
                  <option value="anthropic/claude-opus-4-20250514">Claude Opus 4</option>
                  <option value="anthropic/claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
                </optgroup>
                <optgroup label="🔷 OpenAI">
                  <option value="openai/gpt-5">GPT-5</option>
                  <option value="openai/gpt-5-mini">GPT-5 Mini</option>
                  <option value="openai/gpt-5-nano">GPT-5 Nano</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="openai/o3">o3</option>
                </optgroup>
                <optgroup label="✨ Google (Gemini)">
                  <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                </optgroup>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                padding: '12px',
                background: isGenerating ? 'var(--muted)' : 'var(--primary)',
                color: isGenerating ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isGenerating ? (
                <>
                  <PaletteIcon size={16} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PaletteIcon size={16} />
                  Generate HTML, CSS, JS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right - Mockups */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'var(--card)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <MonitorIcon size={14} style={{ color: 'var(--muted-foreground)' }} />
            Design Mockups
          </div>
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Mockup selector tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {mockupLabels.map((label, idx) => {
                const Icon = mockupIcons[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveMockupIndex(idx)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      background: activeMockupIndex === idx ? 'var(--primary)' : 'var(--muted)',
                      color: activeMockupIndex === idx ? 'var(--primary-foreground)' : 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Active mockup display */}
            <div style={{
              flex: 1,
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'var(--muted)',
            }}>
              {mockups[activeMockupIndex] ? (
                <>
                  <img
                    src={mockups[activeMockupIndex]!}
                    alt={mockupLabels[activeMockupIndex]}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                  <button
                    onClick={() => removeMockup(activeMockupIndex)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={() => mockupInputRefs[activeMockupIndex].current?.click()}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <UploadIcon size={16} />
                  Upload {mockupLabels[activeMockupIndex]}
                </button>
              )}
              <input
                ref={mockupInputRefs[activeMockupIndex]}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMockupUpload(activeMockupIndex, file);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
