"use client"

import HubSpotModuleConverter from '@/components/hubspot/hubspot-module-converter'

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

export default function HubSpotConverterPage() {
  return <HubSpotModuleConverter />
}
