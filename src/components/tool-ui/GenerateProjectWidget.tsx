'use client';

import { useState, useEffect, useCallback } from 'react';

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
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js') => void;
}

export function GenerateProjectWidget({ toolResult, onProjectCreate, onProjectUpdate, onSwitchCodeTab }: GenerateProjectWidgetProps) {
  console.log('🎨 GenerateProjectWidget mounted:', {
    projectName: toolResult.projectName,
    projectType: toolResult.projectType,
    hasOnProjectCreate: !!onProjectCreate,
    hasOnProjectUpdate: !!onProjectUpdate
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'html' | 'css' | 'js' | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const handleGenerate = useCallback(async () => {
    console.log('🚀 GenerateProjectWidget: handleGenerate called');
    console.log('📋 Callbacks available:', {
      hasProjectCreate: !!onProjectCreate,
      hasProjectUpdate: !!onProjectUpdate,
      hasSwitchCodeTab: !!onSwitchCodeTab
    });

    setGenerating(true);
    setProgress('Starting project generation...');

    // Check if callbacks are available
    if (!onProjectCreate || !onProjectUpdate) {
      console.error('❌ Missing callbacks!', {
        onProjectCreate: !!onProjectCreate,
        onProjectUpdate: !!onProjectUpdate
      });
      setProgress('❌ Error: Project creation callbacks not available');
      setGenerating(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: toolResult.description,
          projectType: toolResult.projectType,
          projectName: toolResult.projectName,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullCode = '';

      if (reader) {
        // Create project ONCE at the start
        const displayName = toolResult.projectName
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const projectId = onProjectCreate(
          displayName,
          toolResult.projectType === 'elementor' ? 'php' : 'html'
        );

        console.log('📦 Created project via GenerateProjectWidget:', displayName, 'ID:', projectId);

        // Set initial phase
        setCurrentPhase('html');
        setProgress('Generating HTML...');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullCode += chunk;

          // Stream updates to project files in real-time
          if (projectId && onProjectUpdate) {
            // Use lenient regex that works during streaming (doesn't require closing ```)
            const htmlMatch = fullCode.match(/```html\n([\s\S]*?)(?:```|$)/);
            const cssMatch = fullCode.match(/```css\n([\s\S]*?)(?:```|$)/);
            const jsMatch = fullCode.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

            if (htmlMatch) {
              onProjectUpdate(projectId, 'html', htmlMatch[1].trim());
            }
            if (cssMatch) {
              onProjectUpdate(projectId, 'css', cssMatch[1].trim());
            }
            if (jsMatch) {
              onProjectUpdate(projectId, 'js', jsMatch[1].trim());
            }

            // Update progress based on content length (visual feedback)
            if (fullCode.length > 500 && currentPhase === 'html') {
              setCurrentPhase('css');
              setProgress('Generating CSS...');
              onSwitchCodeTab?.('css');
            } else if (fullCode.length > 1500 && currentPhase === 'css') {
              setCurrentPhase('js');
              setProgress('Generating JavaScript...');
              onSwitchCodeTab?.('js');
            }
          }
        }

        setProgress(`✅ Generation complete! ${fullCode.length} characters`);
      }

    } catch (error: any) {
      setProgress(`❌ Error: ${error.message}`);
    } finally {
      setGenerating(false);
      setCurrentPhase(null);
    }
  }, [toolResult, onProjectCreate, onProjectUpdate, onSwitchCodeTab, currentPhase]);

  // Auto-start generation when component mounts
  useEffect(() => {
    if (!hasStarted) {
      console.log('🚀 GenerateProjectWidget: Auto-starting generation on mount');
      setHasStarted(true);
      handleGenerate(); // Call the generation function immediately
    }
  }, [hasStarted, handleGenerate]);

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '20px',
      margin: '12px 0',
    }}>
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
            {toolResult.message}
          </p>
        </div>
      </div>

      <div style={{
        background: 'var(--muted)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px',
        fontSize: '13px',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Project Name:</strong> {toolResult.projectName}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Type:</strong> {toolResult.projectType === 'html' ? 'HTML Section' : 'Elementor Widget'}
        </div>
        <div>
          <strong>Description:</strong> {toolResult.description}
        </div>
      </div>

      {progress && (
        <div style={{
          background: generating ? 'var(--primary)/10' : 'var(--muted)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          fontFamily: 'monospace',
        }}>
          {progress}
        </div>
      )}

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
        {generating ? '⏳ Generating...' : '🚀 Start Generation'}
      </button>

      <p style={{
        margin: '12px 0 0 0',
        fontSize: '12px',
        color: 'var(--muted-foreground)',
        textAlign: 'center',
      }}>
        This will generate HTML, CSS, and JS code and create a new section in your library
      </p>
    </div>
  );
}
