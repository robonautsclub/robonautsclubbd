'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import {
  requireAuth,
  canCreateArea,
  canEditResource,
  canDeleteResource,
} from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { sanitizeEventForDatabase } from '@/lib/textSanitizer'
import { createNotification } from '@/lib/notifications'
import { normalizeCustomFormFields } from '@/lib/eventCustomForm'
import { normalizeDefaultRegistrationFields } from '@/lib/registrationFields'
import {
  type DashboardEventSummary,
  DASHBOARD_EVENTS_SUMMARY_TAG,
  DASHBOARD_EVENTS_LIST_TAG,
  PUBLIC_EVENTS_TAG,
  DASHBOARD_EVENT_DETAIL_TAG_PREFIX,
  getEventDetailTag,
  getEventBookingsTag,
  normalizeEventCategories,
  getCachedDashboardEventsSummary,
  getCachedEventsList,
  fetchDashboardEventByIdFromDb,
} from './cache'

/**
 * Get all events from Firestore
 */
export async function getEvents(): Promise<Event[]> {
  await requireAuth() // Ensure user is authenticated
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch events. Set FIREBASE_ADMIN_* in .env')
    return []
  }
  try {
    return await getCachedEventsList()
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

/**
 * Get dashboard event summary data from Firestore
 * Reads only fields needed by dashboard home stats and recent events
 */
export async function getDashboardEventsSummary(): Promise<DashboardEventSummary[]> {
  await requireAuth() // Ensure user is authenticated

  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch dashboard events summary.')
    return []
  }
  try {
    return await getCachedDashboardEventsSummary()
  } catch (error) {
    console.error('Error fetching dashboard events summary:', error)
    return []
  }
}

export async function getEvent(id: string): Promise<Event | null> {
  await requireAuth()

  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch event.')
    return null
  }

  try {
    return await unstable_cache(
      async (): Promise<Event | null> => fetchDashboardEventByIdFromDb(id),
      [DASHBOARD_EVENT_DETAIL_TAG_PREFIX, id],
      {
        tags: [getEventDetailTag(id)],
      }
    )()
  } catch (error) {
    console.error('Error fetching event:', error)
    throw new Error('Failed to fetch event')
  }
}

/**
 * Create a new event
 * Checks for duplicate event names before creating
 */
export async function createEvent(formData: {
  title: string
  date: string | string[] // Accept both string and array
  description: string
  time?: string
  location?: string
  venue?: string
  fullDescription?: string
  eligibility?: string
  agenda?: string
  image?: string
  tags?: string[]
  isPaid?: boolean
  amount?: number
  paymentBkashNumber?: string
  categories?: Array<{ name: string; amount?: number }>
  registrationClosingDate?: string
  contactPersonName?: string
  contactPersonDesignation?: string
  contactPersonMobileOrEmail?: string
  customFormFields?: Event['customFormFields']
  defaultRegistrationFields?: Event['defaultRegistrationFields']
  certificateTemplateId?: string | null
}): Promise<{ success: boolean; error?: string; eventId?: string }> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'events')) {
    return { success: false, error: 'You do not have permission to create events.' }
  }

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot create event.')
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Apply default time before sanitization for consistency
    const defaultTime = '9:00 AM - 5:00 PM'
    
    // Sanitize all event text fields before processing
    const sanitized = sanitizeEventForDatabase({
      title: formData.title,
      description: formData.description,
      fullDescription: formData.fullDescription,
      venue: formData.venue,
      location: formData.location,
      eligibility: formData.eligibility,
      time: formData.time || defaultTime,
      agenda: formData.agenda,
      tags: formData.tags,
    })

    // Check if event with same sanitized title already exists
    const existingEvents = await adminDb
      .collection('events')
      .where('title', '==', sanitized.title)
      .get()

    if (!existingEvents.empty) {
      return {
        success: false,
        error: 'An event with this name already exists',
      }
    }

    // Create event in Firestore
    const now = new Date()
    // Normalize date: convert array to comma-separated string, or use string as-is
    const normalizedDate = Array.isArray(formData.date) 
      ? formData.date.length === 1 
        ? formData.date[0] 
        : formData.date.join(',')
      : formData.date
    
    // Use sanitized values for all text fields
    const isPaid = formData.isPaid ?? false
    const categories = normalizeEventCategories(formData.categories, isPaid)
    const customFormFields = normalizeCustomFormFields(formData.customFormFields)
    const defaultRegistrationFields = normalizeDefaultRegistrationFields(formData.defaultRegistrationFields, {
      hasCategories: categories.length > 0,
    })
    const eventRef = await adminDb.collection('events').add({
      title: sanitized.title,
      date: normalizedDate,
      description: sanitized.description,
      time: sanitized.time || defaultTime,
      location: sanitized.location,
      venue: sanitized.venue || sanitized.location,
      fullDescription: sanitized.fullDescription || sanitized.description,
      eligibility: sanitized.eligibility,
      agenda: sanitized.agenda,
      image: formData.image || '/robotics-event.jpg',
      tags: sanitized.tags,
      isPaid,
      ...(isPaid && { amount: formData.amount ?? 0 }),
      ...(categories.length > 0 && { categories }),
      ...(isPaid && formData.paymentBkashNumber?.trim() && { paymentBkashNumber: formData.paymentBkashNumber.trim() }),
      ...(formData.registrationClosingDate?.trim() && { registrationClosingDate: formData.registrationClosingDate.trim() }),
      contactPersonName: formData.contactPersonName?.trim() ?? '',
      contactPersonDesignation: formData.contactPersonDesignation?.trim() ?? '',
      contactPersonMobileOrEmail: formData.contactPersonMobileOrEmail?.trim() ?? '',
      customFormFields,
      defaultRegistrationFields,
      certificateTemplateId: formData.certificateTemplateId?.trim() || null,
      createdAt: now,
      updatedAt: now,
      createdBy: session.uid,
      createdByName: session.name,
      createdByEmail: session.email,
    })

    // Revalidate ISR pages to show new event immediately
    revalidatePath('/events')
    revalidatePath(`/events/${eventRef.id}`)
    revalidateTag(DASHBOARD_EVENTS_LIST_TAG, 'max')
    revalidateTag(DASHBOARD_EVENTS_SUMMARY_TAG, 'max')
    revalidateTag(PUBLIC_EVENTS_TAG, 'max')

    // Create notification for event creation
    await createNotification(
      'event_created',
      `${session.name} created a new event: "${sanitized.title}"`,
      session,
      ['event created']
    )

    return {
      success: true,
      eventId: eventRef.id,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create event. Please try again.',
    }
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  formData: {
    title: string
    date: string | string[] // Accept both string and array
    description: string
    time?: string
    location?: string
    venue?: string
    fullDescription?: string
    eligibility?: string
    agenda?: string
    image?: string
    tags?: string[]
    isPaid?: boolean
    amount?: number
    paymentBkashNumber?: string
    categories?: Array<{ name: string; amount?: number }>
    registrationClosingDate?: string
    registrationDisabled?: boolean
    contactPersonName?: string
    contactPersonDesignation?: string
    contactPersonMobileOrEmail?: string
    customFormFields?: Event['customFormFields']
    defaultRegistrationFields?: Event['defaultRegistrationFields']
    certificateTemplateId?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot update event.')
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Check if event exists
    const eventDoc = await adminDb.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return {
        success: false,
        error: 'Event not found',
      }
    }

    const eventData = eventDoc.data()!

    if (!canEditResource(session, 'events', eventData.createdBy as string | undefined)) {
      return {
        success: false,
        error: 'You do not have permission to edit this event.',
      }
    }

    // Apply default time before sanitization for consistency
    const defaultTime = '9:00 AM - 5:00 PM'
    
    // Sanitize all event text fields before processing
    const sanitized = sanitizeEventForDatabase({
      title: formData.title,
      description: formData.description,
      fullDescription: formData.fullDescription,
      venue: formData.venue,
      location: formData.location,
      eligibility: formData.eligibility,
      time: formData.time || defaultTime,
      agenda: formData.agenda,
      tags: formData.tags,
    })

    // Check if another event with the same sanitized title exists (excluding current event)
    const existingEvents = await adminDb
      .collection('events')
      .where('title', '==', sanitized.title)
      .get()

    const hasDuplicate = existingEvents.docs.some((doc) => doc.id !== eventId)
    if (hasDuplicate) {
      return {
        success: false,
        error: 'An event with this name already exists',
      }
    }

    // Update event in Firestore
    // Normalize date: convert array to comma-separated string, or use string as-is
    const normalizedDate = Array.isArray(formData.date) 
      ? formData.date.length === 1 
        ? formData.date[0] 
        : formData.date.join(',')
      : formData.date
    
    // Use sanitized values for all text fields
    const isPaid = formData.isPaid ?? false
    const categories = normalizeEventCategories(formData.categories, isPaid)
    const customFormFields = normalizeCustomFormFields(formData.customFormFields)
    const defaultRegistrationFields = normalizeDefaultRegistrationFields(formData.defaultRegistrationFields, {
      hasCategories: categories.length > 0,
    })
    await adminDb.collection('events').doc(eventId).update({
      title: sanitized.title,
      date: normalizedDate,
      description: sanitized.description,
      time: sanitized.time || defaultTime,
      location: sanitized.location,
      venue: sanitized.venue || sanitized.location,
      fullDescription: sanitized.fullDescription || sanitized.description,
      eligibility: sanitized.eligibility,
      agenda: sanitized.agenda,
      image: formData.image || '/robotics-event.jpg',
      tags: sanitized.tags,
      isPaid,
      amount: isPaid ? (formData.amount ?? 0) : 0,
      categories,
      paymentBkashNumber: isPaid ? (formData.paymentBkashNumber ?? '').toString().trim() : '',
      registrationClosingDate: formData.registrationClosingDate?.trim() ?? '',
      registrationDisabled: formData.registrationDisabled ?? false,
      contactPersonName: formData.contactPersonName?.trim() ?? '',
      contactPersonDesignation: formData.contactPersonDesignation?.trim() ?? '',
      contactPersonMobileOrEmail: formData.contactPersonMobileOrEmail?.trim() ?? '',
      customFormFields,
      defaultRegistrationFields,
      certificateTemplateId: formData.certificateTemplateId?.trim() || null,
      updatedAt: new Date(),
    })

    // Revalidate ISR pages to show updated event immediately
    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)
    revalidateTag(DASHBOARD_EVENTS_LIST_TAG, 'max')
    revalidateTag(DASHBOARD_EVENTS_SUMMARY_TAG, 'max')
    revalidateTag(getEventDetailTag(eventId), 'max')
    revalidateTag(PUBLIC_EVENTS_TAG, 'max')

    // Create notification for event update
    await createNotification(
      'event_updated',
      `${session.name} updated the event: "${sanitized.title}"`,
      session,
      ['event updated']
    )

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error updating event:', error)
    return {
      success: false,
      error: 'Failed to update event. Please try again.',
    }
  }
}

/**
 * Delete an event
 * Only the user who created the event can delete it
 */
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot delete event.')
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Check if event exists
    const eventDoc = await adminDb.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return {
        success: false,
        error: 'Event not found',
      }
    }

    const eventData = eventDoc.data()!

    if (!canDeleteResource(session, 'events', eventData.createdBy as string | undefined)) {
      return {
        success: false,
        error: 'You do not have permission to delete this event.',
      }
    }

    // Delete all bookings associated with this event
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('eventId', '==', eventId)
      .get()

    const batch = adminDb.batch()
    bookingsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete the event
    batch.delete(adminDb.collection('events').doc(eventId))

    // Commit the batch delete
    await batch.commit()

    // Revalidate ISR pages to remove deleted event immediately
    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)
    revalidateTag(DASHBOARD_EVENTS_LIST_TAG, 'max')
    revalidateTag(DASHBOARD_EVENTS_SUMMARY_TAG, 'max')
    revalidateTag(getEventDetailTag(eventId), 'max')
    revalidateTag(getEventBookingsTag(eventId), 'max')
    revalidateTag(PUBLIC_EVENTS_TAG, 'max')

    // Create notification for event deletion
    await createNotification(
      'event_deleted',
      `${session.name} deleted the event: "${eventData.title}"`,
      session,
      ['event deleted']
    )

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    return {
      success: false,
      error: 'Failed to delete event. Please try again.',
    }
  }
}
