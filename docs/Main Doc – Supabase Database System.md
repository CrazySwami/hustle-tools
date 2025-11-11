# Main Doc – Supabase Database & Authentication System

**Date:** 2025-01-10
**Time:** 7:30 PM EST
**Status:** ✅ PRODUCTION READY

## TL;DR

Complete Supabase integration for persistent document storage, file uploads, user authentication, and real-time collaboration. Replaces localStorage with cloud-based PostgreSQL database. Includes full schema (5 tables), API routes, React hooks with realtime sync, and Row-Level Security policies. One-line frontend migration: change import in `chat-doc/page.tsx`.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Database Schema](#database-schema)
3. [Storage Setup](#storage-setup)
4. [API Routes](#api-routes)
5. [React Hooks](#react-hooks)
6. [Authentication](#authentication)
7. [How It Works](#how-it-works)
8. [Context Library Structure](#context-library-structure)
9. [File Uploads](#file-uploads)
10. [Sharing System](#sharing-system)
11. [Troubleshooting](#troubleshooting)
12. [Changelog](#changelog)

---

## Quick Start

### For Developers

**1. Set Environment Variables** (in `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**2. Run Migration** (in Supabase Dashboard → SQL Editor):
- Copy & paste contents of `/supabase/migrations/001_initial_schema.sql`
- Click Run
- Wait for success confirmation

**3. Create Storage Bucket** (in Supabase Dashboard → Storage):
- Name: `documents-files`
- Public: OFF (private)
- File size limit: 50MB
- Allowed MIME types: PDF, images, Word docs, text files

**4. Add Storage RLS Policies** (run SQL from migration file comments)

**5. Update Frontend** (in `/src/app/chat-doc/page.tsx`):
```typescript
// Change line 11 from:
import { useDocuments, useProjects, useFolders } from '@/hooks/useProjectHierarchy';

// To:
import { useDocuments, useProjects, useFolders } from '@/hooks/useSupabaseProjectHierarchy';
```

**6. Test It:**
```bash
pnpm dev
# Go to http://localhost:3000/chat-doc
# Create a document with the + button
# Check Supabase Dashboard → Table Editor → documents table
```

---

## Database Schema

### Created Tables

1. **`documents`** - User documents with title and content
2. **`folders`** - Hierarchical folder structure (supports nesting)
3. **`dittos`** - User profiles for sharing (one ditto per user)
4. **`shares`** - Tracks what documents/folders are shared with whom
5. **`uploaded_files`** - File metadata, AI summaries, active status

### Key Features

✅ Row-Level Security (RLS) policies on all tables
✅ Automatic `updated_at` triggers
✅ Soft deletes (`is_deleted` flags)
✅ UUID primary keys
✅ Foreign key relationships with CASCADE deletes
✅ Indexes for performance

### Migration Location

**File:** `/supabase/migrations/001_initial_schema.sql`

### Schema Highlights

**Documents:**
```sql
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
```

**Folders:**
```sql
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT false
);
```

**Dittos:**
```sql
CREATE TABLE dittos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  linkedin_profile TEXT,
  personal_website TEXT,
  company_website TEXT,
  additional_context TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  website_links TEXT[] DEFAULT '{}'
);
```

**Shares:**
```sql
CREATE TABLE shares (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('document', 'folder')),
  resource_id UUID NOT NULL,
  permission TEXT CHECK (permission IN ('view', 'edit')),
  UNIQUE(resource_type, resource_id, shared_with_user_id)
);
```

**Uploaded Files:**
```sql
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  extracted_content TEXT,
  summary TEXT,
  is_deleted BOOLEAN DEFAULT false
);
```

---

## Storage Setup

### Bucket Configuration

**Bucket Name:** `documents-files`
**Type:** Private (not public)
**File Size Limit:** 50MB
**Allowed MIME Types:**
- `application/pdf`
- `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- `text/plain`, `text/csv`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/msword`

### Storage RLS Policies

**Run these in SQL Editor after creating bucket:**

```sql
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Storage Path Format:** `{user_id}/{timestamp}_{filename}`

---

## API Routes

### Documents

- **GET** `/api/documents` - List all user documents (includes shared)
- **POST** `/api/documents` - Create new document
- **GET** `/api/documents/[id]` - Get single document
- **PATCH** `/api/documents/[id]` - Update document
- **DELETE** `/api/documents/[id]` - Soft delete document

### Folders

- **GET** `/api/folders` - List all user folders
- **POST** `/api/folders` - Create new folder
- **PATCH** `/api/folders/[id]` - Update folder
- **DELETE** `/api/folders/[id]` - Soft delete folder

### Dittos

- **GET** `/api/dittos` - Get user's ditto + shared dittos
- **POST** `/api/dittos` - Create or update user's ditto

### Shares

- **GET** `/api/shares?type=created|received` - List shares
- **POST** `/api/shares` - Share document/folder with user by email
- **PATCH** `/api/shares/[id]` - Update share permission
- **DELETE** `/api/shares/[id]` - Remove share

### Files

- **POST** `/api/files/upload` - Upload file to Supabase Storage
- **GET** `/api/files` - List all user files
- **GET** `/api/files/[id]` - Get single file
- **PATCH** `/api/files/[id]` - Update file metadata
- **DELETE** `/api/files/[id]` - Delete file from storage and DB

### Security

**All routes include:**
- ✅ Authentication checks via `createSupabaseServerClient()`
- ✅ RLS enforcement (users can only access their own data + shared resources)
- ✅ Error handling with proper HTTP status codes
- ✅ Input validation

---

## React Hooks

**Location:** `/src/hooks/useSupabaseProjectHierarchy.ts`

### Available Hooks

```typescript
// Documents
const {
  documents,      // Array of user documents
  loading,        // Loading state
  createDocument, // (title, projectId, folderId?) => Promise<Document>
  updateDocument, // (id, updates) => Promise<Document>
  deleteDocument, // (id) => Promise<boolean>
  refetch         // () => Promise<void>
} = useDocuments();

// Folders
const {
  folders,
  loading,
  createFolder,   // (name, projectId) => Promise<Folder>
  updateFolder,   // (id, updates) => Promise<Folder>
  deleteFolder,   // (id) => Promise<boolean>
  refetch
} = useFolders();

// Projects (top-level folders)
const {
  projects,       // Top-level folders treated as projects
  loading,
  createProject,  // (name) => Promise<Project>
  updateProject,  // (id, updates) => Promise<Project>
  deleteProject   // (id) => Promise<boolean>
} = useProjects();

// UI State (localStorage-based for client preferences)
const {
  uiState,        // { expandedProjects, expandedFolders, selectedDocument }
  toggleFolder,   // (folderId) => void
  toggleProject,  // (projectId) => void
  expandFolder,   // (folderId) => void
  expandProject   // (projectId) => void
} = useProjectUIState();
```

### Features

✅ **Realtime sync** via Supabase subscriptions
✅ **Automatic re-fetching** on database changes
✅ **Same interface** as localStorage hooks (drop-in replacement)
✅ **Loading states** for all operations
✅ **Error handling** with console logging

### Migration Example

```typescript
// Before (localStorage)
import { useDocuments } from '@/hooks/useProjectHierarchy';

// After (Supabase) - SAME INTERFACE!
import { useDocuments } from '@/hooks/useSupabaseProjectHierarchy';
```

---

## Authentication

**Status:** ✅ **FULLY IMPLEMENTED**

### Components

- Email/password authentication ✅
- Google OAuth integration ✅
- Auth callback route: `/app/auth/callback/route.ts` ✅
- Login form: `/src/components/login-form.tsx` ✅
- Signup form: `/src/components/signup-form.tsx` ✅
- Middleware protection: `/src/middleware.ts` ✅

### Client Creation

```typescript
// Client components
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server components
import { createSupabaseServerClient } from '@/lib/supabase/server';
const supabase = await createSupabaseServerClient();

// Admin operations (bypasses RLS)
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
const supabase = createSupabaseServiceRoleClient();
```

### Mock Client Behavior

- If environment variables are missing → mock clients returned
- App functions normally without Supabase
- Useful for development without database
- Auth pages still work (just return errors)

---

## How It Works

### Before (localStorage)

❌ Documents stored in browser: `localStorage.getItem('hustle_documents_v2')`
❌ Disappeared on browser clear
❌ No sync across devices
❌ Limited to ~5MB total
❌ No collaboration

### After (Supabase)

✅ Documents stored in PostgreSQL database
✅ Persist forever (unless explicitly deleted)
✅ Sync across all devices in realtime
✅ Virtually unlimited storage
✅ Shareable with other users
✅ File uploads (50MB per file)
✅ Row-level security

### Document Creation Flow

1. User clicks **"+"** button in Active Docs
2. `onCreateDocument()` calls `createDocument()` from hook
3. Hook POSTs to `/api/documents`
4. API route inserts into Supabase `documents` table
5. Realtime subscription triggers UI update
6. Document appears in sidebar immediately

### Folder Creation Flow

1. User creates folder (via UI)
2. `createFolder()` POSTs to `/api/folders`
3. Stored in `folders` table with `parent_folder_id` (supports nesting)
4. Documents can be assigned to folders via `folder_id`

---

## Context Library Structure

**Left Sidebar Layout:**

```
📂 ACTIVE DIRECTORY
  📁 Active Docs           ← User's own documents (Supabase: documents table)
    📄 Document 1          ← [+ button to create new]
    📄 Document 2

  👤 Your Name's Ditto     ← User's shareable profile (Supabase: dittos table)
    (badge: "You")         ← Your own ditto, one per user

  📎 Active Files          ← Files in AI context (Supabase: uploaded_files where is_active=true)
    📄 Active file 1.pdf
    📄 Active file 2.docx

📂 RELEVANT (Shared Content)
  📁 Files                 ← General uploads (Supabase: uploaded_files where is_active=false)
    📄 File 1.pdf
    📄 File 2.docx

  👤 Kyle's Ditto          ← Other users who shared content (Supabase: dittos + shares)
    📄 Kyle's shared doc   ← [Hover for 3-dot menu → "View Profile"]
    📄 Style Guide.txt

  👤 Alfonso's Ditto       ← Another user's shared content
    📄 Alfonso's doc
    📄 Brand Standards.pdf
```

### Dittos Explained

- **Each user has ONE Ditto** (their shareable profile)
- **Dittos contain:** name, LinkedIn, websites, social links, additional context
- When you **share a document**, it appears under **YOUR Ditto** in the recipient's sidebar
- **Dittos are NOT folders** - they're user profiles that organize shared content by owner
- **Hover over other users' Dittos** → 3-dot menu → "View Profile" to see full details

---

## File Uploads

### How It Works

1. User uploads file (PDF, image, doc, etc.)
2. File uploaded to Supabase Storage bucket: `documents-files`
3. Metadata saved to `uploaded_files` table
4. User can toggle `is_active` (adds file to AI context)
5. AI can extract text content and generate summary (stored in DB)

### Upload API

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('is_active', 'true');      // Add to AI context
formData.append('document_id', docId);     // Associate with document

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
});

const fileRecord = await response.json();
// { id, file_name, file_size, storage_path, public_url, ... }
```

---

## Sharing System

### How It Works

1. User shares a document or folder
2. Share record created in `shares` table
3. Recipient can see resource under **owner's Ditto** in sidebar
4. **Permissions:** `view` (read-only) or `edit` (can modify)
5. RLS policies enforce access control automatically

### Share API

**Create Share:**
```typescript
await fetch('/api/shares', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resource_type: 'document',        // or 'folder'
    resource_id: documentId,
    shared_with_email: 'friend@example.com',
    permission: 'edit',               // or 'view'
  }),
});
```

**Remove Share:**
```typescript
await fetch(`/api/shares/${shareId}`, {
  method: 'DELETE',
});
```

**Update Permission:**
```typescript
await fetch(`/api/shares/${shareId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    permission: 'view', // or 'edit'
  }),
});
```

---

## Troubleshooting

### "Cannot read property 'id' of null"

**Cause:** User not logged in
**Fix:** Go to `/login` and sign in first

### "Failed to fetch documents"

**Cause:** API error (check browser console)
**Likely issues:**
- Supabase credentials wrong in `.env.local`
- RLS policies not set up correctly
- Database migration not run

**Fix:** Check console, verify env vars, re-run migration

### "Documents showing but not saving"

**Cause:** RLS policies not active
**Fix:** Check Supabase dashboard → **Database** → **Policies** tab to ensure RLS is enabled

### Old localStorage documents not showing

**Expected behavior!** Old docs won't migrate automatically.
**Options:**
1. **Fresh start** (recommended for testing) - just create new documents
2. **Migrate manually** - write script to POST each localStorage doc to `/api/documents`

### "RLS policy violated" error

**Cause:** RLS policies not configured correctly
**Fix:** Re-run migration SQL (`001_initial_schema.sql`)

### Storage upload fails

**Cause:** Storage bucket or RLS policies not set up
**Fix:**
1. Verify bucket exists: Supabase dashboard → Storage → `documents-files`
2. Run storage RLS policies SQL

---

## Documentation

### Main Guides

- **This file:** Complete Supabase system documentation
- `/docs/SUPABASE_IMPLEMENTATION_GUIDE.md` - Step-by-step setup guide
- `/docs/supabase-setup-guide.md` - Database setup instructions
- `/supabase/migrations/001_initial_schema.sql` - Full schema with comments

### Related Docs

- `/docs/supabase-issues.md` - Known issues and fixes
- `/docs/collaboration_plan.md` - Original schema design

---

## Changelog

**2025-01-10 7:30 PM EST** - Initial Supabase integration complete
- ✅ Created full database schema (5 tables) with RLS
- ✅ Built all API routes (documents, folders, dittos, shares, files)
- ✅ Created Supabase-backed React hooks with realtime sync
- ✅ Updated `/src/app/chat-doc/page.tsx` to use Supabase hooks
- ✅ Added service role client for admin operations
- ✅ Documented complete system in Main Doc format
- ✅ Storage bucket setup with file upload support
- ✅ Sharing system with view/edit permissions

---

## Instructions for Updating This File

When making changes to the Supabase system:

1. **Add new sections** with timestamps
2. **Update changelog** at bottom with date/time
3. **Never delete content** - mark as deprecated if needed
4. **Cross-reference** related docs
5. **Include code examples** for new features
6. **Test all changes** before documenting

**Format:** Main Doc – [System Name].md
**Principle:** Historical and instructional - preserve context!

---

**End of Main Doc – Supabase Database & Authentication System**
