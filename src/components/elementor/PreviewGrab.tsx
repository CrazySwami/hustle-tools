'use client';

import { useEffect, useRef, RefObject } from 'react';

interface PreviewGrabProps {
  /** Ref to the preview iframe element */
  previewRef: RefObject<HTMLIFrameElement>;
  /** Callback when an element is grabbed (click in inspect mode) */
  onGrabElement?: (elementData: {
    html: string;
    selector: string;
    classList: string[];
    tagName: string;
    attributes: Record<string, string>;
    computedStyles: Record<string, string>;
    context: string;
  }) => void;
  /** Whether inspect mode is active (default: false) */
  isActive?: boolean;
}

/**
 * Preview Grab - Grab elements from preview iframe with hover + click
 *
 * Inspired by react-grab and ElementInspector, but simpler and cleaner.
 * Works in production and respects same-origin policy.
 *
 * Usage:
 * 1. Enable inspect mode (via button toggle)
 * 2. Hover over elements to see blue highlight
 * 3. Click to grab element and send to AI chat
 */
export function PreviewGrab({ previewRef, onGrabElement, isActive = false }: PreviewGrabProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    console.log('🔍 PreviewGrab useEffect triggered:', { isActive, hasPreviewRef: !!previewRef.current });

    if (!isActive || !previewRef.current) {
      console.log('❌ PreviewGrab: Not active or no preview ref');
      return;
    }

    const iframe = previewRef.current;
    let iframeDoc: Document | null = null;

    // Try to access iframe document (same-origin only)
    try {
      iframeDoc = iframe.contentDocument || iframe.contentWindow?.document || null;
      console.log('✅ PreviewGrab: Got iframe document:', !!iframeDoc);
    } catch (e) {
      console.warn('PreviewGrab: Cannot access iframe (cross-origin)');
      return;
    }

    if (!iframeDoc) {
      console.log('❌ PreviewGrab: No iframe document available');
      return;
    }

    console.log('✅ PreviewGrab: Setting up inspect mode!');

    // Create overlay for highlighting
    const overlay = iframeDoc.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.border = '2px solid #3b82f6';
    overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'none';
    overlay.style.transition = 'all 0.1s ease';
    iframeDoc.body.appendChild(overlay);
    overlayRef.current = overlay;

    // Change cursor to crosshair in inspect mode
    iframeDoc.body.style.cursor = 'crosshair';

    // Hover handler - highlight element
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === iframeDoc?.body) return;

      currentTargetRef.current = target;

      // Position overlay over element
      const rect = target.getBoundingClientRect();
      if (overlay) {
        overlay.style.display = 'block';
        overlay.style.left = `${rect.left + (iframeDoc?.defaultView?.scrollX || 0)}px`;
        overlay.style.top = `${rect.top + (iframeDoc?.defaultView?.scrollY || 0)}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
      }
    };

    // Click handler - grab element
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (!target) return;

      try {
        // Extract element data
        const html = target.outerHTML;
        const tagName = target.tagName.toLowerCase();
        const classList = Array.from(target.classList);

        // Generate selector
        let selector = tagName;
        if (target.id) {
          selector = `#${target.id}`;
        } else if (classList.length > 0) {
          selector = `${tagName}.${classList.join('.')}`;
        }

        // Get all attributes
        const attributes: Record<string, string> = {};
        Array.from(target.attributes).forEach(attr => {
          attributes[attr.name] = attr.value;
        });

        // Get computed styles (key ones)
        const computedStyles: Record<string, string> = {};
        if (iframeDoc?.defaultView) {
          const styles = iframeDoc.defaultView.getComputedStyle(target);
          const importantProps = [
            'display', 'position', 'width', 'height', 'margin', 'padding',
            'color', 'background-color', 'font-size', 'font-family', 'font-weight',
            'border', 'border-radius', 'box-shadow', 'text-align', 'flex-direction',
            'align-items', 'justify-content', 'grid-template-columns', 'gap'
          ];
          importantProps.forEach(prop => {
            const value = styles.getPropertyValue(prop);
            if (value) {
              computedStyles[prop] = value;
            }
          });
        }

        // Get surrounding context (parent and siblings)
        const parent = target.parentElement;
        const siblings = parent ? Array.from(parent.children).filter(el => el !== target) : [];
        const context = `
Parent: ${parent?.tagName || 'none'}
Siblings: ${siblings.map(el => el.tagName).join(', ') || 'none'}
Position: ${Array.from(parent?.children || []).indexOf(target) + 1} of ${parent?.children.length || 0}
        `.trim();

        // Call callback with data
        if (onGrabElement) {
          onGrabElement({
            html,
            selector,
            classList,
            tagName,
            attributes,
            computedStyles,
            context
          });
        }

        // Visual feedback - flash green
        if (overlay) {
          overlay.style.border = '2px solid #10b981';
          overlay.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
          setTimeout(() => {
            overlay.style.border = '2px solid #3b82f6';
            overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          }, 300);
        }
      } catch (error) {
        console.error('PreviewGrab: Error grabbing element:', error);
      }
    };

    // Attach listeners to iframe document
    iframeDoc.addEventListener('mousemove', handleMouseMove);
    iframeDoc.addEventListener('click', handleClick, true); // Capture phase

    // Cleanup
    return () => {
      try {
        // Reset cursor
        if (iframeDoc?.body) {
          iframeDoc.body.style.cursor = '';
        }

        // Remove overlay
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }

        iframeDoc?.removeEventListener('mousemove', handleMouseMove);
        iframeDoc?.removeEventListener('click', handleClick, true);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [isActive, previewRef, onGrabElement]);

  return null; // This component doesn't render anything
}
