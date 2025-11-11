'use client';

import { useState, useEffect } from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import Image from 'next/image';

export default function BrandingSettingsPage() {
  const { branding, updateBranding, isLoading } = useBranding();
  const [formData, setFormData] = useState(branding);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData(branding);
  }, [branding]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateBranding(formData);
      setMessage({ type: 'success', text: 'Branding settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save branding settings' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Branding Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your company branding, logos, and color scheme
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Mirror Factory"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tagline (Optional)
                </label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Building the future..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={formData.footer_text}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="This website is developed by Mirror Factory, made with love ❤️."
                />
              </div>
            </div>
          </div>

          {/* Logos Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Logos</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Light Mode Logo URL
                </label>
                <input
                  type="text"
                  value={formData.logo_light_url || ''}
                  onChange={(e) => handleChange('logo_light_url', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="/MF-Workstation-Logo.png"
                />
                {formData.logo_light_url && (
                  <div className="mt-3 p-4 bg-white rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Preview (Light Mode):</p>
                    <Image
                      src={formData.logo_light_url}
                      alt="Light logo preview"
                      width={300}
                      height={75}
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dark Mode Logo URL
                </label>
                <input
                  type="text"
                  value={formData.logo_dark_url || ''}
                  onChange={(e) => handleChange('logo_dark_url', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="/MF-Workstation-Logo-Light.png"
                />
                {formData.logo_dark_url && (
                  <div className="mt-3 p-4 bg-[#1a1a1a] rounded-lg border border-border">
                    <p className="text-xs text-gray-400 mb-2">Preview (Dark Mode):</p>
                    <Image
                      src={formData.logo_dark_url}
                      alt="Dark logo preview"
                      width={300}
                      height={75}
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Primary Color (Accent)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder="oklch(0.87 0.13 166)"
                  />
                  <div
                    className="w-12 h-10 rounded-lg border border-border"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Background (Light)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.background_light}
                    onChange={(e) => handleChange('background_light', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                  <div
                    className="w-12 h-10 rounded-lg border border-border"
                    style={{ backgroundColor: formData.background_light }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Background (Dark)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.background_dark}
                    onChange={(e) => handleChange('background_dark', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                  <div
                    className="w-12 h-10 rounded-lg border border-border"
                    style={{ backgroundColor: formData.background_dark }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Use oklch() format for better color control. Example: oklch(0.87 0.13 166)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div>
              {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message.text}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(branding)}
                className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{
                  backgroundColor: formData.primary_color,
                  color: '#0a0a0a'
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
