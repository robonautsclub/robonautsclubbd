'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '../actions'
import { Edit, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import EditEventForm from './EditEventForm'
import DeleteConfirmation from './DeleteConfirmation'
import type { Event } from '@/types/event'

interface EventActionsProps {
  event: Event
  currentUserId?: string
}

export default function EventActions({ event, currentUserId }: EventActionsProps) {
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
        router.refresh()
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Edit event"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete event"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          title="View details"
        >
          View
          <ExternalLink className="w-4 h-4" />
        </Link>
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

