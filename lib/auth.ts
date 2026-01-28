import { cookies } from 'next/headers'
import { adminAuth } from './firebase-admin'
import { redirect } from 'next/navigation'

/** Session duration: 30 minutes (used for cookie max-age and client timers) */
export const SESSION_DURATION_SECONDS = 30 * 60
export const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000

/**
 * Get the current user session from the auth token cookie (server-side)
 * Returns the decoded token with user info, or null if not authenticated
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const userInfo = cookieStore.get('user-info')?.value

    if (!token) {
      return null
    }

    // If Admin SDK is available, verify the token properly
    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token)
        const user = await adminAuth.getUser(decodedToken.uid)
        
        // Extract role from custom claims (set via /api/auth/assign-role)
        // Custom claims are available in decodedToken after verification
        // Also check user's custom claims as fallback
        let role = (decodedToken.role as 'superAdmin' | 'admin' | undefined)
        
        // If role not in token, check user's custom claims directly
        if (!role) {
          role = (user.customClaims?.role as 'superAdmin' | 'admin' | undefined)
        }
        
        // Default to admin if still no role found
        role = role || 'admin'
        
        return {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email || 'Admin',
          emailVerified: user.emailVerified,
          role,
        }
      } catch (error: unknown) {
        const errorObj = error as { code?: string; message?: string }
        const errorCode = errorObj.code
        
        // Handle expected token expiration/invalidation errors silently
        // These are normal part of the auth flow and don't need to be logged as errors
        if (errorCode === 'auth/id-token-expired' || 
            errorCode === 'auth/argument-error' ||
            errorCode === 'auth/invalid-id-token') {
          // Token is expired or invalid - return null to trigger redirect
          // This is expected behavior and will be handled by redirecting to login
          return null
        }
        
        // Log unexpected errors (network issues, server errors, etc.)
        console.error('Unexpected error verifying auth token:', error)
        
        return null
      }
    }

    // Fallback: If Admin SDK is not available, use stored user info
    // This is less secure but allows the app to work without Admin SDK
    // Note: Role will default to 'admin' in fallback mode
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo)
        // Basic validation - ensure it has required fields
        if (parsed.uid && parsed.email) {
          return {
            uid: parsed.uid,
            email: parsed.email,
            name: parsed.name || parsed.email || 'Admin',
            emailVerified: parsed.emailVerified || false,
            role: (parsed.role === 'superAdmin' || parsed.role === 'admin' ? parsed.role : 'admin') as 'superAdmin' | 'admin', // Default to admin if role not in cookie
          }
        }
      } catch (error) {
        console.error('Error parsing user info:', error)
      }
    }

    // If no user info and no Admin SDK, return null (not authenticated)
    console.warn('Firebase Admin SDK not available and no user info found. Session verification failed.')
    return null
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Also redirects if token is expired or invalid
 * Use this in server components and server actions
 */
export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session) {
    // Redirect to login - cookie clearing should be handled in logout route handler
    // Cookies cannot be modified from page components or server functions,
    // only from Server Actions or Route Handlers
    redirect('/login')
  }
  
  return session
}

/**
 * Set auth token in cookie (client-side helper)
 * This should be called after successful login
 */
export function setAuthToken(token: string) {
  document.cookie = `auth-token=${token}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`
}

/**
 * Clear auth token cookie (client-side helper)
 * This should be called on logout
 */
export function clearAuthToken() {
  document.cookie = 'auth-token=; path=/; max-age=0'
}

/**
 * Session type with role information
 */
export type Session = {
  uid: string
  email: string
  name: string
  emailVerified: boolean
  role: 'superAdmin' | 'admin'
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.role === 'superAdmin'
}

/**
 * Check if user is Admin (includes Super Admin)
 */
export function isAdmin(session: Session | null): boolean {
  return session?.role === 'admin' || session?.role === 'superAdmin'
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): 'superAdmin' | 'admin' | null {
  return session?.role || null
}

/**
 * Require Super Admin - redirects to dashboard if not Super Admin
 * Use this in server components and server actions that require Super Admin access
 */
export async function requireSuperAdmin() {
  const session = await requireAuth()
  
  if (session.role !== 'superAdmin') {
    // Redirect to dashboard if not Super Admin
    redirect('/dashboard')
  }
  
  return session
}

