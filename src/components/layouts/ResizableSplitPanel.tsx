'use client';

import { useState, useRef, useEffect } from 'react';

interface ResizableSplitPanelProps {
  topPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
  initialSplitRatio?: number; // Percentage for top panel (0-100)
  onSplitRatioChange?: (ratio: number) => void;
}

export function ResizableSplitPanel({
  topPanel,
  bottomPanel,
  initialSplitRatio = 50,
  onSplitRatioChange,
}: ResizableSplitPanelProps) {
  const [splitRatio, setSplitRatio] = useState(initialSplitRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;

      // Calculate new ratio (clamped between 20% and 80%)
      const newRatio = Math.max(20, Math.min(80, (mouseY / containerHeight) * 100));

      setSplitRatio(newRatio);
      onSplitRatioChange?.(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onSplitRatioChange]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Top Panel */}
      <div
        style={{
          height: `${splitRatio}%`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {topPanel}
      </div>

      {/* Resizable Divider */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: '4px',
          background: 'var(--border)',
          cursor: 'ns-resize',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
          transition: isDragging ? 'none' : 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = 'var(--primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = 'var(--border)';
          }
        }}
      >
        {/* Visual handle indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '3px',
            background: isDragging ? 'var(--primary)' : 'var(--muted-foreground)',
            borderRadius: '2px',
            opacity: 0.5,
            transition: 'opacity 0.2s',
          }}
        />
      </div>

      {/* Bottom Panel */}
      <div
        style={{
          height: `${100 - splitRatio}%`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {bottomPanel}
      </div>
    </div>
  );
}
