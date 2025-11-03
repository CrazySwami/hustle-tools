'use client';

import { ReactNode, useState, useCallback, useEffect } from 'react';
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Divider - Transparent with hover effect */}
      <div
        onMouseDown={handleMouseDown}
        className="flex-shrink-0 cursor-col-resize transition-colors"
        style={{
          width: '2px',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
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
