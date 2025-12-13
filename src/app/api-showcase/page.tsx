'use client';

import { HeroHeader } from '../shared/HeroHeader';
import { APIShowcase } from './_components/APIShowcase';

/**
 * API Showcase Page
 *
 * Auto-generated grid view of all APIs from registry.json.
 * Click any API card to open interactive testing modal.
 *
 * Features:
 * - Animated 3D grid hero header
 * - Grid layout showing all registered APIs
 * - Interactive "Try It" testing for each endpoint
 * - Request/response schema display
 * - Curl example generation
 * - Test status indicators
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export default function APIShowcasePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050505]">
      <HeroHeader
        title="API Showcase"
        badge="API Documentation"
        description={
          <>
            Interactive testing and documentation for all{' '}
            <strong>Hustle</strong> API endpoints.
          </>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <APIShowcase />
      </div>
    </main>
  );
}
