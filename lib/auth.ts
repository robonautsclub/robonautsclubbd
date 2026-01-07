import { cookies } from 'next/headers'
import { adminAuth } from './firebase-admin'
import { redirect } from 'next/navigation'

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
        
        return {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email || 'Admin',
          emailVerified: user.emailVerified,
        }
      } catch (error) {
        console.error('Error verifying auth token:', error)
        return null
      }
    }

    // Fallback: If Admin SDK is not available, use stored user info
    // This is less secure but allows the app to work without Admin SDK
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
 * Use this in server components and server actions
 */
export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

/**
 * Set auth token in cookie (client-side helper)
 * This should be called after successful login
 */
export function setAuthToken(token: string) {
  document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax` // 24 hours
}

/**
 * Clear auth token cookie (client-side helper)
 * This should be called on logout
 */
export function clearAuthToken() {
  document.cookie = 'auth-token=; path=/; max-age=0'
}

