'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY } from '@/lib/session'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      // Sign out from Firebase (if available)
      if (auth) {
        await signOut(auth)
      }
      
      // Clear auth token, user info, and session-start cookies
      document.cookie = 'auth-token=; path=/; max-age=0'
      document.cookie = 'user-info=; path=/; max-age=0'
      document.cookie = 'session-start=; path=/; max-age=0'
      try {
        sessionStorage.removeItem(ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY)
      } catch {
        /* ignore */
      }

      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      document.cookie = 'auth-token=; path=/; max-age=0'
      document.cookie = 'user-info=; path=/; max-age=0'
      document.cookie = 'session-start=; path=/; max-age=0'
      try {
        sessionStorage.removeItem(ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      router.push('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut className="w-4 h-4" />
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}

