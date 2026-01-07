'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelBooking } from '../../actions'
import { Trash2 } from 'lucide-react'
import DeleteConfirmation from '../DeleteConfirmation'
import type { Booking } from '@/types/booking'

interface BookingActionsProps {
  booking: Booking
}

export default function BookingActions({ booking }: BookingActionsProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCancel = async () => {
    setDeleting(true)
    try {
      const result = await cancelBooking(booking.id)
      if (result.success) {
        setShowDeleteConfirm(false)
        router.refresh()
      } else {
        alert(result.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        title="Cancel booking"
      >
        <Trash2 className="w-4 h-4" />
        Cancel
      </button>

      {showDeleteConfirm && (
        <DeleteConfirmation
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          itemName={`${booking.name} - ${booking.email}`}
          onConfirm={handleCancel}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

