'use client';

import { useState, useEffect, useRef } from 'react';
import { MenuIcon, GlobeIcon, FileCodeIcon, ImageIcon, XIcon } from 'lucide-react';

export interface PromptAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'toggle' | 'button';
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface MobilePromptActionsProps {
  actions: PromptAction[];
}

export function MobilePromptActions({ actions }: MobilePromptActionsProps) {
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

  const handleActionClick = (action: PromptAction) => {
    if (!action.disabled) {
      action.onClick();
      // Only close menu for button actions, keep open for toggles
      if (action.type === 'button') {
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style={{
          background: isOpen ? 'var(--muted)' : 'transparent',
          color: 'var(--foreground)',
        }}
        aria-label="Prompt actions menu"
      >
        <MenuIcon size={18} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="fixed bottom-20 left-4 bg-card rounded-xl shadow-xl border border-border min-w-[240px] max-w-[90vw] overflow-hidden"
          style={{
            animation: 'slideUp 0.2s ease-out',
            zIndex: 99999,
          }}
        >
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: index < actions.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span className="flex-shrink-0" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                {action.icon}
              </span>
              <span className="flex-1">{action.label}</span>
              {action.type === 'toggle' && (
                <div
                  className="flex-shrink-0 w-10 h-5 rounded-full transition-colors relative"
                  style={{
                    background: action.active ? 'var(--primary)' : 'var(--muted)',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{
                      left: action.active ? 'calc(100% - 18px)' : '2px',
                    }}
                  />
                </div>
              )}
            </button>
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
