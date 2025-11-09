'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AiFillHtml5 } from 'react-icons/ai';
import { FaWordpress } from 'react-icons/fa';
import { SiHubspot } from 'react-icons/si';
import { streamWithLegacyCallbacks } from '@/lib/project-generation/streaming';
import { getAvailableModels, getModelsByProvider, getProjectConfig } from '@/lib/project-generation/config';
import { getModelContextLimit, estimateTokenCount } from '@/lib/token-validator';
import { SystemPromptViewer } from '@/components/ui/SystemPromptViewer';
import type { ProjectType } from '@/lib/project-generation/types';

interface GenerateProjectWidgetProps {
  toolResult: {
    status: string;
    projectType: string;
    projectName: string;
    description: string;
    timestamp: string;
    message: string;
  };
  onProjectCreate?: (name: string, type: 'html' | 'php' | 'hubspot', generationState?: 'generating' | 'ready' | 'error', subtype?: string) => string; // Returns new project ID
  onProjectUpdate?: (projectId: string, file: string, content: string) => void;
  onProjectMetadataUpdate?: (projectId: string, metadata: any) => void; // Update plugin metadata
  onProjectStateUpdate?: (projectId: string, state: 'generating' | 'ready' | 'error', error?: string) => void; // Update generation state
  onSwitchCodeTab?: (tab: string) => void;
  onSwitchTab?: (tab: string) => void; // Switch main tab (e.g., to 'json')
  isEditorReady?: (fileType: string) => boolean; // Check if editor is mounted and ready
  defaultModel?: string;
  globalCSS?: string; // Pass global CSS from parent
  targetWidgetId?: string;
  existingProjectId?: string;
  targetWidgetLabel?: string;
  targetPluginName?: string;
}

export function GenerateProjectWidget({
  toolResult,
  onProjectCreate,
  onProjectUpdate,
  onProjectMetadataUpdate,
  onProjectStateUpdate,
  onSwitchCodeTab,
  onSwitchTab,
  isEditorReady,
  defaultModel = 'anthropic/claude-haiku-4-5-20251001',
  globalCSS,
  targetWidgetId,
  existingProjectId,
  targetWidgetLabel,
  targetPluginName
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
  const isWidgetGeneration = Boolean(targetWidgetId && existingProjectId);

  useEffect(() => {
    if (isWidgetGeneration && projectType !== 'elementor') {
      setProjectType('elementor');
    }
  }, [isWidgetGeneration, projectType]);

  // Get models grouped by provider for dropdown
  const modelsByProvider = getModelsByProvider();

  // Build system prompt with global CSS if enabled
  const systemPrompt = useMemo(() => {
    const config = getProjectConfig(projectType, hubspotModuleType);
    if (!config) return '';

    let prompt = config.systemPrompt;

    // Add global CSS if enabled and available
    if (includeGlobalCSS && globalCSS && globalCSS.trim().length > 0) {
      prompt += `\n\n**Global CSS Reference** (use these styles for consistency):\n\`\`\`css\n${globalCSS}\n\`\`\`\n\nUse these colors, fonts, and design patterns to maintain consistency.`;
    }

    return prompt;
  }, [projectType, hubspotModuleType, includeGlobalCSS, globalCSS]);

  // Token counting for system prompt viewer
  const contextLimit = getModelContextLimit(selectedModel);
  const systemTokens = estimateTokenCount(systemPrompt);
  let inputTokens = estimateTokenCount(description);

  // Add vision tokens for images (if included)
  // Approximate: 765 tokens per image for high-res vision
  if (includeImages && uploadedImages.length > 0) {
    const visionTokens = uploadedImages.length * 765;
    inputTokens += visionTokens;
  }

  const totalTokens = systemTokens + inputTokens;
  const conversationTokens = 0; // No conversation history in generation
  const canGenerate = description.trim().length > 0 && (!isWidgetGeneration ? projectName.trim().length > 0 : true);

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

    if ((!existingProjectId || !targetWidgetId || projectType !== 'elementor') && (!onProjectCreate || !onProjectUpdate)) {
      console.error('❌ Missing callbacks!');
      setProgress('❌ Error: Project creation callbacks not available');
      setGenerating(false);
      return;
    }

    const reuseExistingProject = projectType === 'elementor' && !!targetWidgetId && !!existingProjectId;
    let projectId: string | undefined;
    const widgetTarget = reuseExistingProject ? targetWidgetId! : undefined;

    if (reuseExistingProject) {
      projectId = existingProjectId!;
      console.log('[ElementorFlow] Reusing existing plugin for widget generation:', { projectId, widgetTarget });
      if (onProjectStateUpdate) {
        onProjectStateUpdate(projectId, 'generating');
      }
    } else {
      projectId = onProjectCreate!(
        projectName,
        projectType === 'elementor' ? 'php' : projectType === 'hubspot' ? 'hubspot' : 'html',
        'generating',
        projectType === 'hubspot' ? hubspotModuleType : undefined
      );
      console.log('📦 Created project via widget:', projectName, 'ID:', projectId, 'State: generating');
      if (projectType === 'elementor') {
        console.warn('[ElementorFlow] No widget slot specified; generation will use placeholder');
      }
    }

    if (!projectId) {
      setProgress('❌ Error: Unable to determine project ID');
      setGenerating(false);
      return;
    }

    if (!reuseExistingProject) {
      // Switch to Code Editor tab
      if (onSwitchTab) {
        onSwitchTab('json');
        console.log('📑 Switched to Code Editor tab');
      }

      // Switch to appropriate file tab
      const targetFileType = projectType === 'elementor' ? 'php' : 'html';
      if (onSwitchCodeTab) {
        onSwitchCodeTab(targetFileType as any);
      }

      // Wait for Monaco editor to actually mount
      if (isEditorReady) {
        console.log(`⏳ Waiting for ${targetFileType} editor to mount...`);
        const startTime = Date.now();
        const maxWaitTime = 5000;

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
        console.warn('⚠️ isEditorReady callback not provided, using 300ms delay fallback');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else if (widgetTarget) {
      const normalized = widgetTarget.startsWith('widget:') ? widgetTarget : `widget:${widgetTarget}`;
      if (onSwitchCodeTab) {
        onSwitchCodeTab(normalized);
      }
      console.log('[ElementorFlow] Skipping plugin tab auto-switch; targeting widget slot', { projectId, normalized });
    }

    try {
      // Use unified streaming with legacy callbacks
      await streamWithLegacyCallbacks(
        {
          projectType: projectType as ProjectType,
          projectName,
          description,
          subtype: projectType === 'hubspot' ? hubspotModuleType : undefined,
          images: includeImages && uploadedImages.length > 0 ? uploadedImages : [],
          model: selectedModel,
          globalCSS: includeGlobalCSS ? globalCSS : undefined,
          targetWidgetId: widgetTarget,
        },
        projectId,
        {
          onProjectUpdate,
          onProjectMetadataUpdate,
          onProjectStateUpdate,
          onSwitchCodeTab,
          setProgress,
          setCurrentPhase
        }
      );

      console.log('✅ Generation complete!');

    } catch (error: any) {
      setProgress(`❌ Error: ${error.message}`);

      // Mark generation as failed
      if (onProjectStateUpdate && projectId) {
        onProjectStateUpdate(projectId, 'error', error.message);
        console.log('❌ Project generation failed, state updated to error');
      }
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
    targetWidgetId,
    existingProjectId,
    onProjectCreate,
    onProjectUpdate,
    onProjectMetadataUpdate,
    onProjectStateUpdate,
    onSwitchCodeTab,
    onSwitchTab,
    isEditorReady
  ]);

  const getProjectTypeLabel = () => {
    if (isWidgetGeneration) return 'Elementor Widget (existing plugin)';
    if (projectType === 'elementor') return 'Elementor Plugin (with Widget)';
    if (projectType === 'hubspot') return `HubSpot ${hubspotModuleType === 'email' ? 'Email' : 'Page'} Module`;
    return 'HTML Section';
  };

  const headerTitle = isWidgetGeneration ? 'Generate Elementor Widget' : 'Generate New Project';
  const headerSubtitle = isWidgetGeneration
    ? `Streams into ${targetPluginName || 'current plugin'}`
    : 'Configure settings and start generation';
  const widgetDisplayName = targetWidgetLabel || targetWidgetId || 'Widget Slot';
  const pluginDisplayName = targetPluginName || existingProjectId || 'Current Plugin';

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
            {headerTitle}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {headerSubtitle}
          </p>
        </div>
      </div>

      {/* Target summary or Project Name */}
      {isWidgetGeneration ? (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'var(--muted)',
          fontSize: '13px'
        }}>
          <div><strong>Plugin:</strong> {pluginDisplayName}</div>
          <div><strong>Widget Slot:</strong> {widgetDisplayName}</div>
        </div>
      ) : (
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
      )}

      {/* Description (Editable) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
          {isWidgetGeneration ? 'Widget Brief' : 'Description'}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            AI Model
          </label>
          <SystemPromptViewer
            input={description}
            systemPrompt={systemPrompt}
            selectedModel={selectedModel}
            contextLimit={contextLimit}
            systemTokens={systemTokens}
            inputTokens={inputTokens}
            conversationTokens={conversationTokens}
            totalTokens={totalTokens}
            trigger={
              <button
                type="button"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                📋 View Prompt
              </button>
            }
          />
        </div>
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
          {Object.entries(modelsByProvider).map(([provider, models]) => (
            <optgroup key={provider} label={provider.charAt(0).toUpperCase() + provider.slice(1)}>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Project Type Selector */}
      {!isWidgetGeneration && (
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
      )}

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
                padding: '10px',
                background: hubspotModuleType === 'page' ? 'var(--primary)' : 'var(--muted)',
                color: hubspotModuleType === 'page' ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: `2px solid ${hubspotModuleType === 'page' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              📄 Page Module
            </button>
            <button
              onClick={() => setHubspotModuleType('email')}
              disabled={generating}
              style={{
                flex: 1,
                padding: '10px',
                background: hubspotModuleType === 'email' ? 'var(--primary)' : 'var(--muted)',
                color: hubspotModuleType === 'email' ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: `2px solid ${hubspotModuleType === 'email' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              ✉️ Email Module
            </button>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            {hubspotModuleType === 'email'
              ? '⚠️ Email: Uses table layouts with inline CSS for email client compatibility'
              : '✨ Page: Uses modern HTML5, CSS Grid/Flexbox, and JavaScript'
            }
          </p>
        </div>
      )}

      {/* Image Upload */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <input
            type="checkbox"
            id="include-images"
            checked={includeImages}
            onChange={(e) => setIncludeImages(e.target.checked)}
            disabled={generating}
          />
          <label htmlFor="include-images" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Include Reference Images (max 3)
          </label>
        </div>
        {includeImages && (
          <div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              onChange={handleImageSelect}
              disabled={generating || uploadedImages.length >= 3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: generating || uploadedImages.length >= 3 ? 'not-allowed' : 'pointer',
              }}
            />
            {uploadedImages.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {uploadedImages.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      width: '80px',
                      height: '80px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '2px solid var(--border)',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.filename}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => removeImage(i)}
                      disabled={generating}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global CSS Option (only for HTML/HubSpot) */}
      {(!isWidgetGeneration && (projectType === 'html' || projectType === 'hubspot') && globalCSS) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="include-global-css"
              checked={includeGlobalCSS}
              onChange={(e) => setIncludeGlobalCSS(e.target.checked)}
              disabled={generating}
            />
            <label htmlFor="include-global-css" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Include Global CSS for Consistency
            </label>
          </div>
        </div>
      )}

      {/* Current Configuration Summary */}
      <div style={{
        background: 'var(--muted)',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '16px',
        fontSize: '13px',
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Configuration:</strong>
        </div>
        <div style={{ color: 'var(--muted-foreground)' }}>
          • Type: {getProjectTypeLabel()}
        </div>
        <div style={{ color: 'var(--muted-foreground)' }}>
          • Model: {modelsByProvider[Object.keys(modelsByProvider).find(provider =>
            modelsByProvider[provider].some(m => m.id === selectedModel)
          )!]?.find(m => m.id === selectedModel)?.name || selectedModel}
        </div>
        {isWidgetGeneration && (
          <>
            <div style={{ color: 'var(--muted-foreground)' }}>
              • Plugin: {pluginDisplayName}
            </div>
            <div style={{ color: 'var(--muted-foreground)' }}>
              • Widget Slot: {widgetDisplayName}
            </div>
          </>
        )}
        {includeImages && uploadedImages.length > 0 && (
          <div style={{ color: 'var(--muted-foreground)' }}>
            • Images: {uploadedImages.length} reference image{uploadedImages.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !canGenerate}
        style={{
          width: '100%',
          padding: '12px 24px',
          background: generating ? 'var(--muted)' : 'var(--primary)',
          color: generating ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: generating || !canGenerate ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {generating ? '⏳ Generating...' : isWidgetGeneration ? '🚀 Generate Widget' : '🚀 Generate Project'}
      </button>

      {/* Progress */}
      {generating && progress && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--muted)',
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          {progress}
          {currentPhase && (
            <div style={{ marginTop: '4px', color: 'var(--muted-foreground)' }}>
              Current phase: {currentPhase.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
