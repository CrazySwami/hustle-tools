'use client';

import { useState, useEffect, useRef } from 'react';
import { FileIcon, PaletteIcon, GlobeIcon, CodeIcon, EyeIcon, FileTextIcon } from '@/components/ui/icons';

interface MobileTabMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  playgroundReady: boolean;
  chatVisible?: boolean;
  leftPanelWidth?: number;
  isMobile?: boolean;
}

export function MobileTabMenu({ activeTab, onTabChange, playgroundReady, chatVisible = false, leftPanelWidth = 25, isMobile = false }: MobileTabMenuProps) {
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

  const tabs = [
    { id: 'json', label: 'Code Editor', icon: CodeIcon },
    { id: 'sections', label: 'Section Library', icon: FileIcon },
    { id: 'playground', label: 'WordPress Playground', icon: GlobeIcon },
    { id: 'site-content', label: 'Site Content', icon: FileTextIcon },
    { id: 'style-guide', label: 'Style Guide', icon: PaletteIcon },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  // Calculate left position based on chat visibility (desktop only)
  const buttonLeft = isMobile || !chatVisible ? '20px' : `calc(${leftPanelWidth}% + 20px)`;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '80px' : '20px', // 60px chat drawer + 20px margin on mobile
          left: buttonLeft,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isOpen ? 'var(--foreground)' : 'var(--muted)',
          color: isOpen ? 'var(--background)' : 'var(--foreground)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          lineHeight: '1',
          zIndex: 3001, // Above chat drawer (3000)
          transition: 'all 0.2s ease'
        }}
        aria-label="Open tab menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: isMobile ? '145px' : '85px', // Above the button (button height + button bottom + gap)
            left: buttonLeft,
            background: 'var(--card)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            minWidth: '220px',
            zIndex: 3002, // Above button
            animation: 'slideUp 0.2s ease-out',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isActive ? 'var(--muted)' : 'transparent',
                  border: 'none',
                  borderBottom: index < tabs.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
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
