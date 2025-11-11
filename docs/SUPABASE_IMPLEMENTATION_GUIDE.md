# Supabase Implementation Guide

This guide provides step-by-step instructions to complete the Supabase integration for the document management system.

## What We've Built

✅ **Complete Database Schema** (`/supabase/migrations/001_initial_schema.sql`)
- Documents, Folders, Dittos tables
- Shares table for sharing functionality
- Uploaded Files table with metadata
- Complete RLS policies for security
- Triggers for `updated_at` timestamps

✅ **Complete API Routes**
- `/api/documents` - CRUD for documents
- `/api/folders` - CRUD for folders
- `/api/dittos` - User profiles/shared identities
- `/api/shares` - Sharing system
- `/api/files` - File upload and management

✅ **Supabase-Backed React Hooks**
- `useDocuments()` - Replace localStorage with Supabase
- `useFolders()` - Replace localStorage with Supabase
- `useProjects()` - Top-level folders treated as projects
- `useProjectUIState()` - UI state (still uses localStorage)

✅ **Service Role Client**
- Updated `/src/lib/supabase/server.ts` with admin client
- Bypasses RLS when needed to avoid recursion

---

## Step 1: Set Up Supabase Database

### 1.1 Run the Migration

**Option A: Supabase Dashboard**
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `/supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**
6. Wait for success confirmation

**Option B: Supabase CLI** (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 1.2 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Settings:
   - **Name**: `documents-files`
   - **Public**: OFF (private)
   - **File size limit**: 50 MB
   - **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`, `image/png`, `image/gif`, `image/webp`
     - `text/plain`, `text/csv`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/msword`
4. Click **Create**

### 1.3 Set Up Storage RLS Policies

Run these SQL commands in **SQL Editor**:

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

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Step 2: Migrate Frontend to Use Supabase Hooks

### 2.1 Update `/src/app/chat-doc/page.tsx`

Replace the import:

**Before:**
```typescript
import { useDocuments, useProjects, useFolders } from '@/hooks/useProjectHierarchy';
```

**After:**
```typescript
import { useDocuments, useProjects, useFolders } from '@/hooks/useSupabaseProjectHierarchy';
```

That's it! The hooks have the same interface, so no other changes are needed.

### 2.2 Test the Migration

1. Start your dev server: `npm run dev`
2. Go to `/chat-doc`
3. Create a new document
4. Check Supabase dashboard → **Table Editor** → `documents` table
5. You should see the new document!

---

## Step 3: Add Ditto Hover Menu to Sidebar

This adds a 3-dot menu when hovering over other users' Dittos to view their profile details.

### 3.1 Create Ditto Modal Component

Create `/src/components/modals/DittoProfileModal.tsx`:

```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Linkedin, Globe } from 'lucide-react';

interface DittoProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ditto: {
    name: string;
    description?: string;
    linkedin_profile?: string;
    personal_website?: string;
    company_website?: string;
    additional_context?: string;
    social_links?: Array<{ platform: string; url: string; icon: string }>;
    website_links?: string[];
  } | null;
}

export function DittoProfileModal({ open, onOpenChange, ditto }: DittoProfileModalProps) {
  if (!ditto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{ditto.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {ditto.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{ditto.description}</p>
            </div>
          )}

          {/* Professional Links */}
          <div>
            <h3 className="text-sm font-medium mb-3">Professional Links</h3>
            <div className="space-y-2">
              {ditto.linkedin_profile && (
                <a
                  href={ditto.linkedin_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {ditto.personal_website && (
                <a
                  href={ditto.personal_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Personal Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {ditto.company_website && (
                <a
                  href={ditto.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Company Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Social Links */}
          {ditto.social_links && ditto.social_links.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Social Media</h3>
              <div className="flex flex-wrap gap-2">
                {ditto.social_links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm"
                  >
                    <Badge variant="secondary">
                      {link.icon} {link.platform}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Additional Context */}
          {ditto.additional_context && (
            <div>
              <h3 className="text-sm font-medium mb-2">Additional Context</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ditto.additional_context}
              </p>
            </div>
          )}

          {/* Website Links */}
          {ditto.website_links && ditto.website_links.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Resources</h3>
              <div className="space-y-2">
                {ditto.website_links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {link}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3.2 Update DataSidebar Component

In `/src/components/ai-elements/data-sidebar.tsx`, add the hover menu:

1. Import the modal:
```typescript
import { DittoProfileModal } from '@/components/modals/DittoProfileModal';
import { MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
```

2. Add state for the modal:
```typescript
const [dittoModalOpen, setDittoModalOpen] = useState(false);
const [selectedDitto, setSelectedDitto] = useState<any>(null);
```

3. Add hover menu to Ditto items:
```typescript
<div
  className="flex items-center justify-between group"
  onMouseEnter={() => setHoveredDitto(ditto.id)}
  onMouseLeave={() => setHoveredDitto(null)}
>
  <div className="flex items-center gap-2">
    <User className="h-4 w-4 text-green-500" />
    <span>{ditto.name}</span>
  </div>

  {/* 3-dot menu - shows on hover */}
  {hoveredDitto === ditto.id && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 hover:bg-muted rounded">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => {
            setSelectedDitto(ditto);
            setDittoModalOpen(true);
          }}
        >
          View Profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}
</div>
```

4. Add the modal at the bottom:
```typescript
<DittoProfileModal
  open={dittoModalOpen}
  onOpenChange={setDittoModalOpen}
  ditto={selectedDitto}
/>
```

---

## Step 4: Add Autosave Toggle & Manual Save

### 4.1 Add Toggle to DocumentChat Component

In `/src/components/editor/DocumentChat.tsx` (or wherever your save button is), add:

```typescript
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Add state
const [autosaveEnabled, setAutosaveEnabled] = useState(
  localStorage.getItem('doc-autosave-enabled') !== 'false'
);

// Update localStorage when toggled
useEffect(() => {
  localStorage.setItem('doc-autosave-enabled', String(autosaveEnabled));
}, [autosaveEnabled]);

// Add UI
<div className="flex items-center gap-2">
  <Switch
    checked={autosaveEnabled}
    onCheckedChange={setAutosaveEnabled}
    id="autosave"
  />
  <Label htmlFor="autosave" className="text-sm">Autosave</Label>
</div>
```

### 4.2 Update Autosave Logic in `/src/app/chat-doc/page.tsx`

```typescript
// Auto-save every 30 seconds (only if enabled)
useEffect(() => {
  if (!selectedDocumentId || !autosaveEnabled) return;

  const interval = setInterval(() => {
    if (saveStatus === 'unsaved') {
      handleSaveDocument();
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [selectedDocumentId, saveStatus, autosaveEnabled, handleSaveDocument]);
```

---

## Step 5: Test Everything

### 5.1 Test Document Management
1. Create a new document
2. Edit the content
3. Check autosave toggle
4. Manual save with Cmd+S
5. Verify in Supabase dashboard

### 5.2 Test Folder Management
1. Create folders
2. Move documents between folders
3. Rename folders

### 5.3 Test Sharing
1. Create a share with another user's email
2. Log in as that user
3. See the shared document appear under the owner's Ditto

### 5.4 Test File Uploads
1. Upload a PDF or image
2. Mark it as "active" (in AI context)
3. Verify it appears in "Active Files" section

---

## Step 6: Migration Strategy

### Option A: Fresh Start (Recommended for Testing)
1. Clear localStorage
2. Run the app with Supabase hooks
3. Create new documents in Supabase

### Option B: Migrate Existing Data
1. Export documents from localStorage
2. Create a migration script to POST each document to `/api/documents`
3. Update IDs in any references

---

## Next Steps

### Immediate
- [ ] Run database migration in Supabase
- [ ] Test document CRUD with new hooks
- [ ] Add Ditto hover menu
- [ ] Add autosave toggle

### Future Enhancements
- [ ] Implement file summarization with AI
- [ ] Add real-time collaboration (presence indicators)
- [ ] Implement version history
- [ ] Add full-text search across documents
- [ ] Implement folder/document permissions
- [ ] Add export/import functionality

---

## Troubleshooting

### "relation does not exist" error
**Solution**: Run the migration SQL in Supabase dashboard

### "RLS policy violated" error
**Solution**: Check that you're logged in and RLS policies are correct

### Storage upload fails
**Solution**: Verify storage bucket exists and RLS policies are set

### Can't see shared content
**Solution**: Check the `shares` table has proper data and permissions

### Documents not syncing
**Solution**: Check browser console for API errors, verify Supabase credentials

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Setup Guide**: `/docs/supabase-setup-guide.md`
- **API Routes**: See individual route files in `/src/app/api/`
- **Hooks**: `/src/hooks/useSupabaseProjectHierarchy.ts`

---

## Summary

You now have a complete Supabase-backed document management system with:

✅ Database schema with RLS security
✅ Complete API routes
✅ React hooks with realtime updates
✅ File upload and storage
✅ Sharing system
✅ User profiles (Dittos)
✅ Autosave functionality

All you need to do is:
1. Run the migration in Supabase
2. Create the storage bucket
3. Update the import in `/src/app/chat-doc/page.tsx`
4. Test!

Good luck! 🚀
