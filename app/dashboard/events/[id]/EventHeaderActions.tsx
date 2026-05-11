'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '../../actions'
import { Edit, Trash2 } from 'lucide-react'
import EditEventForm from '../EditEventForm'
import DeleteConfirmation from '../DeleteConfirmation'
import type { Event } from '@/types/event'
import { Button } from '@/components/ui/button'

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
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowEditForm(true)}
          className="text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-600"
        >
          <Edit className="w-4 h-4" />
          Edit Event
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 bg-red-50 border-red-200 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Delete Event
          </Button>
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

