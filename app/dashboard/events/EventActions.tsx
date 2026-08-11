'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent, updateEvent } from '../actions'
import { Edit, Trash2, ExternalLink, Lock, LockOpen } from 'lucide-react'
import Link from 'next/link'
import EditEventForm from './EditEventForm'
import DeleteConfirmation from './DeleteConfirmation'
import type { Event } from '@/types/event'
import { hasEventPassed, isRegistrationClosedByDate } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import type {
  DashboardPermission,
  DashboardRole,
} from '@/lib/dashboard-permissions'
import { canDeleteResource, canEditResource } from '@/lib/dashboard-permissions'

interface EventActionsProps {
  event: Event
  currentUserId?: string
  userRole?: DashboardRole
  permissions?: DashboardPermission[]
}

export default function EventActions({
  event,
  currentUserId,
  userRole,
  permissions = [],
}: EventActionsProps) {
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingRegistration, setTogglingRegistration] = useState(false)

  const session = {
    role: userRole || 'admin',
    permissions,
    uid: currentUserId,
  }
  const canEdit = canEditResource(session, 'events', event.createdBy)
  const canDelete = canDeleteResource(session, 'events', event.createdBy)

  const showRegistrationToggle =
    canEdit &&
    !hasEventPassed(event.date) &&
    !isRegistrationClosedByDate(event.registrationClosingDate)

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

  const handleToggleRegistration = async () => {
    setTogglingRegistration(true)
    try {
      const dateValue = Array.isArray(event.date)
        ? event.date.length === 1
          ? event.date[0]
          : event.date.join(',')
        : event.date
      const result = await updateEvent(event.id, {
        title: event.title,
        date: dateValue,
        description: event.description,
        time: event.time ?? '9:00 AM - 5:00 PM',
        location: event.location ?? '',
        venue: event.venue ?? event.location ?? '',
        fullDescription: event.fullDescription ?? event.description ?? '',
        eligibility: event.eligibility ?? '',
        agenda: event.agenda ?? '',
        image: event.image ?? '/robotics-event.jpg',
        tags: event.tags ?? [],
        isPaid: event.isPaid ?? false,
        amount: event.amount ?? 0,
        paymentBkashNumber: event.paymentBkashNumber ?? '',
        registrationClosingDate: event.registrationClosingDate ?? '',
        registrationDisabled: !event.registrationDisabled,
      })
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to update registration status')
      }
    } catch (error) {
      console.error('Error toggling registration:', error)
      alert('An unexpected error occurred')
    } finally {
      setTogglingRegistration(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <>
            {showRegistrationToggle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToggleRegistration}
                disabled={togglingRegistration}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                title={
                  event.registrationDisabled
                    ? 'Enable registration'
                    : 'Disable registration'
                }
              >
                {event.registrationDisabled ? (
                  <LockOpen className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {event.registrationDisabled ? 'Enable reg.' : 'Disable reg.'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEditForm(true)}
              className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50"
              title="Edit event"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete event"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        )}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          title="View details"
        >
          <Link href={`/dashboard/events/${event.id}`} prefetch={false}>
            View
            <ExternalLink className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {showEditForm && canEdit && (
        <EditEventForm event={event} onClose={() => setShowEditForm(false)} />
      )}
      {showDeleteConfirm && canDelete && (
        <DeleteConfirmation
          title="Delete Event"
          message={`Are you sure you want to delete "${event.title}"? This will also delete all registrations.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
