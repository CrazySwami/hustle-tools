'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeroHeader } from '../../shared/HeroHeader';

interface Registry {
  version?: string;
  apis?: Record<string, unknown>;
  components?: Record<string, unknown>;
  pages?: Record<string, unknown>;
  combined?: Record<string, unknown>;
}

/**
 * DevToolsLanding Component
 *
 * Central hub for all Hustle Developer Tools.
 * Links to API Showcase, UI Showcase, and displays registry stats.
 *
 * Created with Hustle Dev Tools (v3.9.2)
 */
export function DevToolsLanding() {
  const [registry, setRegistry] = useState<Registry>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/registry')
      .then((res) => res.json())
      .then((data) => {
        setRegistry(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const stats = {
    apis: Object.keys(registry.apis || {}).length,
    components: Object.keys(registry.components || {}).length,
    pages: Object.keys(registry.pages || {}).length,
    combined: Object.keys(registry.combined || {}).length,
  };

  const total = stats.apis + stats.components + stats.pages + stats.combined;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroHeader
        title="Hustle Dev Tools"
        badge="Developer Portal"
        description={
          <>
            Central hub for <strong>API development</strong>,{' '}
            <strong>UI components</strong>, and documentation. Built with the
            Hustle Together workflow.
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-8 py-12 md:px-16">
        {/* Stats Bar */}
        <div className="mb-8 flex flex-wrap items-center gap-6 border-2 border-black bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-black dark:text-white">
              {loading ? '...' : total}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Total Items
            </span>
          </div>
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-black dark:text-white">
              {stats.apis}
            </span>
            <span className="text-gray-600 dark:text-gray-400">APIs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-black dark:text-white">
              {stats.components}
            </span>
            <span className="text-gray-600 dark:text-gray-400">Components</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-black dark:text-white">
              {stats.pages}
            </span>
            <span className="text-gray-600 dark:text-gray-400">Pages</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-black dark:text-white">
              {stats.combined}
            </span>
            <span className="text-gray-600 dark:text-gray-400">Combined</span>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {/* API Showcase Card */}
          <Link
            href="/api-showcase"
            className="group flex flex-col border-2 border-black bg-white p-6 transition-all hover:border-[#BA0C2F] hover:shadow-[4px_4px_0px_0px_rgba(186,12,47,0.2)] dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#BA0C2F] bg-[#BA0C2F]/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#BA0C2F]"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-black group-hover:text-[#BA0C2F] dark:text-white">
              API Showcase
            </h2>
            <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400">
              Interactive testing and documentation for all API endpoints. Try
              requests, view schemas, and copy curl commands.
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-[#BA0C2F]">
              <span>{stats.apis} APIs</span>
              <span>+</span>
              <span>{stats.combined} Combined</span>
            </div>
          </Link>

          {/* UI Showcase Card */}
          <Link
            href="/ui-showcase"
            className="group flex flex-col border-2 border-black bg-white p-6 transition-all hover:border-[#BA0C2F] hover:shadow-[4px_4px_0px_0px_rgba(186,12,47,0.2)] dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#BA0C2F] bg-[#BA0C2F]/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#BA0C2F]"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-black group-hover:text-[#BA0C2F] dark:text-white">
              UI Showcase
            </h2>
            <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400">
              Live component previews with Sandpack. Edit code in real-time,
              switch variants, and test responsive layouts.
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-[#BA0C2F]">
              <span>{stats.components} Components</span>
              <span>+</span>
              <span>{stats.pages} Pages</span>
            </div>
          </Link>

          {/* Registry Card */}
          <Link
            href="/api/registry"
            target="_blank"
            className="group flex flex-col border-2 border-black bg-white p-6 transition-all hover:border-[#BA0C2F] hover:shadow-[4px_4px_0px_0px_rgba(186,12,47,0.2)] dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#BA0C2F] bg-[#BA0C2F]/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#BA0C2F]"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-black group-hover:text-[#BA0C2F] dark:text-white">
              Registry JSON
            </h2>
            <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400">
              Raw JSON registry of all APIs, components, and pages. Central
              source of truth for the showcase pages.
            </p>
            <div className="text-sm font-bold text-[#BA0C2F]">
              Version: {registry.version || '1.0.0'}
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="border-2 border-black bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
            Quick Actions
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              title="Run Storybook"
              command="pnpm storybook"
              description="Component development server"
            />
            <QuickAction
              title="Run Tests"
              command="pnpm test"
              description="Execute test suite"
            />
            <QuickAction
              title="Create API"
              command="/hustle-api-create"
              description="Start new API workflow"
            />
            <QuickAction
              title="Create Component"
              command="/hustle-ui-create"
              description="Start new UI workflow"
            />
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 border-2 border-black bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
            Optional Setup
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <SetupCard
              title="Storybook"
              command="npx storybook@latest init"
              description="Interactive component development and visual testing"
            />
            <SetupCard
              title="Playwright"
              command="npm init playwright@latest"
              description="E2E testing and accessibility verification"
            />
            <SetupCard
              title="Sandpack"
              command="pnpm add @codesandbox/sandpack-react"
              description="Live code previews in UI Showcase"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickAction({
  title,
  command,
  description,
}: {
  title: string;
  command: string;
  description: string;
}) {
  return (
    <div className="border-2 border-black bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
      <h4 className="font-bold text-black dark:text-white">{title}</h4>
      <code className="mt-2 block border border-gray-300 bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {command}
      </code>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function SetupCard({
  title,
  command,
  description,
}: {
  title: string;
  command: string;
  description: string;
}) {
  return (
    <div className="flex flex-col border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <h4 className="font-bold text-black dark:text-white">{title}</h4>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
      <button
        onClick={() => navigator.clipboard.writeText(command)}
        className="mt-3 border-2 border-black bg-white px-3 py-1.5 text-left font-mono text-sm text-gray-700 transition-colors hover:border-[#BA0C2F] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        {command}
        <span className="float-right text-gray-400">Copy</span>
      </button>
    </div>
  );
}

export default DevToolsLanding;
