/**
 * Batch Widget Converter Component
 *
 * Converts multiple HTML projects to Elementor PHP widgets in batch.
 * Shows progress for each conversion and handles errors gracefully.
 *
 * Workflow:
 * 1. User selects which HTML projects to convert
 * 2. System runs Quick Widget conversion for each
 * 3. Shows real-time progress with status indicators
 * 4. Converted projects are switched to PHP type
 */

'use client';

import { useState } from 'react';
import { FileGroup } from '@/lib/file-group-manager';

interface ConversionJob {
  groupId: string;
  groupName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  widgetName?: string;
  startTime?: number;
  endTime?: number;
}

interface BatchWidgetConverterProps {
  groups: FileGroup[];
  onClose: () => void;
  onConvert: (groupId: string) => Promise<{ widgetName: string }>;
}

export function BatchWidgetConverter({
  groups,
  onClose,
  onConvert,
}: BatchWidgetConverterProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);

  // Filter to only show HTML projects (not already widgets)
  const htmlGroups = groups.filter(g => g.type === 'html' && !g.php);

  /**
   * Toggle group selection
   */
  const toggleGroup = (id: string) => {
    const newSelected = new Set(selectedGroupIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroupIds(newSelected);
  };

  /**
   * Start batch conversion
   */
  const handleStartBatch = async () => {
    if (selectedGroupIds.size === 0) return;

    // Initialize jobs
    const initialJobs: ConversionJob[] = Array.from(selectedGroupIds).map(id => {
      const group = groups.find(g => g.id === id)!;
      return {
        groupId: id,
        groupName: group.name,
        status: 'pending' as const
      };
    });

    setJobs(initialJobs);
    setIsRunning(true);
    setCurrentJobIndex(0);

    // Process jobs sequentially (to avoid rate limits)
    for (let i = 0; i < initialJobs.length; i++) {
      const job = initialJobs[i];
      setCurrentJobIndex(i);

      // Update status to processing
      setJobs(prev => prev.map((j, idx) =>
        idx === i ? { ...j, status: 'processing', startTime: Date.now() } : j
      ));

      try {
        // Run conversion
        const result = await onConvert(job.groupId);

        // Update status to success
        setJobs(prev => prev.map((j, idx) =>
          idx === i
            ? {
                ...j,
                status: 'success',
                widgetName: result.widgetName,
                endTime: Date.now()
              }
            : j
        ));
      } catch (error: any) {
        // Update status to error
        setJobs(prev => prev.map((j, idx) =>
          idx === i
            ? {
                ...j,
                status: 'error',
                error: error.message || 'Unknown error',
                endTime: Date.now()
              }
            : j
        ));
      }
    }

    setIsRunning(false);
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: ConversionJob['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  /**
   * Calculate elapsed time
   */
  const getElapsedTime = (job: ConversionJob): string => {
    if (!job.startTime) return '';
    const endTime = job.endTime || Date.now();
    const elapsed = Math.round((endTime - job.startTime) / 1000);
    return `${elapsed}s`;
  };

  // Count results
  const successCount = jobs.filter(j => j.status === 'success').length;
  const errorCount = jobs.filter(j => j.status === 'error').length;
  const totalCount = jobs.length;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={isRunning ? undefined : onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isRunning ? 'not-allowed' : 'default'
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
          maxWidth: '700px',
          maxHeight: '80vh',
          border: '1px solid #3e3e3e',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
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
            Batch Widget Converter
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            color: '#888'
          }}>
            {jobs.length === 0
              ? 'Select HTML projects to convert to Elementor widgets'
              : `Converting ${totalCount} project${totalCount === 1 ? '' : 's'}...`}
          </p>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflow: 'auto'
        }}>
          {jobs.length === 0 ? (
            // Selection Step
            <>
              {htmlGroups.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#888',
                  fontSize: '14px'
                }}>
                  No HTML projects available to convert.
                  <br />
                  Create some HTML projects first!
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {htmlGroups.map((group) => (
                    <label
                      key={group.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        background: selectedGroupIds.has(group.id) ? '#2a2d2e' : '#1e1e1e',
                        border: selectedGroupIds.has(group.id) ? '2px solid #007acc' : '2px solid #3e3e3e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.has(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        style={{
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '16px' }}>📦</span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#ffffff'
                          }}>
                            {group.name}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#888'
                        }}>
                          {group.html.length > 0 ? `${group.html.length} chars HTML` : 'Empty HTML'}
                          {group.css && ` • ${group.css.length} chars CSS`}
                          {group.js && ` • ${group.js.length} chars JS`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Progress Step
            <>
              {/* Progress Summary */}
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: '#2a2d2e',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#cccccc' }}>
                  <strong style={{ color: '#ffffff' }}>
                    {currentJobIndex + 1} / {totalCount}
                  </strong>
                  {' '}projects processed
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px'
                }}>
                  <span style={{ color: '#4ade80' }}>✅ {successCount}</span>
                  <span style={{ color: '#f87171' }}>❌ {errorCount}</span>
                </div>
              </div>

              {/* Job List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {jobs.map((job, index) => (
                  <div
                    key={job.groupId}
                    style={{
                      padding: '16px',
                      background: job.status === 'processing' ? '#2a2d2e' : '#1e1e1e',
                      border: `2px solid ${
                        job.status === 'success' ? '#4ade80' :
                        job.status === 'error' ? '#f87171' :
                        job.status === 'processing' ? '#007acc' :
                        '#3e3e3e'
                      }`,
                      borderRadius: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '20px' }}>
                            {getStatusIcon(job.status)}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#ffffff'
                          }}>
                            {job.groupName}
                          </span>
                          {job.endTime && (
                            <span style={{
                              fontSize: '11px',
                              color: '#888',
                              marginLeft: '4px'
                            }}>
                              ({getElapsedTime(job)})
                            </span>
                          )}
                        </div>
                        {job.status === 'success' && job.widgetName && (
                          <div style={{
                            fontSize: '12px',
                            color: '#4ade80',
                            marginLeft: '28px'
                          }}>
                            Widget: {job.widgetName}
                          </div>
                        )}
                        {job.status === 'error' && job.error && (
                          <div style={{
                            fontSize: '12px',
                            color: '#f87171',
                            marginLeft: '28px'
                          }}>
                            Error: {job.error}
                          </div>
                        )}
                        {job.status === 'processing' && (
                          <div style={{
                            fontSize: '12px',
                            color: '#007acc',
                            marginLeft: '28px'
                          }}>
                            Converting... {getElapsedTime(job)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
            disabled={isRunning}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #3e3e3e',
              borderRadius: '6px',
              color: isRunning ? '#555' : '#cccccc',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? 'Converting...' : jobs.length > 0 ? 'Close' : 'Cancel'}
          </button>
          {jobs.length === 0 && (
            <button
              onClick={handleStartBatch}
              disabled={selectedGroupIds.size === 0}
              style={{
                padding: '10px 20px',
                background: selectedGroupIds.size > 0 ? '#007acc' : '#3e3e3e',
                border: 'none',
                borderRadius: '6px',
                color: selectedGroupIds.size > 0 ? '#ffffff' : '#888',
                fontSize: '14px',
                fontWeight: 600,
                cursor: selectedGroupIds.size > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Convert {selectedGroupIds.size} Project{selectedGroupIds.size === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
