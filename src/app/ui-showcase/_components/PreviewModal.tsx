'use client';

import { useEffect, useCallback, useState } from 'react';
import { Sandpack, SandpackTheme } from '@codesandbox/sandpack-react';

interface RegistryItem {
  name: string;
  description?: string;
  file?: string;
  route?: string;
  story?: string;
  tests?: string;
  variants?: string[];
  status?: string;
  created_at?: string;
  uses_components?: string[];
  props_interface?: string;
}

interface PreviewModalProps {
  id: string;
  type: 'component' | 'page';
  data: RegistryItem;
  onClose: () => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

/**
 * Preview Modal Component
 *
 * Displays a modal with live preview of a component or page.
 * Features:
 * - Components: Dynamic import with error boundary isolation
 * - Pages: Iframe with responsive viewport controls
 * - Variant switching for components
 *
 * Created with Hustle UI Create workflow (v3.9.2)
 */
export function PreviewModal({ id, type, data, onClose }: PreviewModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // Get page route from file path
  const getPageRoute = () => {
    if (data.route) return data.route;
    if (data.file?.includes('src/app/')) {
      const match = data.file.match(/src\/app\/(.+?)\/page\.tsx?$/);
      if (match) return `/${match[1]}`;
    }
    return `/${id}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-900">
        {/* Header - Hustle accent bar */}
        <div className="h-1 w-full bg-[#BA0C2F]" />
        <header className="flex items-center justify-between border-b-2 border-black px-6 py-4 dark:border-gray-700">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-black dark:text-white">
              {data.name || id}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {type === 'component' ? 'Component Preview' : 'Page Preview'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black p-2 transition-colors hover:border-[#BA0C2F] hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
            aria-label="Close preview"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto">
          {type === 'component' ? (
            <ComponentPreview id={id} data={data} />
          ) : (
            <PagePreview route={getPageRoute()} />
          )}
        </div>

        {/* Footer */}
        <footer className="border-t-2 border-black bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {data.description && (
                <p className="line-clamp-1">{data.description}</p>
              )}
              {data.created_at && (
                <p className="mt-1">Created: {data.created_at}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {type === 'page' && (
                <a
                  href={getPageRoute()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:border-[#BA0C2F] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Open Full Page
                </a>
              )}
              <button
                onClick={() => {
                  const importPath = data.file?.replace(/^src\//, '@/').replace(/\.tsx?$/, '');
                  if (importPath) {
                    navigator.clipboard.writeText(
                      `import { ${data.name || id} } from '${importPath}';`
                    );
                  }
                }}
                className="border-2 border-black bg-[#BA0C2F] px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#8a0923]"
              >
                Copy Import
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Hustle Together theme for Sandpack
const hustleTheme: SandpackTheme = {
  colors: {
    surface1: '#ffffff',
    surface2: '#f8f8f8',
    surface3: '#f0f0f0',
    clickable: '#666666',
    base: '#000000',
    disabled: '#cccccc',
    hover: '#BA0C2F',
    accent: '#BA0C2F',
    error: '#ef4444',
    errorSurface: '#fef2f2',
  },
  syntax: {
    plain: '#000000',
    comment: { color: '#666666', fontStyle: 'italic' },
    keyword: '#BA0C2F',
    tag: '#BA0C2F',
    punctuation: '#000000',
    definition: '#000000',
    property: '#BA0C2F',
    static: '#BA0C2F',
    string: '#22c55e',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Fira Code", monospace',
    size: '13px',
    lineHeight: '1.5',
  },
};

// Generate example code for different component types
function generateComponentCode(name: string, variants: string[], selectedVariant: string | null): string {
  const variant = selectedVariant || variants[0] || 'primary';

  // Generate code based on component type
  switch (name.toLowerCase()) {
    case 'button':
      return `export default function App() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
      <h2 style={{ margin: 0, fontFamily: 'system-ui' }}>Button - ${variant}</h2>

      {/* ${variant} variant */}
      <button style={{
        padding: '0.75rem 1.5rem',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '2px solid ${variant === 'ghost' ? '#000' : '#BA0C2F'}',
        background: '${variant === 'ghost' ? 'transparent' : variant === 'secondary' ? '#fff' : '#BA0C2F'}',
        color: '${variant === 'ghost' || variant === 'secondary' ? '#000' : '#fff'}',
        cursor: 'pointer',
      }}>
        Click Me
      </button>

      {/* All variants */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        ${variants.map(v => `<button style={{
          padding: '0.5rem 1rem',
          fontSize: '12px',
          fontWeight: 'bold',
          border: '2px solid ${v === 'ghost' ? '#000' : '#BA0C2F'}',
          background: '${v === 'ghost' ? 'transparent' : v === 'secondary' ? '#fff' : '#BA0C2F'}',
          color: '${v === 'ghost' || v === 'secondary' ? '#000' : '#fff'}',
          cursor: 'pointer',
        }}>${v}</button>`).join('\n        ')}
      </div>
    </div>
  );
}`;

    case 'card':
      return `export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h2 style={{ margin: '0 0 1rem' }}>Card - ${variant}</h2>

      <div style={{
        border: '${variant === 'bordered' ? '2px solid #000' : '1px solid #ccc'}',
        boxShadow: '${variant === 'elevated' ? '4px 4px 0 rgba(0,0,0,0.1)' : 'none'}',
        background: '#fff',
        maxWidth: '320px',
      }}>
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0, fontWeight: 'bold' }}>Card Title</h3>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
          <p style={{ margin: 0, color: '#666' }}>
            This is a ${variant} card variant. Cards are used to group related content.
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid #eee', background: '#f8f8f8' }}>
          <button style={{
            padding: '0.5rem 1rem',
            background: '#BA0C2F',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>Action</button>
        </div>
      </div>
    </div>
  );
}`;

    case 'formfield':
      return `import { useState } from 'react';

export default function App() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setValue(e.target.value);
    setError(e.target.value.length < 3 ? 'Must be at least 3 characters' : '');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '320px' }}>
      <h2 style={{ margin: '0 0 1rem' }}>FormField - ${variant}</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
          ${variant === 'email' ? 'Email Address' : variant === 'password' ? 'Password' : variant === 'textarea' ? 'Message' : 'Username'}
        </label>

        ${variant === 'textarea' ? `<textarea
          value={value}
          onChange={handleChange}
          placeholder="Enter your message..."
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: error ? '2px solid #ef4444' : '2px solid #000',
            fontSize: '14px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />` : `<input
          type="${variant}"
          value={value}
          onChange={handleChange}
          placeholder="${variant === 'email' ? 'you@example.com' : variant === 'password' ? '••••••••' : 'Enter text...'}"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: error ? '2px solid #ef4444' : '2px solid #000',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />`}

        {error && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '0.5rem' }}>
            {error}
          </p>
        )}

        <p style={{ color: '#666', fontSize: '12px', marginTop: '0.5rem' }}>
          Helper text for the input field
        </p>
      </div>
    </div>
  );
}`;

    default:
      // Generic component preview
      return `export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h2 style={{ margin: '0 0 1rem' }}>${name}</h2>

      <div style={{
        border: '2px solid #000',
        padding: '2rem',
        textAlign: 'center',
        background: '#f8f8f8',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 1rem',
          border: '2px solid #BA0C2F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
        }}>
          <span style={{ fontSize: '24px' }}>⬛</span>
        </div>

        <p style={{ margin: 0, fontWeight: 'bold' }}>${name} Component</p>
        ${selectedVariant ? `<p style={{ margin: '0.5rem 0 0', color: '#BA0C2F', fontSize: '14px' }}>Variant: ${selectedVariant}</p>` : ''}

        <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '14px' }}>
          Edit the code on the left to customize this component
        </p>
      </div>
    </div>
  );
}`;
  }
}

/**
 * Component Preview with Sandpack
 *
 * Uses CodeSandbox's Sandpack to render live, editable component previews.
 * No server/client boundary issues - runs entirely in the browser.
 */
function ComponentPreview({
  id,
  data,
}: {
  id: string;
  data: RegistryItem;
}) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    data.variants?.[0] || null
  );

  const componentCode = generateComponentCode(
    data.name || id,
    data.variants || [],
    selectedVariant
  );

  return (
    <div className="p-4">
      {/* Variant Controls */}
      {data.variants && data.variants.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3 text-sm font-bold text-black dark:text-white">Variants</h3>
          <div className="flex flex-wrap gap-2">
            {data.variants.map((variant) => (
              <button
                key={variant}
                onClick={() => setSelectedVariant(variant)}
                className={`border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedVariant === variant
                    ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                    : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                }`}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sandpack Live Preview */}
      <div className="border-2 border-black dark:border-gray-700">
        <Sandpack
          template="react"
          theme={hustleTheme}
          files={{
            '/App.js': componentCode,
          }}
          options={{
            showNavigator: false,
            showTabs: true,
            showLineNumbers: true,
            showInlineErrors: true,
            editorHeight: 350,
          }}
        />
      </div>

      {/* Component Info */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {data.props_interface && (
          <div className="border-2 border-black bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-bold text-black dark:text-white">Props Interface</h3>
            <code className="font-mono text-sm text-gray-700 dark:text-gray-300">{data.props_interface}</code>
          </div>
        )}

        {data.file && (
          <div className="border-2 border-black bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-bold text-black dark:text-white">File Location</h3>
            <code className="font-mono text-sm text-gray-700 dark:text-gray-300">{data.file}</code>
          </div>
        )}

        {data.uses_components && data.uses_components.length > 0 && (
          <div className="border-2 border-black bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-bold text-black dark:text-white">Uses Components</h3>
            <div className="flex flex-wrap gap-1">
              {data.uses_components.map((comp) => (
                <span
                  key={comp}
                  className="border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-2 border-black bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-sm font-bold text-black dark:text-white">Powered by</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <a
              href="https://sandpack.codesandbox.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#BA0C2F] hover:underline"
            >
              Sandpack
            </a> by CodeSandbox - Edit the code live!
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Page Preview
 *
 * Renders the page in an iframe with responsive viewport controls.
 * Checks if the route exists before rendering to avoid 404s.
 */
function PagePreview({ route }: { route: string }) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [routeStatus, setRouteStatus] = useState<'checking' | 'exists' | 'not-found'>('checking');

  // Check if the route exists
  useEffect(() => {
    const checkRoute = async () => {
      try {
        const res = await fetch(route, { method: 'HEAD' });
        setRouteStatus(res.ok ? 'exists' : 'not-found');
      } catch {
        setRouteStatus('not-found');
      }
    };
    checkRoute();
  }, [route]);

  return (
    <div className="p-4">
      {/* Responsive Size Controls */}
      <div className="mb-4 flex justify-center gap-2">
        <button
          onClick={() => setViewport('desktop')}
          className={`flex items-center gap-1.5 border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
            viewport === 'desktop'
              ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
              : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="8" x2="16" y1="21" y2="21" />
            <line x1="12" x2="12" y1="17" y2="21" />
          </svg>
          Desktop
        </button>
        <button
          onClick={() => setViewport('tablet')}
          className={`flex items-center gap-1.5 border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
            viewport === 'tablet'
              ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
              : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="16" height="20" x="4" y="2" rx="2" />
            <line x1="12" x2="12.01" y1="18" y2="18" />
          </svg>
          Tablet
        </button>
        <button
          onClick={() => setViewport('mobile')}
          className={`flex items-center gap-1.5 border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
            viewport === 'mobile'
              ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
              : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="20" x="5" y="2" rx="2" />
            <line x1="12" x2="12.01" y1="18" y2="18" />
          </svg>
          Mobile
        </button>
      </div>

      {/* Content Area */}
      <div
        className="mx-auto overflow-hidden border-2 border-black bg-white transition-all duration-300 dark:border-gray-700"
        style={{ width: VIEWPORT_WIDTHS[viewport] }}
      >
        {routeStatus === 'checking' ? (
          <div className="flex h-[500px] items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin border-4 border-gray-300 border-t-[#BA0C2F]" style={{ borderRadius: '50%' }} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Checking route...</p>
            </div>
          </div>
        ) : routeStatus === 'not-found' ? (
          <div className="flex h-[500px] items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="max-w-sm p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-black bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" x2="15" y1="15" y2="15" />
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-black dark:text-white">Page Not Found</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                The route <code className="border border-gray-300 bg-gray-100 px-1 dark:border-gray-600 dark:bg-gray-700">{route}</code> doesn&apos;t exist yet.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create the page at <code className="text-[#BA0C2F]">src/app{route}/page.tsx</code> to see the preview.
              </p>
            </div>
          </div>
        ) : (
          <iframe
            src={route}
            title="Page Preview"
            className="h-[500px] w-full"
            loading="lazy"
          />
        )}
      </div>

      {/* Viewport Info */}
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Viewport: {VIEWPORT_WIDTHS[viewport]} • Route: {route}
        {routeStatus === 'not-found' && (
          <span className="ml-2 border border-yellow-400 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            Route does not exist
          </span>
        )}
      </p>
    </div>
  );
}
