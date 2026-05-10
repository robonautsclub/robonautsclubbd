'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

  const handleConfirm = async (event: React.MouseEvent) => {
    event.preventDefault()
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
    <AlertDialog open onOpenChange={(open) => { if (!open && !loading) onCancel() }}>
      <AlertDialogContent className="p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-500 to-red-600 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <AlertDialogHeader className="contents">
            <AlertDialogTitle className="text-xl font-bold text-white">{title}</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">{message}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
