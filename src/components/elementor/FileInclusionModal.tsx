'use client';

import { useState, useEffect } from 'react';
import { FileGroup } from '@/lib/file-group-manager';
import { X } from 'lucide-react';
import { DiHtml5, DiCss3, DiJavascript1, DiPhp } from 'react-icons/di';
import { SiHubspot } from 'react-icons/si';
import { FileText } from 'lucide-react';

interface FileInclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FileGroup | null;
  onSave: (inclusions: FileInclusions) => void;
  currentInclusions: FileInclusions;
}

export interface FileInclusions {
  html: boolean;
  css: boolean;
  js: boolean;
  php: boolean;
  hubl: boolean;
  pluginMainFile: boolean;
  readme: boolean;
}

export function FileInclusionModal({
  isOpen,
  onClose,
  project,
  onSave,
  currentInclusions,
}: FileInclusionModalProps) {
  const [inclusions, setInclusions] = useState<FileInclusions>(currentInclusions);

  // Reset to current inclusions when modal opens
  useEffect(() => {
    if (isOpen) {
      setInclusions(currentInclusions);
    }
  }, [isOpen, currentInclusions]);

  if (!isOpen || !project) return null;

  const handleToggle = (file: keyof FileInclusions) => {
    setInclusions(prev => ({ ...prev, [file]: !prev[file] }));
  };

  const handleSave = () => {
    onSave(inclusions);
    onClose();
  };

  const handleSelectAll = () => {
    setInclusions({
      html: true,
      css: true,
      js: true,
      php: true,
      hubl: true,
      pluginMainFile: true,
      readme: true,
    });
  };

  const handleSelectNone = () => {
    setInclusions({
      html: false,
      css: false,
      js: false,
      php: false,
      hubl: false,
      pluginMainFile: false,
      readme: false,
    });
  };

  // Determine which files exist in this project
  const availableFiles = [
    { key: 'html' as const, label: 'HTML', icon: <DiHtml5 size={20} color="#E34F26" />, exists: project.type === 'html' || project.type === 'hubspot' },
    { key: 'css' as const, label: 'CSS', icon: <DiCss3 size={20} color="#1572B6" />, exists: true },
    { key: 'js' as const, label: 'JavaScript', icon: <DiJavascript1 size={20} color="#F7DF1E" />, exists: true },
    { key: 'php' as const, label: 'Widget PHP', icon: <DiPhp size={20} color="#777BB4" />, exists: project.type === 'php' && !project.isPlugin },
    { key: 'php' as const, label: 'widget.php', icon: <DiPhp size={20} color="#777BB4" />, exists: project.isPlugin },
    { key: 'pluginMainFile' as const, label: 'main-plugin.php', icon: <DiPhp size={20} color="#8B5CF6" />, exists: project.isPlugin && !!project.pluginMainFile },
    { key: 'hubl' as const, label: 'HubL Template', icon: <SiHubspot size={18} color="#FF7A59" />, exists: project.type === 'hubspot' },
    { key: 'readme' as const, label: 'README.md', icon: <FileText size={18} color="#4CAF50" />, exists: !!project.projectManifest },
  ].filter(f => f.exists);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: '#1e1e1e',
        border: '1px solid #3e3e3e',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #3e3e3e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#ffffff',
          }}>
            Select Files to Include in AI Context
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Project Info */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #3e3e3e',
          background: '#252526',
        }}>
          <div style={{ fontSize: '14px', color: '#cccccc', marginBottom: '8px' }}>
            <strong>Project:</strong> {project.name}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Only selected files will be included in the AI's context when you chat.
          </div>
        </div>

        {/* Bulk Actions */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #3e3e3e',
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={handleSelectAll}
            style={{
              padding: '6px 12px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Select All
          </button>
          <button
            onClick={handleSelectNone}
            style={{
              padding: '6px 12px',
              background: '#3e3e3e',
              color: '#cccccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Select None
          </button>
        </div>

        {/* File List */}
        <div style={{ padding: '16px 20px' }}>
          {availableFiles.map(file => (
            <label
              key={file.key + file.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                background: inclusions[file.key] ? '#2a2d2e' : 'transparent',
                border: '1px solid #3e3e3e',
                borderRadius: '6px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={inclusions[file.key]}
                onChange={() => handleToggle(file.key)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginRight: '12px',
                  cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
              }}>
                {file.icon}
                <span style={{
                  fontSize: '14px',
                  color: inclusions[file.key] ? '#ffffff' : '#cccccc',
                  fontWeight: inclusions[file.key] ? 500 : 400,
                }}>
                  {file.label}
                </span>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #3e3e3e',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#3e3e3e',
              color: '#cccccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Save Selection
          </button>
        </div>
      </div>
    </div>
  );
}
