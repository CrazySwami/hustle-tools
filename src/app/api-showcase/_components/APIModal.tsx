'use client';

import { useEffect, useCallback, useState } from 'react';
import { APITester } from './APITester';

interface RegistryAPI {
  name: string;
  description?: string;
  route: string;
  schemas?: string;
  tests?: string;
  methods?: string[];
  created_at?: string;
  status?: string;
  combines?: string[];
  flow_type?: string;
  endpoints?: Record<string, {
    methods: string[];
    description?: string;
  }>;
}

interface APIModalProps {
  id: string;
  type: 'api' | 'combined';
  data: RegistryAPI;
  onClose: () => void;
}

/**
 * API Modal Component
 *
 * Full-screen modal for API documentation and interactive testing.
 * Includes:
 * - Endpoint details
 * - Multi-endpoint selector
 * - Interactive "Try It" form
 * - Request/response display
 * - Curl example generation
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export function APIModal({ id, type, data, onClose }: APIModalProps) {
  const [activeTab, setActiveTab] = useState<'try-it' | 'docs' | 'curl'>('try-it');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

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

  // Get endpoints - either from endpoints object or default single endpoint
  const endpoints = data.endpoints || { default: { methods: data.methods || ['POST'] } };
  const endpointKeys = Object.keys(endpoints);
  const hasMultipleEndpoints = endpointKeys.length > 1;

  // Set initial endpoint
  useEffect(() => {
    if (endpointKeys.length > 0 && !selectedEndpoint) {
      setSelectedEndpoint(endpointKeys[0]);
    }
  }, [endpointKeys, selectedEndpoint]);

  const currentEndpoint = selectedEndpoint ? endpoints[selectedEndpoint] : endpoints[endpointKeys[0]];
  const methods = currentEndpoint?.methods || data.methods || ['POST'];
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Build endpoint path
  const getEndpointPath = () => {
    if (selectedEndpoint && selectedEndpoint !== 'default') {
      return `/api/v2/${id}/${selectedEndpoint}`;
    }
    return `/api/v2/${id}`;
  };

  const endpoint = getEndpointPath();

  // Generate curl example
  const generateCurl = (method: string) => {
    if (method === 'GET') {
      return `curl -X GET "${baseUrl}${endpoint}"`;
    }
    return `curl -X ${method} "${baseUrl}${endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "example": "value"
  }'`;
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
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border-2 border-black bg-white shadow-xl dark:border-gray-600 dark:bg-gray-900">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-black px-6 py-4 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-title" className="text-xl font-bold text-black dark:text-white">
                  {data.name || id}
                </h2>
                {type === 'combined' && (
                  <span className="border border-purple-600 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Combined
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {endpoint}
              </p>
            </div>
          </div>

          {/* Methods */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {methods.map((method) => (
                <span
                  key={method}
                  className={`px-2 py-1 text-xs font-medium ${
                    method === 'GET'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : method === 'POST'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : method === 'DELETE'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  {method}
                </span>
              ))}
            </div>

            <button
              onClick={onClose}
              className="border-2 border-black p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              aria-label="Close"
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
          </div>
        </header>

        {/* Endpoint Selector (for multi-endpoint APIs) */}
        {hasMultipleEndpoints && (
          <div className="border-b-2 border-black bg-gray-50 px-6 py-3 dark:border-gray-600 dark:bg-gray-800">
            <label className="mb-2 block text-sm font-bold text-black dark:text-white">
              Select Endpoint
            </label>
            <div className="flex flex-wrap gap-2">
              {endpointKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedEndpoint(key)}
                  className={`border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedEndpoint === key
                      ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                      : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  /{key}
                </button>
              ))}
            </div>
            {currentEndpoint?.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {currentEndpoint.description}
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b-2 border-black px-6 dark:border-gray-600">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('try-it')}
              className={`border-b-2 py-3 text-sm font-bold transition-colors ${
                activeTab === 'try-it'
                  ? 'border-[#BA0C2F] text-[#BA0C2F]'
                  : 'border-transparent text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Try It
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`border-b-2 py-3 text-sm font-bold transition-colors ${
                activeTab === 'docs'
                  ? 'border-[#BA0C2F] text-[#BA0C2F]'
                  : 'border-transparent text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Documentation
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`border-b-2 py-3 text-sm font-bold transition-colors ${
                activeTab === 'curl'
                  ? 'border-[#BA0C2F] text-[#BA0C2F]'
                  : 'border-transparent text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Curl Examples
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'try-it' && (
            <APITester
              id={id}
              endpoint={endpoint}
              methods={methods}
              selectedEndpoint={selectedEndpoint}
              schemaPath={data.schemas}
            />
          )}

          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="mb-2 text-lg font-bold text-black dark:text-white">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {data.description || `API endpoint for ${id}`}
                </p>
              </div>

              {/* File Locations */}
              <div>
                <h3 className="mb-2 text-lg font-bold text-black dark:text-white">File Locations</h3>
                <div className="space-y-2 border-2 border-black bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Route:</span>
                    <code className="text-sm text-black dark:text-white">{data.route || `src/app/api/v2/${id}/route.ts`}</code>
                  </div>
                  {data.schemas && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Schemas:</span>
                      <code className="text-sm text-black dark:text-white">{data.schemas}</code>
                    </div>
                  )}
                  {data.tests && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tests:</span>
                      <code className="text-sm text-black dark:text-white">{data.tests}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Combined Info */}
              {type === 'combined' && data.combines && (
                <div>
                  <h3 className="mb-2 text-lg font-bold text-black dark:text-white">Combined APIs</h3>
                  <div className="border-2 border-black bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      This endpoint orchestrates the following APIs:
                    </p>
                    <ul className="list-inside list-disc space-y-1">
                      {data.combines.map((api) => (
                        <li key={api} className="text-sm text-black dark:text-white">
                          {api}
                        </li>
                      ))}
                    </ul>
                    {data.flow_type && (
                      <p className="mt-3 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Flow type:</span>{' '}
                        <span className="font-bold text-black dark:text-white">{data.flow_type}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="space-y-4">
              {methods.map((method) => (
                <div key={method}>
                  <h3 className="mb-2 text-sm font-bold text-black dark:text-white">{method} Request</h3>
                  <div className="relative">
                    <pre className="overflow-x-auto border-2 border-black bg-zinc-900 p-4 text-sm text-zinc-100">
                      <code>{generateCurl(method)}</code>
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(generateCurl(method))}
                      className="absolute right-2 top-2 border border-zinc-600 bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t-2 border-black px-6 py-4 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.created_at && `Created: ${data.created_at}`}
            </p>
            <div className="flex gap-2">
              {data.tests && (
                <button className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">
                  View Tests
                </button>
              )}
              <button
                onClick={() => {
                  const importPath = data.schemas?.replace(/^src\//, '@/').replace(/\.ts$/, '');
                  if (importPath) {
                    navigator.clipboard.writeText(
                      `import { RequestSchema, ResponseSchema } from '${importPath}';`
                    );
                  }
                }}
                className="border-2 border-black bg-[#BA0C2F] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#8a0923]"
              >
                Copy Schema Import
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
