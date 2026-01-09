'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { Booking } from '@/types/booking'
import { sanitizeEventForDatabase } from '@/lib/textSanitizer'

/**
 * Get all events from Firestore
 */
export async function getEvents(): Promise<Event[]> {
  await requireAuth() // Ensure user is authenticated

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot fetch events.')
    throw new Error('Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.')
  }

  try {
    // Query without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    const eventsSnapshot = await adminDb.collection('events').get()
    
    const events: Event[] = []
    eventsSnapshot.forEach((doc) => {
      const data = doc.data()
      events.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Event)
    })

    // Sort by createdAt in descending order (newest first)
    events.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA // Descending order
    })

    return events
  } catch (error) {
    console.error('Error fetching events:', error)
    throw new Error('Failed to fetch events')
  }
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string): Promise<Event | null> {
  await requireAuth()

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot fetch event.')
    throw new Error('Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.')
  }

  try {
    const eventDoc = await adminDb.collection('events').doc(id).get()
    
    if (!eventDoc.exists) {
      return null
    }

    const data = eventDoc.data()!
    return {
      id: eventDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as Event
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
}): Promise<{ success: boolean; error?: string; eventId?: string }> {
  const session = await requireAuth()

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
      createdAt: now,
      updatedAt: now,
      createdBy: session.uid,
      createdByName: session.name,
      createdByEmail: session.email,
    })

    // Revalidate ISR pages to show new event immediately
    revalidatePath('/events')
    revalidatePath(`/events/${eventRef.id}`)

    return {
      success: true,
      eventId: eventRef.id,
    }
  } catch (error) {
    console.error('Error creating event:', error)
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
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

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
      updatedAt: new Date(),
    })

    // Revalidate ISR pages to show updated event immediately
    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)

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
    
    // Check if the current user is the creator of the event
    if (eventData.createdBy !== session.uid) {
      return {
        success: false,
        error: 'You can only delete events that you created.',
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

/**
 * Get bookings for a specific event
 */
export async function getBookings(eventId: string): Promise<Booking[]> {
  await requireAuth()

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot fetch bookings.')
    throw new Error('Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.')
  }

  try {
    // Query without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('eventId', '==', eventId)
      .get()

    const bookings: Booking[] = []
    bookingsSnapshot.forEach((doc) => {
      const data = doc.data()
      // Convert Firestore Timestamp to ISO string for consistent serialization
      const createdAt = data.createdAt?.toDate 
        ? data.createdAt.toDate().toISOString()
        : data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt
      
      bookings.push({
        id: doc.id,
        ...data,
        createdAt,
      } as Booking)
    })

    // Sort by createdAt in descending order (newest first)
    bookings.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA // Descending order
    })

    return bookings
  } catch (error) {
    console.error('Error fetching bookings:', error)
    throw new Error('Failed to fetch bookings')
  }
}

/**
 * Cancel/Delete a booking
 */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot cancel booking.')
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Check if booking exists and fetch booking details
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    const bookingData = bookingDoc.data()!
    const booking = {
      id: bookingDoc.id,
      ...bookingData,
    } as Booking

    // Fetch event details
    const eventDoc = await adminDb.collection('events').doc(booking.eventId).get()
    if (!eventDoc.exists) {
      // Event not found, still proceed with deletion but skip email
      await adminDb.collection('bookings').doc(bookingId).delete()
      return {
        success: true,
      }
    }

    const eventData = eventDoc.data()!
    const event = {
      id: eventDoc.id,
      ...eventData,
    } as Event

    // Send cancellation email before deleting the booking
    if (booking.email && booking.registrationId) {
      try {
        const { sendBookingCancellationEmail } = await import('@/lib/email')
        const emailResult = await sendBookingCancellationEmail({
          to: booking.email,
          name: booking.name,
          event,
          registrationId: booking.registrationId,
        })

        // Log if email failed, but continue with deletion
        if (!emailResult.success) {
          console.error('Failed to send cancellation email:', emailResult.error)
          // Continue with deletion even if email fails
        }
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError)
        // Continue with deletion even if email fails
      }
    }

    // Delete the booking after sending email
    await adminDb.collection('bookings').doc(bookingId).delete()

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error canceling booking:', error)
    return {
      success: false,
      error: 'Failed to cancel booking. Please try again.',
    }
  }
}

