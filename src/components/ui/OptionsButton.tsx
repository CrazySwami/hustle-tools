'use client';

import { useState, useEffect, useRef } from 'react';

interface OptionItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface OptionsButtonProps {
  options: OptionItem[];
  size?: 'small' | 'medium' | 'large';
}

export function OptionsButton({ options, size = 'medium' }: OptionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const buttonSize = size === 'small' ? '32px' : size === 'large' ? '48px' : '40px';
  const fontSize = size === 'small' ? '16px' : size === 'large' ? '22px' : '20px';

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Options Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: '6px',
          background: isOpen ? '#000000' : 'var(--muted)',
          color: isOpen ? '#ffffff' : 'var(--foreground)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: fontSize,
          transition: 'all 0.2s ease',
          fontWeight: 600
        }}
        aria-label="Options"
      >
        ⋮
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: '0',
            background: 'var(--card)',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            minWidth: '200px',
            zIndex: 1000,
            animation: 'slideDown 0.2s ease-out',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                if (!option.disabled) {
                  option.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={option.disabled}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'transparent',
                border: 'none',
                borderBottom: index < options.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                opacity: option.disabled ? 0.5 : 1,
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--foreground)',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!option.disabled) {
                  e.currentTarget.style.background = 'var(--muted)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {option.icon && <span style={{ fontSize: '16px' }}>{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
