/**
 * Validation Results Dialog Component
 *
 * Shows PHP widget validation results with detailed error messages,
 * line numbers, and severity indicators.
 *
 * Used to display validation feedback BEFORE deployment, so users
 * can fix issues proactively instead of discovering them after failed deployment.
 */

'use client';

interface ValidationError {
  severity: 'error' | 'warning';
  message: string;
  line?: number;
  column?: number;
  context?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationResultsDialogProps {
  result: ValidationResult;
  widgetCode?: string;
  onClose: () => void;
  onProceedAnyway?: () => void; // For warnings only
}

export function ValidationResultsDialog({
  result,
  widgetCode,
  onClose,
  onProceedAnyway,
}: ValidationResultsDialogProps) {
  const allIssues = [
    ...result.errors.map(e => ({ ...e, severity: 'error' as const })),
    ...result.warnings.map(w => ({ ...w, severity: 'warning' as const }))
  ];

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

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
          maxWidth: '800px',
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
            color: result.valid ? '#4ade80' : '#f87171'
          }}>
            {result.valid ? '✅ Validation Passed' : '❌ Validation Failed'}
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            color: '#888'
          }}>
            {errorCount > 0 && (
              <span style={{ color: '#f87171' }}>
                {errorCount} error{errorCount === 1 ? '' : 's'}
              </span>
            )}
            {errorCount > 0 && warningCount > 0 && <span>, </span>}
            {warningCount > 0 && (
              <span style={{ color: '#fbbf24' }}>
                {warningCount} warning{warningCount === 1 ? '' : 's'}
              </span>
            )}
            {result.valid && warningCount === 0 && (
              <span style={{ color: '#4ade80' }}>
                No issues found
              </span>
            )}
          </p>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflow: 'auto'
        }}>
          {allIssues.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#4ade80',
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                Widget code is valid!
              </div>
              <div style={{ color: '#888', fontSize: '13px' }}>
                Ready to deploy to WordPress
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {allIssues.map((issue, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    background: issue.severity === 'error' ? '#3d1f1f' : '#3d311f',
                    border: `1px solid ${issue.severity === 'error' ? '#5a2929' : '#5a4829'}`,
                    borderRadius: '6px'
                  }}
                >
                  {/* Issue Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      lineHeight: 1
                    }}>
                      {issue.severity === 'error' ? '🔴' : '⚠️'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: issue.severity === 'error' ? '#f87171' : '#fbbf24',
                        marginBottom: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {issue.severity}
                        {issue.line && (
                          <span style={{ marginLeft: '8px', color: '#888' }}>
                            Line {issue.line}
                            {issue.column && `:${issue.column}`}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#ffffff',
                        lineHeight: 1.5
                      }}>
                        {issue.message}
                      </div>
                    </div>
                  </div>

                  {/* Context Code (if available) */}
                  {issue.context && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#1e1e1e',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#cccccc',
                      overflow: 'auto'
                    }}>
                      <pre style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {issue.context}
                      </pre>
                    </div>
                  )}

                  {/* Jump to Line (if widgetCode provided) */}
                  {issue.line && widgetCode && (
                    <button
                      onClick={() => {
                        // Could expand to show code snippet around error line
                        const lines = widgetCode.split('\n');
                        const start = Math.max(0, issue.line! - 3);
                        const end = Math.min(lines.length, issue.line! + 2);
                        const snippet = lines.slice(start, end).join('\n');
                        console.log(`Code around line ${issue.line}:`, snippet);
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid #3e3e3e',
                        borderRadius: '4px',
                        color: '#888',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View Code Context
                    </button>
                  )}
                </div>
              ))}
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
            Close
          </button>
          {result.valid && warningCount > 0 && onProceedAnyway && (
            <button
              onClick={onProceedAnyway}
              style={{
                padding: '10px 20px',
                background: '#fbbf24',
                border: 'none',
                borderRadius: '6px',
                color: '#1e1e1e',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Proceed Anyway
            </button>
          )}
          {result.valid && warningCount === 0 && (
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#4ade80',
                border: 'none',
                borderRadius: '6px',
                color: '#1e1e1e',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </>
  );
}
