'use client';

import { GenerateProjectWidget } from '@/components/tool-ui/GenerateProjectWidget';

interface GenerateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreate?: (name: string, type: 'html' | 'php' | 'hubspot', generationState?: 'generating' | 'ready' | 'error') => string;
  onProjectUpdate?: (projectId: string, file: 'html' | 'css' | 'js' | 'php' | 'hubl', content: string) => void;
  onProjectMetadataUpdate?: (projectId: string, metadata: any) => void;
  onProjectStateUpdate?: (projectId: string, state: 'generating' | 'ready' | 'error', error?: string) => void;
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js' | 'php' | 'hubl') => void;
  onSwitchTab?: (tab: string) => void;
  isEditorReady?: (fileType: string) => boolean;
  defaultModel?: string;
  globalCSS?: string;
}

/**
 * Dialog wrapper for GenerateProjectWidget
 *
 * IMPORTANT: This is just a dialog wrapper. The actual UI is GenerateProjectWidget.
 * Modal and chat tool use THE EXACT SAME component (GenerateProjectWidget).
 */
export function GenerateProjectDialog({
  isOpen,
  onClose,
  onProjectCreate,
  onProjectUpdate,
  onProjectMetadataUpdate,
  onProjectStateUpdate,
  onSwitchCodeTab,
  onSwitchTab,
  isEditorReady,
  defaultModel,
  globalCSS
}: GenerateProjectDialogProps) {
  if (!isOpen) return null;

  // Mock tool result for modal usage (GenerateProjectWidget expects this)
  const mockToolResult = {
    status: 'generation_started',
    projectType: 'html',
    projectName: 'new_project',
    description: '',
    timestamp: new Date().toISOString(),
    message: 'Ready to generate'
  };

  return (
    <>
      {/* Overlay */}
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
        onClick={onClose}
      >
        {/* Dialog */}
        <div
          style={{
            background: 'var(--background)',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              zIndex: 1,
            }}
            title="Close"
          >
            ×
          </button>

          {/* REUSE EXACT SAME COMPONENT AS TOOL CALL */}
          <GenerateProjectWidget
            toolResult={mockToolResult}
            onProjectCreate={onProjectCreate}
            onProjectUpdate={onProjectUpdate}
            onProjectMetadataUpdate={onProjectMetadataUpdate}
            onProjectStateUpdate={onProjectStateUpdate}
            onSwitchCodeTab={onSwitchCodeTab}
            onSwitchTab={onSwitchTab}
            isEditorReady={isEditorReady}
            defaultModel={defaultModel}
            globalCSS={globalCSS}
          />
        </div>
      </div>
    </>
  );
}
