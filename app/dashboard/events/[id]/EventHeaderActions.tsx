'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '../../actions'
import { Edit, Trash2 } from 'lucide-react'
import EditEventForm from '../EditEventForm'
import DeleteConfirmation from '../DeleteConfirmation'
import type { Event } from '@/types/event'
import { Button } from '@/components/ui/button'
import type {
  DashboardPermission,
  DashboardRole,
} from '@/lib/dashboard-permissions'
import { canDeleteResource, canEditResource } from '@/lib/dashboard-permissions'

interface EventHeaderActionsProps {
  event: Event
  currentUserId?: string
  userRole?: DashboardRole
  permissions?: DashboardPermission[]
}

export default function EventHeaderActions({
  event,
  currentUserId,
  userRole,
  permissions = [],
}: EventHeaderActionsProps) {
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const session = {
    role: userRole || 'admin',
    permissions,
    uid: currentUserId,
  }
  const canEdit = canEditResource(session, 'events', event.createdBy)
  const canDelete = canDeleteResource(session, 'events', event.createdBy)

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

  if (!canEdit && !canDelete) return null

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEditForm(true)}
            className="text-cyan-700 bg-cyan-50 border-cyan-200 hover:bg-cyan-100 hover:text-cyan-700"
          >
            <Edit className="w-4 h-4" />
            Edit Event
          </Button>
        )}
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

      {showEditForm && canEdit && (
        <EditEventForm event={event} onClose={() => setShowEditForm(false)} />
      )}

      {showDeleteConfirm && canDelete && (
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
