'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCwIcon, ExternalLinkIcon, EyeIcon, DownloadIcon, PackageIcon } from 'lucide-react';
import { OptionsButton } from '@/components/ui/OptionsButton';

interface PlaygroundViewProps {
  json: any;
  isActive?: boolean;
  onJsonUpdate?: (json: any) => void;
  onPlaygroundReady?: () => void;
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
}

export function PlaygroundView({ json, isActive = false, onJsonUpdate, onPlaygroundReady, chatVisible, setChatVisible, tabBarVisible, setTabBarVisible }: PlaygroundViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [playgroundReady, setPlaygroundReady] = useState(false);
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      {/* Options Button */}
      <OptionsButton
        isMobile={isMobile}
        options={[
          {
            label: '🚀 Launch',
            onClick: launchPlayground,
            disabled: isLoading || !playgroundReady
          },
          {
            label: '🔄 Update & Open',
            onClick: refreshPlayground,
            disabled: isLoading || !playgroundReady
          },
          {
            label: '👁️ View Live',
            onClick: viewPage,
            disabled: !playgroundReady
          },
          {
            label: '⬇️ Pull Changes',
            onClick: pullFromPlayground,
            disabled: isLoading || !playgroundReady
          },
          {
            label: '📦 Export Site',
            onClick: exportSite,
            disabled: isLoading || !playgroundReady,
            divider: true
          },
          // Chat toggle
          ...(setChatVisible ? [{
            label: chatVisible ? 'Hide Chat' : 'Show Chat',
            onClick: () => setChatVisible(!chatVisible),
            type: 'toggle' as const,
            active: chatVisible
          }] : []),
          // Tab bar toggle
          ...(setTabBarVisible ? [{
            label: tabBarVisible ? 'Hide Tab Bar' : 'Show Tab Bar',
            onClick: () => setTabBarVisible(!tabBarVisible),
            type: 'toggle' as const,
            active: tabBarVisible
          }] : [])
        ]}
      />

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
