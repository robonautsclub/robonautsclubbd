'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY } from '@/lib/session'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const clearAuthCookies = () => {
  document.cookie = 'auth-token=; path=/; max-age=0'
  document.cookie = 'user-info=; path=/; max-age=0'
  document.cookie = 'session-start=; path=/; max-age=0'
  try {
    sessionStorage.removeItem(ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      if (auth) {
        await signOut(auth)
      }
      clearAuthCookies()
      toast.success('Signed out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout error — redirecting to login anyway')
      clearAuthCookies()
      router.push('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          {loading ? 'Logging out...' : 'Logout'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to sign in again to access the dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} disabled={loading}>
            {loading ? 'Signing out...' : 'Sign out'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
