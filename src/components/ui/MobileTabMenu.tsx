'use client';

import { useState, useEffect, useRef } from 'react';
import { FileIcon, PaletteIcon, GlobeIcon, SettingsIcon, CodeIcon, EyeIcon } from '@/components/ui/icons';

interface MobileTabMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  playgroundReady: boolean;
}

export function MobileTabMenu({ activeTab, onTabChange, playgroundReady }: MobileTabMenuProps) {
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
    { id: 'json', label: 'Code Editor', icon: CodeIcon, enabled: true },
    { id: 'sections', label: 'Section Library', icon: FileIcon, enabled: true },
    { id: 'style-guide', label: 'Style Guide', icon: PaletteIcon, enabled: true },
    { id: 'site-content', label: 'Site Content', icon: SettingsIcon, enabled: playgroundReady },
    { id: 'visual', label: 'Visual Editor', icon: EyeIcon, enabled: false, mobileDisabled: true },
    { id: 'playground', label: 'WordPress Playground', icon: GlobeIcon, enabled: false, mobileDisabled: true },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '80px', // Above chat drawer
          left: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#000000',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
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
            bottom: '145px', // Above the button
            left: '20px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            minWidth: '220px',
            zIndex: 9999,
            animation: 'slideUp 0.2s ease-out',
            overflow: 'hidden'
          }}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            const isDisabled = tab.mobileDisabled || !tab.enabled;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!isDisabled) {
                    onTabChange(tab.id);
                    setIsOpen(false);
                  }
                }}
                disabled={isDisabled}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isActive ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderBottom: index < tabs.length - 1 ? '1px solid #e5e7eb' : 'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  fontSize: '15px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#000000' : '#6b7280',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
                {tab.mobileDisabled && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    Desktop only
                  </span>
                )}
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
