'use client';

import { ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { NavigationBar, type NavigationBarProps } from '@/components/ai-elements/inner-navigation-bar';

interface PanelConfig {
  /** The content to render in this panel */
  content: ReactNode;
  /** Default width percentage for this panel */
  defaultWidth?: number;
  /** Minimum width percentage (default: 15) */
  minWidth?: number;
  /** Maximum width percentage (default: 70) */
  maxWidth?: number;
  /** Optional navigation bar props for this panel */
  navigationBarProps?: NavigationBarProps;
}

interface TwoPanelChatLayoutProps {
  /** Left panel - typically the chat interface (30% default on desktop) */
  leftPanel?: ReactNode | PanelConfig;
  /** Center panel - optional middle content */
  centerPanel?: ReactNode | PanelConfig;
  /** Right panel - content area (editor, canvas, etc) (70% default on desktop) */
  rightPanel?: ReactNode | PanelConfig;
  /** Default split percentage for left panel (default: 30) - only used in 2-panel mode */
  defaultSplitPercent?: number;
  /** Minimum left panel width percentage (default: 25) - only used in 2-panel mode */
  minLeftPercent?: number;
  /** Maximum left panel width percentage (default: 75) - only used in 2-panel mode */
  maxLeftPercent?: number;
  /** Optional navigation bar props - if provided, renders NavigationBar - only used in 2-panel mode */
  navigationBarProps?: NavigationBarProps;
  /** Where to place the navigation bar: 'left' (inside left panel) or 'right' (inside right panel). Default: 'right' - only used in 2-panel mode */
  navigationBarPosition?: 'left' | 'right';
}

export function TwoPanelChatLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  defaultSplitPercent = 30,
  minLeftPercent = 25,
  maxLeftPercent = 75,
  navigationBarProps,
  navigationBarPosition = 'right',
}: TwoPanelChatLayoutProps) {
  // Determine if we're in 3-panel mode
  const isThreePanel = !!centerPanel;
  
  // Helper to check if a panel is a PanelConfig
  const isPanelConfig = (panel: any): panel is PanelConfig => {
    return panel && typeof panel === 'object' && 'content' in panel;
  };
  
  // Extract panel configurations for 3-panel mode
  const leftConfig: PanelConfig | null = isThreePanel && leftPanel
    ? (isPanelConfig(leftPanel) ? leftPanel : { content: leftPanel, defaultWidth: 25 })
    : null;
  const centerConfig: PanelConfig | null = isThreePanel && centerPanel
    ? (isPanelConfig(centerPanel) ? centerPanel : { content: centerPanel, defaultWidth: 50 })
    : null;
  const rightConfig: PanelConfig | null = isThreePanel && rightPanel
    ? (isPanelConfig(rightPanel) ? rightPanel : { content: rightPanel, defaultWidth: 25 })
    : null;
  // State for 2-panel mode
  const [leftPanelWidth, setLeftPanelWidth] = useState(defaultSplitPercent);
  const [isResizing, setIsResizing] = useState(false);
  
  // State for 3-panel mode
  const [leftWidth3, setLeftWidth3] = useState(leftConfig?.defaultWidth ?? 25);
  const [centerWidth3, setCenterWidth3] = useState(centerConfig?.defaultWidth ?? 50);
  const [rightWidth3, setRightWidth3] = useState(rightConfig?.defaultWidth ?? 25);
  const [resizingDivider, setResizingDivider] = useState<'left' | 'right' | null>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [leftPanelPixelWidth, setLeftPanelPixelWidth] = useState<number>(0);
  const [centerPanelPixelWidth, setCenterPanelPixelWidth] = useState<number>(0);
  const [rightPanelPixelWidth, setRightPanelPixelWidth] = useState<number>(0);
  
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const centerPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Measure panel widths in pixels for NavigationBar
  useEffect(() => {
    const updatePixelWidths = () => {
      if (leftPanelRef.current) {
        setLeftPanelPixelWidth(leftPanelRef.current.offsetWidth);
      }
      if (centerPanelRef.current) {
        setCenterPanelPixelWidth(centerPanelRef.current.offsetWidth);
      }
      if (rightPanelRef.current) {
        setRightPanelPixelWidth(rightPanelRef.current.offsetWidth);
      }
    };

    updatePixelWidths();

    const observers: ResizeObserver[] = [];
    
    if (leftPanelRef.current) {
      const observer = new ResizeObserver(updatePixelWidths);
      observer.observe(leftPanelRef.current);
      observers.push(observer);
    }
    if (centerPanelRef.current) {
      const observer = new ResizeObserver(updatePixelWidths);
      observer.observe(centerPanelRef.current);
      observers.push(observer);
    }
    if (rightPanelRef.current) {
      const observer = new ResizeObserver(updatePixelWidths);
      observer.observe(rightPanelRef.current);
      observers.push(observer);
    }

    return () => observers.forEach(observer => observer.disconnect());
  }, [leftPanelWidth, leftWidth3, centerWidth3, rightWidth3]);

  // Resize handlers for desktop divider (mouse and touch)
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isResizing) return;

      const container = document.getElementById('two-panel-container');
      if (!container) return;

      const touch = e.touches[0];
      const containerRect = container.getBoundingClientRect();
      const newWidthPercent = ((touch.clientX - containerRect.left) / containerRect.width) * 100;

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

  const handleTouchEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // 3-Panel resize handlers
  const handleLeftDividerMouseDown = useCallback(() => {
    setResizingDivider('left');
  }, []);

  const handleRightDividerMouseDown = useCallback(() => {
    setResizingDivider('right');
  }, []);

  const handle3PanelMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingDivider || !leftConfig || !centerConfig || !rightConfig) return;

      const container = document.getElementById('three-panel-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const mouseXPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (resizingDivider === 'left') {
        const minLeft = leftConfig.minWidth ?? 15;
        const maxLeft = leftConfig.maxWidth ?? 70;
        const minCenter = centerConfig.minWidth ?? 15;
        
        let newLeftWidth = Math.max(minLeft, Math.min(maxLeft, mouseXPercent));
        const remainingWidth = 100 - newLeftWidth - rightWidth3;
        if (remainingWidth < minCenter) {
          newLeftWidth = 100 - minCenter - rightWidth3;
        }
        
        const newCenterWidth = 100 - newLeftWidth - rightWidth3;
        setLeftWidth3(newLeftWidth);
        setCenterWidth3(newCenterWidth);
      } else if (resizingDivider === 'right') {
        const minCenter = centerConfig.minWidth ?? 15;
        const minRight = rightConfig.minWidth ?? 15;
        const maxRight = rightConfig.maxWidth ?? 70;
        
        let newRightWidth = 100 - mouseXPercent;
        newRightWidth = Math.max(minRight, Math.min(maxRight, newRightWidth));
        
        const remainingWidth = 100 - leftWidth3 - newRightWidth;
        if (remainingWidth < minCenter) {
          newRightWidth = 100 - leftWidth3 - minCenter;
        }
        
        const newCenterWidth = 100 - leftWidth3 - newRightWidth;
        setCenterWidth3(newCenterWidth);
        setRightWidth3(newRightWidth);
      }
    },
    [resizingDivider, leftWidth3, rightWidth3, leftConfig, centerConfig, rightConfig]
  );

  const handle3PanelMouseUp = useCallback(() => {
    setResizingDivider(null);
  }, []);

  useEffect(() => {
    if (resizingDivider) {
      document.addEventListener('mousemove', handle3PanelMouseMove);
      document.addEventListener('mouseup', handle3PanelMouseUp);
      return () => {
        document.removeEventListener('mousemove', handle3PanelMouseMove);
        document.removeEventListener('mouseup', handle3PanelMouseUp);
      };
    }
  }, [resizingDivider, handle3PanelMouseMove, handle3PanelMouseUp]);

  // 3-Panel layout renderer
  const render3PanelLayout = () => {
    if (!leftConfig || !centerConfig || !rightConfig) return null;

    if (isMobile) {
      return (
        <div className="flex flex-col h-full w-full overflow-auto">
          <div className="flex-shrink-0">
            {leftConfig.navigationBarProps && <NavigationBar {...leftConfig.navigationBarProps} />}
            {leftConfig.content}
          </div>
          <div className="flex-1">
            {centerConfig.navigationBarProps && <NavigationBar {...centerConfig.navigationBarProps} />}
            {centerConfig.content}
          </div>
          <div className="flex-shrink-0">
            {rightConfig.navigationBarProps && <NavigationBar {...rightConfig.navigationBarProps} />}
            {rightConfig.content}
          </div>
        </div>
      );
    }

    return (
      <div
        id="three-panel-container"
        className="flex h-full w-full"
        style={{ userSelect: resizingDivider ? 'none' : 'auto' }}
      >
        {/* Left Panel */}
        <div
          ref={leftPanelRef}
          className="flex flex-col h-full overflow-hidden"
          style={{ width: `${leftWidth3}%` }}
        >
          {leftConfig.navigationBarProps && (
            <NavigationBar {...leftConfig.navigationBarProps} containerWidth={leftPanelPixelWidth} />
          )}
          {leftConfig.content}
        </div>

        {/* Left Divider */}
        <DividerHandle
          onMouseDown={handleLeftDividerMouseDown}
          isResizing={resizingDivider === 'left'}
        />

        {/* Center Panel */}
        <div
          ref={centerPanelRef}
          className="flex flex-col h-full overflow-hidden"
          style={{ width: `${centerWidth3}%` }}
        >
          {centerConfig.navigationBarProps && (
            <NavigationBar {...centerConfig.navigationBarProps} containerWidth={centerPanelPixelWidth} />
          )}
          {centerConfig.content}
        </div>

        {/* Right Divider */}
        <DividerHandle
          onMouseDown={handleRightDividerMouseDown}
          isResizing={resizingDivider === 'right'}
        />

        {/* Right Panel */}
        <div
          ref={rightPanelRef}
          className="flex flex-col h-full overflow-hidden"
          style={{ width: `${rightWidth3}%` }}
        >
          {rightConfig.navigationBarProps && (
            <NavigationBar {...rightConfig.navigationBarProps} containerWidth={rightPanelPixelWidth} />
          )}
          {rightConfig.content}
        </div>
      </div>
    );
  };

  // Helper to extract content from panel (handles both ReactNode and PanelConfig)
  const getLeftContent = () => isPanelConfig(leftPanel) ? leftPanel.content : leftPanel;
  const getRightContent = () => isPanelConfig(rightPanel) ? rightPanel.content : rightPanel;

  // If in 3-panel mode, use the 3-panel layout
  if (isThreePanel && leftConfig && centerConfig && rightConfig) {
    return render3PanelLayout();
  }
  
  // Mobile layout: Stack based on navigation position
  if (isMobile) {
    // When nav is on left, show left panel on top, right panel below
    if (navigationBarPosition === 'left') {
      return (
        <div className="flex flex-col h-full w-full overflow-auto">
          {/* Navigation bar at top */}
          {navigationBarProps && (
            <NavigationBar {...navigationBarProps} />
          )}

          {/* Left panel (workflow/tabs) */}
          <div className="flex-shrink-0">
            {getLeftContent()}
          </div>

          {/* Right panel (client content) */}
          <div className="flex-1">
            {getRightContent()}
          </div>
        </div>
      );
    }

    // When nav is on right (default), show right panel on top, left panel as drawer below
    return (
      <div className="flex flex-col h-full w-full">
        {/* Navigation bar at top if positioned on right panel */}
        {navigationBarProps && (
          <NavigationBar {...navigationBarProps} />
        )}

        {/* Main content area (right panel on desktop) */}
        <div className="flex-1 overflow-auto">
          {getRightContent()}
        </div>

        {/* Chat drawer - slides up from bottom */}
        {/* Note: The actual drawer mechanism is handled by the chat component itself */}
        {/* This just ensures proper z-index stacking */}
        <div className="relative z-[3200] flex flex-col">
          {getLeftContent()}
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
      {/* Left Panel - Chat (30% default) */}
      <div
        ref={leftPanelRef}
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {/* Navigation bar inside left panel if positioned on left */}
        {navigationBarProps && navigationBarPosition === 'left' && (
          <NavigationBar {...navigationBarProps} containerWidth={leftPanelPixelWidth} />
        )}
        {getLeftContent()}
      </div>

      {/* Divider - Light gray line with grabbable handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="flex-shrink-0 cursor-col-resize relative"
        style={{
          width: '2px',
          background: isResizing ? 'var(--primary)' : 'rgba(150, 150, 150, 0.25)',
          transition: isResizing ? 'none' : 'background 0.2s',
        }}
      >
        {/* Grabbable handle - always visible */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '40px',
            background: isResizing ? 'var(--primary)' : 'rgba(150, 150, 150, 0.25)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '6px 0',
            transition: 'background 0.2s',
            pointerEvents: 'none',
          }}
        >
          {/* Three dots to indicate grabbable */}
          <div style={{
            width: '2px',
            height: '2px',
            background: 'rgba(100, 100, 100, 0.6)',
            borderRadius: '50%',
          }} />
          <div style={{
            width: '2px',
            height: '2px',
            background: 'rgba(100, 100, 100, 0.6)',
            borderRadius: '50%',
          }} />
          <div style={{
            width: '2px',
            height: '2px',
            background: 'rgba(100, 100, 100, 0.6)',
            borderRadius: '50%',
          }} />
        </div>
        {/* Wider invisible hit area for easier grabbing */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-6px',
            right: '-6px',
            bottom: 0,
          }}
        />
      </div>

      {/* Right Panel - Content (70% default) */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        {/* Navigation bar inside right panel if positioned on right */}
        {navigationBarProps && navigationBarPosition === 'right' && (
          <NavigationBar {...navigationBarProps} />
        )}
        {getRightContent()}
      </div>
    </div>
  );
}

// Reusable divider handle component
function DividerHandle({
  onMouseDown,
  isResizing,
}: {
  onMouseDown: () => void;
  isResizing: boolean;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="flex-shrink-0 cursor-col-resize relative group"
      style={{
        width: '1px',
        background: isResizing ? 'var(--primary)' : 'rgba(150, 150, 150, 0.08)',
        transition: isResizing ? 'none' : 'background 0.2s',
      }}
    >
      {/* Grabbable handle - visible on hover */}
      <div
        className="opacity-0 group-hover:opacity-100"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '12px',
          height: '28px',
          background: isResizing ? 'var(--primary)' : 'rgba(150, 150, 150, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          padding: '4px 0',
          transition: 'opacity 0.2s, background 0.2s',
          pointerEvents: 'none',
        }}
      >
        {/* Three dots to indicate grabbable */}
        <div style={{
          width: '2px',
          height: '2px',
          background: 'rgba(100, 100, 100, 0.7)',
          borderRadius: '50%',
        }} />
        <div style={{
          width: '2px',
          height: '2px',
          background: 'rgba(100, 100, 100, 0.7)',
          borderRadius: '50%',
        }} />
        <div style={{
          width: '2px',
          height: '2px',
          background: 'rgba(100, 100, 100, 0.7)',
          borderRadius: '50%',
        }} />
      </div>
      {/* Wider invisible hit area for easier grabbing */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-6px',
          right: '-6px',
          bottom: 0,
        }}
      />
    </div>
  );
}
