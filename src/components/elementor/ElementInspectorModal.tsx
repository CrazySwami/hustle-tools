'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ElementData {
  html: string;
  selector: string;
  classList: string[];
  tagName: string;
  attributes: Record<string, string>;
  computedStyles: Record<string, string>;
  context: string;
}

interface ElementInspectorModalProps {
  elementData: ElementData | null;
  onClose: () => void;
  onSubmit: (prompt: string, elementData: ElementData) => void;
}

export function ElementInspectorModal({
  elementData,
  onClose,
  onSubmit,
}: ElementInspectorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!elementData) return null;

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onSubmit(prompt, elementData);
    setPrompt('');
    onClose();
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatStyles = (styles: Record<string, string>) => {
    return Object.entries(styles)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
  };

  const formatAttributes = (attrs: Record<string, string>) => {
    return Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 pointer-events-none overflow-hidden">
        <div
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-semibold">Element Inspector</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
                <code className="px-2 py-0.5 bg-muted rounded text-primary font-mono text-xs">
                  {elementData.selector}
                </code>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0 ml-2"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - Scrollable with max-height */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4 min-h-0">
            {/* HTML Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">HTML</h3>
                <button
                  onClick={() => handleCopy(elementData.html, 'html')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-muted rounded-md transition-colors"
                >
                  {copiedSection === 'html' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-32 md:max-h-48">
                <code>{elementData.html}</code>
              </pre>
            </div>

            {/* Attributes Section */}
            {Object.keys(elementData.attributes).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Attributes</h3>
                  <button
                    onClick={() => handleCopy(formatAttributes(elementData.attributes), 'attributes')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-muted rounded-md transition-colors"
                  >
                    {copiedSection === 'attributes' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-32 md:max-h-40 overflow-y-auto">
                  <code>{formatAttributes(elementData.attributes)}</code>
                </pre>
              </div>
            )}

            {/* Computed Styles Section */}
            {Object.keys(elementData.computedStyles).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Computed Styles</h3>
                  <button
                    onClick={() => handleCopy(formatStyles(elementData.computedStyles), 'styles')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-muted rounded-md transition-colors"
                  >
                    {copiedSection === 'styles' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-32 md:max-h-40 overflow-y-auto">
                  <code>{formatStyles(elementData.computedStyles)}</code>
                </pre>
              </div>
            )}

            {/* Context Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Context</h3>
                <button
                  onClick={() => handleCopy(elementData.context, 'context')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-muted rounded-md transition-colors"
                >
                  {copiedSection === 'context' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-24 md:max-h-32 overflow-y-auto">
                <code>{elementData.context}</code>
              </pre>
            </div>
          </div>

          {/* Footer - Prompt Input - Fixed */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-border space-y-2 md:space-y-3 flex-shrink-0">
            <div className="space-y-2">
              <label htmlFor="prompt" className="block text-sm font-medium">
                What would you like to do with this element?
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Change the background color to blue, make the text bold, add a border..."
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                rows={2}
                style={{ maxHeight: '120px' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <p className="text-xs text-muted-foreground hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Enter</kbd> to submit
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send to Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
