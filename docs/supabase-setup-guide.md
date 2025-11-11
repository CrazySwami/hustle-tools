# Supabase Setup Guide

This guide walks you through setting up the complete Supabase database and storage for the Hustle Tools document management system.

## Prerequisites

- Supabase account and project created
- Environment variables already set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Step 1: Run Database Migration

### Option A: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `/supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**

### Option B: Via Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (get reference ID from dashboard)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 2: Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**
3. Configure the bucket:
   - **Name**: `documents-files`
   - **Public**: OFF (private bucket)
   - **File size limit**: 50 MB (52428800 bytes)
   - **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `text/plain`
     - `text/csv`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/msword`

4. Click **Create Bucket**

## Step 3: Set Up Storage RLS Policies

Run these SQL commands in the **SQL Editor**:

```sql
-- Allow users to upload their own files
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own files
CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Step 4: Verify Setup

Run this query to check everything is set up correctly:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('documents', 'folders', 'dittos', 'shares', 'uploaded_files');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('documents', 'folders', 'dittos', 'shares', 'uploaded_files');

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'documents-files';
```

You should see:
- 5 tables returned (documents, folders, dittos, shares, uploaded_files)
- All tables showing `rowsecurity = true`
- 1 storage bucket named `documents-files`

## Step 5: Test with Sample Data (Optional)

```sql
-- Insert a test ditto (replace with your auth user ID)
INSERT INTO dittos (user_id, name, description)
VALUES (
  auth.uid(), -- or paste your user ID
  'My Ditto',
  'This is my shareable profile'
);

-- Insert a test folder
INSERT INTO folders (owner_id, name)
VALUES (auth.uid(), 'Test Folder');

-- Insert a test document
INSERT INTO documents (owner_id, title, content)
VALUES (auth.uid(), 'Test Document', '# Hello World\n\nThis is a test document.');
```

## Step 6: Update Service Role Client (If Needed)

If you encounter RLS recursion issues (similar to the ones documented in `/docs/supabase-issues.md`), you may need to update the service role client:

In `/src/lib/supabase/server.ts`, add:

```typescript
export const createSupabaseServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
```

## Troubleshooting

### Issue: "relation does not exist" error
- **Solution**: Make sure you ran the migration in Step 1

### Issue: "RLS policy violated" error
- **Solution**: Check that RLS policies are set up correctly (Step 1 should handle this)

### Issue: Storage upload fails
- **Solution**: Verify storage bucket exists and RLS policies are set (Steps 2-3)

### Issue: Can't see shared content
- **Solution**: Make sure the `shares` table has proper data and RLS policies allow viewing shared resources

## Next Steps

After completing this setup:
1. The app will automatically use Supabase for persistence
2. Documents will be saved to the database instead of localStorage
3. File uploads will go to Supabase Storage
4. Sharing features will work properly

See `/docs/api-routes-guide.md` for API endpoint documentation.
