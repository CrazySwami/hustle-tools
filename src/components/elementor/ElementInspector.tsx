'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Copy, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ElementInspectorProps {
  previewRef: React.RefObject<HTMLIFrameElement>;
  onEditElement?: (elementData: {
    html: string;
    selector: string;
    classList: string[];
    context: string;
  }) => void;
}

export function ElementInspector({ previewRef, onEditElement }: ElementInspectorProps) {
  const [isActive, setIsActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [elementData, setElementData] = useState<any>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Extract element information
  const getElementData = useCallback((element: HTMLElement) => {
    if (!element) return null;

    // Get element's HTML
    const html = element.outerHTML;

    // Generate selector
    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
    }
    if (element.className) {
      const classes = Array.from(element.classList);
      selector += classes.map(c => `.${c}`).join('');
    }

    // Get classList
    const classList = Array.from(element.classList);

    // Get context (parent HTML)
    const parent = element.parentElement;
    const context = parent ? parent.outerHTML : html;

    // Get computed styles
    const iframe = previewRef.current;
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    const computedStyles = iframeDoc ? iframeDoc.defaultView?.getComputedStyle(element) : null;

    // Extract relevant CSS properties
    const relevantStyles: Record<string, string> = {};
    if (computedStyles) {
      const props = [
        'display', 'position', 'width', 'height', 'padding', 'margin',
        'background', 'background-color', 'color', 'font-size', 'font-family',
        'border', 'border-radius', 'box-shadow', 'flex', 'grid',
      ];
      props.forEach(prop => {
        const value = computedStyles.getPropertyValue(prop);
        if (value) relevantStyles[prop] = value;
      });
    }

    // Get bounding rect for overlay positioning
    const rect = element.getBoundingClientRect();

    return {
      html,
      selector,
      classList,
      context,
      styles: relevantStyles,
      tagName: element.tagName.toLowerCase(),
      textContent: element.textContent?.trim().substring(0, 100),
      rect,
    };
  }, [previewRef]);

  // Handle mouse move in iframe
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;

    const target = e.target as HTMLElement;
    if (!target || target === hoveredElement) return;

    // Avoid inspecting the overlay itself
    if (target.closest?.('.element-inspector-overlay')) return;

    setHoveredElement(target);

    // Update overlay position
    const rect = target.getBoundingClientRect();
    if (overlayRef.current) {
      const overlay = overlayRef.current;
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.display = 'block';
    }
  }, [isActive, hoveredElement]);

  // Handle click in iframe
  const handleClick = useCallback((e: MouseEvent) => {
    if (!isActive) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (!target || target.closest?.('.element-inspector-overlay')) return;

    setSelectedElement(target);
    const data = getElementData(target);
    setElementData(data);

    console.log('🎯 Element selected:', data);
  }, [isActive, getElementData]);

  // Attach/detach iframe listeners
  useEffect(() => {
    if (!isActive || !previewRef.current) return;

    const iframe = previewRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Create overlay in iframe
    let overlay = iframeDoc.querySelector('.element-inspector-overlay') as HTMLDivElement;
    if (!overlay) {
      overlay = iframeDoc.createElement('div');
      overlay.className = 'element-inspector-overlay';
      overlay.style.cssText = `
        position: absolute;
        pointer-events: none;
        border: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        z-index: 999999;
        display: none;
        transition: all 0.1s ease;
      `;
      iframeDoc.body.appendChild(overlay);
      overlayRef.current = overlay;
    }

    iframeDoc.addEventListener('mousemove', handleMouseMove);
    iframeDoc.addEventListener('click', handleClick);

    return () => {
      iframeDoc.removeEventListener('mousemove', handleMouseMove);
      iframeDoc.removeEventListener('click', handleClick);
      if (overlay) {
        overlay.style.display = 'none';
      }
    };
  }, [isActive, previewRef, handleMouseMove, handleClick]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!elementData) return;

    const text = `Element: ${elementData.selector}
HTML:
${elementData.html}

CSS Classes: ${elementData.classList.join(', ')}

Computed Styles:
${Object.entries(elementData.styles).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`;

    await navigator.clipboard.writeText(text);
    alert('✅ Element data copied to clipboard!');
  };

  // Send to chat
  const sendToChat = () => {
    if (!elementData || !onEditElement) return;

    onEditElement({
      html: elementData.html,
      selector: elementData.selector,
      classList: elementData.classList,
      context: elementData.context,
    });

    // Reset
    setSelectedElement(null);
    setElementData(null);
    setIsActive(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsActive(!isActive)}
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        className={`fixed bottom-4 right-4 z-50 ${isActive ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
      >
        <Eye className="h-4 w-4 mr-2" />
        {isActive ? 'Inspecting...' : 'Inspect Elements'}
      </Button>

      {/* Element Info Panel */}
      {selectedElement && elementData && (
        <Card className="fixed bottom-20 right-4 z-50 w-96 max-h-96 overflow-auto shadow-lg">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Selected Element
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedElement(null);
                  setElementData(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Element Info */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold">Tag:</span>{' '}
                <code className="bg-muted px-1 py-0.5 rounded">{elementData.tagName}</code>
              </div>
              <div>
                <span className="font-semibold">Selector:</span>{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs break-all">
                  {elementData.selector}
                </code>
              </div>
              {elementData.classList.length > 0 && (
                <div>
                  <span className="font-semibold">Classes:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {elementData.classList.map((cls: string) => (
                      <span key={cls} className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {elementData.textContent && (
                <div>
                  <span className="font-semibold">Text:</span>{' '}
                  <span className="text-muted-foreground">{elementData.textContent}</span>
                </div>
              )}
            </div>

            {/* HTML Preview */}
            <div>
              <div className="font-semibold text-xs mb-1">HTML:</div>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-32">
                {elementData.html.substring(0, 300)}
                {elementData.html.length > 300 && '...'}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                onClick={sendToChat}
                size="sm"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Edit in Chat
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {isActive && !selectedElement && (
        <div className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow-lg text-sm">
          👆 Hover over elements and click to select
        </div>
      )}
    </>
  );
}
