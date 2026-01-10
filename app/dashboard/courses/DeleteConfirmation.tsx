'use client'

import { useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface DeleteConfirmationProps {
  title: string
  message: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  itemName?: string
}

export default function DeleteConfirmation({
  title,
  message,
  onConfirm,
  onCancel,
  itemName,
}: DeleteConfirmationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      await onConfirm()
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Delete error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-red-500 to-red-600 px-6 py-5 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-2">{message}</p>
            {itemName && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
                <p className="text-sm font-semibold text-gray-900">{itemName}</p>
              </div>
            )}
            <p className="text-sm text-red-600 font-semibold mt-4">
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

