import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value
  const userInfo = request.cookies.get('user-info')?.value

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Require both token and user info (or at least token)
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Basic token validation - check if it looks like a Firebase token
    // Firebase ID tokens are JWT format (three parts separated by dots)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      // Invalid token format, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      // Clear invalid cookies
      response.cookies.delete('auth-token')
      response.cookies.delete('user-info')
      return response
    }
  }

  // If user is logged in and tries to access login, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}

