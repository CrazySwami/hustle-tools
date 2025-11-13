'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useBranding } from '@/contexts/BrandingContext';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function Home() {
  const { branding, isLoading } = useBranding();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="relative h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Animated gradient background with texture */}
      <div className="absolute inset-0 bg-background">
        {/* Gradient orbs */}
        <div
          className="absolute top-0 -left-1/4 w-1/2 h-1/2 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            backgroundColor: branding.primary_color,
            animationDuration: '4s'
          }}
        />
        <div
          className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 rounded-full opacity-15 blur-3xl animate-pulse"
          style={{
            backgroundColor: branding.primary_color,
            animationDuration: '6s',
            animationDelay: '1s'
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full opacity-10 blur-2xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${branding.primary_color}, transparent)`,
            animationDuration: '5s',
            animationDelay: '2s'
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Glassmorphism content container */}
      <div className="relative z-10 h-full">
        {/* Dark mode toggle - top right */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-xl backdrop-blur-md bg-background/40 border border-white/10 hover:bg-background/60 transition-all duration-300"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Main content - centered */}
        <div className="flex flex-col items-center justify-center h-full px-4">
          {/* Logo with backdrop blur */}
          <div className="mb-8 p-8 rounded-3xl backdrop-blur-md bg-background/30 border border-white/10">
            {/* Dark mode logo */}
            {branding.logo_dark_url && (
              <Image
                src={branding.logo_dark_url}
                alt={branding.company_name}
                width={700}
                height={168}
                priority
                className="dark:block hidden"
              />
            )}
            {/* Light mode logo */}
            {branding.logo_light_url && (
              <Image
                src={branding.logo_light_url}
                alt={branding.company_name}
                width={700}
                height={168}
                priority
                className="dark:hidden block"
              />
            )}
          </div>

          {/* Buttons group */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Request Access button */}
            <Link
              href="/request-access"
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm border border-white/20"
              style={{
                backgroundColor: branding.primary_color,
                color: '#0a0a0a'
              }}
            >
              Request Access
            </Link>

            {/* Sign In button */}
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl backdrop-blur-md bg-background/40 border border-border hover:bg-background/60"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-4 text-center w-full text-xs text-muted-foreground">
          <p>{branding.footer_text}</p>
        </footer>
      </div>
    </div>
  );
}
