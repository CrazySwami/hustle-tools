'use client';

import { useState, useCallback } from 'react';
import { AiFillHtml5 } from 'react-icons/ai';
import { FaWordpress } from 'react-icons/fa';
import { SiHubspot } from 'react-icons/si';

interface GenerateProjectWidgetProps {
  toolResult: {
    status: string;
    projectType: string;
    projectName: string;
    description: string;
    timestamp: string;
    message: string;
  };
  onProjectCreate?: (name: string, type: 'html' | 'php' | 'hubspot') => string; // Returns new project ID
  onProjectUpdate?: (projectId: string, file: 'html' | 'css' | 'js' | 'php' | 'hubl', content: string) => void;
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js' | 'php' | 'hubl') => void;
  onSwitchTab?: (tab: string) => void; // Switch main tab (e.g., to 'json')
  isEditorReady?: (fileType: string) => boolean; // Check if editor is mounted and ready
  defaultModel?: string;
  globalCSS?: string; // Pass global CSS from parent
}

export function GenerateProjectWidget({
  toolResult,
  onProjectCreate,
  onProjectUpdate,
  onSwitchCodeTab,
  onSwitchTab,
  isEditorReady,
  defaultModel = 'anthropic/claude-sonnet-4-5-20250929',
  globalCSS
}: GenerateProjectWidgetProps) {
  // Configuration state
  const [projectName, setProjectName] = useState(toolResult.projectName);
  const [description, setDescription] = useState(toolResult.description);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [projectType, setProjectType] = useState<'html' | 'elementor' | 'hubspot'>(
    toolResult.projectType === 'elementor' ? 'elementor' :
    toolResult.projectType === 'hubspot' ? 'hubspot' : 'html'
  );
  const [hubspotModuleType, setHubspotModuleType] = useState<'email' | 'page'>('page');
  const [includeGlobalCSS, setIncludeGlobalCSS] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; filename: string }>>([]);
  const [includeImages, setIncludeImages] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'html' | 'css' | 'js' | 'php' | 'hubl' | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file =>
      ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      alert('Only PNG and JPEG images are supported');
    }

    const remainingSlots = 3 - uploadedImages.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      if (uploadedImages.length >= 3) {
        alert('Maximum 3 images allowed');
      }
      return;
    }

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImages(prev => [...prev, { url: dataUrl, filename: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = useCallback(async () => {
    console.log('🚀 GenerateProjectWidget: Starting generation');

    setGenerating(true);
    setProgress('Starting project generation...');

    if (!onProjectCreate || !onProjectUpdate) {
      console.error('❌ Missing callbacks!');
      setProgress('❌ Error: Project creation callbacks not available');
      setGenerating(false);
      return;
    }

    // Create project FIRST (use editable projectName)
    const projectId = onProjectCreate(
      projectName,
      projectType === 'elementor' ? 'php' : projectType === 'hubspot' ? 'hubspot' : 'html'
    );

    console.log('📦 Created project via widget:', projectName, 'ID:', projectId);

    // Switch to Code Editor tab
    if (onSwitchTab) {
      onSwitchTab('json');
      console.log('📑 Switched to Code Editor tab');
    }

    // Switch to appropriate file tab
    const targetFileType = projectType === 'elementor' ? 'php' : 'html';
    if (onSwitchCodeTab) {
      if (projectType === 'elementor') {
        onSwitchCodeTab('php');
      } else if (projectType === 'hubspot') {
        onSwitchCodeTab('html');
      } else {
        onSwitchCodeTab('html');
      }
    }

    // Wait for Monaco editor to actually mount (not just arbitrary delay)
    // Check every 50ms, max 5 seconds timeout
    if (isEditorReady) {
      console.log(`⏳ Waiting for ${targetFileType} editor to mount...`);
      const startTime = Date.now();
      const maxWaitTime = 5000; // 5 seconds max

      while (!isEditorReady(targetFileType)) {
        if (Date.now() - startTime > maxWaitTime) {
          console.warn(`⚠️ Timeout waiting for ${targetFileType} editor (${maxWaitTime}ms). Proceeding anyway...`);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const waitTime = Date.now() - startTime;
      console.log(`✅ ${targetFileType} editor ready after ${waitTime}ms`);
    } else {
      // Fallback to old behavior if isEditorReady not provided
      console.warn('⚠️ isEditorReady callback not provided, using 300ms delay fallback');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description, // Use editable description
          projectType: projectType,
          projectName: projectName, // Use editable projectName
          model: selectedModel, // Use selected model from dropdown
          globalCSS: includeGlobalCSS ? globalCSS : undefined,
          hubspotModuleType: projectType === 'hubspot' ? hubspotModuleType : undefined,
          images: includeImages && uploadedImages.length > 0 ? uploadedImages : [],
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullCode = '';

      if (reader) {
        // Set initial phase
        if (projectType === 'elementor') {
          setCurrentPhase('php');
          setProgress('Generating PHP Widget...');
        } else if (projectType === 'hubspot') {
          setCurrentPhase('html');
          setProgress('Generating HTML...');
        } else {
          setCurrentPhase('html');
          setProgress('Generating HTML...');
        }

        let loggedFirstChunk = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullCode += chunk;

          // DEBUG: Log the first chunk and format to diagnose regex matching
          if (!loggedFirstChunk && fullCode.length > 0) {
            console.log('🔍 First 500 chars of API response:', fullCode.substring(0, 500));
            console.log('🔍 Chunk received:', chunk);
            loggedFirstChunk = true;
          }

          // Stream updates to project files
          if (projectId && onProjectUpdate) {
            console.log(`🔍 Checking matches for projectType: ${projectType}, fullCode length: ${fullCode.length}`);
            if (projectType === 'elementor') {
              // Elementor widgets: Only PHP file with inline CSS/JS
              const phpMatch = fullCode.match(/```php\n([\s\S]*?)(?:```|$)/);

              console.log(`🔍 Elementor PHP match: ${!!phpMatch}`);

              if (phpMatch) {
                console.log(`📝 Widget streaming PHP (${phpMatch[1].trim().length} chars)`);
                onProjectUpdate(projectId, 'php', phpMatch[1].trim());
              }
            } else if (projectType === 'hubspot') {
              const htmlMatch = fullCode.match(/```html\n([\s\S]*?)(?:```|$)/);
              const hublMatch = fullCode.match(/```hubl\n([\s\S]*?)(?:```|$)/);

              console.log(`🔍 HubSpot matches: HTML=${!!htmlMatch}, HubL=${!!hublMatch}`);

              if (htmlMatch) {
                console.log(`📝 Widget streaming HTML (${htmlMatch[1].trim().length} chars)`);
                onProjectUpdate(projectId, 'html', htmlMatch[1].trim());
              }
              if (hublMatch) {
                console.log(`📝 Widget streaming HubL (${hublMatch[1].trim().length} chars)`);
                onProjectUpdate(projectId, 'hubl', hublMatch[1].trim());
              }
            } else {
              const htmlMatch = fullCode.match(/```html\n([\s\S]*?)(?:```|$)/);
              const cssMatch = fullCode.match(/```css\n([\s\S]*?)(?:```|$)/);
              const jsMatch = fullCode.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

              console.log(`🔍 HTML project matches: HTML=${!!htmlMatch}, CSS=${!!cssMatch}, JS=${!!jsMatch}`);

              if (htmlMatch) {
                console.log(`📝 Widget streaming HTML (${htmlMatch[1].trim().length} chars)`);
                onProjectUpdate(projectId, 'html', htmlMatch[1].trim());
              }
              if (cssMatch) {
                console.log(`📝 Widget streaming CSS (${cssMatch[1].trim().length} chars)`);
                onProjectUpdate(projectId, 'css', cssMatch[1].trim());
              }
              if (jsMatch) {
                console.log(`📝 Widget streaming JS (${jsMatch[1].trim().length} chars)`);
                onProjectUpdate(projectId, 'js', jsMatch[1].trim());
              }
            }

            // Auto-switch tabs during generation
            if (projectType === 'html') {
              if (fullCode.length > 500 && currentPhase === 'html') {
                setCurrentPhase('css');
                setProgress('Generating CSS...');
                onSwitchCodeTab?.('css');
              } else if (fullCode.length > 1500 && currentPhase === 'css') {
                setCurrentPhase('js');
                setProgress('Generating JavaScript...');
                onSwitchCodeTab?.('js');
              }
            } else if (projectType === 'hubspot') {
              if (fullCode.length > 500 && currentPhase === 'html') {
                setCurrentPhase('hubl');
                setProgress('Generating HubL...');
                onSwitchCodeTab?.('html');
              }
            }
          }
        }

        setProgress(`✅ Generation complete!`);
      }
    } catch (error: any) {
      setProgress(`❌ Error: ${error.message}`);
    } finally {
      setGenerating(false);
      setCurrentPhase(null);
    }
  }, [
    projectName,
    description,
    selectedModel,
    projectType,
    hubspotModuleType,
    includeGlobalCSS,
    includeImages,
    uploadedImages,
    globalCSS,
    onProjectCreate,
    onProjectUpdate,
    onSwitchCodeTab,
    onSwitchTab,
    currentPhase
  ]);

  const getProjectTypeLabel = () => {
    if (projectType === 'elementor') return 'Elementor Widget (PHP)';
    if (projectType === 'hubspot') return `HubSpot ${hubspotModuleType === 'email' ? 'Email' : 'Page'} Module`;
    return 'HTML Section';
  };

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '20px',
      margin: '12px 0',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '24px' }}>🚀</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Generate New Project
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Configure settings and start generation
          </p>
        </div>
      </div>

      {/* Project Name (Editable) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
          Project Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={generating}
          placeholder="Enter project name"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '13px',
            background: 'var(--background)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Description (Editable) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={generating}
          placeholder="Describe what you want to generate"
          rows={3}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '13px',
            background: 'var(--background)',
            color: 'var(--foreground)',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Model Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
          AI Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={generating}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '13px',
            background: 'var(--background)',
            color: 'var(--foreground)',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          <optgroup label="Claude">
            <option value="anthropic/claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
            <option value="anthropic/claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
            <option value="anthropic/claude-opus-4-1-20250805">Claude Opus 4.1</option>
            <option value="anthropic/claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
            <option value="anthropic/claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
          </optgroup>
          <optgroup label="OpenAI">
            <option value="openai/gpt-5">GPT-5</option>
            <option value="openai/gpt-5-mini">GPT-5 Mini</option>
            <option value="openai/gpt-5-nano">GPT-5 Nano</option>
            <option value="openai/gpt-4o">GPT-4o</option>
            <option value="openai/o3">o3</option>
          </optgroup>
          <optgroup label="Google">
            <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
          </optgroup>
          <optgroup label="Perplexity">
            <option value="perplexity/sonar">Sonar</option>
            <option value="perplexity/sonar-pro">Sonar Pro</option>
            <option value="perplexity/sonar-reasoning">Sonar Reasoning</option>
            <option value="perplexity/sonar-reasoning-pro">Sonar Reasoning Pro</option>
          </optgroup>
        </select>
      </div>

      {/* Project Type Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
          Project Type
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setProjectType('html')}
            disabled={generating}
            style={{
              flex: '1 1 auto',
              minWidth: '120px',
              padding: '10px 16px',
              background: projectType === 'html' ? 'var(--primary)' : 'var(--muted)',
              color: projectType === 'html' ? 'var(--primary-foreground)' : 'var(--foreground)',
              border: `2px solid ${projectType === 'html' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '6px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <AiFillHtml5 size={16} />
            HTML
          </button>
          <button
            onClick={() => setProjectType('elementor')}
            disabled={generating}
            style={{
              flex: '1 1 auto',
              minWidth: '120px',
              padding: '10px 16px',
              background: projectType === 'elementor' ? 'var(--primary)' : 'var(--muted)',
              color: projectType === 'elementor' ? 'var(--primary-foreground)' : 'var(--foreground)',
              border: `2px solid ${projectType === 'elementor' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '6px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <FaWordpress size={16} />
            Elementor
          </button>
          <button
            onClick={() => setProjectType('hubspot')}
            disabled={generating}
            style={{
              flex: '1 1 auto',
              minWidth: '120px',
              padding: '10px 16px',
              background: projectType === 'hubspot' ? 'var(--primary)' : 'var(--muted)',
              color: projectType === 'hubspot' ? 'var(--primary-foreground)' : 'var(--foreground)',
              border: `2px solid ${projectType === 'hubspot' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '6px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <SiHubspot size={16} />
            HubSpot
          </button>
        </div>
      </div>

      {/* HubSpot Module Type (only show if HubSpot is selected) */}
      {projectType === 'hubspot' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
            Module Type
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setHubspotModuleType('page')}
              disabled={generating}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: hubspotModuleType === 'page' ? 'var(--primary)' : 'var(--muted)',
                color: hubspotModuleType === 'page' ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: `2px solid ${hubspotModuleType === 'page' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              Page Module
            </button>
            <button
              onClick={() => setHubspotModuleType('email')}
              disabled={generating}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: hubspotModuleType === 'email' ? 'var(--primary)' : 'var(--muted)',
                color: hubspotModuleType === 'email' ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: `2px solid ${hubspotModuleType === 'email' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              Email Module
            </button>
          </div>
        </div>
      )}

      {/* Include Images Toggle */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '10px',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          background: includeImages ? 'var(--primary)/10' : 'transparent',
          transition: 'all 0.2s',
        }}>
          <input
            type="checkbox"
            checked={includeImages}
            onChange={(e) => setIncludeImages(e.target.checked)}
            disabled={generating}
            style={{ margin: 0, cursor: 'pointer' }}
          />
          <div style={{ flex: 1, fontSize: '13px' }}>
            Include Reference Images (max 3)
          </div>
        </label>

        {includeImages && (
          <div style={{ marginTop: '10px' }}>
            {uploadedImages.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '8px',
                marginBottom: '10px',
              }}>
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      paddingBottom: '100%',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.filename}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedImages.length < 3 && (
              <label style={{
                display: 'block',
                padding: '10px',
                border: '2px dashed var(--border)',
                borderRadius: '6px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                transition: 'all 0.2s',
              }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  onChange={handleImageSelect}
                  disabled={generating}
                  style={{ display: 'none' }}
                />
                📷 Upload images ({3 - uploadedImages.length} remaining)
              </label>
            )}
          </div>
        )}
      </div>

      {/* Include Global CSS Toggle */}
      {globalCSS && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '10px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: includeGlobalCSS ? 'var(--primary)/10' : 'transparent',
            transition: 'all 0.2s',
          }}>
            <input
              type="checkbox"
              checked={includeGlobalCSS}
              onChange={(e) => setIncludeGlobalCSS(e.target.checked)}
              disabled={generating}
              style={{ margin: 0, cursor: 'pointer' }}
            />
            <div style={{ flex: 1, fontSize: '13px' }}>
              Include Global CSS ({globalCSS.length.toLocaleString()} chars)
            </div>
          </label>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div style={{
          background: generating ? 'var(--primary)/10' : 'var(--muted)',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '16px',
          fontSize: '12px',
          fontFamily: 'monospace',
          textAlign: 'center',
        }}>
          {progress}
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          width: '100%',
          padding: '12px',
          background: generating ? 'var(--muted)' : 'var(--primary)',
          color: generating ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: generating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {generating ? '⏳ Generating...' : `🚀 Generate ${getProjectTypeLabel()}`}
      </button>

      <p style={{
        margin: '12px 0 0 0',
        fontSize: '11px',
        color: 'var(--muted-foreground)',
        textAlign: 'center',
      }}>
        Code will stream into the editor in real-time
      </p>
    </div>
  );
}
