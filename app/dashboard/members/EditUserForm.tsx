'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Mail, User, Lock, Save, Loader2 } from 'lucide-react'

type User = {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
  role: 'superAdmin' | 'admin'
  disabled: boolean
}

interface EditUserFormProps {
  user: User
  onClose: () => void
}

export default function EditUserForm({ user, onClose }: EditUserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    password: '',
    disabled: user.disabled,
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate password if provided
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const updateData: {
        displayName?: string
        password?: string
        disabled?: boolean
      } = {}

      if (formData.displayName !== user.displayName) {
        updateData.displayName = formData.displayName.trim()
      }
      if (formData.password) {
        updateData.password = formData.password
      }
      if (formData.disabled !== user.disabled) {
        updateData.disabled = formData.disabled
      }

      // Only make request if there are changes
      if (Object.keys(updateData).length === 0) {
        onClose()
        return
      }

      const response = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Edit User</h3>
              <p className="text-xs sm:text-sm text-indigo-100">Update user information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail className="w-4 h-4 text-indigo-600" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                placeholder="user@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Email address cannot be changed for security reasons.</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-indigo-600" />
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Display name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lock className="w-4 h-4 text-indigo-600" />
                New Password (leave blank to keep current)
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Only enter a new password if you want to change it</p>
            </div>

            {/* Disabled Status */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.disabled}
                  onChange={(e) => setFormData({ ...formData, disabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={loading}
                />
                <span>Disable user account</span>
              </label>
              <p className="text-xs text-gray-500">Disabled users cannot sign in</p>
            </div>

            {/* Role Info (read-only) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Role:</strong>{' '}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'superAdmin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-2">User roles are managed via environment variables and cannot be changed here.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
