'use client';

import { ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { NavigationBar, type NavigationBarProps } from '@/components/ai-elements/inner-navigation-bar';

interface TwoPanelChatLayoutProps {
  /** Left panel - typically the chat interface (40% default on desktop) */
  leftPanel: ReactNode;
  /** Right panel - content area (editor, canvas, etc) (60% default on desktop) */
  rightPanel: ReactNode;
  /** Default split percentage for left panel (default: 40) */
  defaultSplitPercent?: number;
  /** Minimum left panel width percentage (default: 25) */
  minLeftPercent?: number;
  /** Maximum left panel width percentage (default: 75) */
  maxLeftPercent?: number;
  /** Optional navigation bar props - if provided, renders NavigationBar */
  navigationBarProps?: NavigationBarProps;
  /** Where to place the navigation bar: 'left' (inside left panel) or 'right' (inside right panel). Default: 'right' */
  navigationBarPosition?: 'left' | 'right';
}

export function TwoPanelChatLayout({
  leftPanel,
  rightPanel,
  defaultSplitPercent = 40,
  minLeftPercent = 25,
  maxLeftPercent = 75,
  navigationBarProps,
  navigationBarPosition = 'right',
}: TwoPanelChatLayoutProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(defaultSplitPercent);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [leftPanelPixelWidth, setLeftPanelPixelWidth] = useState<number>(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Measure left panel width in pixels for NavigationBar
  useEffect(() => {
    if (!leftPanelRef.current) return;

    const updatePixelWidth = () => {
      if (leftPanelRef.current) {
        const width = leftPanelRef.current.offsetWidth;
        setLeftPanelPixelWidth(width);
      }
    };

    // Initial measurement
    updatePixelWidth();

    // Set up ResizeObserver to track panel width changes
    const observer = new ResizeObserver(updatePixelWidth);
    observer.observe(leftPanelRef.current);

    return () => observer.disconnect();
  }, [leftPanelWidth]);

  // Resize handlers for desktop divider
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.getElementById('two-panel-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain within min/max bounds
      const constrainedWidth = Math.max(
        minLeftPercent,
        Math.min(maxLeftPercent, newWidthPercent)
      );

      setLeftPanelWidth(constrainedWidth);
    },
    [isResizing, minLeftPercent, maxLeftPercent]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Mobile layout: Content main view, chat drawer from bottom
  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Navigation bar at top if positioned on right panel */}
        {navigationBarProps && navigationBarPosition === 'right' && (
          <NavigationBar {...navigationBarProps} />
        )}

        {/* Main content area (right panel on desktop) */}
        <div className="flex-1 overflow-auto">
          {rightPanel}
        </div>

        {/* Chat drawer - slides up from bottom */}
        {/* Note: The actual drawer mechanism is handled by the chat component itself */}
        {/* This just ensures proper z-index stacking */}
        <div className="relative z-[3200] flex flex-col">
          {/* Navigation bar inside chat drawer if positioned on left panel */}
          {navigationBarProps && navigationBarPosition === 'left' && (
            <NavigationBar {...navigationBarProps} />
          )}
          {leftPanel}
        </div>
      </div>
    );
  }

  // Desktop layout: Resizable two-panel split
  return (
    <div
      id="two-panel-container"
      className="flex h-full w-full"
      style={{ userSelect: isResizing ? 'none' : 'auto' }}
    >
      {/* Left Panel - Chat (40% default) */}
      <div
        ref={leftPanelRef}
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {/* Navigation bar inside left panel if positioned on left */}
        {navigationBarProps && navigationBarPosition === 'left' && (
          <NavigationBar {...navigationBarProps} containerWidth={leftPanelPixelWidth} />
        )}
        {leftPanel}
      </div>

      {/* Divider - Light gray line with grabbable handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex-shrink-0 cursor-col-resize relative group"
        style={{
          width: '1px',
          background: isResizing ? 'var(--primary)' : 'rgba(150, 150, 150, 0.2)',
          transition: isResizing ? 'none' : 'background 0.2s',
        }}
      >
        {/* Grabbable handle in the middle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '60px',
            background: isResizing ? 'var(--primary)' : 'rgba(150, 150, 150, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px 0',
            transition: 'all 0.2s',
            opacity: isResizing ? 1 : 0,
            pointerEvents: 'none',
          }}
          className="group-hover:opacity-100"
        >
          {/* Three horizontal dots to indicate grabbable */}
          <div style={{
            width: '3px',
            height: '3px',
            background: 'currentColor',
            borderRadius: '50%',
            opacity: 0.7,
          }} />
          <div style={{
            width: '3px',
            height: '3px',
            background: 'currentColor',
            borderRadius: '50%',
            opacity: 0.7,
          }} />
          <div style={{
            width: '3px',
            height: '3px',
            background: 'currentColor',
            borderRadius: '50%',
            opacity: 0.7,
          }} />
        </div>
        {/* Wider invisible hit area for easier grabbing */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-4px',
            right: '-4px',
            bottom: 0,
          }}
        />
      />

      {/* Right Panel - Content (60% default) */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        {/* Navigation bar inside right panel if positioned on right */}
        {navigationBarProps && navigationBarPosition === 'right' && (
          <NavigationBar {...navigationBarProps} />
        )}
        {rightPanel}
      </div>
    </div>
  );
}
