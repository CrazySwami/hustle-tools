'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BrandingSettings {
  id: string;
  company_name: string;
  tagline?: string;
  footer_text: string;
  logo_light_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color: string;
  background_light: string;
  background_dark: string;
  foreground_light: string;
  foreground_dark: string;
  card_light: string;
  card_dark: string;
  muted_light: string;
  muted_dark: string;
  border_light: string;
  border_dark: string;
}

const defaultBranding: BrandingSettings = {
  id: 'default',
  company_name: 'Mirror Factory',
  footer_text: 'This website is developed by Mirror Factory, made with love ❤️.',
  logo_light_url: '/MF-Workstation-Logo.png',
  logo_dark_url: '/MF-Workstation-Logo-Light.png',
  primary_color: 'oklch(0.87 0.13 166)',
  background_light: 'oklch(1 0 0)',
  background_dark: '#1a1a1a',
  foreground_light: 'oklch(0.145 0 0)',
  foreground_dark: 'oklch(0.985 0 0)',
  card_light: 'oklch(1 0 0)',
  card_dark: '#2a2a2a',
  muted_light: 'oklch(0.97 0 0)',
  muted_dark: '#333333',
  border_light: 'oklch(0.922 0 0)',
  border_dark: 'oklch(1 0 0 / 8%)',
};

interface BrandingContextType {
  branding: BrandingSettings;
  updateBranding: (updates: Partial<BrandingSettings>) => Promise<void>;
  refreshBranding: () => Promise<void>;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      // Try to fetch from API
      const response = await fetch('/api/branding');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setBranding({ ...defaultBranding, ...data });
          // Apply CSS variables
          applyBrandingToCSS(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
      // Use default branding
      applyBrandingToCSS(defaultBranding);
    } finally {
      setIsLoading(false);
    }
  };

  const applyBrandingToCSS = (settings: Partial<BrandingSettings>) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const merged = { ...defaultBranding, ...settings };

    // Apply CSS variables
    root.style.setProperty('--primary', merged.primary_color);

    // Light mode
    root.style.setProperty('--background-light', merged.background_light);
    root.style.setProperty('--foreground-light', merged.foreground_light);
    root.style.setProperty('--card-light', merged.card_light);
    root.style.setProperty('--muted-light', merged.muted_light);
    root.style.setProperty('--border-light', merged.border_light);

    // Dark mode
    root.style.setProperty('--background-dark', merged.background_dark);
    root.style.setProperty('--foreground-dark', merged.foreground_dark);
    root.style.setProperty('--card-dark', merged.card_dark);
    root.style.setProperty('--muted-dark', merged.muted_dark);
    root.style.setProperty('--border-dark', merged.border_dark);

    // Update favicon if provided
    if (merged.favicon_url) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = merged.favicon_url;
      }
    }
  };

  const updateBranding = async (updates: Partial<BrandingSettings>) => {
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setBranding({ ...branding, ...updated });
        applyBrandingToCSS(updated);
      }
    } catch (error) {
      console.error('Failed to update branding:', error);
      throw error;
    }
  };

  const refreshBranding = async () => {
    setIsLoading(true);
    await fetchBranding();
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, refreshBranding, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
}
