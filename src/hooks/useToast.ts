'use client';

import { useCallback } from 'react';
import type { Toast, ToastType } from '@/components/ui/Toast';

// Global toast state (simple approach without context for now)
let toastListeners: Array<(toast: Toast) => void> = [];
let toastId = 0;

export function useToast() {
  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const toast: Toast = {
      id: `toast-${++toastId}`,
      message,
      type,
      duration
    };

    // Notify all listeners
    toastListeners.forEach(listener => listener(toast));

    return toast.id;
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  return {
    showToast,
    success,
    error,
    info,
    warning
  };
}

// Hook for components that want to listen to toast events
export function useToastListener(listener: (toast: Toast) => void) {
  toastListeners.push(listener);

  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
}
