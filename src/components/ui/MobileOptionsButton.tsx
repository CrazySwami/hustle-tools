'use client';

import { useState, useEffect, useRef } from 'react';
import { MenuIcon } from '@/components/ui/icons';
import type { OptionItem } from './OptionsButton';

interface MobileOptionsButtonProps {
  options: OptionItem[];
}

export function MobileOptionsButton({ options }: MobileOptionsButtonProps) {
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
    <div ref={menuRef} className="relative">
      {/* Three-dot button */}
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

      {/* Dropdown Menu */}
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
}
