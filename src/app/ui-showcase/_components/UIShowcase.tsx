'use client';

import { useState, useMemo } from 'react';
import { HeroHeader } from '../shared/HeroHeader';
import { PreviewCard } from './PreviewCard';
import { PreviewModal } from './PreviewModal';

// Import registry - this will be updated by the CLI when components are created
// Note: In production, this could be fetched from an API route
import registry from '@/../.claude/registry.json';

type FilterType = 'all' | 'components' | 'pages';

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
}

interface Registry {
  version: string;
  apis: Record<string, any>;
  components: Record<string, RegistryItem>;
  pages: Record<string, RegistryItem>;
  combined: Record<string, any>;
}

/**
 * UI Showcase Component
 *
 * Displays a grid of all components and pages from the registry.
 * Click any card to open a modal with live preview.
 *
 * Features:
 * - Animated 3D grid hero header
 * - Grid layout (like website portfolio)
 * - Filter tabs: All, Components, Pages
 * - Search functionality
 * - Modal preview with Sandpack (components) or iframe (pages)
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export function UIShowcase() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: 'component' | 'page';
    data: RegistryItem;
  } | null>(null);

  // Type the registry
  const typedRegistry = registry as Registry;

  // Combine components and pages into a single list
  const allItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'component' | 'page';
      data: RegistryItem;
    }> = [];

    // Add components
    Object.entries(typedRegistry.components || {}).forEach(([id, data]) => {
      items.push({ id, type: 'component', data });
    });

    // Add pages
    Object.entries(typedRegistry.pages || {}).forEach(([id, data]) => {
      items.push({ id, type: 'page', data });
    });

    return items;
  }, [typedRegistry]);

  // Filter items based on type and search
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Type filter
      if (filter !== 'all' && filter !== `${item.type}s`) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.data.name?.toLowerCase().includes(query);
        const matchesDescription = item.data.description?.toLowerCase().includes(query);
        return matchesName || matchesDescription;
      }

      return true;
    });
  }, [allItems, filter, searchQuery]);

  // Count by type
  const componentCount = Object.keys(typedRegistry.components || {}).length;
  const pageCount = Object.keys(typedRegistry.pages || {}).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505]">
      {/* Hero Header */}
      <HeroHeader
        title="UI Showcase"
        badge="Component Library"
        description={
          <>
            Live preview and testing for all{' '}
            <strong>Hustle</strong> components and pages.
          </>
        }
      />

      {/* Filter Bar */}
      <div className="sticky top-0 z-10 border-b-2 border-black bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-600 dark:bg-[#050505]/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Stats */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-black dark:text-white">{componentCount}</strong> components
              </span>
              <span className="h-4 w-px bg-black dark:bg-gray-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-black dark:text-white">{pageCount}</strong> pages
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full border-2 border-black bg-white px-3 text-sm placeholder:text-gray-500 focus:border-[#BA0C2F] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-64"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`border-2 px-3 py-1.5 text-sm font-bold transition-colors ${
                filter === 'all'
                  ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                  : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }`}
            >
              All ({allItems.length})
            </button>
            <button
              onClick={() => setFilter('components')}
              className={`border-2 px-3 py-1.5 text-sm font-bold transition-colors ${
                filter === 'components'
                  ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                  : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }`}
            >
              Components ({componentCount})
            </button>
            <button
              onClick={() => setFilter('pages')}
              className={`border-2 px-3 py-1.5 text-sm font-bold transition-colors ${
                filter === 'pages'
                  ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                  : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }`}
            >
              Pages ({pageCount})
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="container mx-auto px-4 py-8">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-black py-16 text-center dark:border-gray-600">
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
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              {searchQuery ? 'No results found' : 'No items yet'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {searchQuery
                ? `No components or pages match "${searchQuery}"`
                : 'Run /ui-create to add components and pages'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <PreviewCard
                key={`${item.type}-${item.id}`}
                id={item.id}
                type={item.type}
                name={item.data.name || item.id}
                description={item.data.description}
                variants={item.data.variants}
                usesComponents={item.data.uses_components}
                route={item.data.route}
                file={item.data.file}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedItem && (
        <PreviewModal
          id={selectedItem.id}
          type={selectedItem.type}
          data={selectedItem.data}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t-2 border-black py-6 text-center text-sm text-gray-600 dark:border-gray-600 dark:text-gray-400">
        <p>
          Created with{' '}
          <a
            href="https://github.com/hustle-together/api-dev-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-black hover:text-[#BA0C2F] dark:text-white"
          >
            Hustle API Dev Tools
          </a>{' '}
          v3.9.2
        </p>
      </footer>
    </div>
  );
}
