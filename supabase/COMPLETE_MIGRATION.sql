-- ============================================================================
-- MIRROR FACTORY WORKSTATION - COMPLETE DATABASE MIGRATION
-- ============================================================================
-- Run this entire file in your new Supabase SQL Editor to set up all tables,
-- policies, functions, and storage.
--
-- Order of Operations:
-- 1. Core Tables (documents, folders, dittos, shares, uploaded_files)
-- 2. Branding Settings Table
-- 3. Access Requests / Waitlist Table
-- 4. Storage Bucket Setup (manual step at end)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: CORE TABLES (from 001_initial_schema.sql)
-- ============================================================================

-- ============================================================================
-- FOLDERS TABLE
-- Hierarchical folder structure for organizing documents
-- ============================================================================
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

-- Index for faster folder queries
CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_folders_parent_folder_id ON folders(parent_folder_id);
CREATE INDEX idx_folders_deleted ON folders(is_deleted) WHERE is_deleted = false;

-- ============================================================================
-- DOCUMENTS TABLE
-- Core table for storing user documents
-- ============================================================================
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

-- Index for faster document queries
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_deleted ON documents(is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);

-- ============================================================================
-- DITTOS TABLE
-- User profiles that can be shared with others
-- Each user has ONE ditto that represents their shareable identity
-- ============================================================================
CREATE TABLE dittos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  linkedin_profile TEXT,
  personal_website TEXT,
  company_website TEXT,
  additional_context TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  website_links TEXT[] DEFAULT '{}'
);

-- Index for faster ditto queries
CREATE INDEX idx_dittos_user_id ON dittos(user_id);

-- ============================================================================
-- SHARES TABLE
-- Tracks what documents/folders users share with each other
-- Resources appear under the owner's Ditto in the recipient's sidebar
-- ============================================================================
CREATE TABLE shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'folder')),
  resource_id UUID NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  UNIQUE(resource_type, resource_id, shared_with_user_id)
);

-- Index for faster share queries
CREATE INDEX idx_shares_owner_id ON shares(owner_id);
CREATE INDEX idx_shares_shared_with_user_id ON shares(shared_with_user_id);
CREATE INDEX idx_shares_resource ON shares(resource_type, resource_id);

-- ============================================================================
-- UPLOADED_FILES TABLE
-- Tracks all uploaded files (PDFs, images, documents, etc.)
-- Files can be "active" (in AI context) or just stored
-- ============================================================================
CREATE TABLE uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false, -- Is it in "Active Files" (AI context)?
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  extracted_content TEXT, -- AI-extracted text content for search/summary
  summary TEXT, -- AI-generated summary
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

-- Index for faster file queries
CREATE INDEX idx_uploaded_files_owner_id ON uploaded_files(owner_id);
CREATE INDEX idx_uploaded_files_document_id ON uploaded_files(document_id);
CREATE INDEX idx_uploaded_files_folder_id ON uploaded_files(folder_id);
CREATE INDEX idx_uploaded_files_active ON uploaded_files(is_active) WHERE is_active = true;
CREATE INDEX idx_uploaded_files_deleted ON uploaded_files(is_deleted) WHERE is_deleted = false;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access their own data and shared resources
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE dittos ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FOLDERS POLICIES
-- ============================================================================

-- Users can view their own folders
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can insert their own folders
CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own folders
CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = owner_id);

-- Users can view folders shared with them
CREATE POLICY "Users can view shared folders"
  ON folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shares
      WHERE shares.resource_type = 'folder'
        AND shares.resource_id = folders.id
        AND shares.shared_with_user_id = auth.uid()
    )
  );

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own documents
CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = owner_id);

-- Users can view documents shared with them (view permission)
CREATE POLICY "Users can view shared documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shares
      WHERE shares.resource_type = 'document'
        AND shares.resource_id = documents.id
        AND shares.shared_with_user_id = auth.uid()
    )
  );

-- Users can update documents shared with them (edit permission)
CREATE POLICY "Users can update shared documents with edit permission"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shares
      WHERE shares.resource_type = 'document'
        AND shares.resource_id = documents.id
        AND shares.shared_with_user_id = auth.uid()
        AND shares.permission = 'edit'
    )
  );

-- ============================================================================
-- DITTOS POLICIES
-- ============================================================================

-- Users can view their own ditto
CREATE POLICY "Users can view their own ditto"
  ON dittos FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own ditto
CREATE POLICY "Users can insert their own ditto"
  ON dittos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ditto
CREATE POLICY "Users can update their own ditto"
  ON dittos FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view dittos of users who have shared content with them
CREATE POLICY "Users can view dittos of sharers"
  ON dittos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shares
      WHERE shares.owner_id = dittos.user_id
        AND shares.shared_with_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SHARES POLICIES
-- ============================================================================

-- Users can view shares they created (what they shared with others)
CREATE POLICY "Users can view their own shares"
  ON shares FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can view shares they received (what others shared with them)
CREATE POLICY "Users can view shares received"
  ON shares FOR SELECT
  USING (auth.uid() = shared_with_user_id);

-- Users can insert shares for their own resources
CREATE POLICY "Users can insert shares for their resources"
  ON shares FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete shares they created
CREATE POLICY "Users can delete their own shares"
  ON shares FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- UPLOADED_FILES POLICIES
-- ============================================================================

-- Users can view their own files
CREATE POLICY "Users can view their own files"
  ON uploaded_files FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can insert their own files
CREATE POLICY "Users can insert their own files"
  ON uploaded_files FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own files
CREATE POLICY "Users can update their own files"
  ON uploaded_files FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON uploaded_files FOR DELETE
  USING (auth.uid() = owner_id);

-- Users can view files in documents/folders shared with them
CREATE POLICY "Users can view files in shared resources"
  ON uploaded_files FOR SELECT
  USING (
    (document_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM shares
      WHERE shares.resource_type = 'document'
        AND shares.resource_id = uploaded_files.document_id
        AND shares.shared_with_user_id = auth.uid()
    ))
    OR
    (folder_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM shares
      WHERE shares.resource_type = 'folder'
        AND shares.resource_id = uploaded_files.folder_id
        AND shares.shared_with_user_id = auth.uid()
    ))
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dittos_updated_at
  BEFORE UPDATE ON dittos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: BRANDING SETTINGS TABLE (from 004_branding_settings.sql)
-- ============================================================================

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

-- Policy: Anyone can read active branding (public - no auth required)
-- This ensures branding loads on all pages, even for non-authenticated users
CREATE POLICY "Anyone can read active branding"
  ON branding_settings FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can manage their own branding
CREATE POLICY "Users can manage their own branding"
  ON branding_settings FOR ALL
  USING (auth.uid() = user_id);

-- Policy: Allow unauthenticated INSERT if no active branding exists
-- This ensures the default branding can be created on first run
CREATE POLICY "Allow insert if no active branding exists"
  ON branding_settings FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM branding_settings WHERE is_active = true)
  );

-- Policy: Allow unauthenticated UPDATE of active branding (for /branding-settings page)
-- Note: In production, you may want to restrict this to admin users only
CREATE POLICY "Allow update of active branding"
  ON branding_settings FOR UPDATE
  USING (is_active = true);

-- Create index for faster active branding lookup
CREATE INDEX idx_branding_active ON branding_settings(is_active) WHERE is_active = true;

-- Insert default branding settings with all Mirror Factory brand values
INSERT INTO branding_settings (
  company_name,
  tagline,
  footer_text,
  logo_light_url,
  logo_dark_url,
  primary_color,
  background_light,
  background_dark,
  foreground_light,
  foreground_dark,
  card_light,
  card_dark,
  muted_light,
  muted_dark,
  border_light,
  border_dark,
  is_active
) VALUES (
  'Mirror Factory',
  NULL,
  'This website is developed by Mirror Factory, made with love ❤️.',
  '/MF-Workstation-Logo.png',
  '/MF-Workstation-Logo-Light.png',
  'oklch(0.87 0.13 166)',
  'oklch(1 0 0)',
  '#1a1a1a',
  'oklch(0.145 0 0)',
  'oklch(0.985 0 0)',
  'oklch(1 0 0)',
  '#2a2a2a',
  'oklch(0.97 0 0)',
  '#333333',
  'oklch(0.922 0 0)',
  'oklch(1 0 0 / 8%)',
  true
) ON CONFLICT DO NOTHING;

-- Function: Get active branding settings
-- This function can be called from your API to fetch branding without auth
CREATE OR REPLACE FUNCTION get_active_branding()
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  tagline TEXT,
  footer_text TEXT,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  background_light TEXT,
  background_dark TEXT,
  foreground_light TEXT,
  foreground_dark TEXT,
  card_light TEXT,
  card_dark TEXT,
  muted_light TEXT,
  muted_dark TEXT,
  border_light TEXT,
  border_dark TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    company_name,
    tagline,
    footer_text,
    logo_light_url,
    logo_dark_url,
    favicon_url,
    primary_color,
    background_light,
    background_dark,
    foreground_light,
    foreground_dark,
    card_light,
    card_dark,
    muted_light,
    muted_dark,
    border_light,
    border_dark
  FROM branding_settings
  WHERE is_active = true
  LIMIT 1;
$$;

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

-- Comment for documentation
COMMENT ON TABLE branding_settings IS 'Stores customizable branding (company name, logos, colors) for white-labeling the application';
COMMENT ON FUNCTION get_active_branding IS 'Returns the currently active branding settings (public access, no auth required)';

-- ============================================================================
-- PART 3: ACCESS REQUESTS / WAITLIST (from 005_access_requests.sql)
-- ============================================================================

-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  source TEXT DEFAULT 'landing_page',

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- Create index on requested_at for sorting
CREATE INDEX IF NOT EXISTS idx_access_requests_requested_at ON access_requests(requested_at DESC);

-- Enable Row Level Security
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit a request (INSERT only)
CREATE POLICY "Anyone can submit access request"
  ON access_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON access_requests
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Policy: Authenticated users can view all requests (for admin dashboard)
CREATE POLICY "Authenticated users can view all requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update requests (for approval workflow)
CREATE POLICY "Authenticated users can update requests"
  ON access_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create approved_emails table for quick access checks
CREATE TABLE IF NOT EXISTS approved_emails (
  email TEXT PRIMARY KEY,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_request_id UUID REFERENCES access_requests(id),

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS on approved_emails
ALTER TABLE approved_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can check if an email is approved (for login validation)
CREATE POLICY "Anyone can check approved emails"
  ON approved_emails
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can manage approved emails
CREATE POLICY "Authenticated users can manage approved emails"
  ON approved_emails
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to approve an access request
CREATE OR REPLACE FUNCTION approve_access_request(request_id UUID, approver_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_email TEXT;
BEGIN
  -- Get the email from the request
  SELECT email INTO request_email
  FROM access_requests
  WHERE id = request_id;

  IF request_email IS NULL THEN
    RAISE EXCEPTION 'Access request not found';
  END IF;

  -- Update the access request
  UPDATE access_requests
  SET
    status = 'approved',
    approved_at = NOW(),
    approved_by = approver_id
  WHERE id = request_id;

  -- Add to approved_emails
  INSERT INTO approved_emails (email, access_request_id)
  VALUES (request_email, request_id)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

-- Function to reject an access request
CREATE OR REPLACE FUNCTION reject_access_request(request_id UUID, rejection_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE access_requests
  SET
    status = 'rejected',
    notes = COALESCE(rejection_note, notes)
  WHERE id = request_id;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE access_requests IS 'Stores user requests for application access (waitlist)';
COMMENT ON TABLE approved_emails IS 'Fast lookup table for emails with approved access';
COMMENT ON COLUMN access_requests.status IS 'Request status: pending, approved, or rejected';
COMMENT ON COLUMN access_requests.source IS 'Where the request came from: landing_page, referral, etc.';
COMMENT ON FUNCTION approve_access_request IS 'Approves an access request and adds email to approved list';
COMMENT ON FUNCTION reject_access_request IS 'Rejects an access request with optional note';

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- Next Steps:
-- 1. Run this entire SQL file in your Supabase SQL Editor
-- 2. Create the storage bucket (see STORAGE SETUP below)
-- 3. Configure your .env.local with your new Supabase credentials
-- ============================================================================

-- ============================================================================
-- STORAGE SETUP (MANUAL STEP)
-- ============================================================================
-- After running this migration, go to Storage in Supabase Dashboard and:
--
-- 1. Create a new bucket called 'documents-files'
-- 2. Set it to PRIVATE (not public)
-- 3. Set file size limit to 52428800 (50MB)
-- 4. Set allowed MIME types:
--    - application/pdf
--    - image/jpeg
--    - image/png
--    - image/gif
--    - image/webp
--    - text/plain
--    - text/csv
--    - application/vnd.openxmlformats-officedocument.wordprocessingml.document
--    - application/msword
--
-- 5. Add these RLS policies in Storage Policies section:
--
--    Policy 1: "Users can upload their own files"
--    ON storage.objects FOR INSERT
--    WITH CHECK (
--      bucket_id = 'documents-files' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    Policy 2: "Users can view their own files"
--    ON storage.objects FOR SELECT
--    USING (
--      bucket_id = 'documents-files' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    Policy 3: "Users can delete their own files"
--    ON storage.objects FOR DELETE
--    USING (
--      bucket_id = 'documents-files' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
-- ============================================================================
