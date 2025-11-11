# Supabase Authentication Setup Guide

**Date:** 2025-01-10
**Instance:** `racltbidxkdiyhlgpgar.supabase.co`

---

## Current Status

✅ **Environment Variables Configured** (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://racltbidxkdiyhlgpgar.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Database Schema** - Already migrated (001_initial_schema.sql)
✅ **Storage Bucket** - Already created (documents-files)

🔧 **Need to Set Up:** Authentication Providers

---

## Step 1: Enable Email Authentication

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/racltbidxkdiyhlgpgar
2. Navigate to **Authentication** → **Providers**
3. Find **Email** provider
4. Click to expand settings
5. Make sure these are enabled:
   - ✅ **Enable email provider**
   - ✅ **Confirm email** (optional - if you want users to verify email)
   - ✅ **Enable email confirmations** (recommended for production)
6. Click **Save**

### Email Settings (Optional but Recommended)

Navigate to **Authentication** → **Settings** → **Email**

**Email Templates:**
- Customize confirmation email template
- Customize password reset email template
- Add your app name and branding

**SMTP Settings (For Production):**
- By default, Supabase uses their SMTP (limited to 4 emails/hour in free tier)
- For production, configure your own SMTP provider:
  - Go to **Settings** → **Auth** → **SMTP Settings**
  - Enter your SMTP credentials (Gmail, SendGrid, etc.)

---

## Step 2: Enable Google OAuth (Optional)

If you want Google Sign-In:

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted:
   - User Type: **External**
   - App name: "Hustle Tools" (or your app name)
   - User support email: Your email
   - Developer contact email: Your email
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Hustle Tools - Supabase Auth"
   - Authorized redirect URIs:
     ```
     https://racltbidxkdiyhlgpgar.supabase.co/auth/v1/callback
     ```
   - For local development, also add:
     ```
     http://localhost:3000/auth/callback
     ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### 2.2 Configure Google Provider in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** provider
3. Click to expand
4. Toggle **Enable Google provider**
5. Paste your:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
6. Click **Save**

---

## Step 3: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```
4. For production, add your production URLs:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com
   ```

---

## Step 4: Test Authentication

### Test Email Sign-Up

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/chat-doc`
3. Click **Sign In** (if you have auth UI)
4. Try signing up with email/password
5. Check Supabase Dashboard → **Authentication** → **Users**
6. You should see the new user!

### Test Email Sign-In

1. Try logging in with the email/password you just created
2. You should be redirected to the app
3. Check browser console for any errors

### Test Google OAuth (If Enabled)

1. Click "Sign in with Google"
2. Select your Google account
3. Grant permissions
4. You should be redirected back to the app
5. Check Supabase Dashboard → **Users** - new user should appear

---

## Step 5: Verify Database Permissions (RLS)

Your database has Row-Level Security (RLS) policies. Let's verify they're working:

### Test Document Creation

1. Sign in to the app
2. Create a new document via the + button
3. Open Supabase Dashboard → **Table Editor** → **documents**
4. You should see the new document with `owner_id` = your user ID

### Test RLS (Important!)

1. Open Supabase Dashboard → **SQL Editor**
2. Run this query:
   ```sql
   -- Try to select documents (should only show YOUR documents)
   SELECT * FROM documents;
   ```
3. You should ONLY see documents you created
4. If you see ALL documents or get an error, RLS may not be working

### Verify RLS Policies Are Enabled

1. Go to **Database** → **Tables** → **documents**
2. Scroll down to **RLS Policies**
3. You should see:
   - ✅ "Users can view their own documents"
   - ✅ "Users can insert their own documents"
   - ✅ "Users can update their own documents"
   - ✅ "Users can delete their own documents"
4. All should have a green checkmark (enabled)

---

## Step 6: Test Storage Permissions

### Test File Upload

1. In your app, go to the sidebar
2. Click **Add Context** → **Upload File**
3. Upload a test PDF or image
4. Go to Supabase Dashboard → **Storage** → **documents-files**
5. You should see a folder with your user ID
6. Inside, you should see the uploaded file

### Verify Storage RLS

1. Try accessing the file URL directly in browser (incognito/private window)
2. You should get a 403 Forbidden error (good! means RLS is working)
3. When logged in, the file should be accessible

---

## Troubleshooting

### "Failed to fetch" Error

**Cause:** Supabase URL or keys are incorrect

**Fix:**
1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the correct URL and keys
3. Update `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Restart dev server: `npm run dev`

### "Email not confirmed" Error

**Cause:** Email confirmation is required but user hasn't confirmed

**Fix:**
1. Go to Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Disable **Confirm email** (for development only!)
3. OR check the user's email for confirmation link

### Google OAuth "redirect_uri_mismatch" Error

**Cause:** Redirect URI in Google Cloud Console doesn't match Supabase callback URL

**Fix:**
1. Go to Google Cloud Console → **Credentials**
2. Edit your OAuth Client ID
3. Add the EXACT callback URL:
   ```
   https://racltbidxkdiyhlgpgar.supabase.co/auth/v1/callback
   ```
4. Save and try again

### "RLS policy violated" Error

**Cause:** User is not authenticated or RLS policy is too restrictive

**Fix:**
1. Check if user is logged in: `console.log(supabase.auth.getSession())`
2. Verify RLS policies in Supabase Dashboard
3. Check that `owner_id` matches user's ID in database

### Users Table Empty After Sign-Up

**Cause:** Email confirmation required, user hasn't confirmed yet

**Fix:**
1. Check the email inbox for confirmation link
2. OR go to Supabase Dashboard → **Authentication** → **Users**
3. Find the user and click **...** → **Confirm email**

---

## Current Auth UI Components

Your app already has auth components! They're located in:

- `/src/components/auth/SignIn.tsx` - Sign-in form
- `/src/components/auth/SignUp.tsx` - Sign-up form
- `/src/lib/supabase/client.ts` - Supabase client (browser)
- `/src/lib/supabase/server.ts` - Supabase client (server)

### Where Auth is Used

Based on your codebase, auth is integrated in:

1. **Chat-Doc Page** (`/src/app/chat-doc/page.tsx`)
   - Uses `useSupabaseProjectHierarchy` hooks
   - All document operations require authentication
   - Documents are scoped to the logged-in user

2. **API Routes** (`/src/app/api/*`)
   - All routes check for authenticated user
   - Use `createSupabaseServerClient()` to get user session
   - Return 401 Unauthorized if not logged in

---

## Testing Checklist

### Email Auth
- [ ] User can sign up with email/password
- [ ] User appears in Supabase **Users** table
- [ ] User can sign in with email/password
- [ ] User session persists on page refresh
- [ ] User can sign out

### Google OAuth (If Enabled)
- [ ] User can sign in with Google
- [ ] User is redirected back to app after OAuth
- [ ] User appears in Supabase **Users** table
- [ ] User session persists on page refresh

### Database (RLS)
- [ ] User can create documents (appear in Supabase)
- [ ] User can only see their own documents
- [ ] User can update their own documents
- [ ] User cannot see other users' documents
- [ ] Shared documents appear correctly (via shares table)

### Storage (RLS)
- [ ] User can upload files
- [ ] Files appear in Supabase Storage under user's folder
- [ ] User can download their own files
- [ ] User cannot access other users' files directly

---

## Next Steps After Auth is Working

Once auth is set up and tested:

1. **Implement Sharing UI**
   - Modal to search users by email
   - Select document/folder to share
   - Choose permissions (view/edit)
   - Call `/api/shares` to create share

2. **Add Ditto Profile Modal**
   - 3-dot menu on hover over dittos
   - "View Profile" option
   - Modal showing LinkedIn, websites, etc.

3. **Implement File Upload UI**
   - Add upload button to Active Files
   - File picker with drag-and-drop
   - Upload progress indicator
   - Mark files as "active" for AI context

4. **Add Autosave Toggle**
   - Toggle in DocumentChat component
   - Save to localStorage preference
   - Disable/enable 30-second autosave

---

## Quick Start Commands

```bash
# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev

# Open app
open http://localhost:3000/chat-doc
```

---

## Support Resources

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Google OAuth Setup:** https://supabase.com/docs/guides/auth/social-login/auth-google
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security
- **Storage RLS:** https://supabase.com/docs/guides/storage/security/access-control

---

**Your Supabase Dashboard:** https://supabase.com/dashboard/project/racltbidxkdiyhlgpgar

---

**End of Document**
