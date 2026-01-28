'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { SESSION_DURATION_MS } from '@/lib/session'

function getSessionStart(): number | null {
  if (typeof window === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('session-start='))
  const value = match?.split('=')[1]
  if (!value) return null
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function clearSessionCookies() {
  document.cookie = 'auth-token=; path=/; max-age=0'
  document.cookie = 'user-info=; path=/; max-age=0'
  document.cookie = 'session-start=; path=/; max-age=0'
}

function getRemainingSessionSeconds(): number {
  const sessionStart = getSessionStart()
  if (sessionStart == null) return 0
  const remainingMs = sessionStart + SESSION_DURATION_MS - Date.now()
  return Math.max(0, Math.floor(remainingMs / 1000))
}

/**
 * Client-side component that checks for token expiration
 * and redirects to login if the token has expired
 */
export default function TokenExpirationChecker() {
  const router = useRouter()

  useEffect(() => {
    // Only run on client side and if auth is available
    if (!auth) {
      return
    }

    // Check auth state changes (handles token expiration)
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          clearSessionCookies()
          router.push('/login')
          return
        }

        // Check if token is still valid by trying to get a fresh token
        try {
          const token = await user.getIdToken(true) // Force refresh if needed
          
          if (!token) {
            clearSessionCookies()
            router.push('/login')
            return
          }

          const remainingSeconds = getRemainingSessionSeconds()
          if (remainingSeconds <= 0) {
            clearSessionCookies()
            router.push('/login')
            return
          }

          // Assign/refresh role via server-side API (ensures custom claims are up-to-date)
          try {
            const roleResponse = await fetch('/api/auth/assign-role', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            })

            if (roleResponse.ok) {
              const freshToken = await user.getIdToken(true)
              document.cookie = `auth-token=${freshToken}; path=/; max-age=${remainingSeconds}; SameSite=Lax`
            } else {
              document.cookie = `auth-token=${token}; path=/; max-age=${remainingSeconds}; SameSite=Lax`
            }
          } catch (roleError) {
            console.error('Error assigning role during token refresh:', roleError)
            document.cookie = `auth-token=${token}; path=/; max-age=${remainingSeconds}; SameSite=Lax`
          }
        } catch (error: unknown) {
          console.error('Token refresh error:', error)
          clearSessionCookies()
          router.push('/login')
        }
      },
      (error) => {
        console.error('Auth state change error:', error)
        clearSessionCookies()
        router.push('/login')
      }
    )

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [router])

  // This component doesn't render anything
  return null
}
