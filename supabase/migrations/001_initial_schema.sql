-- ============================================================================
-- HUSTLE TOOLS - DOCUMENT MANAGEMENT SYSTEM
-- Database Schema Migration
-- ============================================================================
-- This migration creates the complete database structure for:
-- - Documents and folders
-- - User Dittos (shareable profiles)
-- - File uploads and storage
-- - Sharing system
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- STORAGE BUCKET (for file uploads)
-- ============================================================================
-- NOTE: Run this separately in Supabase dashboard or via supabase CLI:
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'documents-files',
--   'documents-files',
--   false,
--   52428800, -- 50MB limit
--   ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
-- );
--
-- Storage RLS Policy:
-- CREATE POLICY "Users can upload their own files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'documents-files' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can view their own files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'documents-files' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete their own files"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'documents-files' AND auth.uid()::text = (storage.foldername(name))[1]);
-- ============================================================================
