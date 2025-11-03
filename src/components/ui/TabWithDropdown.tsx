'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface TabDropdownAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface TabWithDropdownProps {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  dropdownActions?: TabDropdownAction[];
  disabled?: boolean;
}

export function TabWithDropdown({
  label,
  icon,
  active,
  onClick,
  dropdownActions = [],
  disabled = false,
}: TabWithDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (dropdownActions.length > 0 && !disabled) {
      setShowDropdown(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 300);
  };

  const handleTabClick = (e: React.MouseEvent) => {
    // If tab is already active and has dropdown actions, toggle dropdown
    if (active && dropdownActions.length > 0 && !disabled) {
      e.stopPropagation();
      setShowDropdown(!showDropdown);
    } else {
      // Otherwise, switch to this tab
      onClick();
    }
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleActionClick = (action: TabDropdownAction) => {
    if (!action.disabled) {
      action.onClick();
      setShowDropdown(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleTabClick}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: active ? 'var(--primary)' : 'transparent',
          color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
        }}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{label}</span>
        {dropdownActions.length > 0 && (
          <ChevronDown
            size={14}
            className="transition-transform"
            style={{
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.6,
            }}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && dropdownActions.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 bg-card rounded-lg shadow-xl border border-border min-w-[220px] overflow-hidden z-[9999]"
          style={{
            animation: 'slideDown 0.15s ease-out',
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {dropdownActions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                borderBottom: index < dropdownActions.length - 1 ? '1px solid var(--border)' : 'none',
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

      <style jsx global>{`
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
    </div>
  );
}
