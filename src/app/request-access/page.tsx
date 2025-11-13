'use client';

import { useState } from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { useTheme } from 'next-themes';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function RequestAccessPage() {
  const { branding, isLoading: brandingLoading } = useBranding();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    role: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/access-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit request');
        return;
      }

      setResponseMessage(data.message);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting access request:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (brandingLoading) {
    return (
      <div className="relative h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated gradient background with texture */}
      <div className="absolute inset-0 bg-background">
        {/* Gradient orbs */}
        <div
          className="absolute top-0 -left-1/4 w-1/2 h-1/2 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            backgroundColor: branding.primary_color,
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 rounded-full opacity-15 blur-3xl animate-pulse"
          style={{
            backgroundColor: branding.primary_color,
            animationDuration: '6s',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full opacity-10 blur-2xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${branding.primary_color}, transparent)`,
            animationDuration: '5s',
            animationDelay: '2s',
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
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
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <Link
            href="/"
            className="p-3 rounded-xl backdrop-blur-md bg-background/40 border border-white/10 hover:bg-background/60 transition-all duration-300 flex items-center gap-2 text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>

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

        {/* Main content */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-24">
          {/* Logo */}
          <div className="mb-8">
            {branding.logo_dark_url && (
              <Image
                src={branding.logo_dark_url}
                alt={branding.company_name}
                width={200}
                height={48}
                priority
                className="dark:block hidden"
              />
            )}
            {branding.logo_light_url && (
              <Image
                src={branding.logo_light_url}
                alt={branding.company_name}
                width={200}
                height={48}
                priority
                className="dark:hidden block"
              />
            )}
          </div>

          {/* Form container */}
          <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-md bg-background/30 border border-white/10">
            {!submitted ? (
              <>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Request Access
                </h1>
                <p className="text-muted-foreground mb-6">
                  Join the waitlist for early access to Workstation
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                      style={{
                        focusRing: branding.primary_color,
                      }}
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                      placeholder="Acme Inc."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Role
                    </label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                      placeholder="Creative Director"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Tell us about your use case (optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all resize-none"
                      placeholder="I'm looking to..."
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-500">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !formData.email}
                    className="w-full px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      backgroundColor: branding.primary_color,
                      color: '#0a0a0a',
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Request Access'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  <svg
                    className="w-8 h-8 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Request Submitted!
                </h2>
                <p className="text-muted-foreground mb-6">{responseMessage}</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-md bg-background/40 border border-border hover:bg-background/60 text-foreground"
                >
                  Back to Home
                </Link>
              </div>
            )}
          </div>

          {/* Footer note */}
          {!submitted && (
            <p className="mt-6 text-sm text-muted-foreground text-center max-w-md">
              Already have access?{' '}
              <Link
                href="/login"
                className="font-medium hover:underline"
                style={{ color: branding.primary_color }}
              >
                Sign in here
              </Link>
            </p>
          )}
        </div>

        {/* Footer */}
        <footer className="absolute bottom-4 text-center w-full text-xs text-muted-foreground">
          <p>{branding.footer_text}</p>
        </footer>
      </div>
    </div>
  );
}
