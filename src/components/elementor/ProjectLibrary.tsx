'use client';

import { useState, useEffect } from 'react';
import { FileGroup, loadEditorState } from '@/lib/file-group-manager';

interface ProjectLibraryProps {
  onOpenProject: (projectId: string) => void;
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
}

export function ProjectLibrary({
  onOpenProject,
  chatVisible,
  setChatVisible,
  tabBarVisible,
  setTabBarVisible
}: ProjectLibraryProps) {
  const [projects, setProjects] = useState<FileGroup[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load all projects from storage
  useEffect(() => {
    const loadProjects = () => {
      const editorState = loadEditorState();
      setProjects(editorState.groups);
    };

    loadProjects();

    // Listen for storage changes (when projects are created/updated in editor)
    const handleStorageChange = () => {
      loadProjects();
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll every 2 seconds to catch same-tab updates
    const interval = setInterval(loadProjects, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Format timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Count non-empty files based on project type
  const countFiles = (project: FileGroup) => {
    let count = 0;
    if (project.type === 'html') {
      // HTML projects: count HTML, CSS, JS
      if (project.html?.trim()) count++;
      if (project.css?.trim()) count++;
      if (project.js?.trim()) count++;
    } else if (project.type === 'php') {
      // PHP Widget projects: count PHP, CSS, JS
      if (project.php?.trim()) count++;
      if (project.css?.trim()) count++;
      if (project.js?.trim()) count++;
    }
    return count;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e1e',
      color: '#cccccc',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: '#2d2d2d',
        borderBottom: '1px solid #3e3e3e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          Project Library
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'grid' ? '#007acc' : 'transparent',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'list' ? '#007acc' : 'transparent',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            List
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Projects List/Grid */}
        <div style={{
          flex: selectedProjectId ? (isMobile ? 0 : 1) : 1,
          display: selectedProjectId && isMobile ? 'none' : 'block',
          overflow: 'auto',
          padding: '16px'
        }}>
          {projects.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#888'
            }}>
              <p>No projects saved yet.</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                Create projects in the Code Editor tab.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  style={{
                    background: '#2d2d2d',
                    border: selectedProjectId === project.id ? '2px solid #007acc' : '1px solid #3e3e3e',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProjectId !== project.id) {
                      e.currentTarget.style.borderColor = '#555';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProjectId !== project.id) {
                      e.currentTarget.style.borderColor = '#3e3e3e';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>
                      {project.type === 'html' ? '📦' : '🔧'}
                    </span>
                    <h3 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 600,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {project.name}
                    </h3>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#888',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>Type: {project.type === 'html' ? 'HTML Project' : 'PHP Widget'}</div>
                    <div>Files: {countFiles(project)}</div>
                    <div>Updated: {formatDate(project.updatedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  style={{
                    background: '#2d2d2d',
                    border: selectedProjectId === project.id ? '2px solid #007acc' : '1px solid #3e3e3e',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProjectId !== project.id) {
                      e.currentTarget.style.borderColor = '#555';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProjectId !== project.id) {
                      e.currentTarget.style.borderColor = '#3e3e3e';
                    }
                  }}
                >
                  <span style={{ fontSize: '24px' }}>
                    {project.type === 'html' ? '📦' : '🔧'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                      {project.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {project.type === 'html' ? 'HTML Project' : 'PHP Widget'} • {countFiles(project)} files • Updated {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Details Panel */}
        {selectedProject && (
          <div style={{
            width: isMobile ? '100%' : '400px',
            borderLeft: isMobile ? 'none' : '1px solid #3e3e3e',
            background: '#252526',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Details Header */}
            <div style={{
              padding: '16px',
              background: '#2d2d2d',
              borderBottom: '1px solid #3e3e3e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                Project Details
              </h3>
              {isMobile && (
                <button
                  onClick={() => setSelectedProjectId(null)}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: '1px solid #3e3e3e',
                    borderRadius: '4px',
                    color: '#cccccc',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Project Info */}
            <div style={{ padding: '16px', borderBottom: '1px solid #3e3e3e' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>
                  {selectedProject.type === 'html' ? '📦' : '🔧'}
                </span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedProject.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {selectedProject.type === 'html' ? 'HTML Project' : 'PHP Widget'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#888', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Created: {formatDate(selectedProject.createdAt)}</div>
                <div>Updated: {formatDate(selectedProject.updatedAt)}</div>
              </div>
            </div>

            {/* Files List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
                  Files
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* For HTML projects: show HTML, CSS, JS */}
                  {selectedProject.type === 'html' && (
                    <>
                      {selectedProject.html && (
                        <div style={{
                          background: '#2d2d2d',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #3e3e3e'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>📄</span>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>HTML</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {selectedProject.html.length} chars
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedProject.css && (
                        <div style={{
                          background: '#2d2d2d',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #3e3e3e'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🎨</span>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>CSS</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {selectedProject.css.length} chars
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedProject.js && (
                        <div style={{
                          background: '#2d2d2d',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #3e3e3e'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>⚡</span>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>JavaScript</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {selectedProject.js.length} chars
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* For PHP Widget projects: show PHP, CSS, JS */}
                  {selectedProject.type === 'php' && (
                    <>
                      {selectedProject.php && (
                        <div style={{
                          background: '#2d2d2d',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #3e3e3e'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🔧</span>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>widget.php</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {selectedProject.php.length} chars
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedProject.css && (
                        <div style={{
                          background: '#2d2d2d',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #3e3e3e'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🎨</span>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>widget.css</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {selectedProject.css.length} chars
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedProject.js && (
                        <div style={{
                          background: '#2d2d2d',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #3e3e3e'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>⚡</span>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>widget.js</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {selectedProject.js.length} chars
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '16px',
              background: '#2d2d2d',
              borderTop: '1px solid #3e3e3e'
            }}>
              <button
                onClick={() => {
                  onOpenProject(selectedProject.id);
                  setSelectedProjectId(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#007acc',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#005a9e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#007acc';
                }}
              >
                Open in Editor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
