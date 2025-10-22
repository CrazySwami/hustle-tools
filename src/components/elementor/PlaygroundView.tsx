'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCwIcon, ExternalLinkIcon, EyeIcon, DownloadIcon, PackageIcon } from 'lucide-react';
import { OptionsButton } from '@/components/ui/OptionsButton';

interface PlaygroundViewProps {
  json: any;
  isActive?: boolean;
  onJsonUpdate?: (json: any) => void;
  onPlaygroundReady?: () => void;
}

export function PlaygroundView({ json, isActive = false, onJsonUpdate, onPlaygroundReady }: PlaygroundViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [playgroundReady, setPlaygroundReady] = useState(false);
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Check if playground script is loaded and auto-launch
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total
    let hasLaunched = false;

    const checkPlayground = setInterval(() => {
      attempts++;

      if (typeof window !== 'undefined' && (window as any).openPlaygroundDirect) {
        console.log('✅ Playground functions found!');
        setPlaygroundReady(true);
        clearInterval(checkPlayground);

        // Auto-launch playground
        if (!hasLaunched) {
          hasLaunched = true;
          setTimeout(() => {
            console.log('🚀 Auto-launching WordPress Playground...');
            setIsLoading(true);
            setStatus('Auto-launching WordPress Playground...');
            (window as any).openPlaygroundDirect()
              .then(() => {
                setStatus('Playground launched successfully');
                setIsLoading(false);
                console.log('✅ WordPress Playground blueprint complete');
                // Wait 5 seconds for WordPress to fully settle before notifying parent
                console.log('⏳ Waiting 5 seconds for WordPress to fully initialize...');
                setTimeout(() => {
                  console.log('✅ WordPress should be ready now, notifying parent');
                  if (onPlaygroundReady) {
                    onPlaygroundReady();
                  }
                }, 5000);
              })
              .catch((error: any) => {
                console.error('Failed to auto-launch:', error);
                setStatus('Failed to auto-launch playground');
                setIsLoading(false);
              });
          }, 500);
        }
      } else if (attempts >= maxAttempts) {
        console.error('❌ Playground script failed to load after 5 seconds');
        setStatus('Failed to load playground script');
        clearInterval(checkPlayground);
      }
    }, 100);

    return () => clearInterval(checkPlayground);
  }, []);

  // Update generatedJSON when json prop changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).generatedJSON = json;
    }
  }, [json]);

  const launchPlayground = async () => {
    if (!playgroundReady) {
      console.error('Playground script not loaded');
      return;
    }

    setIsLoading(true);
    setStatus('Launching WordPress Playground...');
    try {
      // Use the openPlaygroundDirect function from playground.js
      if ((window as any).openPlaygroundDirect) {
        await (window as any).openPlaygroundDirect();
        setStatus('Playground launched successfully');
      }
    } catch (error) {
      console.error('Failed to launch playground:', error);
      setStatus('Failed to launch playground');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPlayground = async () => {
    if (!playgroundReady) return;

    // Check if playground client is initialized
    if (!(window as any).playgroundClient) {
      setStatus('Please launch playground first');
      return;
    }

    setIsLoading(true);
    setStatus('Importing template...');
    try {
      // Use importToExistingPlayground to create page and import template
      if ((window as any).importToExistingPlayground) {
        await (window as any).importToExistingPlayground();
        setStatus('Template imported and editor opened');
      }
    } catch (error) {
      console.error('Failed to refresh playground:', error);
      setStatus('Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  };

  const viewPage = async () => {
    if (!playgroundReady) return;

    // Check if playground client is initialized
    if (!(window as any).playgroundClient) {
      setStatus('Please launch playground first');
      return;
    }

    try {
      if ((window as any).viewPage) {
        await (window as any).viewPage();
      }
    } catch (error) {
      console.error('Failed to view page:', error);
    }
  };

  const pullFromPlayground = async () => {
    if (!playgroundReady) return;

    // Check if playground client is initialized
    if (!(window as any).playgroundClient) {
      setStatus('Please launch playground first');
      return;
    }

    setIsLoading(true);
    setStatus('Pulling changes from Elementor editor...');

    try {
      if ((window as any).pullFromPlayground) {
        const updatedJson = await (window as any).pullFromPlayground();

        if (updatedJson && onJsonUpdate) {
          onJsonUpdate(updatedJson);
          setStatus('✅ Changes pulled successfully!');
        }
      }
    } catch (error: any) {
      console.error('Failed to pull from playground:', error);
      setStatus(`Failed to pull: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSite = async () => {
    if (!playgroundReady) return;

    if (!(window as any).playgroundClient) {
      setStatus('Please launch playground first');
      return;
    }

    setIsLoading(true);
    setStatus('Exporting WordPress site...');

    try {
      if ((window as any).exportPlaygroundSite) {
        await (window as any).exportPlaygroundSite();
        setStatus('✅ Site exported successfully!');
      }
    } catch (error: any) {
      console.error('Failed to export site:', error);
      setStatus(`Failed to export: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="playground-container" id="playgroundContainer" style={{ position: 'relative', height: '100%' }}>
      {/* Floating Circle Options Button - All Screen Sizes */}
      <div ref={menuRef} style={{
        position: 'fixed',
        bottom: '80px', // Above tab menu (which is at ~20px)
        left: '20px',
        zIndex: 100
      }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: menuOpen ? '#000000' : 'var(--card)',
            border: '2px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
            color: menuOpen ? '#ffffff' : 'var(--foreground)'
          }}
          onMouseEnter={(e) => {
            if (!menuOpen) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          ⋮
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--card)',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            minWidth: '200px',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            animation: 'slideUp 0.2s ease-out'
          }}>
            {[
              {
                label: 'Launch',
                icon: '🚀',
                onClick: launchPlayground,
                disabled: isLoading || !playgroundReady
              },
              {
                label: 'Update & Open',
                icon: '🔄',
                onClick: refreshPlayground,
                disabled: isLoading || !playgroundReady
              },
              {
                label: 'View Live',
                icon: '👁️',
                onClick: viewPage,
                disabled: !playgroundReady
              },
              {
                label: 'Pull Changes',
                icon: '⬇️',
                onClick: pullFromPlayground,
                disabled: isLoading || !playgroundReady
              },
              {
                label: 'Export Site',
                icon: '📦',
                onClick: exportSite,
                disabled: isLoading || !playgroundReady
              }
            ].map((option, index, array) => (
              <button
                key={index}
                onClick={() => {
                  if (!option.disabled) {
                    option.onClick();
                    setMenuOpen(false);
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
                  borderBottom: index < array.length - 1 ? '1px solid var(--border)' : 'none',
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
                <span style={{ fontSize: '16px' }}>{option.icon}</span>
                <span>{option.label}</span>
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

      {/* Floating Status Messages - All Screen Sizes */}
      {status && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--card)',
          color: 'var(--foreground)',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 99,
          border: '1px solid var(--border)'
        }}>
          {status}
        </div>
      )}

      {!playgroundReady && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fef3c7',
          color: '#92400e',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 99,
          border: '1px solid #f59e0b'
        }}>
          Loading playground script...
        </div>
      )}

      {/* Playground iframe */}
      <iframe
        id="playgroundIframe"
        className="playground-iframe"
        title="WordPress Playground"
      />
    </div>
  );
}
