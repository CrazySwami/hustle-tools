'use client';

import { useState } from 'react';

interface GenerateProjectWidgetProps {
  toolResult: {
    status: string;
    projectType: string;
    projectName: string;
    description: string;
    timestamp: string;
    message: string;
  };
}

export function GenerateProjectWidget({ toolResult }: GenerateProjectWidgetProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress('Starting project generation...');

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
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullCode += chunk;
          setProgress(`Generating... ${fullCode.length} characters`);
        }
      }

      setProgress(`✅ Generation complete! ${fullCode.length} characters`);

      // TODO: Parse HTML/CSS/JS and update editor
      // This will be handled by the parent component

    } catch (error: any) {
      setProgress(`❌ Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

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
