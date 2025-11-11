-- Branding Settings Table
-- Stores customizable branding configuration for white-labeling

CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Company Information
  company_name TEXT NOT NULL DEFAULT 'Mirror Factory',
  tagline TEXT,
  footer_text TEXT DEFAULT 'This website is developed by Mirror Factory, made with love ❤️.',

  -- Logos (stored as URLs to Supabase Storage)
  logo_light_url TEXT, -- Logo for light mode
  logo_dark_url TEXT,  -- Logo for dark mode
  favicon_url TEXT,

  -- Primary Colors (using oklch format)
  primary_color TEXT DEFAULT 'oklch(0.87 0.13 166)', -- Mint accent
  background_light TEXT DEFAULT 'oklch(1 0 0)',
  background_dark TEXT DEFAULT '#1a1a1a',
  foreground_light TEXT DEFAULT 'oklch(0.145 0 0)',
  foreground_dark TEXT DEFAULT 'oklch(0.985 0 0)',

  -- Additional Brand Colors
  card_light TEXT DEFAULT 'oklch(1 0 0)',
  card_dark TEXT DEFAULT '#2a2a2a',
  muted_light TEXT DEFAULT 'oklch(0.97 0 0)',
  muted_dark TEXT DEFAULT '#333333',
  border_light TEXT DEFAULT 'oklch(0.922 0 0)',
  border_dark TEXT DEFAULT 'oklch(1 0 0 / 8%)',

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read active branding (public)
CREATE POLICY "Anyone can read active branding"
  ON branding_settings FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can manage their own branding
CREATE POLICY "Users can manage their own branding"
  ON branding_settings FOR ALL
  USING (auth.uid() = user_id);

-- Create index for faster active branding lookup
CREATE INDEX idx_branding_active ON branding_settings(is_active) WHERE is_active = true;

-- Insert default branding settings
INSERT INTO branding_settings (
  company_name,
  footer_text,
  primary_color,
  is_active
) VALUES (
  'Mirror Factory',
  'This website is developed by Mirror Factory, made with love ❤️.',
  'oklch(0.87 0.13 166)',
  true
) ON CONFLICT DO NOTHING;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_branding_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branding_settings_updated_at
  BEFORE UPDATE ON branding_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_branding_settings_updated_at();
