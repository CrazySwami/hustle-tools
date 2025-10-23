'use client';

import { useState, useEffect, useRef } from 'react';
import { MenuIcon } from '@/components/ui/icons';

export interface OptionItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean; // Add divider after this item
  type?: 'toggle'; // For toggle items (shows checkmark when active)
  active?: boolean; // For toggle items
}

interface OptionsButtonProps {
  options: OptionItem[];
  position?: { bottom?: string; left?: string; right?: string; top?: string };
  isMobile?: boolean;
}

export function OptionsButton({ options, position, isMobile = false }: OptionsButtonProps) {
  // Smart default positioning: account for mobile chat drawer
  const defaultPosition = {
    bottom: isMobile ? '56px' : '20px', // Lower on mobile to clear chat drawer (48px + 8px margin)
    left: '20px'
  };
  const finalPosition = position || defaultPosition;
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

  const handleOptionClick = (option: OptionItem) => {
    if (!option.disabled) {
      option.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Floating Options Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          ...finalPosition,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isOpen ? 'var(--foreground)' : 'var(--muted)',
          color: isOpen ? 'var(--background)' : 'var(--foreground)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          zIndex: 3100, // Above chat drawer (3000) and other elements
          transition: 'all 0.2s ease'
        }}
        aria-label="Options menu"
      >
        <MenuIcon size={24} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: finalPosition.bottom ? `calc(${finalPosition.bottom} + 65px)` : undefined,
            top: finalPosition.top ? `calc(${finalPosition.top} + 65px)` : undefined,
            left: finalPosition.left,
            right: finalPosition.right,
            background: 'var(--card)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            minWidth: isMobile ? '240px' : '260px',
            maxWidth: isMobile ? '90vw' : '320px',
            zIndex: 3101, // Above button (3100)
            animation: 'slideUp 0.2s ease-out',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}
        >
          {options.map((option, index) => (
            <div key={index}>
              <button
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: option.disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  opacity: option.disabled ? 0.5 : 1
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
                <span>{option.label}</span>
                {option.type === 'toggle' && option.active && (
                  <span style={{ color: 'var(--primary)' }}>✓</span>
                )}
              </button>
              {option.divider && index < options.length - 1 && (
                <div style={{
                  height: '1px',
                  background: 'var(--border)',
                  margin: '0'
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(10px);
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
