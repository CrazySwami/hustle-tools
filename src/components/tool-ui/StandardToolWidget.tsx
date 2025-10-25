'use client';

import { useState } from 'react';
import { ChevronDown, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * StandardToolWidget - Reference Implementation
 *
 * This is the canonical example of how all tool widgets should be structured.
 * Copy this component as a starting point for new tools.
 *
 * Design Principles:
 * 1. Clean, compact layout matching AI Elements design system
 * 2. Smooth animations for all state transitions
 * 3. Collapsible sections for information density
 * 4. Clear visual hierarchy with consistent spacing
 * 5. Green accents for success, blue for info, red for errors
 */

interface StandardToolWidgetProps {
  // Tool result data - customize this interface for your tool
  result: {
    success?: boolean;
    title: string;
    description?: string;
    data?: any;
    error?: string;
  };

  // Optional callbacks from parent
  onAction?: () => void;
  actionLabel?: string;
}

export function StandardToolWidget({ result, onAction, actionLabel = 'Execute' }: StandardToolWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleAction = async () => {
    setStatus('loading');
    try {
      await onAction?.();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000); // Reset after 2s
    } catch (error) {
      setStatus('error');
    }
  };

  // Determine icon and colors based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        };
      default:
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
          bgColor: 'bg-muted/10',
          borderColor: 'border-border/50',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header - Always Visible */}
      <div className={`flex items-center justify-between border-b border-border/50 px-4 py-3 transition-colors duration-200 ${
        status === 'loading' ? 'bg-blue-500/5' :
        status === 'success' ? 'bg-green-500/5' :
        status === 'error' ? 'bg-red-500/5' : ''
      }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 ${config.bgColor}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{result.title}</h3>
            {result.description && (
              <p className="text-xs text-muted-foreground truncate">{result.description}</p>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
        >
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Main Content Area */}
          <div className="p-4 space-y-3">
            {result.error ? (
              <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
              </div>
            ) : (
              <>
                {/* Example: Data Display */}
                {result.data && (
                  <div className="space-y-2">
                    {Object.entries(result.data).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-muted-foreground min-w-[80px]">
                          {key}:
                        </span>
                        <span className="flex-1">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer - Actions */}
          {onAction && (
            <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-3 bg-muted/20">
              <Button
                onClick={handleAction}
                disabled={status === 'loading'}
                size="sm"
                className="h-8 text-xs transition-all duration-200"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3 w-3" />
                    Done!
                  </>
                ) : (
                  actionLabel
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * USAGE EXAMPLE
 *
 * In your tool-result-renderer.tsx:
 *
 * ```tsx
 * import { StandardToolWidget } from './StandardToolWidget';
 *
 * case 'yourTool':
 *   return (
 *     <StandardToolWidget
 *       result={{
 *         title: "Your Tool Result",
 *         description: "Completed successfully",
 *         data: {
 *           field1: "value1",
 *           field2: "value2"
 *         }
 *       }}
 *       onAction={async () => {
 *         // Optional action handler
 *       }}
 *       actionLabel="Apply Changes"
 *     />
 *   );
 * ```
 */
