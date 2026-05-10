'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { SESSION_DURATION_SECONDS, ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY } from '@/lib/session'
import { X, Mail, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState('')
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!auth) {
      setError('Firebase is not configured. Please check your environment variables.')
      setLoading(false)
      return
    }

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()
      const user = userCredential.user

      // Assign role via server-side API (sets custom claims)
      let assignedRole: 'superAdmin' | 'admin' = 'admin'
      const finalToken = token

      try {
        console.log('Calling role assignment API...')
        const roleResponse = await fetch('/api/auth/assign-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (!roleResponse.ok) {
          // Role assignment failed, but continue with login
          // The role will be assigned on next token refresh
        } else {
          const roleData = await roleResponse.json()
          assignedRole = roleData.role || 'admin'
          try {
            sessionStorage.setItem(ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY, String(Date.now()))
          } catch {
            /* ignore */
          }
        }
      } catch (roleError) {
        console.error('Error assigning role:', roleError)
        // Continue with login even if role assignment fails
        // The role will be assigned on next token refresh
      }

      // Set the final token in cookie (30-minute session)
      document.cookie = `auth-token=${finalToken}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`

      // Store user info in cookie (for fallback when Admin SDK is not available)
      // Include role for client-side access
      const userInfo = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email || 'Admin',
        emailVerified: user.emailVerified,
        role: assignedRole,
      }
      document.cookie = `user-info=${JSON.stringify(userInfo)}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`

      // Session start for 30-minute auto logout timer
      document.cookie = `session-start=${Date.now()}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`

      // Redirect to dashboard or the redirect URL
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      
      // Type guard for Firebase Auth errors
      const firebaseError = err as { code?: string }
      
      // User-friendly error messages
      if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (firebaseError.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else if (firebaseError.code === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else {
        setError('Failed to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setForgotPasswordError('')
    setForgotPasswordSuccess(false)
    setForgotPasswordLoading(true)

    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your email address')
      setForgotPasswordLoading(false)
      return
    }

    if (!auth) {
      setForgotPasswordError('Firebase is not configured. Please check your environment variables.')
      setForgotPasswordLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail.trim())
      setForgotPasswordSuccess(true)
      setTimeout(() => {
        setShowForgotPassword(false)
        setForgotPasswordEmail('')
        setForgotPasswordSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Password reset error:', err)
      const firebaseError = err as { code?: string }
      
      if (firebaseError.code === 'auth/user-not-found') {
        setForgotPasswordError('No account found with this email address')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setForgotPasswordError('Invalid email address')
      } else {
        setForgotPasswordError('Failed to send reset email. Please try again.')
      }
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
      
      {/* Simple subtle pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      </div>

      {/* Close Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          window.location.href = '/';
        }}
        className="absolute top-4 right-4 z-20 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="Go back"
      >
        <X className="w-6 h-6 text-gray-600" />
      </Button>

      {/* Content */}
      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-white/20">
          <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600">Sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <div className="text-right">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium h-auto p-0"
                disabled={loading}
              >
                Forgot Password?
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full py-6 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Dialog
        open={showForgotPassword}
        onOpenChange={(open) => {
          if (forgotPasswordLoading) return
          setShowForgotPassword(open)
          if (!open) {
            setForgotPasswordEmail('')
            setForgotPasswordError('')
            setForgotPasswordSuccess(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-white/20">
          <DialogTitle className="text-2xl font-bold text-gray-900">Reset Password</DialogTitle>
          <DialogDescription className="sr-only">
            Reset your account password by entering your email address to receive a reset link.
          </DialogDescription>

          {forgotPasswordSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-gray-600 text-sm">
                We&apos;ve sent a password reset link to <strong>{forgotPasswordEmail}</strong>
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-gray-600 text-sm">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {forgotPasswordError && (
                <Alert variant="destructive">
                  <AlertDescription>{forgotPasswordError}</AlertDescription>
                </Alert>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  placeholder="Enter your email"
                  disabled={forgotPasswordLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail('')
                    setForgotPasswordError('')
                  }}
                  disabled={forgotPasswordLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg"
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
          <div className="max-w-md w-full relative z-10">
            <Card className="shadow-2xl">
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

