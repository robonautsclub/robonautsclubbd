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

interface EventActionsProps {
  event: Event
  currentUserId?: string
  userRole?: 'superAdmin' | 'admin'
}

export default function EventActions({ event, currentUserId, userRole }: EventActionsProps) {
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingRegistration, setTogglingRegistration] = useState(false)

  // Show edit/delete buttons if:
  // - User is Super Admin (can edit/delete any event), OR
  // - User is Admin AND is the creator of the event
  const isSuperAdmin = userRole === 'superAdmin'
  const isOwner = currentUserId && event.createdBy === currentUserId
  const canEdit = isSuperAdmin || isOwner
  const canDelete = isSuperAdmin || isOwner

  // Show disable/enable registration button only when event is not past and registration closing date has not passed
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
      const dateValue = Array.isArray(event.date) ? (event.date.length === 1 ? event.date[0] : event.date.join(',')) : event.date
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
              <button
                onClick={handleToggleRegistration}
                disabled={togglingRegistration}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                title={event.registrationDisabled ? 'Enable registration' : 'Disable registration'}
              >
                {event.registrationDisabled ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {event.registrationDisabled ? 'Enable reg.' : 'Disable reg.'}
              </button>
            )}
            <button
              onClick={() => setShowEditForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit event"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </>
        )}
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
          prefetch={false}
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

