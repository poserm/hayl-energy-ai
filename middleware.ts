import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/settings']
  const authRoutes = ['/login', '/signup']
  const publicRoutes = ['/api', '/_next', '/favicon.ico']

  // Check if the current path is a public route that should be ignored
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Get token from cookies or Authorization header
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // Verify token if it exists
  let user = null
  if (token) {
    try {
      user = await verifyToken(token)
    } catch (error) {
      // Token verification failed, treat as unauthenticated
      console.warn('Token verification failed:', error)
      user = null
    }
  }

  // Enhanced redirect logic
  if (isProtectedRoute && !user) {
    // Redirect to login if trying to access protected route without valid token
    const loginUrl = new URL('/login', request.url)
    
    // Preserve the original destination and any existing query parameters
    const fullPath = pathname + search
    loginUrl.searchParams.set('redirect', fullPath)
    
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && user) {
    // Check if there's a redirect parameter to send authenticated users to their intended destination
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    
    if (redirectParam && redirectParam.startsWith('/') && !authRoutes.includes(redirectParam)) {
      // Redirect to the originally requested page
      return NextResponse.redirect(new URL(redirectParam, request.url))
    }
    
    // Default: redirect to dashboard if already authenticated and trying to access auth pages
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Enhanced root path handling
  if (pathname === '/') {
    if (user) {
      // Check if there's a redirect parameter for authenticated users
      const redirectParam = request.nextUrl.searchParams.get('redirect')
      
      if (redirectParam && redirectParam.startsWith('/') && !authRoutes.includes(redirectParam)) {
        return NextResponse.redirect(new URL(redirectParam, request.url))
      }
      
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      // Preserve any redirect parameter when sending to login
      const loginUrl = new URL('/login', request.url)
      const redirectParam = request.nextUrl.searchParams.get('redirect')
      
      if (redirectParam) {
        loginUrl.searchParams.set('redirect', redirectParam)
      }
      
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}