'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { SESSION_DURATION_MS } from '@/lib/auth'

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
 * Proactive 30-minute session timer. Clears cookies, signs out, and redirects to login when the session expires.
 */
export default function SessionTimer() {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sessionStart = getSessionStart()
    const now = Date.now()
    const elapsed = sessionStart != null ? now - sessionStart : 0
    const remainingMs = Math.max(0, SESSION_DURATION_MS - elapsed)

    const handleExpiry = () => {
      clearSessionCookies()
      if (auth) {
        signOut(auth).catch(() => {})
      }
      router.push('/login')
      router.refresh()
    }

    timeoutRef.current = setTimeout(handleExpiry, remainingMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [router])

  return null
}
