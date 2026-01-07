'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { X, Mail, Sparkles } from 'lucide-react'

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

  // Generate floating shapes
  const [shapes, setShapes] = useState<Array<{ id: number; size: number; left: number; top: number; delay: number; duration: number }>>([])

  useEffect(() => {
    const newShapes = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 200 + 100,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 20,
      duration: Math.random() * 10 + 15,
    }))
    setShapes(newShapes)
  }, [])

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

      // Set token in cookie
      document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`

      // Store user info in cookie (for fallback when Admin SDK is not available)
      const userInfo = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email || 'Admin',
        emailVerified: user.emailVerified,
      }
      document.cookie = `user-info=${JSON.stringify(userInfo)}; path=/; max-age=86400; SameSite=Lax`

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
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 animate-gradient"></div>
      
      {/* Floating Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {shapes.map((shape) => (
          <div
            key={shape.id}
            className="absolute rounded-full opacity-20 blur-xl bg-white"
            style={{
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              left: `${shape.left}%`,
              top: `${shape.top}%`,
              animation: `float ${shape.duration}s ease-in-out infinite`,
              animationDelay: `${shape.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Animated Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 via-transparent to-sky-900/20"></div>

      {/* Content */}
      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
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
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
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
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false)
                  setForgotPasswordEmail('')
                  setForgotPasswordError('')
                  setForgotPasswordSuccess(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={forgotPasswordLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

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
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {forgotPasswordError}
                  </div>
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotPasswordEmail('')
                      setForgotPasswordError('')
                    }}
                    disabled={forgotPasswordLoading}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 animate-gradient"></div>
          <div className="max-w-md w-full relative z-10">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-4 shadow-lg animate-pulse">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Admin Login
                </h1>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

