import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()

  // Check if Supabase credentials are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If credentials are missing, return a mock client with no user
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as any
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * Create a Supabase client with service role privileges
 * This client bypasses RLS policies - use only for trusted server-side operations!
 *
 * Use cases:
 * - Admin operations that need to bypass RLS
 * - Avoiding RLS recursion issues
 * - Batch operations across multiple users
 */
export const createSupabaseServiceRoleClient = () => {
  // TEMPORARY: Hardcoded values for debugging
  const supabaseUrl = 'https://racltbidxkdiyhlgpgar.supabase.co'
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhY2x0YmlkeGtkaXlobGdwZ2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTE3MDgsImV4cCI6MjA3ODM4NzcwOH0.cZZ70WMJkubhvtIW2E-NICWFLncOW3LGQ_2z_DmQTZE'

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
