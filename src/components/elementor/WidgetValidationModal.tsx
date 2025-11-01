'use client';

import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ValidationCheck {
  requirement: string;
  passed: boolean;
  details: string;
  severity: 'critical' | 'warning' | 'info';
}

interface ValidationResult {
  checks: ValidationCheck[];
  overallScore: number;
  summary: string;
}

interface WidgetValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ValidationResult | null;
  isValidating: boolean;
  widgetName: string;
  onFixIssues?: () => void;
}

export function WidgetValidationModal({
  isOpen,
  onClose,
  validationResult,
  isValidating,
  widgetName,
  onFixIssues
}: WidgetValidationModalProps) {
  if (!isOpen) return null;

  const getSeverityIcon = (severity: string, passed: boolean) => {
    if (passed) {
      return <CheckCircle2 size={20} className="text-green-500" />;
    }

    switch (severity) {
      case 'critical':
        return <XCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-orange-500" />;
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      default:
        return <XCircle size={20} className="text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      warning: 'bg-orange-100 text-orange-800 border-orange-300',
      info: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[severity as keyof typeof colors] || colors.info}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score === 100) return 'Perfect';
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>
              Widget Validation Report
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
              {widgetName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={24} style={{ color: 'var(--foreground)' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {isValidating ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid var(--muted)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}
              />
              <p style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}>
                🔍 AI validating widget code...
              </p>
            </div>
          ) : validationResult ? (
            <div>
              {/* Score Summary */}
              <div
                style={{
                  background: 'var(--muted)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '8px' }}
                     className={getScoreColor(validationResult.overallScore)}>
                  {validationResult.overallScore}%
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  {getScoreLabel(validationResult.overallScore)}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
                  {validationResult.summary}
                </p>
              </div>

              {/* Validation Checks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {validationResult.checks.map((check, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: check.passed ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ paddingTop: '2px', flexShrink: 0 }}>
                        {getSeverityIcon(check.severity, check.passed)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600 }}>
                            {check.requirement}
                          </span>
                          {getSeverityBadge(check.severity)}
                        </div>
                        <p style={{
                          fontSize: '14px',
                          color: 'var(--muted-foreground)',
                          margin: 0,
                          lineHeight: 1.6
                        }}>
                          {check.details}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}>
                No validation results available
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
