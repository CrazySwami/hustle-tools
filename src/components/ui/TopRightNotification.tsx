/**
 * TopRightNotification Component
 *
 * Live progress notifications for auto-run mode and project generation.
 * Displays real-time status updates in the top-right corner.
 *
 * Features:
 * - Color-coded status indicators (green=complete, yellow=generating, red=error)
 * - Auto-dismiss after 3 seconds on completion
 * - Click to expand full progress details
 * - Mobile-optimized (always visible above keyboard)
 * - Integration with unified project generation system
 */

'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationStatus = 'idle' | 'analyzing' | 'generating' | 'parsing' | 'complete' | 'error';
export type NotificationPhase = 'html' | 'css' | 'js' | 'php' | 'hubl' | 'docs' | null;

export interface TopRightNotificationProps {
  /** Current status of the operation */
  status: NotificationStatus;

  /** Current file being generated/processed */
  phase?: NotificationPhase;

  /** Progress percentage (0-100) */
  progress?: number;

  /** Custom message to display */
  message?: string;

  /** Detailed description (shown on expand) */
  description?: string;

  /** Error message (if status is error) */
  error?: string;

  /** Auto-dismiss duration in ms (default: 3000) */
  autoDismissMs?: number;

  /** Whether notification is dismissible */
  dismissible?: boolean;

  /** Callback when notification is dismissed */
  onDismiss?: () => void;

  /** Callback when notification is clicked */
  onClick?: () => void;
}

export function TopRightNotification({
  status,
  phase,
  progress,
  message,
  description,
  error,
  autoDismissMs = 3000,
  dismissible = true,
  onDismiss,
  onClick
}: TopRightNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-dismiss on completion
  useEffect(() => {
    if (status === 'complete' && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [status, autoDismissMs, onDismiss]);

  // Hide notification when status is idle
  useEffect(() => {
    if (status === 'idle') {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [status]);

  // Don't render if not visible
  if (!isVisible || status === 'idle') {
    return null;
  }

  // Status icon and color
  const getStatusConfig = () => {
    switch (status) {
      case 'analyzing':
        return {
          icon: <Info className="w-4 h-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          iconColor: 'text-blue-600',
          label: 'Analyzing'
        };
      case 'generating':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          iconColor: 'text-yellow-600',
          label: 'Generating'
        };
      case 'parsing':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          iconColor: 'text-purple-600',
          label: 'Parsing'
        };
      case 'complete':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800 border-green-300',
          iconColor: 'text-green-600',
          label: 'Complete'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-800 border-red-300',
          iconColor: 'text-red-600',
          label: 'Error'
        };
      default:
        return {
          icon: <Info className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          iconColor: 'text-gray-600',
          label: 'Idle'
        };
    }
  };

  const config = getStatusConfig();

  // Get phase label
  const getPhaseLabel = () => {
    if (!phase) return null;
    const labels: Record<NonNullable<NotificationPhase>, string> = {
      html: 'HTML',
      css: 'CSS',
      js: 'JavaScript',
      php: 'PHP',
      hubl: 'HubL',
      docs: 'Documentation'
    };
    return labels[phase];
  };

  const phaseLabel = getPhaseLabel();

  // Format message
  const displayMessage = message ||
    (status === 'error' ? (error || 'An error occurred') :
    phaseLabel ? `${config.label} ${phaseLabel}...` :
    `${config.label}...`);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'min-w-[280px] max-w-[400px]',
        'rounded-lg border-2 shadow-lg',
        'transition-all duration-300 ease-in-out',
        'animate-in slide-in-from-top-2',
        config.color,
        onClick && 'cursor-pointer hover:shadow-xl',
        'md:top-6 md:right-6' // More padding on desktop
      )}
      onClick={() => {
        if (onClick) {
          onClick();
        } else if (description) {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {/* Main notification body */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Message */}
            <div className="font-semibold text-sm leading-tight">
              {displayMessage}
            </div>

            {/* Progress bar */}
            {progress !== undefined && status === 'generating' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="opacity-75">Progress</span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      status === 'generating' ? 'bg-yellow-500' : 'bg-green-500'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expanded description */}
            {isExpanded && description && (
              <div className="mt-2 text-xs opacity-75 leading-relaxed">
                {description}
              </div>
            )}

            {/* Click hint */}
            {description && !isExpanded && (
              <div className="mt-1 text-xs opacity-50">
                Click to expand
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                onDismiss?.();
              }}
              className={cn(
                'flex-shrink-0 p-1 rounded hover:bg-black/10',
                'transition-colors'
              )}
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Animated border for generating state */}
      {status === 'generating' && (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute inset-0 border-2 border-yellow-400',
            'animate-pulse'
          )} />
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage notification state
 *
 * Example usage:
 * ```tsx
 * const notification = useNotification();
 *
 * // Start generation
 * notification.show('generating', { phase: 'html', progress: 0 });
 *
 * // Update progress
 * notification.update({ progress: 50 });
 *
 * // Complete
 * notification.complete('Generation complete!');
 *
 * // Error
 * notification.error('Failed to generate');
 * ```
 */
export function useNotification() {
  const [config, setConfig] = useState<Omit<TopRightNotificationProps, 'status'> & { status: NotificationStatus }>({
    status: 'idle',
    dismissible: true
  });

  const show = (
    status: NotificationStatus,
    options?: Partial<Omit<TopRightNotificationProps, 'status'>>
  ) => {
    setConfig(prev => ({
      ...prev,
      status,
      ...options
    }));
  };

  const update = (options: Partial<Omit<TopRightNotificationProps, 'status'>>) => {
    setConfig(prev => ({
      ...prev,
      ...options
    }));
  };

  const complete = (message?: string) => {
    setConfig(prev => ({
      ...prev,
      status: 'complete',
      message: message || 'Operation complete!',
      progress: 100
    }));
  };

  const error = (errorMessage: string) => {
    setConfig(prev => ({
      ...prev,
      status: 'error',
      error: errorMessage,
      message: undefined
    }));
  };

  const hide = () => {
    setConfig(prev => ({
      ...prev,
      status: 'idle'
    }));
  };

  return {
    show,
    update,
    complete,
    error,
    hide,
    config,
    NotificationComponent: <TopRightNotification {...config} />
  };
}
