'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

/**
 * Client-side session expiry check (JWT cookie + 30-minute wall clock).
 * No Firebase Auth on the Cloudflare Worker.
 */
export default function TokenExpirationChecker() {
  const router = useRouter()

  useEffect(() => {
    const check = () => {
      const sessionStart = getSessionStart()
      if (sessionStart == null) return
      if (Date.now() - sessionStart > SESSION_DURATION_MS) {
        clearSessionCookies()
        void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        router.push('/login')
        router.refresh()
      }
    }

    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [router])

  return null
}
