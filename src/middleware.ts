import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const unprotectedRoutes = ['/login', '/signup']

  // if user is not signed in and the current path is not an unprotected route, redirect the user to /login
  if (!user && !unprotectedRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // if user is signed in and the current path is an unprotected route, redirect the user to /
  if (user && unprotectedRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*?)',
  ],
}
