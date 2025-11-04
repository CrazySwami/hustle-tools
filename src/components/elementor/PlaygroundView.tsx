'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCwIcon, ExternalLinkIcon, EyeIcon, DownloadIcon, PackageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/button';

interface PlaygroundViewProps {
  json: any;
  isActive?: boolean;
  onJsonUpdate?: (json: any) => void;
  onPlaygroundReady?: () => void;
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
  isTabVisible?: boolean;
}

export function PlaygroundView({ json, isActive = false, onJsonUpdate, onPlaygroundReady, chatVisible, setChatVisible, tabBarVisible, setTabBarVisible, isTabVisible = true }: PlaygroundViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [playgroundReady, setPlaygroundReady] = useState(false);
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'live' | 'editor'>('live');
  const hasLaunchedRef = useRef(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if playground script is loaded
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total

    const checkPlayground = setInterval(() => {
      attempts++;

      if (typeof window !== 'undefined' && (window as any).openPlaygroundDirect) {
        console.log('✅ Playground functions found!');
        setPlaygroundReady(true);
        clearInterval(checkPlayground);
      } else if (attempts >= maxAttempts) {
        console.error('❌ Playground script failed to load after 5 seconds');
        setStatus('Failed to load playground script');
        clearInterval(checkPlayground);
      }
    }, 100);

    return () => clearInterval(checkPlayground);
  }, []);

  // Auto-launch playground in background as soon as script is ready (no need to wait for tab activation)
  useEffect(() => {
    if (playgroundReady && !hasLaunchedRef.current) {
      hasLaunchedRef.current = true;
      setTimeout(() => {
        console.log('🚀 Auto-launching WordPress Playground in background...');
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
  }, [playgroundReady, onPlaygroundReady]); // Removed isActive - launch immediately when ready

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

  const goBack = async () => {
    if (!playgroundReady || !(window as any).playgroundClient) return;

    try {
      const playgroundClient = (window as any).playgroundClient;

      // Use the WordPress Playground client to execute JavaScript in the iframe
      await playgroundClient.run({
        code: `<?php
          // Inject JavaScript to go back in history
          echo '<script>window.history.back();</script>';
        ?>`
      });
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  };

  const goForward = async () => {
    if (!playgroundReady || !(window as any).playgroundClient) return;

    try {
      const playgroundClient = (window as any).playgroundClient;

      // Use the WordPress Playground client to execute JavaScript in the iframe
      await playgroundClient.run({
        code: `<?php
          // Inject JavaScript to go forward in history
          echo '<script>window.history.forward();</script>';
        ?>`
      });
    } catch (error) {
      console.error('Failed to go forward:', error);
    }
  };

  const switchToLivePage = async () => {
    if (!playgroundReady || !(window as any).playgroundClient) return;

    try {
      const playgroundClient = (window as any).playgroundClient;
      const currentPageId = (window as any).currentPageId;

      if (currentPageId) {
        // Navigate to the live page with cache-busting
        const timestamp = Date.now();
        await playgroundClient.goTo(`/?page_id=${currentPageId}&v=${timestamp}`);
        console.log('📄 Navigated to live page');
      } else {
        // Default to home page if no page ID
        await playgroundClient.goTo('/');
        console.log('🏠 Navigated to home page');
      }

      setActivePlaygroundTab('live');
    } catch (error) {
      console.error('Failed to switch to live page:', error);
    }
  };

  const switchToEditor = async () => {
    if (!playgroundReady || !(window as any).playgroundClient) return;

    try {
      const playgroundClient = (window as any).playgroundClient;
      const currentPageId = (window as any).currentPageId;

      if (currentPageId) {
        // Navigate to the Elementor editor
        await playgroundClient.goTo(`/wp-admin/post.php?post=${currentPageId}&action=elementor`);
        console.log('🎨 Navigated to Elementor editor');
      } else {
        // Default to wp-admin if no page ID
        await playgroundClient.goTo('/wp-admin/');
        console.log('⚙️ Navigated to wp-admin');
      }

      setActivePlaygroundTab('editor');
    } catch (error) {
      console.error('Failed to switch to editor:', error);
    }
  };

  return (
    <div className="playground-container" id="playgroundContainer" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--background)',
        zIndex: 100,
      }}>
        {/* Back/Forward Buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          disabled={!playgroundReady}
          title="Go back"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={goForward}
          disabled={!playgroundReady}
          title="Go forward"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          <Button
            variant={activePlaygroundTab === 'live' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={switchToLivePage}
            disabled={!playgroundReady}
            className="h-8 px-3 text-xs"
          >
            Live Page
          </Button>
          <Button
            variant={activePlaygroundTab === 'editor' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={switchToEditor}
            disabled={!playgroundReady}
            className="h-8 px-3 text-xs"
          >
            Editor
          </Button>
        </div>
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
        style={{ flex: 1, border: 'none' }}
      />

    </div>
  );
}
