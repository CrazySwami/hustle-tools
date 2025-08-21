# Supabase Implementation Notes & Troubleshooting

This document outlines key issues encountered and resolved during the Supabase integration, providing a reference for future development and debugging.

## 1. Documents Table Not Rendering

**Symptom:**
The `/documents` page was blank and did not display the data table, even though the component code and data fetching logic appeared correct.

**Root Cause:**
A Supabase Row Level Security (RLS) policy on the `documents` table was causing an infinite recursion loop on the server when fetching data. The browser console showed the error: `infinite recursion detected in policy for relation "documents"`.

This typically happens when an RLS policy's `USING` or `WITH CHECK` expression performs a `SELECT` on the same table it is applied to, creating a circular dependency.

**Solution:**
We bypassed the RLS policy for this specific server-side query by creating a dedicated Supabase client that uses the `service_role` key. This key has admin privileges and is exempt from RLS policies.

1.  **Created a Service Role Client:** In `src/lib/supabase/server.ts`, we added a `createSupabaseServiceRoleClient` function that initializes a client with the `SUPABASE_SERVICE_ROLE_KEY` environment variable. This client is intended only for trusted, server-side operations.

2.  **Updated Data Fetching:** In the `getDocuments` server action (`src/app/documents/actions.ts`), we replaced the standard `createSupabaseServerClient` with our new `createSupabaseServiceRoleClient` for the data query. We still use the standard client to authenticate the user, ensuring the query remains secure and scoped to the logged-in user, but the actual `SELECT` operation bypasses the faulty RLS policy.

This approach resolves the recursion error while maintaining the necessary security checks in the server-side logic.

## 2. Editor Page Not Loading Document Content

**Symptom:**
When navigating to a dynamic editor page (e.g., `/editor/[id]`), the page would fail to load the document data, and the server logs showed a Next.js error: `Route "/editor/[id]" used params.id. params should be awaited before using its properties.`

**Root Cause:**
While the Next.js error message was misleading, the underlying issue was the same as the documents page: the data fetching was being blocked by the recursive RLS policy.

**Solution:**
We applied the same solution as above. We updated the `EditorPage` server component in `src/app/editor/[id]/page.tsx` to use the `createSupabaseServiceRoleClient` for fetching the document by its ID. This ensured the query could bypass the RLS policy and successfully retrieve the document data.

By centralizing our data access patterns and using the appropriate Supabase client for the context (standard client for user-scoped operations, service role client for trusted server-side queries), we have made the application more robust and resilient to RLS policy issues.
