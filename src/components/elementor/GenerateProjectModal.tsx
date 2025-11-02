'use client';

import { useState } from 'react';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { MODEL_PRICING } from '@/hooks/useUsageTracking';

// Model configurations (same as ChatInterface)
const MODEL_CONFIGS = {
  'anthropic/claude-haiku-4-5-20251001': { name: 'Claude Haiku 4.5', inputLimit: 200000, outputLimit: 8192 },
  'anthropic/claude-sonnet-4-5-20250929': { name: 'Claude Sonnet 4.5', inputLimit: 200000, outputLimit: 8192 },
  'anthropic/claude-opus-4-20250514': { name: 'Claude Opus 4', inputLimit: 200000, outputLimit: 8192 },
  'openai/gpt-5': { name: 'GPT-5', inputLimit: 272000, outputLimit: 128000 },
  'openai/gpt-5-mini': { name: 'GPT-5 Mini', inputLimit: 272000, outputLimit: 128000 },
  'google/gemini-2.5-pro': { name: 'Gemini 2.5 Pro', inputLimit: 1000000, outputLimit: 8192 },
};

interface GenerateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (code: { html: string; css: string; js: string; php?: string; projectName?: string }) => void;
  onProjectCreate?: (projectName: string, projectType: 'html' | 'php') => string; // Returns new project ID
  onProjectUpdate?: (projectId: string, file: 'html' | 'css' | 'js' | 'php', content: string) => void;
  defaultModel?: string;
  // Optional existing code for conversion mode
  existingCode?: {
    html?: string;
    css?: string;
    js?: string;
  };
}

export function GenerateProjectModal({ isOpen, onClose, onGenerate, onProjectCreate, onProjectUpdate, defaultModel, existingCode }: GenerateProjectModalProps) {
  // If existingCode is provided, we're in conversion mode - skip type selection and go straight to elementor
  const isConversionMode = !!existingCode;
  const [step, setStep] = useState<'type' | 'description' | 'generating'>(isConversionMode ? 'description' : 'type');
  const [projectType, setProjectType] = useState<'html' | 'elementor'>(isConversionMode ? 'elementor' : 'html');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedModel, setSelectedModel] = useState(defaultModel || 'anthropic/claude-sonnet-4-5-20250929');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'html' | 'css' | 'js' | 'php' | null>(null);
  const [usageMetadata, setUsageMetadata] = useState<any>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const { recordUsage} = useUsageTracking();

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 'type') {
      setStep('description');
    } else if (step === 'description') {
      // In conversion mode, description is optional
      // In new project mode, description is required
      if (isConversionMode || description.trim()) {
        startGeneration();
      }
    }
  };

  const handleBack = () => {
    if (step === 'description' && !isConversionMode) {
      setStep('type');
    }
  };

  const resetModal = () => {
    setStep(isConversionMode ? 'description' : 'type');
    setProjectType(isConversionMode ? 'elementor' : 'html');
    setDescription('');
    setProjectName('');
    setSelectedModel(defaultModel || 'anthropic/claude-sonnet-4-5-20250929');
    setGenerating(false);
    setProgress('');
    setCurrentPhase(null);
    setUsageMetadata(null);
    setCreatedProjectId(null);
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
          model: selectedModel,
          existingCode: existingCode, // Pass existing code if provided
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullCode = '';

      if (reader) {
        // Create project ONCE at the start
        const displayName = generatedName
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const projectId = onProjectCreate?.(displayName, projectType === 'elementor' ? 'php' : 'html');
        if (projectId) {
          setCreatedProjectId(projectId);
          console.log('📦 Created project:', displayName, 'ID:', projectId);
        }

        // Set initial phase based on project type
        if (projectType === 'elementor') {
          setCurrentPhase('php');
          setProgress('Generating PHP Widget...');
        } else {
          setCurrentPhase('html');
          setProgress('Generating HTML...');
        }

        // Close modal after a short delay so user can see the streaming in the editor
        setTimeout(() => {
          onClose();
        }, 500);

        while (true) {
          const { done, value} = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullCode += chunk;

          // Stream updates to project files in real-time
          if (projectId && onProjectUpdate) {
            if (projectType === 'elementor') {
              // Use lenient regex that works during streaming (doesn't require closing ```)
              const phpMatch = fullCode.match(/```php\n([\s\S]*?)(?:```|$)/);
              const cssMatch = fullCode.match(/```css\n([\s\S]*?)(?:```|$)/);
              const jsMatch = fullCode.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

              if (phpMatch) onProjectUpdate(projectId, 'php', phpMatch[1].trim());
              if (cssMatch) onProjectUpdate(projectId, 'css', cssMatch[1].trim());
              if (jsMatch) onProjectUpdate(projectId, 'js', jsMatch[1].trim());
            } else {
              // Use lenient regex that works during streaming (doesn't require closing ```)
              const htmlMatch = fullCode.match(/```html\n([\s\S]*?)(?:```|$)/);
              const cssMatch = fullCode.match(/```css\n([\s\S]*?)(?:```|$)/);
              const jsMatch = fullCode.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

              if (htmlMatch) onProjectUpdate(projectId, 'html', htmlMatch[1].trim());
              if (cssMatch) onProjectUpdate(projectId, 'css', cssMatch[1].trim());
              if (jsMatch) onProjectUpdate(projectId, 'js', jsMatch[1].trim());
            }
          }

          // Update progress based on content length (visual feedback only)
          if (projectType === 'html') {
            if (fullCode.length > 500 && currentPhase === 'html') {
              setCurrentPhase('css');
              setProgress('Generating CSS...');
            } else if (fullCode.length > 1500 && currentPhase === 'css') {
              setCurrentPhase('js');
              setProgress('Generating JavaScript...');
            }
          }
          // For Elementor, keep showing PHP generation
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

        // Parse final code and call onGenerate ONCE with complete code
        if (projectType === 'elementor') {
          const phpMatch = codeOnly.match(/```php\n([\s\S]*?)```/);
          const cssMatch = codeOnly.match(/```css\n([\s\S]*?)```/);
          const jsMatch = codeOnly.match(/```(?:javascript|js)\n([\s\S]*?)```/);

          onGenerate({
            html: '',
            css: cssMatch ? cssMatch[1].trim() : '',
            js: jsMatch ? jsMatch[1].trim() : '',
            php: phpMatch ? phpMatch[1].trim() : codeOnly.trim(),
            projectName: generatedName,
          });
        } else {
          const htmlMatch = codeOnly.match(/```html\n([\s\S]*?)```/);
          const cssMatch = codeOnly.match(/```css\n([\s\S]*?)```/);
          const jsMatch = codeOnly.match(/```(?:javascript|js)\n([\s\S]*?)```/);

          onGenerate({
            html: htmlMatch ? htmlMatch[1].trim() : '',
            css: cssMatch ? cssMatch[1].trim() : '',
            js: jsMatch ? jsMatch[1].trim() : '',
            projectName: generatedName,
          });
        }

        setProgress('✅ Generation complete!');
        setGenerating(false);
        // Don't auto-close - let user view stats and close manually

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
            {isConversionMode ? '⚡ Convert to Elementor Widget' : '🚀 Generate New Project'}
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--muted-foreground)' }}>
            {step === 'type' && 'Choose your project type'}
            {step === 'description' && (isConversionMode ? 'Converting your existing HTML/CSS/JS to an Elementor widget' : 'Describe what you want to create')}
            {step === 'generating' && (isConversionMode ? 'Converting to widget...' : 'Generating your project...')}
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
                    Complete PHP widget class ready for Elementor (no conversion needed)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Step 2: Description Input */}
          {step === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isConversionMode && (
                <div style={{
                  padding: '12px',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}>
                  <strong>📋 Existing code detected:</strong> Your HTML ({existingCode?.html?.length || 0} chars), CSS ({existingCode?.css?.length || 0} chars), and JS ({existingCode?.js?.length || 0} chars) will be converted to an Elementor widget. You can add optional instructions below to customize the conversion.
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  {isConversionMode ? 'Conversion Instructions (Optional)' : 'Project Description *'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isConversionMode
                    ? "E.g., Make all text editable, add color controls, include hover effects"
                    : "E.g., A modern hero section with gradient background, call-to-action button, and image"}
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

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  {Object.entries(MODEL_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  Recommended: <strong>Claude Sonnet 4.5</strong> for best quality
                </p>
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
                {currentPhase === 'php' && '🐘'}
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
              onClick={(step === 'description' && !isConversionMode) ? handleBack : handleClose}
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
              {(step === 'description' && !isConversionMode) ? '← Back' : 'Cancel'}
            </button>
            <button
              onClick={handleNext}
              disabled={step === 'description' && !isConversionMode && !description.trim()}
              style={{
                padding: '10px 20px',
                background: (step === 'description' && !isConversionMode && !description.trim()) ? 'var(--muted)' : 'var(--primary)',
                color: (step === 'description' && !isConversionMode && !description.trim()) ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
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

        {/* Footer for completed generation */}
        {step === 'generating' && !generating && (
          <div
            style={{
              padding: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <button
              onClick={handleClose}
              style={{
                padding: '12px 32px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✓ Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
