'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    bottom: isMobile ? '25px' : '20px', // Lower on mobile to clear chat drawer
    left: '20px'
  };
  const finalPosition = position || defaultPosition;
  const [isOpen, setIsOpen] = useState(false);
  const [bottomNavRight, setBottomNavRight] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Find the bottom-nav-right container for mobile portal rendering
  useEffect(() => {
    if (isMobile) {
      const container = document.getElementById('bottom-nav-right');
      setBottomNavRight(container);
    }
  }, [isMobile]);

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

  // Mobile button component (for portal)
  const mobileButton = (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center border transition-all"
        style={{
          background: isOpen ? 'var(--foreground)' : 'var(--muted)',
          color: isOpen ? 'var(--background)' : 'var(--foreground)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        }}
        aria-label="Options menu"
      >
        <MenuIcon size={24} />
      </button>

      {/* Dropdown Menu - for mobile */}
      {isOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 bg-card rounded-xl shadow-xl border border-border min-w-[240px] max-w-[90vw] overflow-hidden"
          style={{
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {options.map((option, index) => (
            <div key={index}>
              <button
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                <span>{option.label}</span>
                {option.type === 'toggle' && option.active && (
                  <span className="text-primary">✓</span>
                )}
              </button>
              {option.divider && index < options.length - 1 && (
                <div className="h-px bg-border" />
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

  // Desktop button component (absolute positioning)
  const desktopButton = (
    <div ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
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
          zIndex: 100,
          transition: 'all 0.2s ease'
        }}
        aria-label="Options menu"
      >
        <MenuIcon size={24} />
      </button>

      {/* Dropdown Menu - for desktop */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: finalPosition.bottom ? `calc(${finalPosition.bottom} + 65px)` : undefined,
            top: finalPosition.top ? `calc(${finalPosition.top} + 65px)` : undefined,
            left: finalPosition.left,
            right: finalPosition.right,
            background: 'var(--card)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            minWidth: '260px',
            maxWidth: '320px',
            zIndex: 101,
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
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                <span>{option.label}</span>
                {option.type === 'toggle' && option.active && (
                  <span className="text-primary">✓</span>
                )}
              </button>
              {option.divider && index < options.length - 1 && (
                <div className="h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // On mobile: render into bottom-nav-right portal
  // On desktop: render with absolute positioning
  if (isMobile && bottomNavRight) {
    return createPortal(mobileButton, bottomNavRight);
  }

  return desktopButton;
}
