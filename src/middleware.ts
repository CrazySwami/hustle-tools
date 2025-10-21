import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const unprotectedRoutes = [
    '/login',
    '/signup',
    '/image-alterations',
    '/firecrawl',
    '/chat',
    '/chat-doc-editor',
    '/editor',
    '/elementor-editor',
  ]
  const path = request.nextUrl.pathname

  // if user is not signed in and the current path is not an unprotected route, redirect the user to /login
  if (!user && !unprotectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // if user is signed in and the current path is an unprotected route (like login/signup), redirect the user to /
  if (user && unprotectedRoutes.includes(path)) {
    // We allow logged-in users to visit most unprotected routes, but redirect from login/signup
    if (path === '/login' || path === '/signup') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth routes)
     * - *.js, *.css, *.png, *.jpg, etc. (public folder static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback|.*\\.js|.*\\.css|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.ico).*?)',
  ],
}