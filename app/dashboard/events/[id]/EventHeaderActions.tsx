'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '../../actions'
import { Edit, Trash2 } from 'lucide-react'
import EditEventForm from '../EditEventForm'
import DeleteConfirmation from '../DeleteConfirmation'
import type { Event } from '@/types/event'

interface EventHeaderActionsProps {
  event: Event
  currentUserId?: string
}

export default function EventHeaderActions({ event, currentUserId }: EventHeaderActionsProps) {
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Only show delete button if current user is the creator
  const canDelete = currentUserId && event.createdBy === currentUserId

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteEvent(event.id)
      if (result.success) {
        setShowDeleteConfirm(false)
        router.push('/dashboard/events')
      } else {
        alert(result.error || 'Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEditForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit Event
        </button>
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Event
          </button>
        )}
      </div>

      {showEditForm && (
        <EditEventForm
          event={event}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmation
          title="Delete Event"
          message="Are you sure you want to delete this event? All associated bookings will also be deleted."
          itemName={event.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

