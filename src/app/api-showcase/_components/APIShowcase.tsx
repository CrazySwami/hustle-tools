'use client';

import { useState, useMemo } from 'react';
import { APICard } from './APICard';
import { APIModal } from './APIModal';

/**
 * Registry structure from .claude/registry.json
 */
interface RegistryAPI {
  name: string;
  description?: string;
  route: string;
  schemas?: string;
  tests?: string;
  methods?: string[];
  created_at?: string;
  status?: string;
  endpoints?: Record<string, {
    methods: string[];
    description?: string;
  }>;
}

interface Registry {
  version: string;
  apis: Record<string, RegistryAPI>;
  combined?: Record<string, RegistryAPI & { combines?: string[]; flow_type?: string }>;
}

interface APIShowcaseProps {
  registry?: Registry;
}

/**
 * API Showcase Component
 *
 * Displays a grid of all registered APIs with filtering and search.
 * Click any card to open the interactive testing modal.
 *
 * Data source: .claude/registry.json (apis + combined sections)
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export function APIShowcase({ registry: propRegistry }: APIShowcaseProps) {
  const [selectedAPI, setSelectedAPI] = useState<{
    id: string;
    type: 'api' | 'combined';
    data: RegistryAPI;
  } | null>(null);
  const [filter, setFilter] = useState<'all' | 'api' | 'combined'>('all');
  const [search, setSearch] = useState('');

  // Use prop registry or default empty structure
  const registry: Registry = propRegistry || {
    version: '1.0.0',
    apis: {},
    combined: {},
  };

  // Combine APIs and combined endpoints into single list
  const allAPIs = useMemo(() => {
    const items: Array<{ id: string; type: 'api' | 'combined'; data: RegistryAPI }> = [];

    // Add regular APIs
    Object.entries(registry.apis || {}).forEach(([id, data]) => {
      items.push({ id, type: 'api', data });
    });

    // Add combined APIs
    Object.entries(registry.combined || {}).forEach(([id, data]) => {
      items.push({ id, type: 'combined', data });
    });

    return items;
  }, [registry]);

  // Filter and search
  const filteredAPIs = useMemo(() => {
    return allAPIs.filter((item) => {
      // Type filter
      if (filter !== 'all' && item.type !== filter) {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          item.id.toLowerCase().includes(searchLower) ||
          item.data.name?.toLowerCase().includes(searchLower) ||
          item.data.description?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [allAPIs, filter, search]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allAPIs.length,
      apis: Object.keys(registry.apis || {}).length,
      combined: Object.keys(registry.combined || {}).length,
    };
  }, [allAPIs, registry]);

  return (
    <div>
      {/* Stats Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 border-2 border-black bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-black dark:text-white">{stats.total}</span>
          <span className="text-gray-600 dark:text-gray-400">Total APIs</span>
        </div>
        <div className="h-8 w-px bg-black dark:bg-gray-600" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-black dark:text-white">{stats.apis}</span>
          <span className="text-gray-600 dark:text-gray-400">Endpoints</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-black dark:text-white">{stats.combined}</span>
          <span className="text-gray-600 dark:text-gray-400">Combined</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search APIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md border-2 border-black bg-white px-4 py-2 focus:border-[#BA0C2F] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`border-2 px-4 py-2 text-sm font-bold transition-colors ${
              filter === 'all'
                ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-800 dark:text-white'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('api')}
            className={`border-2 px-4 py-2 text-sm font-bold transition-colors ${
              filter === 'api'
                ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-800 dark:text-white'
            }`}
          >
            APIs ({stats.apis})
          </button>
          <button
            onClick={() => setFilter('combined')}
            className={`border-2 px-4 py-2 text-sm font-bold transition-colors ${
              filter === 'combined'
                ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-800 dark:text-white'
            }`}
          >
            Combined ({stats.combined})
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredAPIs.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAPIs.map((item) => (
            <APICard
              key={`${item.type}-${item.id}`}
              id={item.id}
              type={item.type}
              data={item.data}
              onClick={() => setSelectedAPI(item)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-black py-16 dark:border-gray-600">
          <div className="mb-4 border-2 border-black bg-gray-100 p-4 dark:border-gray-600 dark:bg-gray-800">
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
              className="text-gray-500"
            >
              <path d="M10 10h.01" />
              <path d="M14 10h.01" />
              <path d="M12 14a4 4 0 0 0 0-8" />
              <path d="M16 10a4 4 0 0 0-8 0" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <p className="text-lg font-bold text-black dark:text-white">No APIs found</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {search
              ? 'Try a different search term'
              : 'Create your first API with /api-create'}
          </p>
        </div>
      )}

      {/* Modal */}
      {selectedAPI && (
        <APIModal
          id={selectedAPI.id}
          type={selectedAPI.type}
          data={selectedAPI.data}
          onClose={() => setSelectedAPI(null)}
        />
      )}
    </div>
  );
}
