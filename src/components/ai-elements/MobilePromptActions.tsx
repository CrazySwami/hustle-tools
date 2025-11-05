'use client';

import { useState, useEffect, useRef, ReactNode, forwardRef } from 'react';
import { PromptInputButton } from '@/components/ai-elements/prompt-input';
import { MoreHorizontal, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PromptAction {
  id: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
  title?: string;
}

interface MobilePromptActionsProps {
  actions: PromptAction[];
  /** Breakpoint in pixels - below this, show dropdown. Default: 600px (matches NavigationBar compact breakpoint) */
  breakpoint?: number;
  /** Optional container width from parent - if not provided, will measure window width */
  containerWidth?: number;
  className?: string;
}

/**
 * Responsive action buttons that collapse into a dropdown menu on narrow containers.
 * Uses container width (from parent) or window width to determine layout.
 *
 * When container is wide: Shows all buttons horizontally
 * When container is narrow: Collapses into a single dropdown menu button
 */
export function MobilePromptActions({
  actions,
  breakpoint = 600,
  containerWidth,
  className,
}: MobilePromptActionsProps) {
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Always measure window width to ensure responsiveness
  useEffect(() => {
    const updateWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Use provided containerWidth or fall back to window width
  const effectiveWidth = containerWidth !== undefined && containerWidth > 0 ? containerWidth : windowWidth;

  // Determine if we should show dropdown (narrow container)
  const isNarrow = effectiveWidth > 0 && effectiveWidth < breakpoint;

  // Dropdown Menu View (for narrow containers)
  if (isNarrow) {
    return (
      <div ref={containerRef} className={cn('flex items-center gap-1', className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-lg text-muted-foreground"
              title="Toggle actions menu"
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {actions.map((action, index) => (
              <div key={action.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    action.onClick();
                  }}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {action.icon}
                    <span>{action.label}</span>
                  </div>
                  {action.isActive && (
                    <Check size={16} className="text-primary" />
                  )}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Standard Button View (for wide containers)
  return (
    <div ref={containerRef} className={cn('flex items-center gap-1', className)}>
      {actions.map((action) => (
        <PromptInputButton
          key={action.id}
          variant={action.isActive ? 'default' : 'ghost'}
          onClick={action.onClick}
          title={action.title || action.label}
        >
          {action.icon}
        </PromptInputButton>
      ))}
    </div>
  );
}
