/**
 * New Group Dialog Component
 *
 * Dialog for creating new file groups (HTML projects or PHP widgets).
 */

'use client';

import { useState } from 'react';

interface NewGroupDialogProps {
  onClose: () => void;
  onCreate: (name: string, type: 'html' | 'php', template: string) => void;
}

export function NewGroupDialog({ onClose, onCreate }: NewGroupDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'html' | 'php'>('html');
  const [template, setTemplate] = useState('empty');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a project name');
      return;
    }

    onCreate(name.trim(), type, template);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#2d2d2d',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          width: '90%',
          maxWidth: '480px',
          border: '1px solid #3e3e3e'
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #3e3e3e'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff'
            }}>
              Create New Project
            </h2>
          </div>

          {/* Body */}
          <div style={{ padding: '24px' }}>
            {/* Name Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cccccc'
              }}>
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Hero Section"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1e1e1e',
                  border: '1px solid #3e3e3e',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007acc';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#3e3e3e';
                }}
              />
            </div>

            {/* Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cccccc'
              }}>
                Project Type
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* HTML Project Option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: type === 'html' ? '#2a2d2e' : '#1e1e1e',
                  border: type === 'html' ? '2px solid #007acc' : '2px solid #3e3e3e',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>
                  <input
                    type="radio"
                    name="type"
                    value="html"
                    checked={type === 'html'}
                    onChange={(e) => setType(e.target.value as 'html' | 'php')}
                    style={{ marginRight: '12px' }}
                  />
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: '4px'
                    }}>
                      📦 HTML Project
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#888'
                    }}>
                      Standard HTML + CSS + JavaScript
                    </div>
                  </div>
                </label>

                {/* PHP Widget Option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: type === 'php' ? '#2a2d2e' : '#1e1e1e',
                  border: type === 'php' ? '2px solid #007acc' : '2px solid #3e3e3e',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>
                  <input
                    type="radio"
                    name="type"
                    value="php"
                    checked={type === 'php'}
                    onChange={(e) => setType(e.target.value as 'html' | 'php')}
                    style={{ marginRight: '12px' }}
                  />
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: '4px'
                    }}>
                      🔧 PHP Widget
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#888'
                    }}>
                      Elementor widget (PHP + CSS + JavaScript)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cccccc'
              }}>
                Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1e1e1e',
                  border: '1px solid #3e3e3e',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="empty">Empty (blank files)</option>
                {type === 'html' ? (
                  <>
                    <option value="hero">Hero Section</option>
                    <option value="contact-form">Contact Form</option>
                  </>
                ) : (
                  <>
                    <option value="basic-widget">Basic Widget</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #3e3e3e',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid #3e3e3e',
                borderRadius: '6px',
                color: '#cccccc',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#007acc',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
