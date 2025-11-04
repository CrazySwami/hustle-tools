'use client';

import dynamic from 'next/dynamic';

// Dynamically import with SSR disabled for browser-only code
const HubSpotModuleConverter = dynamic(
  () => import('@/components/hubspot/hubspot-module-converter'),
  { ssr: false }
);

export default function HubSpotConverterPage() {
  return <HubSpotModuleConverter />;
}
