'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { SESSION_DURATION_SECONDS, ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY } from '@/lib/session'
import {
  loginSchema,
  forgotPasswordSchema,
  type LoginFormValues,
  type ForgotPasswordFormValues,
} from '@/lib/validation/auth'
import { X, Mail, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState('')
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [lastResetEmail, setLastResetEmail] = useState('')

  const loginForm = useForm<LoginFormValues>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: standardSchemaResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onLoginSubmit = async (values: LoginFormValues) => {
    setError('')
    setLoading(true)

    if (!auth) {
      setError('Firebase is not configured. Please check your environment variables.')
      setLoading(false)
      return
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password)
      const token = await userCredential.user.getIdToken()
      const user = userCredential.user

      let assignedRole: 'superAdmin' | 'admin' = 'admin'
      const finalToken = token

      try {
        const roleResponse = await fetch('/api/auth/assign-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (roleResponse.ok) {
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
      }

      document.cookie = `auth-token=${finalToken}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`

      const userInfo = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email || 'Admin',
        emailVerified: user.emailVerified,
        role: assignedRole,
      }
      document.cookie = `user-info=${JSON.stringify(userInfo)}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`

      document.cookie = `session-start=${Date.now()}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`

      const redirectTo = searchParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      const firebaseError = err as { code?: string }

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

  const onForgotSubmit = async (values: ForgotPasswordFormValues) => {
    setForgotPasswordError('')
    setForgotPasswordSuccess(false)
    setForgotPasswordLoading(true)

    if (!auth) {
      setForgotPasswordError('Firebase is not configured. Please check your environment variables.')
      setForgotPasswordLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(auth, values.email.trim())
      setLastResetEmail(values.email.trim())
      setForgotPasswordSuccess(true)
      setTimeout(() => {
        setShowForgotPassword(false)
        forgotForm.reset({ email: '' })
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>

      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          window.location.href = '/'
        }}
        className="absolute top-4 right-4 z-20 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="Go back"
      >
        <X className="w-6 h-6 text-gray-600" />
      </Button>

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

            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          disabled={loading}
                          className="border-2 border-gray-200 rounded-lg py-3 h-auto"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          disabled={loading}
                          className="border-2 border-gray-200 rounded-lg py-3 h-auto"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => {
                      forgotForm.reset({
                        email: loginForm.getValues('email')?.trim() || '',
                      })
                      setShowForgotPassword(true)
                    }}
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
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showForgotPassword}
        onOpenChange={(open) => {
          if (forgotPasswordLoading) return
          setShowForgotPassword(open)
          if (!open) {
            forgotForm.reset({ email: '' })
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-gray-600 text-sm">
                We&apos;ve sent a password reset link to <strong>{lastResetEmail}</strong>
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>
          ) : (
            <Form {...forgotForm}>
              <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                {forgotPasswordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{forgotPasswordError}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          disabled={forgotPasswordLoading}
                          className="border-2 border-gray-200 rounded-lg py-3 h-auto"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false)
                      forgotForm.reset({ email: '' })
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
            </Form>
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
