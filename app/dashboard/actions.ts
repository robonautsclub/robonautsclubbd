'use server'

import { requireAuth } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { Booking } from '@/types/booking'

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
    const eventsSnapshot = await adminDb.collection('events').orderBy('createdAt', 'desc').get()
    
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
  date: string
  description: string
  time?: string
  location?: string
  venue?: string
  fullDescription?: string
  eligibility?: string
  agenda?: string
  image?: string
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
    // Check if event with same title already exists
    const existingEvents = await adminDb
      .collection('events')
      .where('title', '==', formData.title)
      .get()

    if (!existingEvents.empty) {
      return {
        success: false,
        error: 'An event with this name already exists',
      }
    }

    // Create event in Firestore
    const now = new Date()
    const eventRef = await adminDb.collection('events').add({
      title: formData.title,
      date: formData.date,
      description: formData.description,
      time: formData.time || '',
      location: formData.location || '',
      venue: formData.venue || formData.location || '',
      fullDescription: formData.fullDescription || formData.description,
      eligibility: formData.eligibility || '',
      agenda: formData.agenda || '',
      image: formData.image || '/robotics-event.jpg',
      createdAt: now,
      updatedAt: now,
      createdBy: session.uid,
    })

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
    date: string
    description: string
    time?: string
    location?: string
    venue?: string
    fullDescription?: string
    eligibility?: string
    agenda?: string
    image?: string
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

    // Check if another event with the same title exists (excluding current event)
    const existingEvents = await adminDb
      .collection('events')
      .where('title', '==', formData.title)
      .get()

    const hasDuplicate = existingEvents.docs.some((doc) => doc.id !== eventId)
    if (hasDuplicate) {
      return {
        success: false,
        error: 'An event with this name already exists',
      }
    }

    // Update event in Firestore
    await adminDb.collection('events').doc(eventId).update({
      title: formData.title,
      date: formData.date,
      description: formData.description,
      time: formData.time || '',
      location: formData.location || '',
      venue: formData.venue || formData.location || '',
      fullDescription: formData.fullDescription || formData.description,
      eligibility: formData.eligibility || '',
      agenda: formData.agenda || '',
      image: formData.image || '/robotics-event.jpg',
      updatedAt: new Date(),
    })

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
 */
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

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
    // Check if booking exists
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    // Delete the booking
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

