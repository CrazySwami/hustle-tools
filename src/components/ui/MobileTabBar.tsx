'use client';

import { useState, useRef, useEffect } from 'react';
import { MenuIcon, X } from 'lucide-react';

export interface MobileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface MobileTabAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface MobileTabBarProps {
  tabs: MobileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  actions?: MobileTabAction[];
  showActions?: boolean;
  onLogoClick?: () => void;
}

export function MobileTabBar({
  tabs,
  activeTab,
  onTabChange,
  actions = [],
  showActions = true,
  onLogoClick,
}: MobileTabBarProps) {
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setSidePanelOpen(false);
      }
    };

    if (sidePanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidePanelOpen]);

  const handleActionClick = (action: MobileTabAction) => {
    if (!action.disabled) {
      action.onClick();
      setSidePanelOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        {/* HT Logo Button (10-15% width) */}
        {onLogoClick && (
          <button
            onClick={onLogoClick}
            className="flex items-center justify-center h-9 transition-colors active:scale-95 font-bold text-lg"
            style={{
              background: 'transparent',
              color: 'var(--foreground)',
              border: 'none',
              flexShrink: 0,
              width: '12.5%',
              minWidth: '40px',
              maxWidth: '60px',
            }}
            aria-label="Open navigation"
          >
            HT
          </button>
        )}

        {/* Tab Selector - Flexible width */}
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="flex-1 px-3 py-2 text-foreground text-sm font-medium focus:outline-none"
          style={{
            minWidth: 0,
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px',
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id} disabled={tab.disabled}>
              {tab.label}
            </option>
          ))}
        </select>

        {/* Hamburger Menu */}
        {showActions && actions.length > 0 && (
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setSidePanelOpen(!sidePanelOpen)}
              className="flex items-center justify-center w-9 h-9 transition-colors active:scale-95"
              style={{
                background: 'transparent',
                color: 'var(--foreground)',
                border: 'none',
                flexShrink: 0,
              }}
              aria-label="Open menu"
            >
              <MenuIcon size={20} strokeWidth={2} />
            </button>

            {/* Dropdown Menu */}
            {sidePanelOpen && (
              <div
                className="absolute top-full right-0 mt-1 bg-card rounded-lg shadow-xl border border-border min-w-[220px] max-w-[90vw] overflow-hidden z-[9999]"
                style={{
                  animation: 'slideDown 0.15s ease-out',
                }}
              >
                {actions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      borderBottom: index < actions.length - 1 ? '1px solid var(--border)' : 'none',
                      color: action.destructive ? 'var(--destructive)' : 'var(--foreground)',
                    }}
                  >
                    {action.icon && (
                      <span className="flex-shrink-0" style={{ opacity: 0.7 }}>
                        {action.icon}
                      </span>
                    )}
                    <span className="flex-1">{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-4px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
