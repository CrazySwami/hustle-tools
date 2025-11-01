'use client';

import { useState } from 'react';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { MODEL_PRICING } from '@/hooks/useUsageTracking';

interface GenerateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (code: { html: string; css: string; js: string }) => void;
  selectedModel?: string;
}

export function GenerateProjectModal({ isOpen, onClose, onGenerate, selectedModel }: GenerateProjectModalProps) {
  const [step, setStep] = useState<'type' | 'description' | 'generating'>('type');
  const [projectType, setProjectType] = useState<'html' | 'elementor'>('html');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'html' | 'css' | 'js' | null>(null);
  const [usageMetadata, setUsageMetadata] = useState<any>(null);

  const { recordUsage } = useUsageTracking();

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 'type') {
      setStep('description');
    } else if (step === 'description' && description.trim()) {
      startGeneration();
    }
  };

  const handleBack = () => {
    if (step === 'description') {
      setStep('type');
    }
  };

  const resetModal = () => {
    setStep('type');
    setProjectType('html');
    setDescription('');
    setProjectName('');
    setGenerating(false);
    setProgress('');
    setCurrentPhase(null);
    setUsageMetadata(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const generateProjectName = (desc: string): string => {
    return desc
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join('_');
  };

  const parseStreamedCode = (text: string): { html: string; css: string; js: string } => {
    // Try to extract code from markdown code blocks
    const htmlMatch = text.match(/```html\n([\s\S]*?)```/);
    const cssMatch = text.match(/```css\n([\s\S]*?)```/);
    const jsMatch = text.match(/```(?:javascript|js)\n([\s\S]*?)```/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : '',
      css: cssMatch ? cssMatch[1].trim() : '',
      js: jsMatch ? jsMatch[1].trim() : '',
    };
  };

  const startGeneration = async () => {
    setStep('generating');
    setGenerating(true);
    setProgress('Initializing generation...');

    const generatedName = projectName || generateProjectName(description);

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          projectType,
          projectName: generatedName,
          model: selectedModel || 'anthropic/claude-sonnet-4-5-20250929',
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullCode = '';

      if (reader) {
        setCurrentPhase('html');
        setProgress('Generating HTML...');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullCode += chunk;

          // Update progress based on content length
          if (fullCode.length > 500 && currentPhase === 'html') {
            setCurrentPhase('css');
            setProgress('Generating CSS...');
          } else if (fullCode.length > 1500 && currentPhase === 'css') {
            setCurrentPhase('js');
            setProgress('Generating JavaScript...');
          }
        }

        // Extract usage metadata if present
        let codeOnly = fullCode;
        let usageData = null;

        if (fullCode.includes('__USAGE__:')) {
          const parts = fullCode.split('__USAGE__:');
          codeOnly = parts[0];
          try {
            usageData = JSON.parse(parts[1]);
            console.log('📊 Usage metadata received:', usageData);

            // Track usage
            if (usageData.usage) {
              recordUsage(usageData.model, {
                inputTokens: usageData.usage.promptTokens || 0,
                outputTokens: usageData.usage.completionTokens || 0,
                cacheCreationTokens: usageData.usage.cacheCreationInputTokens || 0,
                cacheReadTokens: usageData.usage.cacheReadInputTokens || 0,
              });

              setUsageMetadata(usageData);
            }
          } catch (e) {
            console.error('Failed to parse usage metadata:', e);
          }
        }

        setProgress('✅ Generation complete! Parsing code...');

        // Parse the generated code
        const parsedCode = parseStreamedCode(codeOnly);

        // If parsing failed, try to split by common patterns
        if (!parsedCode.html && !parsedCode.css) {
          // Fallback: assume first part is HTML, middle is CSS, last is JS
          const parts = codeOnly.split(/(?=<style>|<script>)/);
          parsedCode.html = codeOnly; // Use full code as HTML for now
        }

        setProgress('✅ Code parsed successfully!');

        // Wait a moment before closing
        setTimeout(() => {
          onGenerate(parsedCode);
          handleClose();
        }, 2000); // Give time to see usage stats

      }
    } catch (error: any) {
      setProgress(`❌ Error: ${error.message}`);
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'var(--background)',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            🚀 Generate New Project
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--muted-foreground)' }}>
            {step === 'type' && 'Choose your project type'}
            {step === 'description' && 'Describe what you want to create'}
            {step === 'generating' && 'Generating your project...'}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Step 1: Project Type Selection */}
          {step === 'type' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>
                <div
                  onClick={() => setProjectType('html')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${projectType === 'html' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: projectType === 'html' ? 'var(--primary)/10' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={projectType === 'html'}
                      onChange={() => setProjectType('html')}
                      style={{ margin: 0 }}
                    />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                      📄 HTML Section
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 0 28px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Standalone responsive web section with HTML, CSS, and JavaScript
                  </p>
                </div>
              </label>

              <label>
                <div
                  onClick={() => setProjectType('elementor')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${projectType === 'elementor' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: projectType === 'elementor' ? 'var(--primary)/10' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={projectType === 'elementor'}
                      onChange={() => setProjectType('elementor')}
                      style={{ margin: 0 }}
                    />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                      ⚡ Elementor Widget
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 0 28px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Widget-ready code with proper {'{WRAPPER}'} scoping for Elementor
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Step 2: Description Input */}
          {step === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Project Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., A modern hero section with gradient background, call-to-action button, and image"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Project Name (Optional)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Auto-generated from description"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                />
                {description && !projectName && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Auto-generated: <strong>{generateProjectName(description)}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {currentPhase === 'html' && '📝'}
                {currentPhase === 'css' && '🎨'}
                {currentPhase === 'js' && '⚡'}
                {!currentPhase && '🚀'}
              </div>
              <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                {progress}
              </p>
              {generating && (
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'var(--primary)',
                  borderRadius: '2px',
                  margin: '20px 0',
                  opacity: 0.6,
                }} />
              )}

              {/* Token Usage Display */}
              {usageMetadata && usageMetadata.usage && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'var(--muted)',
                  borderRadius: '8px',
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--muted-foreground)' }}>
                    📊 Token Usage
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>Input:</span>
                      <span style={{ fontWeight: 500, marginLeft: '8px' }}>
                        {(usageMetadata.usage.promptTokens || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>Output:</span>
                      <span style={{ fontWeight: 500, marginLeft: '8px' }}>
                        {(usageMetadata.usage.completionTokens || 0).toLocaleString()}
                      </span>
                    </div>
                    {(usageMetadata.usage.cacheCreationInputTokens || 0) > 0 && (
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>Cache Write:</span>
                        <span style={{ fontWeight: 500, marginLeft: '8px' }}>
                          {usageMetadata.usage.cacheCreationInputTokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {(usageMetadata.usage.cacheReadInputTokens || 0) > 0 && (
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>Cache Read:</span>
                        <span style={{ fontWeight: 500, marginLeft: '8px', color: 'var(--primary)' }}>
                          {usageMetadata.usage.cacheReadInputTokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Total:</span>
                      <span style={{ fontWeight: 600, marginLeft: '8px' }}>
                        {(
                          (usageMetadata.usage.promptTokens || 0) +
                          (usageMetadata.usage.completionTokens || 0) +
                          (usageMetadata.usage.cacheCreationInputTokens || 0) +
                          (usageMetadata.usage.cacheReadInputTokens || 0)
                        ).toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--muted-foreground)', marginLeft: '8px', fontSize: '11px' }}>
                        tokens
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'generating' && (
          <div
            style={{
              padding: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <button
              onClick={step === 'description' ? handleBack : handleClose}
              style={{
                padding: '10px 20px',
                background: 'var(--muted)',
                color: 'var(--foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {step === 'description' ? '← Back' : 'Cancel'}
            </button>
            <button
              onClick={handleNext}
              disabled={step === 'description' && !description.trim()}
              style={{
                padding: '10px 20px',
                background: step === 'description' && !description.trim() ? 'var(--muted)' : 'var(--primary)',
                color: step === 'description' && !description.trim() ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: step === 'description' && !description.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {step === 'type' ? 'Next →' : '🚀 Generate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
