-- Complete setup for auth-disabled development mode
-- Run this in your Supabase SQL Editor

-- 1. Disable RLS on all tables
ALTER TABLE IF EXISTS documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dittos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uploaded_files DISABLE ROW LEVEL SECURITY;

-- 2. Create placeholder user in auth.users (if not exists)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'dev@placeholder.com',
  '$2a$10$placeholder.encrypted.password.hash.for.development.only',
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('documents', 'folders', 'dittos', 'shares', 'uploaded_files')
ORDER BY tablename;
