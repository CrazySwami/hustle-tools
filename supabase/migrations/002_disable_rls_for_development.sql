-- Disable RLS for development (allows operations without authentication)
-- WARNING: This removes security! Re-enable RLS before production!

-- Disable RLS on documents table
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Disable RLS on folders table
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on dittos table
ALTER TABLE dittos DISABLE ROW LEVEL SECURITY;

-- Disable RLS on shares table
ALTER TABLE shares DISABLE ROW LEVEL SECURITY;

-- Disable RLS on uploaded_files table
ALTER TABLE uploaded_files DISABLE ROW LEVEL SECURITY;
