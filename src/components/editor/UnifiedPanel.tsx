'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PanelType = 'documents' | 'comments' | 'tools' | 'toc' | null;

interface UnifiedPanelProps {
  type: PanelType;
  onClose: () => void;
  position: 'left' | 'right';
  children: React.ReactNode;
}

export function UnifiedPanel({ type, onClose, position, children }: UnifiedPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!type) return null;

  return (
    <div
      className={cn(
        "bg-[#FAFAFA] dark:bg-[#2C2C2C] border flex flex-col rounded-lg",
        "transition-all duration-300 ease-in-out",
        // Slide-in animation from the side
        "animate-in fade-in",
        position === 'left' ? 'slide-in-from-left-5' : 'slide-in-from-right-5',
        // Mobile: full width and full height
        "w-full h-full",
        // Desktop: sticky with reduced max-height, fixed width based on collapsed state
        "md:sticky md:top-4 md:max-h-[60vh]",
        position === 'left' ? 'md:border-r' : 'md:border-l',
        isCollapsed ? 'md:w-12' : 'md:w-80'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-white/50 dark:bg-white/5 flex-shrink-0">
        {!isCollapsed && (
          <h3 className="text-sm font-medium capitalize">{type}</h3>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-muted rounded"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              position === 'left' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            ) : (
              position === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}
