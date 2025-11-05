/**
 * New Group Dialog Component
 *
 * Dialog for creating new file groups (HTML projects or PHP widgets).
 */

'use client';

import { useState } from 'react';
import { AiFillHtml5 } from 'react-icons/ai';
import { FaWordpress } from 'react-icons/fa';
import { SiHubspot } from 'react-icons/si';

interface NewGroupDialogProps {
  onClose: () => void;
  onCreate: (name: string, type: 'html' | 'php' | 'hubspot' | 'plugin', template: string) => void;
}

export function NewGroupDialog({ onClose, onCreate }: NewGroupDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'html' | 'php' | 'hubspot' | 'plugin'>('html');
  const [template, setTemplate] = useState('empty');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a project name');
      return;
    }

    // For plugin type, pass description in the template parameter
    // For other types, use the selected template
    const templateOrDescription = type === 'plugin'
      ? (description.trim() || 'empty')
      : template;

    onCreate(name.trim(), type, templateOrDescription);
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
                {type === 'plugin' ? 'Plugin Name' : 'Project Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'plugin' ? 'e.g., My Custom Widgets' : 'e.g., Hero Section'}
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

            {/* Plugin Description - Only for plugin type */}
            {type === 'plugin' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#cccccc'
                }}>
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Custom Elementor widgets for my website"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e1e1e',
                    border: '1px solid #3e3e3e',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007acc';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#3e3e3e';
                  }}
                />
              </div>
            )}

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
                    onChange={(e) => setType(e.target.value as 'html' | 'php' | 'hubspot' | 'plugin')}
                    style={{ marginRight: '12px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AiFillHtml5 size={20} color="#E34F26" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        HTML Project
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        Standard HTML + CSS + JavaScript
                      </div>
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
                    onChange={(e) => setType(e.target.value as 'html' | 'php' | 'hubspot' | 'plugin')}
                    style={{ marginRight: '12px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaWordpress size={20} color="#21759B" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        WordPress Widget
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        Single Elementor widget with PHP
                      </div>
                    </div>
                  </div>
                </label>

                {/* WordPress Plugin Option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: type === 'plugin' ? '#2a2d2e' : '#1e1e1e',
                  border: type === 'plugin' ? '2px solid #007acc' : '2px solid #3e3e3e',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>
                  <input
                    type="radio"
                    name="type"
                    value="plugin"
                    checked={type === 'plugin'}
                    onChange={(e) => setType(e.target.value as 'html' | 'php' | 'hubspot' | 'plugin')}
                    style={{ marginRight: '12px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaWordpress size={20} color="#9B59B6" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        WordPress Plugin
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        Multi-widget plugin with auto-registration
                      </div>
                    </div>
                  </div>
                </label>

                {/* HubSpot Template Option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: type === 'hubspot' ? '#2a2d2e' : '#1e1e1e',
                  border: type === 'hubspot' ? '2px solid #007acc' : '2px solid #3e3e3e',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>
                  <input
                    type="radio"
                    name="type"
                    value="hubspot"
                    checked={type === 'hubspot'}
                    onChange={(e) => setType(e.target.value as 'html' | 'php' | 'hubspot' | 'plugin')}
                    style={{ marginRight: '12px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SiHubspot size={20} color="#FF7A59" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        HubSpot Template
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        HubSpot CMS template (HTML + HubL)
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Template Selection - Only show for non-plugin types */}
            {type !== 'plugin' && (
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
                  ) : type === 'php' ? (
                    <>
                      <option value="basic-widget">Basic Widget</option>
                    </>
                  ) : type === 'hubspot' ? (
                    <>
                      <option value="hubspot-hero">Hero Section (Page Module)</option>
                      <option value="hubspot-email">Email CTA (Email Module)</option>
                    </>
                  ) : null}
                </select>
              </div>
            )}
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
