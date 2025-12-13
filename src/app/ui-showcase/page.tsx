import type { Metadata } from 'next';
import { UIShowcase } from './UIShowcase';

export const metadata: Metadata = {
  title: 'UI Showcase',
  description: 'Preview all components and pages created with Hustle UI Create',
};

/**
 * UI Showcase Page
 *
 * Auto-generated page that displays all components and pages from the registry.
 * Grid layout with modal preview for each element.
 *
 * Features:
 * - Animated 3D grid hero header
 * - Grid layout showing all registered components and pages
 * - Interactive preview with Sandpack
 * - Variant switching
 * - Responsive viewport testing
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export default function UIShowcasePage() {
  return <UIShowcase />;
}
