'use client';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ isLoading, message, fullScreen = false }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        inset: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: fullScreen ? 10000 : 100,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />

      {message && (
        <div
          style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#374151',
            fontWeight: 500
          }}
        >
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingButton({ isLoading, children, loadingText, disabled, ...props }: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      style={{
        ...props.style,
        position: 'relative',
        opacity: isLoading ? 0.7 : 1,
        cursor: isLoading || disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
      )}

      <span style={{ paddingLeft: isLoading ? '24px' : '0' }}>
        {isLoading && loadingText ? loadingText : children}
      </span>

      <style jsx>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
