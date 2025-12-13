'use client';

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
}

interface APICardProps {
  id: string;
  type: 'api' | 'combined';
  data: RegistryAPI;
  onClick: () => void;
}

/**
 * API Card Component
 *
 * Displays a preview card for an API in the showcase grid.
 * Hustle Together branding with boxy 90s style.
 * Hover: Solid red shadow (4px 4px 0 #BA0C2F), no border change.
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export function APICard({ id, type, data, onClick }: APICardProps) {
  // Method badge colors
  const methodColors: Record<string, string> = {
    GET: 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    POST: 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'border-yellow-600 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    PATCH: 'border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    DELETE: 'border-red-600 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  // Status colors
  const statusColors: Record<string, string> = {
    complete: 'bg-green-500',
    'in-progress': 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const methods = data.methods || ['POST'];
  const status = data.status || 'complete';

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden border-2 border-black bg-white text-left transition-all hover:shadow-[4px_4px_0_#BA0C2F] focus:outline-none focus:ring-2 focus:ring-[#BA0C2F] focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-black p-4 dark:border-gray-700">
        <div className="flex-1">
          {/* Type Badge */}
          <div className="mb-2 flex items-center gap-2">
            {type === 'combined' ? (
              <span className="border border-purple-600 bg-purple-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Combined API
              </span>
            ) : (
              <span className="border border-black bg-gray-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                API Endpoint
              </span>
            )}
            {/* Status Dot */}
            <span
              className={`h-2.5 w-2.5 rounded-full ${statusColors[status] || 'bg-gray-400'}`}
              title={status}
            />
          </div>

          {/* Name */}
          <h3 className="font-bold text-black group-hover:text-[#BA0C2F] dark:text-white">
            {data.name || id}
          </h3>
        </div>

        {/* Arrow Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-[#BA0C2F]"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {data.description || `API endpoint for ${id}`}
        </p>

        {/* Route */}
        <div className="mb-3 border border-gray-300 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-800">
          <code className="font-mono text-xs text-gray-700 dark:text-gray-300">
            /api/v2/{id}
          </code>
        </div>

        {/* Methods */}
        <div className="mt-auto flex flex-wrap gap-1">
          {methods.map((method) => (
            <span
              key={method}
              className={`border px-2 py-0.5 font-mono text-xs font-bold ${
                methodColors[method] || 'border-gray-400 bg-gray-100 text-gray-700'
              }`}
            >
              {method}
            </span>
          ))}
        </div>

        {/* Combined Info */}
        {type === 'combined' && data.combines && (
          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Combines:</span> {data.combines.join(', ')}
            </p>
            {data.flow_type && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Flow:</span> {data.flow_type}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {data.created_at ? `Created ${data.created_at}` : 'Click to test'}
        </p>
      </div>
    </button>
  );
}
